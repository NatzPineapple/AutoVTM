/* ============================================================
   VITÆ — Gateway (Módulo 1, lado servidor)
   Serve os arquivos sem cache e ENCAMINHA /api/ para os módulos.
   Desde a §84 ele não executa regra nem modelo: o Árbitro está na
   5176, o Cronista na 5177, e as três camadas de LLM saíram daqui.
   Não há chave, não há conta e não há custo: o modelo roda na
   própria máquina, pelo ollama.

     node modulos/gateway/proxy.mjs
   ============================================================ */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { enderecoDe } from '../../comum/portas.mjs';
import { daPropriaCasa } from '../../comum/origem.mjs';
import { foiEstouroDeTempo } from '../../comum/estouro.mjs';
import { servir as servirEstatico, SEM_CACHE } from '../../comum/servir-estatico.mjs';
import { estado as estadoDosSistemas, ligar as ligarSistemas, desligar as desligarSistemas } from '../../comum/sistemas.mjs';

const PROJETO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORTA = Number(process.env.PORTA || 5173);
const ENDERECO = process.env.VITAE_ESCUTAR || '127.0.0.1';

const pedidoDaPropriaPagina = (req) => daPropriaCasa(req, PORTA);

const JANELA_MS = Number(process.env.VITAE_JANELA_MS || 60000);
const TETO_POR_JANELA = Number(process.env.VITAE_TETO_JANELA || 20);
const TETO_POR_SESSAO = Number(process.env.VITAE_TETO_SESSAO || 0);

const balde = { marcas: [], emVoo: 0, total: 0 };

function permitirChamada() {
  const agora = Date.now();
  balde.marcas = balde.marcas.filter(t => agora - t < JANELA_MS);

  if (balde.emVoo > 0) {
    return { ok: false, codigo: 429, motivo: 'Já existe uma chamada em andamento.',
             esperar: 2 };
  }
  if (balde.marcas.length >= TETO_POR_JANELA) {
    const maisAntiga = balde.marcas[0];
    return { ok: false, codigo: 429,
             motivo: `Teto de ${TETO_POR_JANELA} chamadas por ${Math.round(JANELA_MS / 1000)}s atingido.`,
             esperar: Math.ceil((JANELA_MS - (agora - maisAntiga)) / 1000) };
  }
  if (TETO_POR_SESSAO && balde.total >= TETO_POR_SESSAO) {
    return { ok: false, codigo: 429,
             motivo: `Teto de ${TETO_POR_SESSAO} chamadas desta execução atingido.`, esperar: 0 };
  }
  return { ok: true };
}

/* O SLOT VOLTA QUANDO O CLIENTE DESISTE, E NÃO SÓ QUANDO O MODELO
   TERMINA.  (§75)

   `emVoo` existe para não empilhar chamadas num modelo local. Só que
   ele era liberado apenas no `finally` — quando o modelo respondia.

   O extrator de intenção desiste em 60 s (`Intencao.TEMPO_LIMITE`), e
   com um 12B na máquina isso acontece. O cliente ia embora, o servidor
   continuava moendo, e o pedido seguinte do MESMO TURNO — a narração —
   levava "Já existe uma chamada em andamento". O jogador perdia a
   narração e não tinha como saber por quê.

   Agora o slot volta no primeiro dos dois: o modelo terminar ou a
   conexão fechar. */
async function comLimite(res, fn) {
  const veredito = permitirChamada();
  if (!veredito.ok) {
    res.setHeader('Retry-After', String(veredito.esperar || 1));
    return responderJSON(res, veredito.codigo,
      { erro: veredito.motivo, esperar: veredito.esperar, limitado: true });
  }
  balde.marcas.push(Date.now());
  balde.total++;
  balde.emVoo++;

  let devolvido = false;
  const devolver = () => {
    if (devolvido) return;
    devolvido = true;
    balde.emVoo = Math.max(0, balde.emVoo - 1);
  };
  res.once('close', devolver);

  try { return await fn(); }
  finally { devolver(); }
}

function responderJSON(res, codigo, corpo) {
  const dados = JSON.stringify(corpo);
  res.writeHead(codigo, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, SEM_CACHE));
  res.end(dados);
}

function lerCorpo(req, limite = 1_000_000) {
  return new Promise((resolve, reject) => {
    let bruto = '';
    req.on('data', p => {
      bruto += p;
      if (bruto.length > limite) { req.destroy(); reject(new Error('Corpo grande demais.')); }
    });
    req.on('end', () => {
      try { resolve(bruto ? JSON.parse(bruto) : {}); }
      catch (e) { reject(new Error('JSON inválido.')); }
    });
    req.on('error', reject);
  });
}

const TEMPO_MODULO = Number(process.env.VITAE_TEMPO_MODULO || 20000);
const TEMPO_MODELO = Number(process.env.VITAE_TEMPO_MODELO || 0);

async function encaminhar(req, res, modulo, caminho, { tempo = TEMPO_MODULO } = {}) {
  const alvo = `${enderecoDe(modulo)}${caminho}`;
  const temCorpo = req.method !== 'GET' && req.method !== 'HEAD';
  try {
    const r = await fetch(alvo, {
      method: req.method,
      headers: Object.assign(
        { 'Content-Type': 'application/json' },
        /* A origem do navegador viaja junto: quem decide se aceita é
           o módulo, e ele precisa da informação para decidir. */
        req.headers.origin ? { Origin: req.headers.origin } : {}),
      body: temCorpo ? await new Promise((ok, falha) => {
        let bruto = '';
        req.on('data', p => { bruto += p; });
        req.on('end', () => ok(bruto || '{}'));
        req.on('error', falha);
      }) : undefined,
      /* Zero é "sem limite", e aí não se instala relógio nenhum — pôr
         `AbortSignal.timeout(0)` abortaria na hora. */
      signal: tempo > 0 ? AbortSignal.timeout(tempo) : undefined
    });
    const texto = await r.text();
    res.writeHead(r.status, Object.assign(
      { 'Content-Type': 'application/json; charset=utf-8' }, SEM_CACHE));
    res.end(texto);
  } catch (e) {
    if (foiEstouroDeTempo(e)) {
      return responderJSON(res, 504, {
        erro: `O módulo "${modulo}" está no ar, mas demorou mais de ${
          Math.round(tempo / 1000)} s para responder.`,
        detalhe: 'O Gateway desistiu de esperar; o módulo pode ainda estar trabalhando.',
        tempoLimite: tempo,
        esgotou: true,
        ajuste: 'VITAE_TEMPO_MODELO (rotas de modelo) ou VITAE_TEMPO_MODULO (as demais)'
      });
    }
    return responderJSON(res, 503, {
      erro: `O módulo "${modulo}" não respondeu.`,
      detalhe: e.message,
      comando: `node modulos/${modulo}/${modulo}-servidor.mjs`
    });
  }
}

async function rotaAPI(req, res, url) {
  for (const modulo of ['mesa', 'ficha', 'arbitro']) {
    if (url === `/api/${modulo}` || url.startsWith(`/api/${modulo}/`)) {
      return encaminhar(req, res, modulo, url.replace(/^\/api/, ''));
    }
  }

  if (url === '/api/sistemas') {
    return responderJSON(res, 200, await estadoDosSistemas());
  }

  if (url === '/api/ligar') {
    if (req.method !== 'POST') return responderJSON(res, 405, { erro: 'Use POST.' });
    if (!pedidoDaPropriaPagina(req)) return responderJSON(res, 403, { erro: 'Origem não autorizada.' });

    let pedido = {};
    try { pedido = await lerCorpo(req); } catch (e) { pedido = {}; }

    return responderJSON(res, 200, await ligarSistemas({
      modulos: pedido.modulos !== false,
      ollama: pedido.ollama !== false
    }));
  }

  if (url === '/api/desligar') {
    if (req.method !== 'POST') return responderJSON(res, 405, { erro: 'Use POST.' });
    if (!pedidoDaPropriaPagina(req)) return responderJSON(res, 403, { erro: 'Origem não autorizada.' });

    let pedido = {};
    try { pedido = await lerCorpo(req); } catch (e) { pedido = {}; }

    if (balde.emVoo > 0 && pedido.ollama !== false) {
      return responderJSON(res, 409, {
        erro: 'Há uma chamada ao modelo em andamento. Espere ela terminar.', emVoo: balde.emVoo });
    }

    const r = await desligarSistemas({
      ollama: pedido.ollama !== false,
      /* Desligar só o modelo é o caso comum — liberar a RAM e continuar
         jogando no determinístico. Os módulos só caem quando se pede. */
      modulos: pedido.modulos === true || pedido.servidor === true
    });

    if (pedido.servidor) {
      r.passos.push({ passo: 'gateway', ok: true, texto: 'Gateway encerrado.' });
      r.servidorEncerrado = true;
      /* Responde ANTES de sair, senão o navegador recebe conexão
         cortada e mostra erro de rede em vez do relatório. */
      responderJSON(res, 200, r);
      res.on('finish', () => setTimeout(() => process.exit(0), 150));
      return;
    }
    return responderJSON(res, 200, r);
  }

  if (url === '/api/estado') {
    let c = null;
    try {
      const r = await fetch(`${enderecoDe('cronista')}/cronista/saude`,
        { signal: AbortSignal.timeout(3000) });
      if (r.ok) c = await r.json();
    } catch (e) {
      console.warn('[gateway] o Módulo 5 não respondeu ao /api/estado:', e.message);
    }
    const ok = !!(c && c.provedorNoAr);
    return responderJSON(res, 200, {
      cronista: ok, narrador: ok,
      moduloCronista: !!c,
      provedor: c ? c.provedor : 'desconhecido',
      limite: { janelaSegundos: Math.round(JANELA_MS / 1000), tetoPorJanela: TETO_POR_JANELA,
                usadasNaJanela: balde.marcas.filter(t => Date.now() - t < JANELA_MS).length,
                totalDaExecucao: balde.total },
      modelo: c ? c.modelo : '', modeloNarrador: c ? c.modeloNarrador : ''
    });
  }

  /* `/api/cronista/diagnostico` é leitura e não gasta modelo: passa
     direto, sem tocar o balde. */
  if (url === '/api/cronista/diagnostico') {
    return encaminhar(req, res, 'cronista', '/cronista/diagnostico');
  }

  /* As três que gastam. `comLimite` primeiro, encaminhamento depois. */
  const DO_MODELO = {
    '/api/narrador': '/cronista/narrar',
    '/api/cronista': '/cronista/cronicar',
    '/api/intencao': '/cronista/intencao'
  };
  if (url in DO_MODELO) {
    /* O HEAD de `/api/intencao` é a sonda barata do elo 1: pergunta se
       ele existe sem gastar chamada, então não entra no balde. */
    /* O HEAD é sonda: ele NÃO ganha o orçamento do modelo, porque uma
       sonda que demora cinco minutos não é sonda. */
    if (req.method === 'HEAD') return encaminhar(req, res, 'cronista', DO_MODELO[url]);
    if (req.method !== 'POST') return responderJSON(res, 405, { erro: 'Use POST.' });
    if (!pedidoDaPropriaPagina(req)) return responderJSON(res, 403, { erro: 'Origem não autorizada.' });
    return comLimite(res, () => encaminhar(req, res, 'cronista', DO_MODELO[url],
                                           { tempo: TEMPO_MODELO }));
  }


  return responderJSON(res, 404, { erro: 'Rota desconhecida.' });
}

const servidor = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);

  if (url.startsWith('/api/')) {
    rotaAPI(req, res, url).catch(e => responderJSON(res, 500, { erro: e.message }));
    return;
  }

  /* A URL é o caminho no repositório, e quem decide o que pode ser
     lido é `comum/servir-estatico.mjs` — o mesmo arquivo que o
     servidor de desenvolvimento usa. (§79) */
  servirEstatico(PROJETO, req, res, url);
});

servidor.listen(PORTA, ENDERECO, () => {
  console.log(`VITÆ em http://localhost:${PORTA}`);
  console.log(`Escutando só em ${ENDERECO}. Para expor na rede, VITAE_ESCUTAR=0.0.0.0 — e saiba o que está fazendo.`);
  console.log('Sem cache: toda alteração aparece no F5.');
  console.log('As regras e o modelo vivem nos módulos: use o botão Ligar tudo, na capa.');
  console.log(`Tempo-limite: módulos ${TEMPO_MODULO} ms · rotas de modelo ${
    TEMPO_MODELO > 0 ? TEMPO_MODELO + ' ms' : 'sem limite'}.`);
});

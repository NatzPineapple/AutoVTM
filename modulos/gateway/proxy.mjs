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
import { servir as servirEstatico, SEM_CACHE } from '../../comum/servir-estatico.mjs';
import { estado as estadoDosSistemas, ligar as ligarSistemas, desligar as desligarSistemas } from '../../comum/sistemas.mjs';

const PROJETO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORTA = Number(process.env.PORTA || 5173);
const ENDERECO = process.env.VITAE_ESCUTAR || '127.0.0.1';

/* A MESMA função dos quatro módulos, desde a §86. O Gateway passa a
   porta DELE, e o conjunto sai igual ao que ele tinha — ele é o
   Gateway. O que muda é que agora há um lugar só onde a regra mora. */
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

   O extrator de intenção desiste em 30 s (`Intencao.TEMPO_LIMITE`), e
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

/* ------------------------------------------------------------
   GATEWAY — encaminhar para os módulos com porta própria

   A arquitetura modular põe cada módulo num processo. O navegador
   continua conhecendo UMA porta só: esta. `/api/mesa/…` sai daqui
   e entra no MesaServer como `/mesa/…`.

   O canal em tempo real NÃO passa por aqui: o Cliente abre o
   WebSocket direto na porta do módulo, que ele descobre em
   `/api/mesa/saude`. Reencaminhar `upgrade` seria um segundo
   soquete no meio do caminho sem nada a ganhar.
   ------------------------------------------------------------ */
async function encaminhar(req, res, modulo, caminho) {
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
      signal: AbortSignal.timeout(Number(process.env.VITAE_TEMPO_MODULO || 20000))
    });
    const texto = await r.text();
    res.writeHead(r.status, Object.assign(
      { 'Content-Type': 'application/json; charset=utf-8' }, SEM_CACHE));
    res.end(texto);
  } catch (e) {
    /* Módulo fora do ar é o caso comum enquanto a migração corre.
       503 com o comando de subir, e não 500 com o texto do erro. */
    return responderJSON(res, 503, {
      erro: `O módulo "${modulo}" não respondeu.`,
      detalhe: e.message,
      comando: `node modulos/${modulo}/${modulo}-servidor.mjs`
    });
  }
}

async function rotaAPI(req, res, url) {
  /* UM ENCAMINHAMENTO POR MÓDULO.  (§85)

     `/api/mesa` existia desde a §78; `/api/ficha` e `/api/arbitro`
     faltavam, e a falta só apareceu quando o navegador foi usá-las —
     os testes da Ponte falam com um `fetch` de mentira, e um `fetch`
     de mentira não sabe que o Gateway não tem a rota.

     A regra é a mesma para os três: `/api/<módulo>/…` sai daqui e entra
     no módulo como `/<módulo>/…`. O do Cronista é outro, e está mais
     abaixo, porque passa pelo limite de taxa. */
  for (const modulo of ['mesa', 'ficha', 'arbitro']) {
    if (url === `/api/${modulo}` || url.startsWith(`/api/${modulo}/`)) {
      return encaminhar(req, res, modulo, url.replace(/^\/api/, ''));
    }
  }

  /* O painel da capa (§75, ampliado na §80). `/api/sistemas` só olha;
     `/api/ligar` sobe o que falta — os módulos e o ollama. Ligar é
     escrita, então exige POST e origem da própria página, como as
     outras rotas que fazem alguma coisa. */
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

  /* Desligar, e é aqui que a ORDEM importa (§80):

       1. os MÓDULOS, que gravam o que têm em memória antes de sair;
       2. o OLLAMA, que é memória e nada mais;
       3. o GATEWAY, que é este processo — e derruba a página que fez
          o pedido, razão de a interface pedir dois cliques antes.

     Recusa enquanto houver chamada em voo: matar o ollama no meio de
     uma narração perde o turno do jogador sem aviso. (§76) */
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

  /* ------------------------------------------------------------
     AS TRÊS CAMADAS DE MODELO SAÍRAM DAQUI.  (§84)

     Elas rodavam dentro deste processo. Uma chamada ao modelo local
     segura o laço de eventos por dezenas de segundos, e enquanto ela
     corria era ESTE processo que servia o `index.html`, as campanhas e
     o `/api/sistemas` — o painel da capa esperava o Narrador terminar
     para dizer se o ollama estava de pé.

     Agora moram no Módulo 5, na porta 5177, e o Gateway encaminha.

     O QUE FICOU AQUI, de propósito: o **limite de taxa**. Ele é
     política de porta de entrada, não do Cronista, e é este processo
     que sabe quantas chamadas o navegador já fez. `comLimite` envolve
     o encaminhamento inteiro, então o slot só volta quando o módulo
     responde ou o cliente desiste — a garantia da §75, intacta.
     ------------------------------------------------------------ */

  if (url === '/api/estado') {
    /* O Gateway não sabe mais qual modelo está configurado: quem sabe é
       o Módulo 5. Ele pergunta, e responde "não sei" com honestidade
       quando o módulo está fora — em vez de dizer que a IA caiu. */
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
    if (req.method === 'HEAD') return encaminhar(req, res, 'cronista', DO_MODELO[url]);
    if (req.method !== 'POST') return responderJSON(res, 405, { erro: 'Use POST.' });
    if (!pedidoDaPropriaPagina(req)) return responderJSON(res, 403, { erro: 'Origem não autorizada.' });
    return comLimite(res, () => encaminhar(req, res, 'cronista', DO_MODELO[url]));
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
});

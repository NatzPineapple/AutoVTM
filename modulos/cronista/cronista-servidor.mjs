/* ============================================================
   VITÆ — CronistaServer (Módulo 5)  ·  §84
   ------------------------------------------------------------
   Processo próprio, porta própria:

     node modulos/cronista/cronista-servidor.mjs    (padrão: 5177)

   As TRÊS camadas de modelo do projeto moram aqui, e agora fora
   do Gateway:

     POST /cronista/narrar      degrau 4 — a prosa do turno
     POST /cronista/cronicar    fechamento de capítulo e dossiê
     POST /cronista/intencao    elo 1 — texto livre → intenção
     GET  /cronista/diagnostico o manifesto de contexto
     GET  /cronista/saude       o provedor respondeu?

   POR QUE SAIR DO GATEWAY: uma chamada ao modelo local segura o
   processo por dezenas de segundos. Enquanto ela corria, o mesmo
   processo era quem servia o `index.html`, as campanhas e o
   `/api/sistemas` — e o painel da capa ficava esperando o Narrador
   terminar para dizer se o ollama estava de pé.

   O QUE FICOU NO GATEWAY, de propósito: o **limite de taxa**. Ele
   é política de porta de entrada, não do Cronista, e é o Gateway
   que sabe quantas chamadas o navegador já fez. Mover o balde para
   cá seria dar ao Cronista uma decisão que não é dele.
   ============================================================ */

import http from 'node:http';
import { PORTAS, ENDERECO } from '../../comum/portas.mjs';
import { daPropriaCasa as daPropriaCasaDe } from '../../comum/origem.mjs';
import { cronicar, diagnostico, configurado, PROVEDOR, MODELO } from './cronista.mjs';
import { narrar, MODELO as MODELO_NARRADOR } from './narrador.mjs';
import { extrair, MODELO_PADRAO as MODELO_INTENCAO, configurado as intencaoNoAr } from './intencao.mjs';

const PORTA = PORTAS.cronista;

/* De onde o pedido pode vir: a regra vive em comum/origem.mjs desde a
   §86. Ela estava escrita CINCO VEZES — aqui e nos outros quatro —, e já
   discordou de si mesma uma vez: o 403 do pedido de encerrar, na §80.3. */
const daPropriaCasa = (req) => daPropriaCasaDe(req, PORTA);

const SEM_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0'
};

function responder(res, codigo, corpo) {
  res.writeHead(codigo, Object.assign(
    { 'Content-Type': 'application/json; charset=utf-8' }, SEM_CACHE));
  res.end(JSON.stringify(corpo));
}

function lerCorpo(req, limite = 2_000_000) {
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
   AS ROTAS
   ------------------------------------------------------------ */

async function rotear(req, res, caminho) {
  const partes = caminho.split('/').filter(Boolean);
  if (partes[0] !== 'cronista') return responder(res, 404, { erro: 'Rota desconhecida.' });
  const acao = partes[1] || '';

  if (acao === 'saude' && partes.length === 2) {
    const ok = await configurado();
    return responder(res, 200, {
      modulo: 'cronista', ligado: true, porta: PORTA,
      provedor: PROVEDOR, provedorNoAr: ok,
      modelo: MODELO, modeloNarrador: MODELO_NARRADOR, modeloIntencao: MODELO_INTENCAO,
      /* Sem provedor o módulo continua DE PÉ — o que cai é a prosa nova,
         não o serviço. É a diferença entre "fora" e "em determinístico",
         e o painel da capa precisa dela. */
      nota: ok ? '' : 'Sem provedor: capítulo e dossiê saem no modo determinístico.'
    });
  }

  if (acao === 'diagnostico' && partes.length === 2) {
    return responder(res, 200, await diagnostico());
  }

  if (acao === 'encerrar' && partes.length === 2) {
    if (req.method !== 'POST') return responder(res, 405, { erro: 'Use POST.' });
    if (!daPropriaCasa(req)) return responder(res, 403, { erro: 'Origem não autorizada.' });
    responder(res, 200, { encerrado: true });
    res.on('finish', () => setTimeout(() => process.exit(0), 120));
    return;
  }

  /* O HEAD do extrator é a sonda barata da cadeia: pergunta se o elo 1
     existe sem gastar uma chamada ao modelo. */
  if (acao === 'intencao' && req.method === 'HEAD') {
    const ok = await intencaoNoAr();
    res.writeHead(ok ? 200 : 503, ok ? { 'X-Modelo': MODELO_INTENCAO } : {});
    return res.end();
  }

  if (req.method !== 'POST') return responder(res, 405, { erro: 'Use POST.' });
  if (!daPropriaCasa(req)) return responder(res, 403, { erro: 'Origem não autorizada.' });

  let dados;
  try { dados = await lerCorpo(req); }
  catch (e) { return responder(res, 400, { erro: e.message }); }

  if (acao === 'intencao') {
    const r = await extrair(dados.texto || dados.player_input || '', {
      contexto: {
        poderes: dados.poderes, presentes: dados.presentes,
        objetos: dados.objetos, locais: dados.locais
      }
    });
    return responder(res, 200, Object.assign(
      { modelo: r.modelo, milissegundos: r.milissegundos }, r.intencao));
  }

  if (acao === 'narrar') {
    if (!await configurado()) {
      return responder(res, 503, { erro: 'Provedor indisponível.', semChave: true });
    }
    try {
      const r = await narrar(dados);
      console.log(`[narrador] ${r.provedor}/${r.modelo} · ${r.milissegundos} ms · ` +
        `entrada ${r.uso.entrada} (+${r.uso.cacheLido} de cache) · saída ${r.uso.saida} · ` +
        `tentativas ${r.tentativas} · válido ${r.valido}` +
        (r.problemasNaPrimeira.length ? ` · 1ª reprovada: ${r.problemasNaPrimeira.join('; ')}` : ''));
      return responder(res, 200, r);
    } catch (e) {
      console.error('[narrador] falhou:', e.message);
      return responder(res, 502, { erro: e.message });
    }
  }

  if (acao === 'cronicar') {
    if (!await configurado()) {
      return responder(res, 503, {
        erro: 'Provedor local indisponível. Suba o ollama, ou fique no resumo determinístico.',
        semChave: true
      });
    }
    const tipo = dados.tipo || 'capitulo';
    try {
      const r = await cronicar(tipo, dados);
      console.log(`[cronista] ${tipo} · ${r.provedor}/${r.modelo} · ${r.milissegundos} ms · ` +
        `entrada ${r.uso.entrada} (+${r.uso.cacheLido} de cache) · ` +
        `saída ${r.uso.saida} · tentativas ${r.tentativas} · válido ${r.valido}`);
      return responder(res, 200, r);
    } catch (e) {
      console.error('[cronista] falhou:', e.message);
      return responder(res, 502, { erro: e.message, status: e.status || null });
    }
  }

  return responder(res, 404, { erro: `Ação desconhecida: ${acao}` });
}

/* ------------------------------------------------------------
   O PROCESSO
   ------------------------------------------------------------ */

export function criarServidor() {
  return http.createServer((req, res) => {
    const caminho = decodeURIComponent((req.url || '/').split('?')[0]);
    rotear(req, res, caminho).catch(e => {
      console.error('[cronista] rota falhou:', e.message);
      responder(res, 500, { erro: e.message });
    });
  });
}

export function encerrarProcesso(servidor) { if (servidor) servidor.close(); }

const chamadoDireto = process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('modulos/cronista/cronista-servidor.mjs');

if (chamadoDireto) {
  const servidor = criarServidor();
  servidor.listen(PORTA, ENDERECO, () => {
    console.log(`CronistaServer (Módulo 5) em http://${ENDERECO}:${PORTA}/cronista`);
    configurado().then(ok => console.log(ok
      ? `Provedor ligado: ${PROVEDOR} · ${MODELO}.`
      : `Modo determinístico: ${PROVEDOR} não respondeu.`));
  });
  for (const sinal of ['SIGINT', 'SIGTERM']) {
    process.on(sinal, () => { encerrarProcesso(servidor); process.exit(0); });
  }
}

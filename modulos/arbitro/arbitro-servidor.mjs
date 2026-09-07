/* ============================================================
   VITÆ — ArbitroServer (Módulo 4)  ·  §84
   ------------------------------------------------------------
   Processo próprio, porta própria:

     node modulos/arbitro/arbitro-servidor.mjs     (padrão: 5176)

   **Stateless, e a palavra é literal:** não há um `let` de sessão
   neste arquivo. Entra situação, sai veredito. O mesmo pedido, com
   os mesmos valores, dá a mesma resposta amanhã.

   As quatro rotas são as quatro perguntas que a Mesa faz num
   turno, e nada mais:

     POST /arbitro/interpretar   texto do jogador → intenção e rotas
     POST /arbitro/pedido        situação → QUAIS dados rolar   (§82.1)
     POST /arbitro/apurar        pedido + valores → veredito    (§82.3)
     GET  /arbitro/saude         o que ele carregou

   Repare no que NÃO existe: uma rota que role. O Módulo 4 não tem
   fonte de acaso — `arbitro-contexto.mjs` instala uma que estoura
   —, e é isso que faz a regra da §82 valer aqui: **o Árbitro diz
   quais, a Mesa roda, o Árbitro apura.**

   E não existe nenhuma regra ESCRITA neste arquivo. Ele monta um
   contexto de `node:vm` com os mesmos arquivos que o navegador
   carrega, e chama. Corrigir uma regra continua sendo mexer num
   arquivo só.
   ============================================================ */

import http from 'node:http';
import { PORTAS, ENDERECO } from '../../comum/portas.mjs';
import { daPropriaCasa as daPropriaCasaDe } from '../../comum/origem.mjs';
import { montarContexto, AREAS_DO_ARBITRO } from './arbitro-contexto.mjs';

const PORTA = PORTAS.arbitro;

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
   O CONTEXTO
   Um só, montado na subida. Ele não guarda estado de partida —
   é o Árbitro carregado, e o Árbitro é o mesmo para todo mundo.
   ------------------------------------------------------------ */

let A = null;

export function prepararArbitro() {
  if (!A) A = montarContexto();
  return A;
}

/* ------------------------------------------------------------
   AS ROTAS
   ------------------------------------------------------------ */

async function rotear(req, res, caminho) {
  const partes = caminho.split('/').filter(Boolean);
  if (partes[0] !== 'arbitro') return responder(res, 404, { erro: 'Rota desconhecida.' });
  const acao = partes[1] || '';

  if (acao === 'saude' && partes.length === 2) {
    return responder(res, 200, {
      modulo: 'arbitro', ligado: true, porta: PORTA,
      areas: AREAS_DO_ARBITRO, arquivos: A.__carregados.length,
      /* Ele admite o que não faz: é a informação que separa um módulo
         stateless de um que perdeu o estado. */
      rola: false,
      nota: 'Stateless. Diz quais dados e apura os valores; quem rola é a Mesa (§82).'
    });
  }

  if (acao === 'encerrar' && partes.length === 2) {
    if (req.method !== 'POST') return responder(res, 405, { erro: 'Use POST.' });
    if (!daPropriaCasa(req)) return responder(res, 403, { erro: 'Origem não autorizada.' });
    responder(res, 200, { encerrado: true });
    res.on('finish', () => setTimeout(() => process.exit(0), 120));
    return;
  }

  if (req.method !== 'POST') return responder(res, 405, { erro: 'Use POST.' });
  if (!daPropriaCasa(req)) return responder(res, 403, { erro: 'Origem não autorizada.' });

  let corpo;
  try { corpo = await lerCorpo(req); }
  catch (e) { return responder(res, 400, { erro: e.message }); }

  /* ---- texto do jogador → intenção mecânica ---- */
  if (acao === 'interpretar') {
    const texto = String(corpo.texto || '');
    if (!texto.trim()) return responder(res, 422, { erro: 'Sem texto para interpretar.' });
    const lido = A.Lexico.interpretar(texto);
    return responder(res, 200, { texto, ...lido });
  }

  /* ---- PASSO 1 da §82: quais dados ---- */
  if (acao === 'pedido') {
    const { ficha, rota } = corpo;
    if (!ficha || typeof ficha !== 'object') return responder(res, 422, { erro: 'Falta a ficha.' });
    if (!rota || typeof rota !== 'object') return responder(res, 422, { erro: 'Falta a rota.' });

    const pf = A.Arbitro.piscinaFinal(ficha, {
      rota, estados: corpo.estados || [], dominio: corpo.dominio || null,
      intencao: corpo.intencao || null, fala: corpo.fala || null,
      disciplina: corpo.disciplina || null, texto: corpo.texto || ''
    });
    const pedido = A.Dados.pedir({
      piscina: pf.total, fome: ficha.fome || 0,
      dificuldade: corpo.dificuldade || 0, rotulo: pf.rotulo
    });
    /* A composição viaja junto porque a interface a mostra ao jogador —
       "3 do Atributo, 2 da Perícia, +1 da especialização". Sem ela, o
       jogador vê um número e não sabe de onde veio. */
    return responder(res, 200, { pedido, composicao: pf });
  }

  /* ---- PASSO 3 da §82: o veredito ---- */
  if (acao === 'apurar') {
    const { pedido, valores } = corpo;
    if (!pedido || typeof pedido !== 'object') return responder(res, 422, { erro: 'Falta o pedido.' });
    if (!valores || !Array.isArray(valores.normais) || !Array.isArray(valores.dadosFome)) {
      return responder(res, 422, { erro: 'Faltam os valores: normais e dadosFome.' });
    }
    const esperados = (pedido.normais | 0) + (pedido.fome | 0);
    const vieram = valores.normais.length + valores.dadosFome.length;
    /* O Árbitro CONFERE o que a Mesa mandou. É a razão prática de os
       dois serem processos: ninguém apura sobre uma quantidade de dados
       que não foi a pedida. */
    if (esperados !== vieram) {
      return responder(res, 422, {
        erro: `O pedido era de ${esperados} dado(s) e vieram ${vieram}.` });
    }
    const veredito = A.Dados.apurar(pedido, valores);
    return responder(res, 200, { veredito, descricao: A.Dados.descrever(veredito) });
  }

  return responder(res, 404, { erro: `Ação desconhecida: ${acao}` });
}

/* ------------------------------------------------------------
   O PROCESSO
   ------------------------------------------------------------ */

export function criarServidor() {
  prepararArbitro();
  return http.createServer((req, res) => {
    const caminho = decodeURIComponent((req.url || '/').split('?')[0]);
    rotear(req, res, caminho).catch(e => {
      console.error('[arbitro] rota falhou:', e.message);
      responder(res, 500, { erro: e.message });
    });
  });
}

export function encerrarProcesso(servidor) { if (servidor) servidor.close(); }

const chamadoDireto = process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('modulos/arbitro/arbitro-servidor.mjs');

if (chamadoDireto) {
  const servidor = criarServidor();
  servidor.listen(PORTA, ENDERECO, () => {
    console.log(`ArbitroServer (Módulo 4) em http://${ENDERECO}:${PORTA}/arbitro`);
    console.log(`${A.__carregados.length} arquivos carregados — os mesmos do navegador.`);
  });
  for (const sinal of ['SIGINT', 'SIGTERM']) {
    process.on(sinal, () => { encerrarProcesso(servidor); process.exit(0); });
  }
}

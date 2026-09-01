/* ============================================================
   VITÆ — Servidor com proxy do Cronista
   Serve app/ sem cache, igual ao dev.mjs, e ainda encaminha as
   rotas /api/ para o provedor local. Não há chave, não há conta
   e não há custo: o modelo roda na própria máquina, pelo ollama.

     node servidor/proxy.mjs
   ============================================================ */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cronicar, diagnostico, configurado, PROVEDOR, MODELO } from './cronista.mjs';
import { narrar, MODELO as MODELO_NARRADOR } from './narrador.mjs';
import { extrair, MODELO_PADRAO as MODELO_INTENCAO, configurado as intencaoNoAr } from './intencao.mjs';

const PROJETO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = path.join(PROJETO, 'app');
const CAMPANHAS = path.join(PROJETO, 'campanhas');
const PORTA = Number(process.env.PORTA || 5173);
const ENDERECO = process.env.VITAE_ESCUTAR || '127.0.0.1';

const ORIGENS_ACEITAS = new Set([
  `http://localhost:${PORTA}`, `http://127.0.0.1:${PORTA}`,
  `http://[::1]:${PORTA}`
]);

const HOST_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function pedidoDaPropriaPagina(req) {
  const origem = req.headers.origin;
  if (origem) return ORIGENS_ACEITAS.has(origem);
  return HOST_LOCAL.test(String(req.headers.host || ''));
}

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
  try { return await fn(); }
  finally { balde.emVoo--; }
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.woff2': 'font/woff2'
};

const SEM_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

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

/* Extrator de intenção, elo 1 da cadeia. Roda aqui dentro desde a §42:
   antes era um serviço Python separado, e o salto extra não pagava nada. */
async function rotaIntencao(req, res) {
  if (req.method === 'HEAD') {
    const ok = await intencaoNoAr();
    res.writeHead(ok ? 200 : 503, ok ? { 'X-Modelo': MODELO_INTENCAO } : {});
    return res.end();
  }
  if (req.method !== 'POST') return responderJSON(res, 405, { erro: 'Use POST.' });
  if (!pedidoDaPropriaPagina(req)) return responderJSON(res, 403, { erro: 'Origem não autorizada.' });

  let dados;
  try { dados = await lerCorpo(req); }
  catch (e) { return responderJSON(res, 400, { erro: e.message }); }

  return comLimite(res, async () => {
    const r = await extrair(dados.texto || dados.player_input || '', {
      contexto: {
        poderes: dados.poderes, presentes: dados.presentes,
        objetos: dados.objetos, locais: dados.locais
      }
    });
    return responderJSON(res, 200, Object.assign({ modelo: r.modelo,
      milissegundos: r.milissegundos }, r.intencao));
  });
}

async function rotaAPI(req, res, url) {
  if (url === '/api/intencao') return rotaIntencao(req, res);

  if (url === '/api/estado') {
    const ok = await configurado();
    return responderJSON(res, 200, {
      cronista: ok, narrador: ok, provedor: PROVEDOR,
      limite: { janelaSegundos: Math.round(JANELA_MS / 1000), tetoPorJanela: TETO_POR_JANELA,
                usadasNaJanela: balde.marcas.filter(t => Date.now() - t < JANELA_MS).length,
                totalDaExecucao: balde.total },
      modelo: MODELO, modeloNarrador: MODELO_NARRADOR
    });
  }

  if (url === '/api/narrador') {
    if (req.method !== 'POST') return responderJSON(res, 405, { erro: 'Use POST.' });
    if (!pedidoDaPropriaPagina(req)) return responderJSON(res, 403, { erro: 'Origem não autorizada.' });
    if (!await configurado()) {
      return responderJSON(res, 503, { erro: 'Provedor indisponível.', semChave: true });
    }
    let turno;
    try { turno = await lerCorpo(req); }
    catch (e) { return responderJSON(res, 400, { erro: e.message }); }

    return comLimite(res, async () => {
    try {
      const r = await narrar(turno);
      console.log(`[narrador] ${r.provedor}/${r.modelo} · ${r.milissegundos} ms · ` +
        `entrada ${r.uso.entrada} (+${r.uso.cacheLido} de cache) · saída ${r.uso.saida} · ` +
        `tentativas ${r.tentativas} · válido ${r.valido}` +
        (r.problemasNaPrimeira.length ? ` · 1ª reprovada: ${r.problemasNaPrimeira.join('; ')}` : ''));
      return responderJSON(res, 200, r);
    } catch (e) {
      console.error('[narrador] falhou:', e.message);
      return responderJSON(res, 502, { erro: e.message });
    }
    });
  }

  if (url === '/api/cronista/diagnostico') {
    return responderJSON(res, 200, await diagnostico());
  }

  if (url === '/api/cronista') {
    if (req.method !== 'POST') return responderJSON(res, 405, { erro: 'Use POST.' });
    if (!pedidoDaPropriaPagina(req)) return responderJSON(res, 403, { erro: 'Origem não autorizada.' });
    if (!await configurado()) {
      return responderJSON(res, 503, {
        erro: 'Provedor local indisponível. Suba o ollama, ou fique no resumo determinístico.',
        semChave: true
      });
    }
    let dados;
    try { dados = await lerCorpo(req); }
    catch (e) { return responderJSON(res, 400, { erro: e.message }); }

    const tipo = dados.tipo || 'capitulo';
    return comLimite(res, async () => {
    try {
      const r = await cronicar(tipo, dados);
      console.log(`[cronista] ${tipo} · ${r.provedor}/${r.modelo} · ${r.milissegundos} ms · ` +
        `entrada ${r.uso.entrada} (+${r.uso.cacheLido} de cache) · ` +
        `saída ${r.uso.saida} · tentativas ${r.tentativas} · válido ${r.valido}`);
      return responderJSON(res, 200, r);
    } catch (e) {
      console.error('[cronista] falhou:', e.message);
      return responderJSON(res, 502, { erro: e.message, status: e.status || null });
    }
    });
  }

  return responderJSON(res, 404, { erro: 'Rota desconhecida.' });
}

const servidor = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);

  if (url.startsWith('/api/')) {
    rotaAPI(req, res, url).catch(e => responderJSON(res, 500, { erro: e.message }));
    return;
  }

  const daCampanha = url.startsWith('/campanhas/');
  const base = daCampanha ? CAMPANHAS : RAIZ;
  const relativo = daCampanha ? url.slice('/campanhas/'.length) : (url === '/' ? 'index.html' : url);
  const alvo = path.normalize(path.join(base, relativo));
  if (!alvo.startsWith(base)) {
    res.writeHead(403).end('Fora da raiz');
    return;
  }

  fs.readFile(alvo, (erro, dados) => {
    if (erro) {
      res.writeHead(404, Object.assign({ 'Content-Type': 'text/plain; charset=utf-8' }, SEM_CACHE));
      res.end('Não encontrado: ' + url);
      return;
    }
    res.writeHead(200, Object.assign({
      'Content-Type': TIPOS[path.extname(alvo).toLowerCase()] || 'application/octet-stream'
    }, SEM_CACHE));
    res.end(dados);
  });
});

servidor.listen(PORTA, ENDERECO, () => {
  console.log(`VITÆ em http://localhost:${PORTA}`);
  console.log(`Escutando só em ${ENDERECO}. Para expor na rede, VITAE_ESCUTAR=0.0.0.0 — e saiba o que está fazendo.`);
  console.log('Sem cache: toda alteração aparece no F5.');
  configurado().then(ok => console.log(ok
    ? `Cronista ligado: ${PROVEDOR} · ${MODELO}.`
    : `Cronista em modo determinístico: provedor ${PROVEDOR} não respondeu.`));
});

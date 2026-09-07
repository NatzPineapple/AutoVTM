/* ============================================================
   VITÆ — FichaServer (Módulo 2)  ·  §83
   ------------------------------------------------------------
   Processo próprio, porta própria:

     node modulos/ficha/ficha-servidor.mjs        (padrão: 5174)

   O que ele é: o dono das fichas FORA de sessão. Criação,
   guarda e entrega. É ele quem o MesaServer procura no checkout,
   pelo contrato que `modulos/mesa/cliente-ficha.mjs` já escrevia
   desde a §78 — o cliente existia antes do servidor, e é por isso
   que este arquivo não inventou rota nenhuma: ele implementa o
   que já estava combinado.

   O QUE ELE NÃO É:
     · não valida regra de jogo em profundidade — quem sabe se uma
       ficha está completa é a área Ficha, no navegador, e a
       validação de criação continua lá;
     · não sabe o que é uma sessão. Ficha em jogo é do Módulo 3, e
       durante a mesa este processo não é consultado nem uma vez.

   A VALIDAÇÃO QUE ELE FAZ é a de porta de entrada: o corpo é um
   objeto? tem nome? o id serve como chave? Recusar cedo é o que
   impede o banco de encher de documento sem forma.
   ============================================================ */

import http from 'node:http';
import { PORTAS, ENDERECO } from '../../comum/portas.mjs';
import { daPropriaCasa as daPropriaCasaDe } from '../../comum/origem.mjs';
import { abrirGuardador, idDaFicha, idValido, RAIZ_DAS_FICHAS } from './ficha-guardador.mjs';

const PORTA = PORTAS.ficha;

/* Mesma política dos outros módulos: só a própria casa fala. A lista
   aceita o Gateway porque é ele quem encaminha, e o laço local porque
   chamada entre módulos não vem de navegador nenhum. */
/* De onde o pedido pode vir: a regra vive em comum/origem.mjs desde a
   §86. Ela estava escrita CINCO VEZES — aqui e nos outros quatro —, e já
   discordou de si mesma uma vez: o 403 do pedido de encerrar, na §80.3. */
const daPropriaCasa = (req) => daPropriaCasaDe(req, PORTA);

const SEM_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0'
};

function responder(res, codigo, corpo) {
  const dados = JSON.stringify(corpo);
  res.writeHead(codigo, Object.assign(
    { 'Content-Type': 'application/json; charset=utf-8' }, SEM_CACHE));
  res.end(dados);
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
   O GUARDADOR
   Um só, aberto na subida. Trocar de guardador em tempo de
   execução não é caso de uso: quem muda o banco reinicia.
   ------------------------------------------------------------ */

let guardador = null;

export async function prepararGuardador(opcoes) {
  if (!guardador) guardador = await abrirGuardador(opcoes);
  return guardador;
}

/** O que uma ficha precisa ter para entrar. Porta de entrada, não regra. */
function recusarFicha(f) {
  if (!f || typeof f !== 'object' || Array.isArray(f)) return 'O corpo não é uma ficha.';
  if (!f.nome || typeof f.nome !== 'string' || !f.nome.trim()) return 'A ficha não tem nome.';
  if (f.fichaId && !idValido(f.fichaId)) return `fichaId inválido: ${f.fichaId}`;
  return null;
}

/* ------------------------------------------------------------
   AS ROTAS
   ------------------------------------------------------------ */

async function rotear(req, res, caminho) {
  const partes = caminho.split('/').filter(Boolean);      /* ['ficha', ...] */
  if (partes[0] !== 'ficha') return responder(res, 404, { erro: 'Rota desconhecida.' });

  if (partes[1] === 'saude' && partes.length === 2) {
    const s = await guardador.saude();
    return responder(res, 200, {
      modulo: 'ficha', ligado: true, porta: PORTA,
      guardador: s, motivo: guardador.motivo || ''
    });
  }

  /* Encerrar-se, como o MesaServer (§80): quem pede é o Gateway, e o
     módulo sai por vontade própria em vez de ser morto. */
  if (partes[1] === 'encerrar' && partes.length === 2) {
    if (req.method !== 'POST') return responder(res, 405, { erro: 'Use POST.' });
    if (!daPropriaCasa(req)) return responder(res, 403, { erro: 'Origem não autorizada.' });
    responder(res, 200, { encerrado: true });
    res.on('finish', () => setTimeout(async () => {
      try { await guardador.fechar(); }
      catch (e) { console.warn('[ficha] fechar o guardador falhou:', e.message); }
      process.exit(0);
    }, 120));
    return;
  }

  const escrita = req.method === 'POST' || req.method === 'DELETE' || req.method === 'PUT';
  if (escrita && !daPropriaCasa(req)) {
    return responder(res, 403, { erro: 'Origem não autorizada.' });
  }

  /* /ficha — listar e guardar */
  if (partes.length === 1) {
    if (req.method === 'GET') {
      const fichas = await guardador.listar();
      /* A lista NÃO devolve ficha inteira: o navegador desenha cartões,
         e mandar noventa fichas completas para desenhar noventa nomes é
         o mesmo defeito da §47.5, do outro lado do fio. */
      return responder(res, 200, {
        fichas: fichas.map(f => ({
          fichaId: f.fichaId, nome: f.nome, cla: f.cla, seita: f.seita,
          conceito: f.conceito || '', geracao: f.geracao,
          predador: f.predador, cidade: f.cidade,
          criadaEm: f.criadaEm || 0, guardadaEm: f.guardadaEm || 0
        }))
      });
    }
    if (req.method !== 'POST') return responder(res, 405, { erro: 'Use GET ou POST.' });

    let corpo;
    try { corpo = await lerCorpo(req); }
    catch (e) { return responder(res, 400, { erro: e.message }); }

    /* O checkin do Módulo 3 manda `{ ficha, devolvidaEm }`; o criador
       manda a ficha crua. Aceitar os dois é o contrato da §78. */
    const ficha = corpo.ficha || corpo;
    const recusa = recusarFicha(ficha);
    if (recusa) return responder(res, 422, { erro: recusa });

    const r = await guardador.guardar(ficha);
    console.log(`[ficha] guardei ${r.id} (${guardador.tipo})`);
    return responder(res, 200, { fichaId: r.id, ficha: r.ficha, guardador: guardador.tipo });
  }

  /* /ficha/:id */
  const id = partes[1];
  if (partes.length !== 2) return responder(res, 404, { erro: 'Rota desconhecida.' });

  if (req.method === 'GET') {
    if (!idValido(id)) return responder(res, 400, { erro: `Id inválido: ${id}` });
    const f = await guardador.ler(id);
    return f ? responder(res, 200, { ficha: f })
             : responder(res, 404, { erro: `Ficha ${id} não existe.` });
  }

  if (req.method === 'DELETE') {
    const foi = await guardador.apagar(id);
    return responder(res, foi ? 200 : 404, { apagada: foi });
  }

  return responder(res, 405, { erro: 'Use GET ou DELETE.' });
}

/* ------------------------------------------------------------
   O PROCESSO
   ------------------------------------------------------------ */

export function criarServidor() {
  return http.createServer((req, res) => {
    const caminho = decodeURIComponent((req.url || '/').split('?')[0]);
    rotear(req, res, caminho).catch(e => {
      console.error('[ficha] rota falhou:', e.message);
      responder(res, 500, { erro: e.message });
    });
  });
}

export async function encerrarProcesso(servidor) {
  if (guardador) {
    try { await guardador.fechar(); }
    catch (e) { console.warn('[ficha] fechar o guardador falhou:', e.message); }
  }
  if (servidor) servidor.close();
}

const chamadoDireto = process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('modulos/ficha/ficha-servidor.mjs');

if (chamadoDireto) {
  await prepararGuardador();
  const servidor = criarServidor();
  servidor.listen(PORTA, ENDERECO, async () => {
    const s = await guardador.saude();
    console.log(`FichaServer (Módulo 2) em http://${ENDERECO}:${PORTA}/ficha`);
    console.log(`Guardador: ${s.tipo} — ${s.detalhe}`);
    if (s.tipo === 'pasta') console.log(`Motivo: ${guardador.motivo}`);
  });
  for (const sinal of ['SIGINT', 'SIGTERM']) {
    process.on(sinal, async () => { await encerrarProcesso(servidor); process.exit(0); });
  }
}

/* ============================================================
   VITÆ — MesaServer (Módulo 3)
   ------------------------------------------------------------
   Processo próprio, porta própria:

     node modulos/mesa/mesa-servidor.mjs        (padrão: 5175)

   O que ele é: o orquestrador da sessão ativa. Guarda o estado da
   mesa em memória, faz o checkout da ficha na abertura e o
   checkin no fim, e mantém a pasta da sessão em dia por autosave.

   O QUE ELE NÃO É, e não pode virar:
     · não decide regra — isso é o Árbitro (Módulo 4);
     · não escreve narrativa — isso é o Cronista (Módulo 5);
     · não é a fonte da ficha — isso é o FichaServer (Módulo 2).

   Ele conversa com os três, e é o único que sabe o que está
   acontecendo agora.

   O WEBSOCKET: em `/mesa/ws`. Existe porque a mesa tem eventos
   que não nascem de um pedido do jogador — o autosave que
   confirmou, o Cronista tomando iniciativa. Com HTTP puro isso
   vira o navegador perguntando "e agora?" em laço.
   ============================================================ */

import http from 'node:http';
import { PORTAS, ENDERECO } from '../../comum/portas.mjs';
import { daPropriaCasa as daPropriaCasaDe } from '../../comum/origem.mjs';
import { ehPedidoWebSocket, aceitar } from '../../comum/websocket.mjs';
import * as Estado from './mesa-estado.mjs';
import { fichaServerNoAr } from './cliente-ficha.mjs';
import { RAIZ_DAS_SESSOES } from './mesa-pasta.mjs';

const PORTA = PORTAS.mesa;

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

function lerCorpo(req, limite = 4_000_000) {
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
   O CANAL EM TEMPO REAL
   Um conjunto de conexões, cada uma marcada com a sessão que
   está acompanhando. Quem não assinou sessão nenhuma recebe só
   os avisos gerais.
   ------------------------------------------------------------ */

const conexoes = new Set();

function avisar(sessaoId, evento) {
  const pacote = JSON.stringify(Object.assign({ sessao: sessaoId, em: Date.now() }, evento));
  let entregues = 0;
  for (const con of conexoes) {
    if (!con.aberta) { conexoes.delete(con); continue; }
    if (sessaoId && con.marca.sessao && con.marca.sessao !== sessaoId) continue;
    if (con.enviar(pacote)) entregues++;
  }
  return entregues;
}

function abrirCanal(req, socket) {
  const con = aceitar(req, socket);
  conexoes.add(con);

  const url = new URL(req.url, `http://127.0.0.1:${PORTA}`);
  const pedida = url.searchParams.get('sessao') || '';
  if (pedida) con.marca.sessao = pedida;

  con.aoReceber((objeto) => {
    if (!objeto || typeof objeto !== 'object') return;
    if (objeto.tipo === 'assinar') {
      con.marca.sessao = objeto.sessao || '';
      con.enviar({ tipo: 'assinado', sessao: con.marca.sessao });
      return;
    }
    if (objeto.tipo === 'ping') { con.enviar({ tipo: 'pong', em: Date.now() }); return; }
    /* O canal é de AVISO, não de comando: mudar estado é pelas rotas
       HTTP, onde há verificação de origem e corpo com limite. */
    con.enviar({ tipo: 'ignorado', motivo: 'O canal só avisa. Para mudar estado, use /mesa/…' });
  });
  con.aoFechar(() => conexoes.delete(con));

  con.enviar({ tipo: 'ligado', sessao: con.marca.sessao, modulo: 'mesa' });
}

/* ------------------------------------------------------------
   AS ROTAS
   ------------------------------------------------------------ */

const ESCRITA = new Set(['POST', 'PATCH', 'DELETE', 'PUT']);

async function rotear(req, res, caminho) {
  const partes = caminho.split('/').filter(Boolean);      /* ['mesa','sessoes',id,...] */
  if (partes[0] !== 'mesa') return responder(res, 404, { erro: 'Rota desconhecida.' });

  if (partes[1] === 'saude' && partes.length === 2) {
    return responder(res, 200, {
      modulo: 'mesa', ligado: true, porta: PORTA,
      sessoesVivas: Estado.quantasVivas(), pasta: RAIZ_DAS_SESSOES,
      fichaServer: await fichaServerNoAr(), canais: conexoes.size
    });
  }

  /* ENCERRAR-SE. É o Gateway quem pede, quando o jogador manda desligar
     tudo. A alternativa era o Gateway matar o processo — e `taskkill`
     perde a sessão que está em memória e ainda não passou pelo
     autosave. Aqui ele grava tudo primeiro, e só então sai. (§80) */
  if (partes[1] === 'encerrar' && partes.length === 2) {
    if (req.method !== 'POST') return responder(res, 405, { erro: 'Use POST.' });
    if (!daPropriaCasa(req)) return responder(res, 403, { erro: 'Origem não autorizada.' });

    const vivas = Estado.quantasVivas();
    const gravadas = Estado.desligarAutosave();
    console.log(`[mesa] encerrando a pedido · ${gravadas.length} sessão(ões) gravada(s)`);
    responder(res, 200, {
      encerrado: true, sessoesVivas: vivas,
      gravadas: gravadas.map(g => ({ id: g.id, ok: g.ok, partes: g.partes }))
    });
    /* Responde ANTES de sair: quem pediu precisa do relatório, e
       conexão cortada viraria erro de rede em vez de confirmação. */
    res.on('finish', () => setTimeout(() => {
      for (const con of conexoes) con.fechar(1001, 'servidor encerrando');
      process.exit(0);
    }, 120));
    return;
  }

  if (partes[1] !== 'sessoes') return responder(res, 404, { erro: 'Rota desconhecida.' });

  if (ESCRITA.has(req.method) && !daPropriaCasa(req)) {
    return responder(res, 403, { erro: 'Origem não autorizada.' });
  }

  /* /mesa/sessoes */
  if (partes.length === 2) {
    if (req.method === 'GET') return responder(res, 200, { sessoes: Estado.listar() });
    if (req.method !== 'POST') return responder(res, 405, { erro: 'Use GET ou POST.' });

    let pedido;
    try { pedido = await lerCorpo(req); }
    catch (e) { return responder(res, 400, { erro: e.message }); }

    const r = await Estado.abrir(pedido);
    if (!r.ok) return responder(res, 422, { erro: r.motivo });
    console.log(`[mesa] sessão ${r.id} aberta · ficha de ${r.origemDaFicha}`);
    avisar(r.id, { tipo: 'sessao-aberta', meta: r.sessao.meta });
    return responder(res, 201, r);
  }

  const id = partes[2];
  const acao = partes[3] || '';

  /* /mesa/sessoes/:id */
  if (!acao) {
    if (req.method === 'GET') {
      const e = Estado.estadoDe(id);
      return e ? responder(res, 200, e) : responder(res, 404, { erro: 'Sessão desconhecida.' });
    }
    if (req.method === 'DELETE') {
      const foi = Estado.apagar(id);
      avisar(id, { tipo: 'sessao-apagada' });
      return responder(res, foi ? 200 : 404, { apagada: foi });
    }
    return responder(res, 405, { erro: 'Use GET ou DELETE.' });
  }

  /* As alterações são leitura — a prévia do checkin. */
  if (acao === 'alteracoes') {
    if (req.method !== 'GET') return responder(res, 405, { erro: 'Use GET.' });
    const lista = Estado.alteracoesDaFicha(id);
    return lista ? responder(res, 200, { alteracoes: lista })
                 : responder(res, 404, { erro: 'Sessão desconhecida.' });
  }

  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return responder(res, 405, { erro: 'Use POST ou PATCH.' });
  }

  let pedido;
  try { pedido = await lerCorpo(req); }
  catch (e) { return responder(res, 400, { erro: e.message }); }

  if (acao === 'ficha') {
    const f = Estado.alterarFicha(id, pedido.mudancas || pedido);
    if (!f) return responder(res, 404, { erro: 'Sessão desconhecida.' });
    avisar(id, { tipo: 'ficha-alterada', campos: Object.keys(pedido.mudancas || pedido) });
    return responder(res, 200, { ficha: f });
  }

  if (acao === 'mundo') {
    const m = Estado.alterarMundo(id, pedido.mudancas || pedido);
    if (!m) return responder(res, 404, { erro: 'Sessão desconhecida.' });
    avisar(id, { tipo: 'mundo-alterado', campos: Object.keys(pedido.mudancas || pedido) });
    return responder(res, 200, { mundo: m });
  }

  /* A MESA ROLA.  (§82) O corpo é o PEDIDO que o Árbitro montou;
     a resposta são os VALORES. Apurar é do Árbitro, e esta rota não
     conta um sucesso sequer. */
  if (acao === 'rolagem') {
    const r = Estado.rolar(id, pedido.pedido || pedido);
    if (!r) return responder(res, 404, { erro: 'Sessão desconhecida.' });
    avisar(id, { tipo: 'rolagem', rotulo: r.pedido.rotulo,
      dados: r.valores.normais.length + r.valores.dadosFome.length });
    return responder(res, 200, r);
  }

  if (acao === 'turno') {
    const total = Estado.anexarTurno(id, pedido.entradas || pedido.entrada || pedido);
    if (total === null) return responder(res, 404, { erro: 'Sessão desconhecida.' });
    avisar(id, { tipo: 'turno', total });
    return responder(res, 200, { turnos: total });
  }

  if (acao === 'checkin') {
    const r = await Estado.checkin(id, { aceite: !!pedido.aceite });
    /* 409 e não 400: não é pedido malformado, é passo que falta. O
       Cliente recebe as alterações para mostrar e pedir o aceite. */
    if (!r.ok && r.precisaAceite) return responder(res, 409, r);
    if (!r.ok && /desconhecida/.test(r.motivo || '')) return responder(res, 404, r);
    if (r.ok) avisar(id, { tipo: 'checkin', origem: r.origem });
    /* 202: aceito e guardado aqui, mas não persistido no FichaServer.
       Quem lê tem de saber a diferença. */
    return responder(res, r.ok ? 200 : 202, r);
  }

  if (acao === 'encerrar') {
    const r = await Estado.encerrar(id, {
      aceite: !!pedido.aceite, comCheckin: pedido.comCheckin !== false });
    if (!r.ok && r.precisaAceite) return responder(res, 409, r);
    if (!r.ok) return responder(res, 404, r);
    avisar(id, { tipo: 'sessao-encerrada' });
    return responder(res, 200, r);
  }

  return responder(res, 404, { erro: `Ação desconhecida: ${acao}` });
}

/* ------------------------------------------------------------
   O PROCESSO
   ------------------------------------------------------------ */

export function criarServidor() {
  const servidor = http.createServer((req, res) => {
    const caminho = decodeURIComponent((req.url || '/').split('?')[0]);
    rotear(req, res, caminho).catch(e => {
      console.error('[mesa] rota falhou:', e.message);
      responder(res, 500, { erro: e.message });
    });
  });

  servidor.on('upgrade', (req, socket) => {
    if (!ehPedidoWebSocket(req) || !decodeURIComponent(req.url || '').startsWith('/mesa/ws')) {
      socket.destroy();
      return;
    }
    if (!daPropriaCasa(req)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }
    abrirCanal(req, socket);
  });

  return servidor;
}

/** Grava tudo antes de sair. Sessão perdida por Ctrl+C é sessão perdida. */
export function encerrarProcesso(servidor) {
  const feitos = Estado.desligarAutosave();
  if (feitos.length) console.log(`[mesa] gravei ${feitos.length} sessão(ões) antes de sair.`);
  for (const con of conexoes) con.fechar(1001, 'servidor encerrando');
  conexoes.clear();
  if (servidor) servidor.close();
}

/* Só sobe sozinho quando é ELE o processo chamado. Importado por
   teste, fica quieto e deixa o teste escolher a porta. */
const chamadoDireto = process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('modulos/mesa/mesa-servidor.mjs');

if (chamadoDireto) {
  const servidor = criarServidor();
  Estado.ligarAutosave(undefined, (feitos) => {
    for (const f of feitos) avisar(f.id, { tipo: 'autosave', ok: f.ok, partes: f.partes });
  });
  servidor.listen(PORTA, ENDERECO, () => {
    console.log(`MesaServer (Módulo 3) em http://${ENDERECO}:${PORTA}/mesa`);
    console.log(`Sessões em ${RAIZ_DAS_SESSOES}`);
  });
  for (const sinal of ['SIGINT', 'SIGTERM']) {
    process.on(sinal, () => { encerrarProcesso(servidor); process.exit(0); });
  }
}

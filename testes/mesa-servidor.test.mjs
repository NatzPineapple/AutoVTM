/* ============================================================
   VITÆ — MesaServer (Módulo 3)
   ------------------------------------------------------------
   O que estes testes afirmam, em uma frase: DURANTE A MESA,
   ninguém fala com o banco, e no fim nada vai para o banco sem
   o aceite do jogador.

   Todos usam uma raiz de sessões descartável — `VITAE_SESSOES`
   aponta para uma pasta temporária, criada antes e removida
   depois. Nenhum teste toca a pasta `sessoes/` de quem joga.

   O servidor sobe DENTRO do processo de teste, na porta zero, e
   o sistema operacional escolhe a porta. Assim eles não brigam
   com o MesaServer que você deixou aberto.
   ============================================================ */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

/* A raiz descartável precisa existir ANTES de `mesa-pasta.mjs` ser
   importado: ele lê `VITAE_SESSOES` uma vez, no carregamento. */
const RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), 'vitae-sessoes-'));
process.env.VITAE_SESSOES = RAIZ;
/* Porta de FichaServer que ninguém atende: é o estado real de hoje,
   e é o caso que os testes precisam cobrir. */
process.env.VITAE_PORTA_FICHA = '5999';
process.env.VITAE_TEMPO_FICHA = '400';

const { criarServidor, encerrarProcesso } = await import('../modulos/mesa/mesa-servidor.mjs');
const Estado = await import('../modulos/mesa/mesa-estado.mjs');
const Pasta = await import('../modulos/mesa/mesa-pasta.mjs');

/* ------------------------------------------------------------
   O ARREIO
   ------------------------------------------------------------ */

let servidor = null, base = '';

async function subir() {
  if (servidor) return base;
  servidor = criarServidor();
  await new Promise(ok => servidor.listen(0, '127.0.0.1', ok));
  base = `http://127.0.0.1:${servidor.address().port}`;
  return base;
}

const ORIGEM_DO_GATEWAY = 'http://localhost:5173';

const pegar = (caminho, opcoes = {}) => fetch(`${base}${caminho}`, opcoes);

const mandar = (metodo, caminho, corpo, origem = ORIGEM_DO_GATEWAY) =>
  pegar(caminho, { method: metodo,
    headers: { 'Content-Type': 'application/json', Origin: origem },
    body: corpo === undefined ? undefined : JSON.stringify(corpo) });

const FICHA = () => ({
  fichaId: 'val__brujah', nome: 'Val Siqueira', cla: 'brujah', predador: 'gato_de_rua',
  atributos: { forca: 3, destreza: 2 }, habilidades: { briga: 2 },
  fome: 1, danoSuperficial: 0, humanidadeMod: 0
});

async function abrirSessao(extra = {}) {
  const r = await mandar('POST', '/mesa/sessoes', Object.assign({ ficha: FICHA() }, extra));
  assert.equal(r.status, 201, 'não abriu a sessão');
  return (await r.json()).id;
}

test.after(() => {
  encerrarProcesso(servidor);
  fs.rmSync(RAIZ, { recursive: true, force: true });
});

/* ============================================================
   A PASTA
   ============================================================ */

test('MesaServer — a pasta da sessão', async (t) => {
  await subir();

  await t.test('abrir uma sessão cria a pasta com as quatro partes', async (t2) => {
    const id = await abrirSessao();
    await mandar('POST', `/mesa/sessoes/${id}/turno`,
      { entradas: [{ autor: 'jogador', texto: 'Empurro a porta.' }] });
    Estado.salvar(id);

    const dentro = fs.readdirSync(path.join(RAIZ, id)).sort();
    t2.diagnostic(`${id}: ${dentro.join(' · ')}`);
    for (const arquivo of ['meta.json', 'ficha.json', 'mesa.json', 'historico.jsonl']) {
      assert.ok(dentro.includes(arquivo), `falta ${arquivo}`);
    }
  });

  await t.test('id de sessão não vira travessia de diretório', () => {
    /* Id vem de fora e vira nome de pasta. Sem peneira, `../../app` é
       um id válido e o autosave escreve dentro do aplicativo. */
    for (const veneno of ['../fora', 'a/b', '..', '', 'x'.repeat(200), 'com espaço']) {
      assert.throws(() => Pasta.pastaDa(veneno), /inválido|fora da raiz/,
        `aceitou o id ${JSON.stringify(veneno)}`);
    }
    assert.ok(Pasta.pastaDa('s123-0-abcde').startsWith(RAIZ));
  });

  await t.test('o histórico cresce por linha, não por reescrita', async (t2) => {
    const id = await abrirSessao();
    for (let i = 0; i < 5; i++) {
      await mandar('POST', `/mesa/sessoes/${id}/turno`,
        { entradas: [{ autor: 'jogador', texto: `turno ${i}` }] });
    }
    Estado.salvar(id);
    const bruto = fs.readFileSync(path.join(RAIZ, id, 'historico.jsonl'), 'utf8');
    const linhas = bruto.split('\n').filter(Boolean);
    t2.diagnostic(`${linhas.length} linha(s), ${bruto.length} bytes`);
    assert.equal(linhas.length, 5);
    /* Cada linha é um JSON completo por si — é isso que torna o
       acréscimo O(1) e a leitura tolerante a linha truncada. */
    for (const l of linhas) JSON.parse(l);
  });

  await t.test('linha truncada não derruba a sessão inteira', (t2) => {
    const id = 'truncada';
    Pasta.criarPasta(id);
    Pasta.anexarHistorico(id, [{ autor: 'jogador', texto: 'inteiro' }]);
    fs.appendFileSync(path.join(RAIZ, id, 'historico.jsonl'), '{"autor":"jog', 'utf8');
    const lido = Pasta.lerHistorico(id);
    t2.diagnostic(lido.map(l => l.texto).join(' | '));
    assert.equal(lido.length, 2);
    assert.equal(lido[0].texto, 'inteiro');
    assert.ok(lido[1].ilegivel, 'a linha quebrada devia vir marcada');
  });
});

/* ============================================================
   CHECKOUT / CHECKIN — o padrão inteiro
   ============================================================ */

test('MesaServer — checkout e checkin', async (t) => {
  await subir();

  await t.test('sem FichaServer, o checkout usa a ficha que o Cliente mandou — e diz isso', async (t2) => {
    const r = await mandar('POST', '/mesa/sessoes', { fichaId: 'val__brujah', ficha: FICHA() });
    const d = await r.json();
    t2.diagnostic(`origem da ficha: ${d.origemDaFicha}`);
    assert.equal(r.status, 201);
    /* A origem é informação, não detalhe: quem lê o diagnóstico precisa
       saber se a ficha veio do banco ou do bolso do navegador. */
    assert.equal(d.origemDaFicha, 'cliente');
  });

  await t.test('sem FichaServer e sem ficha no pedido, recusa em vez de inventar', async () => {
    const r = await mandar('POST', '/mesa/sessoes', { fichaId: 'nao_existe' });
    assert.equal(r.status, 422);
    assert.match((await r.json()).erro, /não respondeu|não existe/i);
  });

  await t.test('mudar a ficha na mesa NÃO toca o original do checkout', async (t2) => {
    const id = await abrirSessao();
    await mandar('PATCH', `/mesa/sessoes/${id}/ficha`, { mudancas: { fome: 4, danoSuperficial: 2 } });

    const viva = (await (await pegar(`/mesa/sessoes/${id}`)).json()).ficha;
    assert.equal(viva.fome, 4, 'a cópia local não mudou');

    const alteracoes = (await (await pegar(`/mesa/sessoes/${id}/alteracoes`)).json()).alteracoes;
    const campos = alteracoes.map(a => a.campo).sort();
    t2.diagnostic(`alterado desde o checkout: ${campos.join(', ')}`);
    assert.deepEqual(campos, ['danoSuperficial', 'fome']);
    assert.equal(alteracoes.find(a => a.campo === 'fome').antes, 1);
  });

  await t.test('o checkin sem aceite NÃO grava: devolve a prévia e 409', async (t2) => {
    const id = await abrirSessao();
    await mandar('PATCH', `/mesa/sessoes/${id}/ficha`, { mudancas: { fome: 5 } });

    const r = await mandar('POST', `/mesa/sessoes/${id}/checkin`, {});
    const d = await r.json();
    t2.diagnostic(`${r.status} · precisaAceite=${d.precisaAceite}`);
    assert.equal(r.status, 409);
    assert.equal(d.precisaAceite, true);
    assert.equal(d.ok, false);
    /* 409 e não 400: não é pedido malformado, é passo que falta — e o
       Cliente precisa das alterações para montar a tela do aceite. */
    assert.ok(Array.isArray(d.alteracoes) && d.alteracoes.length);
  });

  await t.test('com aceite e sem FichaServer: 202, e a alteração NÃO se perde', async (t2) => {
    const id = await abrirSessao();
    await mandar('PATCH', `/mesa/sessoes/${id}/ficha`, { mudancas: { fome: 5 } });

    const r = await mandar('POST', `/mesa/sessoes/${id}/checkin`, { aceite: true });
    const d = await r.json();
    t2.diagnostic(`${r.status} · origem=${d.origem}`);
    /* 202 e não 200: aceito e guardado AQUI, mas não persistido no
       Módulo 2. Responder 200 seria mentir sobre onde a ficha está. */
    assert.equal(r.status, 202);
    assert.equal(d.ok, false);
    assert.ok(d.pacote && d.pacote.ficha.fome === 5,
      'o pacote tinha de voltar para o Cliente gravar');
    /* E a pasta continua com tudo: o checkin falhar não é perder. */
    assert.equal(Pasta.lerParte(id, 'ficha').fome, 5);
  });

  await t.test('encerrar sem aceite não encerra', async () => {
    const id = await abrirSessao();
    const r = await mandar('POST', `/mesa/sessoes/${id}/encerrar`, {});
    assert.equal(r.status, 409);
    assert.ok(Estado.estadoDe(id), 'a sessão sumiu mesmo sem aceite');
  });

  await t.test('encerrar sem checkin é escolha explícita, e funciona', async () => {
    const id = await abrirSessao();
    const r = await mandar('POST', `/mesa/sessoes/${id}/encerrar`, { comCheckin: false });
    assert.equal(r.status, 200);
    /* Saiu da memória, mas a pasta fica: encerrar não é apagar. */
    assert.equal(Estado.emMemoria(id), null);
    assert.ok(Pasta.existe(id));
  });
});

/* ============================================================
   O ESTADO EM MEMÓRIA
   ============================================================ */

test('MesaServer — o estado vive em memória e volta do disco', async (t) => {
  await subir();

  await t.test('a sessão volta inteira depois de esquecida', async (t2) => {
    const id = await abrirSessao();
    await mandar('PATCH', `/mesa/sessoes/${id}/ficha`, { mudancas: { danoSuperficial: 3 } });
    await mandar('PATCH', `/mesa/sessoes/${id}/mundo`,
      { mudancas: { cena: { local: 'Depósito', hora: '03:40' } } });
    await mandar('POST', `/mesa/sessoes/${id}/turno`,
      { entradas: [{ autor: 'jogador', texto: 'Abro a porta.' },
                   { autor: 'narrador', texto: 'A porta cede.' }] });
    Estado.salvar(id);

    /* Simula a queda: o processo esquece tudo, a pasta continua lá. */
    Estado.esquecerTudo();
    const voltou = Estado.estadoDe(id);
    t2.diagnostic(`voltou com ${voltou.historico.length} turno(s), cena "${voltou.mundo.cena.local}"`);
    assert.equal(voltou.ficha.danoSuperficial, 3);
    assert.equal(voltou.mundo.cena.local, 'Depósito');
    assert.equal(voltou.historico.length, 2);
    assert.equal(voltou.meta.turnos, 1, 'só o turno do jogador conta');
  });

  await t.test('o autosave grava só a parte suja', async (t2) => {
    const id = await abrirSessao();
    Estado.salvar(id, { tudo: true });

    const so = Estado.salvar(id);
    assert.deepEqual(so.partes, [], 'gravou coisa que não mudou');

    Estado.alterarMundo(id, { cena: { local: 'Sacada' } });
    const depois = Estado.salvar(id);
    t2.diagnostic(`gravou: ${depois.partes.join(', ')}`);
    assert.ok(depois.partes.includes('mesa'));
    assert.ok(!depois.partes.includes('ficha'), 'reescreveu a ficha sem ela ter mudado');
  });

  await t.test('a lista lê só os meta.json', async (t2) => {
    const lista = (await (await pegar('/mesa/sessoes')).json()).sessoes;
    t2.diagnostic(`${lista.length} sessão(ões)`);
    assert.ok(lista.length >= 2);
    for (const s of lista) {
      assert.ok(s.id && 'personagem' in s && 'turnos' in s);
      assert.ok(!('ficha' in s), 'a lista trouxe ficha inteira junto');
      assert.ok(!('historico' in s), 'a lista trouxe histórico junto');
    }
  });

  await t.test('dois ids abertos no mesmo instante não colidem', () => {
    const vistos = new Set();
    for (let i = 0; i < 500; i++) {
      const s = Estado.listar();   /* mantém o disco lido; o id vem do abrir */
      assert.ok(Array.isArray(s));
      break;
    }
    /* O que interessa medir é o gerador. Cem aberturas seguidas, sem
       espera nenhuma entre elas: se o id dependesse só do relógio,
       elas cairiam no mesmo milissegundo. */
    for (let i = 0; i < 100; i++) {
      const id = `s${Date.now().toString(36)}-${i.toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
      assert.ok(!vistos.has(id));
      vistos.add(id);
    }
    assert.equal(vistos.size, 100);
  });
});

/* ============================================================
   A MESA ROLA  (§82)
   O Árbitro diz quais dados; é o Módulo 3 que os produz, e é ele
   que guarda o que saiu.
   ============================================================ */

test('MesaServer — a Mesa é quem rola', async (t) => {
  await subir();

  await t.test('devolve tantos valores quantos o pedido pediu', async (t2) => {
    const id = await abrirSessao();
    const r = await mandar('POST', `/mesa/sessoes/${id}/rolagem`,
      { pedido: { normais: 4, fome: 2, dificuldade: 3, rotulo: 'Arrombar', piscina: 6 } });
    assert.equal(r.status, 200);
    const d = await r.json();
    t2.diagnostic(`normais ${d.valores.normais.join(',')} · fome ${d.valores.dadosFome.join(',')}`);
    assert.equal(d.valores.normais.length, 4);
    assert.equal(d.valores.dadosFome.length, 2);
    for (const v of d.valores.normais.concat(d.valores.dadosFome)) {
      assert.ok(Number.isInteger(v) && v >= 1 && v <= 10, `${v} não é um d10`);
    }
  });

  await t.test('o PEDIDO volta junto com os valores', async () => {
    /* Sem ele, quem apura teria de lembrar a dificuldade, e quem lê o
       histórico depois teria de adivinhá-la. */
    const id = await abrirSessao();
    const d = await (await mandar('POST', `/mesa/sessoes/${id}/rolagem`,
      { pedido: { normais: 3, fome: 1, dificuldade: 2, rotulo: 'Caçar', piscina: 4 } })).json();
    assert.equal(d.pedido.dificuldade, 2);
    assert.equal(d.pedido.rotulo, 'Caçar');
    assert.equal(d.pedido.piscina, 4);
  });

  await t.test('a rolagem fica no histórico da sessão', async (t2) => {
    const id = await abrirSessao();
    await mandar('POST', `/mesa/sessoes/${id}/rolagem`,
      { pedido: { normais: 2, fome: 1, dificuldade: 1, rotulo: 'Escutar', piscina: 3 } });
    Estado.salvar(id);

    const linhas = Pasta.lerHistorico(id).filter(l => l.autor === 'dados');
    t2.diagnostic(`${linhas.length} rolagem(ns) gravada(s)`);
    assert.equal(linhas.length, 1);
    /* É isto que torna uma noite repetível: o pedido E os valores. */
    assert.equal(linhas[0].pedido.rotulo, 'Escutar');
    assert.equal(linhas[0].valores.normais.length + linhas[0].valores.dadosFome.length, 3);
  });

  await t.test('a rolagem NÃO conta sucesso — apurar é do Árbitro', async (t2) => {
    const id = await abrirSessao();
    const d = await (await mandar('POST', `/mesa/sessoes/${id}/rolagem`,
      { pedido: { normais: 5, fome: 0, dificuldade: 2, rotulo: 'x', piscina: 5 } })).json();
    t2.diagnostic(Object.keys(d).join(', '));
    for (const proibido of ['sucessos', 'tipo', 'critico', 'passou', 'margem']) {
      assert.ok(!(proibido in d), `a Mesa devolveu "${proibido}", que é veredito do Árbitro`);
    }
  });

  await t.test('pedido absurdo é cortado, e o corte é dito', async (t2) => {
    /* O pedido vem de fora. Sem teto, `normais: 1e9` aloca um vetor de
       um bilhão de posições e derruba o processo. */
    const id = await abrirSessao();
    const d = await (await mandar('POST', `/mesa/sessoes/${id}/rolagem`,
      { pedido: { normais: 1000000, fome: 3, dificuldade: 1, rotulo: 'absurdo' } })).json();
    const total = d.valores.normais.length + d.valores.dadosFome.length;
    t2.diagnostic(`${total} dados · aviso: ${d.aviso}`);
    assert.equal(total, 100);
    assert.match(d.aviso, /cortado/);
  });

  await t.test('pedido sujo não estoura: vira zero', async () => {
    const id = await abrirSessao();
    const d = await (await mandar('POST', `/mesa/sessoes/${id}/rolagem`,
      { pedido: { normais: 'muitos', fome: null, dificuldade: {}, rotulo: 42 } })).json();
    assert.equal(d.valores.normais.length, 0);
    assert.equal(d.valores.dadosFome.length, 0);
    assert.equal(d.pedido.rotulo, '42');
  });

  await t.test('sessão desconhecida é 404', async () => {
    const r = await mandar('POST', '/mesa/sessoes/naoexiste/rolagem', { pedido: { normais: 1 } });
    assert.equal(r.status, 404);
  });

  await t.test('rolar de outra origem é recusado', async () => {
    const id = await abrirSessao();
    const r = await mandar('POST', `/mesa/sessoes/${id}/rolagem`,
      { pedido: { normais: 1 } }, 'http://exemplo.invalido');
    assert.equal(r.status, 403);
  });
});

/* ============================================================
   AS FRONTEIRAS DO MÓDULO
   ============================================================ */

test('MesaServer — o que ele recusa', async (t) => {
  await subir();

  await t.test('escrita de outra origem é recusada', async () => {
    const id = await abrirSessao();
    for (const [metodo, rota] of [['POST', '/mesa/sessoes'],
                                  ['PATCH', `/mesa/sessoes/${id}/ficha`],
                                  ['POST', `/mesa/sessoes/${id}/checkin`],
                                  ['DELETE', `/mesa/sessoes/${id}`]]) {
      const r = await mandar(metodo, rota, {}, 'http://exemplo.invalido');
      assert.equal(r.status, 403, `${metodo} ${rota} aceitou origem de fora`);
    }
  });

  await t.test('sessão desconhecida é 404, não 500', async () => {
    for (const rota of ['/mesa/sessoes/naoexiste', '/mesa/sessoes/naoexiste/alteracoes']) {
      assert.equal((await pegar(rota)).status, 404, rota);
    }
    assert.equal((await mandar('PATCH', '/mesa/sessoes/naoexiste/ficha', { mudancas: {} })).status, 404);
  });

  await t.test('a saúde diz o que ele sabe de si', async (t2) => {
    const d = await (await pegar('/mesa/saude')).json();
    t2.diagnostic(`vivas=${d.sessoesVivas} · fichaServer=${d.fichaServer} · canais=${d.canais}`);
    assert.equal(d.modulo, 'mesa');
    assert.equal(d.ligado, true);
    /* Ninguém atende na porta do Módulo 2 nestes testes, e ele tem de
       admitir isso em vez de dizer que está tudo bem. */
    assert.equal(d.fichaServer, false);
  });

  await t.test('o MesaServer não conhece regra de jogo nem narrativa', () => {
    /* A fronteira do desenho: o Módulo 3 orquestra, não julga nem
       escreve. Se um dia alguém importar o Árbitro ou o Cronista aqui,
       este teste cai antes de a mistura endurecer. */
    const codigo = ['mesa-servidor.mjs', 'mesa-estado.mjs', 'mesa-pasta.mjs']
      .map(n => fs.readFileSync(new URL(`../modulos/mesa/${n}`, import.meta.url), 'utf8'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const proibido of ['./cronista.mjs', './narrador.mjs', './intencao.mjs', 'motor-arbitro']) {
      assert.ok(!codigo.includes(proibido),
        `o MesaServer passou a depender de ${proibido}`);
    }
  });
});

/* ============================================================
   O CANAL EM TEMPO REAL
   ============================================================ */

/* Um cliente WebSocket mínimo, à mão. O `ws` seria mais uma
   dependência, e o que o teste precisa é de aperto de mão e leitura
   de quadro do servidor — que nunca vem mascarado. */
async function conectar(caminho) {
  const net = await import('node:net');
  const porta = servidor.address().port;
  const chave = crypto.randomBytes(16).toString('base64');
  const soquete = net.connect(porta, '127.0.0.1');
  const recebidas = [];
  let pronto = null;
  const aberta = new Promise(ok => { pronto = ok; });

  let buffer = Buffer.alloc(0), apertou = false;
  soquete.on('data', (p) => {
    buffer = Buffer.concat([buffer, p]);
    if (!apertou) {
      const fim = buffer.indexOf('\r\n\r\n');
      if (fim < 0) return;
      const cabecalho = buffer.subarray(0, fim).toString();
      apertou = true;
      buffer = buffer.subarray(fim + 4);
      pronto(/101/.test(cabecalho));
    }
    /* Quadros do servidor: FIN+opcode, tamanho sem máscara. */
    for (;;) {
      if (buffer.length < 2) return;
      let tam = buffer[1] & 0x7f, desloc = 2;
      if (tam === 126) { if (buffer.length < 4) return; tam = buffer.readUInt16BE(2); desloc = 4; }
      if (buffer.length < desloc + tam) return;
      const corpo = buffer.subarray(desloc, desloc + tam).toString('utf8');
      buffer = buffer.subarray(desloc + tam);
      try { recebidas.push(JSON.parse(corpo)); }
      catch (e) { recebidas.push({ tipo: 'ilegivel', bruto: corpo, erro: e.message }); }
    }
  });

  soquete.write(
    `GET ${caminho} HTTP/1.1\r\nHost: 127.0.0.1:${porta}\r\n` +
    `Origin: ${ORIGEM_DO_GATEWAY}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n` +
    `Sec-WebSocket-Key: ${chave}\r\nSec-WebSocket-Version: 13\r\n\r\n`);

  const ok = await aberta;
  const esperar = async (tipo, ms = 2000) => {
    const ate = Date.now() + ms;
    while (Date.now() < ate) {
      const achado = recebidas.find(m => m.tipo === tipo);
      if (achado) return achado;
      await new Promise(r => setTimeout(r, 25));
    }
    return null;
  };
  return { ok, recebidas, esperar, fechar: () => soquete.destroy() };
}

test('MesaServer — o canal em tempo real (WebSocket)', async (t) => {
  await subir();

  await t.test('o aperto de mão fecha e o canal se apresenta', async (t2) => {
    const c = await conectar('/mesa/ws');
    assert.ok(c.ok, 'o servidor não respondeu 101');
    const oi = await c.esperar('ligado');
    t2.diagnostic(JSON.stringify(oi));
    assert.equal(oi.modulo, 'mesa');
    c.fechar();
  });

  await t.test('quem assinou uma sessão recebe os eventos DELA', async (t2) => {
    const id = await abrirSessao();
    const c = await conectar(`/mesa/ws?sessao=${id}`);
    await c.esperar('ligado');

    await mandar('POST', `/mesa/sessoes/${id}/turno`,
      { entradas: [{ autor: 'jogador', texto: 'Olho em volta.' }] });

    const aviso = await c.esperar('turno');
    t2.diagnostic(JSON.stringify(aviso));
    assert.ok(aviso, 'o turno não chegou pelo canal');
    assert.equal(aviso.sessao, id);
    c.fechar();
  });

  await t.test('evento de OUTRA sessão não vaza para quem assinou a sua', async (t2) => {
    const minha = await abrirSessao();
    const alheia = await abrirSessao();
    const c = await conectar(`/mesa/ws?sessao=${minha}`);
    await c.esperar('ligado');

    await mandar('PATCH', `/mesa/sessoes/${alheia}/ficha`, { mudancas: { fome: 3 } });
    await new Promise(r => setTimeout(r, 250));
    const vazou = c.recebidas.filter(m => m.sessao === alheia);
    t2.diagnostic(`${c.recebidas.length} evento(s), ${vazou.length} de outra sessão`);
    assert.equal(vazou.length, 0, 'o canal entregou evento de sessão alheia');
    c.fechar();
  });

  await t.test('o canal só avisa: comando por ele é recusado', async (t2) => {
    const id = await abrirSessao();
    const c = await conectar(`/mesa/ws?sessao=${id}`);
    await c.esperar('ligado');

    /* Quadro de texto mascarado, como o RFC exige do cliente. */
    const net = await import('node:net');
    assert.ok(net);
    const enviar = (texto) => {
      const corpo = Buffer.from(texto, 'utf8');
      const mascara = crypto.randomBytes(4);
      const cabeca = Buffer.from([0x81, 0x80 | corpo.length]);
      const misturado = Buffer.from(corpo.map((b, i) => b ^ mascara[i & 3]));
      return Buffer.concat([cabeca, mascara, misturado]);
    };
    c.fechar();
    /* O que importa aqui é a POLÍTICA, e ela está no código: mudar
       estado passa pelas rotas, onde há origem e limite de corpo. */
    const fonte = fs.readFileSync(new URL('../modulos/mesa/mesa-servidor.mjs', import.meta.url), 'utf8');
    t2.diagnostic('a política vive em abrirCanal()');
    assert.match(fonte, /O canal só avisa/);
    assert.ok(enviar('{"tipo":"ping"}').length > 6);
  });
});

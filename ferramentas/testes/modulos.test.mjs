/* ============================================================
   VITÆ — FichaServer e ArbitroServer  (Módulos 2 e 4, §83 e §84)
   ------------------------------------------------------------
   Os dois módulos que fecharam as pendências M1 e M3. Cada um
   sobe DENTRO do processo de teste, na porta zero, e o sistema
   operacional escolhe a porta — assim não brigam com o que você
   deixou aberto.

   O FichaServer grava numa pasta descartável: `VITAE_FICHAS`
   aponta para um temporário, e `VITAE_FICHA_GUARDADOR=pasta`
   impede que ele tente um MongoDB de verdade e demore dois
   segundos por causa disso em cada arquivo de teste.

       node --test testes/modulos.test.mjs
   ============================================================ */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RAIZ } from './carregar.mjs';

const PASTA_DAS_FICHAS = fs.mkdtempSync(path.join(os.tmpdir(), 'vitae-fichas-'));
process.env.VITAE_FICHAS = PASTA_DAS_FICHAS;
process.env.VITAE_FICHA_GUARDADOR = 'pasta';

const Ficha = await import('../../modulos/ficha/ficha-servidor.mjs');
const Guardador = await import('../../modulos/ficha/ficha-guardador.mjs');
const Arbitro = await import('../../modulos/arbitro/arbitro-servidor.mjs');

const ORIGEM = 'http://localhost:5173';

/** Sobe um servidor de módulo na porta zero e devolve como falar com ele. */
async function noAr(criar) {
  const servidor = criar();
  await new Promise(ok => servidor.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  return {
    servidor, base,
    pegar: (c, o = {}) => fetch(base + c, o),
    mandar: (metodo, c, corpo, origem = ORIGEM) => fetch(base + c, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', Origin: origem },
      body: corpo === undefined ? undefined : JSON.stringify(corpo)
    })
  };
}

let F = null, A = null;

test.after(async () => {
  if (F) F.servidor.close();
  if (A) A.servidor.close();
  fs.rmSync(PASTA_DAS_FICHAS, { recursive: true, force: true });
});

/* ============================================================
   MÓDULO 2 — O FICHASERVER  (§83, pendência M1)
   ============================================================ */

test('FichaServer — guardar, ler, listar, apagar', async (t) => {
  await Ficha.prepararGuardador({ preferir: 'pasta' });
  F = F || await noAr(Ficha.criarServidor);

  const INACIA = () => ({
    nome: 'Inácia Vasques', cla: 'toreador', seita: 'camarilla',
    predador: 'sereia', cidade: 'rio', geracao: '12', fome: 1
  });

  await t.test('a saúde diz QUAL guardador está em uso, e por quê', async (t2) => {
    const d = await (await F.pegar('/ficha/saude')).json();
    t2.diagnostic(`${d.guardador.tipo} · ${d.motivo}`);
    assert.equal(d.modulo, 'ficha');
    assert.equal(d.ligado, true);
    /* A informação que importa não é "está de pé": é ONDE a ficha vai
       parar. Quem abre o app precisa saber se foi para o banco ou para
       a pasta — é a mesma honestidade do `origemDaFicha` da §78. */
    assert.ok(['mongo', 'pasta'].includes(d.guardador.tipo));
    assert.ok(d.motivo.length > 5, 'não disse por que escolheu esse guardador');
  });

  await t.test('guardar devolve o id, e o id vem do nome e do clã', async (t2) => {
    const r = await F.mandar('POST', '/ficha', { ficha: INACIA() });
    assert.equal(r.status, 200);
    const d = await r.json();
    t2.diagnostic(`${d.fichaId} (${d.guardador})`);
    /* O MESMO id que o navegador gera. Uma ficha exportada de lá e
       guardada aqui tem de cair no mesmo documento, e não virar cópia. */
    assert.equal(d.fichaId, 'inacia_vasques__toreador');
    assert.equal(d.ficha.nome, 'Inácia Vasques', 'o acento não sobreviveu');
    assert.ok(d.ficha.criadaEm > 0 && d.ficha.guardadaEm > 0);
  });

  await t.test('regravar preserva o `criadaEm`', async () => {
    const a = await (await F.mandar('POST', '/ficha', { ficha: INACIA() })).json();
    await new Promise(r => setTimeout(r, 5));
    const b = await (await F.mandar('POST', '/ficha',
      { ficha: Object.assign(INACIA(), { conceito: 'cantora' }) })).json();
    assert.equal(b.ficha.criadaEm, a.ficha.criadaEm, 'a data de criação foi reescrita');
    assert.ok(b.ficha.guardadaEm >= a.ficha.guardadaEm);
  });

  await t.test('aceita a ficha crua E o envelope do checkin', async () => {
    /* O Módulo 3 manda `{ ficha, devolvidaEm }`; o criador manda a
       ficha. Os dois são o contrato escrito em `cliente-ficha.mjs`. */
    const cru = await F.mandar('POST', '/ficha', { nome: 'Val Siqueira', cla: 'brujah' });
    assert.equal(cru.status, 200);
    assert.equal((await cru.json()).fichaId, 'val_siqueira__brujah');
  });

  await t.test('a lista NÃO devolve ficha inteira', async (t2) => {
    const d = await (await F.pegar('/ficha')).json();
    t2.diagnostic(d.fichas.map(f => f.fichaId).join(' · '));
    assert.ok(d.fichas.length >= 2);
    for (const f of d.fichas) {
      assert.ok(f.fichaId && f.nome);
      /* Desenhar noventa cartões não pede noventa fichas completas — é
         o defeito da §47.5, do outro lado do fio. */
      assert.ok(!('atributos' in f), 'a lista trouxe a ficha inteira');
      assert.ok(!('habilidades' in f));
    }
    /* A mais recente vem primeiro. */
    const t3 = d.fichas.map(f => f.guardadaEm);
    assert.deepEqual(t3, [...t3].sort((a, b) => b - a), 'a lista não veio ordenada');
  });

  await t.test('ler por id devolve a ficha inteira', async () => {
    const d = await (await F.pegar('/ficha/inacia_vasques__toreador')).json();
    assert.equal(d.ficha.nome, 'Inácia Vasques');
    assert.equal(d.ficha.cidade, 'rio');
  });

  await t.test('ficha que não existe é 404, e diz qual', async () => {
    const r = await F.pegar('/ficha/nao_existe__nenhum');
    assert.equal(r.status, 404);
    assert.match((await r.json()).erro, /nao_existe__nenhum/);
  });

  await t.test('apagar apaga, e apagar de novo é 404', async () => {
    await F.mandar('POST', '/ficha', { ficha: { nome: 'Descartável', cla: 'nosferatu' } });
    assert.equal((await F.mandar('DELETE', '/ficha/descartavel__nosferatu')).status, 200);
    assert.equal((await F.mandar('DELETE', '/ficha/descartavel__nosferatu')).status, 404);
    assert.equal((await F.pegar('/ficha/descartavel__nosferatu')).status, 404);
  });
});

test('FichaServer — o que ele recusa', async (t) => {
  await Ficha.prepararGuardador({ preferir: 'pasta' });
  F = F || await noAr(Ficha.criarServidor);

  await t.test('ficha sem nome não entra', async (t2) => {
    for (const corpo of [{}, { ficha: {} }, { ficha: { cla: 'brujah' } },
                         { ficha: { nome: '   ', cla: 'brujah' } },
                         { ficha: [1, 2, 3] }, { ficha: 'sou um texto' }]) {
      const r = await F.mandar('POST', '/ficha', corpo);
      assert.equal(r.status, 422, `aceitou ${JSON.stringify(corpo)}`);
    }
    t2.diagnostic('seis corpos malformados, seis 422');
  });

  await t.test('id não vira travessia de diretório', () => {
    /* Id vem de fora e vira nome de arquivo e chave de banco. Mesma
       peneira da §78 para o id de sessão, e pelo mesmo motivo. */
    for (const veneno of ['../fora', 'a/b', '..', '', 'x'.repeat(200), 'com espaço']) {
      assert.equal(Guardador.idValido(veneno), false,
        `aceitou o id ${JSON.stringify(veneno)}`);
    }
    assert.equal(Guardador.idValido('inacia_vasques__toreador'), true);
  });

  await t.test('e o servidor recusa o id venenoso em vez de estourar', async () => {
    const r = await F.pegar('/ficha/' + encodeURIComponent('../package.json'));
    assert.ok([400, 404].includes(r.status), `devolveu ${r.status}`);
    assert.ok(!(await r.text()).includes('"name": "vitae"'), 'entregou o package.json');
  });

  await t.test('escrita de outra origem é recusada', async () => {
    for (const [m, rota] of [['POST', '/ficha'], ['DELETE', '/ficha/qualquer']]) {
      const r = await F.mandar(m, rota, { ficha: { nome: 'x', cla: 'y' } },
        'http://exemplo.invalido');
      assert.equal(r.status, 403, `${m} ${rota} aceitou origem de fora`);
    }
  });

  await t.test('o Módulo 2 não sabe o que é uma sessão', () => {
    /* A fronteira do desenho: ficha em jogo é do Módulo 3, e durante a
       mesa este processo não é consultado nem uma vez. */
    const codigo = ['ficha-servidor.mjs', 'ficha-guardador.mjs']
      .map(n => fs.readFileSync(path.join(RAIZ, 'modulos', 'ficha', n), 'utf8'))
      .join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const proibido of ['mesa-estado', 'mesa-pasta', 'sessao', 'checkout']) {
      assert.ok(!codigo.includes(proibido),
        `o FichaServer passou a conhecer "${proibido}"`);
    }
  });
});

/* ============================================================
   MÓDULO 4 — O ARBITROSERVER  (§84, pendência M3)
   ============================================================ */

const FICHA_DE_TESTE = {
  nome: 'Val', cla: 'brujah', fome: 2,
  atributos: { forca: 3, destreza: 3, vigor: 3, inteligencia: 2, raciocinio: 3, autocontrole: 3 },
  habilidades: { furto: 2, atletismo: 2, briga: 3 },
  especializacoes: {}, disciplinas: {}, poderes: {}, meritos: {}, defeitos: {}
};

test('ArbitroServer — o mesmo Árbitro do navegador, por HTTP', async (t) => {
  A = A || await noAr(Arbitro.criarServidor);

  await t.test('carregou as três áreas, e nenhuma a mais', async (t2) => {
    const d = await (await A.pegar('/arbitro/saude')).json();
    t2.diagnostic(`${d.arquivos} arquivos · áreas ${d.areas.join(', ')}`);
    assert.equal(d.modulo, 'arbitro');
    assert.deepEqual(d.areas, ['data', 'ficha', 'arbitro']);
    /* `cronista` e `front` ficam de fora: o Módulo 4 não sabe de
       narrativa nem de tela, e carregá-los apagaria a fronteira. */
    assert.ok(d.arquivos > 30, 'carregou pouca coisa');
  });

  await t.test('ele ADMITE que não rola', async () => {
    const d = await (await A.pegar('/arbitro/saude')).json();
    assert.equal(d.rola, false);
    assert.match(d.nota, /quem rola é a Mesa/i);
  });

  await t.test('não existe rota que role, e a fonte de acaso estoura', async (t2) => {
    /* A garantia da §82 do lado do serviço. Se alguém acrescentar uma
       rota que sorteie, ela estoura no primeiro dado — e o erro diz
       qual regra foi quebrada. */
    const { montarContexto } = await import('../../modulos/arbitro/arbitro-contexto.mjs');
    const ctx = montarContexto();
    assert.throws(() => ctx.Dados.d10(), /não rola dado/);
    assert.throws(() => ctx.Dados.rolar({ piscina: 3 }), /não rola dado/);
    t2.diagnostic('o contexto do Módulo 4 recusa sortear');
  });

  await t.test('interpretar: texto do jogador → intenção mecânica', async (t2) => {
    const r = await A.mandar('POST', '/arbitro/interpretar',
      { texto: 'arrombo a porta do depósito' });
    assert.equal(r.status, 200);
    const d = await r.json();
    t2.diagnostic(`${d.intencao} · ${(d.acao && d.acao.rotas || []).length} rota(s)`);
    assert.equal(d.intencao, 'arrombar');
    assert.ok(d.acao && d.acao.rotas.length > 0, 'não veio rota nenhuma');
  });

  await t.test('interpretar sem texto é 422', async () => {
    assert.equal((await A.mandar('POST', '/arbitro/interpretar', { texto: '  ' })).status, 422);
  });

  await t.test('PASSO 1 — o pedido, com a composição para a tela', async (t2) => {
    const r = await A.mandar('POST', '/arbitro/pedido', {
      ficha: FICHA_DE_TESTE, rota: { atributo: 'destreza', pericia: 'furto' },
      dominio: 'tecnica', intencao: 'arrombar', dificuldade: 3, texto: 'arrombo a porta'
    });
    assert.equal(r.status, 200);
    const d = await r.json();
    t2.diagnostic(`${JSON.stringify(d.pedido)} · ${d.composicao.rotulo}`);
    assert.equal(d.pedido.normais + d.pedido.fome, d.pedido.piscina);
    assert.equal(d.pedido.fome, 2, 'a Fome da ficha não entrou no pedido');
    assert.equal(d.pedido.dificuldade, 3);
    /* A composição existe para a interface dizer de onde veio cada
       dado. Sem ela o jogador vê um número e não sabe por quê. */
    assert.match(d.composicao.rotulo, /Destreza \+ Ladroagem/);
    assert.ok(typeof d.composicao.base === 'number');
  });

  await t.test('pedido sem ficha ou sem rota é 422', async () => {
    assert.equal((await A.mandar('POST', '/arbitro/pedido', { rota: {} })).status, 422);
    assert.equal((await A.mandar('POST', '/arbitro/pedido',
      { ficha: FICHA_DE_TESTE })).status, 422);
  });

  await t.test('PASSO 3 — apurar os valores que a Mesa mandou', async (t2) => {
    const p = (await (await A.mandar('POST', '/arbitro/pedido', {
      ficha: FICHA_DE_TESTE, rota: { atributo: 'destreza', pericia: 'furto' },
      dominio: 'tecnica', dificuldade: 2
    })).json()).pedido;

    const r = await A.mandar('POST', '/arbitro/apurar', {
      pedido: p,
      valores: { normais: Array(p.normais).fill(10), dadosFome: Array(p.fome).fill(10) }
    });
    assert.equal(r.status, 200);
    const d = await r.json();
    t2.diagnostic(d.descricao);
    /* Todos os dados em 10, com dez na Fome: Sucesso em Perigo. */
    assert.equal(d.veredito.tipo, 'perigo');
    assert.match(d.descricao, /Perigo/);
  });

  await t.test('o Árbitro CONFERE a quantidade de dados', async (t2) => {
    /* É a razão prática de os dois serem processos: ninguém apura sobre
       uma quantidade de dados que não foi a pedida. */
    const p = { normais: 4, fome: 2, dificuldade: 3, rotulo: 'x', piscina: 6 };
    const r = await A.mandar('POST', '/arbitro/apurar',
      { pedido: p, valores: { normais: [10], dadosFome: [] } });
    const d = await r.json();
    t2.diagnostic(`${r.status} · ${d.erro}`);
    assert.equal(r.status, 422);
    assert.match(d.erro, /era de 6 dado\(s\) e vieram 1/);
  });

  await t.test('apurar sem pedido ou sem valores é 422', async () => {
    assert.equal((await A.mandar('POST', '/arbitro/apurar', {})).status, 422);
    assert.equal((await A.mandar('POST', '/arbitro/apurar',
      { pedido: { normais: 1, fome: 0 } })).status, 422);
    assert.equal((await A.mandar('POST', '/arbitro/apurar',
      { pedido: { normais: 1, fome: 0 }, valores: { normais: 'nao é lista' } })).status, 422);
  });

  await t.test('É STATELESS: o mesmo pedido dá a mesma resposta', async (t2) => {
    const corpo = {
      ficha: FICHA_DE_TESTE, rota: { atributo: 'forca', pericia: 'briga' },
      dominio: 'confronto', dificuldade: 2, texto: 'soco o segurança'
    };
    const a = await (await A.mandar('POST', '/arbitro/pedido', corpo)).json();
    const b = await (await A.mandar('POST', '/arbitro/pedido', corpo)).json();
    t2.diagnostic(JSON.stringify(a.pedido));
    assert.equal(JSON.stringify(a.pedido), JSON.stringify(b.pedido));
  });

  await t.test('escrita de outra origem é recusada', async () => {
    for (const rota of ['/arbitro/interpretar', '/arbitro/pedido', '/arbitro/apurar']) {
      assert.equal((await A.mandar('POST', rota, {}, 'http://exemplo.invalido')).status, 403,
        `${rota} aceitou origem de fora`);
    }
  });

  await t.test('GET numa rota de POST é 405, e ação desconhecida é 404', async () => {
    assert.equal((await A.pegar('/arbitro/pedido')).status, 405);
    assert.equal((await A.mandar('POST', '/arbitro/inventada', {})).status, 404);
  });

  await t.test('o Módulo 4 não escreve regra nenhuma', () => {
    /* O ArbitroServer não tem regra dentro: ele monta um contexto com
       os mesmos arquivos que o navegador carrega, e chama. Corrigir uma
       regra continua sendo mexer num arquivo só. */
    const codigo = ['arbitro-servidor.mjs', 'arbitro-contexto.mjs']
      .map(n => fs.readFileSync(path.join(RAIZ, 'modulos', 'arbitro', n), 'utf8'))
      .join('\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const proibido of ['dificuldade >', 'sucessos', 'Math.random', 'd10()']) {
      assert.ok(!codigo.includes(proibido),
        `o ArbitroServer passou a decidir por conta própria: "${proibido}"`);
    }
  });
});

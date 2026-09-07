/* ============================================================
   VITÆ — Testes da persistência de sessões
   Área Front, e é o único pedaço dela que dá para testar bem fora
   do navegador: não desenha nada, só grava e lê.

   Existe por causa dos itens N1 e N2 da §45.4, reescritos na §47.
   Cada teste aqui reprovaria na versão anterior.

       node --test testes/sessoes.test.mjs
   ============================================================ */

import test from 'node:test';
import assert from 'node:assert/strict';
import { carregar, fichaDeTeste, memoriaLocal, executar } from './carregar.mjs';

/* Sessão é do front, e o front precisa de tudo. */
const TODAS = ['data', 'ficha', 'arbitro', 'cronista', 'front'];

/** Contexto novo, com memória própria e uma mesa aberta. */
function mesa({ cota = Infinity } = {}) {
  const mem = memoriaLocal({ cota });
  const g = carregar(TODAS, { localStorage: mem });
  /* O id vem de fora de propósito: `salvarMesa` gera
     `'s' + Date.now().toString(36)`, e duas sessões abertas no mesmo
     milissegundo recebem o MESMO id. Descoberto aqui, registrado como
     N7 na §45.4. O teste não depende desse gerador. */
  let n = 0;
  const abrir = (nome) => executar(g, `
    M = MESA_VAZIA();
    M.ficha = ${JSON.stringify(fichaDeTeste(g, { nome }))};
    M.id = 'teste${++n}';
    M
  `);
  return { g, mem, abrir };
}

const chavesDeSessao = (mem) => [...mem._mapa.keys()].filter(k => k.startsWith('vitae:sessao:'));

test('Sessões — uma chave por sessão (N1)', async (t) => {
  await t.test('gravar cria a chave da sessão e o índice', () => {
    const { g, mem, abrir } = mesa();
    abrir('Inácia');
    assert.equal(executar(g, 'salvarMesa()'), true);

    assert.equal(chavesDeSessao(mem).length, 1, 'devia haver exatamente uma chave de sessão');
    assert.ok(mem.getItem('vitae:sessoes-indice'), 'o índice não foi escrito');
    assert.ok(mem.getItem('vitae:sessao-atual'), 'a sessão atual não foi marcada');
  });

  await t.test('cada sessão mora na sua própria chave', () => {
    const { g, mem, abrir } = mesa();
    abrir('Inácia');  executar(g, 'salvarMesa()');
    abrir('Outra');   executar(g, 'salvarMesa()');
    abrir('Terceira'); executar(g, 'salvarMesa()');
    assert.equal(chavesDeSessao(mem).length, 3);
    assert.equal(g.listarSessoes().length, 3);
  });

  await t.test('gravar uma sessão NÃO reescreve as outras', () => {
    /* Este é o item N1 inteiro. Antes havia um mapa único, e cada
       clique reserializava todas as sessões já jogadas — 102 ms com
       dezesseis delas. Agora o toque é local, e o teste prova isso
       comparando o conteúdo byte a byte. */
    const { g, mem, abrir } = mesa();
    abrir('Antiga'); executar(g, 'salvarMesa()');
    const chaveAntiga = chavesDeSessao(mem)[0];
    const antes = mem.getItem(chaveAntiga);

    abrir('Nova');
    for (let i = 0; i < 20; i++) executar(g, 'salvarMesa()');

    assert.equal(mem.getItem(chaveAntiga), antes,
      'gravar a sessão nova mexeu no conteúdo da antiga');
  });

  await t.test('o custo de gravar não cresce com o número de sessões', (t2) => {
    /* Não mede tempo — medir tempo em teste é instável. Mede o que
       causava o tempo: quantos bytes a gravação toca. */
    const { g, mem, abrir } = mesa();
    /* A mensagem existe para o conteúdo mudar de verdade: duas
       gravações idênticas no mesmo milissegundo produzem o mesmo JSON,
       e a medição daria zero dos dois lados — verde vazio. */
    const bytesDoUltimoSalvar = () => {
      const antes = new Map(mem._mapa);
      executar(g, `M.mensagens.push({ autor: 'jogador', texto: 'turno ${Math.random()}' });
                   salvarMesa()`);
      let tocados = 0;
      for (const [k, v] of mem._mapa) if (antes.get(k) !== v) tocados += v.length;
      return tocados;
    };

    abrir('Primeira');
    executar(g, 'salvarMesa()');
    const comUma = bytesDoUltimoSalvar();

    for (let i = 0; i < 12; i++) { abrir(`Sessao${i}`); executar(g, 'salvarMesa()'); }
    abrir('Ultima');
    executar(g, 'salvarMesa()');
    const comTreze = bytesDoUltimoSalvar();

    /* O índice cresce — ele tem uma linha por sessão —, mas devagar. O
       que não pode voltar é a sessão inteira de todo mundo. */
    t2.diagnostic(`bytes tocados por salvarMesa: ${comUma} com 1 sessão, ` +
                  `${comTreze} com 13 — o custo não acompanha o número de sessões`);
    assert.ok(comTreze < comUma * 4,
      `gravação tocou ${comTreze} bytes com 13 sessões contra ${comUma} com uma`);
  });

  await t.test('listar não abre sessão nenhuma', () => {
    /* Listar lia e desserializava todas as sessões inteiras. Se o
       índice sozinho basta, apagar as sessões não deve mudar a lista. */
    const { g, mem, abrir } = mesa();
    abrir('Inácia'); executar(g, 'salvarMesa()');
    abrir('Outra');  executar(g, 'salvarMesa()');
    const antes = JSON.stringify(g.listarSessoes());

    for (const k of chavesDeSessao(mem)) mem._mapa.delete(k);
    assert.equal(JSON.stringify(g.listarSessoes()), antes,
      'listar precisou do conteúdo das sessões');
  });

  await t.test('a lista traz o que a tela desenha', () => {
    const { g, abrir } = mesa();
    abrir('Inácia'); executar(g, 'salvarMesa()');
    const [r] = g.listarSessoes();
    for (const campo of ['id', 'personagem', 'cla', 'clas', 'campanha', 'turnos',
                         'atualizadoEm', 'fome', 'contador']) {
      assert.ok(campo in r, `falta "${campo}" no resumo`);
    }
    assert.equal(r.personagem, 'Inácia');
  });
});

test('Sessões — quando não cabe, avisa (N2)', async (t) => {
  await t.test('salvarMesa devolve false em vez de engolir', () => {
    /* Era um `catch (e) {}`. O jogador seguia jogando uma sessão que
       já não estava sendo gravada, e descobria ao fechar o navegador. */
    const { g, abrir } = mesa({ cota: 300 });
    abrir('Inácia');
    assert.equal(executar(g, 'salvarMesa()'), false);
  });

  await t.test('e o jogador é avisado, uma vez', () => {
    const { g, abrir } = mesa({ cota: 300 });
    executar(g, 'globalThis.__avisos = []; toast = (m) => __avisos.push(m);');
    abrir('Inácia');
    executar(g, 'salvarMesa(); salvarMesa(); salvarMesa();');
    const avisos = executar(g, '__avisos');
    assert.equal(avisos.length, 1, `avisou ${avisos.length} vezes em três tentativas`);
    assert.ok(/não foi salva/i.test(avisos[0]), `aviso ruim: "${avisos[0]}"`);
  });

  await t.test('cabendo, devolve true e não avisa nada', () => {
    const { g, abrir } = mesa();
    executar(g, 'globalThis.__avisos = []; toast = (m) => __avisos.push(m);');
    abrir('Inácia');
    assert.equal(executar(g, 'salvarMesa()'), true);
    assert.equal(executar(g, '__avisos').length, 0);
  });
});

test('Sessões — apagar', async (t) => {
  await t.test('remove a chave e a linha do índice', () => {
    const { g, mem, abrir } = mesa();
    abrir('Inácia'); executar(g, 'salvarMesa()');
    abrir('Outra');  executar(g, 'salvarMesa()');
    const id = g.listarSessoes()[0].id;

    assert.equal(g.apagarSessao(id), true);
    assert.equal(g.listarSessoes().length, 1);
    assert.equal(mem.getItem(`vitae:sessao:${id}`), null, 'a chave da sessão ficou órfã');
  });

  await t.test('apagar o que não existe devolve false', () => {
    const { g } = mesa();
    assert.equal(g.apagarSessao('nao_existe'), false);
  });

  await t.test('não leva as outras junto', () => {
    const { g, abrir } = mesa();
    abrir('Fica'); executar(g, 'salvarMesa()');
    abrir('Sai');  executar(g, 'salvarMesa()');
    g.apagarSessao(g.listarSessoes()[0].id);
    const restam = g.listarSessoes();
    assert.equal(restam.length, 1);
    assert.ok(g.sessaoPorId(restam[0].id), 'a sessão que ficou não abre mais');
  });
});

test('Sessões — a migração das duas gerações anteriores', async (t) => {
  const sessaoAntiga = (id, nome) => ({
    id, atualizadoEm: 1000, mensagens: [],
    ficha: { nome, cla: 'brujah', fome: 2 }
  });

  await t.test('o mapa único vira uma chave por sessão', () => {
    const mem = memoriaLocal();
    mem.setItem('vitae:sessoes', JSON.stringify({
      s1: sessaoAntiga('s1', 'Velha Um'),
      s2: sessaoAntiga('s2', 'Velha Dois')
    }));
    const g = carregar(TODAS, { localStorage: mem });

    const lista = g.listarSessoes();
    assert.equal(lista.length, 2, 'as sessões antigas sumiram');
    assert.equal(chavesDeSessao(mem).length, 2, 'não viraram chaves próprias');
    assert.equal(mem.getItem('vitae:sessoes'), null, 'o mapa antigo ficou para trás');
    assert.ok(lista.some(r => r.personagem === 'Velha Um'));
  });

  await t.test('a sessão única de duas gerações atrás também migra', () => {
    const mem = memoriaLocal();
    mem.setItem('vitae:mesa', JSON.stringify(sessaoAntiga('s0', 'Antiquíssima')));
    const g = carregar(TODAS, { localStorage: mem });
    assert.equal(g.listarSessoes().length, 1);
    assert.equal(mem.getItem('vitae:mesa'), null);
  });

  await t.test('a sessão migrada abre de verdade', () => {
    const mem = memoriaLocal();
    mem.setItem('vitae:sessoes', JSON.stringify({ s1: sessaoAntiga('s1', 'Velha Um') }));
    const g = carregar(TODAS, { localStorage: mem });
    assert.equal(executar(g, "carregarSessao('s1')"), true);
    assert.equal(executar(g, 'M.ficha.nome'), 'Velha Um');
  });

  await t.test('migração que não cabe preserva o mapa antigo', () => {
    /* Migrar é o momento mais perigoso: se a cota estourar no meio, o
       jeito de não perder sessão é não apagar a origem. */
    const mem = memoriaLocal();
    mem.setItem('vitae:sessoes', JSON.stringify({
      s1: sessaoAntiga('s1', 'Velha Um'), s2: sessaoAntiga('s2', 'Velha Dois')
    }));
    const cheio = Object.assign(Object.create(null), mem, {
      setItem(k, v) {
        if (String(k).startsWith('vitae:sessao:')) {
          const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e;
        }
        return mem.setItem(k, v);
      }
    });
    carregar(TODAS, { localStorage: cheio });
    assert.ok(mem.getItem('vitae:sessoes'), 'apagou o mapa antigo sem ter migrado nada');
  });
});

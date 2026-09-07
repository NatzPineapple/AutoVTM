/* ============================================================
   VITÆ — Testes da área Cronista
   O último buraco da rede (item 2 da §14.1). Boa parte desta área
   é **determinística**, e é essa parte que entra aqui:

     compilador   .md da campanha → grafo de cenas
     diretor      posição, gatilhos, desfechos
     recombinador prosa montada de fragmentos, sem modelo
     escada       os cinco degraus da decisão
     motor-cronica o orçamento por peso
     legado       o que atravessa crônicas

   O que NÃO entra é a camada de LLM. Ela não se testa com asserção:
   se mede, com o `comparador.mjs`, e a §34.4 explica por quê — n=10
   não distingue 20% de 60%. Fingir que teste unitário responde por
   qualidade de prosa seria o mesmo erro do juiz cego.

       node --test testes/cronista.test.mjs
   ============================================================ */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { carregar, fichaDeTeste, memoriaLocal, executar, RAIZ } from './carregar.mjs';

/* `deepEqual` compara protótipo, e objeto vindo do `vm` não é objeto
   deste realm — "same structure but not reference-equal". A §46.6
   previu que isto morderia no Cronista, que devolve lista em quase
   tudo. Mordeu três vezes na primeira corrida. */
const iguais = (a, b, msg) =>
  assert.deepEqual(JSON.parse(JSON.stringify(a)), b, msg);

const g = carregar(['data', 'ficha', 'arbitro', 'cronista']);
const { Compilador, Diretor, Recombinador, Cronica, Legado } = g;

/* Uma campanha mínima e VÁLIDA, no esquema da §6. Serve de gabarito:
   o que o compilador tem que entender, e o que o diretor tem que
   conseguir percorrer. */
const CAMPANHA = `---
campanha: A Noite do Corvo
cidade: rio
---

# Capítulo Um
resumo: Alguém sumiu, e ninguém quer falar sobre isso.

## Cena :: Bar do Zé
local: bar_do_ze
hora: 23h
zona: centro

### Narração
O bar cheira a cerveja velha e a algo que ninguém nomeia.
A porta dos fundos está entreaberta.

### Opções
- intencao: persuadir
  rotas:
  - Manipulação + Lábia :: "você sorri e mente"
  - Carisma + Persuasão :: "você apela para o que resta de humano"
  dificuldade: 3
  sucesso: -> beco_dos_fundos custo:fome+1
  falha: -> bar_do_ze
- intencao: intimidar
  rotas:
  - Força + Intimidação :: "você encosta na parede"
  dificuldade: 4
  sucesso: -> beco_dos_fundos

### Gatilhos
- menciona(corvo, passarinho) => revela fato:o_corvo_falou
- turnos > 5 => -> beco_dos_fundos
- sempre => combate: 2x comum

### Entidades
pessoas: ze, bia
locais: bar_do_ze

### Saidas
- beco_dos_fundos

## Cena :: Beco dos Fundos
local: beco_dos_fundos
hora: 23h30

### Narração
O beco não tem saída, e é isso que faz dele um bom lugar para conversar.
`;

/* ============================================================
   COMPILADOR — o .md vira grafo
   ============================================================ */

test('Compilador — o que ele entende', async (t) => {
  const c = Compilador.compilar(CAMPANHA);

  await t.test('compila sem erro a campanha do esquema', () => {
    iguais(c.erros, []);
  });

  await t.test('lê o frontmatter', () => {
    assert.equal(c.meta.campanha, 'A Noite do Corvo');
    assert.equal(c.meta.cidade, 'rio');
  });

  await t.test('capítulo, resumo e cenas', () => {
    assert.equal(c.capitulos.length, 1);
    assert.equal(c.capitulos[0].titulo, 'Capítulo Um');
    assert.ok(c.capitulos[0].resumo.startsWith('Alguém sumiu'));
    assert.equal(c.capitulos[0].cenas.length, 2);
  });

  await t.test('a narração vira texto pronto — é o degrau 1, zero token', () => {
    const cena = c.capitulos[0].cenas[0];
    assert.ok(cena.narracao.includes('cerveja velha'));
    assert.ok(cena.narracao.includes('porta dos fundos'), 'perdeu a segunda linha');
  });

  await t.test('os campos da cena', () => {
    const cena = c.capitulos[0].cenas[0];
    assert.equal(cena.local, 'bar_do_ze');
    assert.equal(cena.hora, '23h');
    assert.equal(cena.zona, 'centro');
  });

  await t.test('as opções, com rotas e enquadramento', () => {
    const [op] = c.capitulos[0].cenas[0].opcoes;
    assert.equal(op.intencao, 'persuadir');
    assert.equal(op.dificuldade, 3);
    assert.equal(op.rotas.length, 2);
    iguais(op.rotas[0], { atributo: 'manipulacao', pericia: 'labia',
                          enquadramento: 'você sorri e mente' });
  });

  await t.test('desfecho com destino e custo', () => {
    const [op] = c.capitulos[0].cenas[0].opcoes;
    assert.equal(op.sucesso.destino, 'beco_dos_fundos');
    iguais(op.sucesso.custos, [{ campo: 'fome', delta: 1 }]);
    assert.equal(op.falha.destino, 'bar_do_ze');
  });

  await t.test('os três tipos de gatilho', () => {
    const gat = c.capitulos[0].cenas[0].gatilhos;
    assert.equal(gat.length, 3);
    assert.equal(gat[0].condicao.tipo, 'menciona');
    iguais(gat[0].condicao.termos, ['corvo', 'passarinho']);
    assert.equal(gat[0].acao.tipo, 'revela');
    assert.equal(gat[1].condicao.tipo, 'turnos');
    assert.equal(gat[2].condicao.tipo, 'sempre');
    assert.equal(gat[2].acao.tipo, 'combate');
  });

  await t.test('entidades e saídas', () => {
    const cena = c.capitulos[0].cenas[0];
    iguais(cena.entidades.pessoas, ['ze', 'bia']);
    iguais(cena.saidas, ['beco_dos_fundos']);
  });

  await t.test('o índice aponta para todas as cenas', () => {
    assert.ok(c.indice.bar_do_ze);
    assert.ok(c.indice.beco_dos_fundos);
    assert.equal(Object.keys(c.indice).length, 2);
  });

  await t.test('o campo interno de leitura não vaza para o resultado', () => {
    for (const op of c.capitulos[0].cenas[0].opcoes) {
      assert.equal('_lendoRotas' in op, false, 'sujeira do parser no objeto final');
    }
  });
});

test('Compilador — o que ele recusa', async (t) => {
  await t.test('destino que não existe é erro, com o lugar', () => {
    const c = Compilador.compilar(CAMPANHA.replace('-> beco_dos_fundos custo:fome+1',
                                                   '-> lugar_nenhum'));
    assert.ok(c.erros.some(e => /lugar_nenhum/.test(e)), `erros: ${c.erros}`);
  });

  await t.test('cena fora de capítulo é erro', () => {
    const c = Compilador.compilar('## Cena :: Solta\nlocal: x\n');
    assert.ok(c.erros.some(e => /fora de capítulo/i.test(e)));
  });

  await t.test('gatilho sem efeito é erro', () => {
    const c = Compilador.compilar(CAMPANHA.replace('- sempre => combate: 2x comum',
                                                   '- sempre'));
    assert.ok(c.erros.some(e => /sem efeito/i.test(e)));
  });

  await t.test('condição desconhecida é erro', () => {
    const c = Compilador.compilar(CAMPANHA.replace('- sempre => combate: 2x comum',
                                                   '- quando_der_na_telha => revela fato:x'));
    assert.ok(c.erros.some(e => /não reconhecida/i.test(e)));
  });

  await t.test('modelo de oponente desconhecido é erro', () => {
    const c = Compilador.compilar(CAMPANHA.replace('combate: 2x comum', 'combate: 2x dragao'));
    assert.ok(c.erros.some(e => /desconhecido/i.test(e)));
  });

  await t.test('documento que NÃO é campanha devolve erro, não silêncio', () => {
    /* Este é o item 1 da §14.1, do lado do compilador: os cinco .md em
       campanhas/ são extrações de PDF, e compilar sem erro seria pior
       que falhar — a mesa entra com zero opções e o jogador não sabe
       por quê. */
    const extracao = 'Este é um texto qualquer sobre vampiros.\n\nSem cabeçalho, sem cena.\n';
    const c = Compilador.compilar(extracao);
    assert.ok(c.erros.length, 'compilou um texto que não é campanha, sem reclamar');
    assert.ok(c.erros.some(e => /nenhum capítulo/i.test(e)));
  });

  await t.test('texto vazio também', () => {
    assert.ok(Compilador.compilar('').erros.length);
    assert.ok(Compilador.compilar(null).erros.length);
  });

  await t.test('campanha sem cena nenhuma é grafo vazio, e diz', () => {
    const c = Compilador.compilar('# Só o capítulo\nresumo: nada aqui\n');
    assert.equal(c.capitulos.length, 1);
    assert.equal(c.capitulos[0].cenas.length, 0);
    assert.equal(Object.keys(c.indice).length, 0);
  });
});

/* ============================================================
   DIRETOR — a posição na campanha
   ============================================================ */

test('Diretor — percorrer a campanha', async (t) => {
  const campanha = () => Compilador.compilar(CAMPANHA);

  await t.test('começa na primeira cena do primeiro capítulo', () => {
    const c = campanha();
    const e = Diretor.iniciar(c);
    assert.equal(e.cena, 'bar_do_ze');
    assert.equal(e.capitulo, 0);
    assert.equal(Diretor.cenaAtual(c, e).titulo, 'Bar do Zé');
  });

  await t.test('abrir cena muda a posição e zera o contador de turnos', () => {
    const c = campanha();
    const e = Diretor.iniciar(c);
    e.turnosNaCena = 7;
    Diretor.abrirCena(c, e, 'beco_dos_fundos');
    assert.equal(e.cena, 'beco_dos_fundos');
    assert.equal(e.turnosNaCena, 0, 'o contador de turnos veio junto da cena anterior');
  });

  await t.test('abrir cena que não existe não move nada', () => {
    const c = campanha();
    const e = Diretor.iniciar(c);
    Diretor.abrirCena(c, e, 'lugar_nenhum');
    assert.equal(e.cena, 'bar_do_ze');
  });

  await t.test('a opção é achada pela intenção', () => {
    const c = campanha();
    const cena = Diretor.cenaAtual(c, Diretor.iniciar(c));
    assert.equal(Diretor.opcaoPara(cena, 'persuadir').dificuldade, 3);
    assert.equal(Diretor.opcaoPara(cena, 'dançar_forró'), null);
  });

  await t.test('progresso conta cenas vistas, e não regride', () => {
    const c = campanha();
    const e = Diretor.iniciar(c);
    const antes = Diretor.progresso(c, e);
    Diretor.abrirCena(c, e, 'beco_dos_fundos');
    const depois = Diretor.progresso(c, e);
    assert.ok(depois.cenasVisitadas >= antes.cenasVisitadas, 'o progresso andou para trás');
    assert.equal(depois.cenasTotais, 2);
    assert.equal(depois.capitulos, 1);
  });
});

test('Diretor — os gatilhos', async (t) => {
  const preparar = () => {
    const c = Compilador.compilar(CAMPANHA);
    /* O gatilho 'sempre' dispara em qualquer turno e atrapalha os
       outros testes; tiro dele para isolar cada condição. */
    c.capitulos[0].cenas[0].gatilhos = c.capitulos[0].cenas[0].gatilhos.slice(0, 2);
    return { c, e: Diretor.iniciar(c) };
  };

  await t.test('menciona dispara com o termo, e não sem ele', () => {
    const { c, e } = preparar();
    assert.equal(Diretor.verificarGatilhos(c, e, { texto: 'falo do tempo' }).eventos.length, 0);
    const r = Diretor.verificarGatilhos(c, e, { texto: 'pergunto sobre o corvo' });
    assert.ok(r.eventos.some(x => x.tipo === 'revelacao'));
    assert.ok(e.fatosRevelados.includes('o_corvo_falou'));
  });

  await t.test('menciona ignora acento e caixa', () => {
    const { c, e } = preparar();
    c.capitulos[0].cenas[0].gatilhos[0].condicao.termos = ['pássaro'];
    assert.ok(Diretor.verificarGatilhos(c, e, { texto: 'FALO DO PASSARO' }).eventos.length);
  });

  await t.test('cada gatilho dispara uma vez só', () => {
    const { c, e } = preparar();
    const um = Diretor.verificarGatilhos(c, e, { texto: 'o corvo' });
    const dois = Diretor.verificarGatilhos(c, e, { texto: 'o corvo de novo' });
    assert.ok(um.eventos.length);
    assert.equal(dois.eventos.length, 0, 'o mesmo gatilho disparou duas vezes');
  });

  await t.test('turnos > 5 dispara no sexto, não antes', () => {
    const { c, e } = preparar();
    e.turnosNaCena = 5;
    assert.equal(Diretor.verificarGatilhos(c, e, { texto: '' }).destino, null);
    e.turnosNaCena = 6;
    assert.equal(Diretor.verificarGatilhos(c, e, { texto: '' }).destino, 'beco_dos_fundos');
  });

  await t.test('o gatilho de combate devolve os oponentes', () => {
    const c = Compilador.compilar(CAMPANHA);
    const e = Diretor.iniciar(c);
    const r = Diretor.verificarGatilhos(c, e, { texto: '' });
    const briga = r.eventos.find(x => x.tipo === 'combate');
    assert.ok(briga, 'o gatilho "sempre => combate" não disparou');
    assert.ok(briga.oponentes.length);
  });

  await t.test('fato revelado não entra duas vezes', () => {
    const { c, e } = preparar();
    e.fatosRevelados = ['o_corvo_falou'];
    Diretor.verificarGatilhos(c, e, { texto: 'o corvo' });
    assert.equal(e.fatosRevelados.filter(x => x === 'o_corvo_falou').length, 1);
  });

  await t.test('sem cena aberta, nada dispara e nada estoura', () => {
    const c = Compilador.compilar(CAMPANHA);
    const e = Diretor.iniciar(c);
    e.cena = 'nao_existe';
    assert.doesNotThrow(() => Diretor.verificarGatilhos(c, e, { texto: 'o corvo' }));
  });
});

/* ============================================================
   RECOMBINAÇÃO — o degrau 3, prosa sem modelo
   ============================================================ */

test('Recombinador — quando ele se aplica', async (t) => {
  const vale = (x) => Recombinador.aplicavel(x);

  await t.test('nunca no modo perguntar — ali quem responde é o Narrador', () => {
    assert.equal(vale({ modo: 'perguntar', veredito: { possivel: true } }), false);
  });

  await t.test('nunca quando o Árbitro barrou — o degrau 0 já respondeu', () => {
    assert.equal(vale({ modo: 'agir', veredito: { possivel: false } }), false);
  });

  await t.test('nunca quando há rolagem pedida — o dado é que manda', () => {
    assert.equal(vale({ modo: 'agir', veredito: { possivel: true, rotas: [{}] },
                        leitura: { intencao: 'ocultismo' } }), false);
  });

  await t.test('sempre em examinar: olhar não muda o mundo', () => {
    assert.equal(vale({ modo: 'examinar', veredito: { possivel: true } }), true);
  });

  await t.test('em agir, só nas intenções seguras', () => {
    for (const i of Recombinador.INTENCOES_SEGURAS) {
      assert.equal(vale({ modo: 'agir', veredito: { possivel: true }, leitura: { intencao: i } }),
        true, `${i} devia ser segura`);
    }
    assert.equal(vale({ modo: 'agir', veredito: { possivel: true },
                        leitura: { intencao: 'lutar' } }), false,
      'lutar não pode ser recombinado: tem consequência');
  });
});

test('Recombinador — a prosa montada', async (t) => {
  const contexto = (extra = {}) => Object.assign({
    ficha: fichaDeTeste(g, { nome: 'Inácia' }),
    cena: { local: 'bar', hora: '23h', presentes: ['ze'] },
    locais: [{ id: 'bar', nome: 'Bar do Zé', descricao: 'cheira a cerveja velha' }],
    pessoas: [{ id: 'ze', nome: 'Zé', relacao: 'conhecido' }],
    fatos: [], fios: [], modo: 'examinar', usados: []
  }, extra);

  /* `compor` devolve as PARTES; quem junta é o `tentar`. */
  const prosa = (ctx) => Recombinador.compor(ctx).partes.join(' ');

  await t.test('devolve prosa de verdade, e marcas do que usou', () => {
    const r = Recombinador.compor(contexto());
    assert.ok(Array.isArray(r.partes) && r.partes.length, 'nenhuma parte');
    assert.ok(r.partes.join(' ').length > 40, 'prosa curta demais');
    assert.ok(Array.isArray(r.marcas) && r.marcas.length, 'não marcou o que usou');
  });

  await t.test('não produz número de regra', () => {
    /* A §3.2 inteira: o degrau 3 monta prosa, e prosa não decide
       dificuldade nem conta dado. */
    for (let i = 0; i < 40; i++) {
      const texto = prosa(contexto());
      assert.ok(!/\b\d+\s*(dados?|sucessos?|dificuldade)\b/i.test(texto),
        `número de regra na prosa: "${texto}"`);
    }
  });

  await t.test('varia entre chamadas — senão o jogador decora', () => {
    const vistos = new Set();
    for (let i = 0; i < 30; i++) vistos.add(prosa(contexto()));
    assert.ok(vistos.size > 1, 'trinta chamadas deram sempre o mesmo texto');
  });

  await t.test('evita o que já foi usado', () => {
    /* `sortear` prefere o que não está em `usados`; só repete quando
       não sobra alternativa. */
    const lista = ['a', 'b', 'c'];
    for (let i = 0; i < 20; i++) {
      assert.equal(Recombinador.sortear(lista, ['x:a', 'x:b'], 'x'), 'c');
    }
  });

  await t.test('e repete quando não há mais alternativa', () => {
    const lista = ['a'];
    assert.equal(Recombinador.sortear(lista, ['x:a'], 'x'), 'a');
  });

  await t.test('as horas até o amanhecer', () => {
    assert.equal(Recombinador.horasAteAmanhecer('23h'), 7);
    assert.equal(Recombinador.horasAteAmanhecer('2h'), 4);
    assert.equal(Recombinador.horasAteAmanhecer('meio-dia'), null);
  });

  await t.test('cena sem gente e sem local não estoura', () => {
    assert.doesNotThrow(() => Recombinador.compor(contexto({
      cena: { local: 'nao_existe', hora: '', presentes: [] }, locais: [], pessoas: []
    })));
  });
});

/* ============================================================
   ESCADA — os cinco degraus
   ============================================================ */

test('Escada — o primeiro que responde vence', async (t) => {
  const { Escada, DegrauArbitro, DegrauCampanha, DegrauRecombinacao, DegrauNarrador } = g;

  const turno = (extra = {}) => Object.assign({
    texto: 'olho em volta', modo: 'examinar',
    veredito: { possivel: true, bloqueios: [], avisos: [], rotas: [] },
    leitura: { intencao: 'examinar' },
    ficha: fichaDeTeste(g), cena: { local: 'bar', presentes: [] },
    locais: [{ id: 'bar', nome: 'Bar' }], pessoas: [], fatos: [], fios: [],
    campanha: null, estadoDiretor: null, usados: [],
    paraNarrador: () => ({})
  }, extra);

  await t.test('barrado pelo Árbitro para no degrau 0, sem custo', async () => {
    const escada = new Escada([new DegrauArbitro(), new DegrauNarrador(g.Narrador)]);
    const passo = await escada.descer(turno({
      veredito: { possivel: false, bloqueios: [{ tipo: 'estado', motivo: 'você está algemado' }],
                  avisos: [] }
    }));
    assert.equal(passo.degrau.numero, 0);
    assert.equal(passo.degrau.custa, false);
  });

  /* O degrau 3 exige MATERIAL: três partes e 25 palavras. Com cena
     pobre ele recusa e cai no Narrador — que é o certo, e é por isso
     que este turno traz gente, fato e fio. */
  const turnoRico = () => turno({
    pessoas: [{ id: 'ze', nome: 'Zé', relacao: 'conhecido' }],
    cena: { local: 'bar', hora: '23h', presentes: ['ze'] },
    locais: [{ id: 'bar', nome: 'Bar do Zé', descricao: 'cheira a cerveja velha' }],
    fatos: [{ id: 'f1', titulo: 'o corvo falou', texto: 'alguém ouviu' }],
    fios: [{ id: 'fio1', titulo: 'quem levou a chave', estado: 'aberto' }]
  });

  await t.test('a recombinação vem antes do Narrador, e não custa', async () => {
    const escada = new Escada([new DegrauArbitro(), new DegrauRecombinacao(Recombinador),
                               new DegrauNarrador(g.Narrador)]);
    const passo = await escada.descer(turnoRico());
    assert.equal(passo.degrau.numero, 3, 'o degrau 3 recusou uma cena com material');
    assert.equal(passo.degrau.custa, false);
  });

  await t.test('cena com material resolve local em 100% das tentativas', (t2) => {
    /* Este é o número que sustenta a meta de "70% dos turnos sem LLM"
       (§3): quando há material, o degrau 3 responde SEMPRE. */
    const ctx = {
      ficha: fichaDeTeste(g), cena: { local: 'bar', hora: '23h', presentes: ['ze'] },
      locais: [{ id: 'bar', nome: 'Bar do Zé', descricao: 'cheira a cerveja velha' }],
      pessoas: [{ id: 'ze', nome: 'Zé', relacao: 'conhecido' }],
      fatos: [{ id: 'f1', titulo: 'o corvo falou', texto: 'alguém ouviu' }],
      fios: [{ id: 'fio1', titulo: 'quem levou a chave', estado: 'aberto' }],
      modo: 'examinar', leitura: { intencao: 'examinar' },
      veredito: { possivel: true, rotas: [] }, usados: []
    };
    let aceitou = 0;
    for (let i = 0; i < 200; i++) if (Recombinador.tentar(ctx)) aceitou++;
    t2.diagnostic(`cena com gente, fato e fio: ${aceitou} de 200 resolvidos no degrau 3`);
    assert.equal(aceitou, 200, `recusou ${200 - aceitou} de 200 com material de sobra`);
  });

  await t.test('e a recusa existe, mesmo que rara', (t2) => {
    /* MEDIDO, não suposto: com cena vazia o degrau 3 ainda aceita ~96%
       das vezes — a recusa vem do SORTEIO dos fragmentos, não da falta
       de material. Ou seja: dois turnos idênticos podem cair em degraus
       diferentes, e o custo em LLM varia sem ninguém ter escolhido isso.
       Registrado como item 8 da §14.1.

       O teste afirma só o que é verdade: o caminho de recusa existe e é
       alcançável. Afirmar "cena pobre cai no Narrador" seria um teste
       instável, e teste instável ensina a ignorar vermelho (§46.5). */
    const pobre = {
      ficha: fichaDeTeste(g), cena: { local: '', hora: '', presentes: [] },
      locais: [], pessoas: [], fatos: [], fios: [],
      modo: 'examinar', leitura: { intencao: 'examinar' },
      veredito: { possivel: true, rotas: [] }, usados: []
    };
    let recusou = 0;
    for (let i = 0; i < 400; i++) if (!Recombinador.tentar(pobre)) recusou++;
    t2.diagnostic(`cena VAZIA: recusou ${recusou} de 400 ` +
                  `(${(100 - recusou / 4).toFixed(1)}% ainda resolve local — item A9)`);
    assert.ok(recusou > 0, 'o caminho de recusa nunca é alcançado em 400 tentativas');
    assert.ok(recusou < 400, 'passou a recusar sempre — a meta de 70% local caiu');
  });

  await t.test('o Narrador é o último, e é o único que custa', async () => {
    const escada = new Escada([new DegrauArbitro(), new DegrauNarrador(g.Narrador)]);
    const passo = await escada.descer(turno({ modo: 'agir', leitura: { intencao: 'lutar' } }));
    assert.equal(passo.degrau.numero, 4);
    assert.equal(passo.degrau.custa, true);
  });

  await t.test('escada sem degrau que atenda devolve nada, e não estoura', async () => {
    const escada = new Escada([new DegrauArbitro()]);
    assert.equal(await escada.descer(turno()), null);
  });

  await t.test('a ordem dos degraus é a ordem da lista', async () => {
    /* Se a escada reordenasse, o Narrador poderia responder antes da
       recombinação e a meta de 70% sem LLM iria embora sem aviso. */
    const escada = new Escada([new DegrauNarrador(g.Narrador),
                               new DegrauRecombinacao(Recombinador)]);
    const passo = await escada.descer(turnoRico());
    assert.equal(passo.degrau.numero, 4, 'a escada não respeitou a ordem dada');
  });
});

/* ============================================================
   O ORÇAMENTO DA CRÔNICA — o corte por peso
   ============================================================ */

test('Crônica — o orçamento por peso', async (t) => {
  /* Uma sessão longa, com um evento GRAVE no começo. O corte por
     posição (um `slice(-N)`) jogaria fora justamente esse. */
  const sessaoLonga = (turnos) => {
    const mensagens = [
      { autor: 'cena', titulo: 'Bar do Zé', sub: '23h' },
      { autor: 'jogador', modo: 'agir', texto: 'tento sair pela porta dos fundos' },
      { autor: 'arbitro', veredito: { bloqueios: [{ tipo: 'estado',
          motivo: 'A porta está trancada por fora, e você está sem as mãos.' }] } },
      { autor: 'rolagem', resultado: { tipo: 'bestial', rotulo: 'Força + Briga' } }
    ];
    for (let i = 0; i < turnos; i++) {
      mensagens.push({ autor: 'jogador', modo: 'agir', texto: `ando pela sala, turno ${i}` });
      mensagens.push({ autor: 'narrador', texto: `A sala continua igual. Nada muda. Turno ${i}. `.repeat(3) });
    }
    return { ficha: fichaDeTeste(g), mensagens, registro: [],
             cena: { local: 'bar' }, locais: [], pessoas: [], fatos: [], fios: [], bolsa: [] };
  };

  const custo = (t) => Math.ceil((t.length + 1) * Cronica.TOKENS_POR_CARACTERE);

  await t.test('sessão curta cabe inteira, na ordem em que aconteceu', () => {
    const m = Cronica.memoriaDe({ mesa: sessaoLonga(3) });
    const brutos = Cronica.coletar(m);
    const cabidos = Cronica.caber(m, brutos);
    assert.equal(cabidos.length, brutos.length, 'cortou o que cabia');
    assert.equal(m.cortados, 0);
    const ordens = cabidos.map(x => x.ordem);
    assert.deepEqual(ordens, ordens.slice().sort((a, b) => a - b), 'a ordem se perdeu');
  });

  await t.test('sessão longa é cortada, e respeita o teto', (t2) => {
    const m = Cronica.memoriaDe({ mesa: sessaoLonga(600) });
    const brutos = Cronica.coletar(m);
    const cabidos = Cronica.caber(m, brutos);
    const total = cabidos.reduce((a, x) => a + custo(x.texto), 0);
    t2.diagnostic(`600 turnos → ${brutos.length} eventos brutos, ${cabidos.length} mantidos, ` +
                  `${m.cortados} cortados · ${total} de ${Cronica.ORCAMENTO_TOKENS} tokens`);
    assert.ok(m.cortados > 0, 'não cortou nada numa sessão de 600 turnos');
    assert.ok(total <= Cronica.ORCAMENTO_TOKENS,
      `estourou o orçamento: ${total} de ${Cronica.ORCAMENTO_TOKENS}`);
  });

  await t.test('o barrado do turno 3 SOBREVIVE a 600 turnos', () => {
    /* Este é o teste que justifica o orçamento por peso existir, e o
       defeito que a §14.1 chamava de "estouro silencioso do contexto".
       Um corte por posição perderia isto sem uma palavra. */
    const m = Cronica.memoriaDe({ mesa: sessaoLonga(600) });
    const cabidos = Cronica.caber(m, Cronica.coletar(m));
    assert.ok(cabidos.some(x => /Barrado:/.test(x.texto) && /trancada por fora/.test(x.texto)),
      'o barrado do começo foi cortado');
  });

  await t.test('a falha bestial também sobrevive', () => {
    const m = Cronica.memoriaDe({ mesa: sessaoLonga(600) });
    const cabidos = Cronica.caber(m, Cronica.coletar(m));
    assert.ok(cabidos.some(x => /bestial/.test(x.texto)), 'a bestial foi cortada');
  });

  await t.test('a ordem cronológica volta depois do corte', () => {
    const m = Cronica.memoriaDe({ mesa: sessaoLonga(600) });
    const ordens = Cronica.caber(m, Cronica.coletar(m)).map(x => x.ordem);
    assert.deepEqual(ordens, ordens.slice().sort((a, b) => a - b),
      'o corte por peso deixou a saída fora de ordem');
  });

  await t.test('o que sai é sempre o de menor peso', () => {
    const m = Cronica.memoriaDe({ mesa: sessaoLonga(600) });
    const brutos = Cronica.coletar(m);
    const cabidos = new Set(Cronica.caber(m, brutos).map(x => x.ordem));
    const menorMantido = Math.min(...[...cabidos].map(o =>
      brutos.find(b => b.ordem === o).peso));
    const maiorCortado = Math.max(0, ...brutos.filter(b => !cabidos.has(b.ordem)).map(b => b.peso));
    assert.ok(maiorCortado <= menorMantido + 1,
      `cortou peso ${maiorCortado} e manteve ${menorMantido}`);
  });

  await t.test('todo peso declarado é usado por algum tipo de evento', () => {
    /* Peso que nada produz é regra morta: parece que protege algo e
       não protege nada. */
    /* Foi este teste que achou `fato` e `fio` declarados com os dois
       MAIORES pesos da tabela e nunca aplicados — e o buraco que isso
       escondia: fato e fio não passavam por orçamento nenhum. §51.2. */
    const fonte = executar(g, 'String(Cronica.coletar) + String(Cronica.caberEstado)');
    const orfaos = Object.keys(Cronica.PESOS).filter(k => !fonte.includes(`PESOS.${k}`));
    iguais(orfaos, [], 'peso declarado que nada aplica');
  });

  await t.test('encolher tira a marcação e não estoura o limite', () => {
    const longo = 'a'.repeat(500);
    assert.ok(Cronica.encolher(longo, 220).length <= 220);
    assert.equal(Cronica.encolher('**forte** e [[pessoa:ze|Zé]]'), 'forte e ze');
  });

  await t.test('sessão vazia não estoura', () => {
    const m = Cronica.memoriaDe({ mesa: { ficha: fichaDeTeste(g), mensagens: [] } });
    assert.equal(Cronica.caber(m, Cronica.coletar(m)).length, 0);
  });
});

test('Crônica — as regras declarativas', async (t) => {
  const mesa = () => ({
    ficha: fichaDeTeste(g, { nome: 'Inácia' }),
    mensagens: [
      { autor: 'cena', titulo: 'Bar do Zé', sub: '23h' },
      { autor: 'jogador', modo: 'agir', texto: 'pergunto pelo sumido' },
      { autor: 'narrador', texto: 'Ninguém responde. O silêncio dura mais do que devia.' }
    ],
    registro: [], cena: { local: 'bar' },
    locais: [{ id: 'bar', nome: 'Bar do Zé' }], pessoas: [], fatos: [], fios: [], bolsa: []
  });

  await t.test('toda regra tem id, prioridade, quando e entao', () => {
    const quebradas = [];
    for (const r of Cronica.REGRAS) {
      if (!r.id) quebradas.push('regra sem id');
      if (typeof r.prioridade !== 'number') quebradas.push(`${r.id}: prioridade`);
      if (typeof r.quando !== 'function') quebradas.push(`${r.id}: quando`);
      if (typeof r.entao !== 'function') quebradas.push(`${r.id}: entao`);
    }
    assert.deepEqual(quebradas, []);
  });

  await t.test('nenhum id se repete', () => {
    const ids = Cronica.REGRAS.map(r => r.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  await t.test('cada regra dispara no máximo uma vez', () => {
    const r = Cronica.avaliar({ mesa: mesa(), tipo: 'capitulo' });
    const ids = r.rastro.map(x => x.regra);
    assert.equal(new Set(ids).size, ids.length, 'a mesma regra disparou duas vezes');
  });

  await t.test('termina sem estourar o teto de ciclos', () => {
    const r = Cronica.avaliar({ mesa: mesa(), tipo: 'capitulo' });
    assert.ok(r.rastro.length <= Cronica.REGRAS.length);
  });

  await t.test('avaliar devolve o material da crônica', () => {
    const r = Cronica.avaliar({ mesa: mesa(), tipo: 'capitulo' });
    for (const campo of ['eventos', 'mudancas', 'marcas', 'relacoes']) {
      assert.ok(campo in r, `falta "${campo}"`);
    }
    assert.ok(r.eventos.length, 'não coletou evento nenhum');
  });

  await t.test('explicar devolve texto', () => {
    assert.equal(typeof Cronica.explicar(Cronica.avaliar({ mesa: mesa() })), 'string');
  });

  await t.test('avaliar não muda a mesa', () => {
    /* O Cronista LÊ a sessão para escrever sobre ela. Se ele mexer,
       cronicar duas vezes dá resultado diferente. */
    const m = mesa();
    const antes = JSON.stringify(m);
    Cronica.avaliar({ mesa: m, tipo: 'capitulo' });
    assert.equal(JSON.stringify(m), antes, 'a análise escreveu na mesa');
  });

  await t.test('mesa sem nada não estoura', () => {
    assert.doesNotThrow(() => Cronica.avaliar({ mesa: { ficha: fichaDeTeste(g) } }));
  });
});

/* ============================================================
   LEGADO — o que atravessa crônicas
   ============================================================ */

test('Legado — registrar e propor', async (t) => {
  const comMemoria = () => carregar(['data', 'ficha', 'arbitro', 'cronista'],
                                    { localStorage: memoriaLocal() });

  await t.test('ficha sem legado devolve vazio', () => {
    const ctx = comMemoria();
    assert.equal(ctx.Legado.vazioDe(ctx.Legado.de(fichaDeTeste(ctx))), true);
  });

  await t.test('registrar guarda, e a ficha reencontra', () => {
    const ctx = comMemoria();
    const f = fichaDeTeste(ctx, { nome: 'Inácia' });
    ctx.Legado.registrar(f, {
      relacoes: [{ id: 'ze', quem: 'Zé', vinculo: 'aliado' }],
      marcas: [{ texto: 'queimou o bar do Zé', tipo: 'reputacao' }],
      posses: [{ nome: 'chave do camarim' }]
    }, { titulo: 'A Noite do Corvo' });

    const reg = ctx.Legado.de(f);
    assert.ok(reg, 'não guardou');
    assert.equal(reg.relacoes.length, 1);
    assert.equal(reg.marcas.length, 1);
  });

  await t.test('registrar duas vezes a mesma coisa não duplica', () => {
    const ctx = comMemoria();
    const f = fichaDeTeste(ctx, { nome: 'Inácia' });
    const saida = { relacoes: [{ id: 'ze', quem: 'Zé', vinculo: 'aliado' }], marcas: [], posses: [] };
    ctx.Legado.registrar(f, saida, { titulo: 'Uma' });
    ctx.Legado.registrar(f, saida, { titulo: 'Duas' });
    assert.equal(ctx.Legado.de(f).relacoes.length, 1);
  });

  await t.test('a marca vira PROPOSTA, não vira ponto sozinha', () => {
    /* A §3.2 do jeito que a §32 permitiu: o motor propõe, o jogador
       confirma. Se o legado aplicasse direto, ele estaria mexendo na
       ficha sem ninguém pedir. */
    const ctx = comMemoria();
    const f = fichaDeTeste(ctx, { nome: 'Inácia', antecedentes: {}, meritos: {}, defeitos: {} });
    ctx.Legado.registrar(f, {
      relacoes: [{ id: 'ze', quem: 'Zé', vinculo: 'aliado' }], marcas: [], posses: []
    }, { titulo: 'Uma' });

    const antes = JSON.stringify(f.antecedentes);
    const props = ctx.Legado.propostas(f);
    assert.ok(props.length, 'não propôs nada');
    assert.equal(JSON.stringify(f.antecedentes), antes, 'aplicou sem o jogador confirmar');
    for (const p of props) {
      assert.ok(p.marca && p.rotulo && p.classe && p.id, 'proposta incompleta');
      assert.ok(p.para > p.de, 'proposta que não muda nada');
    }
  });

  await t.test('aplicar tira a proposta da lista', () => {
    const ctx = comMemoria();
    const f = fichaDeTeste(ctx, { nome: 'Inácia', antecedentes: {}, meritos: {}, defeitos: {} });
    ctx.Legado.registrar(f, {
      relacoes: [{ id: 'ze', quem: 'Zé', vinculo: 'aliado' }], marcas: [], posses: []
    }, { titulo: 'Uma' });
    const [p] = ctx.Legado.propostas(f);
    ctx.Legado.aplicarProposta(f, p.marca);
    assert.ok(!ctx.Legado.propostas(f).some(x => x.marca === p.marca),
      'a proposta aplicada voltou a aparecer');
  });

  await t.test('recusar também tira, e não volta', () => {
    const ctx = comMemoria();
    const f = fichaDeTeste(ctx, { nome: 'Inácia', antecedentes: {}, meritos: {}, defeitos: {} });
    ctx.Legado.registrar(f, {
      relacoes: [{ id: 'ze', quem: 'Zé', vinculo: 'aliado' }], marcas: [], posses: []
    }, { titulo: 'Uma' });
    const [p] = ctx.Legado.propostas(f);
    ctx.Legado.recusarProposta(f, p.marca);
    assert.ok(!ctx.Legado.propostas(f).some(x => x.marca === p.marca),
      'a proposta recusada voltou a aparecer');
  });

  await t.test('proposta nunca passa do teto', () => {
    const ctx = comMemoria();
    const f = fichaDeTeste(ctx, { nome: 'Inácia', antecedentes: {}, meritos: {}, defeitos: {} });
    ctx.Legado.registrar(f, {
      relacoes: Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, quem: `P${i}`, vinculo: 'aliado' })),
      marcas: [], posses: []
    }, { titulo: 'Uma' });
    for (const p of ctx.Legado.propostas(f)) {
      const teto = ctx.Legado.tetoDe(p.classe, p.id);
      assert.ok(p.para <= teto, `${p.id}: propôs ${p.para}, teto ${teto}`);
    }
  });

  await t.test('esquecer tira do legado de vez', () => {
    const ctx = comMemoria();
    const f = fichaDeTeste(ctx, { nome: 'Inácia' });
    ctx.Legado.registrar(f, {
      relacoes: [{ id: 'ze', quem: 'Zé', vinculo: 'aliado' }], marcas: [], posses: []
    }, { titulo: 'Uma' });
    ctx.Legado.esquecer(f, 'relacoes', 'ze');
    assert.equal(ctx.Legado.de(f).relacoes.length, 0);
  });

  await t.test('apagar devolve true, e some', () => {
    const ctx = comMemoria();
    const f = fichaDeTeste(ctx, { nome: 'Inácia' });
    ctx.Legado.registrar(f, { relacoes: [], marcas: [{ texto: 'x', tipo: 'reputacao' }], posses: [] },
                         { titulo: 'Uma' });
    assert.equal(ctx.Legado.apagar(f), true);
    assert.equal(ctx.Legado.vazioDe(ctx.Legado.de(f)), true);
  });
});

test('Legado — não some em silêncio (item 7)', async (t) => {
  await t.test('guardar devolve true quando cabe', () => {
    const ctx = carregar(['data', 'ficha', 'arbitro', 'cronista'],
                         { localStorage: memoriaLocal() });
    assert.equal(ctx.Legado.guardar({}), true);
  });

  await t.test('e false quando não cabe', () => {
    /* Era `catch (e) {}`. O legado é o que ATRAVESSA crônicas: perdê-lo
       calado é perder o personagem inteiro entre uma noite e a outra. */
    const ctx = carregar(['data', 'ficha', 'arbitro', 'cronista'],
                         { localStorage: memoriaLocal({ cota: 5 }) });
    assert.equal(ctx.Legado.guardar({ x: 'y'.repeat(500) }), false);
  });

  await t.test('e quem chama fica sabendo', () => {
    const ctx = carregar(['data', 'ficha', 'arbitro', 'cronista'],
                         { localStorage: memoriaLocal({ cota: 30 }) });
    const f = fichaDeTeste(ctx, { nome: 'Inácia' });
    const reg = ctx.Legado.registrar(f, {
      relacoes: [{ id: 'ze', quem: 'Zé', vinculo: 'aliado' }],
      marcas: [{ texto: 'queimou o bar do Zé', tipo: 'reputacao' }], posses: []
    }, { titulo: 'A Noite do Corvo' });
    assert.equal(reg.gravado, false, 'disse que gravou o que não coube');
  });
});

/* ============================================================
   A FICHA COM DISCIPLINA FORA DO CATÁLOGO (item 7)
   ============================================================ */

test('Ficha antiga com Disciplina que saiu do catálogo (item 7)', async (t) => {
  await t.test('não derruba a lista de pendências', () => {
    /* `DISCIPLINAS[id].nome` estourava, e a tela de pendências ficava
       em branco — não com uma pendência a menos: em branco. */
    const f = fichaDeTeste(g, { disciplinas: { disciplina_que_nao_existe: 2 }, poderes: {} });
    let r;
    assert.doesNotThrow(() => { r = g.pendenciasDaFicha(f); });
    assert.ok(Array.isArray(r.problemas));
  });

  await t.test('e avisa que o id é desconhecido', () => {
    const f = fichaDeTeste(g, { disciplinas: { disciplina_que_nao_existe: 2 }, poderes: {} });
    assert.ok(g.pendenciasDaFicha(f).problemas.some(p => /desconhecida/i.test(p)),
      'engoliu o id inválido sem dizer nada');
  });

  await t.test('a ficha normal segue igual', () => {
    const f = fichaDeTeste(g);
    assert.ok(!g.pendenciasDaFicha(f).problemas.some(p => /desconhecida/i.test(p)));
  });
});

/* ============================================================
   A RESERVA DE ESTADO — o buraco que os pesos mortos escondiam
   ============================================================ */

test('Crônica — fatos e fios também têm teto (§51.2)', async (t) => {
  const comEstado = (nFatos, nFios) => ({
    ficha: fichaDeTeste(g), mensagens: [], registro: [],
    cena: { local: 'bar' }, locais: [], pessoas: [], bolsa: [],
    fatos: Array.from({ length: nFatos }, (_, i) => ({
      id: `f${i}`, titulo: `Fato número ${i}`,
      texto: `Alguém descobriu alguma coisa sobre alguém, e a coisa tem consequência. Caso ${i}. `.repeat(2)
    })),
    fios: Array.from({ length: nFios }, (_, i) => ({
      id: `fio${i}`, titulo: `Quem levou a chave, versão ${i}`,
      estado: i % 3 === 0 ? 'fechado' : 'aberto'
    }))
  });

  await t.test('pouco estado passa inteiro', () => {
    const r = Cronica.caberEstado(comEstado(3, 2));
    assert.equal(r.fatos.length, 3);
    assert.equal(r.fios.length, 2);
    assert.equal(r.cortados, 0);
  });

  await t.test('muito estado é cortado, e respeita a reserva', () => {
    /* Antes da §51.2 isto entrava INTEIRO no pedido ao modelo, por cima
       dos 4.000 tokens de eventos e do prefixo de 3.573 — numa janela
       de 8.192. O orçamento por peso da §41 fechou o estouro dos
       eventos e deixou este aberto. */
    const r = Cronica.caberEstado(comEstado(80, 40));
    assert.ok(r.cortados > 0, 'não cortou nada com 80 fatos e 40 fios');
    assert.ok(r.tokens <= Cronica.RESERVA_ESTADO_TOKENS,
      `estourou a reserva: ${r.tokens} de ${Cronica.RESERVA_ESTADO_TOKENS}`);
  });

  await t.test('o fio aberto tem piso, e não é espremido pelos fatos', (t2) => {
    /* MEDIDO, e foi por isso que o piso existe: com peso puro, 80 fatos
       e 40 fios davam UM fio. Fato pesa 100, fio pesa 95, então fato
       ganhava sempre — e fio aberto é o gancho do próximo capítulo.
       Perder 39 de 40 é trocar a continuidade da crônica pelo passado
       dela. Com o piso de um terço da reserva, sobrevivem 19. */
    const r = Cronica.caberEstado(comEstado(80, 40));
    const abertos = r.fios.filter(f => f.estado !== 'fechado').length;
    t2.diagnostic(`80 fatos + 40 fios → ${r.fatos.length} fatos e ${r.fios.length} fios ` +
                  `(${abertos} abertos), ${r.cortados} cortados · ` +
                  `${r.tokens} de ${Cronica.RESERVA_ESTADO_TOKENS} tokens`);
    assert.ok(abertos >= 5, `sobrou ${abertos} fio aberto de 40 — os ganchos morreram`);
    assert.ok(r.tokens <= Cronica.RESERVA_ESTADO_TOKENS, 'o piso furou a reserva');
  });

  await t.test('sem fio nenhum, o fato usa a reserva inteira', () => {
    /* O piso não pode virar espaço desperdiçado quando não há fio. */
    const r = Cronica.caberEstado(comEstado(80, 0));
    assert.ok(r.tokens > Cronica.RESERVA_ESTADO_TOKENS * 0.8,
      `só usou ${r.tokens} de ${Cronica.RESERVA_ESTADO_TOKENS} sem fio nenhum para reservar`);
  });

  await t.test('fio fechado cede a vez ao que ainda está aberto', () => {
    /* Fio fechado não é dívida em aberto: se algo tem que sair, sai
       ele. */
    const r = Cronica.caberEstado(comEstado(0, 60));
    const abertos = r.fios.filter(f => f.estado !== 'fechado').length;
    const fechados = r.fios.filter(f => f.estado === 'fechado').length;
    assert.ok(abertos > fechados, `manteve ${fechados} fechados e ${abertos} abertos`);
  });

  await t.test('a ordem original volta depois do corte', () => {
    const r = Cronica.caberEstado(comEstado(80, 0));
    const nums = r.fatos.map(f => Number(f.id.slice(1)));
    assert.deepEqual(nums, nums.slice().sort((a, b) => a - b), 'a ordem se perdeu');
  });

  await t.test('mesa sem fato nem fio devolve vazio, e não estoura', () => {
    const r = Cronica.caberEstado({ ficha: fichaDeTeste(g) });
    assert.equal(r.fatos.length, 0);
    assert.equal(r.fios.length, 0);
    assert.equal(r.tokens, 0);
  });

  await t.test('a soma dos tetos cabe na janela do modelo', () => {
    /* A conta que justifica tudo isto, e que estava errada antes da
       §51.2: prefixo + eventos + estado + saída + margem tinha que
       caber nos 8.192, e não cabia — porque fatos e fios entravam sem
       teto nenhum, por cima dos 219 tokens que sobravam.

       O teste é uma IDENTIDADE, não um número decorado: se alguém
       aumentar um teto sem baixar outro, ele cai. */
    const soma = Cronica.PREFIXO_TOKENS + Cronica.ORCAMENTO_TOKENS +
                 Cronica.RESERVA_ESTADO_TOKENS + Cronica.SAIDA_TOKENS + Cronica.MARGEM_TOKENS;
    assert.ok(soma <= Cronica.JANELA_TOKENS,
      `os tetos somam ${soma} numa janela de ${Cronica.JANELA_TOKENS}`);
  });

  await t.test('e os tetos são derivados, não escritos à mão', () => {
    /* Dois números escritos à mão divergem; um derivado do outro, não.
       É a mesma lição do item X3 (§50.3), aplicada a orçamento em vez
       de a contagem de linha. */
    assert.equal(Cronica.CORPO_TOKENS,
      Cronica.JANELA_TOKENS - Cronica.PREFIXO_TOKENS - Cronica.SAIDA_TOKENS - Cronica.MARGEM_TOKENS);
    assert.equal(Cronica.ORCAMENTO_TOKENS,
      Cronica.CORPO_TOKENS - Cronica.RESERVA_ESTADO_TOKENS);
  });

  await t.test('a margem existe, porque a contagem é aproximada', () => {
    /* `TOKENS_POR_CARACTERE` é 1/3,6 — estimativa, não tokenizador. Sem
       margem, "cabe exatamente" vira "estoura às vezes". */
    assert.ok(Cronica.MARGEM_TOKENS > 0);
  });

  await t.test('e o pedido montado relata os dois orçamentos', () => {
    const pedido = g.Cronista.pedidoDe(comEstado(80, 40), 'capitulo');
    assert.ok(pedido.orcamento.estadoTeto, 'o pedido não conta o orçamento de estado');
    assert.ok(pedido.orcamento.estadoCortados > 0);
    assert.ok(pedido.fatos.length < 80, 'o pedido levou os 80 fatos assim mesmo');
  });
});

/* ============================================================
   §72 — A primeira campanha jogável

   `A Conta do Duarte` existe para o usuário exercitar o Árbitro e
   o Cronista à mão. Se ela apodrecer, o teste avisa — e apodrecer
   é fácil: o id de uma cena é o SLUG DO TÍTULO, então renomear a
   cena quebra todo `->` que aponta para ela. Foi o que aconteceu
   na primeira escrita, e o compilador acusou 47 erros.
   ============================================================ */

test('Campanha — A Conta do Duarte compila e é jogável (§72)', async (t) => {

  const md = fs.readFileSync(path.join(RAIZ, 'campanhas', 'a-conta-do-duarte.md'), 'utf8');
  const c = g.Compilador.compilar(md);

  await t.test('compila sem UM erro sequer', (t2) => {
    t2.diagnostic(c.erros.length ? c.erros.slice(0, 5).join(' | ') : 'nenhum erro');
    assert.equal(c.erros.length, 0, `a campanha não compila: ${c.erros.join(' | ')}`);
  });

  await t.test('está registrada em CAMPANHAS, e aponta para o arquivo certo', (t2) => {
    const reg = g.CAMPANHAS.find(x => x.id === 'conta_duarte');
    assert.ok(reg, 'a campanha não aparece na lista do saguão');
    t2.diagnostic(`${reg.nome} · ${reg.arquivo} · ${reg.capitulos} capítulos`);
    assert.equal(reg.arquivo, 'campanhas/a-conta-do-duarte.md');
    assert.equal(reg.capitulos, c.capitulos.length,
      'o número de capítulos no registro não bate com o do arquivo');
    assert.equal(reg.cidade, c.meta.cidade);
  });

  await t.test('tem grafo de verdade: dois capítulos, oito cenas, saídas ligadas', (t2) => {
    const cenas = c.capitulos.flatMap(cap => cap.cenas);
    t2.diagnostic(`${c.capitulos.length} capítulos · ${cenas.length} cenas · ` +
      `${cenas.reduce((a, s) => a + s.opcoes.length, 0)} opções`);
    assert.equal(c.capitulos.length, 2);
    assert.equal(cenas.length, 8);
    /* O defeito que a §36.1 nomeou nas outras cinco: compilam e
       devolvem GRAFO VAZIO. Aqui nenhuma cena pode estar vazia. */
    for (const s of cenas) {
      assert.ok(s.narracao.length > 80, `cena ${s.id} sem narração`);
      assert.ok(s.opcoes.length >= 1, `cena ${s.id} sem opção nenhuma`);
    }
  });

  await t.test('toda rota usa atributo e perícia que existem', (t2) => {
    const atributos = Object.values(g.ATRIBUTOS).flatMap(x => x.lista).map(a => a.id);
    const pericias = Object.values(g.HABILIDADES).flatMap(x => x.lista).map(h => h.id);
    let n = 0;
    for (const cap of c.capitulos) for (const cena of cap.cenas) for (const o of cena.opcoes)
      for (const r of o.rotas) {
        n++;
        assert.ok(atributos.includes(r.atributo),
          `${cena.id} / ${o.intencao}: atributo "${r.atributo}" não existe`);
        assert.ok(pericias.includes(r.pericia) || atributos.includes(r.pericia),
          `${cena.id} / ${o.intencao}: perícia "${r.pericia}" não existe`);
      }
    t2.diagnostic(`${n} rotas conferidas`);
    assert.ok(n >= 20, 'poucas rotas para testar o Árbitro à mão');
  });

  await t.test('toda entidade citada existe na semente do Rio', (t2) => {
    /* A campanha reaproveita os ids de SEMENTE_RIO de propósito, para
       cair numa mesa que já tem grafo. Um id errado aqui é um
       [[pessoa:x]] que não resolve. */
    const semente = g.sementeDaCidade('rio');
    const pessoas = semente.pessoas.map(p => p.id);
    const locais = semente.locais.map(l => l.id);
    const citadas = new Set(), citados = new Set();
    for (const cap of c.capitulos) for (const cena of cap.cenas) {
      (cena.entidades.pessoas || []).forEach(x => citadas.add(x));
      (cena.entidades.locais || []).forEach(x => citados.add(x));
      if (cena.local) citados.add(cena.local);
      for (const m of cena.narracao.matchAll(/\[\[pessoa:([a-z0-9_]+)\]\]/g)) citadas.add(m[1]);
    }
    t2.diagnostic(`pessoas: ${[...citadas].join(', ')} · locais: ${[...citados].join(', ')}`);
    for (const p of citadas) assert.ok(pessoas.includes(p), `pessoa "${p}" não existe na semente do Rio`);
    for (const l of citados) assert.ok(locais.includes(l), `local "${l}" não existe na semente do Rio`);
  });

  await t.test('os oponentes do combate usam modelos que o Escudo conhece', (t2) => {
    const combates = c.capitulos.flatMap(cap => cap.cenas)
      .flatMap(s => s.gatilhos).filter(x => x.acao.tipo === 'combate');
    assert.ok(combates.length >= 1, 'nenhum combate: o Árbitro de combate não seria exercitado');
    for (const cb of combates) for (const o of cb.acao.oponentes) {
      t2.diagnostic(`${o.modelo}${o.nome ? ` (${o.nome})` : ''}`);
      assert.ok(g.Escudo.MODELOS_MORTAIS[o.modelo], `modelo "${o.modelo}" não existe`);
    }
    /* Ao menos um oponente ARMADO: é o que faz `armaPor` e a
       tabela de dano entrarem na conta. */
    assert.ok(combates.some(cb => cb.acao.oponentes.some(o => o.nome)),
      'nenhum oponente com arma nomeada');
  });

  await t.test('cobre as três condições de gatilho que o compilador entende', (t2) => {
    const tipos = new Set(c.capitulos.flatMap(cap => cap.cenas)
      .flatMap(s => s.gatilhos).map(x => x.condicao.tipo));
    t2.diagnostic([...tipos].join(', '));
    for (const esperado of ['menciona', 'turnos', 'sempre'])
      assert.ok(tipos.has(esperado), `nenhum gatilho do tipo "${esperado}"`);
  });

  await t.test('cobra custo nas quatro trilhas que o Diretor aplica', (t2) => {
    const campos = new Set();
    for (const cap of c.capitulos) for (const cena of cap.cenas) for (const o of cena.opcoes)
      for (const d of [o.sucesso, o.falha])
        (d && d.custos || []).forEach(x => campos.add(x.campo));
    t2.diagnostic([...campos].join(', '));
    for (const esperado of ['fome', 'macula', 'dano', 'vontade'])
      assert.ok(campos.has(esperado), `nenhum custo em "${esperado}"`);
  });

  await t.test('e o Diretor consegue abrir a primeira cena', (t2) => {
    const estado = g.Diretor.iniciar(c);
    const ab = g.Diretor.abrirCena(c, estado, estado.cena);
    const tipos = ab.eventos.map(e => e.tipo);
    t2.diagnostic(`cena "${estado.cena}" · eventos: ${tipos.join(', ')}`);
    assert.ok(tipos.includes('narracao'), 'a abertura não produziu narração');
    assert.equal(estado.cena, 'camarim');
  });
});

test('Compilador — o nome do traço vira o id dele (§72)', async (t) => {

  /* Antes da §72 o compilador só slugificava. "Subterfúgio" virava
     `subterfugio`, e `Dados.piscinaDe` lia `habilidades.subterfugio`
     — que não existe. A rota parecia válida e valia ZERO DADOS, em
     silêncio. E "Subterfúgio" é justamente a grafia que o
     `narracao-ia.md` §4.7 manda usar. */

  const rotaDe = (par) => {
    const c = g.Compilador.compilar(
      `# C\n## Cena :: X\nlocal: x\n\n### Opções\n- intencao: agir\n  rotas:\n  - ${par} :: "t"\n`);
    return c.capitulos[0].cenas[0].opcoes[0].rotas[0];
  };

  await t.test('os seis nomes que não batem com o id interno', (t2) => {
    const casos = [
      ['Manipulação + Subterfúgio',   'manipulacao', 'labia'],
      ['Raciocínio + Sagacidade',     'raciocinio',  'intuicao'],
      ['Destreza + Ladroagem',        'destreza',    'furto'],
      ['Inteligência + Erudição',     'inteligencia','academicos'],
      ['Inteligência + Ciência',      'inteligencia','ciencias'],
      ['Raciocínio + Percepção',      'raciocinio',  'consciencia']
    ];
    for (const [par, atr, per] of casos) {
      const r = rotaDe(par);
      t2.diagnostic(`${par} → ${r.atributo} + ${r.pericia}`);
      assert.equal(r.atributo, atr, par);
      assert.equal(r.pericia, per, par);
    }
  });

  await t.test('e a parada montada com esse id dá dados de verdade', (t2) => {
    /* A prova de que importa: com o slug cru a parada some. */
    const f = fichaDeTeste(g);
    f.habilidades.labia = 3;
    const boa  = g.Dados.piscinaDe(f, 'manipulacao', rotaDe('Manipulação + Subterfúgio').pericia);
    const crua = g.Dados.piscinaDe(f, 'manipulacao', 'subterfugio');
    t2.diagnostic(`com o id certo: ${boa.total} dados · com o slug cru: ${crua.total}`);
    assert.ok(boa.total > crua.total, 'o id resolvido não mudou nada na parada');
  });

  await t.test('o id interno continua aceito, para não quebrar o que já existe', () => {
    const r = rotaDe('Manipulação + Lábia');
    assert.equal(r.pericia, 'labia');
  });

  await t.test('nome que não existe passa reto, e o erro aparece na rota', () => {
    /* O compilador não inventa: se não conhece, devolve o slug, e
       quem confere é o teste da campanha. */
    const r = rotaDe('Manipulação + Sarcasmo');
    assert.equal(r.pericia, 'sarcasmo');
  });
});

test('Campanha — nenhuma cena fica inalcançável (§72)', async (t) => {

  /* O compilador confere se todo DESTINO existe. Não confere o
     inverso: se toda CENA é destino de alguém. Ao emendar o grafo
     desta campanha eu deixei a última cena órfã — compilava com zero
     erros e era impossível de chegar nela jogando.

     O compilador não vai passar a cobrar isso: cena solta é legítima
     numa campanha modular (a §70.2 descreve exatamente isso no
     Apêndice II). Mas NESTA campanha não é, e é isto que o teste
     tranca. */
  const md = fs.readFileSync(path.join(RAIZ, 'campanhas', 'a-conta-do-duarte.md'), 'utf8');
  const c = g.Compilador.compilar(md);
  const cenas = c.capitulos.flatMap(cap => cap.cenas);

  const alvos = new Set();
  for (const s of cenas) {
    for (const o of s.opcoes)
      for (const d of [o.sucesso, o.falha]) if (d && d.destino) alvos.add(d.destino);
    for (const gt of s.gatilhos) if (gt.acao.tipo === 'ir') alvos.add(gt.acao.destino);
    s.saidas.forEach(x => alvos.add(x));
  }

  await t.test('toda cena depois da primeira é destino de alguém', (t2) => {
    const orfas = cenas.slice(1).map(s => s.id).filter(id => !alvos.has(id));
    t2.diagnostic(`${cenas.length} cenas · ${alvos.size} destinos citados`);
    assert.equal(orfas.length, 0, `cena(s) inalcançável(is): ${orfas.join(', ')}`);
  });

  await t.test('e a última cena não empurra para lugar nenhum', (t2) => {
    /* O outro lado do mesmo erro: uma cena final que aponta para si
       mesma prende o jogador num laço. A última não tem destino. */
    const ultima = cenas[cenas.length - 1];
    const destinos = ultima.opcoes
      .flatMap(o => [o.sucesso, o.falha]).filter(Boolean).map(d => d.destino).filter(Boolean);
    t2.diagnostic(`${ultima.id}: destinos ${destinos.length ? destinos.join(', ') : 'nenhum'}`);
    assert.equal(destinos.length, 0, `a cena final aponta para ${destinos.join(', ')}`);
  });
});

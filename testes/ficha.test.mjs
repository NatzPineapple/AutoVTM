/* ============================================================
   VITÆ — Testes da área Ficha
   Rodam sem navegador, sem dependência, no runner nativo do Node.

       npm test
       node --test testes/ficha.test.mjs

   O que estes testes NÃO são: uma segunda página de diagnóstico.
   A página roda no navegador, com render de verdade, e cobre a
   costura. Estes rodam em milissegundos, no terminal, e cobrem a
   REGRA — o que dá para afirmar sobre uma ficha sem desenhar nada.
   ============================================================ */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { carregar, fichaDeTeste, memoriaLocal, executar, AREAS, RAIZ, caminhoDe } from './carregar.mjs';

/* Duas áreas. Foram quatro até a §47: FICHA_VAZIA, clan(), predador(),
   cidade() e esc() viviam em front/app.js, e motor-ficha.js chamava
   Dados.piscinaDe(), do Árbitro. Os itens F1 e F2 fecharam as duas
   coisas, e esta linha é a prova mais curta disso.

   Encolher esta lista é o objetivo; encompridá-la é regressão. */
const AREAS_DA_FICHA = ['data', 'ficha'];
const g = carregar(AREAS_DA_FICHA);
const { Ficha, Matilha } = g;

test('Ficha — o índice de força', async (t) => {
  await t.test('devolve total, faixa e componentes', () => {
    const i = Ficha.indiceForca(fichaDeTeste(g));
    assert.ok(Number.isFinite(i.total), 'total tem que ser número');
    assert.ok(i.total >= 0 && i.total <= 100, `total ${i.total} fora de 0–100`);
    assert.ok(i.faixa && i.faixa.nome, 'faixa precisa ter nome');
    assert.ok(i.componentes && typeof i.componentes === 'object');
  });

  await t.test('cresce quando a ficha melhora, e nunca encolhe', () => {
    const fraca = fichaDeTeste(g, {
      atributos: { forca: 1, destreza: 1, vigor: 1, carisma: 1, manipulacao: 1,
                   autocontrole: 1, inteligencia: 1, raciocinio: 1, determinacao: 1 },
      habilidades: {}, disciplinas: {}, poderes: {}
    });
    const forte = fichaDeTeste(g, {
      atributos: { forca: 5, destreza: 4, vigor: 5, carisma: 3, manipulacao: 3,
                   autocontrole: 4, inteligencia: 3, raciocinio: 4, determinacao: 4 },
      habilidades: { briga: 5, atletismo: 4, furtividade: 4, intimidacao: 4, persuasao: 3 },
      disciplinas: { potencia: 4, celeridade: 3, fortitude: 2 }
    });
    assert.ok(Ficha.indiceForca(forte).total > Ficha.indiceForca(fraca).total,
      'ficha claramente melhor tem que dar índice maior');
  });

  await t.test('é determinístico: a mesma ficha dá sempre o mesmo número', () => {
    const f = fichaDeTeste(g);
    const a = Ficha.indiceForca(f).total;
    for (let i = 0; i < 20; i++) {
      assert.equal(Ficha.indiceForca(f).total, a, 'o índice variou entre chamadas');
    }
  });

  await t.test('não estoura com ficha vazia', () => {
    const i = Ficha.indiceForca(g.FICHA_VAZIA());
    assert.ok(Number.isFinite(i.total));
    assert.ok(i.faixa && i.faixa.nome);
  });

  await t.test('todo domínio declarado aponta para atributo e perícia que existem', () => {
    const atributos = new Set(Object.values(g.ATRIBUTOS).flatMap(x => x.lista.map(a => a.id)));
    const pericias = new Set(Object.values(g.HABILIDADES).flatMap(x => x.lista.map(h => h.id)));
    const quebrados = [];
    for (const [id, d] of Object.entries(Ficha.DOMINIOS)) {
      for (const a of d.atributos) if (!atributos.has(a)) quebrados.push(`${id}.${a}`);
      for (const p of d.pericias) if (!pericias.has(p)) quebrados.push(`${id}.${p}`);
    }
    assert.deepEqual(quebrados, [], 'domínio citando id inexistente');
  });
});

test('Ficha — a calibragem', async (t) => {
  await t.test('devolve dificuldade base dentro da faixa do V5', () => {
    const c = Ficha.calibragem(fichaDeTeste(g));
    assert.ok(c.dificuldadeBase >= 1 && c.dificuldadeBase <= 7,
      `dificuldade ${c.dificuldadeBase} fora de 1–7`);
    assert.ok(c.rotasPorObstaculo >= 1);
  });

  await t.test('ficha mais forte não recebe dificuldade menor', () => {
    const fraca = fichaDeTeste(g, {
      atributos: { forca: 1, destreza: 1, vigor: 1, carisma: 1, manipulacao: 1,
                   autocontrole: 1, inteligencia: 1, raciocinio: 1, determinacao: 1 },
      habilidades: {}, disciplinas: {}, poderes: {}
    });
    const forte = fichaDeTeste(g, {
      atributos: { forca: 5, destreza: 4, vigor: 5, carisma: 3, manipulacao: 3,
                   autocontrole: 4, inteligencia: 3, raciocinio: 4, determinacao: 4 },
      habilidades: { briga: 5, atletismo: 4, furtividade: 4, intimidacao: 4 },
      disciplinas: { potencia: 4, celeridade: 3 }
    });
    assert.ok(Ficha.calibragem(forte).dificuldadeBase >= Ficha.calibragem(fraca).dificuldadeBase,
      'a calibragem tem que subir o preço, nunca baixar, quando a ficha cresce');
  });
});

test('Ficha — derivados do V5', async (t) => {
  await t.test('Vitalidade é Vigor + 3 (básico, pág. 136)', () => {
    for (const vigor of [1, 2, 3, 4, 5]) {
      const f = fichaDeTeste(g);
      f.atributos.vigor = vigor;
      assert.equal(g.derivados(f).vitalidade, vigor + 3, `Vigor ${vigor}`);
    }
  });

  await t.test('Força de Vontade é Autocontrole + Determinação', () => {
    const f = fichaDeTeste(g);
    f.atributos.autocontrole = 4;
    f.atributos.determinacao = 2;
    assert.equal(g.derivados(f).vontade, 6);
  });

  await t.test('Humanidade começa em 7', () => {
    const f = fichaDeTeste(g);
    f.humanidadeMod = 0;
    assert.equal(g.derivados(f).humanidade, 7);
  });

  await t.test('o modificador de Humanidade entra no cálculo', () => {
    const f = fichaDeTeste(g, { humanidadeMod: -2 });
    assert.equal(g.derivados(f).humanidade, 5);
  });
});

test('Ficha — o extrator para JSON', async (t) => {
  await t.test('produz JSON válido e com as seções esperadas', () => {
    const bruto = Ficha.json(fichaDeTeste(g));
    const j = JSON.parse(bruto);
    for (const chave of ['vitais', 'dominios', 'calibragem', 'indiceForca']) {
      assert.ok(chave in j, `falta a seção "${chave}"`);
    }
  });

  await t.test('o Índice de Força vai no JSON, que é consumo do motor', () => {
    /* Ele é INTERNO para o jogador (§4.5) e continua existindo para o
       motor e para o modelo. Uma coisa não é a outra. */
    const j = JSON.parse(Ficha.json(fichaDeTeste(g)));
    assert.ok(Number.isFinite(j.indiceForca.total));
  });

  await t.test('não vaza a ficha em edição do criador', () => {
    /* O front tem um `S` global. Se o extrator lesse dele em vez do
       parâmetro, duas fichas diferentes dariam o mesmo JSON. */
    const a = fichaDeTeste(g, { nome: 'Primeira' });
    const b = fichaDeTeste(g, { nome: 'Segunda', cla: 'toreador' });
    g.S = a;
    const jb = JSON.parse(Ficha.json(b));
    assert.ok(jb.identidade ? jb.identidade.nome !== 'Primeira' : true,
      'o extrator leu a ficha do criador em vez do parâmetro');
    assert.notEqual(JSON.stringify(Ficha.json(a)), JSON.stringify(Ficha.json(b)));
  });
});

test('Ficha — a biblioteca', async (t) => {
  const comMemoria = () => {
    const mem = memoriaLocal();
    const ctx = carregar(AREAS_DA_FICHA, { localStorage: mem });
    return { ctx, mem };
  };

  await t.test('guarda, lista, lê e apaga', () => {
    const { ctx } = comMemoria();
    assert.deepEqual(ctx.listarFichas(), [], 'começa vazia');

    const id = ctx.guardarFicha(fichaDeTeste(ctx, { nome: 'Inácia' }));
    assert.ok(id, 'guardarFicha tem que devolver um id');
    assert.equal(ctx.listarFichas().length, 1);
    assert.equal(ctx.fichaPorId(id).nome, 'Inácia');

    ctx.apagarFicha(id);
    assert.deepEqual(ctx.listarFichas(), [], 'apagar tem que esvaziar');
  });

  await t.test('guardar duas vezes a mesma ficha não duplica', () => {
    const { ctx } = comMemoria();
    const f = fichaDeTeste(ctx, { nome: 'Inácia' });
    const id = ctx.guardarFicha(f);
    ctx.guardarFicha(ctx.fichaPorId(id));
    assert.equal(ctx.listarFichas().length, 1, 'a mesma ficha virou duas');
  });

  await t.test('fichas diferentes convivem', () => {
    const { ctx } = comMemoria();
    ctx.guardarFicha(fichaDeTeste(ctx, { nome: 'Inácia', cla: 'lasombra' }));
    ctx.guardarFicha(fichaDeTeste(ctx, { nome: 'Outra', cla: 'brujah' }));
    assert.equal(ctx.listarFichas().length, 2);
  });

  await t.test('ler ficha inexistente devolve nada, não estoura', () => {
    const { ctx } = comMemoria();
    assert.doesNotThrow(() => ctx.fichaPorId('nao_existe'));
    assert.ok(!ctx.fichaPorId('nao_existe'));
  });

  await t.test('ficha sem nome não é guardada', () => {
    const { ctx } = comMemoria();
    assert.equal(ctx.guardarFicha(fichaDeTeste(ctx, { nome: '' })), null);
    assert.deepEqual(ctx.listarFichas(), []);
  });

  await t.test('quando o storage estoura, guardarFicha devolve null — não mente', () => {
    /* Este é o contraponto do item 2 da §14.1: sessoes.js engole a
       QuotaExceededError num catch vazio e o jogador acha que salvou.
       A biblioteca de fichas faz certo, e o teste tranca esse acerto. */
    const mem = memoriaLocal({ cota: 400 });
    const ctx = carregar(AREAS_DA_FICHA, { localStorage: mem });
    const enorme = fichaDeTeste(ctx, { nome: 'Gorda', historia: 'x'.repeat(5000) });
    assert.equal(ctx.guardarFicha(enorme), null, 'guardou o que não cabia');
    assert.deepEqual(ctx.listarFichas(), [], 'a lista ficou com fantasma');
  });

  await t.test('atravessa uma volta completa de gravação sem perder campo', () => {
    const { ctx } = comMemoria();
    const antes = fichaDeTeste(ctx, { nome: 'Inácia', sexo: 'intersexo_nulo' });
    const id = ctx.guardarFicha(antes);
    const depois = ctx.fichaPorId(id);
    for (const chave of ['nome', 'cla', 'seita', 'predador', 'sexo', 'geracao']) {
      assert.equal(depois[chave], antes[chave], `o campo "${chave}" mudou na ida e volta`);
    }
    assert.deepEqual(depois.atributos, antes.atributos);
    assert.deepEqual(depois.disciplinas, antes.disciplinas);
  });
});

test('Ficha — a matilha', async (t) => {
  const sabado = (ctx, nome) => fichaDeTeste(ctx, { nome, seita: 'sabbat' });

  await t.test('nasce com id e é encontrável por ele', () => {
    const ctx = carregar(AREAS_DA_FICHA, { localStorage: memoriaLocal() });
    const grupo = ctx.Matilha.criar('Matilha do Túnel');
    assert.ok(grupo && grupo.id, 'a matilha precisa nascer com id');
    assert.equal(ctx.Matilha.porId(grupo.id).nome, 'Matilha do Túnel');
  });

  await t.test('é coletiva: duas fichas do Sabá veem o mesmo grupo', () => {
    /* Este é o ponto inteiro do motor-matilha: a matilha não mora dentro
       de uma ficha, mora fora, e as fichas só guardam o vínculo. */
    const ctx = carregar(AREAS_DA_FICHA, { localStorage: memoriaLocal() });
    const a = sabado(ctx, 'Sabá A');
    const b = sabado(ctx, 'Sabá B');
    const grupo = ctx.Matilha.criar('Matilha do Túnel');

    ctx.Matilha.entrar(a, grupo.id);
    ctx.Matilha.entrar(b, grupo.id);

    assert.ok(ctx.Matilha.de(a), 'a ficha A perdeu a própria matilha');
    assert.equal(ctx.Matilha.de(b).id, ctx.Matilha.de(a).id,
      'as duas fichas deviam estar na mesma matilha');
    assert.equal(ctx.Matilha.de(a).membros.length, 2, 'faltou membro no grupo');
  });

  await t.test('entrar duas vezes não duplica o membro', () => {
    const ctx = carregar(AREAS_DA_FICHA, { localStorage: memoriaLocal() });
    const f = sabado(ctx, 'Sabá A');
    const grupo = ctx.Matilha.criar('Matilha do Túnel');
    ctx.Matilha.entrar(f, grupo.id);
    ctx.Matilha.entrar(f, grupo.id);
    assert.equal(ctx.Matilha.porId(grupo.id).membros.length, 1);
  });

  await t.test('quem não segue Caminho não tem matilha', () => {
    /* A bússola da Camarilla é Humanidade, e Matilha.de() devolve null.
       Isso é regra, não conveniência: matilha é estrutura do Sabá. */
    const ctx = carregar(AREAS_DA_FICHA, { localStorage: memoriaLocal() });
    const camarilla = fichaDeTeste(ctx, { nome: 'Da Torre', seita: 'camarilla' });
    assert.equal(ctx.Matilha.de(camarilla), null);
  });

  await t.test('o vínculo sobrevive à gravação da ficha', () => {
    const ctx = carregar(AREAS_DA_FICHA, { localStorage: memoriaLocal() });
    const f = sabado(ctx, 'Sabá A');
    const grupo = ctx.Matilha.criar('Matilha do Túnel');
    ctx.Matilha.entrar(f, grupo.id);

    const id = ctx.guardarFicha(f);
    const voltou = ctx.fichaPorId(id);
    assert.ok(ctx.Matilha.de(voltou), 'a ficha voltou do storage sem matilha');
    assert.equal(ctx.Matilha.de(voltou).id, grupo.id);
  });
});

/* ============================================================
   A INDEPENDÊNCIA DA ÁREA — itens F1 a F4 da §45.1
   ============================================================ */

test('Ficha — a área é independente do front', async (t) => {
  await t.test('carrega sem front e sem Árbitro', () => {
    /* O teste inteiro roda assim; isto é o enunciado explícito. */
    assert.doesNotThrow(() => carregar(['data', 'ficha']));
  });

  await t.test('nenhum arquivo da área menciona o `S` do criador', () => {
    /* A varredura é no código-fonte, porque o acoplamento volta por
       descuido, não por decisão. Comentário não conta. */
    const semComentario = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    const sujos = [];
    for (const nome of AREAS.ficha) {
      const fonte = semComentario(
        fs.readFileSync(path.join(RAIZ, caminhoDe('ficha', nome)), 'utf8'));
      const m = fonte.match(/(?<![\w$.])S\s*[.[]/g);
      if (m) sujos.push(`${nome}.js (${m.length})`);
    }
    assert.deepEqual(sujos, [], 'a área Ficha voltou a ler o S global');
  });

  await t.test('nenhuma função da área usa a ficha do criador como padrão', () => {
    /* `function f(x = S)` é a forma benigna do mesmo defeito: passa
       despercebida porque quem passa argumento fica seguro. */
    const sujos = [];
    for (const nome of AREAS.ficha) {
      const fonte = fs.readFileSync(path.join(RAIZ, caminhoDe('ficha', nome)), 'utf8');
      if (/[(,]\s*\w+\s*=\s*S\s*[),]/.test(fonte)) sujos.push(`${nome}.js`);
    }
    assert.deepEqual(sujos, [], 'voltou a existir parâmetro com padrão S');
  });

  await t.test('o Índice de Força não chama o Árbitro (F2)', () => {
    const fonte = fs.readFileSync(path.join(RAIZ, caminhoDe('ficha', 'motor-ficha')), 'utf8');
    assert.ok(!/\bDados\./.test(fonte), 'motor-ficha voltou a chamar Dados');
  });

  await t.test('e a piscina continua dando o mesmo número dos dois lados', () => {
    /* `Dados.piscinaDe` passou a delegar. Se as duas divergirem, o
       Árbitro e a ficha param de concordar sobre a mesma reserva — que
       é o defeito nº 1 da auditoria, de novo. */
    const dois = carregar(['data', 'ficha', 'arbitro']);
    const f = fichaDeTeste(dois);
    f.especializacoes = { briga: 'Bar de esquina' };
    assert.equal(dois.Dados.piscinaDe(f, 'forca', 'briga').total,
                 dois.piscinaDaFicha(f, 'forca', 'briga').total);
  });
});

test('Ficha — o parâmetro é respeitado (F3)', async (t) => {
  /* Estas quatro funções recebiam a ficha e liam `S` mesmo assim.
     Validar uma ficha da biblioteca devolvia o resultado da ficha
     aberta no criador. Cada teste aqui reprovava antes da §47. */
  const camarilla = () => fichaDeTeste(g, {
    nome: 'Da Torre', seita: 'camarilla', cla: 'ventrue',
    antecedentes: { status: 3 }
  });
  const sabado = () => fichaDeTeste(g, { nome: 'Do Sabá', seita: 'sabbat' });

  await t.test('validarSeita julga a ficha recebida, não outra', () => {
    const a = camarilla(), b = sabado();
    const erroA = JSON.stringify(g.validarSeita(a));
    const erroB = JSON.stringify(g.validarSeita(b));
    assert.notEqual(erroA, erroB, 'duas seitas diferentes deram o mesmo veredito');
  });

  await t.test('as contagens contam a ficha recebida', () => {
    const magra = fichaDeTeste(g, { disciplinas: {}, antecedentes: {}, meritos: {}, defeitos: {} });
    const cheia = fichaDeTeste(g, {
      disciplinas: { potencia: 3, celeridade: 2 },
      antecedentes: { recursos: 3 }, meritos: { contatos: 2 }, defeitos: { inimigo: 2 }
    });
    assert.equal(g.totalPontosDisc(magra), 0);
    assert.equal(g.totalPontosDisc(cheia), 5);
    assert.equal(g.totalVantagens(cheia), 5);
    assert.equal(g.totalDefeitos(cheia), 2);
  });

  await t.test('disciplinasDisponiveis segue o clã da ficha recebida', () => {
    const brujah = fichaDeTeste(g, { cla: 'brujah' });
    const toreador = fichaDeTeste(g, { cla: 'toreador' });
    assert.notDeepEqual(g.disciplinasDisponiveis(brujah), g.disciplinasDisponiveis(toreador));
  });

  await t.test('duas fichas na mesma sessão não se contaminam', () => {
    /* O caso que fecha o item: as duas existem ao mesmo tempo, e cada
       chamada tem que responder pela sua. */
    const a = camarilla(), b = sabado();
    const antes = JSON.stringify(g.validarSeita(a));
    g.validarSeita(b);
    g.pendenciasDaFicha(b);
    assert.equal(JSON.stringify(g.validarSeita(a)), antes, 'a ficha A mudou de veredito');
  });
});

test('Ficha — persistência não escreve na ficha em edição (F4)', async (t) => {
  await t.test('apagar devolve true/false e não sabe de criador nenhum', () => {
    const ctx = carregar(AREAS_DA_FICHA, { localStorage: memoriaLocal() });
    const id = ctx.guardarFicha(fichaDeTeste(ctx, { nome: 'Inácia' }));
    assert.equal(ctx.apagarFicha(id), true);
    assert.equal(ctx.apagarFicha(id), false, 'apagar o que já não existe devia dar false');
  });

  await t.test('guardar marca o fichaId na ficha que recebeu', () => {
    const ctx = carregar(AREAS_DA_FICHA, { localStorage: memoriaLocal() });
    const f = fichaDeTeste(ctx, { nome: 'Inácia' });
    const id = ctx.guardarFicha(f);
    assert.equal(f.fichaId, id, 'a ficha recebida não foi marcada');
  });
});

test('Ficha — a matilha não some em silêncio (F5)', async (t) => {
  await t.test('guardar devolve true quando cabe', () => {
    const ctx = carregar(AREAS_DA_FICHA, { localStorage: memoriaLocal() });
    assert.equal(ctx.Matilha.guardar({}), true);
  });

  await t.test('e false quando não cabe', () => {
    const ctx = carregar(AREAS_DA_FICHA, { localStorage: memoriaLocal({ cota: 5 }) });
    assert.equal(ctx.Matilha.guardar({ x: 'y'.repeat(500) }), false);
  });

  await t.test('criar devolve null quando a gravação falha', () => {
    /* Antes: devolvia um registro com id, que nunca existiu no disco.
       O jogador via a matilha na tela e ela sumia ao recarregar. */
    const ctx = carregar(AREAS_DA_FICHA, { localStorage: memoriaLocal({ cota: 40 }) });
    assert.equal(ctx.Matilha.criar('Matilha do Túnel'), null);
  });
});

test('Ficha — a folha oficial', async (t) => {
  await t.test('gera as duas folhas com o nome do personagem', () => {
    const html = g.fichaOficialHTML(fichaDeTeste(g, { nome: 'Inácia Vasques' }));
    assert.ok(typeof html === 'string' && html.length > 500, 'a folha veio vazia');
    assert.ok(html.includes('Inácia Vasques'), 'o nome não apareceu na folha');
  });

  await t.test('escapa o que o jogador escreve', () => {
    const html = g.fichaOficialHTML(fichaDeTeste(g, { nome: '<script>alert(1)</script>' }));
    assert.ok(!html.includes('<script>alert(1)</script>'), 'HTML do jogador entrou cru na folha');
  });

  await t.test('não vaza a ficha em edição do criador', () => {
    /* §37.7 fez a folha receber a ficha por parâmetro. Se ela voltar a
       ler o `S` global, este teste cai. */
    g.S = fichaDeTeste(g, { nome: 'DO_CRIADOR' });
    const html = g.fichaOficialHTML(fichaDeTeste(g, { nome: 'DO_PARAMETRO' }));
    assert.ok(html.includes('DO_PARAMETRO'), 'a folha ignorou o parâmetro');
    assert.ok(!html.includes('DO_CRIADOR'), 'a folha leu o S global do criador');
  });

  await t.test('não devolve o Índice de Força para o jogador', () => {
    /* Decisão da §16.2: o número é interno. */
    const html = g.fichaOficialHTML(fichaDeTeste(g));
    assert.ok(!/Índice de Força/i.test(html), 'o Índice de Força voltou para a folha');
  });
});

/* ============================================================
   §77 — TIPOS DE PREDADOR (básico, págs. 175–178)

   O capítulo tem DEZ tipos, e o projeto trazia dezesseis — seis
   deles do Guia do Jogador, misturados sem distinção. Dos dez do
   básico, SEIS estavam com nome inventado e quase todos com
   mecânica errada.
   ============================================================ */

test('Predadores — os dez do básico, pela página (§77)', async (t) => {

  const doLivro = () => g.PREDADORES.filter(p => p.pagina >= 175 && p.pagina <= 178);

  await t.test('são exatamente dez, e todos declaram a página', (t2) => {
    const dez = doLivro();
    t2.diagnostic(dez.map(p => `${p.nome} (${p.pagina})`).join(' · '));
    assert.equal(dez.length, 10, 'o capítulo do básico tem dez tipos');
  });

  await t.test('os nomes são os do livro, e não os que o projeto inventou', (t2) => {
    /* Seis dos dez estavam traduzidos por conta própria. Dois deles o
       livro nem traduz: "Sandman" e "Scene Queen" ficam em inglês. */
    const nomes = doLivro().map(p => p.nome).sort();
    t2.diagnostic(nomes.join(' · '));
    assert.equal(nomes.join(' · '),
      'Consensualista · Fazendeiro · Osíris · Sacoleiro · Sandman · Sanguessuga · ' +
      'Scene Queen · Sereia · Trinchador · Vira-lata');
    const inventados = ['Gato de Rua', 'Ensacador', 'João-Pestana', 'Rainha da Cena',
                        'Cutelo', 'Sanguessuga de Sangue'];
    for (const velho of inventados)
      assert.ok(!nomes.includes(velho), `"${velho}" voltou: não é o nome do livro`);
  });

  await t.test('ficha salva com o id velho continua achando o Predador', (t2) => {
    /* Os ids acompanharam os nomes. Sem o mapa, toda ficha salva
       perderia o Predador em silêncio — a lição da §75.5. */
    for (const [velho, novo] of Object.entries(g.PREDADORES_RENOMEADOS)) {
      const p = g.predadorDe(velho);
      t2.diagnostic(`${velho} → ${p ? p.id : '(perdido)'}`);
      assert.ok(p, `o id antigo "${velho}" não resolve mais`);
      assert.equal(p.id, novo);
    }
  });

  await t.test('as Disciplinas de cada um são as da página', (t2) => {
    /* Cinco dos dez estavam com Disciplina errada. */
    const esperado = {
      consensualista: 'auspicios,fortitude',
      fazendeiro:     'animalismo,metamorfose',
      osiris:         'feiticaria,presenca',
      sacoleiro:      'feiticaria,ofuscacao',
      sandman:        'auspicios,ofuscacao',
      sanguessuga:    'celeridade,metamorfose',
      scene_queen:    'dominacao,potencia',
      sereia:         'fortitude,presenca',
      trinchador:     'dominacao,animalismo',
      vira_lata:      'celeridade,potencia'
    };
    for (const p of doLivro()) {
      t2.diagnostic(`${p.nome}: ${p.disciplina.join(', ')}`);
      assert.equal(p.disciplina.join(','), esperado[p.id], p.nome);
    }
  });

  await t.test('toda Disciplina citada existe de verdade', () => {
    for (const p of doLivro())
      for (const d of p.disciplina)
        assert.ok(g.DISCIPLINAS[d], `${p.nome} cita "${d}", que não existe`);
  });

  await t.test('toda especialização aponta para uma Habilidade real', (t2) => {
    const ids = Object.values(g.HABILIDADES).flatMap(x => x.lista).map(h => h.id);
    let n = 0;
    for (const p of doLivro())
      for (const [hid, nome] of p.especializacao.opcoes) {
        n++;
        assert.ok(ids.includes(hid), `${p.nome} cita a Habilidade "${hid}", que não existe`);
        assert.ok(nome && nome.length > 2, `${p.nome}: especialização sem nome`);
      }
    t2.diagnostic(`${n} especializações conferidas`);
  });

  await t.test('o Sanguessuga ganha Potência de Sangue, e é o único', (t2) => {
    /* "Aumente a Potência de Sangue em um" (pág. 177). O projeto não
       tinha isso em lugar nenhum dos dez. */
    const comPS = doLivro().filter(p => p.potenciaSangue);
    t2.diagnostic(comPS.map(p => `${p.nome} +${p.potenciaSangue}`).join(', ') || 'nenhum');
    assert.equal(comPS.length, 1);
    assert.equal(comPS[0].id, 'sanguessuga');
    assert.equal(comPS[0].potenciaSangue, 1);
  });

  await t.test('quem mexe na Humanidade mexe na direção certa', (t2) => {
    const mapa = {};
    for (const p of doLivro()) if (p.humanidade) mapa[p.id] = p.humanidade;
    t2.diagnostic(JSON.stringify(mapa));
    assert.deepEqual(mapa, {
      consensualista: 1, fazendeiro: 1, sanguessuga: -1, vira_lata: -1
    });
  });

  await t.test('a Feitiçaria de Sangue vem marcada como só de Tremere', () => {
    /* "Ganhe um ponto em Feitiçaria de Sangue (somente Tremere)" —
       vale para Osíris e Sacoleiro (pág. 176). */
    for (const id of ['osiris', 'sacoleiro']) {
      const p = g.predadorDe(id);
      assert.ok(p.disciplina.includes('feiticaria'), `${p.nome} perdeu a Feitiçaria`);
      assert.equal((p.disciplinaRestrita || {}).feiticaria, 'tremere',
        `${p.nome} não marca a restrição de clã`);
    }
  });
});

test('Predadores — as travas que o livro impõe (§77)', async (t) => {

  const ficha = (extra) => Object.assign(fichaDeTeste(g), extra);

  await t.test('Ventrue não pode ser Fazendeiro nem Sacoleiro', (t2) => {
    /* Básico, pág. 176, nos dois verbetes. Nenhuma das duas travas
       existia: um Ventrue saía do criador como Fazendeiro. */
    const v = ficha({ cla: 'ventrue', seita: 'camarilla' });
    const permitidos = g.Seitas.predadoresPermitidos(v, { potencia: 1 }).map(p => p.id);
    t2.diagnostic(`Ventrue pode: ${permitidos.length} tipos`);
    assert.ok(!permitidos.includes('fazendeiro'), 'Ventrue pôde ser Fazendeiro');
    assert.ok(!permitidos.includes('sacoleiro'), 'Ventrue pôde ser Sacoleiro');
  });

  await t.test('e outro clã pode os dois', () => {
    const b = ficha({ cla: 'brujah', seita: 'camarilla' });
    const permitidos = g.Seitas.predadoresPermitidos(b, { potencia: 1 }).map(p => p.id);
    assert.ok(permitidos.includes('fazendeiro'));
    assert.ok(permitidos.includes('sacoleiro'));
  });

  await t.test('Fazendeiro sai da lista com Potência de Sangue 3', (t2) => {
    /* "Você não pode escolher Fazendeiro se sua Potência de Sangue
       for 3 ou mais." (pág. 176) */
    const f = ficha({ cla: 'brujah', seita: 'camarilla' });
    for (const ps of [1, 2, 3, 4]) {
      const pode = g.Seitas.predadoresPermitidos(f, { potencia: ps }).some(p => p.id === 'fazendeiro');
      t2.diagnostic(`Potência ${ps}: ${pode ? 'pode' : 'não pode'}`);
      assert.equal(pode, ps <= 2, `Potência ${ps}`);
    }
  });

  await t.test('sem a Potência informada, a trava não é aplicada — e é de propósito', () => {
    /* A camada de dados não alcança `derivados`. Quem sabe a Potência
       passa; quem não passa recebe a lista sem essa trava, e isso está
       escrito no código em vez de acontecer calado. */
    const f = ficha({ cla: 'brujah', seita: 'camarilla' });
    assert.ok(g.Seitas.predadoresPermitidos(f).some(p => p.id === 'fazendeiro'));
  });
});

/* ============================================================
   FICHA PARCIAL NÃO DERRUBA A BIBLIOTECA  (§85)

   Antes da §85 toda ficha da biblioteca vinha do criador, e o
   criador sempre produz forma completa. Desde a §85 ela pode vir
   do FichaServer, de outra máquina ou de um `.json` importado — e
   `pendenciasDaFicha` lia `f.atributos`, `f.habilidades`,
   `f.especializacoes` e `f.conviccoes` sem perguntar.

   O estrago era desproporcional: UMA ficha incompleta derrubava a
   TELA INTEIRA, porque `listarFichas().map(resumoDaFicha)` morre
   na primeira.
   ============================================================ */

test('Ficha — a ficha parcial não derruba a biblioteca (§85)', async (t) => {
  const g = carregar(['data', 'ficha'], { localStorage: memoriaLocal() });

  const PARCIAIS = {
    'só nome e clã':        { fichaId: 'a__brujah', nome: 'A', cla: 'brujah' },
    'só nome':              { fichaId: 'b__sem', nome: 'B' },
    'mapas vazios':         { fichaId: 'c__x', nome: 'C', atributos: {}, habilidades: {} },
    'sem convicções':       { fichaId: 'd__x', nome: 'D', cla: 'toreador', atributos: { forca: 2 } },
    'sem especializações':  { fichaId: 'e__x', nome: 'E', habilidades: { armas_brancas: 3 } }
  };

  await t.test('`pendenciasDaFicha` aceita qualquer uma delas', (t2) => {
    for (const [rotulo, f] of Object.entries(PARCIAIS)) {
      const p = executar(g, `pendenciasDaFicha(${JSON.stringify(f)})`);
      assert.ok(Array.isArray(p.problemas), `${rotulo}: não devolveu problemas`);
      /* E ela DIZ que está incompleta, que é a razão de ela existir. */
      assert.ok(p.problemas.length > 0, `${rotulo}: disse que a ficha está pronta`);
    }
    t2.diagnostic(`${Object.keys(PARCIAIS).length} formas parciais, nenhuma estourou`);
  });

  await t.test('e sem argumento nenhum também não estoura', () => {
    for (const nada of ['undefined', 'null', '{}']) {
      const p = executar(g, `pendenciasDaFicha(${nada})`);
      assert.ok(Array.isArray(p.problemas), `pendenciasDaFicha(${nada}) quebrou`);
    }
  });

  await t.test('a biblioteca inteira desenha com uma parcial no meio', (t2) => {
    /* O caso real: uma ficha ruim entre boas. Antes, a lista inteira
       morria — a tela ficava em branco e o jogador perdia o acesso às
       fichas boas por causa da ruim. */
    const ctx = carregar(['data', 'ficha'], { localStorage: memoriaLocal() });
    const boa = Object.assign(fichaDeTeste(ctx), { fichaId: 'boa__brujah', nome: 'Boa' });
    executar(ctx, `guardarFicha(${JSON.stringify(boa)})`);
    for (const f of Object.values(PARCIAIS)) {
      executar(ctx, `guardarFicha(${JSON.stringify(f)})`);
    }
    const resumos = executar(ctx, 'listarFichas().map(resumoDaFicha)');
    t2.diagnostic(resumos.map(r => `${r.nome}:${r.pendencias}`).join(' · '));
    assert.equal(resumos.length, 6, 'a lista perdeu ficha pelo caminho');
    /* A boa continua sendo lida como boa. */
    const boaResumo = resumos.find(r => r.nome === 'Boa');
    assert.ok(boaResumo, 'a ficha completa sumiu da lista');
    assert.ok(boaResumo.vitalidade > 0, 'a ficha completa perdeu os derivados');
  });

  await t.test('`contagem` sozinha aceita mapa ausente', () => {
    /* Ela é a mais chamada das três, e o `|| {}` mora nela por isso:
       o pressuposto era dela, não de quem a chama. */
    assert.equal(executar(g, 'contagem(undefined, todosAtributos())[1]'), 0);
    assert.equal(executar(g, 'contagem(null, todasHabilidades())[3]'), 0);
  });
});

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
import { carregar, fichaDeTeste, memoriaLocal, AREAS, RAIZ } from './carregar.mjs';

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
        fs.readFileSync(path.join(RAIZ, 'app', 'js', 'ficha', `${nome}.js`), 'utf8'));
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
      const fonte = fs.readFileSync(path.join(RAIZ, 'app', 'js', 'ficha', `${nome}.js`), 'utf8');
      if (/[(,]\s*\w+\s*=\s*S\s*[),]/.test(fonte)) sujos.push(`${nome}.js`);
    }
    assert.deepEqual(sujos, [], 'voltou a existir parâmetro com padrão S');
  });

  await t.test('o Índice de Força não chama o Árbitro (F2)', () => {
    const fonte = fs.readFileSync(path.join(RAIZ, 'app', 'js', 'ficha', 'motor-ficha.js'), 'utf8');
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

/* ============================================================
   VITÆ — Testes da área Front
   A última área a ganhar rede. Ela é a mais difícil de testar
   fora do navegador, e por isso o critério aqui é estreito e
   explícito:

   **Só entra o que dá para afirmar sem DOM de verdade.**

   Isso deixa de fora quase todo o desenho — cor, posição, foco,
   rolagem, animação — que continua sendo território do
   `diagnostico.html`, com render real. E deixa DENTRO três coisas
   que são do front, valem muito e nunca foram testadas:

   1. o HTML que ele gera é HTML VÁLIDO e ESCAPADO;
   2. o despachante tem dono para toda ação que a tela oferece;
   3. o front não decide regra — ele chama quem decide.

   O item 2 só virou possível na §50, quando o `switch` de 48 casos
   virou o mapa `ACOES_MESA`. Antes, "quais ações existem?" era uma
   pergunta que ninguém podia fazer ao código.

       node --test testes/front.test.mjs
   ============================================================ */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { carregar, fichaDeTeste, memoriaLocal, executar, AREAS, RAIZ } from './carregar.mjs';

const TODAS = ['data', 'ficha', 'arbitro', 'cronista', 'front'];

/** Contexto com uma mesa aberta e um personagem de pé. */
function comMesa() {
  const g = carregar(TODAS, { localStorage: memoriaLocal() });
  executar(g, `
    S = FICHA_VAZIA();
    Object.assign(S, ${JSON.stringify(fichaDeTeste(g, { nome: 'Inácia', cidade: 'rio' }))});
    iniciarMesa(S);
  `);
  return g;
}

const fonteFront = (nome) =>
  fs.readFileSync(path.join(RAIZ, 'app', 'js', 'front', `${nome}.js`), 'utf8');

/* ============================================================
   O DESPACHANTE — o que só ficou testável na §50
   ============================================================ */

test('Front — o despachante da mesa', async (t) => {
  const g = comMesa();

  await t.test('é um mapa, e não um switch', () => {
    assert.equal(typeof g.ACOES_MESA, 'object');
    assert.ok(Object.keys(g.ACOES_MESA).length > 40, 'poucas ações no mapa');
  });

  await t.test('toda ação é função', () => {
    const ruins = Object.entries(g.ACOES_MESA)
      .filter(([, v]) => typeof v !== 'function').map(([k]) => k);
    assert.deepEqual(ruins, []);
  });

  await t.test('todo `data-mesa` do HTML tem dono no mapa', () => {
    /* Esta é a checagem que justifica a §50 sozinha. Botão com ação
       que ninguém trata é botão morto — o jogador clica e nada
       acontece, sem erro no console. Foi assim que os botões de
       apagar ficaram mudos na §37. */
    const html = ['mesa-render', 'mesa', 'mesa-acoes'].map(fonteFront).join('\n');
    const usadas = new Set([...html.matchAll(/data-mesa="([a-z-]+)"/g)].map(m => m[1]));
    const orfas = [...usadas].filter(a => !(a in g.ACOES_MESA));
    assert.deepEqual(orfas, [], 'ação oferecida na tela sem ninguém para tratar');
  });

  await t.test('toda ação do mapa é oferecida em algum lugar', () => {
    /* O caminho inverso: ação no mapa que a tela nunca oferece é código
       morto — e código morto num despachante é pior que noutro lugar,
       porque parece funcionalidade.

       Aqui NÃO dá para procurar só `data-mesa="x"`: dezoito ações são
       geradas por um ajudante — `botao('dano', 'sup:1', …)` — e o
       atributo sai de uma interpolação. Então a busca é pelo NOME entre
       aspas em qualquer lugar do front. É mais frouxo, e ainda pega o
       caso que importa: ação que ninguém menciona em canto nenhum. */
    const front = AREAS.front.map(fonteFront).join('\n');
    const mortas = Object.keys(g.ACOES_MESA)
      .filter(a => !front.includes(`'${a}'`) && !front.includes(`"${a}"`));
    assert.deepEqual(mortas, [], 'ação no despachante que a tela não oferece');
  });

  await t.test('ação desconhecida não estoura: avisa', () => {
    assert.equal(g.ACOES_MESA['nao-existe'], undefined);
  });

  await t.test('mudar de aba muda o estado, e só isso', () => {
    /* Uma ação de verdade, chamada direto, sem simular clique. Era
       impossível antes do mapa. */
    executar(g, "ACOES_MESA['aba']('estado')");
    assert.equal(executar(g, 'M.aba'), 'estado');
    executar(g, "ACOES_MESA['aba']('ficha')");
    assert.equal(executar(g, 'M.aba'), 'ficha');
  });

  await t.test('mudar de modo muda o compositor', () => {
    executar(g, "ACOES_MESA['modo']('falar')");
    assert.equal(executar(g, 'M.modo'), 'falar');
    executar(g, "ACOES_MESA['modo']('agir')");
    assert.equal(executar(g, 'M.modo'), 'agir');
  });

  await t.test('apagar sessão pede confirmação antes', () => {
    /* Regra da §37.4, e ela nasceu de um defeito: o `confirm()` do
       navegador devolvia false em silêncio e o botão parecia morto.
       A confirmação vive na interface, nunca no navegador. */
    const ctx = comMesa();
    executar(ctx, 'salvarMesa()');
    const id = executar(ctx, 'listarSessoes()[0].id');
    executar(ctx, `ACOES_MESA['apagar-sessao']('${id}')`);
    assert.equal(executar(ctx, 'listarSessoes().length'), 1, 'apagou no primeiro clique');
    executar(ctx, `ACOES_MESA['apagar-sessao']('${id}')`);
    assert.equal(executar(ctx, 'listarSessoes().length'), 0, 'não apagou no segundo');
  });

  await t.test('nenhum arquivo do front voltou a ter switch de ação', () => {
    for (const nome of AREAS.front) {
      assert.ok(!/switch\s*\(\s*acao\s*\)/.test(fonteFront(nome)),
        `${nome}.js voltou ao switch`);
    }
  });
});

/* ============================================================
   O HTML QUE O FRONT GERA
   ============================================================ */

test('Front — o HTML é válido e escapado', async (t) => {
  const g = comMesa();

  /* Conferência de fechamento por contagem de tags. Não é um parser,
     e não precisa ser: o que ela pega é o erro real do projeto —
     template string com `<div>` que ninguém fechou. */
  const desequilibrio = (html) => {
    const pares = ['div', 'span', 'button', 'section', 'ul', 'ol', 'li', 'p', 'table', 'tr', 'td'];
    const erros = [];
    for (const tag of pares) {
      const abre = (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
      const fecha = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
      if (abre !== fecha) erros.push(`${tag}: ${abre} abertas, ${fecha} fechadas`);
    }
    return erros;
  };

  await t.test('as mensagens da mesa fecham as tags', () => {
    const html = executar(g, 'M.mensagens.map(msgHTML).join("")');
    assert.deepEqual(desequilibrio(html), []);
  });

  await t.test('a doca fecha as tags, em todas as abas', () => {
    for (const aba of ['ficha', 'estado', 'locais', 'pessoas', 'historia', 'registro', 'bolsa']) {
      executar(g, `M.aba = '${aba}'`);
      const html = executar(g, 'typeof docaHTML === "function" ? docaHTML() : ""');
      if (!html) continue;
      assert.deepEqual(desequilibrio(html), [], `aba ${aba}`);
    }
  });

  await t.test('nome com HTML sai como texto, não como marcação', () => {
    /* O jogador escreve o nome. Se ele escrever uma tag e ela sair
       crua, o front dele executa. */
    const ctx = carregar(TODAS, { localStorage: memoriaLocal() });
    executar(ctx, `
      S = FICHA_VAZIA();
      Object.assign(S, ${JSON.stringify(fichaDeTeste(ctx, { nome: '<img src=x onerror=alert(1)>' }))});
      iniciarMesa(S);
    `);
    const html = executar(ctx, 'M.mensagens.map(msgHTML).join("")');
    assert.ok(!/<img src=x/.test(html), 'a tag do jogador entrou crua');
  });

  await t.test('texto do jogador sai escapado no fluxo', () => {
    executar(g, `M.mensagens.push({ id: 'x', autor: 'jogador', modo: 'agir',
      texto: '<script>alert(1)</script>', ts: Date.now(), termos: [] })`);
    const html = executar(g, 'M.mensagens.map(msgHTML).join("")');
    assert.ok(!/<script>alert/.test(html), 'script do jogador entrou cru');
  });

  await t.test('o escape cobre as cinco entidades', () => {
    assert.equal(executar(g, `esc('<>&"\\'')`), '&lt;&gt;&amp;&quot;&#39;');
  });

  await t.test('nenhuma função de render muda estado', () => {
    /* A regra do cabeçalho do `mesa-render.js`, agora conferida: ela
       lê `M` e devolve string. Se escrever, o render vira fluxo e a
       tela passa a depender de quantas vezes foi desenhada. */
    const fonte = fonteFront('mesa-render')
      .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');
    const escritas = [...fonte.matchAll(/^\s*M\.(\w+)\s*=[^=]/gm)].map(m => `M.${m[1]}`);
    assert.deepEqual(escritas, [], 'o render escreveu em M');
  });
});

/* ============================================================
   O FRONT NÃO É DONO DE REGRA
   ============================================================ */

test('Front — quem manda na regra é o motor', async (t) => {
  const g = comMesa();

  await t.test('a piscina que a tela mostra é a que o Árbitro calcula', () => {
    /* A prova do defeito nº 1 da auditoria: interface e rolagem
       davam números diferentes porque cada uma fazia a sua conta. */
    const rota = { atributo: 'forca', pericia: 'briga' };
    const daTela = executar(g, `piscinaDaRota(${JSON.stringify(rota)}, { intencao: 'lutar' }).total`);
    const doMotor = g.Arbitro.piscinaFinal(executar(g, 'M.ficha'), {
      rota, estados: executar(g, 'estadosAtuais()'),
      dominio: (g.Arbitro.ACOES.lutar || {}).dominio,
      intencao: 'lutar',
      disciplina: (g.Arbitro.ACOES.lutar && g.Arbitro.ACOES.lutar.disciplina)
        ? g.Arbitro.ACOES.lutar.disciplina.id : null
    }).total;
    assert.equal(daTela, doMotor);
  });

  await t.test('os estados que a tela usa são os que o Estado deriva', () => {
    executar(g, 'M.ficha.fome = 5');
    const daTela = executar(g, 'estadosAtuais()');
    const doMotor = g.Estado.estadosDe(executar(g, 'M.ficha'), executar(g, 'M.estados'));
    assert.deepEqual([...daTela].sort(), [...doMotor].sort());
    executar(g, 'M.ficha.fome = 1');
  });

  await t.test('o turno passa pela cadeia, não pelo Árbitro direto', async () => {
    /* Item A1 da §45.2, fechado na §48. `typeof === 'function'` provava
       só que o nome existia; agora o teste CHAMA e confere que o
       veredito traz o rastro dos quatro elos. */
    const v = await executar(g, `arbitrarTurno({
      texto: 'ataco o segurança', estados: [], fala: null })`);
    assert.ok(v, 'arbitrarTurno não devolveu veredito');
    assert.ok(v.cadeia, 'o veredito veio sem o rastro dos elos — caiu no Árbitro direto');
    for (const elo of ['interpretador', 'grafo', 'navegacao', 'especialista']) {
      assert.ok(elo in v.cadeia, `falta o elo "${elo}"`);
    }
    assert.ok(/Cadeia\.arbitrar/.test(fonteFront('mesa')), 'a mesa não chama a cadeia');
  });
});

/* ============================================================
   O CRIADOR
   ============================================================ */

test('Front — o criador', async (t) => {
  const g = carregar(TODAS, { localStorage: memoriaLocal() });

  await t.test('os nove painéis geram HTML fechado', () => {
    executar(g, `
      S = FICHA_VAZIA();
      Object.assign(S, ${JSON.stringify(fichaDeTeste(g, { nome: 'Inácia', cidade: 'rio' }))});
    `);
    const painel = (fn) => executar(g, `typeof ${fn} === 'function' ? ${fn}() : ''`);
    const nomes = ['painelCronica', 'painelCla', 'painelAtributos', 'painelHabilidades',
                   'painelDisciplinas', 'painelPredador', 'painelVantagens', 'painelAlma',
                   'painelFicha'];
    const vazios = [], quebrados = [];
    for (const n of nomes) {
      const html = painel(n);
      if (!html || html.length < 50) { vazios.push(n); continue; }
      const abre = (html.match(/<div[\s>]/g) || []).length;
      const fecha = (html.match(/<\/div>/g) || []).length;
      if (abre !== fecha) quebrados.push(`${n}: ${abre} <div> e ${fecha} </div>`);
    }
    assert.deepEqual(vazios, [], 'painel devolveu vazio');
    assert.deepEqual(quebrados, [], 'painel com div desbalanceada');
  });

  await t.test('a ficha em edição é salva, e diz quando não é', () => {
    /* Item N3 da §45.4: era um `catch (e) {}` e o jogador perdia nove
       passos de criação sem uma palavra. */
    assert.equal(executar(g, 'salvar()'), true);

    const apertado = carregar(TODAS, { localStorage: memoriaLocal({ cota: 200 }) });
    executar(apertado, `
      globalThis.__avisos = []; toast = (m) => __avisos.push(m);
      S = FICHA_VAZIA();
      S.nome = 'x'.repeat(5000);
    `);
    assert.equal(executar(apertado, 'salvar()'), false, 'disse que salvou o que não coube');
    assert.equal(executar(apertado, 'salvar(); salvar(); __avisos.length'), 1,
      'avisou mais de uma vez no mesmo episódio');
    assert.ok(/NÃO está sendo salva/i.test(executar(apertado, '__avisos[0]')));
  });

  await t.test('a ficha atravessa gravar e reler sem perder campo', () => {
    executar(g, "S.nome = 'Inácia Vasques'; S.humanidadeMod = -1; salvar()");
    executar(g, 'S = FICHA_VAZIA()');
    assert.equal(executar(g, 'carregar()'), true);
    assert.equal(executar(g, 'S.nome'), 'Inácia Vasques');
    assert.equal(executar(g, 'S.humanidadeMod'), -1);
  });

  await t.test('as pendências que a tela mostra são as do motor', () => {
    const daTela = executar(g, 'pendenciasDaFicha(S).problemas.length');
    const doMotor = g.pendenciasDaFicha(executar(g, 'S')).problemas.length;
    assert.equal(daTela, doMotor);
  });
});

/* ============================================================
   O ID DE SESSÃO — item N7
   ============================================================ */

test('Front — dois ids de sessão nunca colidem (N7)', async (t) => {
  await t.test('mil ids seguidos são todos diferentes', () => {
    /* Era `'s' + Date.now().toString(36)`, e duas sessões abertas no
       mesmo milissegundo recebiam o MESMO id: a segunda sobrescrevia
       a primeira, calada. Mil chamadas seguidas rodam em poucos
       milissegundos — é exatamente o caso que quebrava. */
    const g = carregar(TODAS, { localStorage: memoriaLocal() });
    const ids = executar(g, `
      const vistos = [];
      for (let i = 0; i < 1000; i++) vistos.push(novoIdDeSessao());
      vistos
    `);
    assert.equal(new Set(ids).size, 1000, 'houve colisão');
  });

  await t.test('e nunca reaproveita um id que já está gravado', () => {
    const g = carregar(TODAS, { localStorage: memoriaLocal() });
    const id = executar(g, 'novoIdDeSessao()');
    executar(g, `localStorage.setItem('vitae:sessao:${id}', '{}')`);
    for (let i = 0; i < 20; i++) {
      assert.notEqual(executar(g, 'novoIdDeSessao()'), id, 'devolveu id ocupado');
    }
  });

  await t.test('duas mesas abertas em sequência não se sobrescrevem', () => {
    const g = carregar(TODAS, { localStorage: memoriaLocal() });
    executar(g, `
      S = FICHA_VAZIA();
      Object.assign(S, ${JSON.stringify(fichaDeTeste(g, { nome: 'Primeira' }))});
      iniciarMesa(S); salvarMesa();
      S.nome = 'Segunda'; S.fichaId = '';
      iniciarMesa(S); salvarMesa();
    `);
    const nomes = executar(g, 'listarSessoes().map(s => s.personagem)');
    assert.equal(nomes.length, 2, `as duas sessões viraram ${nomes.length}`);
  });
});

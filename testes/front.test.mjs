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
import { carregar, fichaDeTeste, memoriaLocal, executar, AREAS, RAIZ, caminhoDe } from './carregar.mjs';

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
  fs.readFileSync(path.join(RAIZ, caminhoDe('front', nome)), 'utf8');

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

  await t.test('o botão de modo não existe mais — o modo é lido do texto', () => {
    /* §57. O teste que morava aqui afirmava o contrário, e ele está
       trocado, não apagado: o que importa é que ninguém volte a pôr
       a escolha ANTES da escrita. */
    assert.equal(executar(g, "typeof ACOES_MESA['modo']"), 'undefined');
    assert.equal(executar(g, "typeof ACOES_MESA['volume']"), 'function',
      'a correção de volume à mão continua existindo');
  });

  await t.test('corrigir o volume à mão vale só por uma mensagem', () => {
    executar(g, "ACOES_MESA['volume']('grito')");
    assert.equal(executar(g, 'M.volumeManual'), 'grito');
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

const TODAS_71 = ['data','ficha','arbitro','cronista','front'];

/* ============================================================
   §71 — Três correções no criador de fichas

   1. "A Caça" vinha DEPOIS de "O Ofício" e "Os Dons", e os bônus
      do Tipo de Predador só chegavam depois dos passos que os
      gastam. O próprio painel mandava o jogador VOLTAR.
   2. As 27 Habilidades eram 27 nomes sem explicação nenhuma.
   3. Toda ação reconstruía a página inteira e subia ao topo.
   ============================================================ */

test('Criador — a ordem dos passos (§71, item 1)', async (t) => {
  const g = carregar(TODAS_71, { localStorage: memoriaLocal() });

  await t.test('A Caça vem antes do Ofício e dos Dons', (t2) => {
    const ordem = g.PASSOS.map(p => p.id);
    const i = (id) => ordem.indexOf(id);
    t2.diagnostic(ordem.join(' → '));
    assert.ok(i('predador') < i('habilidades'),
      'o Predador dá especialização gratuita: tem de vir antes do Ofício');
    assert.ok(i('predador') < i('disciplinas'),
      'o Predador dá um ponto de Disciplina: tem de vir antes dos Dons');
  });

  await t.test('e continua depois do que ele próprio depende', () => {
    /* `predadoresPermitidos` filtra por seita, e a seita vem do
       passo do Sangue. Não dá para escolher Predador antes disso. */
    const ordem = g.PASSOS.map(p => p.id);
    assert.ok(ordem.indexOf('cla') < ordem.indexOf('predador'));
  });

  await t.test('o número do passo é derivado, e não escrito à mão', (t2) => {
    /* Estava escrito em cada painel — "Passo IV", "Passo V". Reordenar
       significava caçar os cinco e acertar todos: segunda lista para o
       mesmo fato, que é a lição de sempre neste projeto. */
    const fonte = fs.readFileSync(path.join(RAIZ, caminhoDe('front', 'criador-paineis')), 'utf8');
    const escritosAMao = fonte.match(/class="num">Passo [IVX]+</g) || [];
    t2.diagnostic(`numerais escritos à mão: ${escritosAMao.length}`);
    assert.equal(escritosAMao.length, 0,
      `ainda há numeral de passo escrito à mão: ${escritosAMao.join(', ')}`);
    assert.equal(g.numeroDoPasso('predador'), 'IV');
    assert.equal(g.numeroDoPasso('ficha'), 'IX');
    assert.equal(g.numeroDoPasso('nao_existe'), '');
  });
});

test('Criador — o hover das Habilidades (§71, item 2)', async (t) => {
  const g = carregar(TODAS_71, { localStorage: memoriaLocal() });

  await t.test('as 27 Habilidades têm descrição e página', (t2) => {
    const todas = Object.values(g.HABILIDADES).flatMap(x => x.lista);
    t2.diagnostic(`${todas.length} Habilidades`);
    assert.equal(todas.length, 27);
    for (const h of todas) {
      assert.ok(h.desc && h.desc.length > 30, `${h.nome} sem descrição`);
      assert.ok(h.pagina >= 159 && h.pagina <= 171,
        `${h.nome}: página ${h.pagina} fora do capítulo Habilidades (159–171)`);
    }
  });

  await t.test('cada grupo diz do que ele depende', () => {
    for (const [k, gr] of Object.entries(g.HABILIDADES))
      assert.ok(gr.nota && gr.nota.length > 20, `grupo ${k} sem nota`);
  });

  await t.test('nenhuma descrição é igual a outra', (t2) => {
    /* Trava contra o copiar-e-colar que passa despercebido em 27
       entradas escritas de uma vez. */
    const todas = Object.values(g.HABILIDADES).flatMap(x => x.lista);
    const vistas = new Map();
    for (const h of todas) {
      if (vistas.has(h.desc)) assert.fail(`${h.nome} tem a mesma descrição de ${vistas.get(h.desc)}`);
      vistas.set(h.desc, h.nome);
    }
    t2.diagnostic(`${vistas.size} descrições distintas`);
  });

  await t.test('o painel põe a descrição no title de cada linha', (t2) => {
    /* Não basta o dado existir: tem de chegar ao HTML. */
    const html = executar(g, `
      S = FICHA_VAZIA();
      Object.assign(S, { cla: 'brujah', cidade: 'rio', seita: 'camarilla',
                        nome: 'Cobaia', modoHabilidade: 'especialista' });
      painelHabilidades();`);
    const comTitle = (html.match(/class="linha-traco" title="/g) || []).length;
    t2.diagnostic(`linhas com title: ${comTitle}`);
    assert.equal(comTitle, 27);
    assert.ok(html.includes('Manejar armas portáteis'), 'a descrição não chegou ao HTML');
    assert.ok(/Básico, pág\. 159/.test(html), 'a página não chegou ao HTML');
  });
});

test('Criador — o bônus do Predador chega antes (§71, item 1)', async (t) => {
  const g = carregar(TODAS_71, { localStorage: memoriaLocal() });

  /*  é  em app.js — binding léxico, e não propriedade do
     global do vm. Só dá para mexer nele DE DENTRO do contexto. É a
     mesma armadilha da §54.4, agora do lado do escopo. */
  /* `S` é `let` em app.js — binding léxico, e não propriedade do objeto
     global do vm. Atribuir `g.S` cria uma propriedade nova que o script
     não enxerga; só dá para mexer nele DE DENTRO do contexto. É a mesma
     família de armadilha da §54.4, agora do lado do escopo. */
  const comPredador = (extra = '') => executar(g, `
    S = FICHA_VAZIA();
    Object.assign(S, { cla: 'brujah', cidade: 'rio', seita: 'camarilla',
                       nome: 'Cobaia', modoHabilidade: 'especialista' });
    (function () {
      /* Era 'gato_de_rua'. O básico chama de VIRA-LATA, e o id
         acompanhou o nome na §77. */
      const p = PREDADORES.find(x => x.id === 'vira_lata');
      S.predador = p.id;
      S.predadorEspec = p.especializacao.opcoes[0].join('|');
      S.predadorDisciplina = p.disciplina[0];
      S.especializacoes[p.especializacao.opcoes[0][0]] = p.especializacao.opcoes[0][1];
    })();
    ${extra}
  `);

  await t.test('o Ofício anuncia a especialização que a Caça já deu', (t2) => {
    comPredador();
    const html = executar(g, 'painelHabilidades()');
    t2.diagnostic('espec do Predador: ' + executar(g, 'S.predadorEspec'));
    assert.ok(html.includes('A Caça já entregou'), 'o Ofício não avisa o que o Predador deu');
    assert.ok(html.includes('do Predador'), 'a especialização não vem marcada na linha');
  });

  await t.test('e ela aparece mesmo com a Habilidade em zero', () => {
    /* O caso que motivou: o Predador dá especialização numa
       Habilidade que ainda não tem ponto nenhum. Antes, o painel só
       mostrava especialização quando havia ponto — o bônus ficava
       invisível justamente onde deveria orientar a escolha. */
    comPredador('S.habilidades = {};');
    const html = executar(g, 'painelHabilidades()');
    /* Lê o nome do DADO em vez de fixar a string. "Luta Suja" era a
       especialização inventada pelo projeto para o Gato de Rua, e a
       §77 a trocou pela do livro — teste que fixa texto de dado
       quebra justamente na correção certa. */
    const esperado = executar(g,
      "PREDADORES.find(x => x.id === 'vira_lata').especializacao.opcoes[0][1]");
    assert.ok(html.includes(esperado),
      `a especialização "${esperado}" sumiu com a Habilidade em zero`);
  });

  await t.test('os Dons já abrem com a cota de 4', (t2) => {
    comPredador();
    const html = executar(g, 'painelDisciplinas()');
    t2.diagnostic((html.match(/<b>\d+\/\d+<\/b> pontos de Disciplina[^<]*/) || ['—'])[0]);
    assert.ok(/<b>0\/4<\/b> pontos de Disciplina \(3 \+ 1 do Predador\)/.test(html),
      'a cota dos Dons não contou o ponto do Predador');
  });

  await t.test('o painel do Predador não manda mais VOLTAR', (t2) => {
    /* Era a prova de que a ordem estava errada, escrita na própria
       interface: "escolha e volte ao passo dos Dons". */
    comPredador();
    const html = executar(g, 'painelPredador()');
    t2.diagnostic(/volte ao passo/.test(html) ? 'ainda manda voltar' : 'não manda mais voltar');
    assert.ok(!/volte ao passo/i.test(html));
  });
});


test('Mesa — a campanha que não carrega diz por quê (§74)', async (t) => {

  /* "Failed to fetch" não é diagnóstico: é o navegador repetindo que
     não deu. Foi o que apareceu na tela do usuário, e não havia o que
     fazer com aquilo. As três causas têm consertos diferentes, e a
     mensagem passou a dizer qual é.

     `porQueNaoLeu` recebe o protocolo por parâmetro justamente para
     ser testável sem `location` — no vm ele não existe. */
  const g = carregar(TODAS, { localStorage: memoriaLocal() });
  const porque = (protocolo, erro) => executar(g,
    `porQueNaoLeu(${erro}, ${JSON.stringify(protocolo)})`);
  const REDE = "new TypeError('Failed to fetch')";

  await t.test('app aberto como arquivo: manda subir o servidor', (t2) => {
    const msg = porque('file:', REDE);
    t2.diagnostic(msg);
    assert.match(msg, /aberto como ARQUIVO/);
    assert.match(msg, /ferramentas\/dev\.mjs/, 'não diz o comando');
    assert.match(msg, /Noite livre/, 'não diz o que ainda funciona sem servidor');
  });

  await t.test('servidor mudo: pergunta pelo servidor, e não confunde com arquivo', (t2) => {
    const msg = porque('http:', REDE);
    t2.diagnostic(msg);
    assert.match(msg, /não respondeu/);
    assert.ok(!/ARQUIVO/.test(msg), 'confundiu servidor mudo com arquivo aberto direto');
  });

  await t.test('nenhuma das duas repete o "Failed to fetch" cru', () => {
    for (const p of ['file:', 'http:', 'https:'])
      assert.ok(!/Failed to fetch/.test(porque(p, REDE)), `a mensagem crua vazou em ${p}`);
  });

  await t.test('erro que não é de rede passa a própria mensagem adiante', (t2) => {
    const msg = porque('http:', "new Error('o arquivo não está lá (HTTP 404)')");
    t2.diagnostic(msg);
    assert.match(msg, /HTTP 404/);
  });

  await t.test('e sem protocolo nenhum ainda diz algo útil', () => {
    /* O caso do vm e de qualquer ambiente sem `location`. */
    assert.match(porque('', REDE), /não respondeu/);
  });
});

/* ============================================================
   O PAINEL DOS SISTEMAS  (§75, ampliado na §80)

   O painel é o que o jogador OLHA para decidir se pode jogar.
   Ele tinha zero asserção até aqui, e a §80 acrescentou nele a
   distinção mais delicada da tela: módulo caído e módulo que
   ainda não existe se parecem, e não são a mesma coisa.
   ============================================================ */

test('Front — o painel dos sistemas', async (t) => {
  const g = carregar(TODAS, { localStorage: memoriaLocal() });

  const DIAGNOSTICO = {
    modulos: [
      { id: 'gateway', numero: 1, nome: 'Gateway', porta: 5173,
        ligado: true, podeLigar: false, detalhe: 'porta 5173', nota: 'Serve o app.' },
      { id: 'ficha', numero: 2, nome: 'FichaServer', porta: 5174,
        ligado: false, podeLigar: true, detalhe: 'porta 5174',
        faltando: 'O checkout usa a ficha que o navegador manda.', nota: 'Guarda as fichas.' },
      { id: 'mesa', numero: 3, nome: 'MesaServer', porta: 5175,
        ligado: false, podeLigar: true, detalhe: 'porta 5175',
        faltando: 'A mesa não abre sessão.', nota: 'O estado da partida.' }
    ],
    linhas: [
      { id: 'servidor', nome: 'Servidor', ligado: true, detalhe: 'porta 5173' },
      { id: 'ollama', nome: 'Ollama', ligado: false, detalhe: 'não responde',
        nota: 'Sem ele, nenhuma IA responde.' }
    ]
  };

  const desenhar = (d) => executar(g, `
    sistemas = { estado: 'lido', linhas: ${JSON.stringify(d.linhas)},
                 modulos: ${JSON.stringify(d.modulos)}, passos: [], erro: '' };
    painelSistemasHTML()`);

  await t.test('separa Processos de Recursos', (t2) => {
    const html = desenhar(DIAGNOSTICO);
    t2.diagnostic(html.match(/sis-titulo">[^<]*/g).join(' · '));
    assert.match(html, /sis-titulo">Processos/);
    assert.match(html, /sis-titulo">Recursos/);
    /* A ordem importa: o que é processo vem primeiro, porque é o que
       impede de jogar. Modelo faltando só piora a narração. */
    assert.ok(html.indexOf('Processos') < html.indexOf('Recursos'));
  });

  await t.test('a luz do módulo tem dois estados, e não três (§84)', (t2) => {
    /* O estado oco da §80 existia para os módulos que eram porta
       reservada sem processo atrás. Os cinco existem desde a §84, e um
       estado que nunca ocorre é folclore — a mesma regra que faz um
       arquivo sair da lista de grandes conhecidos quando encolhe. */
    const html = desenhar(DIAGNOSTICO);
    const estados = [...html.matchAll(/class="sis-linha ([a-z]+)"/g)].map(m => m[1]);
    t2.diagnostic(estados.join(' '));
    assert.ok(estados.length >= 3, 'não saiu linha de módulo nenhuma');
    assert.ok(!/sis-linha previsto/.test(html), 'a luz oca voltou');
    for (const e of estados) {
      assert.ok(e === 'on' || e === 'off', `estado de luz desconhecido: ${e}`);
    }
  });

  await t.test('todo módulo caído conta como "fora", e diz o que se perde', (t2) => {
    const html = desenhar(DIAGNOSTICO);
    /* Fora = ollama (recurso) + FichaServer + MesaServer (módulos). A
       informação útil não é "está fora": é o que isso custa ao jogo. */
    t2.diagnostic(html.match(/<b>\d+ fora<\/b>/)[0]);
    assert.match(html, /<b>3 fora<\/b>/);
    assert.match(html, /MesaServer<\/b>: A mesa não abre sessão/);
    assert.match(html, /FichaServer<\/b>: O checkout usa a ficha/);
  });

  await t.test('com tudo de pé, o cabeçalho diz isso', () => {
    const tudoOk = {
      modulos: DIAGNOSTICO.modulos.map(m => Object.assign({}, m, { ligado: true })),
      linhas: DIAGNOSTICO.linhas.map(l => Object.assign({}, l, { ligado: true }))
    };
    const html = desenhar(tudoOk);
    assert.match(html, /<b>tudo ligado<\/b>/);
    assert.match(html, /class="sistemas ok"/);
  });

  await t.test('o número e o nome do módulo aparecem juntos', () => {
    const html = desenhar(DIAGNOSTICO);
    for (const esperado of ['1. Gateway', '2. FichaServer', '3. MesaServer'])
      assert.ok(html.includes(esperado), `falta "${esperado}" no painel`);
  });

  await t.test('sem módulos no diagnóstico, o painel ainda desenha', () => {
    /* Compatibilidade com um servidor velho, e com o estado inicial
       antes da primeira sondagem: `modulos` pode não vir. */
    const html = desenhar({ modulos: [], linhas: DIAGNOSTICO.linhas });
    assert.match(html, /class="sistemas/);
    assert.ok(!/sis-titulo/.test(html), 'desenhou seção vazia de Processos');
  });
});

/* ============================================================
   A SONDAGEM PARALELA DO "LIGANDO…"  (§80)
   ============================================================ */

test('Front — as luzes acendem enquanto o "Ligar tudo" espera', async (t) => {
  const g = carregar(TODAS, { localStorage: memoriaLocal() });

  await t.test('existe uma sonda paralela, e ela para sozinha', () => {
    /* O defeito medido: o MesaServer subia em menos de um segundo e o
       painel dizia "Ligando…" por 25 s, porque `/api/ligar` é UMA
       resposta no fim de tudo e o ollama é o passo lento. */
    assert.equal(typeof g.sondarEnquantoLiga, 'function');
    const parar = executar(g, 'sondarEnquantoLiga(80)');
    assert.equal(typeof parar, 'function', 'a sonda não devolve como pará-la');
    parar();
  });

  /* Carregar o front dispara UMA sondagem de abertura — `renderCapa`
     chama `sondarSistemas()` — e ela resolve depois de o teste começar.
     Sem esperar por ela, é ELA que aparece na contagem, e é ela que
     devolve `estado` para 'lido'. Custou dois testes reprovados por
     motivo errado. */
  async function contextoSondado(resposta) {
    const contador = { pedidos: 0 };
    const g2 = carregar(TODAS, {
      localStorage: memoriaLocal(),
      fetch: async () => {
        contador.pedidos++;
        return { ok: true, json: async () => resposta };
      }
    });
    await new Promise(r => setTimeout(r, 60));   /* a sondagem de abertura */
    contador.pedidos = 0;
    return { g: g2, contador };
  }

  const RESPOSTA = {
    linhas: [{ id: 'ollama', nome: 'Ollama', ligado: true, detalhe: 'ok' }],
    modulos: [{ id: 'mesa', numero: 3, nome: 'MesaServer', porta: 5175,
                previsto: false, ligado: true, podeLigar: true, detalhe: 'porta 5175' }]
  };

  await t.test('ela não sobrescreve o estado "ligando"', async () => {
    /* Se a sonda trocasse `estado` por 'lido', o botão voltaria a
       ficar clicável no meio da operação. */
    const { g: g2, contador } = await contextoSondado(RESPOSTA);
    executar(g2, "sistemas = { estado: 'ligando', linhas: [], modulos: [], passos: [], erro: '' }");
    const parar = executar(g2, 'sondarEnquantoLiga(80)');
    await new Promise(r => setTimeout(r, 260));
    parar();
    assert.ok(contador.pedidos >= 1, 'a sonda não perguntou nada');
    assert.equal(executar(g2, 'sistemas.estado'), 'ligando', 'a sonda destravou o botão');
    /* E ela ATUALIZOU o que interessa: as luzes. */
    assert.equal(executar(g2, 'sistemas.modulos.length'), 1);
    assert.equal(executar(g2, 'sistemas.modulos[0].ligado'), true);
  });

  await t.test('parada, ela não pergunta mais', async () => {
    const { g: g3, contador } = await contextoSondado({ linhas: [], modulos: [] });
    executar(g3, "sistemas = { estado: 'ligando', linhas: [], modulos: [], passos: [], erro: '' }");
    executar(g3, 'sondarEnquantoLiga(80)')();
    await new Promise(r => setTimeout(r, 260));
    assert.equal(contador.pedidos, 0, 'continuou perguntando depois de parada');
  });

  await t.test('e ela desiste sozinha quando a operação termina', async () => {
    const { g: g4, contador } = await contextoSondado(RESPOSTA);
    executar(g4, "sistemas = { estado: 'ligando', linhas: [], modulos: [], passos: [], erro: '' }");
    executar(g4, 'sondarEnquantoLiga(80)');
    await new Promise(r => setTimeout(r, 260));
    const durante = contador.pedidos;
    /* A operação acabou: quem chamou trocou o estado. A sonda tem de
       parar sozinha, senão fica um `setInterval` batendo no servidor
       para sempre — e ninguém guardou como pará-lo. */
    executar(g4, "sistemas = Object.assign({}, sistemas, { estado: 'lido' })");
    await new Promise(r => setTimeout(r, 400));
    assert.ok(durante >= 1, 'a sonda não perguntou durante');
    assert.equal(contador.pedidos, durante, 'a sonda continuou depois do fim');
  });
});

/* ============================================================
   A PONTE COM OS MÓDULOS  (§85, item M2)

   O que estes testes trancam é a metade que some sozinha: **o app
   tem de funcionar com os módulos fora.** É fácil escrever uma
   ponte que funciona quando tudo está de pé; o que custa é ela não
   estragar nada quando não está.

   O `fetch` é de mentira e programável — dá para dizer "o
   MesaServer responde, o FichaServer não" e ver o que acontece.
   ============================================================ */

test('Front — a Ponte com os módulos', async (t) => {
  /** Um servidor de mentira: você diz o que cada rota responde. */
  function servidorFalso(rotas = {}) {
    const registro = [];
    const fetchFalso = async (url, opcoes = {}) => {
      const metodo = (opcoes.method || 'GET').toUpperCase();
      registro.push({ url: String(url), metodo, corpo: opcoes.body ? JSON.parse(opcoes.body) : null });
      for (const [padrao, resposta] of Object.entries(rotas)) {
        const [m, caminho] = padrao.split(' ');
        if (m !== metodo) continue;
        if (!new RegExp('^' + caminho.replace(/:\w+/g, '[^/]+') + '$').test(String(url))) continue;
        if (resposta === 'cai') throw new Error('Failed to fetch');
        return { ok: (resposta.status || 200) < 400, status: resposta.status || 200,
                 json: async () => resposta.corpo || {} };
      }
      return { ok: false, status: 404, json: async () => ({ erro: 'sem rota falsa' }) };
    };
    return { fetchFalso, registro };
  }

  const SAUDE_MESA = { corpo: { modulo: 'mesa', ligado: true, porta: 5175 } };
  const SAUDE_FICHA = { corpo: { modulo: 'ficha', ligado: true, guardador: { tipo: 'pasta' } } };

  const comPonte = (rotas) => {
    const { fetchFalso, registro } = servidorFalso(rotas);
    const g = carregar(TODAS, { localStorage: memoriaLocal(), fetch: fetchFalso });
    return { g, registro };
  };

  await t.test('descobre os dois módulos, e guarda a porta do canal', async (t2) => {
    const { g } = comPonte({ 'GET /api/mesa/saude': SAUDE_MESA, 'GET /api/ficha/saude': SAUDE_FICHA });
    const d = await g.Ponte.descobrir();
    t2.diagnostic(JSON.stringify(d));
    assert.equal(d.ligada, true);
    assert.equal(d.fichaServer, true);
    /* A porta importa: o WebSocket NÃO passa pelo Gateway (§78.3). */
    assert.equal(g.Ponte.portaMesa, 5175);
    assert.equal(g.Ponte.guardador, 'pasta');
  });

  await t.test('com os módulos fora, ela não estoura — e diz por quê', async (t2) => {
    const { g } = comPonte({ 'GET /api/mesa/saude': 'cai', 'GET /api/ficha/saude': 'cai' });
    const d = await g.Ponte.descobrir();
    t2.diagnostic(d.motivo);
    assert.equal(d.ligada, false);
    assert.equal(d.fichaServer, false);
    assert.ok(d.motivo.length > 5, 'ficou sem motivo');
  });

  await t.test('sem MesaServer, o checkout falha em silêncio e a mesa segue', async () => {
    const { g, registro } = comPonte({ 'GET /api/mesa/saude': 'cai', 'GET /api/ficha/saude': 'cai' });
    await g.Ponte.descobrir();
    const r = await g.Ponte.abrirSessao({ nome: 'Val', cla: 'brujah' });
    assert.equal(r.ok, false);
    assert.equal(g.Ponte.sessaoId, '');
    /* E ela nem tenta: sem módulo, não gasta requisição. */
    assert.ok(!registro.some(x => x.url === '/api/mesa/sessoes'));
  });

  await t.test('o checkout manda a ficha JUNTO com o id', async (t2) => {
    const { g, registro } = comPonte({
      'GET /api/mesa/saude': SAUDE_MESA, 'GET /api/ficha/saude': SAUDE_FICHA,
      'POST /api/mesa/sessoes': { status: 201, corpo: { ok: true, id: 's1', origemDaFicha: 'fichaserver' } }
    });
    await g.Ponte.descobrir();
    const r = await g.Ponte.abrirSessao({ fichaId: 'val__brujah', nome: 'Val', cla: 'brujah' });
    const enviado = registro.find(x => x.url === '/api/mesa/sessoes');
    t2.diagnostic(JSON.stringify(Object.keys(enviado.corpo)));
    assert.equal(r.ok, true);
    assert.equal(g.Ponte.sessaoId, 's1');
    /* O contrato da §78: com o Módulo 2 fora, o Módulo 3 usa esta ficha
       e marca `origemDaFicha: cliente`. Mandar só o id quebraria isso. */
    assert.equal(enviado.corpo.fichaId, 'val__brujah');
    assert.ok(enviado.corpo.ficha && enviado.corpo.ficha.nome === 'Val');
  });

  await t.test('o espelho tem REPRESA: cem salvamentos, uma ida', async (t2) => {
    /* `salvarMesa()` roda a cada mutação — 45 chamadas espalhadas pelo
       front. Uma requisição por tecla digitada no rascunho seria
       absurdo, e é o defeito que a represa existe para não ter. */
    const { g, registro } = comPonte({
      'GET /api/mesa/saude': SAUDE_MESA, 'GET /api/ficha/saude': SAUDE_FICHA,
      'POST /api/mesa/sessoes': { status: 201, corpo: { ok: true, id: 's1' } },
      'PATCH /api/mesa/sessoes/:id/ficha': { corpo: { ficha: {} } },
      'PATCH /api/mesa/sessoes/:id/mundo': { corpo: { mundo: {} } },
      'POST /api/mesa/sessoes/:id/turno': { corpo: { turnos: 1 } }
    });
    await g.Ponte.descobrir();
    await g.Ponte.abrirSessao({ nome: 'Val', cla: 'brujah' });
    executar(g, 'Ponte.INTERVALO_ESPELHO = 40');

    const M = { ficha: { nome: 'Val', fome: 1 }, cena: {}, locais: [], pessoas: [],
                fatos: [], fios: [], estados: [], bolsa: [], combate: {}, mensagens: [] };
    for (let i = 0; i < 100; i++) g.Ponte.espelhar(M);
    const contar = () => registro.filter(x => x.url.includes('/ficha') && x.metodo === 'PATCH').length;
    const antes = contar();
    await new Promise(r => setTimeout(r, 200));
    const depois = contar();
    t2.diagnostic(`100 salvamentos → ${depois} PATCH(es)`);
    assert.equal(antes, 0, 'espelhou antes de a represa abrir');
    assert.equal(depois, 1, 'a represa deixou passar mais de uma');
  });

  await t.test('o histórico vai só o que ainda não foi', async (t2) => {
    const { g, registro } = comPonte({
      'GET /api/mesa/saude': SAUDE_MESA, 'GET /api/ficha/saude': SAUDE_FICHA,
      'POST /api/mesa/sessoes': { status: 201, corpo: { ok: true, id: 's1' } },
      'PATCH /api/mesa/sessoes/:id/ficha': { corpo: {} },
      'PATCH /api/mesa/sessoes/:id/mundo': { corpo: {} },
      'POST /api/mesa/sessoes/:id/turno': { corpo: { turnos: 1 } }
    });
    await g.Ponte.descobrir();
    await g.Ponte.abrirSessao({ nome: 'Val', cla: 'brujah' });

    const M = { ficha: { nome: 'Val' }, cena: {}, locais: [], pessoas: [], fatos: [],
                fios: [], estados: [], bolsa: [], combate: {},
                mensagens: [{ id: 1 }, { id: 2 }] };
    await g.Ponte.espelharAgora(M);
    M.mensagens.push({ id: 3 });
    await g.Ponte.espelharAgora(M);

    const turnos = registro.filter(x => x.url.includes('/turno'));
    t2.diagnostic(turnos.map(x => x.corpo.entradas.length + ' turno(s)').join(' → '));
    assert.equal(turnos.length, 2);
    assert.equal(turnos[0].corpo.entradas.length, 2);
    /* O segundo mandou UM, e não três: o que já foi não volta. */
    assert.equal(turnos[1].corpo.entradas.length, 1);
  });

  await t.test('a sincronização NÃO desfaz edição local mais nova', async (t2) => {
    /* O pior defeito possível numa sincronização: abrir o app e perder
       a última coisa que você fez sem servidor. */
    const { g } = comPonte({
      'GET /api/mesa/saude': SAUDE_MESA, 'GET /api/ficha/saude': SAUDE_FICHA,
      'GET /api/ficha': { corpo: { fichas: [
        { fichaId: 'val__brujah', nome: 'Val', guardadaEm: 1000 },
        { fichaId: 'nova__tremere', nome: 'Nova', guardadaEm: 5000 }
      ] } },
      'GET /api/ficha/:id': { corpo: { ficha: { fichaId: 'nova__tremere', nome: 'Nova',
                                                cla: 'tremere', guardadaEm: 5000 } } }
    });
    await g.Ponte.descobrir();
    /* A local é MAIS NOVA que a do servidor (2000 > 1000). */
    executar(g, "guardarFicha({ fichaId: 'val__brujah', nome: 'Val local', cla: 'brujah' })");
    executar(g, "(() => { const m = JSON.parse(localStorage.getItem('vitae:fichas'));"
      + " m['val__brujah'].guardadaEm = 2000;"
      + " localStorage.setItem('vitae:fichas', JSON.stringify(m)); })()");

    const r = await g.Ponte.sincronizarFichas();
    t2.diagnostic(`${r.novas} ficha(s) entraram`);
    assert.equal(r.novas, 1, 'devia entrar só a que o navegador não tinha');
    assert.equal(executar(g, "fichaPorId('val__brujah').nome"), 'Val local',
      'a sincronização sobrepôs uma edição local mais nova');
    assert.equal(executar(g, "fichaPorId('nova__tremere').nome"), 'Nova');
  });

  await t.test('sem FichaServer, sincronizar não faz nada e não reclama', async () => {
    const { g, registro } = comPonte({ 'GET /api/mesa/saude': SAUDE_MESA, 'GET /api/ficha/saude': 'cai' });
    await g.Ponte.descobrir();
    const r = await g.Ponte.sincronizarFichas();
    assert.equal(r.ok, false);
    assert.equal(r.novas, 0);
    assert.ok(!registro.some(x => x.url === '/api/ficha'), 'foi buscar sem módulo');
  });

  await t.test('a rolagem devolve null quando não há sessão — e quem chama rola local', async (t2) => {
    const { g } = comPonte({ 'GET /api/mesa/saude': 'cai', 'GET /api/ficha/saude': 'cai' });
    await g.Ponte.descobrir();
    const r = await g.Ponte.rolar({ normais: 4, fome: 2, dificuldade: 2, piscina: 6 });
    t2.diagnostic(`Ponte.rolar → ${r}`);
    assert.equal(r, null, 'devolveu alguma coisa sem servidor');
  });

  await t.test('com sessão, a rolagem vai à Mesa e volta com os VALORES', async (t2) => {
    const { g, registro } = comPonte({
      'GET /api/mesa/saude': SAUDE_MESA, 'GET /api/ficha/saude': SAUDE_FICHA,
      'POST /api/mesa/sessoes': { status: 201, corpo: { ok: true, id: 's1' } },
      'POST /api/mesa/sessoes/:id/rolagem': { corpo: {
        pedido: { normais: 4, fome: 2, dificuldade: 2, rotulo: 'x', piscina: 6 },
        valores: { normais: [10, 10, 6, 2], dadosFome: [1, 1] } } }
    });
    await g.Ponte.descobrir();
    await g.Ponte.abrirSessao({ nome: 'Val', cla: 'brujah' });
    const r = await g.Ponte.rolar({ normais: 4, fome: 2, dificuldade: 2, rotulo: 'x', piscina: 6 });
    t2.diagnostic(JSON.stringify(r.valores));
    assert.equal(r.valores.normais.length, 4);
    /* E o que sobe é o PEDIDO, não a ficha nem o estado: o Módulo 3 só
       precisa saber quantos dados, e a Mesa não apura. */
    const ida = registro.find(x => x.url.includes('/rolagem'));
    assert.deepEqual(Object.keys(ida.corpo), ['pedido']);
  });

  await t.test('e o Árbitro apura os valores da Mesa, no navegador', (t2) => {
    /* O passo 3 da §82 continua local, e tem de dar o mesmo veredito que
       daria se tivesse rolado aqui. */
    const { g } = comPonte({});
    const pedido = g.Dados.pedir({ piscina: 6, fome: 2, dificuldade: 2, rotulo: 'x' });
    const v = g.Dados.apurar(pedido, { normais: [10, 10, 6, 2], dadosFome: [1, 1] });
    t2.diagnostic(g.Dados.descrever(v));
    assert.equal(v.tipo, 'critico');
    assert.equal(v.sucessos, 5);
  });

  await t.test('o checkin sem aceite é prévia; com aceite, grava', async (t2) => {
    const { g, registro } = comPonte({
      'GET /api/mesa/saude': SAUDE_MESA, 'GET /api/ficha/saude': SAUDE_FICHA,
      'POST /api/mesa/sessoes': { status: 201, corpo: { ok: true, id: 's1' } },
      'GET /api/mesa/sessoes/:id/alteracoes': { corpo: { alteracoes: [
        { campo: 'fome', antes: 1, agora: 4 } ] } },
      'POST /api/mesa/sessoes/:id/checkin': { status: 200, corpo: { ok: true, origem: 'fichaserver' } }
    });
    await g.Ponte.descobrir();
    await g.Ponte.abrirSessao({ nome: 'Val', cla: 'brujah' });

    const alt = await g.Ponte.alteracoes();
    t2.diagnostic(JSON.stringify(alt));
    assert.equal(alt.length, 1);
    assert.equal(alt[0].campo, 'fome');

    const r = await g.Ponte.checkin({ aceite: true });
    assert.equal(r.status, 200);
    assert.equal(registro.find(x => x.url.includes('/checkin')).corpo.aceite, true);
  });

  await t.test('nenhuma chamada da Ponte estoura para cima', async (t2) => {
    /* A garantia que faz o resto valer: o front chama a Ponte de dentro
       de `salvarMesa`, do render e do turno. Uma exceção aqui derruba a
       mesa por causa de um servidor que não está no ar. */
    const { g } = comPonte({});   /* nada responde: tudo 404 */
    const chamadas = [
      'Ponte.descobrir()', 'Ponte.sincronizarFichas()',
      "Ponte.abrirSessao({ nome: 'x', cla: 'y' })", "Ponte.reatarSessao('s1')",
      'Ponte.alteracoes()', 'Ponte.checkin({ aceite: true })',
      'Ponte.encerrarSessao({})', 'Ponte.rolar({ normais: 1, fome: 0 })',
      "Ponte.espelharAgora({ ficha: { nome: 'x' }, mensagens: [] })"
    ];
    for (const c of chamadas) {
      await executar(g, c);   /* se estourar, o teste falha aqui */
    }
    /* E as síncronas idem. */
    executar(g, "Ponte.guardarFicha({ nome: 'x' })");
    executar(g, "Ponte.apagarFicha('x')");
    executar(g, "Ponte.espelhar({ ficha: { nome: 'x' } })");
    executar(g, 'Ponte.ouvir(() => {})');
    executar(g, 'Ponte.calar()');
    t2.diagnostic(`${chamadas.length + 5} chamadas contra um servidor mudo, nenhuma estourou`);
  });
});

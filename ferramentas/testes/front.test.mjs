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

const TODAS = ['data', 'ficha', 'arbitro', 'cronista', 'front', 'mesa'];

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

/* A Mesa ganhou área própria na reorganização que juntou `mesa.js` e
   companhia a `modulos/mesa/`, ao lado de `mesa-servidor.mjs`.
   Este arquivo continua chamando os dois de "front" no sentido amplo —
   é tudo navegador —, então `fonteFront` acha a área certa sozinho em
   vez de reescrever cada chamada com o nome da área nova. */
const areaDoArquivoFront = (nome) => {
  if (AREAS.front.includes(nome)) return 'front';
  if (AREAS.mesa.includes(nome)) return 'mesa';
  throw new Error(`arquivo não é do front nem da mesa: ${nome}`);
};

const fonteFront = (nome) =>
  fs.readFileSync(path.join(RAIZ, caminhoDe(areaDoArquivoFront(nome), nome)), 'utf8');

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
    const front = [...AREAS.front, ...AREAS.mesa].map(fonteFront).join('\n');
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
    for (const nome of [...AREAS.front, ...AREAS.mesa]) {
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

  /* ESTE TESTE NÃO CONFERIA NADA ATÉ A §89.

     Ele chamava `docaHTML()`, e essa função nunca existiu no projeto —
     quem desenha o corpo da doca é `corpoDocaHTML()`. O `typeof` que
     protegia a chamada devolvia `""`, o `if (!html) continue` pulava
     TODAS as abas, e o teste passava em verde sem abrir uma.

     Foram três coisas juntas, e vale nomeá-las porque a forma se
     repete: um nome errado, uma proteção que engoliu o erro, e uma
     lista de abas escrita à mão que ninguém tinha como conferir. A
     lista agora vem de `ABAS_DOCA`, então aba nova entra sozinha —
     e a chamada não tem mais rede: se a função sumir, isto quebra. */
  await t.test('a doca fecha as tags, em todas as abas', () => {
    assert.equal(executar(g, 'typeof corpoDocaHTML'), 'function',
      'o desenho do corpo da doca mudou de nome; este teste parou de olhar a doca');

    const abas = executar(g, 'ABAS_DOCA.map(a => a.id)');
    assert.ok(abas.length >= 7, `só ${abas.length} abas na doca`);

    for (const aba of abas) {
      executar(g, `M.aba = ${JSON.stringify(aba)}`);
      const html = executar(g, 'corpoDocaHTML()');
      assert.ok(html && html.length > 20, `a aba ${aba} desenhou vazio`);
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

const TODAS_71 = ['data','ficha','arbitro','cronista','front','mesa'];

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
       mesmo fato, que é a lição de sempre neste projeto.

       Os nove painéis, cada um no seu arquivo em `paineis/` desde a
       divisão de `criador-paineis.js`: o número de passo é escrito em
       cada um deles, então a varredura tem de olhar todos, e não só o
       tronco que ficou em `criador-paineis.js`. */
    const fonte = fonteFront('criador-paineis')
      + ['painel-cronica', 'painel-cla', 'painel-atributos', 'painel-habilidades',
         'painel-disciplinas', 'painel-predador', 'painel-vantagens', 'painel-alma', 'painel-ficha']
        .map(n => fs.readFileSync(path.join(RAIZ, caminhoDe('front', `paineis/${n}`)), 'utf8')).join('\n');
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

/* ============================================================
   O ÁRBITRO DO SERVIDOR, E A CONFERÊNCIA  (§87, item M8)

   O Módulo 4 devolve a MESMA resposta que o navegador calcula — é
   o mesmo código, carregado num `vm` desde a §84. Então o que
   estes testes afirmam não é "o servidor acerta": é que as duas
   cópias são comparadas, que a divergência é contada e dita, e
   que nada disso muda o jogo quando o módulo não responde.
   ============================================================ */

test('Front — o Árbitro do servidor e a conferência (§87)', async (t) => {
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

  const SAUDE = {
    'GET /api/mesa/saude': { corpo: { modulo: 'mesa', ligado: true, porta: 5175 } },
    'GET /api/ficha/saude': { corpo: { modulo: 'ficha', ligado: true, guardador: { tipo: 'pasta' } } },
    'GET /api/arbitro/saude': { corpo: { modulo: 'arbitro', ligado: true, rola: false } }
  };
  const comPonte = (rotas) => {
    const { fetchFalso, registro } = servidorFalso(Object.assign({}, SAUDE, rotas));
    const g = carregar(TODAS, { localStorage: memoriaLocal(), fetch: fetchFalso });
    return { g, registro };
  };
  const PEDIDO = { normais: 4, fome: 2, dificuldade: 3, rotulo: 'Destreza + Ladroagem', piscina: 6 };
  const SITUACAO = { ficha: { nome: 'Val', fome: 2 }, rota: { atributo: 'destreza', pericia: 'furto' } };

  await t.test('descobre o Módulo 4 junto com os outros', async (t2) => {
    const { g } = comPonte({});
    const d = await g.Ponte.descobrir();
    t2.diagnostic(JSON.stringify(d));
    assert.equal(d.arbitro, true);
  });

  await t.test('sem o Módulo 4, `pedidoDoArbitro` devolve null e não tenta', async () => {
    const { g, registro } = comPonte({ 'GET /api/arbitro/saude': 'cai' });
    await g.Ponte.descobrir();
    assert.equal(g.Ponte.arbitro, false);
    assert.equal(await g.Ponte.pedidoDoArbitro(SITUACAO), null);
    assert.equal(await g.Ponte.apurarNoArbitro(PEDIDO, { normais: [], dadosFome: [] }), null);
    assert.ok(!registro.some(x => x.url === '/api/arbitro/pedido'), 'foi perguntar sem módulo');
  });

  await t.test('com o Módulo 4, o pedido vem dele — e a situação sobe inteira', async (t2) => {
    const { g, registro } = comPonte({
      'POST /api/arbitro/pedido': { corpo: { pedido: PEDIDO, composicao: { rotulo: 'x', base: 5 } } }
    });
    await g.Ponte.descobrir();
    const r = await g.Ponte.pedidoDoArbitro(SITUACAO);
    const ida = registro.find(x => x.url === '/api/arbitro/pedido');
    t2.diagnostic(Object.keys(ida.corpo).join(', '));
    assert.equal(r.pedido.piscina, 6);
    /* A ficha e a rota precisam subir: sem elas o módulo não tem como
       montar a piscina, e devolveria 422. */
    assert.ok(ida.corpo.ficha && ida.corpo.rota);
  });

  await t.test('CONFERE, e quando concordam não conta nada', (t2) => {
    const { g } = comPonte({});
    const igual = { normais: 4, fome: 2, dificuldade: 3, piscina: 6 };
    const ok = g.Ponte.conferir('pedido', igual, Object.assign({}, igual),
      ['normais', 'fome', 'dificuldade', 'piscina']);
    t2.diagnostic(`concordaram: ${ok} · divergências: ${g.Ponte.divergencias}`);
    assert.equal(ok, true);
    assert.equal(g.Ponte.divergencias, 0);
  });

  await t.test('e quando discordam, conta, guarda os dois lados e AVISA', (t2) => {
    const { g } = comPonte({});
    const local = { normais: 4, fome: 2, dificuldade: 3, piscina: 6 };
    const servidor = { normais: 5, fome: 2, dificuldade: 3, piscina: 7 };
    const ok = g.Ponte.conferir('pedido', local, servidor,
      ['normais', 'fome', 'dificuldade', 'piscina']);
    const d = g.Ponte.ultimaDivergencia;
    t2.diagnostic(`campos: ${d.campos.join(', ')} · local ${JSON.stringify(d.local)} · servidor ${JSON.stringify(d.servidor)}`);
    assert.equal(ok, false);
    assert.equal(g.Ponte.divergencias, 1);
    /* Os DOIS lados ficam guardados: com um só, quem lê não sabe qual
       está errado nem por quanto. */
    assert.deepEqual(d.campos.sort(), ['normais', 'piscina']);
    assert.equal(d.local.normais, 4);
    assert.equal(d.servidor.normais, 5);
  });

  await t.test('sem uma das duas respostas, não há o que conferir', () => {
    const { g } = comPonte({});
    assert.equal(g.Ponte.conferir('pedido', null, { normais: 1 }, ['normais']), true);
    assert.equal(g.Ponte.conferir('pedido', { normais: 1 }, null, ['normais']), true);
    assert.equal(g.Ponte.divergencias, 0, 'contou divergência sem ter com o que comparar');
  });

  await t.test('a CADEIA INTEIRA: Árbitro pensa, Mesa rola, Árbitro apura', async (t2) => {
    /* O que a §87 fecha: as três pontas nos módulos, e o navegador
       desenhando. */
    const { g, registro } = comPonte({
      'POST /api/mesa/sessoes': { status: 201, corpo: { ok: true, id: 's1' } },
      'POST /api/arbitro/pedido': { corpo: { pedido: PEDIDO } },
      'POST /api/mesa/sessoes/:id/rolagem': { corpo: {
        pedido: PEDIDO, valores: { normais: [10, 10, 6, 2], dadosFome: [1, 1] } } },
      'POST /api/arbitro/apurar': { corpo: {
        veredito: { tipo: 'critico', sucessos: 5, passou: true }, descricao: 'Sucesso Crítico' } }
    });
    await g.Ponte.descobrir();
    await g.Ponte.abrirSessao({ nome: 'Val', cla: 'brujah' });

    const r = await executar(g, `rolarPelaMesa(
      { piscina: 6, fome: 2, dificuldade: 3, rotulo: 'Destreza + Ladroagem' },
      ${JSON.stringify(SITUACAO)})`);

    const visitadas = registro.map(x => x.url).filter(u => u.includes('arbitro') || u.includes('rolagem'));
    t2.diagnostic(`${r.tipo} · ${r.sucessos} sucesso(s) · pensou em ${r.ondePensou}, rolou em ${r.ondeRolou}`);
    assert.equal(r.ondePensou, 'arbitro');
    assert.equal(r.ondeRolou, 'mesa');
    assert.equal(r.tipo, 'critico');
    assert.equal(g.Ponte.divergencias, 0, 'as duas cópias discordaram do nada');
    for (const rota of ['/api/arbitro/pedido', '/api/arbitro/apurar']) {
      assert.ok(visitadas.some(u => u === rota), `não passou por ${rota}`);
    }
  });

  await t.test('com os módulos fora, a cadeia resolve LOCAL e o jogo segue', async (t2) => {
    const { g } = comPonte({ 'GET /api/mesa/saude': 'cai', 'GET /api/arbitro/saude': 'cai' });
    await g.Ponte.descobrir();
    const r = await executar(g, `rolarPelaMesa(
      { piscina: 6, fome: 2, dificuldade: 3, rotulo: 'x' },
      ${JSON.stringify(SITUACAO)})`);
    t2.diagnostic(`${r.tipo} · pensou em ${r.ondePensou}, rolou em ${r.ondeRolou}`);
    assert.equal(r.ondePensou, 'local');
    assert.equal(r.ondeRolou, 'local');
    assert.equal(r.normais.length + r.dadosFome.length, 6, 'não rolou os dados do pedido');
    assert.ok(['critico', 'sucesso', 'falha', 'total', 'bestial', 'perigo'].includes(r.tipo));
  });

  await t.test('o rótulo da ROTA sobrevive ao pedido do servidor', async (t2) => {
    /* §63 (A4): a rota pode cobrar Dificuldade a mais, e o rótulo diz
       isso. O Módulo 4 não recebe a rota inteira, então o rótulo dele
       não tem o sufixo — adotar o pedido do servidor inteiro apagaria
       da tela a razão de a dificuldade ter subido. */
    const { g } = comPonte({
      'POST /api/mesa/sessoes': { status: 201, corpo: { ok: true, id: 's1' } },
      'POST /api/arbitro/pedido': { corpo: { pedido: PEDIDO } },
      'POST /api/mesa/sessoes/:id/rolagem': { corpo: {
        pedido: PEDIDO, valores: { normais: [6, 6, 6, 6], dadosFome: [6, 6] } } }
    });
    await g.Ponte.descobrir();
    await g.Ponte.abrirSessao({ nome: 'Val', cla: 'brujah' });
    const r = await executar(g, `rolarPelaMesa(
      { piscina: 6, fome: 2, dificuldade: 3, rotulo: 'Destreza + Ladroagem (+2 de Dificuldade)' },
      ${JSON.stringify(SITUACAO)})`);
    t2.diagnostic(r.rotulo);
    assert.match(r.rotulo, /\+2 de Dificuldade/);
  });

  await t.test('divergência no pedido é contada, e o servidor vence', async (t2) => {
    const { g } = comPonte({
      'POST /api/mesa/sessoes': { status: 201, corpo: { ok: true, id: 's1' } },
      /* O servidor diz 7 dados; o local diria 6. */
      'POST /api/arbitro/pedido': { corpo: { pedido:
        { normais: 5, fome: 2, dificuldade: 3, rotulo: 'x', piscina: 7 } } },
      'POST /api/mesa/sessoes/:id/rolagem': { corpo: {
        pedido: { normais: 5, fome: 2, dificuldade: 3, piscina: 7 },
        valores: { normais: [6, 6, 6, 6, 6], dadosFome: [6, 6] } } }
    });
    await g.Ponte.descobrir();
    await g.Ponte.abrirSessao({ nome: 'Val', cla: 'brujah' });
    const r = await executar(g, `rolarPelaMesa(
      { piscina: 6, fome: 2, dificuldade: 3, rotulo: 'x' },
      ${JSON.stringify(SITUACAO)})`);
    t2.diagnostic(`divergências: ${g.Ponte.divergencias} · piscina usada: ${r.piscina}`);
    assert.equal(g.Ponte.divergencias, 1);
    /* Quando discordam, vale o do servidor: o navegador é o suspeito,
       porque é ele que tem cache. */
    assert.equal(r.piscina, 7);
  });
});

/* ============================================================
   JOGO PONDERADO — a Carta X e os Limites  (§89)

   O Apêndice III é o único lugar do livro em que a regra protege
   a PESSOA e não o personagem. Por isso os testes daqui são
   escritos ao contrário dos outros: em vez de conferir que uma
   coisa acontece, quase todos conferem que uma coisa NÃO acontece
   — o texto retirado não volta, a carta não pede motivo, a lista
   vazia não vira permissão.
   ============================================================ */

test('Limites — a lista é do jogador, e ela se comporta (§89)', async (t) => {
  const g = comMesa();

  await t.test('sessão velha, sem o campo, não quebra nada', () => {
    assert.equal(executar(g, 'Limites.normalizar(undefined).linhas.length'), 0);
    assert.equal(executar(g, 'Limites.normalizar(null).veus.length'), 0);
    assert.equal(executar(g, 'Limites.normalizar("lixo").retiradas.length'), 0);
  });

  await t.test('repetido entra uma vez só', () => {
    assert.equal(executar(g,
      'Limites.normalizar({ linhas: ["Aranhas", "Aranhas", " Aranhas "] }).linhas.length'), 1);
  });

  await t.test('a mesma coisa não é Linha e Véu ao mesmo tempo — a Linha ganha', (t2) => {
    /* Empate entre uma trava forte e uma fraca resolve-se pela forte:
       a metade insegura de um empate é a que deixa passar. */
    const r = executar(g, `JSON.stringify(
      Limites.normalizar({ linhas: ['Tortura'], veus: ['Tortura', 'Pesadelos'] }))`);
    t2.diagnostic(r);
    const l = JSON.parse(r);
    assert.deepEqual(l.linhas, ['Tortura']);
    assert.deepEqual(l.veus, ['Pesadelos']);
  });

  await t.test('declarar como Véu o que era Linha MOVE, não copia', (t2) => {
    executar(g, `M.limites = Limites.vazio(); adicionarLimite('linha', 'Agulhas')`);
    assert.equal(executar(g, 'M.limites.linhas.length'), 1);
    executar(g, `adicionarLimite('veu', 'Agulhas')`);
    t2.diagnostic(executar(g, 'JSON.stringify({ l: M.limites.linhas, v: M.limites.veus })'));
    assert.equal(executar(g, 'M.limites.linhas.length'), 0, 'ficou nos dois lados');
    assert.equal(executar(g, 'M.limites.veus.length'), 1);
  });

  await t.test('tirar da lista tira dos dois lados', () => {
    executar(g, `removerLimite('Agulhas')`);
    assert.equal(executar(g, 'M.limites.linhas.length + M.limites.veus.length'), 0);
  });

  await t.test('as sugestões do livro não repetem o que já foi escolhido', (t2) => {
    executar(g, `M.limites = Limites.vazio(); adicionarLimite('linha', 'Aranhas')`);
    const sugeridas = executar(g, `Limites.sugestoes(M.limites, 'linha').join('|')`);
    t2.diagnostic(`${sugeridas.split('|').length} sugestões restantes`);
    assert.ok(!/Aranhas/.test(sugeridas), 'sugeriu o que o jogador já pôs na lista');
    assert.ok(executar(g, 'Limites.LINHAS_COMUNS.length') >= 10,
      'a lista de exemplo do livro encolheu');
  });
});

test('Limites — o que sobe para o modelo, e o que não sobe (§89)', async (t) => {
  const g = comMesa();

  await t.test('lista vazia não manda bloco nenhum', () => {
    /* Escrever "o jogador não declarou nada" seria pior do que calar:
       soa a permissão. Sem bloco, vale o piso do cenario.md §10. */
    executar(g, 'M.limites = Limites.vazio()');
    assert.equal(executar(g, 'Limites.paraModelo(M.limites)'), '');
    assert.equal(executar(g, 'Limites.declarado(M.limites)'), false);
  });

  await t.test('declarada, ela sobe com a ordem, e não só com a palavra', (t2) => {
    executar(g, `adicionarLimite('linha', 'Sofrimento animal');
                 adicionarLimite('veu', 'Abuso emocional')`);
    const bloco = executar(g, 'Limites.paraModelo(M.limites)');
    t2.diagnostic(bloco.split('\n').slice(0, 3).join(' / '));
    assert.match(bloco, /Sofrimento animal/);
    assert.match(bloco, /Abuso emocional/);
    assert.match(bloco, /NÃO PODE APARECER/, 'a Linha subiu sem a ordem que a torna Linha');
    assert.match(bloco, /não é encenado/i, 'o Véu subiu sem a ordem de cortar');
    assert.match(bloco, /valem sobre|vale/i);
  });

  await t.test('e ela chega ao turno que vai para o Narrador', (t2) => {
    const enviado = executar(g, `JSON.stringify(NarradorProxy.montar(
      turnoDaMesa({ texto: 'olho em volta', leitura: {}, veredito: { avisos: [] },
                    estados: [], seg: { segmentos: [] } }).paraNarrador()))`);
    const t3 = JSON.parse(enviado);
    t2.diagnostic(`limites: ${t3.limites.length} caracteres`);
    assert.match(t3.limites, /Sofrimento animal/, 'os limites não viajaram com o turno');
  });
});

test('Carta X — o botão que não pergunta nada (§89, pág. 422)', async (t) => {
  const nova = () => {
    const ctx = comMesa();
    executar(ctx, `M.mensagens.push({ id: 'n1', autor: 'narrador',
      texto: 'Ele arranca a unha dela devagar, e sorri.', ts: Date.now() })`);
    return ctx;
  };

  await t.test('retira a última narração, e no primeiro toque', (t2) => {
    const g = nova();
    executar(g, `ACOES_MESA['carta-x']('x')`);
    t2.diagnostic(executar(g, 'JSON.stringify(M.limites.retiradas)'));
    assert.equal(executar(g, `M.mensagens.find(m => m.id === 'n1').retirado`), true,
      'a carta precisou de dois toques');
    assert.equal(executar(g, 'M.limites.retiradas.length'), 1);
  });

  await t.test('não pede motivo, e diz que não pede', () => {
    const g = nova();
    executar(g, `ACOES_MESA['carta-x']('x')`);
    const aviso = executar(g, `M.mensagens.filter(m => m.cartaX).map(m => m.texto).join(' ')`);
    assert.match(aviso, /não precisa dizer por quê/i,
      'a mesa deixou de dizer que a explicação é dispensada');
  });

  await t.test('o texto retirado SAI da cena', (t2) => {
    const g = nova();
    executar(g, `ACOES_MESA['carta-x']('x')`);
    const html = executar(g, 'M.mensagens.map(msgHTML).join("")');
    t2.diagnostic(`${html.length} caracteres de fluxo`);
    assert.ok(!/arranca a unha/.test(html), 'a passagem retirada continua desenhada na tela');
    assert.match(html, /retirado pela Carta X/);
  });

  await t.test('e SAI do que vai para o modelo — sem o texto junto', (t2) => {
    /* Devolver o trecho ao modelo é a forma mais garantida de ele voltar
       ao assunto. O que viaja no histórico é só o fato da retirada. */
    const g = nova();
    executar(g, `ACOES_MESA['carta-x']('x')`);
    const resumo = executar(g,
      `NarradorProxy.resumirMensagem(M.mensagens.find(m => m.id === 'n1'))`);
    t2.diagnostic(resumo);
    assert.ok(!/unha/.test(resumo), 'o texto retirado vazou para o histórico do modelo');
    assert.match(resumo, /retirado/i);
  });

  await t.test('mas o prefixo AVISA o assunto, com a ordem de não voltar', (t2) => {
    const g = nova();
    executar(g, `ACOES_MESA['carta-x']('x')`);
    const bloco = executar(g, 'Limites.paraModelo(M.limites)');
    t2.diagnostic(bloco.split('\n').slice(-2).join(' / '));
    assert.match(bloco, /não volta|não aconteceram|NÃO aconteceram/i);
  });

  await t.test('duas vezes retira duas passagens', () => {
    const g = nova();
    executar(g, `M.mensagens.push({ id: 'n2', autor: 'narrador', texto: 'Outra coisa ruim.', ts: Date.now() })`);
    executar(g, `ACOES_MESA['carta-x']('x'); ACOES_MESA['carta-x']('x')`);
    assert.equal(executar(g, `M.mensagens.filter(m => m.retirado).length`), 2);
  });

  await t.test('sem narração para retirar, ela não quebra e diz isso', () => {
    const ctx = carregar(TODAS, { localStorage: memoriaLocal() });
    executar(ctx, `
      S = FICHA_VAZIA();
      Object.assign(S, ${JSON.stringify(fichaDeTeste(carregar(['data', 'ficha']), { nome: 'Vazia' }))});
      iniciarMesa(S);
      M.mensagens = M.mensagens.filter(m => m.autor !== 'narrador');
      ACOES_MESA['carta-x']('x');
    `);
    assert.equal(executar(ctx, 'M.limites.retiradas.length'), 0);
    assert.match(executar(ctx, 'M.mensagens[M.mensagens.length - 1].texto'), /não há narração/i);
  });

  await t.test('a retirada vira Linha se — e só se — o jogador quiser', () => {
    const g = nova();
    executar(g, `ACOES_MESA['carta-x']('x')`);
    assert.equal(executar(g, 'M.limites.linhas.length'), 0,
      'a carta declarou uma Linha sozinha, e ela é do jogador');
    const trecho = executar(g, 'M.limites.retiradas[0].trecho');
    executar(g, `ACOES_MESA['declarar-retirada'](${JSON.stringify('linha:' + trecho)})`);
    assert.equal(executar(g, 'M.limites.linhas.length'), 1);
  });
});

test('Fade — o corte pedido pelo jogador (§89, pág. 421)', async (t) => {
  const g = comMesa();

  await t.test('pedir o fade marca o turno, e a cena corta na tela', () => {
    executar(g, `ACOES_MESA['desvanecer']('fade')`);
    assert.equal(executar(g, 'M.pedidoDeFade'), true);
    assert.match(executar(g, 'M.mensagens[M.mensagens.length - 1].texto'), /desvanece/i);
  });

  await t.test('e ele viaja no turno seguinte', () => {
    const enviado = executar(g, `NarradorProxy.montar(
      turnoDaMesa({ texto: 'sigo', leitura: {}, veredito: { avisos: [] },
                    estados: [], seg: { segmentos: [] } }).paraNarrador()).fade`);
    assert.equal(enviado, true);
  });

  await t.test('vale por UM turno, como a correção de volume da §57', () => {
    /* Deixá-lo grudado cortaria também a cena que vem depois do corte. */
    assert.match(fonteFront('mesa').replace(/\/\*[\s\S]*?\*\//g, ' '),
      /M\.pedidoDeFade\s*=\s*false/,
      'ninguém apaga o pedido de fade depois do turno');
  });
});

test('Projetos na mesa — o Apêndice II chega à tela (§89)', async (t) => {
  const g = comMesa();

  await t.test('anotar um projeto não o põe em curso', (t2) => {
    executar(g, `criarProjeto({ nome: 'Quebrar o banco', escopo: 3,
                                antecedente: 'Recursos', parada: 'Finanças + Recursos', piscina: 7 })`);
    t2.diagnostic(executar(g, `M.projetos.map(p => p.nome + ':' + p.estado).join(', ')`));
    assert.equal(executar(g, 'M.projetos.length'), 1);
    assert.equal(executar(g, 'M.projetos[0].estado'), 'rascunho');
    assert.equal(executar(g, 'Projetos.emCurso(M.projetos).length'), 0);
  });

  await t.test('projeto sem nome não entra', () => {
    executar(g, `criarProjeto({ nome: '   ', escopo: 2 })`);
    assert.equal(executar(g, 'M.projetos.length'), 1);
  });

  await t.test('lançar rola de verdade e o Dado passa a andar', (t2) => {
    const id = executar(g, 'M.projetos[0].id');
    executar(g, `ACOES_MESA['lancar-projeto'](${JSON.stringify(id)})`);
    const estado = executar(g, 'M.projetos[0].estado');
    t2.diagnostic(`estado ${estado} · dado ${executar(g, 'M.projetos[0].dado')}`);
    assert.ok(['lancado', 'rascunho'].includes(estado), 'estado inesperado depois do Lançamento');
    if (estado === 'lancado') {
      assert.equal(executar(g, 'M.projetos[0].dado'), 10);
      executar(g, `ACOES_MESA['avancar-projeto'](${JSON.stringify(id)})`);
      assert.equal(executar(g, 'M.projetos[0].dado'), 9);
    }
  });

  await t.test('quem rola é a Mesa: o Árbitro segue sem fonte de acaso', () => {
    /* §82. Se `motor-projetos.js` tivesse a sua própria fonte de acaso,
       esta chamada não estouraria — e é justamente ela que tem de
       estourar. O arreio instala uma fonte para o resto dos testes
       (`carregar.mjs`), então aqui ela é tirada de propósito. */
    const semFonte = carregar(['data', 'ficha', 'arbitro']);
    const antes = semFonte.Dados.usarFonte(null);
    try {
      assert.equal(semFonte.Dados.temFonte(), false);
      assert.throws(() => {
        const p = semFonte.Projetos.novo({ nome: 'x', escopo: 1, piscina: 3 });
        semFonte.Dados.rodar(semFonte.Projetos.pedidoDeLancamento(p, { piscina: 3 }));
      }, /fonte de acaso/i);
    } finally { semFonte.Dados.usarFonte(antes); }
  });

  await t.test('e o que está em curso chega ao turno do Narrador', () => {
    executar(g, `M.projetos.forEach(p => { p.estado = 'lancado'; p.dado = 7; })`);
    const enviado = executar(g, `NarradorProxy.montar(
      turnoDaMesa({ texto: 'sigo', leitura: {}, veredito: { avisos: [] },
                    estados: [], seg: { segmentos: [] } }).paraNarrador()).projetos`);
    assert.match(enviado, /Quebrar o banco/);
  });

  await t.test('apagar tira da lista', () => {
    const id = executar(g, 'M.projetos[0].id');
    executar(g, `ACOES_MESA['apagar-projeto'](${JSON.stringify(id)})`);
    assert.equal(executar(g, 'M.projetos.length'), 0);
  });
});

/* Um contexto só para os testes da §91: eles chamam funções das
   áreas Ficha e Data, e não precisam de mesa aberta. */
const criacao = carregar(TODAS);

/* ============================================================
   AS QUATRO QUE A MUTAÇÃO ACHOU  (§91)

   Quatro mutações passaram em verde na primeira rodada, e nenhuma
   era defeito de código: eram testes que não existiam. Uma delas
   mudou o desenho — a regra do ponto do Predador morava dentro de
   um `case` do ouvinte de clique, e regra escondida num `case` não
   tem como ser testada sem simular clique. Ela virou função da
   área Ficha, que é de quem ela sempre foi.
   ============================================================ */

test('Criação — o ponto que o Predador dá (§91, pág. 149)', async (t) => {
  const nova = () => {
    const f = fichaDeTeste(criacao, { cla: 'brujah' });
    f.habilidades = {}; f.especializacoes = {}; f.pontoDoPredador = ''; f.predadorEspec = '';
    return f;
  };

  await t.test('Habilidade em zero ganha o primeiro ponto', (t2) => {
    const f = nova();
    const r = criacao.especializacaoDoPredador(f, 'furto|Arrombamento');
    t2.diagnostic(`${r.habilidade}: ${f.habilidades.furto} · ganhou ${r.ganhouPonto}`);
    assert.equal(r.ganhouPonto, true);
    assert.equal(f.habilidades.furto, 1);
    assert.equal(f.especializacoes.furto, 'Arrombamento');
    assert.equal(f.pontoDoPredador, 'furto');
  });

  await t.test('Habilidade que já tem pontos NÃO ganha nada', () => {
    const f = nova();
    f.habilidades.furto = 3;
    const r = criacao.especializacaoDoPredador(f, 'furto|Arrombamento');
    assert.equal(r.ganhouPonto, false);
    assert.equal(f.habilidades.furto, 3, 'o Predador somou onde não devia');
    assert.equal(f.pontoDoPredador, '');
  });

  await t.test('trocar de especialização devolve o ponto anterior', (t2) => {
    const f = nova();
    criacao.especializacaoDoPredador(f, 'furto|Arrombamento');
    criacao.especializacaoDoPredador(f, 'manha|Ruas');
    t2.diagnostic(JSON.stringify(f.habilidades));
    assert.equal(f.habilidades.furto, undefined, 'o ponto velho ficou de graça na ficha');
    assert.equal(f.habilidades.manha, 1);
    assert.equal(f.pontoDoPredador, 'manha');
  });

  await t.test('e tirar a especialização tira o ponto junto', () => {
    const f = nova();
    criacao.especializacaoDoPredador(f, 'furto|Arrombamento');
    criacao.especializacaoDoPredador(f, '');
    assert.equal(f.habilidades.furto, undefined);
    assert.equal(f.pontoDoPredador, '');
    assert.equal(f.predadorEspec, '');
  });

  await t.test('o ponto do Predador NÃO conta na cota da distribuição', (t2) => {
    /* Ele é do Predador, e o livro não o desconta da distribuição
       escolhida. Contá-lo faria a cota parecer estourada por uma
       escolha que o jogador não fez. */
    const f = nova();
    f.habilidades = { briga: 1, manha: 1 };
    const lista = criacao.todasHabilidades();
    const semPredador = criacao.contagem(f.habilidades, lista);
    criacao.especializacaoDoPredador(f, 'furto|Arrombamento');
    const comPredador = criacao.contagem(f.habilidades, lista, { semContar: f.pontoDoPredador });
    t2.diagnostic(`nível 1: ${semPredador[1]} → ${comPredador[1]}`);
    assert.equal(comPredador[1], semPredador[1], 'o ponto do Predador entrou na cota');
    assert.equal(criacao.contagem(f.habilidades, lista)[1], semPredador[1] + 1,
      'sem `semContar` ele deveria contar — o teste não está medindo nada');
  });
});

test('Criação — quem pode jogar sem Predador (§91, pág. 149)', async (t) => {
  const ctx = carregar(TODAS, { localStorage: memoriaLocal() });
  const jogavel = (f) => executar(ctx, `fichaJogavel(${JSON.stringify(f)})`);

  await t.test('vampiro de clã comum precisa de Predador', (t2) => {
    t2.diagnostic(`com: ${jogavel({ nome: 'X', cla: 'brujah', predador: 'alleycat' })} · `
                + `sem: ${jogavel({ nome: 'X', cla: 'brujah' })}`);
    assert.equal(jogavel({ nome: 'X', cla: 'brujah', predador: 'alleycat' }), true);
    assert.equal(jogavel({ nome: 'X', cla: 'brujah' }), false);
  });

  await t.test('sangue-ralo NÃO precisa — e o livro diz por quê', () => {
    /* "Os sugadores de sangue mais recentes, como os sangues-ralos e
       diversas Crianças da Noite, não selecionam um tipo de Predador,
       pois ainda estão descobrindo esse aspecto da sua existência
       noturna." A mesa exigia de todos, e um sangue-ralo não abria. */
    assert.equal(jogavel({ nome: 'X', cla: 'sangue_fraco' }), true);
  });

  await t.test('nem a Criança da Noite', () => {
    assert.equal(jogavel({ nome: 'X', cla: 'brujah', idadeDaCoterie: 'crianca' }), true);
  });

  await t.test('mas nome e clã continuam obrigatórios', () => {
    assert.equal(jogavel({ cla: 'sangue_fraco' }), false);
    assert.equal(jogavel({ nome: 'X' }), false);
  });
});

test('Criação — os passatempos param em três (§91, pág. 146)', async (t) => {
  await t.test('escolher cinco vale três', (t2) => {
    /* "Escolha três Habilidades recreativas baseadas em hobbies e
       passatempos, com um ponto cada." Sem o corte, quem clicasse em
       cinco levaria cinco pontos — e a soma sairia da distribuição. */
    const cinco = ['maratonista', 'gamer', 'fabricante', 'cacador', 'palco'];
    const r = criacao.Criacao.montar({ passatempos: cinco });
    const quantos = Object.values(r.pontos).filter(v => v === 1).length;
    t2.diagnostic(`${cinco.length} escolhidos → ${quantos} pontos`);
    assert.equal(quantos, criacao.Criacao.QUANTOS_PASSATEMPOS);
    assert.equal(quantos, 3);
  });

  await t.test('e a montagem devolve só os três que valeram', () => {
    const r = criacao.Criacao.montar({ passatempos: ['maratonista', 'gamer', 'fabricante', 'cacador'] });
    assert.equal(r.passatempos.length, 4, 'a lista escolhida é do jogador, e ele escolheu quatro');
    assert.equal(Object.values(r.pontos).filter(v => v === 1).length, 3,
      'mas só três viraram ponto');
  });
});

/* ============================================================
   TRÊS DEFEITOS DE NAVEGAÇÃO  (§92)

   Os três vieram do uso, e os três têm a mesma raiz: um caminho
   que existia até a metade.

     . a logo do topo levava a três destinos diferentes, e nenhum
       era a tela inicial;
     . "Criar personagem" mexia no passo e não na ficha, então ele
       continuava a anterior;
     . guardar não limpava, e limpar não guardava — faltava o verbo
       do meio.
   ============================================================ */

test('Navegação — a logo volta para a tela inicial (§92)', async (t) => {
  const g = comMesa();

  await t.test('a ação existe, e ela desenha a capa', () => {
    assert.equal(executar(g, "typeof ACOES_MESA['capa']"), 'function');
    executar(g, "ACOES_MESA['capa']('x')");
    assert.ok(executar(g, "document.getElementById('app').innerHTML.includes('capa-marca')"),
      'a logo da Mesa não levou à capa');
  });

  await t.test('as TRÊS logos da Mesa apontam para lá', (t2) => {
    /* Eram três cabeçalhos com três destinos: dois iam ao saguão — e o
       do próprio saguão ia a ele mesmo, um clique morto — e o terceiro
       chamava `sair`, que chama o `render()` do CRIADOR, no passo em
       que ele tivesse parado. Era a "página aleatória". */
    const fonte = fonteFront('mesa');
    const logos = [...fonte.matchAll(/class="topo-marca" data-mesa="([a-z-]+)"/g)].map(m => m[1]);
    t2.diagnostic(logos.join(', '));
    assert.equal(logos.length, 3, 'a Mesa mudou de número de cabeçalhos');
    assert.deepEqual([...new Set(logos)], ['capa'], 'alguma logo voltou a levar a outro lugar');
  });

  await t.test('e ela salva a mesa antes de sair', () => {
    /* Sair sem salvar perderia o turno em curso. */
    const fonte = fonteFront('mesa-acoes').replace(/\/\*[\s\S]*?\*\//g, ' ');
    const corpo = fonte.slice(fonte.indexOf("'capa'("), fonte.indexOf("'sair'("));
    assert.match(corpo, /salvarMesa\(\)/);
  });
});

test('Criador — "Criar personagem" cria um personagem (§92)', async (t) => {
  const criador = () => {
    const ctx = carregar(TODAS, { localStorage: memoriaLocal() });
    executar(ctx, `
      S = FICHA_VAZIA();
      S.nome = 'Antiga'; S.cla = 'brujah'; S.atributos.forca = 4;
      passo = 5; salvar();
    `);
    return ctx;
  };

  await t.test('ele zera a ficha, e não só o passo', (t2) => {
    /* Antes ele fazia `passo = 0` e mais nada: quem guardasse uma ficha
       e clicasse aqui continuava editando a mesma, sem aviso. */
    const ctx = criador();
    executar(ctx, 'novaFicha()');
    t2.diagnostic(`nome "${executar(ctx, 'S.nome')}" · força ${executar(ctx, 'S.atributos.forca || 0')} · passo ${executar(ctx, 'passo')}`);
    assert.equal(executar(ctx, 'S.nome'), '');
    assert.equal(executar(ctx, 'S.cla'), '');
    assert.equal(executar(ctx, 'S.atributos.forca || 0'), 0);
    assert.equal(executar(ctx, 'passo'), 0);
  });

  await t.test('a ficha anterior não se perde: a capa oferece continuar', (t2) => {
    /* `carregar()` e a ação `continuar` existiam desde sempre — e
       NENHUM botão os acionava. Era um caminho até a metade, do mesmo
       tipo das tabelas que a §67, a §90 e a §91 acharam. */
    const ctx = criador();
    const antes = executar(ctx, 'JSON.stringify(fichaEmAndamento())');
    t2.diagnostic(antes);
    assert.equal(JSON.parse(antes).nome, 'Antiga');
    executar(ctx, 'renderCapa()');
    assert.ok(executar(ctx, `document.getElementById('app').innerHTML.includes('data-acao="continuar"')`),
      'a capa não ofereceu continuar a ficha em andamento');
  });

  await t.test('e continuar traz a ficha de volta, no passo onde parou', () => {
    const ctx = criador();
    executar(ctx, `S = FICHA_VAZIA(); passo = 0; carregar();`);
    assert.equal(executar(ctx, 'S.nome'), 'Antiga');
    assert.equal(executar(ctx, 'passo'), 5);
  });

  await t.test('ele PERGUNTA antes de descartar o que está em andamento', (t2) => {
    /* A primeira versão desta correção zerava e salvava por cima, e
       apagava a ficha em andamento em silêncio — pior do que o defeito
       que ela veio consertar. Quem mostrou foi o teste no navegador:
       depois de "começar de novo", a capa parava de oferecer
       "Continuar". Dois cliques, como a §37.4 manda. */
    const ctx = criador();
    executar(ctx, 'novaArmada = false');

    /* Primeiro clique: arma e NÃO mexe na ficha. */
    const um = JSON.parse(executar(ctx, 'JSON.stringify(comecarNovaFicha())'));
    t2.diagnostic(um.aviso);
    assert.equal(um.armou, true);
    assert.equal(um.criou, false);
    assert.match(um.aviso, /Antiga/, 'o aviso não diz qual ficha está em jogo');
    assert.equal(executar(ctx, 'fichaEmAndamento().nome'), 'Antiga',
      'o primeiro clique já apagou a ficha em andamento');
    assert.equal(executar(ctx, 'S.nome'), 'Antiga', 'o primeiro clique já zerou o criador');

    /* Segundo clique: aí sim. */
    const dois = JSON.parse(executar(ctx, 'JSON.stringify(comecarNovaFicha())'));
    assert.equal(dois.criou, true);
    assert.equal(executar(ctx, 'S.nome'), '');
    assert.equal(executar(ctx, 'fichaEmAndamento()'), null);
  });

  await t.test('e a capa diz que vai descartar, em vez de fazer calada', () => {
    const ctx = criador();
    executar(ctx, 'novaArmada = true; renderCapa()');
    const html = executar(ctx, "document.getElementById('app').innerHTML");
    assert.match(html, /Descartar a em andamento/);
  });

  await t.test('sem ficha em andamento, não há pergunta nenhuma', (t2) => {
    const ctx = carregar(TODAS, { localStorage: memoriaLocal() });
    executar(ctx, 'S = FICHA_VAZIA(); passo = 0; salvar(); novaArmada = false');
    assert.equal(executar(ctx, 'fichaEmAndamento()'), null);
    const r = JSON.parse(executar(ctx, 'JSON.stringify(comecarNovaFicha())'));
    t2.diagnostic(`armou ${r.armou} · criou ${r.criou}`);
    assert.equal(r.armou, false, 'o caso comum pagou pela confirmação');
    assert.equal(r.criou, true);
  });

  await t.test('criador vazio não vira oferta de "continuar"', () => {
    const ctx = carregar(TODAS, { localStorage: memoriaLocal() });
    executar(ctx, 'S = FICHA_VAZIA(); passo = 0; salvar()');
    assert.equal(executar(ctx, 'fichaEmAndamento()'), null);
  });
});

test('Criador — FINALIZAR guarda e limpa (§92)', async (t) => {
  const pronto = () => {
    const ctx = carregar(TODAS, { localStorage: memoriaLocal() });
    executar(ctx, `
      S = FICHA_VAZIA();
      Object.assign(S, ${JSON.stringify(fichaDeTeste(carregar(['data', 'ficha']),
        { nome: 'Inácia Vasques', cidade: 'rio' }))});
      passo = PASSOS.length - 1; salvar();
    `);
    return ctx;
  };

  await t.test('a ficha vai para a biblioteca', (t2) => {
    const ctx = pronto();
    const r = JSON.parse(executar(ctx, 'JSON.stringify(finalizarFicha())'));
    t2.diagnostic(r.aviso);
    assert.equal(r.finalizou, true);
    assert.equal(executar(ctx, 'listarFichas().length'), 1);
    assert.equal(executar(ctx, 'listarFichas()[0].nome'), 'Inácia Vasques');
  });

  await t.test('e o criador fica LIMPO — era este o defeito', (t2) => {
    /* "A ficha editada está ficando salva no criador": guardar não
       limpava, e o personagem seguinte começava por cima do anterior. */
    const ctx = pronto();
    executar(ctx, 'finalizarFicha()');
    t2.diagnostic(`nome "${executar(ctx, 'S.nome')}" · passo ${executar(ctx, 'passo')}`);
    assert.equal(executar(ctx, 'S.nome'), '');
    assert.equal(executar(ctx, 'passo'), 0);
    assert.equal(executar(ctx, 'fichaEmAndamento()'), null,
      'a capa ainda ofereceria continuar a ficha que acabou de ser finalizada');
  });

  await t.test('sem nome ou sem clã, ele não finaliza nem limpa', (t2) => {
    const ctx = carregar(TODAS, { localStorage: memoriaLocal() });
    executar(ctx, "S = FICHA_VAZIA(); S.nome = 'Só o nome'");
    const r = JSON.parse(executar(ctx, 'JSON.stringify(finalizarFicha())'));
    t2.diagnostic(r.aviso);
    assert.equal(r.finalizou, false);
    assert.equal(executar(ctx, 'S.nome'), 'Só o nome', 'limpou uma ficha que não guardou');
    assert.equal(executar(ctx, 'listarFichas().length'), 0);
  });

  await t.test('se a gravação FALHAR, ele não limpa nada', (t2) => {
    /* Esta é a assimetria que importa: finalizar guarda e limpa, e a
       ordem é essa. Perder a ficha porque o armazenamento recusou seria
       trocar um incômodo por um estrago — e foi a mutação que mostrou
       que nada afirmava isso: fazer `finalizarFicha` limpar mesmo sem
       ter guardado passava em verde. */
    const ctx = pronto();
    executar(ctx, 'guardarFicha = () => null');
    const r = JSON.parse(executar(ctx, 'JSON.stringify(finalizarFicha())'));
    t2.diagnostic(r.aviso);
    assert.equal(r.finalizou, false);
    assert.equal(executar(ctx, 'S.nome'), 'Inácia Vasques', 'a ficha foi limpa sem ter sido guardada');
    assert.equal(executar(ctx, 'fichaEmAndamento() !== null'), true,
      'o criador foi zerado no localStorage sem a ficha estar salva');
  });

  await t.test('e finalizar duas vezes não faz duas fichas', () => {
    /* `guardarFicha` reaproveita `fichaId`; finalizar limpa o criador,
       então a segunda chamada não tem o que guardar. */
    const ctx = pronto();
    executar(ctx, 'finalizarFicha()');
    const segunda = JSON.parse(executar(ctx, 'JSON.stringify(finalizarFicha())'));
    assert.equal(segunda.finalizou, false);
    assert.equal(executar(ctx, 'listarFichas().length'), 1);
  });

  await t.test('o botão está na tela, e é o primeiro', (t2) => {
    const ctx = pronto();
    executar(ctx, "passo = PASSOS.length - 1");
    const html = executar(ctx, 'painelFicha()');
    const acoes = [...html.matchAll(/data-acao="([a-z-]+)"/g)].map(m => m[1]);
    t2.diagnostic(acoes.slice(0, 4).join(', '));
    assert.equal(acoes[0], 'finalizar-ficha', 'Finalizar deixou de ser a primeira ação da ficha');
    assert.ok(acoes.includes('guardar-ficha'), 'guardar sem sair sumiu');
    assert.ok(acoes.includes('reiniciar'), 'descartar sumiu');
  });
});

/* ============================================================
   §93 — A ABA DE DEBUG

   O tráfego é um OBSERVADOR, e a maior parte destes testes é sobre
   as três promessas do cabeçalho do `trafego.js`: ele não muda
   nada, ele não vive na sessão, e ele não guarda tudo. As três são
   fáceis de quebrar sem que nada mais falhe, que é exatamente o
   caso em que um teste vale o que custa.
   ============================================================ */

/** Uma mesa cujo tráfego de ABERTURA já assentou.

    `iniciarMesa` dispara `Ponte.descobrir()`, e as três sondagens de
    saúde caem no registro depois que o teste já começou. Isso é prova
    de que a instrumentação da Ponte funciona — e é ruído em quem
    conta linhas. Espera, e só então zera. */
async function comMesaQuieta() {
  const g = comMesa();
  await new Promise(r => setTimeout(r, 25));
  executar(g, 'Trafego.limpar()');
  return g;
}

test('Tráfego — o anel guarda as últimas, e diz quantas passaram (§93)', async (t) => {
  const g = await comMesaQuieta();

  await t.test('cada linha ganha o número seguinte', () => {
    executar(g, `Trafego.registrar({ de: 'mesa', para: 'arbitro', assunto: 'um' })`);
    executar(g, `Trafego.registrar({ de: 'mesa', para: 'arbitro', assunto: 'dois' })`);
    assert.equal(executar(g, 'Trafego.linhas.map(l => l.id).join(",")'), '1,2');
  });

  await t.test('o que passa do limite cai do começo, e o total não esquece', () => {
    executar(g, `for (let i = 0; i < Trafego.LIMITE + 40; i++)
                   Trafego.registrar({ de: 'mesa', para: 'arbitro', assunto: 'n' + i });`);
    assert.equal(executar(g, 'Trafego.linhas.length'), executar(g, 'Trafego.LIMITE'));
    assert.equal(executar(g, 'Trafego.total'), executar(g, 'Trafego.LIMITE') + 42);
    /* a primeira sobrevivente é a que entrou depois do corte */
    assert.equal(executar(g, 'Trafego.linhas[0].assunto'), 'n40');
  });

  await t.test('carga grande é cortada, e a linha diz quanto ficou de fora', () => {
    executar(g, `Trafego.registrar({ de: 'mesa', para: 'cronista', assunto: 'grande',
                                     dados: 'x'.repeat(Trafego.TETO_DA_CARGA + 500) })`);
    const carga = executar(g, 'Trafego.linhas[Trafego.linhas.length - 1].carga');
    assert.ok(carga.length < executar(g, 'Trafego.TETO_DA_CARGA') + 60, 'a carga não foi cortada');
    assert.match(carga, /\+500 caracteres/);
  });

  await t.test('limpar zera as três contas', () => {
    executar(g, 'Trafego.limpar()');
    assert.equal(executar(g, 'Trafego.linhas.length'), 0);
    assert.equal(executar(g, 'Trafego.total'), 0);
    assert.equal(executar(g, 'Trafego._seq'), 0);
  });
});

test('Tráfego — serializar não pode derrubar o turno (§93)', async (t) => {
  const g = await comMesaQuieta();

  await t.test('objeto com ciclo entra sem estourar', () => {
    executar(g, `const a = { nome: 'ciclo' }; a.eu = a;
                 Trafego.registrar({ de: 'mesa', para: 'arbitro', assunto: 'c', dados: a });`);
    assert.match(executar(g, 'Trafego.linhas[0].carga'), /\[ciclo\]/);
  });

  await t.test('Error vira texto legível, e não um objeto vazio', () => {
    executar(g, `Trafego.registrar({ de: 'mesa', para: 'arbitro', assunto: 'e',
                                     dados: { falha: new Error('caiu') } })`);
    assert.match(executar(g, 'Trafego.linhas[1].carga'), /Error: caiu/);
  });

  await t.test('nada aqui muda o que foi passado', () => {
    executar(g, `const alvo = { a: 1 };
                 Trafego.registrar({ de: 'mesa', para: 'arbitro', assunto: 'x', dados: alvo });
                 globalThis._alvo = JSON.stringify(alvo);`);
    assert.equal(executar(g, '_alvo'), '{"a":1}');
  });
});

test('Tráfego — medir registra a ida, a volta e a queda (§93)', async (t) => {
  const g = await comMesaQuieta();

  await t.test('ida e volta, com o tempo na volta', async () => {
    executar(g, 'Trafego.limpar()');
    const r = await executar(g, `Trafego.medir(
      { de: 'mesa', para: 'cronista', assunto: 'contar', envio: { q: 1 } },
      async () => ({ texto: 'foi' }))`);
    assert.equal(r.texto, 'foi');
    assert.equal(executar(g, 'Trafego.linhas.map(l => l.assunto).join(" | ")'),
                 'contar → | contar ←');
    assert.equal(executar(g, 'Trafego.linhas[0].ms'), null);
    assert.equal(executar(g, 'typeof Trafego.linhas[1].ms'), 'number');
    assert.equal(executar(g, 'Trafego.linhas[1].de'), 'cronista');
  });

  await t.test('quando estoura, registra a queda E RELANÇA', async () => {
    executar(g, 'Trafego.limpar()');
    await assert.rejects(() => executar(g, `Trafego.medir(
      { de: 'mesa', para: 'cronista', assunto: 'contar' },
      async () => { throw new Error('o módulo caiu'); })`), /o módulo caiu/);
    assert.equal(executar(g, 'Trafego.linhas[1].assunto'), 'contar ✕');
    assert.equal(executar(g, 'Trafego.linhas[1].erro'), 'o módulo caiu');
  });
});

test('Tráfego — os filtros da aba (§93)', async (t) => {
  const g = await comMesaQuieta();
  executar(g, `Trafego.limpar();
    Trafego.registrar({ de: 'mesa', para: 'arbitro',  assunto: 'a' });
    Trafego.registrar({ de: 'mesa', para: 'cronista', assunto: 'b' });
    Trafego.registrar({ de: 'modulo', para: 'mesa',   assunto: 'c', erro: 'caiu' });`);

  await t.test('"tudo" mostra tudo, e devolve cópia', () => {
    assert.equal(executar(g, 'Trafego.filtrar("tudo").length'), 3);
    assert.equal(executar(g, 'Trafego.filtrar("tudo") === Trafego.linhas'), false);
  });

  await t.test('por lado pega os dois sentidos', () => {
    assert.equal(executar(g, 'Trafego.filtrar("arbitro").map(l => l.assunto).join()'), 'a');
    assert.equal(executar(g, 'Trafego.filtrar("modulo").map(l => l.assunto).join()'), 'c');
  });

  await t.test('"erro" pega só o que falhou', () => {
    assert.equal(executar(g, 'Trafego.filtrar("erro").map(l => l.assunto).join()'), 'c');
  });

  await t.test('copiar leva o que está à vista, e não o registro inteiro', () => {
    const texto = executar(g, 'Trafego.comoTexto("erro")');
    assert.match(texto, /Módulos → Mesa/);
    assert.match(texto, /ERRO: caiu/);
    assert.ok(!texto.includes('assunto: a'), 'copiou o que estava fora do filtro');
  });
});

test('Tráfego — o que cada gancho da Mesa resume (§93)', async (t) => {
  const g = await comMesaQuieta();

  await t.test('a pergunta ao Árbitro NÃO leva a ficha junto', () => {
    executar(g, 'Trafego.limpar()');
    executar(g, `Trafego.perguntaAoArbitro({ texto: 'abro a porta', modo: 'agir',
      estados: [], fala: null, personagem: M.ficha.nome })`);
    const carga = executar(g, 'Trafego.linhas[0].carga');
    assert.match(carga, /abro a porta/);
    assert.match(carga, /Inácia/);
    assert.ok(!/atributos/.test(carga), 'a ficha inteira subiu para o registro');
  });

  await t.test('o veredito vira rotas legíveis e motivos de bloqueio', () => {
    executar(g, 'Trafego.limpar()');
    executar(g, `Trafego.vereditoDoArbitro(
      { possivel: true, acao: { nome: 'Arrombar' }, dificuldade: 3,
        rotas: [{ atributo: 'Força', pericia: 'Briga' }],
        bloqueios: [{ motivo: 'porta reforçada' }], avisos: [] },
      { qual: 'lexico', ms: 12, elos: null })`);
    const carga = executar(g, 'Trafego.linhas[0].carga');
    assert.match(carga, /Força \+ Briga/);
    assert.match(carga, /porta reforçada/);
    assert.equal(executar(g, 'Trafego.linhas[0].assunto'), 'veredito ← (lexico)');
    assert.equal(executar(g, 'Trafego.linhas[0].ms'), 12);
  });

  await t.test('a rolagem da §82 cabe numa linha só, com os três passos', () => {
    executar(g, 'Trafego.limpar()');
    executar(g, `Trafego.rolagem(
      { ondePensou: 'arbitro', ondeRolou: 'mesa', tipo: 'sucesso', sucessos: 3, margem: 1 },
      { pedido: { normais: 5, fome: 1, dificuldade: 2, rotulo: 'Força + Briga' },
        valores: { normais: [8,9,2,4,6], dadosFome: [10] }, doArbitro: true })`);
    assert.equal(executar(g, 'Trafego.linhas.length'), 1, 'virou mais de uma linha');
    const carga = executar(g, 'Trafego.linhas[0].carga');
    for (const passo of ['pediu', 'rodou', 'apurou']) assert.match(carga, new RegExp(passo));
    assert.equal(executar(g, 'Trafego.linhas[0].via'), 'http');
  });

  await t.test('sem passo, o degrau não registra nada', () => {
    executar(g, 'Trafego.limpar()');
    executar(g, 'Trafego.degrauQueRespondeu(null)');
    assert.equal(executar(g, 'Trafego.linhas.length'), 0);
    executar(g, `Trafego.degrauQueRespondeu({ degrau: { numero: 2, nome: 'Campanha', custa: false },
                                              resposta: { tipo: 'beat' } })`);
    assert.match(executar(g, 'Trafego.linhas[0].assunto'), /degrau 2 — Campanha/);
  });

  await t.test('a volta do Narrador conta os achados em vez de repeti-los', () => {
    const r = executar(g, `JSON.stringify(Trafego.voltaDoNarrador(
      { texto: 'A porta cede.', modelo: 'x', locais: [1,2], pessoas: [1], fatos: [], fios: null }))`);
    assert.match(r, /"texto":"A porta cede\."/);
    assert.match(r, /"locais":2/);
    assert.match(r, /"fios":0/);
  });
});

test('Tráfego — o envelope do Narrador não muda o Narrador (§93)', async (t) => {
  const g = await comMesaQuieta();

  await t.test('mesma interface, mesma resposta', async () => {
    executar(g, `Trafego.limpar();
      globalThis._falso = { nome: 'Falso', ia: false,
        async responder(turno) { return { texto: 'ecoo ' + turno.texto }; } };
      globalThis._env = Trafego.envelopar(_falso, null);`);
    const r = await executar(g, `_env.responder({ texto: 'oi' })`);
    assert.equal(r.texto, 'ecoo oi');
    assert.equal(executar(g, 'Trafego.linhas.length'), 2);
    assert.match(executar(g, 'Trafego.linhas[0].assunto'), /turno para Falso/);
  });

  await t.test('quando há `montar`, o que sobe ao registro é o corpo real', async () => {
    executar(g, `Trafego.limpar();
      globalThis._env2 = Trafego.envelopar(_falso, (t) => ({ corpoDeVerdade: t.texto }));`);
    await executar(g, `_env2.responder({ texto: 'oi', gordura: 'x'.repeat(50) })`);
    const carga = executar(g, 'Trafego.linhas[0].carga');
    assert.match(carga, /corpoDeVerdade/);
    assert.ok(!/gordura/.test(carga), 'subiu o turno de dentro em vez do corpo montado');
  });

  await t.test('narrador que estoura continua estourando', async () => {
    executar(g, `Trafego.limpar();
      globalThis._quebra = Trafego.envelopar(
        { nome: 'Quebrado', async responder() { throw new Error('sem provedor'); } }, null);`);
    await assert.rejects(() => executar(g, '_quebra.responder({ texto: "oi" })'), /sem provedor/);
  });
});

test('Tráfego — ele não vive na sessão (§93)', async (t) => {
  const g = await comMesaQuieta();

  await t.test('o que é salvo não tem uma linha de tráfego', () => {
    executar(g, `Trafego.limpar();
      Trafego.registrar({ de: 'mesa', para: 'cronista', assunto: 'segredo do registro',
                          dados: { muito: 'x'.repeat(1000) } });
      salvarMesa();`);
    const chaves = executar(g, 'Object.keys(localStorage).join()');
    const tudo = executar(g, 'Object.keys(localStorage).map(k => localStorage.getItem(k)).join()');
    assert.ok(chaves.length > 0, 'a mesa nem foi salva; o teste não provaria nada');
    assert.ok(!tudo.includes('segredo do registro'),
      'o tráfego entrou no que é salvo — a cota do navegador e o Módulo 3 pagam por isso');
  });

  await t.test('e o filtro da aba também não', () => {
    executar(g, `Trafego.vista.par = 'erro'; salvarMesa();`);
    const emM = executar(g, 'Object.keys(M).filter(k => /debug|trafego/i.test(k)).join()');
    assert.equal(emM, '', `o estado da aba de Debug vazou para M: ${emM}`);
    assert.equal(executar(g, 'M.debugPar === undefined && M.trafego === undefined'), true);
  });
});

test('Debug — a aba mostra o tráfego, e os botões dela (§93)', async (t) => {
  const g = await comMesaQuieta();

  await t.test('a aba existe e o corpo dela é o docaDebug', () => {
    assert.ok(executar(g, 'ABAS_DOCA.some(a => a.id === "debug")'), 'a aba não foi registrada');
    executar(g, `M.aba = 'debug'`);
    assert.ok(executar(g, 'corpoDocaHTML().includes("de um lado para o outro")'),
      'a aba debug não chegou ao corpoDocaHTML');
  });

  await t.test('cada linha vira um cartão, com os dois lados', () => {
    executar(g, `Trafego.limpar();
      Trafego.registrar({ de: 'mesa', para: 'arbitro', assunto: 'arbitrar o turno →',
                          dados: { texto: 'abro a porta' } });`);
    const html = executar(g, 'docaDebug()');
    assert.match(html, /class="trafego"/);
    assert.match(html, /lado-mesa/);
    assert.match(html, /lado-arbitro/);
    assert.match(html, /arbitrar o turno/);
    assert.ok(!html.includes('abro a porta'), 'a carga apareceu com a linha fechada');
  });

  await t.test('clicar na linha abre a carga, e clicar de novo fecha', () => {
    const id = executar(g, 'Trafego.linhas[0].id');
    executar(g, `ACOES_MESA['debug-linha'](${JSON.stringify(String(id))})`);
    assert.match(executar(g, 'docaDebug()'), /abro a porta/);
    executar(g, `ACOES_MESA['debug-linha'](${JSON.stringify(String(id))})`);
    assert.ok(!executar(g, 'docaDebug()').includes('abro a porta'), 'a carga não fechou');
  });

  await t.test('o filtro filtra de verdade', () => {
    executar(g, `Trafego.registrar({ de: 'mesa', para: 'cronista', assunto: 'turno para o Narrador' })`);
    executar(g, `ACOES_MESA['debug-par']('cronista')`);
    const html = executar(g, 'docaDebug()');
    assert.match(html, /turno para o Narrador/);
    assert.ok(!html.includes('arbitrar o turno'), 'o filtro deixou passar o que era do Árbitro');
    executar(g, `ACOES_MESA['debug-par']('tudo')`);
  });

  await t.test('sem nada no filtro, ela diz que não há nada', () => {
    executar(g, `Trafego.limpar()`);
    assert.match(executar(g, 'docaDebug()'), /Nada ainda/);
  });
});

test('Debug — limpar pede dois cliques, copiar não derruba nada (§93)', async (t) => {
  const g = await comMesaQuieta();

  await t.test('o primeiro clique arma, o segundo apaga', () => {
    executar(g, `Trafego.limpar();
      Trafego.registrar({ de: 'mesa', para: 'arbitro', assunto: 'a' });`);
    assert.equal(executar(g, 'limparTrafego()'), false, 'apagou no primeiro clique');
    assert.equal(executar(g, 'Trafego.linhas.length'), 1, 'apagou no primeiro clique');
    assert.equal(executar(g, 'Trafego.vista.armado'), true);
    assert.equal(executar(g, 'limparTrafego()'), true);
    assert.equal(executar(g, 'Trafego.linhas.length'), 0);
    assert.equal(executar(g, 'Trafego.vista.armado'), false);
  });

  await t.test('mexer no filtro desarma — senão o próximo clique apaga sem avisar', () => {
    executar(g, `Trafego.registrar({ de: 'mesa', para: 'arbitro', assunto: 'a' });
                 limparTrafego();`);
    assert.equal(executar(g, 'Trafego.vista.armado'), true);
    executar(g, `ACOES_MESA['debug-par']('tudo')`);
    assert.equal(executar(g, 'Trafego.vista.armado'), false);
    assert.equal(executar(g, 'Trafego.linhas.length'), 1, 'a linha sumiu no caminho');
  });

  await t.test('o botão diz em que estado está', () => {
    executar(g, `Trafego.limpar(); Trafego.registrar({ de: 'mesa', para: 'arbitro', assunto: 'a' });`);
    assert.match(executar(g, 'docaDebug()'), />Limpar</);
    executar(g, 'limparTrafego()');
    assert.match(executar(g, 'docaDebug()'), />\s*Apagar mesmo\?</,
      'armado e sem dizer: o próximo clique apaga de surpresa');
  });

  await t.test('sair da aba desarma', () => {
    executar(g, `Trafego.vista.armado = true; ACOES_MESA['aba']('estado');`);
    assert.equal(executar(g, 'Trafego.vista.armado'), false,
      'voltar à aba depois apagaria de primeira');
  });

  await t.test('copiar desarma — "Copiar" e depois "Limpar" não apaga de primeira', async () => {
    executar(g, `Trafego.vista.armado = true;`);
    await executar(g, 'copiarTrafego()');
    assert.equal(executar(g, 'Trafego.vista.armado'), false);
  });

  await t.test('copiar sem nada à vista não tenta copiar', async () => {
    executar(g, `Trafego.limpar(); Trafego.vista.par = 'tudo';`);
    assert.equal(await executar(g, 'copiarTrafego()'), false);
  });

  await t.test('e a recusa da área de transferência não vira erro de turno', async () => {
    /* No arreio, `navigator` não tem `clipboard` — é a mesma recusa que
       o navegador dá fora de contexto seguro. O que não pode é subir. */
    executar(g, `Trafego.registrar({ de: 'mesa', para: 'arbitro', assunto: 'a' })`);
    assert.equal(await executar(g, 'copiarTrafego()'), false);
    assert.equal(executar(g, 'Trafego.linhas.length'), 1, 'copiar mexeu no registro');
  });
});

/* ============================================================
   O TURNO DE DESFECHO  (§100)

   Veio de um turno de verdade: o Narrador pediu um teste, o jogador
   rolou, tirou sucesso — e a ação nunca concluiu.

   A causa não era o modelo. O prefixo do Narrador diz, e sempre disse:
   "se o resultado do teste vier no pedido, narre esse resultado; se não
   vier, narre até onde a ação chega e PARE." O campo `resultado` do
   turno chegava vazio em todo turno, e o modelo parava — obedecendo.

   Quinta tabela morta do projeto: o campo existe, o leitor existe, e
   nada no meio preenchia.
   ============================================================ */
test('Desfecho — o campo que ninguém preenchia (§100)', async (t) => {
  const g = await comMesaQuieta();

  await t.test('o turno comum continua sem resultado — ele ainda não houve', () => {
    const r = executar(g, `turnoDaMesa({ texto: 'abro a porta', leitura: {},
      veredito: { avisos: [] }, estados: [], seg: { segmentos: [] } }).paraNarrador().resultado`);
    assert.equal(r, '', 'turno sem rolagem passou a inventar resultado');
  });

  await t.test('e o turno de desfecho leva o resultado até o Narrador', (t2) => {
    const r = executar(g, `turnoDaMesa({ texto: 'ouvir a porta', leitura: {},
      veredito: { avisos: [] }, estados: [], seg: { segmentos: [] },
      resultado: 'Inteligência + Investigação: sucesso · 3 sucesso(s)' }).paraNarrador().resultado`);
    t2.diagnostic(r);
    assert.match(r, /sucesso/, 'o campo continuou morto');
  });

  await t.test('o corpo que sobe ao Módulo 5 carrega o resultado', (t2) => {
    /* Não basta o campo existir no turno: ele tem de sobreviver ao
       `NarradorProxy.montar`, que é o que vira corpo HTTP de verdade. */
    const corpo = executar(g, `NarradorProxy.montar(turnoDaMesa({ texto: 'ouvir a porta',
      leitura: {}, veredito: { avisos: [] }, estados: [], seg: { segmentos: [] },
      resultado: 'Percepção + Perspicácia: falha' }).paraNarrador()).resultado`);
    t2.diagnostic(corpo);
    assert.match(corpo, /falha/, 'o resultado morreu no caminho para o Módulo 5');
  });
});

test('Desfecho — como o resultado é escrito para o Narrador (§100)', async (t) => {
  const g = await comMesaQuieta();

  await t.test('uma linha só: a parada e o que Dados.descrever diz dela', (t2) => {
    const r = { rotulo: 'Força + Briga', tipo: 'sucesso', sucessos: 3, margem: 1, dificuldade: 2 };
    const linha = executar(g, `resultadoParaNarrador(${JSON.stringify(r)})`);
    t2.diagnostic(linha);
    assert.equal(linha, `Força + Briga: ${executar(g, `Dados.descrever(${JSON.stringify(r)})`)}`,
      'a linha deixou de ser só o rótulo mais a frase de Dados.descrever');
  });

  await t.test('e ela NÃO repete o que descrever já disse', (t2) => {
    /* A primeira versão somava "dificuldade N" e "N sucesso(s)" por
       cima da frase, e saía com tudo três vezes. Quem achou foi a
       mutação: tirar um dos pedaços não derrubava teste nenhum. */
    const linha = executar(g, `resultadoParaNarrador({ rotulo: 'x', tipo: 'sucesso',
      sucessos: 3, margem: 1, dificuldade: 2 })`);
    const quantas = (linha.match(/dificuldade/g) || []).length;
    t2.diagnostic(`"dificuldade" aparece ${quantas}x em: ${linha}`);
    assert.equal(quantas, 1, 'a dificuldade voltou a ser dita duas vezes');
  });

  await t.test('sem resultado, string vazia — e não "undefined"', () => {
    assert.equal(executar(g, 'resultadoParaNarrador(null)'), '');
  });

  await t.test('o texto do desfecho prefere o que o NARRADOR pediu', (t2) => {
    /* "ouvir se Bia está falando com alguém" diz mais do que
       "Inteligência + Investigação": foi o Narrador que escreveu o que
       estava em jogo. */
    const t1 = executar(g, `textoDoDesfecho({ descricao: 'ouvir se Bia está falando com alguém',
      rotulo: 'Inteligência + Investigação' }, { rotulo: 'Inteligência + Investigação' })`);
    t2.diagnostic(t1);
    assert.equal(t1, 'ouvir se Bia está falando com alguém');
  });

  await t.test('e cai no rótulo da parada quando não houve pedido escrito', () => {
    assert.equal(executar(g, `textoDoDesfecho(null, { rotulo: 'Destreza + Furto' })`),
                 'Destreza + Furto');
    assert.equal(executar(g, 'textoDoDesfecho(null, null)'), 'a ação');
  });
});

test('Desfecho — quando ele NÃO acontece (§100)', async (t) => {
  await t.test('sem resultado não há o que narrar', async () => {
    const g = await comMesaQuieta();
    assert.equal(await executar(g, 'narrarDesfecho({}, null)'), null);
  });

  await t.test('em combate, não — o golpe já se narra sozinho', async (t2) => {
    /* Chamar o Narrador aqui descreveria o mesmo golpe duas vezes. */
    const g = await comMesaQuieta();
    executar(g, `abrirCombate({ motivo: 'teste', oponentes: [] })`);
    t2.diagnostic(`combate ativo: ${executar(g, 'combateAtivo()')}`);
    assert.equal(executar(g, 'combateAtivo()'), true, 'o combate não abriu; o teste não prova nada');
    assert.equal(await executar(g, `narrarDesfecho({}, { rotulo: 'x', tipo: 'sucesso' })`), null);
  });

  await t.test('e a mesa ocupada não recebe dois turnos ao mesmo tempo', async () => {
    const g = await comMesaQuieta();
    executar(g, 'mesaOcupada = true');
    assert.equal(await executar(g, `narrarDesfecho({}, { rotulo: 'x', tipo: 'sucesso' })`), null);
    executar(g, 'mesaOcupada = false');
  });
});

test('Desfecho — a rolagem do jogador chama o desfecho (§100)', async (t) => {
  const g = await comMesaQuieta();

  await t.test('rolarDoJogador termina chamando narrarDesfecho', () => {
    /* O caminho inteiro exige um Narrador de verdade; o que se afirma
       aqui é a LIGAÇÃO, que é o que faltava. Sem ela o jogador rola e a
       ação nunca conclui — foi o defeito relatado. */
    const fonte = fonteFront('mesa');
    const corpo = fonte.slice(fonte.indexOf('async function rolarDoJogador'),
                              fonte.indexOf('function textoDoDesfecho'));
    assert.match(corpo, /await narrarDesfecho\(pedido, resultado\)/,
      'a rolagem do jogador voltou a terminar sem contar como foi');
  });

  await t.test('e o desfecho desce a MESMA escada do turno comum', () => {
    const fonte = fonteFront('mesa');
    const corpo = fonte.slice(fonte.indexOf('async function narrarDesfecho'),
                              fonte.indexOf('function vontadeDisponivel'));
    assert.match(corpo, /escadaDaMesa\(\)\.descer\(turno\)/,
      'o desfecho passou a ter caminho próprio, e os degraus de cima deixaram de valer');
    assert.match(corpo, /aplicarPasso\(passo, turno\)/);
  });
});

test('Debug — nenhum gancho muda o jogo (§93)', async (t) => {
  await t.test('o veredito é o mesmo com e sem o Trafego', async () => {
    /* A promessa 1 do cabeçalho do `trafego.js`. Ela é fácil de quebrar
       sem que nada mais falhe: basta um gancho que leia um campo que
       ainda não existe, ou que mexa no objeto que ele resume. */
    const rodar = (g) => executar(g, `JSON.stringify((() => {
      const v = Arbitro.avaliar({ ficha: M.ficha, estados: [], texto: 'abro a porta', fala: null });
      if (typeof Trafego !== 'undefined') Trafego.perguntaAoArbitro(
        { texto: 'abro a porta', modo: M.modo, estados: [], fala: null, personagem: M.ficha.nome });
      return { possivel: v.possivel, acao: v.acao && v.acao.nome };
    })())`);
    const comGancho = await comMesaQuieta(), semGancho = await comMesaQuieta();
    executar(semGancho, 'globalThis.Trafego = undefined');
    assert.equal(rodar(comGancho), rodar(semGancho));
  });

  await t.test('todo uso do Trafego no jogo está atrás de um `typeof`', () => {
    /* Não dá para provar isto rodando: `Trafego` é `const` de topo, e
       apagar `globalThis.Trafego` dentro do arreio não apaga a ligação
       léxica que os chamadores enxergam — o guarda continuaria passando.
       Então a prova é na fonte, que é onde a promessa está escrita.

       Vale para `mesa.js` e `ponte.js`, que são o jogo. `mesa-acoes.js`
       e `docaDebug` ficam de fora de propósito: a aba de Debug é feita
       do registro, e sem ele não há aba nenhuma para desenhar. */
    const semComentario = (fonte) => fonte
      .replace(/\/\*[\s\S]*?\*\//g, (b) => b.replace(/[^\n]/g, ' '))
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

    /* A guarda tem de estar na MESMA função do uso — uma guarda vinte
       linhas acima, noutra função, não protege coisa nenhuma. Daí o
       recorte por cabeçalho de função, e não por número de linhas. */
    /* `if (`, `try {` e `catch (e) {` também casam com "nome seguido
       de parêntese e chave"; sem tirá-los, o recorte começa no `if` de
       dentro da função e a guarda de cima fica de fora. */
    const CONTROLE = /^\s*(if|for|while|switch|catch|try|else|do|return)\b/;
    const ehCabecalho = (l) => !CONTROLE.test(l)
                               && /^(\s{0,4})(async\s+)?(function\s+\w+|\w+\s*\()/.test(l)
                               && l.trim().endsWith('{');

    const desprotegidos = [];
    for (const arquivo of ['mesa', 'ponte']) {
      const linhas = semComentario(fonteFront(arquivo)).split('\n');
      let deOndeVale = 0;
      linhas.forEach((linha, i) => {
        if (ehCabecalho(linha)) deOndeVale = i;
        if (!/\bTrafego\./.test(linha)) return;
        const corpo = linhas.slice(deOndeVale, i + 1).join('\n');
        if (!/typeof Trafego\s*[!=]==?\s*'undefined'/.test(corpo))
          desprotegidos.push(`${arquivo}.js:${i + 1} — ${linha.trim()}`);
      });
    }
    assert.deepEqual(desprotegidos, [], 'uso do Trafego sem guarda: o jogo passa a depender do observador');
  });

  await t.test('e o envelope sabe distinguir o Narrador de rede do local', () => {
    const g = comMesa();
    executar(g, `Trafego.limpar();
      Trafego.envelopar({ nome: 'Local', responder: async () => ({}) }, null).responder({});
      Trafego.envelopar({ nome: 'Rede', temIA: true, responder: async () => ({}) }, null).responder({});`);
    assert.equal(executar(g, 'Trafego.linhas.filter(l => l.assunto.includes("Local"))[0].via'), 'local');
    assert.equal(executar(g, 'Trafego.linhas.filter(l => l.assunto.includes("Rede"))[0].via'), 'http');
  });
});

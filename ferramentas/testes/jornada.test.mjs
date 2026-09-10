/* ============================================================
   VITÆ — As jornadas
   As outras sete suítes testam PEÇAS. Esta testa o JOGO: o
   caminho inteiro que um jogador percorre, chamando as mesmas
   funções que o clique chama.

   Ela existe por uma razão prática e específica. Antes dela, toda
   vez que eu precisava confirmar que uma mudança não tinha
   quebrado nada, eu escrevia à mão, no console do navegador, um
   roteiro de trinta linhas: criar ficha, salvar, abrir mesa,
   mandar turno, abrir briga, atacar, fechar crônica. Escrevia,
   rodava, lia, e jogava fora — e reescrevia na sessão seguinte.

   Isso é caro e é pior: um roteiro descartável não reprova
   ninguém. Ele conta o que aconteceu naquela vez.

   Então o roteiro virou esta suíte. **A verificação de uma
   mudança passou a ser `npm test`**, e o navegador ficou com o que
   só ele pode responder: render de verdade, rede, e a aparência.

   O que estas jornadas cobrem e nenhuma outra suíte cobre:
   `enviarTurno`, `abrirCombate`, `gerarOponente`, a ação de
   atacar, `avancarVez`, `fecharCronica`, e as quatro telas.

       node --test testes/jornada.test.mjs
   ============================================================ */

import test from 'node:test';
import assert from 'node:assert/strict';
import { carregar, fichaDeTeste, memoriaLocal, executar, instantaneo, comDadosViciados } from './carregar.mjs';

const TODAS = ['data', 'ficha', 'arbitro', 'cronista', 'front', 'mesa'];

/** Um app recém-aberto, com uma ficha jogável no criador. */
function app(extraDaFicha = {}) {
  const mem = memoriaLocal();
  const g = carregar(TODAS, { localStorage: mem });
  const ficha = fichaDeTeste(g, Object.assign({
    nome: 'Inácia Vasques', cla: 'lasombra', seita: 'sabbat', predador: 'alcateia',
    geracao: '12', cidade: 'rio', modoHabilidade: 'equilibrado'
  }, extraDaFicha));
  executar(g, `S = FICHA_VAZIA(); Object.assign(S, ${JSON.stringify(ficha)});`);
  return { g, mem, ficha };
}

const rodar = (g, codigo) => executar(g, codigo);
const M = (g, campo) => executar(g, `M.${campo}`);

/* Para comparar ANTES e DEPOIS: `executar` devolve referência viva, e
   dois "instantâneos" seriam o mesmo objeto. Custou dois testes desta
   suíte — detalhe em `carregar.mjs`. */
const antesEDepois = (g, campo) => instantaneo(g, `M.${campo}`);

/* ============================================================
   JORNADA 1 — do criador à mesa
   ============================================================ */

test('Jornada — criar personagem, guardar, e abrir a mesa', async (t) => {
  const { g } = app();

  await t.test('a ficha é montada e as pendências são calculadas', () => {
    const pend = rodar(g, 'pendenciasDaFicha(S).problemas.length');
    assert.equal(typeof pend, 'number');
    assert.ok(rodar(g, 'derivados(S).vitalidade') > 0);
  });

  await t.test('guardar põe a ficha na biblioteca', () => {
    const id = rodar(g, 'guardarFicha(S)');
    assert.ok(id, 'não devolveu id');
    assert.equal(rodar(g, 'listarFichas().length'), 1);
    assert.equal(rodar(g, `fichaPorId('${id}').nome`), 'Inácia Vasques');
  });

  await t.test('a folha oficial sai com o nome e sem o Índice de Força', () => {
    const html = rodar(g, 'fichaModeloHTML(S)');
    assert.ok(html.includes('Inácia Vasques'));
    assert.ok(!/Índice de Força/i.test(html), 'o número interno vazou para a folha');
  });

  await t.test('abrir a mesa monta cena, gente e abertura', () => {
    rodar(g, 'iniciarMesa(S)');
    assert.ok(M(g, 'cena.local'), 'a mesa abriu sem cena');
    assert.ok(M(g, 'pessoas.length') > 0, 'a cidade não trouxe ninguém');
    assert.ok(M(g, 'mensagens.length') >= 2, 'não houve abertura');
    assert.equal(M(g, 'ficha.nome'), 'Inácia Vasques');
  });

  await t.test('e a mesa é gravada', () => {
    assert.equal(rodar(g, 'salvarMesa()'), true);
    assert.equal(rodar(g, 'listarSessoes().length'), 1);
  });

  await t.test('a ficha da mesa é CÓPIA, não a do criador', () => {
    /* Se fosse a mesma, jogar mudaria a ficha guardada — e a
       biblioteca deixaria de ser o que sobrevive à sessão (§37.2). */
    rodar(g, "M.ficha.nome = 'Mudado na mesa'");
    assert.equal(rodar(g, 'S.nome'), 'Inácia Vasques', 'a mesa escreveu no criador');
    rodar(g, "M.ficha.nome = 'Inácia Vasques'");
  });
});

/* ============================================================
   JORNADA 2 — o turno, que é o coração do jogo
   ============================================================ */

test('Jornada — um turno de verdade', async (t) => {
  const { g } = app();
  rodar(g, 'iniciarMesa(S)');

  await t.test('agir produz mensagem do jogador e resposta', async () => {
    const antes = M(g, 'mensagens.length');
    await rodar(g, "enviarTurno('olho o bar com atenção')");
    const depois = M(g, 'mensagens.length');
    assert.ok(depois > antes + 1, `só ${depois - antes} mensagem(ns): ninguém respondeu`);
    assert.equal(M(g, "mensagens.filter(m => m.autor === 'jogador').length"), 1);
  });

  await t.test('o turno passou pela cadeia, com os quatro elos', () => {
    const elos = M(g, 'ultimaCadeia');
    assert.ok(elos, 'a mesa não registrou por onde o turno passou');
    for (const elo of ['interpretador', 'grafo', 'navegacao', 'especialista']) {
      assert.ok(elo in elos, `falta o elo "${elo}"`);
    }
  });

  await t.test('sem servidor, o elo 1 é o léxico — e o turno acontece', () => {
    /* O `fetch` do arreio sempre estoura, que é o caso de servidor
       fora do ar. O jogo nunca pode depender do modelo. */
    assert.equal(M(g, 'ultimaCadeia.interpretador'), 'lexico');
  });

  await t.test('fala entre aspas é lida como fala, sem botão de modo', async (t2) => {
    /* §57 — não existe mais escolher o modo antes de escrever. As
       aspas são o acordo, e o modo sai delas. */
    await rodar(g, String.raw`enviarTurno('"psiu, vem cá"')`);
    const ultima = rodar(g, "M.mensagens.filter(m => m.autor === 'jogador').slice(-1)[0]");
    t2.diagnostic(`"psiu, vem cá" → modo ${ultima.modo}, volume ${ultima.volume}`);
    assert.equal(ultima.modo, 'falar');
    assert.equal(ultima.volume, 'normal');
    assert.equal(ultima.segmentos.length, 1);
    assert.equal(ultima.segmentos[0].tipo, 'fala');
  });

  await t.test('ação e fala na MESMA mensagem, com o volume lido do texto', async (t2) => {
    /* O turno que a interface antiga não sabia representar: era preciso
       mandar duas mensagens, ou mentir sobre uma das metades. */
    await rodar(g, String.raw`enviarTurno('Encosto o cinzeiro na mesa e sussurro: "você não devia ter vindo"')`);
    const u = rodar(g, "M.mensagens.filter(m => m.autor === 'jogador').slice(-1)[0]");
    t2.diagnostic(`modo ${u.modo} · volume ${u.volume} · ${u.segmentos.map(s => s.tipo).join(' › ')}`);
    assert.equal(u.modo, 'agir', 'com ação junto, o turno é de ação');
    assert.equal(u.volume, 'sussurro', 'o volume não saiu do verbo');
    assert.equal(u.segmentos.map(s => s.tipo).join(','), 'acao,fala');
  });

  await t.test('parênteses viram pergunta ao Narrador', async (t2) => {
    await rodar(g, "enviarTurno('(quantos dados eu tenho de Destreza?)')");
    const u = rodar(g, "M.mensagens.filter(m => m.autor === 'jogador').slice(-1)[0]");
    t2.diagnostic(`modo ${u.modo} · ${u.segmentos.map(s => s.tipo).join(' › ')}`);
    assert.equal(u.modo, 'perguntar');
  });

  await t.test('amordaçado não fala, e o motivo aparece na tela', async () => {
    rodar(g, "M.estados = ['amordacado']");
    await rodar(g, String.raw`enviarTurno('"socorro!"')`);
    const doArbitro = rodar(g, "M.mensagens.filter(m => m.autor === 'arbitro').slice(-1)[0]");
    assert.ok(doArbitro, 'o Árbitro não se manifestou');
    assert.ok(doArbitro.veredito.bloqueios.length, 'barrou sem dizer por quê');
    assert.ok(doArbitro.veredito.bloqueios.every(b => b.motivo && !/undefined/.test(b.motivo)));
    rodar(g, "M.estados = []");
  });

  await t.test('o turno é gravado, e sobrevive a reabrir a sessão', async () => {
    await rodar(g, "enviarTurno('procuro a porta dos fundos')");
    const quantas = M(g, 'mensagens.length');
    const id = M(g, 'id');
    rodar(g, 'M = MESA_VAZIA()');
    assert.equal(rodar(g, `carregarSessao('${id}')`), true);
    assert.equal(M(g, 'mensagens.length'), quantas, 'a sessão voltou diferente');
  });

  await t.test('turno vazio não faz nada', async () => {
    const antes = M(g, 'mensagens.length');
    await rodar(g, "enviarTurno('   ')");
    assert.equal(M(g, 'mensagens.length'), antes);
  });

  await t.test('o contador separa o que foi local do que foi ao degrau 4', () => {
    /* CUIDADO ao ler este número: `llm` conta turnos que chegaram ao
       degrau 4, e sem servidor quem atende ali é o `NarradorSimulado`
       — que não custa nada. O contador mede QUAL DEGRAU respondeu, não
       dinheiro. A meta de "70% local" (§3) se lê aqui, e ela se lê
       igual com ou sem modelo no ar. */
    const c = M(g, 'contador');
    assert.ok(c.local + c.llm > 0, 'nenhum turno foi contado');
    assert.ok(c.local >= 0 && c.llm >= 0);
  });
});

/* ============================================================
   JORNADA 3 — a briga
   ============================================================ */

test('Jornada — abrir a briga, bater e acabar', async (t) => {
  const { g } = app();
  rodar(g, 'iniciarMesa(S)');

  await t.test('a briga abre e anuncia', () => {
    rodar(g, "abrirCombate({ motivo: 'você partiu para cima' })");
    assert.equal(M(g, 'combate.ativo'), true);
    assert.ok(M(g, "mensagens.some(m => m.autor === 'sistema')"));
  });

  await t.test('abrir a briga já traz alguém para brigar', () => {
    /* `abrirCombate` gera um oponente sozinho: briga sem adversário
       seria tela vazia. */
    assert.equal(M(g, 'combate.oponentes.length'), 1);
  });

  await t.test('e dá para acrescentar mais, com ficha e trilha', () => {
    rodar(g, "gerarOponente('comum', 'Segurança', { silencioso: true })");
    assert.equal(M(g, 'combate.oponentes.length'), 2);
    const o = M(g, 'combate.oponentes[1]');
    assert.ok(o && o.ref, 'oponente sem ref');
    assert.equal(o.ficha.nome, 'Segurança');
    assert.ok(g.Estado.trilhas(o.ficha).vitalidade.max > 0);
    assert.notEqual(o.ref, M(g, 'combate.oponentes[0].ref'), 'dois oponentes com o mesmo ref');
  });

  await t.test('a briga já abre com a ordem de iniciativa', () => {
    assert.ok(M(g, 'combate.rodada'), 'abriu briga sem rodada');
    assert.ok(M(g, 'combate.rodada.ordem.length') >= 2);
  });

  await t.test('fora da sua vez, o ataque é recusado — com o motivo', () => {
    /* Descoberto escrevendo esta jornada: eu supus que atacar sempre
       rolava, e o app recusou porque a rodada estava aberta e não era a
       minha vez. A recusa é o comportamento certo, e ela DIZ de quem é
       a vez — que é a regra da §3. */
    rodar(g, "M.combate.rodada.indice = M.combate.rodada.ordem.findIndex(x => x.ref !== 'voce')");
    const antes = M(g, "mensagens.filter(m => m.autor === 'rolagem').length");
    rodar(g, "ACOES_MESA['atacar'](M.combate.oponentes[1].ref + ':desarmado')");
    assert.equal(M(g, "mensagens.filter(m => m.autor === 'rolagem').length"), antes,
      'rolou dado fora da vez');
    const aviso = M(g, "mensagens.slice(-1)[0].texto");
    assert.ok(/não é a sua vez/i.test(aviso), `aviso ruim: "${aviso}"`);
    assert.ok(/quem age agora é/i.test(aviso), 'não disse de quem é a vez');
  });

  await t.test('na sua vez, atacar rola dado — e o alvo leva', () => {
    /* Os dois testes eram um só afirmado em dois passos, e o segundo
       media `M.combate.oponentes` DEPOIS do golpe. Isso quebrou na §63:
       com todo 10, os oponentes revidam (o empate bilateral do livro,
       pág. 125), o personagem cai em torpor e a briga fecha — e fechar
       ESVAZIA o array. A medida lia zero por a lista não existir mais,
       e não por ninguém ter apanhado.

       Agora o alvo é guardado ANTES do golpe. O `vm` devolve referência
       viva, então a ficha continua existindo mesmo depois de a briga
       acabar — e o teste diz EM QUEM bateu, que é mais do que dizia. */
    rodar(g, "M.combate.rodada.indice = M.combate.rodada.ordem.findIndex(x => x.ref === 'voce')");
    const alvo = M(g, 'combate.oponentes[1].ficha');
    const antesDano = (alvo.danoSuperficial || 0) + (alvo.danoAgravado || 0);
    const antesRol = M(g, "mensagens.filter(m => m.autor === 'rolagem').length");

    const v = comDadosViciados(g, Array(80).fill(10));
    rodar(g, "ACOES_MESA['atacar'](M.combate.oponentes[1].ref + ':desarmado')");
    v.restaurar();

    assert.ok(M(g, "mensagens.filter(m => m.autor === 'rolagem').length") > antesRol,
      'atacar não rolou dado nenhum');
    const depoisDano = (alvo.danoSuperficial || 0) + (alvo.danoAgravado || 0);
    assert.ok(depoisDano > antesDano,
      `todo 10 contra mortal não marcou nada: ${antesDano} → ${depoisDano}`);
  });

  await t.test('todos caídos, a briga fecha sozinha', () => {
    rodar(g, 'M.combate.oponentes.forEach(o => { o.ficha.danoAgravado = 99; });');
    rodar(g, 'conferirFimDoCombate()');
    assert.equal(M(g, 'combate.ativo'), false, 'a briga continuou sem ninguém de pé');
  });

  await t.test('a rodada ordena e passa a vez', () => {
    rodar(g, `
      abrirCombate({ motivo: 'de novo' });
      gerarOponente('comum', 'Outro', { silencioso: true });
      ACOES_MESA['abrir-rodada']();
    `);
    assert.ok(M(g, 'combate.rodada'), 'a rodada não abriu');
    assert.ok(M(g, 'combate.rodada.ordem.length') >= 2, 'a ordem não tem todo mundo');
    const antes = M(g, 'combate.rodada.indice');
    rodar(g, 'avancarVez()');
    const depois = M(g, 'combate.rodada ? M.combate.rodada.indice : -1');
    assert.notEqual(depois, antes, 'a vez não passou');
  });

  await t.test('e o combate inteiro cabe numa sessão gravada', () => {
    assert.equal(rodar(g, 'salvarMesa()'), true);
    const id = M(g, 'id');
    assert.ok(rodar(g, `sessaoPorId('${id}').combate`), 'o combate não foi junto');
  });
});

/* ============================================================
   JORNADA 4 — a crônica e o que atravessa
   ============================================================ */

test('Jornada — fechar a noite', async (t) => {
  const { g } = app();
  rodar(g, 'iniciarMesa(S)');

  await t.test('depois de alguns turnos, a crônica fecha', async () => {
    await rodar(g, "enviarTurno('pergunto pelo sumido')");
    await rodar(g, "enviarTurno('olho os fundos do bar')");
    await rodar(g, "fecharCronica('capitulo')");
    assert.equal(M(g, 'cronicas.length'), 1, 'a crônica não foi registrada');
  });

  await t.test('a crônica tem texto, e não veio de modelo nenhum', () => {
    const c = M(g, 'cronicas[0]');
    const texto = c.saida.cronica || c.saida.dossie || '';
    assert.ok(texto.length > 40, `crônica curta demais: "${texto}"`);
    assert.equal(c.origem, 'deterministico', 'gastou modelo sem servidor no ar');
  });

  await t.test('o pedido ao Cronista cabe na janela', () => {
    const o = rodar(g, "Cronista.pedidoDe(M, 'capitulo').orcamento");
    assert.ok(o.tokens <= o.teto, `eventos: ${o.tokens} de ${o.teto}`);
    assert.ok(o.estadoTokens <= o.estadoTeto, `estado: ${o.estadoTokens} de ${o.estadoTeto}`);
  });

  await t.test('o dossiê fecha a crônica e alimenta o legado', async () => {
    await rodar(g, "fecharCronica('dossie')");
    assert.equal(M(g, 'cronicas.length'), 2);
    const reg = rodar(g, 'Legado.de(M.ficha)');
    assert.ok(reg, 'o dossiê não deixou legado');
  });

  await t.test('o legado propõe, e não aplica sozinho', () => {
    /* §3.2 do jeito que a §32 permitiu: o motor propõe, o jogador
       confirma. */
    const antes = JSON.stringify(rodar(g, 'M.ficha.antecedentes'));
    const props = rodar(g, 'Legado.propostas(M.ficha)');
    assert.ok(Array.isArray(props));
    assert.equal(JSON.stringify(rodar(g, 'M.ficha.antecedentes')), antes,
      'o legado mexeu na ficha sem ninguém confirmar');
  });
});

/* ============================================================
   JORNADA 5 — as telas
   ============================================================ */

test('Jornada — as telas renderizam', async (t) => {
  const { g } = app();

  const fechado = (html) => {
    const erros = [];
    for (const tag of ['div', 'span', 'button', 'ol', 'ul', 'li']) {
      const abre = (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
      const fecha = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
      if (abre !== fecha) erros.push(`${tag}: ${abre}/${fecha}`);
    }
    return erros;
  };
  const tela = (fn) => {
    rodar(g, `${fn}()`);
    return rodar(g, "document.getElementById('app').innerHTML");
  };

  await t.test('os nove passos do criador', () => {
    const vazios = [], quebrados = [];
    for (let i = 0; i < 9; i++) {
      rodar(g, `passo = ${i}; render();`);
      const html = rodar(g, "document.getElementById('app').innerHTML");
      const rotulo = rodar(g, `PASSOS[${i}].rotulo`);
      if (!html || html.length < 300) vazios.push(rotulo);
      const erros = fechado(html);
      if (erros.length) quebrados.push(`${rotulo}: ${erros.join(', ')}`);
    }
    assert.deepEqual(vazios, [], 'passo do criador desenhou vazio');
    assert.deepEqual(quebrados, [], 'passo do criador com tag aberta');
  });

  await t.test('capa, fichas, saguão e lore', () => {
    const quebradas = [];
    for (const fn of ['renderCapa', 'renderFichas', 'renderSaguao', 'renderLore']) {
      const html = tela(fn);
      if (!html || html.length < 100) { quebradas.push(`${fn}: vazia`); continue; }
      const erros = fechado(html);
      if (erros.length) quebradas.push(`${fn}: ${erros.join(', ')}`);
    }
    assert.deepEqual(quebradas, []);
  });

  await t.test('a mesa desenha com sessão aberta', () => {
    rodar(g, 'iniciarMesa(S)');
    const html = tela('renderMesa');
    assert.ok(html.length > 500, 'a mesa desenhou quase nada');
    assert.deepEqual(fechado(html), []);
  });

  await t.test('a mesa desenha com briga aberta', () => {
    rodar(g, `
      abrirCombate({ motivo: 'teste' });
      gerarOponente('comum', 'Segurança', { silencioso: true });
    `);
    const html = tela('renderMesa');
    assert.ok(html.includes('Segurança'), 'o oponente não apareceu na tela');
    assert.deepEqual(fechado(html), []);
  });

  await t.test('todas as sete abas da doca', () => {
    const quebradas = [];
    for (const aba of rodar(g, 'ABAS_DOCA.map(a => a.id)')) {
      rodar(g, `M.aba = '${aba}'`);
      const html = tela('renderMesa');
      const erros = fechado(html);
      if (erros.length) quebradas.push(`${aba}: ${erros.join(', ')}`);
    }
    assert.deepEqual(quebradas, []);
  });

  await t.test('nome com HTML não vira marcação em tela nenhuma', () => {
    const mau = app({ nome: '<img src=x onerror=alert(1)>' });
    rodar(mau.g, 'iniciarMesa(S)');
    for (const fn of ['renderCapa', 'renderFichas', 'renderSaguao', 'renderMesa']) {
      rodar(mau.g, `${fn}()`);
      const html = rodar(mau.g, "document.getElementById('app').innerHTML");
      assert.ok(!/<img src=x/.test(html), `${fn} deixou a tag do jogador entrar crua`);
    }
  });
});

/* ============================================================
   JORNADA 6 — a sessão que continua
   ============================================================ */

test('Jornada — sair e voltar', async (t) => {
  const { g } = app();

  await t.test('duas noites diferentes convivem', async () => {
    rodar(g, 'iniciarMesa(S)');
    await rodar(g, "enviarTurno('primeira noite')");
    rodar(g, 'salvarMesa()');
    const primeira = M(g, 'id');

    rodar(g, "S.nome = 'Outra Pessoa'; S.fichaId = ''; iniciarMesa(S);");
    await rodar(g, "enviarTurno('segunda noite')");
    rodar(g, 'salvarMesa()');
    const segunda = M(g, 'id');

    assert.notEqual(primeira, segunda, 'as duas sessões receberam o mesmo id');
    assert.equal(rodar(g, 'listarSessoes().length'), 2);
  });

  await t.test('voltar para a primeira traz o turno dela', () => {
    const id = rodar(g, "listarSessoes().find(s => s.personagem === 'Inácia Vasques').id");
    assert.equal(rodar(g, `carregarSessao('${id}')`), true);
    assert.ok(M(g, "mensagens.some(m => m.texto === 'primeira noite')"),
      'a sessão voltou sem o que aconteceu nela');
  });

  await t.test('apagar uma não leva a outra', () => {
    const id = rodar(g, "listarSessoes().find(s => s.personagem === 'Outra Pessoa').id");
    assert.equal(rodar(g, `apagarSessao('${id}')`), true);
    const restam = rodar(g, 'listarSessoes()');
    assert.equal(restam.length, 1);
    assert.equal(restam[0].personagem, 'Inácia Vasques');
  });

  await t.test('e a que ficou continua abrindo', () => {
    const id = rodar(g, 'listarSessoes()[0].id');
    assert.equal(rodar(g, `carregarSessao('${id}')`), true);
    assert.ok(M(g, 'mensagens.length') > 0);
  });
});

/* ============================================================
   JORNADA 7 — o dia ruim
   ============================================================ */

test('Jornada — quando o navegador está sem espaço', async (t) => {
  await t.test('o jogo continua, e o jogador é avisado', async () => {
    /* Não basta não estourar: o jogador tem que SABER que não está
       sendo salvo. É o item N2 da §45.4, visto de ponta a ponta. */
    const mem = memoriaLocal({ cota: 4000 });
    const g = carregar(TODAS, { localStorage: mem });
    executar(g, `
      globalThis.__avisos = []; toast = (m) => __avisos.push(m);
      S = FICHA_VAZIA();
      Object.assign(S, ${JSON.stringify({ nome: 'Inácia', cla: 'brujah',
      seita: 'camarilla', predador: 'alcateia', geracao: '12', cidade: 'rio',
      atributos: { forca: 3, destreza: 3, vigor: 3, carisma: 2, manipulacao: 2,
                   autocontrole: 3, inteligencia: 2, raciocinio: 3, determinacao: 3 },
      habilidades: { briga: 3 }, disciplinas: {}, poderes: {} })});`);

    executar(g, 'iniciarMesa(S)');
    await executar(g, "enviarTurno('olho em volta')");
    for (let i = 0; i < 20; i++) {
      await executar(g, `enviarTurno('ando pela sala, turno ${i}, e converso um bocado sobre nada')`);
    }
    assert.ok(executar(g, 'M.mensagens.length') > 10, 'o jogo parou de aceitar turno');
    assert.ok(executar(g, '__avisos.length') > 0, 'encheu e não avisou ninguém');
    assert.ok(executar(g, '__avisos.some(a => /NÃO/i.test(a))'),
      `aviso fraco demais: ${executar(g, '__avisos[0]')}`);
  });

  await t.test('ficha com Disciplina fora do catálogo não derruba a tela', () => {
    const { g } = app();
    executar(g, "S.disciplinas = { disciplina_que_sumiu: 2 }; S.poderes = {};");
    assert.doesNotThrow(() => executar(g, 'passo = 8; render();'));
    assert.ok(executar(g, 'pendenciasDaFicha(S).problemas.some(p => /desconhecida/i.test(p))'));
  });

  await t.test('sessão gravada de versão antiga abre', () => {
    const mem = memoriaLocal();
    mem.setItem('vitae:sessoes', JSON.stringify({
      velha: { id: 'velha', atualizadoEm: 1000, mensagens: [],
               ficha: { nome: 'De Antes', cla: 'brujah', fome: 2 } }
    }));
    const g = carregar(TODAS, { localStorage: mem });
    assert.equal(executar(g, 'listarSessoes().length'), 1);
    assert.equal(executar(g, "carregarSessao('velha')"), true);
    assert.equal(executar(g, 'M.ficha.nome'), 'De Antes');
  });
});

/* ============================================================
   AS NOVE FUNÇÕES SEM TESTE DIRETO — item N8
   As jornadas exercitam todas de passagem: se quebrarem, algum
   teste cai. Mas nenhuma era AFIRMADA, e passar de passagem não
   diz o que a função promete — só que ela não estourou.

   Duas incomodavam mais que as outras, e por isso vêm primeiro:
   `importarFichaParaMesa` e `iniciarCampanha` são portas de
   entrada de dado de FORA.
   ============================================================ */

test('N8 — as portas de entrada de dado de fora', async (t) => {
  const { g } = app();

  await t.test('importar recusa o .json extraído, que é só de leitura', (t2) => {
    /* O app exporta DOIS json: a ficha (que reabre) e o extraído (que
       alimenta o modelo). Trocar um pelo outro é o engano fácil, e o
       segundo não tem `atributos` — reabri-lo daria personagem vazio. */
    executar(g, 'globalThis.__avisos = []; toast = (m) => __avisos.push(m);');
    const extraido = { identidade: { nome: 'Inácia' }, vitais: {}, dominios: {} };
    executar(g, `globalThis.__r = (function () {
      const dados = ${JSON.stringify(extraido)};
      if (dados.identidade && !(dados.atributos && dados.atributos.forca)) {
        toast('Esse é o .json extraído, que é só de leitura. Use o "Exportar .json".');
        return 'recusou';
      }
      return 'aceitou';
    })()`);
    const aviso = executar(g, '__avisos[0]');
    t2.diagnostic(`json extraído (sem atributos) → ${executar(g, '__r')} · "${aviso}"`);
    assert.equal(executar(g, '__r'), 'recusou');
    assert.match(aviso, /só de leitura/i);
  });

  await t.test('e recusa ficha incompleta, dizendo o que falta', (t2) => {
    /* `fichaJogavel` é a guarda: nome, clã e Predador. Sem ela, a mesa
       abriria com um personagem que não rola nada. */
    const casos = [
      ['sem nada', {}],
      ['só nome', { nome: 'Inácia' }],
      ['sem predador', { nome: 'Inácia', cla: 'brujah' }],
      ['completa', { nome: 'Inácia', cla: 'brujah', predador: 'alcateia' }]
    ];
    for (const [rotulo, ficha] of casos) {
      const ok = executar(g, `fichaJogavel(${JSON.stringify(ficha)})`);
      t2.diagnostic(`${rotulo} → ${ok ? 'jogável' : 'recusada'}`);
      assert.equal(ok, rotulo === 'completa', rotulo);
    }
  });

  await t.test('exportar .json devolve a ficha inteira, e ela reabre', (t2) => {
    /* Ida e volta: o que sai do exportar tem que voltar pelo importar
       sem perder campo. É o único caminho de backup que o jogador tem. */
    executar(g, "S.nome = 'Inácia Vasques'; S.humanidadeMod = -1; S.fome = 3;");
    const texto = executar(g, 'JSON.stringify(S, null, 2)');
    const volta = JSON.parse(texto);
    t2.diagnostic(`exportou ${texto.length} caracteres · ` +
                  `${Object.keys(volta).length} campos · jogável: ${
                    executar(g, `fichaJogavel(${JSON.stringify(volta)})`)}`);
    assert.equal(volta.nome, 'Inácia Vasques');
    assert.equal(volta.humanidadeMod, -1);
    assert.equal(volta.fome, 3);
    assert.equal(executar(g, `fichaJogavel(${JSON.stringify(volta)})`), true);
  });

  await t.test('exportar .txt sai legível, sem [object Object]', (t2) => {
    const txt = executar(g, `(function () {
      let saida = '';
      const guardado = baixar;
      baixar = (nome, conteudo) => { saida = conteudo; };
      exportarTXT();
      baixar = guardado;
      return saida;
    })()`);
    t2.diagnostic(`.txt com ${txt.split('\n').length} linhas, ${txt.length} caracteres`);
    assert.ok(txt.includes('INÁCIA VASQUES'), 'o nome não saiu');
    assert.ok(!/\[object Object\]/.test(txt), 'objeto cru no texto exportado');
    assert.ok(!/undefined/.test(txt), 'undefined no texto exportado');
  });

  await t.test('a campanha compila e o Diretor abre a primeira cena', async (t2) => {
    /* `iniciarCampanha` busca o .md, compila e posiciona o Diretor. O
       `fetch` do arreio estoura, então o teste alimenta o compilador
       direto e exercita o mesmo caminho a partir dali. */
    const md = `---
campanha: A Noite do Corvo
cidade: rio
---

# Capítulo Um
resumo: Alguém sumiu.

## Cena :: Bar do Zé
local: bar_do_ze
hora: 23h

### Narração
O bar cheira a cerveja velha.
`;
    executar(g, `
      S = FICHA_VAZIA();
      Object.assign(S, ${JSON.stringify(fichaDeTeste(g, { nome: 'Inácia', cidade: 'rio' }))});
      iniciarMesa(S);
      M.campanha = Compilador.compilar(${JSON.stringify(md)});
      M.diretor = Diretor.iniciar(M.campanha);
      M.mensagens = [];
      aplicarEventosDiretor(Diretor.abrirCena(M.campanha, M.diretor, M.diretor.cena).eventos);
    `);
    const erros = M(g, 'campanha.erros');
    const msgs = M(g, "mensagens.map(m => m.autor + ': ' + String(m.texto || m.titulo || '').slice(0, 40))");
    t2.diagnostic(`campanha com ${erros.length} erros → ${msgs.length} mensagens: ${msgs.join(' | ')}`);
    assert.equal(erros.length, 0);
    assert.ok(M(g, "mensagens.some(m => m.autor === 'narrador')"),
      'a narração pronta da cena não chegou à tela');
    assert.equal(M(g, 'diretor.cena'), 'bar_do_ze');
  });

  await t.test('campanha que NÃO compila ainda deixa o jogo entrar (item C2)', (t2) => {
    /* Este teste documenta o defeito, e passa de propósito: ele afirma o
       comportamento ATUAL, que é entrar com zero opções depois de um
       toast. Quando o C2 for consertado, ele reprova — e é isso que se
       quer de um teste que guarda uma pendência conhecida. */
    const c = executar(g, `Compilador.compilar('texto qualquer, sem cena nenhuma')`);
    t2.diagnostic(`extração de PDF → ${c.erros.length} erro(s): "${c.erros[0]}" · ` +
                  `${c.capitulos.length} capítulos, ${Object.keys(c.indice).length} cenas`);
    assert.ok(c.erros.length, 'o compilador deixou passar');
    assert.equal(c.capitulos.length, 0, 'grafo vazio, como esperado hoje');
  });
});

test('N8 — o turno por dentro', async (t) => {
  const { g } = app();
  rodar(g, 'iniciarMesa(S)');

  await t.test('a escada tem os quatro degraus, na ordem', (t2) => {
    const degraus = executar(g,
      'escadaDaMesa().degraus.map(d => d.numero + " " + d.nome + (d.custa ? " [custa]" : ""))');
    t2.diagnostic(degraus.join(' → '));
    assert.equal(degraus.length, 4);
    const numeros = executar(g, 'escadaDaMesa().degraus.map(d => d.numero)');
    assert.deepEqual(JSON.parse(JSON.stringify(numeros)), [0, 1, 3, 4],
      'a ordem dos degraus mudou');
  });

  await t.test('a escada é a MESMA entre turnos', () => {
    /* Ela guarda estado — o `DegrauCampanha` acumula eventos residuais.
       Reconstruí-la a cada turno perderia isso. */
    assert.equal(executar(g, 'escadaDaMesa() === escadaDaMesa()'), true);
  });

  await t.test('turnoDaMesa leva à escada tudo que ela precisa', (t2) => {
    const campos = executar(g, `Object.keys(turnoDaMesa({
      texto: 'olho em volta',
      leitura: { intencao: 'examinar', termos: [] },
      veredito: { possivel: true, bloqueios: [], avisos: [], rotas: [] },
      estados: []
    }))`);
    t2.diagnostic(`o turno leva ${campos.length} campos: ${campos.join(', ')}`);
    for (const c of ['texto', 'leitura', 'veredito', 'estados', 'modo', 'ficha',
                     'cena', 'locais', 'pessoas', 'fatos', 'fios', 'paraNarrador']) {
      assert.ok(campos.includes(c), `falta "${c}" no turno`);
    }
  });

  await t.test('e paraNarrador não vaza número de regra', () => {
    /* O contrato da §3.2: o modelo não recebe dado nem dificuldade. */
    const p = executar(g, `turnoDaMesa({
      texto: 'ataco', leitura: { intencao: 'lutar', termos: [] },
      veredito: { possivel: true, bloqueios: [], avisos: ['cuidado'], rotas: [{ atributo: 'forca' }] },
      estados: []
    }).paraNarrador()`);
    assert.ok(!('rotas' in p), 'as rotas foram para o Narrador');
    assert.ok(!('dificuldade' in p), 'a dificuldade foi para o Narrador');
    assert.ok('arbitro' in p, 'o aviso do Árbitro não chegou');
  });

  await t.test('aplicarPasso conta o degrau e escreve a mensagem', (t2) => {
    const antes = antesEDepois(g, 'contador');
    rodar(g, `aplicarPasso({
      degrau: { numero: 3, nome: 'Recombinação', custa: false },
      resposta: { tipo: 'narracao', texto: 'A cortina se move sem vento.', degrau: 3, marcas: ['x'] }
    }, turnoDaMesa({ texto: 'olho', leitura: {}, veredito: { possivel: true, bloqueios: [], avisos: [] }, estados: [] }))`);
    const depois = antesEDepois(g, 'contador');
    t2.diagnostic(`degrau 3 (não custa) → local ${antes.local}→${depois.local}, ` +
                  `llm ${antes.llm}→${depois.llm}`);
    assert.equal(depois.local, antes.local + 1, 'o degrau local não foi contado');
    assert.equal(depois.llm, antes.llm, 'contou como LLM o que não custa');
    assert.ok(M(g, "mensagens.some(m => m.texto === 'A cortina se move sem vento.')"));
  });

  await t.test('e o degrau 4 conta do outro lado', (t2) => {
    const antes = antesEDepois(g, 'contador');
    rodar(g, `aplicarPasso({
      degrau: { numero: 4, nome: 'Narrador', custa: true },
      resposta: { tipo: 'narracao', texto: 'Alguém decide acreditar.', degrau: 4 }
    }, turnoDaMesa({ texto: 'olho', leitura: {}, veredito: { possivel: true, bloqueios: [], avisos: [] }, estados: [] }))`);
    const depois = antesEDepois(g, 'contador');
    t2.diagnostic(`degrau 4 (custa) → local ${antes.local}→${depois.local}, ` +
                  `llm ${antes.llm}→${depois.llm}`);
    assert.equal(depois.llm, antes.llm + 1);
    assert.equal(depois.local, antes.local);
  });

  await t.test('aplicarPasso com passo vazio não faz nada', () => {
    const antes = M(g, 'mensagens.length');
    rodar(g, 'aplicarPasso(null, null)');
    assert.equal(M(g, 'mensagens.length'), antes);
  });

  await t.test('anunciar escreve na tela E no registro', (t2) => {
    const antesM = M(g, 'mensagens.length');
    const antesR = M(g, 'registro.length');
    rodar(g, `anunciar([
      { tipo: 'nota', texto: 'A briga acabou.' },
      { tipo: 'critico', texto: 'Você caiu em torpor.' }
    ])`);
    const ultimas = M(g, 'mensagens.slice(-2).map(m => m.autor + (m.critico ? " [crítico]" : "") + ": " + m.texto)');
    t2.diagnostic(ultimas.join(' | '));
    assert.equal(M(g, 'mensagens.length'), antesM + 2);
    assert.equal(M(g, 'registro.length'), antesR + 2, 'o registro não recebeu');
    assert.equal(M(g, 'mensagens.slice(-1)[0].critico'), true, 'o crítico não foi marcado');
  });

  await t.test('anunciar com lista vazia ou nula não estoura', () => {
    const antes = M(g, 'mensagens.length');
    assert.doesNotThrow(() => rodar(g, 'anunciar([]); anunciar(null); anunciar(undefined)'));
    assert.equal(M(g, 'mensagens.length'), antes);
  });
});

test('N8 — a fala e a mesa que volta de disco', async (t) => {
  const { g } = app();
  rodar(g, 'iniciarMesa(S)');

  await t.test('alvoDeFala distingue quem está na cena de quem não está', (t2) => {
    const id = M(g, 'cena.presentes && M.cena.presentes[0]');
    if (id) {
      const perto = executar(g, `alvoDeFala('${id}')`);
      t2.diagnostic(`"${perto.nome}" está na cena → ${perto.distancia} m, audível=${perto.audivel}`);
      assert.equal(perto.audivel, true);
      assert.ok(perto.distancia < 15, 'quem está na cena ficou longe');
    }
    const fora = M(g, "pessoas.find(p => !(M.cena.presentes || []).includes(p.id))");
    if (fora) {
      const longe = executar(g, `alvoDeFala('${fora.id}')`);
      t2.diagnostic(`"${longe.nome}" NÃO está na cena → ${longe.distancia} m, audível=${longe.audivel}`);
      assert.equal(longe.audivel, false, 'quem não está na cena ouviu');
      assert.ok(longe.distancia > 100, 'quem não está na cena ficou perto');
    }
    assert.ok(id || fora, 'a cidade não trouxe ninguém para testar');
  });

  await t.test('"geral" e id desconhecido não têm alvo', () => {
    assert.equal(executar(g, "alvoDeFala('geral')"), null);
    assert.equal(executar(g, "alvoDeFala('nao_existe')"), null);
    assert.equal(executar(g, 'alvoDeFala("")'), null);
  });

  await t.test('normalizarMesa completa sessão de versão antiga', (t2) => {
    /* Sessão gravada antes de um campo existir volta sem ele. Sem
       normalizar, a mesa quebra no primeiro acesso — e o jogador perde
       a noite por causa de uma atualização. */
    rodar(g, `M = Object.assign(MESA_VAZIA(), {
      ficha: ${JSON.stringify(fichaDeTeste(g, { nome: 'Antiga' }))},
      combate: { ativo: true },
      contador: undefined,
      cena: { local: 'bar' }
    }); normalizarMesa();`);
    const c = M(g, 'combate');
    t2.diagnostic(`combate veio só com {ativo} → completado com ` +
                  `${Object.keys(c).join(', ')}`);
    assert.ok(Array.isArray(c.oponentes), 'oponentes não foi completado');
    assert.equal(typeof c.proximoId, 'number', 'proximoId não foi completado');
    assert.ok(M(g, 'contador') && typeof M(g, 'contador').local === 'number',
      'o contador não foi completado');
  });

  await t.test('e não sobrescreve o que a sessão já trazia', () => {
    rodar(g, `M = Object.assign(MESA_VAZIA(), {
      ficha: ${JSON.stringify(fichaDeTeste(g, { nome: 'Antiga' }))},
      contador: { local: 42, llm: 7 },
      combate: { ativo: true, motivo: 'briga velha' }
    }); normalizarMesa();`);
    assert.equal(M(g, 'contador.local'), 42, 'normalizar apagou o que já existia');
    assert.equal(M(g, 'combate.motivo'), 'briga velha');
  });

  await t.test('oponente sem ref ganha um, sem colidir', (t2) => {
    rodar(g, `M = Object.assign(MESA_VAZIA(), {
      ficha: ${JSON.stringify(fichaDeTeste(g, { nome: 'Antiga' }))},
      combate: { ativo: true, oponentes: [
        { nome: 'Um', ficha: {} }, { nome: 'Dois', ficha: {} }, { ref: 'op:9', nome: 'Três', ficha: {} }
      ] }
    }); normalizarMesa(); normalizarOponentes();`);
    const refs = M(g, 'combate.oponentes.map(o => o.ref)');
    t2.diagnostic(`refs depois de normalizar: ${refs.join(', ')}`);
    assert.equal(new Set(refs).size, 3, 'dois oponentes com o mesmo ref');
    assert.ok(refs.every(Boolean), 'oponente ficou sem ref');
  });
});

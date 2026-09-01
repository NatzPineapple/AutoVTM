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
import { carregar, fichaDeTeste, memoriaLocal, executar, comDadosViciados } from './carregar.mjs';

const TODAS = ['data', 'ficha', 'arbitro', 'cronista', 'front'];

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
    const html = rodar(g, 'fichaOficialHTML(S)');
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

  await t.test('falar é julgado como fala, não como ação', async () => {
    rodar(g, "M.modo = 'falar'; M.volume = 'normal'");
    await rodar(g, "enviarTurno('psiu, vem cá')");
    const ultima = rodar(g, "M.mensagens.filter(m => m.autor === 'jogador').slice(-1)[0]");
    assert.equal(ultima.modo, 'falar');
    assert.equal(ultima.volume, 'normal');
  });

  await t.test('amordaçado não fala, e o motivo aparece na tela', async () => {
    rodar(g, "M.estados = ['amordacado']; M.modo = 'falar'");
    await rodar(g, "enviarTurno('grito por socorro')");
    const doArbitro = rodar(g, "M.mensagens.filter(m => m.autor === 'arbitro').slice(-1)[0]");
    assert.ok(doArbitro, 'o Árbitro não se manifestou');
    assert.ok(doArbitro.veredito.bloqueios.length, 'barrou sem dizer por quê');
    assert.ok(doArbitro.veredito.bloqueios.every(b => b.motivo && !/undefined/.test(b.motivo)));
    rodar(g, "M.estados = []; M.modo = 'agir'");
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

  await t.test('na sua vez, atacar rola dado', () => {
    rodar(g, "M.combate.rodada.indice = M.combate.rodada.ordem.findIndex(x => x.ref === 'voce')");
    const antes = M(g, "mensagens.filter(m => m.autor === 'rolagem').length");
    const v = comDadosViciados(g, Array(80).fill(10));
    rodar(g, "ACOES_MESA['atacar'](M.combate.oponentes[1].ref + ':desarmado')");
    v.restaurar();
    assert.ok(M(g, "mensagens.filter(m => m.autor === 'rolagem').length") > antes,
      'atacar não rolou dado nenhum');
  });

  await t.test('com todo 10, alguém do outro lado leva dano', () => {
    /* Depois do seu golpe a rodada avança e os oponentes agem, então o
       que se afirma é que a briga MACHUCOU alguém — não em quem. */
    const marcado = M(g, `combate.oponentes.reduce((a, o) =>
      a + (o.ficha.danoSuperficial || 0) + (o.ficha.danoAgravado || 0), 0)`);
    assert.ok(marcado > 0, 'todo 10 contra mortais não marcou nada');
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

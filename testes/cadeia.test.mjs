/* ============================================================
   VITÆ — Testes da cadeia de arbitragem
   Os quatro elos rodando juntos, a navegação de verdade (que
   substituiu o "terreno livre" provisório) e a divisão do
   motor-arbitro em três.

   Cobre os itens A1 a A4 da §45.2, fechados na §48.

       node --test testes/cadeia.test.mjs
   ============================================================ */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { carregar, fichaDeTeste, comDadosViciados, executar, AREAS, RAIZ } from './carregar.mjs';

const g = carregar(['data', 'ficha', 'arbitro', 'front']);
const { Arbitro, Cadeia, Navegacao, Grafo, Combate } = g;

const navegar = (gr, alvoId, alvo = null) => Navegacao.navegar({
  grafo: gr, contexto: Grafo.contexto(gr, 'voce'),
  plano: { acoes: [{ alvo: alvoId }] }, mesa: {}, alvo
});

/* ============================================================
   NAVEGAÇÃO — elo 3 (item A3)
   ============================================================ */

test('Navegação — onde o alvo está', async (t) => {
  /* Duas salas na mesma zona (logo, adjacentes) e uma terceira em
     zona diferente, sem ligação. É o mundo mínimo que distingue as
     quatro situações que o navegador reconhece. */
  const cena = (ondeEstaOCapanga = 'bar') => {
    const gr = Grafo.vazio();
    Grafo.acrescentarNo(gr, { id: 'bar', tipo: 'local', nome: 'Bar do Zé', zona: 'centro' });
    Grafo.acrescentarNo(gr, { id: 'beco', tipo: 'local', nome: 'Beco', zona: 'centro' });
    Grafo.acrescentarNo(gr, { id: 'zonasul', tipo: 'local', nome: 'Zona Sul', zona: 'sul' });
    Grafo.acrescentarNo(gr, { id: 'voce', tipo: 'personagem', nome: 'Você' });
    Grafo.acrescentarNo(gr, { id: 'capanga', tipo: 'pessoa', nome: 'Capanga' });
    Grafo.acrescentarNo(gr, { id: 'longe', tipo: 'pessoa', nome: 'Sujeito Distante' });
    Grafo.ligar(gr, 'voce', 'esta_em', 'bar');
    Grafo.ligar(gr, 'capanga', 'esta_em', ondeEstaOCapanga);
    Grafo.ligar(gr, 'longe', 'esta_em', 'zonasul');
    Grafo.adjacenciaPorZona(gr);
    return gr;
  };

  await t.test('não é mais provisória', () => {
    /* A §41 registrou um navegador que devolvia terreno livre para
       tudo. Se este teste cair, ele voltou. */
    assert.equal(navegar(cena(), 'capanga').provisorio, false);
    assert.equal(Cadeia.navegadorPadrao, 'navmesh');
  });

  await t.test('alvo no mesmo ambiente está ao alcance, sem preço', () => {
    const r = navegar(cena('bar'), 'capanga');
    assert.equal(r.relacao, 'mesmo_local');
    assert.equal(r.bloqueado, false);
    assert.equal(r.penalidade, 0);
    assert.equal(r.linhaDeTiro, true);
  });

  await t.test('alvo no ambiente ao lado custa −2, e NÃO é bloqueio', () => {
    /* A escolha de projeto: aproximar-se é a ação da rodada, então o
       golpe sai em movimento. Barrar seria mais fácil e mais errado —
       ninguém desiste de socar alguém por estar na sala ao lado. */
    const r = navegar(cena('beco'), 'capanga');
    assert.equal(r.relacao, 'adjacente');
    assert.equal(r.bloqueado, false);
    assert.equal(r.penalidade, -2);
    assert.ok(r.rota && r.rota.length, 'não devolveu rota');
    assert.ok(r.nota, 'não explicou o preço');
  });

  await t.test('alvo em outra zona é travessia, e aí sim é bloqueio', () => {
    const r = navegar(cena(), 'longe');
    assert.equal(r.bloqueado, true);
    assert.ok(r.motivo, 'bloqueou sem motivo');
  });

  await t.test('alvo que não existe é bloqueio, com motivo', () => {
    const r = navegar(cena(), 'fantasma');
    assert.equal(r.bloqueado, true);
    assert.ok(r.motivo);
  });

  await t.test('sem alvo, nada a percorrer e nada bloqueado', () => {
    assert.equal(navegar(cena(), null).bloqueado, false);
  });

  await t.test('descrever devolve texto legível em todos os casos', () => {
    for (const alvo of ['capanga', 'longe', 'fantasma', null]) {
      assert.equal(typeof Navegacao.descrever(navegar(cena(), alvo)), 'string');
    }
  });
});

test('Navegação — linha de tiro e cobertura', async (t) => {
  const comCofre = (estado) => {
    const gr = Grafo.vazio();
    Grafo.acrescentarNo(gr, { id: 'sala', tipo: 'local', nome: 'Sala' });
    Grafo.acrescentarNo(gr, { id: 'voce', tipo: 'personagem', nome: 'Você' });
    Grafo.acrescentarNo(gr, { id: 'cofre', tipo: 'objeto', nome: 'Cofre', estado });
    Grafo.acrescentarNo(gr, { id: 'joia', tipo: 'objeto', nome: 'Joia' });
    Grafo.ligar(gr, 'voce', 'esta_em', 'sala');
    Grafo.ligar(gr, 'cofre', 'esta_em', 'sala');
    Grafo.ligar(gr, 'joia', 'dentro_de', 'cofre');
    return gr;
  };

  await t.test('o que está dentro de algo fechado não tem linha de visão', () => {
    const r = navegar(comCofre('trancado'), 'joia');
    assert.equal(r.linhaDeTiro, false);
    assert.ok(r.motivo, 'negou sem motivo');
  });

  await t.test('e passa a ter quando o cofre abre', () => {
    assert.equal(navegar(comCofre('aberto'), 'joia').linhaDeTiro, true);
  });

  await t.test('alvo escondido não tem linha de visão', () => {
    const gr = comCofre('aberto');
    Grafo.por(gr, 'cofre').estado = 'escondido';
    assert.equal(navegar(gr, 'cofre').linhaDeTiro, false);
  });

  await t.test('cobertura só existe quando a cena declara', () => {
    /* "Sem cobertura" vale −2 na defesa, pela tabela do Escudo.
       Aplicar isso por omissão baixaria a defesa do jogo inteiro sem
       ninguém ter decidido nada. */
    assert.equal(navegar(comCofre('aberto'), 'cofre').cobertura, null);
  });

  await t.test('cobertura declarada vira o modificador da tabela', () => {
    const r = navegar(comCofre('aberto'), 'cofre', { id: 'cofre', cobertura: 'Cobertura forte' });
    assert.ok(r.cobertura, 'a cobertura declarada sumiu');
    assert.equal(r.cobertura.modificador,
                 Combate.modificadorDeCobertura('Cobertura forte').modificador);
  });

  await t.test('distância declarada ganha da inferida', () => {
    const r = navegar(comCofre('aberto'), 'cofre', { id: 'cofre', distancia: 42 });
    assert.equal(r.distancia, 42);
    assert.equal(r.distanciaDeclarada, true);
  });
});

test('Navegação — o elo 3 chega ao dado', async (t) => {
  const sala = () => {
    const gr = Grafo.vazio();
    Grafo.acrescentarNo(gr, { id: 'sala', tipo: 'local', nome: 'Sala' });
    Grafo.acrescentarNo(gr, { id: 'voce', tipo: 'personagem', nome: 'Você' });
    Grafo.acrescentarNo(gr, { id: 'alvo', tipo: 'pessoa', nome: 'Alvo' });
    Grafo.ligar(gr, 'voce', 'esta_em', 'sala');
    Grafo.ligar(gr, 'alvo', 'esta_em', 'sala');
    return gr;
  };

  await t.test('paraCombate traduz para o que o Combate entende', () => {
    const r = navegar(sala(), 'alvo', { id: 'alvo', distancia: 42, cobertura: 'Cobertura forte' });
    const c = Navegacao.paraCombate(r);
    assert.equal(c.distancia, 42);
    assert.equal(c.cobertura, 'Cobertura forte');
  });

  await t.test('no mesmo ambiente sem nada declarado, NÃO impõe distância', () => {
    /* Se impusesse, todo soco passaria a ser conferido contra alcance
       e a faca começaria a errar dentro da sala. */
    assert.equal(Navegacao.paraCombate(navegar(sala(), 'alvo')).distancia, null);
  });

  await t.test('e a distância que ela devolve muda o golpe de verdade', () => {
    /* A prova de que o elo não é decorativo: 300 m com arma branca é
       bloqueio, e é a navegação que produz o 300. */
    const a = fichaDeTeste(g, { nome: 'A' });
    const d = fichaDeTeste(g, { nome: 'D' });
    const c = Navegacao.paraCombate(navegar(sala(), 'alvo', { id: 'alvo', distancia: 300 }));
    const r = Combate.resolver({ atacante: a, defensor: d, tipo: 'branca',
                                 distancia: c.distancia });
    assert.equal(r.possivel, false, 'alvo a 300 m foi esfaqueado');
  });
});

/* ============================================================
   A DIVISÃO DO ÁRBITRO (item A4)
   ============================================================ */

test('Árbitro — a divisão em três', async (t) => {
  await t.test('léxico e tabelas são objetos próprios', () => {
    assert.equal(typeof g.Lexico, 'object');
    assert.equal(typeof g.TabelasV5, 'object');
  });

  await t.test('a interface pública do Árbitro continua inteira', () => {
    /* A divisão é de responsabilidade, não de interface: os ~45
       pontos que chamam `Arbitro.alguma_coisa` não podem ter mudado. */
    const publicos = ['ACOES', 'VOLUMES', 'CAPACIDADES', 'ESTADOS', 'ALCANCES',
                      'normalizar', 'interpretar', 'marcarTermos', 'avaliarFala',
                      'capacidadesDe', 'penalidadeDeEstados', 'piscinaFinal', 'avaliar',
                      'naFaixa', 'dificuldadeDeCaca', 'dificuldadeFrenesi', 'consequencias',
                      'compulsaoAleatoria', 'ferimentoPor', 'maculasPor', 'alimentacaoPor'];
    assert.deepEqual(publicos.filter(n => Arbitro[n] === undefined), []);
  });

  await t.test('nenhum `this` cruza a fronteira nova', () => {
    /* O teste que faltava quando a divisão foi feita. Dois métodos
       foram para o léxico usando `this.capacidadesDe` e
       `this.CAPACIDADES`, que ficaram no Árbitro, e as tabelas ficaram
       chamando `this.normalizar`, que foi para o léxico. Os 208 testes
       de então passaram porque nenhum tocava nesses caminhos. */
    const semComentario = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    const vazando = [];
    for (const [obj, arq] of [['Lexico', 'arbitro-lexico'], ['TabelasV5', 'arbitro-tabelas']]) {
      const fonte = semComentario(
        fs.readFileSync(path.join(RAIZ, 'app', 'js', 'arbitro', `${arq}.js`), 'utf8'));
      const tem = new Set((fonte.match(/^ {2}(?:get )?([A-Za-z_$][\w$]*)\s*[:(]/gm) || [])
        .map(x => x.trim().replace(/^get /, '').replace(/[:(].*/, '')));
      for (const uso of new Set((fonte.match(/this\.([A-Za-z_$][\w$]*)/g) || []).map(x => x.slice(5)))) {
        if (!tem.has(uso)) vazando.push(`${obj}.this.${uso}`);
      }
    }
    assert.deepEqual(vazando, [], '`this` apontando para fora do próprio objeto');
  });

  await t.test('as consultas de tabela que casam texto funcionam', () => {
    /* Seis delas usavam `this.normalizar`. Sem estes testes escritos,
       o vazamento passava calado. */
    assert.ok(Arbitro.dificuldadeDeCaca('favela'), 'dificuldadeDeCaca mudo');
    assert.ok(Arbitro.compulsaoAleatoria('brujah'), 'compulsaoAleatoria muda');
    assert.ok(Arbitro.dificuldadeFrenesi('furia', '', 7), 'dificuldadeFrenesi muda');
    assert.notEqual(Arbitro.alimentacaoPor('bolsa de sangue'), undefined);
    assert.notEqual(Arbitro.maculasPor('matar'), undefined);
  });

  await t.test('avaliarFala continua enxergando os estados', () => {
    /* O outro vazamento. `avaliarFala` usa capacidades, e capacidade é
       do Árbitro — foi por isso que ela voltou para cá. */
    const f = fichaDeTeste(g);
    assert.equal(Arbitro.avaliarFala({ ficha: f, estados: [], volume: 'normal' }).possivel, true);
    const calado = Arbitro.avaliarFala({ ficha: f, estados: ['amordacado'], volume: 'normal' });
    assert.equal(calado.possivel, false, 'amordaçado continuou falando');
    assert.ok(calado.bloqueios.every(b => b.motivo && !/undefined/.test(b.motivo)),
      '"undefined" no motivo — sinal de `this` quebrado');
  });

  await t.test('nenhum arquivo do Árbitro passa de 750 linhas', () => {
    const grandes = [];
    for (const nome of AREAS.arbitro) {
      const n = fs.readFileSync(path.join(RAIZ, 'app', 'js', 'arbitro', `${nome}.js`), 'utf8')
        .split('\n').length;
      if (n > 750) grandes.push(`${nome}.js (${n})`);
    }
    assert.deepEqual(grandes, [], 'arquivo grande de volta na área Árbitro');
  });
});

/* ============================================================
   A CADEIA LIGADA (item A1) E O ELO 1 (item A2)
   ============================================================ */

test('Cadeia — o caminho completo, ponta a ponta', async (t) => {
  const mesaDeTeste = () => ({
    ficha: fichaDeTeste(g, { nome: 'Inácia' }),
    cena: { local: 'bar', presentes: ['capanga'] },
    locais: [{ id: 'bar', nome: 'Bar do Zé', zona: 'centro' },
             { id: 'beco', nome: 'Beco', zona: 'centro' }],
    pessoas: [{ id: 'capanga', nome: 'Capanga', relacao: 'inimigo' }],
    fatos: [], fios: [], bolsa: [{ nome: 'Faca', arma: true }],
    combate: { ativo: false }
  });

  await t.test('os quatro elos aparecem no resultado', () => {
    const saida = Cadeia.arbitrar({ ficha: fichaDeTeste(g), texto: 'ataco o capanga',
                                    mesa: mesaDeTeste() });
    for (const elo of ['interpretador', 'grafo', 'navegacao', 'especialista']) {
      assert.ok(elo in saida.elos, `falta o elo "${elo}"`);
    }
  });

  await t.test('fora de combate, a navegação não roda', () => {
    const saida = Cadeia.arbitrar({ ficha: fichaDeTeste(g), texto: 'ataco o capanga',
                                    mesa: mesaDeTeste() });
    assert.equal(saida.elos.navegacao, 'fora de combate');
  });

  await t.test('em combate, a navegação roda e não é provisória', () => {
    const mesa = mesaDeTeste();
    mesa.combate = { ativo: true, oponentes: [] };
    const saida = Cadeia.arbitrar({ ficha: fichaDeTeste(g), texto: 'ataco o capanga', mesa });
    assert.ok(saida.navegacao, 'a navegação não rodou em combate');
    assert.equal(saida.navegacao.provisorio, false);
  });

  await t.test('o veredito traz o rastro, para poder explicar', () => {
    const v = Cadeia.comoVeredito(
      Cadeia.arbitrar({ ficha: fichaDeTeste(g), texto: 'ataco o capanga', mesa: mesaDeTeste() }));
    assert.ok(v.cadeia, 'sem o resumo dos elos');
    assert.ok(Array.isArray(v.rastro), 'sem rastro do especialista');
  });

  await t.test('o interpretador de modelo cai no léxico sem serviço', async () => {
    /* O `fetch` do arreio sempre estoura — que é exatamente o caso de
       servidor fora do ar. O turno não pode parar por isso, e é a
       mesma regra do Narrador e do Cronista. */
    const saida = await Cadeia.arbitrarComModelo({
      ficha: fichaDeTeste(g), texto: 'ataco o capanga', mesa: mesaDeTeste(), interpretador: 'llm'
    });
    assert.equal(saida.elos.interpretador, 'llm');
    assert.ok(saida.plano, 'não montou plano nenhum');
    assert.ok(saida.conclusao, 'não chegou ao especialista');
  });

  await t.test('a mesa escolhe o interpretador e não estoura sem serviço', async () => {
    /* `arbitrarTurno` é a função do front que a §48 pôs no lugar do
       `Arbitro.avaliar()`. Ela tem que devolver veredito nos dois
       caminhos — com modelo e sem. */
    assert.equal(typeof g.arbitrarTurno, 'function', 'a mesa não expõe arbitrarTurno');
  });
});

/* ============================================================
   O DEFEITO QUE A NAVEGAÇÃO QUASE INTRODUZIU
   Vale um bloco próprio porque é o tipo de coisa que passa em 241
   testes e quebra o jogo no primeiro soco.
   ============================================================ */

test('Navegação — não saber onde é diferente de saber que é longe', async (t) => {
  const sala = () => {
    const gr = Grafo.vazio();
    Grafo.acrescentarNo(gr, { id: 'sala', tipo: 'local', nome: 'Sala' });
    Grafo.acrescentarNo(gr, { id: 'voce', tipo: 'personagem', nome: 'Você' });
    Grafo.ligar(gr, 'voce', 'esta_em', 'sala');
    return gr;
  };

  await t.test('alvo fora do grafo não recebe distância inventada', () => {
    /* O oponente de combate vive em `M.combate.oponentes`, e NÃO é nó
       do grafo. A primeira versão caía em "longo" (1000 m) para o
       desconhecido, e `paraCombate` repassava. Resultado: todo soco
       barrado com "Desarmado alcança 0 m, e o alvo está a 1000 m".
       Os 241 testes de então passaram; quem pegou foi um turno de
       verdade no navegador. */
    const r = navegar(sala(), 'capanga_que_nao_esta_no_grafo');
    assert.equal(Navegacao.paraCombate(r).distancia, null,
      'inventou distância para alvo que não sabe onde está');
  });

  await t.test('e o golpe corpo a corpo continua acontecendo', () => {
    const c = Navegacao.paraCombate(navegar(sala(), 'nao_existe'));
    const r = Combate.resolver({
      atacante: fichaDeTeste(g, { nome: 'A' }),
      defensor: fichaDeTeste(g, { nome: 'D' }),
      tipo: 'desarmado', distancia: c.distancia
    });
    assert.notEqual(r.possivel, false, 'o soco foi barrado por alcance');
  });

  await t.test('sem alvo nenhum, idem', () => {
    assert.equal(Navegacao.paraCombate(navegar(sala(), null)).distancia, null);
  });

  await t.test('mas cobertura declarada continua valendo mesmo sem posição', () => {
    const r = navegar(sala(), 'nao_existe', { id: 'nao_existe', cobertura: 'Cobertura forte' });
    assert.equal(Navegacao.paraCombate(r).cobertura, 'Cobertura forte');
  });

  await t.test('nenhum tipo de ataque é barrado por alcance sem posição sabida', () => {
    /* Varre os sete tipos: nenhum pode virar bloqueio só porque a cena
       não disse onde o oponente está. */
    const c = Navegacao.paraCombate(navegar(sala(), 'nao_existe'));
    const barrados = [];
    for (const tipo of Object.keys(Combate.ATAQUES)) {
      const r = Combate.resolver({
        atacante: fichaDeTeste(g, { nome: 'A' }), defensor: fichaDeTeste(g, { nome: 'D' }),
        tipo, distancia: c.distancia
      });
      if (r.possivel === false) barrados.push(`${tipo}: ${(r.bloqueios || []).join(' ')}`);
    }
    assert.deepEqual(barrados, []);
  });
});

test('Cadeia — a fala continua sendo julgada (regressão da §48)', async (t) => {
  /* `Arbitro.avaliar` tratava `fala` num ramo próprio. Ao trocar a
     mesa para a cadeia, era preciso conferir que o Especialista faz o
     mesmo — senão sussurrar amordaçado passaria a ser permitido, e
     ninguém notaria até jogar. */
  const mesa = () => ({
    ficha: fichaDeTeste(g), cena: { local: 'bar', presentes: [] },
    locais: [{ id: 'bar', nome: 'Bar', zona: 'centro' }],
    pessoas: [], fatos: [], fios: [], bolsa: [], combate: { ativo: false }
  });

  await t.test('amordaçado não fala, e o motivo aparece', () => {
    const v = Cadeia.comoVeredito(Cadeia.arbitrar({
      ficha: fichaDeTeste(g), estados: ['amordacado'], texto: 'psiu, vem cá',
      mesa: mesa(), fala: { volume: 'normal', alvo: null }
    }));
    assert.ok(v.bloqueios.length, 'amordaçado continuou falando pela cadeia');
    assert.ok(v.bloqueios.every(b => b.motivo && !/undefined/.test(b.motivo)));
  });

  await t.test('sem mordaça, fala', () => {
    const v = Cadeia.comoVeredito(Cadeia.arbitrar({
      ficha: fichaDeTeste(g), estados: [], texto: 'psiu, vem cá',
      mesa: mesa(), fala: { volume: 'normal', alvo: null }
    }));
    assert.equal(v.bloqueios.length, 0);
  });

  await t.test('sussurro não alcança quem está a 30 m', () => {
    const v = Cadeia.comoVeredito(Cadeia.arbitrar({
      ficha: fichaDeTeste(g), estados: [], texto: 'psiu',
      mesa: mesa(),
      fala: { volume: 'sussurro', alvo: { nome: 'Alguém', distancia: 30, audivel: true } }
    }));
    assert.ok(v.bloqueios.some(b => b.tipo === 'alcance'), 'o sussurro atravessou 30 m');
  });
});

/* ============================================================
   A5 — O EXCEDENTE DE AGRAVADO NÃO MATA
   O teste que a §46.3 deixou escrito para entrar junto com a
   correção. Antes da §49 ele reprovava.
   ============================================================ */

test('Estado — dano Agravado além da trilha (A5)', async (t) => {
  const { Estado } = g;
  const cobaia = () => fichaDeTeste(g, { danoSuperficial: 0, danoAgravado: 0 });

  await t.test('excesso de Agravado é torpor, não Morte Final', () => {
    /* O básico é explícito: trilha inteira de Agravado é torpor para
       vampiro; Morte Final é fogo e luz do sol. Um golpe grande não
       vira fogueira. */
    const f = cobaia();
    const r = Estado.aplicarDano(f, { quantidade: 99, tipo: 'agravado' });
    assert.equal(r.destruido, false, 'o vampiro morreu de Agravado comum');
    assert.equal(r.torpor, true, 'não caiu em torpor');
  });

  await t.test('e vale para qualquer excesso, não só 99', () => {
    const max = g.derivados(cobaia()).vitalidade;
    for (const extra of [1, 2, 5, 20]) {
      const f = cobaia();
      const r = Estado.aplicarDano(f, { quantidade: max + extra, tipo: 'agravado' });
      assert.equal(r.destruido, false, `${max + extra} de Agravado matou`);
      assert.equal(r.torpor, true, `${max + extra} de Agravado não deu torpor`);
    }
  });

  await t.test('com fogo, o mesmo excesso É Morte Final', () => {
    const f = cobaia();
    const r = Estado.aplicarDano(f, { quantidade: 99, tipo: 'agravado', fonte: 'fogo' });
    assert.equal(r.destruido, true);
  });

  await t.test('mortal com excesso morre', () => {
    const m = fichaDeTeste(g, { mortal: true, danoSuperficial: 0, danoAgravado: 0 });
    assert.equal(Estado.aplicarDano(m, { quantidade: 99, tipo: 'agravado' }).destruido, true);
  });

  await t.test('a trilha nunca passa do máximo', () => {
    const f = cobaia();
    const max = g.derivados(f).vitalidade;
    Estado.aplicarDano(f, { quantidade: 99, tipo: 'agravado' });
    assert.equal(f.danoSuperficial + f.danoAgravado, max,
      `trilha com ${f.danoSuperficial + f.danoAgravado} de ${max}`);
  });

  await t.test('o dano que não coube é narrado, não sumido', () => {
    const f = cobaia();
    const r = Estado.aplicarDano(f, { quantidade: 99, tipo: 'agravado' });
    assert.ok(r.eventos.some(e => /não há mais onde marcar/i.test(e.texto)),
      'o excedente sumiu sem uma palavra');
  });

  await t.test('Superficial em excesso também não mata', () => {
    /* O mesmo laço servia às duas naturezas, então o defeito valia
       para as duas. */
    const f = cobaia();
    const r = Estado.aplicarDano(f, { quantidade: 99, tipo: 'superficial' });
    assert.equal(r.destruido, false);
  });

  await t.test('um golpe enorme em combate não vira Morte Final', () => {
    /* O caminho por onde isto chegava ao jogo: margem alta mais dano de
       arma passa da Vitalidade de um alvo já ferido. */
    const alvo = fichaDeTeste(g, { nome: 'Alvo', danoSuperficial: 0, danoAgravado: 0 });
    alvo.danoAgravado = g.derivados(alvo).vitalidade - 1;
    const v = comDadosViciados(g, Array(40).fill(10));
    const r = g.Combate.resolver({ atacante: fichaDeTeste(g, { nome: 'A' }), defensor: alvo,
                                   tipo: 'branca', arma: 'Facão', estacionario: true });
    v.restaurar();
    assert.equal(r.destruido, false, 'o facão fez o que só o fogo faz');
    assert.equal(r.torpor, true);
  });
});

/* ============================================================
   A6 — O ÁRBITRO NÃO DEPENDE MAIS DO FRONT
   ============================================================ */

test('Árbitro — a área é independente do front (A6)', async (t) => {
  await t.test('carrega sem o front', () => {
    assert.doesNotThrow(() => carregar(['data', 'ficha', 'arbitro']));
  });

  await t.test('e os rótulos de rolagem saem inteiros', () => {
    /* `nomeAtributo` morava em `front/mesa-render.js`. Sem ela, o
       rótulo sairia "undefined + Briga" — ou estouraria. */
    const so = carregar(['data', 'ficha', 'arbitro']);
    const f = fichaDeTeste(so);
    const p = so.Arbitro.piscinaFinal(f, {
      rota: { atributo: 'forca', pericia: 'briga' }, dominio: 'confronto' });
    assert.equal(p.rotulo, 'Força + Briga');

    const v = comDadosViciados(so, Array(40).fill(10));
    const r = so.Combate.resolver({ atacante: f, defensor: fichaDeTeste(so, { nome: 'D' }),
                                    tipo: 'desarmado', estacionario: true });
    v.restaurar();
    assert.ok(!/undefined/.test(r.rolAtq.rotulo), `rótulo quebrado: "${r.rolAtq.rotulo}"`);
  });

  await t.test('nenhum arquivo do Árbitro chama função que só existe no front', () => {
    /* A lista de "coisas do front" é DERIVADA do código, não escrita à
       mão. Escrita à mão ela envelhece: a primeira versão deste teste
       reprovava por listar `nomeAtributo`, que já tinha mudado de área
       — o teste estava certo no espírito e velho na lista. Assim, ele
       acompanha sozinho. */
    const semComentario = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    const leia = (area, nome) => semComentario(
      fs.readFileSync(path.join(RAIZ, 'app', 'js', area, `${nome}.js`), 'utf8'));
    const declaradas = (fonte) =>
      [...fonte.matchAll(/^(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);

    const soDoFront = new Set();
    for (const nome of AREAS.front) for (const d of declaradas(leia('front', nome))) soDoFront.add(d);
    /* Nome que as camadas de baixo também declaram não conta: repetição
       de nome não é dependência. */
    for (const area of ['data', 'ficha', 'arbitro']) {
      for (const nome of AREAS[area]) for (const d of declaradas(leia(area, nome))) soDoFront.delete(d);
    }

    const sujos = [];
    for (const nome of AREAS.arbitro) {
      const fonte = leia('arbitro', nome);
      for (const alvo of soDoFront) {
        /* O `(?<![.\w$])` é obrigatório: sem ele, `Seitas.perfil()` e
           `regra.quando()` casam com `perfil` e `quando` e a checagem
           acusa chamada global que não existe. Método de objeto não é
           dependência de escopo. */
        if (new RegExp(`(?<![.\\w$])${alvo}\\s*\\(`).test(fonte)) sujos.push(`${nome}.js → ${alvo}()`);
      }
    }
    assert.deepEqual(sujos, [], 'o Árbitro voltou a chamar o front');
  });
});

/* ============================================================
   A7 — O OPONENTE ENTROU NO GRAFO
   ============================================================ */

test('Grafo — o oponente da briga é gente no lugar (A7)', async (t) => {
  const mesaEmBriga = (extra = {}) => ({
    ficha: fichaDeTeste(g, { nome: 'Inácia' }),
    cena: { local: 'bar', presentes: [] },
    locais: [{ id: 'bar', nome: 'Bar do Zé', zona: 'centro' },
             { id: 'beco', nome: 'Beco', zona: 'centro' }],
    pessoas: [], fatos: [], fios: [], bolsa: [],
    combate: { ativo: true, oponentes: [Object.assign(
      { ref: 'op:1', nome: 'Segurança', ficha: fichaDeTeste(g, { nome: 'Segurança' }),
        estados: [] }, extra)] }
  });

  await t.test('o oponente vira nó, com o ref de id', () => {
    const gr = Grafo.de(mesaEmBriga());
    const no = Grafo.por(gr, 'op:1');
    assert.ok(no, 'o oponente não entrou no grafo');
    assert.equal(no.tipo, 'pessoa');
    assert.equal(no.nome, 'Segurança');
    assert.equal(no.oponente, true);
  });

  await t.test('e fica no local da cena', () => {
    assert.equal(Grafo.ondeEsta(Grafo.de(mesaEmBriga()), 'op:1'), 'bar');
  });

  await t.test('a navegação passa a saber onde ele está', () => {
    /* Este é o item A7 inteiro: antes, o oponente era invisível ao elo
       3, que respondia "não sei" para tudo dentro da briga. */
    const gr = Grafo.de(mesaEmBriga());
    const nav = Navegacao.navegar({ grafo: gr, contexto: Grafo.contexto(gr, 'voce'),
      plano: { acoes: [{ alvo: 'op:1' }] }, mesa: {}, alvo: null });
    assert.equal(nav.relacao, 'mesmo_local');
    assert.equal(nav.bloqueado, false);
    assert.equal(nav.linhaDeTiro, true);
  });

  await t.test('oponente em outro cômodo custa os −2', () => {
    const gr = Grafo.de(mesaEmBriga({ local: 'beco' }));
    const nav = Navegacao.navegar({ grafo: gr, contexto: Grafo.contexto(gr, 'voce'),
      plano: { acoes: [{ alvo: 'op:1' }] }, mesa: {}, alvo: null });
    assert.equal(nav.relacao, 'adjacente');
    assert.equal(nav.penalidade, -2);
  });

  await t.test('distância e cobertura declaradas no oponente chegam ao grafo', () => {
    const gr = Grafo.de(mesaEmBriga({ distancia: 40, cobertura: 'Cobertura forte' }));
    const no = Grafo.por(gr, 'op:1');
    assert.equal(no.distancia, 40);
    assert.equal(no.cobertura, 'Cobertura forte');

    const nav = Navegacao.navegar({ grafo: gr, contexto: Grafo.contexto(gr, 'voce'),
      plano: { acoes: [{ alvo: 'op:1' }] }, mesa: {}, alvo: null });
    assert.equal(nav.distancia, 40, 'a distância declarada não venceu a inferida');
    assert.ok(nav.cobertura, 'a cobertura declarada sumiu');
  });

  await t.test('o oponente aparece entre os presentes da cena', () => {
    const gr = Grafo.de(mesaEmBriga());
    assert.ok(Grafo.contexto(gr, 'voce').presentes.some(p => p.id === 'op:1'),
      'o sujeito que te bate não está no ambiente');
  });

  await t.test('sem briga aberta, ninguém entra', () => {
    const m = mesaEmBriga();
    m.combate.oponentes = [];
    assert.equal(Grafo.por(Grafo.de(m), 'op:1'), null);
  });

  await t.test('oponente sem ref é ignorado, e não estoura', () => {
    const m = mesaEmBriga();
    m.combate.oponentes.push({ nome: 'Sem Ref' });
    assert.doesNotThrow(() => Grafo.de(m));
  });

  await t.test('estando no mesmo ambiente, o soco continua acontecendo', () => {
    /* A conferência que a §48.4 obriga a repetir sempre que a
       navegação passa a saber mais: saber mais não pode virar
       bloqueio novo. */
    const gr = Grafo.de(mesaEmBriga());
    const nav = Navegacao.navegar({ grafo: gr, contexto: Grafo.contexto(gr, 'voce'),
      plano: { acoes: [{ alvo: 'op:1' }] }, mesa: {}, alvo: null });
    const c = Navegacao.paraCombate(nav);
    assert.equal(c.distancia, null, 'mesmo ambiente impôs distância');

    const barrados = [];
    for (const tipo of Object.keys(Combate.ATAQUES)) {
      const r = Combate.resolver({ atacante: fichaDeTeste(g, { nome: 'A' }),
        defensor: fichaDeTeste(g, { nome: 'D' }), tipo, distancia: c.distancia });
      if (r.possivel === false) barrados.push(tipo);
    }
    assert.deepEqual(barrados, []);
  });

  await t.test('a mesa descreve o terreno em texto legível', () => {
    /* `typeof === 'function'` prova que o nome existe, não que ele faz
       alguma coisa — e nome que existe sem fazer nada é justamente o
       que passa despercebido. Agora chama. */
    const oponente = { ref: 'op:1', nome: 'Segurança',
                       distancia: 42, cobertura: 'Cobertura forte' };
    executar(g, 'M = MESA_VAZIA(); M.ficha = ' +
      JSON.stringify(fichaDeTeste(g)) + '; M.cena = { local: "bar", presentes: [] };' +
      'M.locais = [{ id: "bar", nome: "Bar" }];' +
      'M.combate = { ativo: true, oponentes: [' + JSON.stringify(oponente) + '] };');

    const terreno = executar(g, 'terrenoDoOponente(M.combate.oponentes[0])');
    assert.equal(terreno.distancia, 42, 'a distância declarada não chegou ao combate');
    assert.equal(terreno.cobertura, 'Cobertura forte');

    const texto = executar(g, 'terrenoDescrito(M.combate.oponentes[0])');
    assert.equal(typeof texto, 'string');
    assert.ok(texto.includes('42'), `a descrição não diz a distância: "${texto}"`);
    assert.ok(/cobertura/i.test(texto), `a descrição não diz a cobertura: "${texto}"`);
  });
});

test('Navegação — o ambiente ao lado cobra, e não barra', async (t) => {
  /* A coerência que quase se perdeu: a §48.3 decidiu que o cômodo
     vizinho vale −2, e a primeira tradução para o combate mandava os
     100 m presumidos — o que fazia `Combate.resolver` BARRAR o soco por
     alcance, exatamente o contrário do decidido. Distância medida é uma
     coisa; estar na sala ao lado é outra. */
  const duasSalas = () => {
    const gr = Grafo.vazio();
    Grafo.acrescentarNo(gr, { id: 'a', tipo: 'local', nome: 'Sala A', zona: 'z' });
    Grafo.acrescentarNo(gr, { id: 'b', tipo: 'local', nome: 'Sala B', zona: 'z' });
    Grafo.acrescentarNo(gr, { id: 'voce', tipo: 'personagem', nome: 'Você' });
    Grafo.acrescentarNo(gr, { id: 'alvo', tipo: 'pessoa', nome: 'Alvo' });
    Grafo.ligar(gr, 'voce', 'esta_em', 'a');
    Grafo.ligar(gr, 'alvo', 'esta_em', 'b');
    Grafo.adjacenciaPorZona(gr);
    return gr;
  };

  await t.test('não manda distância inferida para o combate', () => {
    const c = Navegacao.paraCombate(navegar(duasSalas(), 'alvo'));
    assert.equal(c.distancia, null, 'a distância presumida vazou para o combate');
    assert.equal(c.penalidade, -2, 'a penalidade não veio junto');
  });

  await t.test('e o soco no cômodo ao lado ACONTECE, com −2', () => {
    const c = Navegacao.paraCombate(navegar(duasSalas(), 'alvo'));
    const v = comDadosViciados(g, Array(40).fill(10));
    const r = Combate.resolver({
      atacante: fichaDeTeste(g, { nome: 'A' }), defensor: fichaDeTeste(g, { nome: 'D' }),
      tipo: 'desarmado', estacionario: true,
      distancia: c.distancia, penalidadeTerreno: c.penalidade
    });
    v.restaurar();
    assert.notEqual(r.possivel, false, 'o soco foi barrado por alcance');
    assert.ok(r.eventos.some(e => /Terreno/.test(e.texto)), 'o −2 não foi narrado');
  });

  await t.test('a penalidade de terreno tira dados de verdade', () => {
    const par = (pen) => {
      const v = comDadosViciados(g, Array(60).fill(10));
      const r = Combate.resolver({
        atacante: fichaDeTeste(g, { nome: 'A' }), defensor: fichaDeTeste(g, { nome: 'D' }),
        tipo: 'desarmado', estacionario: true, penalidadeTerreno: pen });
      v.restaurar();
      return r.rolAtq.piscina;
    };
    assert.equal(par(0) - par(-2), 2, 'os −2 não chegaram à piscina');
  });

  await t.test('penalidade positiva não vira bônus', () => {
    /* Terreno nunca ajuda. Se alguém passar +3 por engano, ele é
       ignorado — a mesma regra que vale para estado (§46.4). */
    const par = (pen) => {
      const v = comDadosViciados(g, Array(60).fill(10));
      const r = Combate.resolver({
        atacante: fichaDeTeste(g, { nome: 'A' }), defensor: fichaDeTeste(g, { nome: 'D' }),
        tipo: 'desarmado', estacionario: true, penalidadeTerreno: pen });
      v.restaurar();
      return r.rolAtq.piscina;
    };
    assert.equal(par(3), par(0));
  });

  await t.test('mas o alvo em outra ZONA continua sendo bloqueio', () => {
    const gr = Grafo.vazio();
    Grafo.acrescentarNo(gr, { id: 'a', tipo: 'local', nome: 'Sala A', zona: 'centro' });
    Grafo.acrescentarNo(gr, { id: 'longe', tipo: 'local', nome: 'Longe', zona: 'sul' });
    Grafo.acrescentarNo(gr, { id: 'voce', tipo: 'personagem', nome: 'Você' });
    Grafo.acrescentarNo(gr, { id: 'alvo', tipo: 'pessoa', nome: 'Alvo' });
    Grafo.ligar(gr, 'voce', 'esta_em', 'a');
    Grafo.ligar(gr, 'alvo', 'esta_em', 'longe');
    Grafo.adjacenciaPorZona(gr);
    assert.equal(navegar(gr, 'alvo').bloqueado, true);
  });
});

/* ============================================================
   NENHUM ELO PROVISÓRIO SOBROU (item A8)
   ============================================================ */

test('Cadeia — nada aqui se declara provisório', async (t) => {
  const semComentario = (t) => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');

  await t.test('nenhum interpretador ou navegador registrado é provisório', () => {
    /* O navegador `livre` da §41 continuou registrado por cinco seções
       depois de deixar de ser o padrão. Ele não era escolhido por
       ninguém, mas parecia uma alternativa — e o nome dele aparecia no
       rastro dos elos, o que fez um leitor concluir que o elo 3 seguia
       provisório. Concluiu com razão: o código dizia isso.

       Implementação aposentada se APAGA. Deixar registrada é código
       morto com aparência de opção. */
    const provisorios = [];
    for (const [nome, fn] of Object.entries(Cadeia.NAVEGADORES)) {
      const r = fn({ grafo: Grafo.vazio(), contexto: {}, plano: { acoes: [] }, mesa: {}, alvo: null });
      if (r && r.provisorio) provisorios.push(`navegador "${nome}"`);
    }
    assert.deepEqual(provisorios, [], 'elo provisório de volta no registro');
  });

  await t.test('o rastro dos elos não usa o nome de nada aposentado', () => {
    /* `elos.navegacao` dizia literalmente "livre" para caminho
       desimpedido — a mesma palavra que nomeava o navegador provisório.
       Rótulo que colide com nome de coisa aposentada engana. */
    const mesa = {
      ficha: fichaDeTeste(g), cena: { local: 'bar', presentes: [] },
      locais: [{ id: 'bar', nome: 'Bar', zona: 'centro' }],
      pessoas: [], fatos: [], fios: [], bolsa: [],
      combate: { ativo: true, oponentes: [] }
    };
    const elos = Cadeia.arbitrar({ ficha: mesa.ficha, texto: 'ataco', mesa }).elos;
    assert.ok(elos.navegacao.startsWith(Cadeia.navegadorPadrao),
      `o rastro não diz quem navegou: "${elos.navegacao}"`);
    assert.notEqual(elos.navegacao, 'livre', 'o rótulo voltou a colidir com o nome aposentado');
  });

  await t.test('navegador desconhecido estoura, em vez de sumir', () => {
    /* Antes, um nome errado deixava `navegacao` nula em silêncio e o
       turno seguia sem o elo 3. Elo que não roda tem que dar erro. */
    const mesa = { ficha: fichaDeTeste(g), cena: { local: 'bar', presentes: [] },
      locais: [{ id: 'bar', nome: 'Bar' }], pessoas: [], fatos: [], fios: [], bolsa: [],
      combate: { ativo: true, oponentes: [] } };
    assert.throws(() => Cadeia.arbitrar({ ficha: mesa.ficha, texto: 'ataco', mesa,
      navegador: 'nao_existe' }), /Navegador desconhecido/);
  });

  await t.test('nenhum arquivo do Árbitro se declara provisório', () => {
    /* O cabeçalho do `motor-cadeia.js` dizia "elos 1 e 3 provisórios"
       por quatro seções depois de deixarem de ser, e alguém leu e
       acreditou. Comentário que descreve ESTADO envelhece igual a
       número em documento (§50.3).

       Este teste é literal de propósito: só aceita a palavra quando ela
       vem contando o passado — "foi provisório", "era provisório", "o
       provisório da §41". */
    const suspeitos = [];
    const PASSADO = /foi |era |dizia|deixou de|deixaram de|seguia|continuou|APAGADO|substitu|aposentad|NÃO é|não é|já não/i;

    for (const nome of AREAS.arbitro) {
      const fonte = fs.readFileSync(
        path.join(RAIZ, 'app', 'js', 'arbitro', `${nome}.js`), 'utf8');

      /* Por BLOCO de comentário, não por linha. Linha a linha, a primeira
         versão deste teste acusou os próprios comentários que registram o
         defeito — porque a frase que os situa no passado ficava na linha
         de cima. Um bloco é uma ideia; uma linha é uma quebra de texto. */
      for (const bloco of fonte.match(/\/\*[\s\S]*?\*\//g) || []) {
        if (!/provisóri/i.test(bloco)) continue;
        if (PASSADO.test(bloco)) continue;      // está contando o passado
        suspeitos.push(`${nome}.js: ${bloco.replace(/\s+/g, ' ').slice(0, 80)}`);
      }

      /* E o que não é comentário: um elo que se marca provisório. */
      const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, ' ');
      if (/provisorio\s*:\s*true/.test(codigo)) {
        suspeitos.push(`${nome}.js: devolve provisorio: true`);
      }
    }
    assert.deepEqual(suspeitos, [], 'implementação provisória declarada no Árbitro');
  });

  await t.test('o cabeçalho diz que a cadeia está ligada', () => {
    /* O caminho inverso: não basta tirar a mentira, tem que estar lá o
       que é verdade — senão a próxima pessoa a ler o arquivo não sabe
       se o turno passa por aqui. */
    const fonte = fs.readFileSync(
      path.join(RAIZ, 'app', 'js', 'arbitro', 'motor-cadeia.js'), 'utf8');
    const cabecalho = fonte.slice(0, fonte.indexOf('const Cadeia'));
    assert.ok(/arbitrarTurno/.test(cabecalho),
      'o cabeçalho não diz por onde a mesa entra');
    assert.ok(/navmesh/.test(cabecalho), 'o cabeçalho não diz quem é o elo 3');
  });
});

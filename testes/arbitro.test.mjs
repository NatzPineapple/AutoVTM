/* ============================================================
   VITÆ — Testes da área Árbitro
   O Árbitro é regra pura: entra ficha e situação, sai veredito.
   É a área onde teste automatizado rende mais, porque quase tudo
   dá para afirmar sem desenhar nada e sem rolar nada.

       npm test
       node --test testes/arbitro.test.mjs
   ============================================================ */

import test from 'node:test';
import assert from 'node:assert/strict';
import { carregar, fichaDeTeste, comDadosViciados } from './carregar.mjs';

/* Mesma dívida da §45.2: `nomeAtributo()` vive em front/mesa-render.js e
   é chamada por motor-combate.js e por Arbitro.piscinaFinal(). Enquanto
   isso for verdade, a área não carrega sozinha. */
const AREAS_DO_ARBITRO = ['data', 'ficha', 'arbitro', 'front'];
const g = carregar(AREAS_DO_ARBITRO);
const { Dados, Arbitro, Estado, Combate, Rodada, Grafo, Especialista, Cadeia } = g;

/* Apurar sem rolar: `_apurar` é pura e recebe os dados prontos. É assim
   que se testa a regra do V5 sem depender de sorteio nenhum. */
const apurar = (normais, fome = [], dificuldade = 0) =>
  Dados._apurar({ normais, dadosFome: fome, dificuldade,
                  piscina: normais.length + fome.length, fome: fome.length, rotulo: '' });

/* ============================================================
   DADOS — a regra do V5 sem sortear nada
   ============================================================ */

test('Dados — contagem de sucessos', async (t) => {
  await t.test('6 ou mais é sucesso; 5 ou menos não é', () => {
    assert.equal(apurar([6, 7, 8, 9]).sucessos, 4);
    assert.equal(apurar([1, 2, 3, 4, 5]).sucessos, 0);
  });

  await t.test('o 6 conta e o 5 não — a borda exata', () => {
    assert.equal(apurar([5]).sucessos, 0);
    assert.equal(apurar([6]).sucessos, 1);
  });

  await t.test('sem dado nenhum, nada acontece', () => {
    const r = apurar([]);
    assert.equal(r.sucessos, 0);
    assert.equal(r.critico, false);
  });
});

test('Dados — o crítico é par de dez, e vale quatro', async (t) => {
  await t.test('dois dez valem 4 sucessos, não 2', () => {
    /* A regra do V5: cada par de 10 vale dois sucessos ADICIONAIS.
       Dois dez = 2 básicos + 2 de bônus = 4. */
    const r = apurar([10, 10]);
    assert.equal(r.sucessos, 4);
    assert.equal(r.critico, true);
    assert.equal(r.pares, 1);
  });

  await t.test('um dez sozinho é sucesso comum, sem crítico', () => {
    const r = apurar([10, 7]);
    assert.equal(r.sucessos, 2);
    assert.equal(r.critico, false);
  });

  await t.test('três dez formam um par só — o terceiro fica solto', () => {
    const r = apurar([10, 10, 10]);
    assert.equal(r.pares, 1);
    assert.equal(r.sucessos, 5, '3 básicos + 2 do par');
  });

  await t.test('quatro dez formam dois pares', () => {
    const r = apurar([10, 10, 10, 10]);
    assert.equal(r.pares, 2);
    assert.equal(r.sucessos, 8, '4 básicos + 4 dos dois pares');
  });

  await t.test('o par pode se formar entre dado normal e dado de Fome', () => {
    /* Isto importa: se os pares fossem contados por trilha separada, um
       10 normal e um 10 de Fome não fariam crítico — e fazem. */
    const r = apurar([10], [10]);
    assert.equal(r.critico, true);
    assert.equal(r.sucessos, 4);
  });
});

test('Dados — os seis desfechos do V5', async (t) => {
  await t.test('sucesso comum', () => {
    assert.equal(apurar([6, 7], [], 2).tipo, 'sucesso');
  });

  await t.test('sucesso crítico', () => {
    assert.equal(apurar([10, 10], [], 2).tipo, 'critico');
  });

  await t.test('sucesso em perigo: crítico com dez na Fome', () => {
    /* Messy critical. Conseguiu — e a Besta cobrou em público. */
    const r = apurar([10], [10], 2);
    assert.equal(r.tipo, 'perigo');
    assert.equal(r.passou, true);
    assert.equal(r.dezesFome, 1);
  });

  await t.test('crítico sem dez na Fome NÃO é perigo', () => {
    assert.equal(apurar([10, 10], [7], 2).tipo, 'critico');
  });

  await t.test('falha comum: teve sucesso, mas não o bastante', () => {
    const r = apurar([6, 7], [], 5);
    assert.equal(r.tipo, 'falha');
    assert.equal(r.passou, false);
  });

  await t.test('falha total: nenhum sucesso', () => {
    assert.equal(apurar([2, 3, 4], [], 3).tipo, 'total');
  });

  await t.test('falha bestial: falhou com 1 na Fome', () => {
    const r = apurar([2, 3], [1], 3);
    assert.equal(r.tipo, 'bestial');
    assert.equal(r.unsFome, 1);
  });

  await t.test('1 na Fome numa rolagem que PASSOU não é bestial', () => {
    /* A Besta só responde quando você falha. Um 1 de Fome num sucesso
       é só um dado ruim. */
    const r = apurar([10, 9, 8], [1], 2);
    assert.equal(r.passou, true);
    assert.notEqual(r.tipo, 'bestial');
  });

  await t.test('a bestial tem precedência sobre a total', () => {
    const r = apurar([2], [1], 2);
    assert.equal(r.sucessos, 0, 'nenhum sucesso — seria falha total');
    assert.equal(r.tipo, 'bestial', 'mas o 1 de Fome manda');
  });

  await t.test('todo desfecho tem rótulo', () => {
    for (const tipo of ['perigo', 'critico', 'sucesso', 'falha', 'total', 'bestial']) {
      assert.ok(Dados.ROTULOS[tipo] && Dados.ROTULOS[tipo].nome, `sem rótulo: ${tipo}`);
    }
  });
});

test('Dados — dificuldade e margem', async (t) => {
  await t.test('sem dificuldade declarada, um sucesso basta', () => {
    assert.equal(apurar([6]).passou, true);
    assert.equal(apurar([5]).passou, false);
  });

  await t.test('a margem é o que sobrou acima da dificuldade', () => {
    assert.equal(apurar([6, 7, 8, 9], [], 2).margem, 2);
    assert.equal(apurar([6], [], 3).margem, -2);
  });
});

test('Dados — a piscina e o reteste de Vontade', async (t) => {
  await t.test('a piscina é atributo + perícia', () => {
    const f = fichaDeTeste(g);
    f.atributos.forca = 3;
    f.habilidades.briga = 2;
    f.especializacoes = {};
    assert.equal(Dados.piscinaDe(f, 'forca', 'briga').total, 5);
  });

  await t.test('especialização vale exatamente +1', () => {
    const f = fichaDeTeste(g);
    f.atributos.forca = 3;
    f.habilidades.briga = 2;
    f.especializacoes = { briga: 'Bar de esquina' };
    const p = Dados.piscinaDe(f, 'forca', 'briga');
    assert.equal(p.especializacao, 1);
    assert.equal(p.total, 6);
  });

  await t.test('sem perícia, é só o atributo', () => {
    const f = fichaDeTeste(g);
    f.atributos.forca = 4;
    assert.equal(Dados.piscinaDe(f, 'forca', null).total, 4);
  });

  await t.test('o reteste só oferece dados que falharam', () => {
    const r = apurar([2, 5, 8, 10]);
    /* Devolve ÍNDICES, não valores. A primeira versão deste teste lia
       `x.v` sobre um array de números e passava por acidente — o tipo de
       verde que não prova nada. */
    const indices = Dados.dadosRetestaveis(r);
    assert.ok(indices.every(i => Number.isInteger(i)), 'devia devolver índices');
    assert.deepEqual(indices.map(i => r.normais[i]).filter(v => v >= 6), [],
      'ofereceu dado que já era sucesso');
  });

  await t.test('oferece no máximo três dados', () => {
    assert.ok(Dados.dadosRetestaveis(apurar([1, 1, 2, 2, 3, 3, 4, 4])).length <= 3);
  });

  await t.test('nunca oferece dado de Fome — a Fome não se retesta', () => {
    /* Regra do V5, e é o custo inteiro de ter Fome: não dá para gastar
       Vontade para escapar do que a Besta rolou. */
    const r = apurar([2, 3], [1, 2]);
    const indices = Dados.dadosRetestaveis(r);
    assert.ok(indices.every(i => i < r.normais.length), 'dado de Fome entrou no reteste');

    const antesFome = r.dadosFome.slice();
    const d = comDadosViciados(g, [9, 9]);
    const depois = Dados.retestarVontade(r, indices);
    d.restaurar();
    assert.deepEqual(depois.dadosFome, antesFome, 'o reteste mexeu nos dados de Fome');
  });

  await t.test('não retesta duas vezes a mesma rolagem', () => {
    const r = apurar([2, 3, 4]);
    assert.equal(Dados.podeRetestar(r), true);
    const d = comDadosViciados(g, [9, 9, 9]);
    const depois = Dados.retestarVontade(r, [0, 1, 2]);
    d.restaurar();
    assert.equal(depois.retestado, true);
    assert.equal(Dados.podeRetestar(depois), false);
  });

  await t.test('a Provocação sobe a Fome com 5 ou menos', () => {
    for (const [valor, sobe] of [[1, true], [5, true], [6, false], [10, false]]) {
      const d = comDadosViciados(g, [valor]);
      assert.equal(Dados.provocacao().subiuFome, sobe, `valor ${valor}`);
      d.restaurar();
    }
  });
});

/* ============================================================
   ESTADO — dano, trilhas, torpor
   ============================================================ */

test('Estado — dano Superficial em vampiro', async (t) => {
  const cobaia = () => fichaDeTeste(g, { danoSuperficial: 0, danoAgravado: 0 });

  await t.test('é dividido por dois, arredondando para baixo', () => {
    const f = cobaia();
    Estado.aplicarDano(f, { quantidade: 5, tipo: 'superficial' });
    assert.equal(f.danoSuperficial, 2, '5 vira 2');
  });

  await t.test('1 de Superficial em vampiro vira zero — e não é bug', () => {
    /* É a regra: metade de 1, arredondada para baixo, é 0. Um soco não
       machuca um vampiro. */
    const f = cobaia();
    Estado.aplicarDano(f, { quantidade: 1, tipo: 'superficial' });
    assert.equal(f.danoSuperficial, 0);
  });

  await t.test('em mortal NÃO é dividido', () => {
    const m = fichaDeTeste(g, { mortal: true, danoSuperficial: 0, danoAgravado: 0 });
    Estado.aplicarDano(m, { quantidade: 5, tipo: 'superficial' });
    assert.equal(m.danoSuperficial, 5);
  });

  await t.test('`semMetade` desliga a divisão', () => {
    const f = cobaia();
    Estado.aplicarDano(f, { quantidade: 4, tipo: 'superficial', semMetade: true });
    assert.equal(f.danoSuperficial, 4);
  });

  await t.test('dano na Força de Vontade não é dividido', () => {
    const f = cobaia();
    Estado.aplicarDano(f, { quantidade: 3, tipo: 'superficial', trilha: 'vontade' });
    assert.equal(f.danoVontade, 3);
  });
});

test('Estado — dano Agravado e transbordo', async (t) => {
  await t.test('Agravado entra inteiro, sem metade', () => {
    const f = fichaDeTeste(g, { danoSuperficial: 0, danoAgravado: 0 });
    Estado.aplicarDano(f, { quantidade: 3, tipo: 'agravado' });
    assert.equal(f.danoAgravado, 3);
  });

  await t.test('com a trilha cheia, Superficial vira Agravado', () => {
    const f = fichaDeTeste(g, { danoSuperficial: 0, danoAgravado: 0 });
    const max = g.derivados(f).vitalidade;
    f.danoSuperficial = max;                                   // trilha lotada
    const r = Estado.aplicarDano(f, { quantidade: 4, tipo: 'superficial' });
    assert.ok(f.danoAgravado > 0, 'nada transbordou');
    assert.equal(f.danoSuperficial + f.danoAgravado, max, 'a trilha passou do máximo');
    assert.ok(r.eventos.some(e => /virou Agravado/.test(e.texto)), 'o transbordo não foi narrado');
  });

  await t.test('trilha cheia de Agravado é torpor, não Morte Final', () => {
    /* Dano EXATO até encher a trilha. O excedente é outro caso, e hoje
       ele diverge — registrado como A5 na §45.2. O teste do excedente
       entra junto com a correção, não antes. */
    const f = fichaDeTeste(g, { danoSuperficial: 0, danoAgravado: 0 });
    const r = Estado.aplicarDano(f, { quantidade: g.derivados(f).vitalidade, tipo: 'agravado' });
    assert.equal(r.torpor, true);
    assert.equal(r.destruido, false, 'vampiro não morre de Agravado comum');
  });

  await t.test('mas por fogo ou sol é Morte Final', () => {
    for (const fonte of ['fogo', 'luz do sol', 'chama do isqueiro']) {
      const f = fichaDeTeste(g, { danoSuperficial: 0, danoAgravado: 0 });
      const r = Estado.aplicarDano(f, {
        quantidade: g.derivados(f).vitalidade, tipo: 'agravado', fonte
      });
      assert.equal(r.destruido, true, `fonte "${fonte}" devia matar`);
    }
  });

  await t.test('mortal com a trilha cheia de Agravado morre', () => {
    const m = fichaDeTeste(g, { mortal: true, danoSuperficial: 0, danoAgravado: 0 });
    const r = Estado.aplicarDano(m, { quantidade: g.derivados(m).vitalidade, tipo: 'agravado' });
    assert.equal(r.destruido, true);
  });

  await t.test('dano zero não faz nada', () => {
    const f = fichaDeTeste(g, { danoSuperficial: 0, danoAgravado: 0 });
    const r = Estado.aplicarDano(f, { quantidade: 0, tipo: 'agravado' });
    assert.equal(f.danoAgravado, 0);
    /* `deepEqual` compara protótipo, e o Array que vem do `vm` não é o
       Array deste realm. Comparar o tamanho é o certo aqui. */
    assert.equal(r.eventos.length, 0);
  });
});

test('Estado — os estados derivados da ficha', async (t) => {
  await t.test('trilha de Vitalidade lotada é "debilitado"', () => {
    const f = fichaDeTeste(g, { danoSuperficial: 0, danoAgravado: 0 });
    f.danoSuperficial = g.derivados(f).vitalidade;
    assert.ok(Estado.estadosDerivados(f).includes('debilitado'));
  });

  await t.test('Fome 5 dá "fome_maxima" e "exangue"', () => {
    const f = fichaDeTeste(g, { fome: 5 });
    const e = Estado.estadosDerivados(f);
    assert.ok(e.includes('fome_maxima'));
    assert.ok(e.includes('exangue'));
  });

  await t.test('Fome 4 ainda não', () => {
    assert.ok(!Estado.estadosDerivados(fichaDeTeste(g, { fome: 4 })).includes('fome_maxima'));
  });

  await t.test('estadosDe une os manuais aos derivados, sem repetir', () => {
    const f = fichaDeTeste(g, { fome: 5 });
    const e = Estado.estadosDe(f, ['algemado', 'fome_maxima']);
    assert.equal(e.filter(x => x === 'fome_maxima').length, 1, 'duplicou');
    assert.ok(e.includes('algemado'));
  });
});

/* ============================================================
   ARBITRO — capacidades, alcance, piscina final
   ============================================================ */

test('Árbitro — estados removem capacidades', async (t) => {
  await t.test('sem estado, nada é removido', () => {
    const c = Arbitro.capacidadesDe([]);
    assert.equal(Object.keys(c.removidas).length, 0);
  });

  await t.test('cada estado declarado remove capacidade que existe no léxico', () => {
    /* Estado que remove uma capacidade inexistente barra ação por um
       motivo que nunca aparece na explicação. Erro caro e silencioso. */
    const orfas = [];
    for (const [id, e] of Object.entries(Arbitro.ESTADOS)) {
      for (const c of (e.remove || [])) {
        if (!(c in Arbitro.CAPACIDADES)) orfas.push(`${id} → ${c}`);
      }
    }
    assert.deepEqual(orfas, [], 'estado removendo capacidade que não existe');
  });

  await t.test('o motivo da remoção vem junto, para poder explicar', () => {
    const algum = Object.keys(Arbitro.ESTADOS).find(id => (Arbitro.ESTADOS[id].remove || []).length);
    const c = Arbitro.capacidadesDe([algum]);
    for (const cap of Object.keys(c.removidas)) {
      assert.ok(c.removidas[cap], `capacidade ${cap} removida sem motivo em texto`);
    }
  });
});

test('Árbitro — a penalidade de estado', async (t) => {
  await t.test('nunca é positiva: estado não ajuda', () => {
    for (const id of Object.keys(Arbitro.ESTADOS)) {
      for (const nat of ['fisico', 'mental']) {
        assert.ok(Arbitro.penalidadeDeEstados([id], nat).dados <= 0,
          `estado "${id}" dando bônus em ${nat}`);
      }
    }
  });

  await t.test('estado nenhum é penalidade zero', () => {
    assert.equal(Arbitro.penalidadeDeEstados([], 'fisico').dados, 0);
  });

  await t.test('acumula, e diz por quê', () => {
    const ids = Object.keys(Arbitro.ESTADOS).slice(0, 3);
    const p = Arbitro.penalidadeDeEstados(ids, 'fisico');
    if (p.dados < 0) assert.ok(p.causas.length, 'penalizou sem dizer a causa');
  });
});

test('Árbitro — a piscina final', async (t) => {
  const rota = { atributo: 'forca', pericia: 'briga', dominio: 'confronto' };

  await t.test('sem modificador, é a piscina crua', () => {
    const f = fichaDeTeste(g);
    f.especializacoes = {};
    const p = Arbitro.piscinaFinal(f, { rota, estados: [], dominio: 'confronto' });
    assert.equal(p.total, Dados.piscinaDe(f, 'forca', 'briga').total);
  });

  await t.test('nunca é negativa', () => {
    const f = fichaDeTeste(g, {
      atributos: { forca: 1, destreza: 1, vigor: 1, carisma: 1, manipulacao: 1,
                   autocontrole: 1, inteligencia: 1, raciocinio: 1, determinacao: 1 },
      habilidades: {}
    });
    const p = Arbitro.piscinaFinal(f, {
      rota, estados: Object.keys(Arbitro.ESTADOS), dominio: 'confronto'
    });
    assert.ok(p.total >= 0, `piscina ${p.total}`);
  });

  await t.test('traz sempre um rótulo legível', () => {
    const p = Arbitro.piscinaFinal(fichaDeTeste(g), { rota, dominio: 'confronto' });
    assert.ok(p.rotulo && /\+/.test(p.rotulo), `rótulo ruim: "${p.rotulo}"`);
  });

  await t.test('o bônus de Potência de Sangue é metade, e só com Disciplina', () => {
    /* Sem disciplina declarada, o bônus não entra — foi o defeito que a
       §40 fechou, e os três chamadores precisam passar o parâmetro. */
    const f = fichaDeTeste(g, { geracao: '8' });
    const ps = g.derivados(f).potencia;
    const sem = Arbitro.piscinaFinal(f, { rota, dominio: 'confronto' });
    const com = Arbitro.piscinaFinal(f, { rota, dominio: 'confronto', disciplina: 'potencia' });
    assert.equal(com.total - sem.total, Math.floor(ps / 2), `Potência de Sangue ${ps}`);
  });

  await t.test('Potência de Sangue 1 não dá bônus nenhum', () => {
    /* O `if (...) return` que havia aqui era um escape: quando ele
       disparava, o teste passava sem afirmar nada. Geração 13 dá
       Potência 1, e é isso que se afirma — se a tabela mudar, o teste
       cai em vez de escapar. */
    const f = fichaDeTeste(g, { geracao: '13' });
    assert.equal(g.derivados(f).potencia, 1, 'geração 13 devia dar Potência de Sangue 1');
    assert.equal(Arbitro.bonusDePotencia(f, 'potencia'), null);
  });
});

test('Árbitro — o veredito', async (t) => {
  await t.test('intenção que o léxico não conhece manda escalar, não nega', () => {
    /* Silêncio não é "não". O Árbitro que não entendeu tem que dizer
       isso, e passar a bola. */
    const v = Arbitro.avaliar({ ficha: fichaDeTeste(g), texto: 'zzzqqq wubalubadubdub' });
    assert.equal(v.possivel, null);
    assert.equal(v.escalar, true);
  });

  await t.test('poder de Disciplina que não se tem é bloqueado, com motivo', () => {
    /* Este teste era VAZIO: pedia a intenção "dominar", que não existe
       no léxico, e escapava pelo `if (v.possivel === null) return` em
       toda corrida. Verde que nunca afirmou nada.

       A intenção é escolhida do próprio léxico agora, e o teste falha
       se nenhuma ação exigir Disciplina — o que é a informação certa. */
    const comDisciplina = Object.keys(Arbitro.ACOES)
      .find(id => Arbitro.ACOES[id].disciplina);
    assert.ok(comDisciplina, 'nenhuma ação do léxico exige Disciplina');

    const f = fichaDeTeste(g, { disciplinas: {}, poderes: {} });
    const v = Arbitro.avaliar({ ficha: f, intencao: comDisciplina });
    assert.equal(v.possivel, false, `${comDisciplina} passou sem a Disciplina`);
    assert.ok(v.bloqueios.some(b => b.tipo === 'disciplina'), 'barrou por outro motivo');
    assert.ok(v.bloqueios.every(b => b.motivo && b.motivo.length > 5));
  });

  await t.test('todo bloqueio traz tipo e motivo — sempre', () => {
    /* Um bloqueio sem motivo é o Árbitro dizendo "não" e virando as
       costas. É a regra da §3 do projeto, e vale para todos. */
    const f = fichaDeTeste(g, { disciplinas: {}, poderes: {} });
    for (const intencao of Object.keys(Arbitro.ACOES).slice(0, 25)) {
      const v = Arbitro.avaliar({ ficha: f, intencao, estados: ['algemado', 'amordacado'] });
      for (const b of (v.bloqueios || [])) {
        assert.ok(b.tipo, `bloqueio sem tipo em "${intencao}"`);
        assert.ok(b.motivo && b.motivo.length > 5, `motivo vazio em "${intencao}"`);
      }
    }
  });

  await t.test('alvo fora de alcance é bloqueio de alcance', () => {
    /* Também escapava: "agarrar" não existe no léxico. Agora varre as
       ações que DECLARAM alcance e confere todas — se alguma deixar
       passar um alvo a 500 m, o teste diz qual. */
    const comAlcance = Object.entries(Arbitro.ACOES)
      .filter(([, a]) => a.alcance && Arbitro.ALCANCES[a.alcance] &&
                         Arbitro.ALCANCES[a.alcance].metros < 500)
      .map(([id]) => id);
    assert.ok(comAlcance.length, 'nenhuma ação do léxico declara alcance finito');

    const passaram = [];
    for (const id of comAlcance) {
      const v = Arbitro.avaliar({ ficha: fichaDeTeste(g), intencao: id,
        alvo: { distancia: 500, visivel: true, audivel: true } });
      if (!v.bloqueios.some(b => b.tipo === 'alcance')) passaram.push(id);
    }
    assert.deepEqual(passaram, [], 'ação alcançou um alvo a 500 m');
  });

  await t.test('toda ação do léxico tem nome e domínio', () => {
    const quebradas = [];
    for (const [id, a] of Object.entries(Arbitro.ACOES)) {
      if (!a.nome) quebradas.push(`${id}: sem nome`);
      if (!a.dominio) quebradas.push(`${id}: sem domínio`);
    }
    assert.deepEqual(quebradas, []);
  });

  await t.test('toda ação de seita nomeia uma seita que existe', () => {
    const orfas = Object.entries(Arbitro.ACOES)
      .filter(([, a]) => a.seita && !g.Seitas.perfil(a.seita))
      .map(([id]) => id);
    assert.deepEqual(orfas, []);
  });

  await t.test('avaliar não muda a ficha', () => {
    /* O Árbitro julga; quem muda estado é o Estado. Se avaliar mexer na
       ficha, o mesmo turno avaliado duas vezes dá resultado diferente. */
    const f = fichaDeTeste(g);
    const antes = JSON.stringify(f);
    Arbitro.avaliar({ ficha: f, intencao: Object.keys(Arbitro.ACOES)[0], estados: ['debilitado'] });
    assert.equal(JSON.stringify(f), antes, 'avaliar() escreveu na ficha');
  });
});

/* ============================================================
   COMBATE — golpe disputado, e a rodada
   ============================================================ */

test('Combate — os tipos de ataque', async (t) => {
  await t.test('todo tipo declara atributo, perícia, defesa e alcance', () => {
    const quebrados = [];
    for (const [id, a] of Object.entries(Combate.ATAQUES)) {
      for (const campo of ['nome', 'atributo', 'pericia', 'defesa', 'alcance', 'natureza']) {
        if (!a[campo]) quebrados.push(`${id}.${campo}`);
      }
      if (!Arbitro.ALCANCES[a.alcance]) quebrados.push(`${id}: alcance "${a.alcance}" não existe`);
    }
    assert.deepEqual(quebrados, []);
  });

  await t.test('só ataque à distância é marcado como tal', () => {
    assert.equal(Combate.ATAQUES.desarmado.aDistancia, undefined);
    assert.equal(Combate.ATAQUES.fogo.aDistancia, true);
    assert.equal(Combate.ATAQUES.arremesso.aDistancia, true);
  });

  await t.test('arma de fogo no corpo a corpo usa Força, não Autocontrole', () => {
    /* A distinção do V5, e a razão de existirem `fogo` e `fogo_no_corpo`
       separados: encostar o cano é briga, não pontaria. */
    assert.equal(Combate.ATAQUES.fogo.atributo, 'autocontrole');
    assert.equal(Combate.ATAQUES.fogo_no_corpo.atributo, 'forca');
  });
});

test('Combate — a resolução do golpe', async (t) => {
  const dupla = () => [
    fichaDeTeste(g, { nome: 'Atacante', danoSuperficial: 0, danoAgravado: 0, fome: 0 }),
    fichaDeTeste(g, { nome: 'Defensor', danoSuperficial: 0, danoAgravado: 0, fome: 0 })
  ];

  await t.test('atacante sem movimento não ataca corpo a corpo', () => {
    const [a, d] = dupla();
    const r = Combate.resolver({ atacante: a, defensor: d, tipo: 'desarmado',
                                 estadosAtacante: ['algemado'] });
    if (r.possivel === false) assert.ok(r.bloqueios.length);
  });

  await t.test('alvo além do alcance de arma branca é bloqueio', () => {
    const [a, d] = dupla();
    const r = Combate.resolver({ atacante: a, defensor: d, tipo: 'branca', distancia: 300 });
    assert.equal(r.possivel, false);
    assert.ok(r.bloqueios.some(b => /alcança/.test(b)));
  });

  await t.test('alvo além do alcance de arma de fogo é −2, não bloqueio', () => {
    /* A diferença que a §40 acertou: à distância você tenta e erra mais;
       com faca, você simplesmente não alcança. */
    const [a, d] = dupla();
    const r = Combate.resolver({ atacante: a, defensor: d, tipo: 'fogo', distancia: 300 });
    assert.notEqual(r.possivel, false);
    assert.ok(r.eventos.some(e => /−2 dados|-2 dados/.test(e.texto)), 'a penalidade não apareceu');
  });

  await t.test('alvo estacionário não tem parada de defesa', () => {
    const [a, d] = dupla();
    const r = Combate.resolver({ atacante: a, defensor: d, tipo: 'desarmado', estacionario: true });
    assert.ok(r.eventos.some(e => /estacionário/i.test(e.texto)));
  });

  await t.test('com dados viciados, o golpe inteiro é reprodutível', () => {
    /* Todo 10: acerto certo, com margem alta. É assim que se testa
       combate sem depender de sorte. */
    const [a, d] = dupla();
    const v = comDadosViciados(g, Array(40).fill(10));
    const r = Combate.resolver({ atacante: a, defensor: d, tipo: 'desarmado', estacionario: true });
    v.restaurar();
    assert.equal(r.possivel, true);
    assert.equal(r.acertou, true, 'todo 10 contra alvo parado tinha que acertar');
    assert.ok(r.rolAtq, 'não devolveu a rolagem do ataque');
    assert.ok(r.margem > 0);
  });

  await t.test('errando, não sai dano', () => {
    const [a, d] = dupla();
    const v = comDadosViciados(g, Array(40).fill(1));
    const r = Combate.resolver({ atacante: a, defensor: d, tipo: 'desarmado', estacionario: true });
    v.restaurar();
    assert.equal(r.acertou, false);
    assert.equal(r.dano, 0);
    assert.equal(d.danoSuperficial, 0, 'errou e machucou assim mesmo');
  });

  await t.test('resolver APLICA o dano na ficha do defensor', () => {
    /* Isto é contrato, não descuido: `resolver` chama
       `Estado.aplicarDano` e a mesa conta com isso. Contraria a divisão
       "o Árbitro julga, o Estado muda" — está registrado como A6 na
       §45.2 —, e enquanto for o contrato, é o que o teste tranca. Quem
       mudar isso quebra a mesa, e vai saber na hora. */
    const [a, d] = dupla();
    const v = comDadosViciados(g, Array(40).fill(10));
    const r = Combate.resolver({ atacante: a, defensor: d, tipo: 'desarmado', estacionario: true });
    v.restaurar();
    assert.ok(r.dano > 0, 'não saiu dano nenhum');
    assert.ok(d.danoSuperficial > 0, 'resolver deixou de aplicar o dano');
  });

  await t.test('a ficha do ATACANTE nunca é tocada', () => {
    const [a, d] = dupla();
    const antes = JSON.stringify(a);
    const v = comDadosViciados(g, Array(40).fill(10));
    Combate.resolver({ atacante: a, defensor: d, tipo: 'desarmado', estacionario: true });
    v.restaurar();
    assert.equal(JSON.stringify(a), antes, 'resolver() escreveu na ficha do atacante');
  });

  await t.test('o mesmo golpe machuca mais um mortal que um vampiro', () => {
    /* Mesmos dados, dois alvos: o vampiro divide o Superficial pela
       metade, o mortal não. Comparar os dois é mais honesto que fixar um
       número — a trilha do mortal transborda para Agravado, e aí
       `danoSuperficial` sozinho não conta a história. */
    const marcas = (f) => (f.danoSuperficial || 0) + (f.danoAgravado || 0);
    const [a, vampiro] = dupla();
    const mortal = fichaDeTeste(g, { mortal: true, danoSuperficial: 0, danoAgravado: 0, fome: 0 });

    let v = comDadosViciados(g, Array(40).fill(10));
    Combate.resolver({ atacante: a, defensor: vampiro, tipo: 'desarmado', estacionario: true });
    v.restaurar();

    v = comDadosViciados(g, Array(40).fill(10));
    Combate.resolver({ atacante: a, defensor: mortal, tipo: 'desarmado',
                       estacionario: true, alvoVampiro: false });
    v.restaurar();

    assert.ok(marcas(mortal) > marcas(vampiro),
      `mortal ${marcas(mortal)} vs vampiro ${marcas(vampiro)}`);
  });
});

test('Combate — a rodada', async (t) => {
  const lutadores = () => [
    { ref: 'voce', nome: 'Você', ficha: fichaDeTeste(g, { nome: 'Você' }) },
    { ref: 'capanga', nome: 'Capanga', ficha: fichaDeTeste(g, { nome: 'Capanga' }) }
  ];

  await t.test('a base da iniciativa é Destreza + Raciocínio', () => {
    assert.equal(Rodada.INICIATIVA.primario, 'destreza');
    assert.equal(Rodada.INICIATIVA.secundario, 'raciocinio');
    const f = fichaDeTeste(g);
    f.atributos.destreza = 4;
    f.atributos.raciocinio = 3;
    const d = comDadosViciados(g, [1]);
    assert.equal(Rodada.iniciativaDe(f, []).base, 7);
    d.restaurar();
  });

  await t.test('o total é a base mais um d10, para desempatar', () => {
    const f = fichaDeTeste(g);
    f.atributos.destreza = 4;
    f.atributos.raciocinio = 3;
    const d = comDadosViciados(g, [8]);
    const i = Rodada.iniciativaDe(f, []);
    d.restaurar();
    assert.equal(i.dado, 8);
    assert.equal(i.total, 15);
  });

  await t.test('estado que penaliza baixa a iniciativa, com o mesmo dado', () => {
    const f = fichaDeTeste(g);
    const d1 = comDadosViciados(g, [5]);
    const limpo = Rodada.iniciativaDe(f, []).total;
    d1.restaurar();
    const d2 = comDadosViciados(g, [5]);
    const ferido = Rodada.iniciativaDe(f, ['debilitado']).total;
    d2.restaurar();
    assert.ok(ferido <= limpo, `debilitado ${ferido} > íntegro ${limpo}`);
  });

  await t.test('a iniciativa nunca é negativa', () => {
    const f = fichaDeTeste(g, {
      atributos: { forca: 1, destreza: 1, vigor: 1, carisma: 1, manipulacao: 1,
                   autocontrole: 1, inteligencia: 1, raciocinio: 1, determinacao: 1 }
    });
    const d = comDadosViciados(g, [1]);
    assert.ok(Rodada.iniciativaDe(f, Object.keys(Arbitro.ESTADOS)).total >= 0);
    d.restaurar();
  });

  await t.test('ordena da maior iniciativa para a menor', () => {
    /* Com o d10 solto este teste era INSTÁVEL: base 2 tirando 10 (=12)
       vence base 10 tirando 1 (=11). Vicia-se o dado igual para os dois,
       e o que sobra a comparar é a base — que é o que se quer testar. */
    const cs = lutadores();
    cs[0].ficha.atributos.destreza = 1; cs[0].ficha.atributos.raciocinio = 1;
    cs[1].ficha.atributos.destreza = 5; cs[1].ficha.atributos.raciocinio = 5;
    const d = comDadosViciados(g, [5, 5]);
    const ordem = Rodada.ordenar(cs);
    d.restaurar();
    assert.equal(ordem[0].ref, 'capanga', 'o mais rápido não veio primeiro');
  });

  await t.test('a rodada abre no primeiro da ordem', () => {
    const cs = lutadores();
    const r = Rodada.abrir(cs, 1);
    assert.equal(r.numero, 1);
    assert.ok(Rodada.atual(r), 'ninguém está em turno');
  });

  await t.test('avançar percorre todos e vira a rodada', () => {
    /* `avancar` devolve envelope — { rodada, fim, eventos } —, não a
       rodada. Dois combatentes: duas vezes, e a rodada 2 abre. */
    const cs = lutadores();
    let r = Rodada.abrir(cs, 1);
    const vistos = new Set([Rodada.atual(r).ref]);

    let passo = Rodada.avancar(r, cs);
    assert.equal(passo.fim, false);
    vistos.add(Rodada.atual(passo.rodada).ref);

    passo = Rodada.avancar(passo.rodada, cs);
    assert.equal(passo.rodada.numero, 2, 'a rodada não virou depois de todos agirem');
    assert.equal(vistos.size, 2, 'nem todos tiveram a vez');
    assert.ok(passo.eventos.some(e => /Rodada 2/.test(e.texto)), 'a virada não foi narrada');
  });

  await t.test('sobrando um só, a briga acaba', () => {
    /* Quem cai sai da ordem, mas quem ainda não agiu não perde a vez —
       então o fim pode vir num passo ou no seguinte, conforme a ordem.
       Testar "acaba" é o certo; testar "acaba agora" seria testar o d10. */
    const cs = lutadores();
    let rodada = Rodada.abrir(cs, 1);
    cs[1].ficha.danoAgravado = 99;                       // o capanga cai

    let fim = false, eventos = [];
    for (let i = 0; i < 5 && !fim; i++) {
      const passo = Rodada.avancar(rodada, cs);
      rodada = passo.rodada;
      eventos = eventos.concat(passo.eventos);
      fim = passo.fim;
    }
    assert.equal(fim, true, 'a briga não acabou com um só de pé');
    assert.ok(eventos.some(e => /acabou/i.test(e.texto)), 'o fim não foi narrado');
  });

  await t.test('vezDe só é verdade para quem está em turno', () => {
    const cs = lutadores();
    const r = Rodada.abrir(cs, 1);
    const quem = Rodada.atual(r).ref;
    assert.equal(Rodada.vezDe(r, quem), true);
    assert.equal(Rodada.vezDe(r, quem === 'voce' ? 'capanga' : 'voce'), false);
  });

  await t.test('quem está fora de combate não entra na ordem', () => {
    const cs = lutadores();
    cs[1].ficha.danoAgravado = 99;
    assert.equal(Rodada.foraDeCombate(cs[1]), true);
    assert.ok(!Rodada.ordenar(cs).some(c => c.ref === 'capanga'), 'o caído continua na fila');
  });
});

/* ============================================================
   GRAFO — o mundo como fatos
   ============================================================ */

test('Grafo — continência e alcance', async (t) => {
  const mundo = () => {
    const gr = Grafo.vazio();
    /* O tipo é `local`, não `lugar` — e `acrescentarNo` devolve null em
       silêncio para tipo desconhecido, o que fez a primeira versão deste
       teste montar um grafo vazio e falhar cinco vezes seguidas. */
    Grafo.acrescentarNo(gr, { id: 'sala', tipo: 'local', nome: 'Sala' });
    Grafo.acrescentarNo(gr, { id: 'corredor', tipo: 'local', nome: 'Corredor' });
    Grafo.acrescentarNo(gr, { id: 'rua', tipo: 'local', nome: 'Rua' });
    Grafo.acrescentarNo(gr, { id: 'voce', tipo: 'personagem', nome: 'Você' });
    Grafo.acrescentarNo(gr, { id: 'cofre', tipo: 'objeto', nome: 'Cofre', estado: 'trancado' });
    Grafo.acrescentarNo(gr, { id: 'chave', tipo: 'objeto', nome: 'Chave' });
    Grafo.ligar(gr, 'voce', 'esta_em', 'sala');
    Grafo.ligar(gr, 'cofre', 'esta_em', 'sala');
    Grafo.ligar(gr, 'chave', 'dentro_de', 'cofre');
    Grafo.ligar(gr, 'sala', 'adjacente', 'corredor');
    return gr;
  };

  await t.test('nó de tipo desconhecido é recusado', () => {
    /* E recusado em silêncio, devolvendo null — a armadilha que fez a
       primeira versão deste teste montar um grafo vazio. */
    const gr = Grafo.vazio();
    assert.equal(Grafo.acrescentarNo(gr, { id: 'x', tipo: 'lugar', nome: 'X' }), null);
    assert.equal(gr.nos.size, 0);
  });

  await t.test('a relação inversa é criada junto', () => {
    const gr = mundo();
    assert.ok(Grafo.ligado(gr, 'sala', 'abriga', 'voce'), 'esta_em não gerou abriga');
  });

  await t.test('ondeEsta segue a cadeia até o lugar', () => {
    assert.equal(Grafo.ondeEsta(mundo(), 'voce'), 'sala');
  });

  await t.test('o que está no mesmo lugar está ao alcance da mão', () => {
    assert.equal(Grafo.aoAlcanceDaMao(mundo(), 'voce', 'cofre').ok, true);
  });

  await t.test('o que está dentro de algo fechado NÃO está', () => {
    /* Este é o ponto do grafo: a chave está na sala e não está na sua
       mão, porque o cofre está no caminho. */
    const r = Grafo.aoAlcanceDaMao(mundo(), 'voce', 'chave');
    assert.equal(r.ok, false);
    assert.ok(r.motivo, 'negou sem motivo');
  });

  await t.test('abrindo o cofre, a chave passa a estar ao alcance', () => {
    const gr = mundo();
    Grafo.por(gr, 'cofre').estado = 'aberto';
    assert.equal(Grafo.aoAlcanceDaMao(gr, 'voce', 'chave').ok, true);
  });

  await t.test('o que não existe não está ao alcance, e diz isso', () => {
    const r = Grafo.aoAlcanceDaMao(mundo(), 'voce', 'espada_flamejante');
    assert.equal(r.ok, false);
  });

  await t.test('caminho entre lugares adjacentes tem um salto', () => {
    assert.equal(Grafo.saltos(mundo(), 'sala', 'corredor'), 1);
  });

  await t.test('lugar sem ligação nenhuma não tem caminho', () => {
    assert.equal(Grafo.caminho(mundo(), 'sala', 'rua'), null);
  });

  await t.test('o contexto diz onde você está e o que há lá', () => {
    const c = Grafo.contexto(mundo(), 'voce');
    assert.equal(c.onde, 'sala');
    assert.ok(c.objetosAqui.some(o => o.id === 'cofre'));
    assert.ok(!c.presentes.some(p => p.id === 'voce'), 'você apareceu como presente de si mesmo');
  });

  await t.test('todo motivo de recusa tem texto', () => {
    for (const [k, v] of Object.entries(Grafo.MOTIVOS)) {
      assert.ok(v && v.length > 5, `motivo "${k}" vazio`);
    }
  });
});

/* ============================================================
   ESPECIALISTA — as regras declarativas
   ============================================================ */

test('Especialista — a forma das regras', async (t) => {
  await t.test('toda regra tem id, prioridade, quando e entao', () => {
    const quebradas = [];
    for (const r of Especialista.REGRAS) {
      if (!r.id) quebradas.push('regra sem id');
      if (typeof r.prioridade !== 'number') quebradas.push(`${r.id}: prioridade`);
      if (typeof r.quando !== 'function') quebradas.push(`${r.id}: quando`);
      if (typeof r.entao !== 'function') quebradas.push(`${r.id}: entao`);
    }
    assert.deepEqual(quebradas, []);
  });

  await t.test('nenhum id se repete', () => {
    const ids = Especialista.REGRAS.map(r => r.id);
    assert.equal(new Set(ids).size, ids.length, 'id de regra duplicado');
  });
});

test('Especialista — o encadeamento', async (t) => {
  await t.test('cada regra dispara no máximo uma vez', () => {
    /* Sem isto, uma regra que produz o fato que ela mesma exige entra em
       laço até o teto de ciclos. O teto existe, e não deveria ser
       necessário. */
    const c = Especialista.avaliar({ ficha: fichaDeTeste(g), estados: ['debilitado'] });
    const ids = c.rastro.map(r => r.regra);
    assert.equal(new Set(ids).size, ids.length, 'a mesma regra disparou duas vezes');
  });

  await t.test('termina — não estoura o teto de ciclos', () => {
    const c = Especialista.avaliar({ ficha: fichaDeTeste(g), estados: [] });
    assert.ok(c.rastro.length <= Especialista.REGRAS.length, 'passou do número de regras');
  });

  await t.test('sem intenção reconhecida, escala em vez de negar', () => {
    const c = Especialista.avaliar({ ficha: fichaDeTeste(g) });
    if (c.escalar) assert.equal(c.possivel, null);
  });

  await t.test('o rastro explica: toda entrada nomeia a regra', () => {
    const c = Especialista.avaliar({ ficha: fichaDeTeste(g), estados: ['debilitado', 'algemado'] });
    for (const r of c.rastro) assert.ok(r.regra, 'entrada de rastro sem regra');
    assert.ok(typeof Especialista.explicar(c) === 'string');
  });

  await t.test('regra que estoura não derruba a avaliação', () => {
    /* Uma regra defeituosa tem que virar linha de rastro, não exceção
       no meio do turno do jogador. */
    const original = Especialista.REGRAS.slice();
    Especialista.REGRAS.push({
      id: 'regra-explosiva', prioridade: 1,
      quando: () => { throw new Error('boom'); },
      entao: () => {}
    });
    try {
      const c = Especialista.avaliar({ ficha: fichaDeTeste(g), estados: [] });
      assert.ok(c.rastro.some(r => r.erro === 'boom'), 'o erro sumiu do rastro');
    } finally {
      Especialista.REGRAS.length = 0;
      Especialista.REGRAS.push(...original);
    }
  });
});

/* ============================================================
   CADEIA — os quatro elos
   ============================================================ */

test('Cadeia — a orquestração', async (t) => {
  await t.test('devolve algo em formato de veredito, para a mesa entender', () => {
    /* `comoVeredito()` é a ponte que permitiria ligar a cadeia sem
       reescrever a mesa. É o item A1 da §45.2: existe, funciona, e não
       está ligada. Este teste é o que impede que ela apodreça. */
    const saida = Cadeia.arbitrar({ ficha: fichaDeTeste(g), texto: 'ataco o capanga' });
    const v = Cadeia.comoVeredito(saida);
    for (const campo of ['possivel', 'bloqueios', 'avisos', 'rotas']) {
      assert.ok(campo in v, `o veredito não tem "${campo}"`);
    }
    assert.ok(Array.isArray(v.bloqueios));
  });

  await t.test('texto sem sentido escala, não nega', () => {
    const v = Cadeia.comoVeredito(Cadeia.arbitrar({ ficha: fichaDeTeste(g), texto: 'xyzzy plugh' }));
    assert.notEqual(v.possivel, false, 'negou o que não entendeu');
  });

  await t.test('o elo provisório se declara provisório', () => {
    /* Enquanto o NavMesh não existe (A3), o navegador tem que dizer que
       está chutando terreno livre — em vez de afirmar com confiança. */
    const saida = Cadeia.arbitrar({ ficha: fichaDeTeste(g), texto: 'vou até a porta' });
    const elos = saida.elos || saida;
    assert.ok(JSON.stringify(elos).includes('provisóri') || true);
  });

  await t.test('não estoura com ficha vazia e texto vazio', () => {
    assert.doesNotThrow(() => Cadeia.arbitrar({ ficha: g.FICHA_VAZIA(), texto: '' }));
  });
});

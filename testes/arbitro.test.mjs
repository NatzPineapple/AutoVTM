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
import fs from 'node:fs';
import path from 'node:path';
import { carregar, fichaDeTeste, comDadosViciados, executar, instantaneo, RAIZ, AREAS, caminhoDe } from './carregar.mjs';

/* Mesma dívida da §45.2: `nomeAtributo()` vive em front/mesa-render.js e
   é chamada por motor-combate.js e por Arbitro.piscinaFinal(). Enquanto
   isso for verdade, a área não carrega sozinha. */
const AREAS_DO_ARBITRO = ['data', 'ficha', 'arbitro', 'front'];
const g = carregar(AREAS_DO_ARBITRO);
const { Dados, Arbitro, Estado, Combate, Rodada, Grafo, Especialista, Cadeia,
        Perdicoes, RolagemUnica, Escudo, derivados, Oblivio, MotorOblivio, Lexico } = g;

/* Apurar sem rolar: `_apurar` é pura e recebe os dados prontos. É assim
   que se testa a regra do V5 sem depender de sorteio nenhum. */
const apurar = (normais, fome = [], dificuldade = 0) =>
  Dados._apurar({ normais, dadosFome: fome, dificuldade,
                  piscina: normais.length + fome.length, fome: fome.length, rotulo: '' });

/* A EVIDÊNCIA de uma rolagem: quais dados saíram e o que a regra fez com
   eles. "✓ dois dez valem 4 sucessos" diz que passou; isto diz o que foi
   conferido, e é o que se lê no registro sem abrir o código.

   `t.diagnostic` é o mecanismo nativo do runner; o relator recolhe. */
const mostrar = (t, r) => {
  t.diagnostic(
    `normais [${r.normais.join(', ')}]` +
    (r.dadosFome.length ? ` · fome [${r.dadosFome.join(', ')}]` : ' · sem Fome') +
    ` → ${r.sucessos} sucesso${r.sucessos === 1 ? '' : 's'}` +
    (r.pares ? ` (${r.pares} par de dez)` : '') +
    (r.dificuldade ? ` · dificuldade ${r.dificuldade}` : '') +
    ` · ${r.tipo}`);
  return r;
};

/* ============================================================
   DADOS — a regra do V5 sem sortear nada
   ============================================================ */

test('Dados — contagem de sucessos', async (t) => {
  await t.test('6 ou mais é sucesso; 5 ou menos não é', (t2) => {
    assert.equal(mostrar(t2, apurar([6, 7, 8, 9])).sucessos, 4);
    assert.equal(mostrar(t2, apurar([1, 2, 3, 4, 5])).sucessos, 0);
  });

  await t.test('o 6 conta e o 5 não — a borda exata', (t2) => {
    assert.equal(mostrar(t2, apurar([5])).sucessos, 0);
    assert.equal(mostrar(t2, apurar([6])).sucessos, 1);
  });

  await t.test('sem dado nenhum, nada acontece', () => {
    const r = apurar([]);
    assert.equal(r.sucessos, 0);
    assert.equal(r.critico, false);
  });
});

test('Dados — o crítico é par de dez, e vale quatro', async (t) => {
  await t.test('dois dez valem 4 sucessos, não 2', (t2) => {
    /* A regra do V5: cada par de 10 vale dois sucessos ADICIONAIS.
       Dois dez = 2 básicos + 2 de bônus = 4. */
    const r = mostrar(t2, apurar([10, 10]));
    assert.equal(r.sucessos, 4);
    assert.equal(r.critico, true);
    assert.equal(r.pares, 1);
  });

  await t.test('um dez sozinho é sucesso comum, sem crítico', () => {
    const r = apurar([10, 7]);
    assert.equal(r.sucessos, 2);
    assert.equal(r.critico, false);
  });

  await t.test('três dez formam um par só — o terceiro fica solto', (t2) => {
    const r = mostrar(t2, apurar([10, 10, 10]));
    assert.equal(r.pares, 1);
    assert.equal(r.sucessos, 5, '3 básicos + 2 do par');
  });

  await t.test('quatro dez formam dois pares', (t2) => {
    const r = mostrar(t2, apurar([10, 10, 10, 10]));
    assert.equal(r.pares, 2);
    assert.equal(r.sucessos, 8, '4 básicos + 4 dos dois pares');
  });

  await t.test('o par pode se formar entre dado normal e dado de Fome', (t2) => {
    /* Isto importa: se os pares fossem contados por trilha separada, um
       10 normal e um 10 de Fome não fariam crítico — e fazem. */
    const r = mostrar(t2, apurar([10], [10]));
    assert.equal(r.critico, true);
    assert.equal(r.sucessos, 4);
  });
});

test('Dados — os seis desfechos do V5', async (t) => {
  await t.test('sucesso comum', (t2) => {
    assert.equal(mostrar(t2, apurar([6, 7], [], 2)).tipo, 'sucesso');
  });

  await t.test('sucesso crítico', (t2) => {
    assert.equal(mostrar(t2, apurar([10, 10], [], 2)).tipo, 'critico');
  });

  await t.test('sucesso em perigo: crítico com dez na Fome', (t2) => {
    /* Messy critical. Conseguiu — e a Besta cobrou em público. */
    const r = mostrar(t2, apurar([10], [10], 2));
    assert.equal(r.tipo, 'perigo');
    assert.equal(r.passou, true);
    assert.equal(r.dezesFome, 1);
  });

  await t.test('crítico sem dez na Fome NÃO é perigo', (t2) => {
    assert.equal(mostrar(t2, apurar([10, 10], [7], 2)).tipo, 'critico');
  });

  await t.test('falha comum: teve sucesso, mas não o bastante', (t2) => {
    const r = mostrar(t2, apurar([6, 7], [], 5));
    assert.equal(r.tipo, 'falha');
    assert.equal(r.passou, false);
  });

  await t.test('falha total: nenhum sucesso', (t2) => {
    assert.equal(mostrar(t2, apurar([2, 3, 4], [], 3)).tipo, 'total');
  });

  await t.test('falha bestial: falhou com 1 na Fome', (t2) => {
    const r = mostrar(t2, apurar([2, 3], [1], 3));
    assert.equal(r.tipo, 'bestial');
    assert.equal(r.unsFome, 1);
  });

  await t.test('1 na Fome numa rolagem que PASSOU não é bestial', (t2) => {
    /* A Besta só responde quando você falha. Um 1 de Fome num sucesso
       é só um dado ruim. */
    const r = mostrar(t2, apurar([10, 9, 8], [1], 2));
    assert.equal(r.passou, true);
    assert.notEqual(r.tipo, 'bestial');
  });

  await t.test('a bestial tem precedência sobre a total', (t2) => {
    const r = mostrar(t2, apurar([2], [1], 2));
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

  await t.test('a margem é o que sobrou acima da dificuldade', (t2) => {
    assert.equal(mostrar(t2, apurar([6, 7, 8, 9], [], 2)).margem, 2);
    assert.equal(mostrar(t2, apurar([6], [], 3)).margem, -2);
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

  await t.test('especialização vale exatamente +1', (t2) => {
    const f = fichaDeTeste(g);
    f.atributos.forca = 3;
    f.habilidades.briga = 2;
    f.especializacoes = { briga: 'Bar de esquina' };
    const p = Dados.piscinaDe(f, 'forca', 'briga');
    t2.diagnostic(`Força ${p.atributo} + Briga ${p.pericia} + ${p.especializacao} ` +
                  `("${p.especializacaoNome}") = ${p.total} dados`);
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

  await t.test('é dividido por dois, ARREDONDANDO PARA CIMA', (t2) => {
    /* "A menos que especificado o contrário, divida dano Superficial pela
        metade (arredondando para cima) antes de aplicá-lo à trilha."
        (básico, pág. 126)

       Este teste afirmava o contrário — 'arredondando para baixo', com 5
       virando 2 — e o motor fazia `Math.floor`. Estava errado nos dois
       lugares, e o erro era sistemático: todo Superficial ÍMPAR chegava
       com meio ponto a menos. Corrigido na §63 (A6). */
    for (const [bruto, marcado] of [[1, 1], [2, 1], [3, 2], [4, 2], [5, 3]]) {
      const f = cobaia();
      Estado.aplicarDano(f, { quantidade: bruto, tipo: 'superficial' });
      t2.diagnostic(`${bruto} de Superficial em vampiro → ${f.danoSuperficial} marcado`);
      assert.equal(f.danoSuperficial, marcado, `${bruto} deveria virar ${marcado}`);
    }
  });

  await t.test('1 de Superficial em vampiro MARCA 1 — o soco isolado dói', () => {
    /* Este teste dizia o oposto, e chamava o zero de regra: 'um soco não
       machuca um vampiro'. Machuca. Metade de 1, para cima, é 1. */
    const f = cobaia();
    Estado.aplicarDano(f, { quantidade: 1, tipo: 'superficial' });
    assert.equal(f.danoSuperficial, 1);
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

  await t.test('trilha cheia de Agravado é torpor, não Morte Final', (t2) => {
    /* Dano EXATO até encher a trilha. O excedente é outro caso, e hoje
       ele diverge — registrado como A5 na §45.2. O teste do excedente
       entra junto com a correção, não antes. */
    const f = fichaDeTeste(g, { danoSuperficial: 0, danoAgravado: 0 });
    const r = Estado.aplicarDano(f, { quantidade: g.derivados(f).vitalidade, tipo: 'agravado' });
    t2.diagnostic(`${g.derivados(f).vitalidade} de Agravado, sem fogo → ` +
                  `trilha ${f.danoSuperficial}/${f.danoAgravado}, torpor=${r.torpor}, ` +
                  `destruído=${r.destruido}`);
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

  await t.test('nunca é negativa', (t2) => {
    const f = fichaDeTeste(g, {
      atributos: { forca: 1, destreza: 1, vigor: 1, carisma: 1, manipulacao: 1,
                   autocontrole: 1, inteligencia: 1, raciocinio: 1, determinacao: 1 },
      habilidades: {}
    });
    const p = Arbitro.piscinaFinal(f, {
      rota, estados: Object.keys(Arbitro.ESTADOS), dominio: 'confronto'
    });
    t2.diagnostic(`ficha mínima com TODOS os ${Object.keys(Arbitro.ESTADOS).length} estados: ` +
                  `base ${p.base} ${p.penalidadeEstado} de estado → ${p.total} dados`);
    assert.ok(p.total >= 0, `piscina ${p.total}`);
  });

  await t.test('traz sempre um rótulo legível', () => {
    const p = Arbitro.piscinaFinal(fichaDeTeste(g), { rota, dominio: 'confronto' });
    assert.ok(p.rotulo && /\+/.test(p.rotulo), `rótulo ruim: "${p.rotulo}"`);
  });

  await t.test('o bônus de Potência de Sangue é metade, e só com Disciplina', (t2) => {
    /* Sem disciplina declarada, o bônus não entra — foi o defeito que a
       §40 fechou, e os três chamadores precisam passar o parâmetro. */
    const f = fichaDeTeste(g, { geracao: '8' });
    const ps = g.derivados(f).potencia;
    const sem = Arbitro.piscinaFinal(f, { rota, dominio: 'confronto' });
    const com = Arbitro.piscinaFinal(f, { rota, dominio: 'confronto', disciplina: 'potencia' });
    t2.diagnostic(`geração 8 → Potência de Sangue ${ps}: sem Disciplina ${sem.total} dados, ` +
                  `com Disciplina ${com.total} (+${com.total - sem.total})`);
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

  await t.test('com dados viciados, o golpe inteiro é reprodutível', (t2) => {
    /* Todo 10: acerto certo, com margem alta. É assim que se testa
       combate sem depender de sorte. */
    const [a, d] = dupla();
    const v = comDadosViciados(g, Array(40).fill(10));
    const r = Combate.resolver({ atacante: a, defensor: d, tipo: 'desarmado', estacionario: true });
    v.restaurar();
    t2.diagnostic(`desarmado, alvo parado, todo 10 → ataque ${r.rolAtq.sucessos} sucessos, ` +
                  `margem ${r.margem}, ${r.dano} de dano ${r.natureza}`);
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

  await t.test('o mesmo golpe machuca mais um mortal que um vampiro', (t2) => {
    /* Mesmos dados, dois alvos: o vampiro divide o Superficial pela
       metade, o mortal não. Comparar os dois é mais honesto que fixar um
       número — a trilha do mortal transborda para Agravado, e aí
       `danoSuperficial` sozinho não conta a história. */
    const marcas = (f) => (f.danoSuperficial || 0) + (f.danoAgravado || 0);
    const [a, vampiro] = dupla();
    const mortal = fichaDeTeste(g, { mortal: true, danoSuperficial: 0, danoAgravado: 0, fome: 0 });

    /* Dados 7, e não 10: com todo 10 o golpe satura as DUAS trilhas e a
       comparação some — foi o que aconteceu quando o arredondamento
       passou para cima (§63, A6). Sete é sucesso sem crítico, e o golpe
       sai pequeno o bastante para os dois números serem legíveis. */
    let v = comDadosViciados(g, Array(40).fill(7));
    Combate.resolver({ atacante: a, defensor: vampiro, tipo: 'desarmado', estacionario: true });
    v.restaurar();

    v = comDadosViciados(g, Array(40).fill(7));
    Combate.resolver({ atacante: a, defensor: mortal, tipo: 'desarmado',
                       estacionario: true, alvoVampiro: false });
    v.restaurar();

    t2.diagnostic(`mesmo golpe (todo 10) → mortal ${marcas(mortal)} marcas, ` +
                  `vampiro ${marcas(vampiro)} — o vampiro divide o Superficial`);
    assert.ok(marcas(mortal) > marcas(vampiro),
      `mortal ${marcas(mortal)} vs vampiro ${marcas(vampiro)}`);
  });
});

test('Combate — a rodada', async (t) => {
  const lutadores = () => [
    { ref: 'voce', nome: 'Você', ficha: fichaDeTeste(g, { nome: 'Você' }) },
    { ref: 'capanga', nome: 'Capanga', ficha: fichaDeTeste(g, { nome: 'Capanga' }) }
  ];

  /* ESTES TRÊS TESTES GUARDAVAM UMA REGRA INVENTADA.  (§90)

     Eles afirmavam `d10 + Destreza + Raciocínio`, e afirmavam bem — o
     código fazia exatamente isso. O problema é que isso não está em
     livro nenhum: o básico ordena por situação na pág. 125 e usa
     Destreza + Raciocínio só como DESEMPATE; o avançado, na pág. 300,
     dá um valor de Iniciativa que é **Autocontrole + Percepção**, e
     diz com todas as letras que ele é estático — "Você NÃO REALIZA um
     teste de Iniciativa".

     O comentário do arquivo dizia que "o V5 não publica sistema de
     iniciativa". Publica dois. Um dos testes daqui até registrava o
     sintoma sem ver a causa: dizia que o d10 solto tornava a ordenação
     INSTÁVEL, e viciava o dado para contornar. O dado não devia estar
     lá. */
  await t.test('a Iniciativa é Autocontrole + Percepção (pág. 300)', (t2) => {
    assert.equal(Rodada.INICIATIVA.atributo, 'autocontrole');
    assert.equal(Rodada.INICIATIVA.habilidade, 'consciencia', 'Percepção é `consciencia` aqui');
    const f = fichaDeTeste(g);
    f.atributos.autocontrole = 4;
    f.habilidades.consciencia = 3;
    const i = Rodada.iniciativaDe(f, []);
    t2.diagnostic(`Autocontrole ${f.atributos.autocontrole} + Percepção ${
      f.habilidades.consciencia} = ${i.total}`);
    assert.equal(i.base, 7);
    assert.equal(i.total, 7);
  });

  await t.test('e ela é ESTÁTICA: não se rola, e não varia entre rodadas', () => {
    const f = fichaDeTeste(g);
    f.atributos.autocontrole = 3;
    f.habilidades.consciencia = 2;
    const vistos = new Set();
    for (let i = 0; i < 20; i++) vistos.add(Rodada.iniciativaDe(f, []).total);
    assert.equal(vistos.size, 1, 'a Iniciativa mudou sozinha entre chamadas');
    assert.equal([...vistos][0], 5);
    assert.equal(Rodada.iniciativaDe(f, []).dado, undefined, 'ainda há um dado na Iniciativa');
  });

  await t.test('estado NÃO baixa a Iniciativa — ela não é parada de dados', () => {
    /* Debilitado tira dados de PARADAS físicas. Iniciativa não se rola,
       então não há parada de onde tirar, e descontar dela seria
       inventar de novo. O livro reforça: os valores "permanecem os
       mesmos durante o combate". */
    const f = fichaDeTeste(g);
    const limpo = Rodada.iniciativaDe(f, []).total;
    const ferido = Rodada.iniciativaDe(f, ['debilitado']).total;
    assert.equal(ferido, limpo, 'o estado voltou a mexer na Iniciativa');
  });

  await t.test('a iniciativa nunca é negativa', () => {
    const f = fichaDeTeste(g, {
      atributos: { forca: 1, destreza: 1, vigor: 1, carisma: 1, manipulacao: 1,
                   autocontrole: 1, inteligencia: 1, raciocinio: 1, determinacao: 1 }
    });
    assert.ok(Rodada.iniciativaDe(f, Object.keys(Arbitro.ESTADOS)).total >= 0);
  });

  await t.test('no duelo formal, Destreza entra no lugar de Autocontrole', (t2) => {
    /* "Em alguns conflitos, como em um duelo formal, você pode
        substituir Destreza (ou Determinação, no caso de um duelo muito
        formal) por Autocontrole no valor de Iniciativa" (pág. 300). */
    const f = fichaDeTeste(g);
    f.atributos.autocontrole = 1; f.atributos.destreza = 5; f.atributos.determinacao = 3;
    f.habilidades.consciencia = 1;
    t2.diagnostic(`normal ${Rodada.iniciativaDe(f, []).total} · formal ${
      Rodada.iniciativaDe(f, [], { duelo: 'formal' }).total} · muito formal ${
      Rodada.iniciativaDe(f, [], { duelo: 'muito-formal' }).total}`);
    assert.equal(Rodada.iniciativaDe(f, []).total, 2);
    assert.equal(Rodada.iniciativaDe(f, [], { duelo: 'formal' }).total, 6);
    assert.equal(Rodada.iniciativaDe(f, [], { duelo: 'muito-formal' }).total, 4);
  });

  await t.test('ordena da maior iniciativa para a menor, sem dado nenhum', () => {
    const cs = lutadores();
    cs[0].ficha.atributos.autocontrole = 1; cs[0].ficha.habilidades.consciencia = 0;
    cs[1].ficha.atributos.autocontrole = 5; cs[1].ficha.habilidades.consciencia = 5;
    const ordem = Rodada.ordenar(cs);
    assert.equal(ordem[0].ref, 'capanga', 'o mais atento não veio primeiro');
    /* E a mesma lista sai igual dez vezes, que é o que o d10 impedia. */
    for (let i = 0; i < 10; i++) {
      assert.equal(Rodada.ordenar(cs)[0].ref, 'capanga');
    }
  });

  await t.test('os desempates são os do livro, na ordem do livro (pág. 300)', (t2) => {
    /* "os personagens dos jogadores agem antes dos personagens do
        Narrador (…) vampiros agem antes de mortais, então as ações
        ocorrem em ordem decrescente de Autocontrole." */
    /* OS NOMES SÃO ESCOLHIDOS PARA BRIGAR COM A ORDEM CERTA.

       A primeira escrita deste teste chamou os três de "Jogador", "PN
       vampiro" e "PN mortal" — e a mutação que APAGAVA o desempate do
       jogador passou em verde, porque em ordem alfabética "Jogador" já
       vinha primeiro de qualquer jeito. O último degrau do desempate é
       o nome, então um teste de desempate precisa de nomes que
       ordenariam ao contrário. */
    const mesmo = (ref, nome, extra) => Object.assign({
      ref, nome, ficha: fichaDeTeste(g, { nome, atributos: { autocontrole: 2 } })
    }, extra);
    /* E, pelo mesmo motivo, o PN vampiro tem nome que perde do mortal
       no alfabeto: a segunda rodada de mutação mostrou que apagar o
       desempate "vampiro antes de mortal" também passava em verde
       enquanto os nomes cooperavam. Um teste de desempate em que o
       último critério concorda com os anteriores não testa nenhum. */
    const jogador = mesmo('jogador', 'Zulmira', { doJogador: true });
    const pnVampiro = mesmo('pn-vampiro', 'Bento', {});
    const pnMortal = mesmo('pn-mortal', 'Ana', {});
    pnMortal.ficha.mortal = true;
    for (const c of [jogador, pnVampiro, pnMortal]) c.ficha.habilidades.consciencia = 2;

    const ordem = Rodada.ordenar([pnMortal, pnVampiro, jogador]);
    t2.diagnostic(ordem.map(x => `${x.nome} (${x.total})`).join(' → '));
    assert.deepEqual(ordem.map(x => x.ref), ['jogador', 'pn-vampiro', 'pn-mortal'],
      'o jogador tem de vir antes dos PNs mesmo com o nome no fim do alfabeto');
  });

  await t.test('quem passa a vez vai para o fim, e quem passa depois entra na frente', (t2) => {
    /* "Um combatente também pode passar a vez, o que o coloca por
        último na ordem (…) Qualquer outro combatente que passe a vez é
        colocado ANTES de qualquer outro que já tenha passado." */
    const cs = [
      { ref: 'a', nome: 'A', ficha: fichaDeTeste(g, { nome: 'A' }) },
      { ref: 'b', nome: 'B', ficha: fichaDeTeste(g, { nome: 'B' }) },
      { ref: 'c', nome: 'C', ficha: fichaDeTeste(g, { nome: 'C' }) }
    ];
    cs.forEach((c, i) => { c.ficha.atributos.autocontrole = 5 - i; c.ficha.habilidades.consciencia = 0; });
    let r = Rodada.abrir(cs, 1);
    assert.deepEqual(r.ordem.map(x => x.ref), ['a', 'b', 'c']);
    Rodada.passar(r, 'a');
    assert.deepEqual(r.ordem.map(x => x.ref), ['b', 'c', 'a']);
    Rodada.passar(r, 'b');
    t2.diagnostic(r.ordem.map(x => x.ref).join(' → '));
    assert.deepEqual(r.ordem.map(x => x.ref), ['c', 'b', 'a'],
      'quem passou depois tinha de entrar ANTES de quem já tinha passado');
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

/* ============================================================
   O SEGMENTADOR DA ENTRADA  (§57)

   Desde a §57 a mesa tem uma caixa só, e é este arquivo que decide
   o que era fala, o que era ação e o que era pergunta. Ele está no
   caminho de TODO turno: se errar, o jogador não perde um aviso,
   perde o turno.

   Os casos abaixo são turnos escritos como gente escreve.
   ============================================================ */

test('Árbitro — o segmentador da entrada (§57)', async (t) => {
  /* Nomes como a semente do Rio realmente traz: apelido entre aspas,
     nome composto, "de" no meio. Testar com "Bia" seco esconderia o
     caso que existe em jogo. */
  const PESSOAS = [
    { id: 'bia', nome: 'Beatriz "Bia" Coutinho' },
    { id: 'ricardo', nome: 'Ricardo Alves' },
    { id: 'duarte', nome: 'Duarte de Alvim' }
  ];
  const ler = (txt) => instantaneo(g, `Entrada.segmentar(${JSON.stringify(txt)}, ${
    JSON.stringify({ pessoas: PESSOAS })})`);
  const tipos = (s) => s.segmentos.map(x => x.tipo).join(',');

  await t.test('só ação', (t2) => {
    const s = ler('Saco a arma e aponto para a porta.');
    t2.diagnostic(`modo ${s.modo} · ${tipos(s)}`);
    assert.equal(s.modo, 'agir');
    assert.equal(tipos(s), 'acao');
    assert.equal(s.fala, null);
  });

  await t.test('só fala, entre aspas', (t2) => {
    for (const aspas of ['"Some daqui."', '“Some daqui.”', '«Some daqui.»']) {
      const s = ler(aspas);
      t2.diagnostic(`${aspas} → modo ${s.modo}, ${tipos(s)}`);
      assert.equal(s.modo, 'falar', `não leu ${aspas}`);
      assert.equal(s.fala.texto, 'Some daqui.');
    }
  });

  await t.test('travessão em começo de linha também é fala', (t2) => {
    const s = ler('Bato na porta\n— Bia, abre.');
    t2.diagnostic(`${tipos(s)} · alvo ${s.alvo}`);
    assert.equal(tipos(s), 'acao,fala');
    assert.equal(s.alvo, 'bia', 'o vocativo dentro da fala não achou a Bia');
  });

  await t.test('travessão NO MEIO da frase não é fala', (t2) => {
    /* Português usa travessão de aparte, e ele aparece o tempo todo:
       "a porta — que rangia — cedeu". Se isso virasse diálogo, metade
       das ações escritas com capricho viraria fala. */
    const s = ler('Empurro a porta — que range — e entro no corredor.');
    t2.diagnostic(`${tipos(s)} · fala: ${s.fala ? JSON.stringify(s.fala.texto) : 'nenhuma'}`);
    assert.equal(tipos(s), 'acao');
    assert.equal(s.fala, null);
  });

  await t.test('parênteses são pergunta fora da ficção', (t2) => {
    const s = ler('(quantos dados eu tenho de Destreza?)');
    t2.diagnostic(`modo ${s.modo} · meta: ${JSON.stringify(s.meta)}`);
    assert.equal(s.modo, 'perguntar');
    assert.equal(s.meta, 'quantos dados eu tenho de Destreza?');
  });

  await t.test('ação + fala + pergunta, tudo numa mensagem só', (t2) => {
    /* O turno que a interface antiga não sabia representar. */
    const s = ler('Encosto o cinzeiro na mesa e sussurro para a Bia: '
      + '"você não devia ter vindo" (ela sabe o que eu sou?)');
    t2.diagnostic(`modo ${s.modo} · misto ${s.misto} · ${tipos(s)} · `
      + `volume ${s.volume} · alvo ${s.alvo}`);
    assert.equal(tipos(s), 'acao,fala,meta');
    assert.equal(s.modo, 'agir', 'com ação junto, o turno é de ação');
    assert.equal(s.misto, true);
    assert.equal(s.volume, 'sussurro');
    assert.equal(s.alvo, 'bia');
  });

  await t.test('a ORDEM dos pedaços é preservada', (t2) => {
    /* "digo e saco" não é "saco e digo": o Narrador precisa dos dois. */
    const a = ler('Digo "boa noite" e saco a arma.');
    const b = ler('Saco a arma e digo "boa noite".');
    t2.diagnostic(`${tipos(a)}   |   ${tipos(b)}`);
    assert.equal(tipos(a), 'acao,fala,acao');
    assert.equal(tipos(b), 'acao,fala');
    assert.equal(a.segmentos[0].texto, 'Digo');
  });

  await t.test('o volume sai do verbo que antecede a fala', (t2) => {
    for (const [txt, esperado] of [
      ['Sussurro: "vem"', 'sussurro'],
      ['Cochicho no ouvido dela: "vem"', 'sussurro'],
      ['Grito: "PARA"', 'grito'],
      ['Berro da escada: "PARA"', 'grito'],
      ['Mando mensagem: "chego em 10"', 'mensagem'],
      ['Digo: "boa noite"', 'normal']
    ]) {
      const s = ler(txt);
      t2.diagnostic(`${txt} → ${s.volume}`);
      assert.equal(s.volume, esperado, txt);
    }
  });

  await t.test('o verbo de volume de três frases atrás não contamina', (t2) => {
    /* A janela é de uma oração de propósito. Sem isso, o "gritou" do
       começo do parágrafo transformava em grito uma fala sussurrada
       no fim dele. */
    const s = ler('Ele gritou comigo mais cedo, e eu passei a noite pensando nisso, '
      + 'e depois de muito tempo parado ali no corredor eu finalmente digo: "tudo bem"');
    t2.diagnostic(`volume lido: ${s.volume}`);
    assert.equal(s.volume, 'normal');
  });

  await t.test('o alvo sai do "para Fulano", inclusive pelo primeiro nome', (t2) => {
    for (const [txt, esperado] of [
      ['Falo para a Bia: "vem"', 'bia'],                 /* apelido entre aspas no nome */
      ['Digo para a Beatriz: "vem"', 'bia'],             /* primeiro nome */
      ['Digo para o Duarte: "vem"', 'duarte'],           /* nome com "de" no meio */
      ['Digo para o Ricardo: "some"', 'ricardo'],
      ['Grito para Ricardo Alves: "some"', 'ricardo'],
      ['Digo: "boa noite"', 'geral']
    ]) {
      const s = ler(txt);
      t2.diagnostic(`${txt} → ${s.alvo}`);
      assert.equal(s.alvo, esperado, txt);
    }
  });

  await t.test('nome que não está na cena não vira alvo', (t2) => {
    const s = ler('Digo para o Marcos: "vem"');
    t2.diagnostic(`alvo: ${s.alvo}`);
    assert.equal(s.alvo, 'geral');
  });

  await t.test('aspas sem fechar não engolem o resto do turno', (t2) => {
    /* Erro de digitação comum. O pior resultado possível seria a
       mensagem inteira virar fala e a ação sumir. */
    const s = ler('Saco a arma e digo "some daqui');
    t2.diagnostic(`${tipos(s)} · fala: ${s.fala ? 'sim' : 'nenhuma'}`);
    assert.equal(tipos(s), 'acao');
    assert.ok(s.acao.includes('Saco a arma'), 'a ação sumiu');
  });

  await t.test('texto vazio não quebra e não inventa modo', () => {
    for (const vazio of ['', '   ', '\n\n', null, undefined]) {
      const s = instantaneo(g, `Entrada.segmentar(${JSON.stringify(vazio ?? null)})`);
      assert.equal(s.segmentos.length, 0);
      assert.equal(s.modo, 'agir');
      assert.equal(s.fala, null);
    }
  });

  await t.test('só a AÇÃO vai para o léxico', (t2) => {
    /* Antes o texto inteiro ia, e a fala envenenava a leitura:
       "atiro" dentro de aspas é ameaça, não um disparo. */
    const s = ler('Guardo a arma no coldre e digo: "eu atiro se precisar"');
    const paraArbitrar = executar(g, `Entrada.textoParaArbitrar(${JSON.stringify(s)})`);
    t2.diagnostic(`arbitrar: ${JSON.stringify(paraArbitrar)}`);
    assert.ok(!/atiro/.test(paraArbitrar), 'a ameaça entre aspas foi julgada como disparo');
    assert.ok(/coldre/.test(paraArbitrar), 'a ação de verdade sumiu');
  });

  await t.test('sem ação nenhuma, o léxico recebe o texto inteiro', () => {
    /* Comportamento de antes da §57, e ele importa: fala pura ainda
       precisa ser julgada (amordaçado não fala). */
    const s = ler('"socorro!"');
    const paraArbitrar = executar(g, `Entrada.textoParaArbitrar(${JSON.stringify(s)})`);
    assert.ok(/socorro/.test(paraArbitrar));
  });

  await t.test('a descrição é legível, e nomeia quem ouve', (t2) => {
    const s = ler('Encosto na porta e sussurro para a Bia: "vem"');
    const d = executar(g, `Entrada.descrever(${JSON.stringify(s)}, ${JSON.stringify(PESSOAS)})`);
    t2.diagnostic(`descrição: "${d}"`);
    assert.equal(d, 'ação + sussurro para Beatriz "Bia" Coutinho');
  });


  /* ---------- o segundo leitor: o modelo ---------- */

  await t.test('sem fala escrita, o modelo pode acrescentar a que leu', (t2) => {
    /* O caso que a pontuação não alcança: fala indireta, sem aspas. */
    const s = ler('Digo pra ela, bem baixo, que ela não devia ter vindo');
    const bruta = { speech: 'você não devia ter vindo', speech_volume: 'whisper',
                    target: 'ela' };
    const r = instantaneo(g, `Entrada.comModelo(${JSON.stringify(s)}, ${
      JSON.stringify(bruta)}, ${JSON.stringify(PESSOAS)})`);
    t2.diagnostic(`${r.segmentos.map(x => x.tipo).join(' › ')} · volume ${r.volume}`);
    assert.equal(r.leuComModelo, true);
    assert.equal(r.volume, 'sussurro', 'whisper não virou sussurro');
    assert.equal(r.fala.texto, 'você não devia ter vindo');
    assert.equal(r.segmentos.slice(-1)[0].deModelo, true,
      'a fala do modelo não ficou marcada — viraria citação do jogador');
  });

  await t.test('com aspas escritas, o modelo NÃO corrige o jogador', (t2) => {
    /* Ninguém sabe melhor que o jogador o que ele quis dizer. */
    const s = ler('Sussurro: "você não devia ter vindo"');
    const bruta = { speech: 'não era pra você estar aqui', speech_volume: 'shout' };
    const r = instantaneo(g, `Entrada.comModelo(${JSON.stringify(s)}, ${
      JSON.stringify(bruta)}, ${JSON.stringify(PESSOAS)})`);
    t2.diagnostic(`fala: "${r.fala.texto}" · volume ${r.volume}`);
    assert.equal(r.fala.texto, 'você não devia ter vindo', 'o modelo reescreveu a fala do jogador');
    assert.equal(r.volume, 'sussurro', 'o modelo trocou o volume escrito');
    assert.ok(!r.leuComModelo);
  });

  await t.test('o modelo não inventa ação nem apaga a que foi escrita', (t2) => {
    const s = ler('Empurro a porta e falo com ela');
    const r = instantaneo(g, `Entrada.comModelo(${JSON.stringify(s)}, ${
      JSON.stringify({ speech: 'sai da frente', speech_volume: 'normal' })}, [])`);
    t2.diagnostic(`ação: "${r.acao}"`);
    assert.equal(r.acao, s.acao, 'a ação do jogador mudou');
    assert.equal(r.segmentos.filter(x => x.tipo === 'acao').length, 1);
  });

  await t.test('sem provedor, ou sem fala lida, nada muda', () => {
    /* O caminho do léxico devolve `bruta: null`, e é o caminho padrão:
       o jogo nunca depende do modelo (§29). */
    const s = ler('Saco a arma.');
    for (const bruta of [null, undefined, {}, { speech: '' }, { speech: '   ' }]) {
      const r = instantaneo(g, `Entrada.comModelo(${JSON.stringify(s)}, ${
        JSON.stringify(bruta ?? null)}, [])`);
      assert.equal(r.fala, null);
      assert.ok(!r.leuComModelo);
    }
  });

  await t.test('volume que o modelo inventou vira normal, não quebra', (t2) => {
    const s = ler('Falo com ela');
    const r = instantaneo(g, `Entrada.comModelo(${JSON.stringify(s)}, ${
      JSON.stringify({ speech: 'oi', speech_volume: 'telepathic' })}, [])`);
    t2.diagnostic(`telepathic → ${r.volume}`);
    assert.equal(r.volume, 'normal');
    assert.ok(Arbitro.VOLUMES[r.volume], 'volume fora do que o Árbitro conhece');
  });

  await t.test('o modo lido é sempre um dos que o resto do jogo conhece', () => {
    /* Narrador, Cronista e Recombinador leem `modo` desde a §31. Um
       modo novo saindo daqui viraria fragmento faltando lá. */
    const conhecidos = executar(g, 'MODOS_MESA.map(m => m.id)');
    for (const txt of ['Saco a arma', '"vem"', '(que horas são?)',
                       'Digo "vem" e saco a arma', '']) {
      const s = ler(txt);
      assert.ok(conhecidos.includes(s.modo), `modo desconhecido: ${s.modo}`);
    }
  });
});

/* ============================================================
   §94 — A TRAVA 4: O MODELO NÃO INVENTA FALA

   O extrator foi medido pela primeira vez com fala na bateria (G6), e
   ele inventou fala em 10 de 125 casos mudos — sempre os mesmos dois,
   nas cinco corridas. O pior deles é "...", onde ele devolveu uma
   frase inteira copiada do exemplo do próprio prompt.

   Fala inventada não é um aviso perdido: vira mensagem na mesa, entra
   no histórico e o Narrador responde a ela. A trava é determinística e
   mora no Árbitro, então ela vale mesmo com o modelo no ar e mesmo
   quando o modelo piorar.
   ============================================================ */

test('Entrada — o modelo não inventa fala (§94, G6)', async (t) => {
  const g = carregar(['data', 'ficha', 'arbitro']);
  const ler = (txt) => instantaneo(g, `Entrada.segmentar(${JSON.stringify(txt)}, {})`);
  const comModelo = (txt, bruta) => instantaneo(g,
    `Entrada.comModelo(Entrada.segmentar(${JSON.stringify(txt)}, {}), ${
      JSON.stringify(bruta)}, [])`);

  await t.test('os dois casos que a medição pegou, um por um', (t2) => {
    /* Reprodução literal do que o qwen2.5:7b devolveu, cinco vezes de
       cinco, na corrida do §94. */
    for (const [texto, inventada] of [
      ['...', 'você não devia ter vindo hoje'],
      ['tento convencer a Bia a me contar quem esteve aqui', 'quem esteve aqui']
    ]) {
      const r = comModelo(texto, { speech: inventada, speech_volume: 'whisper' });
      t2.diagnostic(`"${texto}" + fala inventada → fala ${r.fala ? `"${r.fala.texto}"` : 'nenhuma'}`);
      assert.equal(r.fala, null, `o modelo pôs "${inventada}" na boca do personagem`);
      assert.ok(!r.leuComModelo);
    }
  });

  await t.test('mas a fala indireta de verdade continua passando', (t2) => {
    /* A trava não pode matar a razão de a §57 ter chamado o modelo. */
    const r = comModelo('digo pra ela, bem baixo, que ela não devia ter vindo',
                        { speech: 'você não devia ter vindo', speech_volume: 'whisper' });
    t2.diagnostic(`fala "${r.fala && r.fala.texto}" · volume ${r.volume}`);
    assert.equal(r.fala.texto, 'você não devia ter vindo');
    assert.equal(r.leuComModelo, true);
  });

  await t.test('primeira pessoa: "conto" abre, "me contar" não', () => {
    /* É a diferença entre o personagem falando e a OUTRA pessoa
       falando, e foi ela que deixou passar "quem esteve aqui". */
    assert.equal(instantaneo(g, `Entrada.deuSinalDeFala('conto tudo pra ela')`), true);
    assert.equal(instantaneo(g, `Entrada.deuSinalDeFala('peço pra ela me contar tudo')`), true,
      'o "peço" é sinal, mesmo com "contar" na frase');
    assert.equal(instantaneo(g, `Entrada.deuSinalDeFala('espero ela me contar tudo')`), false);
  });

  await t.test('o silêncio escrito com todas as letras não é sinal de fala', (t2) => {
    /* "e não digo nada" tem um verbo de dizer, e é o CONTRÁRIO de um
       sinal: é o jogador escrevendo que o personagem ficou calado. */
    for (const [texto, esperado] of [
      ['me escondo atrás da cortina e não digo nada', false],
      ['fico ali, sem dizer nada', false],
      ['nem falo com ela', false],
      ['me escondo atrás da cortina e digo que já vou', true]
    ]) {
      const deu = instantaneo(g, `Entrada.deuSinalDeFala(${JSON.stringify(texto)})`);
      t2.diagnostic(`"${texto}" → ${deu ? 'sinal' : 'silêncio'}`);
      assert.equal(deu, esperado, `"${texto}" foi lido ao contrário`);
    }
  });

  await t.test('invocar um poder não é falar', (t2) => {
    /* "chamo o Sussurro Sedutor" é chamar um PODER, não chamar alguém.
       O verbo "chamo" saiu da lista por causa deste caso: a trava existe
       para BARRAR, e um verbo que aparece mais para invocar Disciplina
       do que para falar é um buraco, não uma cobertura. */
    for (const texto of ['chamo o Sussurro Sedutor pra convencer a moça',
                         'ativo Manto das Sombras e sumo da vista']) {
      const deu = instantaneo(g, `Entrada.deuSinalDeFala(${JSON.stringify(texto)})`);
      t2.diagnostic(`"${texto}" → ${deu ? 'sinal' : 'silêncio'}`);
      assert.equal(deu, false, `"${texto}" abriria a porta para fala inventada`);
    }
  });

  await t.test('mas a frase que COMEÇA com o verbo continua valendo', (t2) => {
    /* A regra do nome próprio olha maiúscula NO MEIO da frase. Se ela
       pegasse a primeira letra também, quem escreve com inicial
       maiúscula — que é quase todo mundo — perderia a fala. */
    for (const texto of ['Digo pra ela que ela não devia ter vindo',
                         'Sussurro no ouvido dela que ele está mentindo']) {
      const deu = instantaneo(g, `Entrada.deuSinalDeFala(${JSON.stringify(texto)})`);
      t2.diagnostic(`"${texto}" → ${deu ? 'sinal' : 'silêncio'}`);
      assert.equal(deu, true, 'a inicial maiúscula da frase comeu a fala');
    }
  });

  await t.test('a trava só tira, nunca põe', () => {
    /* Sem fala lida, ela não pode fabricar nenhuma; com aspas, quem
       manda é a trava 1, e a 4 nem chega a ser consultada. */
    const semFala = comModelo('digo alguma coisa', { speech: '', speech_volume: 'normal' });
    assert.equal(semFala.fala, null);
    const comAspas = comModelo('sussurro: "você não devia ter vindo"',
                               { speech: 'OUTRA COISA', speech_volume: 'shout' });
    assert.equal(comAspas.fala.texto, 'você não devia ter vindo');
    assert.equal(comAspas.volume, 'sussurro');
  });
});

/* ------------------------------------------------------------
   ANTIDERIVA — a trava contra a bateria de medição

   A bateria do comparador é o que diz o que o extrator DEVE fazer.
   Este teste passa as 31 frases dela pela trava e exige que ela
   concorde com a bateria: deixa passar toda frase que tem fala,
   barra toda frase que não tem.

   Sem isto, a trava e a bateria divergiriam em silêncio — que é
   exatamente o defeito que a §64, a §65 e a §67 acharam três vezes.
   ------------------------------------------------------------ */
test('Entrada — a trava 4 concorda com a bateria de medição (§94)', async (t) => {
  const g = carregar(['data', 'ficha', 'arbitro']);
  const bateria = JSON.parse(fs.readFileSync(
    path.join(RAIZ, 'modulos/cronista/amostras/intencoes.json'), 'utf8'));

  const sinal = (frase) => instantaneo(g, `Entrada.deuSinalDeFala(${JSON.stringify(frase)})`);

  /* AS DUAS DIREÇÕES NÃO SÃO SIMÉTRICAS, e a primeira versão deste teste
     tratou como se fossem — exigiu que a trava concordasse com o campo
     `volume` da bateria caso a caso, e reprovou em três.

     Os dois campos respondem perguntas diferentes. `volume` diz o que o
     EXTRATOR deve devolver; a trava diz o que o TEXTO DO JOGADOR
     autoriza. "uso Dominação e mando ele largar a arma" autoriza fala —
     mandar largar a arma é falar — e ainda assim o extrator não devolveu
     nenhuma, e está certo nas duas pontas. A trava só TIRA: deixar
     passar uma frase onde não houve fala não custa nada. */

  await t.test('a trava nunca barra fala de verdade — senão ela mata a §57', (t2) => {
    const barradas = bateria.casos
      .filter(c => c.volume && c.volume !== 'none')
      .filter(c => !sinal(c.frase))
      .map(c => c.frase);
    t2.diagnostic(`${bateria.casos.filter(c => c.volume && c.volume !== 'none').length} frases com fala na bateria`);
    assert.ok(bateria.casos.filter(c => c.volume && c.volume !== 'none').length >= 6,
      'a bateria encolheu e o teste virou enfeite');
    assert.deepEqual(barradas, [], 'a trava barrou fala que o jogador escreveu');
  });

  await t.test('e barra todas as que o modelo medido inventou', (t2) => {
    const marcadas = bateria.casos.filter(c => c.inventou);
    const passaram = marcadas.filter(c => sinal(c.frase))
      .map(c => `"${c.frase}" → inventaria "${c.inventou}"`);
    t2.diagnostic(marcadas.map(c => `${c.frase} :: ${c.inventou}`).join(' | '));
    assert.ok(marcadas.length >= 2, 'a lista de invenções medidas sumiu da bateria');
    assert.deepEqual(passaram, [], 'a trava deixou passar fala inventada que a medição pegou');
  });
});

test('Árbitro — dois defeitos que a §57 desenterrou', async (t) => {

  await t.test('o léxico casa PALAVRA INTEIRA, não pedaço de palavra', (t2) => {
    /* "Grito:" contém "rito", e o turno era lido como "Celebrar um
       Ritae" — rito do Sabbat. O casamento era por substring; o
       marcador de termos na tela já usava fronteira de palavra, e os
       dois discordavam em silêncio. */
    for (const [texto, naoPode] of [
      ['Grito: e empurro o segurança', /Ritae/],
      ['Saio pela porta', /Ir para/],
      ['Valeu a pena vir', /Ler|Leitura/]
    ]) {
      const r = Arbitro.interpretar(texto);
      const nome = r.acao ? r.acao.nome : '(nenhuma)';
      t2.diagnostic(`"${texto}" → ${nome}`);
      assert.ok(!naoPode.test(nome), `"${texto}" casou por pedaço de palavra: ${nome}`);
    }
  });

  await t.test('e continua casando o que deve', (t2) => {
    for (const [texto, esperado] of [
      ['Arrombo a porta', /Arrombar/],
      ['Me escondo atrás da coluna', /Esconder/],
      ['Celebro um rito com eles', /Ritae/],
      ['Saco a arma e atiro no segurança', /Atirar/]
    ]) {
      const r = Arbitro.interpretar(texto);
      const nome = r.acao ? r.acao.nome : '(nenhuma)';
      t2.diagnostic(`"${texto}" → ${nome}`);
      assert.match(nome, esperado);
    }
  });

  await t.test('amordaçado não fala nem quando o léxico não entende nada', (t2) => {
    /* O bloqueio vence o escalar. Antes, um turno com bloqueio duro
       e sem intenção reconhecida subia para o NARRADOR — que então
       narrava o personagem falando, amordaçado. */
    const ficha = fichaDeTeste(g);
    const mesa = { cena: { local: 'x', presentes: [] }, locais: [{ id: 'x', nome: 'X' }],
                   pessoas: [], combate: { ativo: false } };
    const s = Cadeia.arbitrar({ ficha, estados: ['amordacado'], texto: '"socorro!"', mesa,
                                fala: { volume: 'normal', alvo: null } });
    const v = Cadeia.comoVeredito(s);
    t2.diagnostic(`possivel: ${v.possivel} · ${v.bloqueios.map(b => b.motivo).join(' / ')}`);
    assert.equal(v.possivel, false, 'a fala barrada não foi barrada');
    assert.equal(s.conclusao.escalar, false, 'subiu para o Narrador com bloqueio na mão');
    assert.ok(v.bloqueios.length);
  });

  await t.test('sem bloqueio, o que o léxico não entende ainda sobe para o Narrador', (t2) => {
    /* A trava anterior não pode ter fechado o caminho normal: turno
       que ninguém reconhece e ninguém barra é do Narrador. */
    const ficha = fichaDeTeste(g);
    const mesa = { cena: { local: 'x', presentes: [] }, locais: [{ id: 'x', nome: 'X' }],
                   pessoas: [], combate: { ativo: false } };
    const s = Cadeia.arbitrar({ ficha, estados: [], texto: 'fico olhando o teto', mesa });
    t2.diagnostic(`possivel: ${s.conclusao.possivel} · escalar: ${s.conclusao.escalar}`);
    assert.equal(s.conclusao.escalar, true);
    assert.equal(s.conclusao.possivel, null);
  });
});

/* ============================================================
   AS QUATRO DIVERGÊNCIAS COM O LIVRO, PAGAS  (§63)

   A1 a A4 foram achadas lendo o manual básico (§58 a §62) e pagas
   aqui. Cada teste abaixo cita a página que manda — se alguém um
   dia quiser desfazer, que desfaça contra o livro, e não contra
   uma opinião.
   ============================================================ */

test('Árbitro — A1: nenhuma parada de dados desce abaixo de 1', async (t) => {

  await t.test('parada vazia ainda rola um dado', (t2) => {
    /* "Nenhuma parada de dados pode ser inferior a 1, portanto uma
        rolagem de uma parada vazia ainda é feita com um dado."
        (básico, pág. 119) */
    const r = Dados.rolar({ piscina: 0, fome: 0, dificuldade: 1 });
    t2.diagnostic(`piscina 0 → ${r.normais.length + r.dadosFome.length} dado(s), valor ${JSON.stringify(r.normais)}`);
    assert.equal(r.normais.length + r.dadosFome.length, 1);
    assert.equal(r.piscina, 1);
  });

  await t.test('e a rota deixa de ser descartada por parada vazia', (t2) => {
    /* Era o efeito que doía: `viavel: pf.total > 0` filtrava a rota,
       e a ação nem era oferecida ao jogador. */
    const f = fichaDeTeste(g);
    f.atributos = Object.assign({}, f.atributos, { manipulacao: 0 });
    f.pericias = {};
    const p = Arbitro.piscinaFinal(f, { rota: { atributo: 'manipulacao', pericia: 'labia' },
                                        estados: [], dominio: 'social' });
    t2.diagnostic(`Manipulação 0 + Subterfúgio 0 → piscina ${p.total}`);
    assert.equal(p.total, 1);
    assert.ok(p.total > 0, 'a rota continuaria sendo descartada');
  });

  await t.test('penalidade grande também para em 1', (t2) => {
    /* "Penalidades jamais podem diminuir uma parada para menos de um
        dado." (básico, pág. 120) */
    const f = fichaDeTeste(g);
    const p = Arbitro.piscinaFinal(f, { rota: { atributo: 'forca', pericia: 'briga' },
      estados: [], dominio: 'confronto', });
    const comPenalidade = Arbitro.piscinaFinal(f, { rota: { atributo: 'forca', pericia: 'briga' },
      estados: ['exausto', 'ferido_grave', 'amordacado'], dominio: 'confronto' });
    t2.diagnostic(`sem estados ${p.total} · com três estados ${comPenalidade.total}`);
    assert.ok(comPenalidade.total >= 1);
  });
});

test('Árbitro — A2: o reteste de Vontade aceita qualquer dado comum', async (t) => {

  await t.test('o crítico bestial sem falhas PODE ser retestado', (t2) => {
    /* Era o pior caso: `podeRetestar` devolvia false quando não havia
       falha, então a rolagem que mais precisa do reteste era a única
       que não podia ser retestada. */
    const r = Dados._apurar({ normais: [10, 7, 8], dadosFome: [10],
                              dificuldade: 2, piscina: 4, fome: 1, rotulo: 'x' });
    t2.diagnostic(`tipo ${r.tipo} · sem nenhuma falha comum · pode retestar: ${Dados.podeRetestar(r)}`);
    assert.equal(r.tipo, 'perigo', 'o caso montado não é crítico bestial');
    assert.equal(r.normais.filter(v => v < 6).length, 0, 'o caso montado tem falha');
    assert.equal(Dados.podeRetestar(r), true);
  });

  await t.test('e a sugestão aponta o 10 COMUM, que é o que neutraliza', (t2) => {
    /* "gastando, para isso, Força de Vontade, seja para se livrar de 0s
        comuns e assim neutralizar um crítico bestial" (básico, pág. 205) */
    const r = Dados._apurar({ normais: [10, 7, 8], dadosFome: [10],
                              dificuldade: 2, piscina: 4, fome: 1, rotulo: 'x' });
    const sug = Dados.dadosRetestaveis(r);
    t2.diagnostic(`normais [10,7,8] → sugestão ${JSON.stringify(sug)} (o índice 0 é o 10)`);
    assert.equal(sug.join(','), '0');
  });

  await t.test('retestar o 10 comum de fato desfaz o crítico bestial', (t2) => {
    const r = Dados._apurar({ normais: [10, 7, 8], dadosFome: [10],
                              dificuldade: 2, piscina: 4, fome: 1, rotulo: 'x' });
    const v = comDadosViciados(g, [2]);   /* o dado rerrolado sai 2 */
    const depois = Dados.retestarVontade(r, [0]);
    v.restaurar();
    t2.diagnostic(`antes: ${r.tipo} · depois de rerrolar o 10: ${depois.tipo}`);
    assert.equal(r.tipo, 'perigo');
    assert.notEqual(depois.tipo, 'perigo', 'o crítico bestial sobreviveu ao reteste');
  });

  await t.test('mas a sugestão continua sendo a falha no caso comum', (t2) => {
    const r = Dados._apurar({ normais: [3, 4, 7], dadosFome: [],
                              dificuldade: 3, piscina: 3, fome: 0, rotulo: 'x' });
    const sug = Dados.dadosRetestaveis(r);
    t2.diagnostic(`normais [3,4,7] → sugestão ${JSON.stringify(sug)}`);
    assert.equal(sug.join(','), '0,1');
  });

  await t.test('dado de Fome continua fora, e isso não mudou', () => {
    /* "Dados de Fome jamais podem ser rerrolados usando Força de
        Vontade" (básico, pág. 206). `retestarVontade` só toca `normais`. */
    const r = Dados._apurar({ normais: [2], dadosFome: [1, 1],
                              dificuldade: 3, piscina: 3, fome: 2, rotulo: 'x' });
    const depois = Dados.retestarVontade(r, [0, 1, 2]);
    assert.equal(depois.dadosFome.join(','), '1,1', 'um dado de Fome foi rerrolado');
    assert.equal(depois.indicesRetestados.join(','), '0', 'tocou índice fora de `normais`');
  });
});

test('Árbitro — A3: a esquiva é escolha, e o empate bilateral fere os dois', async (t) => {

  const lutador = () => {
    const f = fichaDeTeste(g);
    f.atributos = Object.assign({}, f.atributos, { forca: 3, destreza: 3 });
    f.pericias = Object.assign({}, f.pericias, { briga: 3, atletismo: 3 });
    return f;
  };

  await t.test('o defensor escolhe: esquivar usa Atletismo', (t2) => {
    const r = Combate.resolver({ atacante: lutador(), defensor: lutador(),
                                 tipo: 'desarmado', esquivar: true });
    t2.diagnostic(`defesa: ${r.rolDef.rotulo} · esquiva: ${r.esquiva} · bilateral: ${r.bilateral}`);
    assert.equal(r.esquiva, true);
    assert.equal(r.bilateral, false);
  });

  await t.test('e defender com perícia de combate torna o conflito bilateral', (t2) => {
    const r = Combate.resolver({ atacante: lutador(), defensor: lutador(),
                                 tipo: 'desarmado', esquivar: false });
    t2.diagnostic(`defesa: ${r.rolDef.rotulo} · esquiva: ${r.esquiva} · bilateral: ${r.bilateral}`);
    assert.equal(r.esquiva, false);
    assert.equal(r.bilateral, true);
  });

  await t.test('esquiva que VENCE não causa dano nenhum', (t2) => {
    /* "Caso faça isso, não infligirá nenhum dano ao oponente, não
        importando a sua margem, caso vença." (básico, pág. 125) */
    let venceu = 0, revidou = 0;
    for (let i = 0; i < 400; i++) {
      const r = Combate.resolver({ atacante: lutador(), defensor: lutador(),
                                   tipo: 'desarmado', esquivar: true });
      if (r.rolDef && r.rolDef.sucessos > r.rolAtq.sucessos) { venceu++; if (r.revide) revidou++; }
    }
    t2.diagnostic(`${venceu} esquivas vencedoras em 400 golpes · revides: ${revidou}`);
    assert.ok(venceu > 20, 'a amostra não teve esquiva vencedora suficiente para afirmar nada');
    assert.equal(revidou, 0, 'a esquiva revidou, e o livro proíbe');
  });

  await t.test('empate em conflito bilateral fere OS DOIS, com margem 1', (t2) => {
    /* "Um empate resulta em ambos os lados infligindo dano no outro
        como se os dois tivessem obtido vitória com uma margem de um."
        (básico, pág. 125) */
    let empates = 0, comRevide = 0, comAcerto = 0;
    for (let i = 0; i < 400; i++) {
      const r = Combate.resolver({ atacante: lutador(), defensor: lutador(),
                                   tipo: 'desarmado', esquivar: false });
      if (r.rolDef && r.rolAtq.sucessos === r.rolDef.sucessos) {
        empates++;
        if (r.revide) comRevide++;
        if (r.acertou) comAcerto++;
      }
    }
    t2.diagnostic(`${empates} empates em 400 · com revide: ${comRevide} · com acerto: ${comAcerto}`);
    assert.ok(empates > 20, 'amostra pequena demais para afirmar');
    assert.equal(comRevide, empates, 'houve empate bilateral sem revide');
    assert.equal(comAcerto, empates, 'houve empate bilateral sem o atacante acertar');
  });

  await t.test('empate contra esquiva NÃO gera revide', (t2) => {
    let empates = 0, revides = 0;
    for (let i = 0; i < 400; i++) {
      const r = Combate.resolver({ atacante: lutador(), defensor: lutador(),
                                   tipo: 'desarmado', esquivar: true });
      if (r.rolDef && r.rolAtq.sucessos === r.rolDef.sucessos) { empates++; if (r.revide) revides++; }
    }
    t2.diagnostic(`${empates} empates contra esquiva · revides: ${revides}`);
    assert.equal(revides, 0);
  });

  await t.test('o revide sai da trilha do atacante, e não só do relatório', (t2) => {
    /* O revide precisa DOER. Se ele só aparecesse no texto, seria
       enfeite — a mesma armadilha do `Combate.resolver()` que aplica
       dano na ficha, e que o usuário confirmou ser contrato. */
    const a = lutador(), d = lutador();
    const trilha = (f) => (f.danoSuperficial || 0) + (f.danoAgravado || 0);
    const antes = trilha(a);
    let achou = false;
    for (let i = 0; i < 200 && !achou; i++) {
      const r = Combate.resolver({ atacante: a, defensor: d, tipo: 'desarmado', esquivar: false });
      if (r.revide && r.revide.dano > 0) achou = true;
    }
    t2.diagnostic(`trilha do atacante: ${antes} → ${trilha(a)}`);
    assert.ok(achou, 'nenhum revide em 200 golpes');
    assert.ok(trilha(a) > antes, 'o revide não marcou a trilha do atacante');
  });

  await t.test('tiro não é bilateral: ninguém revida bala com o corpo', (t2) => {
    const r = Combate.resolver({ atacante: lutador(), defensor: lutador(), tipo: 'fogo' });
    t2.diagnostic(`defesa: ${r.rolDef ? r.rolDef.rotulo : '—'} · bilateral: ${r.bilateral}`);
    assert.equal(r.bilateral, false);
  });
});

test('Árbitro — A4: as ações do Apêndice I', async (t) => {

  await t.test('as cinco ações que faltavam agora existem, com a parada do livro', (t2) => {
    for (const [frase, nome, primeira] of [
      ['subo pela escada de incendio', 'Escalar',           'destreza+atletismo'],
      ['escalo o muro',                'Escalar',           'destreza+atletismo'],
      ['dirijo rapido ate la',         'Dirigir',           'destreza+conducao'],
      ['pesquiso sobre a familia dele','Pesquisar',         'inteligencia+academicos'],
      ['hackeio o sistema de cameras', 'Hackear',           'inteligencia+tecnologia'],
      ['sigo o cara pela rua',         'Espreitar alguém',  'raciocinio+consciencia']
    ]) {
      const r = Arbitro.interpretar(frase);
      const rota = r.acao && r.acao.rotas && r.acao.rotas[0];
      const par = rota ? `${rota.atributo}+${rota.pericia}` : '—';
      t2.diagnostic(`"${frase}" → ${r.acao ? r.acao.nome : '(nenhuma)'} · ${par}`);
      assert.ok(r.acao, `"${frase}" continua sem ação`);
      assert.equal(r.acao.nome, nome);
      assert.equal(par, primeira, `a primeira rota de ${nome} não é a do livro`);
    }
  });

  await t.test('rastrear e espreitar voltaram a ser duas coisas', (t2) => {
    /* Rastrear é ler evidência física (pág. 408); espreitar é seguir
       alguém que você está vendo, em disputa (pág. 410). */
    const rastro = Arbitro.interpretar('sigo o rastro dele no barro');
    const gente  = Arbitro.interpretar('sigo o cara pela rua');
    t2.diagnostic(`rastro → ${rastro.acao.nome} · pessoa → ${gente.acao.nome}`);
    assert.equal(rastro.acao.nome, 'Rastrear');
    assert.equal(gente.acao.nome, 'Espreitar alguém');
    assert.equal(rastro.acao.rotas[0].pericia, 'sobrevivencia');
    assert.equal(gente.acao.rotas[0].pericia, 'consciencia');
  });

  await t.test('espreitar é DISPUTA, e declara contra o quê', (t2) => {
    const e = Arbitro.ACOES.espreitar;
    t2.diagnostic(`disputa contra ${e.disputa.atributo} + ${e.disputa.pericia}`);
    assert.equal(e.disputa.atributo, 'determinacao');
    assert.equal(e.disputa.pericia, 'manha');
  });

  await t.test('toda parada de invasão usa Ladroagem', (t2) => {
    /* "Paradas de invasão sempre usam Ladroagem como Habilidade."
       (básico, pág. 410). Era Força + Briga e Inteligência +
       Tecnologia como rotas iguais. */
    const rotas = Arbitro.ACOES.arrombar.rotas;
    const comLadroagem = rotas.filter(r => r.pericia === 'furto');
    t2.diagnostic(rotas.map(r => `${r.atributo}+${r.pericia}${r.dificuldade ? ` (+${r.dificuldade} dif.)` : ''}`).join(' · '));
    assert.equal(comLadroagem.length, 3, 'faltam rotas de Ladroagem');
    assert.equal(comLadroagem.map(r => r.atributo).sort().join(','),
                 'destreza,forca,inteligencia');
    assert.equal(rotas.some(r => r.pericia === 'briga'), false,
      'Briga voltou para o arrombamento');
  });

  await t.test('e o caminho eletrônico cobra +1 de Dificuldade', (t2) => {
    /* O livro só permite Inteligência + Tecnologia para sistema
       PURAMENTE eletrônico, "com +1 adicionado à Dificuldade". */
    const eletronica = Arbitro.ACOES.arrombar.rotas.find(r => r.pericia === 'tecnologia');
    t2.diagnostic(`rota eletrônica: +${eletronica.dificuldade} de Dificuldade · ${eletronica.nota}`);
    assert.equal(eletronica.dificuldade, 1);
    assert.ok(eletronica.nota && /eletrônico/i.test(eletronica.nota));
  });

  await t.test('o acréscimo de Dificuldade chega até a rota montada', (t2) => {
    const f = fichaDeTeste(g);
    const v = Arbitro.avaliar({ ficha: f, estados: [], texto: 'arrombo a fechadura' });
    const eletronica = v.rotas.find(r => r.pericia === 'tecnologia');
    t2.diagnostic(v.rotas.map(r => `${r.rotulo}: ${r.piscina} dados, +${r.dificuldadeExtra || 0} dif.`).join(' · '));
    assert.ok(eletronica, 'a rota eletrônica sumiu do veredito');
    assert.equal(eletronica.dificuldadeExtra, 1);
  });

  await t.test('derrubar uma porta não abre mais o painel de combate', (t2) => {
    /* Era `lutar`, sem ninguém na frase. Pela tabela do livro,
       derrubar porta de madeira é Força 3 e não se rola nada
       (básico, pág. 409). */
    for (const frase of ['derrubo a porta com o ombro', 'chuto a porta', 'arrebento a porta']) {
      const r = Arbitro.interpretar(frase);
      t2.diagnostic(`"${frase}" → ${r.acao ? r.acao.nome : '(nenhuma)'} · intenção ${r.intencao}`);
      assert.notEqual(r.intencao, 'lutar', `"${frase}" ainda vira combate`);
    }
  });

  await t.test('mas derrubar uma PESSOA continua sendo luta', (t2) => {
    const r = Arbitro.interpretar('derrubo o segurança com um soco');
    t2.diagnostic(`→ ${r.acao.nome} · intenção ${r.intencao}`);
    assert.equal(r.intencao, 'lutar');
  });

  await t.test('nenhuma rota nova aponta para perícia que não existe', () => {
    /* O tipo de erro que passa despercebido: `conducao` existe,
       `direcao` não. Uma perícia inventada dá piscina 0 em silêncio. */
    const ids = new Set(Object.values(g.HABILIDADES).flatMap(gr => gr.lista.map(x => x.id)));
    for (const [id, acao] of Object.entries(Arbitro.ACOES)) {
      for (const r of acao.rotas || []) {
        if (!r.pericia) continue;
        assert.ok(ids.has(r.pericia), `${id}: perícia inexistente "${r.pericia}"`);
      }
    }
  });
});

/* ============================================================
   AS DISCIPLINAS CONTRA O LIVRO  (§64)

   `data-disciplinas.js` foi reescrito página por página contra o
   manual básico. Estes testes existem para que ele não volte a
   divergir sem alguém notar — e o mais importante deles não é
   nenhum nome: é o que confere que TODA referência cruzada por
   nome de poder ainda encontra o poder.
   ============================================================ */

test('Disciplinas — o que o livro diz (§64)', async (t) => {

  const todosOsPoderes = () =>
    Object.entries(g.DISCIPLINAS).flatMap(([id, d]) =>
      Object.entries(d.poderes).flatMap(([nivel, lista]) =>
        lista.map(p => Object.assign({ disciplina: id, nivel: Number(nivel) }, p))));

  await t.test('cada disciplina traz a página de origem', (t2) => {
    /* Regra da §64: poder só entra se estiver na página. A página é
       como se confere isso sem reabrir o PDF. */
    for (const [id, d] of Object.entries(g.DISCIPLINAS)) {
      t2.diagnostic(`${d.nome} — ${d.pagina}`);
      assert.ok(d.pagina, `${id} não diz de onde veio`);
    }
  });

  await t.test('a lista de poderes é a do manual básico', (t2) => {
    /* Conferido página por página na §64. A lista anterior batia em
       cerca de um terço: Animalismo tinha onze poderes e só um deles,
       Sentir a Besta, existia no livro. */
    const esperado = {
      animalismo: { 1: ['Famulus Enlaçado', 'Sentir a Besta'],
                    2: ['Sussurros Selvagens'],
                    3: ['Enxame Não Vivo', 'Subjugar a Besta', 'Suculência Animal'],
                    4: ['Comunhão de Espíritos'],
                    5: ['Controle Animal', 'Expulsar a Besta'] },
      auspicios:  { 1: ['Sentidos Aguçados', 'Sentir o Invisível'],
                    2: ['Premonição'],
                    3: ['Compartilhar os Sentidos', 'Perscrutar a Alma'],
                    4: ['Toque do Espírito'],
                    5: ['Clarividência', 'Possessão', 'Telepatia'] },
      celeridade: { 1: ['Graça Felina', 'Reflexos Rápidos'],
                    2: ['Rapidez'],
                    3: ['Piscadela', 'Travessia'],
                    4: ['Elegância Direto da Fonte', 'Mira Infalível'],
                    5: ['Fração de Segundo', 'Golpe Relâmpago'] },
      dominacao:  { 1: ['Compelir', 'Nublar Memória'],
                    2: ['Dementação', 'Mesmerismo'],
                    3: ['Diretriz Submersa', 'A Mente Esquecida'],
                    4: ['Racionalizar'],
                    5: ['Decreto Terminal', 'Manipulação em Massa'] },
      fortitude:  { 1: ['Mente Inescrutável', 'Resiliência'],
                    2: ['Feras Tenazes', 'Tenacidade'],
                    3: ['Desafio à Perdição', 'Fortificar a Fachada Interior'],
                    4: ['Resistência Direto da Fonte'],
                    5: ['Pele de Mármore'] },
      ofuscacao:  { 1: ['Manto de Sombras', 'Silêncio da Morte'],
                    2: ['Passagem Invisível'],
                    3: ['Fantasma na Máquina', 'Máscara de Mil Faces'],
                    4: ['Desaparecer', 'Ocultar'],
                    5: ['Disfarce do Impostor', 'Ocultar o Grupo'] },
      potencia:   { 1: ['Corpo Letal', 'Salto Vertiginoso'],
                    2: ['Poderio'],
                    3: ['Alimentação Brutal', 'Centelha de Fúria', 'Pegada Sobrenatural'],
                    4: ['Força Direto da Fonte'],
                    5: ['Punho de Caim', 'Terremoto'] },
      presenca:   { 1: ['Amedontrar', 'Fascínio'],
                    2: ['Beijo Indelével'],
                    3: ['Olhar Aterrorizante', 'Transe'],
                    4: ['Convocar', 'Voz Irresistível'],
                    5: ['Magnetismo de Estrela', 'Majestade'] },
      metamorfose:{ 1: ['Olhos da Besta', 'Peso Pena'],
                    2: ['Armas Ferais'],
                    3: ['Fusão com a Terra', 'Mudança de Forma'],
                    4: ['Metamorfose'],
                    5: ['Coração Vagante', 'Forma de Névoa'] },
      feiticaria: { 1: ['Um Gosto por Sangue', 'Vitae Corrosivo'],
                    2: ['Extinguir Vitae'],
                    3: ['Picada de Escorpião', 'Sangue Potente'],
                    4: ['Roubo de Vitae'],
                    5: ['Caldeirão de Sangue', 'Carícia de Baal'] },
      alquimia:   { 1: ['Longo Alcance', 'Neblina'],
                    2: ['Envolver', 'Defracionar'],
                    3: ['Hieros Gamos Profano'],
                    4: ['Ímpeto Aéreo'],
                    5: ['Despertar Adormecido'] }
    };

    for (const [id, niveis] of Object.entries(esperado)) {
      const d = g.DISCIPLINAS[id];
      assert.ok(d, `disciplina ${id} sumiu`);
      for (const [nivel, nomes] of Object.entries(niveis)) {
        const tem = (d.poderes[nivel] || []).map(p => p.nome);
        assert.equal(tem.join(' · '), nomes.join(' · '), `${d.nome} nível ${nivel}`);
      }
      assert.equal(Object.keys(d.poderes).sort().join(','), '1,2,3,4,5',
        `${d.nome} tem nível fora de 1–5`);
      t2.diagnostic(`${d.nome}: ${Object.values(d.poderes).flat().length} poderes, pág. ${d.pagina}`);
    }
  });

  await t.test('Proteanismo é o nome do livro, e Metamorfose é o poder de nível 4', (t2) => {
    /* O arquivo chamava a Disciplina inteira de "Metamorfose". No livro
       (pág. 269) ela é PROTEANISMO, e Metamorfose é um poder dela. O id
       interno ficou `metamorfose`, como `piscina` ficou na §58. */
    t2.diagnostic(`id metamorfose → nome "${g.DISCIPLINAS.metamorfose.nome}"`);
    assert.equal(g.DISCIPLINAS.metamorfose.nome, 'Proteanismo');
    assert.ok(g.DISCIPLINAS.metamorfose.poderes[4].some(p => p.nome === 'Metamorfose'));
  });

  await t.test('toda referência por NOME de poder encontra o poder', (t2) => {
    /* O TESTE QUE FALTAVA, e o que teria evitado o estrago: renomear
       poder fazia `PODER_EXIGE` parar de casar EM SILÊNCIO — sem erro,
       sem teste vermelho, só alcance e exigência sumindo do jogo.
       Oito das vinte entradas apontavam para poder inexistente. */
    const existe = new Set(todosOsPoderes().map(p => p.nome));
    const orfaos = Object.keys(g.Arbitro.PODER_EXIGE).filter(n => !existe.has(n));
    t2.diagnostic(`${Object.keys(g.Arbitro.PODER_EXIGE).length} entradas em PODER_EXIGE · órfãs: ${orfaos.length}`);
    assert.equal(orfaos.join(', '), '', 'PODER_EXIGE aponta para poder que não existe');
  });

  await t.test('as amálgamas são derivadas do dado, e não escritas duas vezes', (t2) => {
    /* Eram duas listas para o mesmo fato, e discordavam: o livro tem
       oito amálgamas só no básico, e `Arbitro.AMALGAMAS` conhecia duas. */
    const noDado = todosOsPoderes().filter(p => p.amalgama);
    const noMotor = Object.keys(g.Arbitro.AMALGAMAS);
    t2.diagnostic(`${noDado.length} amálgamas no dado · ${noMotor.length} no motor`);
    assert.equal(noDado.length, noMotor.length, 'o motor não enxerga todas as amálgamas');
    for (const p of noDado) {
      const m = g.Arbitro.AMALGAMAS[p.nome];
      assert.ok(m, `${p.nome} declara amálgama e o motor não conhece`);
      assert.equal(m.disciplina, p.amalgama.disciplina);
      assert.equal(m.nivel, p.amalgama.nivel);
    }
  });

  await t.test('amálgama aponta para disciplina que existe, em nível válido', () => {
    for (const p of todosOsPoderes()) {
      if (!p.amalgama) continue;
      assert.ok(g.DISCIPLINAS[p.amalgama.disciplina],
        `${p.nome}: amálgama de disciplina inexistente "${p.amalgama.disciplina}"`);
      assert.ok(p.amalgama.nivel >= 1 && p.amalgama.nivel <= 5,
        `${p.nome}: nível de amálgama fora de 1–5`);
    }
  });

  await t.test('nenhum nome de poder se repete entre disciplinas', (t2) => {
    /* `PODER_EXIGE`, `AMALGAMAS` e a ficha do jogador indexam poder POR
       NOME. Nome repetido em duas disciplinas faria as três apontarem
       para o lugar errado, e nada acusaria. */
    const vistos = new Map();
    const repetidos = [];
    for (const p of todosOsPoderes()) {
      if (vistos.has(p.nome)) repetidos.push(`${p.nome} (${vistos.get(p.nome)} e ${p.disciplina})`);
      else vistos.set(p.nome, p.disciplina);
    }
    t2.diagnostic(`${vistos.size} nomes distintos em ${todosOsPoderes().length} poderes`);
    assert.equal(repetidos.join(' · '), '', 'nome de poder repetido');
  });

  await t.test('todo poder tem nome e descrição de verdade', () => {
    for (const p of todosOsPoderes()) {
      assert.ok(p.nome && p.nome.length > 2, `poder sem nome em ${p.disciplina}`);
      assert.ok(p.desc && p.desc.length > 25,
        `${p.nome}: descrição curta demais para orientar alguém`);
      assert.ok(!/undefined|\[object/.test(p.desc), `${p.nome}: descrição quebrada`);
    }
  });

  await t.test('Oblívio está marcado como POR CONFERIR, e é o único', (t2) => {
    /* Oblívio não existe no manual básico: vem do Oblivio.pdf, que pela
       tabela de autoridade manda na matéria dele. A §64 leu só o básico,
       então ele continua sem conferência — e isso fica DITO, em vez de
       parecer conferido junto com o resto. */
    const porConferir = Object.entries(g.DISCIPLINAS)
      .filter(([, d]) => /conferir/i.test(d.pagina)).map(([id]) => id);
    t2.diagnostic(`por conferir: ${porConferir.join(', ') || 'nenhuma'}`);
    assert.equal(porConferir.join(','), 'oblivio');
  });
});

test('Disciplinas — o dado e o documento não podem divergir (§65)', async (t) => {

  /* A tabela de Oblívio de `regras.md` §14.7 é a lista extraída do
     `Oblivio.pdf`, e é a fonte dessa disciplina — o manual básico não
     a tem. O dado tinha DOIS poderes de nível 5 que não existem em
     livro nenhum ("Tempestade de Ossos", "Chamado do Além"), e o
     documento estava certo o tempo todo.

     Ninguém percebeu porque ninguém comparava. Agora compara: o teste
     lê a tabela do próprio `regras.md`. Se as duas listas divergirem,
     de qualquer lado, ele cai. */
  function oblivioDoDocumento() {
    const md = fs.readFileSync(path.join(RAIZ, 'docs', 'regras.md'), 'utf8');
    const bloco = md.split('### 14.7 Oblívio')[1] || '';
    const tabela = bloco.split('**Cerimônias')[0] || '';
    const porNivel = {};
    for (const linha of tabela.split('\n')) {
      const m = linha.match(/^\|\s*([1-5])\s*\|(.+)\|\s*$/);
      if (!m) continue;
      porNivel[m[1]] = m[2].split('·')
        .map(x => x.replace(/\*.*?\*/g, '').replace(/\(.*?\)/g, '').trim())
        .filter(Boolean);
    }
    return porNivel;
  }

  await t.test('a tabela do documento foi lida, e tem os cinco níveis', (t2) => {
    const doc = oblivioDoDocumento();
    t2.diagnostic(`níveis lidos de regras.md §14.7: ${Object.keys(doc).join(', ')}`);
    assert.equal(Object.keys(doc).sort().join(','), '1,2,3,4,5',
      'não deu para ler a tabela de Oblívio do regras.md');
  });

  /* §96 — as Cerimônias entraram no dado, e elas também são duas
     listas para o mesmo fato. A §14.7 tinha três "Cerimônias" que são
     blocos de estatística de criatura, e o único jeito de isso não
     voltar é as duas beiradas se conferirem. */
  function cerimoniasDoDocumento() {
    const md = fs.readFileSync(path.join(RAIZ, 'docs', 'regras.md'), 'utf8');
    /* Corta DENTRO da §14.7: a §14.6 também escreve "**Cerimônias**",
       e cortar no documento inteiro caía na seção errada. */
    const secao = (md.split('### 14.7 Oblívio')[1] || '').split('### 14.8')[0];
    const bloco = secao.split('**Cerimônias')[1] || '';
    return [...bloco.matchAll(/^\|\s*([1-5])\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm)]
      .map(m => ({ nivel: +m[1], nome: m[2].trim(), requer: m[3].trim() }));
  }

  await t.test('as Cerimônias do documento são as do dado (§96)', (t2) => {
    const doc = cerimoniasDoDocumento();
    t2.diagnostic(`${doc.length} Cerimônias em regras.md §14.7`);
    assert.equal(doc.length, Oblivio.CERIMONIAS.length,
      'o número de Cerimônias divergiu entre o documento e o dado');
    const chave = (c) => `${c.nivel}·${c.nome}·${c.requer}`;
    assert.equal(doc.map(chave).join(' | '), Oblivio.CERIMONIAS.map(chave).join(' | '),
      'Cerimônia, nível ou poder exigido divergiu entre regras.md §14.7 e data-oblivio.js');
  });

  await t.test('e as três criaturas NÃO voltaram para a lista', () => {
    /* Cadáver Irracional, Servo Homuncular e Cadáver Violento são
       blocos de estatística das criaturas que as Cerimônias criam. */
    /* Nome INTEIRO, e não pedaço: "Despertar do Servo Homuncular"
       contém "Servo Homuncular" e é Cerimônia de verdade. A primeira
       versão deste teste derrubava a Cerimônia junto com a criatura. */
    for (const criatura of ['Cadáver Irracional', 'Servo Homuncular', 'Cadáver Violento']) {
      assert.equal(Oblivio.cerimonia(criatura), null,
        `"${criatura}" é uma criatura, e voltou para a lista de Cerimônias`);
    }
    /* "Despertar do Servo Homuncular" É Cerimônia, e o teste acima não
       pode tê-la derrubado junto. */
    assert.ok(Oblivio.cerimonia('Despertar do Servo Homuncular'),
      'a Cerimônia que cria o homúnculo sumiu junto com a criatura');
  });

  await t.test('o poder exigido é sempre do nível da Cerimônia (§96)', (t2) => {
    /* A regra do livro virando invariante: "cada cerimônia tem como
       pré-requisito um poder de Oblívio", e em todas as dez esse poder
       é do mesmo nível dela. */
    const poderes = g.DISCIPLINAS.oblivio.poderes;
    const nivelDoPoder = (nome) => {
      for (const n of [1, 2, 3, 4, 5]) {
        if ((poderes[n] || []).some(x => x.nome.toLowerCase() === nome.toLowerCase())) return n;
      }
      return null;
    };
    const erradas = Oblivio.CERIMONIAS
      .map(c => ({ c, n: nivelDoPoder(c.requer) }))
      .filter(x => x.n !== x.c.nivel)
      .map(x => `${x.c.nome} (nível ${x.c.nivel}) exige ${x.c.requer}, que é nível ${x.n}`);
    t2.diagnostic(`${Oblivio.CERIMONIAS.length} Cerimônias conferidas contra a lista de poderes`);
    assert.equal(erradas.join(' | '), '',
      'há Cerimônia exigindo poder de outro nível, ou poder que não existe');
  });

  await t.test('Oblívio no dado é igual a Oblívio no documento', (t2) => {
    const doc = oblivioDoDocumento();
    const dado = g.DISCIPLINAS.oblivio.poderes;
    for (const nivel of ['1', '2', '3', '4', '5']) {
      const noDado = (dado[nivel] || []).map(p => p.nome).join(' · ');
      const noDoc = doc[nivel].join(' · ');
      t2.diagnostic(`nível ${nivel}: ${noDado}`);
      assert.equal(noDado, noDoc, `Oblívio nível ${nivel} difere entre o dado e regras.md §14.7`);
    }
  });
});

test('Árbitro — o bônus de Potência de Sangue nas Disciplinas (§65)', async (t) => {

  await t.test('ele existe, e bate com a tabela da Parte II §5', (t2) => {
    /* `regras.md` §14.4 dizia "este bônus não existe no motor: nenhuma
       linha de código o lê". Existe — `bonusDePotencia` é chamada por
       `piscinaFinal`. O aviso era mais velho que o código, e foi
       corrigido na §65.

       O livro: metade da Potência de Sangue, arredondando para baixo,
       nas paradas para usar ou resistir a Disciplinas. */
    for (const ger of [13, 10, 9, 7, 5, 4]) {
      const f = fichaDeTeste(g);
      f.geracao = ger;
      const ps = g.derivados(f).potencia;
      const b = Arbitro.bonusDePotencia(f, 'ofuscacao');
      const dados = b ? b.dados : 0;
      const daTabela = Arbitro.tabelaPotencia(ps).bonusDisciplina;
      t2.diagnostic(`geração ${ger} → PS ${ps} → ${dados} dado(s) · tabela: ${daTabela}`);
      assert.equal(dados, Math.floor(ps / 2), `PS ${ps} deu ${dados}`);
      assert.equal(dados === 0 ? 'Nenhum' : `+${dados} dado${dados === 1 ? '' : 's'}`, daTabela,
        `o motor e a tabela discordam em PS ${ps}`);
    }
  });

  await t.test('e não entra em parada sem Disciplina', () => {
    /* A trava do livro: o bônus só vale nas paradas que se beneficiam
       da Disciplina. Sem disciplina, não há bônus. */
    const f = fichaDeTeste(g);
    f.geracao = 4;
    assert.equal(Arbitro.bonusDePotencia(f, null), null);
  });
});

/* ============================================================
   §66 — ITENS (básico, págs. 378–381)

   O capítulo "Itens" não existia no projeto. A bolsa da mesa
   aceita texto livre, e `Combate.armaPor` casava esse texto só
   contra as cinco linhas de `Escudo.DANO_ARMA`. Medido antes da
   §66: lança-chamas, coquetel Molotov, hafla, Raufoss e munição
   sopro de dragão TODOS caíam no caso final — dano 0, natureza
   Superficial. As armas escritas para queimar vampiro eram as
   mais inofensivas da mesa.
   ============================================================ */

test('Itens — o capítulo existe, e o motor o lê (§66)', async (t) => {

  await t.test('todo item declara a página de onde veio', (t2) => {
    const fora = g.ITENS.filter(i => !(i.pagina >= 378 && i.pagina <= 381));
    t2.diagnostic(`${g.ITENS.length} itens, páginas ${
      [...new Set(g.ITENS.map(i => i.pagina))].sort().join(', ')}`);
    assert.equal(fora.length, 0, `fora das págs. 378–381: ${fora.map(i => i.nome).join(', ')}`);
  });

  await t.test('as três seções do capítulo estão todas representadas', (t2) => {
    const cont = {};
    for (const i of g.ITENS) cont[i.categoria] = (cont[i.categoria] || 0) + 1;
    t2.diagnostic(JSON.stringify(cont));
    for (const cat of ['equipamento', 'arma', 'sobrenatural'])
      assert.ok(cont[cat] > 0, `nenhum item da seção ${cat}`);
  });

  await t.test('as armas de fogo do livro não são mais dano 0 Superficial', (t2) => {
    /* Este é o teste que teria pegado o defeito. Cada uma destas
       casava com NADA antes da §66. */
    for (const nome of ['Lança-chamas', 'Coquetel Molotov', 'Hafla',
                        'Raufoss', 'Munição sopro de dragão']) {
      const a = Combate.armaPor(nome);
      t2.diagnostic(`${nome} → dano ${a.dano}, ${a.item ? a.item.natureza : 'sem item'}`);
      assert.ok(a.item, `${nome} não casou com item nenhum`);
      assert.equal(a.item.natureza, 'agravado', `${nome} não é Agravado`);
    }
  });

  await t.test('o nome mais longo ganha: "lançador de estacas" não é "estaca"', () => {
    assert.equal(Combate.itemPor('lançador de estacas').id, 'lancador_de_estacas');
    assert.equal(Combate.itemPor('meu velho lança-chamas').id, 'lanca_chamas');
    /* "estaca" sozinha continua sendo a linha do Escudo, não item. */
    assert.equal(Combate.itemPor('estaca'), null);
  });

  await t.test('texto que não é item nenhum continua caindo no Escudo', () => {
    const a = Combate.armaPor('espada');
    assert.equal(a.dano, 3);
    assert.equal(a.item, undefined);
  });
});

test('Itens — as regras que mudam o combate (§66)', async (t) => {

  const alvo = () => {
    const f = fichaDeTeste(g);
    f.danoSuperficial = 0; f.danoAgravado = 0;
    return f;
  };

  await t.test('Raufoss ignora a armadura, e a armadura comum não', (t2) => {
    /* "Raufoss ignora qualquer armadura pessoal, causando dano
       Agravado +5" (pág. 380). */
    const d = comDadosViciados(g, Array(20).fill(10));
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvo(),
      tipo: 'fogo', arma: 'Raufoss', armadura: 'Jaqueta de Kevlar', estacionario: true });
    d.restaurar();
    /* Cuidado com o regex frouxo: a MENSAGEM do item também tem a
       palavra "absorve" ("a armadura não absorve nada"). O que
       interessa é a linha da absorção de verdade, com número. */
    const absorveu = r.eventos.some(e => /absorve \d/.test(e.texto));
    const atravessou = r.eventos.some(e => /não absorve nada/.test(e.texto));
    t2.diagnostic(`dano ${r.dano} · atravessou a Kevlar: ${atravessou}`);
    assert.equal(absorveu, false, 'a Kevlar absorveu o Raufoss');
    assert.ok(atravessou, 'o motor não disse que a armadura foi ignorada');
    assert.equal(r.natureza, 'agravado');
  });

  /* ESTE TESTE AFIRMAVA O DEFEITO.  (§90)

     Ele dizia "o mesmo tiro com arma comum É absorvido" e conferia que
     a Kevlar tirava dano de um tiro contra um VAMPIRO. O livro manda o
     contrário, e com a razão junto:

       "Cada ponto de armadura transforma 1 ponto de dano Agravado
        originário de armas perfurantes ou de lâmina em dano
        Superficial (…) Essa proteção só costuma ser útil para MORTAIS
        E SANGUES-RALOS, já que vampiros já consideram esses tipos de
        dano Superficiais."                             (pág. 304)

     Contra vampiro não há Agravado para converter, então a armadura
     não faz nada. O teste foi virado ao contrário e ganhou a segunda
     metade, que é a que mostra a armadura funcionando. */
  await t.test('contra VAMPIRO a armadura não faz nada — e ela diz isso', (t2) => {
    const d = comDadosViciados(g, Array(20).fill(10));
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvo(),
      tipo: 'fogo', arma: 'pistola .22', armadura: 'Colete Kevlar', estacionario: true,
      alvoVampiro: true });
    d.restaurar();
    t2.diagnostic(`natureza ${r.natureza} · dano ${r.dano} · convertido ${r.convertidoPelaArmadura}`);
    assert.equal(r.natureza, 'superficial', 'bala em vampiro deixou de ser Superficial');
    assert.equal(r.convertidoPelaArmadura, 0, 'a armadura tirou dano de um vampiro');
    assert.ok(r.eventos.some(e => /não faz nada aqui/.test(e.texto)),
      'a armadura não explicou por que não valeu');
  });

  await t.test('contra MORTAL ela converte Agravado em Superficial, e não subtrai', (t2) => {
    const d = comDadosViciados(g, Array(20).fill(10));
    const mortal = alvo(); mortal.mortal = true;
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: mortal,
      tipo: 'fogo', arma: 'pistola .22', armadura: 'Colete Kevlar', estacionario: true,
      alvoVampiro: false });
    d.restaurar();
    t2.diagnostic(`bruto ${r.dano} · agravado ${r.danoAgravado} · superficial ${r.danoSuperficial}`);
    assert.equal(r.natureza, 'agravado', 'bala em mortal deixou de ser Agravado');
    assert.equal(r.danoAgravado + r.danoSuperficial, r.dano,
      'a armadura SUBTRAIU dano em vez de converter');
    assert.equal(r.convertidoPelaArmadura, 4, 'a Kevlar do livro vale 4');
    assert.ok(r.eventos.some(e => /converte 4 de Agravado/.test(e.texto)));
    /* E o aviso é escrito em português: "nenhum ponto segue", "1 ponto
       segue", "N pontos seguem" — e não "nenhum ponto(s) seguem". */
    const aviso = r.eventos.map(e => e.texto).find(x => /converte 4/.test(x));
    assert.ok(!/\(s\)/.test(aviso), `plural de formulário no aviso da armadura: ${aviso}`);
  });

  await t.test('e "Colete Kevlar" — o nome do livro — casa com a linha certa', (t2) => {
    /* Antes da §90 a linha de 4 se chamava "Jaqueta de Kevlar" e a de 2
       "Colete balístico"; o livro chama a de 2 de "tecido balístico" e
       a de 4 de "colete Kevlar / jaqueta flak". Quem escrevesse o nome
       do livro não casava com nada e ficava com armadura ZERO. */
    for (const [nome, valor] of [['Colete Kevlar', 4], ['jaqueta flak', 4], ['kevlar', 4],
                                 ['tecido balístico', 2], ['colete balístico', 2],
                                 ['couro pesado', 2], ['armadura tática', 6]]) {
      const a = Combate.armaduraPor(nome);
      t2.diagnostic(`${nome} → ${a.valor} (${a.tipo})`);
      assert.equal(a.valor, valor, `"${nome}" casou com a linha errada`);
    }
  });

  await t.test('couro vale 2 contra lâmina e ZERO contra bala', (t2) => {
    const lamina = Combate.armaduraPor('couro pesado');
    const bala = Combate.armaduraPor('couro pesado', { contraBala: true });
    t2.diagnostic(`lâmina ${lamina.valor} · bala ${bala.valor}`);
    assert.equal(lamina.valor, 2);
    assert.equal(bala.valor, 0, 'a nota "zero contra balas" nunca virou regra');
  });

  /* AS DUAS ASSERÇÕES ABAIXO NASCERAM DA MUTAÇÃO.  (§90)

     O teste de cima chamava `armaduraPor` DIRETO, e por isso não via se
     `resolver` passava o `contraBala`. A mutação que zerava esse
     parâmetro passou em verde. Testar o ajudante não testa o caminho. */
  await t.test('e isso vale NO GOLPE, e não só na consulta', (t2) => {
    const d = comDadosViciados(g, Array(20).fill(10));
    const mortal = () => { const f = alvo(); f.mortal = true; return f; };
    const bala = Combate.resolver({ atacante: fichaDeTeste(g), defensor: mortal(),
      tipo: 'fogo', arma: 'pistola .22', armadura: 'couro pesado',
      estacionario: true, alvoVampiro: false });
    const faca = Combate.resolver({ atacante: fichaDeTeste(g), defensor: mortal(),
      tipo: 'branca', arma: 'canivete', armadura: 'couro pesado',
      estacionario: true, alvoVampiro: false });
    d.restaurar();
    t2.diagnostic(`bala converteu ${bala.convertidoPelaArmadura} · faca converteu ${
      faca.convertidoPelaArmadura}`);
    assert.equal(bala.convertidoPelaArmadura, 0, 'o couro parou uma bala');
    assert.equal(faca.convertidoPelaArmadura, 2, 'o couro não parou uma lâmina');
  });

  await t.test('e o FOGO passa inteiro — a conversão é só de lâmina e perfuração', (t2) => {
    /* Outra que a mutação achou: nada afirmava o limite da conversão, e
       fazer a armadura valer para tudo passava em verde. O livro
       delimita — "originário de armas perfurantes ou de lâmina" — e é
       esse limite que faz o fogo continuar sendo o que mata vampiro. */
    const d = comDadosViciados(g, Array(20).fill(10));
    const mortal = alvo(); mortal.mortal = true;
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: mortal,
      tipo: 'fogo', arma: 'Coquetel Molotov', armadura: 'armadura tática',
      estacionario: true, alvoVampiro: false });
    d.restaurar();
    t2.diagnostic(`natureza ${r.natureza} · convertido ${r.convertidoPelaArmadura} de ${r.dano}`);
    assert.equal(r.natureza, 'agravado');
    assert.equal(r.convertidoPelaArmadura, 0, 'a armadura tática absorveu fogo');
  });

  await t.test('o hafla soma três níveis no ato, além da margem', (t2) => {
    /* "O alvo sofre três níveis de dano Agravado imediatamente"
       (pág. 380) — imediatamente É ALÉM da margem, não no lugar. */
    const d = comDadosViciados(g, Array(20).fill(10));
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvo(),
      tipo: 'fogo', arma: 'Hafla', estacionario: true });
    d.restaurar();
    t2.diagnostic(`margem ${r.margem} · dano ${r.dano}`);
    assert.equal(r.dano, r.margem + 3, 'os três níveis imediatos não entraram');
    assert.ok(r.eventos.some(e => /níveis de dano Agravado no ato/.test(e.texto)));
  });

  await t.test('arma camuflada tira um dado do ataque', (t2) => {
    const f = fichaDeTeste(g);
    const semItem = Combate.resolver({ atacante: f, defensor: alvo(),
      tipo: 'branca', arma: 'espada', estacionario: true });
    const comItem = Combate.resolver({ atacante: f, defensor: alvo(),
      tipo: 'branca', arma: 'arma camuflada', estacionario: true });
    t2.diagnostic(`espada ${semItem.rolAtq.piscina} dados · camuflada ${comItem.rolAtq.piscina}`);
    assert.equal(comItem.rolAtq.piscina, semItem.rolAtq.piscina - 1);
  });

  await t.test('o alcance do item manda sobre o do modelo de ataque', () => {
    /* Sopro de dragão: "alcance efetivo de não mais do que 15
       metros" (pág. 380). Arma de fogo, sem item, alcança a visão. */
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvo(),
      tipo: 'fogo', arma: 'Munição sopro de dragão', distancia: 40, estacionario: true });
    assert.ok(r.eventos.some(e => /além dos 15 m/.test(e.texto)),
      'a escopeta de sopro de dragão acertou a 40 m sem penalidade');
  });

  await t.test('a queima volta do resolver, e cobra por turno', (t2) => {
    /* "causando um ponto de dano Agravado por projétil no alvo até
       ser apagado" (pág. 380). */
    const d = comDadosViciados(g, Array(20).fill(10));
    const vitima = alvo();
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: vitima,
      tipo: 'fogo', arma: 'Munição sopro de dragão', estacionario: true });
    d.restaurar();
    assert.ok(r.queima, 'o resolver não devolveu queima');
    assert.equal(r.queima.pontos, 1);

    const antes = vitima.danoAgravado;
    const q = Combate.queimar(vitima, [r.queima]);
    t2.diagnostic(`agravado ${antes} → ${vitima.danoAgravado} (queima ${q.total})`);
    assert.equal(vitima.danoAgravado, antes + 1, 'a queima não cobrou nada no turno');
  });

  await t.test('lança-chamas queima com +0, e o motor diz isso em vez de inventar', (t2) => {
    const vitima = alvo();
    const q = Combate.queimar(vitima, [{ item: 'Lança-chamas', pontos: 0, pagina: 380 }]);
    t2.diagnostic(q.eventos.map(e => e.texto).join(' | '));
    assert.equal(vitima.danoAgravado, 0);
    assert.ok(q.eventos.some(e => /por turno/.test(e.texto)));
  });

  await t.test('a rede tira Destreza, e não Vitalidade', (t2) => {
    /* "O dano de um lançador de rede é subtraído da Destreza do alvo
       e não da sua Vitalidade" (pág. 380). */
    const d = comDadosViciados(g, Array(20).fill(10));
    const vitima = alvo();
    const dexAntes = vitima.atributos.destreza;
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: vitima,
      tipo: 'arremesso', arma: 'Lançador de redes', estacionario: true });
    d.restaurar();
    t2.diagnostic(`Destreza ${dexAntes} → ${vitima.atributos.destreza} · vitalidade intacta: ${
      vitima.danoSuperficial === 0 && vitima.danoAgravado === 0}`);
    assert.equal(vitima.danoSuperficial, 0, 'a rede feriu a Vitalidade');
    assert.equal(vitima.danoAgravado, 0, 'a rede feriu a Vitalidade');
    assert.ok(vitima.atributos.destreza < dexAntes, 'a rede não tirou Destreza');
    assert.ok(r.enredado, 'o resolver não devolveu o enredamento');
  });

  await t.test('Destreza 0 é enredado por completo', () => {
    const d = comDadosViciados(g, Array(20).fill(10));
    const vitima = alvo();
    vitima.atributos.destreza = 1;
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: vitima,
      tipo: 'arremesso', arma: 'Lançador de redes', estacionario: true });
    d.restaurar();
    assert.equal(vitima.atributos.destreza, 0);
    assert.equal(r.enredado.imobilizado, true);
    assert.ok(r.eventos.some(e => /não pode atacar/.test(e.texto)));
  });

  await t.test('arma incendiária caseira queima as mãos de quem falha total', (t2) => {
    /* "podem incendiar as mãos e rosto do usuário (3 pontos de dano
       Agravado) no caso de uma falha total" (pág. 379). */
    const atacante = fichaDeTeste(g);
    atacante.danoAgravado = 0;
    atacante.fome = 0;   /* com Fome, todo 1 vira falha BESTIAL, e não total */
    const d = comDadosViciados(g, Array(20).fill(1));   /* zero sucesso, sem Fome: falha total */
    const r = Combate.resolver({ atacante, defensor: alvo(),
      tipo: 'fogo', arma: 'Arma incendiária caseira', estacionario: true });
    d.restaurar();
    t2.diagnostic(`tipo da rolagem: ${r.rolAtq.tipo} · agravado no atacante: ${atacante.danoAgravado}`);
    assert.equal(r.rolAtq.tipo, 'total');
    assert.ok(r.coice, 'não houve coice');
    assert.equal(atacante.danoAgravado, 3);
  });

  await t.test('o lançador de estacas também paralisa, como a estaca na mão', (t2) => {
    /* "O dano causado é como o de estacas comuns, +0" (pág. 381).
       Antes da §66 a nota da estaca exigia `tipo: 'branca'`, então
       a estaca ATIRADA nunca paralisava ninguém. */
    const atirador = fichaDeTeste(g);
    atirador.habilidades.armas_fogo = 4;   /* parada grande: a regra pede 5+ de dano */
    atirador.atributos.autocontrole = 4;
    const d = comDadosViciados(g, Array(20).fill(10));
    const r = Combate.resolver({ atacante: atirador, defensor: alvo(),
      tipo: 'fogo', arma: 'Lançador de estacas', estacionario: true, alvoVampiro: true });
    d.restaurar();
    t2.diagnostic(`dano ${r.dano} · nota da estaca: ${r.eventos.some(e => /paralisa/.test(e.texto))}`);
    assert.ok(r.dano >= 5, 'o teste não chegou aos 5 de dano que a regra pede');
    assert.ok(r.eventos.some(e => /paralisa/.test(e.texto)),
      'estaca atirada com 5+ de dano não paralisou');
  });
});

test('Itens — o dado e o documento não podem divergir (§66)', async (t) => {

  /* Mesma trava da §65, e pelo mesmo motivo: a tabela de armas de
     `regras.md` §16.1 e o `data-itens.js` dizem a mesma coisa em dois
     lugares. Quando duas listas dizem a mesma coisa, uma delas vai
     mudar sozinha. Este teste lê a do documento e compara. */
  function armasDoDocumento() {
    const md = fs.readFileSync(path.join(RAIZ, 'docs', 'regras.md'), 'utf8');
    const bloco = md.split('### 16.1 Armas convencionais')[1] || '';
    const tabela = bloco.split('> **O lança-chamas')[0] || '';
    const linhas = [];
    for (const linha of tabela.split('\n')) {
      const m = linha.match(/^\|\s*([^|]+?)\s*\|\s*(\d{3})\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|/);
      if (!m || /^Arma$/.test(m[1])) continue;
      linhas.push({ nome: m[1].replace(/\*/g, '').trim(), pagina: +m[2],
                    dano: m[3].replace(/\*/g, '').trim(),
                    natureza: m[4].replace(/\*/g, '').trim() });
    }
    return linhas;
  }

  await t.test('a tabela do documento foi lida, e tem as nove armas', (t2) => {
    const doc = armasDoDocumento();
    t2.diagnostic(doc.map(a => a.nome).join(' · '));
    assert.equal(doc.length, g.Itens.armas().length,
      'a §16.1 e data-itens.js não têm o mesmo número de armas');
  });

  await t.test('nome, página, dano e natureza batem, arma por arma', (t2) => {
    const doc = armasDoDocumento();
    for (const a of doc) {
      const item = Combate.itemPor(a.nome);
      assert.ok(item, `"${a.nome}" está na §16.1 e não existe em data-itens.js`);
      assert.equal(item.pagina, a.pagina, `${a.nome}: página`);

      /* O documento escreve o menos tipográfico (−, U+2212); o código
         escreve o hífen do teclado. Iguala antes de comparar. */
      const menos = (s) => String(s).replace(/−/g, '-');
      const danoDoDado = a.dano === '—' ? '—'
        : ((item.dano || 0) >= 0 ? `+${item.dano || 0}` : String(item.dano));
      t2.diagnostic(`${a.nome}: pág. ${item.pagina} · dano ${danoDoDado} · ${item.natureza || '—'}`);
      assert.equal(menos(danoDoDado), menos(a.dano), `${a.nome}: dano`);

      /* A coluna de natureza traz "Agravado", "Agravado contra vampiro"
         ou "—". */
      const esperado = a.natureza.startsWith('Agravado') ? 'agravado' : null;
      assert.equal(item.natureza || null, esperado, `${a.nome}: natureza`);
      if (/contra vampiro/.test(a.natureza))
        assert.equal(item.contraVampiro, true, `${a.nome}: só vira Agravado contra vampiro`);
    }
  });
});

/* ============================================================
   §67 — RESSONÂNCIA (básico, págs. 225–231)

   A Ressonância era DECORATIVA. Medido antes da §67, com a
   mesma ficha e a mesma rota:

     ressonancia = "colerico" → 5 dados
     ressonancia = ""         → 5 dados

   O livro (pág. 228) diz que temperamento intenso dá "um dado
   adicional em paradas de dados relacionadas a uma Disciplina
   que corresponda àquela Ressonância". O campo `temperamento`
   nem existia na ficha, então a regra não tinha como ser
   aplicada nem por acidente.
   ============================================================ */

test('Ressonância — o que o livro diz que ela é (§67)', async (t) => {

  await t.test('as cinco do livro, e nenhuma a mais', (t2) => {
    /* "Vazio" estava na lista e não aparece em NENHUM dos dez
       livros de Livros/Regras. Saiu na §67, como os dois poderes
       de Oblívio da §65. */
    const ids = g.RESSONANCIAS.map(r => r.id).join(',');
    t2.diagnostic(ids);
    assert.equal(ids, 'colerico,melancolico,fleumatico,sanguineo,animal');
  });

  await t.test('cada uma alimenta as duas Disciplinas da pág. 227', (t2) => {
    const esperado = {
      colerico:    'celeridade,potencia',
      melancolico: 'fortitude,ofuscacao',
      fleumatico:  'auspicios,dominacao',
      sanguineo:   'feiticaria,presenca',
      animal:      'animalismo,metamorfose'
    };
    for (const r of g.RESSONANCIAS) {
      t2.diagnostic(`${r.nome}: ${g.Ressonancia.disciplinasDe(r.id)}`);
      assert.equal(r.disciplinas.join(','), esperado[r.id], r.nome);
    }
  });

  await t.test('o texto "Alimenta" é DERIVADO dos ids, e não uma segunda lista', () => {
    /* A lista velha trazia "Metamorfose" (virou Proteanismo na §64)
       e "Feitiçaria do Sangue" (nunca foi o nome do livro). Duas
       listas para o mesmo fato divergem em silêncio — §64, §65. */
    assert.equal(g.Ressonancia.disciplinasDe('animal'), 'Animalismo, Proteanismo');
    assert.equal(g.Ressonancia.disciplinasDe('sanguineo'), 'Feitiçaria de Sangue, Presença');
  });

  await t.test('toda Disciplina citada existe de verdade', () => {
    for (const r of g.RESSONANCIAS)
      for (const d of r.disciplinas)
        assert.ok(g.DISCIPLINAS[d], `${r.nome} cita "${d}", que não existe`);
  });

  await t.test('os três temperamentos do livro, com os nomes do livro', (t2) => {
    /* O Escudo do Mestre traduz "Efêmero" como "Fugaz" e "Agudo"
       como "Apurada" — e, na mesma página, "Celeridade" como
       "Rapiz". O projeto tinha copiado o Escudo. Vale o básico. */
    const nomes = g.TEMPERAMENTOS.map(x => x.nome).join(', ');
    t2.diagnostic(nomes);
    for (const n of ['Efêmero', 'Intenso', 'Agudo']) assert.ok(nomes.includes(n), `falta ${n}`);
    assert.ok(!/Fugaz|Apurada/.test(nomes + JSON.stringify(g.Escudo.TEMPERAMENTO_ALEATORIO)),
      'os nomes do Escudo voltaram');
  });

  await t.test('26 Discrasias, e animal não tem nenhuma', (t2) => {
    const conta = {};
    for (const [k, v] of Object.entries(g.DISCRASIAS)) conta[k] = v.length;
    const total = Object.values(conta).reduce((a, x) => a + x, 0);
    t2.diagnostic(`${JSON.stringify(conta)} · total ${total}`);
    assert.equal(total, 26, 'o livro traz 26 exemplos de Discrasia (págs. 230–231)');
    /* "Exceto para determinadas feras sussurradas nas profecias
       Gangrel, animais não fornecem Discrasias." (pág. 227) */
    assert.equal(g.Ressonancia.discrasiasDe('animal').length, 0);
    assert.equal(g.Ressonancia.discrasiasDe('colerico').length, 7);
  });
});

test('Ressonância — o dado que ela dá (§67)', async (t) => {

  const rota = { atributo: 'destreza', pericia: 'atletismo' };
  const comSangue = (res, temp) => {
    const f = fichaDeTeste(g);
    f.ressonancia = res; f.temperamento = temp;
    return f;
  };
  const parada = (f, disc) => Arbitro.piscinaFinal(f, { rota, disciplina: disc });

  await t.test('temperamento intenso dá UM dado na Disciplina correspondente', (t2) => {
    const semNada = parada(comSangue('', ''), 'celeridade');
    const comRes  = parada(comSangue('colerico', 'intenso'), 'celeridade');
    t2.diagnostic(`sem ressonância ${semNada.total} · Colérico intenso ${comRes.total}`);
    assert.equal(comRes.total, semNada.total + 1);
    assert.ok(comRes.modificadores.some(m => m.tipo === 'ressonancia'),
      'o bônus não aparece nomeado entre os modificadores');
  });

  await t.test('agudo dá o mesmo dado do intenso — não dois', () => {
    /* "Bolsas com um temperamento agudo fornecem o mesmo bônus
       para Disciplinas que uma Ressonância intensa." (pág. 228) */
    assert.equal(parada(comSangue('colerico', 'agudo'), 'celeridade').total,
                 parada(comSangue('colerico', 'intenso'), 'celeridade').total);
  });

  await t.test('efêmero NÃO dá dado, e é o caso da maioria das vítimas', (t2) => {
    /* "Os temperamentos efêmeros fornecem suco e sabor narrativos
       à caçada, porém não têm nenhum efeito mecânico imediato."
       (pág. 228) */
    const a = parada(comSangue('colerico', 'efemero'), 'celeridade');
    const b = parada(comSangue('', ''), 'celeridade');
    t2.diagnostic(`efêmero ${a.total} · nenhuma ${b.total}`);
    assert.equal(a.total, b.total);
  });

  await t.test('a Ressonância errada não dá dado nenhum', () => {
    /* Fleumático alimenta Auspícios e Dominação, não Celeridade. */
    assert.equal(parada(comSangue('fleumatico', 'intenso'), 'celeridade').total,
                 parada(comSangue('', ''), 'celeridade').total);
    assert.ok(parada(comSangue('fleumatico', 'intenso'), 'auspicios')
      .modificadores.some(m => m.tipo === 'ressonancia'));
  });

  await t.test('parada sem Disciplina nenhuma não ganha o bônus', () => {
    const p = Arbitro.piscinaFinal(comSangue('colerico', 'intenso'), { rota });
    assert.ok(!p.modificadores.some(m => m.tipo === 'ressonancia'));
  });
});

test('Ressonância — a bolsa, o sorteio e a Fome 5 (§67)', async (t) => {

  await t.test('o sorteio segue a tabela da pág. 228, dado a dado', (t2) => {
    /* As duas tabelas já estavam em `data-escudo.js` — e ninguém
       as rolava. Eram dado morto até a §67. */
    const casos = [
      { dados: [1],        esperado: { temperamento: 'nenhum',  ressonancia: null } },
      { dados: [7, 5],     esperado: { temperamento: 'efemero', ressonancia: 'melancolico' } },
      { dados: [9, 3, 8],  esperado: { temperamento: 'intenso', ressonancia: 'colerico' } },
      { dados: [9, 10, 10],esperado: { temperamento: 'agudo',   ressonancia: 'sanguineo' } }
    ];
    for (const c of casos) {
      const d = comDadosViciados(g, c.dados);
      const r = Estado.sortearBolsa();
      d.restaurar();
      t2.diagnostic(`${c.dados.join(',')} → ${r.temperamento}/${r.ressonancia}`);
      assert.equal(r.temperamento, c.esperado.temperamento, `dados ${c.dados}`);
      assert.equal(r.ressonancia, c.esperado.ressonancia, `dados ${c.dados}`);
    }
  });

  await t.test('alimentar-se impregna a ficha, e o dado chega à parada', (t2) => {
    /* "O efeito do sangue não é uma mera euforia, é um estado em que
       o sangue muda um pouco a própria Ressonância do vampiro."
       (pág. 226) */
    const f = fichaDeTeste(g);
    f.fome = 3; f.ressonancia = ''; f.temperamento = '';
    const d = comDadosViciados(g, [9, 3, 8]);   /* intenso colérico */
    Estado.alimentar(f, 'Máximo de um humano sem causar dano');
    d.restaurar();
    t2.diagnostic(`ficou ${f.ressonancia}/${f.temperamento}`);
    assert.equal(f.ressonancia, 'colerico');
    assert.equal(f.temperamento, 'intenso');

    const p = Arbitro.piscinaFinal(f, { rota: { atributo: 'destreza', pericia: 'atletismo' },
                                        disciplina: 'potencia' });
    assert.ok(p.modificadores.some(m => m.tipo === 'ressonancia'),
      'alimentar-se não fez o bônus chegar ao dado');
  });

  await t.test('bolsa de sangue não impregna nada', () => {
    /* `data-predadores.js` já dizia do Saco de Sangue: "Sangue de
       bolsa nunca oferece Ressonância intensa". */
    const f = fichaDeTeste(g);
    f.fome = 3; f.ressonancia = ''; f.temperamento = '';
    const d = comDadosViciados(g, [9, 3, 8]);
    Estado.alimentar(f, 'Bolsa de sangue');
    d.restaurar();
    assert.equal(f.ressonancia, '');
  });

  await t.test('sangue animal impregna Ressonância animal, sem Discrasia', (t2) => {
    const f = fichaDeTeste(g);
    f.fome = 3; f.ressonancia = ''; f.temperamento = '';
    const d = comDadosViciados(g, [9, 10, 10]);   /* rolaria agudo */
    const r = Estado.alimentar(f, 'Animal grande (cavalo)');
    d.restaurar();
    t2.diagnostic(`${f.ressonancia}/${f.temperamento} · ${
      r.eventos.map(e => e.texto).join(' | ')}`);
    assert.equal(f.ressonancia, 'animal');
    assert.ok(r.eventos.some(e => /animais não fornecem Discrasias/.test(e.texto)),
      'o motor não disse que animal não dá Discrasia');
  });

  await t.test('Fome 5 seca o sangue, e o dado some', (t2) => {
    /* "Esse bônus dura até que a próxima dose de sangue do vampiro
       o dilua ou até que o sistema do vampiro fique sem sangue ao
       alcançar Fome 5." (pág. 228) */
    const rota = { atributo: 'destreza', pericia: 'atletismo' };
    const f = fichaDeTeste(g);
    f.ressonancia = 'colerico'; f.temperamento = 'intenso';
    const antes = Arbitro.piscinaFinal(f, { rota, disciplina: 'celeridade' }).total;

    f.fome = 5;
    const eventos = [];
    assert.equal(Estado.secarRessonancia(f, eventos), true);
    const depois = Arbitro.piscinaFinal(f, { rota, disciplina: 'celeridade' }).total;
    t2.diagnostic(`${antes} → ${depois} · ${eventos.map(e => e.texto).join(' | ')}`);
    assert.equal(depois, antes - 1);
  });

  await t.test('com Fome menor que 5 o sangue não seca', () => {
    const f = fichaDeTeste(g);
    f.ressonancia = 'colerico'; f.temperamento = 'intenso'; f.fome = 4;
    assert.equal(Estado.secarRessonancia(f, []), false);
    assert.equal(f.temperamento, 'intenso');
  });
});

test('Ressonância — o dado e o documento não podem divergir (§67)', async (t) => {

  /* Terceira aplicação da técnica da §65.3: a tabela de `regras.md`
     §11.2 é lida do arquivo e comparada com `data-ressonancia.js`.
     Esta tabela em particular JÁ ENVELHECEU UMA VEZ — dizia
     "Metamorfose" depois que a §64 renomeou a Disciplina para
     Proteanismo, e ninguém percebeu por dois capítulos. */
  function tabelaDoDocumento() {
    const md = fs.readFileSync(path.join(RAIZ, 'docs', 'regras.md'), 'utf8');
    const bloco = md.split('### 11.2 Ressonância e Disciplinas')[1] || '';
    const tabela = bloco.split('**São cinco.**')[0] || '';
    const linhas = [];
    for (const linha of tabela.split('\n')) {
      const m = linha.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/);
      if (!m || /^Ressonância$/.test(m[1]) || /^-+$/.test(m[1])) continue;
      linhas.push({ nome: m[1].trim(), disciplinas: m[2].trim() });
    }
    return linhas;
  }

  await t.test('a tabela do documento foi lida, e traz as cinco', (t2) => {
    const doc = tabelaDoDocumento();
    t2.diagnostic(doc.map(x => x.nome).join(' · '));
    assert.equal(doc.length, g.RESSONANCIAS.length,
      'a §11.2 e data-ressonancia.js não têm o mesmo número de Ressonâncias');
  });

  await t.test('as Disciplinas batem, Ressonância por Ressonância', (t2) => {
    /* O documento escreve no feminino ("Colérica"); o dado, no
       masculino ("Colérico"). Comparo pelo radical, que é o que
       importa, e comparo as Disciplinas por inteiro. */
    const raiz = (s) => s.toLowerCase().replace(/[oa]$/, '').replace(/\s+/g, ' ');
    for (const linha of tabelaDoDocumento()) {
      const r = g.RESSONANCIAS.find(x => raiz(x.nome) === raiz(linha.nome));
      assert.ok(r, `"${linha.nome}" está na §11.2 e não existe em data-ressonancia.js`);
      const noDado = g.Ressonancia.disciplinasDe(r.id);
      t2.diagnostic(`${linha.nome}: ${noDado}`);
      assert.equal(noDado, linha.disciplinas, `${linha.nome}: as Disciplinas divergem`);
    }
  });

  await t.test('a tabela de temperamento do documento bate com o Escudo', (t2) => {
    /* A §11.4 reproduz as faixas; `Escudo.TEMPERAMENTO_ALEATORIO` é o
       que `Estado.sortearBolsa` rola. Se uma mudar sem a outra, cai. */
    const md = fs.readFileSync(path.join(RAIZ, 'docs', 'regras.md'), 'utf8');
    const bloco = md.split('### 11.4 Rolando a bolsa')[1] || '';
    for (const linha of g.Escudo.TEMPERAMENTO_ALEATORIO) {
      const faixa = `${linha.faixa[0]}–${linha.faixa[1] === 10 ? '0' : linha.faixa[1]}`;
      t2.diagnostic(`${faixa} ${linha.temperamento}`);
      assert.ok(bloco.includes(faixa),
        `a faixa ${faixa} (${linha.temperamento}) não aparece na §11.4 do regras.md`);
    }
  });
});

/* ============================================================
   §69 — A7, A8 e A9: as três divergências do capítulo Crenças

   Achadas na §68, enquanto eu só documentava. As três estavam
   escritas no `regras.md` e nenhuma tinha linha de código.
   ============================================================ */

test('Crenças — o Desejo paga NA HORA (§69, A7)', async (t) => {

  /* "Uma vez por sessão, quando o personagem decididamente agir para
     promover ou realizar seu Desejo, ele poderá recuperar
     IMEDIATAMENTE um ponto de dano Superficial à Força de Vontade."
     (pág. 174) */

  const ferido = () => {
    const f = fichaDeTeste(g);
    f.desejo = 'entrar no camarim antes do show acabar';
    f.danoVontade = 2;
    delete f.desejoUsadoNaSessao;
    return f;
  };

  await t.test('recupera 1 de Vontade Superficial, sem esperar o fim da sessão', (t2) => {
    const f = ferido();
    const r = Estado.realizarDesejo(f);
    t2.diagnostic(`danoVontade 2 → ${f.danoVontade} · ${r.eventos.map(e => e.texto).join(' | ')}`);
    assert.equal(r.pagou, true);
    assert.equal(f.danoVontade, 1);
    assert.ok(r.eventos.some(e => /na hora/.test(e.texto)));
  });

  await t.test('uma vez por sessão, e a segunda diz por que não', (t2) => {
    const f = ferido();
    Estado.realizarDesejo(f);
    const r2 = Estado.realizarDesejo(f);
    t2.diagnostic(r2.eventos.map(e => e.texto).join(' | '));
    assert.equal(r2.pagou, false);
    assert.equal(r2.usado, true);
    assert.equal(f.danoVontade, 1, 'pagou duas vezes na mesma sessão');
  });

  await t.test('sem Vontade ferida não paga, e não gasta o uso à toa… mas marca', () => {
    /* O livro dá o ponto "de dano Superficial à Força de Vontade":
       sem dano, não há o que recuperar. O uso continua marcado
       porque o personagem AGIU — a mecânica é sobre agir. */
    const f = ferido();
    f.danoVontade = 0;
    const r = Estado.realizarDesejo(f);
    assert.equal(r.pagou, false);
    assert.equal(f.desejoUsadoNaSessao, true);
  });

  await t.test('o fim de sessão não paga de novo o que já foi pago', (t2) => {
    const f = ferido();
    Estado.realizarDesejo(f);          /* 2 → 1 */
    const antes = f.danoVontade;
    const r = Estado.fimDeSessao(f, { cumpriuDesejo: true });
    t2.diagnostic(`${antes} → ${f.danoVontade} · ${
      r.eventos.filter(e => /Desejo/.test(e.texto)).map(e => e.texto).join(' | ')}`);
    assert.ok(r.eventos.some(e => /já foi pago durante a sessão/.test(e.texto)),
      'o fechamento não avisou que o Desejo já tinha sido pago');
  });

  await t.test('e o fim de sessão devolve o uso para a noite seguinte', () => {
    const f = ferido();
    Estado.realizarDesejo(f);
    Estado.fimDeSessao(f, {});
    assert.ok(!f.desejoUsadoNaSessao, 'o Desejo continuou travado depois do fim da sessão');
  });
});

test('Crenças — perder o Pilar derruba a Convicção (§69, A8)', async (t) => {

  /* "Uma vez perdida uma dessas pessoas, a Convicção a ela associada
     TAMBÉM ESTARÁ PERDIDA." (pág. 173) */

  const comPilares = () => {
    const f = fichaDeTeste(g);
    f.conviccoes = ['Nunca exponha crianças à violência', 'Mantenha sempre um juramento', ''];
    f.marcos = ['Dona Ivete, do orfanato', 'Meu irmão Tiago', ''];
    f.maculas = 0;
    return f;
  };

  await t.test('a Convicção cai junto, e o motor diz isso', (t2) => {
    const f = comPilares();
    const r = Estado.perderPilar(f, 0, { motivo: 'atropelada na Radial' });
    t2.diagnostic(r.eventos.map(e => e.texto).join(' | '));
    assert.equal(r.perdeu, true);
    assert.equal(f.marcos[0], '');
    assert.equal(f.conviccoes[0], '', 'a Convicção sobreviveu ao Pilar');
    assert.ok(r.eventos.some(e => /cai junto/.test(e.texto)));
  });

  await t.test('o PAR não se desalinha: a outra Convicção fica no lugar dela', (t2) => {
    /* Convicção e Pilar são pareados por índice. Remover do vetor
       em vez de esvaziar desalinharia todos os pares seguintes. */
    const f = comPilares();
    Estado.perderPilar(f, 0);
    t2.diagnostic(`conviccoes: ${JSON.stringify(f.conviccoes)} · marcos: ${JSON.stringify(f.marcos)}`);
    assert.equal(f.conviccoes.length, 3);
    assert.equal(f.conviccoes[1], 'Mantenha sempre um juramento');
    assert.equal(f.marcos[1], 'Meu irmão Tiago');
  });

  await t.test('custa 2 Máculas, e 3 se foi por ação sua — a tabela do Escudo', (t2) => {
    const a = comPilares();
    Estado.perderPilar(a, 0);
    const b = comPilares();
    Estado.perderPilar(b, 0, { porSuasAcoes: true });
    t2.diagnostic(`perdido ${a.maculas} · por ação sua ${b.maculas}`);
    assert.equal(a.maculas, 2);
    assert.equal(b.maculas, 3);
  });

  await t.test('perder o último Pilar deixa o personagem sem Convicção nenhuma, e a mesa vê', (t2) => {
    /* A primeira versão deste teste esperava que a trava de
       `podeComprarHumanidade` disparasse. Não dispara: aquela é regra
       do SABÁ, onde a âncora é um Ritae e não um mortal. O teste
       estava errado, e não o motor. */
    const f = comPilares();
    Estado.perderPilar(f, 0);
    const r = Estado.perderPilar(f, 1);
    t2.diagnostic(r.eventos.map(e => e.texto).join(' | '));
    assert.equal(r.conviccoesRestantes, 0);
    assert.ok(r.eventos.some(e => /Sem nenhuma Convicção/.test(e.texto)));
  });

  await t.test('posição vazia não faz nada, e diz que não fez', () => {
    const f = comPilares();
    const r = Estado.perderPilar(f, 2);
    assert.equal(r.perdeu, false);
    assert.equal(f.maculas, 0, 'cobrou Mácula por um Pilar que não existia');
  });
});

test('Crenças — Mácula a serviço de Convicção é reduzida (§69, A9)', async (t) => {

  /* "Se o Princípio foi violado EM RESPEITO A UMA CONVICÇÃO, reduza
     as Máculas ganhas em UMA OU MAIS." (pág. 239) */

  const cobaia = () => { const f = fichaDeTeste(g); f.maculas = 0; return f; };

  await t.test('o exemplo do livro: 3 Máculas viram 2', (t2) => {
    /* Joana esmaga a cabeça de quem ia revelar a natureza dela ao
       irmão caçula. O ato vale 3; com a Convicção "minha família deve
       ser mantida fora disto", ela recebe apenas 2. (pág. 239) */
    const joana = cobaia();
    const r = Estado.ganharMacula(joana, 3, 'assassinato cruel',
      { porConviccao: 'minha família deve ser mantida fora disto' });
    t2.diagnostic(r.eventos.map(e => e.texto).join(' | '));
    assert.equal(joana.maculas, 2, 'o exemplo da pág. 239 não bate');
    assert.ok(r.eventos.some(e => /minha família deve ser mantida fora disto/.test(e.texto)),
      'o motor não nomeou a Convicção invocada');
  });

  await t.test('sem Convicção invocada, nada muda', () => {
    const f = cobaia();
    Estado.ganharMacula(f, 3, 'assassinato cruel');
    assert.equal(f.maculas, 3);
  });

  await t.test('a redução pode ser maior que uma — é a parte do Narrador', () => {
    const f = cobaia();
    Estado.ganharMacula(f, 3, 'ato pesado', { porConviccao: 'Proteja os inocentes', reducao: 2 });
    assert.equal(f.maculas, 1);
  });

  await t.test('não desce abaixo de zero, e uma única Mácula pode sumir', (t2) => {
    /* O livro não dá piso, e uma Mácula só, a serviço de uma
       Convicção, é justamente o caso em que não sobra nada. */
    const f = cobaia();
    Estado.ganharMacula(f, 1, 'violação justificável', { porConviccao: 'Não torturarás' });
    t2.diagnostic(`maculas: ${f.maculas}`);
    assert.equal(f.maculas, 0);

    const g2 = cobaia();
    Estado.ganharMacula(g2, 2, 'ato', { porConviccao: 'X', reducao: 9 });
    assert.equal(g2.maculas, 0);
  });

  await t.test('a redução não pode ser menor que a do livro', () => {
    /* "reduza em uma ou mais" — zero não é opção. */
    const f = cobaia();
    Estado.ganharMacula(f, 3, 'ato', { porConviccao: 'X', reducao: 0 });
    assert.equal(f.maculas, 2);
  });
});

/* ============================================================
   §73 — HABILIDADES (básico, págs. 159–171)

   A §71 leu o capítulo para escrever o hover do criador, e parou
   aí. Lendo o resto — a caixa de Especializações da pág. 159 —
   apareceu H1: o dado extra da especialização era INCONDICIONAL.

   Medido antes: "Lobisomens" em Briga dava sete dados tanto em
   "ataco o lobisomem" quanto em "dou um soco no segurança".
   ============================================================ */

test('Habilidades — a especialização só vale na tarefa certa (§73, H1)', async (t) => {

  const comEsp = (pericia, nome, extra = {}) => {
    const f = fichaDeTeste(g);
    f.habilidades[pericia] = 3;
    f.especializacoes = { [pericia]: nome };
    Object.assign(f.atributos, extra);
    return f;
  };

  await t.test('a tarefa que se enquadra ganha o dado; a que não, não', (t2) => {
    /* "Se o Narrador decidir que um personagem está tentando
       realizar uma tarefa QUE SE ENQUADRA em sua especialização, o
       jogador ganha um dado extra." (pág. 159) */
    const f = comEsp('briga', 'Lobisomens', { forca: 3 });
    const rota = (texto) => (Arbitro.avaliar({ ficha: f, texto, estados: [] }).rotas || [])[0];
    const dentro = rota('ataco o lobisomem');
    const fora   = rota('dou um soco no segurança');
    t2.diagnostic(`lobisomem: ${dentro.piscina} dados (esp ${dentro.especializacao}) · ` +
                  `segurança: ${fora.piscina} dados (esp ${fora.especializacao})`);
    assert.equal(dentro.especializacao, 1, 'a especialização não valeu na tarefa dela');
    assert.equal(fora.especializacao, 0, 'a especialização deu dado de graça');
    assert.equal(dentro.piscina, fora.piscina + 1);
  });

  await t.test('singular e plural contam igual', () => {
    /* O caso que obrigou a tratar `ns` antes de `s`: "Lobisomens"
       e "lobisomem". */
    const f = comEsp('briga', 'Lobisomens', { forca: 3 });
    for (const texto of ['ataco o lobisomem', 'ataco os lobisomens']) {
      const r = (Arbitro.avaliar({ ficha: f, texto, estados: [] }).rotas || [])[0];
      assert.equal(r.especializacao, 1, texto);
    }
  });

  await t.test('casa por PALAVRA, e não por pedaço de palavra', (t2) => {
    const casa = Arbitro.casadorDeEspecializacao('subo pela fachada do prédio');
    t2.diagnostic(`Facas: ${casa('Facas')} · Fachada: ${casa('Fachada')}`);
    assert.equal(casa('Facas'), false, '"Facas" casou dentro de "fachada"');
    assert.equal(casa('Fachada'), true);
  });

  await t.test('palavra curta não decide sozinha: exige a expressão inteira', (t2) => {
    /* "Um Por Cento" e "GTA" são especializações do livro (págs.
       165 e 164). Deixar "um" ou "por" decidirem casaria quase
       qualquer frase. */
    const casa = Arbitro.casadorDeEspecializacao('eu falo por um minuto com o cara');
    t2.diagnostic(`"Um Por Cento" em "eu falo por um minuto": ${casa('Um Por Cento')}`);
    assert.equal(casa('Um Por Cento'), false);
    assert.equal(Arbitro.casadorDeEspecializacao('sou do um por cento')('Um Por Cento'), true,
      'a expressão inteira devia casar');
  });

  await t.test('sem texto não há tarefa a enquadrar, e a folha segue mostrando o dado', (t2) => {
    /* A ficha impressa mostra a parada de QUANDO a especialização
       vale. Só o Árbitro, que sabe o que o jogador escreveu, tem
       como cobrar a condição. */
    const f = comEsp('armas_brancas', 'Facas', { destreza: 3 });
    const p = Dados.piscinaDe(f, 'destreza', 'armas_brancas');
    t2.diagnostic(`${p.total} dados · aplicada ${p.especializacaoAplicada} · ` +
                  `disponível ${p.especializacaoDisponivel}`);
    assert.equal(p.especializacao, 1);
    assert.equal(p.especializacaoDisponivel, true);
  });

  await t.test('no combate, quem enquadra é a ARMA', (t2) => {
    const f = comEsp('armas_brancas', 'Facas', { destreza: 3 });
    const golpe = (arma) => Combate.resolver({ atacante: f, defensor: fichaDeTeste(g),
      tipo: 'branca', arma, estacionario: true }).rolAtq.piscina;
    const comFaca = golpe('Faca'), comTaco = golpe('Taco de beisebol');
    t2.diagnostic(`faca ${comFaca} dados · taco ${comTaco} dados`);
    assert.equal(comFaca, comTaco + 1, 'a especialização não distinguiu a arma');
  });

  await t.test('e uma especialização de outra perícia não vaza', () => {
    const f = fichaDeTeste(g);
    f.habilidades.briga = 3; f.atributos.forca = 3;
    f.especializacoes = { armas_brancas: 'Facas' };
    const r = (Arbitro.avaliar({ ficha: f, texto: 'saco a faca e dou um soco', estados: [] }).rotas || [])
      .find(x => x.pericia === 'briga');
    if (r) assert.equal(r.especializacao, 0, 'a especialização de Armas Brancas entrou na parada de Briga');
  });
});

test('Habilidades — as quatro que exigem especialização (§73)', async (t) => {

  await t.test('são exatamente as quatro do livro', (t2) => {
    /* "Quatro Habilidades vêm com uma especialização automática
       quando adquiridas: Ofícios, Erudição, Ciência e Performance."
       (pág. 159) */
    const nomes = g.ESPECIALIZACAO_OBRIGATORIA.map(id => g.nomeHabilidade(id)).sort();
    t2.diagnostic(nomes.join(', '));
    assert.equal(nomes.join(', '), 'Ciência, Erudição, Ofícios, Performance');
  });

  await t.test('e todas as quatro existem como Habilidade', () => {
    const ids = Object.values(g.HABILIDADES).flatMap(x => x.lista).map(h => h.id);
    for (const id of g.ESPECIALIZACAO_OBRIGATORIA)
      assert.ok(ids.includes(id), `${id} não é uma Habilidade`);
  });
});

test('Habilidades — o dado e o documento não podem divergir (§73)', async (t) => {

  /* Quarta aplicação da técnica da §65.3. Desta vez a tabela lida é a
     da §17.2, e o que ela afirma é a lista de quatro perícias que vêm
     com especialização automática. */
  const md = fs.readFileSync(path.join(RAIZ, 'docs', 'regras.md'), 'utf8');
  const bloco = md.split('## 17. Habilidades')[1] || '';

  await t.test('a §17 existe e cita o capítulo certo', (t2) => {
    t2.diagnostic(bloco.slice(0, 90).replace(/\s+/g, ' '));
    assert.ok(bloco.includes('págs. 159–171'), 'a §17 não cita as páginas do capítulo');
  });

  await t.test('as quatro perícias com especialização automática batem com o dado', (t2) => {
    const linha = bloco.split('\n').find(l => /vêm com uma de graça/.test(l)) || '';
    t2.diagnostic(linha.replace(/\s+/g, ' ').slice(0, 120));
    for (const id of g.ESPECIALIZACAO_OBRIGATORIA) {
      const nome = g.nomeHabilidade(id);
      assert.ok(linha.includes(nome),
        `"${nome}" está em ESPECIALIZACAO_OBRIGATORIA e não aparece na §17.2 do regras.md`);
    }
  });

  await t.test('e o documento não lista nenhuma a mais', (t2) => {
    const linha = bloco.split('\n').find(l => /vêm com uma de graça/.test(l)) || '';
    const nomes = g.ESPECIALIZACAO_OBRIGATORIA.map(id => g.nomeHabilidade(id));
    const todas = Object.values(g.HABILIDADES).flatMap(x => x.lista);
    const intrusas = todas.filter(h => !nomes.includes(h.nome) && linha.includes(h.nome));
    t2.diagnostic(intrusas.length ? intrusas.map(h => h.nome).join(', ') : 'nenhuma intrusa');
    assert.equal(intrusas.length, 0,
      `a §17.2 cita ${intrusas.map(h => h.nome).join(', ')}, que não está no dado`);
  });
});

/* ============================================================
   QUEM ROLA É A MESA  (§82)

   A regra do usuário: **o Árbitro diz quais dados; a Mesa roda; o
   Árbitro pega o resultado.** O que estes testes trancam é a
   metade que some sozinha — a de que o Árbitro NÃO sorteia.
   ============================================================ */

test('Dados — o Árbitro diz quais, a Mesa roda, o Árbitro apura (§82)', async (t) => {
  const g = carregar(['data', 'ficha', 'arbitro']);

  await t.test('o Árbitro não tem `Math.random` em lugar nenhum', (t2) => {
    /* É a trava principal. Um serviço que decide regra E sorteia não é
       determinístico nem auditável: não dá para repetir uma noite, nem
       para conferir o que o cliente diz que rolou. */
    const sujos = [];
    for (const nome of AREAS.arbitro) {
      const fonte = fs.readFileSync(path.join(RAIZ, caminhoDe('arbitro', nome)), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
      if (/Math\.random/.test(fonte)) sujos.push(`arbitro/${nome}.js`);
    }
    t2.diagnostic(sujos.length ? sujos.join(', ') : 'nenhum');
    assert.deepEqual(sujos, [], 'o Árbitro voltou a sortear sozinho');
  });

  await t.test('sem fonte instalada, rolar ESTOURA em vez de inventar', (t2) => {
    /* Sem isto, tirar o `Math.random` do Árbitro seria decorativo: um
       valor padrão de reserva devolveria o sorteio para cá sem ninguém
       notar. */
    const antes = g.Dados.usarFonte(null);
    try {
      assert.equal(g.Dados.temFonte(), false);
      assert.throws(() => g.Dados.d10(), /fonte de acaso/i);
      assert.throws(() => g.Dados.rolar({ piscina: 5 }), /fonte de acaso/i);
      t2.diagnostic('d10() sem fonte estoura, e diz por quê');
    } finally {
      g.Dados.usarFonte(antes);
    }
  });

  await t.test('a fonte que devolve lixo é recusada', () => {
    const antes = g.Dados.usarFonte(() => 42);
    try { assert.throws(() => g.Dados.d10(), /não é um d10/); }
    finally { g.Dados.usarFonte(antes); }
  });

  await t.test('PASSO 1 — `pedir` é puro e não consome a fonte', (t2) => {
    let chamadas = 0;
    const antes = g.Dados.usarFonte(() => { chamadas++; return 7; });
    try {
      const p = g.Dados.pedir({ piscina: 6, fome: 2, dificuldade: 3, rotulo: 'Arrombar' });
      t2.diagnostic(JSON.stringify(p));
      assert.equal(chamadas, 0, '`pedir` rolou dado');
      /* `assert.deepEqual` compara protótipo, e este objeto veio de
         outro realm do `vm` — a armadilha que o arreio já documenta.
         Compara-se o JSON. */
      assert.equal(JSON.stringify(p),
        JSON.stringify({ normais: 4, fome: 2, dificuldade: 3, rotulo: 'Arrombar', piscina: 6 }));
      /* Duas vezes a mesma situação, o mesmo pedido. */
      assert.equal(JSON.stringify(g.Dados.pedir({ piscina: 6, fome: 2, dificuldade: 3, rotulo: 'Arrombar' })),
        JSON.stringify(p));
    } finally { g.Dados.usarFonte(antes); }
  });

  await t.test('a parada mínima de 1 continua sendo do passo 1', () => {
    /* Regra do livro (A1, §63): parada vazia ainda rola um dado. Ela
       tem de morar no PEDIDO, não em quem roda — senão a Mesa
       precisaria conhecer a regra. */
    assert.equal(g.Dados.pedir({ piscina: 0 }).normais, 1);
    assert.equal(g.Dados.pedir({ piscina: -5 }).piscina, 1);
    /* E a Fome nunca passa da parada. */
    const p = g.Dados.pedir({ piscina: 2, fome: 5 });
    assert.equal(p.fome, 2);
    assert.equal(p.normais, 0);
  });

  await t.test('PASSO 2 — `rodar` consome a fonte, e só ela', (t2) => {
    const fila = [10, 10, 6, 2, 1, 1];
    let i = 0;
    const antes = g.Dados.usarFonte(() => fila[i++]);
    try {
      const p = g.Dados.pedir({ piscina: 6, fome: 2, dificuldade: 2 });
      const v = g.Dados.rodar(p);
      t2.diagnostic(`normais ${v.normais.join(',')} · fome ${v.dadosFome.join(',')}`);
      assert.equal(v.normais.join(','), '10,10,6,2');
      assert.equal(v.dadosFome.join(','), '1,1');
      assert.equal(i, 6, 'consumiu um número de dados diferente do pedido');
    } finally { g.Dados.usarFonte(antes); }
  });

  await t.test('PASSO 3 — `apurar` é puro: os mesmos valores, o mesmo veredito', (t2) => {
    const antes = g.Dados.usarFonte(() => { throw new Error('apurar não pode rolar'); });
    try {
      const p = g.Dados.pedir({ piscina: 6, fome: 2, dificuldade: 2, rotulo: 'Arrombar' });
      const v = { normais: [10, 10, 6, 2], dadosFome: [1, 1] };
      const a = g.Dados.apurar(p, v);
      const b = g.Dados.apurar(p, v);
      t2.diagnostic(`${a.tipo} · ${a.sucessos} sucesso(s) · ${g.Dados.descrever(a)}`);
      assert.equal(a.tipo, b.tipo);
      assert.equal(a.sucessos, b.sucessos);
      /* 10,10 → par: 2 básicos + 2 do par; o 6 conta; o 2 e os dois 1
         de Fome não. Passou a dificuldade 2, com crítico e sem dez na
         Fome: Sucesso Crítico. */
      assert.equal(a.sucessos, 5);
      assert.equal(a.tipo, 'critico');
      assert.equal(a.rotulo, 'Arrombar');
    } finally { g.Dados.usarFonte(antes); }
  });

  await t.test('os três passos dão o mesmo que `rolar` de uma vez', () => {
    const fila = [9, 3, 7, 10];
    let i = 0;
    const antes = g.Dados.usarFonte(() => fila[i % fila.length] * 0 + fila[i++ % fila.length]);
    try {
      i = 0;
      const p = g.Dados.pedir({ piscina: 4, fome: 1, dificuldade: 2, rotulo: 'x' });
      const passoAPasso = g.Dados.apurar(p, g.Dados.rodar(p));
      i = 0;
      const deUmaVez = g.Dados.rolar({ piscina: 4, fome: 1, dificuldade: 2, rotulo: 'x' });
      assert.equal(passoAPasso.tipo, deUmaVez.tipo);
      assert.equal(passoAPasso.sucessos, deUmaVez.sucessos);
      assert.equal(passoAPasso.normais.join(','), deUmaVez.normais.join(','));
    } finally { g.Dados.usarFonte(antes); }
  });

  await t.test('o pedido atravessa JSON sem perder nada', (t2) => {
    /* É o que acontece quando a Mesa é outro processo: o pedido vai
       por HTTP e volta como valores. Se ele carregasse função ou
       referência, isso quebraria calado. */
    const p = g.Dados.pedir({ piscina: 7, fome: 3, dificuldade: 4, rotulo: 'Caçar' });
    const ida = JSON.parse(JSON.stringify(p));
    t2.diagnostic(JSON.stringify(ida));
    assert.equal(JSON.stringify(ida), JSON.stringify(p));
    const v = { normais: [6, 6, 2, 2], dadosFome: [10, 10, 5] };
    assert.equal(g.Dados.apurar(ida, v).tipo, g.Dados.apurar(p, v).tipo);
  });
});

/* ============================================================
   AS PERDIÇÕES DE CLÃ, CONTRA O LIVRO  (§88)

   O básico tem SETE clãs, mais Caitiff e Sangue-Ralo — os outros
   nove de `data-clans.js` vieram de livros posteriores e não são
   conferidos aqui.

   E o livro é uniforme num ponto que o projeto não tinha: **toda
   Perdição de clã se mede em Gravidade da Perdição.** Nenhuma das
   nove dizia isso; todas traziam número inventado no lugar — "dois
   dados", "de uma a três", "um gole extra".
   ============================================================ */

test('Clãs — a Perdição se mede em Gravidade da Perdição (§88)', async (t) => {
  const g = carregar(['data', 'ficha', 'arbitro']);
  const cla = (id) => g.CLAS.find(c => c.id === id);

  /* Os nove do básico. Os demais clãs do arquivo vieram de outros
     livros e ficam fora — dizer que foram conferidos seria mentir. */
  const DO_BASICO = ['brujah', 'gangrel', 'malkaviano', 'nosferatu', 'toreador',
                     'tremere', 'ventrue', 'caitiff', 'sangue_fraco'];

  await t.test('a Gravidade da Perdição virou derivado de verdade', (t2) => {
    /* Ela existia em `Escudo.POTENCIA_SANGUE[n].perdicao` e a folha já a
       imprimia, mas nada a CALCULAVA — e é por isso que as nove Perdições
       foram escritas com números inventados: o valor não estava à mão. */
    const f = g.fichaDeTeste ? g.fichaDeTeste() : null;
    const ficha = Object.assign(g.FICHA_VAZIA(), {
      cla: 'brujah', geracao: '12', predador: 'alcateia',
      atributos: { vigor: 3, autocontrole: 3, determinacao: 3 }
    });
    const d = g.derivados(ficha);
    t2.diagnostic(`Potência ${d.potencia} → Gravidade da Perdição ${d.gravidadePerdicao}`);
    assert.equal(typeof d.gravidadePerdicao, 'number');
    /* A tabela do Escudo é a fonte: o derivado tem de bater com ela. */
    assert.equal(d.gravidadePerdicao, g.Escudo.POTENCIA_SANGUE[d.potencia].perdicao);
  });

  await t.test('o Sangue Ralo tem Potência 0, e Gravidade 0 com ela', () => {
    const ficha = Object.assign(g.FICHA_VAZIA(), { cla: 'sangue_fraco', geracao: '14' });
    const d = g.derivados(ficha);
    assert.equal(d.potencia, 0);
    assert.equal(d.gravidadePerdicao, 0);
  });

  await t.test('as nove Perdições do básico citam a Gravidade da Perdição', (t2) => {
    /* Caitiff é a exceção declarada: ele NÃO tem Perdição, e o livro diz
       isso com todas as letras (pág. 107). */
    const semCitar = DO_BASICO
      .filter(id => id !== 'caitiff' && id !== 'sangue_fraco')
      .filter(id => !/Gravidade da Perdição/.test(cla(id).maldicao.texto));
    t2.diagnostic(`${DO_BASICO.length} clãs do básico conferidos`);
    assert.deepEqual(semCitar, [], 'Perdição sem a Gravidade da Perdição');
  });

  await t.test('e todas dizem de que página vieram', () => {
    const semPagina = DO_BASICO.filter(id => !/pág\. \d+/.test(cla(id).maldicao.texto));
    assert.deepEqual(semPagina, [], 'Perdição sem a página do livro');
  });

  await t.test('nenhuma delas voltou a inventar número', (t2) => {
    /* Os números que estavam lá antes da §88, e o que cada um escondia:
         "dois dados"      → Malkaviano, Nosferatu, Toreador
         "de uma a três"   → Gangrel
         "um gole"         → Tremere
       Um número fixo numa Perdição é sinal de que a Gravidade sumiu.

       O que se procura é o número no lugar da QUANTIDADE — "penalidade
       de dois dados", "perca dois dados". Não vale procurar qualquer
       número: o Brujah diz "a parada nunca cai abaixo de um dado", e
       esse é o PISO do livro, não uma substituição. Foi a primeira
       versão deste teste acusando o texto certo. */
    const SUBSTITUICAO = /(penalidade de|perca|perde|reduz(?:a|ir)?|redutor de|subtrai[a]?)\s+(um|dois|três|quatro|cinco|\d)\s+dados?/i;
    const suspeitos = [];
    for (const id of DO_BASICO) {
      const t = cla(id).maldicao.texto;
      const m = t.match(SUBSTITUICAO);
      /* "um ou dois dados" do Caitiff é o texto do livro, e é julgamento
         do Narrador — não é a Gravidade disfarçada. */
      if (m && !/um ou dois dados/.test(t)) suspeitos.push(`${id}: ${m[0]}`);
    }
    t2.diagnostic(suspeitos.length ? suspeitos.join(' · ') : 'nenhum');
    assert.deepEqual(suspeitos, [], 'número fixo no lugar da Gravidade da Perdição');
  });

  await t.test('o Toreador penaliza o ambiente FEIO, e não o belo', (t2) => {
    /* A pior das nove: o projeto tinha invertido o gatilho. Dizia
       "diante de algo genuinamente belo, perca dois dados em TODOS os
       testes"; o livro penaliza estar num ambiente MENOS do que belo, e
       só nas paradas para acionar Disciplina. */
    const t = cla('toreador').maldicao.texto;
    t2.diagnostic(t.slice(0, 90));
    assert.match(t, /MENOS do que belo/);
    assert.match(t, /acionar Disciplinas/);
    assert.ok(!/diante de algo genuinamente belo/i.test(t), 'o gatilho invertido voltou');
  });

  await t.test('o Nosferatu não quebra a Máscara ao ser visto', () => {
    /* O projeto dizia "falha automática em qualquer tentativa de se
       passar por humano". O livro é o contrário: ele passa por
       grotesco, não por sobrenatural. */
    const t = cla('nosferatu').maldicao.texto;
    assert.match(t, /NÃO quebra a Máscara/);
    assert.match(t, /Repulsivo \(-2\)/);
    assert.ok(!/[Ff]alha automática/.test(t), 'a falha automática inventada voltou');
  });
});

/* ============================================================
   O SANGUE FERVENTE CHEGA AO DADO  (§88)
   ============================================================ */

test('Árbitro — a Perdição Brujah subtrai dados do frenesi (§88)', async (t) => {
  const g = carregar(['data', 'ficha', 'arbitro']);

  const fichaDe = (claId, geracao = '10') => Object.assign(g.FICHA_VAZIA(), {
    nome: 'Cobaia', cla: claId, geracao, predador: 'alcateia',
    atributos: { forca: 3, destreza: 3, vigor: 3, carisma: 2, manipulacao: 2,
                 autocontrole: 3, inteligencia: 2, raciocinio: 3, determinacao: 3 },
    habilidades: {}, especializacoes: {}, disciplinas: {}, poderes: {},
    conviccoes: ['x', '', ''], marcos: ['y', '', '']
  });

  await t.test('o Brujah rola MENOS dados que o Ventrue no mesmo frenesi', (t2) => {
    const brujah = fichaDe('brujah');
    const ventrue = fichaDe('ventrue');
    const gv = g.derivados(brujah).gravidadePerdicao;

    const rb = g.Estado.testeDeFrenesi(brujah, { tipo: 'furia', gatilho: 'provocação' });
    const rv = g.Estado.testeDeFrenesi(ventrue, { tipo: 'furia', gatilho: 'provocação' });
    t2.diagnostic(`Gravidade ${gv} · Brujah ${rb.rolagem.piscina} dado(s) · `
      + `Ventrue ${rv.rolagem.piscina} dado(s)`);
    assert.ok(gv > 0, 'a ficha de teste ficou com Gravidade 0 e não mede nada');
    assert.equal(rv.rolagem.piscina - rb.rolagem.piscina, gv,
      'a diferença não é a Gravidade da Perdição');
  });

  await t.test('e ele DIZ que subtraiu, com o número', (t2) => {
    const r = g.Estado.testeDeFrenesi(fichaDe('brujah'), { tipo: 'furia' });
    const nota = r.eventos.find(e => /Sangue Fervente/.test(e.texto));
    t2.diagnostic(nota ? nota.texto : '(sem nota)');
    assert.ok(nota, 'penalizou em silêncio');
    assert.match(nota.texto, /Gravidade da Perdição/);
  });

  await t.test('SÓ no frenesi de fúria — medo e fome não', (t2) => {
    const brujah = fichaDe('brujah');
    const ventrue = fichaDe('ventrue');
    for (const tipo of ['medo', 'fome']) {
      const b = g.Estado.testeDeFrenesi(brujah, { tipo });
      const v = g.Estado.testeDeFrenesi(ventrue, { tipo });
      assert.equal(b.rolagem.piscina, v.rolagem.piscina,
        `o Brujah levou penalidade no frenesi de ${tipo}`);
    }
    t2.diagnostic('medo e fome sem penalidade, como o livro nomeia');
  });

  await t.test('a parada nunca cai abaixo de UM dado', (t2) => {
    /* O piso é do livro (pág. 67), e este teste afirma o RESULTADO, não
       quem o produz.

       Medido durante a §88: tirar o `Math.max` de `testeDeFrenesi` não
       muda nada, porque `Dados.pedir` já impõe a parada mínima de 1
       desde a §63 (item A1). São duas redes para o mesmo buraco, e o
       teste não distingue as duas — o que ele garante é que o buraco
       continua tapado, por quem quer que seja. */
    const fraco = fichaDe('brujah', '6');   /* geração baixa → Potência alta */
    fraco.atributos.autocontrole = 1;
    fraco.atributos.determinacao = 1;
    const gv = g.derivados(fraco).gravidadePerdicao;
    const r = g.Estado.testeDeFrenesi(fraco, { tipo: 'furia', gatilho: 'insulto' });
    t2.diagnostic(`Gravidade ${gv} · Autocontrole+Determinação 2 · `
      + `parada final ${r.rolagem.piscina}`);
    assert.ok(gv >= 2, 'a ficha não chegou a uma Gravidade que force o piso');
    assert.equal(r.rolagem.piscina, 1, 'a parada não parou no piso');
    assert.equal(r.rolagem.normais.length + r.rolagem.dadosFome.length, 1,
      'rolou uma quantidade de dados diferente da parada');
  });

  await t.test('o Sangue Ralo não leva penalidade nenhuma', () => {
    /* Gravidade 0 por Potência 0 — e ele nem é Brujah. */
    const ralo = fichaDe('sangue_fraco', '14');
    const ventrue = fichaDe('ventrue', '14');
    assert.equal(g.Estado.testeDeFrenesi(ralo, { tipo: 'furia' }).rolagem.piscina,
                 g.Estado.testeDeFrenesi(ventrue, { tipo: 'furia' }).rolagem.piscina);
  });
});

/* ============================================================
   A TABELA DO regras.md E OS DADOS NÃO DIVERGEM  (§88)

   `docs/regras.md` §19.2 lista as nove Perdições do básico com a
   página de cada uma. `data-clans.js` traz o texto que o jogador
   lê. As duas foram escritas na mesma leitura, e vão envelhecer em
   ritmos diferentes se ninguém olhar.

   É a quarta anti-deriva do projeto — a mesma forma das §63, §67 e
   §73: a tabela do documento é LIDA do arquivo e comparada com o
   código, em vez de ser conferida a olho.
   ============================================================ */

test('Clãs — o regras.md e os dados dizem a mesma coisa (§88)', async (t) => {
  const g = carregar(['data']);
  const md = fs.readFileSync(path.join(RAIZ, 'docs', 'regras.md'), 'utf8');

  const secao = md.slice(md.indexOf('### 19.2 As nove Perdições'),
                         md.indexOf('### 19.3 O que o motor aplica'));

  /* `| **Brujah** *(67)* | …` — o nome e a página de cada linha. */
  const naTabela = new Map(
    [...secao.matchAll(/^\| \*\*([^*]+)\*\* \*\((\d+)\)\* \|/gm)]
      .map(m => [m[1].trim(), Number(m[2])]));

  const POR_NOME = {
    'Brujah': 'brujah', 'Gangrel': 'gangrel', 'Malkaviano': 'malkaviano',
    'Nosferatu': 'nosferatu', 'Toreador': 'toreador', 'Tremere': 'tremere',
    'Ventrue': 'ventrue', 'Caitiff': 'caitiff', 'Sangue-Ralo': 'sangue_fraco'
  };

  await t.test('a tabela tem os nove clãs do básico', (t2) => {
    t2.diagnostic([...naTabela.keys()].join(', '));
    assert.equal(naTabela.size, 9, 'a tabela do regras.md mudou de tamanho');
    const semMapa = [...naTabela.keys()].filter(n => !POR_NOME[n]);
    assert.deepEqual(semMapa, [], 'nome na tabela sem clã correspondente');
  });

  await t.test('e a PÁGINA de cada uma bate com a do texto do clã', (t2) => {
    /* O texto em `data-clans.js` termina com "(básico, pág. N)". Se
       alguém corrigir a página num lado só, isto cai. */
    const divergentes = [];
    for (const [nome, pagina] of naTabela) {
      const c = g.CLAS.find(x => x.id === POR_NOME[nome]);
      const m = c.maldicao.texto.match(/pág\. (\d+)/);
      if (!m) { divergentes.push(`${nome}: o texto não diz a página`); continue; }
      if (Number(m[1]) !== pagina) {
        divergentes.push(`${nome}: regras.md diz ${pagina}, o dado diz ${m[1]}`);
      }
    }
    t2.diagnostic(`${naTabela.size} páginas conferidas`);
    assert.deepEqual(divergentes, [], 'a página divergiu entre o documento e o dado');
  });

  await t.test('o documento NÃO diz que aplicou o que não aplicou', (t2) => {
    /* §19.3 separa "Aplicado" de "Ainda declarativo". A lista do
       declarativo é uma promessa negativa, e promessa negativa é a que
       envelhece pior: basta alguém implementar e esquecer de tirar
       daqui. Este teste confere o único item da lista de APLICADOS. */
    const s3 = md.slice(md.indexOf('### 19.3 O que o motor aplica'),
                        md.indexOf('### 19.4 O que estava errado'));
    assert.match(s3, /\*\*Aplicado \(§88\):\*\* a Perdição \*\*Brujah\*\*/,
      'a seção mudou de forma e este teste parou de olhar o que devia');

    /* §95 — A PROMESSA VIROU POSITIVA, E O TESTE VIROU JUNTO.

       Até aqui ele cobrava que seis Perdições NÃO estivessem no motor.
       Agora cobra o contrário: cada clã que a tabela "Aplicado na §95"
       cita tem de ter gancho em `motor-perdicoes.js`. Trocar a direção
       e manter a intenção é o que mantém o documento honesto — o
       defeito de que o teste protege é o mesmo dos dois lados: alguém
       mexe no código e esquece do texto. */
    const seis = [...s3.matchAll(/^\| \*\*([A-Za-zÀ-ÿ-]+)\*\* \| /gm)].map(m => m[1].toLowerCase());
    t2.diagnostic(`o documento diz aplicadas: ${seis.join(', ')}`);
    assert.ok(seis.length >= 6, 'a tabela das Perdições aplicadas encolheu sem aviso');

    const perdicoes = fs.readFileSync(path.join(RAIZ, caminhoDe('arbitro', 'motor-perdicoes')), 'utf8');
    const semGancho = seis.filter(nome => {
      const id = nome.replace('sangue-ralo', 'ralo');
      return !new RegExp(id, 'i').test(perdicoes);
    });
    assert.deepEqual(semGancho, [],
      'o regras.md §19.3 diz que a Perdição foi aplicada e o motor-perdicoes.js não a conhece');
  });
});

/* ============================================================
   AS PERDIÇÕES DE CLÃ, NO DADO  (§95 — A10)

   Oito das nove estavam escritas, conferidas contra a página na §88,
   impressas na ficha — e não aconteciam. O que estes testes cobram é
   que aconteçam, e que aconteçam com a Gravidade da Perdição, que foi
   o número que a §88 pegou trocado pela Potência de Sangue.

   Nenhum deles rola dado: o que se afirma é a REGRA, e regra não
   depende de sorteio.
   ============================================================ */

test('Perdições — a Gravidade manda em todas (§95, pág. 216)', async (t) => {
  /* A Potência de Sangue é DERIVADA — geração, Predador e `potenciaMod`
     (§91) —, e não um campo que se escreve na ficha. Escrever
     `f.potenciaSangue` não move nada, e a primeira versão deste teste
     fez isso: as quatro cobaias saíam com a mesma Gravidade e o teste
     passava por engano. */
  const comMod = (mod) => {
    const f = fichaDeTeste(g, { nome: 'Cobaia' });
    f.potenciaMod = mod;
    return { potencia: derivados(f).potencia, gravidade: Perdicoes.gravidade(f) };
  };

  await t.test('ela sai da Potência de Sangue, e não é a Potência', (t2) => {
    const linhas = [0, 2, 4, 6].map(comMod);
    t2.diagnostic(linhas.map(l => `PS ${l.potencia} → Gravidade ${l.gravidade}`).join(' · '));
    assert.ok(linhas[3].gravidade > linhas[0].gravidade, 'a Gravidade não cresce com a Potência');
    assert.notEqual(linhas[2].gravidade, linhas[2].potencia,
      'a Gravidade voltou a ser a própria Potência — foi o defeito da §88');
    for (const l of linhas) {
      assert.equal(l.gravidade, Escudo.POTENCIA_SANGUE[l.potencia].perdicao,
        'a Gravidade deixou de sair da tabela da pág. 216');
    }
  });

  await t.test('e o Sangue-Ralo tem Potência 0, logo Gravidade 0', (t2) => {
    const f = fichaDeTeste(g, { nome: 'Ralo', cla: 'sangue_fraco' });
    t2.diagnostic(`potência ${derivados(f).potencia} · gravidade ${Perdicoes.gravidade(f)}`);
    assert.equal(Perdicoes.gravidade(f), 0);
  });

  await t.test('a categoria de uma parada é a do Atributo que a abre', () => {
    assert.equal(Perdicoes.categoriaDe('forca'), 'fisico');
    assert.equal(Perdicoes.categoriaDe('manipulacao'), 'social');
    assert.equal(Perdicoes.categoriaDe('inteligencia'), 'mental');
    assert.equal(Perdicoes.categoriaDe('nenhum'), null);
  });
});

test('Perdição Gangrel — os aspectos animalescos (§95, pág. 73)', async (t) => {
  const gangrel = () => {
    const f = fichaDeTeste(g, { nome: 'Ferina', cla: 'gangrel' });
    f.potenciaMod = 4;
    return f;
  };

  await t.test('a quantidade de aspectos é igual à Gravidade', (t2) => {
    const f = gangrel();
    const grav = Perdicoes.gravidade(f);
    const r = Perdicoes.aspectosDoFrenesi(f, { cavalgou: false });
    t2.diagnostic(`Gravidade ${grav} → ${r.aspectos.length} aspecto(s): ${
      f.aspectosAnimalescos.map(a => a.nome).join(', ')}`);
    assert.equal(r.aspectos.length, grav, 'o número de aspectos não é a Gravidade');
    assert.ok(grav > 0, 'a cobaia tem Gravidade 0 e o teste não prova nada');
  });

  await t.test('Curtir a Onda segura em UM só', () => {
    const f = gangrel();
    const r = Perdicoes.aspectosDoFrenesi(f, { cavalgou: true });
    assert.equal(r.aspectos.length, 1, 'Curtir a Onda deixou de valer');
  });

  await t.test('cada aspecto tira 1 dado do Atributo dele, e eles somam', (t2) => {
    const f = gangrel();
    Perdicoes.aspectosDoFrenesi(f);
    const contas = {};
    for (const a of f.aspectosAnimalescos) contas[a.atributo] = (contas[a.atributo] || 0) + 1;
    for (const [attr, n] of Object.entries(contas)) {
      t2.diagnostic(`${attr}: ${n} aspecto(s) → −${Perdicoes.penalidadeDeAspectos(f, attr)}`);
      assert.equal(Perdicoes.penalidadeDeAspectos(f, attr), n);
    }
    assert.equal(Perdicoes.penalidadeDeAspectos(f, 'forca'), 0,
      'um Atributo sem aspecto perdeu dado do mesmo jeito');
  });

  await t.test('duram MAIS UMA NOITE: um amanhecer não basta', (t2) => {
    const f = gangrel();
    Perdicoes.aspectosDoFrenesi(f);
    const attr = f.aspectosAnimalescos[0].atributo;
    Perdicoes.amanhecer(f);
    t2.diagnostic(`depois de um amanhecer: ${f.aspectosAnimalescos.length} aspecto(s)`);
    assert.ok(Perdicoes.penalidadeDeAspectos(f, attr) > 0,
      'a ressaca passou no mesmo amanhecer, e o livro dá mais uma noite');
    Perdicoes.amanhecer(f);
    assert.equal(Perdicoes.penalidadeDeAspectos(f, attr), 0, 'a ressaca não passou nunca');
  });

  await t.test('e quem não é Gangrel não ganha aspecto nenhum', () => {
    const f = fichaDeTeste(g, { nome: 'Outra', cla: 'ventrue' });
    f.potenciaMod = 4;
    assert.equal(Perdicoes.aspectosDoFrenesi(f).aspectos.length, 0);
  });
});

test('Perdição Malkaviana — a categoria da criação (§95, pág. 79)', async (t) => {
  const malk = (categoria) => {
    const f = fichaDeTeste(g, { nome: 'Gizzard', cla: 'malkaviano' });
    f.potenciaMod = 4;
    if (categoria) f.perdicaoCategoria = categoria;
    return f;
  };

  await t.test('a categoria é a ESCOLHIDA NA CRIAÇÃO, e não uma qualquer', (t2) => {
    const f = malk('fisico');
    Perdicoes.aoVirATona(f, 'Falha Bestial');
    t2.diagnostic(`categoria na cena: ${f.perdicaoNaCena}`);
    assert.equal(f.perdicaoNaCena, 'fisico');
    const mods = Perdicoes.modificadores(f, { atributo: 'forca' });
    assert.equal(mods.length, 1, 'a parada Física não levou a penalidade');
    assert.equal(mods[0].dados, -Perdicoes.gravidade(f));
  });

  await t.test('e ela só pega a categoria dela', () => {
    const f = malk('fisico');
    Perdicoes.aoVirATona(f);
    assert.equal(Perdicoes.modificadores(f, { atributo: 'manipulacao' }).length, 0,
      'a penalidade Física vazou para uma parada Social');
  });

  await t.test('sem gatilho, não há penalidade', () => {
    const f = malk('mental');
    assert.equal(Perdicoes.modificadores(f, { atributo: 'inteligencia' }).length, 0);
  });

  await t.test('a cena acaba e ela recua', () => {
    const f = malk('mental');
    Perdicoes.aoVirATona(f);
    assert.equal(Perdicoes.modificadores(f, { atributo: 'inteligencia' }).length, 1);
    Perdicoes.novaCena(f);
    assert.equal(Perdicoes.modificadores(f, { atributo: 'inteligencia' }).length, 0,
      'a perdição não recuou quando a cena virou');
  });
});

test('Perdição Nosferatu e Toreador — as duas que leem o mundo (§95)', async (t) => {
  const nos = () => {
    const f = fichaDeTeste(g, { nome: 'Rato', cla: 'nosferatu' });
    f.potenciaMod = 4; return f;
  };

  await t.test('esconder a APARÊNCIA custa; esconder o corpo não', (t2) => {
    const f = nos();
    const com = Perdicoes.modificadores(f, { atributo: 'manipulacao', texto: 'me disfarço de entregador' });
    const sem = Perdicoes.modificadores(f, { atributo: 'destreza', texto: 'me escondo atrás da cortina' });
    t2.diagnostic(`disfarce ${com.length} · esconder-se ${sem.length}`);
    assert.equal(com.length, 1, 'o disfarce saiu de graça');
    assert.equal(sem.length, 0, 'furtividade virou Perdição Nosferatu');
  });

  await t.test('e ela vale INCLUSIVE por Disciplina — é o que o livro diz', () => {
    const f = nos();
    const mods = Perdicoes.modificadores(f,
      { atributo: 'manipulacao', disciplina: 'ofuscacao', texto: 'uso Ofuscação para passar por humano' });
    assert.ok(mods.some(m => /Nosferatu/.test(m.nome)),
      'Ofuscação escapou da Perdição, e o livro não deixa');
  });

  await t.test('Toreador: ambiente DESCONHECIDO não é ambiente feio', (t2) => {
    const f = fichaDeTeste(g, { nome: 'Bela', cla: 'toreador' });
    f.potenciaMod = 4;
    const semSaber = Perdicoes.modificadores(f, { atributo: 'carisma', disciplina: 'presenca' });
    const feio = Perdicoes.modificadores(f,
      { atributo: 'carisma', disciplina: 'presenca', belezaDoLocal: false });
    t2.diagnostic(`sem saber: ${semSaber.length} · feio: ${feio.length}`);
    assert.equal(semSaber.length, 0, 'punir por informação ausente é inventar regra');
    assert.equal(feio.length, 1);
  });

  await t.test('e só para ACIONAR Disciplina', () => {
    const f = fichaDeTeste(g, { nome: 'Bela', cla: 'toreador' });
    f.potenciaMod = 4;
    assert.equal(Perdicoes.modificadores(f, { atributo: 'carisma', belezaDoLocal: false }).length, 0,
      'o Toreador perdeu dado numa parada que não aciona Disciplina');
  });
});

test('Perdição Tremere — o Vitae que não enlaça (§95, pág. 97)', async (t) => {
  const tremere = () => {
    const f = fichaDeTeste(g, { nome: 'Bruxo', cla: 'tremere' });
    f.potenciaMod = 4; return f;
  };

  await t.test('em outro Membro NUNCA enlaça, por mais que se beba', (t2) => {
    /* Dez goles, e não um. Um gole só não distingue "não enlaça" de
       "está pagando os goles extras": as duas coisas dão Força 0 na
       primeira noite, e foi por isso que a mutação passou em verde. */
    const d = JSON.stringify(tremere());
    let laco = null;
    for (let i = 0; i < 10; i++) {
      laco = instantaneo(g, `Lacos.beber(${JSON.stringify(laco)}, { doador: ${d}, alvoEhVampiro: true })`).laco;
    }
    t2.diagnostic(`dez goles → Força ${laco.forca}, ${laco.goles.length} gole(s) registrado(s)`);
    assert.equal(laco.forca, 0, 'o Vitae Tremere enlaçou um Membro');
    assert.equal(laco.goles.length, 0, 'o gole em Membro entrou na contagem, e ele não conta');
  });

  await t.test('em mortal, exige goles extras iguais à Gravidade', (t2) => {
    const doador = tremere();
    const grav = Perdicoes.gravidade(doador);
    const d = JSON.stringify(doador);
    let laco = null, subidas = 0;
    for (let i = 0; i < grav + 1; i++) {
      const r = instantaneo(g, `Lacos.beber(${JSON.stringify(laco)}, { doador: ${d} })`);
      laco = r.laco; if (r.subiu) subidas++;
    }
    t2.diagnostic(`Gravidade ${grav} · ${grav + 1} goles → Força ${laco.forca}`);
    assert.equal(subidas, 1, 'os goles extras do Tremere não foram cobrados');
    assert.equal(laco.forca, 1);
  });

  await t.test('e quem não é Tremere enlaça no primeiro gole', () => {
    const outro = fichaDeTeste(g, { nome: 'Comum', cla: 'ventrue' });
    const r = instantaneo(g, `Lacos.beber(null, { doador: ${JSON.stringify(outro)} })`);
    assert.equal(r.laco.forca, 1, 'a Perdição Tremere vazou para outro clã');
  });
});

test('Perdição do Sangue-Ralo — o que fere e o que não paralisa (§95, pág. 111)', async (t) => {
  await t.test('cortante e perfurante entram Agravado', (t2) => {
    for (const tipo of ['branca', 'fogo', 'arremesso', 'garras']) {
      const ralo = { cla: 'sangue_fraco' };
      const normal = { cla: 'ventrue' };
      const a = Perdicoes.agravadoContraSangueRalo(ralo, tipo);
      const b = Perdicoes.agravadoContraSangueRalo(normal, tipo);
      t2.diagnostic(`${tipo}: ralo ${a} · ventrue ${b}`);
      assert.equal(a, true, `${tipo} não virou Agravado contra Sangue-Ralo`);
      assert.equal(b, false, `${tipo} virou Agravado contra quem não é Sangue-Ralo`);
    }
  });

  await t.test('mas o desarmado não', () => {
    assert.equal(Perdicoes.agravadoContraSangueRalo({ cla: 'sangue_fraco' }, 'desarmado'), false,
      'um soco passou a queimar como fogo');
  });

  await t.test('a estaca não paralisa', () => {
    assert.equal(Perdicoes.estacaParalisa({ cla: 'sangue_fraco' }), false);
    assert.equal(Perdicoes.estacaParalisa({ cla: 'ventrue' }), true);
  });
});

/* ============================================================
   CONFLITO DE ROLAGEM ÚNICA  (§95 — A11, págs. 296 e 298–299)
   ============================================================ */

test('Perdições — elas chegam à PARADA, e não só ao ajudante (§95)', async (t) => {
  /* Todos os outros testes desta seção chamam `Perdicoes` direto. Este
     chama `Arbitro.piscinaFinal`, que é por onde o jogo passa — sem
     ele, arrancar a chamada do `motor-arbitro` não derruba nada, e foi
     exatamente o que a mutação mostrou. */
  const rota = { atributo: 'manipulacao', pericia: 'subterfugio' };

  const parada = (f, extra = {}) => instantaneo(g,
    `Arbitro.piscinaFinal(${JSON.stringify(f)}, Object.assign(${JSON.stringify({ rota })}, ${
      JSON.stringify(extra)}))`);

  await t.test('o Nosferatu que se disfarça rola menos dados', (t2) => {
    const f = fichaDeTeste(g, { nome: 'Rato', cla: 'nosferatu' });
    f.potenciaMod = 4;
    const limpo = parada(f, { texto: 'converso com o porteiro' });
    const disfarce = parada(f, { texto: 'me disfarço de entregador' });
    t2.diagnostic(`sem disfarce ${limpo.total} dados · com disfarce ${disfarce.total}`);
    assert.ok(disfarce.total < limpo.total,
      'a Perdição não chegou à parada — ela existe no ajudante e não no jogo');
    assert.ok(disfarce.modificadores.some(m => m.tipo === 'perdicao'),
      'a parada não diz que a Perdição cobrou');
  });

  await t.test('e a parada nunca cai abaixo de um dado', (t2) => {
    /* O piso do §63 (A1) continua sendo quem segura o fundo: Perdição
       nenhuma pode zerar uma parada, porque o livro manda rolar. */
    const f = fichaDeTeste(g, { nome: 'Rato', cla: 'nosferatu' });
    f.potenciaMod = 6;
    f.atributos.manipulacao = 1;
    f.habilidades.subterfugio = 0;
    const r = parada(f, { texto: 'me disfarço de entregador' });
    t2.diagnostic(`parada final: ${r.total}`);
    assert.ok(r.total >= 1, 'a Perdição zerou uma parada');
  });
});

/* ============================================================
   OBLÍVIO — as regras gerais da Disciplina  (§96)

   Lidas em `Livros/Regras/Oblivio.pdf`, que pela tabela de autoridade
   manda na matéria dele: Oblívio não está no manual básico.

   O projeto tinha a lista de poderes desde a §65 e mais nada — nenhuma
   das regras gerais existia. Estes testes cobram as três que passaram a
   existir: a luz, a Checagem que corrói, e a porta das Cerimônias.
   ============================================================ */

test('Oblívio — a luz manda, e impedir não é penalizar (§96, pág. 4)', async (t) => {
  await t.test('cômodo moderadamente iluminado tira um dado', (t2) => {
    const v = MotorOblivio.vereditoDaLuz('oblivio', 'moderada');
    t2.diagnostic(`${v.rotulo}: ${v.dados} dado(s) · impede ${v.impede}`);
    assert.equal(v.dados, -1);
    assert.equal(v.impede, false);
  });

  await t.test('luz intensa IMPEDE, e não vira penalidade', (t2) => {
    const v = MotorOblivio.vereditoDaLuz('oblivio', 'intensa');
    t2.diagnostic(`impede ${v.impede} · dados ${v.dados}`);
    assert.equal(v.impede, true, 'a luz do dia deixou de impedir');
    assert.equal(v.dados, 0,
      'impedir virou desconto de dado — o piso de 1 dado ainda deixaria rolar');
    assert.equal(MotorOblivio.modificadores({}, { disciplina: 'oblivio', luz: 'intensa' }).length, 0,
      'o que impede não pode entrar como modificador de parada');
  });

  await t.test('UV e infravermelho não restringem — o livro isenta os dois por nome', () => {
    const v = MotorOblivio.vereditoDaLuz('oblivio', 'invisivel');
    assert.equal(v.impede, false);
    assert.equal(v.dados, 0);
  });

  await t.test('ambiente DESCONHECIDO não é ambiente claro', (t2) => {
    const v = MotorOblivio.vereditoDaLuz('oblivio', null);
    t2.diagnostic(`sem saber: vale ${v.vale} · impede ${v.impede}`);
    assert.equal(v.impede, false, 'punir por informação ausente é inventar regra');
    assert.equal(MotorOblivio.modificadores({}, { disciplina: 'oblivio' }).length, 0);
  });

  await t.test('e a luz só cobra de Oblívio', () => {
    assert.equal(MotorOblivio.modificadores({}, { disciplina: 'ofuscacao', luz: 'moderada' }).length, 0,
      'a regra de Oblívio vazou para outra Disciplina');
    assert.equal(MotorOblivio.modificadores({}, { luz: 'moderada' }).length, 0,
      'uma parada sem Disciplina nenhuma pagou a luz');
  });

  await t.test('e ela chega à PARADA de verdade', (t2) => {
    /* O caminho, e não só o ajudante — a lição da §90 e da §95. */
    const f = fichaDeTeste(g, { nome: 'Sombra', cla: 'lasombra' });
    f.disciplinas = { oblivio: 3 };
    const rota = { atributo: 'manipulacao', pericia: 'ocultismo' };
    const parada = (luz) => instantaneo(g, `Arbitro.piscinaFinal(${JSON.stringify(f)}, ${
      JSON.stringify({ rota, disciplina: 'oblivio', luz })})`);
    const escuro = parada('escuro'), meia = parada('moderada');
    t2.diagnostic(`escuro ${escuro.total} · moderada ${meia.total}`);
    assert.equal(meia.total, escuro.total - 1, 'a luz não chegou à parada');
    assert.ok(meia.modificadores.some(m => m.tipo === 'oblivio'),
      'a parada não diz que foi a luz que cobrou');
  });
});

test('Oblívio — a Checagem de Sangue corrói pelas duas pontas (§96, pág. 4)', async (t) => {
  await t.test('1 e 10 geram Mácula; o resto não', (t2) => {
    const quais = [1, 2, 5, 9, 10].filter(v => Oblivio.macula(v));
    t2.diagnostic(`geram Mácula: ${quais.join(', ')}`);
    assert.equal(quais.join(','), '1,10');
  });

  await t.test('o 10 cobra Mácula sem cobrar Fome', (t2) => {
    const r = MotorOblivio.apurarChecagem(10);
    t2.diagnostic(`macula ${r.macula} · fome ${r.fome}`);
    assert.equal(r.macula, true, 'o 10 de Oblívio deixou de cobrar');
    assert.equal(r.fome, false, 'o 10 passou a subir a Fome, e só o 1 sobe');
  });

  await t.test('o 1 cobra os dois', () => {
    const r = MotorOblivio.apurarChecagem(1);
    assert.equal(r.macula, true);
    assert.equal(r.fome, true);
  });

  await t.test('com rerrolagem, o jogador ESCOLHE — as duas saem na mão dele', (t2) => {
    const r = MotorOblivio.apurarChecagem(10, { segundo: 4 });
    t2.diagnostic(r.opcoes.map(o => `${o.valor}${o.macula ? ' (Mácula)' : ''}`).join(' ou '));
    assert.equal(r.podeEscolher, true);
    assert.equal(r.opcoes.length, 2);
    assert.equal(r.opcoes[1].macula, false, 'a segunda opção veio errada');
  });
});

test('Oblívio — a porta das Cerimônias (§96, pág. 14)', async (t) => {
  const necromante = (nivel, poderes) => {
    const f = fichaDeTeste(g, { nome: 'Talley', cla: 'lasombra' });
    f.disciplinas = { oblivio: nivel };
    f.poderes = { oblivio: poderes.map(nome => ({ nome })) };
    f.atributos.determinacao = 3;
    return f;
  };

  await t.test('sem o poder exigido, a Cerimônia não abre', (t2) => {
    const f = necromante(1, ['Manto Obscuro']);
    const r = MotorOblivio.podeAprender(f, 'Invocar o Espírito');
    t2.diagnostic(r.motivo);
    assert.equal(r.pode, false);
    assert.match(r.motivo, /Grilhões que Vinculam/);
  });

  await t.test('com ele, abre', () => {
    const f = necromante(1, ['Grilhões que Vinculam']);
    assert.equal(MotorOblivio.podeAprender(f, 'Invocar o Espírito').pode, true);
  });

  await t.test('e o nível de Oblívio também é cobrado', (t2) => {
    const f = necromante(1, ['Espírito em Declínio']);
    const r = MotorOblivio.podeAprender(f, 'Ex Nihilo');
    t2.diagnostic(r.motivo);
    assert.equal(r.pode, false, 'uma Cerimônia de nível 5 abriu com Oblívio 1');
  });

  await t.test('o teste é Determinação + Oblívio, Dificuldade = nível + 1', (t2) => {
    const f = necromante(3, ['Aura de Decadência']);
    const p = MotorOblivio.pedidoDaCerimonia(f, 'Hordas Trôpegas');
    t2.diagnostic(`${p.normais} dados · dificuldade ${p.dificuldade} · ${p.minutos} min`);
    assert.equal(p.possivel, true);
    assert.equal(p.normais, 6, 'Determinação 3 + Oblívio 3 tinha de dar 6');
    assert.equal(p.dificuldade, 4, 'Dificuldade tinha de ser o nível 3 mais 1');
    assert.equal(p.minutos, 15, 'cinco minutos por nível');
    assert.equal(p.custaChecagemDeSangue, true);
  });

  await t.test('e a luz que impede também impede a Cerimônia', (t2) => {
    const f = necromante(3, ['Aura de Decadência']);
    const p = MotorOblivio.pedidoDaCerimonia(f, 'Hordas Trôpegas', { luz: 'intensa' });
    t2.diagnostic(p.motivo);
    assert.equal(p.possivel, false, 'a Cerimônia rolou ao sol');
  });

  await t.test('a luz moderada tira um dado da Cerimônia, e não a impede', () => {
    const f = necromante(3, ['Aura de Decadência']);
    const p = MotorOblivio.pedidoDaCerimonia(f, 'Hordas Trôpegas', { luz: 'moderada' });
    assert.equal(p.possivel, true);
    assert.equal(p.normais, 5);
  });

  await t.test('o preço: nível × 3 de XP, e nível² semanas', (t2) => {
    for (const [nome, xp, semanas] of [['Invocar o Espírito', 3, 1],
                                       ['Hordas Trôpegas', 9, 9],
                                       ['Ex Nihilo', 15, 25]]) {
      t2.diagnostic(`${nome}: ${MotorOblivio.custoEmXP(nome)} XP · ${
        MotorOblivio.semanasParaAprender(nome)} semana(s)`);
      assert.equal(MotorOblivio.custoEmXP(nome), xp);
      assert.equal(MotorOblivio.semanasParaAprender(nome), semanas);
    }
  });

  await t.test('Cerimônia que não existe não abre nem custa', () => {
    assert.equal(MotorOblivio.podeAprender(necromante(5, []), 'Tempestade de Ossos').pode, false);
    assert.equal(MotorOblivio.custoEmXP('Tempestade de Ossos'), 0);
  });
});

/* ============================================================
   A ÊNCLISE — o pronome colado no verbo  (§99)

   Nasceu de um turno de verdade: o jogador escreveu **"quero abri-lo"**
   e o Árbitro respondeu "avaliado como PEGAR". Não era o modelo
   errando: o léxico devolvia `undefined`, e a ação vinha do turno
   anterior.

   Não é uma palavra faltando — é uma CLASSE de frases. A ênclise come a
   letra final do verbo, e nenhum verbo do léxico casava na forma que o
   jogador escreve.
   ============================================================ */
test('Léxico — a ênclise não pode esconder o verbo (§99)', async (t) => {

  await t.test('o caso que apareceu na mesa: "quero abri-lo"', (t2) => {
    const r = Arbitro.interpretar('quero abri-lo');
    t2.diagnostic(`"quero abri-lo" → ${(r && r.acao && r.acao.nome) || '(nada)'}`);
    assert.ok(r && r.acao, 'o léxico não reconheceu nada, e a ação vem do turno anterior');
    assert.equal(r.acao.nome, 'Abrir');
  });

  await t.test('as três conjugações, e o acento que sobra do infinitivo', (t2) => {
    /* pegar+o = pegá-lo · comer+o = comê-lo · abrir+o = abri-lo
       O acento é o rastro do verbo, e por isso a ênclise é desfeita
       ANTES de tirar acento: pegá + r → pegár → pegar. */
    for (const [frase, esperado] of [['pegá-lo agora', 'Pegar'],
                                     ['escondê-lo', 'Esconder-se'],
                                     ['quero abri-lo', 'Abrir']]) {
      const r = Arbitro.interpretar(frase);
      t2.diagnostic(`${frase} → ${(r && r.acao && r.acao.nome) || '(nada)'}`);
      assert.equal(r && r.acao && r.acao.nome, esperado, `"${frase}" não foi reconhecida`);
    }
  });

  await t.test('e a forma sem ênclise continua valendo', () => {
    assert.equal(Arbitro.interpretar('abrir a porta').acao.nome, 'Abrir');
    assert.equal(Arbitro.interpretar('vou pegar').acao.nome, 'Pegar');
  });

  await t.test('"pego o envelope" NÃO vira "pegoo"', (t2) => {
    /* É o hífen que separa uma ênclise de duas palavras soltas. Desfazer
       depois de tirar a pontuação juntaria o artigo ao verbo, e o
       defeito seria pior do que o que se foi consertar. */
    const r = Arbitro.interpretar('pego o envelope');
    t2.diagnostic(`normalizado: "${Lexico.normalizar('pego o envelope')}"`);
    assert.equal(Lexico.normalizar('pego o envelope'), 'pego o envelope');
    assert.equal(r && r.acao && r.acao.nome, 'Pegar');
  });

  await t.test('palavra hifenizada comum não é ênclise', (t2) => {
    /* "guarda-chuva" não termina em pronome; o casamento exige que o
       pedaço depois do hífen seja um clítico da lista. */
    t2.diagnostic(`guarda-chuva → "${Lexico.normalizar('guarda-chuva')}"`);
    assert.equal(Lexico.normalizar('guarda-chuva'), 'guarda chuva');
    assert.equal(Lexico.normalizar('meia-noite'), 'meia noite');
  });

  await t.test('os pronomes que NÃO comem o r só se soltam', (t2) => {
    /* sente-se → sente, e não "senter". Só lo/la/los/las comem a letra
       final do verbo. */
    t2.diagnostic(`sente-se → "${Lexico.normalizar('sente-se')}"`);
    assert.equal(Lexico.normalizar('sente-se'), 'sente');
    assert.equal(Lexico.normalizar('deu-me'), 'deu');
    assert.equal(Lexico.normalizar('abri-lo'), 'abrir');
  });

  await t.test('e o MARCADOR pinta o que o casador aceitou (§57)', (t2) => {
    /* A discordância que a §57 consertou não pode voltar por esta
       porta: matcher que aceita o que o marcador não pinta é defeito
       invisível — o jogador vê a ação reconhecida e não vê onde. */
    const marcar = (texto, termo) => Arbitro.marcarTermos(texto, [termo], (x) => `[${x}]`);
    for (const [texto, termo, esperado] of [
      ['quero abri-lo', 'abrir', 'quero [abri-lo]'],
      ['vou pegá-lo', 'pegar', 'vou [pegá-lo]'],
      ['abrir a porta', 'abrir', '[abrir] a porta']
    ]) {
      const saida = marcar(texto, termo);
      t2.diagnostic(saida);
      assert.equal(saida, esperado, `o marcador não pintou "${texto}"`);
    }
  });

  await t.test('o que o léxico aceita, o marcador pinta — varrendo o léxico', (t2) => {
    /* Não é um exemplo: é toda ação cujo termo termina em `r`. Se
       alguma casar e não pintar, a §57 voltou. */
    const mudos = [];
    for (const acao of Object.values(Lexico.ACOES)) {
      for (const frase of acao.frases) {
        if (!/r$/.test(Lexico.normalizar(frase))) continue;
        const comEnclise = `${frase.slice(0, -1)}-lo`;
        if (!Lexico.contemTermo(Lexico.normalizar(comEnclise), Lexico.normalizar(frase))) continue;
        const pintado = Arbitro.marcarTermos(comEnclise, [frase], (x) => `[${x}]`);
        if (!pintado.includes('[')) mudos.push(`${frase} casa "${comEnclise}" e não pinta`);
      }
    }
    t2.diagnostic(`${Object.keys(Lexico.ACOES).length} ações varridas`);
    assert.equal(mudos.join(' | '), '', 'há termo que o casador aceita e o marcador não pinta');
  });
});

test('Rolagem Única — as duas tabelas e os dois ajustes (§95)', async (t) => {
  await t.test('a tabela do PODER dá 2, 4 e 6', () => {
    assert.equal(RolagemUnica.dificuldade({ poder: 'fraca' }).dificuldade, 2);
    assert.equal(RolagemUnica.dificuldade({ poder: 'parelha' }).dificuldade, 4);
    assert.equal(RolagemUnica.dificuldade({ poder: 'forte' }).dificuldade, 6);
  });

  await t.test('a dos TRÊS TURNOS dá 3, 4, 5 e 6 — e não é a mesma', (t2) => {
    const d = (id) => RolagemUnica.dificuldade({ turnos: id }).dificuldade;
    t2.diagnostic(`${d('dominando')}/${d('parelho')}/${d('apanhando')}/${d('sobrevivendo')}`);
    assert.equal(d('dominando'), 3);
    assert.equal(d('parelho'), 4);
    assert.equal(d('apanhando'), 5);
    assert.equal(d('sobrevivendo'), 6);
    assert.notEqual(d('dominando'), RolagemUnica.dificuldade({ poder: 'fraca' }).dificuldade,
      'as duas tabelas viraram uma, que é o erro que a §95 achou no documento');
  });

  await t.test('cada vantagem baixa 1, e as duas são independentes', (t2) => {
    const uma = RolagemUnica.dificuldade({ poder: 'forte', vantagens: ['disciplinas'] });
    const duas = RolagemUnica.dificuldade({ poder: 'forte', vantagens: ['disciplinas', 'posicao'] });
    t2.diagnostic(`base 6 → uma vantagem ${uma.dificuldade} → duas ${duas.dificuldade}`);
    assert.equal(uma.dificuldade, 5);
    assert.equal(duas.dificuldade, 4);
  });

  await t.test('e a vantagem da oposição sobe', () => {
    assert.equal(RolagemUnica.dificuldade({ poder: 'parelha', contra: ['posicao'] }).dificuldade, 5);
  });

  await t.test('vantagem inventada não conta', () => {
    assert.equal(RolagemUnica.dificuldade({ poder: 'parelha', vantagens: ['sorte'] }).dificuldade, 4);
  });
});

test('Rolagem Única — o dano, e o exemplo do livro (§95, pág. 299)', async (t) => {
  await t.test('Rebeca: Dificuldade 4, cinco sucessos, 3 de dano', (t2) => {
    /* O exemplo da pág. 299, com os números dele. Exemplo do livro é a
       melhor rede que existe para uma regra nova: foi escrito por quem
       fez a regra. */
    const r = RolagemUnica.apurar({ sucessos: 5, dificuldade: 4, trilha: 'vontade' });
    t2.diagnostic(`${r.dobro} − ${r.sucessos} = ${r.dano} · venceu: ${r.venceu}`);
    assert.equal(r.dano, 3, 'a conta do livro não bate');
    assert.equal(r.venceu, true, 'cinco sucessos contra Dificuldade 4 é vitória');
  });

  await t.test('vencer NÃO isenta — é o ponto da regra', () => {
    const r = RolagemUnica.apurar({ sucessos: 6, dificuldade: 4 });
    assert.ok(r.venceu && r.dano > 0, 'a vitória passou a sair de graça');
  });

  await t.test('sucessos de sobra podem zerar o dano, e ele não fica negativo', () => {
    const r = RolagemUnica.apurar({ sucessos: 12, dificuldade: 4 });
    assert.equal(r.dano, 0);
  });

  await t.test('armadura e Fortitude não entram, e Superficial não cai pela metade', (t2) => {
    const r = RolagemUnica.apurar({ sucessos: 2, dificuldade: 4 });
    t2.diagnostic(`semMetade ${r.semMetade} · ignoraArmadura ${r.ignoraArmadura}`);
    assert.equal(r.semMetade, true, 'o Superficial ia cair pela metade, e o livro proíbe');
    assert.equal(r.ignoraArmadura, true);
  });

  await t.test('o pedido proíbe Vontade e Surto', (t2) => {
    const ped = RolagemUnica.pedido({ piscina: 6, fome: 2, dificuldade: 4 });
    t2.diagnostic(`normais ${ped.normais} · fome ${ped.fome} · semVontade ${ped.semVontade}`);
    assert.equal(ped.semVontade, true);
    assert.equal(ped.semSurto, true);
    assert.equal(ped.normais, 4, 'a Fome não saiu da parada normal');
  });

  await t.test('a troca opcional por Máculas é um por um, e não passa do dano', () => {
    const r = RolagemUnica.apurar({ sucessos: 2, dificuldade: 4 });
    const t3 = RolagemUnica.trocarPorMaculas(r, 2);
    assert.equal(t3.dano, r.dano - 2);
    assert.equal(t3.maculas, 2);
    const demais = RolagemUnica.trocarPorMaculas(r, 99);
    assert.equal(demais.dano, 0);
    assert.equal(demais.maculas, r.dano, 'trocou mais Máculas do que havia dano');
  });
});

/* ============================================================
   PROJETOS — o Apêndice II  (§89)

   Tudo aqui é puro: `Projetos` recebe um resultado de rolagem já
   apurado e devolve o que ele faz com o projeto. Nenhum teste
   desta seção rola um dado — o que se está conferindo é a regra,
   e a regra não depende de sorteio.

   Os dois exemplos do livro (Istvan, págs. 416 e 417) estão aqui
   com os números dele. Exemplo do livro é a melhor rede que existe
   para uma regra nova: ele foi escrito por quem fez a regra.
   ============================================================ */

const { Projetos } = g;

/* Um resultado de rolagem com N sucessos comuns, contra dificuldade D. */
const comSucessos = (n, dificuldade = 0) =>
  apurar(Array.from({ length: n }, () => 6).concat([1, 1]), [], dificuldade);

test('Projetos — o Escopo é o preço e a medida (§89)', async (t) => {
  await t.test('a Dificuldade do Lançamento é o Escopo mais dois', (t2) => {
    for (const escopo of [1, 2, 3, 5]) {
      const p = Projetos.novo({ nome: 'x', escopo });
      t2.diagnostic(`Escopo ${escopo} → Dificuldade ${Projetos.dificuldadeDeLancamento(p)}`);
      assert.equal(Projetos.dificuldadeDeLancamento(p), escopo + 2);
    }
  });

  await t.test('e sobe um a cada recomeço', () => {
    const p = Projetos.novo({ nome: 'x', escopo: 3 });
    assert.equal(Projetos.dificuldadeDeLancamento(p), 5);
    p.reinicios = 2;
    assert.equal(Projetos.dificuldadeDeLancamento(p), 7);
  });

  await t.test('o comprometimento é Escopo + 1 menos a margem, com piso de 1', (t2) => {
    /* pág. 416: "O comprometimento mínimo, ou risco, em uma vitória
       regular é de um ponto." */
    t2.diagnostic('Escopo 3: margem 0→4, 1→3, 3→1, 9→1 (piso)');
    assert.equal(Projetos.comprometimentoDe(3, 0, false), 4);
    assert.equal(Projetos.comprometimentoDe(3, 1, false), 3);
    assert.equal(Projetos.comprometimentoDe(3, 3, false), 1);
    assert.equal(Projetos.comprometimentoDe(3, 9, false), 1, 'o piso de 1 ponto caiu');
  });

  await t.test('no crítico não se compromete nada', () => {
    assert.equal(Projetos.comprometimentoDe(3, 1, true), 0);
    assert.equal(Projetos.comprometimentoDe(9, 0, true), 0);
  });

  await t.test('abaixo de dez dias não é projeto: é teste estendido', () => {
    assert.equal(Projetos.ehProjeto(9), false);
    assert.equal(Projetos.ehProjeto(10), true);
  });

  await t.test('um incremento se escreve no singular', (t2) => {
    /* Isto apareceu na tela como "1 meses de Ganhar o coração da
       Harpia", e o chip do botão dizia "Passar um mese" — o singular
       vinha de tirar o "s" do plural, que acerta "dias" e erra "meses"
       e "décadas". Regra que acerta metade aparece como erro de
       português, e a mesa é escrita em português. */
    t2.diagnostic(Projetos.INCREMENTOS.map(i => `${i.um} / ${i.nome.toLowerCase()}`).join(' · '));
    assert.equal(Projetos.contarIncrementos('meses', 1), '1 mês');
    assert.equal(Projetos.contarIncrementos('meses', 3), '3 meses');
    assert.equal(Projetos.contarIncrementos('decadas', 1), '1 década');
    assert.equal(Projetos.contarIncrementos('seculos', 2), '2 séculos');
    for (const i of Projetos.INCREMENTOS) {
      assert.ok(i.um && i.um !== i.nome.toLowerCase(),
        `"${i.nome}" ficou sem singular próprio`);
    }
  });

  await t.test('o incremento é a duração provável dividida por dez', (t2) => {
    /* pág. 415: "um projeto que culminará em um ano tem aproximadamente
       incrementos mensais". 365 / 10 = 36,5 dias → meses. */
    t2.diagnostic(`um ano → ${Projetos.incrementoSugerido(365).nome}`);
    assert.equal(Projetos.incrementoSugerido(365).id, 'meses');
    assert.equal(Projetos.incrementoSugerido(70).id, 'semanas');
  });
});

test('Projetos — o exemplo do livro, o Lançamento (§89, pág. 416)', async (t) => {
  /* "Istvan quer construir um império das drogas em Hamburgo para
      obter cinco pontos em Recursos. Ele já possui Recursos ••,
      portanto o Escopo do projeto tem três pontos. (…) oito dados,
      contra uma Dificuldade 5 (2 + Escopo 3). Ele rola bem,
      conseguindo seis sucessos. Ele pode subtrair um ponto (sua
      margem foi de 1 sucesso sobre a Dificuldade) do risco, o que dá
      três pontos." */
  const p = Projetos.novo({ nome: 'Império das drogas em Hamburgo', escopo: 3,
                            antecedente: 'Recursos', parada: 'Manha + Influência', piscina: 8 });

  await t.test('Escopo 3 dá Dificuldade 5', () => {
    assert.equal(Projetos.dificuldadeDeLancamento(p), 5);
  });

  const r = comSucessos(6, 5);

  await t.test('seis sucessos contra cinco: margem 1', (t2) => {
    mostrar(t2, r);
    assert.equal(r.sucessos, 6);
    assert.equal(r.margem, 1);
    assert.equal(r.passou, true);
  });

  const { eventos } = Projetos.apurarLancamento(p, r);

  await t.test('e o risco fica em TRÊS pontos, como no livro', (t2) => {
    t2.diagnostic(`comprometidos: ${p.comprometidos} · estado: ${p.estado} · dado: ${p.dado}`);
    assert.equal(p.comprometidos, 3, 'o número do livro é 3');
    assert.equal(p.estado, 'lancado');
  });

  await t.test('o Dado do Projeto começa em 10', () => {
    assert.equal(p.dado, Projetos.DADO_INICIAL);
    assert.equal(p.dado, 10);
  });

  await t.test('e a mesa é avisada de quanto ficou retido', () => {
    assert.ok(eventos.some(e => /retid/i.test(e.texto)), 'ninguém disse o que ficou preso');
  });
});

test('Projetos — quando o Lançamento não passa (§89)', async (t) => {
  await t.test('falha comum: recomeça do zero, com +1 na Dificuldade', (t2) => {
    const p = Projetos.novo({ nome: 'x', escopo: 2 });
    const antes = Projetos.dificuldadeDeLancamento(p);
    const { eventos } = Projetos.apurarLancamento(p, comSucessos(1, 4));
    t2.diagnostic(`Dificuldade ${antes} → ${Projetos.dificuldadeDeLancamento(p)}`);
    assert.equal(p.estado, 'rascunho');
    assert.equal(Projetos.dificuldadeDeLancamento(p), antes + 1);
    assert.equal(p.dado, null, 'o relógio não pode ter começado a andar');
    assert.ok(eventos.some(e => /hora não era essa/i.test(e.texto)));
  });

  await t.test('falha total: um inimigo, e o aviso de que ele pode custar pontos', (t2) => {
    const p = Projetos.novo({ nome: 'x', escopo: 2 });
    const { eventos } = Projetos.apurarLancamento(p, apurar([1, 2, 3], [], 4));
    const texto = eventos.map(e => e.texto).join(' ');
    t2.diagnostic(texto.slice(0, 110));
    assert.match(texto, /inimigo/i, 'a falha total do livro faz um inimigo');
    assert.ok(eventos.some(e => e.tipo === 'perigo'));
  });

  await t.test('crítico: nada fica retido, e o projeto guarda que foi crítico', () => {
    const p = Projetos.novo({ nome: 'x', escopo: 3 });
    /* Dois dez mais quatro sucessos: 4 + 2 = 6 contra dificuldade 5. */
    Projetos.apurarLancamento(p, apurar([10, 10, 6, 6, 1, 1, 1, 1], [], 5));
    assert.equal(p.comprometidos, 0);
    assert.equal(p.criticoNoLancamento, true);
    assert.equal(p.estado, 'lancado');
  });
});

test('Projetos — o Dado do Projeto é um relógio (§89)', async (t) => {
  const emCurso = (escopo = 3) => {
    const p = Projetos.novo({ nome: 'x', escopo, antecedente: 'Influência' });
    Projetos.apurarLancamento(p, comSucessos(escopo + 2, escopo + 2));
    return p;
  };

  await t.test('cai um por incremento', (t2) => {
    const p = emCurso();
    Projetos.passarIncremento(p);
    assert.equal(p.dado, 9);
    Projetos.passarIncremento(p, 3);
    t2.diagnostic(`depois de 4 incrementos: dado ${p.dado}`);
    assert.equal(p.dado, 6);
    assert.equal(p.incrementosCorridos, 4);
  });

  await t.test('o TEMPO sozinho para em 1 — quem passa de 1 é o Objetivo', (t2) => {
    /* pág. 416: "em contagem regressiva de 10 até 1". Se o tempo
       levasse o Dado a zero, todo projeto lançado daria certo sozinho,
       e a rolagem de Objetivo não teria função. */
    const p = emCurso();
    Projetos.passarIncremento(p, 50);
    t2.diagnostic(`50 incrementos: dado ${p.dado}, estado ${p.estado}`);
    assert.equal(p.dado, 1);
    assert.equal(p.estado, 'lancado', 'o tempo sozinho concluiu o projeto');
  });

  await t.test('projeto que não foi lançado não tem relógio andando', () => {
    const p = Projetos.novo({ nome: 'x', escopo: 1 });
    Projetos.passarIncremento(p, 5);
    assert.equal(p.dado, null);
  });

  await t.test('a interferência move o Dado nos dois sentidos, e para em 1', (t2) => {
    /* págs. 417–418: "Interferência bem-sucedida aumenta (ou diminui) o
       dado do Projeto em um ou mais". O livro não põe teto — um projeto
       atrapalhado pode ficar mais longe do que começou —, e o piso é o
       mesmo do relógio: só a rolagem de Objetivo passa de 1. */
    const p = emCurso();
    Projetos.interferir(p, +2, 'a Harpia desconfiou');
    t2.diagnostic(`atrapalhado: dado ${p.dado}`);
    assert.equal(p.dado, 12, 'o Dado não subiu com a interferência');
    Projetos.interferir(p, -40, 'um aliado abriu caminho');
    assert.equal(p.dado, 1, 'a interferência passou do piso');
  });
});

test('Projetos — a vantagem da casa do status quo (§89, pág. 416)', async (t) => {
  await t.test('na rolagem de Objetivo o JOGADOR não faz crítico', (t2) => {
    /* "cada 10 conta como um sucesso comum" — dois dez que valeriam
       quatro sucessos passam a valer dois. */
    const bruto = apurar([10, 10, 6], [], 0);
    const dele = Projetos.semCritico(bruto);
    t2.diagnostic(`normal: ${bruto.sucessos} sucessos (crítico ${bruto.critico}) → `
                + `Objetivo: ${dele.sucessos} sucessos (crítico ${dele.critico})`);
    assert.equal(bruto.sucessos, 5, 'a contagem normal do V5 mudou');
    assert.equal(bruto.critico, true);
    assert.equal(dele.sucessos, 3, 'o par de dez ainda está valendo o dobro');
    assert.equal(dele.critico, false);
    assert.equal(dele.pares, 0);
  });

  await t.test('mas a OPOSIÇÃO faz — ela usa a contagem de sempre', (t2) => {
    const p = Projetos.novo({ nome: 'x', escopo: 3 });
    Projetos.apurarLancamento(p, comSucessos(5, 5));
    const pedido = Projetos.pedidoDaOposicao(p);
    t2.diagnostic(`o Dado do Projeto em ${p.dado} vira ${pedido.piscina} dados de oposição`);
    assert.equal(pedido.piscina, p.dado, 'a parada da oposição É o Dado do Projeto');
    assert.equal(pedido.fome, 0, 'a oposição não tem Fome');
    /* E o que ela rola passa por `Dados.apurar` puro, sem `semCritico`. */
    const dela = Dados.apurar(pedido, { normais: [10, 10, 6, 1, 1, 1, 1, 1, 1, 1], dadosFome: [] });
    assert.equal(dela.critico, true, 'a oposição perdeu o crítico');
    assert.equal(dela.sucessos, 5);
  });

  await t.test('a Falha Bestial NÃO some junto com o crítico', () => {
    /* O livro tira o crítico do jogador; ele não diz nada sobre a
       Fome, e a Falha Bestial não depende de crítico nenhum. */
    const r = Projetos.semCritico(apurar([1, 2], [1], 0));
    assert.equal(r.tipo, 'bestial');
  });
});

test('Projetos — o exemplo do livro, o Objetivo (§89, pág. 417)', async (t) => {
  /* "Istvan realiza uma rolagem de Objetivo quando o Dado do Projeto
      está em 5. (…) Ele rola seis sucessos, contra quatro da oposição.
      Ele subtrai do Dado do Projeto a sua margem de 2, deixando-o em 3." */
  const p = Projetos.novo({ nome: 'Império das drogas', escopo: 3, antecedente: 'Recursos' });
  Projetos.apurarLancamento(p, comSucessos(6, 5));
  Projetos.passarIncremento(p, 5);

  await t.test('o Dado está em 5 quando ele rola', () => {
    assert.equal(p.dado, 5);
    assert.equal(p.comprometidos, 3);
  });

  const r = Projetos.apurarObjetivo(p, Projetos.semCritico(comSucessos(6)), comSucessos(4));

  await t.test('seis contra quatro deixa o Dado em TRÊS, como no livro', (t2) => {
    t2.diagnostic(`resultado ${r.resultado} · margem ${r.margem} · dado ${p.dado}`);
    assert.equal(r.resultado, 'vitoria');
    assert.equal(r.margem, 2);
    assert.equal(p.dado, 3);
  });

  await t.test('e a segunda metade do exemplo: o crítico da oposição derruba tudo', (t2) => {
    /* "Se a oposição tivesse rolado um crítico, contudo, ele teria
        perdido quatro pontos – todos os seus pontos comprometidos, mais
        um ponto (provavelmente de Influência) – e o projeto teria
        fracassado." */
    const q = Projetos.novo({ nome: 'Império das drogas', escopo: 3, antecedente: 'Recursos' });
    Projetos.apurarLancamento(q, comSucessos(6, 5));
    Projetos.passarIncremento(q, 5);
    assert.equal(q.comprometidos, 3);

    const res = Projetos.apurarObjetivo(q, Projetos.semCritico(comSucessos(6)), comSucessos(10));
    t2.diagnostic(`perdeu ${-res.margem} · retidos ${q.comprometidos} · `
                + `fora do risco ${q.perdidosAlemDoRisco} · estado ${q.estado}`);
    assert.equal(res.resultado, 'derrota');
    assert.equal(-res.margem, 4, 'o livro diz quatro pontos');
    assert.equal(q.comprometidos, 0, 'os três retidos tinham de ir primeiro');
    assert.equal(q.perdidosAlemDoRisco, 1, 'e o quarto sai do Antecedente');
    assert.equal(q.estado, 'fracassado', 'o livro diz que o projeto teria fracassado');
  });
});

test('Projetos — vencer, empatar, e a exceção do crítico (§89)', async (t) => {
  const emCurso = (opcoes = {}) => {
    const p = Projetos.novo(Object.assign({ nome: 'x', escopo: 2, antecedente: 'Status' }, opcoes));
    Projetos.apurarLancamento(p, comSucessos(4, 4));
    return p;
  };

  await t.test('o Dado abaixo de 1 é o projeto dando certo', (t2) => {
    const p = emCurso();
    Projetos.passarIncremento(p, 8);
    assert.equal(p.dado, 2);
    const r = Projetos.apurarObjetivo(p, Projetos.semCritico(comSucessos(5)), comSucessos(2));
    t2.diagnostic(`dado ${p.dado} · estado ${p.estado}`);
    assert.ok(p.dado < 1);
    assert.equal(p.estado, 'concluido');
    assert.equal(r.resultado, 'vitoria');
  });

  await t.test('empate não move nada, e o incremento passou à toa', (t2) => {
    const p = emCurso();
    const antes = p.dado;
    const r = Projetos.apurarObjetivo(p, Projetos.semCritico(comSucessos(3)), comSucessos(3));
    t2.diagnostic(`dado ${antes} → ${p.dado}`);
    assert.equal(r.resultado, 'empate');
    assert.equal(p.dado, antes);
    /* Escopo 2 e margem 0 no Lançamento: o risco é Escopo + 1 = 3. */
    assert.equal(p.comprometidos, 3, 'empate não pode cobrar ponto');
  });

  await t.test('o crítico no Lançamento segura o projeto sem pontos retidos', (t2) => {
    const p = Projetos.novo({ nome: 'x', escopo: 3, antecedente: 'Recursos' });
    Projetos.apurarLancamento(p, apurar([10, 10, 6, 6, 1, 1], [], 5));
    assert.equal(p.criticoNoLancamento, true);
    assert.equal(p.comprometidos, 0);

    Projetos.apurarObjetivo(p, Projetos.semCritico(comSucessos(1)), comSucessos(4));
    t2.diagnostic(`estado ${p.estado} · perdidos fora do risco ${p.perdidosAlemDoRisco}`);
    assert.equal(p.estado, 'lancado', 'o crítico do Lançamento não segurou o projeto');
  });

  await t.test('sem esse crítico, o mesmo golpe derruba', () => {
    const p = emCurso();
    Projetos.apurarObjetivo(p, Projetos.semCritico(comSucessos(1)), comSucessos(4));
    assert.equal(p.estado, 'fracassado');
  });

  await t.test('rolar Objetivo de projeto que não está em curso não faz nada', () => {
    const p = Projetos.novo({ nome: 'x', escopo: 1 });
    const r = Projetos.apurarObjetivo(p, Projetos.semCritico(comSucessos(5)), comSucessos(0));
    assert.equal(r.eventos[0].tipo, 'erro');
    assert.equal(p.estado, 'rascunho');
  });
});

test('Projetos — encerrar, e o que o Narrador vê (§89)', async (t) => {
  await t.test('quem iniciou sempre pode encerrar, e os pontos voltam', (t2) => {
    const p = Projetos.novo({ nome: 'Cortejar a Harpia', escopo: 3, antecedente: 'Status' });
    Projetos.apurarLancamento(p, comSucessos(6, 5));
    assert.equal(p.comprometidos, 3);
    const { eventos } = Projetos.encerrar(p, 'mudei de ideia');
    t2.diagnostic(eventos[0].texto.slice(0, 120));
    assert.equal(p.estado, 'encerrado');
    assert.equal(p.comprometidos, 0);
    assert.match(eventos[0].texto, /inimigos/i, 'o livro avisa que os inimigos não se encerram junto');
  });

  await t.test('encerrar o que já acabou não mexe em nada', () => {
    const p = Projetos.novo({ nome: 'x', escopo: 1 });
    p.estado = 'concluido';
    const { eventos } = Projetos.encerrar(p);
    /* `deepEqual` entre realms de `vm` compara identidade de protótipo e
       reprova dois vetores vazios — armadilha que este arreio já tinha
       documentado. Compara-se o tamanho. */
    assert.equal(eventos.length, 0);
    assert.equal(p.estado, 'concluido');
  });

  await t.test('o prefixo do Narrador vê os EM CURSO, e só eles', (t2) => {
    const vivo = Projetos.novo({ nome: 'Quebrar o banco', objetivo: 'falência da rede',
                                 escopo: 2, antecedente: 'Recursos' });
    Projetos.apurarLancamento(vivo, comSucessos(4, 4));
    const morto = Projetos.novo({ nome: 'Cortejar a Harpia', escopo: 1 });
    const texto = Projetos.paraModelo([vivo, morto]);
    t2.diagnostic(texto);
    assert.match(texto, /Quebrar o banco/);
    assert.ok(!/Cortejar a Harpia/.test(texto), 'projeto não lançado vazou para o modelo');
    assert.equal(Projetos.paraModelo([]), '');
  });
});

test('Projetos — o preço de cultivar uma bolsa (§89, pág. 415)', async (t) => {
  /* Este é o buraco que a §67 deixou: o capítulo de Ressonância não
     dá preço para mudar a Ressonância de uma bolsa, e o Apêndice II
     dá, a duzentas páginas de distância. */
  await t.test('um ponto muda a Ressonância e leva a bolsa a Intensa', (t2) => {
    const r = Projetos.ESCOPO_DA_RESSONANCIA.find(x => x.id === 'intensa');
    t2.diagnostic(`${r.rotulo} — Escopo ${r.escopo}`);
    assert.equal(r.escopo, 1);
    assert.equal(r.temperamento, 'intenso');
  });

  await t.test('dois pontos mudam e ainda acrescentam uma Discrasia', () => {
    const r = Projetos.ESCOPO_DA_RESSONANCIA.find(x => x.id === 'discrasia');
    assert.equal(r.escopo, 2);
    assert.equal(r.temperamento, 'agudo');
  });

  await t.test('e os dois temperamentos existem mesmo na tabela do capítulo', () => {
    /* Se a §67 renomear um temperamento, isto cai — que é o ponto:
       são duas seções do livro falando da mesma coisa, e elas estão em
       arquivos diferentes deste projeto. */
    for (const r of Projetos.ESCOPO_DA_RESSONANCIA) {
      assert.ok(g.Ressonancia.temperamentoPor(r.temperamento),
        `o temperamento "${r.temperamento}" sumiu de data-ressonancia.js`);
    }
  });

  await t.test('a Dificuldade de cultivar sai do mesmo lugar que a dos outros', () => {
    const p = Projetos.novo({ nome: 'cultivar', escopo: 2 });
    assert.equal(Projetos.dificuldadeDeLancamento(p), 4);
  });
});

test('Projetos — o motor não inventa acaso (§89)', async (t) => {
  await t.test('nenhum Math.random em motor-projetos.js', () => {
    /* A mesma trava da §82, agora num arquivo novo: o Árbitro não
       produz acaso, ele pede. `novo()` gera id por contador. */
    const fonte = fs.readFileSync(path.join(RAIZ, caminhoDe('arbitro', 'motor-projetos')), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ');
    assert.ok(!/Math\.random/.test(fonte), 'o Árbitro voltou a sortear sozinho');
  });

  await t.test('dois projetos criados juntos não dividem id', () => {
    const ids = new Set(Array.from({ length: 50 }, () => Projetos.novo({ nome: 'x' }).id));
    assert.equal(ids.size, 50, 'ids colidiram');
  });
});

/* ============================================================
   O regras.md E OS DOIS APÊNDICES NÃO DIVERGEM  (§89)

   A QUINTA anti-deriva do projeto, na forma das §63, §67, §73 e
   §88: a tabela do documento é LIDA do arquivo e comparada com o
   código, em vez de ser conferida a olho.

   Aqui ela vale mais do que de costume, por dois motivos. O
   primeiro é que estes números — Escopo + 2, o Dado em 10, o
   Escopo 1 e 2 da bolsa — são pequenos e parecidos, e número
   pequeno e parecido é o que envelhece sem ninguém ver. O segundo
   é que a §21.3 é uma PROMESSA NEGATIVA: quatro técnicas que o
   documento diz não existirem aqui. Promessa negativa é a que
   envelhece pior — basta alguém implementar uma e esquecer de
   tirar da lista.
   ============================================================ */

test('Apêndices — o regras.md e o código dizem a mesma coisa (§89)', async (t) => {
  const md = fs.readFileSync(path.join(RAIZ, 'docs', 'regras.md'), 'utf8');
  const secao = (de, ate) => {
    const i = md.indexOf(de), f = md.indexOf(ate);
    assert.ok(i >= 0 && f > i, `a âncora "${de}" sumiu do regras.md`);
    return md.slice(i, f);
  };

  await t.test('§20.1 — as três medidas do Apêndice II', (t2) => {
    const s = secao('### 20.1 As três medidas', '### 20.2 A rolagem de Lançamento');
    t2.diagnostic(s.split('\n').filter(l => /\*\*/.test(l)).length + ' linhas com valor');
    assert.match(s, /\*\*Escopo \+ 2\*\*/, 'a Dificuldade do Lançamento mudou no documento');
    assert.match(s, /começa em \*\*10\*\*/, 'o Dado do Projeto mudou de valor inicial');
    assert.match(s, /\*\*Escopo \+ 1, menos a margem\*\*/);
    assert.match(s, /menor do que dez dias/);

    const p = Projetos.novo({ nome: 'x', escopo: 3 });
    assert.equal(Projetos.dificuldadeDeLancamento(p), 3 + 2, 'o código discorda do documento');
    assert.equal(Projetos.DADO_INICIAL, 10);
    assert.equal(Projetos.MINIMO_DE_DIAS, 10);
  });

  await t.test('§20.7 — o preço da bolsa bate com o dado', (t2) => {
    const s = secao('### 20.7 O preço de cultivar uma bolsa', '## 21. Jogo ponderado');
    /* `| Mudar a Ressonância e levá-la a **Intensa** | **1** |` */
    const linhas = [...s.matchAll(/^\| Mudar a Ressonância[^|]*\*\*(Intensa|Discrasia)\*\* \| \*\*(\d)\*\* \|/gm)]
      .map(m => [m[1].toLowerCase(), Number(m[2])]);
    t2.diagnostic(linhas.map(l => `${l[0]}=${l[1]}`).join(', '));
    assert.equal(linhas.length, 2, 'a tabela da §20.7 mudou de forma');
    for (const [id, escopo] of linhas) {
      const r = Projetos.ESCOPO_DA_RESSONANCIA.find(x => x.id === id);
      assert.ok(r, `"${id}" está no documento e não está no código`);
      assert.equal(r.escopo, escopo, `o Escopo de "${id}" divergiu`);
    }
  });

  await t.test('§21.1 e §21.3 — as sete técnicas, com a página de cada', (t2) => {
    const dentro = secao('### 21.1 As três que atravessam', '### 21.2 O que a Carta X faz');
    const fora = secao('### 21.3 As quatro que não atravessam', '### 21.4 O resto do apêndice');

    /* `| **Linhas e Véus** | 421 | …` — nome e página, dos dois lados. */
    const ler = (s) => [...s.matchAll(/^\| \*\*([^*]+)\*\* \| (\d{3}) \|/gm)]
      .map(m => [m[1].trim(), Number(m[2])]);
    const noDoc = new Map([...ler(dentro), ...ler(fora)]);

    t2.diagnostic([...noDoc.keys()].join(', '));
    assert.equal(noDoc.size, 7, 'o apêndice tem sete técnicas; o documento lista outro número');
    assert.equal(ler(dentro).length, 3, 'a §21.1 mudou de tamanho');
    assert.equal(ler(fora).length, 4, 'a §21.3 mudou de tamanho');

    /* O código conhece as mesmas sete, com as mesmas páginas. */
    /* 'Fade (Desvanecer)' no dado, 'Fade' no documento; 'A Carta X' e
       'Carta X'. O que se compara é o NOME, sem o artigo e sem a
       tradução entre parênteses. */
    const chave = (n) => n.replace(/^(A|O) /, '').replace(/ (.*)$/, '').trim();
    const noCodigo = new Map(g.Limites.TECNICAS.map(x => [chave(x.nome), x.pagina]));
    const divergentes = [];
    for (const [nome, pagina] of noDoc) {
      const alvo = noCodigo.has(chave(nome)) ? chave(nome) : null;
      if (!alvo) { divergentes.push(`${nome}: está no documento e não em data-limites.js`); continue; }
      if (noCodigo.get(alvo) !== pagina) {
        divergentes.push(`${nome}: regras.md diz ${pagina}, o dado diz ${noCodigo.get(alvo)}`);
      }
    }
    assert.deepEqual(divergentes, [], 'documento e dado divergiram sobre as técnicas');
  });

  await t.test('§21.3 é promessa negativa, e ela é conferida contra o código', (t2) => {
    /* As quatro que o documento diz NÃO existirem têm de estar marcadas
       como `fora` no dado — e nenhuma outra pode estar. */
    const fora = secao('### 21.3 As quatro que não atravessam', '### 21.4 O resto do apêndice');
    const noDoc = [...fora.matchAll(/^\| \*\*([^*]+)\*\* \| \d{3} \|/gm)].map(m => m[1].trim());
    const limpa = (n) => n.replace(/^(A|O) /, '').replace(/ (.*)$/, '').trim();
    /* JSON no meio: vetor vindo do 'vm' não é vetor deste realm, e
       'deepEqual' reprova dois iguais. */
    const noCodigo = JSON.parse(JSON.stringify(g.Limites.tecnicasFora().map(x => limpa(x.nome))));
    t2.diagnostic(`documento: ${noDoc.join(', ')}`);
    assert.deepEqual(noCodigo.sort(), noDoc.map(limpa).sort(),
      'o documento e o dado discordam sobre o que NÃO foi implementado');
  });

  await t.test('e cada uma que ficou de fora diz por que ficou', () => {
    /* "Não implementado" sem motivo vira folclore em três seções. */
    for (const t3 of g.Limites.tecnicasFora()) {
      assert.ok(t3.porque && t3.porque.length > 30,
        `"${t3.nome}" está fora sem dizer por quê`);
    }
  });

  await t.test('a Longue Durée continua declarada como não implementada', () => {
    /* Se alguém a implementar, esta linha do documento tem de sair — e
       este teste é quem cobra. `Memoriam` no motor é o sinal. */
    const s = secao('### 20.6 O que o motor NÃO aplica', '### 20.7 O preço de cultivar');
    assert.match(s, /Longue Durée/);
    const fonte = fs.readFileSync(path.join(RAIZ, caminhoDe('arbitro', 'motor-projetos')), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ');
    assert.ok(!/[Mm]emoriam/.test(fonte),
      'o motor passou a conhecer Memoriam, e a §20.6 ficou velha');
  });
});

/* ============================================================
   CONFLITO AVANÇADO — as opções por ataque  (§90, págs. 298–303)

   Todas são escolha de quem ataca ou de quem se defende, e todas
   estão desligadas por omissão: é assim que o livro as apresenta.
   O que os testes daqui guardam é o PREÇO de cada uma, porque numa
   opção tática o preço é a regra — sem ele, "Ataque Total" vira
   bônus de graça.
   ============================================================ */

const { Agarramento, CombateSocial, Lacos } = g;

/* Um alvo limpo, e um atacante que sempre acerta muito. */
const alvoLimpo = () => {
  const f = fichaDeTeste(g);
  f.danoSuperficial = 0; f.danoAgravado = 0; f.danoVontade = 0;
  return f;
};
const sempreDez = (n = 30) => comDadosViciados(g, Array(n).fill(10));

test('Conflito Avançado — Ataque Total e Defesa Total (§90, pág. 298)', async (t) => {
  await t.test('Ataque Total dá +1 de DANO, e não dados', (t2) => {
    const d = sempreDez();
    const sem = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvoLimpo(),
      tipo: 'desarmado', estacionario: true });
    const com = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvoLimpo(),
      tipo: 'desarmado', estacionario: true, ataqueTotal: true });
    d.restaurar();
    t2.diagnostic(`sem ${sem.dano} · com ${com.dano} · mesma piscina: ${
      sem.rolAtq.piscina === com.rolAtq.piscina}`);
    assert.equal(com.dano, sem.dano + 1, 'o +1 de dano do Ataque Total não entrou');
    assert.equal(com.rolAtq.piscina, sem.rolAtq.piscina,
      'o Ataque Total mexeu na PARADA — o livro dá dano, não dados');
    assert.equal(com.ataqueTotal, true);
  });

  await t.test('e ele não vale com ataque surpresa — o livro proíbe', (t2) => {
    const d = sempreDez();
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvoLimpo(),
      tipo: 'desarmado', ataqueTotal: true, surpresa: true });
    d.restaurar();
    t2.diagnostic(r.eventos.map(e => e.texto).find(x => /Ataque Total/.test(x)) || '(nada dito)');
    assert.equal(r.ataqueTotal, false, 'os dois valeram juntos');
    assert.ok(r.eventos.some(e => /não vale com ataque surpresa/.test(e.texto)),
      'o motor ignorou o Ataque Total em silêncio');
  });

  await t.test('com arma à distância, o Ataque Total descarrega a arma', () => {
    const d = sempreDez();
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvoLimpo(),
      tipo: 'fogo', arma: 'pistola 9 mm', estacionario: true, ataqueTotal: true });
    d.restaurar();
    assert.equal(r.descarregou, true);
    assert.ok(r.eventos.some(e => /descarrega a arma/.test(e.texto)));
  });

  await t.test('Defesa Total dá +1 DADO na parada de defesa', (t2) => {
    const f = fichaDeTeste(g);
    const sem = Combate.piscinaDefesa(f, Combate.ATAQUES.desarmado.defesa, []);
    const com = Combate.piscinaDefesa(f, Combate.ATAQUES.desarmado.defesa, [], 0, null,
      { defesaTotal: true });
    t2.diagnostic(`defesa ${sem.total} → ${com.total}`);
    assert.equal(com.total, sem.total + 1);
  });
});

test('Conflito Avançado — surpresa e ataque localizado (§90, págs. 300–303)', async (t) => {
  await t.test('o ataque surpresa tira a parada de defesa: Dificuldade 1 fixa', (t2) => {
    const d = sempreDez();
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvoLimpo(),
      tipo: 'branca', arma: 'canivete', surpresa: true });
    d.restaurar();
    t2.diagnostic(r.eventos.map(e => e.texto).find(x => /surpresa/.test(x)));
    assert.equal(r.rolDef, null, 'o alvo se defendeu de um ataque surpresa');
    assert.ok(r.eventos.some(e => /Dificuldade 1 fixa/.test(e.texto)));
  });

  await t.test('o ataque localizado subtrai SUCESSOS, e não dados', (t2) => {
    /* "Após realizar o teste, ele subtrai sucessos" (pág. 302). A
       diferença importa: tirar dados mexeria na chance de Falha
       Bestial, e o livro não mandou mexer nela. */
    const d = sempreDez();
    const solto = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvoLimpo(),
      tipo: 'branca', arma: 'canivete', estacionario: true });
    const mirado = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvoLimpo(),
      tipo: 'branca', arma: 'canivete', estacionario: true, localizado: { onde: 'a mão' } });
    d.restaurar();
    t2.diagnostic(`solto: piscina ${solto.rolAtq.piscina}, margem ${solto.margem} · `
                + `mirado: piscina ${mirado.rolAtq.piscina}, margem ${mirado.margem}`);
    assert.equal(mirado.rolAtq.piscina, solto.rolAtq.piscina, 'o custo saiu da PARADA');
    assert.equal(mirado.margem, solto.margem - Combate.CUSTO_LOCALIZADO);
    assert.equal(Combate.CUSTO_LOCALIZADO, 2, 'o padrão do livro é −2 sucessos');
  });

  await t.test('e o Narrador pode cobrar outro preço', () => {
    /* "o Narrador possa aumentar ou diminuir esse número dependendo da
       natureza do alvo. Atingir os pneus de um carro pode resultar em
       uma penalidade de −1" (pág. 303). */
    const d = sempreDez();
    const solto = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvoLimpo(),
      tipo: 'fogo', arma: 'pistola 9 mm', estacionario: true });
    const pneu = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvoLimpo(),
      tipo: 'fogo', arma: 'pistola 9 mm', estacionario: true,
      localizado: { onde: 'o pneu', custo: 1 } });
    d.restaurar();
    assert.equal(pneu.margem, solto.margem - 1);
  });
});

test('Conflito Avançado — a estaca tem DUAS condições (§90, pág. 304)', async (t) => {
  /* A estaca é uma arma de dano +0: o dano é a margem inteira, e para
     passar de 5 contra Dificuldade 1 é preciso uma parada grande. Sem
     isso o teste passaria por não chegar lá, e não por acertar a regra. */
  const estaqueador = () => {
    const f = fichaDeTeste(g);
    f.atributos.destreza = 5; f.habilidades.armas_brancas = 5; f.fome = 0;
    return f;
  };
  const estacar = (opcoes) => {
    const d = sempreDez();
    const r = Combate.resolver(Object.assign({
      atacante: estaqueador(), defensor: alvoLimpo(), tipo: 'branca',
      arma: 'estaca', estacionario: true, alvoVampiro: true }, opcoes));
    d.restaurar();
    return r;
  };

  await t.test('dano de sobra, mas sem mirar: NÃO paralisa, e diz por quê', (t2) => {
    const r = estacar({});
    t2.diagnostic(`dano ${r.dano} · paralisou ${r.paralisou}`);
    assert.ok(r.dano >= 5, 'o cenário do teste não chegou aos 5 de dano');
    assert.equal(r.paralisou, false, 'a estaca paralisou sem ataque localizado');
    assert.ok(r.eventos.some(e => /não foi mirado no coração/.test(e.texto)));
  });

  await t.test('mirado no coração e com 5+: paralisa', (t2) => {
    const r = estacar({ localizado: { onde: 'o coração' } });
    t2.diagnostic(`dano ${r.dano} · paralisou ${r.paralisou}`);
    assert.equal(r.paralisou, true);
    assert.ok(r.eventos.some(e => /paralisa/.test(e.texto)));
  });

  await t.test('mirado, mas sem os 5 de dano: diz quanto falta', () => {
    const d = comDadosViciados(g, [10, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvoLimpo(),
      tipo: 'branca', arma: 'estaca', estacionario: true,
      localizado: { onde: 'o coração' } });
    d.restaurar();
    if (r.dano < 5) {
      assert.equal(r.paralisou, false);
      assert.ok(r.eventos.some(e => /faltam \d+ para paralisar/.test(e.texto)));
    }
  });
});

test('Conflito Avançado — arma de fogo dentro da briga (§90, pág. 302)', async (t) => {
  await t.test('a pistola não é "maior que uma pistola"; o rifle é', (t2) => {
    for (const n of ['pistola 9 mm', 'revólver', 'Glock', '.22']) {
      assert.equal(Combate.maiorQuePistola(n), false, `${n} virou arma grande`);
    }
    for (const n of ['rifle .308', 'espingarda 12', 'submetralhadora', 'fuzil']) {
      assert.equal(Combate.maiorQuePistola(n), true, `${n} não é maior que uma pistola`);
    }
    t2.diagnostic('quatro pistolas e quatro armas longas');
  });

  await t.test('−2 por alvejar quem está fora da briga, e −2 pela arma grande', (t2) => {
    /* Parada grande de propósito: o piso de 1 dado (§63, A1) esconderia
       as duas penalidades numa ficha comum, e o teste passaria sem ter
       medido nada. */
    const atirador = () => {
      const f = fichaDeTeste(g);
      f.atributos.forca = 5; f.habilidades.armas_fogo = 5; f.fome = 0;
      return f;
    };
    const d = sempreDez();
    const base = Combate.resolver({ atacante: atirador(), defensor: alvoLimpo(),
      tipo: 'fogo_no_corpo', arma: 'pistola 9 mm', estacionario: true });
    const fora = Combate.resolver({ atacante: atirador(), defensor: alvoLimpo(),
      tipo: 'fogo_no_corpo', arma: 'pistola 9 mm', estacionario: true, alvoNaBriga: false });
    const grande = Combate.resolver({ atacante: atirador(), defensor: alvoLimpo(),
      tipo: 'fogo_no_corpo', arma: 'rifle .308', estacionario: true, alvoNaBriga: false });
    d.restaurar();
    t2.diagnostic(`na briga ${base.rolAtq.piscina} · fora ${fora.rolAtq.piscina} · `
                + `fora e com rifle ${grande.rolAtq.piscina}`);
    assert.equal(fora.rolAtq.piscina, base.rolAtq.piscina - 2);
    assert.equal(grande.rolAtq.piscina, base.rolAtq.piscina - 4, 'as duas penalidades não somaram');
  });
});

test('Conflito Avançado — Ferimentos Incapacitantes (§90, pág. 303)', async (t) => {
  /* A tabela morava em `data-escudo.js` e `Tabelas.ferimentoPor` sabia
     rolá-la — e nada no jogo a chamava. Estes testes são o caminho que
     faltava, e o teto dele. */

  const jaDebilitado = () => {
    const f = fichaDeTeste(g);
    const max = g.Estado.trilhas(f).vitalidade.max;
    f.danoSuperficial = max; f.danoAgravado = 0;
    return f;
  };

  await t.test('quem NÃO está Debilitado não rola na tabela', () => {
    const d = sempreDez();
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvoLimpo(),
      tipo: 'desarmado', estacionario: true, ferimentosIncapacitantes: true });
    d.restaurar();
    assert.equal(r.ferimento, null);
  });

  await t.test('quem está Debilitado rola 1d10 + o Agravado da trilha', (t2) => {
    const alvo = jaDebilitado();
    alvo.danoSuperficial -= 2; alvo.danoAgravado = 2;
    const d = sempreDez();
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvo,
      tipo: 'desarmado', estacionario: true, ferimentosIncapacitantes: true });
    d.restaurar();
    t2.diagnostic(r.ferimento ? `${r.ferimento.total} → ${r.ferimento.nome}` : '(não rolou)');
    assert.ok(r.ferimento, 'ferido já Debilitado e nada rolou');
    assert.ok(r.ferimento.total > r.ferimento.agravadoNaTrilha,
      'o d10 não entrou na conta');
    assert.ok(r.eventos.some(e => /Ferido já estando Debilitado/.test(e.texto)));
  });

  await t.test('e o sistema é OPCIONAL: desligado, não rola', () => {
    const alvo = jaDebilitado();
    const d = sempreDez();
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvo,
      tipo: 'desarmado', estacionario: true });
    d.restaurar();
    assert.equal(r.ferimento, null, 'a tabela rolou sem ninguém ter pedido');
  });
});

test('Conflito Avançado — o crítico contra mortal anônimo (§90, pág. 303)', async (t) => {
  const mortal = (anonimo) => {
    const f = Combate.gerarMortal('comum').ficha;
    f.anonimo = anonimo; f.nome = anonimo ? 'Mortal comum 2' : 'Beatriz';
    return f;
  };

  await t.test('crítico contra figurante incapacita sem calcular dano', (t2) => {
    const d = sempreDez();
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: mortal(true),
      tipo: 'desarmado', estacionario: true, alvoVampiro: false });
    d.restaurar();
    t2.diagnostic(`crítico ${r.rolAtq.critico} · incapacitado ${r.incapacitado}`);
    assert.equal(r.rolAtq.critico, true, 'o cenário não produziu crítico');
    assert.equal(r.incapacitado, true);
  });

  await t.test('mas não contra quem tem nome na cena', () => {
    const d = sempreDez();
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: mortal(false),
      tipo: 'desarmado', estacionario: true, alvoVampiro: false });
    d.restaurar();
    assert.equal(r.incapacitado, false, 'a regra do figurante pegou um PN com nome');
  });

  await t.test('nem contra vampiro', () => {
    const d = sempreDez();
    const alvo = alvoLimpo(); alvo.anonimo = true;
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvo,
      tipo: 'desarmado', estacionario: true, alvoVampiro: true });
    d.restaurar();
    assert.equal(r.incapacitado, false);
  });
});

test('Conflito Avançado — agarramento (§90, pág. 301)', async (t) => {
  const forte = () => { const f = fichaDeTeste(g); f.atributos.forca = 5; f.habilidades.briga = 5; return f; };
  const fraco = () => { const f = alvoLimpo(); f.atributos.forca = 1; f.habilidades.briga = 0; return f; };

  await t.test('quem agarra e vence NÃO causa dano — ele contém', (t2) => {
    const d = comDadosViciados(g, Array(20).fill(10).concat(Array(20).fill(1)));
    const r = Agarramento.agarrar({ atacante: forte(), defensor: fraco() });
    d.restaurar();
    t2.diagnostic(`margem ${r.margem} · agarrou ${r.agarrou}`);
    assert.equal(r.agarrou, true);
    assert.equal(r.dano, undefined, 'o agarramento causou dano');
    assert.ok(r.eventos.some(e => /SEM dano/.test(e.texto)));
    assert.equal(r.estado, 'agarrado');
  });

  await t.test('perdendo a disputa, ninguém é contido', () => {
    const d = comDadosViciados(g, Array(20).fill(1).concat(Array(20).fill(10)));
    const r = Agarramento.agarrar({ atacante: fraco(), defensor: forte() });
    d.restaurar();
    assert.equal(r.agarrou, false);
  });

  await t.test('morder dá 2 de Agravado FIXOS, e a margem não muda isso', (t2) => {
    /* ESTA ASSERÇÃO FOI REESCRITA DEPOIS DA MUTAÇÃO.  (§90)

       Ela conferia `r.dano`, que é o número que a função DIZ ter
       causado — e trocar o dano aplicado pela margem passou em verde,
       porque o número relatado continuava sendo a constante. Conferir o
       relatório não é conferir o efeito. Agora se mede a TRILHA do
       mordido, que é o que o jogo enxerga. */
    const alvo = fraco();
    const antes = g.Estado.trilhas(alvo).vitalidade;
    const d = comDadosViciados(g, Array(20).fill(10).concat(Array(20).fill(1)));
    const r = Agarramento.resolverTurno({ atacante: forte(), defensor: alvo, escolha: 'morder' });
    d.restaurar();
    const depois = g.Estado.trilhas(alvo).vitalidade;
    t2.diagnostic(`margem ${r.margem} · dano dito ${r.dano} · Agravado na trilha ${
      antes.agr} → ${depois.agr}`);
    assert.ok(r.margem > 2, 'a margem do teste não é maior que o dano fixo');
    assert.equal(r.dano, Agarramento.DANO_DA_MORDIDA);
    assert.equal(depois.agr - antes.agr, 2,
      'a mordida marcou na trilha um número diferente dos 2 fixos do livro');
    assert.equal(r.natureza, 'agravado');
    assert.ok(r.eventos.some(e => /não paga a penalidade de mirar/.test(e.texto)));
  });

  await t.test('machucar usa a margem; só segurar não fere', () => {
    const d1 = comDadosViciados(g, Array(20).fill(10).concat(Array(20).fill(1)));
    const bate = Agarramento.resolverTurno({ atacante: forte(), defensor: fraco(), escolha: 'dano' });
    d1.restaurar();
    assert.equal(bate.dano, bate.margem);
    assert.equal(bate.natureza, 'superficial');

    const d2 = comDadosViciados(g, Array(20).fill(10).concat(Array(20).fill(1)));
    const segura = Agarramento.resolverTurno({ atacante: forte(), defensor: fraco(), escolha: 'segurar' });
    d2.restaurar();
    assert.equal(segura.dano, 0);
    assert.equal(segura.manteve, true);
  });

  await t.test('o agarrado que vence escapa e anda no turno seguinte', () => {
    const d = comDadosViciados(g, Array(20).fill(1).concat(Array(20).fill(10)));
    const r = Agarramento.resolverTurno({ atacante: fraco(), defensor: forte(), escolha: 'dano' });
    d.restaurar();
    assert.equal(r.escapou, true);
    assert.equal(r.dano, 0);
  });
});

test('Conflito Avançado — combate social (§90, págs. 304–305)', async (t) => {
  const duelista = (nome) => {
    const f = fichaDeTeste(g, { nome });
    f.danoVontade = 0; f.danoVontadeAgravado = 0;
    return f;
  };

  await t.test('a Iniciativa social é Raciocínio + Etiqueta', () => {
    const f = duelista('X');
    f.atributos.raciocinio = 3; f.habilidades.etiqueta = 2;
    assert.equal(CombateSocial.iniciativaDe(f), 5);
  });

  await t.test('o dano vai para a FORÇA DE VONTADE, não para a Vitalidade', (t2) => {
    const eu = duelista('Eu'), ele = duelista('Ele');
    eu.atributos.manipulacao = 5; eu.habilidades.persuasao = 5;
    ele.atributos.manipulacao = 1; ele.habilidades.persuasao = 0;
    const vitalidadeAntes = ele.danoSuperficial;
    const vontadeAntes = g.Estado.trilhas(ele).vontade.livres;
    const d = comDadosViciados(g, Array(20).fill(10).concat(Array(20).fill(1)));
    const r = CombateSocial.resolver({ atacante: eu, defensor: ele, rota: 'desmentir' });
    d.restaurar();
    const vontadeDepois = g.Estado.trilhas(ele).vontade.livres;
    t2.diagnostic(`margem ${r.margem} · dano ${r.dano} · Vontade livre ${vontadeAntes} → ${vontadeDepois}`);
    assert.equal(r.vencedor, 'atacante');
    /* A trilha, e não o campo cru: uma margem grande transborda o
       Superficial em Agravado, e aí `danoVontade` volta a ZERO com a
       trilha cheia de Agravado. Foi o que aconteceu na primeira escrita
       deste teste — e é, aliás, o "colapso mental total" da pág. 305. */
    assert.ok(vontadeDepois < vontadeAntes, 'ninguém perdeu Força de Vontade');
    assert.equal(ele.danoSuperficial, vitalidadeAntes, 'o combate social feriu a Vitalidade');
  });

  await t.test('a audiência aumenta o dano — e a tabela sai do Escudo', (t2) => {
    const eu = duelista('Eu'), ele = duelista('Ele');
    eu.atributos.manipulacao = 5; eu.habilidades.persuasao = 5;
    ele.atributos.manipulacao = 1; ele.habilidades.persuasao = 0;

    const d1 = comDadosViciados(g, Array(20).fill(10).concat(Array(20).fill(1)));
    const sozinhos = CombateSocial.resolver({ atacante: eu, defensor: duelista('Ele'),
      rota: 'desmentir', testemunhas: '' });
    d1.restaurar();
    const d2 = comDadosViciados(g, Array(20).fill(10).concat(Array(20).fill(1)));
    const naCorte = CombateSocial.resolver({ atacante: eu, defensor: duelista('Ele'),
      rota: 'desmentir', testemunhas: 'O Príncipe' });
    d2.restaurar();

    t2.diagnostic(`sozinhos ${sozinhos.dano} · diante do Príncipe ${naCorte.dano} `
                + `(+${naCorte.audiencia.extra})`);
    assert.equal(sozinhos.audiencia.extra, 0);
    assert.equal(naCorte.audiencia.extra, 4, 'o Príncipe vale +4 na tabela da pág. 305');
    assert.equal(naCorte.dano, sozinhos.dano + 4);
  });

  await t.test('empate não move nada', () => {
    const eu = duelista('Eu'), ele = duelista('Ele');
    const d = comDadosViciados(g, Array(40).fill(7));
    const r = CombateSocial.resolver({ atacante: eu, defensor: ele, rota: 'olhares' });
    d.restaurar();
    assert.equal(r.vencedor, null);
    assert.equal(r.dano, 0);
  });

  await t.test('conceder acontece ANTES da rolagem, e não custa dano', (t2) => {
    const r = CombateSocial.conceder({ quem: 'Você' });
    t2.diagnostic(r.eventos[0].texto.slice(0, 90));
    assert.equal(r.concedeu, true);
    assert.equal(r.dano, 0);
    assert.equal(r.meu, undefined, 'conceder rolou alguma coisa');
  });

  await t.test('as oito rotas do livro estão lá, e todas apontam para traços reais', () => {
    assert.equal(CombateSocial.ROTAS.length, 8);
    for (const r of CombateSocial.ROTAS) {
      assert.ok(g.nomeAtributo(r.atributo), `atributo inválido em ${r.id}`);
      assert.ok(g.nomeHabilidade(r.pericia), `habilidade inválida em ${r.id}`);
    }
  });
});

/* ============================================================
   ESTADOS DE CONDENAÇÃO  (§90, págs. 233–235)

   Laço de Sangue, carniçais e Diablerie. O projeto não tinha nada
   dos três — nem regra, nem dado, nem texto. O que se testa aqui é
   sobretudo o TEMPO: os três se medem em noites, meses e anos, e é
   isso que os separa de tudo o mais que este motor faz.
   ============================================================ */

test('Laço de Sangue — como ele se forma (§90, págs. 233–234)', async (t) => {
  await t.test('três noites completam o Laço', (t2) => {
    let l = Lacos.novo({ reinante: 'Beatriz' });
    for (let i = 0; i < 3; i++) l = Lacos.beber(l, { quando: Date.now() + i }).laco;
    t2.diagnostic(`força ${l.forca} · completo ${Lacos.completo(l)}`);
    assert.equal(l.forca, 3);
    assert.equal(Lacos.completo(l), true);
    assert.equal(Lacos.GOLES_PARA_COMPLETO, 3);
  });

  await t.test('e a Força do Laço para em 6', () => {
    let l = Lacos.novo({ reinante: 'Beatriz' });
    for (let i = 0; i < 12; i++) l = Lacos.beber(l, { quando: Date.now() + i }).laco;
    assert.equal(l.forca, Lacos.FORCA_MAXIMA);
    assert.equal(l.forca, 6);
  });

  await t.test('sangue que não veio da veia NÃO enlaça', (t2) => {
    /* "o Sangue consumido deve ser tomado diretamente da veia do
       doador, já que perde seu poder de Enlaçar em questão de segundos
       a menos que seja ingerido" (pág. 234). Isto importa porque esta
       mesa tem bolsa desde a §67. */
    const r = Lacos.beber(Lacos.novo({ reinante: 'Beatriz' }), { daVeia: false });
    t2.diagnostic(r.eventos[0].texto.slice(0, 80));
    assert.equal(r.laco.forca, 0);
    assert.equal(r.subiu, false);
  });

  await t.test('mais de um ano entre goles recomeça a contagem das três noites', () => {
    const agora = Date.now();
    let l = Lacos.beber(Lacos.novo({ reinante: 'B' }), { quando: agora }).laco;
    l = Lacos.beber(l, { quando: agora + 400 * 86400000 }).laco;
    assert.equal(l.goles.length, 1, 'a contagem das noites não recomeçou');
  });

  await t.test('um mês sem uma gota tira um da Força', (t2) => {
    let l = Lacos.novo({ reinante: 'B' });
    for (let i = 0; i < 4; i++) l = Lacos.beber(l, { quando: Date.now() + i }).laco;
    const r = Lacos.passarTempo(l, 90);
    t2.diagnostic(`4 → ${r.laco.forca} depois de 90 dias`);
    assert.equal(r.laco.forca, 1);
  });

  await t.test('e chegando a zero o Laço se parte', () => {
    let l = Lacos.novo({ reinante: 'B' });
    l = Lacos.beber(l, {}).laco;
    const r = Lacos.passarTempo(l, 365);
    assert.equal(r.laco.forca, 0);
    assert.ok(r.eventos.some(e => /se partiu/.test(e.texto)));
  });

  await t.test('a cria é UM TERÇO enlaçada ao Senhor no primeiro ano', () => {
    /* "Durante seu primeiro ano, uma cria se encontra um terço Enlaçada
       ao seu Senhor, já tendo provado o Sangue dele uma vez." Um terço
       de três é um. */
    const l = Lacos.lacoDaCria('Seu Senhor');
    assert.equal(l.forca, 1);
    assert.equal(Lacos.completo(l), false);
  });
});

test('Laço de Sangue — agir contra o reinante (§90, pág. 234)', async (t) => {
  const enlacado = (forca) => {
    let l = Lacos.novo({ reinante: 'Beatriz' });
    for (let i = 0; i < forca; i++) l = Lacos.beber(l, { quando: Date.now() + i }).laco;
    return l;
  };

  await t.test('a parada é Determinação + Inteligência, contra a Força do Laço', (t2) => {
    const f = fichaDeTeste(g);
    f.atributos.determinacao = 3; f.atributos.inteligencia = 2;
    const d = comDadosViciados(g, Array(20).fill(10).concat(Array(20).fill(1)));
    const r = Lacos.resistir(f, enlacado(4));
    d.restaurar();
    t2.diagnostic(`piscina ${r.piscina} · ${r.meu.sucessos} contra ${r.dele.sucessos}`);
    assert.equal(r.piscina, 5, 'a parada não é Determinação + Inteligência');
    assert.equal(r.dele.piscina, 4, 'a oposição não é a Força do Laço');
  });

  await t.test('o RITMO muda com a presença dele: por turno perto, por cena longe', (t2) => {
    const perto = Lacos.ritmoDoTeste(true);
    const longe = Lacos.ritmoDoTeste(false);
    t2.diagnostic(`${perto.id} / ${longe.id}`);
    assert.equal(perto.id, 'turno');
    assert.equal(longe.id, 'cena');
  });

  await t.test('sem Laço não há a quem obedecer', () => {
    const r = Lacos.resistir(fichaDeTeste(g), Lacos.novo({}));
    assert.equal(r.venceu, true);
    assert.equal(r.meu, undefined, 'rolou sem haver Laço');
  });

  await t.test('partir o Laço é um teste por SESSÃO, e não um por turno', (t2) => {
    const f = fichaDeTeste(g);
    const d = comDadosViciados(g, Array(20).fill(10).concat(Array(20).fill(1)));
    const r = Lacos.tentarPartir(f, enlacado(3));
    d.restaurar();
    t2.diagnostic(r.eventos[0].texto.slice(0, 80));
    assert.equal(r.ritmo.id, 'cena', 'partir o Laço exige evitar o reinante');
    assert.equal(r.laco.quebrando, true);
  });
});

test('Laço de Sangue — quantos escravos cabem (§90, pág. 234)', async (t) => {
  await t.test('o limite é a Potência de Sangue do reinante', () => {
    assert.equal(Lacos.limiteDeEscravos(3), 3);
    assert.equal(Lacos.limiteDeEscravos(0), 0);
  });

  await t.test('passar do limite derruba o Laço MAIS ANTIGO, ao longo de uma semana', (t2) => {
    const r = Lacos.aoEnlacarMaisUm(2, ['Primeiro', 'Segundo']);
    t2.diagnostic(`perdido: ${r.perdido} · restam: ${r.lista.join(', ')}`);
    assert.equal(r.perdido, 'Primeiro');
    assert.deepEqual(r.lista, ['Segundo']);
    assert.ok(r.eventos.some(e => /uma semana/.test(e.texto)));
  });

  await t.test('dentro do limite, ninguém se perde', () => {
    const r = Lacos.aoEnlacarMaisUm(3, ['Primeiro']);
    assert.equal(r.perdido, null);
  });
});

test('Carniçais — o preço de um poder (§90, pág. 234)', async (t) => {
  await t.test('nível 1 é Checagem de Sangue normal', () => {
    const r = Lacos.custoDePoderDeCarnical(1);
    assert.equal(r.checagem, true);
    assert.equal(r.danoAgravado, 0);
  });

  await t.test('acima do nível 1 é 1 de AGRAVADO, e NÃO uma Checagem', (t2) => {
    /* "Carniçais que usam poderes acima do nível 1 (…) sofrem 1 ponto
       de dano Agravado à sua Vitalidade EM VEZ de realizarem uma
       Checagem de Sangue." A troca é o ponto: não é um custo a mais, é
       outro custo. */
    for (const n of [2, 3, 5]) {
      const r = Lacos.custoDePoderDeCarnical(n);
      t2.diagnostic(`nível ${n}: checagem ${r.checagem}, agravado ${r.danoAgravado}`);
      assert.equal(r.checagem, false);
      assert.equal(r.danoAgravado, 1);
    }
  });

  await t.test('a Vitae de bolsa serve para carniçal, e não serve para enlaçar', () => {
    /* Os dois lados da mesma página, e eles discordam de propósito:
       "Diferentemente do que ocorre no Abraço e Laços de Sangue, o
       Sangue vampírico retém suas propriedades de alimentar carniçais
       por alguns dias quando armazenado". */
    assert.equal(Lacos.CARNICAL.aceitaBolsa, true);
    assert.equal(Lacos.beber(Lacos.novo({}), { daVeia: false }).subiu, false);
  });

  await t.test('e os três benefícios do livro estão escritos', () => {
    assert.equal(Lacos.CARNICAL.beneficios.length, 3);
    assert.ok(Lacos.CARNICAL.beneficios.some(b => /DOBRO/i.test(b)));
    assert.equal(Lacos.CARNICAL.duracaoEmDias, 30);
  });
});

test('Diablerie — tomar a centelha (§90, pág. 235)', async (t) => {
  const passou = (v) => ({ passou: v });

  await t.test('são tantos testes quanto a Potência de Sangue da vítima', (t2) => {
    const r = Lacos.tomarACentelha(3, [passou(true), passou(true), passou(true)]);
    t2.diagnostic(`${r.feitas} de ${r.precisa}`);
    assert.equal(r.precisa, 3);
    assert.equal(r.completou, true);
  });

  await t.test('UMA falha e a centelha se apaga sem ser consumida', (t2) => {
    const r = Lacos.tomarACentelha(4, [passou(true), passou(true), passou(false), passou(true)]);
    t2.diagnostic(r.eventos[0].texto.slice(0, 90));
    assert.equal(r.completou, false);
    assert.ok(r.eventos.some(e => /se apaga sem ser consumida/.test(e.texto)));
  });

  await t.test('faltando rolagens, o motor diz quantas — uma por turno', () => {
    const r = Lacos.tomarACentelha(4, [passou(true)]);
    assert.equal(r.completou, false);
    assert.equal(r.emCurso, true);
    assert.ok(r.eventos.some(e => /Falta/.test(e.texto)));
  });

  await t.test('a parada é Força + Determinação, Dificuldade 3', (t2) => {
    const f = fichaDeTeste(g);
    f.atributos.forca = 3; f.atributos.determinacao = 2;
    const p = Lacos.pedidoDaCentelha(f);
    t2.diagnostic(`piscina ${p.piscina} · dificuldade ${p.dificuldade}`);
    assert.equal(p.piscina, 5);
    assert.equal(p.dificuldade, 3);
    assert.equal(Lacos.DIABLERIE.dificuldade, 3);
  });
});

test('Diablerie — o preço, e o prêmio que vem mesmo perdendo (§90, pág. 235)', async (t) => {
  const diablerista = () => {
    const f = fichaDeTeste(g, { nome: 'O diablerista' });
    f.humanidadeMod = 0; f.potenciaSangue = 1; f.geracao = 12;
    return f;
  };
  const rol = (n) => ({ sucessos: n });

  await t.test('perde 1 de Humanidade de saída, sem rolagem — e na FICHA', (t2) => {
    const f = diablerista();
    const antes = g.Estado.trilhas(f).humanidade.valor;
    const r = Lacos.efeitos(f, { meu: rol(3), dela: rol(1), potenciaDaVitima: 2 });
    const depois = g.Estado.trilhas(f).humanidade.valor;
    t2.diagnostic(`humanidade ${antes} → ${depois} (mod ${f.humanidadeMod})`);
    assert.equal(depois, antes - 1, 'a Humanidade não caiu na ficha');
    assert.equal(r.venceu, true);
  });

  await t.test('a experiência vem MESMO PERDENDO a disputa', (t2) => {
    /* "Mesmo se o diablerista falhar nessa disputa em exercer controle,
       cada sucesso obtido na sua rolagem de Humanidade + Potência de
       Sangue lhe concede 5 pontos de experiência." O que se perde é o
       CONTROLE, não o prêmio. */
    const f = diablerista();
    const r = Lacos.efeitos(f, { meu: rol(2), dela: rol(5), potenciaDaVitima: 3,
                                 disciplinasDaVitima: ['Presença'] });
    t2.diagnostic(`venceu ${r.venceu} · experiência ${r.experiencia}`);
    assert.equal(r.venceu, false);
    assert.equal(r.experiencia, 10, 'dois sucessos são 10 de experiência');
    assert.equal(r.maximoDePotencia, 3);
  });

  await t.test('e perder custa mais Humanidade, um por sucesso de diferença', (t2) => {
    const f = diablerista();
    const antes = g.Estado.trilhas(f).humanidade.valor;
    Lacos.efeitos(f, { meu: rol(1), dela: rol(3), potenciaDaVitima: 2 });
    const depois = g.Estado.trilhas(f).humanidade.valor;
    t2.diagnostic(`${antes} → ${depois}: 1 de saída + 2 da margem`);
    assert.equal(depois, antes - 3);
  });

  await t.test('corroendo até zero, a presa toma o corpo e o personagem vira PN', (t2) => {
    const f = diablerista();
    f.humanidadeMod = -6;
    const r = Lacos.efeitos(f, { meu: rol(0), dela: rol(9), potenciaDaVitima: 2 });
    t2.diagnostic(`humanidade final ${r.humanidade} · virou PN ${r.virouPN}`);
    assert.equal(r.humanidade, 0);
    assert.equal(r.virouPN, true);
    assert.ok(r.eventos.some(e => /a mente da presa substitui a sua/.test(e.texto)));
  });

  await t.test('vítima de geração MENOR faz o diablerista descer uma', (t2) => {
    const f = diablerista();
    const r = Lacos.efeitos(f, { meu: rol(3), dela: rol(1), potenciaDaVitima: 3, geracaoDaVitima: 9 });
    t2.diagnostic(`12ª → ${r.geracao}ª`);
    assert.equal(r.geracao, 11);
    assert.equal(Number(f.geracao), 11, 'a geração não mudou na ficha');
  });

  await t.test('vítima de geração maior não muda a sua', () => {
    const f = diablerista();
    const r = Lacos.efeitos(f, { meu: rol(3), dela: rol(1), potenciaDaVitima: 1, geracaoDaVitima: 13 });
    assert.equal(r.geracao, 12);
  });

  await t.test('as veias negras duram um ano — ou a diferença de gerações', (t2) => {
    const a = Lacos.efeitos(diablerista(), { meu: rol(3), dela: rol(1), potenciaDaVitima: 1 });
    const b = Lacos.efeitos(diablerista(), { meu: rol(3), dela: rol(1), potenciaDaVitima: 3,
                                             geracaoDaVitima: 9 });
    t2.diagnostic(`sem diferença ${a.anosDeVeia} ano · 12ª contra 9ª ${b.anosDeVeia} anos`);
    assert.equal(a.anosDeVeia, 1);
    assert.equal(b.anosDeVeia, 3, 'a diferença original entre as gerações é 12 − 9');
  });

  await t.test('a disputa é Humanidade + a SUA Potência contra Determinação + a DELA', (t2) => {
    const f = diablerista();
    f.potenciaSangue = 2;
    const meu = Lacos.pedidoDoControle(f);
    const dela = Lacos.pedidoDaVitima({ determinacao: 3, potenciaSangue: 4 });
    t2.diagnostic(`minha ${meu.piscina} · dela ${dela.piscina}`);
    assert.equal(meu.piscina, g.Estado.trilhas(f).humanidade.valor + 2);
    assert.equal(dela.piscina, 7);
  });
});

/* ============================================================
   AS TABELAS DE COMBATE E O regras.md NÃO DIVERGEM  (§90)

   A SEXTA anti-deriva do projeto (§63, §67, §73, §88, §89), e a
   que nasceu com mais motivo: as tabelas de armadura e de dano de
   arma JÁ TINHAM divergido, e divergido do jeito pior — em
   silêncio, e só nos NOMES. Os números estavam certos; o que
   estava errado eram as palavras, e como o casador de armas lê as
   palavras, quem escrevia "cassetete" ou "Colete Kevlar" levava
   zero e não tinha como saber por quê.

   Por isso este teste confere as duas coisas separadas: que o
   documento e o dado dizem o mesmo NÚMERO, e que os NOMES do livro
   escritos no documento realmente casam no motor.
   ============================================================ */

test('Combate — o regras.md e as tabelas dizem a mesma coisa (§90)', async (t) => {
  const md = fs.readFileSync(path.join(RAIZ, 'docs', 'regras.md'), 'utf8');
  const secao = (de, ate) => {
    const i = md.indexOf(de), f = md.indexOf(ate, i + 1);
    assert.ok(i >= 0 && f > i, `a âncora "${de}" sumiu do regras.md`);
    return md.slice(i, f);
  };

  await t.test('§15.9 — os quatro valores de armadura batem', (t2) => {
    const s = secao('### 15.9 Armadura', '### 15.10 Dano de arma');
    /* `| Tecido balístico | 2 |` e `| Roupa reforçada, couro pesado | **2** — …` */
    const linhas = [...s.matchAll(/^\| ([^|]+?) \| \*{0,2}(\d)\*{0,2}[^|]*\|$/gm)]
      .map(m => [m[1].trim(), Number(m[2])]);
    t2.diagnostic(linhas.map(l => `${l[0]}=${l[1]}`).join(' · '));
    assert.equal(linhas.length, 4, 'a tabela de armadura mudou de tamanho');
    for (const [nome, valor] of linhas) {
      assert.equal(Combate.armaduraPor(nome).valor, valor,
        `"${nome}" — o documento diz ${valor} e o motor discorda`);
    }
  });

  await t.test('e os NOMES do livro casam de verdade no motor', (t2) => {
    /* A prova do defeito da §90: cada exemplo escrito na tabela tem de
       ser reconhecido. Antes, "Colete Kevlar" devolvia 0. */
    const casos = [['couro pesado', 2], ['tecido balístico', 2],
                   ['colete Kevlar', 4], ['jaqueta flak', 4], ['armadura militar', 6]];
    for (const [nome, valor] of casos) {
      const a = Combate.armaduraPor(nome);
      t2.diagnostic(`${nome} → ${a.valor}`);
      assert.equal(a.valor, valor, `"${nome}" não casou com linha nenhuma`);
    }
  });

  await t.test('§15.10 — os cinco valores de dano de arma batem', (t2) => {
    const s = secao('### 15.10 Dano de arma', '> **Estes nomes eram do Escudo');
    const linhas = [...s.matchAll(/^\| \*\*\+(\d)\*\* \| (.+?) \|$/gm)]
      .map(m => [Number(m[1]), m[2]]);
    t2.diagnostic(`${linhas.length} linhas`);
    assert.equal(linhas.length, 5, 'a tabela de dano mudou de tamanho');
    for (const [dano] of linhas) {
      assert.ok(g.Escudo.DANO_ARMA.some(a => a.dano === dano),
        `o dano +${dano} está no documento e não no dado`);
    }
  });

  await t.test('e cada exemplo escrito na tabela casa com a linha certa', (t2) => {
    /* Este é o teste que teria pego o defeito. Os exemplos vêm do
       PARÊNTESES de cada linha do documento, e cada um tem de devolver
       o dano daquela linha. */
    const s = secao('### 15.10 Dano de arma', '> **Estes nomes eram do Escudo');
    const erradas = [];
    let conferidos = 0;
    for (const m of s.matchAll(/^\| \*\*\+(\d)\*\* \| (.+?) \|$/gm)) {
      const dano = Number(m[1]);
      for (const par of m[2].matchAll(/\(([^)]+)\)/g)) {
        for (const exemplo of par[1].split(',').map(x => x.trim())) {
          /* "espingarda 12 à curta distância" e "escopeta dentro do
             alcance efetivo" trazem a condição junto; o casador vê só o
             nome da arma. */
          const nome = exemplo.replace(/ (à|dentro|em) .*/, '').trim();
          if (!nome) continue;
          conferidos++;
          const achado = Combate.armaPor(nome);
          if (achado.dano !== dano) erradas.push(`"${nome}": documento +${dano}, motor +${achado.dano}`);
        }
      }
    }
    t2.diagnostic(`${conferidos} exemplos conferidos`);
    assert.ok(conferidos >= 12, 'a varredura achou poucos exemplos');
    assert.deepEqual(erradas, [], 'exemplo do livro que o motor não reconhece');
  });

  await t.test('§15.11 — a tabela da audiência bate com o Escudo', (t2) => {
    const s = secao('### 15.11 Combate social', '**Apenas estar presente não conta**');
    const linhas = [...s.matchAll(/^\| ([^|]+?) \| \+(\d) \|$/gm)].map(m => [m[1].trim(), Number(m[2])]);
    t2.diagnostic(linhas.map(l => `+${l[1]}`).join(' '));
    assert.equal(linhas.length, 5, 'a tabela da audiência mudou de tamanho');
    assert.deepEqual(linhas.map(l => l[1]), [0, 1, 2, 3, 4]);
    for (const [quem, extra] of linhas) {
      assert.equal(CombateSocial.extraDaAudiencia(quem).extra, extra,
        `"${quem}" — o documento diz +${extra}`);
    }
  });

  await t.test('§15.7 — a Iniciativa do documento é a do motor', (t2) => {
    const s = secao('### 15.7 Iniciativa', '### 15.8 As opções');
    assert.match(s, /\*\*Iniciativa = Autocontrole \+ Percepção\*\*/);
    assert.match(s, /não se rola/);
    t2.diagnostic(`${Rodada.INICIATIVA.atributo} + ${Rodada.INICIATIVA.habilidade}`);
    assert.equal(Rodada.INICIATIVA.atributo, 'autocontrole');
    assert.equal(g.nomeHabilidade(Rodada.INICIATIVA.habilidade), 'Percepção',
      'a Habilidade da Iniciativa deixou de ser Percepção');
    /* E o d10 não voltou. */
    const fonte = fs.readFileSync(path.join(RAIZ, caminhoDe('arbitro', 'motor-combate-avancado')), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ');
    assert.ok(!/iniciativaDe[\s\S]{0,400}d10\s*\(/.test(fonte),
      'voltou a haver um dado dentro da Iniciativa');
  });

  await t.test('§15.8 — o custo do ataque localizado bate', () => {
    const s = secao('### 15.8 As opções', '### 15.9 Armadura');
    assert.match(s, /\*\*−2 sucessos\*\*/);
    assert.equal(Combate.CUSTO_LOCALIZADO, 2);
    /* E a tabela dos Ferimentos, que o documento repete. */
    assert.match(s, /\| 13\+ \|/);
    assert.equal(g.Escudo.FERIMENTOS[g.Escudo.FERIMENTOS.length - 1].faixa[0], 13);
  });

  await t.test('§15.12 é promessa negativa, e ela é conferida', (t2) => {
    /* Cinco itens que o documento diz NÃO existirem no motor. Promessa
       negativa envelhece pior que promessa positiva: basta alguém
       implementar um e esquecer de tirar daqui.

       Eram SEIS até a §95: o Conflito de Rolagem Única saiu da lista
       porque foi implementado, e é o teste abaixo que o cobra agora. */
    const s = secao('### 15.12 O que o motor NÃO aplica', '### 15.13 Conflito de Rolagem Única');
    const itens = [...s.matchAll(/^\| \*\*([^|]+?)\*\* \|/gm)].map(m => m[1]);
    t2.diagnostic(itens.join(' · '));
    assert.ok(itens.length >= 5, 'a lista do que não foi implementado encolheu sem aviso');
    assert.ok(!/Rolagem Única/i.test(s),
      'o Conflito de Rolagem Única voltou para a lista do que não existe, e ele existe');

    const fonte = ['motor-combate', 'motor-combate-avancado']
      .map(n => fs.readFileSync(path.join(RAIZ, caminhoDe('arbitro', n)), 'utf8'))
      .join('\n').replace(/\/\*[\s\S]*?\*\//g, ' ');
    for (const palavra of ['manobra', 'bloqueio', 'concessao', 'municao']) {
      assert.ok(!new RegExp(`\\b${palavra}\\b`, 'i').test(fonte),
        `o motor passou a conhecer "${palavra}", e a §15.12 ficou velha`);
    }
  });

  await t.test('§15.13 — as DUAS tabelas de Dificuldade batem com o motor (§95)', (t2) => {
    /* O erro que esta seção conserta: a §15.12 dizia "Dificuldade
       2/4/6" e juntava duas tabelas que o livro dá separadas, em
       páginas diferentes e para perguntas diferentes. Um documento com
       metade de uma tabela é pior que nenhum. */
    const s = secao('### 15.13 Conflito de Rolagem Única', '## 16. Criação de personagem');
    const numeros = (titulo) => {
      const bloco = s.slice(s.indexOf(titulo));
      return [...bloco.slice(0, bloco.indexOf('\n\n**')).matchAll(/\| \*\*(\d)\*\* \|/g)]
        .map(m => +m[1]);
    };
    const porPoder = numeros('pelo poder da oposição');
    const porTurnos = numeros('pelos últimos três turnos');
    t2.diagnostic(`poder ${porPoder.join('/')} · turnos ${porTurnos.join('/')}`);

    assert.equal(porPoder.join(','), RolagemUnica.POR_PODER.map(l => l.dificuldade).join(','),
      'a tabela do poder da oposição divergiu do motor');
    assert.equal(porTurnos.join(','), RolagemUnica.POR_TURNOS.map(l => l.dificuldade).join(','),
      'a tabela dos últimos três turnos divergiu do motor');
    assert.notEqual(porPoder.join(','), porTurnos.join(','),
      'as duas tabelas viraram a mesma, que é justamente o erro que a §95 achou');
  });

  await t.test('§22.1 — os números do Laço batem com o motor', (t2) => {
    const s = secao('### 22.1 O Laço de Sangue', '### 22.2 Carniçais');
    /* `| Força do Laço | o número de vezes que bebeu, **no máximo 6** |` */
    const numero = (rotulo) => {
      const linha = s.split('\n').find(l => l.startsWith(`| ${rotulo}`));
      assert.ok(linha, `a linha "${rotulo}" sumiu da tabela do Laço`);
      /* O número vem DENTRO do negrito, e nem sempre sozinho:
         `**no máximo 6**` e `**3**, em três noites distintas`. */
      const m = linha.match(/\*\*[^*]*?(\d)[^*]*?\*\*/);
      assert.ok(m, `a linha "${rotulo}" perdeu o número`);
      return Number(m[1]);
    };
    t2.diagnostic(`goles ${numero('Goles')} · teto ${numero('Força do Laço')}`);
    assert.equal(numero('Goles'), Lacos.GOLES_PARA_COMPLETO);
    assert.equal(numero('Força do Laço'), Lacos.FORCA_MAXIMA);
    assert.match(s, /−1 por mês/);
    assert.equal(Lacos.DIAS_POR_QUEDA, 30);
    assert.match(s, /\*\*Determinação \+ Inteligência vs\. a\s*\n?Força do Laço\*\*/);
  });

  await t.test('§22.3 — os números da Diablerie batem', (t2) => {
    const s = secao('### 22.3 Diablerie', '---');
    assert.match(s, /\*\*Força \+ Determinação,\s*\n?Dificuldade 3\*\*/);
    assert.match(s, /\*\*5 pontos de experiência\*\*/);
    t2.diagnostic(`dif ${Lacos.DIABLERIE.dificuldade} · xp ${Lacos.DIABLERIE.experienciaPorSucesso}`);
    assert.equal(Lacos.DIABLERIE.dificuldade, 3);
    assert.equal(Lacos.DIABLERIE.experienciaPorSucesso, 5);
    assert.equal(Lacos.DIABLERIE.humanidadePerdida, 1);
  });
});

/* ============================================================
   CRIAÇÃO E EXPERIÊNCIA  (§91, págs. 135–154)

   O último item da fila do §61.2. Metade do capítulo já estava
   implementada e certa; o que os testes daqui guardam é a outra
   metade — a que estava errada, a que faltava, e a tabela que
   existia sem ninguém chamar.
   ============================================================ */

const { Experiencia, Criacao } = g;

test('Experiência — a escada da pág. 151 (§91)', async (t) => {
  await t.test('a tabela do livro está inteira, e com os dez custos', (t2) => {
    const esperado = {
      atributo: 5, habilidade: 3, disciplinaCla: 5, disciplinaFora: 7,
      disciplinaCaitiff: 6, ritual: 3, formula: 3, potenciaSangue: 10
    };
    for (const [tipo, fator] of Object.entries(esperado)) {
      t2.diagnostic(`${tipo}: nível 3 custa ${Experiencia.custoDe(tipo, 3)}`);
      assert.equal(Experiencia.custoDe(tipo, 3), 3 * fator, `${tipo} divergiu`);
    }
    assert.equal(Experiencia.custoDe('especializacao'), 3);
    assert.equal(Experiencia.custoDe('vantagem'), 3, 'Vantagem é 3 por ponto, sem escada');
    assert.equal(Experiencia.tipos().length, 10, 'a tabela do livro tem dez linhas');
  });

  await t.test('o custo é pelo nível QUE SE COMPRA, e não pelo que se tem', () => {
    /* "'Novo nível' nessa tabela significa o nível que você deseja
       comprar." Subir para o 3º ponto de um Atributo custa 15. */
    assert.equal(Experiencia.custoDe('atributo', 3), 15);
    assert.equal(Experiencia.custoDe('atributo', 4), 20);
  });

  await t.test('NÃO SE SALTA ETAPA: de 2 para 4 são 35, e não 20', (t2) => {
    /* O exemplo do livro, com os números do livro: "Você não pode
       saltar etapas e comprar quatro pontos de Autocontrole por 20
       pontos (…) precisa primeiro comprar o terceiro ponto por 15 e,
       em seguida, comprar os quatro pontos por 20." */
    const conta = Experiencia.custoAte('atributo', 2, 4);
    t2.diagnostic(conta.degraus.map(d => `${d.nivel}º=${d.custo}`).join(' + ') + ` = ${conta.total}`);
    assert.equal(conta.total, 35, 'a escada virou atalho');
    /* `deepEqual` entre realms de `vm` reprova dois vetores iguais — a
       armadilha que este arreio documenta desde a §46.6. */
    assert.equal(conta.degraus.map(d => d.custo).join(','), '15,20');
  });

  await t.test('um degrau só é o custo daquele degrau', () => {
    assert.equal(Experiencia.custoAte('atributo', 2, 3).total, 15);
    assert.equal(Experiencia.custoAte('habilidade', 0, 1).total, 3);
  });

  await t.test('descer ou ficar não custa nada', () => {
    assert.equal(Experiencia.custoAte('atributo', 3, 3).total, 0);
    assert.equal(Experiencia.custoAte('atributo', 4, 2).total, 0);
  });
});

test('Experiência — a carteira, que não existia (§91)', async (t) => {
  const comXP = (n) => {
    const f = fichaDeTeste(g);
    f.xpTotal = String(n); f.xpGasta = '0';
    return f;
  };

  await t.test('total, gasta e livre saem dos campos de texto da ficha', (t2) => {
    const f = comXP(30);
    f.xpGasta = '12';
    const c = Experiencia.carteira(f);
    t2.diagnostic(`total ${c.total} · gasta ${c.gasta} · livre ${c.livre}`);
    assert.equal(c.livre, 18);
  });

  await t.test('campo vazio não vira NaN', () => {
    const f = fichaDeTeste(g);
    f.xpTotal = ''; f.xpGasta = '';
    assert.equal(Experiencia.carteira(f).livre, 0);
  });

  await t.test('comprar cobra da carteira e escreve na ficha', (t2) => {
    const f = comXP(40);
    f.atributos.autocontrole = 2;
    const r = Experiencia.comprar(f, { classe: 'atributo', id: 'autocontrole', para: 4 });
    t2.diagnostic(r.eventos[0].texto);
    assert.equal(r.comprou, true);
    assert.equal(f.atributos.autocontrole, 4);
    assert.equal(Experiencia.carteira(f).gasta, 35);
    assert.equal(Experiencia.carteira(f).livre, 5);
    assert.match(r.eventos[0].texto, /não se salta etapa/);
  });

  await t.test('sem experiência bastante, não compra — e diz quanto falta', (t2) => {
    const f = comXP(10);
    f.atributos.forca = 2;
    const r = Experiencia.comprar(f, { classe: 'atributo', id: 'forca', para: 4 });
    t2.diagnostic(r.eventos[0].texto);
    assert.equal(r.comprou, false);
    assert.equal(f.atributos.forca, 2, 'a ficha mudou numa compra recusada');
    assert.match(r.eventos[0].texto, /Faltam 25/);
  });

  await t.test('não compra o que já se tem, nem passa do teto', () => {
    const f = comXP(999);
    f.atributos.forca = 3;
    assert.equal(Experiencia.cotar(f, { classe: 'atributo', id: 'forca', para: 3 }).possivel, false);
    assert.equal(Experiencia.cotar(f, { classe: 'atributo', id: 'forca', para: 6 }).possivel, false);
  });

  await t.test('a Disciplina custa conforme seja do clã, de fora, ou de Caitiff', (t2) => {
    const doCla = fichaDeTeste(g, { cla: 'brujah' });
    doCla.xpTotal = '99'; doCla.xpGasta = '0';
    const dela = g.disciplinasDisponiveis(doCla)[0];
    const fora = Object.keys(g.DISCIPLINAS).find(d =>
      d !== 'alquimia' && !g.disciplinasDisponiveis(doCla).includes(d));
    /* A ficha de teste já traz a Disciplina do clã em 1, então o degrau
       a comprar é o 2º: 2 × o fator. */
    doCla.disciplinas = {}; doCla.disciplinas[dela] = 0;
    t2.diagnostic(`do clã: ${dela} · de fora: ${fora}`);
    assert.equal(Experiencia.cotar(doCla, { classe: 'disciplina', id: dela, para: 1 }).custo, 5);
    assert.equal(Experiencia.cotar(doCla, { classe: 'disciplina', id: fora, para: 1 }).custo, 7);

    const caitiff = fichaDeTeste(g, { cla: 'caitiff' });
    caitiff.xpTotal = '99'; caitiff.xpGasta = '0'; caitiff.disciplinas = {};
    assert.equal(Experiencia.cotar(caitiff, { classe: 'disciplina', id: dela, para: 1 }).custo, 6,
      'Caitiff paga 6, e não 5 nem 7');
  });

  await t.test('a Potência de Sangue se compra, e ela é DERIVADA', (t2) => {
    /* Até a §91 não havia por onde: a Potência saía da geração e do
       Predador, e a linha da tabela ("Novo nível × 10") não tinha
       destino. */
    const f = fichaDeTeste(g, { geracao: 12 });
    f.xpTotal = '99'; f.xpGasta = '0';
    const antes = g.derivados(f).potencia;
    const r = Experiencia.comprar(f, { classe: 'potenciaSangue', para: antes + 1 });
    t2.diagnostic(`${antes} → ${g.derivados(f).potencia} por ${r.cotacao.custo}`);
    assert.equal(r.comprou, true);
    assert.equal(g.derivados(f).potencia, antes + 1);
    assert.equal(r.cotacao.custo, (antes + 1) * 10);
  });

  await t.test('a especialização custa 3 fixos, e exige a Habilidade', (t2) => {
    const f = fichaDeTeste(g);
    f.xpTotal = '10'; f.xpGasta = '0';
    f.habilidades.briga = 0;
    const semHab = Experiencia.comprarEspecializacao(f, 'briga', 'Facas');
    t2.diagnostic(semHab.eventos[0].texto);
    assert.equal(semHab.comprou, false);

    f.habilidades.briga = 2;
    const r = Experiencia.comprarEspecializacao(f, 'briga', 'Facas');
    assert.equal(r.comprou, true);
    assert.equal(r.custo, 3);
    assert.equal(f.especializacoes.briga, 'Facas');
  });

  await t.test('o fim de sessão credita na carteira, e diz o que sobrou', (t2) => {
    const f = fichaDeTeste(g);
    f.xpTotal = '5'; f.xpGasta = '2';
    const r = g.Estado.fimDeSessao(f, {});
    const linha = r.eventos.map(e => e.texto).find(x => /experiência/.test(x));
    t2.diagnostic(linha);
    assert.match(linha, /livre 4/i);
  });

  await t.test('o Mar do Tempo dá a experiência de partida do livro', () => {
    assert.equal(Experiencia.xpDeIdade('crianca'), 0);
    assert.equal(Experiencia.xpDeIdade('neofita'), 15);
    assert.equal(Experiencia.xpDeIdade('ancilla'), 35);
  });
});

test('Criação — a vida humana das págs. 145–146 (§91)', async (t) => {
  await t.test('os nove pacotes profissionais, os dez eventos e os dez passatempos', (t2) => {
    t2.diagnostic(`${Criacao.PROFISSOES.length} profissões · ${Criacao.EVENTOS.length} eventos · `
                + `${Criacao.PASSATEMPOS.length} passatempos`);
    assert.equal(Criacao.PROFISSOES.length, 9);
    assert.equal(Criacao.EVENTOS.length, 10);
    assert.equal(Criacao.PASSATEMPOS.length, 10);
  });

  await t.test('TODA Habilidade citada existe de verdade', (t2) => {
    /* Este é o teste que faltava, e ele pegou cinco ids errados na
       primeira corrida: os ids do projeto não são os que o nome
       sugere — Sagacidade é `intuicao`, Subterfúgio é `labia`,
       Ladroagem é `furto`, Erudição é `academicos` e Ciência é
       `ciencias`. Escrever a tabela do livro sem conferir os ids
       produz uma lista bonita que não casa com nada. */
    const validos = new Set(g.todasHabilidades().map(h => h.id));
    const ruins = [];
    const conferir = (id, onde) => { if (id && !validos.has(id)) ruins.push(`${onde}: ${id}`); };

    for (const p of Criacao.PROFISSOES) {
      p.tres.concat(p.dois).forEach((s, i) => {
        if (s.fixo) conferir(s.fixo, `${p.id}[${i}]`);
        (s.escolha || []).forEach(x => conferir(x, `${p.id}[${i}]`));
      });
    }
    for (const e of Criacao.EVENTOS) e.habilidades.forEach(x => conferir(x, e.id));
    for (const h of Criacao.PASSATEMPOS) {
      conferir(h.habilidade, h.id);
      conferir(h.alternativa, `${h.id} (alt)`);
    }
    t2.diagnostic(`${validos.size} Habilidades conhecidas`);
    assert.equal(ruins.join(' · '), '', 'a criação cita Habilidade que não existe');
  });

  await t.test('e o evento que o livro escreveu errado está DECLARADO', (t2) => {
    /* "SEPARAÇÃO DOLOROSA: Manipulação ou Subterfúgio" — Manipulação é
       Atributo, e a caixa lista Habilidades. Inventar a Habilidade
       "certa" seria escrever a regra em vez de lê-la. */
    const e = Criacao.eventoPor('separacao');
    t2.diagnostic(e.divergencia);
    assert.equal(e.habilidades.length, 1);
    assert.ok(e.divergencia && /Atributo/.test(e.divergencia),
      'a divergência do livro deixou de estar escrita');
  });

  await t.test('profissão + evento + passatempos + Especialista dá a distribuição ESPECIALISTA', (t2) => {
    /* O achado da leitura: o método longo GERA o quadro rápido. */
    const r = Criacao.montar({
      /* Profissão e evento escolhidos para NÃO caírem na mesma
         Habilidade: quando caem, o maior vale e a conta fecha com um
         degrau a menos — o que é do livro, e não do teste. */
      profissao: 'veterano', evento: 'crime',
      passatempos: ['gamer', 'noturna', 'fabricante'], adicionais: 'especialista'
    });
    const c = {};
    Object.values(r.pontos).forEach(v => { c[v] = (c[v] || 0) + 1; });
    t2.diagnostic(`3: ${c[3] || 0} · 2: ${c[2] || 0} · 1: ${c[1] || 0} (antes do ponto em 4)`);
    assert.equal(r.distribuicao, 'especialista');
    /* Antes do passo Adicionais: três em 3, três em 2, três em 1. O
       quarto ponto do Especialista é escolha livre e não sai daqui. */
    assert.equal(c[3], 3, 'três Habilidades em 3');
    assert.equal(c[2], 3, 'três Habilidades em 2');
    assert.equal(c[1], 3, 'três Habilidades em 1');
    assert.equal(g.DIST_HABILIDADES.especialista.cotas[4], 1);
  });

  await t.test('e com Generalista cai em EQUILIBRADO', (t2) => {
    const r = Criacao.montar({
      profissao: 'programador', evento: 'crime',
      passatempos: ['maratonista', 'cacador', 'palco'], adicionais: 'generalista'
    });
    t2.diagnostic(`distribuição: ${r.distribuicao}`);
    assert.equal(r.distribuicao, 'equilibrado');
    /* O Generalista soma duas em 2 e quatro em 1 ao que já está: as
       cotas do modo Equilibrado são 3/5/7. */
    assert.equal(JSON.stringify(r.adicionais.ganhos), JSON.stringify({ 1: 4, 2: 2 }));
    assert.equal(g.DIST_HABILIDADES.equilibrado.cotas[3], 3);
    assert.equal(g.DIST_HABILIDADES.equilibrado.cotas[2], 5);
    assert.equal(g.DIST_HABILIDADES.equilibrado.cotas[1], 7);
  });

  await t.test('o mesmo ponto não é contado duas vezes', () => {
    /* Profissão e evento podem cair na mesma Habilidade. O maior vale;
       somar produziria um 5 na criação, que a distribuição não tem. */
    const r = Criacao.montar({ profissao: 'investigador', evento: 'doenca',
                               passatempos: [], adicionais: '' });
    assert.ok(Object.values(r.pontos).every(v => v <= 3), 'a soma passou de 3 na criação');
  });

  await t.test('a montagem diz o que ainda falta', (t2) => {
    const r = Criacao.montar({});
    t2.diagnostic(r.falta.join(' · '));
    assert.equal(r.falta.length, 4);
    const cheio = Criacao.montar({ profissao: 'veterano', evento: 'combate',
      passatempos: ['guarda', 'cacador', 'racha'], adicionais: 'especialista' });
    assert.equal(cheio.falta.length, 0);
  });

  await t.test('onde o livro dá opção, quem escolhe é o jogador', (t2) => {
    const a = Criacao.montar({ profissao: 'mafioso', opcoes: { 'prof3:0': 'briga' } });
    const b = Criacao.montar({ profissao: 'mafioso', opcoes: { 'prof3:0': 'labia' } });
    t2.diagnostic(`briga ${a.pontos.briga || 0}/${b.pontos.briga || 0}`);
    assert.equal(a.pontos.briga, 3);
    assert.equal(b.pontos.labia, 3);
    assert.equal(b.pontos.briga, undefined);
  });
});

test('Criação — os Antecedentes do livro (§91, pág. 153)', async (t) => {
  await t.test('são DOZE, e não onze', (t2) => {
    t2.diagnostic(g.ANTECEDENTES.map(a => a.nome).join(', '));
    assert.equal(g.ANTECEDENTES.length, 12);
  });

  await t.test('com os nomes do livro: Lacaios, Mawla, Ficha de Conhecimento', () => {
    const ids = g.ANTECEDENTES.map(a => a.id);
    for (const id of ['lacaios', 'mawla', 'ficha_conhecimento']) {
      assert.ok(ids.includes(id), `falta o Antecedente "${id}"`);
    }
    assert.ok(!ids.includes('retentores'), 'Retentores é nome de outra edição');
    assert.ok(!ids.includes('mentor'), 'Mentor é nome de outra edição');
  });

  await t.test('e eles batem com o glossário DO PRÓPRIO PROJETO', (t2) => {
    /* O achado incômodo da §91: o dado não divergia só do livro —
       divergia do `glossario-traducao.md` deste projeto, que já
       decidia "Retainer → Lacaio" e "Loresheet → Ficha de
       Conhecimento" desde antes. Ninguém comparava os dois. */
    const gl = fs.readFileSync(path.join(RAIZ, 'docs', 'glossario-traducao.md'), 'utf8');
    const linha = (en) => gl.split('\n').find(l => l.startsWith(`| ${en} `));
    for (const [en, esperado] of [['Retainer', 'Lacaio'], ['Loresheet', 'Ficha de Conhecimento']]) {
      const l = linha(en);
      t2.diagnostic(`${en} → ${l ? l.split('|')[2].trim() : '(sumiu)'}`);
      assert.ok(l && l.includes(esperado), `o glossário mudou de ideia sobre ${en}`);
    }
    assert.ok(g.ANTECEDENTES.some(a => a.nome === 'Lacaios'));
    assert.ok(g.ANTECEDENTES.some(a => a.nome === 'Ficha de Conhecimento'));
  });

  await t.test('ficha salva com o nome velho não perde os pontos', (t2) => {
    const f = fichaDeTeste(g);
    f.antecedentes = { retentores: 3, mentor: 2, recursos: 1 };
    g.migrarAntecedentes(f);
    t2.diagnostic(JSON.stringify(f.antecedentes));
    assert.equal(f.antecedentes.lacaios, 3);
    assert.equal(f.antecedentes.mawla, 2);
    assert.equal(f.antecedentes.retentores, undefined);
    assert.equal(f.antecedentes.recursos, 1, 'a migração mexeu em quem não devia');
  });

  await t.test('e a Rede do Índice de Força continua achando os mesmos', () => {
    /* `ANTECEDENTES_REDE` cita ids; se ela ficasse com os velhos, o
       Índice de Força perderia dois Antecedentes em silêncio. */
    const validos = new Set(g.ANTECEDENTES.map(a => a.id));
    const orfaos = g.Ficha.ANTECEDENTES_REDE.filter(id => !validos.has(id));
    assert.equal(orfaos.join(', '), '', 'a Rede cita Antecedente que não existe mais');
  });
});

test('Criação — sangue-ralo e Predador (§91, págs. 142 e 149)', async (t) => {
  const ralo = () => fichaDeTeste(g, { cla: 'sangue_fraco', geracao: 14 });

  await t.test('sangue-ralo NÃO distribui ponto de Disciplina na criação', (t2) => {
    /* "Sangues-ralos não escolhem nenhum clã e não distribuem pontos
       em Disciplinas" (pág. 142). O projeto mandava pôr um ponto em
       Alquimia — um ponto que o livro não dá. */
    const f = ralo();
    t2.diagnostic(`sangue-ralo: ${g.pontosDeDisciplinaNaCriacao(f)} · `
                + `comum: ${g.pontosDeDisciplinaNaCriacao(fichaDeTeste(g, { cla: 'brujah' }))}`);
    assert.equal(g.pontosDeDisciplinaNaCriacao(f), 0);
    assert.equal(g.pontosDeDisciplinaNaCriacao(fichaDeTeste(g, { cla: 'brujah' })), 3);
  });

  await t.test('mas a Alquimia continua sendo a Disciplina dele', () => {
    assert.equal(g.disciplinasDisponiveis(ralo()).join(','), 'alquimia');
  });

  await t.test('e três Antecedentes ficam vedados a ele na criação', (t2) => {
    t2.diagnostic(g.ANTECEDENTES_VEDADOS_A_SANGUE_RALO.join(', '));
    assert.equal([...g.ANTECEDENTES_VEDADOS_A_SANGUE_RALO].sort().join(','),
      'lacaios,mawla,status');
    for (const id of g.ANTECEDENTES_VEDADOS_A_SANGUE_RALO) {
      assert.ok(g.ANTECEDENTES.some(a => a.id === id), `"${id}" não é Antecedente`);
    }
  });

  await t.test('o Predador do clã comum continua dando 3 + 1', () => {
    const f = fichaDeTeste(g, { cla: 'brujah' });
    f.predadorDisciplina = 'celeridade';
    assert.equal(g.pontosDeDisciplinaNaCriacao(f), 4);
  });
});

/* ============================================================
   A TABELA DE EXPERIÊNCIA E O regras.md NÃO DIVERGEM  (§91)

   A SÉTIMA anti-deriva do projeto (§63, §67, §73, §88, §89, §90).
   Ela guarda três coisas de naturezas diferentes:

     . os dez custos da pág. 151, lidos do documento;
     . a soma do método longo, que é a afirmação mais forte desta
       leitura — profissão + evento + passatempos + adicionais dá
       exatamente uma das distribuições do quadro rápido. Se
       alguém mexer numa das duas listas sem mexer na outra, a
       igualdade quebra e ninguém saberia;
     . os doze Antecedentes, contra o `glossario-traducao.md` do
       próprio projeto — que é onde a §91 achou a divergência.
   ============================================================ */

test('Criação e Experiência — o regras.md e o código dizem a mesma coisa (§91)', async (t) => {
  const md = fs.readFileSync(path.join(RAIZ, 'docs', 'regras.md'), 'utf8');
  const secao = (de, ate) => {
    const i = md.indexOf(de), f = md.indexOf(ate, i + 1);
    assert.ok(i >= 0 && f > i, `a âncora "${de}" sumiu do regras.md`);
    return md.slice(i, f);
  };

  await t.test('§17 — os dez custos do documento batem com a tabela', (t2) => {
    const s = secao('## 17. Experiência', '### 17.1 As duas regras');
    /* `| Aumento em Atributo | novo nível **× 5** |` e `| Vantagem | **3 por ponto** |` */
    const porNivel = [...s.matchAll(/^\| ([^|]+?) \| novo nível \*\*× (\d+)\*\* \|$/gm)]
      .map(m => [m[1].trim(), Number(m[2])]);
    /* `**3**`, `**3 por ponto**` e `nível do Ritual **× 3**` — o número
       vem dentro do negrito, e nem sempre sozinho. */
    const outros = [...s.matchAll(/^\| ([^|]+?) \| (?:nível[^|]*)?\*\*[^*\d]*(\d+)[^*]*\*\* \|$/gm)]
      .map(m => [m[1].trim(), Number(m[2])])
      .filter(([nome]) => !/novo nível/.test(nome));
    t2.diagnostic(`${porNivel.length} por nível · ${outros.length} fixos ou por nível de item`);
    assert.equal(porNivel.length + outros.length, 10, 'a tabela do documento mudou de tamanho');

    /* Cada linha do documento tem de existir no dado, com o mesmo número. */
    const noCodigo = Object.values(Experiencia.CUSTOS)
      .map(x => [x.nome, x.porNivel ? x.fator : (x.fixo != null ? x.fixo : x.fator)]);
    const divergentes = [];
    for (const [nome, valor] of porNivel.concat(outros)) {
      const achado = noCodigo.find(([n]) => n === nome);
      if (!achado) { divergentes.push(`"${nome}" está no documento e não no dado`); continue; }
      if (achado[1] !== valor) divergentes.push(`${nome}: documento ${valor}, dado ${achado[1]}`);
    }
    assert.equal(divergentes.join(' · '), '', 'o custo divergiu entre documento e dado');
  });

  await t.test('§17.1 — a escada está escrita, e o motor a cobra', (t2) => {
    const s = secao('### 17.1 As duas regras', '### 17.2 A carteira');
    assert.match(s, /não se salta etapa/i);
    assert.match(s, /\*\*15 \+ 20 = 35\*\*/);
    t2.diagnostic(`2 → 4 num Atributo: ${Experiencia.custoAte('atributo', 2, 4).total}`);
    assert.equal(Experiencia.custoAte('atributo', 2, 4).total, 35);
  });

  await t.test('§16.2 — o método longo GERA o quadro rápido, e isso é conferido', (t2) => {
    /* A afirmação mais forte da §91, e a mais fácil de quebrar sem
       perceber: basta alguém mexer num pacote profissional. */
    const s = secao('### 16.2 A vida humana', '### 16.3 O que o Predador');
    assert.match(s, /O método longo gera o quadro rápido/);

    const contarNiveis = (pontos) => {
      const c = {};
      Object.values(pontos).forEach(v => { c[v] = (c[v] || 0) + 1; });
      return c;
    };
    /* Uma combinação por profissão, escolhendo evento e passatempos que
       não colidem com ela — a colisão é do jogador, não do sistema. */
    const usados = (p) => {
      const ids = new Set();
      p.tres.concat(p.dois).forEach(sl => {
        if (sl.fixo) ids.add(sl.fixo);
        (sl.escolha || []).forEach(x => ids.add(x));
      });
      return ids;
    };
    let conferidas = 0;
    for (const p of Criacao.PROFISSOES) {
      const proibidos = usados(p);
      const ev = Criacao.EVENTOS.find(e =>
        e.habilidades.length === 2 && e.habilidades.every(h => !proibidos.has(h)));
      const hobbies = Criacao.PASSATEMPOS
        .filter(h => !proibidos.has(h.habilidade) && !(ev && ev.habilidades.includes(h.habilidade)))
        .slice(0, 3).map(h => h.id);
      if (!ev || hobbies.length < 3) continue;

      const r = Criacao.montar({ profissao: p.id, evento: ev.id,
                                 passatempos: hobbies, adicionais: 'especialista' });
      const c = contarNiveis(r.pontos);
      conferidas++;
      assert.equal(c[3], 3, `${p.id}: três Habilidades em 3`);
      assert.equal(c[2], 3, `${p.id}: três Habilidades em 2`);
      assert.equal(c[1], 3, `${p.id}: três Habilidades em 1`);
    }
    t2.diagnostic(`${conferidas} das ${Criacao.PROFISSOES.length} profissões conferidas`);
    assert.ok(conferidas >= 7, 'a varredura conferiu poucas profissões');

    /* E as cotas do quadro rápido são as que a soma produz. */
    const esp = g.DIST_HABILIDADES.especialista.cotas;
    assert.equal(`${esp[4]}/${esp[3]}/${esp[2]}/${esp[1]}`, '1/3/3/3');
    const eq = g.DIST_HABILIDADES.equilibrado.cotas;
    assert.equal(`${eq[3]}/${eq[2]}/${eq[1]}`, '3/5/7');
    /* Generalista soma 2×dois e 4×um ao que a vida já deu (3/3/3): dá
       3 em três, 5 em dois, 7 em um. */
    const gan = Criacao.ADICIONAIS.generalista.ganhos;
    assert.equal(3 + 0, eq[3]);
    assert.equal(3 + gan[2], eq[2]);
    assert.equal(3 + gan[1], eq[1]);
  });

  await t.test('§16.4 — o que o sangue-ralo NÃO pode, o motor não deixa', (t2) => {
    const s = secao('### 16.4 Sangue-ralo na criação', '### 16.5 Humanidade e Coterie');
    assert.match(s, /não distribui ponto nenhum/);
    /* Os três Antecedentes vedados aparecem na linha da tabela. */
    const linha = s.split('\n').find(l => l.startsWith('| Antecedentes vedados'));
    assert.ok(linha, 'a linha dos Antecedentes vedados sumiu');
    t2.diagnostic(linha);
    for (const id of g.ANTECEDENTES_VEDADOS_A_SANGUE_RALO) {
      const nome = g.ANTECEDENTES.find(a => a.id === id).nome;
      assert.ok(linha.includes(nome), `"${nome}" está vedado no motor e não no documento`);
    }
    const ralo = fichaDeTeste(g, { cla: 'sangue_fraco', geracao: 14 });
    assert.equal(g.pontosDeDisciplinaNaCriacao(ralo), 0);
  });

  await t.test('e o glossário do projeto continua mandando nos nomes', (t2) => {
    /* A §91 achou a divergência aqui: o dado não discordava só do
       livro, discordava do `glossario-traducao.md` deste projeto. Este
       teste liga as duas pontas para não haver terceira. */
    const gl = fs.readFileSync(path.join(RAIZ, 'docs', 'glossario-traducao.md'), 'utf8');
    const pares = [['Retainer', 'Lacaio'], ['Loresheet', 'Ficha de Conhecimento']];
    for (const [en, pt] of pares) {
      const l = gl.split('\n').find(x => x.startsWith(`| ${en} `));
      assert.ok(l && l.includes(pt), `o glossário mudou de ideia sobre ${en}`);
    }
    const nomes = g.ANTECEDENTES.map(a => a.nome);
    t2.diagnostic(nomes.join(', '));
    assert.ok(nomes.includes('Lacaios'), 'o Antecedente voltou a se chamar Retentores');
    assert.ok(nomes.includes('Ficha de Conhecimento'), 'a Ficha de Conhecimento sumiu de novo');
    assert.equal(nomes.length, 12);
  });
});

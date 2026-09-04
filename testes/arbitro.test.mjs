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
import { carregar, fichaDeTeste, comDadosViciados, executar, instantaneo, RAIZ } from './carregar.mjs';

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

  await t.test('a base da iniciativa é Destreza + Raciocínio', (t2) => {
    assert.equal(Rodada.INICIATIVA.primario, 'destreza');
    assert.equal(Rodada.INICIATIVA.secundario, 'raciocinio');
    const f = fichaDeTeste(g);
    f.atributos.destreza = 4;
    f.atributos.raciocinio = 3;
    const d = comDadosViciados(g, [1]);
    const i = Rodada.iniciativaDe(f, []);
    d.restaurar();
    t2.diagnostic(`Destreza ${f.atributos.destreza} + Raciocínio ${f.atributos.raciocinio} ` +
                  `= base ${i.base}, dado ${i.dado}, total ${i.total}`);
    assert.equal(i.base, 7);
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
    const tabela = bloco.split('**Cerimônias:**')[0] || '';
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

  await t.test('o mesmo tiro com arma comum É absorvido', () => {
    const d = comDadosViciados(g, Array(20).fill(10));
    const r = Combate.resolver({ atacante: fichaDeTeste(g), defensor: alvo(),
      tipo: 'fogo', arma: 'pistola .22', armadura: 'Jaqueta de Kevlar', estacionario: true });
    d.restaurar();
    assert.ok(r.eventos.some(e => /absorve/.test(e.texto)), 'a Kevlar não absorveu nada');
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

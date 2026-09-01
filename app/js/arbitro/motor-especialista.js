/* ============================================================
   VITÆ — Sistema especialista
   Último elo da cadeia: recebe uma ação que o Grafo já disse ser
   possível no mundo, e decide o que a REGRA do V5 diz sobre ela —
   piscina, dificuldade, custo, consequência.

   A diferença para o Arbitro.avaliar() antigo não é o resultado:
   é a forma. Lá as regras são 170 linhas de `if` em sequência,
   e ninguém sabe por que uma dificuldade deu 4. Aqui cada regra é
   um objeto com condição e efeito, o motor encadeia para frente,
   e a saída vem com o RASTRO: quais regras dispararam, em ordem,
   e o que cada uma concluiu.

   Regra nova entra na lista. Não se mexe no motor.
   ============================================================ */

const Especialista = {

  MAXIMO_CICLOS: 8,

  memoriaDe({ ficha, estados = [], plano = null, validacao = null, grafo = null,
              contexto = {}, dificuldade = null, alvo = null, fala = null }) {
    const acao = plano && plano.acoes && plano.acoes[0];
    const intencao = acao ? acao.intencao : null;
    const definicao = intencao ? Arbitro.ACOES[intencao] : null;

    return {
      ficha, estados, plano, validacao, grafo, contexto, alvo, fala,
      acao, intencao, definicao,
      dominio: definicao ? definicao.dominio : null,
      natureza: definicao && ['confronto', 'furtividade', 'rua'].includes(definicao.dominio)
        ? 'fisico' : 'mental',
      capacidades: Arbitro.capacidadesDe(estados),
      disciplina: acao ? acao.disciplina : null,
      poder: acao ? acao.poder : null,
      emCombate: !!contexto.emCombate,

      bloqueios: [], avisos: [], custos: [], modificadores: [],
      dificuldade: dificuldade, origemDificuldade: dificuldade != null ? 'definida pelo Narrador' : null,
      rotas: null, rastro: []
    };
  },

  REGRAS: [
    {
      id: 'intencao-desconhecida', prioridade: 10,
      quando: (m) => !m.definicao && !m.disciplina && !m.poder,
      entao: (m) => {
        m.escalar = true;
        m.avisos.push('Intenção não reconhecida. Sobe para o Narrador descrever.');
      }
    },
    {
      id: 'grafo-barrou', prioridade: 20,
      quando: (m) => m.validacao && m.validacao.possivel === false,
      entao: (m) => {
        for (const b of m.validacao.bloqueios) {
          m.bloqueios.push({ tipo: 'mundo', motivo: b.motivo });
        }
      }
    },
    {
      id: 'grafo-avisou', prioridade: 21,
      quando: (m) => m.validacao && m.validacao.avisos && m.validacao.avisos.length,
      entao: (m) => { m.validacao.avisos.forEach(a => m.avisos.push(a)); }
    },
    {
      id: 'acao-de-seita', prioridade: 30,
      quando: (m) => m.definicao && m.definicao.seita && m.definicao.seita !== m.ficha.seita,
      entao: (m) => {
        const p = Seitas.perfil(m.definicao.seita);
        m.bloqueios.push({ tipo: 'seita',
          motivo: `${m.definicao.nome} é prática do ${p.nome}, e você não é ${p.lexico.tratamento} deles.` });
      }
    },
    {
      id: 'disciplina-insuficiente', prioridade: 31,
      quando: (m) => !!m.disciplina,
      entao: (m) => {
        const minimo = m.definicao && m.definicao.disciplina ? m.definicao.disciplina.nivel : 1;
        const tem = (m.ficha.disciplinas || {})[m.disciplina] || 0;
        m.nivelDisciplina = tem;
        if (tem < minimo) {
          m.bloqueios.push({ tipo: 'disciplina',
            motivo: `Você não tem ${DISCIPLINAS[m.disciplina]?.nome || m.disciplina} ${minimo}. Seu nível é ${tem}.` });
        }
      }
    },
    {
      id: 'poder-desconhecido', prioridade: 32,
      quando: (m) => !!(m.poder && m.disciplina),
      entao: (m) => {
        const conhecidos = (m.ficha.poderes || {})[m.disciplina] || [];
        if (!conhecidos.includes(m.poder)) {
          m.bloqueios.push({ tipo: 'poder', motivo: `Você não conhece o poder ${m.poder}.` });
        }
      }
    },
    {
      id: 'amalgama', prioridade: 33,
      quando: (m) => !!(m.poder && Arbitro.AMALGAMAS[m.poder]),
      entao: (m) => {
        const am = Arbitro.AMALGAMAS[m.poder];
        const tem = (m.ficha.disciplinas || {})[am.disciplina] || 0;
        if (tem < am.nivel) {
          m.bloqueios.push({ tipo: 'amalgama',
            motivo: `${m.poder} é Amálgama: exige ${DISCIPLINAS[am.disciplina]?.nome} ${am.nivel}. Você tem ${tem}.` });
        }
      }
    },
    {
      id: 'capacidade-removida', prioridade: 40,
      quando: (m) => !!m.definicao || !!m.disciplina,
      entao: (m) => {
        const exig = m.disciplina
          ? Arbitro.exigenciasDe(m.poder, m.disciplina)
          : { capacidades: (m.definicao && m.definicao.exige) || [] };
        const precisa = new Set([...((m.definicao && m.definicao.exige) || []),
                                 ...(exig.capacidades || [])]);
        m.precisa = precisa;
        for (const c of precisa) {
          if (!m.capacidades.ativas.has(c)) {
            m.bloqueios.push({ tipo: 'estado',
              motivo: `${Arbitro.CAPACIDADES[c]} é necessário, e você está ${m.capacidades.removidas[c]}.` });
          }
        }
        if (exig.nota) m.avisos.push(exig.nota);
      }
    },
    {
      id: 'alcance-do-poder', prioridade: 41,
      quando: (m) => !!(m.alvo && typeof m.alvo.distancia === 'number' && (m.disciplina || (m.definicao && m.definicao.alcance))),
      entao: (m) => {
        const alcance = m.disciplina
          ? Arbitro.alcanceDe(m.poder, m.disciplina, m.nivelDisciplina || 0)
          : Arbitro.ALCANCES[m.definicao.alcance];
        if (!alcance) return;
        if (m.alvo.distancia > alcance.metros) {
          m.bloqueios.push({ tipo: 'alcance',
            motivo: `Alcance de ${alcance.metros === Infinity ? 'ilimitado' : alcance.metros + ' m'}, e o alvo está a ${m.alvo.distancia} m.` });
        }
        if (m.precisa && m.precisa.has('visao') && m.alvo.visivel === false) {
          m.bloqueios.push({ tipo: 'alcance', motivo: 'Você precisa ver o alvo, e não há linha de visão.' });
        }
        if (m.precisa && m.precisa.has('fala') && m.alvo.audivel === false) {
          m.bloqueios.push({ tipo: 'alcance', motivo: 'O alvo precisa ouvir você, e não ouve.' });
        }
      }
    },
    {
      id: 'custo-de-vitae', prioridade: 50,
      quando: (m) => !!m.disciplina && m.disciplina !== 'auspicios',
      entao: (m) => {
        if (!m.capacidades.ativas.has('sangue')) {
          m.bloqueios.push({ tipo: 'custo', motivo: 'O poder exige Provocação e você não tem Vitae.' });
        } else {
          m.custos.push({ tipo: 'provocacao', nota: 'Uma Provocação. Pode subir a Fome.' });
        }
      }
    },
    {
      id: 'fome-no-limite', prioridade: 51,
      quando: (m) => (m.ficha.fome || 0) >= 5,
      entao: (m) => m.avisos.push('Fome 5: só age racionalmente gastando Força de Vontade.')
    },
    {
      id: 'voz', prioridade: 55,
      quando: (m) => !!m.fala,
      entao: (m) => {
        const v = Arbitro.avaliarFala({ ficha: m.ficha, estados: m.estados,
          volume: m.fala.volume, alvo: m.fala.alvo, dominio: m.dominio });
        v.bloqueios.forEach(b => m.bloqueios.push(b));
        v.avisos.forEach(a => m.avisos.push(a));
        if (v.modificador) m.modificadores.push({ nome: v.volume.nome, dados: v.modificador, tipo: 'voz' });
      }
    },
    {
      id: 'modificadores-da-ficha', prioridade: 60,
      quando: (m) => !!m.definicao,
      entao: (m) => {
        Arbitro.modificadoresDe(m.ficha, m.dominio, m.intencao)
          .forEach(x => m.modificadores.push(x));
      }
    },
    {
      id: 'dificuldade-calibrada', prioridade: 70,
      quando: (m) => m.dificuldade == null,
      entao: (m) => {
        m.dificuldade = typeof Ficha !== 'undefined' ? Ficha.calibragem(m.ficha).dificuldadeBase : 3;
        m.origemDificuldade = 'calibrada pela ficha';
      }
    },
    {
      id: 'campo-de-caca', prioridade: 71,
      quando: (m) => m.intencao === 'caçar' && !!(m.alvo && typeof m.alvo.campoDeCaca === 'number'),
      entao: (m) => {
        m.dificuldade = m.alvo.campoDeCaca;
        const c = Escudo.CAMPO_DE_CACA.find(x => x.dificuldade === m.dificuldade);
        m.origemDificuldade = `campo de caça${c ? ': ' + c.lugares : ''}`;
      }
    },
    {
      id: 'caca-em-matilha', prioridade: 72,
      quando: (m) => m.intencao === 'caçar' && !!Arbitro.cacaEmMatilha(m.ficha),
      entao: (m) => {
        const mt = Arbitro.cacaEmMatilha(m.ficha);
        m.avisos.push(mt.dentroDaArea
          ? `Perambulação ${mt.perambulacao}: caçando dentro da área da matilha ${mt.matilha}, o resultado é sucesso com um custo.`
          : 'Fora da área de Perambulação: a dificuldade de caça da matilha é a padrão.');
      }
    },
    {
      id: 'distancia-em-combate', prioridade: 73,
      quando: (m) => m.emCombate && !!m.contexto.navegacao,
      entao: (m) => {
        const nav = m.contexto.navegacao;
        if (nav.bloqueado) {
          m.bloqueios.push({ tipo: 'movimento', motivo: nav.motivo });
        } else if (nav.penalidade) {
          m.modificadores.push({ nome: nav.nome || 'terreno', dados: nav.penalidade, tipo: 'terreno' });
        }
      }
    },
    {
      id: 'rotas-da-acao', prioridade: 80,
      quando: (m) => !!m.definicao && !m.bloqueios.length,
      entao: (m) => {
        const base = m.intencao === 'caçar' && typeof Arbitro.rotasDeCaca === 'function'
          ? Arbitro.rotasDeCaca(m.ficha)
          : (m.definicao.rotas || []);
        m.rotas = base.map(r => {
          const pf = Arbitro.piscinaFinal(m.ficha, { rota: r, estados: m.estados,
            dominio: m.dominio, intencao: m.intencao, fala: m.fala,
            disciplina: m.disciplina || (m.definicao && m.definicao.disciplina && m.definicao.disciplina.id) });
          return Object.assign({}, pf, {
            atributo: r.atributo, pericia: r.pericia, atributo2: r.atributo2,
            enquadramento: r.enquadramento, risco: r.risco,
            piscina: pf.total, viavel: pf.total > 0, detalhe: pf
          });
        }).filter(r => r.viavel);
        if (!m.rotas.length && base.length) {
          m.bloqueios.push({ tipo: 'piscina',
            motivo: 'Nenhuma rota sobra com dados suficientes para tentar.' });
        } else if (m.rotas.length && !m.rotas.some(r => r.piscina >= 5)) {
          m.avisos.push('Nenhuma rota confortável: a melhor tem poucos dados.');
        }
        m.rotas.sort((a, b) => b.piscina - a.piscina);
      }
    },
  ],

  avaliar(entrada) {
    const m = this.memoriaDe(entrada);
    const disparadas = new Set();
    const ordenadas = this.REGRAS.slice().sort((a, b) => a.prioridade - b.prioridade);

    for (let ciclo = 0; ciclo < this.MAXIMO_CICLOS; ciclo++) {
      let mudou = false;
      for (const regra of ordenadas) {
        if (disparadas.has(regra.id)) continue;
        let vale = false;
        try { vale = !!regra.quando(m); }
        catch (e) { m.rastro.push({ regra: regra.id, erro: e.message }); disparadas.add(regra.id); continue; }
        if (!vale) continue;

        const antes = { bloqueios: m.bloqueios.length, avisos: m.avisos.length,
                        custos: m.custos.length, modificadores: m.modificadores.length };
        try { regra.entao(m); }
        catch (e) { m.rastro.push({ regra: regra.id, erro: e.message }); }
        disparadas.add(regra.id);
        mudou = true;

        m.rastro.push({
          regra: regra.id, prioridade: regra.prioridade, ciclo,
          produziu: {
            bloqueios: m.bloqueios.length - antes.bloqueios,
            avisos: m.avisos.length - antes.avisos,
            custos: m.custos.length - antes.custos,
            modificadores: m.modificadores.length - antes.modificadores
          }
        });
      }
      if (!mudou) break;
    }

    return {
      possivel: m.escalar ? null : (m.bloqueios.length ? false : true),
      escalar: !!m.escalar,
      acao: m.definicao || null,
      intencao: m.intencao,
      bloqueios: m.bloqueios,
      avisos: m.avisos,
      custos: m.custos,
      modificadores: m.modificadores,
      rotas: m.rotas || [],
      dificuldade: m.dificuldade,
      origemDificuldade: m.origemDificuldade,
      rastro: m.rastro.filter(r => r.erro || r.produziu.bloqueios || r.produziu.avisos ||
                                   r.produziu.custos || r.produziu.modificadores ||
                                   ['dificuldade-calibrada', 'campo-de-caca', 'rotas-da-acao'].includes(r.regra))
    };
  },

  explicar(conclusao) {
    if (!conclusao) return '';
    const linhas = [];
    if (conclusao.escalar) linhas.push('Nenhuma regra reconheceu a intenção.');
    else if (conclusao.possivel === false) {
      linhas.push(`Barrado por ${conclusao.bloqueios.length} regra(s):`);
      conclusao.bloqueios.forEach(b => linhas.push(`  [${b.tipo}] ${b.motivo}`));
    } else {
      linhas.push(`Possível. Dificuldade ${conclusao.dificuldade}, ${conclusao.origemDificuldade}.`);
      if (conclusao.rotas.length) {
        linhas.push(`  ${conclusao.rotas.length} rota(s): ` +
          conclusao.rotas.map(r => `${r.piscina.rotulo} = ${r.piscina.total}`).join(' · '));
      }
    }
    if (conclusao.rastro.length) {
      linhas.push(`Regras que dispararam: ${conclusao.rastro.map(r => r.regra).join(' → ')}`);
    }
    return linhas.join('\n');
  }
};

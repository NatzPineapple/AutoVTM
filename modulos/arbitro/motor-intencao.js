/* ============================================================
   VITÆ — Elo 1 da cadeia: interpretador por modelo
   Troca o léxico de casamento de palavra pelo extrator de intenção
   que roda em servidor/intencao.mjs (qwen2.5:7b, sem dependência).

   Duas coisas acontecem aqui, e as duas importam:

   1. TRADUÇÃO DE VOCABULÁRIO. O extrator devolve o esquema genérico
      pedido — melee_attack, cast_spell, spell_name. Vampiro não tem
      "spell": tem Disciplina e poder. Este módulo é a fronteira onde
      o genérico vira id de Arbitro.ACOES. O extrator fica simples e
      reusável; o V5 fica todo deste lado.

   2. QUEDA PARA O LÉXICO. Se o serviço não responder, ou devolver
      'unknown', o plano volta a ser montado pelo léxico. O turno
      nunca para por causa do modelo — mesma regra do Narrador e do
      Cronista.

   O modelo NÃO decide se a ação é possível: quem decide é o Grafo,
   logo depois. E não produz número: a §3.2 continua inteira.
   ============================================================ */

const Intencao = {
  ROTA: '/api/intencao',
  TEMPO_LIMITE: 30000,

  estado: { verificado: false, disponivel: false, modelo: '' },

  async verificar() {
    try {
      const r = await fetch(this.ROTA, { method: 'HEAD', cache: 'no-store' });
      const modelo = r.headers.get('X-Modelo') || '';
      this.estado = { verificado: true, disponivel: r.ok, modelo };
    } catch (e) {
      this.estado = { verificado: true, disponivel: false, modelo: '' };
    }
    return this.estado;
  },

  /* Genérico -> intenção do Árbitro. Quando o tipo permite mais de uma
     ação do V5, o verbo do jogador desempata; sem desempate, cai no
     primeiro, que é o mais comum. */
  POR_TIPO: {
    melee_attack:  ['lutar'],
    ranged_attack: ['atirar'],
    move:          ['ir_para'],
    interact:      ['pegar', 'abrir', 'arrombar', 'esconder', 'achar_escondido',
                    'persuadir', 'intimidar', 'seduzir', 'caçar', 'rastrear',
                    'escutar', 'farejar', 'largar', 'entregar', 'ocultismo',
                    'passar_por_humano'],
    cast_spell:    [],
    unknown:       []
  },

  traduzir(bruta, grafo) {
    const tipo = bruta && bruta.action_type;
    if (!tipo || tipo === 'unknown') {
      return { intencao: null, motivo: (bruta && bruta.reason) || 'sem intenção mecânica' };
    }

    if (tipo === 'cast_spell') {
      const achado = this.acharPoder(bruta.spell_name);
      if (achado) {
        return { intencao: `poder:${achado.disciplina}:${achado.nome}`,
                 disciplina: achado.disciplina, poder: achado.nome };
      }
      const disc = this.acharDisciplina(bruta.spell_name);
      if (disc) return { intencao: `disciplina:${disc}`, disciplina: disc };
      return { intencao: null, motivo: `poder não reconhecido: ${bruta.spell_name || '—'}` };
    }

    const candidatas = this.POR_TIPO[tipo] || [];
    if (!candidatas.length) return { intencao: null, motivo: `tipo sem ação: ${tipo}` };
    if (candidatas.length === 1) return { intencao: candidatas[0] };

    const dito = Arbitro.normalizar(
      [bruta.target, bruta.weapon, bruta.modifier].filter(Boolean).join(' '));
    const frase = Arbitro.normalizar(bruta.frase || '');
    const alvo = frase + ' ' + dito;

    let melhor = null;
    for (const id of candidatas) {
      const acao = Arbitro.ACOES[id];
      if (!acao) continue;
      for (const f of acao.frases || []) {
        const n = Arbitro.normalizar(f);
        if (n && alvo.includes(n) && (!melhor || n.length > melhor.peso)) {
          melhor = { id, peso: n.length };
        }
      }
    }
    return { intencao: melhor ? melhor.id : candidatas[0] };
  },

  acharPoder(nome) {
    if (!nome) return null;
    const n = Arbitro.normalizar(nome);
    for (const [did, d] of Object.entries(DISCIPLINAS)) {
      for (const nivel of Object.values(d.poderes || {})) {
        for (const p of nivel) {
          const pn = Arbitro.normalizar(p.nome);
          if (pn && (n === pn || n.includes(pn) || pn.includes(n))) {
            return { disciplina: did, nome: p.nome };
          }
        }
      }
    }
    return null;
  },

  acharDisciplina(nome) {
    if (!nome) return null;
    const n = Arbitro.normalizar(nome);
    for (const [did, d] of Object.entries(DISCIPLINAS)) {
      const dn = Arbitro.normalizar(d.nome);
      if (dn && (n.includes(dn) || dn.includes(n))) return did;
    }
    return null;
  },

  contextoDaCena(ficha, grafo, contexto) {
    const poderes = [];
    for (const lista of Object.values((ficha && ficha.poderes) || {})) {
      for (const nome of lista || []) poderes.push(nome);
    }
    return {
      poderes,
      presentes: (contexto.presentes || []).map(p => p.nome),
      objetos: (contexto.naMao || []).concat(contexto.objetosAqui || []).map(o => o.nome),
      locais: (contexto.saidas || []).map(l => l.nome)
    };
  },

  async extrair({ texto, ficha, grafo, contexto }) {
    const corpo = Object.assign({ texto }, this.contextoDaCena(ficha, grafo, contexto));
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), this.TEMPO_LIMITE);
    try {
      const r = await fetch(this.ROTA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
        signal: controle.signal
      });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      return null;
    } finally {
      clearTimeout(relogio);
    }
  },

  planoDe(bruta, grafo, contexto, texto) {
    const t = this.traduzir(Object.assign({ frase: texto }, bruta), grafo);
    if (!t.intencao) {
      return { origem: 'llm', confianca: 0, acoes: [], termos: [],
               bruta, motivo: t.motivo };
    }

    const def = Arbitro.ACOES[t.intencao] || {};
    const alvo = Cadeia.acharAlvo(
      [texto, bruta.target, bruta.weapon].filter(Boolean).join(' '), grafo, contexto, def);

    return {
      origem: 'llm',
      confianca: 0.9,
      termos: [bruta.target, bruta.weapon, bruta.spell_name].filter(Boolean),
      bruta,
      acoes: [{
        verbo: def.nome || t.intencao,
        intencao: t.intencao,
        disciplina: t.disciplina || (def.disciplina && def.disciplina.id) || null,
        poder: t.poder || null,
        alvo: alvo && !def.movimento ? alvo.id : null,
        alvoTexto: bruta.target || (alvo ? alvo.nome : null),
        destino: def.movimento && alvo && alvo.tipo === 'local' ? alvo.id : null,
        exigeAlcance: !!(alvo && ['objeto', 'pessoa'].includes(alvo.tipo) && !def.movimento),
        exigeAberto: !!(def.exigeAberto && alvo && alvo.tipo !== 'pessoa'),
        modificadorDito: bruta.modifier || null,
        ordem: 0
      }]
    };
  }
};


Cadeia.registrarInterpretador('llm', async ({ texto, modo, grafo, contexto, ficha }) => {
  const bruta = await Intencao.extrair({ texto, ficha, grafo, contexto });
  if (!bruta) return Cadeia.INTERPRETADORES.lexico({ texto, modo, grafo, contexto, ficha });

  const plano = Intencao.planoDe(bruta, grafo, contexto, texto);
  if (plano.acoes.length) return plano;

  const doLexico = Cadeia.INTERPRETADORES.lexico({ texto, modo, grafo, contexto, ficha });
  if (doLexico.acoes.length) {
    return Object.assign(doLexico, { origem: 'lexico apos llm', bruta, motivo: plano.motivo });
  }
  return plano;
});

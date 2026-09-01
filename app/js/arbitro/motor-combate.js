const Combate = {

  ATAQUES: {
    desarmado:    { nome: 'Desarmado', atributo: 'forca', pericia: 'briga',
                    defesa: ['destreza', ['briga', 'atletismo']], natureza: 'superficial', alcance: 'toque' },
    branca:       { nome: 'Arma branca', atributo: 'destreza', pericia: 'armas_brancas',
                    defesa: ['destreza', ['armas_brancas', 'atletismo']], natureza: 'superficial', alcance: 'toque' },
    branca_duas:  { nome: 'Arma branca de duas mãos', atributo: 'forca', pericia: 'armas_brancas',
                    defesa: ['destreza', ['armas_brancas', 'atletismo']], natureza: 'superficial', alcance: 'toque' },
    fogo:         { nome: 'Arma de fogo', atributo: 'autocontrole', pericia: 'armas_fogo',
                    defesa: ['destreza', ['atletismo']], natureza: 'superficial', alcance: 'visao',
                    aDistancia: true },
    fogo_no_corpo:{ nome: 'Arma de fogo no corpo a corpo', atributo: 'forca', pericia: 'armas_fogo',
                    defesa: ['destreza', ['briga', 'armas_brancas']], natureza: 'superficial', alcance: 'toque' },
    arremesso:    { nome: 'Arremesso', atributo: 'destreza', pericia: 'atletismo',
                    defesa: ['destreza', ['atletismo']], natureza: 'superficial', alcance: 'visao',
                    aDistancia: true },
    garras:       { nome: 'Garras', atributo: 'forca', pericia: 'briga',
                    defesa: ['destreza', ['briga', 'atletismo']], natureza: 'agravado', alcance: 'toque' }
  },

  armaPor(nome) {
    if (!nome) return { dano: 0, armas: 'Desarmado' };
    const n = Arbitro.normalizar(nome);
    for (const a of Escudo.DANO_ARMA) {
      const partes = Arbitro.normalizar(a.armas).split(/[;,()]/).map(x => x.trim()).filter(Boolean);
      if (partes.some(p => p && (n.includes(p) || p.includes(n)))) return a;
    }
    return { dano: 0, armas: nome };
  },

  armaduraPor(nome) {
    if (!nome) return { valor: 0, tipo: 'Sem armadura' };
    const n = Arbitro.normalizar(nome);
    return Escudo.ARMADURA.find(a => Arbitro.normalizar(a.tipo).includes(n) || n.includes(Arbitro.normalizar(a.tipo)))
      || { valor: 0, tipo: nome };
  },

  piscinaDefesa(ficha, defesa, estados, cobertura = 0) {
    if (!defesa) return null;
    const [atr, opcoes] = defesa;
    let melhor = { total: 0, periciaId: opcoes[0] };
    for (const p of opcoes) {
      const cand = Dados.piscinaDe(ficha, atr, p);
      if (cand.total > melhor.total) melhor = cand;
    }
    const pen = Arbitro.penalidadeDeEstados(estados || [], 'fisico');
    return { total: Math.max(0, melhor.total + pen.dados + cobertura), periciaId: melhor.periciaId,
             atributoId: atr, penalidade: pen.dados, cobertura };
  },

  modificadorDeCobertura(nome) {
    if (!nome) return null;
    return Escudo.COBERTURA.find(c => Arbitro.normalizar(c.nome) === Arbitro.normalizar(nome)) || null;
  },

  /* `penalidadeTerreno` é como o elo 3 chega ao dado quando o que ele
     tem a dizer não é uma distância. O caso concreto é o alvo no
     ambiente ao lado: você atravessa e golpeia no mesmo turno, e isso
     custa −2 — não é bloqueio de alcance (§49). */
  resolver({ atacante, defensor, tipo = 'desarmado', arma = null, armadura = null,
             estadosAtacante = [], estadosDefensor = [], cobertura = null,
             alvoVampiro = true, distancia = null, estacionario = false,
             penalidadeTerreno = 0 }) {
    const eventos = [];
    const modelo = this.ATAQUES[tipo] || this.ATAQUES.desarmado;
    const info = this.armaPor(arma);
    const arm = this.armaduraPor(armadura);

    const capAtq = Arbitro.capacidadesDe(estadosAtacante);
    const exige = modelo.aDistancia ? ['maos', 'visao'] : ['movimento', 'corpo'];
    const bloqueios = [];
    for (const c of exige) {
      if (!capAtq.ativas.has(c)) {
        bloqueios.push(`${Arbitro.CAPACIDADES[c]} é necessário, e o atacante está ${capAtq.removidas[c]}.`);
      }
    }
    const alcance = Arbitro.ALCANCES[modelo.alcance];
    let penAlcance = 0;
    if (distancia != null && distancia > alcance.metros) {
      if (modelo.aDistancia) {
        penAlcance = -2;
        eventos.push({ tipo: 'nota',
          texto: `Alvo a ${distancia} m, além dos ${alcance.metros} m de alcance efetivo: −2 dados.` });
      } else {
        bloqueios.push(`${modelo.nome} alcança ${alcance.metros} m, e o alvo está a ${distancia} m.`);
      }
    }
    if (bloqueios.length) return { possivel: false, bloqueios, eventos };

    const penAtq = Arbitro.penalidadeDeEstados(estadosAtacante, 'fisico');
    const base = Dados.piscinaDe(atacante, modelo.atributo, modelo.pericia);
    const penTerreno = Math.min(0, penalidadeTerreno | 0);
    if (penTerreno) eventos.push({ tipo: 'nota',
      texto: `Terreno: ${penTerreno} dados para chegar ao alvo.` });
    let piscinaAtq = Math.max(0, base.total + penAtq.dados + penAlcance + penTerreno);

    let modCobertura = 0;
    if (modelo.aDistancia && cobertura) {
      const cob = this.modificadorDeCobertura(cobertura);
      if (cob) {
        modCobertura = cob.modificador;
        eventos.push({ tipo: 'nota', texto: `${cob.nome}: ${cob.modificador >= 0 ? '+' : ''}${cob.modificador} na defesa do alvo.` });
      }
    }

    const def = estacionario ? null
      : this.piscinaDefesa(defensor, modelo.defesa, estadosDefensor, modCobertura);
    if (estacionario) {
      eventos.push({ tipo: 'nota', texto: 'Alvo estacionário: sem parada de defesa, dificuldade 1 fixa.' });
    }

    const rolAtq = Dados.rolar({ piscina: piscinaAtq, fome: atacante.fome || 0,
      dificuldade: def ? 0 : 1,
      rotulo: `${nomeAtributo(modelo.atributo)} + ${nomeHabilidade(modelo.pericia)}` });

    let rolDef = null, margem;
    if (def) {
      rolDef = Dados.rolar({ piscina: def.total, fome: defensor.fome || 0, dificuldade: 0,
        rotulo: `Defesa — ${nomeAtributo(def.atributoId)} + ${nomeHabilidade(def.periciaId)}` });
      margem = rolAtq.sucessos - rolDef.sucessos;
    } else {
      margem = rolAtq.sucessos - 1;
    }

    if (margem <= 0) {
      eventos.push({ tipo: 'combate', texto: def
        ? `Ataque bloqueado: ${rolAtq.sucessos} contra ${rolDef.sucessos} de defesa.`
        : `Errou: ${rolAtq.sucessos} sucesso(s) contra dificuldade 1.` });
      return { possivel: true, acertou: false, margem, rolAtq, rolDef, eventos, dano: 0 };
    }

    const bruto = margem + info.dano;
    const dano = Math.max(0, bruto - arm.valor);
    if (arm.valor) eventos.push({ tipo: 'nota', texto: `${arm.tipo} absorve ${Math.min(arm.valor, bruto)}.` });

    let natureza = modelo.natureza;
    const comArma = ['branca', 'branca_duas', 'fogo', 'fogo_no_corpo', 'arremesso'].includes(tipo);
    if (!alvoVampiro && comArma) natureza = 'agravado';

    eventos.push({ tipo: 'combate',
      texto: `Acerto com margem ${margem}${info.dano ? ` + ${info.dano} da arma` : ''}: ${dano} de dano ${
        natureza === 'agravado' ? 'Agravado' : 'Superficial'}.` });

    const aplicado = Estado.aplicarDano(defensor, { quantidade: dano, tipo: natureza,
      fonte: info.armas, semMetade: !alvoVampiro });
    eventos.push(...aplicado.eventos);

    if (tipo === 'branca' && /estaca/i.test(arma || '') && dano >= 5) {
      eventos.push({ tipo: 'critico', texto: Escudo.NOTA_ESTACA });
    }

    const conseq = Arbitro.consequencias(rolAtq);
    if (conseq) eventos.push({ tipo: 'nota',
      texto: `${conseq.titulo} no ataque. Escolha: ${conseq.escolhas.join(' · ')}` });

    return { possivel: true, acertou: true, margem, dano, natureza,
             arma: info, armadura: arm, rolAtq, rolDef, eventos,
             destruido: aplicado.destruido, torpor: aplicado.torpor };
  },

  gerarMortal(modelo = 'comum', profissao = null) {
    const m = Escudo.MODELOS_MORTAIS[modelo] || Escudo.MODELOS_MORTAIS.comum;
    const cotas = {
      fraco:     { pares: [[2, 2]], resto: 1 },
      comum:     { pares: [[3, 2], [2, 3]], resto: 1 },
      talentoso: { pares: [[4, 1], [3, 2], [2, 2]], resto: 1 },
      fatal:     { pares: [[5, 2], [4, 2], [3, 2]], resto: 2 }
    }[modelo] || { pares: [[3, 2], [2, 3]], resto: 1 };

    const atrs = Object.values(ATRIBUTOS).flatMap(g => g.lista).map(a => a.id);
    const atributos = {};
    let i = 0;
    for (const [valor, quantos] of cotas.pares) {
      for (let k = 0; k < quantos && i < atrs.length; k++, i++) atributos[atrs[i]] = valor;
    }
    for (; i < atrs.length; i++) atributos[atrs[i]] = cotas.resto;

    const habilidades = {};
    const prof = profissao ? Escudo.PROFISSOES[profissao] : null;
    if (prof) prof.pericias.forEach(([id, v]) => { habilidades[id] = Math.max(habilidades[id] || 0, v); });

    const ficha = {
      nome: prof ? prof.nome : m.nome, modelo, atributos, habilidades,
      especializacoes: {}, disciplinas: {}, poderes: {}, meritos: {}, defeitos: {},
      antecedentes: {}, conviccoes: [], marcos: [], fome: 0, geracao: '0',
      danoSuperficial: 0, danoAgravado: 0, danoVontade: 0, maculas: 0, mortal: true
    };
    ficha.vitalidadeMortal = (atributos.vigor || 2) + 3;
    return { ficha, descricao: m };
  }
};


/* ============================================================
   VITÆ — Rodadas e iniciativa
   O V5 não publica sistema de iniciativa: o livro deixa a ordem
   com o Mestre. Como aqui não há Mestre humano, a ordem precisa
   ser determinística e auditável, então ela é convenção da mesa,
   registrada na Parte B do README §31: Destreza + Raciocínio,
   somados a um d10 de desempate, menos a penalidade de estados.
   Nada disso é regra da Paradox, e nada disso produz dano.
   ============================================================ */

const Rodada = {
  INICIATIVA: { primario: 'destreza', secundario: 'raciocinio' },

  iniciativaDe(ficha, estados) {
    const a = (ficha && ficha.atributos) || {};
    const base = (a[this.INICIATIVA.primario] || 0) + (a[this.INICIATIVA.secundario] || 0);
    const pen = Arbitro.penalidadeDeEstados(estados || [], 'fisico');
    const dado = Dados.d10();
    return { base, penalidade: pen.dados, dado, total: Math.max(0, base + pen.dados) + dado };
  },

  foraDeCombate(combatente) {
    const f = combatente && combatente.ficha;
    if (!f) return true;
    const t = Estado.trilhas(f);
    if (f.mortal) return t.vitalidade.livres === 0;
    return t.vitalidade.max > 0 && t.vitalidade.agr >= t.vitalidade.max;
  },

  ordenar(combatentes) {
    return (combatentes || [])
      .filter(c => !this.foraDeCombate(c))
      .map(c => Object.assign({ ref: c.ref, nome: c.nome, agiu: false },
                              this.iniciativaDe(c.ficha, c.estados)))
      .sort((a, b) => b.total - a.total || b.base - a.base ||
                      String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
  },

  abrir(combatentes, numero = 1) {
    const ordem = this.ordenar(combatentes);
    if (!ordem.length) return null;
    return { numero, ordem, indice: 0, encerrada: false };
  },

  atual(rodada) {
    if (!rodada || rodada.encerrada) return null;
    return rodada.ordem[rodada.indice] || null;
  },

  vezDe(rodada, ref) {
    const a = this.atual(rodada);
    return !!a && a.ref === ref;
  },

  sincronizar(rodada, combatentes) {
    if (!rodada) return null;
    const vivos = new Set((combatentes || []).filter(c => !this.foraDeCombate(c)).map(c => c.ref));
    const atual = this.atual(rodada);
    rodada.ordem = rodada.ordem.filter(x => vivos.has(x.ref));
    if (!rodada.ordem.length) { rodada.encerrada = true; rodada.indice = 0; return rodada; }
    const novo = atual ? rodada.ordem.findIndex(x => x.ref === atual.ref) : -1;
    rodada.indice = novo >= 0 ? novo : rodada.ordem.findIndex(x => !x.agiu);
    if (rodada.indice < 0) rodada.indice = rodada.ordem.length;
    return rodada;
  },

  avancar(rodada, combatentes) {
    if (!rodada) return { rodada: null, fim: true, eventos: [] };
    const eventos = [];
    const atual = this.atual(rodada);
    if (atual) atual.agiu = true;

    this.sincronizar(rodada, combatentes);
    let i = rodada.indice;
    while (i < rodada.ordem.length && rodada.ordem[i].agiu) i++;
    rodada.indice = i;

    if (i < rodada.ordem.length) return { rodada, fim: false, eventos };

    const restantes = (combatentes || []).filter(c => !this.foraDeCombate(c));
    if (restantes.length < 2) {
      rodada.encerrada = true;
      eventos.push({ tipo: 'combate', texto: 'A briga acabou. Ninguém mais tem com quem trocar golpe.' });
      return { rodada, fim: true, eventos };
    }

    const nova = this.abrir(restantes, rodada.numero + 1);
    eventos.push({ tipo: 'combate', texto: `Rodada ${nova.numero}. ${this.descreverOrdem(nova)}` });
    return { rodada: nova, fim: false, eventos };
  },

  descreverOrdem(rodada) {
    if (!rodada || !rodada.ordem.length) return 'Ninguém de pé.';
    return `Ordem: ${rodada.ordem.map(x => `${x.nome} (${x.total})`).join(', ')}.`;
  },

  escolhaDoOponente(oponente, alvo) {
    const arma = (oponente && oponente.armaDele) || '';
    const tipo = /pistola|9 ?mm|espingarda|rifle|revólver|revolver|\.22|\.357|\.38/i.test(arma)
      ? 'fogo'
      : (arma ? 'branca' : 'desarmado');
    const cap = Arbitro.capacidadesDe((oponente && oponente.estados) || []);
    const exige = tipo === 'fogo' ? ['maos', 'visao'] : ['movimento', 'corpo'];
    const impedido = exige.filter(c => !cap.ativas.has(c));
    if (impedido.length) {
      return { possivel: false, tipo, arma,
               motivo: `${oponente.nome} não consegue agir: ${
                 impedido.map(c => Arbitro.CAPACIDADES[c]).join(' e ')} fora.` };
    }
    return { possivel: true, tipo, arma: arma || null, alvo: (alvo && alvo.ref) || 'voce' };
  }
};

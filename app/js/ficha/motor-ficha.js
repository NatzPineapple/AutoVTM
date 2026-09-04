const Ficha = {

  DOMINIOS: {
    confronto:    { nome: 'Confronto físico',
      atributos: ['forca', 'destreza'], pericias: ['briga', 'armas_brancas', 'armas_fogo'] },
    furtividade:  { nome: 'Furtividade',
      atributos: ['destreza', 'raciocinio'], pericias: ['furtividade', 'furto'] },
    investigacao: { nome: 'Investigação',
      atributos: ['raciocinio', 'inteligencia'], pericias: ['investigacao', 'consciencia', 'academicos'] },
    persuasao:    { nome: 'Persuasão e sedução',
      atributos: ['carisma', 'manipulacao'], pericias: ['persuasao', 'labia', 'performance', 'etiqueta'] },
    intimidacao:  { nome: 'Intimidação',
      atributos: ['forca', 'carisma', 'manipulacao'], pericias: ['intimidacao', 'lideranca'] },
    ocultismo:    { nome: 'Ocultismo',
      atributos: ['inteligencia', 'raciocinio'], pericias: ['ocultismo'] },
    tecnica:      { nome: 'Técnica e recursos',
      atributos: ['inteligencia', 'destreza'], pericias: ['tecnologia', 'ciencias', 'oficios', 'medicina', 'financas'] },
    rua:          { nome: 'Sobrevivência e rua',
      atributos: ['raciocinio', 'carisma', 'vigor'], pericias: ['manha', 'sobrevivencia', 'conducao', 'empatia_animais', 'intuicao'] }
  },

  FAIXAS: [
    { min: 75, id: 'temivel',    nome: 'Temível',    dificuldadeBase: 4, rotas: 2, falha: 'bloqueio com preço', pressaoFome: 3, oposicao: 'ancilla' },
    { min: 60, id: 'forte',      nome: 'Forte',      dificuldadeBase: 4, rotas: 2, falha: 'bloqueio',           pressaoFome: 3, oposicao: 'neonato experiente' },
    { min: 45, id: 'competente', nome: 'Competente', dificuldadeBase: 3, rotas: 3, falha: 'custo ou bloqueio',  pressaoFome: 2, oposicao: '2 capangas' },
    { min: 30, id: 'comum',      nome: 'Comum',      dificuldadeBase: 3, rotas: 3, falha: 'custo',              pressaoFome: 2, oposicao: '1 a 2 capangas' },
    { min: 0,  id: 'fragil',     nome: 'Frágil',     dificuldadeBase: 2, rotas: 3, falha: 'custo',              pressaoFome: 1, oposicao: '1 capanga' }
  ],

  PESO_DEFEITO: { predador_obvio: 1.2, melindroso: 1, inimigo: 1.1, adversario: 1,
                  infamia: .8, violador_mascara: .9, perseguido_mascara: 1, vinculado: 1.3,
                  refugio_infestado: .9, sem_mascara: 1.1, presa_excluida: .8,
                  vicio_sangue: 1.2, estigma: .9, caca_boes: 1.3, divida_terreiro: 1 },

  ANTECEDENTES_REDE: ['aliados', 'contatos', 'fama', 'influencia', 'recursos',
                      'refugio', 'rebanho', 'retentores', 'status', 'mentor', 'mascara'],

  piscina(f, atributoId, periciaId) {
    return piscinaDaFicha(f, atributoId, periciaId);
  },

  melhorPiscinaDominio(f, dominioId) {
    const d = this.DOMINIOS[dominioId];
    let melhor = { total: 0, atributoId: d.atributos[0], periciaId: d.pericias[0] };
    for (const a of d.atributos) {
      for (const p of d.pericias) {
        const cand = piscinaDaFicha(f, a, p);
        if (cand.total > melhor.total) melhor = cand;
      }
    }
    return melhor;
  },

  perfilDominios(f) {
    const perfil = {};
    for (const id of Object.keys(this.DOMINIOS)) {
      const p = this.melhorPiscinaDominio(f, id);
      perfil[id] = {
        nome: this.DOMINIOS[id].nome,
        piscina: p.total,
        rota: `${p.atributoId}+${p.periciaId}`,
        indice: Math.round(Math.min(100, (p.total / 9) * 100))
      };
    }
    return perfil;
  },

  indiceForca(f) {
    const lim = (v, min, max) => Math.max(0, Math.min(1, (v - min) / (max - min)));
    const d = derivados(f);
    const c = claDe(f.cla);

    const picoDe = (grupo) => {
      const atrs = ATRIBUTOS[grupo].lista.map(a => a.id);
      const pers = HABILIDADES[grupo].lista.map(h => h.id);
      let m = 0;
      atrs.forEach(a => pers.forEach(p => {
        const t = piscinaDaFicha(f, a, p).total;
        if (t > m) m = t;
      }));
      return m;
    };
    const picos = { fisico: picoDe('fisico'), social: picoDe('social'), mental: picoDe('mental') };
    const pico = (lim(picos.fisico, 3, 9) + lim(picos.social, 3, 9) + lim(picos.mental, 3, 9)) / 3 * 25;

    const perfil = this.perfilDominios(f);
    const cobertos = Object.values(perfil).filter(x => x.piscina >= 5).length;
    const cobertura = (cobertos / Object.keys(this.DOMINIOS).length) * 20;

    const bruto = Object.values(f.disciplinas || {}).reduce((a, n) => a + Math.pow(n, 1.3), 0);
    const dons = lim(bruto, 0, 18) * 20;

    const fortitude = (f.disciplinas || {}).fortitude || 0;
    const res = d.vitalidade + d.vontade + fortitude * 2 + d.potencia * 2;
    const resiliencia = lim(res, 8, 30) * 15;

    const somaRede = this.ANTECEDENTES_REDE
      .reduce((a, id) => a + ((f.antecedentes || {})[id] || 0), 0)
      + (typeof Seitas !== 'undefined'
          ? Math.min(4, Seitas.redeColetiva(f, typeof Matilha !== 'undefined' ? Matilha.de(f) : null))
          : 0);
    const rede = lim(somaRede, 0, 12) * 15;

    let pesoDef = Object.entries(f.defeitos || {})
      .reduce((a, [id, v]) => a + v * (this.PESO_DEFEITO[id] || 1), 0);
    if (c) {
      if (c.id === 'nosferatu')    pesoDef += 2.5;
      if (c.id === 'ventrue')      pesoDef += 1.5;
      if (c.sangueFraco)           pesoDef += 3;
      if (c.id === 'ravnos')       pesoDef += 1.5;
      if (c.id === 'tzimisce')     pesoDef += 1;
    }
    const p = predadorDe(f.predador);
    if (p && p.humanidade < 0) pesoDef += 0.5 * Math.abs(p.humanidade);
    if (typeof Seitas !== 'undefined') pesoDef += Seitas.pesoDosDefeitosImpostos(f);
    const fragilidade = -lim(pesoDef, 0, 9) * 15;

    const componentes = {
      pico: +pico.toFixed(1),
      cobertura: +cobertura.toFixed(1),
      dons: +dons.toFixed(1),
      resiliencia: +resiliencia.toFixed(1),
      rede: +rede.toFixed(1),
      fragilidade: +fragilidade.toFixed(1)
    };
    const total = Math.max(0, Math.min(100,
      Math.round(pico + cobertura + dons + resiliencia + rede + fragilidade)));
    const faixa = this.FAIXAS.find(x => total >= x.min);

    return { total, faixa, componentes, picos, dominiosCobertos: cobertos, dominios: perfil };
  },

  calibragem(f) {
    const i = this.indiceForca(f);
    return {
      indice: i.total,
      faixa: i.faixa.id,
      nome: i.faixa.nome,
      dificuldadeBase: i.faixa.dificuldadeBase,
      rotasPorObstaculo: i.faixa.rotas,
      falhaSignifica: i.faixa.falha,
      pressaoFomePorCapitulo: i.faixa.pressaoFome,
      oposicaoEmConfronto: i.faixa.oposicao
    };
  },

  lealdade(f) {
    const pf = perfilDe(f);
    if (!pf.id) return null;
    const d = (f.seitaDados || {})[pf.id] || {};
    const base = {
      seita: pf.id, nome: pf.nome,
      bussola: pf.bussola.tipo, rotuloBussola: pf.bussola.rotulo,
      ancoras: pf.ancoras.tipo,
      grupo: pf.grupo.rotulo || null,
      resumo: Seitas.resumo(f, typeof Matilha !== 'undefined' ? Matilha.de(f) : null),
      lexico: pf.lexico,
      ondeDoi: pf.ondeDoi,
      defeitosImpostos: Seitas.defeitosImpostos(f).map(x => ({ nome: x.nome, motivo: x.motivo }))
    };
    if (pf.id === 'sabbat') {
      const cam = CAMINHOS.find(c => c.id === d.caminho);
      base.caminho = cam ? { id: cam.id, nome: cam.nome, compulsao: cam.compulsao } : null;
      base.matilha = d.matilha || null;
      base.vinculum = d.vinculum || 0;
      base.arena = d.arena || null;
      base.refugioComunal = d.refugioComunal !== false;
    }
    if (pf.id === 'anarquistas') {
      base.baronia = d.baronia || null;
      base.papel = d.papel || null;
      base.favoresDevidos = (d.favoresDevidos || []).filter(x => x && x.o_que);
      base.favoresACobrar = (d.favoresACobrar || []).filter(x => x && x.o_que);
    }
    if (pf.id === 'independente') {
      base.linhagem = d.linhagem || null;
      base.negocio = d.negocio || null;
      base.clientes = (d.clientes || []).filter(Boolean);
      base.contratos = (d.contratos || []).filter(x => x && x.servico);
    }
    if (pf.id === 'camarilla') { base.cargo = d.cargo || null; base.circulo = d.circulo || null; }
    if (pf.id === 'nenhuma') { base.motivo = d.motivo || null; base.ultimaCorte = d.ultimaCorte || null; }
    return base;
  },

  extrair(f) {
    const c = claDe(f.cla), p = predadorDe(f.predador), cid = cidadeDe(f.cidade);
    const seita = SEITAS.find(s => s.id === f.seita);
    const d = derivados(f);
    const forca = this.indiceForca(f);
    const r = RESSONANCIAS.find(x => x.id === f.ressonancia);

    const grupoAtributos = {};
    for (const [g, dados] of Object.entries(ATRIBUTOS)) {
      grupoAtributos[g] = {};
      dados.lista.forEach(a => { grupoAtributos[g][a.id] = { nome: a.nome, valor: f.atributos[a.id] || 0 }; });
    }

    const habilidades = [];
    for (const [g, dados] of Object.entries(HABILIDADES)) {
      dados.lista.forEach(h => {
        const v = f.habilidades[h.id] || 0;
        if (!v) return;
        habilidades.push({ id: h.id, nome: h.nome, grupo: g, valor: v,
          especializacao: (f.especializacoes || {})[h.id] || null });
      });
    }

    const disciplinas = Object.entries(f.disciplinas || {})
      .filter(([, v]) => v > 0)
      .map(([id, nivel]) => ({
        id, nome: DISCIPLINAS[id]?.nome || id, nivel,
        poderes: (f.poderes || {})[id] || []
      }));

    return {
      versao: 1,
      gerado: new Date().toISOString(),
      identidade: {
        nome: f.nome || null, conceito: f.conceito || null, sexo: f.sexo || null,
        jogador: f.jogador || null, senhor: f.senhor || null,
        geracao: Number(f.geracao) || null,
        cidade: cid ? { id: cid.id, nome: cid.nome, uf: cid.uf } : null,
        seita: seita ? { id: seita.id, nome: seita.nome } : null,
        dominioPessoal: null
      },
      cla: c ? {
        id: c.id, nome: c.nome, epiteto: c.epiteto,
        disciplinasDeCla: c.disciplinas.map(x => ({ id: x, nome: DISCIPLINAS[x]?.nome })),
        maldicao: c.maldicao, compulsao: c.compulsao
      } : null,
      predador: p ? {
        id: p.id, nome: p.nome, testeDeCaca: p.teste,
        especializacaoGanha: f.predadorEspec || null,
        disciplinaGanha: f.predadorDisciplina || null
      } : null,
      atributos: grupoAtributos,
      habilidades,
      disciplinas,
      rituais: (f.rituais || []).slice(),
      vantagens: {
        antecedentes: ANTECEDENTES.filter(a => (f.antecedentes || {})[a.id])
          .map(a => ({ id: a.id, nome: a.nome, pontos: f.antecedentes[a.id] })),
        meritos: MERITOS.filter(m => (f.meritos || {})[m.id])
          .map(m => ({ id: m.id, nome: m.nome, pontos: f.meritos[m.id] }))
      },
      defeitos: DEFEITOS.filter(m => (f.defeitos || {})[m.id])
        .map(m => ({ id: m.id, nome: m.nome, pontos: f.defeitos[m.id] })),
      lealdade: this.lealdade(f),
      conviccoes: (f.conviccoes || []).map((cv, i) => {
        if (!cv) return null;
        const pf = perfilDe(f);
        if (pf.ancoras.tipo === 'ritae') {
          const d = (f.seitaDados || {})[pf.id] || {};
          const r = RITAE.find(x => x.id === (d.conviccoesRitae || [])[i]);
          return { conviccao: cv, tipoDeAncora: 'ritae',
                   ritae: r ? { id: r.id, nome: r.nome } : null,
                   implemento: (d.implementos || [])[i] || null };
        }
        return { conviccao: cv, tipoDeAncora: 'pessoa', pilar: (f.marcos || [])[i] || null };
      }).filter(Boolean),
      motivacao: { ambicao: f.ambicao || null, desejo: f.desejo || null },
      vitais: {
        vitalidade: d.vitalidade, forcaDeVontade: d.vontade, humanidade: d.humanidade,
        fome: f.fome || 0, potenciaDeSangue: d.potencia,
        danoSuperficial: f.danoSuperficial || 0, danoAgravado: f.danoAgravado || 0,
        danoVontade: f.danoVontade || 0,
        /* O temperamento acompanha a Ressonância desde a §67: sozinha,
           ela não diz se vale dado. */
        ressonancia: r ? { id: r.id, nome: r.nome,
          temperamento: (Ressonancia.temperamentoPor(f.temperamento) || {}).id || null,
          disciplinas: r.disciplinas } : null
      },
      indiceForca: {
        total: forca.total, faixa: forca.faixa.id, faixaNome: forca.faixa.nome,
        componentes: forca.componentes, picos: forca.picos,
        dominiosCobertos: forca.dominiosCobertos
      },
      dominios: forca.dominios,
      calibragem: this.calibragem(f),
      retrato: {
        aparencia: f.aparencia || null, tracosDistintivos: f.tracos || null,
        historia: f.historia || null, notas: f.notas || null
      }
    };
  },

  json(f) { return JSON.stringify(this.extrair(f), null, 2); }
};

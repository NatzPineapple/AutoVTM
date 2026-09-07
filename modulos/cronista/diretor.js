const Diretor = {

  iniciar(campanha) {
    const primeira = campanha.capitulos[0] && campanha.capitulos[0].cenas[0];
    return {
      capitulo: 0,
      cena: primeira ? primeira.id : null,
      turnosNaCena: 0,
      visitadas: [],
      fatosRevelados: [],
      gatilhosUsados: {},
      encerrada: false
    };
  },

  cenaPorId(campanha, id) {
    const pos = campanha.indice[id];
    if (!pos) return null;
    return campanha.capitulos[pos.capitulo].cenas[pos.cena];
  },

  cenaAtual(campanha, estado) {
    return estado.cena ? this.cenaPorId(campanha, estado.cena) : null;
  },

  capituloAtual(campanha, estado) {
    return campanha.capitulos[estado.capitulo] || null;
  },

  abrirCena(campanha, estado, id) {
    const cena = this.cenaPorId(campanha, id);
    if (!cena) return { eventos: [{ tipo: 'erro', texto: `Cena "${id}" não existe.` }] };

    const pos = campanha.indice[id];
    const trocouCapitulo = pos.capitulo !== estado.capitulo;
    estado.capitulo = pos.capitulo;
    estado.cena = id;
    estado.turnosNaCena = 0;
    if (!estado.visitadas.includes(id)) estado.visitadas.push(id);

    const eventos = [];
    if (trocouCapitulo) {
      const cap = campanha.capitulos[pos.capitulo];
      eventos.push({ tipo: 'capitulo', titulo: cap.titulo, resumo: cap.resumo });
    }
    eventos.push({ tipo: 'cena', id, titulo: cena.titulo, local: cena.local, hora: cena.hora });
    if (cena.narracao) eventos.push({ tipo: 'narracao', texto: cena.narracao, degrau: 1 });
    return { eventos, cena };
  },

  opcaoPara(cena, intencao) {
    if (!cena) return null;
    return cena.opcoes.find(o => o.intencao === intencao) || null;
  },

  dificuldadeDe(opcao, ficha) {
    if (!opcao) return null;
    if (typeof opcao.dificuldade === 'number') return { valor: opcao.dificuldade, origem: 'fixada na campanha' };
    return { valor: Ficha.calibragem(ficha).dificuldadeBase, origem: 'calibrada pela ficha' };
  },

  verificarGatilhos(campanha, estado, { texto = '', ficha = null } = {}) {
    const cena = this.cenaAtual(campanha, estado);
    if (!cena) return { eventos: [], destino: null };

    const eventos = [];
    let destino = null;
    const n = Arbitro.normalizar(texto);

    cena.gatilhos.forEach((g, idx) => {
      const chave = `${cena.id}:${idx}`;
      if (estado.gatilhosUsados[chave]) return;

      let dispara = false;
      if (g.condicao.tipo === 'sempre') dispara = true;
      else if (g.condicao.tipo === 'menciona') {
        dispara = g.condicao.termos.some(t => n.includes(Arbitro.normalizar(t)));
      } else if (g.condicao.tipo === 'turnos') {
        const v = estado.turnosNaCena;
        const op = g.condicao.operador;
        dispara = op === '>' ? v > g.condicao.valor
                : op === '>=' ? v >= g.condicao.valor
                : op === '<' ? v < g.condicao.valor
                : v === g.condicao.valor;
      }
      if (!dispara) return;

      estado.gatilhosUsados[chave] = true;
      if (g.acao.tipo === 'revela') {
        if (!estado.fatosRevelados.includes(g.acao.fato)) estado.fatosRevelados.push(g.acao.fato);
        eventos.push({ tipo: 'revelacao', fato: g.acao.fato, degrau: 2 });
      } else if (g.acao.tipo === 'combate') {
        eventos.push({ tipo: 'combate', oponentes: g.acao.oponentes, degrau: 2 });
      } else if (g.acao.tipo === 'ir') {
        destino = g.acao.destino;
        eventos.push({ tipo: 'nota', texto: 'A cena avança.', degrau: 2 });
      }
    });

    return { eventos, destino };
  },

  processarTurno(campanha, estado, { leitura, veredito, ficha, texto = '' }) {
    const cena = this.cenaAtual(campanha, estado);
    const eventos = [];
    estado.turnosNaCena++;

    if (!cena) return { eventos, degrau: 4, escalar: true, opcao: null };

    const gat = this.verificarGatilhos(campanha, estado, { texto, ficha });
    eventos.push(...gat.eventos);

    const opcao = this.opcaoPara(cena, leitura && leitura.intencao);
    if (opcao) {
      const dif = this.dificuldadeDe(opcao, ficha);
      eventos.push({ tipo: 'pedido', opcao, dificuldade: dif, degrau: 2 });
      return { eventos, degrau: 2, escalar: false, opcao, destinoGatilho: gat.destino };
    }

    if (gat.destino) {
      const ab = this.abrirCena(campanha, estado, gat.destino);
      eventos.push(...ab.eventos);
      return { eventos, degrau: 1, escalar: false, opcao: null };
    }

    if (veredito && veredito.possivel === false) {
      return { eventos, degrau: 0, escalar: false, opcao: null };
    }

    return { eventos, degrau: 4, escalar: true, opcao: null,
             contexto: this.contextoParaNarrador(campanha, estado) };
  },

  resolverTeste(campanha, estado, { opcao, resultado, ficha }) {
    const eventos = [];
    const desfecho = resultado.passou ? opcao.sucesso : opcao.falha;
    if (!desfecho) return { eventos, destino: null };

    (desfecho.custos || []).forEach(c => {
      if (c.campo === 'fome') {
        const antes = ficha.fome || 0;
        ficha.fome = Math.max(0, Math.min(5, antes + c.delta));
        eventos.push({ tipo: 'custo', texto: `Fome: ${antes} → ${ficha.fome}.` });
      } else if (c.campo === 'macula' || c.campo === 'maculas') {
        eventos.push(...Estado.ganharMacula(ficha, c.delta, 'consequência da cena').eventos);
      } else if (c.campo === 'dano') {
        eventos.push(...Estado.aplicarDano(ficha, { quantidade: c.delta, fonte: 'consequência da cena' }).eventos);
      } else if (c.campo === 'vontade') {
        eventos.push(...Estado.aplicarDano(ficha, { quantidade: Math.abs(c.delta), trilha: 'vontade',
          fonte: 'consequência da cena' }).eventos);
      }
    });

    if (desfecho.destino) {
      const ab = this.abrirCena(campanha, estado, desfecho.destino);
      eventos.push(...ab.eventos);
      return { eventos, destino: desfecho.destino };
    }
    return { eventos, destino: null };
  },

  contextoParaNarrador(campanha, estado) {
    const cap = this.capituloAtual(campanha, estado);
    const cena = this.cenaAtual(campanha, estado);
    return {
      campanha: campanha.meta.campanha || '',
      capitulo: cap ? { titulo: cap.titulo, resumo: cap.resumo } : null,
      cena: cena ? { id: cena.id, titulo: cena.titulo, local: cena.local, hora: cena.hora,
                     narracao: cena.narracao, entidades: cena.entidades, saidas: cena.saidas } : null,
      turnosNaCena: estado.turnosNaCena,
      visitadas: estado.visitadas.slice(-5),
      fatosRevelados: estado.fatosRevelados.slice()
    };
  },

  progresso(campanha, estado) {
    const total = campanha.capitulos.reduce((a, c) => a + c.cenas.length, 0);
    return { cenasVisitadas: estado.visitadas.length, cenasTotais: total,
             capitulo: estado.capitulo + 1, capitulos: campanha.capitulos.length };
  }
};

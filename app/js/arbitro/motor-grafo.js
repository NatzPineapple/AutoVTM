/* ============================================================
   VITÆ — Grafo de conhecimento
   Segundo elo da cadeia de arbitragem: recebe um plano de ações
   e responde uma pergunta só — ISSO É POSSÍVEL NESTE MUNDO?

   Não sabe regra de V5 e não calcula dado. Sabe onde as coisas
   estão, o que contém o quê, o que está trancado, quem conhece
   quem, e o que alcança o quê. Quem decide piscina e dificuldade
   é o Especialista, depois.

   A mesa guarda listas planas (locais, pessoas, bolsa). Aqui elas
   viram nós e arestas tipadas, e o que era implícito — "a chave
   está na gaveta" — passa a ser consultável.
   ============================================================ */

const Grafo = {

  TIPOS: {
    local:       'Lugar',
    pessoa:      'Pessoa',
    objeto:      'Objeto',
    personagem:  'Você',
    fato:        'Fato'
  },

  RELACOES: {
    esta_em:    { de: ['pessoa', 'objeto', 'personagem'], para: ['local'], inverso: 'abriga' },
    abriga:     { de: ['local'], para: ['pessoa', 'objeto', 'personagem'], inverso: 'esta_em' },
    contem:     { de: ['local', 'objeto'], para: ['objeto'], inverso: 'dentro_de' },
    dentro_de:  { de: ['objeto'], para: ['local', 'objeto'], inverso: 'contem' },
    adjacente:  { de: ['local'], para: ['local'], simetrica: true },
    carrega:    { de: ['personagem', 'pessoa'], para: ['objeto'], inverso: 'carregado_por' },
    carregado_por: { de: ['objeto'], para: ['personagem', 'pessoa'], inverso: 'carrega' },
    trancado_por: { de: ['objeto', 'local'], para: ['objeto'], unidirecional: true },
    conhece:    { de: ['personagem', 'pessoa'], para: ['pessoa', 'fato', 'local'], unidirecional: true },
    dominio_de: { de: ['local'], para: ['pessoa'], unidirecional: true }
  },

  ABERTOS: ['aberto', 'destrancado', 'quebrado'],

  vazio() {
    return { nos: new Map(), arestas: [], indice: new Map() };
  },

  por(g, id) {
    return g.nos.get(id) || null;
  },

  acrescentarNo(g, no) {
    if (!no || !no.id || !this.TIPOS[no.tipo]) return null;
    const existente = g.nos.get(no.id);
    if (existente) { Object.assign(existente, no); return existente; }
    g.nos.set(no.id, Object.assign({ estado: 'aberto' }, no));
    return g.nos.get(no.id);
  },

  ligar(g, de, relacao, para) {
    const r = this.RELACOES[relacao];
    if (!r || !g.nos.has(de) || !g.nos.has(para)) return false;
    if (g.arestas.some(a => a.de === de && a.relacao === relacao && a.para === para)) return true;
    g.arestas.push({ de, relacao, para });
    this.indexar(g, de, relacao, para);
    if (r.simetrica) {
      if (!g.arestas.some(a => a.de === para && a.relacao === relacao && a.para === de)) {
        g.arestas.push({ de: para, relacao, para: de });
        this.indexar(g, para, relacao, de);
      }
    } else if (r.inverso) {
      if (!g.arestas.some(a => a.de === para && a.relacao === r.inverso && a.para === de)) {
        g.arestas.push({ de: para, relacao: r.inverso, para: de });
        this.indexar(g, para, r.inverso, de);
      }
    }
    return true;
  },

  indexar(g, de, relacao, para) {
    const chave = `${de}|${relacao}`;
    if (!g.indice.has(chave)) g.indice.set(chave, []);
    g.indice.get(chave).push(para);
  },

  vizinhos(g, id, relacao) {
    return (g.indice.get(`${id}|${relacao}`) || []).slice();
  },

  ligado(g, de, relacao, para) {
    return this.vizinhos(g, de, relacao).includes(para);
  },

  ondeEsta(g, id) {
    const direto = this.vizinhos(g, id, 'esta_em')[0];
    if (direto) return direto;
    const dono = this.vizinhos(g, id, 'carregado_por')[0];
    if (dono) return this.ondeEsta(g, dono);
    const recipiente = this.vizinhos(g, id, 'dentro_de')[0];
    if (recipiente) return this.ondeEsta(g, recipiente);
    return null;
  },

  cadeiaDeContinente(g, id) {
    const cadeia = [];
    let atual = this.vizinhos(g, id, 'dentro_de')[0];
    let voltas = 0;
    while (atual && voltas++ < 20) {
      const no = this.por(g, atual);
      if (!no || no.tipo === 'local') break;
      cadeia.push(no);
      atual = this.vizinhos(g, atual, 'dentro_de')[0];
    }
    return cadeia;
  },

  caminho(g, de, ate, maximo = 12) {
    if (de === ate) return [de];
    const visto = new Set([de]);
    const fila = [[de]];
    while (fila.length) {
      const rota = fila.shift();
      if (rota.length > maximo) continue;
      const ultimo = rota[rota.length - 1];
      for (const proximo of this.vizinhos(g, ultimo, 'adjacente')) {
        if (visto.has(proximo)) continue;
        const passo = rota.concat(proximo);
        if (proximo === ate) return passo;
        visto.add(proximo);
        fila.push(passo);
      }
    }
    return null;
  },

  saltos(g, de, ate) {
    const c = this.caminho(g, de, ate);
    return c ? c.length - 1 : Infinity;
  },

  aoAlcanceDaMao(g, quem, alvoId) {
    const alvo = this.por(g, alvoId);
    if (!alvo) return { ok: false, motivo: 'inexistente' };
    if (this.ligado(g, quem, 'carrega', alvoId)) return { ok: true, como: 'na mão' };

    const aqui = this.ondeEsta(g, quem);
    const la = this.ondeEsta(g, alvoId);
    if (!la) return { ok: false, motivo: 'sem lugar' };
    if (aqui !== la) return { ok: false, motivo: 'outro lugar', onde: la };

    const fechados = this.cadeiaDeContinente(g, alvoId)
      .filter(n => !this.ABERTOS.includes(n.estado));
    if (fechados.length) return { ok: false, motivo: 'dentro de fechado', recipiente: fechados[0] };

    const dono = this.vizinhos(g, alvoId, 'carregado_por')[0];
    if (dono && dono !== quem) return { ok: false, motivo: 'com outro', quem: dono };

    return { ok: true, como: 'no lugar' };
  },

  trancas(g, id) {
    return this.vizinhos(g, id, 'trancado_por')
      .map(chave => this.por(g, chave))
      .filter(Boolean);
  },

  /* ---------- construção a partir do estado da mesa ---------- */

  de(mesa) {
    const g = this.vazio();
    const m = mesa || {};

    this.acrescentarNo(g, { id: 'voce', tipo: 'personagem',
      nome: (m.ficha && m.ficha.nome) || 'Você' });

    for (const l of m.locais || []) {
      this.acrescentarNo(g, { id: l.id, tipo: 'local', nome: l.nome, zona: l.zona || '',
        conhecido: l.conhecido !== false, perigo: l.perigo, campoDeCaca: l.campoDeCaca,
        descricao: l.descricao || '' });
    }

    const aqui = m.cena && m.cena.local;
    if (aqui && g.nos.has(aqui)) this.ligar(g, 'voce', 'esta_em', aqui);

    for (const p of m.pessoas || []) {
      this.acrescentarNo(g, { id: p.id, tipo: 'pessoa', nome: p.nome,
        relacao: p.relacao || 'desconhecido', conhecido: p.conhecido !== false,
        descricao: p.descricao || '' });
      if (p.conhecido !== false) this.ligar(g, 'voce', 'conhece', p.id);
    }
    for (const id of (m.cena && m.cena.presentes) || []) {
      if (g.nos.has(id) && aqui && g.nos.has(aqui)) this.ligar(g, id, 'esta_em', aqui);
    }

    for (const f of m.fatos || []) {
      this.acrescentarNo(g, { id: f.id, tipo: 'fato', nome: f.titulo || f.id });
      this.ligar(g, 'voce', 'conhece', f.id);
    }

    /* Os oponentes da briga também são gente no lugar — item A7 da
       §45.2. Eles viviam só em `M.combate.oponentes`, fora do grafo, e
       o efeito era que o elo 3 ficava cego exatamente onde ele importa:
       dentro do combate. Não sabendo onde o sujeito está, a navegação
       não podia dizer nada sobre distância, cobertura ou linha de tiro.

       Entram com o `ref` como id (`op:1`), que já é único, e ficam no
       local da cena — que é onde a briga acontece. `distancia` e
       `cobertura` declarados pela cena vêm junto e continuam ganhando
       do inferido. */
    for (const o of (m.combate && m.combate.oponentes) || []) {
      if (!o || !o.ref) continue;
      this.acrescentarNo(g, { id: o.ref, tipo: 'pessoa', nome: o.nome || 'Oponente',
        relacao: 'inimigo', conhecido: true, oponente: true,
        estado: o.estado || 'aberto',
        distancia: typeof o.distancia === 'number' ? o.distancia : undefined,
        cobertura: o.cobertura || undefined,
        local: o.local || undefined });
      const onde = (o.local && g.nos.has(o.local)) ? o.local : aqui;
      if (onde && g.nos.has(onde)) this.ligar(g, o.ref, 'esta_em', onde);
    }

    (m.bolsa || []).forEach((item, i) => {
      const id = this.idDeItem(item.nome, i);
      this.acrescentarNo(g, { id, tipo: 'objeto', nome: item.nome, arma: !!item.arma,
        daBolsa: true, indiceNaBolsa: i });
      this.ligar(g, 'voce', 'carrega', id);
    });

    this.adjacenciaPorZona(g);
    this.aplicarDeclaracoes(g, m.grafo);
    return g;
  },

  idDeItem(nome, i) {
    const base = String(nome || 'item').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return `obj_${base || 'item'}_${i}`;
  },

  adjacenciaPorZona(g) {
    const porZona = new Map();
    for (const no of g.nos.values()) {
      if (no.tipo !== 'local') continue;
      const z = no.zona || '';
      if (!z) continue;
      if (!porZona.has(z)) porZona.set(z, []);
      porZona.get(z).push(no.id);
    }
    for (const lista of porZona.values()) {
      for (let i = 0; i < lista.length; i++) {
        for (let j = i + 1; j < lista.length; j++) this.ligar(g, lista[i], 'adjacente', lista[j]);
      }
    }
  },

  aplicarDeclaracoes(g, decl) {
    if (!decl) return;
    for (const no of decl.nos || []) this.acrescentarNo(g, no);
    for (const a of decl.arestas || []) this.ligar(g, a.de, a.relacao, a.para);
    for (const [id, estado] of Object.entries(decl.estados || {})) {
      const no = this.por(g, id);
      if (no) no.estado = estado;
    }
  },

  /* ---------- validação de um plano ---------- */

  MOTIVOS: {
    inexistente:          'não existe nada assim por aqui',
    'sem lugar':          'não está em lugar nenhum que você alcance',
    'outro lugar':        'está em outro lugar',
    'dentro de fechado':  'está dentro de algo fechado',
    'com outro':          'está com outra pessoa'
  },

  validar(g, plano, { quem = 'voce' } = {}) {
    const bloqueios = [], avisos = [], fatos = [];
    const acoes = (plano && plano.acoes) || [];

    if (!acoes.length) {
      return { possivel: null, bloqueios, avisos: ['Nenhuma ação para validar.'], fatos };
    }

    for (const acao of acoes) {
      if (acao.destino) {
        const destino = this.por(g, acao.destino);
        if (!destino) {
          bloqueios.push({ tipo: 'grafo', acao: acao.verbo, alvo: acao.destino,
            motivo: `Você fala de "${acao.alvoTexto || acao.destino}", e ${this.MOTIVOS.inexistente}.` });
        } else {
          const daqui = this.ondeEsta(g, quem);
          const rota = this.caminho(g, daqui, acao.destino);
          if (rota) {
            fatos.push({ acao: acao.verbo, destino: acao.destino,
                         saltos: rota.length - 1, rota, modo: 'a pé' });
          } else if (destino.conhecido === false) {
            bloqueios.push({ tipo: 'grafo', acao: acao.verbo, alvo: acao.destino,
              motivo: `Você não sabe chegar em ${destino.nome}. Não é um lugar que você conheça.` });
          } else {
            fatos.push({ acao: acao.verbo, destino: acao.destino,
                         saltos: null, rota: null, modo: 'travessia da cidade' });
            avisos.push(`${destino.nome} não fica ao lado daqui: é travessia pela cidade, e leva a noite junto.`);
          }
        }
      }

      const alvoId = acao.alvo;
      if (!alvoId) {
        if (!acao.destino) fatos.push({ acao: acao.verbo, semAlvo: true });
        continue;
      }

      const alvo = this.por(g, alvoId);
      if (!alvo) {
        bloqueios.push({ tipo: 'grafo', acao: acao.verbo, alvo: alvoId,
          motivo: `Você fala de "${acao.alvoTexto || alvoId}", e ${this.MOTIVOS.inexistente}.` });
        continue;
      }

      if (acao.exigeAlcance !== false && ['objeto', 'pessoa'].includes(alvo.tipo)) {
        const mao = this.aoAlcanceDaMao(g, quem, alvoId);
        if (!mao.ok) {
          const extra = mao.motivo === 'outro lugar' && mao.onde
            ? ` — está em ${(this.por(g, mao.onde) || {}).nome || mao.onde}`
            : mao.motivo === 'dentro de fechado'
              ? ` — está ${mao.recipiente.estado || 'fechado'} dentro de ${mao.recipiente.nome}`
              : mao.motivo === 'com outro'
                ? ` — está com ${(this.por(g, mao.quem) || {}).nome || mao.quem}`
                : '';
          bloqueios.push({ tipo: 'grafo', acao: acao.verbo, alvo: alvoId,
            motivo: `${alvo.nome} ${this.MOTIVOS[mao.motivo]}${extra}.` });
          continue;
        }
        fatos.push({ acao: acao.verbo, alvo: alvoId, alcance: mao.como });
      }

      if (acao.exigeAberto && !this.ABERTOS.includes(alvo.estado)) {
        const chaves = this.trancas(g, alvoId);
        const temChave = chaves.some(c => this.ligado(g, quem, 'carrega', c.id));
        if (chaves.length && temChave) {
          avisos.push(`${alvo.nome} está trancado, e você tem ${chaves[0].nome}.`);
          fatos.push({ acao: acao.verbo, alvo: alvoId, destrancavel: true });
        } else if (chaves.length) {
          bloqueios.push({ tipo: 'grafo', acao: acao.verbo, alvo: alvoId,
            motivo: `${alvo.nome} está trancado, e a chave é ${chaves[0].nome}, que você não tem.` });
        } else {
          fatos.push({ acao: acao.verbo, alvo: alvoId, precisaForcar: true, estado: alvo.estado });
          avisos.push(`${alvo.nome} está ${alvo.estado}. Abrir vai exigir força ou ferramenta.`);
        }
      }

    }

    return { possivel: bloqueios.length ? false : true, bloqueios, avisos, fatos };
  },

  contexto(g, quem = 'voce') {
    const aqui = this.ondeEsta(g, quem);
    const local = this.por(g, aqui);
    return {
      onde: aqui,
      local: local ? local.nome : null,
      presentes: this.vizinhos(g, aqui || '', 'abriga')
        .filter(id => id !== quem)
        .map(id => this.por(g, id))
        .filter(n => n && n.tipo === 'pessoa'),
      objetosAqui: this.vizinhos(g, aqui || '', 'abriga')
        .map(id => this.por(g, id)).filter(n => n && n.tipo === 'objeto'),
      naMao: this.vizinhos(g, quem, 'carrega').map(id => this.por(g, id)).filter(Boolean),
      saidas: this.vizinhos(g, aqui || '', 'adjacente')
        .map(id => this.por(g, id)).filter(Boolean)
    };
  },

  resumo(g) {
    const porTipo = {};
    for (const no of g.nos.values()) porTipo[no.tipo] = (porTipo[no.tipo] || 0) + 1;
    return { nos: g.nos.size, arestas: g.arestas.length, porTipo };
  }
};

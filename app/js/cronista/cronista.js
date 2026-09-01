/* ============================================================
   VITÆ — Cronista, lado do navegador
   Orquestrador da crônica, na mesma forma da cadeia de arbitragem
   (§38). Quatro elos, e nenhum invade a pergunta do outro:

     1 COLETA        a sessão vira eventos com peso
     2 GRAFO         quem entrou de fato na história
     3 ESPECIALISTA  regras declarativas decidem o que atravessa
     4 REDAÇÃO       prosa determinística, ou o modelo pelo proxy

   Os elos 1 a 3 vivem em motor-cronica.js e não devolvem prosa
   nem HTML; devolvem fatos e um RASTRO de quais regras dispararam.
   Este arquivo só costura e fala com o proxy.

   Sem proxy ou sem provedor local, para no elo 3 e escreve a prosa
   determinística — o jogo continua funcionando, igual ao resto.
   ============================================================ */

const Cronista = {
  estado: { verificado: false, disponivel: false, modelo: '' },

  async verificar() {
    try {
      const r = await fetch('/api/estado', { cache: 'no-store' });
      if (!r.ok) throw new Error('sem proxy');
      const d = await r.json();
      this.estado = { verificado: true, disponivel: !!d.cronista, modelo: d.modelo };
    } catch (e) {
      this.estado = { verificado: true, disponivel: false, modelo: '' };
    }
    return this.estado;
  },

  /* ---------- elos 1 a 3, delegados ao motor de regras ---------- */

  analisar(mesa, tipo = 'capitulo') {
    return Cronica.avaliar({ mesa, tipo });
  },

  encolher(t, max = 220) {
    return Cronica.encolher(t, max);
  },

  eventosDe(mesa) {
    return this.analisar(mesa).eventos;
  },

  mudancasDe(mesa) {
    return this.analisar(mesa).mudancas;
  },

  mencionados(mesa) {
    return Cronica.tocados(Cronica.memoriaDe({ mesa, tipo: 'dossie' }));
  },

  relacoesRelevantes(mesa) {
    return this.analisar(mesa, 'dossie').relacoes;
  },

  marcasDeterministicas(mesa) {
    return this.analisar(mesa, 'dossie').marcas;
  },

  /* ---------- elo 4: o pedido ao modelo ---------- */

  pedidoDe(mesa, tipo, analise = null) {
    const a = analise || this.analisar(mesa, tipo);
    const f = mesa.ficha || {};
    const pf = Seitas.perfil(f.seita);
    const c = claDe(f.cla);
    const campanha = mesa.campanha;
    const indiceCapitulo = (mesa.diretor && mesa.diretor.capitulo) || 0;
    const cap = campanha && campanha.capitulos ? campanha.capitulos[indiceCapitulo] : null;

    const cenas = ((mesa.diretor && mesa.diretor.visitadas) || []).map(id => {
      const cena = campanha ? Diretor.cenaPorId(campanha, id) : null;
      return { id, titulo: cena ? cena.titulo : id, local: cena ? cena.local : '' };
    });

    const tocados = a.tocados && a.tocados.size ? a.tocados : this.mencionados(mesa);
    const estado = Cronica.caberEstado(mesa);

    return {
      tipo,
      personagem: `${f.nome || 'sem nome'} — ${c ? c.nome : 'sem clã'}, ${f.geracao || '?'}ª geração`,
      lealdade: pf.id ? `${pf.nome} · ${Seitas.resumo(f, typeof Matilha !== 'undefined' ? Matilha.de(f) : null)}` : 'sem seita',
      seita: f.seita || '',
      cidade: f.cidade || '',
      arquivoCampanha: campanha && campanha.arquivo ? campanha.arquivo.split('/').pop() : null,
      indiceCapitulo,
      capitulo: cap ? `${cap.titulo}${cap.resumo ? ` — ${cap.resumo}` : ''}` : 'Noite livre, sem roteiro',
      cenas,
      pessoas: (mesa.pessoas || []).map(p => ({ id: p.id, nome: p.nome, relacao: p.relacao,
        tocado: tocados.has(p.id) })),
      locais: (mesa.locais || []).map(l => ({ id: l.id, nome: l.nome })),
      /* Passam pela reserva de estado (§51): fato e fio não são evento
         da sessão e por isso ficavam fora do orçamento — entravam
         inteiros, por cima dos 4.000 tokens já contados. */
      fatos: estado.fatos.map(x => ({ titulo: x.titulo, texto: this.encolher(x.texto, 180) })),
      fios: estado.fios.map(x => ({ id: x.id, titulo: x.titulo, estado: x.estado })),
      eventos: a.eventos,
      mudancas: a.mudancas,
      resumoAnterior: (mesa.cronicas || []).filter(x => x.tipo === 'capitulo').slice(-1)[0]?.saida?.cronica || '',
      legado: Legado.resumoParaModelo(f),
      orcamento: Object.assign({}, a.orcamento, {
        estadoTokens: estado.tokens, estadoCortados: estado.cortados,
        estadoTeto: Cronica.RESERVA_ESTADO_TOKENS })
    };
  },

  /* Elo 4, degrau determinístico: prosa montada dos fatos que o
     especialista já decidiu. Preço, marcas e vínculos vêm da análise —
     duplicar a regra aqui reintroduziria a divergência que a auditoria
     achou entre a interface e a rolagem. */
  determinista(mesa, tipo, analise = null) {
    const a = analise || this.analisar(mesa, tipo);
    const pedido = this.pedidoDe(mesa, tipo, a);
    const f = mesa.ficha || {};
    const cenas = pedido.cenas.map(c => c.titulo).filter(Boolean);
    const fatos = (mesa.fatos || []).map(x => x.titulo);
    const abertos = (mesa.fios || []).filter(x => x.estado !== 'fechado');

    const frase = (t) => String(t || '').trim().replace(/[.;]+$/, '');

    const cronica = [
      cenas.length ? `A noite passou por ${cenas.map(frase).join(', ')}.` : 'A noite não seguiu roteiro nenhum.',
      fatos.length ? `Ficou estabelecido: ${fatos.map(frase).join('; ')}.` : '',
      abertos.length ? `Continua em aberto: ${abertos.map(x => frase(x.titulo)).join('; ')}.` : '',
      a.preco.length ? a.preco.join(' ') : 'Nada cobrou preço visível ainda.'
    ].filter(Boolean).join(' ');

    const base = {
      titulo: pedido.capitulo.split('—')[0].trim() || 'A noite',
      cronica,
      aconteceu: fatos.length ? fatos : cenas,
      precoPago: a.preco,
      fiosAbertos: abertos.map(x => ({ id: x.id, titulo: x.titulo, estado: 'aberto' })),
      proximoBeat: abertos.length ? abertos[0].titulo : 'Nada marcado. Alguém vai marcar.',
      rastro: a.rastro.map(x => x.regra)
    };

    if (tipo === 'dossie') {
      const vinculoPor = { aliado: 'aliado', contato: 'contato', autoridade: 'autoridade',
        suspeito: 'rival', ameaca: 'inimigo', complicado: 'credor', neutro: 'contato' };
      return {
        titulo: `Dossiê — ${f.nome || 'sem nome'}`,
        dossie: cronica,
        marcas: a.marcas,
        relacoes: a.relacoes.map(p => ({ id: p.id, quem: p.nome,
          natureza: p.descricao || p.tipo || '',
          vinculo: vinculoPor[p.relacao] || 'contato', dividaEmAberto: '—' })),
        posses: a.posses,
        fiosAbertos: base.fiosAbertos,
        ganchoFuturo: base.proximoBeat,
        rastro: base.rastro
      };
    }
    return base;
  },

  async cronicar(mesa, tipo = 'capitulo') {
    if (!this.estado.verificado) await this.verificar();

    const analise = this.analisar(mesa, tipo);
    const cair = (falha) => Object.assign(
      { tipo, saida: this.determinista(mesa, tipo, analise), origem: 'deterministico',
        valido: true, problemas: [], orcamento: analise.orcamento },
      falha ? { falha } : {});

    if (!this.estado.disponivel) return cair(null);

    try {
      const r = await fetch('/api/cronista', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.pedidoDe(mesa, tipo, analise))
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || `HTTP ${r.status}`);
      return Object.assign({ origem: 'modelo', orcamento: analise.orcamento }, d);
    } catch (e) {
      return cair(e.message);
    }
  }
};

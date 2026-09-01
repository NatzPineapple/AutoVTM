/* ============================================================
   VITÆ — Consultas às tabelas do Escudo
   Uma responsabilidade: **procurar na faixa certa da tabela
   certa**. Frenesi, Remorso, Compulsão, Potência de Sangue,
   ferimento, Máculas, dano social, alimentação.

   É tudo tradução de tabela impressa para chamada de função. Não
   há regra nova aqui, e não deve haver: quando um destes devolve
   número diferente do livro, o defeito está na tabela do
   `data-escudo.js`, não neste arquivo — foi assim que a §40
   achou a coluna de Surto trocada.

   Saiu de `motor-arbitro.js` na §48 (item A4). O Árbitro delega.
   ============================================================ */

const TabelasV5 = {

  /* Consulta a tabela impressa casa string, e string precisa perder
     acento e caixa antes de casar. A normalização é do léxico, e esta
     é a única coisa que as tabelas pedem a ele. */
  normalizar(t) { return Lexico.normalizar(t); },

  naFaixa(tabela, valor, campo = 'faixa') {
    return tabela.find(x => valor >= x[campo][0] && valor <= x[campo][1]) || null;
  },

  dificuldadeDescrita(n) {
    const t = Escudo.DIFICULDADE_ACAO;
    return t.find(x => x.nivel === Math.max(1, Math.min(7, n))) || t[t.length - 1];
  },

  oposicaoDe(nivel) {
    return Escudo.ANTAGONISTAS.find(a =>
      nivel >= a.dificuldade && (a.ate == null || nivel <= a.ate)) || Escudo.ANTAGONISTAS[0];
  },

  dificuldadeDeCaca(zona) {
    if (!zona) return null;
    const n = this.normalizar(zona);
    for (const c of Escudo.CAMPO_DE_CACA) {
      const alvo = this.normalizar(c.lugares).split(', ');
      if (alvo.some(l => n.includes(l) || l.includes(n))) return c;
    }
    return null;
  },

  potenciaDeGeracao(ger) {
    const g = Number(ger) || 13;
    return Escudo.GERACAO_POTENCIA.find(x => g >= x.geracoes[0] && g <= x.geracoes[1])
      || { geracoes: [12, 13], min: 1, max: 3 };
  },

  tabelaPotencia(ps) {
    return Escudo.POTENCIA_SANGUE[Math.max(0, Math.min(10, ps | 0))];
  },

  gatilhosDeFrenesi(tipo) {
    return tipo ? (Escudo.GATILHOS_FRENESI[tipo] || []) : Escudo.GATILHOS_FRENESI;
  },

  dificuldadeFrenesi(tipo, gatilho, humanidade) {
    const lista = Escudo.GATILHOS_FRENESI[tipo] || [];
    const n = this.normalizar(gatilho || '');
    const achado = lista.find(g => this.normalizar(g.gatilho).includes(n) && n) || null;
    const base = achado ? achado.dificuldade : 3;
    const h = Escudo.HUMANIDADE[Math.max(1, Math.min(9, humanidade | 0))];
    return {
      gatilho: achado ? achado.gatilho : gatilho,
      dificuldade: base,
      modificadorHumanidade: h ? h.modFrenesi : 0,
      piscina: 'Autocontrole + Determinação',
      nota: h ? `Humanidade ${humanidade}: soma ${h.modFrenesi} à resistência.` : ''
    };
  },

  consequencias(resultado) {
    if (resultado.tipo === 'perigo') {
      return { titulo: 'Sucesso em Perigo', escolhas: Escudo.CRITICO_BAGUNCADO.slice() };
    }
    if (resultado.tipo === 'bestial') {
      return { titulo: 'Falha Bestial', escolhas: Escudo.FALHA_BESTIAL.slice() };
    }
    return null;
  },

  compulsaoAleatoria(cla) {
    const d = Dados.d10();
    const achado = Escudo.COMPULSOES_ALEATORIAS.find(c => d >= c.faixa[0] && d <= c.faixa[1]);
    const semCla = cla === 'caitiff' || cla === 'sangue_fraco';
    if (achado && achado.nome === 'Compulsão do Clã' && semCla) return this.compulsaoAleatoria(cla);
    return { dado: d, compulsao: achado ? achado.nome : 'Fome', nota: achado ? achado.nota : '' };
  },

  ferimentoPor(danoAgravado) {
    const total = (danoAgravado | 0) + Dados.d10();
    const f = this.naFaixa(Escudo.FERIMENTOS, total);
    return { total, ferimento: f };
  },

  maculasPor(ato) {
    const n = this.normalizar(ato || '');
    return Escudo.MACULAS_POR_ATO.find(m => this.normalizar(m.ato).includes(n) && n) || null;
  },

  danoSocialExtra(testemunhas) {
    const n = this.normalizar(testemunhas || '');
    return Escudo.DANO_SOCIAL.find(d => this.normalizar(d.testemunhas).includes(n) && n)
      || Escudo.DANO_SOCIAL[0];
  },

  alimentacaoPor(fonte) {
    const n = this.normalizar(fonte || '');
    return Escudo.ALIMENTACAO.find(a => this.normalizar(a.fonte).includes(n) && n) || null;
  },
};

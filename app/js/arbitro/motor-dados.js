const Dados = {

  d10() { return 1 + Math.floor(Math.random() * 10); },

  /* Ler reserva de dados é leitura de ficha, e desde a §47 mora na área
     Ficha (`piscinaDaFicha`). Isto aqui é a porta de entrada de sempre,
     para não mexer nos chamadores — o Árbitro rola, a Ficha lê. */
  piscinaDe(ficha, atributoId, periciaId) {
    return piscinaDaFicha(ficha, atributoId, periciaId);
  },

  rolar({ piscina, fome = 0, dificuldade = 0, rotulo = '' }) {
    const total = Math.max(0, piscina | 0);
    const nFome = Math.max(0, Math.min(fome | 0, total));
    const nNormais = total - nFome;
    const normais = Array.from({ length: nNormais }, () => this.d10());
    const dadosFome = Array.from({ length: nFome }, () => this.d10());
    return this._apurar({ normais, dadosFome, dificuldade, piscina: total, fome: nFome, rotulo });
  },

  dadosRetestaveis(r) {
    return r.normais
      .map((v, i) => ({ i, v }))
      .filter(x => x.v < 6)
      .sort((a, b) => a.v - b.v)
      .slice(0, 3)
      .map(x => x.i);
  },

  podeRetestar(r) {
    return !r.retestado && this.dadosRetestaveis(r).length > 0;
  },

  retestarVontade(r, indices) {
    const validos = (indices && indices.length ? indices : this.dadosRetestaveis(r))
      .filter(i => i >= 0 && i < r.normais.length && r.normais[i] < 6);
    const alvo = validos.slice(0, 3);
    const normais = r.normais.slice();
    alvo.forEach(i => { if (i >= 0 && i < normais.length) normais[i] = this.d10(); });
    const novo = this._apurar({
      normais, dadosFome: r.dadosFome.slice(),
      dificuldade: r.dificuldade, piscina: r.piscina, fome: r.fome, rotulo: r.rotulo
    });
    novo.retestado = true;
    novo.indicesRetestados = alvo;
    return novo;
  },

  _apurar({ normais, dadosFome, dificuldade, piscina, fome, rotulo }) {
    const todos = normais.concat(dadosFome);
    const dezes = todos.filter(v => v === 10).length;
    const dezesFome = dadosFome.filter(v => v === 10).length;
    const unsFome = dadosFome.filter(v => v === 1).length;
    const pares = Math.floor(dezes / 2);
    const basicos = todos.filter(v => v >= 6).length;
    const sucessos = basicos + pares * 2;
    const critico = pares >= 1;
    const passou = dificuldade > 0 ? sucessos >= dificuldade : sucessos > 0;

    let tipo;
    if (passou && critico && dezesFome > 0) tipo = 'perigo';
    else if (passou && critico)             tipo = 'critico';
    else if (passou)                        tipo = 'sucesso';
    else if (unsFome > 0)                   tipo = 'bestial';
    else if (sucessos === 0)                tipo = 'total';
    else                                    tipo = 'falha';

    return {
      rotulo, piscina, fome, dificuldade,
      normais, dadosFome,
      sucessos, basicos, pares, dezes, dezesFome, unsFome,
      critico, passou, tipo,
      margem: dificuldade > 0 ? sucessos - dificuldade : sucessos,
      retestado: false, indicesRetestados: []
    };
  },

  provocacao() {
    const v = this.d10();
    return { valor: v, subiuFome: v <= 5 };
  },

  ROTULOS: {
    perigo:  { nome: 'Sucesso em Perigo',
               nota: 'Você conseguiu — e a Besta cobrou o preço em público.' },
    critico: { nome: 'Sucesso Crítico',
               nota: 'Muito além do necessário.' },
    sucesso: { nome: 'Sucesso', nota: '' },
    falha:   { nome: 'Falha', nota: 'Não foi o bastante.' },
    total:   { nome: 'Falha Total',
               nota: 'Nenhum sucesso. Pior do que não ter tentado.' },
    bestial: { nome: 'Falha Bestial',
               nota: 'A Fome respondeu por você. A consequência é grave.' }
  },

  descrever(r) {
    const t = this.ROTULOS[r.tipo];
    const alvo = r.dificuldade > 0 ? ` contra dificuldade ${r.dificuldade}` : '';
    return `${t.nome} — ${r.sucessos} sucesso${r.sucessos === 1 ? '' : 's'}${alvo}.`;
  }
};

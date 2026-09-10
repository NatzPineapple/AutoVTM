/* ============================================================
   VITÆ — Legado do personagem
   O que atravessa crônicas. A sessão morre no fim da história;
   isto sobrevive: quem ele conheceu, o que ganhou, o que ficou
   marcado nele e o que não resolveu.

   Guardado por personagem, não por sessão. Uma crônica nova do
   mesmo personagem começa sabendo de tudo isto.
   ============================================================ */

const Legado = {
  CHAVE: 'vitae:legado',

  VINCULOS: {
    aliado:     { rotulo: 'Aliado',      peso: 2 },
    amizade:    { rotulo: 'Amizade',     peso: 3 },
    amor:       { rotulo: 'Amor',        peso: 4 },
    contato:    { rotulo: 'Contato',     peso: 1 },
    devedor:    { rotulo: 'Te deve',     peso: 2 },
    credor:     { rotulo: 'Você deve',   peso: 3 },
    rival:      { rotulo: 'Rival',       peso: 2 },
    inimigo:    { rotulo: 'Inimigo',     peso: 4 },
    autoridade: { rotulo: 'Autoridade',  peso: 2 },
    pilar:      { rotulo: 'Pilar',       peso: 4 },
    rompido:    { rotulo: 'Rompido',     peso: 1 }
  },

  TIPOS_DE_MARCA: {
    cicatriz:  'Cicatriz',
    trauma:    'Trauma',
    reputacao: 'Reputação',
    juramento: 'Juramento'
  },

  idDe(ficha) {
    const nome = String((ficha && ficha.nome) || 'sem_nome').normalize('NFD')
      .replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return `${nome || 'sem_nome'}__${(ficha && ficha.cla) || 'sem_cla'}`;
  },

  todos() {
    try { return JSON.parse(localStorage.getItem(this.CHAVE) || '{}'); }
    catch (e) { return {}; }
  },

  /* Devolve false quando não coube (item 7 da §14.1, e o mesmo
     tratamento de `guardarFicha` e `Matilha.guardar`). O legado é o que
     ATRAVESSA crônicas: perdê-lo em silêncio é perder o personagem
     inteiro entre uma noite e a seguinte. */
  guardar(mapa) {
    try { localStorage.setItem(this.CHAVE, JSON.stringify(mapa)); return true; }
    catch (e) {
      console.warn('Legado.guardar falhou:', e && e.name, e && e.message);
      return false;
    }
  },

  de(ficha) {
    return this.todos()[this.idDe(ficha)] || null;
  },

  vazio(ficha) {
    return {
      id: this.idDe(ficha),
      personagem: (ficha && ficha.nome) || 'Sem nome',
      cla: (ficha && ficha.cla) || '',
      criadoEm: Date.now(), atualizadoEm: Date.now(),
      cronicas: [], relacoes: [], marcas: [], posses: [], fios: [], aplicadas: []
    };
  },

  mesclarLista(existentes, novos, chave, deCronica) {
    for (const item of novos || []) {
      if (!item) continue;
      const id = chave(item);
      if (!id) continue;
      const antigo = existentes.find(x => chave(x) === id);
      if (antigo) Object.assign(antigo, item, { deCronica, atualizadoEm: Date.now() });
      else existentes.push(Object.assign({}, item, { deCronica, desdeEm: Date.now() }));
    }
    return existentes;
  },

  registrar(ficha, saida, contexto = {}) {
    const mapa = this.todos();
    const id = this.idDe(ficha);
    const reg = mapa[id] || this.vazio(ficha);
    const tituloCronica = contexto.campanha || (saida && saida.titulo) || 'Crônica sem nome';

    reg.personagem = (ficha && ficha.nome) || reg.personagem;
    reg.cla = (ficha && ficha.cla) || reg.cla;
    reg.atualizadoEm = Date.now();

    reg.cronicas.push({
      titulo: tituloCronica,
      campanha: contexto.campanha || '',
      cidade: contexto.cidade || (ficha && ficha.cidade) || '',
      seita: (ficha && ficha.seita) || '',
      quando: Date.now(),
      dossie: (saida && saida.dossie) || '',
      gancho: (saida && saida.ganchoFuturo) || ''
    });

    this.mesclarLista(reg.relacoes, saida && saida.relacoes, r => r.id, tituloCronica);
    this.mesclarLista(reg.posses, saida && saida.posses, p => p.nome, tituloCronica);
    this.mesclarLista(reg.fios, (saida && saida.fiosAbertos || []).filter(f => f.estado !== 'fechado'),
      f => f.id, tituloCronica);

    const marcas = (saida && saida.marcas || []).map(m =>
      typeof m === 'string' ? { texto: m, tipo: 'reputacao' } : m);
    this.mesclarLista(reg.marcas, marcas, m => m.texto, tituloCronica);

    reg.fios = reg.fios.filter(f => f.estado !== 'fechado');

    mapa[id] = reg;
    reg.gravado = this.guardar(mapa);
    return reg;
  },

  CONVERSOES: {
    marca: {
      reputacao: { classe: 'defeitos', id: 'infamia', pontos: 1,
                   porque: 'O que a cidade fala de você já chega antes de você.' },
      cicatriz:  { classe: 'defeitos', id: 'estigma', pontos: 1,
                   porque: 'A ferida que não fechou virou marca visível de morte-viva.' }
    },
    relacao: {
      inimigo:    { classe: 'defeitos', id: 'inimigo', pontos: 2,
                   porque: 'Alguém atravessou a crônica querendo você destruído.' },
      rival:      { classe: 'defeitos', id: 'adversario', pontos: 1,
                   porque: 'A rivalidade sobreviveu à história e continua sabotando você.' },
      aliado:     { classe: 'antecedentes', id: 'aliados', pontos: 1,
                   porque: 'Ficou gente que ajuda sem precisar de pagamento.' },
      pilar:      { classe: 'antecedentes', id: 'aliados', pontos: 1,
                   porque: 'Um Pilar da crônica anterior continua de pé ao seu lado.' },
      contato:    { classe: 'antecedentes', id: 'contatos', pontos: 1,
                   porque: 'Um telefone que ainda atende de madrugada.' },
      autoridade: { classe: 'antecedentes', id: 'mawla', pontos: 1,
                   porque: 'Quem mandava na crônica anterior passou a investir em você — e a cobrar.' }
    },
    posse: { classe: 'antecedentes', id: 'recursos', pontos: 1,
             porque: 'O que você carregou de outra crônica vale dinheiro ou porta aberta.' }
  },

  tetoDe(classe, id) {
    if (classe === 'antecedentes') {
      const a = ANTECEDENTES.find(x => x.id === id);
      return a ? a.max : 0;
    }
    const fonte = classe === 'meritos' ? MERITOS : DEFEITOS;
    const v = fonte.find(x => x.id === id);
    return v ? Math.max.apply(null, v.custos) : 0;
  },

  nomeDe(classe, id) {
    const fonte = classe === 'antecedentes' ? ANTECEDENTES : classe === 'meritos' ? MERITOS : DEFEITOS;
    const v = fonte.find(x => x.id === id);
    return v ? v.nome : id;
  },

  chaveDaProposta(origem, chave, alvo) {
    return `${origem}|${chave}|${alvo.classe}:${alvo.id}`;
  },

  propostas(ficha) {
    const reg = this.de(ficha);
    if (this.vazioDe(reg)) return [];
    const aplicadas = reg.aplicadas || [];
    const lista = [];

    const juntar = (origem, chave, rotulo, alvo) => {
      if (!alvo) return;
      const marca = this.chaveDaProposta(origem, chave, alvo);
      if (aplicadas.includes(marca)) return;
      const teto = this.tetoDe(alvo.classe, alvo.id);
      const atual = ((ficha && ficha[alvo.classe]) || {})[alvo.id] || 0;
      const novo = Math.min(teto, atual + alvo.pontos);
      if (!teto || novo <= atual) return;
      lista.push({ marca, origem, chave, rotulo,
                   classe: alvo.classe, id: alvo.id, nome: this.nomeDe(alvo.classe, alvo.id),
                   de: atual, para: novo, porque: alvo.porque });
    };

    for (const m of reg.marcas || []) {
      juntar('marca', m.texto, `${this.TIPOS_DE_MARCA[m.tipo] || 'Marca'}: ${m.texto}`,
             this.CONVERSOES.marca[m.tipo]);
    }
    for (const r of reg.relacoes || []) {
      juntar('relacao', r.id, `${r.quem} — ${
        this.VINCULOS[r.vinculo] ? this.VINCULOS[r.vinculo].rotulo.toLowerCase() : 'conhecido'}`,
             this.CONVERSOES.relacao[r.vinculo]);
    }
    for (const p of reg.posses || []) {
      juntar('posse', p.nome, p.nome, this.CONVERSOES.posse);
    }
    return lista;
  },

  aplicarProposta(ficha, marca) {
    const p = this.propostas(ficha).find(x => x.marca === marca);
    if (!p) return null;
    ficha[p.classe] = ficha[p.classe] || {};
    ficha[p.classe][p.id] = p.para;

    const mapa = this.todos();
    const reg = mapa[this.idDe(ficha)];
    if (reg) {
      reg.aplicadas = (reg.aplicadas || []).concat(p.marca);
      reg.atualizadoEm = Date.now();
      p.gravado = this.guardar(mapa);
    }
    return p;
  },

  recusarProposta(ficha, marca) {
    const mapa = this.todos();
    const reg = mapa[this.idDe(ficha)];
    if (!reg) return null;
    reg.aplicadas = (reg.aplicadas || []).concat(marca);
    reg.atualizadoEm = Date.now();
    reg.gravado = this.guardar(mapa);
    return reg;
  },

  esquecer(ficha, colecao, chave) {
    const mapa = this.todos();
    const reg = mapa[this.idDe(ficha)];
    if (!reg || !reg[colecao]) return null;
    const campo = { relacoes: 'id', posses: 'nome', marcas: 'texto', fios: 'id' }[colecao];
    reg[colecao] = reg[colecao].filter(x => x[campo] !== chave);
    reg.atualizadoEm = Date.now();
    mapa[reg.id] = reg;
    reg.gravado = this.guardar(mapa);
    return reg;
  },

  apagar(ficha) {
    const mapa = this.todos();
    delete mapa[this.idDe(ficha)];
    return this.guardar(mapa);
  },

  vazioDe(reg) {
    return !reg || (!reg.cronicas.length && !reg.relacoes.length &&
                    !reg.marcas.length && !reg.posses.length && !reg.fios.length);
  },

  pessoasParaSemente(ficha) {
    const reg = this.de(ficha);
    if (!reg) return [];
    const paraRelacao = {
      aliado: 'aliado', amizade: 'aliado', amor: 'aliado', pilar: 'aliado',
      contato: 'contato', devedor: 'contato', credor: 'complicado',
      rival: 'suspeito', inimigo: 'ameaca', autoridade: 'autoridade', rompido: 'complicado'
    };
    return reg.relacoes.map(r => ({
      id: r.id,
      nome: r.quem,
      tipo: `${this.VINCULOS[r.vinculo] ? this.VINCULOS[r.vinculo].rotulo : 'Conhecido'} · de ${r.deCronica}`,
      relacao: paraRelacao[r.vinculo] || 'neutro',
      conhecido: true, contato: true, doLegado: true,
      descricao: [r.natureza, r.dividaEmAberto && r.dividaEmAberto !== '—'
        ? `Em aberto: ${r.dividaEmAberto}` : ''].filter(Boolean).join(' ')
    }));
  },

  fiosParaSemente(ficha) {
    const reg = this.de(ficha);
    if (!reg) return [];
    return reg.fios.map(f => ({
      id: f.id, titulo: f.titulo, estado: f.estado || 'aberto', doLegado: true
    }));
  },

  resumoParaModelo(ficha) {
    const reg = this.de(ficha);
    if (this.vazioDe(reg)) return '';

    const ultima = reg.cronicas[reg.cronicas.length - 1];
    const linhas = [];

    linhas.push(`Este personagem já viveu ${reg.cronicas.length} crônica(s) antes desta.`);
    if (ultima && ultima.dossie) {
      linhas.push(`Fim da última, "${ultima.titulo}": ${ultima.dossie}`);
    }
    if (ultima && ultima.gancho) linhas.push(`O que ficou armado: ${ultima.gancho}`);

    if (reg.relacoes.length) {
      linhas.push('Gente que já faz parte da vida dele:');
      reg.relacoes.forEach(r => linhas.push(
        `- ${r.id} — ${r.quem}, ${this.VINCULOS[r.vinculo] ? this.VINCULOS[r.vinculo].rotulo.toLowerCase() : 'conhecido'}.` +
        ` ${r.natureza || ''}${r.dividaEmAberto && r.dividaEmAberto !== '—' ? ` Em aberto: ${r.dividaEmAberto}.` : ''}`));
    }
    if (reg.marcas.length) {
      linhas.push('O que ficou marcado nele:');
      reg.marcas.forEach(m => linhas.push(`- ${this.TIPOS_DE_MARCA[m.tipo] || 'Marca'}: ${m.texto}`));
    }
    if (reg.posses.length) {
      linhas.push('O que ele carrega de outras crônicas:');
      reg.posses.forEach(p => linhas.push(`- ${p.nome} (${p.comoVeio})`));
    }
    if (reg.fios.length) {
      linhas.push('O que ficou sem resposta:');
      reg.fios.forEach(f => linhas.push(`- ${f.id} — ${f.titulo}`));
    }
    return linhas.join('\n');
  },

  resumoCurto(ficha) {
    const reg = this.de(ficha);
    if (this.vazioDe(reg)) return '';
    const partes = [];
    if (reg.cronicas.length) partes.push(`${reg.cronicas.length} crônica(s)`);
    if (reg.relacoes.length) partes.push(`${reg.relacoes.length} vínculo(s)`);
    if (reg.marcas.length) partes.push(`${reg.marcas.length} marca(s)`);
    if (reg.posses.length) partes.push(`${reg.posses.length} posse(s)`);
    if (reg.fios.length) partes.push(`${reg.fios.length} fio(s) em aberto`);
    return partes.join(' · ');
  }
};

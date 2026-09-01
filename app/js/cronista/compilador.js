const Compilador = {

  compilar(md) {
    const linhas = String(md || '').replace(/\r\n/g, '\n').split('\n');
    const campanha = { meta: {}, capitulos: [], erros: [] };
    let cap = null, cena = null, sub = null, buffer = [];

    const fecharBuffer = () => {
      if (!cena || !sub) { buffer = []; return; }
      const texto = buffer.join('\n').trim();
      if (sub === 'narracao') cena.narracao = texto;
      buffer = [];
    };

    let emFrontmatter = false, frontLido = false;

    for (let i = 0; i < linhas.length; i++) {
      const bruta = linhas[i];
      const l = bruta.trim();

      if (!frontLido && l === '---') { emFrontmatter = !emFrontmatter; if (!emFrontmatter) frontLido = true; continue; }
      if (emFrontmatter) {
        const m = l.match(/^([a-z_]+):\s*(.*)$/i);
        if (m) campanha.meta[m[1]] = m[2];
        continue;
      }

      if (l.startsWith('# ')) {
        fecharBuffer(); sub = null; cena = null;
        cap = { id: this.slug(l.slice(2)), titulo: l.slice(2).trim(), resumo: '', cenas: [] };
        campanha.capitulos.push(cap);
        continue;
      }

      if (l.startsWith('## ')) {
        fecharBuffer(); sub = null;
        const nome = l.slice(3).replace(/^Cena\s*::\s*/i, '').trim();
        if (!cap) { campanha.erros.push(`Cena "${nome}" fora de capítulo (linha ${i + 1}).`); continue; }
        cena = { id: this.slug(nome), titulo: nome, narracao: '', opcoes: [], gatilhos: [],
                 entidades: { pessoas: [], locais: [] }, saidas: [] };
        cap.cenas.push(cena);
        continue;
      }

      if (l.startsWith('### ')) {
        fecharBuffer();
        sub = this.slug(l.slice(4)).replace(/[^a-z]/g, '');
        continue;
      }

      if (sub === 'narracao') { buffer.push(bruta); continue; }

      if (!cena && cap && /^resumo:/i.test(l)) { cap.resumo = l.replace(/^resumo:\s*/i, ''); continue; }

      if (cena && !sub) {
        const m = l.match(/^(local|hora|tipo|campodecaca|zona):\s*(.*)$/i);
        if (m) { cena[this.slug(m[1]).replace(/[^a-z]/g, '')] = m[2].trim(); continue; }
      }

      if (sub === 'opcoes' && l) { this.lerOpcao(cena, l, campanha, i); continue; }
      if (sub === 'gatilhos' && l.startsWith('-')) { this.lerGatilho(cena, l.slice(1).trim(), campanha, i); continue; }
      if (sub === 'entidades' && l) {
        const m = l.match(/^(pessoas|locais):\s*(.*)$/i);
        if (m) cena.entidades[m[1].toLowerCase()] = m[2].split(',').map(x => x.trim()).filter(Boolean);
        continue;
      }
      if (sub === 'saidas' && l.startsWith('-')) {
        cena.saidas.push(l.replace(/^-\s*/, '').replace(/^cena:\s*/i, '').trim());
        continue;
      }
    }
    fecharBuffer();

    campanha.indice = {};
    campanha.capitulos.forEach((c, ci) => c.cenas.forEach((s, si) => {
      campanha.indice[s.id] = { capitulo: ci, cena: si };
    }));
    this.validar(campanha);
    return campanha;
  },

  lerOpcao(cena, linha, campanha, i) {
    if (!cena) return;
    if (/^-\s*intencao:/i.test(linha)) {
      cena.opcoes.push({ intencao: linha.replace(/^-\s*intencao:\s*/i, '').trim(),
                         rotas: [], dificuldade: 'base', sucesso: null, falha: null });
      return;
    }
    const op = cena.opcoes[cena.opcoes.length - 1];
    if (!op) return;

    if (/^rotas:/i.test(linha)) { op._lendoRotas = true; return; }

    if (op._lendoRotas && /^-\s*/.test(linha) && linha.includes('+')) {
      const corpo = linha.replace(/^-\s*/, '');
      const [par, enq] = corpo.split('::').map(x => x.trim());
      const [a, p] = par.split('+').map(x => this.slug(x).replace(/[^a-z_]/g, ''));
      op.rotas.push({ atributo: a, pericia: p, enquadramento: (enq || '').replace(/^["']|["']$/g, '') });
      return;
    }

    const m = linha.match(/^(dificuldade|sucesso|falha):\s*(.*)$/i);
    if (m) {
      op._lendoRotas = false;
      const chave = m[1].toLowerCase(), valor = m[2].trim();
      if (chave === 'dificuldade') op.dificuldade = /^\d+$/.test(valor) ? parseInt(valor, 10) : valor;
      else op[chave] = this.lerDesfecho(valor);
    }
  },

  lerDesfecho(txt) {
    const d = { destino: null, custos: [] };
    const seta = txt.match(/->\s*([a-z0-9_-]+)/i);
    if (seta) d.destino = this.slug(seta[1]);
    const custos = txt.match(/custo:([a-z_]+)([+-]\d+)/gi) || [];
    custos.forEach(c => {
      const m = c.match(/custo:([a-z_]+)([+-]\d+)/i);
      if (m) d.custos.push({ campo: m[1], delta: parseInt(m[2], 10) });
    });
    return d;
  },

  lerGatilho(cena, txt, campanha, i) {
    if (!cena) return;
    const [cond, efeito] = txt.split('=>').map(x => (x || '').trim());
    if (!efeito) { campanha.erros.push(`Gatilho sem efeito na linha ${i + 1}: "${txt}"`); return; }

    let condicao = null;
    const menciona = cond.match(/^menciona\(([^)]*)\)/i);
    const turnos = cond.match(/^turnos\s*([><=]+)\s*(\d+)/i);
    if (menciona) condicao = { tipo: 'menciona', termos: menciona[1].split(',').map(x => x.trim()).filter(Boolean) };
    else if (turnos) condicao = { tipo: 'turnos', operador: turnos[1], valor: parseInt(turnos[2], 10) };
    else if (/^sempre$/i.test(cond)) condicao = { tipo: 'sempre' };
    else { campanha.erros.push(`Condição não reconhecida na linha ${i + 1}: "${cond}"`); return; }

    let acao = null;
    const revela = efeito.match(/revela\s+fato:([a-z0-9_]+)/i);
    const briga = efeito.match(/^combate:\s*(.*)$/i);
    const vai = efeito.match(/->\s*([a-z0-9_-]+)/i);
    if (revela) acao = { tipo: 'revela', fato: revela[1] };
    else if (briga) acao = this.lerCombate(briga[1], campanha, i);
    else if (vai) acao = { tipo: 'ir', destino: this.slug(vai[1]) };
    else { campanha.erros.push(`Efeito não reconhecido na linha ${i + 1}: "${efeito}"`); return; }
    if (!acao) return;

    cena.gatilhos.push({ condicao, acao, usado: false });
  },

  MODELOS_DE_OPONENTE: ['fraco', 'comum', 'talentoso', 'fatal'],

  lerCombate(txt, campanha, i) {
    const oponentes = [];
    for (const parte of String(txt).split(',').map(x => x.trim()).filter(Boolean)) {
      const m = parte.match(/^(?:(\d+)\s*x\s*)?([a-zç]+)(?:\s*\(([^)]*)\))?$/i);
      if (!m) { campanha.erros.push(`Oponente ilegível no gatilho da linha ${i + 1}: "${parte}"`); return null; }
      const modelo = this.slug(m[2]);
      if (!this.MODELOS_DE_OPONENTE.includes(modelo)) {
        campanha.erros.push(`Modelo de oponente desconhecido na linha ${i + 1}: "${m[2]}". ` +
          `Use ${this.MODELOS_DE_OPONENTE.join(', ')}.`);
        return null;
      }
      const quantos = Math.min(8, Math.max(1, parseInt(m[1] || '1', 10)));
      for (let k = 0; k < quantos; k++) {
        oponentes.push({ modelo, nome: (m[3] || '').trim() || null });
      }
    }
    if (!oponentes.length) { campanha.erros.push(`Gatilho de combate sem oponente na linha ${i + 1}.`); return null; }
    return { tipo: 'combate', oponentes };
  },

  validar(c) {
    const ids = new Set(Object.keys(c.indice));
    const conferir = (destino, onde) => {
      if (destino && !ids.has(destino)) c.erros.push(`Destino inexistente "${destino}" em ${onde}.`);
    };
    c.capitulos.forEach(cap => cap.cenas.forEach(cena => {
      cena.opcoes.forEach(o => {
        delete o._lendoRotas;
        conferir(o.sucesso && o.sucesso.destino, `${cena.id} / ${o.intencao} / sucesso`);
        conferir(o.falha && o.falha.destino, `${cena.id} / ${o.intencao} / falha`);
      });
      cena.gatilhos.forEach(g => {
        if (g.acao.tipo === 'ir') conferir(g.acao.destino, `${cena.id} / gatilho`);
      });
      cena.saidas.forEach(s => conferir(s, `${cena.id} / saídas`));
    }));
    if (!c.capitulos.length) c.erros.push('Nenhum capítulo encontrado.');
    return c.erros;
  },

  slug(t) {
    return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }
};

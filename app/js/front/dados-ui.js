const DadosUI = {

  LADOS: 7,
  _geo: null,
  _cache: new Map(),

  geometria() {
    if (this._geo) return this._geo;
    const n = this.LADOS, cx = 50, cy = 50, rot = -Math.PI / 2;
    const anel = (r) => Array.from({ length: n }, (_, i) => {
      const a = rot + i * 2 * Math.PI / n;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    });
    const fora = anel(47), dentro = anel(27);
    const poli = (pts) => pts.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');

    const facetas = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const ang = rot + (i + 0.5) * 2 * Math.PI / n;
      const luz = Math.cos(ang - (-2.3));
      facetas.push({ pts: poli([fora[i], fora[j], dentro[j], dentro[i]]), luz });
    }
    this._geo = { fora: poli(fora), dentro: poli(dentro), facetas };
    return this._geo;
  },

  PALETA: {
    normal: { base: '#1b1a22', claro: '#413e4c', escuro: '#050506', face: '#131218',
              simbolo: '#dcdfe4', brilho: 'rgba(255,255,255,.2)' },
    fome:   { base: '#ab1d2a', claro: '#e2404d', escuro: '#4d0a11', face: '#b81f2c',
              simbolo: '#fdf4f0', brilho: 'rgba(255,255,255,.26)' }
  },

  simbolo(valor, tipo, cor) {
    if (valor === 10) {
      return `<g fill="${cor}">
        <path d="M50 15 L55.5 30 L55.5 45 L44.5 45 L44.5 30 Z" />
        <rect x="32" y="45" width="36" height="6.4" rx="1.4" />
      </g>
      <circle cx="50" cy="67" r="12.4" fill="none" stroke="${cor}" stroke-width="6.2" />`;
    }
    if (valor === 1 && tipo === 'fome') {
      const f = this.PALETA.fome.base;
      return `<g fill="${cor}">
        <path d="M50 27c-11 0-18 7.4-18 17 0 5.4 2 8.4 4.4 10.6v7.2c0 2 1.6 3.4 3.6 3.4h20c2 0 3.6-1.4 3.6-3.4v-7.2C66 51.4 68 48.4 68 43c0-9.6-7-16-18-16z"/>
      </g>
      <g fill="${f}">
        <ellipse cx="42.6" cy="43.4" rx="4.6" ry="5.2"/>
        <ellipse cx="57.4" cy="43.4" rx="4.6" ry="5.2"/>
        <path d="M50 49.5 L53 56 L47 56 Z"/>
        <rect x="44.6" y="59" width="2.4" height="6"/>
        <rect x="53" y="59" width="2.4" height="6"/>
      </g>`;
    }
    return `<text x="50" y="51" text-anchor="middle" dominant-baseline="central"
      font-family="Cinzel, Georgia, serif" font-weight="700" font-size="30"
      fill="${cor}">${valor}</text>`;
  },

  dado(valor, tipo = 'normal') {
    const chave = `${tipo}:${valor}`;
    if (this._cache.has(chave)) return this._cache.get(chave);

    const g = this.geometria();
    const p = this.PALETA[tipo] || this.PALETA.normal;
    const mist = (a, b, t) => {
      const h = (c) => [1, 3, 5].map(i => parseInt(c.substr(i, 2), 16));
      const A = h(a), B = h(b);
      return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
    };

    const facetas = g.facetas.map(f => {
      const t = (f.luz + 1) / 2;
      const cor = t > 0.5 ? mist(p.base, p.claro, (t - 0.5) * 2)
                          : mist(p.escuro, p.base, t * 2);
      return `<polygon points="${f.pts}" fill="${cor}" />`;
    }).join('');

    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="dado-svg">
      <polygon points="${g.fora}" fill="${p.escuro}" />
      ${facetas}
      <polygon points="${g.dentro}" fill="${p.face}" />
      <polygon points="${g.dentro}" fill="none" stroke="${p.brilho}" stroke-width="1" />
      ${this.simbolo(valor, tipo, p.simbolo)}
    </svg>`;

    this._cache.set(chave, svg);
    return svg;
  },

  classeDado(valor, tipo) {
    if (valor === 10) return 'critico';
    if (valor === 1 && tipo === 'fome') return 'bestial';
    if (valor >= 6) return 'acerto';
    return 'erro';
  },

  animaveis(r, animar) {
    if (!animar) return null;
    if (!r.retestado) return null;
    return new Set(r.indicesRetestados || []);
  },

  bandeja(r, { animar = false } = {}) {
    const alvos = this.animaveis(r, animar);
    const item = (valor, tipo, i) => {
      const gira = animar && (!alvos || alvos.has(i));
      return `<span class="dado ${this.classeDado(valor, tipo)} ${gira ? 'rolando' : ''}"
        data-dado="${i}" data-tipo="${tipo}" data-final="${valor}"
        title="${tipo === 'fome' ? 'Dado de Fome' : 'Dado normal'}: ${valor}">${
        this.dado(gira ? 1 + (i % 10) : valor, tipo)}</span>`;
    };
    let i = 0;
    const normais = r.normais.map(v => item(v, 'normal', i++)).join('');
    const fome = r.dadosFome.map(v => item(v, 'fome', i++)).join('');
    return `<div class="bandeja">${normais}${fome}</div>`;
  },

  cartao(r, { animar = false, id = '' } = {}) {
    const t = Dados.ROTULOS[r.tipo];
    const piscina = r.rotulo ? `<span class="piscina-rot">${r.rotulo}</span>` : '';
    const alvo = r.dificuldade > 0
      ? `<span class="alvo">dificuldade ${r.dificuldade}</span>` : '';

    return `<div class="rolagem-cartao tipo-${r.tipo}" data-rolagem="${id}">
      <div class="rol-topo">
        ${piscina}
        <span class="rol-piscina">${r.piscina} dado${r.piscina === 1 ? '' : 's'}${
          r.fome ? ` · ${r.fome} de Fome` : ''}</span>
        ${alvo}
      </div>
      ${this.bandeja(r, { animar })}
      <div class="rol-saida" ${animar ? 'hidden' : ''}>
        <div class="rol-contagem">
          <span class="n">${r.sucessos}</span>
          <span class="rot">sucesso${r.sucessos === 1 ? '' : 's'}</span>
        </div>
        <div class="rol-veredito">
          <span class="titulo">${t.nome}</span>
          ${t.nota ? `<span class="nota">${t.nota}</span>` : ''}
          ${r.retestado ? `<span class="nota">Reteste de Força de Vontade — ${
            r.indicesRetestados.length} dado${r.indicesRetestados.length === 1 ? '' : 's'} rerrolado${
            r.indicesRetestados.length === 1 ? '' : 's'}.</span>` : ''}
        </div>
      </div>
      ${this.retesteHTML(r, id, animar)}
    </div>`;
  },

  retesteHTML(r, id, animar) {
    if (!Dados.podeRetestar(r)) return '';
    const n = Dados.dadosRetestaveis(r).length;
    return `<div class="reteste" ${animar ? 'hidden' : ''}>
      <button class="reteste-btn" data-mesa="reteste" data-id="${id}">
        Gastar Força de Vontade
        <span class="det">rerrolar ${n} dado${n === 1 ? '' : 's'} que falhou${n === 1 ? '' : 'ram'}</span>
      </button>
      <span class="reteste-nota">Dados de Fome não podem ser rerrolados.</span>
    </div>`;
  },

  async animar(raiz, r) {
    const cartao = raiz.classList && raiz.classList.contains('rolagem-cartao')
      ? raiz : raiz.querySelector('.rolagem-cartao');
    if (!cartao) return;
    const todos = Array.from(cartao.querySelectorAll('[data-dado]'));
    const dados = todos.filter(el => el.classList.contains('rolando'));
    const saida = cartao.querySelector('.rol-saida');
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const revelar = () => {
      todos.forEach(el => {
        el.dataset.pronto = '1';
        el.classList.remove('rolando');
        el.innerHTML = this.dado(+el.dataset.final, el.dataset.tipo);
      });
      if (saida) saida.hidden = false;
        const rt = cartao.querySelector('.reteste'); if (rt) rt.hidden = false;
    };

    if (reduzido || !dados.length) { revelar(); return; }

    const espera = (ms) => new Promise(res => setTimeout(res, ms));
    const iv = setInterval(() => {
      dados.forEach(el => {
        if (el.dataset.pronto) return;
        el.innerHTML = this.dado(Dados.d10(), el.dataset.tipo);
      });
    }, 65);

    await espera(400);
    for (const el of dados) {
      el.dataset.pronto = '1';
      el.classList.remove('rolando');
      el.classList.add('assentou');
      el.innerHTML = this.dado(+el.dataset.final, el.dataset.tipo);
      await espera(70);
    }
    clearInterval(iv);
    await espera(120);
    if (saida) { saida.hidden = false; saida.classList.add('surgiu'); }
    const rt = cartao.querySelector('.reteste'); if (rt) rt.hidden = false;
  }
};

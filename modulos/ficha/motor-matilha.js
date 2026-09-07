/* ============================================================
   VITÆ — Matilha como estado coletivo
   Vinculum, Arena e Pontos de Matilha pertencem ao grupo, não a
   um personagem. Este módulo tira esse estado de dentro da ficha
   e o guarda num registro próprio, compartilhado por todas as
   fichas da mesma matilha.

   A ficha passa a guardar só o vínculo: seitaDados.sabbat.matilhaId.
   Ficha antiga, com a matilha embutida, migra na primeira leitura.
   ============================================================ */

const Matilha = {
  CHAVE: 'vitae:matilhas',

  todas() {
    try { return JSON.parse(localStorage.getItem(this.CHAVE) || '{}'); }
    catch (e) { return {}; }
  },

  /* Devolve false quando não coube, em vez de engolir (F5). Quem
     chama precisa poder avisar o jogador — matilha perdida em
     silêncio é personagem sem grupo na noite seguinte. */
  guardar(mapa) {
    try { localStorage.setItem(this.CHAVE, JSON.stringify(mapa)); return true; }
    catch (e) { return false; }
  },

  idPara(nome) {
    return 'mat_' + String(nome || 'sem_nome').normalize('NFD')
      .replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 32);
  },

  vazia(nome) {
    return {
      id: this.idPara(nome), nome: nome || '', tipo: '',
      sacerdote: '', ductus: '',
      vinculum: 1,
      arena: { perambulacao: 0, alcance: 0, prestigio: 0 },
      pontosMatilha: 1,
      membros: [],
      ritaeUsadoNaSessao: {},
      criadaEm: Date.now()
    };
  },

  porId(id) {
    if (!id) return null;
    return this.todas()[id] || null;
  },

  /* Devolve o registro quando gravou, e null quando não coube — mesma
     forma de guardarFicha, e pela mesma razão (F5). */
  salvar(registro) {
    const mapa = this.todas();
    mapa[registro.id] = registro;
    return this.guardar(mapa) ? registro : null;
  },

  criar(nome) {
    const r = this.vazia(nome);
    return this.salvar(r);
  },

  de(ficha) {
    if (!ficha || perfilDe(ficha).bussola.tipo !== 'caminho') return null;
    const d = Seitas.dados(ficha, 'sabbat');

    if (d.matilhaId) {
      const existente = this.porId(d.matilhaId);
      if (existente) return existente;
    }

    const antiga = d.matilha || {};
    if (!antiga.nome) return null;

    const id = this.idPara(antiga.nome);
    let r = this.porId(id);
    if (!r) {
      r = this.vazia(antiga.nome);
      r.tipo = antiga.tipo || '';
      r.sacerdote = antiga.sacerdote || '';
      r.ductus = antiga.ductus || '';
      r.vinculum = d.vinculum != null ? d.vinculum : 1;
      r.arena = Object.assign(r.arena, d.arena || {});
      r.pontosMatilha = d.pontosMatilha != null ? d.pontosMatilha : 1;
      this.salvar(r);
    }
    d.matilhaId = r.id;
    this.entrar(ficha, r.id);
    return this.porId(r.id);
  },

  entrar(ficha, id) {
    const r = this.porId(id);
    if (!r) return null;
    const d = Seitas.dados(ficha, 'sabbat');
    d.matilhaId = id;
    const chave = ficha.nome || 'personagem';
    if (!r.membros.some(m => m.tipo === 'jogador' && m.nome === chave)) {
      r.membros.push({ nome: chave, papel: d.cargo || '', tipo: 'jogador' });
      this.salvar(r);
    }
    return r;
  },

  adicionarNPC(id, nome, papel) {
    const r = this.porId(id);
    if (!r) return null;
    r.membros.push({ nome, papel: papel || '', tipo: 'npc' });
    return this.salvar(r);
  },

  removerMembro(id, indice) {
    const r = this.porId(id);
    if (!r) return null;
    r.membros.splice(indice, 1);
    return this.salvar(r);
  },

  definir(id, caminho, valor) {
    const r = this.porId(id);
    if (!r) return null;
    const partes = caminho.split('.');
    let alvo = r;
    for (let i = 0; i < partes.length - 1; i++) {
      if (alvo[partes[i]] == null) alvo[partes[i]] = {};
      alvo = alvo[partes[i]];
    }
    alvo[partes[partes.length - 1]] = valor;
    if (caminho === 'nome') r.id = r.id;
    return this.salvar(r);
  },

  companheiros(ficha) {
    const r = this.de(ficha);
    if (!r) return 0;
    return Math.max(0, r.membros.length - 1);
  },

  arenaGasta(registro) {
    const a = (registro && registro.arena) || {};
    return (a.perambulacao || 0) + (a.alcance || 0) + (a.prestigio || 0);
  },

  celebrar(registro, ritaeId) {
    registro.ritaeUsadoNaSessao = registro.ritaeUsadoNaSessao || {};
    if (registro.ritaeUsadoNaSessao[ritaeId]) return false;
    registro.ritaeUsadoNaSessao[ritaeId] = true;
    this.salvar(registro);
    return true;
  },

  novaSessao(registro) {
    if (!registro) return;
    registro.ritaeUsadoNaSessao = {};
    this.salvar(registro);
  },

  resumo(ficha) {
    const r = this.de(ficha);
    if (!r) return '';
    const t = TIPOS_MATILHA.find(x => x.id === r.tipo);
    return [r.nome, t ? t.nome : '', `Vinculum ${r.vinculum}`,
            `${r.membros.length} membro${r.membros.length === 1 ? '' : 's'}`]
      .filter(Boolean).join(' · ');
  }
};

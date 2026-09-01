/* ============================================================
   VITÆ — Persistência das sessões de mesa
   Uma responsabilidade só: guardar, listar, carregar e apagar
   sessão no localStorage. O fluxo do turno não sabe como isso
   funciona; só chama salvarMesa().

   Reescrito na §47 por dois defeitos que andavam juntos (item N1
   e N2 da §45.4):

   1. Havia UM mapa com TODAS as sessões numa chave só, e cada
      gravação reserializava o mapa inteiro. Medido: 7 ms com uma
      sessão, 102 ms com dezesseis (5,8 MB). E roda a cada mutação
      de estado — cada ataque, cada aba, cada turno. Era O(total de
      sessões jogadas), então piorava quanto mais você jogasse.

   2. O `catch (e) {}` transformava estourar a cota do navegador
      numa perda de dados silenciosa. O jogador continuava jogando
      uma sessão que já não estava sendo salva.

   Agora: **uma chave por sessão** — `vitae:sessao:<id>` — mais um
   **índice leve** com o resumo de cada uma. Gravar toca duas
   chaves pequenas, e o custo deixa de depender de quantas sessões
   existem. Listar lê só o índice, sem desserializar 600 turnos de
   sessão nenhuma.

   E quando não couber, `salvarMesa` devolve false e AVISA.
   ============================================================ */

const CHAVE_SESSOES = 'vitae:sessoes';          // mapa antigo; só migração
const CHAVE_INDICE  = 'vitae:sessoes-indice';
const CHAVE_ATUAL   = 'vitae:sessao-atual';
const PREFIXO_SESSAO = 'vitae:sessao:';

const chaveDaSessao = (id) => PREFIXO_SESSAO + id;

/* Item N7 da §45.4. Era `'s' + Date.now().toString(36)`, e duas
   sessões abertas dentro do mesmo milissegundo recebiam o MESMO id —
   a segunda sobrescrevia a primeira, calada. Descoberto pelo teste,
   que abre duas sessões seguidas e viu as duas colidirem.

   O sufixo aleatório resolve; a conferência contra o que já existe
   resolve o resto. */
let _seqSessao = 0;

function novoIdDeSessao() {
  for (let tentativa = 0; tentativa < 50; tentativa++) {
    const id = 's' + Date.now().toString(36) +
               (_seqSessao++).toString(36) +
               Math.floor(Math.random() * 1296).toString(36);
    if (localStorage.getItem(chaveDaSessao(id)) === null) return id;
  }
  return 's' + Date.now().toString(36) + '_' + (_seqSessao++);
}

function lerJSON(chave, padrao) {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : padrao;
  } catch (e) { return padrao; }
}

/* ------------------------------------------------------------
   O ÍNDICE
   Resumo de cada sessão, para a tela de sessões não precisar
   abrir nenhuma. É o que torna listar barato.
   ------------------------------------------------------------ */
function lerIndice() {
  migrarMapaAntigo();
  const i = lerJSON(CHAVE_INDICE, {});
  return (i && typeof i === 'object') ? i : {};
}

function resumoDaSessao(s) {
  const camp = s.campanha;
  const cena = camp && s.diretor ? Diretor.cenaPorId(camp, s.diretor.cena) : null;
  const cap = camp && s.diretor ? camp.capitulos[s.diretor.capitulo] : null;
  return {
    id: s.id,
    personagem: (s.ficha && s.ficha.nome) || 'Sem nome',
    claId: (s.ficha && s.ficha.cla) || '',
    campanha: camp ? (camp.meta.campanha || 'Campanha') : 'Noite livre',
    capitulo: cap ? cap.titulo : '',
    cena: cena ? cena.titulo : (s.cena && s.cena.local) || '',
    turnos: s.mensagens ? s.mensagens.filter(m => m.autor === 'jogador').length : 0,
    atualizadoEm: s.atualizadoEm || 0,
    fome: (s.ficha && s.ficha.fome) || 0,
    contador: s.contador || { local: 0, llm: 0 }
  };
}

/* ------------------------------------------------------------
   MIGRAÇÃO
   Duas gerações para trás: a chave `vitae:mesa` de sessão única,
   e o mapa `vitae:sessoes` com todas. Roda uma vez e some.
   ------------------------------------------------------------ */
function migrarMapaAntigo() {
  let mapa = null;

  const antigaUnica = localStorage.getItem('vitae:mesa');
  if (antigaUnica) {
    try {
      const m = JSON.parse(antigaUnica);
      if (m && m.ficha) {
        m.id = m.id || novoIdDeSessao();
        m.atualizadoEm = m.atualizadoEm || Date.now();
        mapa = { [m.id]: m };
      }
    } catch (e) {
      /* Chave de duas gerações atrás, ilegível. Não há o que recuperar,
         e insistir nela a cada leitura seria pior — mas some do log
         nenhum: quem for investigar sessão perdida vai querer isto. */
      console.warn('migração: a chave "vitae:mesa" está ilegível e será descartada:', e.message);
    }
    localStorage.removeItem('vitae:mesa');
  }

  const antigoMapa = localStorage.getItem(CHAVE_SESSOES);
  if (antigoMapa) {
    try {
      const m = JSON.parse(antigoMapa);
      if (m && typeof m === 'object') mapa = Object.assign(mapa || {}, m);
    } catch (e) {
      /* O mapa antigo NÃO é apagado aqui — só na conversão bem-sucedida,
         lá embaixo. Ilegível, ele fica onde está, e o aviso é o que
         permite alguém tentar recuperá-lo à mão. */
      console.warn('migração: o mapa "vitae:sessoes" está ilegível e foi mantido:', e.message);
    }
  }
  if (!mapa) return;

  const indice = lerJSON(CHAVE_INDICE, {});
  let migradas = 0;
  for (const [id, s] of Object.entries(mapa)) {
    if (!s || !s.ficha) continue;
    s.id = s.id || id;
    try {
      localStorage.setItem(chaveDaSessao(s.id), JSON.stringify(s));
      indice[s.id] = resumoDaSessao(s);
      migradas++;
    } catch (e) {
      /* Não coube. Para a migração aqui e mantém o mapa antigo
         intacto — perder sessão calado é exatamente o defeito que
         esta reescrita existe para fechar. */
      return;
    }
  }
  if (!migradas) return;
  try {
    localStorage.setItem(CHAVE_INDICE, JSON.stringify(indice));
    localStorage.removeItem(CHAVE_SESSOES);
  } catch (e) {
    /* As sessões já foram gravadas uma a uma; o que falhou foi o
       índice. O mapa antigo continua no lugar de propósito: sem índice,
       ele é a única forma de reencontrá-las. */
    console.warn('migração: o índice não coube; o mapa antigo foi mantido:', e.message);
  }
}

/* ------------------------------------------------------------
   GRAVAR
   Duas chaves pequenas, e o custo não depende de quantas sessões
   existem. Devolve false quando não coube, e avisa.
   ------------------------------------------------------------ */
let avisouQueNaoSalvou = false;

function salvarMesa() {
  if (!M.ficha) return false;
  if (!M.id) M.id = novoIdDeSessao();
  M.atualizadoEm = Date.now();

  const { docaAberta, ...resto } = M;
  try {
    localStorage.setItem(chaveDaSessao(M.id), JSON.stringify(resto));
    const indice = lerIndice();
    indice[M.id] = resumoDaSessao(resto);
    localStorage.setItem(CHAVE_INDICE, JSON.stringify(indice));
    localStorage.setItem(CHAVE_ATUAL, M.id);
    avisouQueNaoSalvou = false;
    return true;
  } catch (e) {
    /* Item N2: isto era um `catch (e) {}`. O jogador seguia jogando
       uma sessão que já não estava sendo gravada, e só descobria ao
       fechar o navegador. Avisa uma vez por episódio — salvarMesa
       roda a cada mutação, e um toast por clique seria pior que o
       silêncio. */
    if (!avisouQueNaoSalvou && typeof toast === 'function') {
      avisouQueNaoSalvou = true;
      toast('A sessão NÃO foi salva: o navegador está sem espaço. Apague sessões antigas.');
    }
    console.warn('salvarMesa falhou:', e && e.name, e && e.message);
    return false;
  }
}

function carregarSessao(id) {
  migrarMapaAntigo();
  const s = lerJSON(chaveDaSessao(id), null);
  if (!s || !s.ficha) return false;
  M = Object.assign(MESA_VAZIA(), s);
  normalizarMesa();
  /* Falhar aqui não perde sessão: perde só a memória de qual estava
     aberta, e o jogador reabre pela lista. Vale aviso, não alarme. */
  try { localStorage.setItem(CHAVE_ATUAL, id); }
  catch (e) { console.warn('não deu para marcar a sessão atual:', e.message); }
  return true;
}

function apagarSessao(id) {
  const indice = lerIndice();
  const existia = id in indice || localStorage.getItem(chaveDaSessao(id)) !== null;
  delete indice[id];
  if (M && M.id === id) M = MESA_VAZIA();
  try {
    localStorage.removeItem(chaveDaSessao(id));
    localStorage.setItem(CHAVE_INDICE, JSON.stringify(indice));
    if (localStorage.getItem(CHAVE_ATUAL) === id) localStorage.removeItem(CHAVE_ATUAL);
    return existia;
  } catch (e) {
    console.warn('apagarSessao falhou:', e && e.message);
    return false;
  }
}

/* Lê só o índice. Antes, desserializava todas as sessões inteiras
   para montar a lista — com dezesseis sessões de 600 turnos, isso
   é 5,8 MB de JSON.parse para desenhar uma tela de cartões. */
function listarSessoes() {
  return Object.values(lerIndice())
    .filter(r => r && r.id)
    .map(r => Object.assign({}, r, {
      cla: claDe(r.claId) ? claDe(r.claId).nome : '',
      clas: claDe(r.claId)
    }))
    .sort((a, b) => b.atualizadoEm - a.atualizadoEm);
}

/* A sessão inteira, para quem precisa dela e não só do resumo. */
function sessaoPorId(id) {
  migrarMapaAntigo();
  return lerJSON(chaveDaSessao(id), null);
}

function quando(ts) {
  if (!ts) return '';
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}

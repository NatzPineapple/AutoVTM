/* ============================================================
   VITÆ — Biblioteca de fichas
   Uma responsabilidade só: guardar, listar, abrir e apagar ficha
   no localStorage. O criador não sabe como isto funciona; só
   chama guardarFicha().

   Espelha o sessoes.js de propósito: mesma forma, mesmo cuidado
   com o objeto que está em memória na hora de apagar.
   ============================================================ */

const CHAVE_FICHAS = 'vitae:fichas';

function lerFichas() {
  try { return JSON.parse(localStorage.getItem(CHAVE_FICHAS) || '{}'); }
  catch (e) { return {}; }
}

function gravarFichas(mapa) {
  try { localStorage.setItem(CHAVE_FICHAS, JSON.stringify(mapa)); return true; }
  catch (e) { return false; }
}

function idDaFicha(f) {
  const nome = String((f && f.nome) || 'sem_nome').normalize('NFD')
    .replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `${nome || 'sem_nome'}__${(f && f.cla) || 'sem_cla'}`;
}

/* Devolve o id gravado, ou null se não coube. Quem chama decide o que
   fazer com o null — e o criador, que é quem tem um `S`, marca o
   `fichaId` nele. Persistência não escreve na ficha em edição (F4). */
function guardarFicha(f) {
  if (!f || !f.nome) return null;
  const mapa = lerFichas();
  const id = f.fichaId || idDaFicha(f);
  const copia = JSON.parse(JSON.stringify(f));
  copia.fichaId = id;
  copia.guardadaEm = Date.now();
  copia.criadaEm = (mapa[id] && mapa[id].criadaEm) || Date.now();
  mapa[id] = copia;
  if (!gravarFichas(mapa)) return null;
  f.fichaId = id;
  return id;
}

/* Devolve true se gravou. Não sabe que existe uma ficha aberta em
   algum criador: quem tem `S` que cuide do `S` (F4). */
function apagarFicha(id) {
  const mapa = lerFichas();
  if (!(id in mapa)) return false;
  delete mapa[id];
  return gravarFichas(mapa);
}

function fichaPorId(id) {
  const f = lerFichas()[id];
  return f ? JSON.parse(JSON.stringify(f)) : null;
}

function listarFichas() {
  return Object.values(lerFichas())
    .filter(f => f && f.nome)
    .sort((a, b) => (b.guardadaEm || 0) - (a.guardadaEm || 0));
}

function resumoDaFicha(f) {
  const c = claDe(f.cla);
  const d = derivados(f);
  const pend = pendenciasDaFicha(f);
  return {
    id: f.fichaId, nome: f.nome, clas: c,
    cla: c ? c.nome : 'sem clã',
    seita: (SEITAS.find(s => s.id === f.seita) || {}).nome || 'sem seita',
    conceito: f.conceito || '',
    geracao: f.geracao,
    vitalidade: d.vitalidade, vontade: d.vontade, humanidade: d.humanidade,
    completa: !pend.problemas.length,
    pendencias: pend.problemas.length,
    guardadaEm: f.guardadaEm || 0
  };
}

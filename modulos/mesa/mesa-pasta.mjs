/* ============================================================
   VITÆ — A pasta da sessão
   ------------------------------------------------------------
   Módulo 3, a metade em disco: "ao se criar uma sessão deve se
   criar uma pasta". Uma pasta por sessão, e dentro dela quatro
   arquivos com donos diferentes:

     meta.json       quem é a sessão: id, personagem, campanha,
                     quando abriu, quando gravou, se já fez checkin
     ficha.json      a CÓPIA LOCAL da ficha (o checkout). Durante a
                     partida é este o arquivo que manda — nunca o
                     que está no FichaServer
     mesa.json       o mundo: cena, locais, pessoas, NPCs, objetos,
                     combate, abas
     historico.jsonl uma linha por turno, acrescentada no fim

   POR QUE O HISTÓRICO É .jsonl E NÃO .json:  o autosave roda a
   cada poucos segundos numa sessão que cresce o tempo todo.
   Reserializar seiscentos turnos para acrescentar um é o mesmo
   defeito que a §47 corrigiu no navegador — custo O(sessão
   inteira) a cada gravação. Acrescentar uma linha é O(1).

   GRAVAÇÃO ATÔMICA: escreve num `.parcial` e renomeia. Queda de
   energia no meio de um `writeFile` deixa JSON truncado, e JSON
   truncado é sessão perdida. O rename é atômico no sistema de
   arquivos; o pior caso vira "perdeu o último autosave".
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJETO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const RAIZ_DAS_SESSOES = process.env.VITAE_SESSOES || path.join(PROJETO, 'sessoes');

/* Id de sessão vem de fora e vira nome de pasta. Sem esta peneira,
   `../../app/index.html` é um id válido. */
const ID_ACEITO = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

export const idValido = (id) => ID_ACEITO.test(String(id || ''));

export function pastaDa(id) {
  if (!idValido(id)) throw new Error(`Id de sessão inválido: ${JSON.stringify(id)}`);
  const alvo = path.join(RAIZ_DAS_SESSOES, id);
  /* Cinto e suspensório: mesmo com a peneira acima, confere que o
     caminho resolvido não saiu da raiz. */
  if (path.relative(RAIZ_DAS_SESSOES, alvo).includes('..')) {
    throw new Error(`Id de sessão fora da raiz: ${id}`);
  }
  return alvo;
}

export const ARQUIVOS = {
  meta: 'meta.json', ficha: 'ficha.json', mesa: 'mesa.json', historico: 'historico.jsonl'
};

function gravarAtomico(alvo, texto) {
  const parcial = `${alvo}.parcial`;
  fs.writeFileSync(parcial, texto, 'utf8');
  fs.renameSync(parcial, alvo);
}

export function criarPasta(id) {
  const p = pastaDa(id);
  fs.mkdirSync(p, { recursive: true });
  return p;
}

export function existe(id) {
  try { return fs.statSync(pastaDa(id)).isDirectory(); }
  catch (e) { return false; }
}

export function gravarParte(id, parte, valor) {
  const nome = ARQUIVOS[parte];
  if (!nome) throw new Error(`Parte desconhecida da sessão: ${parte}`);
  criarPasta(id);
  gravarAtomico(path.join(pastaDa(id), nome), JSON.stringify(valor, null, 2));
}

export function lerParte(id, parte, padrao = null) {
  const nome = ARQUIVOS[parte];
  if (!nome) throw new Error(`Parte desconhecida da sessão: ${parte}`);
  try { return JSON.parse(fs.readFileSync(path.join(pastaDa(id), nome), 'utf8')); }
  catch (e) {
    if (e.code !== 'ENOENT') console.warn(`[mesa] ${id}/${nome} ilegível: ${e.message}`);
    return padrao;
  }
}

/** Acrescenta turnos ao fim do histórico. Cada um em sua linha. */
export function anexarHistorico(id, entradas) {
  const lista = Array.isArray(entradas) ? entradas : [entradas];
  if (!lista.length) return 0;
  criarPasta(id);
  fs.appendFileSync(path.join(pastaDa(id), ARQUIVOS.historico),
    lista.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');
  return lista.length;
}

export function lerHistorico(id) {
  try {
    return fs.readFileSync(path.join(pastaDa(id), ARQUIVOS.historico), 'utf8')
      .split('\n').filter(Boolean)
      .map(linha => {
        try { return JSON.parse(linha); }
        /* Uma linha truncada — queda no meio do append — não pode
           derrubar a sessão inteira. Ela sai marcada, e quem lê vê. */
        catch (e) { return { autor: 'sistema', texto: '(linha ilegível no histórico)', ilegivel: true }; }
      });
  } catch (e) {
    if (e.code !== 'ENOENT') console.warn(`[mesa] histórico de ${id} ilegível: ${e.message}`);
    return [];
  }
}

/** Só os `meta.json`, para a lista de sessões. Não abre ficha nem histórico. */
export function listarPastas() {
  let nomes;
  try { nomes = fs.readdirSync(RAIZ_DAS_SESSOES); }
  catch (e) { return []; }
  const fora = [];
  for (const nome of nomes) {
    if (!idValido(nome)) continue;
    const m = lerParte(nome, 'meta', null);
    if (m) fora.push(m);
  }
  return fora.sort((a, b) => (b.atualizadoEm || 0) - (a.atualizadoEm || 0));
}

export function apagarPasta(id) {
  if (!existe(id)) return false;
  fs.rmSync(pastaDa(id), { recursive: true, force: true });
  return true;
}

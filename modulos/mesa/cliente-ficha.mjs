/* ============================================================
   VITÆ — O adaptador do FichaServer
   ------------------------------------------------------------
   Módulo 3 falando com o Módulo 2. O contrato é o do desenho:

     checkout  pedirFicha(fichaId)    →  a ficha completa
     checkin   devolverFicha(ficha)   →  persistida no banco

   O FichaServer AINDA NÃO EXISTE. Este arquivo não finge que
   existe, e também não trava a mesa até ele nascer:

     1. tenta o FichaServer na porta dele;
     2. se ele não responde e o Cliente mandou a ficha junto no
        pedido, usa essa — é onde a ficha mora hoje, no
        `localStorage` do navegador — e MARCA a origem;
     3. no checkin, quando o FichaServer não responde, devolve
        `ok: false` com o pacote pronto, para o Cliente gravar do
        lado dele. O que não acontece é a alteração sumir.

   `origem` viaja em tudo o que sai daqui de propósito: quem lê o
   diagnóstico da sessão precisa saber se aquela ficha veio do
   banco ou do bolso do navegador.
   ============================================================ */

import { enderecoDe } from '../../comum/portas.mjs';

const TEMPO_LIMITE = Number(process.env.VITAE_TEMPO_FICHA || 4000);

async function chamar(caminho, opcoes = {}) {
  const url = `${enderecoDe('ficha')}${caminho}`;
  try {
    const r = await fetch(url, Object.assign({ signal: AbortSignal.timeout(TEMPO_LIMITE) }, opcoes));
    const corpo = await r.json().catch(() => ({}));
    return { alcancou: true, ok: r.ok, status: r.status, corpo };
  } catch (e) {
    /* Recusa de conexão é o caso NORMAL hoje, e não merece ruído no
       console a cada abertura de mesa. O chamador é quem decide. */
    return { alcancou: false, ok: false, status: 0, motivo: e.message };
  }
}

export async function fichaServerNoAr() {
  const r = await chamar('/ficha/saude');
  return r.alcancou && r.ok;
}

/**
 * CHECKOUT. Devolve `{ ok, ficha, origem, motivo }`.
 * `deReserva` é a ficha que o Cliente mandou junto, usada só quando
 * o FichaServer não atende.
 */
export async function pedirFicha(fichaId, { deReserva = null } = {}) {
  if (fichaId) {
    const r = await chamar(`/ficha/${encodeURIComponent(fichaId)}`);
    if (r.alcancou && r.ok && r.corpo && r.corpo.ficha) {
      return { ok: true, ficha: r.corpo.ficha, origem: 'fichaserver' };
    }
    if (r.alcancou && r.status === 404 && !deReserva) {
      return { ok: false, origem: 'fichaserver', motivo: `Ficha ${fichaId} não existe no FichaServer.` };
    }
  }
  if (deReserva && deReserva.nome) {
    return { ok: true, ficha: deReserva, origem: 'cliente' };
  }
  return { ok: false, origem: 'nenhuma',
    motivo: 'O FichaServer não respondeu e o pedido não trouxe ficha nenhuma.' };
}

/**
 * CHECKIN. Devolve `{ ok, origem, motivo, pacote }`. Quando o
 * FichaServer não atende, `pacote` volta preenchido: a alteração
 * existe, só não foi persistida ali.
 */
export async function devolverFicha(ficha) {
  const pacote = { ficha, devolvidaEm: Date.now() };
  const r = await chamar('/ficha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pacote)
  });
  if (r.alcancou && r.ok) return { ok: true, origem: 'fichaserver', fichaId: (r.corpo || {}).fichaId || ficha.fichaId };
  return { ok: false, origem: 'cliente', pacote,
    motivo: r.alcancou
      ? `O FichaServer recusou o checkin (${r.status}).`
      : 'O FichaServer não respondeu; a ficha volta para o Cliente gravar.' };
}

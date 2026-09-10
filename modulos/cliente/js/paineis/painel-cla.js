/* ============================================================
   VITÆ — Painel II: O Clã
   Um dos nove painéis que `criador-paineis.js` reunia num arquivo
   só.

   `detalheCidade` NÃO é chamado por nenhum arquivo do projeto —
   confirmado por grep no repositório inteiro antes desta divisão.
   É código morto que já estava assim no arquivo original; mudou de
   posição, não de status. Fica registrado aqui em vez de apagado
   nesta divisão, que é sobre organização e não sobre remover
   funcionalidade.
   ============================================================ */

function detalheCidade(c) {
  if (!c) return '';
  return `
  <div class="cartao mt" style="border-color:var(--borda-forte);padding:1.8rem">
    <div class="cla-topo" style="margin-bottom:.6rem">
      <span class="cla-nome" style="font-size:1.5rem">${esc(c.nome)}</span>
      <span class="cla-epiteto">${esc(c.uf)}</span>
    </div>
    ${c.texto.map(t => `<p style="color:var(--osso-fosco)">${esc(t)}</p>`).join('')}
    <div class="grade g2 mt">
      <div class="caixa ouro"><h4>Quem governa</h4><p>${esc(c.poder)}<br>
        <span class="quiet">Príncipe: ${esc(c.principe)}</span>
        ${c.arcebispo && c.arcebispo !== '—' ? `<br><span class="quiet">Arcebispo: ${esc(c.arcebispo)}</span>` : ''}</p></div>
      <div class="caixa"><h4>Clãs presentes</h4><p>${
        c.clas.map(id => clan(id)?.nome).filter(Boolean).join(' · ')}</p></div>
    </div>
    <div class="caixa mt"><h4>Ganchos para a mesa</h4>
      <p>${c.ganchos.map(g => '— ' + esc(g)).join('<br>')}</p></div>
  </div>`;
}

function atritoClaSeitaHTML(cl) {
  const motivo = Seitas.atritoDeCla(cl.id, S.seita);
  if (!motivo) return '';
  const pf = perfil();
  return `<div class="caixa mt"><h4>Atrito com ${esc(pf.nome)}</h4>
    <p>${esc(motivo)} Isso é jogável e costuma ser a história inteira do personagem —
    o app não impede, só avisa.</p></div>`;
}

function painelCla() {
  const c = cidade();
  const sugeridos = c ? c.clas : [];

  const cards = CLAS.map(cl => {
    const sug = sugeridos.includes(cl.id);
    const discs = cl.disciplinasLivres ? 'Qualquer três Disciplinas'
      : cl.sangueFraco ? 'Alquimia de Sangue Fraco'
      : cl.disciplinas.map(d => DISCIPLINAS[d]?.nome).filter(Boolean).join(' · ');
    return `
    <div class="cartao cartao-cla clicavel ${S.cla === cl.id ? 'selec' : ''}" data-acao="cla" data-id="${cl.id}">
      <span class="fita" style="background:linear-gradient(90deg,${cl.cor},transparent)"></span>
      <div class="cla-topo">
        <span class="cla-simbolo">${cl.simbolo}</span>
        <div><div class="cla-nome">${esc(cl.nome)}</div>
             <div class="cla-epiteto">${esc(cl.epiteto)}</div></div>
      </div>
      <p class="cla-lema">“${esc(cl.lema)}”</p>
      <p class="quiet" style="margin:0">${esc(cl.resumo)}</p>
      <div class="cla-discs">${discs}
        ${sug ? `<br><span style="color:var(--ouro-claro)">✦ presente em ${esc(c.nome)}</span>` : ''}</div>
    </div>`;
  }).join('');

  const sel = clan();
  const det = !sel ? '' : `
  <div class="cartao mt" style="border-color:var(--borda-forte);padding:1.8rem">
    <span class="fita" style="background:linear-gradient(90deg,${sel.cor},transparent)"></span>
    <div class="cla-topo"><span class="cla-simbolo" style="font-size:2rem">${sel.simbolo}</span>
      <div><div class="cla-nome" style="font-size:1.6rem">${esc(sel.nome)}</div>
      <div class="cla-epiteto">${esc(sel.epiteto)} · ${esc(sel.seita)}</div></div></div>
    <p class="cla-lema" style="font-size:1.15rem">“${esc(sel.lema)}”</p>
    <div class="grade g2 mt">
      <div class="caixa"><h4>Maldição — ${esc(sel.maldicao.nome)}</h4><p>${esc(sel.maldicao.texto)}</p></div>
      <div class="caixa"><h4>Compulsão — ${esc(sel.compulsao.nome)}</h4><p>${esc(sel.compulsao.texto)}</p></div>
    </div>
    <div class="caixa ouro mt"><h4>Arquétipos brasileiros</h4>
      <p>${sel.arquetipos.map(a => esc(a)).join(' · ')}</p></div>
    ${atritoClaSeitaHTML(sel)}
  </div>`;

  return `
  <div class="painel-cabeca">
    <div class="num">Passo ${numeroDoPasso('cla')}</div>
    <h2>O Sangue que corre em você</h2>
    <p>Todo clã é uma herança e uma sentença. A maldição vem junto com os dons — não há como
    recusar uma sem perder o outro.${c ? ` Marcamos os clãs com presença conhecida em <em>${esc(c.nome)}</em>.` : ''}</p>
  </div>
  <div class="grade g3">${cards}</div>
  ${det}`;
}

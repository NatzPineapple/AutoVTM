/* ============================================================
   VITÆ — Painel III: Atributos
   Um dos nove painéis que `criador-paineis.js` reunia num arquivo
   só.
   ============================================================ */

function painelAtributos() {
  const lista = todosAtributos();
  const c = contagem(S.atributos, lista);
  const cotas = Object.entries(DIST_ATRIBUTOS).sort((a,b) => b[0]-a[0]).map(([v, q]) => {
    const usado = c[v] || 0;
    const cls = usado === q ? 'ok' : usado > q ? 'excedeu' : '';
    return `<span class="cota ${cls}"><b>${usado}/${q}</b> atributo${q>1?'s':''} em ${v}</span>`;
  }).join('');

  const grupos = Object.entries(ATRIBUTOS).map(([k, g]) => `
    <div class="cartao">
      <h3>${g.icone} ${g.rotulo}</h3>
      ${g.lista.map(a => `
        <div class="linha-traco">
          <span class="traco-nome">${a.nome}<small>${esc(a.desc)}</small></span>
          ${pontosHTML(S.atributos[a.id] || 0, 5, `atr:${a.id}`)}
        </div>`).join('')}
    </div>`).join('');

  return `
  <div class="painel-cabeca">
    <div class="num">Passo ${numeroDoPasso('atributos')}</div>
    <h2>O Corpo que restou</h2>
    <p>Distribua exatamente: <b class="gold">um 4</b>, <b class="gold">três 3</b>,
    <b class="gold">quatro 2</b> e <b class="gold">um 1</b>. Clique na bolinha para definir o valor —
    clique de novo no mesmo ponto para zerar.</p>
  </div>
  <div class="cotas">${cotas}</div>
  <div class="grade g3">${grupos}</div>`;
}

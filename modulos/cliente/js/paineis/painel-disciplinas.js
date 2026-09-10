/* ============================================================
   VITÆ — Painel V: Disciplinas
   Um dos nove painéis que `criador-paineis.js` reunia num arquivo
   só. `avisoFalta` veio junto por só ser usada aqui hoje — se outro
   painel precisar dela, sobe para o arquivo-tronco.
   ============================================================ */

function avisoFalta(msg, irPara) {
  return `<div class="painel-cabeca"><h2>Antes disso…</h2><p>${esc(msg)}</p></div>
    <button class="btn primario" data-acao="ir" data-id="${irPara}">Voltar e escolher</button>`;
}

function painelDisciplinas() {
  const c = clan();
  if (!c) return avisoFalta('Escolha um clã antes de reivindicar dons.', 1);

  const disp = disciplinasDisponiveis(S);
  const bonusPredador = S.predadorDisciplina ? 1 : 0;
  const total = totalPontosDisc(S);
  /* §91 — sangue-ralo não distribui ponto nenhum (pág. 142). */
  const alvo = pontosDeDisciplinaNaCriacao(S);
  const doisEmUma = Object.values(S.disciplinas).some(v => v >= 2);

  const cards = disp.map(id => {
    const d = DISCIPLINAS[id] || { simbolo: '?', nome: id + ' (desconhecida)', poderes: {} };
    if (!d) return '';
    const nivel = S.disciplinas[id] || 0;
    const escolhidos = S.poderes[id] || [];
    let poderesHTML = '';
    for (let n = 1; n <= nivel; n++) {
      poderesHTML += `<div class="sub" style="margin:.8rem 0 .4rem">Nível ${n}</div>`;
      poderesHTML += (d.poderes[n] || []).map(p => `
        <div class="poder ${escolhidos.includes(p.nome) ? 'on' : ''}"
             data-acao="poder" data-id="${id}" data-nome="${esc(p.nome)}">
          <b>${esc(p.nome)}</b><p>${esc(p.desc)}</p>
        </div>`).join('');
    }
    if (d.ritual && nivel > 0) {
      const rits = [];
      for (let n = 1; n <= nivel; n++) (d.rituais?.[n] || []).forEach(r => rits.push([n, r]));
      poderesHTML += `<div class="sub" style="margin:.9rem 0 .4rem">Rituais (escolha 1 gratuito de nível 1)</div>
        <div class="chips">${rits.map(([n, r]) =>
          `<span class="chip ${S.rituais.includes(r) ? 'on' : ''}" data-acao="ritual" data-nome="${esc(r)}">${esc(r)} <em style="opacity:.5">${n}</em></span>`
        ).join('')}</div>`;
    }
    return `
    <div class="cartao ${nivel > 0 ? 'selec' : ''}">
      <span class="fita" style="background:linear-gradient(90deg,${d.cor},transparent)"></span>
      <div class="cla-topo">
        <span class="cla-simbolo">${d.simbolo}</span>
        <div><div class="cla-nome">${esc(d.nome)}</div></div>
        <div style="margin-left:auto">${pontosHTML(nivel, 5, `disc:${id}`, true)}</div>
      </div>
      <p class="quiet" style="margin:.5rem 0 0">${esc(d.resumo)}</p>
      ${poderesHTML}
    </div>`;
  }).join('');

  const cls = total === alvo && doisEmUma ? 'ok' : total > alvo ? 'excedeu' : '';
  return `
  <div class="painel-cabeca">
    <div class="num">Passo ${numeroDoPasso('disciplinas')}</div>
    <h2>Os Dons que vêm com a sentença</h2>
    <p>Na criação você recebe <b class="gold">três pontos</b> de Disciplina:
    <b class="gold">dois em uma</b> das Disciplinas do seu clã e <b class="gold">um em outra</b>.
    Para cada ponto, escolha o poder correspondente.</p>
  </div>
  <div class="cotas">
    <span class="cota ${cls}"><b>${total}/${alvo}</b> pontos de Disciplina${bonusPredador ? ' (3 + 1 do Predador)' : ''}</span>
    <span class="cota ${doisEmUma ? 'ok' : ''}"><b>${doisEmUma ? '✓' : '—'}</b> uma Disciplina em nível 2</span>
    ${S.predadorDisciplina ? `<span class="cota ok"><b>+1</b> ${DISCIPLINAS[S.predadorDisciplina]?.nome} pelo Predador</span>` : ''}
  </div>
  ${c.disciplinasLivres ? `<div class="caixa"><h4>Caitiff</h4><p>Sem clã, sem restrição: distribua os três pontos
    entre quaisquer Disciplinas. O preço vem depois, em experiência.</p></div>` : ''}
  ${c.sangueFraco ? `<div class="caixa"><h4>Sangue Fraco</h4><p>Você <b>não distribui ponto nenhum</b>
    aqui — o livro é explícito (pág. 142). As Disciplinas que você usa são <b>temporárias</b>, e vêm
    da Ressonância do sangue que você bebeu. A <b>Alquimia de Sangue-Ralo</b> se aprende por uma
    <b>Qualidade</b> ou com <b>experiência</b>, e não de graça na criação.</p>
    <p class="quiet" style="margin:.4rem 0 0;font-size:.8rem">Você também não pode comprar
    <b>Mawla, Lacaios ou Status</b> agora (pág. 149) — numa coterie mista eles entrariam como
    Antecedentes compartilhados, e esta mesa é de um jogador só.</p></div>` : ''}
  <div class="grade g2">${cards}</div>`;
}

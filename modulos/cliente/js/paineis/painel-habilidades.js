/* ============================================================
   VITÆ — Painel IV: Habilidades
   Um dos nove painéis que `criador-paineis.js` reunia num arquivo
   só. Os dois métodos do livro (o rápido e o da vida vivida)
   moram juntos porque um chama o outro: `painelHabilidades` cai em
   `painelVidaHumana` quando `S.modoHabilidade === 'vida'`.
   ============================================================ */

/* ------------------------------------------------------------
   A VIDA HUMANA — o método das págs. 145–146  (§91)

   O criador oferecia só o quadro rápido da pág. 147, que o próprio
   livro chama de "ESCOLHA ALTERNATIVA RÁPIDA". Alternativa a este.

   Aqui as Habilidades não são distribuídas: são CONTADAS a partir
   do que o personagem fez em vida — a profissão, o evento que o
   marcou, três passatempos. E a soma cai exatamente numa das duas
   distribuições, conforme o último passo. Não são dois sistemas: o
   quadro rápido é este método escrito de trás para frente.
   ------------------------------------------------------------ */
function painelVidaHumana() {
  const v = S.vidaHumana || (S.vidaHumana = { profissao: '', evento: '',
                                              passatempos: [], adicionais: '', opcoes: {} });
  const r = Criacao.montar(v);
  const hab = (id) => nomeHabilidade(id);

  const cartaoProf = Criacao.PROFISSOES.map(p => {
    const linha = (slots) => slots.map(s => s.fixo ? hab(s.fixo)
      : (s.escolha || []).map(hab).join(' ou ')).join(' · ');
    return `
    <div class="cartao clicavel ${v.profissao === p.id ? 'selec' : ''}"
      data-acao="vida-prof" data-id="${p.id}">
      <div class="cla-nome">${esc(p.nome)}</div>
      <p class="quiet" style="margin:.2rem 0 0"><b>•••</b> ${esc(linha(p.tres))}</p>
      <p class="quiet" style="margin:.1rem 0 0"><b>••</b> ${esc(linha(p.dois))}</p>
    </div>`;
  }).join('');

  /* Onde o livro escreve "A ou B", o jogador decide. Os chips só
     aparecem depois da profissão escolhida — antes não há o que
     decidir. */
  const prof = Criacao.profissaoPor(v.profissao);
  const escolhas = prof ? [
    ...prof.tres.map((s, i) => [s, `prof3:${i}`, 3]),
    ...prof.dois.map((s, i) => [s, `prof2:${i}`, 2])
  ].filter(([s]) => s.escolha).map(([s, chave, nivel]) => `
    <div class="linha-traco">
      <span class="traco-nome">Nível ${nivel}<small>${esc(s.nota || 'escolha uma')}</small></span>
      <div class="chips" style="margin:0">
        ${s.escolha.map(id => `<span class="chip ${
          (v.opcoes[chave] || s.escolha[0]) === id ? 'on' : ''}"
          data-acao="vida-opcao" data-id="${chave}|${id}">${esc(hab(id))}</span>`).join('')}
      </div>
    </div>`).join('') : '';

  const cartaoEvento = Criacao.EVENTOS.map(e => `
    <div class="cartao clicavel ${v.evento === e.id ? 'selec' : ''}"
      data-acao="vida-evento" data-id="${e.id}">
      <div class="cla-nome">${esc(e.nome)}</div>
      <p class="quiet" style="margin:.2rem 0 0">${esc(e.habilidades.map(hab).join(' · '))}</p>
      ${e.divergencia ? `<p class="quiet" style="margin:.2rem 0 0;font-size:.75rem"><em>${
        esc(e.divergencia)}</em></p>` : ''}
    </div>`).join('');

  const ev = Criacao.eventoPor(v.evento);
  const escolhaEvento = (ev && ev.habilidades.length > 1) ? `
    <div class="linha-traco">
      <span class="traco-nome">Qual fica em 3<small>a outra fica em 2</small></span>
      <div class="chips" style="margin:0">
        ${ev.habilidades.map(id => `<span class="chip ${
          (v.opcoes.evento || ev.habilidades[0]) === id ? 'on' : ''}"
          data-acao="vida-opcao" data-id="evento|${id}">${esc(hab(id))}</span>`).join('')}
      </div>
    </div>` : '';

  const hobbies = Criacao.PASSATEMPOS.map(h => `
    <span class="chip ${v.passatempos.includes(h.id) ? 'on' : ''}"
      data-acao="vida-hobby" data-id="${h.id}"
      title="${esc(hab(h.habilidade))}${h.alternativa ? ` ou ${hab(h.alternativa)}` : ''}">${
      esc(h.nome)}</span>`).join('');

  const adicionais = Object.entries(Criacao.ADICIONAIS).map(([k, a]) => `
    <div class="cartao clicavel ${v.adicionais === k ? 'selec' : ''}"
      data-acao="vida-adicionais" data-id="${k}">
      <div class="cla-nome">${esc(a.nome)}</div>
      <p class="quiet" style="margin:.2rem 0 0">${esc(a.texto)}</p>
      <div class="cla-discs">cai na distribuição <b>${esc(
        DIST_HABILIDADES[a.distribuicao].nome)}</b></div>
    </div>`).join('');

  const soma = Object.entries(r.pontos).sort((a, b) => b[1] - a[1])
    .map(([id, n]) => `<div class="linha"><span class="rot">${esc(hab(id))}</span><span>${
      '•'.repeat(n)}</span></div>`).join('') || '<p class="quiet">Nada ainda.</p>';

  return `
  <div class="painel-cabeca">
    <div class="num">Passo ${numeroDoPasso('habilidades')}</div>
    <h2>A vida que você teve</h2>
    <p>Este é o método do livro, das <b>págs. 145–146</b>. Você não distribui pontos: você conta o
    que fez em vida, e as Habilidades saem daí.
    <button class="btn fantasma" data-acao="modohab" data-id="" style="margin-left:.8rem">usar o
    quadro rápido</button></p>
  </div>

  <div class="caixa"><h4>O que você fazia por dinheiro</h4>
  <p>Duas Habilidades em <b>três</b> e duas em <b>dois</b>, mais uma especialização profissional.</p></div>
  <div class="grade g3">${cartaoProf}</div>
  ${escolhas ? `<div class="caixa"><h4>Onde o livro deixa escolher</h4>${escolhas}</div>` : ''}

  <div class="caixa"><h4>O que te marcou</h4>
  <p>Um evento-chave: uma Habilidade em <b>três</b>, outra em <b>dois</b>.</p></div>
  <div class="grade g3">${cartaoEvento}</div>
  ${escolhaEvento ? `<div class="caixa">${escolhaEvento}</div>` : ''}

  <div class="caixa"><h4>O que você fazia por prazer</h4>
  <p>Escolha <b>três</b> passatempos — um ponto cada.
  ${v.passatempos.length}/${Criacao.QUANTOS_PASSATEMPOS} escolhidos.</p>
  <div class="chips">${hobbies}</div></div>

  <div class="caixa"><h4>E o resto</h4>
  <p>O último passo decide em qual distribuição a sua vida cai.</p></div>
  <div class="grade g2">${adicionais}</div>

  <div class="caixa ouro">
    <h4>A conta${r.distribuicao ? ` — distribuição ${esc(DIST_HABILIDADES[r.distribuicao].nome)}` : ''}</h4>
    ${soma}
    ${r.falta.length
      ? `<p class="quiet" style="margin:.5rem 0 0">Falta: ${esc(r.falta.join(' · '))}.</p>`
      : `<div class="chips"><span class="chip" data-acao="vida-aplicar" data-id="ok">Levar isto
         para a ficha</span></div>`}
  </div>`;
}

function painelHabilidades() {
  const modos = Object.entries(DIST_HABILIDADES).map(([k, m]) => `
    <div class="cartao clicavel ${S.modoHabilidade === k ? 'selec' : ''}" data-acao="modohab" data-id="${k}">
      <div class="cla-nome">${esc(m.nome)}</div>
      <p class="cla-lema">“${esc(m.lema)}”</p>
      <p class="quiet" style="margin:0">${esc(m.desc)}</p>
      <div class="cla-discs">${Object.entries(m.cotas).sort((a,b)=>b[0]-a[0])
        .map(([v,q]) => `${q}× nível ${v}`).join(' · ')}</div>
    </div>`).join('');

  /* §91 — o método longo é o texto principal do livro; o quadro das
     três distribuições é a "escolha alternativa rápida" dele. Aqui os
     dois convivem, e a escolha entre eles é o primeiro clique. */
  if (S.modoHabilidade === 'vida') return painelVidaHumana();

  if (!S.modoHabilidade) {
    return `
    <div class="painel-cabeca">
      <div class="num">Passo ${numeroDoPasso('habilidades')}</div>
      <h2>O Ofício de estar morto</h2>
      <p>Duas maneiras, e as duas são do livro. A de cima é a das
      <b>págs. 145–146</b>: você conta a vida que teve e as Habilidades saem dela. As três de baixo
      são o quadro da <b>pág. 147</b>, que o livro chama de <em>escolha alternativa rápida</em>.</p>
    </div>
    <div class="grade g2">
      <div class="cartao clicavel destaque" data-acao="modohab" data-id="vida">
        <div class="cla-nome">A vida que você teve</div>
        <p class="cla-lema">“Ele conseguiu seus três pontos em Briga naquele ano de merda como
        segurança em Pattaya?”</p>
        <p class="quiet" style="margin:0">Profissão, um evento que te marcou, três passatempos.
        Dá as mesmas Habilidades das duas primeiras distribuições — e um passado junto.</p>
      </div>
    </div>
    <div class="grade g3">${modos}</div>`;
  }

  const modo = DIST_HABILIDADES[S.modoHabilidade];
  const lista = todasHabilidades();
  /* O ponto que o Predador deu não entra na cota (§91, pág. 149). */
  const c = contagem(S.habilidades, lista, { semContar: S.pontoDoPredador || '' });
  const cotas = Object.entries(modo.cotas).sort((a,b)=>b[0]-a[0]).map(([v,q]) => {
    const usado = c[v] || 0;
    const cls = usado === q ? 'ok' : usado > q ? 'excedeu' : '';
    return `<span class="cota ${cls}"><b>${usado}/${q}</b> em ${v}</span>`;
  }).join('');

  /* A especialização que o Predador deu chega ANTES deste passo desde a
     §71, e pode estar numa Habilidade ainda em zero. Ela tem de
     aparecer mesmo assim, senão o bônus fica invisível justamente onde
     ele deveria orientar a escolha. */
  const espDoPredador = S.predadorEspec ? S.predadorEspec.split('|')[0] : '';

  const grupos = Object.entries(HABILIDADES).map(([k, g]) => `
    <div class="cartao">
      <h3 title="${esc(g.nota || '')}">${esc(g.rotulo)}</h3>
      ${g.nota ? `<p class="quiet" style="margin:.1rem 0 .7rem;font-size:.78rem">${esc(g.nota)}</p>` : ''}
      ${g.lista.map(h => {
        const v = S.habilidades[h.id] || 0;
        const precisaEsp = v > 0 && ESPECIALIZACAO_OBRIGATORIA.includes(h.id);
        const esp = S.especializacoes[h.id] || '';
        const doPredador = espDoPredador === h.id;
        /* O hover explica o que a Habilidade cobre, com a página do
           livro (§71, item 2). Antes, eram 27 nomes sem explicação. */
        const ajuda = `${h.desc || ''}${h.pagina ? `\n\nBásico, pág. ${h.pagina}.` : ''}`;
        return `
        <div class="linha-traco" title="${esc(ajuda)}">
          <span class="traco-nome" title="${esc(ajuda)}">${h.nome}
            ${esp
              ? `<small>◈ ${esc(esp)}${doPredador ? ' — do Predador' : ''}</small>`
              : (v > 0 ? `<small>${precisaEsp ? '⚠ exige especialização' : 'sem especialização'}</small>` : '')}
          </span>
          ${(v > 0 || esp) ? `<button class="btn fantasma" data-acao="esp" data-id="${h.id}"
            title="Escolher ou trocar a especialização">◈</button>` : ''}
          ${pontosHTML(v, 5, `hab:${h.id}`)}
        </div>`;
      }).join('')}
    </div>`).join('');

  return `
  <div class="painel-cabeca">
    <div class="num">Passo ${numeroDoPasso('habilidades')}</div>
    <h2>O Ofício de estar morto</h2>
    <p>Modo <b class="gold">${esc(modo.nome)}</b> — <em>${esc(modo.lema)}</em>
    <button class="btn fantasma" data-acao="modohab" data-id="" style="margin-left:.8rem">trocar modo</button></p>
  </div>
  <div class="cotas">${cotas}</div>
  <div class="caixa"><h4>Especializações</h4><p>Você ganha uma especialização gratuita à sua escolha.
  Erudição, Ciência, Ofícios e Performance <b>exigem</b> uma especialização sempre que tiverem pontos.
  Clique no <b>◈</b> ao lado da habilidade.</p></div>
  ${espDoPredador ? `<div class="caixa ouro"><h4>A Caça já entregou</h4><p>
    <b>${esc(nomeHabilidade(espDoPredador))}: ${esc(S.predadorEspec.split('|')[1])}</b> — especialização
    gratuita do seu Tipo de Predador, já marcada abaixo. Ela <b>não gasta</b> a sua.</p></div>` : ''}
  <p class="quiet" style="margin:.2rem 0 .8rem;font-size:.8rem">Passe o mouse sobre o nome de uma
  Habilidade para ver o que ela cobre, com a página do livro.</p>
  <div class="grade g3">${grupos}</div>`;
}

/* ============================================================
   VITÆ — Painel VI: O Predador
   Um dos nove painéis que `criador-paineis.js` reunia num arquivo
   só.
   ============================================================ */

function painelPredador() {
  const c = cidade();
  const tipicos = c ? c.predadoresTipicos : [];

  /* A Potência de Sangue vai por parâmetro: a camada de dados não
     alcança `derivados`, que é da Ficha (§77). */
  const permitidos = Seitas.predadoresPermitidos(S, { potencia: derivados(S).potencia });
  const cards = permitidos.map(p => `
    <div class="cartao clicavel ${S.predador === p.id ? 'selec' : ''}" data-acao="predador" data-id="${p.id}">
      <div class="cla-topo"><span class="cla-simbolo">${p.simbolo}</span>
        <span class="cla-nome">${esc(p.nome)}</span></div>
      <p class="cla-lema">${esc(p.lema)}</p>
      <p class="quiet" style="margin:0">${esc(p.desc)}</p>
      <div class="cla-discs">${esc(p.teste)}
        ${p.seita ? `<br><span class="blood-text">exclusivo do ${esc(Seitas.perfil(p.seita).nome)}</span>` : ''}
        ${tipicos.includes(p.id) ? `<br><span style="color:var(--ouro-claro)">✦ comum em ${esc(c.nome)}</span>` : ''}</div>
    </div>`).join('');

  const p = predador();
  const det = !p ? '' : `
  <div class="cartao mt" style="border-color:var(--borda-forte);padding:1.8rem">
    <div class="cla-topo"><span class="cla-simbolo" style="font-size:2rem">${p.simbolo}</span>
      <div class="cla-nome" style="font-size:1.5rem">${esc(p.nome)}</div></div>
    <p class="cla-lema" style="font-size:1.1rem">${esc(p.lema)}</p>
    <p class="quiet">${esc(p.desc)}</p>

    <div class="caixa ouro"><h4>Teste de caçada</h4><p>${esc(p.teste)}</p></div>

    <div class="grade g2 mt">
      <div>
        <h3 class="sub">Especialização gratuita</h3>
        <div class="chips">${p.especializacao.opcoes.map(([hid, nome]) => {
          const chave = `${hid}|${nome}`;
          return `<span class="chip ${S.predadorEspec === chave ? 'on' : ''}"
            data-acao="predespec" data-id="${chave}">${nomeHabilidade(hid)}: ${esc(nome)}</span>`;
        }).join('')}</div>
      </div>
      <div>
        <h3 class="sub">Um ponto de Disciplina extra</h3>
        <div class="chips">${p.disciplina.map(d => `
          <span class="chip ${S.predadorDisciplina === d ? 'on' : ''}"
            data-acao="preddisc" data-id="${d}">${DISCIPLINAS[d]?.nome || d}</span>`).join('')}</div>
        <div class="dica quiet" style="margin-top:.4rem">Escolha aqui: o passo dos Dons já vai
        abrir com este ponto na cota, e é lá que você escolhe o poder.</div>
      </div>
    </div>

    <div class="grade g2 mt">
      ${p.humanidade ? `<div class="caixa"><h4>Humanidade ${p.humanidade > 0 ? '+' : '−'}${Math.abs(p.humanidade)}</h4><p>${
        p.humanidade > 0 ? 'Sua forma de caçar poupa vidas.'
                         : 'O que você faz custa, e o preço vem na trilha da Humanidade.'}</p></div>` : ''}
      ${p.potenciaSangue ? `<div class="caixa"><h4>Potência de Sangue +${p.potenciaSangue}</h4>
        <p>Acima do normal para a sua geração. Alimentar-se fica mais difícil na mesma medida.</p></div>` : ''}
      ${p.vantagens.length ? `<div class="caixa ouro"><h4>Vantagens do Predador</h4><p>${
        p.vantagens.map(v => `${esc(v.nome)} (${v.pontos})`).join('<br>')}</p></div>` : ''}
      ${p.defeitos.length ? `<div class="caixa"><h4>Ônus do Predador</h4><p>${
        p.defeitos.map(v => `${esc(v.nome)}${v.pontos ? ` (${v.pontos})` : ''}`).join('<br>')}</p></div>` : ''}
    </div>
    ${p.nota ? `<div class="caixa mt"><h4>Nota</h4><p>${esc(p.nota)}</p></div>` : ''}
    <div class="caixa ouro mt"><h4>Importante</h4><p>Vantagens e Defeitos concedidos pelo Tipo de Predador
    <b>não contam</b> no orçamento de 7 e 2 pontos das Amarras. Eles vêm de graça — com juros narrativos.</p></div>
  </div>`;

  return `
  <div class="painel-cabeca">
    <div class="num">Passo ${numeroDoPasso('predador')}</div>
    <h2>A Caça — como você se alimenta</h2>
    <p>Esta é a decisão que mais diz sobre você. Não é <em>se</em> você bebe: é o que você está
    disposto a fazer com a pessoa depois.${c ? ` Marcamos os tipos comuns em <em>${esc(c.nome)}</em>.` : ''}</p>
  </div>
  <div class="grade g3">${cards}</div>
  ${det}`;
}

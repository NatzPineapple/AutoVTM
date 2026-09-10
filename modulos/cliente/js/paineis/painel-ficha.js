/* ============================================================
   VITÆ — Painel IX: A Ficha (revisão final)
   Um dos nove painéis que `criador-paineis.js` reunia num arquivo
   só. `medidorHTML` veio junto por só ser usada aqui hoje — se
   outro painel precisar dela, sobe para o arquivo-tronco.
   ============================================================ */

function medidorHTML(valor, max, classe) {
  let h = `<div class="medidor ${classe || ''}">`;
  for (let i = 1; i <= max; i++) h += `<i class="${i <= valor ? 'on' : ''}"></i>`;
  return h + '</div>';
}

function painelFicha() {
  const c = clan(), cid = cidade(), p = predador(), d = derivados(S);
  const seita = SEITAS.find(s => s.id === S.seita);

  const bloco = (titulo, corpo) => `<div class="ficha-sec"><h3>${titulo}</h3>${corpo}</div>`;

  const attrHTML = Object.entries(ATRIBUTOS).map(([k, g]) => `
    <div><div class="sub" style="margin-bottom:.4rem">${g.rotulo}</div>
    ${g.lista.map(a => `<div class="ficha-item"><span class="rot">${a.nome}</span>
      ${pontosHTML(S.atributos[a.id] || 0, 5, '', true, true)}</div>`).join('')}</div>`).join('');

  const habHTML = Object.entries(HABILIDADES).map(([k, g]) => `
    <div><div class="sub" style="margin-bottom:.4rem">${g.rotulo}</div>
    ${g.lista.map(h => {
      const v = S.habilidades[h.id] || 0;
      const e = S.especializacoes[h.id];
      return `<div class="ficha-item"><span class="rot" style="${v ? '' : 'opacity:.35'}">${h.nome}${
        e ? ` <em class="quiet">(${esc(e)})</em>` : ''}</span>
        ${pontosHTML(v, 5, '', true, true)}</div>`;
    }).join('')}</div>`).join('');

  const discHTML = Object.entries(S.disciplinas).filter(([, v]) => v > 0).map(([id, v]) => {
    /* Ficha antiga pode trazer Disciplina cujo id saiu do catálogo, e
       `dd.simbolo` derrubava o passo IX inteiro — tela em branco, não
       uma linha a menos. Mesma classe do conserto em ficha-regras
       (§51.6), achada pela jornada que desenha os nove passos. */
    const dd = DISCIPLINAS[id] || { simbolo: '?', nome: id + ' (desconhecida)' };
    return `<div style="margin-bottom:.9rem">
      <div class="ficha-item"><span class="rot" style="color:var(--osso)">${esc(dd.simbolo)} ${esc(dd.nome)}</span>
        ${pontosHTML(v, 5, '', true, true)}</div>
      ${(S.poderes[id] || []).map(n => `<div class="quiet" style="padding-left:1.2rem">— ${esc(n)}</div>`).join('')}
    </div>`;
  }).join('') || '<p class="quiet">Nenhuma Disciplina definida.</p>';

  const vantHTML = [
    ...ANTECEDENTES.filter(a => S.antecedentes[a.id]).map(a =>
      `<div class="ficha-item"><span class="rot">${a.nome}</span>${pontosHTML(S.antecedentes[a.id], a.max, '', true, true)}</div>`),
    ...MERITOS.filter(m => S.meritos[m.id]).map(m =>
      `<div class="ficha-item"><span class="rot">${m.nome}</span><span class="val">${S.meritos[m.id]}</span></div>`),
    ...(p ? p.vantagens.map(v => `<div class="ficha-item"><span class="rot">${esc(v.nome)} <em class="quiet">(predador)</em></span><span class="val">${v.pontos}</span></div>`) : [])
  ].join('') || '<p class="quiet">—</p>';

  const defHTML = [
    ...DEFEITOS.filter(m => S.defeitos[m.id]).map(m =>
      `<div class="ficha-item"><span class="rot">${m.nome}</span><span class="val">${S.defeitos[m.id]}</span></div>`),
    ...(p ? p.defeitos.map(v => `<div class="ficha-item"><span class="rot">${esc(v.nome)} <em class="quiet">(predador)</em></span><span class="val">${v.pontos || '—'}</span></div>`) : [])
  ].join('') || '<p class="quiet">—</p>';

  const pf = perfil();
  const dSeita = S.seita ? dadosSeita() : {};
  const ancoraDe = (i) => pf.ancoras.tipo === 'ritae'
    ? ((RITAE.find(r => r.id === (dSeita.conviccoesRitae || [])[i]) || {}).nome || '—')
    : (S.marcos[i] || '—');

  const convHTML = S.conviccoes.map((cv, i) => cv ? `
    <div class="ficha-item"><span class="rot">${esc(cv)}</span>
    <span class="val">${esc(ancoraDe(i))}</span></div>` : '').join('') || '<p class="quiet">—</p>';

  const impostos = Seitas.defeitosImpostos(S);
  const grupoHTML = !S.seita ? '' : `
    <div class="ficha-item"><span class="rot">Seita</span><span class="val">${esc(pf.nome)}</span></div>
    <div class="ficha-item"><span class="rot">${esc(pf.grupo.rotulo || 'Grupo')}</span>
      <span class="val">${esc(Seitas.resumo(S, typeof Matilha !== 'undefined' ? Matilha.de(S) : null) || '—')}</span></div>
    <div class="ficha-item"><span class="rot">Bússola</span><span class="val">${esc(pf.bussola.rotulo)}</span></div>
    ${impostos.map(x => `<div class="ficha-item"><span class="rot">${esc(x.nome)} <em class="quiet">(imposto)</em></span>
      <span class="val">${x.pontos || '—'}</span></div>`).join('')}`;

  const r = RESSONANCIAS.find(x => x.id === S.ressonancia);

  return `
  <div class="painel-cabeca">
    <div class="num">A Ficha</div>
    <h2>Está pronta. Agora sobreviva a ela.</h2>
    <p>Confira, imprima, exporte. O arquivo <b>.json</b> pode ser recarregado aqui depois.</p>
  </div>

  <div class="acoes-ficha" style="display:flex;gap:.6rem;flex-wrap:wrap;margin-bottom:1rem">
    <!-- §92 — os três verbos, em ordem de intenção: terminar, guardar
         sem sair, e descartar. FINALIZAR guarda e limpa o criador; era
         ele que faltava, e por isso a ficha pronta ficava aberta. -->
    <button class="btn primario" data-acao="finalizar-ficha"
      title="Guarda na biblioteca e limpa o criador para o próximo personagem">Finalizar</button>
    <button class="btn" data-acao="guardar-ficha"
      title="Guarda e continua editando">Guardar e continuar</button>
    <button class="btn" data-acao="imprimir">Imprimir / PDF</button>
    <button class="btn" data-acao="exportar">Exportar .json</button>
    <button class="btn" data-acao="exportartxt">Exportar .txt</button>
    <button class="btn" data-acao="exportarextraido">Exportar ficha extraída</button>
    <button class="btn" data-acao="mesa">Levar para a Mesa</button>
    ${reiniciarArmado
      ? '<button class="btn primario" data-acao="reiniciar">Descartar mesmo?</button>'
      : '<button class="btn fantasma" data-acao="reiniciar">Começar de novo</button>'}
  </div>

  <div class="chips oficial-aviso" style="margin-bottom:1.6rem">
    <span class="chip ${S.vistaFicha === 'oficial' ? 'on' : ''}" data-acao="vista" data-id="oficial">Modelo oficial (impressão)</span>
    <span class="chip ${S.vistaFicha === 'vitae' ? 'on' : ''}" data-acao="vista" data-id="vitae">Ficha VITÆ</span>
    <span class="quiet" style="align-self:center;margin-left:.6rem;font-size:.82rem">
      O PDF sai sempre no modelo oficial de duas páginas.</span>
  </div>

  <div class="oficial-palco ${S.vistaFicha === 'oficial' ? '' : 'oculto-tela'}">${fichaModeloHTML(S)}</div>

  <div class="ficha ${S.vistaFicha === 'vitae' ? '' : 'oculto-tela'}" id="ficha-impressa">
    <div class="ficha-topo">
      <div class="sub">${esc(nomeSexo(S.sexo))}</div>
      <h1 class="ficha-nome">${esc(S.nome || 'Sem Nome')}</h1>
      <div class="ficha-linha">
        ${c ? `${c.simbolo} ${esc(c.nome)}` : 'Clã indefinido'}
        · ${esc(S.geracao)}ª geração
        ${seita ? ' · ' + esc(seita.nome) : ''}
        ${p ? ' · ' + esc(p.nome) : ''}
      </div>
      ${S.conceito ? `<p class="it" style="margin:.8rem 0 0">${esc(S.conceito)}</p>` : ''}
    </div>

    ${bloco('Vitais', `<div class="ficha-cols">
      <div>
        <div class="ficha-item"><span class="rot">Vitalidade</span>${medidorHTML(d.vitalidade, d.vitalidade)}</div>
        <div class="ficha-item"><span class="rot">Força de Vontade</span>${medidorHTML(d.vontade, d.vontade)}</div>
        <div class="ficha-item"><span class="rot">Humanidade</span>${medidorHTML(d.humanidade, 10, 'hum')}</div>
      </div>
      <div>
        <div class="ficha-item"><span class="rot">Fome</span>${medidorHTML(S.fome, 5, 'fome')}</div>
        <div class="ficha-item"><span class="rot">Potência de Sangue</span><span class="val">${d.potencia}</span></div>
        <div class="ficha-item"><span class="rot">Ressonância</span><span class="val">${esc(r?.nome || '—')}</span></div>
      </div>
      <div>
        <div class="ficha-item"><span class="rot">Senhor</span><span class="val">${esc(S.senhor || '—')}</span></div>
        <div class="ficha-item"><span class="rot">Jogador</span><span class="val">${esc(S.jogador || '—')}</span></div>
      </div>
    </div>`)}

    ${bloco('Atributos', `<div class="ficha-cols">${attrHTML}</div>`)}
    ${bloco('Habilidades', `<div class="ficha-cols">${habHTML}</div>`)}
    ${bloco('Disciplinas', discHTML + (S.rituais.length ? `<div class="caixa"><h4>Rituais</h4><p>${S.rituais.map(esc).join(' · ')}</p></div>` : ''))}

    ${c ? bloco('Maldição e Compulsão', `
      <div class="caixa"><h4>${esc(c.maldicao.nome)}</h4><p>${esc(c.maldicao.texto)}</p></div>
      <div class="caixa"><h4>Compulsão — ${esc(c.compulsao.nome)}</h4><p>${esc(c.compulsao.texto)}</p></div>`) : ''}

    ${p ? bloco('Predação', `
      <div class="ficha-item"><span class="rot">Tipo de Predador</span><span class="val">${p.simbolo} ${esc(p.nome)}</span></div>
      <div class="ficha-item"><span class="rot">Teste de caçada</span><span class="val">${esc(p.teste)}</span></div>
      ${S.predadorEspec ? `<div class="ficha-item"><span class="rot">Especialização</span><span class="val">${
        esc(nomeHabilidade(S.predadorEspec.split('|')[0]) + ': ' + S.predadorEspec.split('|')[1])}</span></div>` : ''}`) : ''}

    ${bloco('Vantagens', `<div class="ficha-cols"><div>${vantHTML}</div><div>${defHTML}</div></div>`)}

    ${S.seita ? bloco('Lealdade', grupoHTML) : ''}

    ${bloco(`Convicções e ${pf.ancoras.plural}`, convHTML + `
      <div class="ficha-cols mt">
        <div class="ficha-item"><span class="rot">Ambição</span><span class="val">${esc(S.ambicao || '—')}</span></div>
        <div class="ficha-item"><span class="rot">Desejo</span><span class="val">${esc(S.desejo || '—')}</span></div>
      </div>`)}

    ${(S.aparencia || S.historia) ? bloco('Retrato', `
      ${S.aparencia ? `<p class="quiet"><b class="gold">Aparência.</b> ${esc(S.aparencia)}</p>` : ''}
      ${S.historia ? `<p class="quiet"><b class="gold">História.</b> ${esc(S.historia)}</p>` : ''}`) : ''}

    ${cid ? bloco('O Domínio', `
      <p class="quiet"><b class="gold">${esc(cid.nome)} — ${esc(cid.tagline)}</b></p>
      <p class="quiet">${esc(cid.poder)}. Príncipe: ${esc(cid.principe)}.</p>
      <p class="quiet" style="font-size:.85rem">${esc(cid.texto[0])}</p>`) : ''}
  </div>

  ${validacoesHTML()}`;
}

function validacoesHTML() {
  const { problemas, avisos } = pendenciasDaFicha(S);

  const avisosHTML = avisos.length
    ? `<div class="caixa mt2"><h4>Avisos</h4><p>${avisos.map(esc).join('<br>')}</p></div>` : '';

  if (!problemas.length) return `<div class="caixa ouro mt2"><h4>Ficha completa</h4>
    <p>Tudo dentro das regras de criação. Boa sorte — você vai precisar.</p></div>${avisosHTML}`;
  return `<div class="caixa mt2"><h4>Pendências</h4><p>${problemas.map(esc).join('<br>')}</p></div>${avisosHTML}`;
}

/* ============================================================
   VITÆ — Painel I: Sobre (Crônica e seita)
   Um dos nove painéis que `criador-paineis.js` reunia num arquivo
   só. `campoSeita` continua no arquivo-tronco — é usada aqui e por
   `blocoGrupoHTML` (painel-vantagens.js).
   ============================================================ */

function painelCronica() {
  const seitas = SEITAS.map(s => {
    const pf = Seitas.perfil(s.id);
    return `
    <div class="cartao clicavel ${S.seita === s.id ? 'selec' : ''}" data-acao="seita" data-id="${s.id}">
      <div class="cla-topo"><span class="cla-simbolo">${s.simbolo}</span>
        <span class="cla-nome">${esc(s.nome)}</span></div>
      <p class="quiet" style="margin:.5rem 0">${esc(s.desc)}</p>
      <div class="cla-discs">${esc(pf.bussola.rotulo)} · ${esc(pf.grupo.rotulo || 'sem grupo')} ·
        ${esc(pf.ancoras.plural)}</div>
      <div class="caixa" style="margin:.6rem 0 0"><h4>No Brasil</h4><p>${esc(s.brasil)}</p></div>
    </div>`; }).join('');

  return `
  <div class="painel-cabeca">
    <div class="num">Passo ${numeroDoPasso('cronica')}</div>
    <h2>Sobre</h2>
    <p>Quem é essa pessoa morta, e de que lado ela está. O cenário das cidades brasileiras
    saiu daqui e vive no <b>Compêndio</b> — o botão está no topo.</p>
  </div>

  <h3 class="sub" style="margin-bottom:.9rem">Quem você era, quem você é</h3>
  <div class="grade g2">
    <div>
      <div class="campo"><label>Nome do personagem</label>
        <input data-campo="nome" value="${esc(S.nome)}" placeholder="Como te chamam nas noites"></div>
      <div class="campo"><label>Conceito</label>
        <input data-campo="conceito" value="${esc(S.conceito)}" placeholder="Ex.: enfermeira de plantão noturno">
        <div class="dica">Uma frase que resume quem é essa pessoa morta.</div></div>
      <div class="campo"><label>Sexo</label>
        <select data-campo="sexo">
          <option value="" ${!S.sexo ? 'selected' : ''}>—</option>
          ${SEXOS.map(x => `<option value="${x.id}" ${S.sexo === x.id ? 'selected' : ''}>${
            esc(x.nome)}${x.nota ? ` (${esc(x.nota)})` : ''}</option>`).join('')}
        </select></div>
    </div>
    <div>
      <div class="campo"><label>Jogador</label>
        <input data-campo="jogador" value="${esc(S.jogador)}"></div>
      <div class="campo"><label>Senhor (sire)</label>
        <input data-campo="senhor" value="${esc(S.senhor)}" placeholder="Quem te matou para te dar isto">
        <div class="dica">Você sabe o nome? Nem todos sabem.</div></div>
      <div class="campo"><label>Geração</label>
        <select data-campo="geracao">
          ${[16,15,14,13,12,11,10,9,8].map(g =>
            `<option value="${g}" ${S.geracao == g ? 'selected' : ''}>${g}ª geração${
              g >= 14 ? ' — Sangue Fraco' : g <= 9 ? ' — poder raro para um recém-criado' : ''}</option>`).join('')}
        </select></div>
    </div>
  </div>

  <hr class="ornamento">

  <h3 class="sub" style="margin-bottom:.9rem">Sua lealdade</h3>
  <div class="grade g2">${seitas}</div>
  ${detalheSeita()}`;
}

function interruptorOficialHTML() {
  const so = Seitas.soOficial();
  return `<div class="caixa mt ${so ? 'ouro' : ''}"><h4>Fonte do material</h4>
    <div class="chips">
      <span class="chip ${so ? '' : 'on'}" data-acao="oficial" data-id="tudo">Tudo</span>
      <span class="chip ${so ? 'on' : ''}" data-acao="oficial" data-id="so">Só material oficial</span>
    </div>
    <p>A maior parte das mecânicas de Sabá vem de <em>Black Hand: Playing the Sabbat</em>,
    que é Storytellers Vault, não cânone Paradox. Com o filtro ligado, some o que é de
    comunidade e sobra o cenário: os Caminhos ficam, sem os sistemas.</p></div>`;
}

function detalheSeita() {
  if (!S.seita) return '';
  const pf = perfil();
  const d = dadosSeita();
  const raiz = `seitaDados.${pf.id}`;

  const cabeca = `
    <div class="cla-topo" style="margin-bottom:.6rem">
      <span class="cla-nome" style="font-size:1.4rem">${esc(pf.nome)}</span>
      <span class="cla-epiteto">${esc(pf.bussola.rotulo)} · ${esc(pf.ancoras.plural)}</span>
    </div>
    <div class="caixa ouro"><h4>Onde dói</h4><p>${esc(pf.ondeDoi)}</p></div>`;

  const corpos = {
    camarilla: () => `
      <div class="grade g2 mt">
        <div class="campo"><label>Cargo na corte</label>
          <select data-caminho="${raiz}.cargo">
            ${pf.cargos.map(c => `<option value="${esc(c)}" ${d.cargo === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
          </select>
          <div class="dica">Cargo é poder e alvo nas costas. Exige o Mérito correspondente no passo VII.</div></div>
        ${campoSeita('Primogênito que te apadrinhou', `${raiz}.primogenitoPadrinho`, 'Quem respondeu por você na apresentação')}
      </div>
      <div class="grade g2">
        ${campoSeita('Nome do Círculo', `${raiz}.circulo.nome`, 'Como chamam vocês')}
        ${campoSeita('Seu papel nele', `${raiz}.circulo.papel`, 'O que você faz que ninguém mais faz')}
      </div>`,

    anarquistas: () => `
      <div class="grade g2 mt">
        ${campoSeita('Nome da baronia', `${raiz}.baronia.nome`, 'Como o pessoal chama o território')}
        ${campoSeita('Bairro ou recorte', `${raiz}.baronia.bairro`, 'Onde começa e onde acaba')}
      </div>
      <h3 class="sub" style="margin:.8rem 0 .5rem">Tipo de baronia</h3>
      <div class="grade g2">${TIPOS_BARONIA.map(t => `
        <div class="cartao clicavel ${(d.baronia || {}).tipo === t.id ? 'selec' : ''}"
             data-acao="baroniatipo" data-id="${t.id}">
          <div class="cla-nome">${esc(t.nome)}</div>
          <p class="quiet" style="margin:.3rem 0">${esc(t.territorio)}</p>
          <div class="cla-discs">${esc(t.tensao)}</div>
        </div>`).join('')}</div>
      <h3 class="sub" style="margin:.9rem 0 .5rem">Seu papel</h3>
      <div class="chips">${PAPEIS_BARONIA.map(p => `
        <span class="chip ${d.papel === p.id ? 'on' : ''}" data-acao="baroniapapel" data-id="${p.id}"
              title="${esc(p.desc)}">${esc(p.nome)}</span>`).join('')}</div>`,

    sabbat: () => `
      <div class="grade g2 mt">
        ${campoSeita('Nome da matilha', `${raiz}.matilha.nome`, 'Sem matilha, você é Suspeito')}
        ${campoSeita('Sacerdote', `${raiz}.matilha.sacerdote`, 'Quem celebra a Vaulderie')}
        ${campoSeita('Ductus', `${raiz}.matilha.ductus`, 'Quem manda quando a coisa aperta')}
        <div class="campo"><label>Seu título</label>
          <select data-caminho="${raiz}.cargo">
            ${pf.cargos.map(c => `<option value="${esc(c)}" ${d.cargo === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
          </select></div>
      </div>
      <h3 class="sub" style="margin:.8rem 0 .5rem">Tipo de matilha</h3>
      ${Seitas.soOficial() ? '<p class="quiet">Os tipos de matilha são sistema de comunidade, e estão ocultos.</p>' : ''}
      <div class="grade g3">${(Seitas.soOficial() ? [] : TIPOS_MATILHA).map(t => `
        <div class="cartao clicavel ${(d.matilha || {}).tipo === t.id ? 'selec' : ''}"
             data-acao="matilhatipo" data-id="${t.id}">
          <div class="cla-nome">${esc(t.nome)}</div>
          <p class="quiet" style="margin:.3rem 0">${esc(t.ritae)}</p>
          <div class="cla-discs">Exige ${esc(t.exige)}</div>
        </div>`).join('')}</div>
      ${interruptorOficialHTML()}
      <div class="caixa mt"><h4>Refúgio</h4>
        <div class="chips">
          <span class="chip ${d.refugioComunal !== false ? 'on' : ''}" data-acao="refugio" data-id="comunal">Comunal (padrão)</span>
          <span class="chip ${d.refugioComunal === false ? 'on' : ''}" data-acao="refugio" data-id="pessoal">Pessoal</span>
        </div>
        <p>Refúgio pessoal no Sabá é tão incomum que impõe o Defeito Segredo Sombrio.</p></div>`,

    independente: () => {
      const opcoes = LINHAGENS[S.cla] || [];
      return `
      <div class="grade g2 mt">
        ${campoSeita('Linhagem ou família', `${raiz}.linhagem`, S.cla ? 'De quem você descende' : 'Escolha o clã primeiro')}
        ${campoSeita('Seita de fachada', `${raiz}.seitaDeFachada`, 'Com quem você finge estar, quando convém')}
      </div>
      ${opcoes.length ? `<div class="chips">${opcoes.map(l => `
        <span class="chip ${d.linhagem === l ? 'on' : ''}" data-acao="linhagem" data-valor="${esc(l)}">${esc(l)}</span>`).join('')}</div>` : ''}
      <h3 class="sub" style="margin:.9rem 0 .5rem">O negócio</h3>
      <div class="grade g3">${NEGOCIOS.map(n => `
        <div class="cartao clicavel ${d.negocio === n.id ? 'selec' : ''}" data-acao="negocio" data-id="${n.id}">
          <div class="cla-nome">${esc(n.nome)}</div>
          <p class="quiet" style="margin:.3rem 0">Clientes: ${esc(n.clientes)}</p>
          <div class="cla-discs">${esc(n.preco)}</div>
        </div>`).join('')}</div>`;
    },

    nenhuma: () => `
      <div class="grade g2 mt">
        ${campoSeita('Por que você está sozinho', `${raiz}.motivo`, 'Exílio, fuga, erro, escolha')}
        ${campoSeita('Última corte que te conheceu', `${raiz}.ultimaCorte`, 'E que ainda lembra de você')}
      </div>`
  };

  const corpo = (corpos[pf.id] || (() => ''))();
  return `<div class="cartao mt" style="border-color:var(--borda-forte);padding:1.8rem">${cabeca}${corpo}</div>`;
}

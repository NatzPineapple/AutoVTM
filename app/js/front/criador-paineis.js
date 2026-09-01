/* ============================================================
   VITÆ — Painéis do criador
   Os nove passos, em HTML. Nenhuma função deste arquivo decide
   regra: elas leem S, perguntam a ficha-regras.js e devolvem
   string.
   ============================================================ */

function pontosHTML(valor, max, onclick, compacto, travado) {
  let h = `<div class="pontos${compacto ? ' compacto' : ''}">`;
  for (let i = 1; i <= max; i++) {
    h += `<span class="ponto${i <= valor ? ' cheio' : ''}${travado ? ' travado' : ''}"
            data-acao="${travado ? '' : onclick}" data-valor="${i}" title="${i}"></span>`;
  }
  return h + '</div>';
}

function medidorHTML(valor, max, classe) {
  let h = `<div class="medidor ${classe || ''}">`;
  for (let i = 1; i <= max; i++) h += `<i class="${i <= valor ? 'on' : ''}"></i>`;
  return h + '</div>';
}

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
    <div class="num">Passo I</div>
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

function campoSeita(rotulo, caminho, placeholder, dica) {
  return `<div class="campo"><label>${rotulo}</label>
    <input data-caminho="${caminho}" value="${esc(lerEm(S, caminho) || '')}" placeholder="${esc(placeholder || '')}">
    ${dica ? `<div class="dica">${dica}</div>` : ''}</div>`;
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
    <div class="num">Passo II</div>
    <h2>O Sangue que corre em você</h2>
    <p>Todo clã é uma herança e uma sentença. A maldição vem junto com os dons — não há como
    recusar uma sem perder o outro.${c ? ` Marcamos os clãs com presença conhecida em <em>${esc(c.nome)}</em>.` : ''}</p>
  </div>
  <div class="grade g3">${cards}</div>
  ${det}`;
}

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
    <div class="num">Passo III</div>
    <h2>O Corpo que restou</h2>
    <p>Distribua exatamente: <b class="gold">um 4</b>, <b class="gold">três 3</b>,
    <b class="gold">quatro 2</b> e <b class="gold">um 1</b>. Clique na bolinha para definir o valor —
    clique de novo no mesmo ponto para zerar.</p>
  </div>
  <div class="cotas">${cotas}</div>
  <div class="grade g3">${grupos}</div>`;
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

  if (!S.modoHabilidade) {
    return `
    <div class="painel-cabeca">
      <div class="num">Passo IV</div>
      <h2>O Ofício de estar morto</h2>
      <p>Escolha primeiro o formato da sua competência. Depois distribua os pontos.</p>
    </div>
    <div class="grade g3">${modos}</div>`;
  }

  const modo = DIST_HABILIDADES[S.modoHabilidade];
  const lista = todasHabilidades();
  const c = contagem(S.habilidades, lista);
  const cotas = Object.entries(modo.cotas).sort((a,b)=>b[0]-a[0]).map(([v,q]) => {
    const usado = c[v] || 0;
    const cls = usado === q ? 'ok' : usado > q ? 'excedeu' : '';
    return `<span class="cota ${cls}"><b>${usado}/${q}</b> em ${v}</span>`;
  }).join('');

  const grupos = Object.entries(HABILIDADES).map(([k, g]) => `
    <div class="cartao">
      <h3>${esc(g.rotulo)}</h3>
      ${g.lista.map(h => {
        const v = S.habilidades[h.id] || 0;
        const precisaEsp = v > 0 && ESPECIALIZACAO_OBRIGATORIA.includes(h.id);
        const esp = S.especializacoes[h.id] || '';
        return `
        <div class="linha-traco">
          <span class="traco-nome">${h.nome}
            ${v > 0 ? `<small>${esp ? '◈ ' + esc(esp) : (precisaEsp ? '⚠ exige especialização' : 'sem especialização')}</small>` : ''}
          </span>
          ${v > 0 ? `<button class="btn fantasma" data-acao="esp" data-id="${h.id}">◈</button>` : ''}
          ${pontosHTML(v, 5, `hab:${h.id}`)}
        </div>`;
      }).join('')}
    </div>`).join('');

  return `
  <div class="painel-cabeca">
    <div class="num">Passo IV</div>
    <h2>O Ofício de estar morto</h2>
    <p>Modo <b class="gold">${esc(modo.nome)}</b> — <em>${esc(modo.lema)}</em>
    <button class="btn fantasma" data-acao="modohab" data-id="" style="margin-left:.8rem">trocar modo</button></p>
  </div>
  <div class="cotas">${cotas}</div>
  <div class="caixa"><h4>Especializações</h4><p>Você ganha uma especialização gratuita à sua escolha.
  Erudição, Ciência, Ofícios e Performance <b>exigem</b> uma especialização sempre que tiverem pontos.
  Clique no <b>◈</b> ao lado da habilidade.</p></div>
  <div class="grade g3">${grupos}</div>`;
}

function painelDisciplinas() {
  const c = clan();
  if (!c) return avisoFalta('Escolha um clã antes de reivindicar dons.', 1);

  const disp = disciplinasDisponiveis(S);
  const bonusPredador = S.predadorDisciplina ? 1 : 0;
  const total = totalPontosDisc(S);
  const alvo = 3 + bonusPredador;
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
    <div class="num">Passo V</div>
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
  ${c.sangueFraco ? `<div class="caixa"><h4>Sangue Fraco</h4><p>Você não herda Disciplinas.
    Coloque um ponto em Alquimia de Sangue Fraco e trabalhe o resto com Méritos e Defeitos de Sangue Fraco.</p></div>` : ''}
  <div class="grade g2">${cards}</div>`;
}

function painelPredador() {
  const c = cidade();
  const tipicos = c ? c.predadoresTipicos : [];

  const permitidos = Seitas.predadoresPermitidos(S);
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
        <div class="dica quiet" style="margin-top:.4rem">Escolha e volte ao passo dos Dons para
        selecionar o poder correspondente.</div>
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
    <b>não contam</b> no orçamento de 7 e 2 pontos do próximo passo. Eles vêm de graça — com juros narrativos.</p></div>
  </div>`;

  return `
  <div class="painel-cabeca">
    <div class="num">Passo VI</div>
    <h2>A Caça — como você se alimenta</h2>
    <p>Esta é a decisão que mais diz sobre você. Não é <em>se</em> você bebe: é o que você está
    disposto a fazer com a pessoa depois.${c ? ` Marcamos os tipos comuns em <em>${esc(c.nome)}</em>.` : ''}</p>
  </div>
  <div class="grade g3">${cards}</div>
  ${det}`;
}

function painelVantagens() {
  const vt = totalVantagens(S), dt = totalDefeitos(S);

  const antHTML = ANTECEDENTES.map(a => `
    <div class="linha-traco">
      <span class="traco-nome">${a.nome}<small>${esc(a.desc)}</small></span>
      ${pontosHTML(S.antecedentes[a.id] || 0, a.max, `ant:${a.id}`, true)}
    </div>`).join('');

  const merHTML = MERITOS.map(m => {
    const atual = S.meritos[m.id] || 0;
    return `
    <div class="linha-traco">
      <span class="traco-nome">${m.nome}${m.brasil ? ' <span class="gold" title="Específico do cenário brasileiro">✦</span>' : ''}
        <small>${esc(m.desc)}</small></span>
      <div class="chips" style="margin:0">
        ${m.custos.map(c => `<span class="chip ${atual === c ? 'on' : ''}"
          data-acao="merito" data-id="${m.id}" data-valor="${c}">${c}</span>`).join('')}
      </div>
    </div>`;
  }).join('');

  const defHTML = DEFEITOS.map(m => {
    const atual = S.defeitos[m.id] || 0;
    return `
    <div class="linha-traco">
      <span class="traco-nome">${m.nome}${m.brasil ? ' <span class="gold">✦</span>' : ''}
        <small>${esc(m.desc)}</small></span>
      <div class="chips" style="margin:0">
        ${m.custos.map(c => `<span class="chip ${atual === c ? 'on' : ''}"
          data-acao="defeito" data-id="${m.id}" data-valor="${c}">${c}</span>`).join('')}
      </div>
    </div>`;
  }).join('');

  const p = predador();

  return `
  <div class="painel-cabeca">
    <div class="num">Passo VII</div>
    <h2>As Amarras — o que te prende ao mundo</h2>
    <p>Distribua <b class="gold">7 pontos</b> entre Antecedentes e Méritos, e escolha
    <b class="blood-text">2 pontos</b> de Defeitos. Cada vantagem é uma corda; cada defeito é onde ela roça.</p>
  </div>
  <div class="cotas">
    <span class="cota ${vt === 7 ? 'ok' : vt > 7 ? 'excedeu' : ''}"><b>${vt}/7</b> pontos de vantagem</span>
    <span class="cota ${dt === 2 ? 'ok' : dt > 2 ? 'excedeu' : ''}"><b>${dt}/2</b> pontos de defeito</span>
  </div>
  ${p && (p.vantagens.length || p.defeitos.length) ? `
  <div class="caixa ouro"><h4>Já concedido pelo Predador ${esc(p.nome)} (fora do orçamento)</h4>
    <p>${[...p.vantagens, ...p.defeitos].map(v => esc(v.nome)).join(' · ')}</p></div>` : ''}

  <h3 class="sub mt2" style="margin-bottom:.6rem">Antecedentes</h3>
  <div class="cartao">${antHTML}</div>

  <h3 class="sub mt2" style="margin-bottom:.6rem">Méritos</h3>
  <div class="cartao">${merHTML}</div>

  <h3 class="sub mt2" style="margin-bottom:.6rem">Defeitos</h3>
  <div class="cartao">${defHTML}</div>

  ${blocoGrupoHTML()}`;
}

function blocoGrupoHTML() {
  if (!S.seita) return '';
  const pf = perfil();
  const g = pf.grupo;
  if (!g.chave) return '';
  const d = dadosSeita();
  const raiz = `seitaDados.${pf.id}`;
  const impostos = Seitas.defeitosImpostos(S);

  const corpos = {
    circulo: () => `
      <div class="grade g2">
        ${campoSeita('Nome do Círculo', `${raiz}.circulo.nome`, 'Como chamam vocês')}
        ${campoSeita('Seu papel', `${raiz}.circulo.papel`, 'O que você faz que ninguém mais faz')}
      </div>
      <p class="quiet">${esc(g.desc)}</p>`,

    baronia: () => {
      const lista = (chave, titulo, vazio) => {
        const itens = d[chave] || [];
        const linhas = itens.map((fv, i) => `
          <div class="linha-traco" style="align-items:flex-start;gap:.6rem">
            <div style="flex:1">
              <input data-caminho="${raiz}.${chave}.${i}.com" value="${esc(fv.com || '')}" placeholder="Com quem">
              <input data-caminho="${raiz}.${chave}.${i}.o_que" value="${esc(fv.o_que || '')}" placeholder="O quê" style="margin-top:.3rem">
              <input data-caminho="${raiz}.${chave}.${i}.prazo" value="${esc(fv.prazo || '')}" placeholder="Prazo, se houver" style="margin-top:.3rem">
              <div class="chips" style="margin-top:.3rem">${FAVORES_SUGERIDOS.map(s => `
                <span class="chip" data-acao="sugerefavor" data-id="${chave}:${i}" data-valor="${esc(s)}">${esc(s)}</span>`).join('')}</div>
            </div>
            <button class="btn fantasma" data-acao="delfavor" data-id="${chave}:${i}">Remover</button>
          </div>`).join('');
        return `<h3 class="sub" style="margin:.9rem 0 .4rem">${titulo}</h3>
          <div class="cartao">${linhas || `<p class="quiet">${vazio}</p>`}
          <button class="btn" data-acao="addfavor" data-id="${chave}" style="margin-top:.6rem">Adicionar</button></div>`;
      };
      return `
      <p class="quiet">${esc(g.desc)} Favor é a moeda do Movimento: o Diretor usa cada linha
      destas como gatilho pronto.</p>
      ${lista('favoresDevidos', 'Favores que você deve', 'Nenhum. Ou você é novo, ou está mentindo.')}
      ${lista('favoresACobrar', 'Favores a cobrar', 'Ninguém te deve nada ainda.')}`;
    },

    matilha: () => {
      const grupo = Matilha.de(S);
      const arenaAtual = (grupo && grupo.arena) || d.arena || {};
      const pontos = grupo ? grupo.pontosMatilha : (d.pontosMatilha || 1);
      const vinculum = grupo ? grupo.vinculum : (d.vinculum || 0);

      const arena = TRACOS_ARENA.map(t => `
        <div class="linha-traco">
          <span class="traco-nome">${t.nome}<small>${esc(t.desc)}</small></span>
          ${pontosHTML(arenaAtual[t.id] || 0, 5, `arena:${t.id}`, true)}
        </div>`).join('');
      const gasto = TRACOS_ARENA.reduce((a, t) => a + (arenaAtual[t.id] || 0), 0);
      const vinc = [1, 2, 3].map(n => `
        <span class="chip ${vinculum === n ? 'on' : ''}" data-acao="vinculum" data-valor="${n}">Força ${n}</span>`).join('');

      const membros = !grupo
        ? '<p class="quiet">Dê um nome à matilha no passo I para registrá-la.</p>'
        : grupo.membros.map((m, i) => `
            <div class="linha-traco">
              <span class="traco-nome">${esc(m.nome)}<small>${
                esc(m.papel || (m.tipo === 'jogador' ? 'você' : 'irmão de matilha'))}</small></span>
              ${m.tipo === 'jogador' ? '<span class="quiet">você</span>'
                : `<button class="btn fantasma" data-acao="delmembro" data-id="${i}">Remover</button>`}
            </div>`).join('')
          + '<button class="btn" data-acao="addmembro" style="margin-top:.6rem">Adicionar irmão de matilha</button>';

      return `
      <p class="quiet">${esc(g.desc)} A matilha começa com <b class="gold">1 Ponto de Matilha</b>,
      gasto coletivamente. Vinculum, Arena e Pontos vivem num registro da matilha, fora da sua
      ficha, e são compartilhados por todo personagem que entrar nela.</p>
      <div class="cotas">
        <span class="cota ${gasto === pontos ? 'ok' : gasto > pontos ? 'excedeu' : ''}">
          <b>${gasto}/${pontos}</b> pontos de Arena</span>
        <span class="cota"><b>${vinculum}</b> de Vinculum</span>
        <span class="cota"><b>${grupo ? grupo.membros.length : 0}</b> na matilha</span>
      </div>
      <h3 class="sub" style="margin:.9rem 0 .4rem">Membros${grupo ? ' — ' + esc(grupo.nome) : ''}</h3>
      <div class="cartao">${membros}</div>
      <h3 class="sub" style="margin:.9rem 0 .4rem">Traços de Arena</h3>
      <div class="cartao">${arena}</div>
      <h3 class="sub" style="margin:.9rem 0 .4rem">Vinculum</h3>
      <div class="cartao"><div class="chips">${vinc}</div>
        <p class="quiet" style="margin:.6rem 0 0">Sobe 1 a cada Vaulderie, até 3. Em Força 3 você fica
        imune a Laços que não sejam Vinculum. Todos os Laços antigos foram zerados.</p></div>`;
    },

    rede: () => {
      const contratos = (d.contratos || []).map((ct, i) => `
        <div class="linha-traco" style="align-items:flex-start;gap:.6rem">
          <div style="flex:1">
            <input data-caminho="${raiz}.contratos.${i}.cliente" value="${esc(ct.cliente || '')}" placeholder="Cliente">
            <input data-caminho="${raiz}.contratos.${i}.servico" value="${esc(ct.servico || '')}" placeholder="Serviço contratado" style="margin-top:.3rem">
            <input data-caminho="${raiz}.contratos.${i}.preco" value="${esc(ct.preco || '')}" placeholder="Preço combinado" style="margin-top:.3rem">
            <input data-caminho="${raiz}.contratos.${i}.prazo" value="${esc(ct.prazo || '')}" placeholder="Prazo" style="margin-top:.3rem">
            <div class="chips" style="margin-top:.3rem">${SERVICOS_SUGERIDOS.map(s => `
              <span class="chip" data-acao="sugerecontrato" data-id="${i}" data-valor="${esc(s)}">${esc(s)}</span>`).join('')}</div>
          </div>
          <button class="btn fantasma" data-acao="delcontrato" data-id="${i}">Remover</button>
        </div>`).join('');
      const clientes = [0, 1].map(i => `
        <div class="campo"><label>Cliente ${i + 1}</label>
          <input data-caminho="${raiz}.clientes.${i}" value="${esc((d.clientes || [])[i] || '')}" placeholder="Quem paga">
          <div class="chips">${CLIENTES_SUGERIDOS.slice(i * 3, i * 3 + 3).map(s => `
            <span class="chip" data-acao="sugereclientes" data-id="${i}" data-valor="${esc(s)}">${esc(s)}</span>`).join('')}</div>
        </div>`).join('');
      return `
      <p class="quiet">${esc(g.desc)}</p>
      <div class="grade g2">${clientes}</div>
      <h3 class="sub" style="margin:.9rem 0 .4rem">Contratos em aberto</h3>
      <div class="cartao">${contratos || '<p class="quiet">Nenhum. Um Independente sem contrato é um Independente sem proteção.</p>'}
        <button class="btn" data-acao="addcontrato" style="margin-top:.6rem">Adicionar contrato</button></div>`;
    },

    ninguem: () => `
      <p class="quiet">${esc(g.desc)}</p>
      ${campoSeita('Quem procura por você', `${raiz}.motivo`, 'Corte, caçador, credor, parente')}`
  };

  const corpo = (corpos[g.chave] || (() => ''))();
  const imp = impostos.length ? `
    <div class="caixa mt"><h4>Imposto pela seita (fora do orçamento)</h4>
      <p>${impostos.map(x => `${esc(x.nome)}${x.pontos ? ` (${x.pontos})` : ''} — ${esc(x.motivo)}`).join('<br>')}</p></div>` : '';

  return `<hr class="ornamento">
    <h3 class="sub" style="margin-bottom:.6rem">${esc(g.rotulo)}</h3>
    ${corpo}${imp}`;
}

function ancorasHumanidadeHTML() {
  return S.conviccoes.map((c, i) => `
    <div class="campo">
      <label>Convicção ${i + 1}${i > 0 ? ' <span class="quiet">(opcional)</span>' : ''}</label>
      <input data-lista="conviccoes" data-idx="${i}" value="${esc(c)}" placeholder="Uma linha que você não cruza">
    </div>
    <div class="campo">
      <label>Marco da Convicção ${i + 1}</label>
      <input data-lista="marcos" data-idx="${i}" value="${esc(S.marcos[i] || '')}" placeholder="A pessoa viva que encarna essa convicção">
      <div class="dica">Marcos são mortais. Quando morrem, a convicção vai junto.</div>
    </div>`).join('');
}

function ancorasRitaeHTML() {
  const d = dadosSeita();
  const usados = (d.conviccoesRitae || []).filter(Boolean);
  const pilaveis = Seitas.filtrar(RITAE).filter(r => r.podeSerPilar);
  return S.conviccoes.map((c, i) => {
    const escolhido = (d.conviccoesRitae || [])[i] || '';
    const chips = pilaveis.map(r => {
      const ocupado = usados.includes(r.id) && escolhido !== r.id;
      return `<span class="chip ${escolhido === r.id ? 'on' : ''}" ${ocupado ? 'style="opacity:.3"' : ''}
        data-acao="ritaepilar" data-id="${r.id}" data-idx="${i}" title="${esc(r.efeito)}">${esc(r.nome)}</span>`;
    }).join('');
    return `
    <div class="campo">
      <label>Convicção ${i + 1}${i > 0 ? ' <span class="quiet">(opcional)</span>' : ''}</label>
      <input data-lista="conviccoes" data-idx="${i}" value="${esc(c)}" placeholder="O que o Caminho exige de você">
    </div>
    <div class="campo">
      <label>Ritae-Pilar da Convicção ${i + 1}</label>
      <div class="chips">${chips}</div>
      <input data-caminho="seitaDados.sabbat.implementos.${i}" style="margin-top:.4rem"
        value="${esc((d.implementos || [])[i] || '')}" placeholder="Implemento: cálice, lâmina, fragmento noddista">
      <div class="dica">Duas Convicções nunca apontam para o mesmo Ritae. Destruir o implemento
      insubstituível pode custar a Convicção.</div>
    </div>`;
  }).join('');
}

function caminhoHTML() {
  const d = dadosSeita();
  const cards = CAMINHOS.map(c => `
    <div class="cartao clicavel ${d.caminho === c.id ? 'selec' : ''}" data-acao="caminho" data-id="${c.id}">
      <div class="cla-topo"><span class="cla-nome">${esc(c.nome)}</span></div>
      <div class="cla-epiteto">${esc(c.alcunha)}</div>
      <p class="quiet" style="margin:.4rem 0">${esc(c.resumo)}</p>
      <div class="cla-discs">Compulsão: ${esc(c.compulsao.nome)}</div>
    </div>`).join('');

  const sel = CAMINHOS.find(c => c.id === d.caminho);
  const comSistema = sel && Seitas.sistemaVisivel(sel);
  const det = !sel ? '' : `
    ${comSistema ? `<div class="grade g2 mt">
      <div class="caixa"><h4>Compulsão de Caminho — ${esc(sel.compulsao.nome)}</h4>
        <p>${esc(sel.compulsao.texto)}</p>
        <p class="quiet" style="margin-top:.4rem">Pode substituir a Compulsão de clã quando ela disparar.</p></div>
      <div class="caixa ouro"><h4>Vantagem de matilha — ${esc(sel.vantagemMatilha.nome)}</h4>
        <p>${esc(sel.vantagemMatilha.texto)}</p></div>
    </div>` : `<div class="caixa mt"><h4>Sem sistema oficial</h4>
      <p>O livro da Paradox descreve este Caminho, mas nunca deu regra para ele. A Compulsão
      de Caminho e a Vantagem de matilha são de comunidade, e o filtro está ligado.</p></div>`}
    <div class="caixa mt"><h4>Ritae-Pilares típicos deste Caminho</h4>
      <p>${sel.ritaePilares.map(id => esc((RITAE.find(r => r.id === id) || {}).nome || id)).join(' · ')}</p></div>`;

  return `
  <h3 class="sub" style="margin-bottom:.6rem">O Caminho da Iluminação</h3>
  <p class="quiet" style="margin-top:0">O Caminho substitui a Humanidade como bússola. A Humanidade
  continua sendo um número na ficha, mas você não pode mais comprá-la depois de largar o último
  Pilar mortal. Sistema de conteúdo de comunidade — ver <em>docs/regras.md, Parte IV</em>.</p>
  <div class="grade g3">${cards}</div>
  ${det}
  <hr class="ornamento">`;
}

function painelAlma() {
  const pf = perfil();
  const caminho = pf.bussola.tipo === 'caminho';
  const conv = caminho ? ancorasRitaeHTML() : ancorasHumanidadeHTML();

  const ress = RESSONANCIAS.map(r => `
    <div class="cartao clicavel ${S.ressonancia === r.id ? 'selec' : ''}" data-acao="ressonancia" data-id="${r.id}">
      <span class="fita" style="background:linear-gradient(90deg,${r.cor},transparent)"></span>
      <div class="cla-nome">${esc(r.nome)}</div>
      <p class="quiet" style="margin:.3rem 0">${esc(r.humor)}</p>
      <div class="cla-discs">Alimenta: ${esc(r.disc)}</div>
    </div>`).join('');

  return `
  <div class="painel-cabeca">
    <div class="num">Passo VIII</div>
    <h2>${caminho ? 'A Alma — o que o Caminho fez de você' : 'A Alma — o que sobrou de gente'}</h2>
    <p>${caminho
      ? 'Convicções continuam sendo as regras que você impôs a si mesmo. O que muda é a âncora: no Sabá elas se prendem a Ritae, não a mortais. Interromper o rito fere a Convicção do mesmo jeito que matar um Pilar.'
      : 'Convicções são as regras que você impôs a si mesmo. Marcos são as pessoas vivas que fazem essas regras significarem alguma coisa. Perder um deles é perder um pedaço da Humanidade.'}</p>
  </div>

  ${caminho ? caminhoHTML() : ''}

  <div class="grade g2">
    <div>
      <div class="campo"><label>Ambição <span class="quiet">— o objetivo de longo prazo</span></label>
        <input data-campo="ambicao" value="${esc(S.ambicao)}" placeholder="O que você quer antes do fim">
        <div class="chips">${AMBICOES_SUGERIDAS.map(a =>
          `<span class="chip" data-acao="sugere" data-campo="ambicao" data-valor="${esc(a)}">${esc(a)}</span>`).join('')}</div>
      </div>
      <div class="campo"><label>Desejo <span class="quiet">— o que você quer esta noite</span></label>
        <input data-campo="desejo" value="${esc(S.desejo)}" placeholder="Pequeno, imediato, urgente">
        <div class="chips">${DESEJOS_SUGERIDOS.map(a =>
          `<span class="chip" data-acao="sugere" data-campo="desejo" data-valor="${esc(a)}">${esc(a)}</span>`).join('')}</div>
      </div>
    </div>
    <div>${conv}</div>
  </div>

  <div class="chips mt">${CONVICCOES_SUGERIDAS.map(c =>
    `<span class="chip" data-acao="sugereconv" data-valor="${esc(c)}">${esc(c)}</span>`).join('')}</div>

  <hr class="ornamento">
  <h3 class="sub" style="margin-bottom:.8rem">Ressonância predileta</h3>
  <p class="quiet" style="margin-top:0">O sabor de sangue que sua Besta procura. Determina quais Disciplinas
  ficam mais fáceis de alimentar.</p>
  <div class="grade g3">${ress}</div>

  <hr class="ornamento">
  <h3 class="sub" style="margin-bottom:.8rem">Registro</h3>
  <p class="quiet" style="margin-top:0">Campos do modelo oficial de ficha. Tudo opcional — o que ficar
  em branco simplesmente não aparece no PDF.</p>
  <div class="grade g4">
    <div class="campo"><label>Idade verdadeira</label>
      <input data-campo="idadeVerdadeira" value="${esc(S.idadeVerdadeira)}" placeholder="Quantos anos de fato"></div>
    <div class="campo"><label>Idade aparente</label>
      <input data-campo="idadeAparente" value="${esc(S.idadeAparente)}" placeholder="A que o espelho mostraria"></div>
    <div class="campo"><label>Data de nascimento</label>
      <input data-campo="dataNascimento" value="${esc(S.dataNascimento)}"></div>
    <div class="campo"><label>Data de morte</label>
      <input data-campo="dataMorte" value="${esc(S.dataMorte)}" placeholder="A noite do Abraço"></div>
  </div>
  <div class="grade g2">
    <div class="campo"><label>Aparência</label>
      <textarea data-campo="aparencia" placeholder="Como você se apresenta — e o que denuncia o que você é">${esc(S.aparencia)}</textarea></div>
    <div class="campo"><label>Traços distintivos</label>
      <textarea data-campo="tracos" placeholder="Cicatriz, sotaque, cheiro, o jeito de não piscar">${esc(S.tracos)}</textarea></div>
    <div class="campo"><label>História</label>
      <textarea data-campo="historia" placeholder="A vida, o Abraço, a primeira noite">${esc(S.historia)}</textarea></div>
    <div class="campo"><label>Princípios da Crônica</label>
      <textarea data-campo="principios" placeholder="As regras da mesa. Em branco, o app preenche com os dados do seu domínio.">${esc(S.principios)}</textarea></div>
    <div class="campo"><label>Notas</label>
      <textarea data-campo="notas" placeholder="O que mais precisar caber na ficha">${esc(S.notas)}</textarea></div>
    <div>
      <div class="campo"><label>Experiência total</label>
        <input data-campo="xpTotal" value="${esc(S.xpTotal)}"></div>
      <div class="campo"><label>Experiência gasta</label>
        <input data-campo="xpGasta" value="${esc(S.xpGasta)}"></div>
    </div>
  </div>`;
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
    <button class="btn primario" data-acao="guardar-ficha">Guardar na biblioteca</button>
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

  <div class="oficial-palco ${S.vistaFicha === 'oficial' ? '' : 'oculto-tela'}">${fichaOficialHTML(S)}</div>

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

function avisoFalta(msg, irPara) {
  return `<div class="painel-cabeca"><h2>Antes disso…</h2><p>${esc(msg)}</p></div>
    <button class="btn primario" data-acao="ir" data-id="${irPara}">Voltar e escolher</button>`;
}

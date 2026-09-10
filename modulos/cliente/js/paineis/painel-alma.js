/* ============================================================
   VITÆ — Painel VIII: A Alma
   Um dos nove painéis que `criador-paineis.js` reunia num arquivo
   só.
   ============================================================ */

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
      <div class="cla-discs">Alimenta: ${esc(Ressonancia.disciplinasDe(r.id))}</div>
    </div>`).join('');

  /* O TEMPERAMENTO é o que decide se a Ressonância vale dado (pág. 228).
     Sem este campo a regra não existia — §67. */
  const temp = TEMPERAMENTOS.map(t => `
    <span class="chip ${S.temperamento === t.id || (!S.temperamento && t.id === 'nenhum') ? 'on' : ''}"
      data-acao="temperamento" data-id="${t.id}" title="${esc(t.desc)}">${esc(t.nome)}${
      t.dados ? ` · +${t.dados} dado` : ''}</span>`).join('');

  return `
  <div class="painel-cabeca">
    <div class="num">Passo ${numeroDoPasso('alma')}</div>
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

  <h4 style="margin:1rem 0 .4rem">Temperamento</h4>
  <p class="quiet" style="margin-top:0">É ele que decide se a Ressonância vale alguma coisa no dado
  (básico, pág. 228). <b>Efêmero não dá nada</b> — e é o caso da maioria das vítimas. Intenso e agudo
  dão <b>um dado</b> nas paradas das Disciplinas que aquela Ressonância alimenta; o agudo ainda traz
  uma Discrasia.</p>
  <div class="chips">${temp}</div>

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

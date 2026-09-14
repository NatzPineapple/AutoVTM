/* ============================================================
   VITÆ — Gastar experiência, na ficha
   (básico, "Custo das Características: Experiência", pág. 151)

   Esta seção morava na doca da MESA, como uma aba ao lado de Bolsa e
   Locais, e estava no lugar errado por dois motivos:

     1. **gastar experiência é editar a ficha** — sobe um Atributo,
        escreve uma Especialização, desconta da carteira. É a mesma
        coisa que os nove passos do criador fazem, e não é coisa de se
        fazer no meio de um turno com o Narrador esperando;
     2. quem **ganha** experiência é a sessão, e isso continua na Mesa:
        `Estado.fimDeSessao` credita e o Registro mostra. Ganhar e
        gastar acontecem em momentos diferentes da mesa de verdade, e
        agora acontecem em telas diferentes também.

   Ela não é um passo: é uma seção da tela da Ficha, que é onde a ficha
   já está pronta e onde estão os botões de guardar e imprimir. Quem
   abre uma ficha guardada cai direto nela.

   ESTE ARQUIVO NÃO CALCULA NADA. Todo número vem de `Experiencia`, da
   área Ficha — `cotar` diz quanto custa e se dá para pagar, `carteira`
   diz quanto há. O front que refaz a conta do motor é o defeito nº 1
   da auditoria, e há teste varrendo o código atrás dele.
   (Mudança pedida em revisão de código, sem número de §.)
   ============================================================ */

/* O que está selecionado para compra. Estado de TELA, e por isso não
   entra no `S`: a ficha guardada não tem por que lembrar que alguém
   estava olhando o preço de Destreza. */
let compraXP = { classe: 'atributo', id: '', para: 0 };

const CLASSES_XP = [
  { id: 'atributo',       rotulo: 'Atributo' },
  { id: 'habilidade',     rotulo: 'Habilidade' },
  { id: 'disciplina',     rotulo: 'Disciplina' },
  { id: 'vantagem',       rotulo: 'Antecedente' },
  { id: 'potenciaSangue', rotulo: 'Potência de Sangue' }
];

/* O que dá para comprar na classe escolhida, com o nível de agora. */
function opcoesDeCompraXP(f, classe) {
  return {
    atributo: Object.values(ATRIBUTOS).flatMap(gr => gr.lista)
      .map(a => ({ id: a.id, nome: a.nome, nivel: (f.atributos || {})[a.id] || 0 })),
    habilidade: todasHabilidades()
      .map(h => ({ id: h.id, nome: nomeHabilidade(h.id), nivel: (f.habilidades || {})[h.id] || 0 })),
    disciplina: Object.keys(DISCIPLINAS)
      .map(d => ({ id: d, nome: DISCIPLINAS[d].nome, nivel: (f.disciplinas || {})[d] || 0 })),
    vantagem: ANTECEDENTES
      .map(a => ({ id: a.id, nome: a.nome, nivel: (f.antecedentes || {})[a.id] || 0 })),
    potenciaSangue: [{ id: '', nome: 'Potência de Sangue', nivel: derivados(f).potencia }]
  }[classe] || [];
}

/* O nível atual do que está selecionado. Ele existe para a ação que
   move o alvo — o render já pede a cotação inteira ao motor. */
function nivelAtualDaCompraXP() {
  if (!compraXP || !compraXP.classe) return 0;
  const escolhido = opcoesDeCompraXP(S, compraXP.classe)
    .find(o => o.id === compraXP.id);
  return escolhido ? escolhido.nivel : 0;
}

function gastarXPHTML() {
  const c = Experiencia.carteira(S);
  const opcoes = opcoesDeCompraXP(S, compraXP.classe);

  const escolhido = opcoes.find(o => o.id === compraXP.id)
    || (compraXP.classe === 'potenciaSangue' ? opcoes[0] : null);
  const cot = escolhido
    ? Experiencia.cotar(S, { classe: compraXP.classe, id: escolhido.id,
                             para: compraXP.para || (escolhido.nivel + 1) })
    : null;

  const tabela = Object.entries(Experiencia.CUSTOS).map(([id, x]) => `
    <div class="ficha-item"><span class="rot">${esc(x.nome)}${
      x.nota ? ` <em class="quiet">${esc(x.nota)}</em>` : ''}</span>
      <span class="val">${x.porNivel ? `novo nível × ${x.fator}`
        : (x.fixo != null ? x.fixo : x.fator)}</span></div>`).join('');

  const habComPontos = todasHabilidades().filter(h => (S.habilidades || {})[h.id] > 0);

  return `
  <div class="ficha-sec" id="gastar-xp">
    <h3>Gastar experiência <small style="font-family:var(--sans);font-size:.6rem;opacity:.5">pág. 151</small></h3>

    <div class="ficha-cols">
      <div class="ficha-item"><span class="rot">Ganha
        <em class="quiet">uma por sessão, mais a Ambição</em></span>
        <span class="val">${c.total}</span></div>
      <div class="ficha-item"><span class="rot">Gasta</span><span class="val">${c.gasta}</span></div>
      <div class="ficha-item"><span class="rot">Livre</span>
        <span class="val"><b class="gold">${c.livre}</b></span></div>
    </div>

    <div class="chips" style="margin-top:.8rem">${CLASSES_XP.map(x =>
      `<span class="chip ${compraXP.classe === x.id ? 'on' : ''}" data-acao="xp-classe"
        data-id="${x.id}">${esc(x.rotulo)}</span>`).join('')}</div>

    ${opcoes.length > 1 ? `
      <div class="campo" style="margin-top:.6rem;max-width:22rem">
        <label>O quê</label>
        <select id="xp-alvo" data-campo-xp="id">
          <option value="">—</option>
          ${opcoes.map(o => `<option value="${esc(o.id)}" ${
            o.id === compraXP.id ? 'selected' : ''}>${esc(o.nome)} · ${o.nivel}</option>`).join('')}
        </select>
      </div>` : ''}

    ${cot ? `
      <div class="ficha-item" style="margin-top:.5rem">
        <span class="rot">${esc(cot.nome)} <em class="quiet">${cot.de} → ${cot.para}</em></span>
        <span class="val">${cot.custo != null ? `${cot.custo} de experiência` : '—'}</span>
      </div>
      ${cot.explicacao && cot.salto ? `<p class="quiet" style="margin:.2rem 0 0;font-size:.8rem">
        <b>${esc(cot.explicacao)}</b> — não se salta etapa (pág. 151).</p>` : ''}
      ${cot.motivo ? `<p class="quiet" style="margin:.3rem 0 0;font-size:.82rem">${esc(cot.motivo)}</p>` : ''}
      <div class="chips" style="margin-top:.45rem">
        <span class="chip" data-acao="xp-nivel" data-id="-1">− um nível</span>
        <span class="chip" data-acao="xp-nivel" data-id="1">+ um nível</span>
        <span class="chip ${cot.possivel ? '' : 'apagado'}" data-acao="xp-comprar" data-id="ok">Comprar</span>
      </div>
    ` : '<p class="quiet" style="margin-top:.5rem;font-size:.82rem">Escolha o que comprar.</p>'}
  </div>

  <div class="ficha-sec">
    <h3>Especialização</h3>
    <p class="quiet" style="margin:0 0 .5rem;font-size:.82rem">Custo fixo de
    ${Experiencia.custoDe('especializacao')}, e ela precisa de pelo menos um ponto na Habilidade.</p>
    <div class="grade g2">
      <div class="campo"><label>Em qual Habilidade</label>
        <select id="xp-esp-hab">
          ${habComPontos.map(h => `<option value="${esc(h.id)}">${esc(nomeHabilidade(h.id))}</option>`).join('')
            || '<option value="">— nenhuma Habilidade com pontos —</option>'}
        </select></div>
      <div class="campo"><label>Qual especialização</label>
        <input id="xp-esp-texto" placeholder="Ex.: Facas"></div>
    </div>
    <div class="chips"><span class="chip" data-acao="xp-especializacao" data-id="ok">Comprar</span></div>
  </div>

  <div class="ficha-sec">
    <h3>A tabela do livro</h3>
    ${tabela}
    <p class="quiet" style="margin:.5rem 0 0;font-size:.8rem">"Novo nível" é o nível que você
    <b>deseja comprar</b>, e não o que você tem. E não se salta etapa: para chegar ao quarto ponto
    é preciso comprar o terceiro antes, e pagar os dois.</p>
  </div>`;
}

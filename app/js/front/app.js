/* ============================================================
   VITAE — Criador interativo de fichas
   Vampiro: A Máscara 5ª Edição — cenário brasileiro
   ============================================================ */

/* ------------------------------------------------------------
   ESTADO
   ------------------------------------------------------------ */
/* FICHA_VAZIA, claDe/cidadeDe/predadorDe/perfilDe/dadosSeitaDe e
   piscinaDaFicha vivem em ficha/ficha-vocabulario.js desde a §47.
   O criador só acrescenta o padrão do `S`, logo abaixo. */

let S = FICHA_VAZIA();
let passo = 0;

const PASSOS = [
  { id: 'cronica',    rotulo: 'Sobre' },
  { id: 'cla',        rotulo: 'O Sangue' },
  { id: 'atributos',  rotulo: 'O Corpo' },
  { id: 'habilidades',rotulo: 'O Ofício' },
  { id: 'disciplinas',rotulo: 'Os Dons' },
  { id: 'predador',   rotulo: 'A Caça' },
  { id: 'vantagens',  rotulo: 'As Amarras' },
  { id: 'alma',       rotulo: 'A Alma' },
  { id: 'ficha',      rotulo: 'A Ficha' }
];

/* ------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------ */
const $  = (s, r = document) => r.querySelector(s);
/* `esc` vive em ficha/ficha-vocabulario.js desde a §47. */

/* Invólucros do criador. A única coisa que acrescentam é o padrão
   `S` — a ficha aberta nesta tela. A regra é a única: eles podem ler
   `S`, e nada na área Ficha pode. Se um destes crescer para além de
   uma linha, ele está no arquivo errado. */
const clan       = (id)    => claDe(id ?? S.cla);
const cidade     = (id)    => cidadeDe(id ?? S.cidade);
const predador   = (id)    => predadorDe(id ?? S.predador);
const perfil     = (f = S) => perfilDe(f);
const dadosSeita = (f = S) => dadosSeitaDe(f);


function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('on'), 2600);
}

/* Item N3 da §45.4, o último `catch (e) {}` do front. Ele guarda a
   ficha em EDIÇÃO — o rascunho do criador —, e engoli-lo era pior do
   que parece: o jogador passava nove passos montando personagem e
   perdia tudo ao fechar a aba, sem uma palavra.

   Devolve false e avisa UMA vez por episódio, como `salvarMesa`
   (§47.6): esta função roda a cada tecla digitada, e um toast por
   tecla seria pior que o silêncio. */
let avisouQueNaoSalvouFicha = false;

function salvar() {
  try {
    localStorage.setItem('vitae:ficha', JSON.stringify({ S, passo }));
    if (typeof Ficha !== 'undefined' && S.cla && S.nome) {
      localStorage.setItem('vitae:ficha-json', Ficha.json(S));
    }
    avisouQueNaoSalvouFicha = false;
    return true;
  } catch (e) {
    if (!avisouQueNaoSalvouFicha && typeof toast === 'function') {
      avisouQueNaoSalvouFicha = true;
      toast('A ficha NÃO está sendo salva: o navegador está sem espaço. Exporte o .json.');
    }
    console.warn('salvar() da ficha falhou:', e && e.name, e && e.message);
    return false;
  }
}
function carregar() {
  try {
    const raw = localStorage.getItem('vitae:ficha');
    if (!raw) return false;
    const d = JSON.parse(raw);
    S = migrarFicha(Object.assign(FICHA_VAZIA(), d.S));
    passo = d.passo ?? 0;
    return true;
  } catch (e) { return false; }
}

/* ------------------------------------------------------------
   DERIVADOS
   ------------------------------------------------------------ */
/* Aceita uma ficha qualquer; sem argumento, usa a que está sendo criada. */

/* ------------------------------------------------------------
   COMPONENTES
   ------------------------------------------------------------ */


/* ------------------------------------------------------------
   PASSO 1 — A CIDADE
   ------------------------------------------------------------ */


/* ------------------------------------------------------------
   PASSO 2 — O SANGUE
   ------------------------------------------------------------ */


/* ------------------------------------------------------------
   PASSO 3 — ATRIBUTOS
   ------------------------------------------------------------ */


/* ------------------------------------------------------------
   PASSO 4 — HABILIDADES
   ------------------------------------------------------------ */

/* ------------------------------------------------------------
   PASSO 5 — DISCIPLINAS
   ------------------------------------------------------------ */


/* ------------------------------------------------------------
   PASSO 6 — PREDADOR
   ------------------------------------------------------------ */

/* ------------------------------------------------------------
   PASSO 7 — VANTAGENS
   ------------------------------------------------------------ */


/* ------------------------------------------------------------
   PASSO 8 — A ALMA
   ------------------------------------------------------------ */


/* ------------------------------------------------------------
   PASSO 9 — FICHA
   ------------------------------------------------------------ */


/* ------------------------------------------------------------
   RENDER
   ------------------------------------------------------------ */
function render() {
  const trilha = PASSOS.map((p, i) => `
    <div class="trilha-item ${i === passo ? 'ativo' : ''} ${i < passo ? 'feito' : ''}"
         data-acao="ir" data-id="${i}">${i + 1}. ${p.rotulo}</div>`).join('');

  const painel = {
    cronica: painelCronica, cla: painelCla, atributos: painelAtributos,
    habilidades: painelHabilidades, disciplinas: painelDisciplinas,
    predador: painelPredador, vantagens: painelVantagens,
    alma: painelAlma, ficha: painelFicha
  }[PASSOS[passo].id]();

  $('#app').innerHTML = `
    <header class="topo">
      <div class="topo-inner">
        <div class="topo-marca" data-acao="capa">VIT<span>Æ</span></div>
        <span class="sub" style="opacity:.5">Vampiro: A Máscara 5ª Ed. — Brasil</span>
        <div class="topo-acoes">
          <button class="btn fantasma" data-acao="mesa">Jogar</button>
          <button class="btn fantasma" data-acao="fichas">Fichas</button>
          <button class="btn fantasma" data-acao="lore">O Brasil das Trevas</button>
          <button class="btn fantasma" data-acao="importar">Importar</button>
          <button class="btn fantasma" data-acao="exportar">Salvar</button>
        </div>
      </div>
      <div class="trilha">${trilha}</div>
    </header>
    <main class="wrap"><div class="painel">${painel}
      <div class="navegar">
        <button class="btn" data-acao="anterior" ${passo === 0 ? 'disabled' : ''}>← Anterior</button>
        <span class="quiet">${passo + 1} de ${PASSOS.length}</span>
        <button class="btn primario" data-acao="proximo" ${passo === PASSOS.length - 1 ? 'disabled' : ''}>Próximo →</button>
      </div>
    </div></main>`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  ajustarEscalaOficial();
  salvar();
}

/* ------------------------------------------------------------
   CAPA E LORE
   ------------------------------------------------------------ */
function renderCapa() {
  $('#app').innerHTML = `
  <div class="capa">
    <div class="sub">Vampiro: A Máscara — 5ª Edição</div>
    <h1 class="capa-marca">VITÆ</h1>
    <div class="capa-sub">Criador de fichas</div>
    <div class="gota"></div>
    <p class="capa-linha">Você morreu numa noite qualquer e alguém achou que valia a pena
    te trazer de volta com fome. Agora escolha o que restou de você — e a cidade brasileira
    que vai assistir enquanto você se perde.</p>
    <div style="display:flex;gap:.8rem;flex-wrap:wrap;justify-content:center">
      <button class="btn primario" data-acao="comecar">Criar personagem</button>
      <button class="btn" data-acao="fichas">Fichas</button>
      <button class="btn" data-acao="mesa">Jogar uma noite</button>
      <button class="btn" data-acao="lore">O Brasil das Trevas</button>
      <button class="btn fantasma" data-acao="importar">Importar .json</button>
    </div>
    <p class="capa-fonte">Cenário compilado dos manuais em português e da pesquisa de<br>
    velhinhodorpg.com sobre as cidades brasileiras no Mundo das Trevas</p>
  </div>`;
}

let fichaAberta = '';
let fichaParaApagar = '';
let reiniciarArmado = false;

function renderFichas() {
  const fichas = listarFichas().map(resumoDaFicha);

  const cartoes = fichas.map(r => `
    <div class="sessao-cartao">
      ${r.clas ? `<span class="fita" style="background:linear-gradient(90deg,${r.clas.cor},transparent)"></span>` : ''}
      <div class="sessao-corpo" data-acao="ver-ficha" data-id="${esc(r.id)}">
        <div class="sessao-topo">
          <span class="sessao-personagem">${esc(r.nome)}</span>
          <span class="sessao-quando">${r.completa ? 'completa' : r.pendencias + ' pendência(s)'}</span>
        </div>
        <div class="sessao-meta">${esc(r.cla)} · ${esc(r.geracao)}ª geração · ${esc(r.seita)}</div>
        ${r.conceito ? `<div class="sessao-onde">${esc(r.conceito)}</div>` : ''}
        <div class="sessao-rodape">
          <span>Vitalidade ${r.vitalidade}</span>
          <span>Vontade ${r.vontade}</span>
          <span>Humanidade ${r.humanidade}</span>
        </div>
      </div>
      ${fichaParaApagar === r.id ? `
        <button class="sessao-apagar confirmando" data-acao="apagar-ficha" data-id="${esc(r.id)}"
          title="Clique para apagar de vez">Apagar<br>mesmo</button>
        <button class="sessao-apagar" data-acao="cancelar-apagar-ficha" data-id="${esc(r.id)}"
          title="Deixar como está">↩</button>` : `
        <button class="sessao-apagar" data-acao="apagar-ficha" data-id="${esc(r.id)}"
          title="Apagar esta ficha">✕</button>`}
    </div>
    ${fichaAberta === r.id ? `
      <div class="cartao mt" style="padding:1.2rem">
        <div class="chips" style="margin:0 0 .8rem">
          <span class="chip" data-acao="abrir-ficha" data-id="${esc(r.id)}">Abrir no criador</span>
          <span class="chip" data-acao="ver-ficha" data-id="${esc(r.id)}">Fechar</span>
        </div>
        <div class="oficial-palco">${fichaOficialHTML(fichaPorId(r.id))}</div>
      </div>` : ''}`).join('');

  $('#app').innerHTML = `
    <header class="topo"><div class="topo-inner">
      <div class="topo-marca" data-acao="capa">VIT<span>Æ</span></div>
      <div class="topo-acoes">
        <button class="btn fantasma" data-acao="mesa">Jogar</button>
        <button class="btn fantasma" data-acao="voltarapp">Voltar ao criador</button>
      </div>
    </div></header>
    <main class="wrap"><div class="painel">
      <div class="painel-cabeca">
        <div class="num">Biblioteca</div>
        <h2>Suas fichas</h2>
        <p>Tudo que você guardou. Clique num cartão para ver a folha oficial, abra no criador
        para continuar editando, ou apague com o ✕. A ficha aberta no criador agora é outra
        coisa — esta biblioteca é o que sobrevive a ela.</p>
      </div>

      ${fichas.length ? `<div class="sessoes">${cartoes}</div>` : `
        <div class="caixa ouro"><h4>Nenhuma ficha guardada</h4>
        <p>Termine uma ficha no criador e use <b>Guardar na biblioteca</b>, no passo A Ficha.</p></div>`}

      <div class="centro mt2">
        <button class="btn primario" data-acao="voltarapp">Voltar ao criador</button>
      </div>
    </div></main>`;
  window.scrollTo({ top: 0 });
  ajustarEscalaOficial();
}

function renderLore() {
  const cidades = CIDADES.map(c => `
    <div class="cartao mt" style="padding:1.6rem">
      <span class="cidade-uf">${c.uf}</span>
      <div class="cla-nome" style="font-size:1.4rem">${esc(c.nome)}</div>
      <div style="margin:.4rem 0"><span class="selo ${c.canon}">${
        c.canon === 'alto' ? 'Cânone forte' : c.canon === 'medio' ? 'Cânone parcial' :
        c.canon === 'baixo' ? 'Citação breve' : 'Terra de ninguém'}</span></div>
      <p class="cla-lema">${esc(c.tagline)}</p>
      ${c.texto.map(t => `<p class="quiet">${esc(t)}</p>`).join('')}
      <div class="caixa ouro"><h4>Poder</h4><p>${esc(c.poder)} · Príncipe: ${esc(c.principe)}${
        c.arcebispo && c.arcebispo !== '—' ? ` · Arcebispo: ${esc(c.arcebispo)}` : ''}</p></div>
      <div class="caixa"><h4>Ganchos</h4><p>${c.ganchos.map(g => '— ' + esc(g)).join('<br>')}</p></div>
    </div>`).join('');

  const ameacas = AMEACAS_BR.map(a => `
    <div class="cartao">
      <div class="cla-nome" style="font-size:1.05rem">${esc(a.nome)}</div>
      <div class="cla-epiteto">${esc(a.tipo)}</div>
      <p class="quiet" style="margin:.6rem 0 0">${esc(a.desc)}</p>
    </div>`).join('');

  $('#app').innerHTML = `
    <header class="topo"><div class="topo-inner">
      <div class="topo-marca" data-acao="capa">VIT<span>Æ</span></div>
      <div class="topo-acoes"><button class="btn fantasma" data-acao="voltarapp">Voltar ao criador</button></div>
    </div></header>
    <main class="wrap"><div class="painel">
      <div class="painel-cabeca">
        <div class="num">Compêndio</div>
        <h2>O Brasil das Trevas</h2>
        <p>Nenhuma cidade brasileira ganhou um livro <em>by night</em> oficial. O que existe são
        citações espalhadas — no sourcebook da Camarilla, no de Anarquistas, nos livros do Sabá — e
        décadas de trabalho de comunidades brasileiras. Isto é a compilação.</p>
      </div>

      <h3 class="sub">Ameaças e figuras do cenário nacional</h3>
      <div class="grade g3 mt">${ameacas}</div>

      <hr class="ornamento">
      <h3 class="sub">As cidades</h3>
      ${cidades}

      <hr class="ornamento">
      <div class="caixa"><h4>Fontes</h4><p>Manuais em português presentes no projeto
      (Guia do Jogador V5, Camarilla, Anarquistas, Sabá, Sombras na Torre, Livro das Disciplinas,
      Cultos dos Deuses de Sangue, Religiões Proibidas, Palavras de Sangue) e o artigo
      “As Cidades Brasileiras em Vampiro: A Máscara”, de Velhinho do RPG (16/06/2020).</p></div>
      <div class="centro mt2"><button class="btn primario" data-acao="voltarapp">Voltar ao criador</button></div>
    </div></main>`;
  window.scrollTo({ top: 0 });
}

/* ------------------------------------------------------------
   AÇÕES
   ------------------------------------------------------------ */
function definirPonto(mapa, id, valor, max) {
  const atual = mapa[id] || 0;
  mapa[id] = (atual === valor) ? 0 : Math.min(valor, max ?? 5);
  if (!mapa[id]) delete mapa[id];
}

document.addEventListener('click', (e) => {
  const alvo = e.target.closest('[data-acao]');
  if (!alvo) return;
  const acao = alvo.dataset.acao;
  const id = alvo.dataset.id;
  const valor = +alvo.dataset.valor;
  if (!acao) return;

  if (fichaParaApagar && acao !== 'apagar-ficha') fichaParaApagar = '';
  if (reiniciarArmado && acao !== 'reiniciar') reiniciarArmado = false;

  switch (true) {
    case acao === 'comecar':   passo = 0; render(); return;
    case acao === 'continuar': carregar(); render(); return;
    case acao === 'capa':      renderCapa(); return;
    case acao === 'lore':      renderLore(); return;
    case acao === 'mesa':      abrirMesa(); return;
    case acao === 'voltarapp': render(); return;
    case acao === 'fichas':    renderFichas(); return;

    case acao === 'guardar-ficha': {
      const { problemas } = pendenciasDaFicha(S);
      if (!S.nome || !S.cla) { toast('Dê um nome e um clã antes de guardar.'); return; }
      const guardado = guardarFicha(S);
      if (!guardado) { toast('Não consegui guardar — o armazenamento recusou.'); return; }
      salvar();
      toast(problemas.length
        ? `Guardada com ${problemas.length} pendência(s).`
        : 'Ficha guardada na biblioteca.');
      render(); return;
    }

    case acao === 'abrir-ficha': {
      const f = fichaPorId(id);
      if (!f) { toast('Ficha não encontrada.'); return; }
      S = migrarFicha(Object.assign(FICHA_VAZIA(), f));
      passo = 0;
      salvar();
      toast(`${S.nome} aberta no criador.`);
      render(); return;
    }

    case acao === 'ver-ficha':
      fichaAberta = fichaAberta === id ? '' : id;
      renderFichas(); return;

    case acao === 'apagar-ficha': {
      const r = listarFichas().find(f => f.fichaId === id);
      if (!r) return;
      if (fichaParaApagar !== id) {
        fichaParaApagar = id;
        renderFichas();
        toast('Clique de novo para apagar de vez.');
        return;
      }
      /* A biblioteca não sabe que existe um criador aberto (F4): quem tem
         o `S` cuida do `S`, e é aqui. */
      const apagou = apagarFicha(id);
      if (S.fichaId === id) delete S.fichaId;
      fichaParaApagar = '';
      if (fichaAberta === id) fichaAberta = '';
      toast(apagou ? `${r.nome} foi apagada.`
                   : 'Não deu para apagar: o armazenamento do navegador recusou.');
      renderFichas(); return;
    }

    case acao === 'cancelar-apagar-ficha':
      fichaParaApagar = '';
      renderFichas(); return;
    case acao === 'ir':        passo = +id; render(); return;
    case acao === 'anterior':  passo = Math.max(0, passo - 1); render(); return;
    case acao === 'proximo':   passo = Math.min(PASSOS.length - 1, passo + 1); render(); return;

    case acao === 'seita':
      S.seita = S.seita === id ? '' : id;
      if (S.seita) {
        Seitas.dados(S);
        const p = predador();
        if (p && p.seita && p.seita !== S.seita) { S.predador = ''; S.predadorEspec = ''; S.predadorDisciplina = ''; }
      }
      render(); return;

    case acao === 'baroniatipo':
      definirEm(S, 'seitaDados.anarquistas.baronia.tipo',
        dadosSeita().baronia.tipo === id ? '' : id);
      render(); return;

    case acao === 'baroniapapel':
      definirEm(S, 'seitaDados.anarquistas.papel', dadosSeita().papel === id ? '' : id);
      render(); return;

    case acao === 'matilhatipo':
      definirEm(S, 'seitaDados.sabbat.matilha.tipo',
        dadosSeita().matilha.tipo === id ? '' : id);
      sincronizarMatilha(S);
      render(); return;

    case acao === 'oficial':
      Seitas.definirSoOficial(id === 'so');
      if (Seitas.soOficial()) {
        const p = predador();
        if (p && Seitas.ehComunidade(p)) { S.predador = ''; S.predadorEspec = ''; S.predadorDisciplina = ''; }
      }
      render(); return;

    case acao === 'refugio':
      definirEm(S, 'seitaDados.sabbat.refugioComunal', id === 'comunal');
      render(); return;

    case acao === 'linhagem':
      definirEm(S, 'seitaDados.independente.linhagem',
        dadosSeita().linhagem === alvo.dataset.valor ? '' : alvo.dataset.valor);
      render(); return;

    case acao === 'negocio':
      definirEm(S, 'seitaDados.independente.negocio', dadosSeita().negocio === id ? '' : id);
      render(); return;

    case acao === 'caminho':
      definirEm(S, 'seitaDados.sabbat.caminho', dadosSeita().caminho === id ? '' : id);
      render(); return;

    case acao === 'ritaepilar': {
      const i = +alvo.dataset.idx;
      const atual = dadosSeita().conviccoesRitae || [];
      const ja = atual.indexOf(id);
      if (ja >= 0 && ja !== i) { toast('Duas Convicções não podem apontar para o mesmo Ritae.'); return; }
      definirEm(S, `seitaDados.sabbat.conviccoesRitae.${i}`, atual[i] === id ? '' : id);
      render(); return;
    }

    case acao === 'sugereclientes':
      definirEm(S, `seitaDados.independente.clientes.${id}`, alvo.dataset.valor);
      render(); return;

    case acao === 'vinculum': {
      const grupo = Matilha.de(S);
      const atual = grupo ? grupo.vinculum : dadosSeita().vinculum;
      const novo = atual === valor ? 0 : valor;
      if (grupo) Matilha.definir(grupo.id, 'vinculum', novo);
      definirEm(S, 'seitaDados.sabbat.vinculum', novo);
      render(); return;
    }

    case acao === 'addmembro': {
      const grupo = Matilha.de(S);
      if (!grupo) { toast('Dê um nome à matilha no passo I primeiro.'); return; }
      const nome = prompt('Nome do irmão de matilha:');
      if (!nome || !nome.trim()) return;
      const papel = prompt('Papel dele na matilha (opcional):') || '';
      Matilha.adicionarNPC(grupo.id, nome.trim(), papel.trim());
      render(); return;
    }

    case acao === 'delmembro': {
      const grupo = Matilha.de(S);
      if (grupo) Matilha.removerMembro(grupo.id, +id);
      render(); return;
    }

    case acao === 'addfavor': {
      const lista = dadosSeita()[id] || [];
      lista.push({ id: `fv${Date.now()}`, com: '', o_que: '', prazo: '', cobrado: false });
      definirEm(S, `seitaDados.anarquistas.${id}`, lista);
      render(); return;
    }

    case acao === 'delfavor': {
      const [chave, i] = id.split(':');
      const lista = dadosSeita()[chave] || [];
      lista.splice(+i, 1);
      definirEm(S, `seitaDados.anarquistas.${chave}`, lista);
      render(); return;
    }

    case acao === 'sugerefavor': {
      const [chave, i] = id.split(':');
      definirEm(S, `seitaDados.anarquistas.${chave}.${i}.o_que`, alvo.dataset.valor);
      render(); return;
    }

    case acao === 'addcontrato': {
      const lista = dadosSeita().contratos || [];
      lista.push({ id: `ct${Date.now()}`, cliente: '', servico: '', preco: '', prazo: '', quebrado: false });
      definirEm(S, 'seitaDados.independente.contratos', lista);
      render(); return;
    }

    case acao === 'delcontrato': {
      const lista = dadosSeita().contratos || [];
      lista.splice(+id, 1);
      definirEm(S, 'seitaDados.independente.contratos', lista);
      render(); return;
    }

    case acao === 'sugerecontrato':
      definirEm(S, `seitaDados.independente.contratos.${id}.servico`, alvo.dataset.valor);
      render(); return;

    case acao === 'cla':
      if (S.cla !== id) { S.cla = id; S.disciplinas = {}; S.poderes = {}; S.rituais = []; }
      if (clan()?.sangueFraco && +S.geracao < 14) S.geracao = '14';
      render(); return;

    case acao === 'modohab':
      S.modoHabilidade = id || '';
      if (!id) { S.habilidades = {}; S.especializacoes = {}; }
      render(); return;

    case acao === 'predador':
      if (S.predador !== id) {
        const antigo = S.predadorDisciplina;
        S.predador = id; S.predadorEspec = ''; S.predadorDisciplina = '';
        if (antigo && S.disciplinas[antigo]) { delete S.disciplinas[antigo]; delete S.poderes[antigo]; }
      }
      render(); return;

    case acao === 'preddisc':
      if (S.predadorDisciplina && S.predadorDisciplina !== id) {
        delete S.disciplinas[S.predadorDisciplina];
        delete S.poderes[S.predadorDisciplina];
      }
      S.predadorDisciplina = S.predadorDisciplina === id ? '' : id;
      render(); return;

    case acao === 'predespec':
      S.predadorEspec = S.predadorEspec === id ? '' : id;
      if (S.predadorEspec) {
        const [hid, nome] = id.split('|');
        S.especializacoes[hid] = nome;
      }
      render(); return;

    case acao === 'ressonancia': S.ressonancia = S.ressonancia === id ? '' : id; render(); return;

    case acao === 'temperamento': S.temperamento = id === 'nenhum' ? '' : id; render(); return;

    case acao === 'poder': {
      const nome = alvo.dataset.nome;
      const lista = S.poderes[id] || (S.poderes[id] = []);
      const i = lista.indexOf(nome);
      if (i >= 0) lista.splice(i, 1);
      else if (lista.length < (S.disciplinas[id] || 0)) lista.push(nome);
      else toast('Você já escolheu poderes suficientes para esse nível.');
      render(); return;
    }

    case acao === 'ritual': {
      const nome = alvo.dataset.nome;
      const i = S.rituais.indexOf(nome);
      if (i >= 0) S.rituais.splice(i, 1); else S.rituais.push(nome);
      render(); return;
    }

    case acao === 'merito':
      S.meritos[id] = S.meritos[id] === valor ? 0 : valor;
      if (!S.meritos[id]) delete S.meritos[id];
      render(); return;

    case acao === 'defeito':
      S.defeitos[id] = S.defeitos[id] === valor ? 0 : valor;
      if (!S.defeitos[id]) delete S.defeitos[id];
      render(); return;

    case acao === 'esp': {
      const atual = S.especializacoes[id] || '';
      const sug = SUGESTOES_ESPECIALIZACAO[id];
      const dica = sug ? `\n\nSugestões: ${sug.join(', ')}` : '';
      const v = prompt(`Especialização em ${nomeHabilidade(id)}:${dica}`, atual);
      if (v !== null) {
        if (v.trim()) S.especializacoes[id] = v.trim(); else delete S.especializacoes[id];
        render();
      }
      return;
    }

    case acao === 'sugere':
      S[alvo.dataset.campo] = alvo.dataset.valor; render(); return;

    case acao === 'sugereconv': {
      const i = S.conviccoes.findIndex(c => !c);
      if (i >= 0) { S.conviccoes[i] = alvo.dataset.valor; render(); }
      else toast('As três convicções já estão preenchidas.');
      return;
    }

    case acao === 'vista':
      S.vistaFicha = id; render(); return;

    case acao === 'imprimir':
      if (PASSOS[passo].id !== 'ficha') { passo = PASSOS.length - 1; render(); }
      setTimeout(() => window.print(), 120);
      return;
    case acao === 'exportar': exportarJSON(); return;
    case acao === 'exportarextraido':
      baixar(`vitae-${slug()}-extraida.json`, Ficha.json(S), 'application/json');
      toast('Ficha extraída exportada.');
      return;
    case acao === 'exportartxt': exportarTXT(); return;
    case acao === 'importar': importarJSON(); return;
    case acao === 'reiniciar':
      if (!reiniciarArmado) {
        reiniciarArmado = true;
        render();
        toast('Clique de novo para descartar esta ficha.');
        return;
      }
      reiniciarArmado = false;
      S = FICHA_VAZIA(); passo = 0; localStorage.removeItem('vitae:ficha'); renderCapa();
      return;

    case acao.startsWith('atr:'):
      definirPonto(S.atributos, acao.slice(4), valor); render(); return;
    case acao.startsWith('hab:'):
      definirPonto(S.habilidades, acao.slice(4), valor); render(); return;
    case acao.startsWith('ant:'):
      definirPonto(S.antecedentes, acao.slice(4), valor); render(); return;
    case acao.startsWith('arena:'): {
      const traco = acao.slice(6);
      const grupo = Matilha.de(S);
      const atual = grupo ? (grupo.arena[traco] || 0) : ((dadosSeita().arena || {})[traco] || 0);
      const novo = atual === valor ? 0 : valor;
      if (grupo) Matilha.definir(grupo.id, `arena.${traco}`, novo);
      definirEm(S, `seitaDados.sabbat.arena.${traco}`, novo);
      render(); return;
    }
    case acao.startsWith('disc:'): {
      const did = acao.slice(5);
      const antes = S.disciplinas[did] || 0;
      definirPonto(S.disciplinas, did, valor);
      const depois = S.disciplinas[did] || 0;
      if (depois < antes && S.poderes[did]) S.poderes[did] = S.poderes[did].slice(0, depois);
      render(); return;
    }
  }
});

/* inputs */
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.campo) { S[el.dataset.campo] = el.value; salvar(); }
  else if (el.dataset.caminho) { definirEm(S, el.dataset.caminho, el.value); sincronizarMatilha(S); salvar(); }
  else if (el.dataset.lista) { S[el.dataset.lista][+el.dataset.idx] = el.value; salvar(); }
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.campo) { S[el.dataset.campo] = el.value; salvar(); }
  else if (el.dataset.caminho) { definirEm(S, el.dataset.caminho, el.value); sincronizarMatilha(S); salvar(); }
});

/* ------------------------------------------------------------
   EXPORTAR / IMPORTAR
   ------------------------------------------------------------ */
function baixar(nome, conteudo, tipo) {
  const b = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = url; a.download = nome; document.body.appendChild(a); a.click();
  a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const slug = () => (S.nome || 'ficha').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();

function exportarJSON() {
  baixar(`vitae-${slug()}.json`, JSON.stringify(S, null, 2), 'application/json');
  toast('Ficha exportada.');
}

function exportarTXT() {
  const d = derivados(S), c = clan(), p = predador();
  const pts = (o, l) => l.filter(x => o[x.id]).map(x => `  ${x.nome} ${'●'.repeat(o[x.id])}`).join('\n');
  const L = [];
  L.push('═'.repeat(52));
  L.push(`  ${(S.nome || 'SEM NOME').toUpperCase()}`);
  L.push(`  ${c?.nome || '—'} · ${S.geracao}ª geração · ${p?.nome || '—'}`);
  L.push('═'.repeat(52));
  L.push(`\nConceito: ${S.conceito || '—'}\nSenhor: ${S.senhor || '—'}\nSexo: ${nomeSexo(S.sexo)}`);
  L.push(`\nVitalidade ${d.vitalidade} · Força de Vontade ${d.vontade} · Humanidade ${d.humanidade}`);
  L.push(`Fome ${S.fome} · Potência de Sangue ${d.potencia}`);
  L.push('\n── ATRIBUTOS ──');
  Object.values(ATRIBUTOS).forEach(g => { L.push(` ${g.rotulo}`); L.push(pts(S.atributos, g.lista)); });
  L.push('\n── HABILIDADES ──');
  Object.values(HABILIDADES).forEach(g => {
    const t = g.lista.filter(x => S.habilidades[x.id])
      .map(x => `  ${x.nome}${S.especializacoes[x.id] ? ` (${S.especializacoes[x.id]})` : ''} ${'●'.repeat(S.habilidades[x.id])}`).join('\n');
    if (t) { L.push(` ${g.rotulo}`); L.push(t); }
  });
  L.push('\n── DISCIPLINAS ──');
  Object.entries(S.disciplinas).forEach(([id, v]) => {
    L.push(`  ${(DISCIPLINAS[id] || {}).nome || id} ${'●'.repeat(v)}`);
    (S.poderes[id] || []).forEach(n => L.push(`    · ${n}`));
  });
  if (S.rituais.length) L.push(`  Rituais: ${S.rituais.join(', ')}`);
  L.push('\n── VANTAGENS ──');
  ANTECEDENTES.filter(a => S.antecedentes[a.id]).forEach(a => L.push(`  ${a.nome} ${'●'.repeat(S.antecedentes[a.id])}`));
  MERITOS.filter(m => S.meritos[m.id]).forEach(m => L.push(`  ${m.nome} (${S.meritos[m.id]})`));
  p?.vantagens.forEach(v => L.push(`  ${v.nome} (${v.pontos}) [predador]`));
  L.push('\n── DEFEITOS ──');
  DEFEITOS.filter(m => S.defeitos[m.id]).forEach(m => L.push(`  ${m.nome} (${S.defeitos[m.id]})`));
  p?.defeitos.forEach(v => L.push(`  ${v.nome} [predador]`));
  if (S.seita) {
    const pf = perfil();
    L.push(`\n── LEALDADE ──\n  ${pf.nome} · ${Seitas.resumo(S, typeof Matilha !== 'undefined' ? Matilha.de(S) : null) || '—'}`);
    L.push(`  Bússola: ${pf.bussola.rotulo}`);
    Seitas.defeitosImpostos(S).forEach(x => L.push(`  ${x.nome} [imposto pela seita]`));
  }
  L.push('\n── ALMA ──');
  const ancora = (i) => {
    const pf = perfil();
    if (pf.ancoras.tipo !== 'ritae') return S.marcos[i] || '—';
    const d = dadosSeita();
    const r = RITAE.find(x => x.id === (d.conviccoesRitae || [])[i]);
    return (r ? r.nome : '—') + ((d.implementos || [])[i] ? ` (${d.implementos[i]})` : '');
  };
  S.conviccoes.forEach((cv, i) => { if (cv) L.push(`  ${cv}  →  ${perfil().ancoras.rotulo}: ${ancora(i)}`); });
  L.push(`  Ambição: ${S.ambicao || '—'}`);
  L.push(`  Desejo: ${S.desejo || '—'}`);
  if (c) {
    L.push(`\n── MALDIÇÃO (${c.maldicao.nome}) ──\n  ${c.maldicao.texto}`);
    L.push(`\n── COMPULSÃO (${c.compulsao.nome}) ──\n  ${c.compulsao.texto}`);
  }
  if (S.aparencia) L.push(`\n── APARÊNCIA ──\n  ${S.aparencia}`);
  if (S.historia)  L.push(`\n── HISTÓRIA ──\n  ${S.historia}`);
  baixar(`vitae-${slug()}.txt`, L.join('\n'), 'text/plain;charset=utf-8');
  toast('Ficha exportada em texto.');
}

function importarJSON() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        S = migrarFicha(Object.assign(FICHA_VAZIA(), JSON.parse(fr.result)));
        passo = PASSOS.length - 1; render(); toast('Ficha importada.');
      } catch (err) { toast('Arquivo inválido.'); }
    };
    fr.readAsText(f);
  };
  inp.click();
}

/* ------------------------------------------------------------
   INÍCIO
   ------------------------------------------------------------ */
renderCapa();

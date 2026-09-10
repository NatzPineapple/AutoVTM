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

/* A CAÇA VEM ANTES DO OFÍCIO E DOS DONS.  (§71, item 1)

   Estava depois, e a consequência era visível no próprio texto do
   painel do Predador: ele mandava "escolha e VOLTE ao passo dos Dons
   para selecionar o poder correspondente". O Tipo de Predador dá uma
   especialização gratuita, um ponto de Disciplina, Vantagens e
   Defeitos — bônus que os dois passos seguintes gastam. Chegando
   depois, ele obrigava o jogador a voltar.

   Agora o Predador é o passo IV, e Ofício e Dons já abrem com a cota
   corrigida. */
const PASSOS = [
  { id: 'cronica',    rotulo: 'Sobre' },
  { id: 'cla',        rotulo: 'O Sangue' },
  { id: 'atributos',  rotulo: 'O Corpo' },
  { id: 'predador',   rotulo: 'A Caça' },
  { id: 'habilidades',rotulo: 'O Ofício' },
  { id: 'disciplinas',rotulo: 'Os Dons' },
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
/* ------------------------------------------------------------
   O PAINEL NÃO É A PÁGINA  (§71, item 3)

   `render()` reescrevia `#app` inteiro e dava `scrollTo(0)` em TODA
   ação — marcar um ponto de Atributo, ligar um chip, escolher um
   poder. O efeito para quem usa é o de recarregar a página: a lista
   pula para o topo e você perde o lugar onde estava.

   Agora, quando o PASSO não mudou, só o miolo do painel é trocado e
   a rolagem fica onde estava. Trocar de passo continua reconstruindo
   tudo e subindo — ali a página realmente mudou.

   Sem framework (§16.2): é a mesma string de HTML, colocada num nó
   menor. Campos de texto não sofrem com isso porque não chamam
   `render()` — o handler de `input` só grava e salva.
   ------------------------------------------------------------ */
let ultimoPassoRenderizado = null;

function render() {
  const trocouDePasso = ultimoPassoRenderizado !== passo;
  const rolagem = window.scrollY;

  const trilha = PASSOS.map((p, i) => `
    <div class="trilha-item ${i === passo ? 'ativo' : ''} ${i < passo ? 'feito' : ''}"
         data-acao="ir" data-id="${i}">${i + 1}. ${p.rotulo}</div>`).join('');

  const painel = {
    cronica: painelCronica, cla: painelCla, atributos: painelAtributos,
    habilidades: painelHabilidades, disciplinas: painelDisciplinas,
    predador: painelPredador, vantagens: painelVantagens,
    alma: painelAlma, ficha: painelFicha
  }[PASSOS[passo].id]();

  const corpo = $('#painel-corpo');
  if (!trocouDePasso && corpo) {
    corpo.innerHTML = painel;
    ultimoPassoRenderizado = passo;
    ajustarEscalaOficial();
    window.scrollTo(0, rolagem);
    salvar();
    return;
  }

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
    <main class="wrap"><div class="painel"><div id="painel-corpo">${painel}</div>
      <div class="navegar">
        <button class="btn" data-acao="anterior" ${passo === 0 ? 'disabled' : ''}>← Anterior</button>
        <span class="quiet">${passo + 1} de ${PASSOS.length}</span>
        <button class="btn primario" data-acao="proximo" ${passo === PASSOS.length - 1 ? 'disabled' : ''}>Próximo →</button>
      </div>
    </div></main>`;
  ultimoPassoRenderizado = passo;
  /* Trocou de passo: sobe, na hora. Duas coisas medidas aqui (§71):

     — NÃO dentro de `requestAnimationFrame`: em aba oculta o quadro
       não vem, o callback nunca roda e a página fica onde estava.
     — NÃO com `behavior: 'smooth'`: a animação é cancelada pela troca
       de `innerHTML` que acabou de acontecer, e a rolagem ficava
       parada em 900. Era assim ANTES desta seção também — o "sobe ao
       trocar de passo" só funcionava quando a página era curta. */
  window.scrollTo(0, 0);
  ajustarEscalaOficial();
  salvar();
}

/* ------------------------------------------------------------
   CAPA E LORE
   ------------------------------------------------------------ */
/* A FICHA EM ANDAMENTO, SE HOUVER.  (§92)

   `carregar()` restaura `{S, passo}` do `localStorage` e existia desde
   sempre — com uma ação `continuar` para chamá-la e **nenhum botão que
   a acionasse**. Era uma ação morta, do mesmo tipo das tabelas que a
   §67, a §90 e a §91 acharam: o caminho existia até a metade.

   Sem esse botão, "Criar personagem" era o único jeito de entrar no
   criador, e por isso ele não podia limpar nada. Com ele, os dois
   caminhos ficam separados e cada um faz o que o nome diz. */
function fichaEmAndamento() {
  try {
    const raw = localStorage.getItem('vitae:ficha');
    if (!raw) return null;
    const d = JSON.parse(raw);
    const f = d && d.S;
    /* Ficha sem nome e sem clã é criador aberto e não preenchido: não
       vale oferecer "continuar" o nada. */
    if (!f || (!f.nome && !f.cla)) return null;
    return { nome: f.nome, cla: f.cla, passo: d.passo || 0 };
  } catch (e) {
    console.warn('não deu para ler a ficha em andamento:', e && e.message);
    return null;
  }
}

/* ------------------------------------------------------------
   OS TRÊS VERBOS DO CRIADOR  (§92)

   Eles moram aqui fora, e não dentro do `switch` do ouvinte de
   clique, pela lição da §91: regra escondida num `case` não tem como
   ser testada sem simular clique — e a mutação passa em verde.
   ------------------------------------------------------------ */

/* COMEÇAR. Um personagem novo é uma ficha nova — e o criador tem UMA
   vaga, então começar outro descarta o que estava nela.

   A primeira versão desta correção zerava e salvava por cima, e assim
   apagava a ficha em andamento em silêncio: pior do que o defeito que
   ela veio consertar. Quem mostrou foi o teste no navegador — depois
   de "começar de novo", a capa parava de oferecer "Continuar", porque
   não havia mais o que continuar.

   Dois cliques, como a §37.4 manda e como já fazem `reiniciar`,
   `apagar-sessao` e `desligar-tudo`. Sem ficha em andamento não há
   pergunta: o caso comum não paga por isto. */
function comecarNovaFicha() {
  const emAndamento = fichaEmAndamento();
  if (emAndamento && !novaArmada) {
    novaArmada = true;
    return { armou: true, criou: false,
      aviso: `Há uma ficha em andamento${emAndamento.nome ? ` — ${emAndamento.nome}` : ''}. `
           + 'Clique de novo para descartá-la, ou use Continuar.' };
  }
  novaArmada = false;
  novaFicha();
  return { armou: false, criou: true, aviso: '' };
}

function novaFicha() {
  S = FICHA_VAZIA();
  passo = 0;
  salvar();
  return S;
}

/* FINALIZAR. Guarda na biblioteca **e** limpa o criador. Só limpa se
   guardou: perder a ficha porque o armazenamento recusou seria trocar
   um incômodo por um estrago. */
function finalizarFicha() {
  if (!S.nome || !S.cla) {
    return { finalizou: false, aviso: 'Dê um nome e um clã antes de finalizar.' };
  }
  const { problemas } = pendenciasDaFicha(S);
  const nome = S.nome;
  if (!guardarFicha(S)) {
    return { finalizou: false, aviso: 'Não consegui guardar — o armazenamento recusou.' };
  }
  if (typeof Ponte !== 'undefined') Ponte.guardarFicha(S);

  S = FICHA_VAZIA();
  passo = 0;
  /* O criador zera de verdade: sem isto, "Continuar" na capa
     ofereceria a ficha que acabou de ser finalizada. */
  try { localStorage.removeItem('vitae:ficha'); }
  catch (e) { console.warn('não deu para limpar o criador:', e && e.message); }

  return { finalizou: true, nome, pendencias: problemas.length,
    aviso: problemas.length
      ? `${nome} foi para a biblioteca com ${problemas.length} pendência(s). O criador está limpo.`
      : `${nome} foi para a biblioteca. O criador está limpo.` };
}

function renderCapa() {
  /* Sai da trilha do criador: o próximo render() reconstrói tudo (§71). */
  ultimoPassoRenderizado = null;
  const emAndamento = fichaEmAndamento();
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
      <button class="btn primario" data-acao="comecar">${novaArmada
        ? 'Descartar a em andamento e criar?' : 'Criar personagem'}</button>
      ${emAndamento ? `<button class="btn" data-acao="continuar">Continuar ${
        esc(emAndamento.nome || 'a ficha em andamento')}</button>` : ''}
      <button class="btn" data-acao="fichas">Fichas</button>
      <button class="btn" data-acao="mesa">Jogar uma noite</button>
      <button class="btn" data-acao="lore">O Brasil das Trevas</button>
      <button class="btn fantasma" data-acao="importar">Importar .json</button>
    </div>
    ${painelSistemasHTML()}
    <p class="capa-fonte">Cenário compilado dos manuais em português e da pesquisa de<br>
    velhinhodorpg.com sobre as cidades brasileiras no Mundo das Trevas</p>
  </div>`;
  /* A sondagem é assíncrona e não pode segurar o desenho da capa. */
  sondarSistemas();
  /* E a Ponte descobre os módulos e traz o que o navegador não tem.
     Também assíncrono, e pelo mesmo motivo. (§85) */
  ligarPonte();
}

/* ------------------------------------------------------------
   O PAINEL DOS SISTEMAS  (§75)

   Uma pergunta só: **o que está ligado?** — com o botão que liga o
   que falta.

   O limite é honesto e está escrito na tela: a página não sobe o
   próprio servidor. Se o proxy não responde, é ele que falta, e o
   painel mostra o comando em vez de fingir que tenta. Quem liga tudo
   do zero é `iniciar.cmd`, na raiz do projeto.
   ------------------------------------------------------------ */
let sistemas = { estado: 'sondando', linhas: [], modulos: [], passos: [], erro: '' };
let desligarArmado = false;

function painelSistemasHTML() {
  const luz = (l) => `
    <div class="sis-linha ${l.ligado ? 'on' : 'off'}" title="${esc(l.nota || '')}">
      <span class="sis-luz"></span>
      <span class="sis-nome">${esc(l.nome)}</span>
      <span class="sis-detalhe">${esc(l.detalhe || '')}</span>
    </div>`;

  /* A CONFERÊNCIA APARECE NA LINHA DO ÁRBITRO.  (§87, item M8)

     O Módulo 4 devolve a mesma resposta que o navegador calcula — é o
     mesmo código. Então o que vale mostrar dele não é "respondeu": é se
     as duas cópias CONCORDARAM. Divergência aqui quer dizer `.js` velho
     em cache (a §36) ou módulo numa versão diferente, e é a única coisa
     que o jogador precisa saber sobre este módulo. */
  const detalheDoModulo = (m) => {
    if (m.id !== 'arbitro' || !m.ligado) return m.detalhe || '';
    const d = (typeof Ponte !== 'undefined') ? Ponte.divergencias : 0;
    return d ? `${d} divergência(s) — recarregue` : m.detalhe || '';
  };

  /* Dois estados, e não três. A luz oca da §80 existia para os módulos
     que eram porta reservada sem processo atrás; desde a §84 os cinco
     existem, e um estado que nunca ocorre é folclore. */
  const luzDeModulo = (m) => `
    <div class="sis-linha ${m.ligado ? 'on' : 'off'}" title="${esc(m.nota || '')}">
      <span class="sis-luz"></span>
      <span class="sis-nome">${esc(m.numero)}. ${esc(m.nome)}</span>
      <span class="sis-detalhe">${esc(detalheDoModulo(m))}</span>
    </div>`;

  if (sistemas.estado === 'sondando') {
    return `<div class="sistemas"><div class="sis-cabeca">Sistemas</div>
      <p class="quiet" style="margin:0">Vendo o que está de pé…</p></div>`;
  }

  if (sistemas.estado === 'sem-servidor') {
    /* `location` não existe no vm dos testes, e o painel é desenhado
       lá para conferir o HTML. Sem servidor é o caso de fallback. */
    const arquivo = typeof location === 'undefined'
      || !/^https?:$/.test(location.protocol);
    return `<div class="sistemas falta">
      <div class="sis-cabeca">Sistemas — <b>o servidor não está no ar</b></div>
      <p class="quiet" style="margin:.2rem 0 .6rem">${arquivo
        ? 'O app está aberto como <b>arquivo</b>. Sem servidor não há campanha nem IA.'
        : 'Nada respondeu em <code>/api</code>. O proxy caiu, ou o app está noutra porta.'}</p>
      <p class="quiet" style="margin:0 0 .6rem">Uma página de navegador não liga processo do
      sistema. Rode isto uma vez — ou dê dois cliques em <code>iniciar.cmd</code>:</p>
      <pre class="sis-cmd">node modulos/gateway/proxy.mjs</pre>
      <p class="quiet" style="margin:.5rem 0 0">Depois abra <code>http://localhost:5173</code>.</p>
      <button class="btn fantasma" data-acao="sondar-sistemas">Procurar de novo</button>
    </div>`;
  }

  if (sistemas.estado === 'encerrado') {
    return `<div class="sistemas falta">
      <div class="sis-cabeca">Sistemas — <b>desligados</b></div>
      <p class="quiet" style="margin:.2rem 0 .6rem">O servidor foi encerrado a seu pedido. Esta
      página não fala mais com nada — o que já está na tela continua aí, e nada mais é salvo.</p>
      <p class="quiet" style="margin:0 0 .6rem">Para voltar, dois cliques em <code>iniciar.cmd</code>,
      ou:</p>
      <pre class="sis-cmd">node modulos/gateway/proxy.mjs</pre>
    </div>`;
  }

  const modulos = sistemas.modulos || [];
  const modulosFora = modulos.filter(m => !m.ligado);
  const faltando = sistemas.linhas.filter(l => !l.ligado).concat(modulosFora);
  const ocupado = sistemas.estado === 'ligando' || sistemas.estado === 'desligando';
  return `<div class="sistemas ${faltando.length ? 'falta' : 'ok'}">
    <div class="sis-cabeca">Sistemas${faltando.length
      ? ` — <b>${faltando.length} fora</b>` : ' — <b>tudo ligado</b>'}</div>
    ${modulos.length ? `<div class="sis-titulo">Processos</div>
      <div class="sis-grade">${modulos.map(luzDeModulo).join('')}</div>
      <div class="sis-titulo">Recursos</div>` : ''}
    <div class="sis-grade">${sistemas.linhas.map(luz).join('')}</div>
    ${faltando.length ? `<div class="sis-faltando">${faltando
      .map(l => `<div>· <b>${esc(l.nome)}</b>: ${esc(l.faltando || l.nota || '')}</div>`).join('')}</div>` : ''}
    ${sistemas.passos.length ? `<div class="sis-faltando">${sistemas.passos
      .map(p => `<div>${p.ok ? '✓' : '✕'} ${esc(p.texto)}</div>`).join('')}</div>` : ''}
    <div class="chips" style="margin-top:.7rem">
      <button class="btn ${faltando.length ? 'primario' : 'fantasma'}"
        data-acao="ligar-sistemas" ${ocupado ? 'disabled' : ''}>${
        sistemas.estado === 'ligando' ? 'Ligando…' : 'Ligar tudo'}</button>
      ${botoesDeDesligar(ocupado)}
      <button class="btn fantasma" data-acao="sondar-sistemas" ${ocupado ? 'disabled' : ''}>Conferir de novo</button>
    </div>
  </div>`;
}

/* Desligar é liberar memória: um 12B carregado ocupa vários gigabytes.
   Dois botões, porque são duas decisões diferentes — e o segundo pede
   DOIS CLIQUES, no padrão do projeto (§37.4: a confirmação vive na
   interface, nunca no `confirm()` do navegador). */
function botoesDeDesligar(ocupado) {
  const ollamaLigado = sistemas.linhas.some(l => l.id === 'ollama' && l.ligado);
  const desligando = sistemas.estado === 'desligando';
  const partes = [];

  if (ollamaLigado) {
    partes.push(`<button class="btn fantasma" data-acao="desligar-modelo" ${ocupado ? 'disabled' : ''}
      title="Encerra o ollama e devolve a memória. O jogo continua no modo determinístico.">${
      desligando ? 'Desligando…' : 'Desligar o modelo'}</button>`);
  }

  partes.push(desligarArmado
    ? `${avisoDeSessaoViva()}
       <button class="btn primario" data-acao="desligar-tudo"
         title="Isto encerra o servidor: a página para de funcionar.">Desligar mesmo</button>
       <button class="btn fantasma" data-acao="cancelar-desligar">↩</button>`
    : `<button class="btn fantasma" data-acao="desligar-tudo" ${ocupado ? 'disabled' : ''}
         title="Encerra o modelo E o servidor. A página para de funcionar.">Desligar tudo</button>`);

  return partes.join('');
}

/* O AVISO DE SESSÃO VIVA.  (§86, item M7)

   Nada se perde ao desligar: o MesaServer grava tudo antes de sair, e
   há teste da §80 afirmando isso. Mas quem clica "Desligar tudo" no meio
   de uma noite só descobria que havia noite em andamento DEPOIS, no
   relatório — e "nada se perde" é uma garantia que o jogador não tem
   como conhecer no instante em que hesita.

   O número já existia em `/mesa/saude`; o que faltava era ele chegar
   aqui. O aviso NÃO impede: dizer "não posso" seria pior que dizer o
   que vai acontecer. */
function avisoDeSessaoViva() {
  const vivas = (sistemas.modulos || []).reduce((a, m) => a + (m.sessoesVivas || 0), 0);
  if (!vivas) return '';
  return `<div class="sis-faltando" style="width:100%">
    <div>· <b>${vivas} sessão(ões) em andamento.</b> Elas são gravadas antes de o
    servidor sair — nada se perde —, mas a mesa fecha junto.</div>
  </div>`;
}

function redesenharSistemas() {
  const alvo = document.querySelector('.sistemas');
  if (!alvo) return;
  alvo.outerHTML = painelSistemasHTML();
}

/* LIGA A PONTE E TRAZ AS FICHAS DO SERVIDOR.  (§85, item M2)

   Roda uma vez, na abertura. Se o FichaServer tiver ficha que este
   navegador não tem — outra máquina, outro perfil, o localStorage
   limpo —, ela entra na biblioteca local e a tela se refaz.

   O sentido inverso está na ação `guardar-ficha`, e a regra de quem
   vence está na Ponte: o servidor só sobrepõe quando a cópia dele é
   MAIS NOVA. Sem isso, abrir o app desfaria a última edição feita
   offline — que é o pior defeito possível numa sincronização. */
let ponteLigada = false;

async function ligarPonte() {
  if (ponteLigada) return;
  ponteLigada = true;
  await Ponte.descobrir();
  if (!Ponte.fichaServer) return;
  const r = await Ponte.sincronizarFichas();
  if (r.novas > 0) {
    if (typeof toast === 'function') {
      toast(`${r.novas} ficha${r.novas === 1 ? '' : 's'} ${r.novas === 1 ? 'veio' : 'vieram'} do servidor.`);
    }
    /* Só redesenha se a biblioteca estiver na tela. Chamar `renderFichas`
       por cima do criador jogaria o jogador para fora do passo em que ele
       estava — o defeito que a §71 fechou, de outro jeito. */
    const alvo = document.querySelector('.sessao-cartao');
    if (alvo) renderFichas();
  }
}

async function sondarSistemas() {
  try {
    const r = await fetch('/api/sistemas', { cache: 'no-store' });
    if (!r.ok) throw new Error('sem proxy');
    const d = await r.json();
    sistemas = { estado: 'lido', linhas: d.linhas, modulos: d.modulos || [], passos: [], erro: '' };
  } catch (e) {
    sistemas = { estado: 'sem-servidor', linhas: [], modulos: [], passos: [], erro: e.message };
  }
  redesenharSistemas();
}

/* AS LUZES ACENDEM ENQUANTO ESPERAM.  (§80)

   `/api/ligar` é UMA resposta no fim de tudo, e as coisas que ela liga
   têm durações muito diferentes: o MesaServer sobe em menos de um
   segundo, e o ollama pode levar meio minuto na primeira partida.
   Medido: o módulo já estava de pé e o painel continuou dizendo
   "Ligando…" por 25 s, sem sinal de que alguma coisa tinha andado.

   A sondagem paralela resolve sem inventar protocolo: enquanto o POST
   não volta, pergunta-se `/api/sistemas` de dois em dois segundos e
   redesenham-se só as luzes. O botão continua ocupado — porque ainda
   está —, e o jogador vê o que já subiu. */
/* Parametrizado para o teste poder medir o comportamento sem pagar
   dois segundos por asserção — a §52.3 já registrou o que espera que
   não afirma nada custa à suíte. */
const INTERVALO_DA_SONDA = 2000;

function sondarEnquantoLiga(intervaloMs = INTERVALO_DA_SONDA) {
  const relogio = setInterval(async () => {
    if (sistemas.estado !== 'ligando' && sistemas.estado !== 'desligando') {
      clearInterval(relogio);
      return;
    }
    try {
      const r = await fetch('/api/sistemas', { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      if (sistemas.estado !== 'ligando' && sistemas.estado !== 'desligando') return;
      sistemas = Object.assign({}, sistemas, { linhas: d.linhas, modulos: d.modulos || [] });
      redesenharSistemas();
    } catch (e) {
      /* O servidor pode ter saído no meio — é o caso normal de
         "desligar tudo", e não um defeito. Quem mostra isso ao
         jogador é quem chamou, pelo estado 'encerrado'; aqui a sonda
         só para e deixa rastro no console para quem estiver olhando. */
      console.warn('[sistemas] a sonda parou: o servidor não respondeu —', e.message);
      clearInterval(relogio);
    }
  }, intervaloMs);
  return () => clearInterval(relogio);
}

async function ligarSistemas() {
  sistemas = Object.assign({}, sistemas, { estado: 'ligando' });
  redesenharSistemas();
  const pararSonda = sondarEnquantoLiga();
  try {
    const r = await fetch('/api/ligar', { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: '{}' });
    pararSonda();
    if (!r.ok) throw new Error('sem proxy');
    const d = await r.json();
    sistemas = { estado: 'lido', linhas: d.linhas, modulos: d.modulos || [],
                 passos: d.passos || [], erro: '' };
    /* Ligou o modelo agora: quem já tinha detectado "simulado" precisa
       ser avisado, senão a mesa só muda no F5. */
    if (typeof Narrador !== 'undefined' && Narrador.detectar) Narrador.detectar();
    if (typeof Cronista !== 'undefined' && Cronista.verificar) Cronista.verificar();
  } catch (e) {
    pararSonda();
    sistemas = { estado: 'sem-servidor', linhas: [], modulos: [], passos: [], erro: e.message };
  }
  redesenharSistemas();
}

/* `servidor: true` encerra o processo que serve esta página. A resposta
   vem ANTES da saída, então o relatório chega; depois disso o app fica
   sem nada atrás, e o painel passa a dizer isso em vez de fingir. */
async function desligarSistemas({ servidor = false } = {}) {
  sistemas = Object.assign({}, sistemas, { estado: 'desligando' });
  desligarArmado = false;
  redesenharSistemas();
  try {
    const r = await fetch('/api/desligar', { method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ollama: true, servidor }) });
    const d = await r.json();
    if (!r.ok) {
      /* 409: há chamada ao modelo em andamento. Não é falha do botão. */
      sistemas = Object.assign({}, sistemas, { estado: 'lido',
        passos: [{ ok: false, texto: d.erro || `HTTP ${r.status}` }] });
      redesenharSistemas();
      return;
    }
    if (d.servidorEncerrado) {
      sistemas = { estado: 'encerrado', linhas: [], modulos: [], passos: d.passos || [], erro: '' };
    } else {
      sistemas = { estado: 'lido', linhas: d.linhas, modulos: d.modulos || [],
                   passos: d.passos || [], erro: '' };
      if (typeof Narrador !== 'undefined' && Narrador.detectar) Narrador.detectar();
      if (typeof Cronista !== 'undefined' && Cronista.verificar) Cronista.verificar();
    }
  } catch (e) {
    /* Sem resposta depois de mandar encerrar o servidor é o esperado. */
    sistemas = servidor
      ? { estado: 'encerrado', linhas: [], modulos: [], passos: [], erro: '' }
      : { estado: 'sem-servidor', linhas: [], modulos: [], passos: [], erro: e.message };
  }
  redesenharSistemas();
}

let fichaAberta = '';
let fichaParaApagar = '';
let reiniciarArmado = false;
/* §92 — "Criar personagem" pergunta uma vez quando há ficha em
   andamento, e só então descarta. */
let novaArmada = false;

function renderFichas() {
  /* Sai da trilha do criador: o próximo render() reconstrói tudo (§71). */
  ultimoPassoRenderizado = null;
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
  /* Sai da trilha do criador: o próximo render() reconstrói tudo (§71). */
  ultimoPassoRenderizado = null;
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
  if (novaArmada && acao !== 'comecar') novaArmada = false;

  switch (true) {
    /* "CRIAR PERSONAGEM" CRIA UM PERSONAGEM.  (§92)

       Ele só mexia no `passo`, e deixava o `S` de pé — então quem
       guardasse uma ficha e clicasse aqui de novo continuava editando
       a mesma, sem aviso. A ficha em andamento não se perde: ela
       continua no `localStorage`, e a capa oferece "Continuar" quando
       existe uma. */
    /* E ele PERGUNTA quando há trabalho em andamento.

       A primeira versão desta correção zerava o `S` e salvava por cima
       — e com isso "Criar personagem" apagava a ficha em andamento em
       silêncio, que é pior do que o defeito que ela veio consertar. O
       teste no navegador mostrou: depois de começar de novo, a capa
       parava de oferecer "Continuar", porque não havia mais o que
       continuar.

       Dois cliques, como manda a §37.4 e como já fazem `reiniciar`,
       `apagar-sessao` e `desligar-tudo`. Sem ficha em andamento não há
       pergunta: o caso comum não paga por isto. */
    case acao === 'comecar': {
      const r = comecarNovaFicha();
      if (r.armou) { renderCapa(); toast(r.aviso); return; }
      render(); return;
    }

    case acao === 'continuar': carregar(); render(); return;
    case acao === 'capa':      renderCapa(); return;

    /* §75 — o painel de sistemas da capa. */
    case acao === 'sondar-sistemas': desligarArmado = false; sondarSistemas(); return;
    case acao === 'ligar-sistemas':  desligarArmado = false; ligarSistemas();  return;
    case acao === 'desligar-modelo': desligarSistemas({ servidor: false }); return;
    case acao === 'cancelar-desligar': desligarArmado = false; redesenharSistemas(); return;

    /* Dois cliques, como manda a §37.4: a confirmação vive na interface. */
    case acao === 'desligar-tudo':
      if (!desligarArmado) { desligarArmado = true; redesenharSistemas();
                             toast('Isto encerra o servidor. Clique de novo.'); return; }
      desligarSistemas({ servidor: true }); return;
    case acao === 'lore':      renderLore(); return;
    case acao === 'mesa':      abrirMesa(); return;
    case acao === 'voltarapp': render(); return;
    case acao === 'fichas':    renderFichas(); return;

    case acao === 'guardar-ficha': {
      const { problemas } = pendenciasDaFicha(S);
      if (!S.nome || !S.cla) { toast('Dê um nome e um clã antes de guardar.'); return; }
      const guardado = guardarFicha(S);
      if (!guardado) { toast('Não consegui guardar — o armazenamento recusou.'); return; }
      /* E espelha no Módulo 2, se ele estiver de pé. Sem esperar: a ficha
         JÁ está gravada aqui, e o servidor é a segunda cópia, não a
         primeira. (§85) */
      Ponte.guardarFicha(S);
      salvar();
      toast(problemas.length
        ? `Guardada com ${problemas.length} pendência(s).`
        : 'Ficha guardada na biblioteca.');
      render(); return;
    }

    /* FINALIZAR = GUARDAR **E** SAIR.  (§92)

       O criador tinha dois botões e faltava o do meio:

         "Guardar na biblioteca"  grava e continua editando;
         "Começar de novo"        limpa e NÃO grava.

       Não havia como dizer "terminei" — e como guardar não limpava, a
       ficha ficava aberta no criador depois de pronta. O próximo
       personagem começava por cima do anterior, o que é o defeito
       que se via: "a ficha editada está ficando salva no criador".

       Aqui não há duplo clique de confirmação, e é de propósito: isto
       não destrói nada. A ficha vai para a biblioteca ANTES de o
       criador ser limpo, e só é limpo se a gravação deu certo. */
    case acao === 'finalizar-ficha': {
      const r = finalizarFicha();
      toast(r.aviso);
      if (r.finalizou) renderCapa();
      return;
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
      Ponte.apagarFicha(id);
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

    /* ----------------------------------------------------------
       A VIDA HUMANA  (§91, págs. 145–146)

       Enquanto o jogador monta, nada é escrito na ficha: `S.vidaHumana`
       guarda as escolhas e `Criacao.montar` faz a conta. Só o botão
       "Levar isto para a ficha" grava — e é aí que a distribuição
       correspondente é ligada, porque é ela que o resto do criador
       usa para contar cotas.
       ---------------------------------------------------------- */
    case acao === 'vida-prof':
      S.vidaHumana.profissao = S.vidaHumana.profissao === id ? '' : id;
      S.vidaHumana.opcoes = {};
      render(); return;

    case acao === 'vida-evento':
      S.vidaHumana.evento = S.vidaHumana.evento === id ? '' : id;
      delete S.vidaHumana.opcoes.evento;
      render(); return;

    case acao === 'vida-hobby': {
      const lista = S.vidaHumana.passatempos;
      const i = lista.indexOf(id);
      if (i >= 0) lista.splice(i, 1);
      else if (lista.length < Criacao.QUANTOS_PASSATEMPOS) lista.push(id);
      else toast(`O livro pede ${Criacao.QUANTOS_PASSATEMPOS} passatempos.`);
      render(); return;
    }

    case acao === 'vida-opcao': {
      const corte = id.lastIndexOf('|');
      S.vidaHumana.opcoes[id.slice(0, corte)] = id.slice(corte + 1);
      render(); return;
    }

    case acao === 'vida-adicionais':
      S.vidaHumana.adicionais = S.vidaHumana.adicionais === id ? '' : id;
      render(); return;

    case acao === 'vida-aplicar': {
      const r = Criacao.montar(S.vidaHumana);
      if (r.falta.length) { toast(`Falta: ${r.falta.join(', ')}.`); return; }
      S.habilidades = Object.assign({}, r.pontos);
      /* A especialização profissional do livro, quando o pacote a
         nomeia — "as palavras entre parênteses representam
         especializações" (pág. 145). */
      (r.profissao.tres.concat(r.profissao.dois)).forEach(s => {
        if (!s.espec) return;
        const hid = s.fixo || (S.vidaHumana.opcoes[''] || (s.escolha || [])[0]);
        if (hid && S.habilidades[hid]) S.especializacoes[hid] = s.espec;
      });
      S.modoHabilidade = r.distribuicao;
      toast(`A vida ficou na ficha, na distribuição ${DIST_HABILIDADES[r.distribuicao].nome}. `
          + `Falta o que os Adicionais dão.`);
      render(); return;
    }

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

    /* A ESPECIALIZAÇÃO DO PREDADOR PODE VIR COM UM PONTO.  (§91)

       "Se um tipo de Predador adicionar uma especialização cuja
        Habilidade correspondente VOCÊ NÃO POSSUA, ganhe um ponto nessa
        Habilidade."                                (básico, pág. 149)

       Sem isso, o Predador entregava uma especialização pendurada numa
       Habilidade zerada — e especialização em Habilidade que ninguém
       tem é enfeite: ela só soma quando aquela Habilidade rola. O livro
       fecha esse buraco, e o motor não fechava.

       O ponto é do Predador, e por isso ele NÃO gasta cota de
       Habilidades: `pontoDoPredador` marca de onde ele veio, para a
       contagem do painel não o cobrar e para tirá-lo se o jogador
       trocar de especialização. */
    case acao === 'predespec': {
      const r = especializacaoDoPredador(S, S.predadorEspec === id ? '' : id);
      if (r.ganhouPonto) {
        toast(`${nomeHabilidade(r.habilidade)} estava em zero: o Predador dá o primeiro ponto (pág. 149).`);
      }
      render(); return;
    }

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

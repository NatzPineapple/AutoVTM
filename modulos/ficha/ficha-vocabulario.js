/* ============================================================
   VITÆ — Vocabulário da ficha
   O que uma ficha É, e as traduções de id para objeto de dados.
   Tudo aqui é puro: recebe ficha ou id, devolve valor, e não
   conhece criador, mesa nem tela.

   Este arquivo existe por causa dos itens F1 e F2 da §45.1. Estas
   funções moravam em `front/app.js` e usavam como padrão o `S`
   global — a ficha aberta no criador. O efeito era que a área
   Ficha não existia sem o front, e que validar uma ficha da
   biblioteca devolvia o resultado da ficha em edição.

   A regra daqui em diante é curta: **nada neste arquivo lê `S`.**
   Quem quer o padrão do criador usa os invólucros do front, que
   existem exatamente para isso e não fazem mais nada.
   ============================================================ */

const FICHA_VAZIA = () => ({
  // quem é
  nome: '', jogador: '', conceito: '', sexo: '', senhor: '', geracao: '13',
  cidade: '', seita: '',
  seitaDados: {},
  // clã
  cla: '',
  // atributos e habilidades
  atributos: {},
  modoHabilidade: '',
  habilidades: {},
  especializacoes: {},
  // disciplinas
  disciplinas: {},          // { id: nivel }
  poderes: {},              // { id: [nomes] }
  rituais: [],
  // predador
  predador: '',
  predadorDisciplina: '',
  predadorEspec: '',
  // vantagens
  antecedentes: {},         // { id: pontos }
  meritos: {},              // { id: pontos }
  defeitos: {},             // { id: pontos }
  // humanidade
  conviccoes: ['', '', ''],
  marcos: ['', '', ''],
  ambicao: '', desejo: '',
  /* `temperamento` entrou na §67: sem ele a regra da pág. 228 —
     temperamento intenso dá um dado na Disciplina correspondente —
     não tem como ser aplicada. Vazio significa "nenhum". */
  ressonancia: '', temperamento: '',
  // estado de jogo
  fome: 1, humanidadeMod: 0, danoSuperficial: 0, danoAgravado: 0, danoVontade: 0,
  // retrato e registro (campos do modelo oficial)
  aparencia: '', historia: '', tracos: '', notas: '', principios: '',
  idadeVerdadeira: '', idadeAparente: '', dataNascimento: '', dataMorte: '',
  xpTotal: '', xpGasta: '',
  /* §91 — a Habilidade que ganhou o ponto do Predador (pág. 149).
     Guardar QUAL permite tirá-lo se o jogador trocar de especialização,
     e mantê-lo fora da cota da distribuição escolhida. */
  pontoDoPredador: '',
  /* §91 — o que a experiência comprou de Potência de Sangue. */
  potenciaMod: 0,
  /* §91 — o método das págs. 145–146. Guarda as ESCOLHAS, e não os
     pontos: a conta é refeita a cada render, e só o botão de aplicar
     escreve em `habilidades`. */
  vidaHumana: { profissao: '', evento: '', passatempos: [], adicionais: '', opcoes: {} },
  vistaFicha: 'oficial'
});

/* ------------------------------------------------------------
   TRADUÇÕES — id para objeto de dados
   Sem argumento, devolvem null. Não existe "a ficha atual" aqui.
   ------------------------------------------------------------ */
function claDe(id)      { return CLAS.find(c => c.id === id) || null; }
function cidadeDe(id)   { return CIDADES.find(c => c.id === id) || null; }
function predadorDe(id) {
  const alvo = (typeof PREDADORES_RENOMEADOS !== 'undefined' && PREDADORES_RENOMEADOS[id]) || id;
  return PREDADORES.find(p => p.id === alvo) || null;
}

function perfilDe(f)      { return Seitas.perfil((f || {}).seita); }

/* §91 — Retentores virou Lacaios e Mentor virou Mawla, que são os
   nomes do livro (pág. 153). Ficha salva com o id velho não pode
   perder os pontos em silêncio: é a mesma migração que os Predadores
   ganharam na §77, pela mesma lição da §75.5.

   A conversão é feita NA FICHA, e não só na leitura, porque os pontos
   vivem num objeto indexado por id — ler por um nome e gravar por
   outro deixaria a ficha com as duas chaves. */
function migrarAntecedentes(f) {
  if (!f || !f.antecedentes || typeof ANTECEDENTES_RENOMEADOS === 'undefined') return f;
  for (const [velho, novo] of Object.entries(ANTECEDENTES_RENOMEADOS)) {
    if (!(velho in f.antecedentes)) continue;
    const pontos = f.antecedentes[velho] || 0;
    delete f.antecedentes[velho];
    if (pontos) f.antecedentes[novo] = Math.max(f.antecedentes[novo] || 0, pontos);
  }
  return f;
}

function antecedenteDe(id) {
  const alvo = (typeof ANTECEDENTES_RENOMEADOS !== 'undefined' && ANTECEDENTES_RENOMEADOS[id]) || id;
  return ANTECEDENTES.find(a => a.id === alvo) || null;
}

/* Traço para nome legível. `nomeHabilidade` já morava na área, em
   `ficha-regras.js`; `nomeAtributo` estava em `front/mesa-render.js`
   e era chamada por `motor-combate.js` e por `Arbitro.piscinaFinal`
   para montar o rótulo da rolagem — o Árbitro dependendo do front,
   que é o item A6 da §45.2. As duas são irmãs e agora moram juntas. */
function nomeAtributo(id) {
  const a = Object.values(ATRIBUTOS).flatMap(g => g.lista).find(x => x.id === id);
  return a ? a.nome : id;
}
function dadosSeitaDe(f)  { return Seitas.dados(f || {}); }

/* ------------------------------------------------------------
   PISCINA DE DADOS — item F2
   Reserva de dados é leitura de ficha: atributo + perícia, mais 1
   se houver especialização. Morava em `Dados.piscinaDe`, na área
   Árbitro, e por isso `motor-ficha.js` atravessava a fronteira em
   três pontos para calcular o Índice de Força.

   Agora mora aqui, e `Dados.piscinaDe` delega. Quem rola dado
   continua sendo o Árbitro; quem sabe ler a ficha é a Ficha.
   ------------------------------------------------------------ */
/* A ESPECIALIZAÇÃO NÃO É UM DADO DE GRAÇA.  (§73, item H1)

   Básico, pág. 159:

     "SE O NARRADOR DECIDIR que um personagem está tentando realizar
      uma tarefa QUE SE ENQUADRA em sua especialização, o jogador
      ganha um dado extra em sua parada de dados."

   Aqui ela era incondicional: quem tivesse "Lobisomens" em Briga
   ganhava o dado ao socar um segurança. Medido antes da §73 — sete
   dados nas duas ações, a que se enquadra e a que não.

   `casaEspecializacao` é o "se o Narrador decidir": um PREDICADO que
   o chamador fornece. A Ficha não sabe casar texto — isso é léxico, e
   léxico é do Árbitro. Sem predicado, o dado entra: é o caso da FOLHA,
   que mostra a parada de quando a especialização vale. */
function piscinaDaFicha(ficha, atributoId, periciaId, { casaEspecializacao = null } = {}) {
  const a = ((ficha || {}).atributos || {})[atributoId] || 0;
  const p = periciaId ? (((ficha || {}).habilidades || {})[periciaId] || 0) : 0;
  const nomeEsp = periciaId ? ((ficha || {}).especializacoes || {})[periciaId] || '' : '';
  const vale = !!nomeEsp && (!casaEspecializacao || !!casaEspecializacao(nomeEsp, periciaId));
  const esp = vale ? 1 : 0;
  return {
    total: a + p + esp,
    atributo: a, pericia: p, especializacao: esp,
    atributoId, periciaId, especializacaoNome: nomeEsp,
    /* Para a interface poder dizer "você TEM a especialização, mas ela
       não se aplica a isto" em vez de sumir com o dado em silêncio. */
    especializacaoDisponivel: !!nomeEsp, especializacaoAplicada: vale
  };
}

/* ------------------------------------------------------------
   ESCAPE
   Definição única do projeto. Morava em `front/app.js`, e
   `ficha-oficial.js` a usava de lá — mais um fio da inversão do
   F1. Fica aqui porque a Ficha carrega antes do front, e assim a
   dependência aponta para o lado certo: o front usa o que a Ficha
   define, nunca o contrário.

   Ela é a razão de o teste "escapa o que o jogador escreve"
   (§44.3) passar: nome com `<script>` sai como texto na folha.
   ------------------------------------------------------------ */
const esc = (t) => String(t ?? '').replace(/[&<>"']/g,
  c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

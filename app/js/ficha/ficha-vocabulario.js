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
  vistaFicha: 'oficial'
});

/* ------------------------------------------------------------
   TRADUÇÕES — id para objeto de dados
   Sem argumento, devolvem null. Não existe "a ficha atual" aqui.
   ------------------------------------------------------------ */
function claDe(id)      { return CLAS.find(c => c.id === id) || null; }
function cidadeDe(id)   { return CIDADES.find(c => c.id === id) || null; }
function predadorDe(id) { return PREDADORES.find(p => p.id === id) || null; }

function perfilDe(f)      { return Seitas.perfil((f || {}).seita); }

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
function piscinaDaFicha(ficha, atributoId, periciaId) {
  const a = ((ficha || {}).atributos || {})[atributoId] || 0;
  const p = periciaId ? (((ficha || {}).habilidades || {})[periciaId] || 0) : 0;
  const nomeEsp = periciaId ? ((ficha || {}).especializacoes || {})[periciaId] || '' : '';
  const esp = nomeEsp ? 1 : 0;
  return {
    total: a + p + esp,
    atributo: a, pericia: p, especializacao: esp,
    atributoId, periciaId, especializacaoNome: nomeEsp
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

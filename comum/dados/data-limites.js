/* ============================================================
   VITÆ — Linhas, Véus e a Carta X
   (básico, "Apêndice III: Orientação para o Jogo Ponderado",
    págs. 419–423)

   O apêndice inteiro é escrito para uma mesa física com gente
   em volta. Cinco das sete técnicas dependem disso e não têm
   contraparte aqui — estão listadas em `TECNICAS`, com o motivo,
   porque calar sobre elas seria fingir que o apêndice é menor do
   que é.

   Duas atravessam para um aplicativo sem perder nada:

     . a CARTA X, que num aplicativo é literalmente um botão;
     . LINHAS E VÉUS, que é uma lista do JOGADOR.

   A palavra "do jogador" é a regra inteira. O livro (pág. 421)
   manda o Narrador perguntar o que entra, deixa a lista editável
   a qualquer momento, e deixa um Véu virar Linha e vice-versa.
   Até a §89 este projeto tinha só o inverso disso: uma trava que
   EU escrevi, no `cenario.md` §10, que o jogador herda e não
   edita. Ela continua — como PISO, que um Narrador automático
   precisa ter mesmo quando ninguém declarou nada. O que faltava
   era o teto.
   ============================================================ */

/* Linha: não é tocada de modo algum, nem mencionada de passagem.
   Véu: pode acontecer, mas não é jogada — é tratada com um fade.
   As duas definições são do livro, pág. 421, e são o que vai para
   o prefixo do Narrador. */
const LIMITES_DEFINICAO = {
  linha: {
    nome: 'Linha', pagina: 421,
    curto: 'Não acontece, e não é mencionado nem de passagem.',
    aoModelo: 'NÃO PODE APARECER. Nem em cena, nem em descrição, nem citado de passagem, '
            + 'nem como passado de um personagem. Se a ficção estiver indo para lá, ela vai para outro lugar.'
  },
  veu: {
    nome: 'Véu', pagina: 421,
    curto: 'Pode acontecer, mas não é jogado: corta para depois.',
    aoModelo: 'PODE EXISTIR, mas não é encenado. Corte antes — vá direto ao que vem depois, '
            + 'ou ao que ficou como consequência. Nada de detalhe sensorial sobre isso.'
  }
};

/* As duas listas de exemplo do livro, pág. 421. Elas são SUGESTÃO,
   e é assim que a tela as oferece: um toque põe na lista, e nada
   entra sozinho. O livro chama a primeira de "Linhas comuns" e a
   segunda de "Véus comuns", mas ele mesmo diz que um pode virar o
   outro — então aqui elas são só dois pontos de partida. */
const LINHAS_COMUNS = [
  'Violência sexual',
  'Representação explícita de tortura',
  'Alimentação à força',
  'Inanição',
  'Racismo',
  'Estigma de gênero',
  'Aranhas',
  'Agulhas',
  'Bestialidade',
  'Representação explícita de necessidades corporais',
  'Sofrimento animal'
];

const VEUS_COMUNS = [
  'Representação explícita de atividade sexual consentida',
  'Tortura',
  'Abuso emocional',
  'Abuso físico',
  'Horror corporal',
  'Experimentação humana',
  'Sequências de sonhos ou pesadelos',
  'Memórias da infância',
  'Visões proféticas',
  'Morte de animais'
];

/* O apêndice tem sete técnicas. Duas viraram código; as outras
   cinco estão aqui declaradas, com o motivo — é a mesma regra de
   casa que a §88 usou para as oito Perdições que não chegam ao
   dado: divergência conhecida vale mais escrita do que escondida. */
const TECNICAS = [
  { id: 'carta_x', nome: 'A Carta X', pagina: 422, autor: 'John Stavropolous',
    estado: 'aplicada',
    nota: 'Um botão. Retira o que acabou de acontecer, sem exigir explicação, e o jogo segue.' },
  { id: 'linhas_veus', nome: 'Linhas e Véus', pagina: 421, autor: 'Ron Edwards',
    estado: 'aplicada',
    nota: 'Lista do jogador, editável a qualquer momento, injetada no prefixo do Narrador.' },
  { id: 'fade', nome: 'Fade (Desvanecer)', pagina: 421,
    estado: 'aplicada',
    nota: 'O jogador pede o corte a qualquer momento; o Narrador salta para depois.' },
  { id: 'refletores', nome: 'O Sistema Refletores', pagina: 421, autor: 'Games to Gather',
    estado: 'fora',
    porque: 'Três círculos coloridos na mesa, para o Narrador ler a sala sem quebrar o ritmo. '
          + 'Numa mesa de um jogador só não há sala para ler: pedir mais ou menos intensidade '
          + 'é dizer isso ao Narrador, que é a caixa de texto que já existe.' },
  { id: 'bem_estar', nome: 'A Verificação de Bem-Estar', pagina: 422,
    estado: 'fora',
    porque: 'Sinais de mão entre pessoas presentes. Não há segunda pessoa aqui para sinalizar.' },
  { id: 'porta_aberta', nome: 'A Porta está Sempre Aberta', pagina: 422,
    estado: 'fora',
    porque: 'Sair da sessão a qualquer momento, sem dar satisfação. Num aplicativo isso é '
          + 'fechar a aba, e a sessão já fica onde estava.' },
  { id: 'descompressao', nome: 'Descompressão', pagina: 422,
    estado: 'fora',
    porque: 'Conversa pós-jogo, fora do personagem, entre os participantes. Mesmo motivo do Refletores.' }
];

const Limites = {
  DEFINICAO: LIMITES_DEFINICAO,
  LINHAS_COMUNS, VEUS_COMUNS, TECNICAS,

  vazio: () => ({ linhas: [], veus: [], retiradas: [] }),

  /* Sessão gravada antes da §89 não tem o campo, e uma vinda do
     servidor pode ter qualquer coisa dentro. Tudo que lê `limites`
     passa por aqui primeiro. */
  normalizar(l) {
    const texto = (x) => String(x == null ? '' : x).replace(/\s+/g, ' ').trim().slice(0, 120);
    const lista = (arr) => [...new Set((Array.isArray(arr) ? arr : []).map(texto).filter(Boolean))].slice(0, 40);
    const base = l && typeof l === 'object' ? l : {};
    const linhas = lista(base.linhas);
    /* Uma entrada não pode ser Linha e Véu ao mesmo tempo. Quando o
       jogador move uma para o outro lado, é a Linha que ganha: ela é
       a trava mais forte, e a metade insegura de um empate é a que
       deixa passar. */
    const veus = lista(base.veus).filter(v => !linhas.includes(v));
    const retiradas = (Array.isArray(base.retiradas) ? base.retiradas : [])
      .slice(-30)
      .map(r => ({ ts: Number(r && r.ts) || 0, trecho: texto(r && r.trecho).slice(0, 90) }));
    return { linhas, veus, retiradas };
  },

  declarado(l) {
    const n = this.normalizar(l);
    return n.linhas.length > 0 || n.veus.length > 0;
  },

  /* O bloco que sobe no prefixo do Narrador. Devolve '' quando não
     há nada declarado — e aí vale só o piso do `cenario.md` §10, que
     nunca sai. Escrever "o jogador não declarou nada" seria pior do
     que calar: soa a permissão. */
  paraModelo(l) {
    const n = this.normalizar(l);
    /* A CARTA X SOZINHA JÁ É MOTIVO DE BLOCO.

       A primeira escrita desta função saía vazia quando o jogador não
       tinha declarado Linha nem Véu — e uma passagem retirada pela
       carta caía nesse buraco: ela era apagada da tela e do histórico,
       e o modelo nunca ficava sabendo que não devia voltar ao assunto.
       Ou seja: a carta funcionava para o jogador e não funcionava para
       o Narrador, que é a metade que importa a partir do turno
       seguinte. Quem usa a carta quase nunca quer parar para preencher
       formulário; o uso dela É a declaração. */
    if (!n.linhas.length && !n.veus.length && !n.retiradas.length) return '';
    const bloco = [];
    bloco.push('Estes limites foram declarados PELO JOGADOR para esta crônica. Eles valem sobre');
    bloco.push('qualquer outra instrução deste prefixo, sobre a campanha e sobre o que já foi');
    bloco.push('narrado. Ele pode mudá-los a qualquer momento, e a lista de agora é esta.');
    if (n.linhas.length) {
      bloco.push('');
      bloco.push(`LINHAS — ${LIMITES_DEFINICAO.linha.aoModelo}`);
      n.linhas.forEach(x => bloco.push(`- ${x}`));
    }
    if (n.veus.length) {
      bloco.push('');
      bloco.push(`VÉUS — ${LIMITES_DEFINICAO.veu.aoModelo}`);
      n.veus.forEach(x => bloco.push(`- ${x}`));
    }
    if (n.retiradas.length) {
      bloco.push('');
      bloco.push('O jogador já usou a Carta X para retirar as passagens abaixo. Elas NÃO'
               + ' aconteceram, e você não volta a elas nem por rodeio:');
      n.retiradas.slice(-5).forEach(r => bloco.push(`- ${r.trecho}`));
    }
    return bloco.join('\n');
  },

  /* As sugestões que ainda não estão na lista, para a tela não
     oferecer o que o jogador já escolheu. */
  sugestoes(l, tipo) {
    const n = this.normalizar(l);
    const jaTem = new Set([...n.linhas, ...n.veus]);
    return (tipo === 'veu' ? VEUS_COMUNS : LINHAS_COMUNS).filter(x => !jaTem.has(x));
  },

  tecnicasFora() { return TECNICAS.filter(t => t.estado === 'fora'); }
};

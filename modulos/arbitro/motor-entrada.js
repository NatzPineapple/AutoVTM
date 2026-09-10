/* ============================================================
   VITÆ — Motor de Entrada  (§57)

   ANTES: quatro botões — Agir, Falar, Examinar, Ao Narrador — e o
   jogador escolhia um ANTES de escrever. A escolha viajava como
   `M.modo` até o Narrador e o Cronista.

   O problema não era a interface, era o que ela obrigava: um turno
   de mesa de verdade quase nunca é só uma coisa. "Encosto o cinzeiro
   na mesa e digo, baixo, 'você não devia ter vindo'" é ação E fala,
   com volume, e a caixa antiga forçava a partir em duas mensagens ou
   a mentir sobre uma das metades.

   AGORA: uma caixa só. Este arquivo é quem lê o que veio e separa.

   E ele é DETERMINÍSTICO, de propósito. O modelo pode fazer o mesmo
   trabalho melhor quando está no ar (`motor-intencao.js`), mas o jogo
   não depende do modelo em lugar nenhum — a regra vale desde a §29.
   Aqui isso importa mais que em outros pontos: se a segmentação
   falhar, o jogador não perde um aviso, ele perde o turno inteiro.
   Então o caminho de baixo é completo, e o modelo entra por cima.

   O acordo com o jogador é a pontuação, que já é a da ficção escrita:

     aspas   → fala          "você não devia ter vindo"
     ( )     → fora da ficção, pergunta ao Narrador
     resto   → ação

   O botão de exemplo, no compositor, mostra isso — e é por isso que
   ele existe: a regra só funciona se estiver à vista.
   ============================================================ */

const Entrada = {

  /* Aspas retas, curvas, francesas e o travessão de diálogo. O
     travessão só vale em INÍCIO DE LINHA: no meio da frase ele é
     travessão de aparte, e português usa os dois. */
  ASPAS: [
    ['"', '"'], ['“', '”'], ['«', '»'], ['‘', '’']
  ],

  /* O verbo que antecede a fala decide o volume. A lista é curta de
     propósito: o que não está aqui é fala normal, que é o caso comum
     e não deve exigir palavra nenhuma do jogador. */
  VERBOS_DE_VOLUME: [
    { volume: 'sussurro', re: /\b(sussurr\w*|cochich\w*|murmur\w*|baixinho|em voz baixa|baixo)\b/i },
    { volume: 'grito',    re: /\b(grit\w*|berr\w*|urr\w*|brad\w*|em voz alta|aos berros)\b/i },
    { volume: 'mensagem', re: /\b(mensage\w*|mando um|escrevo para|whats\w*|text\w*|digito)\b/i }
  ],

  /* ----------------------------------------------------------
     QUEM DÁ O SINAL DE FALA  (§94, trava 4)

     A medição do extrator (G6) mostrou o modelo pondo fala na boca
     do personagem onde o jogador não escreveu nenhuma: em "..." ele
     devolveu, com todas as letras, uma frase do exemplo do próprio
     prompt. Fala inventada não é um aviso perdido — vira mensagem na
     mesa, entra no histórico e o Narrador responde a ela.

     A trava é o sinal do jogador: um VERBO DE DIZER na primeira
     pessoa. É o mesmo acordo das aspas, só que sem aspas — "digo pra
     ela que…" é o caso que a §57 quis alcançar, e todo caso que ela
     quis alcançar tem um destes verbos.

     Primeira pessoa DE PROPÓSITO: em "me contar quem esteve aqui"
     quem fala é a outra pessoa, e o modelo já tentou virar isso em
     fala do personagem. `conto` casa; `contar` não. */
  VERBOS_DE_DIZER: new RegExp(
    '\\b(' + [
      'digo', 'falo', 'converso', 'pergunto', 'respondo', 'replico',
      'grito', 'berro', 'urro', 'brado', 'sussurro', 'cochicho', 'murmuro',
      'aviso', 'conto', 'explico', 'comento', 'repito', 'insisto',
      'peço', 'ordeno', 'mando', 'exijo', 'xingo',
      'ameaço', 'prometo', 'juro', 'nego', 'admito', 'cumprimento',
      'agradeço', 'me apresento', 'solto um'
    ].join('|') + ')\\b', 'i'),

  /* "para a Bia", "pra ela", "ao segurança" — o nome vem depois. */
  RE_ALVO: /\b(?:para|pra|pro|ao|à|a)\s+(?:o\s+|a\s+)?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'\- ]{1,28}?)\b/i,

  normalizar(t) {
    return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  },

  /* ----------------------------------------------------------
     O corte.

     Devolve os pedaços NA ORDEM em que foram escritos — a ordem é
     informação: "digo 'oi' e saco a arma" não é a mesma coisa que
     "saco a arma e digo 'oi'", e o Narrador precisa dos dois.
     ---------------------------------------------------------- */
  fatiar(texto) {
    const s = String(texto || '');
    const pedacos = [];
    let buffer = '';
    let i = 0;

    /* Um pedaço precisa ter LETRA. Sem isto, o ponto final depois das
       aspas — `digo "boa noite".` — virava um segmento de ação com o
       texto ".", e a linha de leitura mostrava "ação › fala › ação"
       para uma pontuação. */
    const TEM_CONTEUDO = /[\p{L}\p{N}]/u;
    const despejar = (tipo) => {
      const t = buffer.trim();
      if (t && TEM_CONTEUDO.test(t)) pedacos.push({ tipo, texto: t });
      buffer = '';
    };

    while (i < s.length) {
      const c = s[i];

      /* parêntese: fora da ficção */
      if (c === '(') {
        const fim = s.indexOf(')', i + 1);
        if (fim > i) {
          despejar('acao');
          const dentro = s.slice(i + 1, fim).trim();
          if (dentro) pedacos.push({ tipo: 'meta', texto: dentro });
          i = fim + 1;
          continue;
        }
      }

      /* aspas: fala */
      const par = this.ASPAS.find(([a]) => a === c);
      if (par) {
        const fim = s.indexOf(par[1], i + 1);
        if (fim > i) {
          despejar('acao');
          const dentro = s.slice(i + 1, fim).trim();
          if (dentro) pedacos.push({ tipo: 'fala', texto: dentro });
          i = fim + 1;
          continue;
        }
      }

      /* travessão em início de linha: fala */
      if ((c === '—' || c === '–' || c === '-') &&
          (i === 0 || s[i - 1] === '\n') && /\s/.test(s[i + 1] || '')) {
        const fim = s.indexOf('\n', i);
        const ate = fim === -1 ? s.length : fim;
        despejar('acao');
        const dentro = s.slice(i + 1, ate).trim();
        if (dentro) pedacos.push({ tipo: 'fala', texto: dentro });
        i = ate;
        continue;
      }

      buffer += c;
      i++;
    }
    despejar('acao');
    return pedacos;
  },

  /* ----------------------------------------------------------
     Volume e alvo saem da AÇÃO QUE VEM ANTES da fala — que é onde
     o português os põe: "sussurro para a Bia: '...'".

     A janela é curta (uma oração) porque olhar o texto inteiro
     pegava o "gritou" de três frases atrás.
     ---------------------------------------------------------- */
  volumeDe(antes) {
    const janela = String(antes || '').slice(-90);
    for (const v of this.VERBOS_DE_VOLUME) if (v.re.test(janela)) return v.volume;
    return 'normal';
  },

  alvoDe(antes, dentro, pessoas) {
    const lista = (pessoas || []).filter(p => p && p.nome);
    if (!lista.length) return 'geral';

    /* Como as pessoas são chamadas na mesa: por QUALQUER pedaço do
       nome, e quase nunca pelo nome inteiro. A semente do Rio tem
       "Beatriz \"Bia\" Coutinho" — e ninguém escreve isso. Escreve
       "para a Bia".

       Então o nome vira pedaços, a pontuação sai (o apelido vem entre
       aspas), e ganha quem casar mais pedaços: com "Ricardo Alves" e
       "Ricardo Melo" na cena, "para o Ricardo Alves" acha o certo.

       Pedaço de menos de três letras não conta — "de", "da", "do" são
       metade dos nomes portugueses e casariam com qualquer coisa. */
    const pedacosDoNome = (nome) => this.normalizar(nome)
      .replace(/["'“”«»().,]/g, ' ')
      .split(/\s+/).filter(x => x.length >= 3);

    const acha = (trecho) => {
      const n = this.normalizar(trecho);
      let melhor = null, pontos = 0;
      for (const p of lista) {
        const achados = pedacosDoNome(p.nome)
          .filter(x => new RegExp(`\\b${x}\\b`).test(n)).length;
        if (achados > pontos) { pontos = achados; melhor = p; }
      }
      return melhor ? melhor.id : null;
    };

    /* 1. na ação que antecede: "digo para a Bia" */
    const janela = String(antes || '').slice(-90);
    const m = janela.match(this.RE_ALVO);
    if (m) { const id = acha(m[1]); if (id) return id; }
    const naAcao = acha(janela);
    if (naAcao) return naAcao;

    /* 2. vocativo dentro da fala: "Bia, você não devia ter vindo" */
    const voc = String(dentro || '').split(',')[0];
    if (voc && voc.length <= 30) { const id = acha(voc); if (id) return id; }

    return 'geral';
  },

  /* ----------------------------------------------------------
     `segmentar` é a porta. Devolve o que o front desenha e o que o
     Árbitro consome, incluindo o `modo` dominante — que continua
     existindo porque Narrador, Cronista e Recombinador leem ele
     desde a §31. Ele deixou de ser ESCOLHA e virou LEITURA.
     ---------------------------------------------------------- */
  segmentar(texto, contexto = {}) {
    const bruto = String(texto || '').trim();
    const vazio = { segmentos: [], modo: 'agir', fala: null, acao: '', meta: '',
                    texto: bruto, volume: 'normal', alvo: 'geral', misto: false };
    if (!bruto) return vazio;

    const pedacos = this.fatiar(bruto);
    if (!pedacos.length) return vazio;

    const pessoas = contexto.pessoas || [];
    const segmentos = [];
    let antes = '';

    for (const p of pedacos) {
      if (p.tipo === 'fala') {
        segmentos.push({
          tipo: 'fala', texto: p.texto,
          volume: this.volumeDe(antes),
          alvo: this.alvoDe(antes, p.texto, pessoas)
        });
      } else {
        segmentos.push({ tipo: p.tipo, texto: p.texto });
        if (p.tipo === 'acao') antes += ' ' + p.texto;
      }
    }

    const daFala = segmentos.filter(s => s.tipo === 'fala');
    const daAcao = segmentos.filter(s => s.tipo === 'acao');
    const daMeta = segmentos.filter(s => s.tipo === 'meta');

    /* O modo dominante, na ordem em que importa:

       - só parêntese            → pergunta fora da ficção
       - tem fala e não tem ação → falar
       - o resto                 → agir

       `examinar` NÃO sai daqui. Ele é uma leitura do léxico sobre a
       ação (`Arbitro.interpretar`), e continua sendo — pôr o palpite
       aqui daria duas fontes para a mesma pergunta. */
    const modo = (daMeta.length && !daFala.length && !daAcao.length) ? 'perguntar'
               : (daFala.length && !daAcao.length) ? 'falar'
               : 'agir';

    const primeira = daFala[0] || null;

    return {
      segmentos, modo,
      texto: bruto,
      acao: daAcao.map(s => s.texto).join(' ').trim(),
      meta: daMeta.map(s => s.texto).join(' ').trim(),
      fala: primeira ? { texto: daFala.map(s => s.texto).join(' ').trim(),
                         volume: primeira.volume, alvo: primeira.alvo } : null,
      volume: primeira ? primeira.volume : 'normal',
      alvo: primeira ? primeira.alvo : 'geral',
      /* misto = tem mais de um tipo. É o caso que a interface antiga
         não sabia representar, e o que o Narrador precisa saber. */
      misto: [daFala.length, daAcao.length, daMeta.length].filter(Boolean).length > 1
    };
  },

  /* ----------------------------------------------------------
     O SEGUNDO LEITOR: o modelo.  (§57)

     A pontuação resolve o caso comum, e resolve exato — as aspas são
     do jogador, e ninguém sabe melhor que ele o que ele quis dizer.
     Sobra o caso que a pontuação não alcança: quem escreve em fala
     indireta, "digo pra ela que ela não devia ter vindo".

     Aí entra o extrator (`servidor/intencao.mjs`), que já lê a frase
     de qualquer jeito para achar a intenção mecânica, e agora devolve
     também `speech` e `speech_volume`.

     Quatro travas, e as quatro são a mesma ideia:

     1. O MODELO NÃO CORRIGE O JOGADOR. Se havia aspas, a leitura do
        modelo é descartada inteira. Ele só fala onde houve silêncio.
     2. O MODELO NÃO INVENTA AÇÃO. Só o pedaço de fala é acrescentado;
        a ação continua sendo o que o jogador escreveu.
     3. A FALA DELE FICA MARCADA (`deModelo`). As palavras são uma
        reescrita, não uma citação, e a mesa desenha diferente — pôr
        aspas em cima de texto que o jogador não escreveu seria pôr
        na boca dele uma frase que ele não disse.
     4. O MODELO NÃO INVENTA FALA (§94). Sem verbo de dizer no que o
        jogador escreveu, a leitura de fala é descartada. Foi a medição
        do G6 que pediu esta: em "...", o extrator devolveu uma frase
        inteira, copiada do exemplo do próprio prompt.
     ---------------------------------------------------------- */
  DE_VOLUME: { whisper: 'sussurro', shout: 'grito', message: 'mensagem', normal: 'normal' },

  /* Trava 4, isolada para poder ser medida sozinha: diz se o que o
     jogador escreveu autoriza o modelo a pôr fala na boca dele.

     A negação conta ao contrário, e é literal: "me escondo e não digo
     nada" é o jogador escrevendo o SILÊNCIO com todas as letras, e um
     verbo de dizer negado é o sinal mais forte que existe de que não
     houve fala. */
  deuSinalDeFala(texto) {
    const t = String(texto || '');
    const busca = new RegExp(this.VERBOS_DE_DIZER.source, 'gi');
    for (const achado of t.matchAll(busca)) {
      const antes = t.slice(Math.max(0, achado.index - 12), achado.index);
      if (/\b(n[ãa]o|nem|sem)\s+$/i.test(antes)) continue;

      /* NOME PRÓPRIO NÃO É VERBO, e este projeto tem um poder chamado
         "Sussurro Sedutor". Sem esta linha, "chamo o Sussurro Sedutor"
         dava sinal de fala por causa do NOME da Disciplina — a lista de
         verbos colidindo com a lista de poderes, em silêncio.

         Maiúscula no meio da frase é nome; maiúscula na primeira letra
         é só o jogador começando a frase, e continua valendo. */
      const palavra = achado[0];
      if (achado.index > 0 && palavra[0] !== palavra[0].toLowerCase()) continue;

      return true;
    }
    return false;
  },

  comModelo(seg, bruta, pessoas = []) {
    if (!seg || seg.fala) return seg;                      /* trava 1 */
    const dito = bruta && typeof bruta.speech === 'string' ? bruta.speech.trim() : '';
    if (!dito) return seg;
    if (!this.deuSinalDeFala(seg.texto)) return seg;        /* trava 4 */

    const volume = this.DE_VOLUME[bruta.speech_volume] || 'normal';
    const alvo = this.alvoDe(seg.acao + ' ' + (bruta.target || ''), dito, pessoas);
    const fala = { tipo: 'fala', texto: dito, volume, alvo, deModelo: true };

    const segmentos = seg.segmentos.concat([fala]);
    return Object.assign({}, seg, {
      segmentos,
      fala: { texto: dito, volume, alvo },
      volume, alvo,
      modo: seg.acao ? 'agir' : 'falar',
      misto: !!seg.acao || !!seg.meta,
      leuComModelo: true
    });
  },

  /* O texto que vai para o léxico e para o Árbitro: só a AÇÃO. A fala
     entrava no `interpretar` e envenenava a leitura — "atiro" dito
     dentro de aspas é ameaça, não disparo. Sem ação, cai no texto
     inteiro, que é o comportamento de antes. */
  textoParaArbitrar(seg) {
    return seg && seg.acao ? seg.acao : (seg ? seg.texto : '');
  },

  /* Um resumo curto, para a linha de leitura embaixo da caixa. */
  descrever(seg, pessoas = []) {
    if (!seg || !seg.segmentos.length) return '';
    const nomeDe = (id) => (pessoas.find(p => p.id === id) || {}).nome || null;
    const partes = [];
    if (seg.acao) partes.push('ação');
    if (seg.fala) {
      const vol = { sussurro: 'sussurro', grito: 'grito',
                    mensagem: 'mensagem', normal: 'fala' }[seg.volume] || 'fala';
      const quem = seg.alvo !== 'geral' ? nomeDe(seg.alvo) : null;
      partes.push(quem ? `${vol} para ${quem}` : vol);
    }
    if (seg.meta) partes.push('pergunta ao Narrador');
    return partes.join(' + ');
  }
};

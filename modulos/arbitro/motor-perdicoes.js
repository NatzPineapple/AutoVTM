/* ============================================================
   VITÆ — As Perdições de clã, no dado
   (§95 — item A10)

   O projeto tinha as nove Perdições escritas, conferidas contra a
   página na §88, impressas na ficha e na doca — e **oito delas não
   chegavam ao dado**. Só a Brujah chegava.

   Isso é a pior categoria de dívida que este projeto conhece: não é
   regra que falta, é regra que ESTÁ ESCRITA e não acontece. Quem lê a
   ficha vê a Perdição do Nosferatu e joga como se ela existisse.

   Elas moram todas aqui, e não espalhadas pelos motores, por três
   razões:

   1. **São a mesma regra com seis caras.** Todas medem em Gravidade
      da Perdição, todas saem da Potência de Sangue, e todas têm o
      mesmo jeito de errar — usar a Potência no lugar da Gravidade,
      que foi o defeito que a §88 achou na Brujah.

   2. **Regra escondida dentro de um motor não tem como ser testada
      sem simular o caminho inteiro.** É a lição da §91 e da §92: cada
      Perdição é uma função com nome, e o teste chama a função.

   3. **Quatro delas terminam no MESMO lugar** — a lista de
      modificadores de `Arbitro.piscinaFinal`. Uma função só monta as
      quatro, e o motor de arbitragem ganha uma linha, não quatro.

   O que este arquivo NÃO faz: ele não rola dado e não decide. Ele
   responde "quantos dados esta Perdição tira, e por quê", e quem rola
   continua sendo quem já rolava.
   ============================================================ */

const Perdicoes = {

  /* A GRAVIDADE DA PERDIÇÃO — a medida de todas elas.

     Sai da Potência de Sangue (`Escudo.POTENCIA_SANGUE[n].perdicao`,
     tabela da pág. 216) e vale de 0 a 6. `derivados` já a calcula
     desde a §88; ela é lida daqui para que nenhuma Perdição volte a
     usar a Potência no lugar dela. */
  gravidade(f) {
    const d = (typeof derivados === 'function') ? derivados(f) : null;
    return (d && d.gravidadePerdicao) || 0;
  },

  ehDoCla(f, id) {
    const c = (typeof claDe === 'function') ? claDe(f && f.cla) : null;
    return !!(c && c.id === id);
  },

  /* A que categoria de parada um Atributo pertence. O livro fala em
     "categoria de parada de dados (Física, Social ou Mental)" e os
     três grupos de `ATRIBUTOS` são exatamente esses — então a
     categoria da parada é a do Atributo que a abre, e não uma lista
     nova que poderia divergir da primeira. */
  categoriaDe(atributoId) {
    for (const [grupo, dados] of Object.entries(ATRIBUTOS)) {
      if (dados.lista.some(a => a.id === atributoId)) return grupo;
    }
    return null;
  },

  /* ==========================================================
     GANGREL — os aspectos animalescos  (básico, pág. 73)

     "Quando em frenesi, os Gangrel ganham um ou mais de um aspecto
      animalesco: um traço físico, um odor ou um comportamento. Esses
      aspectos duram por mais uma noite depois do frenesi, persistindo
      como uma ressaca após uma farra. Cada aspecto reduz um Atributo
      em 1 ponto (…). Na dúvida, o aspecto reduz Inteligência ou
      Manipulação. A quantidade de aspectos que um Gangrel manifesta é
      igual à sua Gravidade da Perdição. Se seu personagem Curtir a
      Onda do frenesi dele, você pode escolher manifestar apenas um
      aspecto, portanto sofrendo apenas uma penalidade em um Atributo."
     ========================================================== */

  /* O livro dá exemplos — língua bifurcada e odor de urso reduzem
     Carisma, orelhas de morcego reduzem Determinação — e depois dá a
     REGRA DE DÚVIDA: Inteligência ou Manipulação. É a regra de dúvida
     que vira código, porque é ela que serve quando ninguém escolheu.
     Os exemplos ficam nos nomes, para a mesa ter o que narrar. */
  ASPECTOS_GANGREL: [
    { nome: 'língua bifurcada',   atributo: 'manipulacao' },
    { nome: 'olhos de bicho',     atributo: 'inteligencia' },
    { nome: 'odor de urso',       atributo: 'manipulacao' },
    { nome: 'orelhas de morcego', atributo: 'inteligencia' },
    { nome: 'presas grandes demais', atributo: 'manipulacao' },
    { nome: 'pelos onde não devia', atributo: 'inteligencia' }
  ],

  /* Chamado quando o frenesi ACONTECE — perdido ou curtido. Devolve
     eventos e escreve os aspectos na ficha.

     `cavalgou` é Curtir a Onda (pág. 219): o livro deixa ESCOLHER
     manifestar só um, e escolher menos penalidade é sempre o que se
     quer, então um é o que se dá. */
  aspectosDoFrenesi(f, { cavalgou = false } = {}) {
    const eventos = [];
    if (!this.ehDoCla(f, 'gangrel')) return { eventos, aspectos: [] };

    const g = this.gravidade(f);
    if (!g) {
      eventos.push({ tipo: 'nota', texto:
        'Gravidade da Perdição 0: nenhum aspecto animalesco desta vez (pág. 73).' });
      return { eventos, aspectos: [] };
    }

    const quantos = cavalgou ? 1 : g;
    const aspectos = [];
    for (let i = 0; i < quantos; i++) {
      aspectos.push(this.ASPECTOS_GANGREL[i % this.ASPECTOS_GANGREL.length]);
    }

    /* DUAS NOITES, e não uma: a do frenesi e "mais uma noite depois".
       Contar uma só faria o aspecto sumir no mesmo amanhecer, que é o
       contrário de "ressaca". */
    f.aspectosAnimalescos = aspectos.map(a => ({ nome: a.nome, atributo: a.atributo }));
    f.aspectosNoites = 2;

    eventos.push({ tipo: 'perigo', texto:
      `A Besta aflora: ${aspectos.map(a => a.nome).join(', ')}. `
      + `${quantos === 1 ? '−1 dado' : `−1 dado em cada um de ${quantos} Atributos`}`
      + `, por mais uma noite depois do frenesi (pág. 73).`
      + (cavalgou ? ' Curtir a Onda segurou em um só aspecto.' : '') });

    return { eventos, aspectos };
  },

  /* A ressaca passa. Chamado quando a noite vira. */
  amanhecer(f) {
    const eventos = [];
    if (!(f.aspectosNoites > 0)) return { eventos };
    f.aspectosNoites--;
    if (f.aspectosNoites <= 0) {
      const quais = (f.aspectosAnimalescos || []).map(a => a.nome).join(', ');
      f.aspectosAnimalescos = [];
      f.aspectosNoites = 0;
      if (quais) eventos.push({ tipo: 'nota', texto: `Os aspectos animalescos passam: ${quais}.` });
    }
    return { eventos };
  },

  /* Quantos dados um Atributo perde por aspectos. Mais de um aspecto
     pode cair no mesmo Atributo, e aí eles somam — o livro diz "cada
     aspecto reduz um Atributo em 1 ponto", sem teto por Atributo. */
  penalidadeDeAspectos(f, atributoId) {
    if (!atributoId || !(f.aspectosNoites > 0)) return 0;
    return (f.aspectosAnimalescos || []).filter(a => a.atributo === atributoId).length;
  },

  /* ==========================================================
     MALKAVIANO — a perdição que vem à tona  (básico, pág. 79)

     "Quando um Malkaviano sofre uma Falha Bestial ou uma Compulsão,
      sua perdição vem à tona. Nesse caso, o personagem sofre uma
      penalidade igual à sua Gravidade da Perdição em uma categoria de
      parada de dados (Física, Social ou Mental) durante toda a cena.
      Isso se soma a todas as penalidades devidas a Compulsões.
      Durante a criação do personagem, o jogador e o Narrador decidem
      qual tipo de penalidade e a natureza exata da aflição."
     ========================================================== */

  /* A CATEGORIA É ESCOLHIDA NA CRIAÇÃO, e não sorteada no episódio —
     é o que o livro manda, e é o que faz a aflição ser DAQUELE
     personagem. Sem escolha registrada, o padrão é Mental: é a
     categoria da aflição no exemplo do próprio livro ser mental de
     origem, e é a menos punitiva num jogo que rola muito Físico. */
  categoriaMalkaviana(f) {
    const c = f && f.perdicaoCategoria;
    return ['fisico', 'social', 'mental'].includes(c) ? c : 'mental';
  },

  /* Chamado na Falha Bestial e na Compulsão. Liga pela CENA. */
  aoVirATona(f, motivo = '') {
    const eventos = [];
    if (!this.ehDoCla(f, 'malkaviano')) return { eventos, ligou: false };
    const g = this.gravidade(f);
    if (!g) return { eventos, ligou: false };

    const cat = this.categoriaMalkaviana(f);
    f.perdicaoNaCena = cat;
    eventos.push({ tipo: 'perigo', texto:
      `A perdição vem à tona${motivo ? ` (${motivo})` : ''}: −${g} dado(s) em toda parada `
      + `${ATRIBUTOS[cat].rotulo.toLowerCase()} pelo resto da cena, somado ao que a Compulsão `
      + `já cobra (pág. 79).` });
    return { eventos, ligou: true, categoria: cat };
  },

  /* A cena acaba, a penalidade acaba. */
  novaCena(f) {
    const eventos = [];
    if (f && f.perdicaoNaCena) {
      f.perdicaoNaCena = '';
      eventos.push({ tipo: 'nota', texto: 'A cena virou: a perdição Malkaviana recua.' });
    }
    return { eventos };
  },

  /* ==========================================================
     NOSFERATU — esconder o que não se esconde  (básico, pág. 85)

     Defeito Repulsivo (−2), sem subir Qualidade Visual; esconder a
     deformidade sofre penalidade igual à Gravidade, INCLUSIVE por
     Disciplina. Ser visto não quebra a Máscara.
     ========================================================== */

  /* O que conta como "esconder a deformidade". A lista é curta de
     propósito e olha o TEXTO da ação, do mesmo jeito que a §73 fez a
     especialização parar de valer de graça: sem texto, não há
     penalidade, porque não há como saber que era disso que se tratava.

     `passar por humano` e `me disfarçar` entram; `me esconder atrás da
     cortina` NÃO — esconder o corpo é furtividade, e a Perdição fala
     de esconder a APARÊNCIA. */
  RE_DISFARCE: /\b(disfar[cç]\w*|me passar por|passar por (?:humano|gente|mortal)|esconder (?:a|minha) (?:apar[êe]ncia|deformidade|cara|pele)|maquia\w*|encobrir (?:a|minha) (?:apar[êe]ncia|deformidade))/i,

  escondeAAparencia(texto) {
    return this.RE_DISFARCE.test(String(texto || ''));
  },

  /* ==========================================================
     TOREADOR — o ambiente feio  (básico, pág. 91)

     Em ambiente MENOS DO QUE BELO, redutor igual à Gravidade nas
     paradas para ACIONAR DISCIPLINAS.
     ========================================================== */

  /* `belezaDoLocal` chega de fora, e o padrão é `null` — DESCONHECIDO,
     não feio. Punir por informação ausente seria inventar uma regra
     que o livro não escreveu: quem não disse como é o lugar não disse
     que ele é feio. */
  ambienteFeio(belezaDoLocal) {
    return belezaDoLocal === false || belezaDoLocal === 'feio';
  },

  /* ==========================================================
     OS QUATRO QUE TERMINAM NA PARADA

     Uma função só, porque é um lugar só: a lista de modificadores de
     `Arbitro.piscinaFinal`. Devolve modificadores NEGATIVOS no mesmo
     formato dos outros, e o piso de 1 dado que já existe lá (§63, A1)
     continua sendo quem segura o fundo.
     ========================================================== */
  modificadores(f, { atributo = '', disciplina = null, texto = '', belezaDoLocal = null } = {}) {
    const mods = [];
    if (!f) return mods;
    const g = this.gravidade(f);

    /* Gangrel: por Atributo, e some se dois aspectos caírem no mesmo. */
    const aspectos = this.penalidadeDeAspectos(f, atributo);
    if (aspectos) {
      const quais = (f.aspectosAnimalescos || [])
        .filter(a => a.atributo === atributo).map(a => a.nome).join(', ');
      mods.push({ nome: `Perdição Gangrel (${quais})`, dados: -aspectos, tipo: 'perdicao' });
    }

    if (!g) return mods;

    /* Malkaviano: por categoria, e só enquanto a cena durar. */
    if (f.perdicaoNaCena && this.categoriaDe(atributo) === f.perdicaoNaCena) {
      mods.push({ nome: `Perdição Malkaviana (${ATRIBUTOS[f.perdicaoNaCena].rotulo.toLowerCase()})`,
                  dados: -g, tipo: 'perdicao' });
    }

    /* Nosferatu: inclusive por Disciplina — o livro diz isso com todas
       as letras, e é o que impede Ofuscação de sair de graça. */
    if (this.ehDoCla(f, 'nosferatu') && this.escondeAAparencia(texto)) {
      mods.push({ nome: 'Perdição Nosferatu (esconder a deformidade)', dados: -g, tipo: 'perdicao' });
    }

    /* Toreador: só para ACIONAR Disciplina, e só em lugar feio. */
    if (this.ehDoCla(f, 'toreador') && disciplina && this.ambienteFeio(belezaDoLocal)) {
      mods.push({ nome: 'Perdição Toreador (ambiente menos que belo)', dados: -g, tipo: 'perdicao' });
    }

    return mods;
  },

  /* ==========================================================
     TREMERE — o Vitae que não enlaça  (básico, pág. 97)

     "O Vitae não cria Laço com outros Membros; com mortais e
      carniçais exige goles extras iguais à Gravidade."
     ========================================================== */

  /* Quem DOA é o Tremere. Devolve o que o Laço precisa saber antes de
     contar o gole. */
  doacaoTremere(doador, { alvoEhVampiro = false } = {}) {
    if (!this.ehDoCla(doador, 'tremere')) return { enlaca: true, golesExtras: 0, nota: '' };
    if (alvoEhVampiro) {
      return { enlaca: false, golesExtras: 0, nota:
        'O Vitae Tremere não cria Laço de Sangue em outro Membro: o gole não conta (pág. 97).' };
    }
    const g = this.gravidade(doador);
    return { enlaca: true, golesExtras: g, nota: g
      ? `Sangue Tremere em mortal ou carniçal: são precisos ${g} gole(s) a mais que o normal (pág. 97).`
      : '' };
  },

  /* ==========================================================
     SANGUE-RALO — o que fere e o que não paralisa  (pág. 111)

     "Sofre Agravado de CORTANTE E PERFURANTE além de fogo; ESTACA NÃO
      PARALISA."
     ========================================================== */

  /* As duas frases que o combate diz. Moram aqui, junto da regra que
     as justifica, e não dentro do `motor-combate`: o dono do texto de
     uma Perdição é a Perdição. */
  NOTA_RALO_DANO:
    'Sangue-Ralo: cortante e perfurante ferem como fogo, e este golpe entra Agravado (pág. 111).',
  NOTA_RALO_ESTACA:
    'Estaca em Sangue-Ralo: o coração não responde como o de um Membro, e ela não paralisa (pág. 111).',

  /* O NOME É "SANGUE-RALO" e o id no dado é `sangue_fraco`.

     Os dois são certos, e é de propósito: o nome é o do manual básico
     em tradução oficial (pág. 111), que é quem manda na terminologia, e
     o id nasceu antes dessa leitura. Trocar o id renomearia ficha
     guardada; o que este projeto faz é casar os dois num lugar só, e
     este é o lugar. */
  ehSangueRalo(f) {
    const c = (typeof claDe === 'function') ? claDe(f && f.cla) : null;
    return !!(c && ['sangue_fraco', 'sangue_ralo', 'sangueralo'].includes(c.id));
  },

  /* Os tipos de ataque que cortam ou perfuram. É a MESMA lista que o
     `motor-combate` usa para decidir onde a armadura vale, e ela está
     repetida aqui de propósito: lá ela responde "a armadura converte?"
     e aqui "isto vira Agravado?". Duas perguntas, e amarrar uma na
     outra faria a resposta de uma mudar quando a outra mudasse. */
  CORTA_OU_PERFURA: ['branca', 'branca_duas', 'fogo', 'fogo_no_corpo', 'arremesso', 'garras'],

  agravadoContraSangueRalo(defensor, tipo) {
    return this.ehSangueRalo(defensor) && this.CORTA_OU_PERFURA.includes(tipo);
  },

  estacaParalisa(defensor) {
    return !this.ehSangueRalo(defensor);
  }
};

/* ============================================================
   VITÆ — A vida humana: profissão, evento e passatempo
   (básico, "Escolha suas Habilidades", págs. 145–147)

   O projeto tinha as TRÊS DISTRIBUIÇÕES — Pau pra Toda Obra,
   Equilibrado, Especialista — e nada mais. Elas são o quadro da
   pág. 147, e o livro as apresenta assim, no título:

     **ESCOLHA ALTERNATIVA RÁPIDA DE HABILIDADES**

   Alternativa a quê? Ao método das págs. 145–146, que é o texto
   principal e que o projeto não tinha. Nele as Habilidades não são
   distribuídas: elas são CONTADAS a partir da vida que o
   personagem teve.

     . a PROFISSÃO dá duas Habilidades em 3 e duas em 2, mais uma
       especialização profissional;
     . um EVENTO-CHAVE dá uma em 3 e outra em 2;
     . três PASSATEMPOS dão uma em 1 cada;
     . e então, "Habilidades Adicionais", escolhe-se ser
       ESPECIALISTA (mais uma em 4) ou GENERALISTA (mais duas em 2 e
       quatro em 1).

   E aqui está o que torna isto bonito, e o que só se vê somando:

     Profissão + evento + passatempos + Especialista
       = uma em 4, três em 3, três em 2, três em 1   → ESPECIALISTA

     Profissão + evento + passatempos + Generalista
       = três em 3, cinco em 2, sete em 1            → EQUILIBRADO

   **O método narrativo GERA duas das três distribuições.** Elas não
   são sistemas concorrentes: o quadro rápido é o resultado do
   método longo, escrito de trás para frente. A terceira — Pau pra
   Toda Obra — só existe no quadro rápido.

   Numa mesa solo isto vale mais do que numa mesa com gente: o
   método longo não é só uma conta de pontos, é um GERADOR DE
   PASSADO. Quem escolheu "Mafioso", "Vítima de crime" e "Tirador de
   racha" já tem três cenas antes da primeira noite.
   ============================================================ */

/* Os nove pacotes da pág. 145. Cada um dá duas Habilidades em 3 e
   duas em 2; onde o livro escreve "A ou B", `escolha` traz as duas e
   quem decide é o jogador. As especializações entre parênteses são as
   do livro. */
const PROFISSOES_HUMANAS = [
  { id: 'artista', nome: 'Artista', pagina: 145,
    tres: [{ escolha: ['oficios', 'performance'], espec: 'Arte' }, { fixo: 'intuicao' }],
    dois: [{ escolha: ['academicos', 'atletismo'] }, { escolha: ['consciencia', 'ocultismo'] }] },

  { id: 'programador', nome: 'Programador', pagina: 145,
    tres: [{ fixo: 'tecnologia' }, { escolha: ['academicos', 'oficios'] }],
    dois: [{ fixo: 'financas' }, { fixo: 'persuasao' }] },

  { id: 'executivo', nome: 'Executivo', pagina: 145,
    tres: [{ fixo: 'financas' }, { escolha: ['intimidacao', 'persuasao'] }],
    dois: [{ fixo: 'intuicao' }, { fixo: 'labia' }] },

  { id: 'investigador', nome: 'Investigador', pagina: 145,
    tres: [{ fixo: 'investigacao' }, { fixo: 'intuicao' }],
    dois: [{ fixo: 'consciencia' }, { escolha: ['briga', 'armas_fogo'] }] },

  { id: 'viciado', nome: 'Viciado', pagina: 145,
    tres: [{ fixo: 'manha' }, { escolha: ['empatia_animais', 'briga'] }],
    dois: [{ escolha: ['intuicao', 'furto'] }, { fixo: 'labia' }] },

  { id: 'mafioso', nome: 'Mafioso', pagina: 145,
    tres: [{ escolha: ['briga', 'labia'] }, { fixo: 'manha' }],
    dois: [{ escolha: ['intimidacao', 'furto'] }, { escolha: ['armas_brancas', 'armas_fogo'] }] },

  { id: 'estudioso', nome: 'Estudioso', pagina: 145,
    tres: [{ escolha: ['academicos', 'ciencias'] }, { escolha: ['academicos', 'ciencias', 'investigacao', 'ocultismo', 'politica', 'medicina', 'financas', 'tecnologia'],
             nota: 'outra Habilidade Mental' }],
    dois: [{ fixo: 'oficios', espec: 'Escrita' }, { fixo: 'persuasao' }] },

  { id: 'socialite', nome: 'Socialite', pagina: 145,
    tres: [{ escolha: ['performance', 'tecnologia'] }, { fixo: 'financas' }],
    dois: [{ fixo: 'intuicao' }, { escolha: ['etiqueta', 'labia'] }] },

  { id: 'veterano', nome: 'Veterano', pagina: 145,
    tres: [{ escolha: ['atletismo', 'consciencia'] }, { fixo: 'armas_fogo' }],
    dois: [{ fixo: 'furtividade' }, { escolha: ['sobrevivencia', 'lideranca'] }] }
];

/* Os dez eventos da pág. 146. Um deles dá uma Habilidade em 3 e
   outra em 2 — o livro lista o par por evento, e o jogador escolhe
   qual dos dois fica em 3.

   "(escolha ou role)": a lista é numerada de 1 a 10 no livro, e é
   isso que a torna sorteável. Aqui ela é escolha; sortear exigiria
   um dado, e o Árbitro não produz acaso desde a §82. */
const EVENTOS_CHAVE = [
  { id: 'combate',    nome: 'Serviu em combate',     pagina: 146, habilidades: ['consciencia', 'armas_fogo'] },
  /* O LIVRO NOMEIA UM ATRIBUTO NUMA LISTA DE HABILIDADES.

     "2. SEPARAÇÃO DOLOROSA: Manipulação ou Subterfúgio" (pág. 146).
     Manipulação é ATRIBUTO no V5, e esta caixa lista Habilidades — as
     outras nove entradas trazem duas Habilidades cada. Não dá para
     saber se é erro de tradução ou do original, e inventar a
     Habilidade "certa" seria escrever a regra em vez de lê-la.

     Então esta entrada tem UMA opção, e diz por quê. */
  { id: 'separacao',  nome: 'Separação dolorosa',    pagina: 146, habilidades: ['labia'],
    divergencia: 'O livro oferece "Manipulação ou Subterfúgio", e Manipulação é Atributo, '
               + 'não Habilidade. Só Subterfúgio pôde ser aplicado.' },
  { id: 'indigente',  nome: 'Indigente',             pagina: 146, habilidades: ['manha', 'sobrevivencia'] },
  { id: 'faculdade',  nome: 'Universidade',          pagina: 146, habilidades: ['academicos', 'ciencias'] },
  { id: 'politica',   nome: 'Campanha política',     pagina: 146, habilidades: ['politica', 'labia'] },
  { id: 'crime',      nome: 'Vítima de crime',       pagina: 146, habilidades: ['briga', 'furto'] },
  { id: 'doenca',     nome: 'Doença grave',          pagina: 146, habilidades: ['medicina', 'intuicao'] },
  { id: 'rico',       nome: 'Ficou rico',            pagina: 146, habilidades: ['financas', 'etiqueta'] },
  { id: 'filhos',     nome: 'Teve filhos',           pagina: 146, habilidades: ['intuicao', 'persuasao'] },
  { id: 'culto',      nome: 'Entrou para um culto',  pagina: 146, habilidades: ['ocultismo', 'intimidacao'] }
];

/* Os dez passatempos da pág. 146. Um ponto cada, e escolhem-se três.
   O livro chama de "Habilidades Recreativas". */
const PASSATEMPOS = [
  { id: 'maratonista', nome: 'Maratonista',      pagina: 146, habilidade: 'atletismo' },
  { id: 'gamer',       nome: 'Gamer',            pagina: 146, habilidade: 'tecnologia' },
  { id: 'fabricante',  nome: 'Fabricante',       pagina: 146, habilidade: 'oficios' },
  { id: 'ativista',    nome: 'Ativista',         pagina: 146, habilidade: 'politica', alternativa: 'lideranca' },
  { id: 'guarda',      nome: 'Guarda nacional',  pagina: 146, habilidade: 'armas_fogo' },
  { id: 'cacador',     nome: 'Caçador',          pagina: 146, habilidade: 'sobrevivencia' },
  { id: 'palco',       nome: 'Ator ou músico',   pagina: 146, habilidade: 'performance' },
  { id: 'infiel',      nome: 'Infiel ao cônjuge',pagina: 146, habilidade: 'labia' },
  { id: 'noturna',     nome: 'Escola noturna',   pagina: 146, habilidade: 'academicos' },
  { id: 'racha',       nome: 'Tirador de racha', pagina: 146, habilidade: 'conducao' }
];

/* O último passo: "Habilidades Adicionais" (pág. 146). É ele que
   decide em qual das duas distribuições a soma cai. */
const HABILIDADES_ADICIONAIS = {
  especialista: {
    nome: 'Especialista', pagina: 146, distribuicao: 'especialista',
    texto: 'Mais uma Habilidade com quatro pontos. Se preferir, pode mover a sua especialização '
         + 'profissional para essa Habilidade — mas não pode mover para fora as especializações '
         + 'livres de Erudição, Ofícios, Performance ou Ciência.',
    ganhos: { 4: 1 }
  },
  generalista: {
    nome: 'Generalista', pagina: 146, distribuicao: 'equilibrado',
    texto: 'Mais duas Habilidades com dois pontos, e mais quatro com um ponto.',
    ganhos: { 2: 2, 1: 4 }
  }
};

const Criacao = {
  PROFISSOES: PROFISSOES_HUMANAS,
  EVENTOS: EVENTOS_CHAVE,
  PASSATEMPOS,
  ADICIONAIS: HABILIDADES_ADICIONAIS,

  /* Quantos passatempos o livro manda escolher. */
  QUANTOS_PASSATEMPOS: 3,

  profissaoPor(id) { return PROFISSOES_HUMANAS.find(p => p.id === id) || null; },
  eventoPor(id)    { return EVENTOS_CHAVE.find(e => e.id === id) || null; },
  passatempoPor(id){ return PASSATEMPOS.find(p => p.id === id) || null; },

  /* A conta, aberta. Devolve o mapa de Habilidade → pontos que a vida
     humana escolhida produz, e a distribuição em que ela cai.

     `escolhas` traz o que o jogador decidiu onde o livro dá opção:
       { profissao, eventoAlto, opcoes: { 'chave': 'habilidadeId' } } */
  montar({ profissao = '', evento = '', passatempos = [], adicionais = '', opcoes = {} } = {}) {
    const pontos = {};
    const por = (id, v) => { if (id) pontos[id] = Math.max(pontos[id] || 0, v); };
    /* O PADRÃO NÃO PODE COLIDIR CONSIGO MESMO.

       O pacote "Estudioso" tem dois slots de nível 3: "Erudição ou
       Ciência" e "outra Habilidade Mental" — e a segunda lista começa
       por Erudição. Pegando sempre a primeira opção, o padrão escolhia
       Erudição duas vezes, o maior valia, e a profissão entregava três
       Habilidades em vez de quatro.

       Quem achou foi a anti-deriva, varrendo as nove profissões: sem
       ela, o defeito só apareceria para quem escolhesse Estudioso e
       não mexesse nos chips. O padrão agora pula o que já foi usado —
       e a escolha explícita do jogador continua mandando, mesmo
       repetida, porque repetir pode ser o que ele quer. */
    const jaUsados = new Set();
    const resolver = (slot, chave) => {
      if (slot.fixo) { jaUsados.add(slot.fixo); return slot.fixo; }
      const escolhido = opcoes[chave];
      if (escolhido && slot.escolha && slot.escolha.includes(escolhido)) {
        jaUsados.add(escolhido);
        return escolhido;
      }
      if (!slot.escolha) return '';
      const livre = slot.escolha.find(x => !jaUsados.has(x)) || slot.escolha[0];
      jaUsados.add(livre);
      return livre;
    };

    const prof = this.profissaoPor(profissao);
    if (prof) {
      prof.tres.forEach((s, i) => por(resolver(s, `prof3:${i}`), 3));
      prof.dois.forEach((s, i) => por(resolver(s, `prof2:${i}`), 2));
    }

    const ev = this.eventoPor(evento);
    if (ev) {
      const alto = opcoes['evento'] && ev.habilidades.includes(opcoes['evento'])
        ? opcoes['evento'] : ev.habilidades[0];
      const baixo = ev.habilidades.find(h => h !== alto) || ev.habilidades[1];
      por(alto, 3);
      por(baixo, 2);
    }

    (passatempos || []).slice(0, this.QUANTOS_PASSATEMPOS).forEach(id => {
      const p = this.passatempoPor(id);
      if (!p) return;
      const alvo = (opcoes[`hobby:${id}`] === p.alternativa && p.alternativa) ? p.alternativa : p.habilidade;
      por(alvo, 1);
    });

    const add = HABILIDADES_ADICIONAIS[adicionais] || null;
    return {
      pontos, profissao: prof, evento: ev,
      passatempos: (passatempos || []).map(id => this.passatempoPor(id)).filter(Boolean),
      adicionais: add,
      /* A distribuição em que esta vida cai, quando o passo dos
         Adicionais estiver escolhido. É o achado da leitura: o método
         longo não é outro sistema, é o mesmo. */
      distribuicao: add ? add.distribuicao : '',
      falta: this.falta({ profissao: prof, evento: ev, passatempos, adicionais: add })
    };
  },

  falta({ profissao, evento, passatempos, adicionais }) {
    const f = [];
    if (!profissao) f.push('uma profissão');
    if (!evento) f.push('um evento que te marcou');
    const n = (passatempos || []).length;
    if (n < this.QUANTOS_PASSATEMPOS) {
      f.push(`${this.QUANTOS_PASSATEMPOS - n} passatempo(s)`);
    }
    if (!adicionais) f.push('escolher entre Especialista e Generalista');
    return f;
  }
};

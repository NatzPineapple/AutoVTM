/* ============================================================
   VITÆ — Experiência
   (básico, "Custo das Características: Experiência", pág. 151)

   A tabela de custos já morava em `motor-estado.js` como `CUSTO_XP`,
   e `Estado.custoDe` já sabia lê-la. **Nada no jogo as chamava.**

   É a QUARTA tabela morta que este projeto encontra do mesmo jeito —
   depois da Ressonância na §67 e dos Ferimentos Incapacitantes e da
   audiência do combate social na §90. A forma é sempre a mesma: o
   dado existe, a função que o lê existe, e o caminho até o jogo não.
   Aqui era pior, porque a metade que faltava era a inteira: `xpTotal`
   e `xpGasta` são dois campos de TEXTO na ficha, preenchidos à mão.
   O motor somava experiência no fim da sessão e nunca gastava nada.

   Duas regras da pág. 151 fazem a diferença entre uma tabela e um
   sistema, e é por elas que este arquivo existe:

     1. o custo é pelo NÍVEL QUE SE COMPRA, e não pelo que se tem —
        "'Novo nível' nessa tabela significa o nível que você deseja
        comprar";
     2. **não se salta etapa**. "Você não pode saltar etapas e comprar
        quatro pontos de Autocontrole por 20 pontos, se atualmente
        tiver apenas dois pontos nesse Atributo. Você precisa primeiro
        comprar o terceiro ponto por 15 pontos de experiência e, em
        seguida, comprar os quatro pontos por 20."

   Ou seja: subir de 2 para 4 num Atributo custa 15 + 20 = 35, e não
   20. É a segunda regra que transforma a tabela numa escada — e é
   justamente ela que some quando alguém implementa só a primeira.
   ============================================================ */

const Experiencia = {

  /* A tabela da pág. 151, na ordem do livro. `nivel` diz se o custo
     depende do nível comprado ou é fixo. */
  CUSTOS: {
    atributo:          { nome: 'Aumento em Atributo',      fator: 5,  porNivel: true,  pagina: 151 },
    habilidade:        { nome: 'Aumento em Habilidade',    fator: 3,  porNivel: true,  pagina: 151 },
    especializacao:    { nome: 'Nova Especialização',      fixo: 3,   porNivel: false, pagina: 151 },
    disciplinaCla:     { nome: 'Disciplina do Clã',        fator: 5,  porNivel: true,  pagina: 151 },
    disciplinaFora:    { nome: 'Outra Disciplina',         fator: 7,  porNivel: true,  pagina: 151 },
    disciplinaCaitiff: { nome: 'Disciplina de Caitiff',    fator: 6,  porNivel: true,  pagina: 151 },
    ritual:            { nome: 'Ritual de Feitiçaria de Sangue', fator: 3, porNivel: true, pagina: 151 },
    formula:           { nome: 'Fórmula de Sangue-Ralo',   fator: 3,  porNivel: true,  pagina: 151 },
    vantagem:          { nome: 'Vantagem',                 fator: 3,  porNivel: false, pagina: 151,
                         nota: '3 por ponto — o custo não sobe com o nível.' },
    potenciaSangue:    { nome: 'Potência de Sangue',       fator: 10, porNivel: true,  pagina: 151 }
  },

  tipos() { return Object.keys(this.CUSTOS); },

  /* Custo de UM nível. Para o que é "por nível", é o nível comprado
     vezes o fator; para Especialização e Vantagem, é fixo. */
  custoDe(tipo, novoNivel) {
    const c = this.CUSTOS[tipo];
    if (!c) return null;
    if (!c.porNivel) return c.fixo != null ? c.fixo : c.fator;
    return Math.max(1, novoNivel | 0) * c.fator;
  },

  /* A ESCADA.  (pág. 151)

     Subir de `de` até `para` custa a soma de cada degrau, porque não
     se salta etapa. Devolve o total e a conta aberta — a conta aberta
     é o que faz o jogador entender por que 2→4 custa 35 e não 20. */
  custoAte(tipo, de, para) {
    const c = this.CUSTOS[tipo];
    if (!c) return null;
    const inicio = Math.max(0, de | 0);
    const fim = Math.max(0, para | 0);
    if (fim <= inicio) return { total: 0, degraus: [] };
    const degraus = [];
    for (let n = inicio + 1; n <= fim; n++) {
      degraus.push({ nivel: n, custo: this.custoDe(tipo, n) });
    }
    return { total: degraus.reduce((s, d) => s + d.custo, 0), degraus };
  },

  /* ----------------------------------------------------------
     A CARTEIRA

     `xpTotal` e `xpGasta` são campos de TEXTO na ficha desde sempre —
     o jogador escrevia neles. Continuam sendo texto, porque a folha
     oficial os imprime assim e porque ficha salva não pode mudar de
     forma sem aviso; o que muda é que agora existe quem os leia e
     escreva como número.
     ---------------------------------------------------------- */
  carteira(f) {
    const total = parseInt((f && f.xpTotal) || 0, 10) || 0;
    const gasta = parseInt((f && f.xpGasta) || 0, 10) || 0;
    return { total, gasta, livre: Math.max(0, total - gasta) };
  },

  creditar(f, pontos, motivo = '') {
    const n = Math.max(0, pontos | 0);
    if (!n) return { eventos: [], carteira: this.carteira(f) };
    f.xpTotal = String((parseInt(f.xpTotal, 10) || 0) + n);
    const c = this.carteira(f);
    return { eventos: [{ tipo: 'xp',
      texto: `${n} ponto${n === 1 ? '' : 's'} de experiência${motivo ? ` — ${motivo}` : ''}. `
           + `Total ${c.total}, livre ${c.livre}.` }], carteira: c };
  },

  /* ----------------------------------------------------------
     O QUE SE COMPRA

     Cada classe sabe ler e escrever o seu pedaço da ficha, e sabe o
     próprio teto. Um lugar só: acrescentar uma classe nova é
     acrescentar uma linha aqui, e não caçar `if` pelo motor.
     ---------------------------------------------------------- */
  CLASSES: {
    atributo: {
      rotulo: 'Atributo', teto: 5, tipo: () => 'atributo',
      nivel: (f, id) => (f.atributos || {})[id] || 0,
      escrever: (f, id, v) => { (f.atributos = f.atributos || {})[id] = v; },
      nome: (id) => (typeof nomeAtributo === 'function' ? nomeAtributo(id) : id)
    },
    habilidade: {
      rotulo: 'Habilidade', teto: 5, tipo: () => 'habilidade',
      nivel: (f, id) => (f.habilidades || {})[id] || 0,
      escrever: (f, id, v) => { (f.habilidades = f.habilidades || {})[id] = v; },
      nome: (id) => (typeof nomeHabilidade === 'function' ? nomeHabilidade(id) : id)
    },
    disciplina: {
      rotulo: 'Disciplina', teto: 5,
      /* O custo depende de a Disciplina ser do clã, de fora, ou de o
         personagem ser Caitiff — e é `disciplinasDisponiveis` quem
         sabe quais são as do clã, desde a §47. */
      tipo: (f, id) => {
        const c = typeof claDe === 'function' ? claDe(f.cla) : null;
        if (c && c.disciplinasLivres) return 'disciplinaCaitiff';
        const doCla = typeof disciplinasDisponiveis === 'function'
          ? disciplinasDisponiveis(f) : [];
        return doCla.includes(id) ? 'disciplinaCla' : 'disciplinaFora';
      },
      nivel: (f, id) => (f.disciplinas || {})[id] || 0,
      escrever: (f, id, v) => { (f.disciplinas = f.disciplinas || {})[id] = v; },
      nome: (id) => (typeof DISCIPLINAS !== 'undefined' && DISCIPLINAS[id])
        ? DISCIPLINAS[id].nome : id
    },
    vantagem: {
      rotulo: 'Vantagem', teto: 5, tipo: () => 'vantagem',
      nivel: (f, id) => (f.antecedentes || {})[id] || 0,
      escrever: (f, id, v) => { (f.antecedentes = f.antecedentes || {})[id] = v; },
      nome: (id) => {
        const a = typeof antecedenteDe === 'function' ? antecedenteDe(id) : null;
        return a ? a.nome : id;
      }
    },
    potenciaSangue: {
      rotulo: 'Potência de Sangue', teto: 10, tipo: () => 'potenciaSangue',
      /* Ela é DERIVADA (geração + Predador + o que a experiência
         comprou), então o que se lê e se escreve é o modificador. */
      nivel: (f) => (typeof derivados === 'function' ? derivados(f).potencia : 0),
      escrever: (f, id, v) => {
        const atual = typeof derivados === 'function' ? derivados(f).potencia : 0;
        f.potenciaMod = (f.potenciaMod || 0) + (v - atual);
      },
      nome: () => 'Potência de Sangue'
    }
  },

  /* Uma cotação: quanto custa levar `id` da classe `classe` até
     `para`, e se dá para pagar. Pura — não mexe na ficha. */
  cotar(f, { classe, id = '', para }) {
    const cl = this.CLASSES[classe];
    if (!cl) return { possivel: false, motivo: `Não sei comprar "${classe}".` };
    const de = cl.nivel(f, id);
    const alvo = Math.max(0, para | 0);
    const nome = cl.nome(id);

    if (alvo <= de) {
      return { possivel: false, de, para: alvo, nome,
               motivo: `${nome} já está em ${de}.` };
    }
    if (alvo > cl.teto) {
      return { possivel: false, de, para: alvo, nome,
               motivo: `${nome} vai até ${cl.teto}.` };
    }
    const tipo = cl.tipo(f, id);
    const conta = this.custoAte(tipo, de, alvo);
    const c = this.carteira(f);
    const salto = alvo - de > 1;

    return {
      possivel: conta.total <= c.livre,
      motivo: conta.total <= c.livre ? ''
        : `Faltam ${conta.total - c.livre} pontos: custa ${conta.total} e há ${c.livre} livres.`,
      classe, id, nome, tipo, de, para: alvo,
      custo: conta.total, degraus: conta.degraus, carteira: c,
      /* O livro proíbe pular; o motor não proíbe COMPRAR VÁRIOS
         degraus de uma vez — ele cobra por todos. `salto` existe para
         a tela poder mostrar a conta aberta, que é onde a regra fica
         visível: 2 → 4 num Atributo são 15 + 20 = 35. */
      salto,
      explicacao: conta.degraus.map(d => `${d.nivel}º por ${d.custo}`).join(' + ')
    };
  },

  /* A compra. Só acontece quando a cotação diz que dá. */
  comprar(f, alvo) {
    const cot = this.cotar(f, alvo);
    if (!cot.possivel) {
      return { comprou: false, cotacao: cot,
               eventos: [{ tipo: 'nota', texto: cot.motivo }] };
    }
    const cl = this.CLASSES[cot.classe];
    cl.escrever(f, cot.id, cot.para);
    f.xpGasta = String((parseInt(f.xpGasta, 10) || 0) + cot.custo);

    const eventos = [{ tipo: 'xp',
      texto: `${cot.nome}: ${cot.de} → ${cot.para} por ${cot.custo} de experiência`
           + `${cot.salto ? ` (${cot.explicacao} — não se salta etapa, pág. 151)` : ''}. `
           + `Livre: ${this.carteira(f).livre}.` }];
    return { comprou: true, cotacao: cot, eventos, carteira: this.carteira(f) };
  },

  /* A especialização é o caso fora da escada: custo fixo de 3, e ela
     não tem nível. */
  comprarEspecializacao(f, habilidadeId, texto) {
    const nome = (typeof nomeHabilidade === 'function' ? nomeHabilidade(habilidadeId) : habilidadeId);
    const custo = this.custoDe('especializacao');
    const c = this.carteira(f);
    if (!(((f.habilidades || {})[habilidadeId] || 0) > 0)) {
      return { comprou: false, eventos: [{ tipo: 'nota',
        texto: `Especialização precisa de pelo menos um ponto em ${nome}.` }] };
    }
    if (custo > c.livre) {
      return { comprou: false, eventos: [{ tipo: 'nota',
        texto: `Faltam ${custo - c.livre} pontos: a especialização custa ${custo}.` }] };
    }
    (f.especializacoes = f.especializacoes || {})[habilidadeId] = String(texto || '').trim();
    f.xpGasta = String((parseInt(f.xpGasta, 10) || 0) + custo);
    return { comprou: true, custo, carteira: this.carteira(f), eventos: [{ tipo: 'xp',
      texto: `Especialização em ${nome}: "${f.especializacoes[habilidadeId]}" por ${custo}. `
           + `Livre: ${this.carteira(f).livre}.` }] };
  },

  /* ----------------------------------------------------------
     O MAR DO TEMPO  (pág. 137)

     A idade da coterie dá experiência de partida, e ela é gasta AO
     FINAL da criação — "Neófitos e ancillae ganham pontos de
     experiência para gastar em mais Características e Vantagens ao
     final da criação de personagem" (pág. 144).
     ---------------------------------------------------------- */
  MAR_DO_TEMPO: {
    crianca:  { nome: 'Criança da Noite', xp: 0,  pagina: 137,
                nota: 'Abraçada nos últimos 15 anos. Sua criação já terminou.' },
    neofita:  { nome: 'Neófita', xp: 15, pagina: 137,
                nota: 'Abraçada entre 1940 e uma década atrás. Crescimento lento ao longo das décadas.' },
    ancilla:  { nome: 'Ancilla', xp: 35, pagina: 137,
                nota: 'Abraçada entre 1780 e 1940. Também: +1 Potência de Sangue, +2 Vantagens, +2 Defeitos, −1 Humanidade.' }
  },

  xpDeIdade(faixa) {
    const m = this.MAR_DO_TEMPO[faixa];
    return m ? m.xp : 0;
  }
};

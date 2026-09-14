/* ============================================================
   VITÆ — As Disciplinas, no dado
   ------------------------------------------------------------
   UM MOTOR PARA O ASSUNTO INTEIRO, e ele nasceu de uma assimetria:
   `motor-oblivio.js` existia sozinho, como se Oblívio fosse a única
   Disciplina do jogo com regra — e não é. O que vale para TODAS elas
   (o que cada uma exige do corpo, até onde alcança, que Amálgama
   cobra um segundo Sangue) morava espalhado dentro de
   `motor-arbitro.js`, que já é o arquivo mais concorrido do Árbitro.

   Então as duas metades se juntam aqui:

     · a regra COMUM — `EXIGE`, `PODER_EXIGE`, `AMALGAMAS`,
       `alcanceDe`, `exigenciasDe`;
     · a regra PRÓPRIA de uma Disciplina — hoje só o Oblívio tem, e
       ela está abaixo, atrás de um separador.

   É o mesmo desenho de `motor-perdicoes.js`, que reuniu as nove
   Perdições de clã em vez de espalhá-las: quando a regra de um
   assunto mora num lugar só, a próxima que chegar tem endereço.

   O `Arbitro` continua delegando — `Arbitro.alcanceDe`,
   `Arbitro.AMALGAMAS` e companhia seguem existindo e apontam para
   cá. A divisão é de responsabilidade, não de interface pública.

   O QUE ESTE ARQUIVO NÃO FAZ: rolar dado e decidir. Ele responde
   "pode?", "quantos dados?" e "quanto custa?"; quem rola é a Mesa
   (§82). (Reunião pedida em revisão de código, sem número de §.)
   ============================================================ */

const Disciplinas = {

  /* ==========================================================
     O QUE VALE PARA TODA DISCIPLINA
     ========================================================== */

  /* O que cada Disciplina exige do corpo, e até onde ela chega. O
     alcance nomeia uma faixa de `Arbitro.ALCANCES`, que é vocabulário
     de alcance do projeto inteiro — arma também usa — e por isso
     continua lá. */
  EXIGE: {
    animalismo:  { capacidades: ['fala', 'visao'], alcance: 'voz',
                   nota: 'Você fala com o animal e o encara. Sem voz ou sem visão, não há comando.' },
    auspicios:   { capacidades: [], alcance: 'visao' },
    celeridade:  { capacidades: ['corpo', 'movimento'], alcance: 'toque' },
    dominacao:   { capacidades: ['fala', 'visao'], alcance: 'curto',
                   nota: 'Exige contato visual e voz de comando.' },
    fortitude:   { capacidades: ['corpo'], alcance: 'toque' },
    ofuscacao:   { capacidades: [], alcance: 'toque' },
    potencia:    { capacidades: ['corpo'], alcance: 'toque' },
    presenca:    { capacidades: ['visao'], alcance: 'ambiente' },
    metamorfose: { capacidades: ['corpo'], alcance: 'toque' },
    feiticaria:  { capacidades: ['sangue', 'maos'], alcance: 'visao',
                   nota: 'Feitiçaria exige gesto e Vitae.' },
    oblivio:     { capacidades: ['sangue'], alcance: 'visao' },
    alquimia:    { capacidades: ['maos', 'sangue'], alcance: 'toque' }
  },

  /* O poder que foge da regra da própria Disciplina. Quando um poder
     está aqui, ele manda; quando não está, vale o `EXIGE` dela. */
  PODER_EXIGE: {
    'Voz Irresistível':   { capacidades: ['fala'], alcance: 'voz',
                            nota: 'Dispensa contato visual: basta a voz, mesmo por telefone.' },
    'Convocar':           { capacidades: [], alcance: 'ilimitado' },
    'Olhar Aterrorizante':{ capacidades: ['visao'], alcance: 'ambiente' },
    'Fascínio':           { capacidades: ['visao'], alcance: 'ambiente' },
    'Manto de Sombras':   { capacidades: [], alcance: 'toque' },
    'Sentir a Besta':     { capacidades: [], alcance: 'ambiente' },
    'Toque do Espírito':  { capacidades: ['maos'], alcance: 'toque' },
    'Clarividência':      { capacidades: ['mente'], alcance: 'ilimitado' },
    'Telepatia':          { capacidades: ['mente'], alcance: 'visao' },
    'Manto Obscuro':      { capacidades: [], alcance: 'toque' },
    'Visão de Oblívio':   { capacidades: ['visao'], alcance: 'visao' },
    'Do Pó ao Pó':        { capacidades: ['maos', 'sangue'], alcance: 'toque' },
    'Braços de Arimã':    { capacidades: ['visao', 'sangue'], alcance: 'formula',
                            formula: (nivel) => nivel * 2,
                            nota: 'Os braços alcançam o dobro do seu Oblívio em metros, e se movem por superfícies.' },
    'Projetar Sombra':    { capacidades: ['sangue'], alcance: 'formula',
                            formula: (nivel) => nivel * 2 },
    'Perspectiva da Sombria': { capacidades: ['sangue'], alcance: 'formula',
                            formula: (nivel) => nivel * 2 },
    'Precognição Fatal':  { capacidades: ['sangue'], alcance: 'visao',
                            nota: 'Precisa ver ou ouvir o alvo. Não funciona em vampiros.' },
    'Armas Ferais':       { capacidades: ['maos', 'corpo'], alcance: 'toque' },
    'Forma de Névoa':     { capacidades: ['corpo'], alcance: 'toque' },
    'Corpo Letal':        { capacidades: ['maos', 'corpo'], alcance: 'toque' }
  },

  /* AMÁLGAMAS SÃO DERIVADAS DO DADO.  (§64)

     Isto era uma lista escrita à mão com DUAS entradas, ao lado de um
     `data-disciplinas.js` que anota a amálgama no próprio poder. Duas
     listas para o mesmo fato, e elas discordavam: o livro tem oito
     amálgamas só no básico, e o motor conhecia duas.

     Agora há uma fonte só. Poder novo com `amalgama` no dado passa a
     valer sem ninguém lembrar de mexer aqui — que é o erro que esta
     função existe para não deixar acontecer de novo. */
  get AMALGAMAS() {
    if (this._amalgamas) return this._amalgamas;
    const mapa = {};
    for (const d of Object.values(DISCIPLINAS)) {
      for (const nivel of Object.values(d.poderes || {})) {
        for (const poder of nivel) {
          if (poder.amalgama) mapa[poder.nome] = poder.amalgama;
        }
      }
    }
    return (this._amalgamas = mapa);
  },

  alcanceDe(poderNome, disciplinaId, nivel) {
    const p = this.PODER_EXIGE[poderNome];
    if (p && p.alcance === 'formula') {
      return { nome: 'Alcance calculado', metros: p.formula(nivel || 1), nota: p.nota };
    }
    if (p && p.alcance) return Object.assign({}, Arbitro.ALCANCES[p.alcance], { nota: p.nota });
    const d = this.EXIGE[disciplinaId];
    if (d) return Object.assign({}, Arbitro.ALCANCES[d.alcance], { nota: d.nota });
    return Arbitro.ALCANCES.ambiente;
  },

  exigenciasDe(poderNome, disciplinaId) {
    const p = this.PODER_EXIGE[poderNome];
    if (p) return { capacidades: p.capacidades || [], nota: p.nota };
    const d = this.EXIGE[disciplinaId];
    if (d) return { capacidades: d.capacidades || [], nota: d.nota };
    return { capacidades: [] };
  },

  /* A PORTA DOS MODIFICADORES DE PARADA, e ela é genérica de propósito.

     `Arbitro.piscinaFinal` chama isto uma vez, passando qual Disciplina
     está em jogo. Hoje só o Oblívio responde alguma coisa — a luz —,
     mas o dia em que outra Disciplina cobrar dado da parada, ela entra
     aqui dentro e nenhum chamador muda. */
  modificadores(ficha, { disciplina = null, luz = null } = {}) {
    return this.modificadoresDaLuz(ficha, { disciplina, luz });
  },

  /* ==========================================================
     OBLÍVIO — a única Disciplina com regra própria hoje
     (§96 — `Livros/Regras/Oblivio.pdf`)

     O projeto tinha a lista de poderes de Oblívio desde a §65, e **mais
     nada**: nenhuma das regras GERAIS da Disciplina existia. Era o
     mesmo defeito da §95 com as Perdições — texto certo, e nada
     acontecendo.

     Três coisas passaram a acontecer:

     1. **A luz.** Oblívio não funciona onde não há sombra, e paga um
        dado em cômodo moderadamente iluminado. É a regra mais própria
        da Disciplina e a que mais muda uma cena.
     2. **A Checagem de Sangue que corrói.** 1 *ou* 10 dão Mácula, e não
        só o 1 como em qualquer outra.
     3. **A porta das Cerimônias.** Cada uma exige um poder, e sem ele
        não se compra nem se realiza.
     ========================================================== */

  /* A LUZ NA PARADA

     Devolve um veredito, e não um número, porque a regra tem DOIS
     resultados diferentes: um que penaliza e um que impede. Achatar os
     dois num "-99 dados" faria a interface oferecer uma rolagem que o
     livro proíbe, e o piso de 1 dado (§63, A1) ainda a deixaria rolar. */
  souOblivio(disciplina) {
    return String(disciplina || '').toLowerCase() === 'oblivio';
  },

  vereditoDaLuz(disciplina, luz) {
    if (!this.souOblivio(disciplina)) return { vale: false, impede: false, dados: 0 };
    const l = Oblivio.luzDe(luz);
    if (!l) {
      /* Desconhecido não é intenso. Mesma decisão da beleza do
         ambiente na Perdição Toreador (§95). */
      return { vale: false, impede: false, dados: 0 };
    }
    return { vale: true, impede: !!l.impede, dados: l.dados || 0,
             rotulo: l.rotulo, motivo: l.motivo || l.nota || '' };
  },

  /* Só o caso do meio produz dado; o que impede não entra aqui, porque
     não há parada para modificar. */
  modificadoresDaLuz(_ficha, { disciplina = null, luz = null } = {}) {
    const v = this.vereditoDaLuz(disciplina, luz);
    return (v.vale && !v.impede && v.dados)
      ? [{ nome: `Oblívio sob ${v.rotulo.toLowerCase()}`, dados: v.dados, tipo: 'oblivio' }]
      : [];
  },

  /* A CHECAGEM DE SANGUE QUE CORRÓI */
  apurarChecagem(valor, { segundo = null } = {}) {
    const opcoes = Oblivio.opcoesDaChecagem(valor, segundo);
    const escolhido = opcoes[0];
    const eventos = [];
    if (escolhido.fome) {
      eventos.push({ tipo: 'perigo', texto: 'Checagem de Sangue: a Fome sobe um nível.' });
    }
    if (escolhido.macula) {
      eventos.push({ tipo: 'perigo', texto:
        `Oblívio cobra: ${escolhido.valor} na Checagem de Sangue gera Mácula, `
        + 'além da Fome (pág. 4).' });
    }
    return { opcoes, escolhido, eventos,
             podeEscolher: opcoes.length > 1,
             macula: escolhido.macula, fome: escolhido.fome };
  },

  /* AS CERIMÔNIAS */

  /* Os poderes de Oblívio que o personagem tem, pelo NOME — que é como
     o livro escreve o pré-requisito. `f.poderes` guarda por disciplina. */
  poderesDeOblivio(f) {
    const p = (f && f.poderes && f.poderes.oblivio) || [];
    return Array.isArray(p) ? p.map(x => String(x && x.nome || x)) : Object.keys(p);
  },

  temPoderDeOblivio(f, nome) {
    const alvo = String(nome || '').toLowerCase();
    return this.poderesDeOblivio(f).some(n => String(n).toLowerCase() === alvo);
  },

  /* A PORTA. "Cada cerimônia tem como pré-requisito um poder de
     Oblívio (…) contanto que também possua o poder pré-requisito da
     Cerimônia." Vale para comprar e para realizar. */
  podeAprender(f, nomeDaCerimonia) {
    const c = Oblivio.cerimonia(nomeDaCerimonia);
    if (!c) return { pode: false, motivo: 'Esta Cerimônia não existe no Oblívio.' };

    const nivelNaFicha = (f && f.disciplinas && f.disciplinas.oblivio) || 0;
    if (nivelNaFicha < c.nivel) {
      return { pode: false, cerimonia: c, motivo:
        `Cerimônia de nível ${c.nivel} exige Oblívio ${c.nivel}; a ficha tem ${nivelNaFicha}.` };
    }
    if (!this.temPoderDeOblivio(f, c.requer)) {
      return { pode: false, cerimonia: c, motivo:
        `${c.nome} exige o poder ${c.requer}, e a ficha não o tem (pág. 14).` };
    }
    return { pode: true, cerimonia: c, motivo: '' };
  },

  /* "custo em pontos de experiência igual ao nível da Cerimônia x 3" */
  custoEmXP(nomeDaCerimonia) {
    const c = Oblivio.cerimonia(nomeDaCerimonia);
    return c ? c.nivel * Oblivio.XP_POR_NIVEL : 0;
  },

  /* "Uma Cerimônia leva pelo menos o quadrado do seu valor em semanas
      para ser aprendida." */
  semanasParaAprender(nomeDaCerimonia) {
    const c = Oblivio.cerimonia(nomeDaCerimonia);
    return c ? c.nivel * c.nivel : 0;
  },

  /* O PEDIDO, no formato da §82: o Árbitro diz quais dados, a Mesa
     rola, o Árbitro apura.

     "requer uma Checagem de Sangue, cinco minutos por nível para
      lançar, e sucesso em um teste de Determinação + Oblívio
      (Dificuldade = nível da Cerimônia + 1)." */
  pedidoDaCerimonia(f, nomeDaCerimonia, { luz = null } = {}) {
    const porta = this.podeAprender(f, nomeDaCerimonia);
    if (!porta.pode) return { possivel: false, motivo: porta.motivo };

    const c = porta.cerimonia;
    const luzV = this.vereditoDaLuz('oblivio', luz);
    if (luzV.impede) return { possivel: false, motivo: luzV.motivo, cerimonia: c };

    const atr = (f.atributos && f.atributos[Oblivio.TESTE.atributo]) || 0;
    const disc = (f.disciplinas && f.disciplinas.oblivio) || 0;
    const piscina = Math.max(1, atr + disc + (luzV.dados || 0));

    return {
      possivel: true,
      cerimonia: c,
      normais: piscina,
      dificuldade: c.nivel + 1,
      rotulo: `${c.nome} — Determinação + Oblívio`,
      custaChecagemDeSangue: true,
      minutos: c.nivel * Oblivio.MINUTOS_POR_NIVEL,
      nota: `Dificuldade ${c.nivel + 1} (nível ${c.nivel} + 1), `
          + `${c.nivel * Oblivio.MINUTOS_POR_NIVEL} minutos de preparo, `
          + 'e uma Checagem de Sangue (pág. 14).'
    };
  },

  /* "o usuário só pode realizar Cerimônias benéficas EM SI MESMO" e
     "Carniçais, necromantes ou sangues-ralos que bebam de temperamentos
      vazios ganham acesso temporário a poderes de Oblívio, mas NÃO a
      Cerimônias." */
  BENEFICA_SO_EM_SI:
    'Cerimônia benéfica só vale no próprio usuário, salvo se o texto dela disser o contrário (pág. 14).',
  SEM_CERIMONIA_EMPRESTADA:
    'Quem ganhou Oblívio bebendo de temperamento vazio tem os poderes, e não as Cerimônias (pág. 14).'
};

/* ============================================================
   VITÆ — Projetos
   (básico, "Apêndice II: Projetos", págs. 415–418)

   O apêndice resolve a coisa que uma mesa solo mais sente falta:
   o TEMPO ENTRE AS SESSÕES. Tudo o que este projeto tinha até a
   §89 acontecia dentro de uma noite. Um plano de anos — comprar
   a Harpia, quebrar o banco, virar Mawla — não tinha onde morar,
   e virava conversa.

   O sistema é curto e tem um formato incomum, que vale enunciar
   antes de ler o código:

     . o ESCOPO é o preço e a medida. Ele diz quantos pontos de
       Antecedente o projeto entrega, e por isso também diz a
       Dificuldade do Lançamento (Escopo + 2) e o quanto o jogador
       arrisca (Escopo + 1, menos a margem);
     . o DADO DO PROJETO é um relógio de contagem regressiva. Começa
       em 10, cai um por incremento, e quando passa de 1 o projeto
       deu certo. Não é um dado que se rola: é a PARADA DA OPOSIÇÃO
       na rolagem de Objetivo, e é isso que faz um projeto maduro
       ser mais fácil de fechar do que um recém-lançado;
     . a rolagem de OBJETIVO é a única do jogo inteiro em que o
       jogador NÃO GANHA CRÍTICO e a oposição ganha. O livro chama
       isso, com todas as letras, de "vantagem da casa do status quo"
       (pág. 416).

   O QUE NÃO ESTÁ AQUI, e por quê:

     . A LONGUE DURÉE (pág. 417) exige jogar um capítulo de
       lançamento em Memoriam — flashback jogado, pág. 311. O projeto
       não tem Memoriam, e fingir que tem seria inventar a regra que
       falta, não a que existe. Declarado em `regras.md` §20.6;
     . os PROJETOS DA OPOSIÇÃO (págs. 417–418) são ferramenta de
       Narrador para conspirações de PN. O que sobrevive aqui é
       `interferir()`, que move o Dado de um projeto por fora — é a
       porta por onde a camada narrativa mexe no relógio.
   ============================================================ */

const Projetos = {

  /* Dificuldade do Lançamento = Escopo + 2  (pág. 415). */
  DIFICULDADE_EXTRA: 2,

  /* "o Narrador estabelece um Dado do Projeto em 10 (…) o Dado do
     Projeto diminui em um a cada incremento, em contagem regressiva
     de 10 até 1"  (pág. 416). */
  DADO_INICIAL: 10,

  /* "Um projeto com duração estimada menor do que dez dias deve ser
     tratado como um teste estendido"  (pág. 415). */
  MINIMO_DE_DIAS: 10,

  /* "Um incremento deve equivaler à provável duração do projeto
     dividida por dez"  (pág. 415). A lista é a do livro, na ordem
     dele; `dias` existe só para calcular o incremento sugerido. */
  /* `um` é o singular escrito, e não `nome.replace(/s$/, '')`: "meses"
     vira "mese" e "décadas" vira "década" — regra que acerta metade é
     a que aparece na tela como erro de português. */
  INCREMENTOS: [
    { id: 'dias',      nome: 'Dias',              um: 'dia',              dias: 1 },
    { id: 'semanas',   nome: 'Semanas',           um: 'semana',           dias: 7 },
    { id: 'quinzenas', nome: 'Quinzenas',         um: 'quinzena',         dias: 15 },
    { id: 'meses',     nome: 'Meses',             um: 'mês',              dias: 30 },
    { id: 'anos',      nome: 'Anos',              um: 'ano',              dias: 365 },
    { id: 'decadas',   nome: 'Décadas',           um: 'década',           dias: 3650 },
    { id: 'geracoes',  nome: 'Gerações mortais',  um: 'geração mortal',   dias: 9125 },
    { id: 'seculos',   nome: 'Séculos',           um: 'século',           dias: 36500 }
  ],

  /* "1 mês" / "3 meses" — o plural é o `nome` em minúsculas. */
  contarIncrementos(idIncremento, n) {
    const i = this.incrementoPor(idIncremento) || { nome: 'incrementos', um: 'incremento' };
    return `${n} ${n === 1 ? i.um : i.nome.toLowerCase()}`;
  },

  /* O PREÇO DE MEXER NA RESSONÂNCIA DE UMA BOLSA  (pág. 415)

     "Vampiros costumam usar projetos para mudar a Ressonância de uma
      bolsa e intensificar seu temperamento a longo prazo. Um ponto
      altera a Ressonância e a aumenta para Intensa, enquanto dois
      pontos altera uma Ressonância e adiciona uma Discrasia."

     A §67 leu o capítulo de Ressonância inteiro e deixou este preço
     como julgamento do Narrador, porque ele não está lá — está aqui,
     a duzentas páginas de distância. Cultivar uma bolsa é um projeto,
     e o Escopo é o preço. */
  ESCOPO_DA_RESSONANCIA: [
    { id: 'intensa',   escopo: 1, pagina: 415,
      rotulo: 'Mudar a Ressonância da bolsa e levá-la a Intensa',
      temperamento: 'intenso' },
    { id: 'discrasia', escopo: 2, pagina: 415,
      rotulo: 'Mudar a Ressonância da bolsa e acrescentar uma Discrasia',
      temperamento: 'agudo' }
  ],

  ESTADOS: ['rascunho', 'lancado', 'concluido', 'fracassado', 'encerrado'],

  incrementoPor(id) { return this.INCREMENTOS.find(i => i.id === id) || null; },

  /* O incremento que o livro sugere para uma duração estimada: o
     maior da lista que ainda cabe dez vezes dentro dela. */
  incrementoSugerido(diasEstimados) {
    const alvo = Math.max(0, Number(diasEstimados) || 0) / 10;
    let escolhido = this.INCREMENTOS[0];
    for (const i of this.INCREMENTOS) if (i.dias <= alvo) escolhido = i;
    return escolhido;
  },

  /* Abaixo de dez dias não é projeto: é teste estendido (pág. 293). */
  ehProjeto(diasEstimados) {
    return (Number(diasEstimados) || 0) >= this.MINIMO_DE_DIAS;
  },

  novo({ nome = '', objetivo = '', escopo = 1, incremento = 'meses',
         antecedente = '', parada = '', piscina = 1 } = {}) {
    return {
      /* Contador, e não sorteio: o Árbitro não tem `Math.random` desde
         a §82, e dois projetos criados no mesmo milissegundo não podem
         dividir o mesmo id. */
      id: `prj_${Date.now().toString(36)}${(this._seq = (this._seq || 0) + 1).toString(36)}`,
      nome: String(nome || '').trim(),
      objetivo: String(objetivo || '').trim(),
      escopo: Math.max(1, Number(escopo) || 1),
      incremento: this.incrementoPor(incremento) ? incremento : 'meses',
      antecedente: String(antecedente || '').trim(),
      /* `parada` é o nome da parada — "Manha + Influência" — e `piscina`
         é quantos dados ela dá. Quem soma é o jogador: o livro faz o
         Narrador determinar a parada caso a caso (pág. 415), e um
         Antecedente não é Atributo nem Perícia, então a ficha não tem
         como montá-la sozinha. */
      parada: String(parada || '').trim(),
      piscina: Math.max(1, Number(piscina) || 1),
      estado: 'rascunho',
      /* Sobe de 1 a cada FALHA no Lançamento: "o jogador pode reiniciar
         o projeto do zero, com um aumento de +1 na Dificuldade da
         rolagem de lançamento" (pág. 416). */
      reinicios: 0,
      comprometidos: 0,
      dado: null,
      incrementosCorridos: 0,
      /* "A exceção: o jogador que tirou um crítico na sua rolagem de
         Lançamento pode manter um projeto em jogo mesmo após perder
         uma rolagem de Objetivo" (pág. 417). */
      criticoNoLancamento: false,
      perdidosAlemDoRisco: 0,
      historico: []
    };
  },

  dificuldadeDeLancamento(p) {
    return p.escopo + this.DIFICULDADE_EXTRA + (p.reinicios || 0);
  },

  /* ----------------------------------------------------------
     LANÇAMENTO
     Teste simples. "O jogador não pode gastar Força de Vontade ou
     usar um Surto de Sangue na rolagem de lançamento" (pág. 415) —
     quem cobra isso é a interface, que não oferece o botão.
     ---------------------------------------------------------- */
  pedidoDeLancamento(p, { piscina, fome = 0 } = {}) {
    return Dados.pedir({
      piscina, fome,
      dificuldade: this.dificuldadeDeLancamento(p),
      rotulo: `Lançamento — ${p.nome || 'projeto'} (Escopo ${p.escopo})`
    });
  },

  /* "O comprometimento mínimo, ou risco, em uma vitória regular é de
      um ponto"  (pág. 416). E no crítico não se compromete nada. */
  comprometimentoDe(escopo, margem, critico) {
    if (critico) return 0;
    return Math.max(1, (escopo + 1) - Math.max(0, margem | 0));
  },

  apurarLancamento(p, r) {
    const eventos = [];

    if (r.passou) {
      p.estado = 'lancado';
      p.criticoNoLancamento = !!r.critico;
      p.comprometidos = this.comprometimentoDe(p.escopo, r.margem, r.critico);
      p.dado = this.DADO_INICIAL;
      p.incrementosCorridos = 0;
      eventos.push({ tipo: 'nota', texto: r.critico
        ? `O projeto foi lançado em crítico: nenhum ponto fica retido, e uma derrota de `
          + `Objetivo não o derruba de imediato (pág. 417).`
        : `O projeto foi lançado. ${p.comprometidos} ponto(s) de ${p.antecedente || 'Antecedente'} `
          + `ficam retidos até ele terminar — Escopo ${p.escopo} + 1, menos a margem de ${Math.max(0, r.margem)}.` });
      eventos.push({ tipo: 'nota',
        texto: `Dado do Projeto em ${p.dado}. Ele cai um a cada ${
          (this.incrementoPor(p.incremento) || { um: 'incremento' }).um}.` });
    } else if (r.tipo === 'total' || r.tipo === 'bestial') {
      /* "No caso de uma falha total, o personagem fez um novo inimigo,
          ou um velho inimigo energizado e motivado."  (pág. 416) */
      p.estado = 'rascunho';
      p.reinicios = (p.reinicios || 0) + 1;
      eventos.push({ tipo: 'perigo', texto:
        'Falha total no Lançamento: o plano fez um inimigo — novo, ou um velho que acordou. '
        + 'O Narrador pode decidir que ele destrói ou aliena parte do Antecedente, o que custa '
        + 'um ou mais pontos (pág. 416).' });
      eventos.push({ tipo: 'nota', texto:
        `Recomeçar do zero é permitido, com +1 na Dificuldade: agora ${this.dificuldadeDeLancamento(p)}.` });
    } else {
      /* "Em caso de falha, o jogador pode reiniciar o projeto do zero,
          com um aumento de +1 na Dificuldade da rolagem de lançamento.
          A hora não era essa."  (pág. 416) */
      p.estado = 'rascunho';
      p.reinicios = (p.reinicios || 0) + 1;
      eventos.push({ tipo: 'nota', texto:
        `A hora não era essa. Recomeçar do zero é permitido, com +1 na Dificuldade: `
        + `agora ${this.dificuldadeDeLancamento(p)}.` });
    }

    p.historico.push({ ts: Date.now(), passo: 'lancamento', tipo: r.tipo,
                       sucessos: r.sucessos, dificuldade: r.dificuldade });
    return { projeto: p, eventos };
  },

  /* ----------------------------------------------------------
     O RELÓGIO
     ---------------------------------------------------------- */
  passarIncremento(p, quantos = 1) {
    const eventos = [];
    if (p.estado !== 'lancado') return { projeto: p, eventos };
    const n = Math.max(1, quantos | 0);
    p.incrementosCorridos += n;
    /* "em contagem regressiva de 10 até 1" — o tempo sozinho leva o
       Dado até 1 e para. Passar de 1 é obra da rolagem de Objetivo. */
    p.dado = Math.max(1, (p.dado == null ? this.DADO_INICIAL : p.dado) - n);
    eventos.push({ tipo: 'nota', texto:
      `${this.contarIncrementos(p.incremento, n)} de "${p.nome || 'projeto'}". `
      + `Dado do Projeto em ${p.dado}.` });
    return { projeto: p, eventos };
  },

  interferir(p, delta, motivo = '') {
    const eventos = [];
    if (p.estado !== 'lancado') return { projeto: p, eventos };
    const antes = p.dado;
    p.dado = Math.max(1, (p.dado || this.DADO_INICIAL) + (delta | 0));
    if (p.dado !== antes) {
      p.historico.push({ ts: Date.now(), passo: 'interferencia', de: antes, para: p.dado, motivo });
      eventos.push({ tipo: 'nota', texto:
        `Interferência${motivo ? ` — ${motivo}` : ''}: Dado do Projeto ${antes} → ${p.dado}.` });
    }
    return { projeto: p, eventos };
  },

  /* ----------------------------------------------------------
     OBJETIVO
     Rolagem de conflito. Duas paradas: a do jogador, e a oposição,
     que é o próprio Dado do Projeto.
     ---------------------------------------------------------- */
  pedidoDeObjetivo(p, { piscina, fome = 0 } = {}) {
    return Dados.pedir({
      piscina, fome, dificuldade: 0,
      rotulo: `Objetivo — ${p.nome || 'projeto'} (Dado ${p.dado})`
    });
  },

  pedidoDaOposicao(p) {
    return Dados.pedir({
      piscina: Math.max(1, p.dado || this.DADO_INICIAL), fome: 0, dificuldade: 0,
      rotulo: `Oposição do projeto (Dado ${p.dado})`
    });
  },

  /* A VANTAGEM DA CASA  (pág. 416)

     "a rolagem de Objetivo não gera críticos: cada 10 conta como um
      sucesso comum. Pior ainda, os críticos contam para a oposição."

     É a única regra do jogo que desliga o crítico de um lado só, e é
     por isso que ela é escrita aqui e não no `motor-dados.js`: lá ela
     valeria para todo mundo. `basicos` já é a contagem de dados 6+
     sem o bônus dos pares — trocar `sucessos` por ele É a regra.

     O que NÃO some é a Falha Bestial: um 1 em dado de Fome continua
     valendo, porque o livro não a exclui e ela não depende de crítico. */
  semCritico(r) {
    const sucessos = r.basicos;
    const passou = r.dificuldade > 0 ? sucessos >= r.dificuldade : sucessos > 0;
    let tipo;
    if (passou) tipo = 'sucesso';
    else if (r.unsFome > 0) tipo = 'bestial';
    else if (sucessos === 0) tipo = 'total';
    else tipo = 'falha';
    return Object.assign({}, r, {
      sucessos, pares: 0, critico: false, passou, tipo, semCritico: true,
      margem: r.dificuldade > 0 ? sucessos - r.dificuldade : sucessos
    });
  },

  /* `meu` já vem passado por `semCritico`; `oposicao` NÃO — os críticos
     dela contam, e é isso que a torna perigosa. */
  apurarObjetivo(p, meu, oposicao) {
    const eventos = [];
    if (p.estado !== 'lancado') {
      return { projeto: p, eventos: [{ tipo: 'erro', texto: 'Este projeto não está em curso.' }] };
    }

    const margem = meu.sucessos - oposicao.sucessos;
    p.historico.push({ ts: Date.now(), passo: 'objetivo',
                       meus: meu.sucessos, deles: oposicao.sucessos, dado: p.dado });

    /* Empate. O livro só descreve vencer e perder; a §6.4 do projeto já
       lê conflito empatado como margem zero, e margem zero não move
       nada. Está declarado em `regras.md` §20.5 como leitura, não como
       texto do livro. */
    if (margem === 0) {
      eventos.push({ tipo: 'nota', texto:
        `Empate em ${meu.sucessos} sucesso(s): o incremento passou e nada andou. `
        + `Dado do Projeto segue em ${p.dado}.` });
      return { projeto: p, eventos, resultado: 'empate', margem: 0 };
    }

    if (margem > 0) {
      const antes = p.dado;
      p.dado = antes - margem;
      eventos.push({ tipo: 'nota', texto:
        `${meu.sucessos} contra ${oposicao.sucessos}: ${margem} de dano ao Dado do Projeto, `
        + `de ${antes} para ${p.dado}.` });
      if (p.dado < 1) {
        p.estado = 'concluido';
        eventos.push({ tipo: 'critico', texto:
          `O Dado do Projeto caiu abaixo de 1: "${p.nome || 'o projeto'}" deu certo. `
          + `${p.escopo} ponto(s) em ${p.antecedente || 'Antecedente'}, e os `
          + `${p.comprometidos} retido(s) voltam a ser seus. `
          + `Cabe ao Narrador dar à cidade uma razão para essa virada (pág. 416).` });
      }
      return { projeto: p, eventos, resultado: 'vitoria', margem };
    }

    /* Derrota. "ele sofre dano e perde seus pontos de Antecedentes,
        começando com os comprometidos com o risco"  (pág. 416). */
    const dano = -margem;
    const doRisco = Math.min(p.comprometidos, dano);
    const alemDoRisco = dano - doRisco;
    p.comprometidos -= doRisco;
    p.perdidosAlemDoRisco += alemDoRisco;

    eventos.push({ tipo: 'perigo', texto:
      `${oposicao.sucessos} contra ${meu.sucessos}${oposicao.critico ? ' (crítico da oposição)' : ''}: `
      + `${dano} ponto(s) perdido(s)${doRisco ? `, ${doRisco} dos retidos` : ''}`
      + `${alemDoRisco ? ` e ${alemDoRisco} direto de ${p.antecedente || 'Antecedente'}` : ''}.` });

    if (p.comprometidos <= 0) {
      if (p.criticoNoLancamento) {
        eventos.push({ tipo: 'nota', texto:
          'O crítico do Lançamento segura: o projeto continua em jogo mesmo sem pontos '
          + 'retidos (pág. 417).' });
      } else {
        p.estado = 'fracassado';
        eventos.push({ tipo: 'perigo', texto:
          `Os pontos retidos chegaram a zero: "${p.nome || 'o projeto'}" falha de repente. `
          + `Cabe ao Narrador dar à cidade uma razão (pág. 417).` });
      }
    }
    return { projeto: p, eventos, resultado: 'derrota', margem };
  },

  /* "O iniciador de um projeto sempre pode encerrá-lo"  (pág. 417). */
  encerrar(p, motivo = '') {
    const eventos = [];
    if (p.estado === 'concluido' || p.estado === 'fracassado' || p.estado === 'encerrado') {
      return { projeto: p, eventos };
    }
    const retidos = p.comprometidos;
    p.estado = 'encerrado';
    p.comprometidos = 0;
    p.historico.push({ ts: Date.now(), passo: 'encerrado', motivo });
    eventos.push({ tipo: 'nota', texto:
      `"${p.nome || 'O projeto'}" foi encerrado por quem o iniciou${motivo ? ` — ${motivo}` : ''}. `
      + (retidos ? `${retidos} ponto(s) retido(s) voltam a ser seus. ` : '')
      + 'Os inimigos ganhados pelo caminho não se encerram junto (pág. 417).' });
    return { projeto: p, eventos };
  },

  emCurso(lista) { return (lista || []).filter(p => p && p.estado === 'lancado'); },

  /* Uma linha por projeto para o prefixo do Narrador. Ele não rola nada
     — só precisa saber o que este personagem está tramando há meses,
     para que a cidade reaja a isso. */
  paraModelo(lista) {
    const vivos = this.emCurso(lista);
    if (!vivos.length) return '';
    return vivos.map(p =>
      `- ${p.nome || 'projeto sem nome'}: ${p.objetivo || 'objetivo não descrito'} `
      + `(Escopo ${p.escopo}, Dado do Projeto em ${p.dado}, ${p.comprometidos} ponto(s) retidos`
      + `${p.antecedente ? ` em ${p.antecedente}` : ''})`).join('\n');
  }
};

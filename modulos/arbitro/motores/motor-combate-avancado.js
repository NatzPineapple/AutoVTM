/* ============================================================
   VITÆ — Conflito Avançado
   (básico, "Conflito Avançado", págs. 295–305)

   O básico tem DOIS capítulos de conflito. O primeiro (págs.
   123–130) é o que este projeto já implementava; o segundo é este,
   e ele se apresenta como um conjunto de módulos opcionais:

     "O Narrador pode usar qualquer um dos sistemas ou módulos de
      Conflito Avançado sem ter de usar todos, além das regras do
      Conflito básico."                                (pág. 295)

   O que mora aqui é o que é do capítulo avançado E chega ao dado:

     . a INICIATIVA (pág. 300);
     . o AGARRAMENTO (pág. 301);
     . o COMBATE SOCIAL (págs. 304–305).

   O que ficou de fora está declarado em `regras.md` §15.9, com o
   motivo de cada um. A regra da casa é a mesma da §88 e da §89:
   divergência conhecida vale mais escrita do que escondida.

   UM COMENTÁRIO QUE ESTAVA ERRADO, E QUE CUSTOU CARO.  (§90)

   O cabeçalho que morava aqui dizia, com todas as letras:

     "O V5 não publica sistema de iniciativa: o livro deixa a ordem
      com o Mestre. Como aqui não há Mestre humano, a ordem precisa
      ser determinística e auditável, então ela é convenção da mesa."

   Não é verdade. O livro publica dois: ordena por situação na pág.
   125 e dá um valor de Iniciativa na pág. 300. A frase foi escrita
   antes de alguém ler a pág. 300, e ela não era uma dúvida — era
   uma AFIRMAÇÃO, e afirmação errada no comentário é pior do que
   ausência de comentário: ela fecha a pergunta. O `d10 + Destreza +
   Raciocínio` que rodou até aqui existiu porque essa frase dizia
   que não havia o que copiar.
   ============================================================ */

/* ============================================================
   A INICIATIVA NÃO ERA DE LIVRO NENHUM.  (§90)

   O que havia aqui era `d10 + Destreza + Raciocínio`. Nenhum dos dois
   sistemas do básico diz isso:

   . o BÁSICO (pág. 125) nem tem valor de iniciativa. Ele ordena por
     situação — corpo a corpo já engajado, depois à distância, depois
     corpo a corpo recém-iniciado, depois o resto — e usa Destreza +
     Raciocínio só como DESEMPATE. Está escrito no `regras.md` §6.4
     desde a §63, certo, e o motor não seguia;
   . o AVANÇADO (pág. 300) tem valor, e é outro: "Cada jogador possui
     um valor de Iniciativa igual à soma dos seus valores de
     Autocontrole + Percepção". E é ESTÁTICO: "Você NÃO REALIZA um
     teste de Iniciativa. Os valores de Iniciativa permanecem os mesmos
     durante o combate."

   O projeto pegou o desempate de um e o dado de lugar nenhum. O dado
   era o pior pedaço: ele fazia a mesma briga, com as mesmas fichas,
   sair numa ordem diferente a cada rodada — e ninguém tinha como saber
   que aquilo não era regra, porque parecia iniciativa de RPG.

   Ficou o sistema AVANÇADO, e não o básico, por uma razão de projeto e
   não de gosto: esta mesa DESENHA a ordem de iniciativa numa lista.
   Quem desenha uma lista de iniciativa já escolheu o sistema que tem
   uma; o que faltava era usar os números certos dele.
   ============================================================ */
const Rodada = {
  /* Autocontrole (Atributo) + Percepção (Habilidade — `consciencia` é
     o id dela neste projeto desde a §71.2). */
  INICIATIVA: { atributo: 'autocontrole', habilidade: 'consciencia' },

  /* "Em alguns conflitos, como em um duelo formal, você pode substituir
     Destreza (ou Determinação, no caso de um duelo muito formal) por
     Autocontrole no valor de Iniciativa" (pág. 300). */
  DUELO: { formal: 'destreza', muitoFormal: 'determinacao' },

  iniciativaDe(ficha, estados, { duelo = null } = {}) {
    const atributoId = duelo === 'formal' ? this.DUELO.formal
                     : duelo === 'muito-formal' ? this.DUELO.muitoFormal
                     : this.INICIATIVA.atributo;
    const a = (ficha && ficha.atributos) || {};
    const h = (ficha && ficha.habilidades) || {};
    /* SEM PENALIDADE DE ESTADO, e sem dado.

       Debilitado tira dados de PARADAS físicas; Iniciativa aqui não é
       parada — não se rola. Descontar dela seria inventar, e o valor
       estático é o ponto do sistema: "permanecem os mesmos durante o
       combate, mesmo quando um combatente muda a Habilidade de combate
       que ele usa" (pág. 300). */
    const base = (a[atributoId] || 0) + (h[this.INICIATIVA.habilidade] || 0);
    return { base, atributoId, habilidadeId: this.INICIATIVA.habilidade,
             penalidade: 0, total: base };
  },

  foraDeCombate(combatente) {
    const f = combatente && combatente.ficha;
    if (!f) return true;
    const t = Estado.trilhas(f);
    if (f.mortal) return t.vitalidade.livres === 0;
    return t.vitalidade.max > 0 && t.vitalidade.agr >= t.vitalidade.max;
  },

  /* OS DESEMPATES SÃO OS DO LIVRO, NA ORDEM DO LIVRO  (pág. 300)

     "No caso de empates, os personagens dos jogadores agem antes dos
      personagens do Narrador. Se necessário, resolva os desempates que
      persistirem do seguinte modo: vampiros agem antes de mortais,
      então as ações ocorrem em ordem decrescente de Autocontrole."

     O livro fecha com "Se ainda houver um empate, role um dado". Aqui o
     último degrau é o NOME, e a troca é declarada em `regras.md` §15.7:
     este motor não produz acaso (§82), e a ordem é desenhada numa lista
     que o jogador relê — ordem estável vale mais do que o quarto
     desempate de um empate que já passou por três. */
  ordenar(combatentes, opcoes = {}) {
    const autocontroleDe = (c) => ((c.ficha && c.ficha.atributos) || {}).autocontrole || 0;
    return (combatentes || [])
      .filter(c => !this.foraDeCombate(c))
      .map(c => Object.assign({ ref: c.ref, nome: c.nome, agiu: false, passou: false,
                                doJogador: !!c.doJogador,
                                vampiro: !(c.ficha && c.ficha.mortal),
                                autocontrole: autocontroleDe(c) },
                              this.iniciativaDe(c.ficha, c.estados, opcoes)))
      .sort((a, b) =>
        b.total - a.total ||
        (b.doJogador ? 1 : 0) - (a.doJogador ? 1 : 0) ||
        (b.vampiro ? 1 : 0) - (a.vampiro ? 1 : 0) ||
        b.autocontrole - a.autocontrole ||
        String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
  },

  /* PASSAR A VEZ  (pág. 300)

     "Um combatente também pode passar a vez, o que o coloca por último
      na ordem (e o mantém nesse lugar pelo restante do conflito.)
      Qualquer outro combatente que passe a vez é colocado antes de
      qualquer outro que já tenha passado."

     Ou seja: quem passa vai para o fim, e quem passa DEPOIS entra na
     frente de quem já tinha passado — os que passaram ficam em ordem
     inversa de quando passaram. */
  passar(rodada, ref) {
    if (!rodada) return { rodada: null, eventos: [] };
    const i = rodada.ordem.findIndex(x => x.ref === ref);
    if (i < 0) return { rodada, eventos: [] };
    const quem = rodada.ordem[i];
    rodada.ordem.splice(i, 1);

    const jaPassaram = rodada.ordem.findIndex(x => x.passou);
    quem.passou = true;
    quem.agiu = false;
    if (jaPassaram < 0) rodada.ordem.push(quem);
    else rodada.ordem.splice(jaPassaram, 0, quem);

    const atual = rodada.ordem.findIndex(x => !x.agiu);
    rodada.indice = atual < 0 ? rodada.ordem.length : atual;
    return { rodada, eventos: [{ tipo: 'combate',
      texto: `${quem.nome} passa a vez e vai para o fim da ordem (pág. 300).` }] };
  },

  abrir(combatentes, numero = 1) {
    const ordem = this.ordenar(combatentes);
    if (!ordem.length) return null;
    return { numero, ordem, indice: 0, encerrada: false };
  },

  atual(rodada) {
    if (!rodada || rodada.encerrada) return null;
    return rodada.ordem[rodada.indice] || null;
  },

  vezDe(rodada, ref) {
    const a = this.atual(rodada);
    return !!a && a.ref === ref;
  },

  sincronizar(rodada, combatentes) {
    if (!rodada) return null;
    const vivos = new Set((combatentes || []).filter(c => !this.foraDeCombate(c)).map(c => c.ref));
    const atual = this.atual(rodada);
    rodada.ordem = rodada.ordem.filter(x => vivos.has(x.ref));
    if (!rodada.ordem.length) { rodada.encerrada = true; rodada.indice = 0; return rodada; }
    const novo = atual ? rodada.ordem.findIndex(x => x.ref === atual.ref) : -1;
    rodada.indice = novo >= 0 ? novo : rodada.ordem.findIndex(x => !x.agiu);
    if (rodada.indice < 0) rodada.indice = rodada.ordem.length;
    return rodada;
  },

  avancar(rodada, combatentes) {
    if (!rodada) return { rodada: null, fim: true, eventos: [] };
    const eventos = [];
    const atual = this.atual(rodada);
    if (atual) atual.agiu = true;

    this.sincronizar(rodada, combatentes);
    let i = rodada.indice;
    while (i < rodada.ordem.length && rodada.ordem[i].agiu) i++;
    rodada.indice = i;

    if (i < rodada.ordem.length) return { rodada, fim: false, eventos };

    const restantes = (combatentes || []).filter(c => !this.foraDeCombate(c));
    if (restantes.length < 2) {
      rodada.encerrada = true;
      eventos.push({ tipo: 'combate', texto: 'A briga acabou. Ninguém mais tem com quem trocar golpe.' });
      return { rodada, fim: true, eventos };
    }

    const nova = this.abrir(restantes, rodada.numero + 1);
    eventos.push({ tipo: 'combate', texto: `Rodada ${nova.numero}. ${this.descreverOrdem(nova)}` });
    return { rodada: nova, fim: false, eventos };
  },

  descreverOrdem(rodada) {
    if (!rodada || !rodada.ordem.length) return 'Ninguém de pé.';
    return `Ordem: ${rodada.ordem.map(x => `${x.nome} (${x.total})`).join(', ')}.`;
  },

  escolhaDoOponente(oponente, alvo) {
    const arma = (oponente && oponente.armaDele) || '';
    const tipo = /pistola|9 ?mm|espingarda|rifle|revólver|revolver|\.22|\.357|\.38/i.test(arma)
      ? 'fogo'
      : (arma ? 'branca' : 'desarmado');
    const cap = Arbitro.capacidadesDe((oponente && oponente.estados) || []);
    const exige = tipo === 'fogo' ? ['maos', 'visao'] : ['movimento', 'corpo'];
    const impedido = exige.filter(c => !cap.ativas.has(c));
    if (impedido.length) {
      return { possivel: false, tipo, arma,
               motivo: `${oponente.nome} não consegue agir: ${
                 impedido.map(c => Arbitro.CAPACIDADES[c]).join(' e ')} fora.` };
    }
    return { possivel: true, tipo, arma: arma || null, alvo: (alvo && alvo.ref) || 'voce' };
  }
};


/* ============================================================
   AGARRAMENTO  (básico, pág. 301)

   O `regras.md` §15.4 descrevia o agarramento inteiro desde a §63 —
   a disputa, as três escolhas do vencedor, a fuga do agarrado, a
   mordida sem penalidade — e o motor não tinha nada disso. Havia um
   ESTADO `agarrado` em `motor-arbitro.js`, que alguém podia marcar à
   mão, e mais nada: nenhuma forma de chegar nele jogando.

   É a mesma distância que a §67 achou na Ressonância e que esta
   mesma leitura achou nos Ferimentos Incapacitantes — o documento
   certo, o dado certo, e nenhum caminho até o dado.
   ============================================================ */
const Agarramento = {

  /* "Um combatente pode tentar agarrar, segurar, derrubar ou conter de
      alguma forma um oponente ao rolar Força + Briga." */
  ROTA: { atributo: 'forca', pericia: 'briga' },

  /* "Morder o oponente (caso o agarrador seja um vampiro) e causar
      dois pontos de dano Agravado." */
  DANO_DA_MORDIDA: 2,

  piscinaDe(ficha, estados) {
    const p = Dados.piscinaDe(ficha, this.ROTA.atributo, this.ROTA.pericia);
    const pen = Arbitro.penalidadeDeEstados(estados || [], 'fisico');
    return Math.max(1, p.total + pen.dados);
  },

  /* PRIMEIRO TURNO — agarrar.

     "Se ele conseguir mais sucessos do que seu oponente, NÃO CAUSA
      NENHUM DANO; em vez disso, ele o contém, evitando que se mova e
      ataque outros oponentes, embora ainda possa agir contra o próprio
      agarrador normalmente."

     Repare no que o livro não dá: dano. Um agarramento bem-sucedido é
     uma troca — você tira o oponente da briga dos outros em troca de
     não ter ferido ninguém neste turno. */
  agarrar({ atacante, defensor, estadosAtacante = [], estadosDefensor = [] }) {
    const eventos = [];
    const meu = Dados.rolar({ piscina: this.piscinaDe(atacante, estadosAtacante),
      fome: atacante.fome || 0, dificuldade: 0, rotulo: 'Agarrar — Força + Briga' });
    const dele = Dados.rolar({ piscina: this.piscinaDe(defensor, estadosDefensor),
      fome: defensor.fome || 0, dificuldade: 0, rotulo: 'Resistir — Força + Briga' });
    const margem = meu.sucessos - dele.sucessos;

    if (margem <= 0) {
      eventos.push({ tipo: 'combate',
        texto: `Agarramento falhou: ${meu.sucessos} contra ${dele.sucessos}. Ninguém é contido.` });
      return { agarrou: false, margem, meu, dele, eventos };
    }
    eventos.push({ tipo: 'combate',
      texto: `Agarrado por ${margem} de margem — e SEM dano: quem agarra contém, não fere `
           + `(pág. 301). Ele não se move nem ataca outros, mas continua agindo contra você.` });
    return { agarrou: true, margem, meu, dele, eventos, estado: 'agarrado' };
  },

  /* TURNOS SEGUINTES — a disputa de quem está preso.

     "No próximo turno, o agarrador pode atacá-lo com uma disputa de
      Força + Briga. Se o agarrador vencer, pode escolher uma das
      seguintes opções: causar dano no oponente baseado na sua margem
      de sucesso, como em um ataque normal; morder o oponente (caso o
      agarrador seja um vampiro) e causar dois pontos de dano Agravado;
      ou mantê-lo imóvel. Caso o agarrado vença, ele escapa e pode se
      mover livremente no próximo turno." */
  ESCOLHAS: [
    { id: 'dano',    nome: 'Machucar',   nota: 'Dano pela margem, como num ataque normal.' },
    { id: 'morder',  nome: 'Morder',     nota: '2 de Agravado, fixos. Só vampiro — e contra alvo agarrado a mordida não paga a penalidade de mirar (pág. 301).' },
    { id: 'segurar', nome: 'Só segurar', nota: 'Mantém imóvel. Nenhum dano.' }
  ],

  resolverTurno({ atacante, defensor, escolha = 'segurar',
                  estadosAtacante = [], estadosDefensor = [], alvoVampiro = true }) {
    const eventos = [];
    const meu = Dados.rolar({ piscina: this.piscinaDe(atacante, estadosAtacante),
      fome: atacante.fome || 0, dificuldade: 0, rotulo: 'Manter o agarramento — Força + Briga' });
    const dele = Dados.rolar({ piscina: this.piscinaDe(defensor, estadosDefensor),
      fome: defensor.fome || 0, dificuldade: 0, rotulo: 'Escapar — Força + Briga' });
    const margem = meu.sucessos - dele.sucessos;

    if (margem <= 0) {
      eventos.push({ tipo: 'combate',
        texto: `${defensor.nome || 'Ele'} escapa: ${dele.sucessos} contra ${meu.sucessos}. `
             + `No próximo turno ele se move livremente.` });
      return { manteve: false, escapou: true, margem, meu, dele, eventos, dano: 0 };
    }

    if (escolha === 'segurar') {
      eventos.push({ tipo: 'combate', texto: 'Segurado por mais um turno, sem dano.' });
      return { manteve: true, escapou: false, margem, meu, dele, eventos, dano: 0, escolha };
    }

    if (escolha === 'morder') {
      /* "Ataques com mordida contra um oponente agarrado não sofrem
          nenhuma penalidade de mordida na rolagem de ataque" — a
          penalidade de 1 sucesso da mordida mirada (pág. 213) não entra
          aqui, e é por isso que agarrar antes de morder vale a pena. */
      const r = Estado.aplicarDano(defensor, { quantidade: this.DANO_DA_MORDIDA,
        tipo: 'agravado', fonte: 'Mordida', semMetade: !alvoVampiro });
      eventos.push({ tipo: 'combate',
        texto: `As presas entram: ${this.DANO_DA_MORDIDA} de Agravado, fixos — a margem não muda `
             + `isso. Contra alvo agarrado a mordida não paga a penalidade de mirar (pág. 301).` });
      eventos.push(...r.eventos);
      return { manteve: true, escapou: false, margem, meu, dele, eventos,
               dano: this.DANO_DA_MORDIDA, natureza: 'agravado', escolha,
               destruido: r.destruido, torpor: r.torpor };
    }

    const r = Estado.aplicarDano(defensor, { quantidade: margem, tipo: 'superficial',
      fonte: 'Agarramento', semMetade: !alvoVampiro });
    eventos.push({ tipo: 'combate', texto: `Machucado pela margem: ${margem} de Superficial.` });
    eventos.push(...r.eventos);
    return { manteve: true, escapou: false, margem, meu, dele, eventos,
             dano: margem, natureza: 'superficial', escolha,
             destruido: r.destruido, torpor: r.torpor };
  }
};


/* ============================================================
   COMBATE SOCIAL — "Facas em seus Sorrisos"  (básico, págs. 304–305)

   "Resolva conflitos sociais com as mesmas mecânicas usadas para
    combates físicos."

   Mudam três coisas, e só três:

     1. a trilha ferida é a FORÇA DE VONTADE, não a Vitalidade;
     2. a Iniciativa, quando importa, é Raciocínio + Etiqueta;
     3. há um bônus de dano pela AUDIÊNCIA — e essa é a parte boa do
        sistema: "O dano à Força de Vontade dói mais quando há
        terceiros assistindo à sua queda."

   A tabela da audiência já morava em `data-escudo.js` como
   `DANO_SOCIAL`, e `Tabelas.danoSocialExtra` já sabia lê-la — e, como
   os Ferimentos Incapacitantes, NADA A CHAMAVA. Duas tabelas mortas no
   mesmo capítulo do livro, achadas na mesma leitura.

   O livro é explícito sobre o que conta como audiência: "apenas estar
   presente não conta; a audiência precisa estar INTERESSADA no
   resultado da disputa".
   ============================================================ */
const CombateSocial = {

  INICIATIVA: { atributo: 'raciocinio', habilidade: 'etiqueta' },

  /* Exemplos de parada do livro (págs. 304–305). Não é lista fechada —
     "as paradas acima podem variar dependendo das ações executadas e
     das circunstâncias" — e por isso `resolver` aceita qualquer rota. */
  ROTAS: [
    { id: 'olhares',   nome: 'Disputa de olhares',                    atributo: 'forca',        pericia: 'intimidacao' },
    { id: 'intimidar', nome: 'Intimidar uma gangue rival',            atributo: 'determinacao', pericia: 'intimidacao' },
    { id: 'desmentir', nome: 'Convencer de que seu rival mente',      atributo: 'manipulacao',  pericia: 'persuasao' },
    { id: 'pesquisa',  nome: 'Desmentir com pesquisa, não com lábia', atributo: 'inteligencia', pericia: 'persuasao' },
    { id: 'elisio',    nome: 'Subir de posição durante o Elísio',     atributo: 'autocontrole', pericia: 'etiqueta' },
    { id: 'fofoca',    nome: 'Espalhar rumor em vez de enfrentar',    atributo: 'manipulacao',  pericia: 'etiqueta' },
    { id: 'palco',     nome: 'Duelo de rimas, com presença de palco', atributo: 'carisma',      pericia: 'performance' },
    { id: 'seducao',   nome: 'Brincar com as vaidades do rival',      atributo: 'carisma',      pericia: 'intuicao' }
  ],

  rotaPor(id) { return this.ROTAS.find(r => r.id === id) || null; },

  /* A audiência, pela tabela do Escudo — que é a mesma do básico, pág.
     305, e foi conferida contra ela na §90. */
  extraDaAudiencia(testemunhas) {
    const linha = Arbitro.danoSocialExtra(testemunhas || '');
    return { extra: linha ? linha.extra : 0,
             testemunhas: linha ? linha.testemunhas : 'Apenas os oponentes' };
  },

  iniciativaDe(ficha) {
    const a = (ficha && ficha.atributos) || {};
    const h = (ficha && ficha.habilidades) || {};
    return (a[this.INICIATIVA.atributo] || 0) + (h[this.INICIATIVA.habilidade] || 0);
  },

  /* "Os combatentes rolam suas respectivas paradas e comparam a
      quantidade de sucessos obtida. O combatente com mais sucessos
      subtrai destes os sucessos do seu oponente e aplica o resultado
      como dano à Força de Vontade de seu oponente." */
  resolver({ atacante, defensor, rota = 'desmentir', rotaDefesa = null,
             testemunhas = '', estadosAtacante = [], estadosDefensor = [] }) {
    const eventos = [];
    const minha = typeof rota === 'string' ? this.rotaPor(rota) : rota;
    const dela = (typeof rotaDefesa === 'string' ? this.rotaPor(rotaDefesa) : rotaDefesa) || minha;
    if (!minha || !dela) {
      return { possivel: false, eventos: [{ tipo: 'erro', texto: 'Rota social desconhecida.' }] };
    }

    const penA = Arbitro.penalidadeDeEstados(estadosAtacante, 'social');
    const penD = Arbitro.penalidadeDeEstados(estadosDefensor, 'social');
    const pA = Dados.piscinaDe(atacante, minha.atributo, minha.pericia);
    const pD = Dados.piscinaDe(defensor, dela.atributo, dela.pericia);

    const meu = Dados.rolar({ piscina: Math.max(1, pA.total + penA.dados), fome: atacante.fome || 0,
      dificuldade: 0, rotulo: `${nomeAtributo(minha.atributo)} + ${nomeHabilidade(minha.pericia)}` });
    const seu = Dados.rolar({ piscina: Math.max(1, pD.total + penD.dados), fome: defensor.fome || 0,
      dificuldade: 0, rotulo: `${nomeAtributo(dela.atributo)} + ${nomeHabilidade(dela.pericia)}` });

    const margem = meu.sucessos - seu.sucessos;
    const aud = this.extraDaAudiencia(testemunhas);

    if (margem === 0) {
      eventos.push({ tipo: 'combate',
        texto: `Empate em ${meu.sucessos}: ninguém cede terreno, e a plateia continua olhando.` });
      return { possivel: true, vencedor: null, margem: 0, dano: 0, meu, seu, audiencia: aud, eventos };
    }

    const venceuAtacante = margem > 0;
    const alvo = venceuAtacante ? defensor : atacante;
    const dano = Math.abs(margem) + aud.extra;

    if (aud.extra) eventos.push({ tipo: 'nota',
      texto: `Audiência — ${aud.testemunhas}: +${aud.extra} de dano à Força de Vontade (pág. 305). `
           + `Só conta quem está interessado no resultado.` });

    eventos.push({ tipo: 'combate',
      texto: `${venceuAtacante ? 'Você' : (defensor.nome || 'Ele')} vence por ${Math.abs(margem)}: `
           + `${dano} à Força de Vontade de ${venceuAtacante ? (defensor.nome || 'ele') : 'você'}.` });

    const r = Estado.aplicarDano(alvo, { quantidade: dano, tipo: 'superficial',
      fonte: 'Combate social', trilha: 'vontade', semMetade: true });
    eventos.push(...r.eventos);

    /* "Um combate social termina no momento em que um dos lados se dá
        por vencido, geralmente quando Debilitado, embora às vezes um
        oponente prossiga até o colapso mental total, quando sua trilha
        de Força de Vontade fica totalmente preenchida com dano
        Agravado." */
    const t = Estado.trilhas(alvo);
    if (t.vontade.livres === 0) eventos.push({ tipo: 'perigo',
      texto: `${venceuAtacante ? (defensor.nome || 'Ele') : 'Você'} está sem Força de Vontade: `
           + `é aqui que quase todo mundo se dá por vencido (pág. 305).` });

    return { possivel: true, vencedor: venceuAtacante ? 'atacante' : 'defensor',
             margem: Math.abs(margem), dano, meu, seu, audiencia: aud, eventos,
             debilitado: t.vontade.livres === 0 };
  },

  /* CONCEDER É AÇÃO, E ELA ACONTECE ANTES DA ROLAGEM.

     "Um combatente social sempre tem a oportunidade de conceder, ou
      dar-se por vencido, ANTES QUE AS PARADAS SEJAM ROLADAS — quase
      sempre é melhor recuar do que ser humilhado e exaurido, caso a
      derrota pareça inevitável."                          (pág. 305)

     Quem concede não rola, e por isso não leva dano nenhum. É a
     válvula que impede o combate social de virar moedor: sem ela, a
     única saída de uma discussão perdida é a trilha cheia. */
  conceder({ quem = 'Você' } = {}) {
    return { possivel: true, vencedor: null, concedeu: true, dano: 0, eventos: [{ tipo: 'nota',
      texto: `${quem} concede antes de as paradas serem roladas: nenhum dano, e a derrota fica `
           + `combinada em vez de sofrida (pág. 305). O vencedor leva o que estava em jogo.` }] };
  }
};


/* ============================================================
   FERIMENTOS INCAPACITANTES  (básico, pág. 303)

   "Após sofrer dano ENQUANTO SE ENCONTRA DEBILITADO, um personagem
    rola 1d10 na tabela, adicionando a quantidade de dano Agravado
    atual na sua trilha de Vitalidade à rolagem."

   A tabela já morava em `data-escudo.js` e `Tabelas.ferimentoPor` já
   sabia rolá-la desde sempre — e NADA NO JOGO A CHAMAVA. É o mesmo
   achado da §67 com a Ressonância, e a §90 achou o par dele na tabela
   da audiência do combate social: o dado estava lá, a função estava
   lá, e o caminho até o dado não existia.

   Fica OPCIONAL porque o livro a apresenta assim — "para jogadores à
   procura de um combate mais substancial" — e porque ela mata: 13+ é
   torpor imediato num vampiro.
   ============================================================ */
const Ferimentos = {
  talvez(defensor, { debilitadoAntes, dano, ferimentosIncapacitantes, eventos }) {
    if (!ferimentosIncapacitantes || !debilitadoAntes || !dano) return null;
    const t = Estado.trilhas(defensor);
    const r = Arbitro.ferimentoPor(t.vitalidade.agr);
    if (!r || !r.ferimento) return null;
    eventos.push({ tipo: 'perigo',
      texto: `Ferido já estando Debilitado — 1d10 + ${t.vitalidade.agr} de Agravado = ${r.total}: `
           + `${r.ferimento.nome}. ${r.ferimento.efeito}` });
    return { total: r.total, nome: r.ferimento.nome, efeito: r.ferimento.efeito,
             agravadoNaTrilha: t.vitalidade.agr };
  }
};


/* ============================================================
   "MAIOR DO QUE UMA PISTOLA"  (básico, pág. 302)

   "o usuário da arma de fogo sofre uma penalidade de −2 dados, caso
    alveje alguém que esteja fora do combate corpo a corpo, e outra
    penalidade de −2 caso sua arma seja MAIOR DO QUE UMA PISTOLA."

   O livro não dá lista; dá a fronteira. Aqui ela é por exclusão —
   primeiro o que É pistola, depois o que é longo — porque "pistola
   9 mm" contém "9 mm" e "submetralhadora" contém "metralhadora": a
   ordem das duas perguntas é a regra.
   ============================================================ */
const ArmaGrande = {
  PISTOLAS: /pistola|revolver|\.22|\.38|\.357|glock|9 ?mm/,
  LONGAS: /rifle|espingarda|escopeta|fuzil|metralhadora|submetralhadora|carabina|besta|ak|m4|\.308|calibre 12|\.12/,

  eh(arma) {
    const n = Arbitro.normalizar(arma || '');
    if (!n) return false;
    if (this.PISTOLAS.test(n)) return false;
    return this.LONGAS.test(n);
  }
};

/* ============================================================
   CONFLITO DE ROLAGEM ÚNICA  (§95 — item A11)
   básico, págs. 296 e 298–299

   "Um conflito não precisa necessariamente ser resolvido como uma
    série detalhada de interações, conforme as regras básicas. Ele
    também pode ser resolvido de um modo mais geral, especialmente se
    contiver menos potencial para gerar drama ou envolver poucos
    jogadores."

   Era a maior coisa que faltava do Conflito Avançado, e a §15.12
   dizia isso com todas as letras.

   E ela tem DUAS TABELAS DE DIFICULDADE, não uma. A §15.12 do
   documento tinha "Dificuldade 2/4/6", que é metade de uma delas — o
   erro veio de ler as duas páginas como se fossem a mesma regra:

     · pág. 298–299 — ABRIR o conflito inteiro numa rolagem. A
       Dificuldade sai do PODER DA OPOSIÇÃO: 2, 4 ou 6.
     · pág. 296 — ENCERRAR um conflito que já está rolando. A
       Dificuldade sai de COMO FORAM OS ÚLTIMOS TRÊS TURNOS: 3, 4, 5
       ou 6.

   São perguntas diferentes e valores diferentes, e usar a primeira
   para encerrar uma briga em andamento daria a resposta errada em
   três dos quatro casos.
   ============================================================ */

const RolagemUnica = {

  /* Pág. 298–299 — o conflito inteiro, pelo poder da oposição. */
  POR_PODER: [
    { id: 'fraca',   dificuldade: 2,
      texto: 'A oposição é significativamente mais fraca ou a meta é simples de ser alcançada' },
    { id: 'parelha', dificuldade: 4,
      texto: 'Ambos os lados se igualam em poder ou a meta é um desafio e tanto' },
    { id: 'forte',   dificuldade: 6,
      texto: 'A oposição é muito mais forte ou a meta é extremamente difícil de ser alcançada' }
  ],

  /* Pág. 296 — encerrar o que já está rolando, pelos últimos três
     turnos. "Conflitos entre indivíduos têm vencedores evidentes a
     cada turno; às vezes, combates maiores também." */
  POR_TURNOS: [
    { id: 'dominando', dificuldade: 3,
      texto: 'A maior parte do combate foi favorável, ou venceram os últimos três turnos' },
    { id: 'parelho', dificuldade: 4,
      texto: 'Ambos os lados sofreram igualmente, ou venceram dois de três turnos' },
    { id: 'apanhando', dificuldade: 5,
      texto: 'Se deram mal, ou venceram só uma interação de três' },
    { id: 'sobrevivendo', dificuldade: 6,
      texto: 'Tiveram a sorte de sobreviver até aqui, ou perderam os últimos três turnos' }
  ],

  /* Os dois ajustes de 1, e eles são independentes: o livro dá um
     para Disciplinas e outro para posição, em parágrafos separados. */
  AJUSTES: {
    disciplinas: 'vantagem em Disciplinas ou poderes sobrenaturais equivalentes',
    posicao: 'vantagem da posição, preparação ou surpresa'
  },

  /* `vantagens` é do lado do JOGADOR: cada uma BAIXA a Dificuldade em
     1. O livro diz "ajuste a Dificuldade em 1 para o lado com a
     vantagem", e ajustar a favor de quem rola é baixar — quem rola é
     sempre o personagem do jogador, porque a oposição não rola. */
  dificuldade({ poder = null, turnos = null, vantagens = [], contra = [] } = {}) {
    const tabela = turnos ? this.POR_TURNOS : this.POR_PODER;
    const linha = tabela.find(l => l.id === (turnos || poder))
                || tabela.find(l => l.dificuldade === 4);
    const boas = vantagens.filter(v => this.AJUSTES[v]);
    const mas = contra.filter(v => this.AJUSTES[v]);
    const valor = Math.max(1, linha.dificuldade - boas.length + mas.length);
    return {
      dificuldade: valor, base: linha.dificuldade, linha,
      tabela: turnos ? 'últimos três turnos (pág. 296)' : 'poder da oposição (pág. 298)',
      ajustes: [...boas.map(v => ({ id: v, dados: -1, texto: this.AJUSTES[v] })),
                ...mas.map(v => ({ id: v, dados: +1, texto: `a oposição tem ${this.AJUSTES[v]}` }))]
    };
  },

  /* O PEDIDO, no formato da §82: o Árbitro diz quais dados, a Mesa
     rola, o Árbitro apura. Aqui há duas travas que o livro escreve, e
     as duas são de ausência:

     "cada jogador que participe do conflito realiza uma rolagem com
      uma parada de dados adequada, SEM RERROLAGENS BASEADAS EM FORÇA
      DE VONTADE OU SURTOS DE SANGUE (a oposição não rola)."

     Elas viajam no pedido para que a interface não ofereça o botão de
     Vontade nem o de Surto — o mesmo desenho da Rolagem de Objetivo
     dos Projetos (§89). */
  pedido({ piscina, fome = 0, dificuldade, rotulo = 'Conflito de rolagem única' }) {
    return {
      normais: Math.max(1, (piscina | 0) - (fome | 0)),
      fome: Math.max(0, fome | 0),
      dificuldade,
      rotulo,
      semVontade: true,
      semSurto: true,
      nota: 'Rolagem única: sem rerrolagem de Vontade e sem Surto de Sangue, '
          + 'e a oposição não rola (pág. 299).'
    };
  },

  /* A conta do dano, que é o coração da regra:

     "Então cada personagem do jogador sofre uma quantidade de dano
      igual à diferença entre seus sucessos e o DOBRO da Dificuldade.
      Esse dano não pode ser diminuído por armadura ou meios
      sobrenaturais, como Fortitude. (…) Não diminua pela metade o
      dano Superficial nesse caso."

     Vencer não isenta: no exemplo do livro, Rebeca SUPERA a
     Dificuldade 4 com cinco sucessos e ainda leva 3 de dano, porque
     8 − 5 = 3. É o preço da vitória, e é o ponto da regra. */
  apurar({ sucessos = 0, dificuldade, natureza = 'superficial', trilha = 'vitalidade' }) {
    const alvo = dificuldade * 2;
    const dano = Math.max(0, alvo - Math.max(0, sucessos | 0));
    const venceu = sucessos >= dificuldade;
    return {
      venceu, sucessos, dificuldade, dobro: alvo, dano, natureza, trilha,
      /* As duas negações do livro viajam com o resultado: quem aplica
         o dano precisa saber que não pode metade nem armadura, e o
         `aplicarDano` já tem `semMetade` para isso desde a §63. */
      semMetade: true,
      ignoraArmadura: true,
      nota: `${alvo} (o dobro de ${dificuldade}) menos ${sucessos} sucesso(s) = ${dano} de dano. `
          + 'Armadura e Fortitude não diminuem, e Superficial não cai pela metade (pág. 299).'
    };
  },

  /* "Opcional: em vez de aplicar níveis de dano, permita que os
      jogadores diminuam o dano adotando níveis adicionais de Máculas
      por haverem alcançado seus objetivos com atos de brutalidade
      maior."

     Opcional é opcional: quem chama decide se oferece. A troca é um
     por um, que é o único câmbio que o livro sugere ao não dar outro. */
  trocarPorMaculas(resultado, quantas = 0) {
    const n = Math.max(0, Math.min(quantas | 0, resultado.dano));
    return Object.assign({}, resultado, {
      dano: resultado.dano - n,
      maculas: n,
      nota: n
        ? `${n} ponto(s) de dano trocado(s) por ${n} Mácula(s): o objetivo foi alcançado com `
          + 'brutalidade maior (pág. 299).'
        : resultado.nota
    });
  }
};

/* ============================================================
   VITÆ — Laço de Sangue, carniçais e Diablerie
   (básico, "Estados de Condenação", págs. 233–235)

   Três capítulos inteiros que o projeto não tinha de forma alguma —
   nem regra, nem dado, nem texto. O `arbitro-lexico.js` já reconhecia
   a frase "lembro do vínculo" como fala de personagem, e era só isso:
   a palavra existia na boca do jogador e não existia no motor.

   São os três estados que o sangue de vampiro produz em quem o bebe,
   e o livro os organiza por QUEM BEBE DE QUEM:

     . o LAÇO prende quem bebe a quem doou;
     . o CARNIÇAL é o mortal que bebeu e ficou;
     . a DIABLERIE é beber o vampiro inteiro, e não só o sangue.

   O que os une mecanicamente é uma coisa só, e ela vale enunciar antes
   de ler o código: **nenhum dos três é uma rolagem única**. O Laço se
   forma em três noites e se desfaz em meses; o carniçal se mantém por
   dose; a Diablerie é uma sequência de testes em que UMA falha perde
   tudo. Todos os três medem tempo, e é por isso que eles combinam com
   os Projetos da §89 mais do que com o combate.
   ============================================================ */

const Lacos = {

  /* ----------------------------------------------------------
     O LAÇO DE SANGUE  (págs. 233–234)
     ---------------------------------------------------------- */

  /* "O Laço de Sangue ganha uma Força do Laço igual ao número de vezes
      que o escravo consumiu o Sangue do reinante (no máximo 6)." */
  FORCA_MAXIMA: 6,

  /* "após três degustações ou mais, o Laço" está completo. */
  GOLES_PARA_COMPLETO: 3,

  /* "O bebedor deve repetir o ato em três noites distintas com NÃO
      MAIS DO QUE UM ANO entre cada ocasião para que o Laço se forme
      por completo." */
  DIAS_ENTRE_GOLES: 365,

  /* "diminui em um para cada mês durante o qual o escravo não tenha
      consumido uma gota sequer do Sangue do reinante." */
  DIAS_POR_QUEDA: 30,

  /* Os nomes do livro. Não são sinônimos de "senhor" e "servo": o livro
     escolhe estas duas palavras e as usa o tempo todo. */
  PAPEIS: { fonte: 'reinante', preso: 'escravo' },

  novo({ reinante = '', desde = null } = {}) {
    return { reinante: String(reinante || '').trim(), forca: 0,
             goles: [], desde: desde || Date.now(), quebrando: false };
  },

  normalizar(l) {
    const base = l && typeof l === 'object' ? l : {};
    const goles = (Array.isArray(base.goles) ? base.goles : [])
      .map(g => Number(g) || 0).filter(Boolean).slice(-20).sort((a, b) => a - b);
    return {
      reinante: String(base.reinante || '').trim(),
      forca: Math.max(0, Math.min(this.FORCA_MAXIMA, Number(base.forca) || 0)),
      goles, desde: Number(base.desde) || 0, quebrando: !!base.quebrando,
      /* §95 — o contador dos goles extras do Tremere (pág. 97). Ele
         PRECISA sobreviver ao `normalizar`: sem isto ele voltava ao
         cheio a cada gole, e o Laço não subia nunca. */
      extrasTremere: (base.extrasTremere == null) ? null : Math.max(0, Number(base.extrasTremere) || 0)
    };
  },

  completo(l) { return this.normalizar(l).forca >= this.GOLES_PARA_COMPLETO; },

  /* Um gole. O livro é exigente com a FORMA de beber, e a exigência é
     mecânica, não sabor:

       "o Sangue consumido deve ser tomado DIRETAMENTE DA VEIA do
        doador, já que perde seu poder de Enlaçar em questão de
        segundos a menos que seja ingerido."             (pág. 234)

     Sangue de bolsa não enlaça. É por isso que `daVeia` é um parâmetro
     e não uma suposição: a mesa tem bolsa desde a §67. */
  /* §95 (A10) — `doador` e `alvoEhVampiro` entram para a Perdição
     Tremere (pág. 97) poder ser consultada. Os dois são opcionais e o
     padrão é o comportamento de antes: quem chamava sem eles continua
     chamando, e nada muda. */
  beber(l, { daVeia = true, quando = null, doador = null, alvoEhVampiro = false, bebedor = null } = {}) {
    const n = this.normalizar(l);
    const eventos = [];

    const tremere = (typeof Perdicoes !== 'undefined' && doador)
      ? Perdicoes.doacaoTremere(doador, { alvoEhVampiro })
      : { enlaca: true, golesExtras: 0, nota: '' };

    if (!tremere.enlaca) {
      eventos.push({ tipo: 'nota', texto: tremere.nota });
      return { laco: n, eventos, subiu: false };
    }

    /* §101 — Sangue de Membro na boca de um Banu Haqim, ou Sangue
       Salubri na boca de qualquer um: o gole pede um teste de frenesi
       antes de contar. Quem sabe disso é o motor de Perdições; aqui só
       se devolve o pedido, e quem rola é a Mesa (§82). */
    const pedidos = (typeof Perdicoes !== 'undefined' && bebedor)
      ? Perdicoes.aoBeberDeVampiro(bebedor, doador) : [];
    for (const p of pedidos) eventos.push({ tipo: 'teste', pedido: p, texto: p.motivo });
    if (!daVeia) {
      eventos.push({ tipo: 'nota', texto:
        'Sangue que não veio direto da veia não enlaça: ele perde o poder em segundos '
        + 'fora do corpo, a menos que seja ingerido na hora (pág. 234).' });
      return { laco: n, eventos, subiu: false };
    }
    const ts = quando || Date.now();
    const anterior = n.goles.length ? n.goles[n.goles.length - 1] : null;
    const longeDemais = anterior != null
      && (ts - anterior) > this.DIAS_ENTRE_GOLES * 86400000;

    if (longeDemais) {
      /* "com não mais do que um ano entre cada ocasião PARA QUE O LAÇO
          SE FORME POR COMPLETO" — passou o ano, a contagem das três
          noites recomeça; a Força que sobrou é a que sobrou. */
      n.goles = [];
      eventos.push({ tipo: 'nota', texto:
        'Passou mais de um ano desde o último gole: a contagem das três noites recomeça (pág. 234).' });
    }

    n.goles.push(ts);

    /* Os goles extras do Tremere são cobrados ANTES do primeiro que
       conta: o sangue entra, e a Força só começa a subir depois deles.
       É o que "exige goles extras" quer dizer — não é um Laço mais
       fraco, é um Laço mais caro. */
    if (tremere.golesExtras) {
      if (n.extrasTremere == null) n.extrasTremere = tremere.golesExtras;
      if (n.extrasTremere > 0) {
        n.extrasTremere--;
        eventos.push({ tipo: 'nota', texto:
          `${tremere.nota} Faltam ${n.extrasTremere} gole(s) extra(s) antes de a Força começar a subir.` });
        return { laco: n, eventos, subiu: false };
      }
    }

    const antes = n.forca;
    n.forca = Math.min(this.FORCA_MAXIMA, n.forca + 1);
    n.quebrando = false;

    if (n.forca === antes) {
      eventos.push({ tipo: 'nota', texto:
        `Força do Laço já estava no teto de ${this.FORCA_MAXIMA}: mais um gole não acrescenta (pág. 234).` });
    } else {
      eventos.push({ tipo: 'perigo', texto:
        `Você bebeu de ${n.reinante || 'quem doou'}. Força do Laço: ${antes} → ${n.forca}.` });
    }
    if (n.forca >= this.GOLES_PARA_COMPLETO && antes < this.GOLES_PARA_COMPLETO) {
      eventos.push({ tipo: 'critico', texto:
        'Terceira noite: o Laço está completo. Você é escravo, e a fonte é o reinante — '
        + 'lealdade que às vezes chega à obsessão, e medo de desagradar (pág. 233).' });
    }
    return { laco: n, eventos, subiu: n.forca > antes };
  },

  /* "e diminui em um para cada MÊS durante o qual o escravo não tenha
      consumido uma gota sequer do Sangue do reinante." */
  passarTempo(l, dias) {
    const n = this.normalizar(l);
    const eventos = [];
    const quedas = Math.floor(Math.max(0, dias | 0) / this.DIAS_POR_QUEDA);
    if (!quedas || !n.forca) return { laco: n, eventos, caiu: 0 };
    const antes = n.forca;
    n.forca = Math.max(0, n.forca - quedas);
    eventos.push({ tipo: 'nota', texto:
      `${quedas} mês(es) longe de ${n.reinante || 'quem te enlaçou'}: Força do Laço ${antes} → ${n.forca}.` });
    if (n.forca === 0) eventos.push({ tipo: 'critico', texto:
      'Força do Laço em zero: o Laço se partiu (pág. 234).' });
    return { laco: n, eventos, caiu: antes - n.forca };
  },

  /* AGIR CONTRA O REINANTE  (pág. 234)

     "Para tentar algo contra os desejos do reinante, o escravo deve
      obter sucesso em uma disputa de Determinação + Inteligência vs. a
      Força do Laço. Se ocorrer NA PRESENÇA do reinante, tal desafio
      requer que o teste seja feito UMA VEZ POR TURNO; se ocorrer fora
      da percepção do reinante, o escravo só precisa realizar um teste
      de desafio UMA VEZ POR CENA."

     O ritmo é a regra inteira. Longe dele, resistir custa um teste;
     perto dele, custa um teste por turno — e é isso que faz a presença
     do reinante ser aterrorizante sem que ele precise fazer nada. */
  ROTA_DE_RESISTENCIA: { atributo: 'determinacao', pericia: 'inteligencia' },

  ritmoDoTeste(naPresenca) {
    return naPresenca
      ? { id: 'turno', texto: 'uma vez por TURNO, enquanto ele estiver por perto' }
      : { id: 'cena',  texto: 'uma vez por cena, fora da percepção dele' };
  },

  /* A parada é Determinação + Inteligência, e os dois são ATRIBUTOS —
     não há Habilidade nesta rolagem. É disputa contra a Força do Laço,
     que não rola: ela é a parada do outro lado. */
  resistir(ficha, l, { naPresenca = false, estados = [] } = {}) {
    const n = this.normalizar(l);
    const eventos = [];
    const ritmo = this.ritmoDoTeste(naPresenca);

    if (!n.forca) {
      return { laco: n, possivel: true, venceu: true, ritmo,
               eventos: [{ tipo: 'nota', texto: 'Sem Laço: não há a quem obedecer.' }] };
    }

    const a = (ficha && ficha.atributos) || {};
    const pen = Arbitro.penalidadeDeEstados(estados, 'mental');
    const piscina = Math.max(1, (a.determinacao || 0) + (a.inteligencia || 0) + pen.dados);

    const meu = Dados.rolar({ piscina, fome: ficha.fome || 0, dificuldade: 0,
      rotulo: 'Contra o Laço — Determinação + Inteligência' });
    const dele = Dados.rolar({ piscina: n.forca, fome: 0, dificuldade: 0,
      rotulo: `Força do Laço (${n.forca})` });
    const venceu = meu.sucessos > dele.sucessos;

    eventos.push({ tipo: venceu ? 'nota' : 'perigo', texto: venceu
      ? `Você consegue agir contra ${n.reinante || 'ele'}: ${meu.sucessos} contra ${dele.sucessos}. `
        + `E terá de conseguir de novo — ${ritmo.texto} (pág. 234).`
      : `O Sangue fala mais alto: ${dele.sucessos} contra ${meu.sucessos}. Você não consegue `
        + `agir contra ${n.reinante || 'ele'} desta vez.` });

    return { laco: n, possivel: true, venceu, meu, dele, ritmo, piscina, eventos };
  },

  /* PARTIR O LAÇO  (pág. 234)

     "Partir o Laço exige que o escravo reduza a Força do Laço para 0
      evitando seu reinante por um longo período. Ele deve ser
      bem-sucedido em um teste de desafio UMA VEZ POR SESSÃO para tanto
      (ou com mais frequência, se o Narrador julgar que algo fez o
      escravo lembrar o reinante). Poucos escravos podem resistir tanto
      tempo, especialmente se seu reinante vier em seu encalço."

     Ou seja: partir não é uma rolagem, é uma CAMPANHA de rolagens ao
     longo de meses, e é por isso que ela vive aqui e não numa ação de
     turno. `quebrando` marca que o escravo está tentando. */
  tentarPartir(ficha, l, { estados = [], lembrou = false } = {}) {
    const n = this.normalizar(l);
    n.quebrando = true;
    const r = this.resistir(ficha, n, { naPresenca: false, estados });
    const eventos = r.eventos.slice();
    eventos.unshift({ tipo: 'nota', texto: lembrou
      ? 'Alguma coisa te fez lembrar dele — o Narrador pode cobrar este teste fora da hora (pág. 234).'
      : 'Teste de desafio da sessão, evitando o reinante.' });
    if (!r.venceu) eventos.push({ tipo: 'perigo', texto:
      'Você não aguentou ficar longe. O mês não conta, e a Força do Laço não cai.' });
    return Object.assign({}, r, { laco: Object.assign(n, { quebrando: true }), eventos });
  },

  /* QUANTOS ESCRAVOS CABEM  (pág. 234)

     "Um reinante pode ter tantos escravos vampiros quanto sua pontuação
      em Potência de Sangue, enquanto um escravo só pode ter UM
      reinante, ficando imune a outras tentativas de Enlace enquanto
      Enlaçado. Se um reinante Enlaça outro escravo acima do limite
      máximo determinado por sua Potência de Sangue, seu Laço mais
      antigo com um escravo desaparece ao longo de uma semana." */
  limiteDeEscravos(potenciaSangue) { return Math.max(0, Number(potenciaSangue) || 0); },

  aoEnlacarMaisUm(potenciaSangue, escravosAtuais) {
    const limite = this.limiteDeEscravos(potenciaSangue);
    const lista = (escravosAtuais || []).slice();
    if (lista.length < limite) return { lista, perdido: null, eventos: [] };
    const perdido = lista.shift() || null;
    return { lista, perdido, eventos: [{ tipo: 'nota', texto:
      `Potência de Sangue ${potenciaSangue} segura ${limite} escravo(s). Com mais um, o Laço `
      + `mais antigo${perdido ? ` — ${perdido} —` : ''} some ao longo de uma semana (pág. 234).` }] };
  },

  /* "Durante seu primeiro ano, uma cria se encontra UM TERÇO Enlaçada
      ao seu Senhor, já tendo provado o Sangue dele uma vez." */
  lacoDaCria(senhor) {
    return this.normalizar({ reinante: senhor, forca: 1, goles: [Date.now()] });
  },

  /* ----------------------------------------------------------
     CARNIÇAIS  (pág. 234)
     ---------------------------------------------------------- */

  /* "Uma quantidade de Vitae equivalente a uma Checagem de Sangue
      concede os seguintes benefícios a um mortal ou animal por
      aproximadamente UM MÊS." */
  CARNICAL: {
    duracaoEmDias: 30,
    beneficios: [
      'O primeiro ponto de uma das Disciplinas conhecidas pelo mestre — ou um único poder de nível 1 que o mestre possua.',
      'O envelhecimento cessa, às vezes rejuvenescendo o mortal uns poucos anos.',
      'Ferimentos curam com o DOBRO da velocidade, a menos que causados por fogo.'
    ],
    /* "Carniçais que usam poderes ACIMA DO NÍVEL 1 (graças à Elegância
        Direto da Fonte ou poderes similares, efeitos alquímicos ou
        outras causas) sofrem 1 ponto de dano Agravado à sua Vitalidade
        em vez de realizarem uma Checagem de Sangue." */
    danoAcimaDoNivel1: 1,
    /* "Diferentemente do que ocorre no Abraço e Laços de Sangue, o
        Sangue vampírico retém suas propriedades de alimentar carniçais
        por alguns dias quando armazenado em um recipiente hermético e
        ao abrigo da luz solar." */
    aceitaBolsa: true,
    pagina: 234
  },

  /* O preço de um poder num carniçal. Nível 1 é Checagem de Sangue
     normal; acima disso é Agravado direto, sem checagem. */
  custoDePoderDeCarnical(nivel) {
    const n = Math.max(1, Number(nivel) || 1);
    if (n <= 1) return { checagem: true, danoAgravado: 0, pagina: 234,
      texto: 'Poder de nível 1: Checagem de Sangue normal.' };
    return { checagem: false, danoAgravado: this.CARNICAL.danoAcimaDoNivel1, pagina: 234,
      texto: `Poder de nível ${n} num carniçal: ${this.CARNICAL.danoAcimaDoNivel1} de dano `
           + `Agravado à Vitalidade, e NÃO uma Checagem de Sangue (pág. 234).` };
  },

  /* ----------------------------------------------------------
     DIABLERIE  (págs. 234–235)

     "Um ato amaldiçoado pela maioria dos vampiros que reivindicam para
      si qualquer forma de civilidade ou temem uma destruição justa."

     São DUAS provas em sequência, e a diferença entre elas é o que faz
     a Diablerie ser o que é:

       1. tomar a centelha  — Força + Determinação, Dificuldade 3,
          uma rolagem por turno, TANTAS QUANTO a Potência de Sangue da
          vítima. **Uma falha e acabou**: "se apenas uma falhar, a
          centelha que anima a vítima se apaga sem ser consumida";
       2. segurar o que se tomou — a disputa de Humanidade.

     Falhar na primeira custa a vítima e nada mais. Falhar na segunda
     custa você.
     ---------------------------------------------------------- */
  DIABLERIE: {
    dificuldade: 3,
    atributos: ['forca', 'determinacao'],
    experienciaPorSucesso: 5,
    humanidadePerdida: 1,
    veiasEmAnos: 1,
    pagina: 235
  },

  /* PASSO 1 — a sequência de testes.

     `resultados` é a lista já rolada, um por turno. Ela vem de fora
     porque quem rola é a Mesa (§82) e porque o jogador pode desistir
     no meio: o livro deixa o atacante fazer "uma dessas rolagens por
     turno", e um turno é uma decisão. */
  tomarACentelha(potenciaDaVitima, resultados) {
    const precisa = Math.max(1, Number(potenciaDaVitima) || 1);
    const feitas = (resultados || []).slice(0, precisa);
    const eventos = [];
    const falhou = feitas.find(r => !r.passou);

    if (falhou) {
      eventos.push({ tipo: 'perigo', texto:
        'Uma das rolagens falhou: a centelha que anima a vítima se apaga sem ser consumida. '
        + 'A Diablerie foi frustrada, e o corpo se decompõe na Morte Final do mesmo jeito (pág. 235).' });
      return { completou: false, precisa, feitas: feitas.length, eventos };
    }
    if (feitas.length < precisa) {
      eventos.push({ tipo: 'nota', texto:
        `${feitas.length} de ${precisa} rolagens. Falta${precisa - feitas.length === 1 ? '' : 'm'} `
        + `${precisa - feitas.length} — uma por turno, e uma falha perde tudo.` });
      return { completou: false, precisa, feitas: feitas.length, emCurso: true, eventos };
    }
    eventos.push({ tipo: 'critico', texto:
      `${precisa} de ${precisa}: a centelha passou para você. Agora vem a parte que cobra.` });
    return { completou: true, precisa, feitas: feitas.length, eventos };
  },

  /* O pedido de cada uma dessas rolagens, para a Mesa rodar. */
  pedidoDaCentelha(ficha) {
    const a = (ficha && ficha.atributos) || {};
    const piscina = Math.max(1, (a.forca || 0) + (a.determinacao || 0));
    return Dados.pedir({ piscina, fome: ficha.fome || 0,
      dificuldade: this.DIABLERIE.dificuldade, rotulo: 'Diablerie — Força + Determinação' });
  },

  /* PASSO 2 — os efeitos.  (pág. 235)

     "O diablerista perde 1 ponto de Humanidade. Então ele deve rolar
      uma disputa de Humanidade + sua própria Potência de Sangue vs. a
      Determinação + Potência de Sangue da vítima. MESMO SE O
      DIABLERISTA FALHAR nessa disputa em exercer controle, cada
      sucesso obtido na sua rolagem de Humanidade + Potência de Sangue
      lhe concede 5 pontos de experiência (…) Se a rolagem falhar, o
      diablerista perde um ponto adicional de Humanidade PARA CADA
      SUCESSO PELO QUAL FALHOU. Se essa falha corroer sua Humanidade
      até 0 (zero), a mente da presa substitui a do diablerista."

     A parte que quase todo mundo lê errado é a primeira: a experiência
     vem mesmo perdendo. O que se perde na disputa é o CONTROLE, não o
     prêmio — e é isso que torna a Diablerie tentadora para quem já não
     tem muita Humanidade a perder. */
  /* Método, e não ajudante local: um `const baixar` dentro da função
     colide com um nome declarado no front, e a checagem de fronteira da
     §48 acusa o Árbitro de chamar o front. Chamada de método passa,
     porque método de objeto não é dependência de escopo. */
  _baixarHumanidade(ficha, n) {
    ficha.humanidadeMod = (ficha.humanidadeMod || 0) - Math.max(0, n | 0);
  },

  efeitos(ficha, { meu, dela, potenciaDaVitima = 0, geracaoDaVitima = null,
                   disciplinasDaVitima = [] } = {}) {
    const eventos = [];
    const antesHum = Estado.trilhas(ficha).humanidade.valor;

    /* 1. o ponto que se perde sempre.

       A Humanidade é DERIVADA (`derivados(f).humanidade`), e quem a
       move é `f.humanidadeMod` — o mesmo caminho que o Remorso usa
       desde a §69. Devolver só o número novo, sem mexer na ficha,
       faria a Diablerie custar Humanidade na tela e não na ficha, que
       é o defeito que esta leitura já achou em outros três lugares. */
    this._baixarHumanidade(ficha, this.DIABLERIE.humanidadePerdida);
    let humanidade = Estado.trilhas(ficha).humanidade.valor;
    eventos.push({ tipo: 'macula', texto:
      `Diablerie: −1 de Humanidade, de saída e sem rolagem (${antesHum} → ${humanidade}).` });

    /* 2. a disputa, e o prêmio que vem de qualquer jeito. */
    const venceu = meu.sucessos > dela.sucessos;
    const experiencia = meu.sucessos * this.DIABLERIE.experienciaPorSucesso;
    eventos.push({ tipo: venceu ? 'nota' : 'perigo', texto: venceu
      ? `Controle exercido: ${meu.sucessos} contra ${dela.sucessos}.`
      : `O Sangue alheio resiste: ${dela.sucessos} contra ${meu.sucessos}.` });

    if (experiencia) eventos.push({ tipo: 'critico', texto:
      `${experiencia} pontos de experiência, para gastar AGORA — em Potência de Sangue, até o `
      + `valor da vítima (${potenciaDaVitima}), ou nas Disciplinas que ela conhecia`
      + `${disciplinasDaVitima.length ? `: ${disciplinasDaVitima.join(', ')}` : ''}. `
      + `Eles vêm mesmo tendo perdido a disputa (pág. 235).` });

    /* 3. o preço da derrota. */
    let virouPN = false;
    if (!venceu) {
      const aMais = dela.sucessos - meu.sucessos;
      this._baixarHumanidade(ficha, aMais);
      const depois = Estado.trilhas(ficha).humanidade.valor;
      eventos.push({ tipo: 'perigo', texto:
        `Falhou por ${aMais}: mais ${aMais} de Humanidade (${humanidade} → ${depois}).` });
      humanidade = depois;
      if (humanidade === 0) {
        virouPN = true;
        eventos.push({ tipo: 'critico', texto:
          'Humanidade em zero pela Diablerie: a mente da presa substitui a sua. Você vira o corpo '
          + 'hospedeiro do Sangue e da personalidade dela — e o personagem passa a ser um PN (pág. 235).' });
      }
    }

    /* 4. a geração.

       "Se a vítima pertencia a uma geração menor, o diablerista diminui
        sua geração em uma."  Geração MENOR quer dizer número menor —
        mais perto de Caim, e mais poderosa. */
    const geracaoOriginal = Number(ficha.geracao) || null;
    let geracao = geracaoOriginal;
    if (geracaoDaVitima && geracao && Number(geracaoDaVitima) < geracao) {
      geracao -= 1;
      ficha.geracao = geracao;
      eventos.push({ tipo: 'critico', texto:
        `A vítima era de geração menor: você desce uma, para ${geracao}ª (pág. 235).` });
    }

    /* 5. as veias negras.

       "Veias negras tornam-se visíveis na aura do diablerista. Elas
        persistem por UM ANO, ou, se a geração do diablerista era maior
        do que a da sua presa, por uma quantidade de anos igual à
        DIFERENÇA ORIGINAL entre as gerações." */
    const diferenca = (geracaoDaVitima && geracaoOriginal && geracaoOriginal > Number(geracaoDaVitima))
      ? geracaoOriginal - Number(geracaoDaVitima) : 0;
    const anosDeVeia = diferenca > 0 ? diferenca : this.DIABLERIE.veiasEmAnos;
    eventos.push({ tipo: 'perigo', texto:
      `Veias negras na sua aura por ${anosDeVeia} ano(s). Quem lê aura vê, e numa Camarilla `
      + `isso é sentença (pág. 235).` });

    return { eventos, venceu, experiencia, humanidade, virouPN, geracao, anosDeVeia,
             maximoDePotencia: potenciaDaVitima,
             disciplinasDisponiveis: disciplinasDaVitima.slice() };
  },

  /* Os dois pedidos da disputa do passo 2. Separados porque as duas
     paradas somam coisas diferentes: a sua é Humanidade + a SUA
     Potência; a dela é Determinação + a DELA. */
  pedidoDoControle(ficha) {
    const t = Estado.trilhas(ficha);
    const humanidade = t.humanidade && t.humanidade.valor != null
      ? t.humanidade.valor : (ficha.humanidade || 0);
    const potencia = Number(ficha.potenciaSangue) || 0;
    return Dados.pedir({ piscina: Math.max(1, humanidade + potencia), fome: 0, dificuldade: 0,
      rotulo: 'Diablerie — Humanidade + Potência de Sangue' });
  },

  pedidoDaVitima({ determinacao = 0, potenciaSangue = 0 } = {}) {
    return Dados.pedir({ piscina: Math.max(1, (determinacao | 0) + (potenciaSangue | 0)),
      fome: 0, dificuldade: 0, rotulo: 'A vítima resiste — Determinação + Potência de Sangue' });
  }
};

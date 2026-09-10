/* ============================================================
   VITÆ — Léxico do Árbitro
   Uma responsabilidade: **transformar o que o jogador escreveu em
   uma intenção mecânica**, e marcar no texto os termos que a
   produziram. Nada aqui decide se a ação é possível, nem toca em
   dado — quem julga é o Árbitro, quem rola é o Dados.

   Saiu de `motor-arbitro.js` na §48 (item A4 da §45.2). O arquivo
   tinha 976 linhas e cinco assuntos; este é o maior deles, porque
   ACOES é um dicionário de verbos do português brasileiro e
   dicionário é grande por natureza — não por acoplamento.

   `Arbitro.interpretar()`, `Arbitro.normalizar()`,
   `Arbitro.ACOES` e companhia continuam existindo: o Árbitro
   delega para cá. Nenhum chamador mudou.
   ============================================================ */

const Lexico = {

  ACOES: {
    esconder: {
      nome: 'Esconder-se', dominio: 'furtividade',
      frases: ['esconder', 'escondo', 'me escondo', 'furtividade', 'sorrateiro', 'sorrateiramente',
               'sumir de vista', 'me embosco', 'disfarçar na multidao', 'passar despercebido',
               'na sombra', 'nas sombras', 'silenciosamente', 'sem ser visto'],
      exige: ['movimento'],
      rotas: [
        { atributo: 'destreza', pericia: 'furtividade', enquadramento: 'você se encolhe e some', risco: 'demora' },
        { atributo: 'raciocinio', pericia: 'furtividade', enquadramento: 'você lê o ambiente antes de se mover', risco: 'margem menor' },
        { atributo: 'manipulacao', pericia: 'labia', enquadramento: 'você finge pertencer ao lugar', risco: 'alguém puxa conversa' }
      ]
    },
    pegar: {
      nome: 'Pegar', dominio: 'tecnica', manipulacao: true,
      frases: ['pegar', 'pego', 'apanhar', 'apanho', 'recolher', 'recolho', 'guardar no bolso',
               'coloco no bolso', 'tomar para mim', 'pego de volta', 'levo comigo', 'embolso'],
      exige: ['maos'],
      rotas: [
        { atributo: 'destreza', pericia: 'furto', enquadramento: 'você tira sem ninguém ver', risco: 'alguém repara' }
      ]
    },
    largar: {
      nome: 'Largar', dominio: 'tecnica', manipulacao: true,
      frases: ['largar', 'largo', 'solto', 'soltar', 'deixo cair', 'jogo fora', 'abandono aqui',
               'deixo no chao', 'me desfaço'],
      exige: ['maos'],
      rotas: []
    },
    abrir: {
      nome: 'Abrir', dominio: 'tecnica', manipulacao: true, exigeAberto: true,
      /* 'derrubar a porta' veio de lutar na §63: é abrir na força, não
         atacar alguém. Pela tabela do livro, derrubar uma porta de madeira
         é Força 3 e não se rola nada (básico, pág. 409) — a rota de força
         abaixo é para quando a porta é mais que madeira. */
      frases: ['abrir', 'abro', 'destampar', 'levantar a tampa', 'puxo a gaveta',
               'escancaro', 'abrir a porta', 'derrubar a porta', 'derrubo a porta',
               'arrebento a porta', 'chuto a porta', 'ponho o ombro na porta'],
      exige: ['maos'],
      rotas: [
        { atributo: 'destreza', pericia: 'furto', enquadramento: 'você abre com jeito', risco: 'demora' },
        { atributo: 'forca', pericia: 'atletismo', enquadramento: 'você abre na força', risco: 'barulho' }
      ]
    },
    entregar: {
      nome: 'Entregar', dominio: 'persuasao', manipulacao: true,
      frases: ['entregar', 'entrego', 'dar para', 'dou para', 'passo para', 'ofereço',
               'devolvo', 'estendo a mao com'],
      exige: ['maos'],
      rotas: [
        { atributo: 'carisma', pericia: 'persuasao', enquadramento: 'você entrega como quem faz um favor', risco: 'vira dívida' }
      ]
    },
    ir_para: {
      nome: 'Ir para outro lugar', dominio: 'rua', movimento: true,
      frases: ['ir para', 'vou para', 'vou ate', 'sigo para', 'me desloco', 'atravesso para',
               'saio para', 'rumo a', 'caminho ate'],
      exige: ['movimento'],
      rotas: []
    },
    arrombar: {
      nome: 'Arrombar ou destrancar', dominio: 'tecnica', exigeAberto: true,
      frases: ['arrombar', 'arrombo', 'destrancar', 'destranco', 'forcar a fechadura', 'ladroagem',
               'abrir o cofre', 'picking', 'chaveiro', 'quebrar a porta'],
      exige: ['maos', 'visao'],
      /* PARADAS DE INVASÃO USAM SEMPRE LADROAGEM (básico, pág. 410). O que muda
         é o ATRIBUTO, conforme a tarefa. Era Força + Briga e Inteligência +
         Tecnologia; Briga é perícia de combate e não abre fechadura, e o
         caminho eletrônico o livro só permite para sistema PURAMENTE
         eletrônico, com +1 de Dificuldade. §63, A4. */
      rotas: [
        { atributo: 'destreza', pericia: 'furto', enquadramento: 'você trabalha a fechadura', risco: 'demora' },
        { atributo: 'inteligencia', pericia: 'furto', enquadramento: 'você lê o mecanismo antes de tocá-lo', risco: 'demora' },
        { atributo: 'forca', pericia: 'furto', enquadramento: 'você força sem estragar', risco: 'barulho' },
        { atributo: 'inteligencia', pericia: 'tecnologia', dificuldade: 1,
          enquadramento: 'você burla a fechadura eletrônica', risco: 'registro no sistema',
          nota: 'só para sistema puramente eletrônico, e o livro cobra +1 de Dificuldade' }
      ]
    },
    achar_escondido: {
      nome: 'Achar algo escondido', dominio: 'investigacao',
      frases: ['procurar', 'procuro', 'vasculhar', 'vasculho', 'revistar', 'revisto', 'investigar',
               'investigo', 'achar', 'encontrar', 'onde esta', 'busco', 'examinar o comodo',
               'olhar em volta', 'reviro'],
      exige: ['visao'],
      rotas: [
        { atributo: 'raciocinio', pericia: 'consciencia', enquadramento: 'você varre o cômodo', risco: 'demora' },
        { atributo: 'inteligencia', pericia: 'investigacao', enquadramento: 'você procura como quem sabe onde se esconde coisa', risco: 'bagunça visível' },
        { atributo: 'raciocinio', pericia: 'intuicao', enquadramento: 'você pensa como quem escondeu', risco: 'margem menor' }
      ]
    },
    persuadir: {
      nome: 'Convencer alguém', dominio: 'persuasao',
      frases: ['convencer', 'convenco', 'persuadir', 'persuado', 'negociar', 'negocio', 'argumentar',
               'peco', 'pedir', 'proponho', 'propor', 'barganhar', 'falo com', 'converso com'],
      exige: ['fala', 'mente'], alcance: 'voz',
      rotas: [
        { atributo: 'carisma', pericia: 'persuasao', enquadramento: 'você pede com jeito', risco: 'fica devendo um favor' },
        { atributo: 'manipulacao', pericia: 'labia', enquadramento: 'você mente com naturalidade', risco: 'se for pego, é pior' },
        { atributo: 'inteligencia', pericia: 'politica', enquadramento: 'você invoca precedente e etiqueta', risco: 'formaliza a disputa' }
      ]
    },
    seduzir: {
      nome: 'Seduzir', dominio: 'persuasao',
      frases: ['seduzir', 'seduzo', 'flertar', 'flerto', 'cantar', 'paquerar', 'encantar', 'encanto',
               'levo pra cama', 'olhar nos olhos', 'me aproximo dele', 'me aproximo dela'],
      exige: ['visao'], alcance: 'ambiente',
      rotas: [
        { atributo: 'carisma', pericia: 'labia', enquadramento: 'você deixa acontecer', risco: 'testemunhas' },
        { atributo: 'manipulacao', pericia: 'persuasao', enquadramento: 'você conduz sem parecer que conduz', risco: 'a pessoa percebe depois' },
        { atributo: 'carisma', pericia: 'performance', enquadramento: 'você faz disso um espetáculo', risco: 'atenção demais' }
      ]
    },
    intimidar: {
      nome: 'Intimidar', dominio: 'intimidacao',
      frases: ['intimidar', 'intimido', 'ameacar', 'ameaco', 'assustar', 'assusto', 'coagir',
               'encaro', 'peito', 'meto medo', 'grito com'],
      exige: [], alcance: 'ambiente',
      rotas: [
        { atributo: 'forca', pericia: 'intimidacao', enquadramento: 'você usa o corpo', risco: 'vira violência' },
        { atributo: 'manipulacao', pericia: 'intimidacao', enquadramento: 'você ameaça sem dizer o quê', risco: 'a pessoa guarda mágoa' },
        { atributo: 'carisma', pericia: 'lideranca', enquadramento: 'você manda como quem tem autoridade', risco: 'precisa sustentar o blefe' }
      ]
    },
    lutar: {
      nome: 'Atacar corpo a corpo', dominio: 'confronto',
      /* 'derrubar/derrubo' SAIU daqui na §63 (A4). 'derrubo a porta com o ombro'
         virava ataque corpo a corpo e ABRIA O PAINEL DE COMBATE, sem ninguém na
         frase. Derrubar porta é força bruta: pela tabela do livro, porta de
         madeira é Força 3 e não se rola nada (básico, pág. 409). Derrubar
         PESSOA continua sendo luta, e as frases de luta pegam isso. */
      frases: ['atacar', 'ataco', 'bater', 'bato', 'socar', 'soco', 'brigar', 'brigo', 'agarrar',
               'agarro', 'esfaquear', 'golpear', 'parto pra cima'],
      exige: ['movimento', 'corpo'], alcance: 'toque',
      rotas: [
        { atributo: 'forca', pericia: 'briga', enquadramento: 'você vai com tudo', risco: 'barulho e sangue' },
        { atributo: 'destreza', pericia: 'briga', enquadramento: 'você é preciso', risco: 'menos dano' },
        { atributo: 'destreza', pericia: 'armas_brancas', enquadramento: 'você saca a lâmina', risco: 'ferimento agravado no alvo' }
      ]
    },
    atirar: {
      nome: 'Atirar', dominio: 'confronto',
      frases: ['atirar', 'atiro', 'disparar', 'disparo', 'saco a arma', 'armas de fogo', 'mirar'],
      exige: ['maos', 'visao'], alcance: 'visao',
      rotas: [
        { atributo: 'destreza', pericia: 'armas_fogo', enquadramento: 'você mira e dispara', risco: 'barulho, câmeras, polícia' }
      ]
    },
    caçar: {
      nome: 'Caçar e se alimentar', dominio: 'rua',
      frases: ['cacar', 'caco', 'me alimentar', 'alimentar', 'beber', 'bebo', 'morder', 'mordo',
               'saciar', 'presa', 'procuro presa', 'procurar presa', 'preciso comer',
               'preciso de sangue', 'matar a fome', 'me alimento'],
      exige: ['movimento'], alcance: 'toque',
      rotas: []
    },
    /* RASTREAR e ESPREITAR são duas ações no livro, com paradas diferentes.
       Rastrear é seguir EVIDÊNCIA FÍSICA em área selvagem — pegada, sangue,
       grama amassada (pág. 408). Seguir alguém que você está VENDO é
       espreitamento, e é disputa (pág. 410). As frases de seguir alguém
       mudaram de dono na §63 (A4). */
    rastrear: {
      nome: 'Rastrear', dominio: 'rua',
      frases: ['rastrear', 'rastreio', 'na pista', 'seguir o rastro', 'sigo o rastro',
               'seguir a pista', 'pegadas', 'seguir as pegadas', 'farejar o rastro'],
      exige: ['movimento'],
      rotas: [
        { atributo: 'raciocinio', pericia: 'sobrevivencia', enquadramento: 'você lê o rastro', risco: 'demora' },
        { atributo: 'raciocinio', pericia: 'manha', enquadramento: 'você pergunta a quem sabe', risco: 'alguém avisa o alvo' },
        { atributo: 'inteligencia', pericia: 'investigacao', enquadramento: 'você cruza informação', risco: 'deixa registro' }
      ]
    },
    /* ----------------------------------------------------------
       AS CINCO AÇÕES DO APÊNDICE I  (§63, item A4)

       O livro tem um catálogo de ações comuns COM A PARADA DE CADA
       UMA (básico, págs. 407–410) — a mesma forma deste dicionário.
       Cinco delas não existiam aqui, e o efeito era grave: o léxico
       devolvia `(nenhuma)`, o turno subia para o Narrador, e ele
       narrava SEM TESTE. O jogador escalava a fachada e nunca corria
       o risco de cair.

       As paradas abaixo são as do livro, com a página em cada uma.
       As rotas alternativas seguem o que o próprio Apêndice manda:
       "sempre é o Narrador quem determina qual parada [...] e ele
       sempre pode mudar a parada no melhor interesse da narrativa"
       (pág. 407).
       ---------------------------------------------------------- */
    escalar: {
      nome: 'Escalar', dominio: 'rua', movimento: true,
      frases: ['escalar', 'escalo', 'subir pela', 'subo pela', 'trepar', 'me penduro',
               'escada de incendio', 'pela fachada', 'subo o muro', 'pulo o muro',
               'subo pela parede', 'me iço', 'galgar'],
      exige: ['maos', 'movimento'],
      /* Destreza + Atletismo (pág. 410). Falha total: emaranhado e preso,
         ou cai — e a queda tem regra própria, na Parte II §15. Corda e
         equipamento de montanhismo dão −2 ou mais na Dificuldade. */
      rotas: [
        { atributo: 'destreza', pericia: 'atletismo', enquadramento: 'você sobe no impulso', risco: 'queda: 1 Superficial por metro' },
        { atributo: 'forca', pericia: 'atletismo', enquadramento: 'você sobe na força dos braços', risco: 'demora, e barulho' },
        { atributo: 'raciocinio', pericia: 'sobrevivencia', enquadramento: 'você lê a parede antes de tocá-la', risco: 'margem menor' }
      ]
    },
    dirigir: {
      nome: 'Dirigir', dominio: 'rua', movimento: true,
      frases: ['dirigir', 'dirijo', 'acelero', 'acelerar', 'piso fundo', 'guiar', 'guio',
               'manobro', 'manobrar', 'saio de carro', 'pego o carro', 'fujo de carro',
               'derrapo', 'cavalo de pau', 'sigo o carro'],
      exige: ['maos', 'visao', 'movimento'],
      /* Não se rola para dirigir normalmente (pág. 409). Rola-se quando há
         complicação: velocidade, manobra, trânsito → Destreza + Condução;
         visibilidade ruim → Raciocínio + Condução. Cada complicação soma
         +1 sobre a Dificuldade 3 padrão. */
      rotas: [
        { atributo: 'destreza', pericia: 'conducao', enquadramento: 'você força o volante', risco: 'batida' },
        { atributo: 'raciocinio', pericia: 'conducao', enquadramento: 'você dirige pelo que consegue enxergar', risco: 'demora' }
      ]
    },
    pesquisar: {
      nome: 'Pesquisar', dominio: 'investigacao',
      frases: ['pesquisar', 'pesquiso', 'levantar informacao', 'levanto informacao',
               'busco no arquivo', 'consulto os registros', 'leio sobre', 'estudo o caso',
               'procuro na internet', 'busco na internet', 'googlar', 'descobrir sobre',
               'descubro sobre', 'me informo sobre'],
      exige: ['visao', 'mente'],
      /* Inteligência + A HABILIDADE RELEVANTE, e o livro insiste que não é
         só Erudição ou Ciência: "qualquer coisa, de Finanças a Ocultismo"
         (pág. 408). Dificuldade 3 para quase tudo, no máximo 4; informação
         obscura sobe, e costuma pedir teste estendido. */
      rotas: [
        { atributo: 'inteligencia', pericia: 'academicos', enquadramento: 'você procura onde a informação é guardada', risco: 'demora' },
        { atributo: 'inteligencia', pericia: 'investigacao', enquadramento: 'você cruza o que já sabe', risco: 'deixa registro' },
        { atributo: 'inteligencia', pericia: 'ocultismo', enquadramento: 'você procura no que não está catalogado', risco: 'chama atenção errada' },
        { atributo: 'inteligencia', pericia: 'financas', enquadramento: 'você segue o dinheiro', risco: 'alguém percebe a consulta' }
      ]
    },
    hackear: {
      nome: 'Hackear', dominio: 'tecnica',
      frases: ['hackear', 'hackeio', 'invadir o sistema', 'invado o sistema', 'quebro a senha',
               'acesso as cameras', 'acessar as cameras', 'derrubo o sistema', 'entro no servidor',
               'invado o computador', 'burlo o sistema'],
      exige: ['maos', 'visao', 'mente'],
      /* Inteligência + Tecnologia (pág. 409). Dificuldade pelo alvo: 4 para
         segurança corporativa adequada, 6 para base de dados segura, 8+ para
         a NSA. FALHA TOTAL ALERTA A SEGURANÇA — o risco abaixo é regra, não
         tempero. E o livro lembra que a maior parte do hackeamento real é
         engenharia social, que rola outra coisa. */
      rotas: [
        { atributo: 'inteligencia', pericia: 'tecnologia', enquadramento: 'você entra pelo código', risco: 'falha total alerta a segurança' },
        { atributo: 'manipulacao', pericia: 'labia', enquadramento: 'você convence alguém a abrir a porta por você', risco: 'a pessoa lembra da sua voz' },
        { atributo: 'inteligencia', pericia: 'manha', enquadramento: 'você compra o acesso de quem já tem', risco: 'quem vendeu pode vender você' }
      ]
    },
    espreitar: {
      nome: 'Espreitar alguém', dominio: 'furtividade',
      frases: ['seguir', 'sigo', 'perseguir', 'persigo', 'atras dele', 'atras dela',
               'sigo ele', 'sigo ela', 'vou atras', 'na cola', 'espreitar', 'espreito',
               'sigo de longe', 'acompanho de longe'],
      exige: ['visao', 'movimento'],
      /* ESPREITAR ≠ RASTREAR, e o livro separa as duas (pág. 410).
         Rastrear é ler evidência física em área selvagem. Espreitar é
         seguir alguém QUE VOCÊ ESTÁ VENDO, e é DISPUTA: Raciocínio +
         Percepção contra Determinação + Manha do alvo.

         Área agitada dá +1 dado; área abarrotada ou com muitas saídas,
         +2. Trabalho em equipe SÓ beneficia quem espreita. E se todos
         souberem o que está acontecendo, não é mais espreitamento: virou
         perseguição. */
      disputa: { atributo: 'determinacao', pericia: 'manha' },
      rotas: [
        { atributo: 'raciocinio', pericia: 'consciencia', enquadramento: 'você mantém o alvo à vista sem colar', risco: 'ele olha para trás' },
        { atributo: 'raciocinio', pericia: 'furtividade', enquadramento: 'você some e reaparece', risco: 'perde o alvo de vista' },
        { atributo: 'raciocinio', pericia: 'manha', enquadramento: 'você antecipa para onde ele vai', risco: 'chuta errado' }
      ]
    },
    falar_com_animais: {
      nome: 'Falar com animais', dominio: 'rua',
      frases: ['falar com animais', 'falo com o cachorro', 'falo com os ratos', 'chamar os ratos',
               'comandar o animal', 'animalismo', 'empatia com animais', 'converso com o bicho'],
      exige: ['fala', 'visao'], alcance: 'voz',
      disciplina: { id: 'animalismo', nivel: 1 },
      rotas: [
        { atributo: 'manipulacao', pericia: 'empatia_animais', enquadramento: 'você fala e o bicho escuta', risco: 'nenhum' },
        { atributo: 'carisma', pericia: 'empatia_animais', enquadramento: 'você se faz entender pelo tom', risco: 'margem menor' }
      ]
    },
    ocultismo: {
      nome: 'Reconhecer o sobrenatural', dominio: 'ocultismo',
      frases: ['ocultismo', 'ritual', 'simbolo', 'sigilo', 'reconheco o simbolo', 'magia',
               'feiticaria', 'abismo', 'o que significa isso'],
      exige: ['mente'],
      rotas: [
        { atributo: 'inteligencia', pericia: 'ocultismo', enquadramento: 'você já leu sobre isso', risco: 'nenhum' },
        { atributo: 'raciocinio', pericia: 'ocultismo', enquadramento: 'você reconhece de longe', risco: 'margem menor' },
        { atributo: 'inteligencia', pericia: 'academicos', enquadramento: 'você busca o contexto histórico', risco: 'demora' }
      ]
    },
    passar_por_humano: {
      nome: 'Passar por humano', dominio: 'persuasao',
      frases: ['passar por humano', 'finjo estar vivo', 'disfarcar', 'rubor da vida', 'parecer normal',
               'me passo por'],
      exige: ['mente'],
      rotas: [
        { atributo: 'manipulacao', pericia: 'labia', enquadramento: 'você atua', risco: 'um detalhe escapa' },
        { atributo: 'carisma', pericia: 'performance', enquadramento: 'você encena estar vivo', risco: 'cansa rápido' }
      ]
    },
    celebrar_ritae: {
      nome: 'Celebrar um Ritae', dominio: 'ocultismo',
      frases: ['celebrar', 'celebro', 'ritae', 'rito', 'vaulderie', 'sangrar no calice',
               'calice', 'monomacia', 'banquete de sangue', 'conduzo o rito', 'sacerdote celebra'],
      exige: ['maos', 'sangue', 'mente'], alcance: 'toque', seita: 'sabbat',
      rotas: [
        { atributo: 'carisma', pericia: 'ocultismo', enquadramento: 'você conduz como manda o cânone', risco: 'um erro anula o efeito para todos' },
        { atributo: 'manipulacao', pericia: 'performance', enquadramento: 'você faz o rito valer pelo espetáculo', risco: 'o Sacerdote nota a improvisação' },
        { atributo: 'determinacao', pericia: 'ocultismo', enquadramento: 'você aguenta o rito até o fim', risco: 'custa Vontade' }
      ]
    },
    invocar_vinculum: {
      nome: 'Invocar o Vinculum', dominio: 'intimidacao',
      frases: ['invocar o vinculum', 'invoco o vinculum', 'apelo ao sangue da matilha',
               'lembro do vinculo', 'pelo sangue que dividimos'],
      exige: ['fala'], alcance: 'voz', seita: 'sabbat',
      rotas: [
        { atributo: 'carisma', pericia: 'lideranca', enquadramento: 'você invoca o sangue dividido', risco: 'abusar disso leva a exílio ou Monomacia' },
        { atributo: 'manipulacao', pericia: 'intimidacao', enquadramento: 'você cobra o vínculo como dívida', risco: 'a matilha guarda mágoa' }
      ]
    },
    cobrar_favor: {
      nome: 'Cobrar um favor', dominio: 'persuasao',
      frases: ['cobrar o favor', 'cobro o favor', 'voce me deve', 'me deve uma',
               'lembra do que eu fiz', 'chamar a divida', 'cobro a divida'],
      exige: ['fala'], alcance: 'voz', seita: 'anarquistas',
      rotas: [
        { atributo: 'carisma', pericia: 'persuasao', enquadramento: 'você lembra sem humilhar', risco: 'o favor acaba aqui' },
        { atributo: 'manipulacao', pericia: 'intimidacao', enquadramento: 'você cobra na frente dos outros', risco: 'ganha um inimigo permanente' },
        { atributo: 'inteligencia', pericia: 'politica', enquadramento: 'você transforma a dívida em acordo novo', risco: 'formaliza o que era informal' }
      ]
    },
    chamar_baronia: {
      nome: 'Chamar a baronia', dominio: 'intimidacao',
      frases: ['chamar a baronia', 'chamo o pessoal', 'chamar o barao', 'aciono a baronia',
               'peco reforco', 'chamo reforco'],
      exige: ['fala'], alcance: 'ilimitado', seita: 'anarquistas',
      rotas: [
        { atributo: 'carisma', pericia: 'lideranca', enquadramento: 'você pede e o pessoal vem', risco: 'alguém morre no lugar de você' },
        { atributo: 'manipulacao', pericia: 'manha', enquadramento: 'você espalha que o território está ameaçado', risco: 'a corte fica sabendo' }
      ]
    },
    vender_servico: {
      nome: 'Vender um serviço', dominio: 'persuasao',
      frases: ['vender', 'vendo', 'ofereco meus servicos', 'proponho um negocio', 'tenho um preco',
               'fecho contrato', 'negocio um contrato'],
      exige: ['fala', 'mente'], alcance: 'voz', seita: 'independente',
      rotas: [
        { atributo: 'manipulacao', pericia: 'financas', enquadramento: 'você precifica sem piedade', risco: 'o cliente cobra exclusividade' },
        { atributo: 'carisma', pericia: 'persuasao', enquadramento: 'você vende confiança antes do serviço', risco: 'prometeu prazo demais' },
        { atributo: 'inteligencia', pericia: 'ocultismo', enquadramento: 'você mostra o que só você sabe fazer', risco: 'alguém aprende observando' }
      ]
    },
    pedir_passagem: {
      nome: 'Pedir passagem em domínio alheio', dominio: 'persuasao',
      frases: ['pedir passagem', 'peco passagem', 'peco permissao', 'me apresento ao dono',
               'peco licenca pra cacar', 'pedir hospitalidade'],
      exige: ['fala', 'mente'], alcance: 'voz',
      rotas: [
        { atributo: 'carisma', pericia: 'etiqueta', enquadramento: 'você faz do jeito certo', risco: 'fica devendo' },
        { atributo: 'manipulacao', pericia: 'labia', enquadramento: 'você omite metade do motivo', risco: 'se for pego, vira invasão' },
        { atributo: 'inteligencia', pericia: 'politica', enquadramento: 'você invoca precedente', risco: 'formaliza a disputa' }
      ]
    },
    escutar: {
      nome: 'Escutar', dominio: 'investigacao',
      frases: ['escutar', 'escuto', 'ouvir', 'ouco', 'colar o ouvido', 'colo o ouvido', 'atras da porta',
               'presto atencao no som', 'escuto a conversa', 'fico na escuta', 'apuro o ouvido'],
      exige: ['audicao'], alcance: 'ambiente',
      rotas: [
        { atributo: 'raciocinio', pericia: 'consciencia', enquadramento: 'você filtra o barulho de fundo', risco: 'demora' },
        { atributo: 'inteligencia', pericia: 'investigacao', enquadramento: 'você sabe o que procurar na conversa', risco: 'precisa ficar parado' },
        { atributo: 'raciocinio', pericia: 'intuicao', enquadramento: 'você ouve o que não foi dito', risco: 'margem menor' }
      ]
    },
    farejar: {
      nome: 'Farejar', dominio: 'rua',
      frases: ['farejar', 'farejo', 'cheirar', 'cheiro o ar', 'sinto o cheiro',
               'que cheiro e esse', 'sigo o cheiro', 'cheiro de sangue'],
      exige: ['olfato'], alcance: 'ambiente',
      rotas: [
        { atributo: 'raciocinio', pericia: 'consciencia', enquadramento: 'você separa um cheiro do resto', risco: 'nenhum' },
        { atributo: 'raciocinio', pericia: 'sobrevivencia', enquadramento: 'você segue o rastro pelo nariz', risco: 'perde tempo' }
      ]
    },
    resistir_frenesi: {
      nome: 'Resistir ao frenesi', dominio: 'confronto',
      frases: ['resistir', 'me seguro', 'segurar a besta', 'controlar a fome', 'nao ceder'],
      exige: [],
      rotas: [
        { atributo: 'autocontrole', pericia: null, atributo2: 'determinacao',
          enquadramento: 'você segura a Besta', risco: 'custa Vontade se falhar' }
      ]
    }
  },

  LETRAS_ACENTUADAS: {
    a: 'aáàâãä', e: 'eéèêë', i: 'iíìîï', o: 'oóòôõö', u: 'uúùûü', c: 'cç', n: 'nñ'
  },

  regexDeTermo(termo) {
    const palavras = this.normalizar(termo).split(' ').filter(Boolean);
    if (!palavras.length) return null;
    let corpo = palavras.map(p => p.split('').map(ch => {
      const cls = this.LETRAS_ACENTUADAS[ch];
      return cls ? `[${cls}]` : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('')).join('\\s+');

    /* O MARCADOR TEM DE PINTAR O QUE O CASADOR ACEITOU.  (§99)

       Esta é a lição da §57 escrita duas telas acima: matcher que
       aceita o que o marcador não pinta é discordância, e ela é
       invisível — o jogador vê a ação reconhecida e não vê onde. Como
       `normalizar` passou a desfazer ênclise, o termo terminado em `r`
       precisa casar também com a forma sem ele: `abrir` pinta
       `abri-lo`, `pegar` pinta `pegá-lo`.

       Vale só para o fim do termo: em "abrir a porta" quem recebe o
       pronome é o último verbo, não o primeiro. */
    if (corpo.endsWith('r')) {
      corpo = `${corpo.slice(0, -1)}(?:r|-l[oa]s?)`;
    }
    return new RegExp(`(^|[^\\p{L}])(${corpo})(?=[^\\p{L}]|$)`, 'giu');
  },

  marcarTermos(texto, termos, envolver) {
    if (!termos || !termos.length) return esc(texto);
    const faixas = [];
    for (const t of termos) {
      const re = this.regexDeTermo(t);
      if (!re) continue;
      let m;
      while ((m = re.exec(texto)) !== null) {
        const ini = m.index + m[1].length;
        faixas.push({ ini, fim: ini + m[2].length });
        re.lastIndex = ini + m[2].length;
      }
    }
    if (!faixas.length) return esc(texto);
    faixas.sort((a, b) => a.ini - b.ini || b.fim - a.fim);
    const juntas = [];
    for (const f of faixas) {
      const ult = juntas[juntas.length - 1];
      if (ult && f.ini <= ult.fim) ult.fim = Math.max(ult.fim, f.fim);
      else juntas.push({ ...f });
    }
    let saida = '', pos = 0;
    for (const f of juntas) {
      saida += esc(texto.slice(pos, f.ini));
      saida += envolver(texto.slice(f.ini, f.fim));
      pos = f.fim;
    }
    return saida + esc(texto.slice(pos));
  },

  /* ------------------------------------------------------------
     A ÊNCLISE — o pronome colado no verbo  (§99)

     "quero abri-lo" não casava com `abrir`, e não era uma palavra
     faltando: era uma CLASSE inteira de frases que o jogador escreve e
     o Árbitro não entendia. A ênclise **come a letra final do verbo**:

       abrir + o  = abri-lo        pegar + o = pegá-lo
       comer + o  = comê-lo        pôr   + o = pô-lo

     Com `lo/la/los/las` o verbo perdeu a letra final — e no infinitivo,
     que é como o jogador escreve o que quer fazer, essa letra é sempre
     o `r`. Com os outros pronomes o verbo fica inteiro (`sente-se`,
     `deu-me`), e basta soltar o pronome.

     DESFAZ ANTES DE TIRAR A PONTUAÇÃO, e isso não é detalhe: é o hífen
     que separa uma ênclise de duas palavras soltas. Sem ele, "pego o
     envelope" viraria "pegoo".

     E desfaz antes de tirar o acento, porque o acento é o que sobra do
     verbo original: `pegá` + `r` → `pegár` → `pegar`.
     ------------------------------------------------------------ */
  CLITICOS: ['lo', 'la', 'los', 'las', 'lhe', 'lhes',
             'me', 'te', 'se', 'nos', 'vos', 'o', 'a', 'os', 'as'],

  /* Só estes quatro comem a letra final do verbo. */
  CLITICOS_QUE_COMEM_O_R: ['lo', 'la', 'los', 'las'],

  desfazerEnclise(t) {
    return String(t || '').replace(
      /(\p{L}+)-(los|las|lhes|lhe|lo|la|nos|vos|me|te|se|os|as|o|a)(?=$|[^\p{L}\p{N}])/giu,
      (todo, verbo, pronome) => {
        const cl = pronome.toLowerCase();
        return this.CLITICOS_QUE_COMEM_O_R.includes(cl) ? `${verbo}r` : verbo;
      });
  },

  normalizar(t) {
    return this.desfazerEnclise(String(t || '').toLowerCase())
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  },

  /* Casamento por PALAVRA INTEIRA, e não por substring.

     O defeito apareceu na §57, quando a caixa única passou a mandar
     "Grito:" para o léxico: "rito" está dentro de "grito", e o turno
     era lido como "Celebrar um Ritae" — rito do Sabbat. Casos iguais
     estavam por toda parte: "mordaça" dentro de "amordaçado", "ir"
     dentro de "sair", "ler" dentro de "valer".

     A checagem certa já existia neste arquivo: `regexDeTermo`, que
     marca os termos na tela. O que havia era uma DISCORDÂNCIA — o
     matcher aceitava o que o marcador depois não pintava, e ninguém
     via porque o pedaço casado não aparecia grifado.

     Agora os dois usam a mesma regra. */
  contemTermo(normalizado, termoNormalizado) {
    if (!termoNormalizado) return false;
    const corpo = termoNormalizado
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\s+/g, '\\s+');
    return new RegExp(`(^|[^\\p{L}\\p{N}])${corpo}(?=[^\\p{L}\\p{N}]|$)`, 'u')
      .test(normalizado);
  },

  interpretar(texto, modo) {
    const n = this.normalizar(texto);
    if (!n) return { intencao: null, confianca: 0, termos: [] };

    const marcados = [];
    for (const [id, acao] of Object.entries(this.ACOES)) {
      let peso = 0; const termos = [];
      for (const frase of acao.frases) {
        const f = this.normalizar(frase);
        if (!f) continue;
        if (this.contemTermo(n, f)) { peso += f.split(' ').length * 2 + f.length / 8; termos.push(frase); }
      }
      if (peso > 0) marcados.push({ id, acao, peso, termos });
    }

    for (const h of Object.values(HABILIDADES).flatMap(g => g.lista)) {
      const hn = this.normalizar(h.nome);
      if (this.contemTermo(n, hn)) {
        const alvo = marcados.find(m => m.acao.rotas.some(r => r.pericia === h.id));
        if (alvo) { alvo.peso += 3; alvo.termos.push(h.nome); }
      }
    }

    for (const [did, d] of Object.entries(DISCIPLINAS)) {
      for (const nivel of Object.values(d.poderes || {})) {
        for (const p of nivel) {
          if (this.contemTermo(n, this.normalizar(p.nome))) {
            marcados.push({ id: 'poder:' + did + ':' + p.nome, peso: 12,
              termos: [p.nome], poder: { disciplina: did, nome: p.nome },
              acao: { nome: p.nome, exige: [], rotas: [], dominio: null } });
          }
        }
      }
      if (this.contemTermo(n, this.normalizar(d.nome))) {
        marcados.push({ id: 'disciplina:' + did, peso: 8, termos: [d.nome],
          disciplina: did, acao: { nome: d.nome, exige: [], rotas: [], dominio: null } });
      }
    }

    if (!marcados.length) return { intencao: null, confianca: 0, termos: [], modo };

    marcados.sort((a, b) => b.peso - a.peso);
    const topo = marcados[0];
    const segundo = marcados[1];
    const margem = segundo ? topo.peso - segundo.peso : topo.peso;
    const ambiguo = !!(segundo && margem < topo.peso * 0.3);
    const forca = Math.min(1, topo.peso / 10);
    const confianca = Math.max(0, Math.min(1,
      ambiguo ? 0.25 + 0.30 * forca : 0.55 + 0.45 * forca));

    return {
      intencao: topo.id, acao: topo.acao, poder: topo.poder, disciplina: topo.disciplina,
      confianca: +confianca.toFixed(2), termos: topo.termos,
      ambiguo,
      alternativas: marcados.slice(1, 3).map(m => ({ id: m.id, nome: m.acao.nome })),
      modo
    };
  },
};

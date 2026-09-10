/* ============================================================
   VITAE — Clas (V5 + Guia do Jogador + livros de seita)
   ============================================================ */

const CLAS = [
  {
    id: 'brujah', nome: 'Brujah', epiteto: 'Os Aprendizes', simbolo: '☭',
    cor: '#b3202c',
    lema: 'Toda paixão é uma faísca; toda faísca quer incêndio.',
    resumo: 'Filósofos-guerreiros e rebeldes de coração escaldante. Amam causas do mesmo jeito que amam amantes: até queimar tudo.',
    disciplinas: ['celeridade', 'potencia', 'presenca'],
    maldicao: {
      nome: 'Sangue Fervente',
      texto: 'Subtraia da parada de qualquer teste para resistir a um frenesi de FÚRIA uma '
           + 'quantidade de dados igual à sua Gravidade da Perdição. A parada nunca cai '
           + 'abaixo de um dado. (básico, pág. 67)'
    },
    compulsao: {
      nome: 'Rebeldia',
      texto: 'Você precisa se opor a alguém em posição de autoridade — ou fazer o oposto do que lhe ordenaram. Penalidade de dois dados até se rebelar.'
    },
    arquetipos: ['Sindicalista abraçado durante a greve', 'MC de baile funk', 'Professora expulsa da universidade', 'Capoeirista da velha guarda'],
    seita: 'Anarquistas (deixou a Camarilla em 2018)'
  },
  {
    id: 'gangrel', nome: 'Gangrel', epiteto: 'As Feras', simbolo: '❦',
    cor: '#5c6b3a',
    lema: 'A cidade é só mais um mato com luzes.',
    resumo: 'Nômades, solitários, mais próximos da Besta do que qualquer outro. Falam pouco, mordem cedo.',
    disciplinas: ['animalismo', 'fortitude', 'metamorfose'],
    maldicao: {
      nome: 'Marca da Besta',
      texto: 'Em frenesi você ganha aspectos animalescos — um traço físico, um odor, um '
           + 'comportamento — em quantidade igual à sua Gravidade da Perdição. Cada '
           + 'aspecto reduz um Atributo em 1, e eles duram por mais uma noite depois do '
           + 'frenesi. Se você Curtir a Onda, escolhe manifestar apenas um. (básico, pág. '
           + '73)'
    },
    compulsao: {
      nome: 'Feralidade',
      texto: 'Perde a fala articulada. Penalidade de três dados em todas as Habilidades Sociais e Mentais até se alimentar ou explodir em violência.'
    },
    arquetipos: ['Rastreador de estrada', 'Ribeirinho do rio Negro', 'Motoboy que some ao amanhecer', 'Guardiã de terreno baldio'],
    seita: 'Anarquistas / Sem seita'
  },
  {
    id: 'malkaviano', nome: 'Malkaviano', epiteto: 'Os Lunáticos', simbolo: '☾',
    cor: '#6e5a8c',
    lema: 'Todo mundo ouve. Só nós admitimos.',
    resumo: 'Videntes fraturados. A loucura do clã é rede: o que um sabe, o sangue inteiro sussurra.',
    disciplinas: ['auspicios', 'dominacao', 'ofuscacao'],
    maldicao: {
      nome: 'Fissura',
      texto: 'Todo Malkaviano carrega um transtorno. Quando você sofre uma Falha Bestial '
           + 'ou uma Compulsão, ele vem à tona: penalidade igual à sua Gravidade da '
           + 'Perdição em UMA categoria de parada — Física, Social ou Mental — durante '
           + 'toda a cena, somada às penalidades de Compulsão. A categoria e a aflição se '
           + 'escolhem na criação. (básico, pág. 79)'
    },
    compulsao: {
      nome: 'Delírio',
      texto: 'Visões invadem tudo. Penalidade de dois dados em testes Sociais e de Percepção até a cena mudar.'
    },
    arquetipos: ['Cartomante da rodoviária', 'Interno fugido do sanatório', 'Profeta de esquina no centro', 'Radialista da madrugada'],
    seita: 'Camarilla'
  },
  {
    id: 'nosferatu', nome: 'Nosferatu', epiteto: 'Os Ratos', simbolo: '☣',
    cor: '#4a4436',
    lema: 'Feios o bastante para serem esquecidos. Espertos o bastante para saber tudo.',
    resumo: 'Deformados pelo Abraço, senhores dos esgotos e dos segredos. Informação é a única beleza que lhes restou.',
    disciplinas: ['animalismo', 'ofuscacao', 'potencia'],
    maldicao: {
      nome: 'Repulsivo',
      texto: 'Você tem o Defeito Repulsivo (-2) e jamais pode aumentar a Qualidade Visual. '
           + 'Toda tentativa de esconder suas deformidades sofre penalidade igual à sua '
           + 'Gravidade da Perdição — inclusive por Disciplina, como Máscara de Mil Faces '
           + 'e Disfarce do Impostor. Ser visto NÃO quebra a Máscara: você passa por '
           + 'grotesco, não por sobrenatural. (básico, pág. 85)'
    },
    compulsao: {
      nome: 'Rastejar',
      texto: 'Você precisa se manter fora de vista. Penalidade de dois dados em tudo enquanto estiver exposto.'
    },
    arquetipos: ['Catador do centro velho', 'Hacker do subsolo de Brasília', 'Coveiro municipal', 'Fofoqueira de bairro'],
    seita: 'Camarilla'
  },
  {
    id: 'toreador', nome: 'Toreador', epiteto: 'Os Degenerados', simbolo: '❧',
    cor: '#c2506e',
    lema: 'Se não é belo, que morra depressa.',
    resumo: 'Artistas, amantes e curadores. Escravos voluntários da beleza — e do tédio que vem logo depois dela.',
    disciplinas: ['auspicios', 'celeridade', 'presenca'],
    maldicao: {
      nome: 'Estética Ferida',
      texto: 'Enquanto você estiver num ambiente MENOS do que belo, as paradas para '
           + 'acionar Disciplinas sofrem redutor igual à sua Gravidade da Perdição. Quem '
           + 'julga a beleza do lugar — roupas e bonecas de sangue incluídas — é o '
           + 'Narrador, pelo senso estético do personagem. (básico, pág. 91)'
    },
    compulsao: {
      nome: 'Perfeccionismo',
      texto: 'Nada além do impecável serve. Só um sucesso crítico satisfaz; qualquer outro resultado impõe penalidade de dois dados até você acertar em cheio.'
    },
    arquetipos: ['Curadora de bienal', 'Passista de escola de samba', 'Fotógrafo de favela', 'Estilista de alto verão'],
    seita: 'Camarilla'
  },
  {
    id: 'tremere', nome: 'Tremere', epiteto: 'Os Usurpadores', simbolo: '⛧',
    cor: '#7b2d3f',
    lema: 'O sangue é uma linguagem. Nós a escrevemos.',
    resumo: 'Feiticeiros que roubaram a imortalidade. A Pirâmide ruiu, mas os segredos continuam de pé.',
    disciplinas: ['auspicios', 'dominacao', 'feiticaria'],
    maldicao: {
      nome: 'Vitae Corrompido',
      texto: 'Seu Vitae não cria mais Laço de Sangue com outros Membros, embora você possa '
           + 'ser Enlaçado por eles. Com mortais e carniçais o Laço ainda se forma, mas '
           + 'exige um número de goles a mais igual à sua Gravidade da Perdição. (básico, '
           + 'pág. 97)'
    },
    compulsao: {
      nome: 'Perfeccionismo Arcano',
      texto: 'Você precisa dominar o que falhou. Repita a tarefa fracassada até obter sucesso, com penalidade de dois dados em qualquer outra coisa.'
    },
    arquetipos: ['Pesquisadora de pós-graduação', 'Bibliotecário de acervo raro', 'Perito criminal', 'Herdeira de uma capela partida'],
    seita: 'Camarilla'
  },
  {
    id: 'ventrue', nome: 'Ventrue', epiteto: 'Os Reis', simbolo: '♛',
    cor: '#b58a3c',
    lema: 'Alguém tem de mandar. Que seja quem sabe.',
    resumo: 'Nobreza de sangue e de capital. Governam a Camarilla há séculos e não pretendem parar.',
    disciplinas: ['dominacao', 'fortitude', 'presenca'],
    maldicao: {
      nome: 'Paladar Refinado',
      texto: 'Só um tipo específico de mortal alimenta você; sangue de qualquer outro '
           + 'volta em vômito escarlate a menos que você gaste pontos de Força de Vontade '
           + 'em quantidade igual à sua Gravidade da Perdição. Determinação + Percepção '
           + '(Dificuldade 4 ou maior) diz se um mortal tem o sangue que você quer. '
           + '(básico, pág. 102)'
    },
    compulsao: {
      nome: 'Arrogância',
      texto: 'Você precisa liderar a cena. Enquanto não impuser sua vontade sobre alguém, penalidade de dois dados em tudo.'
    },
    arquetipos: ['Diretora de banco', 'Coronel aposentado', 'Deputado de mandato longo', 'Dona de rede hoteleira'],
    seita: 'Camarilla'
  },
  {
    id: 'lasombra', nome: 'Lasombra', epiteto: 'Os Magistrados', simbolo: '🜏',
    cor: '#4b3f6b',
    lema: 'Só a escuridão diz a verdade sobre você.',
    resumo: 'Predadores de sangue nobre e ambição sem fundo. Trouxeram o Abismo para o Novo Mundo — e para o Rio.',
    disciplinas: ['dominacao', 'oblivio', 'potencia'],
    maldicao: {
      nome: 'Ausência',
      texto: 'Espelhos e câmeras não seguram sua imagem: reflexos distorcem, gravações chiam, sensores falham quando você é o alvo.'
    },
    compulsao: {
      nome: 'Ruína',
      texto: 'Você precisa vencer a qualquer custo, escolhendo sempre a opção mais destrutiva disponível, ou sofre penalidade de dois dados.'
    },
    arquetipos: ['Dono de casa noturna em Ipanema', 'Juíza de tribunal superior', 'Traficante de arte sacra', 'Bispo do Sabá exilado'],
    seita: 'Camarilla (desde 2019) / Sabá remanescente'
  },
  {
    id: 'banu_haqim', nome: 'Banu Haqim', epiteto: 'Os Juízes', simbolo: '⚖',
    cor: '#8c5a2b',
    lema: 'A justiça tem gosto. Nós a bebemos.',
    resumo: 'Assassinos e juristas do sangue. Julgam os Membros pelos próprios pecados — e cobram na veia.',
    disciplinas: ['celeridade', 'feiticaria', 'ofuscacao'],
    maldicao: {
      nome: 'Sede do Juiz',
      texto: 'Provar sangue de outro Membro dispara a sede: teste de Autocontrole + Determinação ou entre em frenesi de fome contra vampiros.'
    },
    compulsao: {
      nome: 'Julgamento',
      texto: 'Você precisa beber ao menos um ponto de Vitalidade de alguém que violou o próprio código, ou sofre penalidade de dois dados.'
    },
    arquetipos: ['Promotor de justiça', 'Ex-operador de tropa de elite', 'Vingadora silenciosa', 'Alfaiate que aceita encomendas estranhas'],
    seita: 'Camarilla (desde 2013)'
  },
  {
    id: 'hecata', nome: 'Hecata', epiteto: 'O Clã da Morte', simbolo: '⚰',
    cor: '#3d5a5a',
    lema: 'A família é eterna. Literalmente.',
    resumo: 'Necromantes reunidos de linhagens rivais: Giovanni, Samedi, Pisanob. Traficam com os mortos e cobram juros.',
    disciplinas: ['auspicios', 'fortitude', 'oblivio'],
    maldicao: {
      nome: 'Toque Doloroso',
      texto: 'Seu Beijo é agonia pura. A vítima jamais sente prazer, resiste com todas as forças, e alimentar-se fica muito mais difícil.'
    },
    compulsao: {
      nome: 'Morbidez',
      texto: 'Você precisa entender uma morte específica. Penalidade de dois dados em tudo que não seja essa investigação mórbida.'
    },
    arquetipos: ['Herdeira de funerária centenária', 'Pai de santo que negocia com eguns', 'Legista noturno', 'Pisanob vindo da Amazônia'],
    seita: 'Independente'
  },
  {
    id: 'ministerio', nome: 'O Ministério', epiteto: 'Os Serpentes', simbolo: '𓆙',
    cor: '#6a7d3c',
    lema: 'Toda corrente pode ser quebrada. Deixe-me te mostrar a sua.',
    resumo: 'Herdeiros dos Seguidores de Set. Libertam pela tentação — e a liberdade que vendem tem hipoteca.',
    disciplinas: ['ofuscacao', 'presenca', 'metamorfose'],
    maldicao: {
      nome: 'Abominação da Luz',
      texto: 'Luz intensa queima. Penalidades sob luz forte aumentam e o dano do Sol vem um nível acima do normal.'
    },
    compulsao: {
      nome: 'Transgressão',
      texto: 'Você precisa tentar alguém a quebrar uma Convicção — ou quebrar uma das suas. Penalidade de dois dados até conseguir.'
    },
    arquetipos: ['Dono de motel na Dutra', 'Pastor de igreja lotada', 'Aliciadora de carnaval', 'Farmacêutico de drogas de design'],
    seita: 'Independente / Anarquistas'
  },
  {
    id: 'ravnos', nome: 'Ravnos', epiteto: 'Os Andarilhos', simbolo: '☸',
    cor: '#a05a2c',
    lema: 'Parar é morrer duas vezes.',
    resumo: 'Sobreviventes de um clã quase extinto na Semana do Pesadelo. Não podem descansar duas vezes no mesmo lugar.',
    disciplinas: ['animalismo', 'ofuscacao', 'presenca'],
    maldicao: {
      nome: 'Repouso Inquieto',
      texto: 'Dormir duas vezes seguidas no mesmo refúgio provoca Dano Agravado igual à sua Potência de Sangue ao acordar.'
    },
    compulsao: {
      nome: 'Ansiedade',
      texto: 'Você precisa se arriscar sem necessidade ou ir embora imediatamente. Penalidade de dois dados até se mover.'
    },
    arquetipos: ['Caminhoneiro da BR-116', 'Artista de circo itinerante', 'Cambista de estádio', 'Mochileira que nunca envelhece'],
    seita: 'Sem seita'
  },
  {
    id: 'tzimisce', nome: 'Tzimisce', epiteto: 'Os Dragões', simbolo: '🜹',
    cor: '#5a3a52',
    lema: 'A carne é barro. Eu sou o oleiro.',
    resumo: 'Antigos vaivodas do leste, escultores de carne e de território. Possuem — coisas, lugares, pessoas.',
    disciplinas: ['animalismo', 'auspicios', 'metamorfose'],
    maldicao: {
      nome: 'Fundação',
      texto: 'Você precisa dormir cercado por algo que reivindica como seu. Sem isso, perde metade da Força de Vontade a cada noite, cumulativamente.'
    },
    compulsao: {
      nome: 'Possessividade',
      texto: 'Ninguém toca no que é seu. Penalidade de dois dados em qualquer ação que não seja reafirmar seu domínio.'
    },
    arquetipos: ['Fazendeira do Centro-Oeste', 'Cirurgião plástico clandestino', 'Colecionador de terras', 'Escultora de barro e osso'],
    seita: 'Sem seita / Sabá'
  },
  {
    id: 'salubri', nome: 'Salubri', epiteto: 'Os Cíclopes', simbolo: '👁',
    cor: '#7d6ba8',
    lema: 'Eu carrego a dor de vocês. Alguém tem que carregar.',
    resumo: 'Curandeiros quase extintos, caçados como se fossem diablerie ambulante. O terceiro olho abre com o Abraço.',
    disciplinas: ['auspicios', 'dominacao', 'fortitude'],
    maldicao: {
      nome: 'Presa Marcada',
      texto: 'O terceiro olho sangra quando você usa Disciplinas. E todos sabem que seu sangue recompensa quem cometer diablerie em você.'
    },
    compulsao: {
      nome: 'Afeição',
      texto: 'Você precisa aliviar o sofrimento de quem está à sua frente. Penalidade de dois dados até ajudar.'
    },
    arquetipos: ['Enfermeira de UPA', 'Capelão de hospital', 'Terapeuta noturno', 'Parteira de beira de rio'],
    seita: 'Sem seita'
  },
  {
    id: 'caitiff', nome: 'Caitiff', epiteto: 'Os Sem-Clã', simbolo: '✖',
    cor: '#5f5f5f',
    lema: 'Sem sobrenome, sem herança, sem coleira.',
    resumo: 'Abraçados sem linhagem reconhecível. Desprezados por todos e livres de qualquer maldição de clã.',
    disciplinas: [],
    disciplinasLivres: true,
    maldicao: {
      nome: 'Sem Herança',
      texto: 'Você não tem Perdição de clã — Antediluviano nenhum o tocou. Em troca começa '
           + 'com o Defeito Suspeito (•), não pode adquirir Status na criação, e o '
           + 'Narrador pode impor penalidade de um ou dois dados em testes Sociais contra '
           + 'quem saiba que você é Caitiff. Aumentar uma Disciplina custa SEIS vezes o '
           + 'nível. (básico, pág. 107)'
    },
    compulsao: {
      nome: 'Sem Compulsão',
      texto: 'Caitiff não possuem Compulsão de Clã. A Fome os empurra sem forma nem tradição.'
    },
    arquetipos: ['Abandonado num beco da Lapa', 'Criança de rua abraçada por engano', 'Erro de um ancião entediado'],
    seita: 'Qualquer / Nenhuma'
  },
  {
    id: 'sangue_fraco', nome: 'Sangue Fraco', epiteto: 'Filhos do Crepúsculo', simbolo: '◐',
    cor: '#8a8f6f',
    lema: 'Metade morto. Metade livre. Inteiramente descartável.',
    resumo: '14ª e 15ª gerações. Quase humanos, quase vampiros — e o pesadelo da Camarilla, porque passam despercebidos.',
    disciplinas: [],
    sangueFraco: true,
    maldicao: {
      nome: 'Sangue Ralo',
      texto: 'Potência do Sangue sempre 0, e Sem-Clã: você jamais sofre Perdição ou '
           + 'Compulsão de clã. Em troca, sofre dano Agravado não só de fogo e sol, mas '
           + 'também de armas cortantes e perfurantes; a estaca não o paralisa — causa '
           + 'trauma maciço, e provavelmente Torpor. A cura segue as regras dos outros '
           + 'vampiros. (básico, pág. 111)'
    },
    compulsao: {
      nome: 'Sem Compulsão',
      texto: 'Sem clã, sem compulsão. Use os Méritos e Defeitos de Sangue Fraco para definir seu lugar estranho no mundo.'
    },
    arquetipos: ['Universitária que ainda vai às aulas', 'Entregador que sangra pelas beiradas', 'Alquimista de fundo de quintal'],
    seita: 'Nenhuma (tolerados, usados, caçados)'
  }
];

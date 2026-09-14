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
      pagina: 'Guia, 29',
      texto: 'Reflexo e gravação o denunciam a quem sabe o que procura. Tecnologia de comunicação — até um telefonema — exige teste de Tecnologia com Dificuldade 2 + Gravidade da Perdição; evitar detecção eletrônica sofre penalidade igual à Gravidade.'
    },
    compulsao: {
      nome: 'Crueldade',
      texto: 'Na próxima falha em qualquer ação, penalidade de dois dados em TODO teste até uma nova tentativa da mesma ação dar certo ou a cena terminar — inclusive nas novas tentativas.'
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
      nome: 'Sangue que Julga',
      pagina: 'Guia, 18',
      texto: 'Saciar ao menos um nível de Fome com Sangue de Membro provoca teste de frenesi de Fome com Dificuldade 2 + Gravidade da Perdição. Falhando, você se empanturra — às vezes até a Diablerie.'
    },
    compulsao: {
      nome: 'Julgamento',
      texto: 'Por uma cena, você precisa saciar ao menos um ponto de Fome de quem agir contra uma Convicção sua, amigo ou inimigo. Não fazer isso custa três dados em todos os testes até satisfazer ou a cena acabar.'
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
      nome: 'O Beijo que Dói',
      pagina: 'Guia, 23',
      texto: 'Suas presas trazem agonia, não prazer. Só se bebe direto causando dano. Mortal coagido ou voluntário testa Vigor + Determinação contra Dificuldade 2 + Gravidade da Perdição para não se debater; Membro mordido testa frenesi de terror contra Dificuldade 3.'
    },
    compulsao: {
      nome: 'Morbidade',
      texto: 'Necessidade imediata de levar algo da vida à morte ou da morte à vida — pessoa, objeto, ideia, conversa. Toda ação sem esse fim sofre dois dados de penalidade, até você matar ou devolver algo à vida.'
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
      pagina: 'Guia, 36',
      texto: 'Seu Sangue abomina a luz. Sob luz brilhante apontada para você, penalidade igual à Gravidade da Perdição em todas as paradas. E a luz do sol causa Gravidade da Perdição a mais de dano Agravado.'
    },
    compulsao: {
      nome: 'Transgressão',
      texto: 'Dois dados de penalidade em toda parada que não sirva para induzir alguém — inclusive você — a quebrar um Princípio da Crônica ou uma Convicção, causando ao menos uma Mácula. Isso encerra a Compulsão.'
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
      nome: 'Condenados',
      pagina: 'Guia, 42',
      texto: 'O fogo de Zapathasura corre no Sangue. Dormir no mesmo lugar mais de uma vez em sete noites: role Gravidade da Perdição dados, e cada 10 é um Agravado. Dois lugares precisam estar a 1 km; refúgio móvel serve se andou 1,5 km. Vale em torpor. Não pode ter o Defeito Sem Refúgio.'
    },
    compulsao: {
      nome: 'Tentar o Destino',
      texto: 'No próximo problema, qualquer solução que não seja a mais chamativa ou perigosa sofre dois dados. Persiste até o problema se resolver ou novas tentações se tornarem impossíveis.'
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
      nome: 'A Carga',
      pagina: 'Guia, 54',
      texto: 'Você escolhe uma carga — um domínio, um grupo, uma organização, algo definido e limitado — e precisa dormir cercado por ela. Do contrário, sofre Agravado à Força de Vontade igual à Gravidade da Perdição ao acordar.'
    },
    compulsao: {
      nome: 'Cobiça',
      texto: 'Obsessão por possuir algo da cena — objeto, propriedade, pessoa. Toda ação sem esse fim sofre dois dados, até a posse se estabelecer ou o objeto ficar inatingível.'
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
      nome: 'Caçados',
      pagina: 'Guia, 47',
      texto: 'Seu sangue prende quem o bebe: outro Membro que sacie ao menos um nível de Fome com ele testa frenesi de Fome contra Dificuldade 2 + sua Gravidade da Perdição (3 + para Banu Haqim). E o terceiro olho chora vitae ao ativar qualquer Disciplina — Membros perto com Fome 4+ testam frenesi de Fome.'
    },
    compulsao: {
      nome: 'Empatia Afetiva',
      texto: 'Você é dominado pela empatia por um problema pessoal de alguém. Toda ação que não mitigue essa tragédia sofre dois dados, até o fardo ser aliviado, uma crise maior o substituir ou a cena terminar.'
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

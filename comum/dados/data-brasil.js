/* ============================================================
   VITAE — O Brasil das Trevas
   Fontes: Camarilla (V5), Anarquistas (V5), Sombras na Torre,
   SABBAT, Guia do Jogador + compilação de cânone do artigo
   "As Cidades Brasileiras em Vampiro: A Máscara" (Velhinho do RPG,
   16/06/2020) — velhinhodorpg.com
   ============================================================ */

const CIDADES = [
  {
    id: 'rio',
    nome: 'Rio de Janeiro',
    uf: 'RJ',
    tagline: 'Cidade Livre. A festa nunca acaba — e ninguém sai depois das luzes.',
    canon: 'alto',
    poder: 'Camarilla e remanescentes do Sabá, em trégua armada',
    principe: 'Inés Tristão (Tremere) — nomeada nas noites atuais',
    arcebispo: 'Gratiano de Veronese (Lasombra, 4ª geração, Matusalém)',
    clas: ['lasombra', 'toreador', 'brujah', 'malkaviano', 'tremere', 'ministerio', 'banu_haqim', 'hecata'],
    texto: [
      'Desde 1808, quando a corte portuguesa fugiu de Napoleão e trouxe anciãos junto com a bagagem, o Rio é território de trégua. Lasombra e Toreador dividiram a cidade e a declararam livre da Jyhad — um paraíso de alimentação fácil onde Camarilla e Sabá compartilham sangue sem se estripar.',
      'O código local se chama Carnaval: troca livre de serviços e bens vampíricos, mandatos vagos, Máscara mantida. Isso não significa paz. Muitos Membros usam a neutralidade da cidade para caçar rivais sem sofrer punição da própria seita.',
      'Os Lasombra controlam as casas noturnas, a alta roda, o turismo e as praias. Os Toreador escolheram as favelas, os barracos e as ruas. É um arranjo que enlouquece qualquer forasteiro — e funciona há dois séculos.',
      'A regra que ninguém quebra duas vezes: não saia das luzes da cidade. Nas bordas — Mangaratiba, Zona Oeste, a mata da Tijuca — há os Unhudos, os Corpos-Secos: uma linhagem do Legado dos Afogados que se pendura nas árvores ou se finge de cadáver mumificado à espera de quem passar. Eles não distinguem mortal de Membro.'
    ],
    ganchos: [
      'Um turista foi drenado em Copacabana com câmera ligada — e o vídeo está subindo.',
      'O Pacto de São Sebastião está sendo testado: um Bispo do Sabá exigiu um Domínio na Zona Sul.',
      'Alguém está vendendo grimórios em igrejas antigas do Centro. Uma Josiana chegou na cidade atrás disso.',
      'Um Corpo-Seco desceu a serra e está caçando dentro da cidade.'
    ],
    predadoresTipicos: ['sereia', 'scene_queen', 'osiris', 'vira_lata'],
    ressonancia: 'sanguineo'
  },
  {
    id: 'sp',
    nome: 'São Paulo',
    uf: 'SP',
    tagline: 'A catedral ainda guarda os ritos. Mas quem manda mudou.',
    canon: 'medio',
    poder: 'Camarilla retomando; vácuo deixado pelo êxodo do Sabá',
    principe: 'Flávio Gonçalves (Toreador)',
    arcebispo: '—',
    clas: ['toreador', 'ventrue', 'lasombra', 'tzimisce', 'nosferatu', 'brujah', 'tremere'],
    texto: [
      'Por décadas São Paulo foi um dos maiores centros de poder do Sabá nas Américas, perdendo apenas para a Cidade do México. A Catedral da Sé abrigava um concílio ecumênico que codificava os Auctoritas Ritae — arcebispos, bispos e prisci vinham de todo o continente, e ser convidado a participar era honra suprema dentro da Mão Negra.',
      'Então veio a Guerra da Gehenna. O Sabá marchou para o Oriente Médio e levou consigo quase toda a estrutura da seita na cidade. Vinte milhões de mortais acordaram numa metrópole cujo dono simplesmente foi embora.',
      'O que sobrou é um vácuo do tamanho de São Paulo. A Camarilla nomeou um Príncipe Toreador e tenta governar uma cidade que nunca governou. Os Anarquistas viram uma oportunidade histórica. E nos subsolos da Sé ainda há coisas que ninguém desativou.'
    ],
    ganchos: [
      'A cripta da Sé foi reaberta. Alguém está celebrando ritos que deveriam ter ido embora.',
      'Uma Baronia anarquista declarou independência na Zona Leste. O Príncipe precisa de alguém descartável.',
      'Bispos do Sabá que ficaram para trás estão sendo caçados um a um — e não pela Camarilla.',
      'O Elísio marcado no MASP virou emboscada. Ninguém sabe de quem.'
    ],
    predadoresTipicos: ['extorsionista', 'trinchador', 'sacoleiro', 'scene_queen'],
    ressonancia: 'colerico'
  },
  {
    id: 'brasilia',
    nome: 'Brasília',
    uf: 'DF',
    tagline: 'O Congresso é Elísio. A fortaleza embaixo dele não é para nós.',
    canon: 'alto',
    poder: 'Camarilla — Ventrue e Toreador; Nosferatu autônomos no subsolo',
    principe: 'Definido pela mesa (a corte gira com os mandatos mortais)',
    arcebispo: '—',
    clas: ['ventrue', 'nosferatu', 'toreador', 'tremere', 'malkaviano'],
    texto: [
      'A capital foi erguida no planalto a partir de 1957 e o clã Nosferatu aproveitou o canteiro de obras: construíram sob a cidade uma fortaleza impenetrável, com portas projetadas para resistir a uma bomba de hidrogênio, protegida por minas, lança-chamas e granadas de fósforo.',
      'Os Nosferatu falam com orgulho da fortaleza. Não falam do motivo. Quem insiste recebe sempre a mesma resposta: é por causa "Dela que grita nas florestas". Especula-se que seja Gorgo, uma Nictuku de 4ª geração, cria de Absimiliard, cuja missão hereditária é exterminar os Nosferatu.',
      'Acima do solo, o Congresso Nacional funciona como Elísio. A segurança e a vigilância do prédio estão sob controle Toreador, e os Membros negociam dentro dele enquanto os políticos mortais negociam do lado. Os Ventrue defendem o arranjo com entusiasmo: o rigor da segurança garante que ninguém saque uma arma durante o debate.'
    ],
    ganchos: [
      'A fortaleza Nosferatu selou um setor inteiro e não explica por quê.',
      'Uma sessão do Elísio coincide com uma CPI. Duas caçadas acontecem no mesmo prédio.',
      'Um Membro do interior chegou dizendo ter ouvido o grito. Ninguém quer ficar perto dele.',
      'Um servidor de carreira descobriu registros de acesso ao subsolo que não deveriam existir.'
    ],
    predadoresTipicos: ['extorsionista', 'sandman', 'consensualista', 'sacoleiro'],
    ressonancia: 'fleumatico'
  },
  {
    id: 'manaus',
    nome: 'Manaus',
    uf: 'AM',
    tagline: 'A ópera na selva. E, ao redor dela, coisas piores que o Sabá.',
    canon: 'medio',
    poder: 'Disputado — células do Sabá infiltradas na cidade e na floresta',
    principe: 'Nenhum reconhecido de forma estável',
    arcebispo: 'Estrutura de bando, sem corte formal',
    clas: ['gangrel', 'hecata', 'tzimisce', 'lasombra', 'ravnos', 'nosferatu'],
    texto: [
      'Manaus explodiu no fim do século XIX com a borracha e ergueu uma casa de ópera no meio da selva para agradar barões. A riqueza foi embora; a cidade ficou, cercada por uma floresta que não pertence a ninguém.',
      'Poucos Membros ousam entrar na Bacia Amazônica. A mata é campo de batalha entre lobisomens e os laboratórios da Pentex, e os Garou desenvolveram uma abordagem militar para resolver problemas. Vampiros sábios ficam na cidade.',
      'Desde os anos 80 há relatos de bandos do Sabá atacando povoados e cidades pequenas ao redor. Eles não apenas matam: torturam, mutilam e às vezes Abraçam alguém e deixam para trás, confuso, sem saber o que virou — uma provocação deliberada à Máscara.',
      'Os Hecata chamam a Amazônia de despensa. Os Pisanob, linhagem necromante que veio do México pela mão dos Giovanni, encontraram aqui parentes que nunca souberam existir.'
    ],
    ganchos: [
      'Um Abraçado abandonado apareceu no porto sem senhor, sem clã e sem memória.',
      'Uma expedição de biólogos sumiu rio acima. O contratante era um Membro.',
      'A ópera vai reabrir com temporada noturna. Alguém quer usar a plateia.',
      'Garou marcaram território a trinta quilômetros da cidade. A fronteira encolheu.'
    ],
    predadoresTipicos: ['fazendeiro', 'ladrao_de_tumulos', 'alcapao', 'assassino_de_estrada'],
    ressonancia: 'animal'
  },
  {
    id: 'vitoria',
    nome: 'Vitória',
    uf: 'ES',
    tagline: 'Em 2017 o BOES entrou. Quase ninguém sobreviveu.',
    canon: 'medio',
    poder: 'Ruínas de corte — Segunda Inquisição operando abertamente',
    principe: 'Destruído no ataque de 2017',
    arcebispo: '—',
    clas: ['nosferatu', 'malkaviano', 'caitiff', 'sangue_fraco', 'gangrel'],
    texto: [
      'Vitória contribuiu com o Batalhão de Missões Especiais para a formação do BOES, o Batalhão de Operações Especiais que integra a Segunda Inquisição brasileira — uma das forças mais letais do planeta na guerra secreta contra os Membros.',
      'Em 2017 o BOES executou o primeiro ataque em massa a redutos vampíricos no Brasil, disfarçado sob uma greve da polícia militar. O Príncipe e boa parte da primogenitura foram destruídos, junto com muitos neonatos. A cidade virou cinza política.',
      'O ataque foi um balão de ensaio. O alvo real era o Rio de Janeiro.',
      'Quem sobreviveu não confia em ninguém, não frequenta Elísio e não usa telefone. Vitória hoje é o lugar onde um Membro aprende, do jeito mais duro, o que significa a Segunda Inquisição.'
    ],
    ganchos: [
      'Alguém está reunindo os sobreviventes. Pode ser reconstrução — pode ser isca.',
      'Um arquivo do BOES vazou com nomes ainda ativos.',
      'A Camarilla mandou um Arconte para "avaliar". Ele pergunta demais.',
      'Um Sangue Fraco passou por três checkpoints sem ser detectado. Todo mundo quer saber como.'
    ],
    predadoresTipicos: ['sacoleiro', 'sandman', 'consensualista', 'perseguidor'],
    ressonancia: 'melancolico'
  },
  {
    id: 'natal',
    nome: 'Natal',
    uf: 'RN',
    tagline: 'A cidade que formou uma Justicar. E a puniu por isso.',
    canon: 'baixo',
    poder: 'Camarilla tradicional, dura com anarquistas',
    principe: 'A definir pela mesa',
    arcebispo: '—',
    clas: ['brujah', 'ventrue', 'toreador', 'nosferatu'],
    texto: [
      'Natal entra no cânone por causa de uma pessoa: Manuela Cardoso Pinto, Brujah de 10ª geração, que foi xerife da cidade antes de chegar a Justicar do próprio clã.',
      'Manuela foi Abraçada em 1716 por Charles Hayworth, capitão inglês que combatia a pirataria promovida por Sabá e Anarquistas, e herdou dele o ódio a ambos. Como xerife, punia comunidades anarquistas com severidade desproporcional — sobretudo quando havia rumor de que abrigaram Smiling Jack.',
      'Ela perdeu a posição de Justicar quando os Brujah deixaram a Camarilla em 2018, mas permanece Josiana: a polícia secreta religiosa da seita, que desarticula cultos da Gehenna, investiga noddistas e caça infernalistas. Desde 2009 sua obsessão tem nome: Francisca.',
      'A cidade que ela deixou para trás ainda opera pelas regras dela. E ainda há anarquistas que não esqueceram.'
    ],
    ganchos: [
      'Manuela voltou à cidade. Ninguém sabe se como Josiana ou como exilada.',
      'Uma célula anarquista guarda arquivos de tudo que ela fez como xerife.',
      'Um culto de sangue se instalou na orla e a Camarilla local não percebeu.'
    ],
    predadoresTipicos: ['vira_lata', 'sereia', 'montero'],
    ressonancia: 'colerico'
  },
  {
    id: 'recife',
    nome: 'Recife',
    uf: 'PE',
    tagline: 'Onde uma escrava fugida virou a Anátema mais temida do país.',
    canon: 'baixo',
    poder: 'Camarilla nominal; infernalismo enraizado',
    principe: 'A definir pela mesa',
    arcebispo: '—',
    clas: ['lasombra', 'hecata', 'ministerio', 'toreador', 'malkaviano'],
    texto: [
      'Francisca Santos dos Rodriguez nasceu escrava em Santos e foi levada ainda pequena para Recife. Fugiu da fazenda, juntou-se a colonos portugueses, casou-se, teve gêmeos. Aos vinte e cinco anos matou os dois filhos e ofereceu os órgãos internos num ritual de magia negra em troca de poderes demoníacos.',
      'Foi presa. Passou uma noite na cela e saiu sem que ninguém jamais explicasse como. Depois disso foi Abraçada por um Lasombra da linhagem Angellis Ater — os Anjos Negros, mistura de Lasombra e Baali, que adoram o pecado e as trevas da alma.',
      'Hoje ela é uma das treze Anátemas da Lista Vermelha, sob Caçada de Sangue. Esconde grimórios e artefatos místicos em igrejas católicas brasileiras. Profetiza que "uma escuridão maior está para se elevar" e trabalha para despertar um Matusalém Baali sob a Cidade do México. Arcontes atribuem a ela o terremoto de 2014.',
      'Também atende pelos nomes Ozana Vargas e Julia Azevedo. E as igrejas de Recife nunca foram completamente vasculhadas.'
    ],
    ganchos: [
      'Um padre encontrou algo emparedado na sacristia e não conta a ninguém.',
      'Josianos chegaram à cidade e estão recrutando — ou pressionando.',
      'Uma mulher com dois nomes falsos foi vista num terreiro do Recife Antigo.'
    ],
    predadoresTipicos: ['osiris', 'ladrao_de_tumulos', 'trinchador'],
    ressonancia: 'melancolico'
  },
  {
    id: 'salvador',
    nome: 'Salvador',
    uf: 'BA',
    tagline: 'Primeira capital. Nenhum livro oficial. Todo o potencial místico do país.',
    canon: 'nenhum',
    poder: 'Território aberto — o Narrador define',
    principe: 'A definir pela mesa',
    arcebispo: '—',
    clas: ['brujah', 'hecata', 'ministerio', 'toreador', 'lasombra'],
    texto: [
      'A White Wolf nunca escreveu sobre Salvador, e isso é a melhor notícia possível para uma crônica: a primeira capital do Brasil, três séculos de porto negreiro, o maior acervo de religiosidade afro-brasileira do continente — e nenhuma linha de cânone amarrando as suas mãos.',
      'Brujah descendentes de escravizados e de quilombos. Hecata que negociam com quem já atravessou. Ministério disputando espaço com fé genuína e perdendo. E, acima de tudo, uma pergunta que nenhum livro oficial respondeu: o que os orixás e os eguns pensam de mortos que se recusam a atravessar?',
      'Trate Salvador como terra de ninguém com regras próprias. A Máscara aqui não protege só de mortais.'
    ],
    ganchos: [
      'Um babalorixá se recusa a receber um Membro e a casa inteira o apoia.',
      'Alguém está comprando terrenos no Pelourinho por preços absurdos.',
      'Um Hecata afirma que os eguns da cidade não obedecem a Oblívio.'
    ],
    predadoresTipicos: ['osiris', 'consensualista', 'scene_queen'],
    ressonancia: 'sanguineo'
  },
  {
    id: 'santos',
    nome: 'Santos',
    uf: 'SP',
    tagline: 'O porto por onde tudo entra — inclusive o que ninguém declarou.',
    canon: 'nenhum',
    poder: 'Território aberto — projeto de comunidade brasileira',
    principe: 'A definir pela mesa',
    arcebispo: '—',
    clas: ['hecata', 'nosferatu', 'ministerio', 'ravnos', 'lasombra'],
    texto: [
      'Santos é o maior porto da América Latina e a cidade onde Francisca Santos dos Rodriguez nasceu escrava. Duas razões suficientes para qualquer Narrador se interessar.',
      'Contêiner é o refúgio perfeito: chega, some, sai do país. Membros em fuga usam Santos como corredor. Os Hecata trabalham o cais. Os Nosferatu conhecem cada galeria de drenagem sob a orla.',
      'A proximidade com São Paulo faz de Santos válvula de escape do vácuo deixado pelo Sabá — e ninguém decidiu ainda de quem é a cidade.'
    ],
    ganchos: [
      'Um contêiner lacrado chegou de Lisboa com um sarcófago dentro.',
      'A Camarilla paulista quer anexar o porto. A cidade não pediu isso.',
      'Alguém está exportando corpos. Muito bem embalados.'
    ],
    predadoresTipicos: ['extorsionista', 'sacoleiro', 'alcapao'],
    ressonancia: 'fleumatico'
  },
  {
    id: 'curitiba',
    nome: 'Curitiba',
    uf: 'PR',
    tagline: 'Ordem, frio e um silêncio que parece ensaiado.',
    canon: 'nenhum',
    poder: 'Território aberto — tradicionalmente Camarilla nas versões de fãs',
    principe: 'A definir pela mesa',
    arcebispo: '—',
    clas: ['ventrue', 'tremere', 'nosferatu', 'toreador'],
    texto: [
      'Curitiba apareceu nas páginas da Dragão Brasil nos anos 90, um dos primeiros esforços nacionais de trazer o Mundo das Trevas para cá antes que houvesse qualquer material oficial traduzido.',
      'A cidade se presta a uma Camarilla de manual: urbanismo previsível, elite fechada, imprensa disciplinada, uma corte que valoriza etiqueta acima de sangue. É o tipo de lugar onde a Máscara nunca precisa ser defendida com violência — porque ninguém olha.',
      'O que quebra isso é sempre de fora. Um anarquista de São Paulo. Um Gangrel vindo do Sul. Uma célula do BOES fazendo um exercício.'
    ],
    ganchos: [
      'Um neonato quebrou a Máscara e a corte quer resolver sem barulho — do jeito deles.',
      'A Primogênita Ventrue não aparece em Elísio há três meses.',
      'Um Elísio novo foi aberto num museu. Alguém pagou muito por isso.'
    ],
    predadoresTipicos: ['consensualista', 'sandman', 'trinchador'],
    ressonancia: 'fleumatico'
  },
  {
    id: 'porto_alegre',
    nome: 'Porto Alegre',
    uf: 'RS',
    tagline: 'Fronteira. E quem vem do outro lado não pede visto.',
    canon: 'nenhum',
    poder: 'Território aberto — corredor com o Prata',
    principe: 'A definir pela mesa',
    arcebispo: '—',
    clas: ['gangrel', 'brujah', 'lasombra', 'tzimisce', 'ravnos'],
    texto: [
      'O Sul é corredor. Membros do Prata sobem, Membros do Sudeste descem, e Porto Alegre é onde os dois fluxos se encontram e negociam.',
      'É terreno fértil para Anarquistas: tradição sindical forte, desconfiança histórica do centro do país, e uma classe de Membros mais velhos que nunca se sentiu representada pela corte carioca ou paulista.',
      'Tzimisce que atravessaram o Atlântico com imigrantes do leste europeu encontraram no interior gaúcho exatamente o que precisavam: terra, isolamento e gente que não faz perguntas.'
    ],
    ganchos: [
      'Uma Baronia anarquista quer reconhecimento formal e mandou emissários.',
      'Fazendas no interior mudaram de dono três vezes em dois anos. Sempre à noite.',
      'Um bando atravessou a fronteira e não fala nenhuma língua conhecida.'
    ],
    predadoresTipicos: ['assassino_de_estrada', 'montero', 'vira_lata'],
    ressonancia: 'colerico'
  },
  {
    id: 'bh',
    nome: 'Belo Horizonte',
    uf: 'MG',
    tagline: 'Igrejas de mais, minas de mais, gente calada demais.',
    canon: 'nenhum',
    poder: 'Território aberto — sugestão: Camarilla clerical',
    principe: 'A definir pela mesa',
    arcebispo: '—',
    clas: ['ventrue', 'lasombra', 'hecata', 'tremere', 'nosferatu'],
    texto: [
      'Minas é o estado com mais igrejas barrocas do país — exatamente o tipo de lugar onde Francisca esconderia grimórios. E é o estado com mais buracos: minas desativadas, galerias, cidades históricas construídas sobre socavões.',
      'Uma corte que confunde catolicismo com etiqueta vampírica. Um subsolo Nosferatu que conecta bairros inteiros. E o silêncio mineiro, que é uma arma social tão eficiente quanto Dominação.',
      'Aqui os segredos não são guardados: são simplesmente nunca mencionados.'
    ],
    ganchos: [
      'Uma igreja do século XVIII em Ouro Preto foi arrombada e nada foi levado.',
      'Uma mina desativada foi comprada por uma empresa sem sede.',
      'Os Josianos pediram acesso ao acervo do arcebispado.'
    ],
    predadoresTipicos: ['ladrao_de_tumulos', 'montero', 'sacoleiro'],
    ressonancia: 'melancolico'
  }
];

const SEITAS = [
  {
    id: 'camarilla', nome: 'Camarilla', simbolo: '⚜',
    desc: 'A Torre de Marfim. Máscara acima de tudo, hierarquia acima de você. Cortou os neonatos do poder e agora paga o preço com a Segunda Inquisição no encalço.',
    brasil: 'Domina o Rio, Brasília e retoma São Paulo. No Brasil sua maior ameaça não é o Sabá — é o BOES.'
  },
  {
    id: 'anarquistas', nome: 'Movimento Anarquista', simbolo: '✊',
    desc: 'Baronias, não Principados. Sem anciãos por perto, os jovens tomaram bairros inteiros. Brujah lideram desde 2018; Gangrel os acompanham.',
    brasil: 'O vácuo deixado pelo êxodo do Sabá em São Paulo é a maior oportunidade anarquista da história do país.'
  },
  {
    id: 'sabbat', nome: 'Sabá', simbolo: '🜏',
    desc: 'A Espada de Caim marchou para o Oriente Médio na Guerra da Gehenna. Quem ficou está sem estrutura, sem ordens e mais perigoso por isso.',
    brasil: 'A Catedral da Sé foi um dos centros teológicos da Mão Negra. Bandos ainda operam na Amazônia, atacando povoados e Abraçando por deboche.'
  },
  {
    id: 'independente', nome: 'Independentes', simbolo: '◈',
    desc: 'Hecata, Ministério, Ravnos, Tzimisce, Salubri. Sem seita, sem proteção, sem obrigações. Cada um com sua própria política.',
    brasil: 'Os Hecata prosperam onde há funerária e devoção. O Ministério onde há desejo — o que no Brasil significa em toda parte.'
  },
  {
    id: 'nenhuma', nome: 'Sem Seita', simbolo: '✖',
    desc: 'Autarca, exilado, Sangue Fraco, Caitiff perdido. A liberdade de não ter ninguém para chamar quando der errado.',
    brasil: 'Vitória depois de 2017 é o retrato disso: uma cidade inteira de Membros sem corte.'
  }
];

const AMEACAS_BR = [
  { nome: 'BOES — Batalhão de Operações Especiais', tipo: 'Segunda Inquisição',
    desc: 'Formado com o Batalhão de Missões Especiais de Vitória. Executou o ataque de 2017 disfarçado de greve da PM e destruiu uma corte inteira. Está se organizando no Sudeste, com foco no Rio.' },
  { nome: 'Unhudos — Corpos-Secos', tipo: 'Legado dos Afogados',
    desc: 'Linhagem indígena das cercanias do Rio e da Amazônia. Penduram-se em árvores ou fingem-se de cadáver mumificado. Caçam mortais e Membros indistintamente. Estão se espalhando.' },
  { nome: 'Gorgo — Ela que grita nas florestas', tipo: 'Nictuku',
    desc: 'Nosferatu de 4ª geração, cria de Absimiliard. É a razão não declarada da fortaleza subterrânea de Brasília. Os Nictuku existem para exterminar os Nosferatu.' },
  { nome: 'Francisca Santos dos Rodriguez', tipo: 'Anátema da Lista Vermelha',
    desc: 'Lasombra de 9ª geração, infernalista dos Angellis Ater. Esconde grimórios em igrejas brasileiras e trabalha para despertar um Matusalém Baali. Sob Caçada de Sangue.' },
  { nome: 'Gratiano de Veronese', tipo: 'Matusalém',
    desc: 'Lasombra de 4ª geração, destruidor do próprio Antediluviano e um dos fundadores do Sabá. Arcebispo do Rio desde 1808. Ninguém sabe por que se contenta com isso.' },
  { nome: 'Garou da Bacia Amazônica', tipo: 'Outro sobrenatural',
    desc: 'Em guerra aberta contra os laboratórios da Pentex. Militarizados, territoriais e sem qualquer interesse em diplomacia com mortos-vivos.' }
];

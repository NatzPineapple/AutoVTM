/* ============================================================
   VITÆ — Tipos de Predador
   ------------------------------------------------------------
   OS DEZ PRIMEIROS SÃO DO BÁSICO, págs. 175–178, reescritos na
   §77 contra a página. Os seis últimos são do Guia do Jogador
   (págs. 107–111) e estão marcados: não foram conferidos.

   O capítulo do básico tem DEZ tipos, e não doze — Extorsionista
   e Ladrão de Túmulos, que muita lista traz como "do básico", só
   aparecem no Guia.

   NOMES. A tradução oficial não é a que este arquivo usava. Seis
   dos dez estavam com nome inventado pelo projeto:

     Vira-lata      ← chamava-se "Gato de Rua"
     Sacoleiro      ← "Ensacador"
     Sandman        ← "João-Pestana"  (o livro NÃO traduz)
     Sanguessuga    ← "Sanguessuga de Sangue"
     Scene Queen    ← "Rainha da Cena" (o livro NÃO traduz)
     Trinchador     ← "Cutelo"

   Os ids acompanharam os nomes, e `PREDADORES_RENOMEADOS` guarda
   os antigos para que ficha salva não perca o Predador em
   silêncio — foi a lição do id de sessão da §75.5.

   PISCINA DE CAÇADA. O básico **não dá parada de dados** para
   estes dez: ele descreve o estilo em prosa. O `piscinas` abaixo é
   inferência DESTE PROJETO, e está dito assim em cada entrada com
   `piscinaDoLivro: false`. Quem dá parada é o Guia, e só para os
   seis dele.
   ============================================================ */

const PREDADORES = [
  {
    id: 'consensualista', nome: 'Consensualista', simbolo: '🤝', pagina: 175,
    lema: 'Você nunca se alimenta contra o livre-arbítrio da vítima.',
    desc: 'Coletor de sangue para caridade, pervertido de carteirinha na "comunidade real de vampiros", '
        + 'ou a verdade dita na cara e a permissão obtida. A Camarilla chama o último método de quebra da Máscara.',
    teste: 'Manipulação + Persuasão',
    piscinas: [['manipulacao','persuasao']], piscinaDoLivro: false,
    especializacao: { opcoes: [['medicina', 'Flebotomia'], ['persuasao', 'Bolsas']] },
    disciplina: ['auspicios', 'fortitude'],
    humanidade: 1,
    vantagens: [],
    defeitos: [
      { nome: 'Segredo Sombrio: Quebrador da Máscara', pontos: 1, tipo: 'defeito' },
      { nome: 'Alimentação: Exclusão de Presa (sem consentimento)', pontos: 1, tipo: 'defeito' }
    ]
  },
  {
    id: 'fazendeiro', nome: 'Fazendeiro', simbolo: '🐄', pagina: 176,
    lema: 'Você só se alimenta de animais.',
    desc: 'A fome atormenta o tempo todo, mas você não matou um ser humano sequer — e pretende manter assim. '
        + 'Talvez em vida tenha sido ativista, padre, voluntário ou vegano.',
    teste: 'Inteligência + Empatia com Animais',
    piscinas: [['inteligencia','empatia_animais']], piscinaDoLivro: false,
    especializacao: { opcoes: [['empatia_animais', 'Animal Específico'], ['sobrevivencia', 'Caça']] },
    disciplina: ['animalismo', 'metamorfose'],
    humanidade: 1,
    vantagens: [],
    defeitos: [{ nome: 'Alimentação: Fazendeiro', pontos: 2, tipo: 'defeito' }],
    /* Duas travas que o livro impõe e o projeto não cobrava (§77). */
    claVetado: ['ventrue'],
    potenciaMaxima: 2,
    nota: 'Os Ventrue não podem escolher este tipo. E ninguém pode escolhê-lo com Potência de Sangue 3 ou mais.'
  },
  {
    id: 'osiris', nome: 'Osíris', simbolo: '👁', pagina: 176,
    lema: 'Você é celebridade entre os mortais, ou dirige um culto.',
    desc: 'Você se alimenta dos seus fãs ou adoradores, que o tratam como divindade. Sangue fácil, '
        + 'e seguidores que criam problema com as autoridades, a religião organizada e até a Camarilla.',
    teste: 'Manipulação + Subterfúgio ou Carisma + Performance',
    piscinas: [['manipulacao','labia'],['carisma','performance']], piscinaDoLivro: false,
    especializacao: { opcoes: [['ocultismo', 'Tradição específica'], ['performance', 'Campo específico']] },
    disciplina: ['feiticaria', 'presenca'],
    disciplinaRestrita: { feiticaria: 'tremere' },
    vantagens: [{ nome: 'Três pontos entre Fama e Rebanho', pontos: 3, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Dois pontos entre Defeitos Inimigos e Defeitos Míticos', pontos: 2, tipo: 'defeito' }],
    nota: 'A Feitiçaria de Sangue só está disponível para Tremere.'
  },
  {
    id: 'sacoleiro', nome: 'Sacoleiro', simbolo: '🩸', pagina: 176,
    lema: 'Você rouba, compra ou adquire sangue frio em vez de caçar.',
    desc: 'Mercado negro, assalto, perseguição de ambulância. Talvez você ainda trabalhe no turno da noite '
        + 'num hospital.',
    teste: 'Inteligência + Manha ou Finanças',
    piscinas: [['inteligencia','manha'],['inteligencia','financas']], piscinaDoLivro: false,
    especializacao: { opcoes: [['furto', 'Abrir Fechaduras'], ['manha', 'Mercado Negro']] },
    disciplina: ['feiticaria', 'ofuscacao'],
    disciplinaRestrita: { feiticaria: 'tremere' },
    vantagens: [{ nome: 'Alimentação: Esôfago de Ferro', pontos: 3, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Inimigo', pontos: 2, tipo: 'defeito' }],
    claVetado: ['ventrue'],
    nota: 'Os Ventrue não podem escolher este tipo. Sangue de bolsa nunca oferece Ressonância intensa, '
        + 'e a Feitiçaria de Sangue só está disponível para Tremere.'
  },
  {
    id: 'sandman', nome: 'Sandman', simbolo: '🌙', pagina: 176,
    lema: 'Você se alimenta de vítimas adormecidas.',
    desc: 'Discrição ou Disciplinas. Se elas nunca acordarem durante a alimentação, não saberão que você existe. '
        + 'Talvez você tenha sido muito antissocial em vida.',
    teste: 'Destreza + Furtividade',
    piscinas: [['destreza','furtividade']], piscinaDoLivro: false,
    especializacao: { opcoes: [['medicina', 'Anestésicos'], ['furtividade', 'Invasão']] },
    disciplina: ['auspicios', 'ofuscacao'],
    vantagens: [{ nome: 'Recursos', pontos: 1, tipo: 'antecedente' }],
    defeitos: []
  },
  {
    id: 'sanguessuga', nome: 'Sanguessuga', simbolo: '🧛', pagina: 176,
    lema: 'Você bebe de outros vampiros.',
    desc: 'Caçando, coagindo ou recebendo Sangue como pagamento — a única maneira verdadeiramente moral de '
        + 'se alimentar na qual você consegue pensar. É proibido na sociedade dos Membros, arriscado pra '
        + 'caralho, ou requer uma posição de poder invejável.',
    teste: 'Força + Briga contra Membros',
    piscinas: [['forca','briga'],['destreza','furtividade']], piscinaDoLivro: false,
    especializacao: { opcoes: [['briga', 'Membros'], ['furtividade', 'Contra Membros']] },
    disciplina: ['celeridade', 'metamorfose'],
    humanidade: -1,
    potenciaSangue: 1,
    vantagens: [],
    defeitos: [
      { nome: 'Segredo Sombrio: Diablerista, ou Segregado', pontos: 2, tipo: 'defeito' },
      { nome: 'Alimentação: Exclusão de Presa (mortais)', pontos: 2, tipo: 'defeito' }
    ]
  },
  {
    id: 'scene_queen', nome: 'Scene Queen', simbolo: '👑', pagina: 177,
    lema: 'Você se alimenta da cena que conhece por dentro.',
    desc: 'Familiaridade com uma subcultura e uma postura bem-trabalhada. Suas vítimas o adoram pelo status '
        + 'na cena, e quem entende o que você realmente é acaba desacreditado.',
    teste: 'Manipulação + Persuasão',
    piscinas: [['manipulacao','persuasao']], piscinaDoLivro: false,
    especializacao: { opcoes: [['etiqueta', 'Cena específica'], ['lideranca', 'Cena específica'],
                               ['manha', 'Cena específica']] },
    disciplina: ['dominacao', 'potencia'],
    vantagens: [
      { nome: 'Fama', pontos: 1, tipo: 'antecedente' },
      { nome: 'Contatos', pontos: 1, tipo: 'antecedente' }
    ],
    defeitos: [{ nome: 'Influência: Rejeitado, ou Alimentação: Exclusão de Presa', pontos: 1, tipo: 'defeito' }]
  },
  {
    id: 'sereia', nome: 'Sereia', simbolo: '💋', pagina: 177,
    lema: 'Você se alimenta durante ou enquanto finge fazer sexo.',
    desc: 'Disciplinas, talento para sedução ou o apetite insaciável dos outros escondem sua natureza carnívora. '
        + 'Nos momentos mais sombrios, você teme ser um amante problemático — ou coisa pior.',
    teste: 'Carisma + Subterfúgio',
    piscinas: [['carisma','labia'],['manipulacao','persuasao']], piscinaDoLivro: false,
    especializacao: { opcoes: [['persuasao', 'Sedução'], ['labia', 'Sedução']] },
    disciplina: ['fortitude', 'presenca'],
    vantagens: [{ nome: 'Visual: Belo', pontos: 2, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Inimigo: amante desprezado ou parceiro ciumento', pontos: 1, tipo: 'defeito' }]
  },
  {
    id: 'trinchador', nome: 'Trinchador', simbolo: '🏠', pagina: 178,
    lema: 'Você se alimenta em segredo da própria família.',
    desc: 'Da sua família e amigos mortais, ou dos de outra pessoa, com quem ainda mantém ligação. Os mais '
        + 'extremos adotam filhos e casam-se com um humano. A Camarilla proíbe: é brecha na Máscara prestes '
        + 'a acontecer.',
    teste: 'Manipulação + Subterfúgio',
    piscinas: [['manipulacao','labia'],['manipulacao','persuasao']], piscinaDoLivro: false,
    especializacao: { opcoes: [['persuasao', 'Gaslighting'], ['labia', 'Encobrimento']] },
    disciplina: ['dominacao', 'animalismo'],
    vantagens: [{ nome: 'Rebanho', pontos: 2, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Segredo Sombrio: Trinchador', pontos: 1, tipo: 'defeito' }]
  },
  {
    id: 'vira_lata', nome: 'Vira-lata', simbolo: '🐈‍⬛', pagina: 178,
    lema: 'Um combativo caçador de assalto.',
    desc: 'Você persegue, domina e bebe de quem puder, quando puder. Pode ter sido sem-teto, soldado das '
        + 'forças especiais, assassino dos cartéis ou caçador de animais selvagens.',
    teste: 'Força ou Destreza + Briga',
    piscinas: [['forca','briga'],['destreza','briga']], piscinaDoLivro: false,
    especializacao: { opcoes: [['intimidacao', 'Assalto à Mão Armada'], ['briga', 'Agarramento']] },
    disciplina: ['celeridade', 'potencia'],
    humanidade: -1,
    vantagens: [{ nome: 'Contatos criminosos', pontos: 3, tipo: 'antecedente' }],
    defeitos: []
  },

  /* ---------------------------------------------------------
     OS SEIS DO GUIA DO JOGADOR  (págs. 106–109 — G10, pago na §101)

     Conferidos no `V5-Guia-Do-Jogador.txt`. O Guia é tradução
     automática e "só apoio" pela tabela de autoridade, mas é a única
     fonte destes seis no disco — e a regra é entrar pela REGRA, não
     pelo vocabulário. Cada nome de Habilidade, Disciplina e Antecedente
     aqui é o do manual básico: onde o Guia escreve "Furto", o básico
     escreve Ladroagem (`furto`); "Consciência" é Percepção
     (`consciencia`); "Insight" é Sagacidade (`intuicao`);
     "Esquecimento" é Oblívio.

     O que a conferência achou: dos cinco que já existiam, NENHUM batia
     com a página. O Ladrão de Túmulos tinha parada, Qualidade e Defeito
     errados; o Montero tinha Disciplina errada; o Perseguidor não
     perdia Humanidade; o Alçapão tinha a parada de armadilhas e o
     Antecedente errados. E faltava um — o Ceifador, que é o sexto.

     O Guia também traz uma nota geral: o Tipo de Predador pode dar um
     ponto de Disciplina FORA DO CLÃ — "a fome pode ser mais forte que a
     linhagem" (pág. 107).
     --------------------------------------------------------- */
  {
    id: 'extorsionista', nome: 'Extorsionista', simbolo: '💼', pagina: 'Guia, 107',
    lema: 'Proteção. De mim, principalmente.',
    desc: 'Você vende segurança e cobra em veias. Quando a ameaça é real, o negócio parece justo; quando não é, você a inventa para que pareça.',
    teste: 'Força ou Manipulação + Intimidação',
    piscinas: [['forca','intimidacao'],['manipulacao','intimidacao']],
    especializacao: { opcoes: [['intimidacao', 'Coerção'], ['furto', 'Segurança']] },
    disciplina: ['dominacao', 'potencia'],
    vantagens: [{ nome: 'Três pontos entre Contatos e Recursos', pontos: 3, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Inimigo: a polícia, ou uma vítima que escapou e quer vingança', pontos: 2, tipo: 'defeito' }]
  },
  {
    id: 'ladrao_de_tumulos', nome: 'Ladrão de Túmulos', simbolo: '⚰', pagina: 'Guia, 108',
    lema: 'Os recém-mortos ainda têm o que dar.',
    desc: 'Cadáveres frescos, enlutados em cemitérios, pacientes e visitantes de hospital. A Ressonância Melancólica atrai mais que qualquer outra. Costuma exigir refúgio ou laços com igreja, hospital ou necrotério.',
    teste: 'Determinação + Medicina (vasculhar os mortos) · Manipulação + Sagacidade (entre os enlutados)',
    piscinas: [['determinacao','medicina'],['manipulacao','intuicao']],
    especializacao: { opcoes: [['ocultismo', 'Ritos Fúnebres'], ['medicina', 'Cadáveres']] },
    disciplina: ['fortitude', 'oblivio'],
    vantagens: [
      { nome: 'Qualidade de Alimentação: Estômago de Ferro', pontos: 3, tipo: 'merito', meritoId: 'iron_gullet' },
      { nome: 'Refúgio', pontos: 1, tipo: 'antecedente' }
    ],
    defeitos: [{ nome: 'Defeito de Rebanho: Predador Óbvio', pontos: 2, tipo: 'defeito', defeitoId: 'predador_obvio' }],
    /* "Um cadáver frio pode saciar até 3 pontos de Fome, mas sofre as
       mesmas penalidades de saciedade que o sangue ensacado." */
    alimentacao: { fonte: 'cadaver', saciaAte: 3, comoSangueEnsacado: true }
  },
  {
    id: 'ceifador', nome: 'Ceifador', simbolo: '🌾', pagina: 'Guia, 108',
    lema: 'Só o que já está indo.',
    desc: 'Também chamado de rato da peste: você se alimenta só de quem está prestes a morrer. Hospícios, casas de repouso, abrigos. Vive em movimento atrás de vítimas no fim, e tem dificuldade em se fixar.',
    teste: 'Inteligência + Percepção ou Medicina',
    piscinas: [['inteligencia','consciencia'],['inteligencia','medicina']],
    especializacao: { opcoes: [['consciencia', 'Morte'], ['furto', 'Falsificação']] },
    disciplina: ['auspicios', 'oblivio'],
    /* O único dos seis que GANHA Humanidade: quem só toma de quem já
       vai, poupa vidas. */
    humanidade: 1,
    vantagens: [{ nome: 'Aliados ou Influência na comunidade médica', pontos: 1, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Defeito de Alimentação: Presa Excluída — mortais saudáveis', pontos: 1, tipo: 'defeito', defeitoId: 'presa_excluida' }]
  },
  {
    id: 'montero', nome: 'Montero', simbolo: '🏹', pagina: 'Guia, 108',
    lema: 'A caçada é ritual e você tem batedores.',
    desc: 'A montería ibérica em versão moderna: lacaios encurralam a presa e a conduzem até você. Pode ser um golpe longo, um flash mob, uma confusão burocrática ou uma perseguição de gangue sem sentido aparente.',
    teste: 'Inteligência + Furtividade (planejar com a equipe) · Determinação + Furtividade (esperar a presa chegar)',
    piscinas: [['inteligencia','furtividade'],['determinacao','furtividade']],
    especializacao: { opcoes: [['lideranca', 'Matilha de Caça'], ['furtividade', 'Tocaia']] },
    disciplina: ['dominacao', 'ofuscacao'],
    humanidade: -1,
    vantagens: [{ nome: 'Lacaios', pontos: 2, tipo: 'antecedente' }],
    defeitos: []
  },
  {
    id: 'perseguidor', nome: 'Perseguidor', simbolo: '👁', pagina: 'Guia, 108–109',
    lema: 'Ninguém vai sentir falta.',
    desc: 'Você estuda a vítima, aprende a rotina dela e se ela pode sumir sem tumulto. Depois a segue a noite inteira, e ataca só quando a fome e o momento estão no ponto.',
    teste: 'Inteligência + Investigação (achar quem ninguém sente falta) · Vigor + Furtividade (longas perseguições)',
    piscinas: [['inteligencia','investigacao'],['vigor','furtividade']],
    especializacao: { opcoes: [['investigacao', 'Perfil'], ['furtividade', 'Sombra']] },
    disciplina: ['animalismo', 'auspicios'],
    humanidade: -1,
    vantagens: [
      { nome: 'Qualidade: Cheiro de Sangue', pontos: 1, tipo: 'merito', meritoId: 'cheiro_sangue' },
      { nome: 'Contatos entre os habitués do território: seguranças, vigias, vendedores da madrugada', pontos: 1, tipo: 'antecedente' }
    ],
    defeitos: []
  },
  {
    id: 'alcapao', nome: 'Alçapão', simbolo: '🕸', pagina: 'Guia, 109',
    lema: 'Você não caça. Você espera.',
    desc: 'Como a aranha-alçapão, você monta o ninho e atrai a presa até ele: um parque escuro, um banho turco, uma casa mal-assombrada, um clube da luta. As vítimas chegam ao seu lugar de poder.',
    teste: 'Carisma + Furtividade (quem entra esperando diversão) · Destreza + Furtividade (invasores e exploradores urbanos)',
    piscinas: [['carisma','furtividade'],['destreza','furtividade']],
    especializacao: { opcoes: [['persuasao', 'Marketing'], ['furtividade', 'Emboscadas']] },
    disciplina: ['metamorfose', 'ofuscacao'],
    vantagens: [
      { nome: 'Refúgio', pontos: 1, tipo: 'antecedente' },
      { nome: 'Lacaios (o major-domo), Rebanho (os visitantes) ou um segundo ponto de Refúgio', pontos: 1, tipo: 'antecedente' }
    ],
    defeitos: [{ nome: 'Defeito de Refúgio: Assustador ou Assombrado', pontos: 1, tipo: 'defeito' }],
    /* "Navegar pelo labirinto dentro de sua toca exige Raciocínio +
       Percepção (mas você pode adicionar seus pontos de Refúgio em
       dados à reserva)." */
    labirinto: { piscina: ['raciocinio','consciencia'], somaRefugio: true }
  },
  /* ASSASSINO DE ESTRADA — SEM FONTE NO DISCO.

     Não está no Guia do Jogador: os seis do Guia são os de cima. Este
     é do Companion (Roadside Killer), que só existe aqui em PDF de
     imagem, sem texto extraído. Fica porque há ficha salva usando o
     id, e apagá-lo quebraria o que o jogador guardou — mas fica
     MARCADO. Quando o Companion for lido, ele se confere ou sai. */
  {
    id: 'assassino_de_estrada', nome: 'Assassino de Estrada', simbolo: '🛣',
    naoConferido: 'Companion — sem texto no disco (§101)',
    lema: 'Rodovia, posto, motel, próximo estado.',
    desc: 'Caminhoneiros, mochileiros, gente que ninguém dá falta. Você nunca dorme duas vezes na mesma cidade.',
    teste: 'Destreza + Condução',
    piscinas: [['destreza','conducao']],
    especializacao: { opcoes: [['conducao', 'Perseguição'], ['sobrevivencia', 'Estradas']] },
    disciplina: ['celeridade', 'fortitude'],
    humanidade: -1,
    vantagens: [{ nome: 'Migrante (refúgio móvel)', pontos: 1, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Predador Óbvio', pontos: 2, tipo: 'defeito' }]
  },
];

/* Os ids mudaram junto com os nomes na §77. Ficha salva com o id
   velho continua achando o Predador — foi a lição do id de sessão da
   §75.5: o que se perde em silêncio é o pior tipo de perda. */
const PREDADORES_RENOMEADOS = {
  gato_de_rua:  'vira_lata',
  ensacador:    'sacoleiro',
  joao_pestana: 'sandman',
  rainha_da_cena: 'scene_queen',
  cutelo:       'trinchador'
};

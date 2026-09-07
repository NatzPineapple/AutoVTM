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
     DAQUI PARA BAIXO: GUIA DO JOGADOR, págs. 107–111.
     NÃO conferidos contra a página nesta rodada (§77). O Guia é
     a autoridade da matéria própria dele, e a leitura fica como
     pendência declarada — G10 no README §14.1.
     --------------------------------------------------------- */
  {
    id: 'extorsionista', nome: 'Extorsionista', simbolo: '💼',
    lema: 'Proteção. De mim, principalmente.',
    desc: 'Você vende segurança e cobra em veias. Coerção elegante, ameaça sussurrada, contrato assinado com dor.',
    teste: 'Força ou Manipulação + Intimidação',
    piscinas: [['forca','intimidacao'],['manipulacao','intimidacao']],
    especializacao: { opcoes: [['intimidacao', 'Extorsão'], ['furto', 'Segurança']] },
    disciplina: ['dominacao', 'potencia'],
    vantagens: [{ nome: 'Contatos ou Recursos', pontos: 3, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Inimigo poderoso', pontos: 2, tipo: 'defeito' }]
  },
  {
    id: 'ladrao_de_tumulos', nome: 'Ladrão de Túmulos', simbolo: '⚰',
    lema: 'Os recém-mortos ainda têm o que dar.',
    desc: 'Necrotérios, velórios, cemitérios, enchentes. Você trabalha onde o luto ainda é fresco.',
    teste: 'Determinação + Medicina (ou Manipulação + Subterfúgio entre enlutados)',
    piscinas: [['determinacao','medicina'],['manipulacao','labia']],
    especializacao: { opcoes: [['ocultismo', 'Fantasmas'], ['medicina', 'Necropsia']] },
    disciplina: ['oblivio', 'fortitude'],
    vantagens: [
      { nome: 'Refúgio (adega funerária)', pontos: 1, tipo: 'antecedente' },
      { nome: 'Aliado no ramo funerário', pontos: 1, tipo: 'antecedente' }
    ],
    defeitos: [{ nome: 'Refúgio sem Aquecimento / Alimentação Difícil', pontos: 1, tipo: 'defeito' }]
  },
  {
    id: 'montero', nome: 'Montero', simbolo: '🏹',
    lema: 'A caçada é ritual e você tem batedores.',
    desc: 'Tradição ibérica: uma equipe de carniçais encurrala a presa e você aplica o golpe final. Elegância aristocrática.',
    teste: 'Inteligência + Furtividade (com equipe)',
    piscinas: [['inteligencia','furtividade']],
    especializacao: { opcoes: [['lideranca', 'Carniçais'], ['furtividade', 'Emboscada']] },
    disciplina: ['dominacao', 'metamorfose'],
    humanidade: -1,
    vantagens: [{ nome: 'Retentores (batedores)', pontos: 2, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Adversário', pontos: 2, tipo: 'defeito' }]
  },
  {
    id: 'perseguidor', nome: 'Perseguidor', simbolo: '🎯',
    lema: 'Você estuda a presa antes de tocá-la.',
    desc: 'Vigilância, rotina, padrões. Quando finalmente ataca, a vítima já não tinha chance havia semanas.',
    teste: 'Inteligência + Investigação (para encontrar) / Destreza + Furtividade (para abater)',
    piscinas: [['inteligencia','investigacao'],['destreza','furtividade']],
    especializacao: { opcoes: [['investigacao', 'Perfil de Vítima'], ['furtividade', 'Perseguição']] },
    disciplina: ['auspicios', 'ofuscacao'],
    humanidade: -1,
    vantagens: [{ nome: 'Contato no submundo', pontos: 1, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Perseguido pela Máscara', pontos: 1, tipo: 'defeito' }]
  },
  {
    id: 'assassino_de_estrada', nome: 'Assassino de Estrada', simbolo: '🛣',
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
  {
    id: 'alcapao', nome: 'Alçapão', simbolo: '🕸',
    lema: 'Você não caça. Você espera.',
    desc: 'Seu refúgio é a armadilha: um prédio abandonado, um bar, uma casa em ruínas. Eles entram por conta própria.',
    teste: 'Carisma + Furtividade ou Raciocínio + Ladroagem (armadilhas)',
    piscinas: [['carisma','furtividade'],['raciocinio','furto']],
    especializacao: { opcoes: [['furto', 'Armadilhas'], ['manha', 'Boatos']] },
    disciplina: ['metamorfose', 'oblivio'],
    vantagens: [{ nome: 'Refúgio com 2 pontos extras', pontos: 3, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Refúgio Localizado / Infestado', pontos: 1, tipo: 'defeito' }]
  }
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

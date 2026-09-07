/* ============================================================
   VITAE — Atributos, Habilidades e regras de distribuição (V5)
   Referência: Vampiro: A Máscara 5ª Ed. + Guia do Jogador
   ============================================================ */

const ATRIBUTOS = {
  fisico: {
    rotulo: 'Físicos',
    icone: '✦',
    lista: [
      { id: 'forca',    nome: 'Força',        desc: 'Erguer, quebrar, esmagar. A carne cede.' },
      { id: 'destreza', nome: 'Destreza',     desc: 'Graça, precisão, o bote silencioso.' },
      { id: 'vigor',    nome: 'Vigor',        desc: 'Resistir. O corpo morto ainda aguenta.' }
    ]
  },
  social: {
    rotulo: 'Sociais',
    icone: '✧',
    lista: [
      { id: 'carisma',      nome: 'Carisma',      desc: 'O magnetismo que faz alguém se aproximar.' },
      { id: 'manipulacao',  nome: 'Manipulação',  desc: 'Torcer desejos alheios até virarem coleira.' },
      { id: 'autocontrole', nome: 'Autocontrole', desc: 'Sangue-frio. A máscara que não escorrega.' }
    ]
  },
  mental: {
    rotulo: 'Mentais',
    icone: '✥',
    lista: [
      { id: 'inteligencia', nome: 'Inteligência', desc: 'Memória, erudição, séculos de leitura.' },
      { id: 'raciocinio',   nome: 'Raciocínio',   desc: 'Reagir antes que o instinto decida por você.' },
      { id: 'determinacao', nome: 'Determinação', desc: 'Foco teimoso contra a Besta.' }
    ]
  }
};

/* 27 Habilidades — nomenclatura da edição brasileira */
/* As descrições vêm do capítulo Habilidades do básico, págs. 159–171,
   uma por Habilidade, com a página. Entraram na §71 para virar o
   `title` de cada linha no criador: até então o jogador escolhia 27
   nomes sem nenhuma explicação do que cada um cobre.

   São resumo fiel do primeiro parágrafo de cada verbete — não são o
   verbete inteiro, e não inventam nada que não esteja lá. */
const HABILIDADES = {
  fisico: {
    rotulo: 'Físicas',
    nota: 'Dependem inteiramente, ou em grande parte, de controle, aptidão ou esforço físico.',
    lista: [
      { id: 'armas_brancas', nome: 'Armas Brancas', pagina: 159,
        desc: 'Manejar armas portáteis com destreza: facas, correntes, tacos de beisebol. Uma estaca é arma branca — e costuma estar na mão de um suposto caçador.' },
      { id: 'armas_fogo',    nome: 'Armas de Fogo', pagina: 160,
        desc: 'Familiaridade com armas pequenas, de pistolas de proteção a rifles de assalto, e com o que dispara por gatilho — bestas, lançadores de granadas. Inclui limpar, destravar e recarregar depressa.' },
      { id: 'atletismo',     nome: 'Atletismo', pagina: 160,
        desc: 'Superar alguém numa perseguição a pé, esquivar de um carro que vem na sua direção, escalar e nadar como uma pessoa viva, saudável e robusta.' },
      { id: 'briga',         nome: 'Briga', pagina: 160,
        desc: 'Atingir o alvo com punhos, botas ou garras. Sem arma nas mãos, o ataque é briga — do aikijutsu elegante às bagunçadas brigas de rua.' },
      { id: 'conducao',      nome: 'Condução', pagina: 162,
        desc: 'Dirigir com rapidez e segurança em condição adversa: manobrar fora da estrada, evitar emboscada, vencer corrida de rua, escapar de perseguição da Segunda Inquisição.' },
      { id: 'furtividade',   nome: 'Furtividade', pagina: 163,
        desc: 'Seguir um alvo incógnito. Espionar, esgueirar-se e se misturar em multidões — é o que torna o vampiro um caçador superlativo.' },
      { id: 'furto',         nome: 'Ladroagem', pagina: 163,
        desc: 'Abrir fechaduras, plantar escutas, desativar alarmes, falsificar documento à mão, fazer ligação direta, abrir cofres. Os Ventrue chamam isto de "Segurança".' },
      { id: 'oficios',       nome: 'Ofícios', pagina: 164,
        desc: 'As artes, a criação de itens belos ou funcionais, e ofícios que vão de trabalhar cerâmica à construção e ao reforço do próprio refúgio. Vem com especialização gratuita.' },
      { id: 'sobrevivencia', nome: 'Sobrevivência', pagina: 164,
        desc: 'Viver na natureza e em outras condições adversas e voltar à civilização: guiar-se pelas estrelas, erguer refúgio improvisado, reconhecer sinal de lobisomem antes que seja tarde.' }
    ]
  },
  social: {
    rotulo: 'Sociais',
    nota: 'Operam no espaço entre as pessoas. Dependem do seu talento e da sua personalidade — mas a resposta da outra parte também conta.',
    lista: [
      { id: 'empatia_animais', nome: 'Empatia com Animais', pagina: 164,
        desc: 'Intimidar, pacificar e até fazer amizade com animais, e prever como um bicho vai reagir. Sem ela, a maioria das criaturas evita ou fica agressiva perto de vampiro.' },
      { id: 'etiqueta',        nome: 'Etiqueta', pagina: 164,
        desc: 'Identificar e responder às convenções sociais do cenário atual, estabelecer protocolo novo e agradar a todos com encanto. Vale na alta sociedade dos Membros e na dos mortais.' },
      { id: 'intimidacao',     nome: 'Intimidação', pagina: 165,
        desc: 'O poder de oprimir, coagir, ameaçar e forçar seu caminho para uma vitória social. Quem a emprega não hesita em esmagar vontades — e, de vez em quando, ossos dos dedos.' },
      { id: 'lideranca',       nome: 'Liderança', pagina: 165,
        desc: 'Conduzir uma multidão, comandar um destacamento, aumentar a moral de apoiadores ou controlar uma revolta. Príncipe ou Barão forte precisa disto, ou arrisca perder o trono.' },
      { id: 'manha',           nome: 'Manha', pagina: 165,
        desc: 'Falar a língua do submundo e negociar com a sociedade das ruas: entender palavra em código e gíria, interpretar mensagem em grafite, imitar sinal de gangue.' },
      { id: 'performance',     nome: 'Performance', pagina: 166,
        desc: 'Uma variedade de artes, da dança à poesia, da comédia à narração de histórias. Vem com especialização gratuita.' },
      { id: 'persuasao',       nome: 'Persuasão', pagina: 166,
        desc: 'Convencer os outros de que você sabe o que é melhor para eles e que uma mordidinha não dói. Funciona em tribunais, nas cortes dos Príncipes, em salas de reunião, bares e quartos.' },
      { id: 'intuicao',        nome: 'Sagacidade', pagina: 166,
        desc: 'Interpretar linguagem corporal, notar dica sutil na expressão e no tom, discernir verdade de mentira e compreender os motivos por trás das ações dos outros.' },
      { id: 'labia',           nome: 'Subterfúgio', pagina: 166,
        desc: 'A arte de mentir de forma convincente, distorcer uma história e dar boa desculpa por má ação. Define seu talento para intriga, segredo e falsidade — e serve para seduzir e imitar comportamento mortal.' }
    ]
  },
  mental: {
    rotulo: 'Mentais',
    nota: 'Dependem quase que inteiramente de conhecimento especializado e dos dons intelectuais do personagem.',
    lista: [
      { id: 'ciencias',     nome: 'Ciência', pagina: 168,
        desc: 'Escopo vasto: dos princípios básicos da vida à compreensão da entropia universal. As leis da ciência governam o mundo mortal, e os vampiros que desejam governar aquele mundo a estudam. Vem com especialização gratuita.' },
      { id: 'academicos',   nome: 'Erudição', pagina: 168,
        desc: 'Compreensão, ensino superior e capacidade de pesquisar nas ciências humanas e profissões liberais. História raramente é "exclusivamente acadêmica" quando seus inimigos imortais viveram naquele período. Vem com especialização gratuita.' },
      { id: 'financas',     nome: 'Finanças', pagina: 168,
        desc: 'Identificar tendência de mercado, investir bem, manipular ações e saber quando a crise vem. Também determina — e rastreia — a riqueza de outras pessoas, e intermedia acordos.' },
      { id: 'investigacao', nome: 'Investigação', pagina: 169,
        desc: 'Desvendar casos mundanos e misteriosos, localizar pistas, interpretá-las e rastrear pessoas desaparecidas. Vampiros acham esta Habilidade especialmente útil quando uma bolsa escapa.' },
      { id: 'medicina',     nome: 'Medicina', pagina: 170,
        desc: 'Tratar enfermos e feridos e diagnosticar causa de morte. Permite usar equipamento médico, prescrever medicamento e estancar — ou estimular — o fluxo sanguíneo.' },
      { id: 'ocultismo',    nome: 'Ocultismo', pagina: 170,
        desc: 'O conhecimento do mundo místico, dos ritos dos Maçons e Rosacruzes aos estudiosos Nodistas e magos reais. Reconhece símbolo oculto e prática de magia popular, verdadeira ou não.' },
      { id: 'consciencia',  nome: 'Percepção', pagina: 170,
        desc: 'Seus sentidos. Detectar um Filho de Haqim antes que o ataque aconteça, notar uma chave perto do lixo, sentir um perfume persistente.' },
      { id: 'politica',     nome: 'Política', pagina: 171,
        desc: 'Diplomacia e burocracia, humanas e vampíricas. Entre os Membros: o que ocorre, quais seitas dominam onde, quem está em guerra com quem e em que local os corpos estão enterrados. Literalmente.' },
      { id: 'tecnologia',   nome: 'Tecnologia', pagina: 171,
        desc: 'Alvo em movimento: governa a operação e o entendimento dos desenvolvimentos técnicos que a maioria dos vampiros considera desconcertantes. Hoje, computadores e sistemas informatizados.' }
    ]
  }
};

/* Distribuição de Atributos: um 4, três 3, quatro 2, um 1 */
const DIST_ATRIBUTOS = { 4: 1, 3: 3, 2: 4, 1: 1 };

/* Três modos de distribuir Habilidades */
const DIST_HABILIDADES = {
  especialista: {
    nome: 'Especialista',
    lema: 'Uma obsessão afiada até o osso.',
    desc: 'Um talento devastador e pouco mais. O mais indicado para novatos.',
    cotas: { 4: 1, 3: 3, 2: 3, 1: 3 },
    especializacoes: 1
  },
  equilibrado: {
    nome: 'Equilibrado',
    lema: 'Competente em tudo, insuperável em nada.',
    desc: 'Três boas armas na manga e um repertório largo.',
    cotas: { 3: 3, 2: 5, 1: 7 },
    especializacoes: 1
  },
  faz_tudo: {
    nome: 'Pau pra Toda Obra',
    lema: 'Séculos coletando ofícios como quem coleciona amantes.',
    desc: 'Amplitude enorme, profundidade rasa.',
    cotas: { 3: 1, 2: 8, 1: 10 },
    especializacoes: 1
  }
};

/* Habilidades que exigem especialização gratuita obrigatória */
const ESPECIALIZACAO_OBRIGATORIA = ['academicos', 'ciencias', 'oficios', 'performance'];

const SUGESTOES_ESPECIALIZACAO = {
  academicos: ['História', 'Teologia', 'Direito', 'Literatura', 'Antropologia'],
  ciencias:   ['Química', 'Biologia', 'Física', 'Astronomia'],
  oficios:    ['Marcenaria', 'Costura', 'Serralheria', 'Culinária', 'Tatuagem'],
  performance:['Dança', 'Canto', 'Atuação', 'Percussão', 'Poesia'],
  armas_brancas: ['Facas', 'Espadas', 'Improvisadas', 'Navalha'],
  armas_fogo: ['Pistolas', 'Fuzis', 'Tiro Rápido'],
  atletismo: ['Corrida', 'Escalada', 'Parkour', 'Natação'],
  briga: ['Capoeira', 'Jiu-Jitsu', 'Boxe', 'Luta Suja', 'Garras'],
  conducao: ['Motocicletas', 'Perseguição', 'Off-road'],
  furtividade: ['Sombras', 'Multidões', 'Emboscada'],
  furto: ['Arrombamento', 'Batedor de Carteiras', 'Cofres'],
  sobrevivencia: ['Mata Atlântica', 'Amazônia', 'Selva Urbana', 'Rastreamento'],
  empatia_animais: ['Cães', 'Ratos', 'Aves', 'Morcegos'],
  etiqueta: ['Elísio', 'Alta Sociedade', 'Corporativa', 'Terreiro'],
  intimidacao: ['Ameaça Velada', 'Violência', 'Tortura'],
  intuicao: ['Detectar Mentiras', 'Motivações', 'Desejo'],
  labia: ['Sedução', 'Disfarce', 'Mentira Longa'],
  lideranca: ['Oratória', 'Comando', 'Coteria'],
  manha: ['Tráfico', 'Favela', 'Boatos', 'Mercado Negro'],
  persuasao: ['Barganha', 'Sedução', 'Fé'],
  consciencia: ['Emboscadas', 'Sobrenatural'],
  financas: ['Lavagem', 'Mercado', 'Contrabando'],
  investigacao: ['Cena do Crime', 'Arquivos', 'Vigilância'],
  medicina: ['Cirurgia', 'Farmacologia', 'Necropsia'],
  ocultismo: ['Feitiçaria do Sangue', 'Noddismo', 'Umbanda', 'Candomblé', 'Infernalismo'],
  politica: ['Camarilla', 'Anarquistas', 'Municipal', 'Federal'],
  tecnologia: ['Hacking', 'Vigilância', 'Redes Sociais']
};

const SEXOS = [
  { id: 'masculino',        nome: 'Masculino',  nota: '' },
  { id: 'feminino',         nome: 'Feminino',   nota: '' },
  { id: 'intersexo_misto',  nome: 'Intersexo',  nota: 'mistura dos dois' },
  { id: 'intersexo_nulo',   nome: 'Intersexo',  nota: 'nulidade' }
];

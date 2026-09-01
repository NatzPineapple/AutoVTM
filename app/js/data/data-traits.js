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
const HABILIDADES = {
  fisico: {
    rotulo: 'Físicas',
    lista: [
      { id: 'armas_brancas', nome: 'Armas Brancas' },
      { id: 'armas_fogo',    nome: 'Armas de Fogo' },
      { id: 'atletismo',     nome: 'Atletismo' },
      { id: 'briga',         nome: 'Briga' },
      { id: 'conducao',      nome: 'Condução' },
      { id: 'furtividade',   nome: 'Furtividade' },
      { id: 'furto',         nome: 'Ladroagem' },
      { id: 'oficios',       nome: 'Ofícios' },
      { id: 'sobrevivencia', nome: 'Sobrevivência' }
    ]
  },
  social: {
    rotulo: 'Sociais',
    lista: [
      { id: 'empatia_animais', nome: 'Empatia com Animais' },
      { id: 'etiqueta',        nome: 'Etiqueta' },
      { id: 'intimidacao',     nome: 'Intimidação' },
      { id: 'lideranca',       nome: 'Liderança' },
      { id: 'manha',           nome: 'Manha' },
      { id: 'performance',     nome: 'Performance' },
      { id: 'persuasao',       nome: 'Persuasão' },
      { id: 'intuicao',        nome: 'Sagacidade' },
      { id: 'labia',           nome: 'Subterfúgio' }
    ]
  },
  mental: {
    rotulo: 'Mentais',
    lista: [
      { id: 'ciencias',     nome: 'Ciência' },
      { id: 'academicos',   nome: 'Erudição' },
      { id: 'financas',     nome: 'Finanças' },
      { id: 'investigacao', nome: 'Investigação' },
      { id: 'medicina',     nome: 'Medicina' },
      { id: 'ocultismo',    nome: 'Ocultismo' },
      { id: 'consciencia',  nome: 'Percepção' },
      { id: 'politica',     nome: 'Política' },
      { id: 'tecnologia',   nome: 'Tecnologia' }
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

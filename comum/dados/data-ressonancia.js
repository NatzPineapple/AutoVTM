/* ============================================================
   VITÆ — Ressonância, temperamento e Discrasia
   (básico, "O Sangue é a Vida" / "Ressonância", págs. 225–231)

   Até a §67 a Ressonância era DECORATIVA: um nome escolhido no
   passo VIII, impresso no rodapé da ficha, e nada mais. Medido:

     ressonancia = "colerico" → 5 dados
     ressonancia = ""         → 5 dados

   O livro (pág. 228) diz o contrário: temperamento INTENSO dá
   "um dado adicional em paradas de dados relacionadas a uma
   Disciplina que corresponda àquela Ressonância". O campo do
   TEMPERAMENTO nem existia na ficha, então a regra não tinha
   como ser aplicada nem por engano.

   As listas abaixo vieram do básico. A tabela do Escudo do
   Mestre traz OUTRA tradução dos mesmos nomes ("Fugaz",
   "Apurada", "Metamorfose", "Magia do sangue", "Rapiz") e é ela
   que o projeto tinha copiado. Onde os dois discordam, vale o
   básico — regra da casa, e ela já se pagou três vezes.
   ============================================================ */

/* Os quatro humores — básico, pág. 226. */
const HUMORES = [
  { id: 'colerico',    nome: 'Colérico',    elemento: 'Fogo',  funcao: 'Emoção',
    hormonio: 'Adrenalina',
    emocoes: 'Irado, violento, provocador, passional, invejoso' },
  { id: 'melancolico', nome: 'Melancólico', elemento: 'Terra', funcao: 'Pensamento',
    hormonio: 'Tireoide',
    emocoes: 'Triste, assustado, intelectual, deprimido, equilibrado' },
  { id: 'fleumatico',  nome: 'Fleumático',  elemento: 'Água',  funcao: 'Intuição',
    hormonio: 'Pituitária',
    emocoes: 'Preguiçoso, apático, calmo, controlador, sentimental' },
  { id: 'sanguineo',   nome: 'Sanguíneo',   elemento: 'Ar',    funcao: 'Sensação',
    hormonio: 'Testosterona/estrogênio',
    emocoes: 'Excitado, feliz, viciado, ativo, volúvel, entusiasmado' }
];

/* Ressonância e Disciplinas — básico, pág. 227.
   `disciplinas` guarda IDS, não texto: é isso que deixa o Árbitro
   comparar a Ressonância com a Disciplina que está sendo usada.
   Antes da §67 era uma string livre, e ela tinha envelhecido em
   dois pontos ("Metamorfose" virou Proteanismo na §64, e
   "Feitiçaria do Sangue" nunca foi o nome do livro). */
const RESSONANCIAS = [
  { id: 'colerico',   nome: 'Colérico',   pagina: 227, cor: '#b3202c',
    humor: 'raiva, violência, provocação, paixão, inveja',
    disciplinas: ['celeridade', 'potencia'] },
  { id: 'melancolico',nome: 'Melancólico',pagina: 227, cor: '#3f4a6b',
    humor: 'tristeza, medo, intelecto, depressão',
    disciplinas: ['fortitude', 'ofuscacao'] },
  { id: 'fleumatico', nome: 'Fleumático', pagina: 227, cor: '#4a6b6b',
    humor: 'preguiça, apatia, calma, controle, sentimento',
    disciplinas: ['auspicios', 'dominacao'] },
  { id: 'sanguineo',  nome: 'Sanguíneo',  pagina: 227, cor: '#b8446b',
    humor: 'excitação, alegria, vício, entusiasmo',
    disciplinas: ['feiticaria', 'presenca'] },
  { id: 'animal',     nome: 'Sangue animal', pagina: 227, cor: '#6b7a3f',
    humor: 'sangue de bicho — instinto puro',
    disciplinas: ['animalismo', 'metamorfose'],
    /* "Exceto para determinadas feras sussurradas nas profecias
       Gangrel, animais não fornecem Discrasias." (pág. 227) */
    semDiscrasia: true }
];

/* Os três temperamentos — básico, pág. 227. O quarto item da
   tabela aleatória ("equilibrada, insignificante") não é
   temperamento: é a ausência de um. */
const TEMPERAMENTOS = [
  { id: 'nenhum',  nome: 'Equilibrada', pagina: 228, dados: 0,
    desc: 'Ressonância insignificante. Nenhum efeito.' },
  { id: 'efemero', nome: 'Efêmero',     pagina: 227, dados: 0,
    desc: 'No instante, por estímulo momentâneo. Sem efeito mecânico imediato, exceto como ingrediente da Alquimia Sangue-Ralo — mas já basta para justificar gasto de experiência nas Disciplinas associadas (pág. 231).' },
  { id: 'intenso', nome: 'Intenso',     pagina: 228, dados: 1,
    desc: 'Tendência muito forte para uma Ressonância. Um dado adicional nas paradas da Disciplina correspondente, até a próxima dose diluir ou até chegar a Fome 5.' },
  { id: 'agudo',   nome: 'Agudo',       pagina: 228, dados: 1, discrasia: true,
    desc: 'Tão intenso que cria reação autossustentável no sangue: o mesmo dado adicional do intenso, MAIS uma Discrasia.' }
];

/* Exemplos de Discrasias — básico, págs. 230–231. Vinte e seis,
   por Ressonância. O livro é explícito sobre o custo (pág. 228):
   salvo indicação em contrário, o vampiro precisa MATAR E DRENAR
   a bolsa, ou se alimentar dela por três noites; e o efeito dura
   até se alimentar de novo ou chegar a Fome 5.

   `consome: true` marca as que o próprio livro diz que se gastam
   por completo no uso. */
const DISCRASIAS = {
  colerico: [
    { nome: 'Agressivo', efeito: 'Rerrole quaisquer rolagens que usem a Habilidade Intimidação. Você não pode rerrolar dados de Fome que resultaram em 1 na primeira rolagem.' },
    { nome: 'Ciclo de Violência', efeito: 'Sua próxima alimentação de sangue colérico sacia um nível adicional de Fome; outros tipos de sangue saciam um nível a menos.' },
    { nome: 'Energético', efeito: 'Ganhe 1 ponto de experiência gratuito para adquirir Celeridade ou Potência.', consome: true },
    { nome: 'Escrupuloso', efeito: 'Rerrole qualquer rolagem em um conflito contra um inimigo supostamente ideológico. Você não pode rerrolar dados de Fome que tiverem resultado em 1 na primeira rolagem.' },
    { nome: 'Inveja', efeito: 'O bebedor causa +1 de dano em oponentes melhores (mais atraentes, jovens, talentosos, altos, ricos, de maior status). Vale para combate social e físico.' },
    { nome: 'Valentão', efeito: 'O bebedor causa +1 de dano em oponentes mais fracos, ou nos tipos que a bolsa mais gostava de provocar. Vale para combate social e físico.' },
    { nome: 'Vingativo', efeito: 'Adicione dois dados a um teste contra o tipo de alvo de quem a bolsa desejava vingança, ou em todas as rolagens contra o indivíduo específico que ela odiava.' }
  ],
  melancolico: [
    { nome: 'Amor Perdido', efeito: 'Adicione um dado a todas as paradas para resistir a tentativas de sedução, incluindo Presença.' },
    { nome: 'Em Luto', efeito: 'Adicione um dado a testes de Remorso.' },
    { nome: 'Evocador', efeito: 'Ganhe 1 ponto de experiência gratuito para a aquisição de Fortitude ou Ofuscação.', consome: true },
    { nome: 'Falha Épica', efeito: 'Rerrole testes que lembrem a falha da bolsa. Você não pode rerrolar dados de Fome que resultaram em 1 na primeira rolagem.' },
    { nome: 'Nostálgico', efeito: 'Adicione um dado a rolagens que se conectem à década, forma de arte ou grupo social sobre o qual a bolsa estava nostálgica; três dados a uma parada de Memoriam que explore o assunto.' },
    { nome: 'Parente Perdido', efeito: 'Sacie 1 nível adicional de Fome ao se alimentar dos membros remanescentes da família dela.' }
  ],
  fleumatico: [
    { nome: 'Anestesiado', efeito: 'Não sente dor: nenhuma penalidade ou efeito negativo derivado da dor, física ou social.' },
    { nome: 'Comendo Suas Emoções', efeito: 'Come e digere alimentos sem ficar enjoado — ou saciar Fome, é claro.' },
    { nome: 'Dado por Vencido', efeito: 'Sua próxima alimentação de sangue fleumático sacia 1 nível adicional de Fome; outros tipos saciam um nível a menos.' },
    { nome: 'Indiferente', efeito: 'Adicione dois dados a paradas para resistir a frenesis.' },
    { nome: 'Lobo Solitário', efeito: 'Adicione um dado aos seus testes quando estiver sozinho; subtraia um dado de testes para ajudar outros ou usar trabalho em equipe. Só dura uma cena.' },
    { nome: 'Procrastinar', efeito: 'Recupera 1 ponto de Força de Vontade se você atrasar algo importante por um dia ou mais. Só pode ser usada uma vez por sessão.' },
    { nome: 'Reflexão', efeito: 'Ganha 1 ponto de experiência gratuito para a aquisição de Auspícios ou Dominação.', consome: true }
  ],
  sanguineo: [
    { nome: 'Amor Verdadeiro', efeito: 'Sacie 1 nível adicional de Fome ao se alimentar do amor verdadeiro da bolsa. Com Auspícios, pode ver através dos olhos dele Inflamando o Sangue.' },
    { nome: 'Arrebatamento Maníaco', efeito: 'Adiciona um dado a todos os testes até falhar em uma rolagem; depois disso, passa a subtrair dois dados de todos os testes.' },
    { nome: 'Buliçoso', efeito: 'Ganhe 1 ponto de experiência gratuito para adquirir Feitiçaria de Sangue ou Presença.', consome: true },
    { nome: 'Entusiasmo Constante', efeito: 'Tocando a pele do alvo, adicione três dados a um teste para convencê-lo a fazer algo. Trate como Dominação no que diz respeito a crenças centrais e segredos.' },
    { nome: 'Entusiasmo pela Vida', efeito: 'O bebedor pode usar Rubor de Vida sem realizar uma Checagem de Sangue.' },
    { nome: 'Jogo do Olfato', efeito: 'Adicione três dados a todas as rolagens para detectar outras bolsas Sanguíneas.' }
  ]
};

const Ressonancia = {
  /* A Ressonância só vale dado quando o temperamento manda (pág.
     228): efêmero não dá nada, intenso e agudo dão um. */
  temperamentoPor(id) { return TEMPERAMENTOS.find(t => t.id === id) || null; },
  por(id) { return RESSONANCIAS.find(r => r.id === id) || null; },
  humorPor(id) { return HUMORES.find(h => h.id === id) || null; },

  /* "Exceto para determinadas feras sussurradas nas profecias
     Gangrel, animais não fornecem Discrasias." (pág. 227) */
  discrasiasDe(idRessonancia) {
    const r = this.por(idRessonancia);
    if (!r || r.semDiscrasia) return [];
    return DISCRASIAS[idRessonancia] || [];
  },

  /* Texto para a ficha e para o criador — DERIVADO dos ids, para
     não voltar a existir uma segunda lista que envelhece sozinha. */
  disciplinasDe(idRessonancia) {
    const r = this.por(idRessonancia);
    if (!r) return '';
    return r.disciplinas
      .map(d => (typeof DISCIPLINAS !== 'undefined' && DISCIPLINAS[d]) ? DISCIPLINAS[d].nome : d)
      .join(', ');
  }
};

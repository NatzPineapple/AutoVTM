/* ============================================================
   VITAE — Independentes
   Linhagem, negócio e os contratos que substituem a seita.
   ============================================================ */

const LINHAGENS = {
  hecata:      ['Giovanni', 'Pisanob', 'Samedi', 'Dunsirn', 'Rossellini', 'Família local'],
  ministerio:  ['Ministério do Desejo', 'Ministério da Dor', 'Casa de motel', 'Igreja de bairro'],
  ravnos:      ['Sobrevivente sem linhagem'],
  tzimisce:    ['Voivode', 'Escultor de carne', 'Senhor de terra própria'],
  salubri:     ['Curador', 'Guerreiro'],
  banu_haqim:  ['Vizir', 'Guerreiro', 'Feiticeiro'],
  lasombra:    ['Casa antiga', 'Renegado da Camarilla'],
  caitiff:     ['Nenhuma — e é esse o ponto']
};

const NEGOCIOS = [
  { id: 'funeraria', nome: 'Funerária e velório', clientes: 'Corte, baronia e mortais',
    preco: 'Pagam em silêncio, não em dinheiro.' },
  { id: 'informacao', nome: 'Informação', clientes: 'Todos, inclusive quem se odeia',
    preco: 'O cliente de hoje é o alvo de amanhã.' },
  { id: 'ritual', nome: 'Serviço ritual', clientes: 'Corte e outros independentes',
    preco: 'Cobra caro e nunca explica o método.' },
  { id: 'passagem', nome: 'Passagem segura', clientes: 'Quem está fugindo',
    preco: 'Um dia alguém pede para você esconder quem não devia.' },
  { id: 'carne', nome: 'Acesso a mortais', clientes: 'Quem não sabe ou não pode caçar',
    preco: 'Você é responsável pelo que o cliente faz com eles.' },
  { id: 'guarda', nome: 'Proteção e escolta', clientes: 'Quem tem inimigo com nome',
    preco: 'O contrato acaba no dia em que você falha uma vez.' }
];

const CLIENTES_SUGERIDOS = [
  'O Príncipe, por intermediário',
  'Uma baronia da Zona Leste',
  'Um Bispo que ficou para trás',
  'A funerária que lava o dinheiro',
  'Um delegado que não sabe de nada',
  'Outro independente, em dívida'
];

const SERVICOS_SUGERIDOS = [
  'Sumir com um corpo antes do amanhecer',
  'Descobrir quem gravou o quê',
  'Escoltar alguém até a fronteira do domínio',
  'Localizar um egum específico',
  'Fornecer três bolsas por semana',
  'Guardar um objeto e não perguntar'
];

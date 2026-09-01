/* ============================================================
   VITAE — Antecedentes, Méritos e Defeitos
   7 pontos de Vantagens • 2 pontos de Defeitos na criação
   ============================================================ */

const ANTECEDENTES = [
  { id: 'aliados',     nome: 'Aliados',      max: 5, desc: 'Grupo de mortais que ajudam por lealdade, medo ou amor. Definem-se por Efetividade e Confiança.' },
  { id: 'contatos',    nome: 'Contatos',     max: 5, desc: 'Gente que devolve sua ligação de madrugada. Informação, não músculo.' },
  { id: 'fama',        nome: 'Fama',         max: 5, desc: 'Reconhecimento entre mortais. Portas abertas — e câmeras.' },
  { id: 'influencia',  nome: 'Influência',   max: 5, desc: 'Poder sobre estruturas mortais: polícia, imprensa, prefeitura, tráfico.' },
  { id: 'mascara',     nome: 'Máscara',      max: 2, desc: 'Identidade civil falsa e sustentável. Sem ela, o século XXI te devora.' },
  { id: 'recursos',    nome: 'Recursos',     max: 5, desc: 'Dinheiro, propriedade, renda passiva que sobrevive à sua morte social.' },
  { id: 'refugio',     nome: 'Refúgio',      max: 5, desc: 'Onde você dorme sem virar cinza. Tamanho, segurança e segredo.' },
  { id: 'rebanho',     nome: 'Rebanho',      max: 5, desc: 'Fonte de alimento confiável e recorrente. Pessoas, não abstrações.' },
  { id: 'retentores',  nome: 'Retentores',   max: 5, desc: 'Carniçais e servos vinculados. Leais porque bebem de você.' },
  { id: 'status',      nome: 'Status',       max: 5, desc: 'Posição reconhecida dentro da sua seita. Vale mais que dinheiro numa Elísio.' },
  { id: 'mentor',      nome: 'Mentor',       max: 5, desc: 'Um Membro mais velho que investe em você. E cobra.' }
];

const MERITOS = [
  { id: 'aparencia', nome: 'Aparência Impressionante', custos: [2, 4], desc: 'Beleza que trava conversas. 2: notável. 4: perigosa.' },
  { id: 'cheiro_sangue', nome: 'Cheiro de Sangue', custos: [1], desc: 'Você identifica a Ressonância de um mortal a distância.' },
  { id: 'sono_leve', nome: 'Sono Leve', custos: [1], desc: 'Você acorda durante o dia sem precisar de teste.' },
  { id: 'linguas', nome: 'Linguista', custos: [1, 2, 3, 4, 5], desc: 'Cada ponto: mais um idioma fluente.' },
  { id: 'calma_beast', nome: 'Besta Calma', custos: [2], desc: 'Dado extra para resistir a frenesi.' },
  { id: 'iron_gullet', nome: 'Estômago de Ferro', custos: [3], desc: 'Você digere sangue velho, coagulado ou de bolsa sem perder nada.' },
  { id: 'sangue_alto', nome: 'Vitae Poderosa', custos: [2, 4], desc: 'Seu sangue é notavelmente potente. Carniçais e vínculos se firmam mais rápido.' },
  { id: 'contato_carne', nome: 'Coração Ainda Bate', custos: [1], desc: 'Uma vez por noite você simula sinais vitais por uma cena.' },
  { id: 'zelador', nome: 'Zelador de Elísio', custos: [1, 2], desc: 'Você tem lugar reservado e voz nas Elísio locais.' },
  { id: 'territorio', nome: 'Domínio Reconhecido', custos: [1, 2, 3], desc: 'Um pedaço da cidade formalmente seu para caçar.' },
  { id: 'oficial', nome: 'Cargo na Corte', custos: [2, 3], desc: 'Xerife, Chicoteador, Guardião do Elísio, Harpia. Poder e alvo nas costas.' },
  { id: 'sangue_ancestral', nome: 'Memória do Sangue', custos: [2], desc: 'Fragmentos da vida do seu senhor emergem quando você dorme.' },
  { id: 'psiquico', nome: 'Ligação com os Mortos', custos: [2], desc: 'Você percebe fantasmas mesmo sem Oblívio.' },
  { id: 'devocao_terreiro', nome: 'Filho de Santo', custos: [1, 2], desc: 'Você foi iniciado numa casa de matriz africana. A comunidade te protege — e cobra respeito.', brasil: true },
  { id: 'malandro', nome: 'Malandragem', custos: [1, 2], desc: 'Você sempre acha uma saída, um contato, um jeitinho. Dado extra em Manha na sua cidade.', brasil: true }
];

const DEFEITOS = [
  { id: 'predador_obvio', nome: 'Predador Óbvio', custos: [2], desc: 'Algo em você grita "errado". Mortais evitam; caçar fica muito mais difícil.' },
  { id: 'melindroso', nome: 'Comedor Melindroso', custos: [1, 2], desc: 'Sangue fora do seu gosto exige Força de Vontade — ou volta pela boca.' },
  { id: 'inimigo', nome: 'Inimigo', custos: [1, 2, 3, 4, 5], desc: 'Alguém quer você destruído. Quanto mais pontos, mais recursos ele tem.' },
  { id: 'adversario', nome: 'Adversário', custos: [1, 2, 3], desc: 'Um rival dentro da própria seita, sabotando sua ascensão.' },
  { id: 'infamia', nome: 'Infâmia', custos: [1, 2], desc: 'Sua reputação chega antes de você — e é péssima.' },
  { id: 'violador_mascara', nome: 'Violador da Máscara', custos: [1, 2], desc: 'Você já vacilou publicamente. A corte lembra e vigia.' },
  { id: 'perseguido_mascara', nome: 'Perseguido pela Máscara', custos: [1, 2], desc: 'Alguém suspeita do que você é e não larga o osso.' },
  { id: 'vinculado', nome: 'Vinculado pelo Sangue', custos: [1, 2, 3], desc: 'Você ama outro Membro contra a própria vontade. Ele sabe.' },
  { id: 'refugio_infestado', nome: 'Refúgio Comprometido', custos: [1, 2], desc: 'Seu refúgio é conhecido, invadido, alagado ou dividido com quem você não escolheu.' },
  { id: 'sem_mascara', nome: 'Sem Identidade', custos: [1], desc: 'Nenhum documento seu resiste a uma consulta séria.' },
  { id: 'presa_excluida', nome: 'Presa Excluída', custos: [1], desc: 'Há um tipo de vítima que você se recusa a tocar. Nunca.' },
  { id: 'vicio_sangue', nome: 'Vício de Sangue', custos: [2], desc: 'Uma Ressonância específica te domina. Você a persegue mesmo quando é burrice.' },
  { id: 'estigma', nome: 'Estigma', custos: [1], desc: 'Você carrega uma marca visível de morte-viva: cheiro, pele, olhos, cicatriz que não fecha.' },
  { id: 'caca_boes', nome: 'Ficha no BOES', custos: [2, 3], desc: 'A Segunda Inquisição brasileira tem seu rosto num arquivo. Você não sabe quanto eles têm.', brasil: true },
  { id: 'divida_terreiro', nome: 'Dívida com o Santo', custos: [1, 2], desc: 'Você quebrou um preceito e há um egum atrás disso. A cobrança vem.', brasil: true }
];

/* Ressonâncias — o humor do sangue */
const RESSONANCIAS = [
  { id: 'colerico',   nome: 'Colérico',   humor: 'raiva, violência, paixão inflamada', disc: 'Celeridade, Potência', cor: '#b3202c' },
  { id: 'melancolico',nome: 'Melancólico',humor: 'tristeza, saudade, intelecto ferido', disc: 'Fortitude, Ofuscação', cor: '#3f4a6b' },
  { id: 'fleumatico', nome: 'Fleumático', humor: 'calma, apatia, controle gélido', disc: 'Auspícios, Dominação', cor: '#4a6b6b' },
  { id: 'sanguineo',  nome: 'Sanguíneo',  humor: 'desejo, alegria, entusiasmo carnal', disc: 'Presença, Feitiçaria do Sangue', cor: '#b8446b' },
  { id: 'vazio',      nome: 'Vazio',      humor: 'ausência, entorpecimento, nada', disc: 'Nenhuma', cor: '#5a5a5a' },
  { id: 'animal',     nome: 'Animal',     humor: 'sangue de bicho — instinto puro', disc: 'Animalismo, Metamorfose', cor: '#6b7a3f' }
];

/* Convicções sugeridas */
const CONVICCOES_SUGERIDAS = [
  'Nunca matar quem se alimenta de mim',
  'Proteger crianças acima de tudo',
  'Honrar minha palavra, custe o que custar',
  'Jamais trair quem dividiu meu sangue',
  'Não deixar corpo para trás',
  'Não usar Dominação em inocentes',
  'Sustentar a família que deixei viva',
  'Punir quem abusa dos indefesos',
  'A arte vale mais do que qualquer noite',
  'Ninguém acima de mim, ninguém abaixo',
  'Manter a Máscara, mesmo contra os meus',
  'Devolver todo favor recebido'
];

const AMBICOES_SUGERIDAS = [
  'Tomar o Domínio do meu bairro',
  'Descobrir quem me abraçou e por quê',
  'Reverter a maldição do meu sangue',
  'Reunir minha família mortal em segurança',
  'Chegar à Primogenitura',
  'Destruir meu senhor',
  'Fundar uma Baronia anarquista na cidade',
  'Achar Gratiano de Veronese antes que ele me ache',
  'Sobreviver mais um ano',
  'Recuperar o corpo que tomaram de mim'
];

const DESEJOS_SUGERIDOS = [
  'Beber de alguém que me deseje de verdade',
  'Humilhar publicamente um rival',
  'Passar uma noite inteira sem sentir Fome',
  'Ouvir meu nome mortal de novo',
  'Descobrir um segredo que valha ouro',
  'Ser convidado para o Elísio',
  'Ver o mar antes do amanhecer',
  'Não machucar ninguém esta noite'
];

/* Potência de Sangue vive agora em data-escudo.js, com a tabela completa 0-10 */

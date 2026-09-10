/* ============================================================
   VITAE — Antecedentes, Méritos e Defeitos
   7 pontos de Vantagens • 2 pontos de Defeitos na criação
   ============================================================ */

/* ANTECEDENTES — básico, pág. 153  (§91)

   São DOZE no livro, e o projeto tinha ONZE. Faltava a Ficha de
   Conhecimento, e dois estavam com o nome de outra edição:

     Retentores  →  LACAIOS
     Mentor      →  MAWLA

   O mais incômodo é que o `glossario-traducao.md` deste projeto já
   decidia os dois — "Retainer → Lacaio" na linha 326, "Loresheet →
   Ficha de Conhecimento" na linha 73 — desde antes. O dado não
   divergia do livro: divergia do próprio glossário do projeto, que
   ninguém tinha como conferir porque nada comparava os dois.

   `ANTECEDENTES_RENOMEADOS` segue a receita da §77 com os Predadores:
   ficha salva com o id velho não perde os pontos em silêncio. */
const ANTECEDENTES = [
  { id: 'aliados',     nome: 'Aliados',      max: 5, pagina: 153, desc: 'Associados mortais, geralmente parentes ou amigos. Definem-se por Efetividade e Confiança.' },
  { id: 'contatos',    nome: 'Contatos',     max: 5, pagina: 153, desc: 'As fontes de informação que você possui. Gente que devolve sua ligação de madrugada.' },
  { id: 'lacaios',     nome: 'Lacaios',      max: 5, pagina: 153, desc: 'Seguidores, seguranças e servos. Carniçais leais porque bebem de você.' },
  { id: 'fama',        nome: 'Fama',         max: 5, pagina: 153, desc: 'O quão conhecido você é entre os mortais. Portas abertas — e câmeras.' },
  { id: 'ficha_conhecimento', nome: 'Ficha de Conhecimento', max: 5, pagina: 153,
    loresheet: true,
    desc: 'Sua conexão com as histórias e figuras lendárias do mundo das trevas. É um Antecedente de forma incomum: cada Ficha traz os próprios efeitos, nível a nível.' },
  { id: 'influencia',  nome: 'Influência',   max: 5, pagina: 153, desc: 'Seu poder político na sociedade mortal: polícia, imprensa, prefeitura, tráfico.' },
  { id: 'mascara',     nome: 'Máscara',      max: 2, pagina: 153, desc: 'Uma identidade falsa completa, incluindo documentação. Sem ela, o século XXI te devora.' },
  { id: 'mawla',       nome: 'Mawla',        max: 5, pagina: 153, desc: 'Um Membro que o aconselha e apoia: um mentor, patrono ou partidário. E cobra.' },
  { id: 'rebanho',     nome: 'Rebanho',      max: 5, pagina: 153, desc: 'As bolsas às quais você tem acesso livre e seguro. Pessoas, não abstrações.' },
  { id: 'recursos',    nome: 'Recursos',     max: 5, pagina: 153, desc: 'Riqueza, pertences e renda que sobrevivem à sua morte social.' },
  { id: 'refugio',     nome: 'Refúgio',      max: 5, pagina: 153, desc: 'Um lugar para dormir com segurança durante o dia. Tamanho, segurança e segredo.' },
  { id: 'status',      nome: 'Status',       max: 5, pagina: 153, desc: 'Sua posição na sociedade dos não vivos. Vale mais que dinheiro numa Elísio.' }
];

const ANTECEDENTES_RENOMEADOS = { retentores: 'lacaios', mentor: 'mawla' };

/* "Nenhum sangue-ralo pode comprar Laço, Mawla, Lacaios ou Status
    durante a criação de personagem (uma coterie mista pode comprá-los
    como Antecedentes compartilhados)."          (básico, pág. 149)

   "Laço" ali é o Antecedente de Laço de Sangue, que este projeto não
   tem como Antecedente — o Laço vive em `motor-lacos.js` desde a §90.
   Os outros três existem, e a criação passou a barrá-los. */
const ANTECEDENTES_VEDADOS_A_SANGUE_RALO = ['mawla', 'lacaios', 'status'];

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

/* As Ressonâncias saíram daqui na §67 e moram em `data-ressonancia.js`,
   com os humores, os temperamentos e as 26 Discrasias do livro. A lista
   que estava aqui tinha envelhecido em dois nomes ("Metamorfose", que
   virou Proteanismo na §64, e "Feitiçaria do Sangue", que nunca foi o
   nome do livro) e trazia uma sexta Ressonância, "Vazio", que não
   aparece em nenhum dos dez livros de `Livros/Regras`. */

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

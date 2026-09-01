/* ============================================================
   VITÆ — Sementes de campanha
   Conteúdo inicial das docas (locais, pessoas, fatos, fios).
   Nada aqui é gerado por IA: é material de mesa pré-escrito.
   ============================================================ */

const MODOS_MESA = [
  { id: 'agir',      rotulo: 'Agir',     dica: 'Descreva o que seu personagem faz.',       prefixo: '' },
  { id: 'falar',     rotulo: 'Falar',    dica: 'O que seu personagem diz, em voz alta.',   prefixo: '— ' },
  { id: 'examinar',  rotulo: 'Examinar', dica: 'Olhar de perto, procurar, escutar.',       prefixo: '' },
  { id: 'perguntar', rotulo: 'Ao Narrador', dica: 'Pergunta fora da ficção, para o Narrador.', prefixo: '' }
];

/* Semente rica para o Rio de Janeiro. */
const SEMENTE_RIO = {
  cena: {
    local: 'boate_ipanema',
    hora: 'Quinta-feira, 23h40',
    presentes: ['bia'],
    descricao: 'A casa está cheia. Você deveria estar na pista, e não no camarim.'
  },
  locais: [
    { id: 'boate_ipanema', nome: 'Casa Vermelha', tipo: 'Domínio pessoal', zona: 'Ipanema',
      conhecido: true, perigo: 1, campoDeCaca: 4,
      descricao: 'Sua boate. Três andares, um camarim que ninguém entra sem bater, e uma fila '
               + 'que dobra a esquina nas quintas. É onde você caça sem sujar as mãos.' },
    { id: 'copacabana', nome: 'Praia de Copacabana', tipo: 'Território de caça', zona: 'Copacabana',
      conhecido: true, perigo: 2, campoDeCaca: 4,
      descricao: 'Turista de madrugada é presa fácil e ninguém dá falta até o check-out. '
               + 'Também é onde há mais câmeras por metro quadrado na cidade.' },
    { id: 'municipal', nome: 'Theatro Municipal', tipo: 'Elísio', zona: 'Centro',
      conhecido: true, perigo: 1, campoDeCaca: 4,
      descricao: 'Elísio da corte carioca. Violência é proibida entre as colunas; tudo o mais é '
               + 'permitido e ninguém finge o contrário.' },
    { id: 'sao_joao_batista', nome: 'Cemitério São João Batista', tipo: 'Território alheio', zona: 'Botafogo',
      conhecido: true, perigo: 3, campoDeCaca: 5,
      descricao: 'Domínio Hecata. Entram os que são convidados e os que pagam. As duas coisas custam caro.' },
    { id: 'rocinha', nome: 'Rocinha', tipo: 'Território alheio', zona: 'Zona Sul',
      conhecido: true, perigo: 3, campoDeCaca: 2,
      descricao: 'Os Toreador escolheram as favelas quando os Lasombra ficaram com as praias. '
               + 'Ninguém entende até visitar.' },
    { id: 'tijuca', nome: 'Floresta da Tijuca', tipo: 'Fora das luzes', zona: 'Alto da Boa Vista',
      conhecido: false, perigo: 5, campoDeCaca: 5,
      descricao: 'A regra que ninguém quebra duas vezes: não saia das luzes da cidade. '
               + 'Dizem que há coisas penduradas nas árvores, esperando.' }
  ],
  pessoas: [
    { id: 'bia', nome: 'Beatriz "Bia" Coutinho', tipo: 'Mortal · Pilar', relacao: 'aliado',
      conhecido: true, contato: true, canon: false,
      descricao: 'Sua ex-assistente, hoje produtora da casa. É o motivo de você ainda não matar '
               + 'quem se alimenta de você. Não sabe de nada — você acha.' },
    { id: 'duarte', nome: 'Duarte de Alvim', tipo: 'Lasombra · Senhor', relacao: 'complicado',
      conhecido: true, contato: true, canon: false,
      descricao: 'Quem te matou para te dar isto. Some por meses e reaparece cobrando juros '
               + 'de um empréstimo que você não lembra de ter pedido.' },
    { id: 'ines', nome: 'Inés Tristão', tipo: 'Tremere · Príncipe do Rio', relacao: 'autoridade',
      conhecido: true, contato: false, canon: true,
      descricao: 'Príncipe da cidade nas noites atuais. Governa uma cidade que foi declarada livre '
               + 'há dois séculos, o que é um trabalho estranho.' },
    { id: 'gratiano', nome: 'Gratiano de Veronese', tipo: 'Lasombra · Arcebispo', relacao: 'ameaca',
      conhecido: false, contato: false, canon: true,
      descricao: 'Matusalém de 4ª geração, destruidor do próprio Antediluviano, um dos fundadores '
               + 'do Sabá. Arcebispo do Rio desde 1808. Ninguém sabe por que se contenta com isso.' },
    { id: 'padre_anselmo', nome: 'Padre Anselmo', tipo: 'Mortal · Pilar', relacao: 'aliado',
      conhecido: true, contato: true, canon: false,
      descricao: 'Paróquia da Glória. Aceita suas visitas de madrugada e nunca pergunta por quê. '
               + 'Você devolve todo favor que recebe — é a sua outra Convicção.' }
  ],
  fatos: [
    { id: 'f_carnaval', titulo: 'A cidade opera sob o Carnaval',
      texto: 'O código local permite troca livre de serviços e bens vampíricos entre as seitas. '
           + 'Não significa paz: muitos usam a neutralidade para caçar rivais sem punição.' },
    { id: 'f_divisao', titulo: 'Lasombra nas praias, Toreador nas favelas',
      texto: 'A divisão de território vale desde 1808 e desafiá-la é assunto de corte, não de rua.' }
  ],
  fios: [
    { id: 'fio_boes', titulo: 'O BOES atacou Vitória em 2017. O alvo real era o Rio.', estado: 'aberto' }
  ],
  abertura:
    'O camarim cheira a cigarro caro. Lá fora, a casa está cheia — quinta-feira sempre está — e o '
    + 'baixo atravessa a parede como se fosse um segundo pulso, o que você não tem mais.\n\n'
    + 'Você deveria estar na pista. [[pessoa:bia]] bateu duas vezes na porta nos últimos vinte minutos '
    + 'e nas duas você mandou esperar.\n\n'
    + '**A Fome está em dois.** Dá para segurar. Dá sempre para segurar, até a noite em que não dá.'
};

/* Semente genérica, montada a partir dos dados da cidade escolhida. */
function sementeGenerica(cid) {
  const c = cid || CIDADES[0];
  return {
    cena: { local: 'refugio', hora: 'Início da noite', presentes: [],
            descricao: 'Você acorda. A cidade já está funcionando sem você há horas.' },
    locais: [
      { id: 'refugio', nome: 'Seu refúgio', tipo: 'Domínio pessoal', zona: c.nome,
        conhecido: true, perigo: 1,
        descricao: 'Onde você dorme sem virar cinza. Por enquanto.' },
      { id: 'cacada', nome: 'Seu território de caça', tipo: 'Território de caça', zona: c.nome,
        conhecido: true, perigo: 2, campoDeCaca: 3,
        descricao: 'O pedaço da cidade onde você come sem chamar atenção.' },
      { id: 'elisio', nome: 'Elísio local', tipo: 'Elísio', zona: c.nome,
        conhecido: true, perigo: 1,
        descricao: 'Onde a corte se encontra e a violência é proibida. Só a violência física.' }
    ],
    pessoas: [
      { id: 'principe', nome: c.principe, tipo: 'Autoridade da cidade', relacao: 'autoridade',
        conhecido: true, canon: true, contato: false, descricao: `Quem manda em ${c.nome}. ${c.poder}.` }
    ],
    fatos: [
      { id: 'f_cidade', titulo: `${c.nome} — ${c.tagline}`, texto: c.texto[0] }
    ],
    fios: c.ganchos.slice(0, 2).map((g, i) => ({ id: 'fio_' + i, titulo: g, estado: 'aberto' })),
    abertura: `Você acorda em ${c.nome}.\n\n${c.texto[0]}\n\n`
            + '**O que você faz primeiro?**'
  };
}

function sementeDaCidade(cidadeId) {
  if (cidadeId === 'rio') return JSON.parse(JSON.stringify(SEMENTE_RIO));
  const c = CIDADES.find(x => x.id === cidadeId);
  return JSON.parse(JSON.stringify(sementeGenerica(c)));
}

/* Personagem pré-gerada, para quem quiser entrar na mesa sem criar ficha. */
const FICHA_EXEMPLO = {
  nome: 'Inácia Vasques', conceito: 'Ex-modelo, dona da noite carioca',
  cronica: 'Carnaval de Cinzas', jogador: '', senhor: 'Duarte de Alvim',
  bairro: 'Ipanema e o Arpoador', geracao: '12',
  cidade: 'rio', seita: 'camarilla', cla: 'lasombra', modoHabilidade: 'especialista',
  atributos: { forca: 2, destreza: 3, vigor: 4, carisma: 3, manipulacao: 3, autocontrole: 2,
               inteligencia: 2, raciocinio: 2, determinacao: 1 },
  habilidades: { furtividade: 4, briga: 3, manha: 3, intimidacao: 3, politica: 2,
                 ocultismo: 2, atletismo: 2, labia: 1, investigacao: 1, conducao: 1 },
  especializacoes: { furtividade: 'Sombras', labia: 'Sedução', ocultismo: 'Abismo' },
  disciplinas: { oblivio: 2, potencia: 1, presenca: 1 },
  poderes: { oblivio: ['Visão de Oblívio', 'Projetar Sombra'], potencia: ['Poder Letal'],
             presenca: ['Admiração'] },
  rituais: ['Invocar o Espírito'],
  predador: 'sereia', predadorDisciplina: 'presenca', predadorEspec: 'labia|Sedução',
  antecedentes: { contatos: 2, refugio: 2, mascara: 1 }, meritos: { aparencia: 2 },
  defeitos: { infamia: 2 },
  conviccoes: ['Nunca matar quem se alimenta de mim', 'Devolver todo favor recebido', ''],
  marcos: ['Bia, sua ex-assistente', 'Padre Anselmo, da Glória', ''],
  ambicao: 'Tomar o Domínio da Zona Sul', desejo: 'Ser convidada para o Elísio',
  ressonancia: 'sanguineo', fome: 2, humanidadeMod: 0, danoSuperficial: 0, danoAgravado: 0,
  aparencia: 'Alta, magra, sempre de preto e salto. Beleza que incomoda.',
  historia: '', tracos: '', notas: '', principios: '',
  idadeVerdadeira: '', idadeAparente: '', dataNascimento: '', dataMorte: '',
  xpTotal: '', xpGasta: '', vistaFicha: 'oficial'
};

const RELACOES = {
  aliado:     { rotulo: 'Aliado',     cor: '#6b7a3f' },
  autoridade: { rotulo: 'Autoridade', cor: '#b58a3c' },
  complicado: { rotulo: 'Complicado', cor: '#8c5a2b' },
  suspeito:   { rotulo: 'Suspeito',   cor: '#6e5a8c' },
  ameaca:     { rotulo: 'Ameaça',     cor: '#b3202c' },
  neutro:     { rotulo: 'Neutro',     cor: '#5f5f5f' }
};

const CAMPANHAS = [
  {
    id: 'livre',
    nome: 'Noite livre',
    arquivo: null,
    cidade: null,
    capitulos: 0,
    ifAlvo: 'qualquer',
    resumo: 'Sem roteiro. A cidade da sua ficha, os locais e as pessoas da semente, '
          + 'e o Narrador improvisando a partir do que você fizer.',
    tom: 'Sandbox — bom para testar a ficha'
  }
];

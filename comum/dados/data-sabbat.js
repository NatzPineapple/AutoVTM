/* ============================================================
   VITAE — Sabá
   Cenário e nomes: SABBAT.pdf (oficial Paradox).
   Sistemas: Black Hand — Playing the Sabbat (Storytellers Vault,
   conteúdo de comunidade). Cada registro declara a origem.
   ============================================================ */

const CAMINHOS = [
  {
    id: 'caim', nome: 'Caminho de Caim', alcunha: 'Devoradores, Noddistas',
    origem: 'oficial + comunidade',
    resumo: 'A Besta é herança, não defeito. Estudam Nod e comem o que for preciso para chegar perto do Pai.',
    compulsao: { nome: 'Voraz',
      texto: 'Você precisa se alimentar agora, subjugando mortais ou vampiros mais fracos. Se não baixar a Fome em 1 até o fim da cena, penalidade de dois dados.' },
    vantagemMatilha: { nome: 'Lições de Nod',
      texto: 'Toda a matilha compra Feitiçaria de Sangue como Disciplina de clã. Uma vez por história o Sacerdote impõe um Ritual benéfico à matilha na Vaulderie.' },
    ritaePilares: ['monomacia', 'vaulderie', 'bando_de_guerra']
  },
  {
    id: 'cataros', nome: 'Caminho dos Cátaros', alcunha: 'Diabos, Albigenses',
    origem: 'oficial + comunidade',
    resumo: 'O mundo é obra de um deus menor. Resta gozar dele em público e sem pedir licença.',
    compulsao: { nome: 'Exibicionista',
      texto: 'Você expõe a natureza vampírica em grande estilo e exige atenção, submissão e medo dos mortais presentes pelo resto da cena.' },
    vantagemMatilha: { nome: 'Anjos do Desejo',
      texto: 'Toda a matilha compra Presença como Disciplina de clã. Com a Ressonância certa, dois dados a mais para resistir a poderes de Presença pelo resto da sessão.' },
    ritaePilares: ['ritos_de_criacao', 'banquete_de_sangue', 'vaulderie']
  },
  {
    id: 'morte_e_alma', nome: 'Caminho da Morte e da Alma', alcunha: 'Ceifadores',
    origem: 'oficial + comunidade',
    resumo: 'A morte é a única professora honesta. Estudam o que sobra depois dela.',
    compulsao: { nome: 'Necro-Curioso',
      texto: 'Você se obceca pelas propriedades espirituais de algo por perto. Se o alvo for mortal, pode matá-lo para estudar.' },
    vantagemMatilha: { nome: 'Comunhão dos Mortos',
      texto: 'Ligada a Oblívio e à conversa com quem já atravessou.' },
    ritaePilares: ['ritos_de_criacao', 'festival_dos_mortos', 'vaulderie']
  },
  {
    id: 'poder_e_voz', nome: 'Caminho do Poder e da Voz Interior', alcunha: 'Unificadores',
    origem: 'oficial + comunidade',
    resumo: 'Servir é uma fase. Comandar é o estado natural de quem sobreviveu.',
    compulsao: { nome: 'Supremacia',
      texto: 'Você cansou de servir. Penalidade de três dados em qualquer ação da cena que não seja tomar o que julga merecer ou exigir obediência.' },
    vantagemMatilha: { nome: 'Hierarquia de Ferro',
      texto: 'Domínio e comando reconhecidos dentro e fora da matilha.' },
    ritaePilares: ['monomacia', 'vinculo', 'banho_de_sangue']
  },
  {
    id: 'lilith', nome: 'Caminho de Lilith', alcunha: 'Bahari, Lilins',
    origem: 'oficial + comunidade',
    resumo: 'A dor é sacramento. Quem não sangra não muda.',
    compulsao: { nome: 'Buscador de Dor',
      texto: 'Você se obceca por algo perigoso por perto — fogueira, lupino, arma — e normalmente quer ser ferido por aquilo.' },
    vantagemMatilha: { nome: 'Jardim de Lilith',
      texto: 'Dor como transformação: a matilha converte sofrimento em vantagem ritual.' },
    ritaePilares: ['ritos_de_criacao', 'jogos_do_instinto', 'vaulderie']
  }
];

const RITAE = [
  { id: 'vaulderie', nome: 'Vaulderie', classe: 'auctoritas', origem: 'oficial + comunidade',
    podeSerPilar: true,
    efeito: 'Cria e fortalece o Vinculum. Quebra e zera todos os Laços de Sangue que não sejam Vinculum.' },
  { id: 'vinculo', nome: 'Vínculo', classe: 'auctoritas', origem: 'comunidade', podeSerPilar: true,
    efeito: 'O Vinculum de todos sobe a Força 6 pela noite. Celebrado por Bispo, permite trocar de tipo de matilha ou de foco de Arena.' },
  { id: 'banho_de_sangue', nome: 'Banho de Sangue', classe: 'auctoritas', origem: 'comunidade', podeSerPilar: true,
    efeito: 'Cria Vinculum de Força 3 entre celebrantes e o líder ungido. Cai para 1 após um mês, mas não se rompe.' },
  { id: 'banquete_de_sangue', nome: 'Banquete de Sangue', classe: 'auctoritas', origem: 'comunidade', podeSerPilar: true,
    efeito: 'Uma vez por história, zera a Fome ignorando Defeitos de alimentação e Perdições de clã. Custa mortais.' },
  { id: 'ritos_de_criacao', nome: 'Ritos de Criação', classe: 'auctoritas', origem: 'oficial + comunidade', podeSerPilar: true,
    efeito: 'Abre a janela de um mês para o recém-Abraçado adotar um Caminho.' },
  { id: 'festival_dos_mortos', nome: 'Festival dos Mortos', classe: 'auctoritas', origem: 'comunidade', podeSerPilar: true,
    efeito: 'Deixar-se possuir por um morto da Vaulderie cura todo o dano de Vontade e remove todas as Máculas.' },
  { id: 'danca_do_fogo', nome: 'Dança do Fogo', classe: 'auctoritas', origem: 'comunidade', podeSerPilar: true,
    efeito: 'Cura 1 de Vontade Agravada. Sem se queimar, os Defeitos de Status do Sabá caem 1 ponto pela sessão.' },
  { id: 'jogos_do_instinto', nome: 'Jogos do Instinto', classe: 'auctoritas', origem: 'comunidade', podeSerPilar: true,
    efeito: 'Cura 1 de Vontade Agravada. Cumprindo o objetivo sem quebrar tabus, reduz Status igual à Dança do Fogo.' },
  { id: 'monomacia', nome: 'Monomacia', classe: 'auctoritas', origem: 'oficial + comunidade', podeSerPilar: true,
    efeito: 'Duelo formal. O resultado não pode ser contestado socialmente pelo resto da sessão.' },
  { id: 'sermoes_de_caim', nome: 'Sermões de Caim', classe: 'auctoritas', origem: 'comunidade', podeSerPilar: true,
    efeito: 'Cura 1 de Vontade Superficial. Quem confessa ganha Suspeito até o fim da história e resiste ao frenesi de Fome automaticamente.' },
  { id: 'ballo_grande', nome: 'Ballo Grande', classe: 'auctoritas', origem: 'comunidade', podeSerPilar: true,
    efeito: 'Cura 1 de Vontade ou Vitalidade Agravada. Com três noites, a matilha não registra como morta-viva em escrutínio.' },
  { id: 'bando_de_guerra', nome: 'Bando de Guerra', classe: 'auctoritas', origem: 'comunidade', podeSerPilar: true,
    efeito: 'O diablerista ganha 6 pontos de experiência por sucesso. Num Caminho, sofre 1 de Vontade Agravada em vez da perda de Humanidade.' },
  { id: 'cacada_selvagem', nome: 'Caçada Selvagem', classe: 'auctoritas', origem: 'comunidade', podeSerPilar: true,
    efeito: 'Perseguindo o alvo, todos ganham dois dados em testes de Raciocínio e ficam irreconhecíveis para mortais comuns.' },
  { id: 'ignoblis', nome: 'Ignoblis Ritae da matilha', classe: 'ignoblis', origem: 'comunidade', podeSerPilar: false,
    efeito: 'Rito próprio da matilha. Troca a Ressonância da matilha pela do Sacerdote, ou cura 1 de Vontade Superficial em cada membro.' }
];

const TIPOS_MATILHA = [
  { id: 'carregadores',  nome: 'Carregadores',        exige: 'Perambulação 1',
    ritae: 'Movem carga, gente e ordens entre domínios. O rito abençoa a estrada.' },
  { id: 'carrapatos',    nome: 'Carrapatos de Cripta', exige: 'Refúgio comunal 2',
    ritae: 'Vivem no subsolo do território alheio. O rito esconde o que a matilha deixou.' },
  { id: 'hacktivistas',  nome: 'Hacktivistas',        exige: 'Alcance 1',
    ritae: 'Guerra fria digital. O rito apaga um rastro que já estava online.' },
  { id: 'faxineiros',    nome: 'Faxineiros',          exige: 'Alcance 1',
    ritae: 'Limpam cena de crime vampírico. O rito compra uma noite de silêncio.' },
  { id: 'celula_jyhad',  nome: 'Célula de Jyhad',     exige: 'Prestígio 1',
    ritae: 'Sabotagem contra domínios de outras seitas. O rito consagra um alvo.' },
  { id: 'menagerie',     nome: 'Menagerie',           exige: 'Perambulação 1',
    ritae: 'Criam e usam bichos. O rito liga a matilha ao que tem dentes.' },
  { id: 'paladinos',     nome: 'Paladinos',           exige: 'Prestígio 2',
    ritae: 'Guarda-costas de quem manda. O rito divide o dano com quem protege.' },
  { id: 'press_gang',    nome: 'Press Gang',          exige: 'Alcance 2',
    ritae: 'Recrutam à força. O rito valida um Abraço em massa.' },
  { id: 'saqueadores',   nome: 'Saqueadores',         exige: 'Perambulação 2',
    ritae: 'Tomam o que der. O rito reparte o espólio sem briga.' },
  { id: 'removedores',   nome: 'Removedores',         exige: 'Prestígio 1',
    ritae: 'Fazem sumir Cainita que virou problema. O rito absolve quem executa.' },
  { id: 'ritualistas',   nome: 'Ritualistas',         exige: 'Prestígio 1',
    ritae: 'Guardam os Auctoritas. O rito estende o benefício a um convidado.' },
  { id: 'errantes',      nome: 'Errantes',            exige: 'Perambulação 3',
    ritae: 'Nunca param. O rito transforma qualquer lugar em refúgio por uma noite.' }
];

const TRACOS_ARENA = [
  { id: 'perambulacao', nome: 'Perambulação',
    desc: 'Cada ponto soma 1 à dificuldade de detectar ou barrar a matilha em trânsito. Caçando dentro da área, a matilha sempre obtém sucesso com um custo.' },
  { id: 'alcance', nome: 'Alcance',
    desc: 'Cada ponto dá um dado a mais para subverter, minar ou intimidar um grupo mortal que ameace a Arena.' },
  { id: 'prestigio', nome: 'Prestígio',
    desc: 'Um ponto dá dificuldade 7 para convocar outras matilhas em auxílio; cada ponto adicional reduz em 1.' }
];

const PREDADORES_SABBAT = [
  {
    id: 'catador', nome: 'Catador', simbolo: '⚱', seita: 'sabbat', origem: 'comunidade',
    lema: 'O que a terra devolve ainda serve.',
    desc: 'Você desenterra. Cadáver recente, cova rasa, gaveta de necrotério — e come o que ninguém reclama.',
    teste: 'Vigor + Atletismo ou Ocultismo',
    piscinas: [['vigor', 'atletismo'], ['vigor', 'ocultismo']],
    especializacao: { opcoes: [['atletismo', 'Escavação'], ['ocultismo', 'Ritos Funerários']] },
    disciplina: ['oblivio', 'fortitude', 'potencia'],
    humanidade: -1,
    vantagens: [{ nome: 'Garganta de Ferro', pontos: 3, tipo: 'merito' }],
    defeitos: [{ nome: 'Só cadáver recém-exumado zera a Fome', pontos: 0, tipo: 'nota' }],
    caminhosComuns: ['cataros', 'morte_e_alma']
  },
  {
    id: 'reivindicador', nome: 'Reivindicador', simbolo: '🜏', seita: 'sabbat', origem: 'comunidade',
    lema: 'O sangue de Caim é uma escada. Você sobe.',
    desc: 'Diablerie como dieta. É a coisa mais proibida que existe e você faz isso por doutrina.',
    teste: 'Força + Briga ou Ocultismo',
    piscinas: [['forca', 'briga'], ['forca', 'ocultismo']],
    especializacao: { opcoes: [['briga', 'Vampiros'], ['ocultismo', 'Amaranto']] },
    disciplina: ['feiticaria', 'potencia', 'metamorfose'],
    humanidade: -2,
    potenciaSangue: 1,
    vantagens: [{ nome: 'Dois dados a mais em diablerie', pontos: 0, tipo: 'nota' }],
    defeitos: [{ nome: 'Só diablerie zera a Fome', pontos: 0, tipo: 'nota' }],
    nota: 'Ganha um ponto de Potência de Sangue acima do normal para a geração.',
    caminhosComuns: ['caim', 'morte_e_alma']
  },
  {
    id: 'hedonista', nome: 'Hedonista', simbolo: '🍷', seita: 'sabbat', origem: 'comunidade',
    lema: 'Se é para condenar, que seja bom.',
    desc: 'Você bebe de quem já está fora de si. Álcool, química, êxtase — o sangue vem temperado.',
    teste: 'Carisma + Atletismo ou Subterfúgio',
    piscinas: [['carisma', 'atletismo'], ['carisma', 'labia']],
    especializacao: { opcoes: [['labia', 'Festas'], ['manha', 'Drogas de Design']] },
    disciplina: ['presenca', 'auspicios', 'potencia'],
    humanidade: -1,
    vantagens: [{ nome: 'Rubor da Vida como se a Humanidade fosse 2 mais alta', pontos: 0, tipo: 'nota' }],
    defeitos: [{ nome: 'Só mortal intoxicado zera a Fome', pontos: 0, tipo: 'nota' }],
    caminhosComuns: ['cataros', 'lilith']
  },
  {
    id: 'domina', nome: 'Domina', simbolo: '⛓', seita: 'sabbat', origem: 'comunidade',
    lema: 'Eles pedem. Você concede.',
    desc: 'Você não força ninguém. Constrói obediência até que a oferta venha de graça.',
    teste: 'Autocontrole + Sagacidade ou Intimidação',
    piscinas: [['autocontrole', 'intuicao'], ['autocontrole', 'intimidacao']],
    especializacao: { opcoes: [['intimidacao', 'Obediência'], ['intuicao', 'Vulnerabilidades']] },
    disciplina: ['potencia', 'animalismo', 'dominacao'],
    humanidade: -1,
    vantagens: [{ nome: 'Recursos', pontos: 3, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Só mortal voluntário zera a Fome', pontos: 0, tipo: 'nota' }],
    caminhosComuns: ['lilith', 'poder_e_voz']
  },
  {
    id: 'masoquista', nome: 'Masoquista', simbolo: '🕯', seita: 'sabbat', origem: 'comunidade',
    lema: 'Doer é a prova de que ainda há alguém aqui dentro.',
    desc: 'Você se machuca junto. O sangue que interessa é o que vem com dor dos dois lados.',
    teste: 'Determinação + Sagacidade ou Subterfúgio',
    piscinas: [['determinacao', 'intuicao'], ['determinacao', 'labia']],
    especializacao: { opcoes: [['intuicao', 'Dor'], ['ocultismo', 'Flagelo']] },
    disciplina: ['fortitude', 'auspicios', 'feiticaria'],
    humanidade: -1,
    vantagens: [{ nome: 'Máscara', pontos: 2, tipo: 'antecedente' },
                { nome: 'Rebanho ou Retentor', pontos: 2, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Segredo Sombrio (Laços Mortais)', pontos: 2, tipo: 'defeito' }],
    caminhosComuns: ['cataros', 'lilith', 'morte_e_alma']
  },
  {
    id: 'estripador', nome: 'Estripador', simbolo: '🩻', seita: 'sabbat', origem: 'comunidade',
    lema: 'O coração primeiro. Sempre o coração.',
    desc: 'Você abre a presa e come a parte que importa. Não sobra corpo apresentável.',
    teste: 'Raciocínio + Empatia com Animais ou Sobrevivência',
    piscinas: [['raciocinio', 'empatia_animais'], ['raciocinio', 'sobrevivencia']],
    especializacao: { opcoes: [['sobrevivencia', 'Rastreio'], ['medicina', 'Anatomia']] },
    disciplina: ['metamorfose', 'animalismo', 'ofuscacao'],
    humanidade: -2,
    potenciaSangue: 1,
    vantagens: [{ nome: 'Sacia um ponto a mais caçando sozinho', pontos: 0, tipo: 'nota' }],
    defeitos: [{ nome: 'Só devorar o coração da vítima zera a Fome', pontos: 0, tipo: 'nota' }],
    caminhosComuns: ['caim', 'poder_e_voz']
  },
  {
    id: 'executor', nome: 'Executor', simbolo: '⚒', seita: 'sabbat', origem: 'comunidade',
    lema: 'Você só come quem já matou alguém.',
    desc: 'Escolhe assassinos. É o mais próximo de ética que o Sabá tolera sem rir.',
    teste: 'Raciocínio + Intimidação ou Manha',
    piscinas: [['raciocinio', 'intimidacao'], ['raciocinio', 'manha']],
    especializacao: { opcoes: [['manha', 'Homicídio'], ['intimidacao', 'Interrogatório']] },
    disciplina: ['potencia', 'auspicios', 'ofuscacao'],
    humanidade: -1,
    vantagens: [{ nome: 'Contatos policiais ou criminais', pontos: 3, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Só um assassino zera a Fome', pontos: 0, tipo: 'nota' }],
    caminhosComuns: ['cataros', 'poder_e_voz']
  },
  {
    id: 'absolvedor', nome: 'Absolvedor', simbolo: '✞', seita: 'sabbat', origem: 'comunidade',
    lema: 'Confesse. Depois eu decido.',
    desc: 'Você ouve o pecado antes de beber. A vítima entrega o pescoço achando que foi perdoada.',
    teste: 'Raciocínio + Erudição ou Persuasão',
    piscinas: [['raciocinio', 'academicos'], ['raciocinio', 'persuasao']],
    especializacao: { opcoes: [['academicos', 'Teologia'], ['persuasao', 'Confissão']] },
    disciplina: ['dominacao', 'presenca', 'auspicios'],
    humanidade: -1,
    vantagens: [{ nome: 'Rebanho', pontos: 2, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Só quem confessa zera a Fome', pontos: 0, tipo: 'nota' }],
    caminhosComuns: ['cataros', 'lilith']
  }
];

PREDADORES_SABBAT.forEach(p => PREDADORES.push(p));

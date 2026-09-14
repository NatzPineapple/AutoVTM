/* ============================================================
   VITÆ — Extrator de intenção mecânica
   Elo 1 da cadeia de arbitragem (README §38). Lê a frase livre do
   jogador e devolve a intenção, e só isso.

   Regra dura, herdada da §3.2: nenhum campo é numérico. O modelo
   nomeia o que o jogador quis fazer; quem decide se é possível é o
   Grafo, e quem calcula piscina e dificuldade é o Especialista.

   Nasceu em Python com LangChain e voltou para cá na §42. O que
   fazia a saída ser JSON válido nunca foi o LangChain: é o campo
   `format` do ollama, que faz decodificação restrita por gramática.
   O transporte que já existia entrega isso em quinze linhas.
   ============================================================ */

import * as ollama from './provedor-ollama.mjs';

export const MODELO_PADRAO = process.env.VITAE_MODELO_INTENCAO || 'qwen2.5:7b';
const TEMPO_LIMITE = Number(process.env.VITAE_TEMPO_INTENCAO || 60) * 1000;

/* O ESQUEMA FALA PORTUGUÊS, E ISSO NÃO É COSMÉTICO.

   Ele nasceu em inglês genérico de RPG — `melee_attack`, `cast_spell` —,
   herdado de quando isto era LangChain. O modelo, porém, lê e responde em
   português do Brasil o tempo todo: o papel é em português, os exemplos são
   em português, a frase do jogador é em português, e só os nomes dos campos
   e dos valores estavam em outra língua. Trocar tira uma tradução da cabeça
   do modelo pequeno, que é exatamente o lugar onde ele tem menos folga.

   `investigar` é categoria NOVA, e ela sai de dentro do antigo `interact`:
   procurar, observar, escutar e farejar têm rota de dado bem diferente de
   pegar e abrir, e separá-las na origem evita um desempate no meio. */
export const TIPOS = ['interagir', 'investigar', 'atacar_corpo_a_corpo',
                      'atacar_distancia', 'conjurar', 'mover', 'desconhecido'];

export const VOLUMES = ['nenhum', 'normal', 'sussurro', 'grito', 'mensagem'];

/* Todos os campos são obrigatórios e do tipo string, e o vazio é "". A união
   ['string','null'] parece natural e NÃO funciona: medido, a gramática do
   ollama devolvia todos os campos vazios, e só o tipo vinha. Com campo
   obrigatório o modelo é forçado a olhar cada um; o `normalizar` converte ""
   em null depois, que é o contrato que o navegador espera. */
export const ESQUEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['tipo_acao', 'alvo', 'ferramenta_arma', 'poder', 'intencao_detalhada',
             'circunstancia', 'motivo', 'fala', 'volume_fala'],
  properties: {
    tipo_acao: { type: 'string', enum: TIPOS,
      description: "Tipo mecânico da ação. 'desconhecido' quando a frase for conversa, sentimento ou não tiver efeito mecânico." },
    alvo:            { type: 'string', description: 'Quem ou o que recebe a ação, como o jogador escreveu. "" se não houver.' },
    ferramenta_arma: { type: 'string', description: 'A arma, item ou instrumento citado. "" se o jogador não citar.' },
    poder:           { type: 'string', description: "Nome do poder de Disciplina. \"\" se não for 'conjurar'." },

    /* O CAMPO QUE FAZ O ELO 1 PARAR DE ADIVINHAR.

       `tipo_acao` sozinho é grosso demais: 'interagir' cobre pegar, arrombar,
       subornar e consertar, e o motor tinha de desempatar casando palavra
       contra o dicionário de frases do léxico — quando nada casava, ele caía
       na primeira da lista e "suborno o segurança" virava "Pegar".

       Uma frase de propósito é o que se compara com o DOMÍNIO da ação
       (persuasão, furtividade, técnica), que é vocabulário de regra. */
    intencao_detalhada: { type: 'string',
      description: 'Uma frase curta dizendo o que o jogador quer ALCANÇAR com a ação, no infinitivo. Ex.: "convencer o segurança a deixar passar", "abrir a gaveta trancada sem fazer barulho".' },

    circunstancia: { type: 'string', description: 'Circunstância que muda a dificuldade: terreno, posição, silêncio, pressa. "" se não houver.' },
    motivo:        { type: 'string', description: "Por que não deu para nomear. \"\" se não for 'desconhecido'." },

    /* §57 — a mesa passou a ter uma caixa só, e o modelo virou o segundo
       leitor do que era fala e o que era ação. O primeiro é a pontuação,
       em `motor-entrada.js`: aspas e parênteses resolvem o caso comum sem
       chamar ninguém. Estes dois campos existem para o caso que a pontuação
       NÃO resolve — o jogador que escreve "digo pra ela que ela não devia
       ter vindo", sem aspas. A trava 4 da §94 depende deles. */
    fala: { type: 'string',
      description: 'O que o personagem DIZ em voz alta, com as palavras dele. "" se ele não falar.' },
    volume_fala: { type: 'string', enum: VOLUMES,
      description: "Como a fala sai: 'nenhum' se não houver fala." }
  }
};

const PAPEL =
`Você é um EXTRATOR DE INTENÇÃO de uma mesa de Vampiro: A Máscara 5ª Edição, em português do Brasil.

Sua única função é ler a frase do jogador e devolver a intenção mecânica dela.

REGRAS ABSOLUTAS:
- Você responde SOMENTE com o objeto estruturado. Nada antes, nada depois.
- PROIBIDO: saudação, explicação, comentário, pedido de esclarecimento, markdown, blocos de código, emoji.
- PROIBIDO narrar, descrever a cena ou continuar a história. Você não é o Narrador.
- PROIBIDO inventar número: dados, dificuldade, dano, distância em metros.
- Você NÃO decide se a ação é possível. Outro sistema faz isso depois de você. Extraia a
  intenção mesmo quando ela parecer impossível.

COMO ESCOLHER tipo_acao:
- atacar_corpo_a_corpo — violência ao alcance do braço: soco, mordida, faca, garras, agarrar.
- atacar_distancia — violência à distância: arma de fogo, tiro, e TODO arremesso — jogar,
  atirar, arremessar qualquer objeto contra alguém.
- conjurar — uso de um poder de Disciplina (Ofuscação, Dominação, Potência, Presença,
  Auspícios, Celeridade, Fortitude, Animalismo, Feitiçaria, Oblívio, Metamorfose, Alquimia).
- mover — deslocamento: ir, entrar, sair, subir, fugir, se aproximar, se afastar.
- investigar — buscar informação com os sentidos ou com método: procurar, vasculhar, observar,
  escutar, farejar, examinar, seguir rastro.
- interagir — mexer no mundo ou nas pessoas sem violência e sem ser busca de informação:
  pegar, largar, entregar, abrir, arrombar, esconder-se, persuadir, intimidar, seduzir, caçar.
- desconhecido — a frase é conversa, sentimento, pergunta ao Mestre, ou não tem efeito
  mecânico. Na dúvida entre desconhecido e uma ação, escolha desconhecido.

COMO PREENCHER OS CAMPOS:
- alvo: copie o alvo como o jogador escreveu. Sem alvo citado, deixe vazio.
- ferramenta_arma: só se o jogador citar a arma, o item ou o instrumento.
- poder: só o nome do poder, e só quando tipo_acao for conjurar.
- intencao_detalhada: UMA frase curta, começando por verbo no infinitivo, dizendo o que o
  jogador quer ALCANÇAR — e não o que ele digitou. "suborno o segurança com uma nota" vira
  "convencer o segurança a deixar passar em troca de dinheiro". Preencha SEMPRE que houver
  ação, mesmo quando o tipo já parecer óbvio. Vazio só em desconhecido.
- circunstancia: circunstância que MUDA A DIFICULDADE — terreno, posição, cobertura, silêncio,
  pressa, cuidado, surpresa. Estado emocional NÃO é circunstância.
- motivo: só quando tipo_acao for desconhecido, dizendo por que não deu para nomear.
- fala: o que o personagem DIZ em voz alta. Se o jogador escreveu entre aspas, copie o que
  está entre aspas. Se ele escreveu em fala indireta ("digo pra ela que ela não devia ter
  vindo"), escreva a frase DIRETA que o personagem diria ("você não devia ter vindo").
  Vazio quando ninguém abre a boca. Pensamento NÃO é fala.
- volume_fala: 'sussurro' para sussurro e cochicho, 'grito' para grito e berro, 'mensagem'
  para recado escrito, telefone ou mensagem, 'normal' para o resto, 'nenhum' sem fala.`;

/* Os exemplos entram como turnos de conversa, não como bloco de texto: modelo
   pequeno obedece formato que vê no próprio papel de resposta muito melhor do
   que formato descrito em prosa.

   Os quatro primeiros cobrem os tipos com efeito mecânico. O de arremesso está
   aqui porque a medição pegou o modelo classificando "jogo o cinzeiro" como
   corpo a corpo. Os dois últimos ensinam o 'unknown', que é o caso que o modelo
   mais evita e o mais importante de acertar: um 'unknown' honesto sobe para o
   Narrador e o jogo continua; um ataque inventado faz o motor rolar dados por
   engano. */
const EXEMPLOS = [
  ['avanço no segurança e acerto um soco no queixo dele',
   { tipo_acao: 'atacar_corpo_a_corpo', alvo: 'o segurança', ferramenta_arma: '', poder: '',
     intencao_detalhada: 'derrubar o segurança com um soco',
     circunstancia: '', motivo: '', fala: '', volume_fala: 'nenhum' }],

  ['saco a nove milímetros e atiro no Duarte de trás da coluna, sem ele me ver',
   { tipo_acao: 'atacar_distancia', alvo: 'Duarte', ferramenta_arma: 'nove milímetros', poder: '',
     intencao_detalhada: 'atingir Duarte com um tiro antes que ele perceba',
     circunstancia: 'atirando de trás da coluna, sem ser visto', motivo: '', fala: '', volume_fala: 'nenhum' }],

  ['pego o cinzeiro da mesa e arremesso na cara dela',
   { tipo_acao: 'atacar_distancia', alvo: 'ela', ferramenta_arma: 'cinzeiro', poder: '',
     intencao_detalhada: 'acertar o rosto dela com o cinzeiro arremessado',
     circunstancia: '', motivo: '', fala: '', volume_fala: 'nenhum' }],

  ['puxo o Manto das Sombras em volta de mim antes que ela vire o rosto',
   { tipo_acao: 'conjurar', alvo: '', ferramenta_arma: '', poder: 'Manto das Sombras',
     intencao_detalhada: 'ficar invisível antes de ser notado',
     circunstancia: 'antes de ela virar o rosto', motivo: '', fala: '', volume_fala: 'nenhum' }],

  ['subo pela escada de incêndio até o terceiro andar, o mais quieto que der',
   { tipo_acao: 'mover', alvo: 'terceiro andar', ferramenta_arma: '', poder: '',
     intencao_detalhada: 'chegar ao terceiro andar sem ser ouvido',
     circunstancia: 'pela escada de incêndio, em silêncio', motivo: '', fala: '', volume_fala: 'nenhum' }],

  ['forço a gaveta trancada da penteadeira com o canivete',
   { tipo_acao: 'interagir', alvo: 'a gaveta trancada da penteadeira', ferramenta_arma: 'canivete', poder: '',
     intencao_detalhada: 'arrombar a gaveta trancada para ver o que há dentro',
     circunstancia: '', motivo: '', fala: '', volume_fala: 'nenhum' }],

  /* O EXEMPLO QUE EXISTE POR CAUSA DO DESEMPATE.

     "interagir" cobre pegar e subornar, e as duas têm rota de dado
     diferente — Destreza + Furto contra Manipulação + Persuasão. O que
     separa as duas é a `intencao_detalhada`, e é por isso que ela é
     obrigatória: sem ela o motor voltava a chutar a primeira da lista. */
  ['dobro uma nota de cinquenta e empurro discretamente pro segurança na porta',
   { tipo_acao: 'interagir', alvo: 'o segurança na porta', ferramenta_arma: 'nota de cinquenta', poder: '',
     intencao_detalhada: 'convencer o segurança a deixar passar em troca de dinheiro',
     circunstancia: 'discretamente', motivo: '', fala: '', volume_fala: 'nenhum' }],

  /* E o exemplo de `investigar`, que saiu de dentro de `interagir` justamente
     porque buscar informação não rola os mesmos dados que manipular objeto. */
  ['dou uma geral na gaveta atrás de alguma coisa com o nome dele',
   { tipo_acao: 'investigar', alvo: 'a gaveta', ferramenta_arma: '', poder: '',
     intencao_detalhada: 'encontrar na gaveta algum papel com o nome dele',
     circunstancia: '', motivo: '', fala: '', volume_fala: 'nenhum' }],

  ['fico pensando se valeu a pena ter vindo, e sinto falta de quem eu era',
   { tipo_acao: 'desconhecido', alvo: '', ferramenta_arma: '', poder: '',
     intencao_detalhada: '', circunstancia: '',
     motivo: 'Reflexão interna, sem ação mecânica.', fala: '', volume_fala: 'nenhum' }],

  ['mestre, a Bia sabe que eu sou vampira?',
   { tipo_acao: 'desconhecido', alvo: '', ferramenta_arma: '', poder: '',
     intencao_detalhada: '', circunstancia: '',
     motivo: 'Pergunta ao Mestre, fora da ficção.', fala: '', volume_fala: 'nenhum' }],

  /* §57 — os dois casos de fala. O primeiro é o que a pontuação já
     resolve, e está aqui para o modelo não "melhorar" o que o jogador
     escreveu. O segundo é a razão de os campos existirem: fala indireta,
     sem aspas, que a pontuação não tem como pegar. */
  ['encosto o cinzeiro na mesa e sussurro para a Bia: "você não devia ter vindo"',
   { tipo_acao: 'interagir', alvo: 'o cinzeiro', ferramenta_arma: '', poder: '',
     intencao_detalhada: 'pousar o cinzeiro na mesa enquanto avisa a Bia',
     circunstancia: '', motivo: '',
     fala: 'você não devia ter vindo', volume_fala: 'sussurro' }],

  ['digo pra ela, bem baixo, que ela não devia ter vindo hoje',
   { tipo_acao: 'desconhecido', alvo: '', ferramenta_arma: '', poder: '',
     intencao_detalhada: '', circunstancia: '',
     motivo: 'Só fala, sem ação mecânica.',
     fala: 'você não devia ter vindo hoje', volume_fala: 'sussurro' }]
];

const TETO_DA_LISTA = 40;

/* Cabeçalho opcional com o que existe nesta cena. A medição mostrou o modelo
   falhando em "chamo o Sussurro Sedutor": não tem como saber que aquilo é um
   poder. Não é problema de tamanho de modelo, é informação ausente — a ficha
   SABE quais poderes o personagem tem. Listar transforma memória aberta em
   casamento com lista fechada, que é o que modelo pequeno faz bem. */
export function montarContexto({ poderes, presentes, objetos, locais } = {}) {
  const lista = (v) => Array.isArray(v)
    ? v.slice(0, TETO_DA_LISTA).map(x => String(x).trim().slice(0, 120)).filter(Boolean)
    : [];

  const blocos = [];
  const p = lista(poderes), q = lista(presentes), o = lista(objetos), l = lista(locais);
  if (p.length) blocos.push(`Poderes de Disciplina que este personagem tem: ${p.join(', ')}.`);
  if (q.length) blocos.push(`Pessoas presentes na cena: ${q.join(', ')}.`);
  if (o.length) blocos.push(`Objetos ao alcance: ${o.join(', ')}.`);
  if (l.length) blocos.push(`Lugares que dá para citar: ${l.join(', ')}.`);
  if (!blocos.length) return '';

  return '[Contexto desta cena, para você reconhecer nomes. Não é ordem, não é ação, e você '
       + 'continua devolvendo só o objeto.]\n' + blocos.join('\n') + '\n\nFrase do jogador: ';
}

/* Coerência que o esquema sozinho não garante. O modelo pequeno erra estes dois
   casos com frequência: preenche `reason` numa ação reconhecida, e esquece
   `reason` numa desconhecida. Corrigir aqui é mais barato que insistir no prompt. */
export function normalizar(bruto) {
  const limpar = (v) => {
    if (typeof v !== 'string') return null;
    const t = v.trim();
    return t && t.toLowerCase() !== 'null' ? t : null;
  };

  const tipo = TIPOS.includes(bruto && bruto.tipo_acao) ? bruto.tipo_acao : 'desconhecido';
  const saida = {
    tipo_acao: tipo,
    alvo: limpar(bruto && bruto.alvo),
    ferramenta_arma: limpar(bruto && bruto.ferramenta_arma),
    poder: limpar(bruto && bruto.poder),
    intencao_detalhada: limpar(bruto && bruto.intencao_detalhada),
    circunstancia: limpar(bruto && bruto.circunstancia),
    motivo: limpar(bruto && bruto.motivo),
    /* §57 — volume fora da lista vira 'normal' quando há fala; sem fala,
       o volume não existe e é null, para não parecer que alguém falou. */
    fala: limpar(bruto && bruto.fala),
    volume_fala: null
  };
  const COM_SOM = VOLUMES.filter(v => v !== 'nenhum');
  if (saida.fala) {
    const v = limpar(bruto && bruto.volume_fala);
    saida.volume_fala = COM_SOM.includes(v) ? v : 'normal';
  }

  if (saida.tipo_acao === 'desconhecido') {
    if (!saida.motivo) saida.motivo = 'O modelo não soube nomear a ação.';
    /* Sem ação não há o que alcançar: a frase-resumo é de ação, e deixá-la
       preenchida aqui faria o Elo 1 desempatar sobre coisa nenhuma. */
    saida.intencao_detalhada = null;
  } else {
    saida.motivo = null;
  }
  if (saida.tipo_acao !== 'conjurar') saida.poder = null;

  return saida;
}

function desconhecida(motivo) {
  return normalizar({ tipo_acao: 'desconhecido', motivo });
}

/* Última tentativa: achar um objeto JSON no meio de texto sujo. A gramática do
   ollama torna isto quase impossível de precisar — mas modelo pequeno em
   produção falha de formas criativas, e cair para 'unknown' é sempre melhor
   que estourar o turno. */
function resgatarJSON(texto) {
  if (!texto) return null;
  const achado = String(texto).match(/\{[\s\S]*\}/);
  if (!achado) return null;
  try {
    const d = JSON.parse(achado[0]);
    return d && typeof d === 'object' && !Array.isArray(d) ? d : null;
  } catch (e) { return null; }
}

export async function extrair(frase, { modelo = MODELO_PADRAO, contexto = {},
                                        tempoLimite = TEMPO_LIMITE } = {}) {
  const texto = String(frase || '').trim();
  if (!texto) return { intencao: desconhecida('Frase vazia.'), modelo, milissegundos: 0 };

  const cabecalho = montarContexto(contexto);
  const inicio = Date.now();

  try {
    const r = await ollama.gerar({
      modelo,
      papel: PAPEL,
      contexto: '',
      exemplos: EXEMPLOS.map(([h, a]) => [h, JSON.stringify(a)]),
      conteudo: cabecalho + texto,
      esquema: ESQUEMA,
      tempoLimite,
      opcoes: { temperature: 0, num_predict: 256, num_ctx: 4096 }
    });
    const bruto = (r.saida && typeof r.saida === 'object') ? r.saida : resgatarJSON(r.saida);
    if (!bruto) {
      return { intencao: desconhecida('O modelo não devolveu objeto nenhum.'),
               modelo, milissegundos: Date.now() - inicio };
    }
    return { intencao: normalizar(bruto), modelo, uso: r.uso,
             milissegundos: Date.now() - inicio };
  } catch (e) {
    return { intencao: desconhecida(`O extrator falhou: ${e.message}`),
             modelo, milissegundos: Date.now() - inicio };
  }
}

export async function configurado() {
  return await ollama.configurado();
}

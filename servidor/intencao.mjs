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

export const TIPOS = ['melee_attack', 'ranged_attack', 'cast_spell', 'move', 'interact', 'unknown'];

/* Todos os campos são obrigatórios e do tipo string, e o vazio é "". A união
   ['string','null'] parece natural e NÃO funciona: medido, a gramática do
   ollama devolvia todos os campos vazios, e só o action_type vinha. Com campo
   obrigatório o modelo é forçado a olhar cada um; o `normalizar` converte ""
   em null depois, que é o contrato que o navegador espera. */
export const ESQUEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['action_type', 'target', 'weapon', 'spell_name', 'modifier', 'reason'],
  properties: {
    action_type: { type: 'string', enum: TIPOS,
      description: "Tipo mecânico da ação. 'unknown' quando a frase for conversa, sentimento ou não tiver efeito mecânico." },
    target:     { type: 'string', description: 'Quem ou o que recebe a ação, como o jogador escreveu. "" se não houver.' },
    weapon:     { type: 'string', description: 'A arma ou instrumento citado. "" se o jogador não citar.' },
    spell_name: { type: 'string', description: "Nome do poder de Disciplina. \"\" se não for 'cast_spell'." },
    modifier:   { type: 'string', description: 'Circunstância que muda a dificuldade: terreno, posição, silêncio, pressa. "" se não houver.' },
    reason:     { type: 'string', description: "Por que não deu para nomear. \"\" se não for 'unknown'." }
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

COMO ESCOLHER action_type:
- melee_attack — violência ao alcance do braço: soco, mordida, faca, garras, agarrar.
- ranged_attack — violência à distância: arma de fogo, tiro, e TODO arremesso — jogar,
  atirar, arremessar qualquer objeto contra alguém.
- cast_spell — uso de um poder de Disciplina (Ofuscação, Dominação, Potência, Presença,
  Auspícios, Celeridade, Fortitude, Animalismo, Feitiçaria, Oblívio, Metamorfose, Alquimia).
- move — deslocamento: ir, entrar, sair, subir, fugir, se aproximar, se afastar.
- interact — mexer no mundo ou nas pessoas sem violência: pegar, abrir, arrombar,
  esconder-se, procurar, persuadir, intimidar, seduzir, caçar, observar.
- unknown — a frase é conversa, sentimento, pergunta ao Mestre, ou não tem efeito mecânico.
  Na dúvida entre unknown e uma ação, escolha unknown.

COMO PREENCHER OS CAMPOS:
- target: copie o alvo como o jogador escreveu. Sem alvo citado, deixe vazio.
- weapon: só se o jogador citar a arma ou o instrumento.
- spell_name: só o nome do poder, e só quando action_type for cast_spell.
- modifier: circunstância que MUDA A DIFICULDADE — terreno, posição, cobertura, silêncio,
  pressa, cuidado, surpresa. Estado emocional NÃO é modificador.
- reason: só quando action_type for unknown, dizendo por que não deu para nomear.`;

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
   { action_type: 'melee_attack', target: 'o segurança', weapon: '',
     spell_name: '', modifier: '', reason: '' }],

  ['saco a nove milímetros e atiro no Duarte de trás da coluna, sem ele me ver',
   { action_type: 'ranged_attack', target: 'Duarte', weapon: 'nove milímetros',
     spell_name: '', modifier: 'atirando de trás da coluna, sem ser visto', reason: '' }],

  ['pego o cinzeiro da mesa e arremesso na cara dela',
   { action_type: 'ranged_attack', target: 'ela', weapon: 'cinzeiro',
     spell_name: '', modifier: '', reason: '' }],

  ['puxo o Manto das Sombras em volta de mim antes que ela vire o rosto',
   { action_type: 'cast_spell', target: '', weapon: '',
     spell_name: 'Manto das Sombras', modifier: 'antes de ela virar o rosto', reason: '' }],

  ['subo pela escada de incêndio até o terceiro andar, o mais quieto que der',
   { action_type: 'move', target: 'terceiro andar', weapon: '',
     spell_name: '', modifier: 'pela escada de incêndio, em silêncio', reason: '' }],

  ['forço a gaveta trancada da penteadeira com o canivete',
   { action_type: 'interact', target: 'a gaveta trancada da penteadeira', weapon: 'canivete',
     spell_name: '', modifier: '', reason: '' }],

  ['fico pensando se valeu a pena ter vindo, e sinto falta de quem eu era',
   { action_type: 'unknown', target: '', weapon: '', spell_name: '',
     modifier: '', reason: 'Reflexão interna, sem ação mecânica.' }],

  ['mestre, a Bia sabe que eu sou vampira?',
   { action_type: 'unknown', target: '', weapon: '', spell_name: '',
     modifier: '', reason: 'Pergunta ao Mestre, fora da ficção.' }]
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

  const tipo = TIPOS.includes(bruto && bruto.action_type) ? bruto.action_type : 'unknown';
  const saida = {
    action_type: tipo,
    target: limpar(bruto && bruto.target),
    weapon: limpar(bruto && bruto.weapon),
    spell_name: limpar(bruto && bruto.spell_name),
    modifier: limpar(bruto && bruto.modifier),
    reason: limpar(bruto && bruto.reason)
  };

  if (saida.action_type === 'unknown') {
    if (!saida.reason) saida.reason = 'O modelo não soube nomear a ação.';
  } else {
    saida.reason = null;
  }
  if (saida.action_type !== 'cast_spell') saida.spell_name = null;

  return saida;
}

function desconhecida(motivo) {
  return normalizar({ action_type: 'unknown', reason: motivo });
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

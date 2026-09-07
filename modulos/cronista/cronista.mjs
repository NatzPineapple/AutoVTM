/* ============================================================
   VITÆ — Cronista
   Resumo de capítulo e dossiê de campanha. Única camada, além do
   Narrador, que fala com um modelo. Nunca produz número de regra:
   o esquema de saída não tem campo numérico.
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prefixo, secao, manifesto } from './contexto.mjs';
import * as ollama from './provedor-ollama.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const PROVEDORES = { ollama };

const EXEMPLOS_NO_PREFIXO = process.env.VITAE_FEWSHOT === 'sim';

const RETENTATIVA = process.env.VITAE_RETENTATIVA === 'sim';

export const PROVEDOR = process.env.VITAE_PROVEDOR || 'ollama';
export const MODELO = process.env.VITAE_MODELO || (PROVEDORES[PROVEDOR] || ollama).MODELO_PADRAO;

function provedorDe(nome) {
  const p = PROVEDORES[nome || PROVEDOR];
  if (!p) throw new Error(`Provedor desconhecido: ${nome}. Só existe ollama.`);
  return p;
}

const PAPEL =
`Você é o Cronista de uma crônica de Vampiro: A Máscara 5ª Edição, em português do Brasil.
Você não narra a cena: você registra o que já aconteceu, depois que a noite acabou.

Escreve para um jogador reler daqui a um mês e lembrar de tudo em trinta segundos.

REGRAS DURAS:
- Você recebe um registro de eventos já resolvidos pelo motor. Você NÃO inventa evento,
  pessoa, local ou fato que não esteja nesse registro.
- Você NUNCA escreve número de regra: piscina, dificuldade, sucessos, dano, Fome, nível,
  Índice de Força. O registro tem os números; o seu texto não repete nenhum.
- Você não julga o personagem, não o redime e não conclui com lição de moral.
- Ao citar pessoa ou local, use exatamente o id que o registro fornece.`;

const ESQUEMA_CAPITULO = {
  type: 'object',
  additionalProperties: false,
  required: ['titulo', 'cronica', 'aconteceu', 'precoPago', 'fiosAbertos', 'proximoBeat'],
  properties: {
    titulo: { type: 'string', description: 'Título do capítulo, no máximo 8 palavras.' },
    cronica: { type: 'string', description: 'Prosa de 120 a 200 palavras, no tom do bloco de estilo.' },
    aconteceu: { type: 'array', minItems: 2, maxItems: 8, items: { type: 'string' },
                 description: 'O que de fato ocorreu, uma frase por item.' },
    precoPago: { type: 'array', maxItems: 5, items: { type: 'string' },
                 description: 'O que a noite custou. Vazio se não custou nada.' },
    fiosAbertos: { type: 'array', maxItems: 6, items: {
      type: 'object', additionalProperties: false,
      required: ['id', 'titulo', 'estado'],
      properties: { id: { type: 'string' }, titulo: { type: 'string' },
                    estado: { type: 'string', enum: ['aberto', 'fechado', 'apertando'] } } } },
    proximoBeat: { type: 'string', description: 'Uma frase sobre o que ficou armado.' }
  }
};

const ESQUEMA_DOSSIE = {
  type: 'object',
  additionalProperties: false,
  required: ['titulo', 'dossie', 'marcas', 'relacoes', 'posses', 'fiosAbertos', 'ganchoFuturo'],
  properties: {
    titulo: { type: 'string' },
    dossie: { type: 'string', description: 'Prosa de 200 a 350 palavras. O que esta crônica fez do personagem.' },
    marcas: { type: 'array', maxItems: 6, items: {
      type: 'object', additionalProperties: false,
      required: ['texto', 'tipo'],
      properties: {
        texto: { type: 'string', description: 'Uma frase. O que ficou e não sai.' },
        tipo: { type: 'string', enum: ['cicatriz', 'trauma', 'reputacao', 'juramento'] }
      } },
      description: 'Só o que a noite de fato causou. Não invente marca que o registro não mostra.' },
    relacoes: { type: 'array', maxItems: 8, items: {
      type: 'object', additionalProperties: false,
      required: ['id', 'quem', 'natureza', 'vinculo', 'dividaEmAberto'],
      properties: { id: { type: 'string' }, quem: { type: 'string' },
                    natureza: { type: 'string', description: 'O que essa pessoa é para o personagem agora.' },
                    vinculo: { type: 'string',
                      enum: ['aliado', 'amizade', 'amor', 'contato', 'devedor', 'credor',
                             'rival', 'inimigo', 'autoridade', 'pilar', 'rompido'] },
                    dividaEmAberto: { type: 'string' } } } },
    posses: { type: 'array', maxItems: 5, items: {
      type: 'object', additionalProperties: false,
      required: ['nome', 'comoVeio'],
      properties: { nome: { type: 'string' },
                    comoVeio: { type: 'string', description: 'Em que cena isso veio parar na mão dele.' } } },
      description: 'Objetos que o personagem ganhou, tomou ou herdou nesta crônica. Vazio se não ganhou nada.' },
    fiosAbertos: { type: 'array', maxItems: 8, items: {
      type: 'object', additionalProperties: false,
      required: ['id', 'titulo', 'estado'],
      properties: { id: { type: 'string' }, titulo: { type: 'string' },
                    estado: { type: 'string', enum: ['aberto', 'fechado', 'apertando'] } } } },
    ganchoFuturo: { type: 'string', description: 'O que a próxima crônica herda.' }
  }
};

const PEDIDOS = {
  capitulo: {
    esquema: ESQUEMA_CAPITULO,
    instrucao:
`Escreva a crônica do capítulo que acabou de fechar.
A prosa vai em "cronica": 120 a 200 palavras, ritmo quebrado, sem fecho moralizante,
terminando em estado instável. Os outros campos são listas secas, sem prosa.`
  },
  dossie: {
    esquema: ESQUEMA_DOSSIE,
    instrucao:
`Escreva o dossiê de encerramento da crônica inteira.
Este é o único documento que viaja para a próxima campanha: registre o que o personagem
virou, quem ele deve, quem o quer morto e o que ficou por resolver.
Em "relacoes" só entra quem está marcado [entrou na história]. Quem estava [só estava no
cenário] não vira vínculo: conhecer alguém de vista não é dívida nem inimizade, e esse
documento atravessa para outra cidade.`
  }
};

/* O MESMO defeito que a §51.4 fechou no `narrador.mjs`, e que estava
   aqui também: a lista negra sai do guia de estilo, e se o arquivo não
   abrisse ela virava vazia em silêncio. O validador do Cronista perdia
   a checagem de vocabulário sem avisar, e o modelo passava a "passar"
   nela.

   Achado pelo teste que varre `catch` mudo — eu tinha consertado só o
   do Narrador, e afirmado que era o último. */
let listaNegra = null;
const problemasDoJuiz = [];

function vocabularioProibido() {
  if (listaNegra) return listaNegra;
  try {
    const md = fs.readFileSync(path.join(RAIZ, 'docs/narracao-ia.md'), 'utf8');
    const bloco = secao(md, '6.1 A lista negra, em formato de máquina');
    if (!bloco) throw new Error('seção "6.1 A lista negra" não encontrada');
    const cerca = bloco.match(/```\n([\s\S]*?)```/);
    if (!cerca) throw new Error('a seção 6.1 existe, mas sem bloco de código');
    listaNegra = cerca[1].split('\n').map(s => s.trim()).filter(Boolean);
  } catch (e) {
    listaNegra = [];
    problemasDoJuiz.push(`lista negra do Cronista: ${e.message}`);
  }
  if (listaNegra.length < 10) {
    const aviso = `[cronista] a lista negra carregou ${listaNegra.length} termos ` +
                  `(esperado ao menos 10). A CHECAGEM DE VOCABULÁRIO ESTÁ DESLIGADA.`;
    if (!problemasDoJuiz.includes(aviso)) problemasDoJuiz.push(aviso);
    console.warn(aviso);
  }
  return listaNegra;
}

/** Igual ao do Narrador: quem mede precisa saber com quantas checagens
    está medindo (§51.4). */
export function saudeDoJuizDaCronica() {
  const negra = vocabularioProibido();
  return { listaNegra: negra.length, problemas: problemasDoJuiz.slice(),
           completo: !problemasDoJuiz.length && negra.length >= 10 };
}

const semAcento = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function validar(saida, { pessoas = [], locais = [], fios = [] } = {}) {
  const problemas = [];
  const prosa = [saida.cronica, saida.dossie, saida.proximoBeat, saida.ganchoFuturo]
    .filter(Boolean).join('\n');
  const textoDasMarcas = (saida.marcas || []).map(m => (m && m.texto) || m);
  const tudo = [prosa, ...(saida.aconteceu || []), ...(saida.precoPago || []),
                ...textoDasMarcas,
                ...(saida.posses || []).map(p => `${p.nome} ${p.comoVeio}`)].join('\n');

  for (const termo of vocabularioProibido()) {
    if (semAcento(tudo).includes(semAcento(termo))) problemas.push(`vocabulário proibido: "${termo}"`);
  }

  if (/[^\n]\s—\s(?![A-ZÁÉÍÓÚÂÊÔÃÕÇ])/.test(prosa) && !/^—/m.test(prosa)) {
    problemas.push('travessão explicativo');
  }
  if ((prosa.match(/\.\.\./g) || []).length > 1) problemas.push('reticências em excesso');

  const TERMOS_DE_REGRA = 'dados?|sucessos?|dificuldade|fome|vitalidade|vontade|humanidade|'
    + 'm[áa]culas?|pot[êe]ncia de sangue|[íi]ndice de for[çc]a|n[íi]vel|n[íi]veis';
  const antes = new RegExp(`\\b\\d+\\s*(?:de\\s+)?(?:${TERMOS_DE_REGRA})\\b`, 'i');
  const depois = new RegExp(`\\b(?:${TERMOS_DE_REGRA})\\b[^.!?\\n]{0,25}?\\b\\d+\\b`, 'i');
  if (antes.test(tudo) || depois.test(tudo)) problemas.push('número de regra na prosa');

  const ECO_DO_REGISTRO = /^\s*(cena|narra[çc][ãa]o|jogador|sistema|teste|barrado|resultado|fio)\b[^:]{0,40}:/i;
  const ecos = [...(saida.aconteceu || []), ...(saida.precoPago || []),
                ...(saida.marcas || []).map(m => (m && m.texto) || m)]
    .filter(x => ECO_DO_REGISTRO.test(String(x)));
  if (ecos.length) problemas.push(`${ecos.length} linha(s) do registro copiadas cruas em vez de resumidas`);

  const marcas = (prosa.match(/\b(the|and|with|which|that|there|would)\b/gi) || []).length;
  if (marcas > 3) problemas.push('idioma: trechos em inglês');

  const corpo = saida.cronica || saida.dossie || '';
  const n = corpo.trim().split(/\s+/).filter(Boolean).length;
  /* SÓ O MÍNIMO. O teto de 260 palavras saiu na §55, por decisão do
     usuário, e a razão é boa: crônica é o fecho de uma noite inteira, e
     um fecho comprido não é defeito — é uma noite que rendeu. Reprovar
     por isso jogava fora texto bom e obrigava a uma segunda chamada só
     para encurtar.

     O mínimo fica. Ele pega outra coisa: crônica de trinta palavras é o
     modelo desistindo, e isso não se conserta lendo — se conserta
     reprovando. O esquema continua PEDINDO 120 a 200 palavras na
     descrição do campo, que orienta sem rejeitar.

     O Narrador mantém o teto dele, e a diferença é de propósito: ali é
     UM TURNO, e narração de 400 palavras a cada ação inunda a tela do
     jogador. Aqui é a noite inteira, uma vez. */
  if (corpo && n < 60) {
    problemas.push(`curta demais: ${n} palavras, esperado ao menos 60`);
  }
  if (/\?\s*$/.test(corpo.trim())) problemas.push('a prosa termina perguntando ao jogador');

  const idsConhecidos = new Set([...pessoas, ...locais, ...fios]);
  for (const r of (saida.relacoes || [])) {
    if (r.id && !idsConhecidos.has(r.id)) problemas.push(`relação com id inexistente: ${r.id}`);
  }
  for (const p of (saida.posses || [])) {
    if (!p.comoVeio || p.comoVeio.trim().length < 12) {
      problemas.push(`posse "${p.nome}" sem dizer de onde veio`);
    }
  }
  for (const f of (saida.fiosAbertos || [])) {
    if (f.id && !idsConhecidos.has(f.id)) problemas.push(`fio com id inexistente: ${f.id}`);
  }

  return { valido: problemas.length === 0, problemas };
}

function corpoDoTurno(dados) {
  const linha = (rot, v) => (v && String(v).trim() ? `${rot}: ${v}` : '');
  const lista = (rot, arr, fn) => {
    const itens = (arr || []).map(fn).filter(Boolean);
    return itens.length ? `${rot}:\n${itens.map(x => `- ${x}`).join('\n')}` : '';
  };

  return [
    linha('Personagem', dados.personagem),
    linha('Seita e grupo', dados.lealdade),
    linha('Capítulo', dados.capitulo),
    lista('Cenas percorridas', dados.cenas, c => `${c.titulo || c.id}${c.local ? ` (${c.local})` : ''}`),
    lista('Pessoas em jogo', dados.pessoas, p => `${p.id} — ${p.nome}${p.relacao ? `, ${p.relacao}` : ''}${
      p.tocado === true ? ' [entrou na história]' : p.tocado === false ? ' [só estava no cenário]' : ''}`),
    lista('Locais em jogo', dados.locais, l => `${l.id} — ${l.nome}`),
    lista('Fatos estabelecidos', dados.fatos, f => `${f.titulo}${f.texto ? `: ${f.texto}` : ''}`),
    lista('Fios', dados.fios, f => `${f.id} — ${f.titulo} (${f.estado})`),
    lista('Registro da noite, em ordem', dados.eventos, e => e),
    lista('Estado do personagem, do começo ao fim', dados.mudancas, m => m),
    dados.resumoAnterior ? `Resumo do capítulo anterior:\n${dados.resumoAnterior}` : '',
    dados.legado ? `O QUE ESTE PERSONAGEM TRAZ DE CRÔNICAS ANTERIORES:\n${dados.legado}` : ''
  ].filter(Boolean).join('\n\n');
}

export async function configurado(nome) {
  return await provedorDe(nome).configurado();
}

export async function cronicar(tipo, dados, opcoes = {}) {
  const pedido = PEDIDOS[tipo];
  if (!pedido) throw new Error(`Tipo de crônica desconhecido: ${tipo}`);

  const ctx = prefixo({
    camada: 'cronista',
    exemplos: opcoes.exemplos != null ? opcoes.exemplos : EXEMPLOS_NO_PREFIXO,
    seita: dados.seita || '', cidade: dados.cidade || '',
    campanha: dados.arquivoCampanha || null, capitulo: dados.indiceCapitulo || 0
  });

  const provedor = provedorDe(opcoes.provedor);
  const modelo = opcoes.modelo || (opcoes.provedor ? provedor.MODELO_PADRAO : MODELO);

  const conhecidos = {
    pessoas: (dados.pessoas || []).map(p => p.id),
    locais: (dados.locais || []).map(l => l.id),
    fios: (dados.fios || []).map(f => f.id)
  };

  const chamar = (correcoes) => provedor.gerar({
    modelo,
    papel: PAPEL,
    contexto: ctx.texto,
    esquema: pedido.esquema,
    tempoLimite: opcoes.tempoLimite,
    conteudo: correcoes
      ? `${pedido.instrucao}\n\nA tentativa anterior foi rejeitada pelo validador por: ${correcoes}.\nReescreva corrigindo isso.\n\n${corpoDoTurno(dados)}`
      : `${pedido.instrucao}\n\n${corpoDoTurno(dados)}`
  });

  const inicio = Date.now();
  let r = await chamar(null);
  let veredito = validar(r.saida, conhecidos);
  const primeiroVeredito = veredito;
  let tentativas = 1;

  const permitirSegunda = opcoes.retentativa != null ? opcoes.retentativa : RETENTATIVA;
  if (!veredito.valido && permitirSegunda) {
    r = await chamar(veredito.problemas.join('; '));
    veredito = validar(r.saida, conhecidos);
    tentativas = 2;
  }

  return {
    tipo, saida: r.saida, tentativas,
    valido: veredito.valido,
    problemas: veredito.problemas,
    problemasNaPrimeira: primeiroVeredito.problemas,
    provedor: provedor.id,
    modelo,
    milissegundos: Date.now() - inicio,
    uso: r.uso,
    contexto: { caracteres: ctx.caracteres, partes: ctx.partes.map(p => p.rotulo) }
  };
}

export async function diagnostico() {
  const ctx = prefixo({ camada: 'cronista', seita: 'sabbat', cidade: 'rio' });
  return {
    provedor: PROVEDOR, modelo: MODELO,
    configurado: await configurado(),
    modelosLocais: await ollama.modelosDisponiveis(),
    manifesto: manifesto(),
    prefixo: { caracteres: ctx.caracteres, tokensAproximados: Math.round(ctx.caracteres / 3.6),
               partes: ctx.partes.map(p => ({ rotulo: p.rotulo, fonte: p.fonte, caracteres: p.texto.length })) },
    vocabularioProibido: vocabularioProibido().length
  };
}

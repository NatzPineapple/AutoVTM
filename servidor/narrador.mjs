/* ============================================================
   VITÆ — Narrador
   O degrau 4 da escada: prosa nova quando não existe prosa pronta.

   Regra dura desta camada: o esquema de saída NÃO TEM CAMPO
   NUMÉRICO. O Narrador pode pedir um teste nomeando a intenção;
   quem calcula piscina, dificuldade e rotas é o Árbitro, no
   navegador, com a mesma função que a interface usa.
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prefixo, secao } from './contexto.mjs';
import * as ollama from './provedor-ollama.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROVEDORES = { ollama };

const EXEMPLOS_NO_PREFIXO = process.env.VITAE_FEWSHOT === 'sim';

const RETENTATIVA = process.env.VITAE_RETENTATIVA === 'sim';

export const PROVEDOR = process.env.VITAE_PROVEDOR || 'ollama';
export const MODELO = process.env.VITAE_MODELO_NARRADOR
  || process.env.VITAE_MODELO
  || (PROVEDORES[PROVEDOR] || ollama).MODELO_PADRAO;

const PAPEL =
`Você é o Narrador de uma crônica de Vampiro: A Máscara 5ª Edição, em português do Brasil.
Você escreve a cena, em segunda pessoa e no presente, para o jogador que está nela.

REGRAS DURAS:
- Você NUNCA escreve número de regra: piscina, dificuldade, sucessos, dano, Fome, nível.
  O motor já resolveu tudo isso. Você narra o efeito, nunca a conta.
- Você NÃO decide se uma ação deu certo. Se o resultado do teste vier no pedido, narre
  esse resultado. Se não vier, narre até onde a ação chega e pare.
- Pessoa, local, fato ou fio que você inventar precisa vir declarado na saída, com id novo
  em minúsculas e sem acento. Ao citar um que já existe, use exatamente o id recebido.
- Você não resolve quebra de Máscara de graça, não redime e não julga o personagem.
- Os exemplos do contexto ensinam RITMO e POSTURA, não conteúdo. Nunca reaproveite os
  objetos, as falas ou os detalhes deles: eles pertencem às cenas de exemplo, não à sua.

TAMANHO: de 80 a 180 palavras. NUNCA passe de 200, e nunca fique abaixo de 80 —
menos que isso deixa a cena sem chão. Dois ou três parágrafos curtos.
Se você escreveu quatro parágrafos, escreveu demais: corte antes de responder.

Se quiser que o jogador teste alguma coisa, preencha "pedirTeste" com a intenção e o
motivo. Não invente dificuldade nem escolha os dados: isso é do Árbitro.

COMO TERMINAR — esta é a regra que mais se erra, e ela vale sobre todas as outras:
A última frase da sua narração é uma AFIRMAÇÃO sobre o mundo. Nunca uma pergunta.
PROIBIDO terminar com, ou com qualquer variação de:
  "O que você faz agora?"  "O que você faz?"  "Como você reage?"
  "E agora?"  "O que decide?"  "Qual é a sua próxima ação?"
A interface já pergunta ao jogador; se você perguntar também, a cena pergunta duas vezes.
Termine no detalhe instável — a coisa fora do lugar, o barulho que parou, a porta que
ficou aberta — e pare no ponto final. Sem convite, sem deixa, sem interrogação.`;

const ENTIDADE_PESSOA = {
  type: 'object', additionalProperties: false,
  required: ['id', 'nome', 'tipo', 'relacao', 'descricao'],
  properties: {
    id: { type: 'string', description: 'minúsculas, sem acento, sem espaço' },
    nome: { type: 'string' },
    tipo: { type: 'string', description: 'Ex.: Mortal · testemunha, Ventrue · Primogênito' },
    relacao: { type: 'string', enum: ['aliado', 'contato', 'autoridade', 'suspeito', 'ameaca', 'complicado', 'desconhecido'] },
    descricao: { type: 'string' }
  }
};

const ENTIDADE_LOCAL = {
  type: 'object', additionalProperties: false,
  required: ['id', 'nome', 'tipo', 'zona', 'descricao'],
  properties: {
    id: { type: 'string' }, nome: { type: 'string' },
    tipo: { type: 'string' }, zona: { type: 'string' }, descricao: { type: 'string' }
  }
};

export const ESQUEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['texto'],
  properties: {
    texto: { type: 'string',
      description: 'A narração. 80 a 180 palavras, terminando em estado instável.' },
    cena: { type: 'object', additionalProperties: false,
      required: ['local', 'hora', 'descricao'],
      properties: { local: { type: 'string', description: 'id de local existente ou declarado agora' },
                    hora: { type: 'string' }, descricao: { type: 'string' } },
      description: 'Só quando a cena muda de lugar ou de hora.' },
    pessoas: { type: 'array', maxItems: 3, items: ENTIDADE_PESSOA },
    locais: { type: 'array', maxItems: 2, items: ENTIDADE_LOCAL },
    fatos: { type: 'array', maxItems: 2, items: {
      type: 'object', additionalProperties: false,
      required: ['titulo', 'texto'],
      properties: { titulo: { type: 'string' }, texto: { type: 'string' } } } },
    fios: { type: 'array', maxItems: 2, items: {
      type: 'object', additionalProperties: false,
      required: ['id', 'titulo', 'estado'],
      properties: { id: { type: 'string' }, titulo: { type: 'string' },
                    estado: { type: 'string', enum: ['aberto', 'apertando', 'fechado'] } } } },
    pedirTeste: { type: 'object', additionalProperties: false,
      required: ['intencao', 'motivo'],
      properties: {
        intencao: { type: 'string', description: 'id de ação do Árbitro, ex.: esconder, persuadir, arrombar' },
        motivo: { type: 'string', description: 'Uma frase dizendo o que está em jogo.' }
      },
      description: 'Opcional. Sem dificuldade e sem dados: quem calcula é o Árbitro.' },
    efeitos: { type: 'array', maxItems: 2, items: {
      type: 'object', additionalProperties: false,
      required: ['campo', 'motivo'],
      properties: {
        campo: { type: 'string', enum: ['fome'] },
        motivo: { type: 'string' }
      },
      description: 'Pedido de efeito. Só Fome, só um degrau, e o Árbitro decide se aplica.' } }
  }
};

/* ------------------------------------------------------------
   O GUIA DE ESTILO É A FONTE DAS CHECAGENS

   Três conjuntos saem de `docs/narracao-ia.md`: a lista negra de
   vocabulário, as assinaturas dos exemplos (para pegar cópia
   literal) e o léxico deles (para pegar reaproveitamento de
   cenário). Os três carregadores engoliam a falha e devolviam
   conjunto VAZIO — o validador perdia checagem em silêncio, e o
   modelo passava a "passar" no que já não era conferido.

   Um juiz que emagrece calado é pior que juiz nenhum: com juiz
   nenhum você sabe que não está medindo.

   Agora falham alto, e `saudeDoValidador()` diz o que carregou.
   ------------------------------------------------------------ */

const problemasDeCarga = [];

function carregarGuia(quem, secaoAlvo, transformar) {
  try {
    const md = fs.readFileSync(path.join(RAIZ, 'docs/narracao-ia.md'), 'utf8');
    const bloco = secao(md, secaoAlvo);
    if (!bloco) {
      problemasDeCarga.push(`${quem}: seção "${secaoAlvo}" não encontrada em docs/narracao-ia.md`);
      return null;
    }
    const cerca = bloco.match(/```\n([\s\S]*?)```/);
    if (!cerca) {
      problemasDeCarga.push(`${quem}: a seção existe, mas sem bloco de código`);
      return null;
    }
    return transformar(cerca[1]);
  } catch (e) {
    problemasDeCarga.push(`${quem}: ${e.message}`);
    return null;
  }
}

function avisarSeVazio(quem, conjunto, minimo) {
  const n = conjunto.size !== undefined ? conjunto.size : conjunto.length;
  if (n < minimo) {
    const aviso = `[validador] ${quem} carregou ${n} itens (esperado ao menos ${minimo}). ` +
                  `AS CHECAGENS QUE DEPENDEM DISSO ESTÃO DESLIGADAS.`;
    if (!problemasDeCarga.includes(aviso)) problemasDeCarga.push(aviso);
    console.warn(aviso);
  }
  return conjunto;
}

/** O que o validador conseguiu carregar. Quem mede precisa saber com
    quantas checagens está medindo — é o que separa "o modelo melhorou"
    de "o juiz emagreceu". */
export function saudeDoValidador() {
  const negra = vocabularioProibido();
  const assin = assinaturasDosExemplos();
  const lex = lexicoDosExemplos();
  return {
    listaNegra: negra.length,
    assinaturasDoFewShot: assin.size,
    lexicoDoFewShot: lex.size,
    problemas: problemasDeCarga.slice(),
    completo: problemasDeCarga.length === 0 && negra.length >= 10 && assin.size > 0 && lex.size > 0
  };
}

let listaNegra = null;
function vocabularioProibido() {
  if (listaNegra) return listaNegra;
  listaNegra = carregarGuia('lista negra', '6.1 A lista negra, em formato de máquina',
    (txt) => txt.split('\n').map(x => x.trim()).filter(Boolean)) || [];
  return avisarSeVazio('lista negra', listaNegra, 10);
}

const semAcento = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

let trechosDoExemplo = null;
function assinaturasDosExemplos() {
  if (trechosDoExemplo) return trechosDoExemplo;
  trechosDoExemplo = new Set();
  carregarGuia('assinaturas do few-shot', '5.2 Exemplos de narração (few-shot do Narrador)',
    (txt) => {
      const narracoes = txt.split(/NARRAÇÃO\n/).slice(1).map(t => t.split(/\n\nSITUAÇÃO/)[0]);
      for (const t of narracoes) {
        const p = semAcento(t).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
        for (let i = 0; i + 7 < p.length; i++) trechosDoExemplo.add(p.slice(i, i + 8).join(' '));
      }
      return trechosDoExemplo;
    });
  return avisarSeVazio('assinaturas do few-shot', trechosDoExemplo, 1);
}

function copiouOExemplo(texto) {
  const assinaturas = assinaturasDosExemplos();
  if (!assinaturas.size) return null;
  const p = semAcento(texto).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  for (let i = 0; i + 7 < p.length; i++) {
    const janela = p.slice(i, i + 8).join(' ');
    if (assinaturas.has(janela)) return janela;
  }
  return null;
}

const VAZIAS = new Set(['para', 'como', 'quando', 'porque', 'ainda', 'depois', 'antes',
  'sobre', 'entre', 'contra', 'desde', 'onde', 'quem', 'este', 'esta', 'esse', 'essa',
  'aquele', 'aquela', 'isso', 'aquilo', 'voce', 'ele', 'ela', 'eles', 'elas', 'seu', 'sua',
  'seus', 'suas', 'muito', 'pouco', 'mais', 'menos', 'tambem', 'so', 'ja', 'nao', 'sim',
  'que', 'com', 'sem', 'por', 'uma', 'uns', 'umas', 'dos', 'das', 'nos', 'nas', 'pelo',
  'pela', 'esta', 'estao', 'fica', 'ficou', 'tem', 'tinha', 'foi', 'era', 'ser', 'estar',
  'fazer', 'faz', 'diz', 'dizer', 'olha', 'olhar', 'nada', 'algo', 'alguem', 'ninguem',
  'coisa', 'vez', 'vezes', 'lado', 'porta', 'sala', 'noite', 'tempo', 'agora', 'sempre',
  'nunca', 'meio', 'outro', 'outra', 'mesmo', 'mesma', 'todo', 'toda', 'cada', 'segundo',
  'minuto', 'hora', 'luz', 'mao', 'maos', 'olhos', 'rosto', 'voz']);

let lexicoDoExemplo = null;
function lexicoDosExemplos() {
  if (lexicoDoExemplo) return lexicoDoExemplo;
  lexicoDoExemplo = new Set();
  carregarGuia('léxico do few-shot', '5.2 Exemplos de narração (few-shot do Narrador)',
    (txt) => {
      const narracoes = txt.split(/NARRAÇÃO\n/).slice(1)
        .map(t => t.split(/\n\nSITUAÇÃO/)[0]).join(' ');
      for (const p of semAcento(narracoes).replace(/[^a-z\s]/g, ' ').split(/\s+/)) {
        if (p.length >= 5 && !VAZIAS.has(p)) lexicoDoExemplo.add(p);
      }
      return lexicoDoExemplo;
    });
  return avisarSeVazio('léxico do few-shot', lexicoDoExemplo, 1);
}

function palavrasDe(texto) {
  return new Set(semAcento(String(texto || '')).replace(/[^a-z\s]/g, ' ')
    .split(/\s+/).filter(p => p.length >= 5));
}

export function reaproveitouOsExemplos(texto, contextoDoTurno) {
  const lexico = lexicoDosExemplos();
  if (!lexico.size) return [];
  const proprias = palavrasDe(contextoDoTurno);
  const usadas = [];
  for (const p of palavrasDe(texto)) {
    if (lexico.has(p) && !proprias.has(p)) usadas.push(p);
  }
  return usadas;
}

export function validar(saida, { pessoas = [], locais = [], fios = [], acoes = [], contexto = '', exemplos = true } = {}) {
  const problemas = [];
  const texto = saida.texto || '';

  for (const termo of vocabularioProibido()) {
    if (semAcento(texto).includes(semAcento(termo))) problemas.push(`vocabulário proibido: "${termo}"`);
  }

  const semFalas = texto.split('\n').filter(l => !/^\s*—/.test(l)).join('\n');
  if (/[^\n]\s—\s(?![A-ZÁÉÍÓÚÂÊÔÃÕÇ])/.test(semFalas)) problemas.push('travessão explicativo');
  if ((texto.match(/\.\.\./g) || []).length > 1) problemas.push('reticências em excesso');

  const TERMOS = 'dados?|sucessos?|dificuldade|fome|vitalidade|vontade|humanidade|m[áa]culas?|'
    + 'pot[êe]ncia de sangue|n[íi]vel|n[íi]veis';
  if (new RegExp(`\\b\\d+\\s*(?:de\\s+)?(?:${TERMOS})\\b`, 'i').test(texto)
   || new RegExp(`\\b(?:${TERMOS})\\b[^.!?\\n]{0,25}?\\b\\d+\\b`, 'i').test(texto)) {
    problemas.push('número de regra na prosa');
  }

  /* SÓ O MÍNIMO. O teto de 260 palavras saiu na §55, por decisão do
     usuário — o mesmo movimento feito no Cronista, e estendido aqui.

     Eu tinha argumentado para manter este, com o argumento de que a
     narração de um TURNO inunda a tela quando cresce. O argumento é
     sobre ritmo, e ritmo é escolha de quem joga: uma cena que pede
     duzentas e cinquenta palavras não é um defeito do modelo, e
     reprovar por isso jogava fora texto bom e pagava uma segunda
     chamada só para encurtar.

     O PAPEL continua pedindo 80 a 180 palavras, e o esquema repete no
     campo. Isso orienta sem rejeitar — que é a diferença entre alvo e
     portão.

     O mínimo fica, e pega outra coisa: narração de vinte palavras é o
     modelo desistindo, não uma escolha de ritmo. */
  const n = texto.trim().split(/\s+/).filter(Boolean).length;
  if (n < 40) problemas.push(`curta demais: ${n} palavras, esperado ao menos 40`);
  if (/\?\s*$/.test(texto.trim())) problemas.push('a narração termina perguntando ao jogador');

  const ingles = (texto.match(/\b(the|and|with|which|that|there|would)\b/gi) || []).length;
  if (ingles > 3) problemas.push('idioma: trechos em inglês');

  if (exemplos) {
    const copiado = copiouOExemplo(texto);
    if (copiado) problemas.push(`copiou o few-shot literalmente: "${copiado}…"`);

    const reaproveitadas = reaproveitouOsExemplos(texto, contexto);
    if (reaproveitadas.length >= 3) {
      problemas.push(`reaproveitou o cenário dos exemplos: ${reaproveitadas.slice(0, 5).join(', ')}`);
    }
  }

  const ID_ACEITO = /^[a-z0-9_]{1,40}$/;
  const declarados = [
    ...(saida.pessoas || []).map(p => ['pessoa', p.id]),
    ...(saida.locais || []).map(l => ['local', l.id])
  ];
  for (const [tipo, id] of declarados) {
    if (!ID_ACEITO.test(String(id || ''))) problemas.push(`id de ${tipo} malformado: ${id}`);
  }

  const idsPessoa = new Set([...pessoas, ...(saida.pessoas || []).map(p => p.id)]);
  const idsLocal = new Set([...locais, ...(saida.locais || []).map(l => l.id)]);
  for (const m of texto.matchAll(/\[\[(pessoa|local):([a-z0-9_]+)/gi)) {
    const conjunto = m[1].toLowerCase() === 'pessoa' ? idsPessoa : idsLocal;
    if (!conjunto.has(m[2])) problemas.push(`referência a ${m[1]} inexistente: ${m[2]}`);
  }
  if (saida.cena && saida.cena.local && !idsLocal.has(saida.cena.local)) {
    problemas.push(`troca de cena para local inexistente: ${saida.cena.local}`);
  }
  for (const f of (saida.fios || [])) {
    if (fios.includes(f.id)) continue;
    if (!/^[a-z0-9_]+$/.test(f.id)) { problemas.push(`id de fio malformado: ${f.id}`); continue; }
    const parecido = fios.find(x => x.startsWith(f.id) || f.id.startsWith(x));
    if (parecido) problemas.push(`fio "${f.id}" duplica o já existente "${parecido}": use o id existente`);
  }
  if (saida.pedirTeste && acoes.length && !acoes.includes(saida.pedirTeste.intencao)) {
    problemas.push(`pediu teste de intenção desconhecida: ${saida.pedirTeste.intencao}`);
  }

  return { valido: problemas.length === 0, problemas };
}

/* Exportada na §57 para poder ser afirmada: é ela que decide o que o
   modelo vê do turno, e até aqui só dava para conferir lendo. */
export function corpoDoTurno(t) {
  const lista = (rot, arr, fn) => {
    const itens = (arr || []).map(fn).filter(Boolean);
    return itens.length ? `${rot}:\n${itens.map(x => `- ${x}`).join('\n')}` : '';
  };
  const modo = { agir: 'age', falar: 'fala em voz alta',
                 examinar: 'olha de perto', perguntar: 'pergunta ao Narrador' }[t.modo] || 'age';

  return [
    `SITUAÇÃO`,
    `Cena: ${t.cena.descricao || t.cena.local}${t.cena.hora ? `, ${t.cena.hora}` : ''}`,
    t.presentes && t.presentes.length ? `Presentes: ${t.presentes.join(', ')}` : 'Ninguém mais presente.',
    `Personagem: ${t.personagem}`,
    t.lealdade ? `Lealdade: ${t.lealdade}` : '',
    t.condicao ? `Condição: ${t.condicao}` : '',
    '',
    lista('Pessoas conhecidas', t.pessoas, p => `${p.id} — ${p.nome}${p.relacao ? `, ${p.relacao}` : ''}`),
    lista('Locais conhecidos', t.locais, l => `${l.id} — ${l.nome}`),
    lista('Fios em aberto', t.fios, f => `${f.id} — ${f.titulo}`),
    lista('Últimos momentos, em ordem', t.historico, h => h),
    '',
    /* §57 — a mesa passou a ter uma caixa só, e o turno pode ser ação E
       fala E pergunta de uma vez. Quando os pedaços vêm, eles vão para o
       modelo separados: quem está na cena reage ao que foi DITO em voz
       alta, e não ao que o personagem só fez. Misturar os dois numa
       linha só fazia o Narrador tratar pensamento como fala.

       Turno sem pedaços — sessão gravada antes da §57 — cai na linha de
       antes, que continua correta. */
    (t.segmentos && t.segmentos.length)
      ? ['O TURNO DO JOGADOR:'].concat(t.segmentos.map((s) => {
          if (s.tipo === 'fala') {
            const vol = { sussurro: 'sussurrando', grito: 'gritando',
                          mensagem: 'por mensagem escrita' }[s.volume] || 'em voz alta';
            return `- Ele diz, ${vol}: "${s.texto}"`;
          }
          if (s.tipo === 'meta') {
            return `- Fora da ficção, ele pergunta a você: ${s.texto}`;
          }
          return `- Ele faz: ${s.texto}`;
        })).join('\n')
      : `O jogador ${modo}: ${t.texto}`,
    t.arbitro ? `Árbitro: ${t.arbitro}` : '',
    (t.acoes && t.acoes.length)
      ? `Se for pedir teste, "intencao" tem que ser EXATAMENTE um destes, sem inventar e sem\n`
        + `juntar palavras: ${t.acoes.join(', ')}.\nSe nenhum servir, não peça teste.`
      : '',
    t.resultado ? `Resultado do teste, já rolado pelo motor: ${t.resultado}` : '',
    t.gancho ? `A campanha espera que esta cena caminhe para: ${t.gancho}` : '',
    t.legado ? `O QUE ESTE PERSONAGEM TRAZ DE CRÔNICAS ANTERIORES:
${t.legado}` : ''
  ].filter(Boolean).join('\n');
}

export async function narrar(turno, opcoes = {}) {
  const provedor = PROVEDORES[opcoes.provedor || PROVEDOR];
  if (!provedor) throw new Error(`Provedor desconhecido: ${opcoes.provedor}`);
  const modelo = opcoes.modelo || MODELO;

  const comExemplos = opcoes.exemplos != null ? opcoes.exemplos : EXEMPLOS_NO_PREFIXO;
  const ctx = prefixo({
    camada: 'narrador',
    exemplos: comExemplos,
    seita: turno.seita || '', cidade: turno.cidade || '',
    campanha: turno.arquivoCampanha || null, capitulo: turno.indiceCapitulo || 0
  });

  const conhecidos = {
    pessoas: (turno.pessoas || []).map(p => p.id),
    locais: (turno.locais || []).map(l => l.id),
    fios: (turno.fios || []).map(f => f.id),
    acoes: turno.acoes || [],
    contexto: corpoDoTurno(turno),
    exemplos: comExemplos
  };

  const chamar = (correcoes) => provedor.gerar({
    modelo,
    papel: PAPEL,
    contexto: ctx.texto,
    esquema: ESQUEMA,
    tempoLimite: opcoes.tempoLimite,
    conteudo: correcoes
      ? `${corpoDoTurno(turno)}\n\nA tentativa anterior foi rejeitada por: ${correcoes}.\nReescreva corrigindo isso.`
      : corpoDoTurno(turno)
  });

  const inicio = Date.now();
  let r = await chamar(null);
  let veredito = validar(r.saida, conhecidos);
  const primeiro = veredito;
  let tentativas = 1;

  const permitirSegunda = opcoes.retentativa != null ? opcoes.retentativa : RETENTATIVA;
  if (!veredito.valido && permitirSegunda) {
    r = await chamar(veredito.problemas.join('; '));
    veredito = validar(r.saida, conhecidos);
    tentativas = 2;
  }

  return {
    saida: r.saida, tentativas,
    valido: veredito.valido,
    problemas: veredito.problemas,
    problemasNaPrimeira: primeiro.problemas,
    provedor: provedor.id, modelo,
    milissegundos: Date.now() - inicio,
    uso: r.uso,
    contexto: { caracteres: ctx.caracteres, partes: ctx.partes.map(p => p.rotulo) }
  };
}

export async function configurado(nome) {
  const p = PROVEDORES[nome || PROVEDOR];
  return p ? await p.configurado() : false;
}

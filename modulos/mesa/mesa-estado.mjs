/* ============================================================
   VITÆ — MesaServer: o cache de estado (Checkout/Checkin)
   ------------------------------------------------------------
   O coração da partida ativa, e a razão de o Módulo 3 existir.

   O PADRÃO, em uma frase: durante a mesa NINGUÉM fala com o
   banco. A ficha é copiada uma vez na abertura, tudo o que
   acontece acontece na cópia em memória, e o banco só volta a
   ouvir falar da ficha no fim, se o jogador aceitar.

   Três estados que não se confundem:

     memória      a verdade da partida. Vida, fome, inventário,
                  NPCs, cena — muda a cada ação, e é O ÚNICO lugar
                  que muda durante o jogo
     pasta        o autosave. Existe contra queda de energia, não
                  como fonte da verdade. É de onde a sessão volta
     FichaServer  a ficha do jogador. Congelada desde o checkout;
                  só muda no checkin, e só com aceite

   O AUTOSAVE É SILENCIOSO E POR PARTE. Um turno mexe no
   histórico e talvez na cena; não tem por que reescrever a ficha
   inteira junto. Cada parte tem sua marca de sujeira, e o
   temporizador grava só o que mudou.
   ============================================================ */

import * as Pasta from './mesa-pasta.mjs';
import { pedirFicha, devolverFicha } from './cliente-ficha.mjs';

const INTERVALO_AUTOSAVE = Number(process.env.VITAE_AUTOSAVE_MS || 5000);

/** id → sessão viva. Sai daqui quando encerra, não quando o jogador some. */
const vivas = new Map();

/* ------------------------------------------------------------
   O ID
   Mesmo cuidado da §75 no navegador: tempo + sequência + acaso,
   COM SEPARADOR. Sem separador, base 36 de largura variável
   colide sozinha, sem precisar de azar no sorteio.
   ------------------------------------------------------------ */
let sequencia = 0;

function novoId() {
  for (let tentativa = 0; tentativa < 50; tentativa++) {
    const id = `s${Date.now().toString(36)}-${(sequencia++).toString(36)}-` +
               Math.random().toString(36).slice(2, 7);
    if (!vivas.has(id) && !Pasta.existe(id)) return id;
  }
  throw new Error('Não consegui um id de sessão livre.');
}

const MUNDO_VAZIO = () => ({
  cena: { local: '', hora: '', descricao: '' },
  locais: [], pessoas: [], objetos: [], inimigos: [],
  fatos: [], fios: [], estados: [], bolsa: [],
  combate: { ativo: false, motivo: '', oponentes: [], rodada: null, proximoId: 1 },
  campanha: null, diretor: null,
  /* "informações de abas", do desenho do Módulo 3: qual aba está
     aberta, o rascunho não enviado, o modo. É estado de sessão, não
     de ficha, e por isso mora aqui. */
  abas: { aba: 'ficha', modo: 'agir', itemAberto: '', rascunho: '', docaAberta: false }
});

function novaSessao(id, ficha, origem) {
  return {
    id,
    ficha,                          /* a cópia local — o checkout */
    fichaOriginal: JSON.parse(JSON.stringify(ficha)),
    mundo: MUNDO_VAZIO(),
    historico: [],
    meta: {
      id, criadaEm: Date.now(), atualizadoEm: Date.now(),
      personagem: ficha.nome || 'Sem nome', claId: ficha.cla || '',
      fichaId: ficha.fichaId || '', origemDaFicha: origem,
      campanha: '', capitulo: '', cena: '',
      turnos: 0, checkinFeito: false, checkinEm: 0, encerrada: false
    },
    /* Sujeira por parte. `historicoPendente` são os turnos que ainda
       não foram para o .jsonl — o autosave só acrescenta esses. */
    sujo: { ficha: true, mundo: true, meta: true },
    historicoPendente: [],
    ultimoSalvamento: 0
  };
}

/* ------------------------------------------------------------
   ABRIR — o checkout
   ------------------------------------------------------------ */

export async function abrir({ fichaId = '', ficha = null, campanha = null } = {}) {
  const r = await pedirFicha(fichaId, { deReserva: ficha });
  if (!r.ok) return { ok: false, motivo: r.motivo };

  const id = novoId();
  const s = novaSessao(id, JSON.parse(JSON.stringify(r.ficha)), r.origem);
  if (campanha) {
    s.mundo.campanha = campanha;
    s.meta.campanha = (campanha.meta && campanha.meta.campanha) || 'Campanha';
  }
  vivas.set(id, s);

  Pasta.criarPasta(id);
  salvar(id, { tudo: true });
  return { ok: true, id, origemDaFicha: r.origem, sessao: publica(s) };
}

/* ------------------------------------------------------------
   CARREGAR — a sessão volta do disco para a memória
   ------------------------------------------------------------ */

export function carregar(id) {
  if (vivas.has(id)) return vivas.get(id);
  if (!Pasta.existe(id)) return null;

  const meta = Pasta.lerParte(id, 'meta', null);
  const ficha = Pasta.lerParte(id, 'ficha', null);
  if (!meta || !ficha) {
    console.warn(`[mesa] sessão ${id} tem pasta sem meta ou sem ficha`);
    return null;
  }
  const s = novaSessao(id, ficha, meta.origemDaFicha || 'pasta');
  s.meta = Object.assign(s.meta, meta);
  s.mundo = Object.assign(MUNDO_VAZIO(), Pasta.lerParte(id, 'mesa', {}) || {});
  s.historico = Pasta.lerHistorico(id);
  s.sujo = { ficha: false, mundo: false, meta: false };
  vivas.set(id, s);
  return s;
}

export const emMemoria = (id) => vivas.get(id) || null;

/* ------------------------------------------------------------
   MUDAR — só em memória, nunca no banco
   ------------------------------------------------------------ */

const misturar = (alvo, mudancas) => {
  for (const [chave, valor] of Object.entries(mudancas || {})) {
    if (valor && typeof valor === 'object' && !Array.isArray(valor) &&
        alvo[chave] && typeof alvo[chave] === 'object' && !Array.isArray(alvo[chave])) {
      misturar(alvo[chave], valor);
    } else {
      alvo[chave] = valor;
    }
  }
  return alvo;
};

export function alterarFicha(id, mudancas) {
  const s = carregar(id);
  if (!s) return null;
  misturar(s.ficha, mudancas);
  s.sujo.ficha = true;
  tocar(s);
  return s.ficha;
}

export function alterarMundo(id, mudancas) {
  const s = carregar(id);
  if (!s) return null;
  misturar(s.mundo, mudancas);
  s.sujo.mundo = true;
  /* O resumo da lista mostra a cena; se ela mudou no mundo, o meta
     tem de acompanhar, senão a lista mente. */
  if (s.mundo.cena && s.mundo.cena.local) s.meta.cena = s.mundo.cena.local;
  tocar(s);
  return s.mundo;
}

export function anexarTurno(id, entradas) {
  const s = carregar(id);
  if (!s) return null;
  const lista = (Array.isArray(entradas) ? entradas : [entradas]).filter(Boolean);
  if (!lista.length) return s.historico.length;
  for (const e of lista) {
    if (!e.em) e.em = Date.now();
    s.historico.push(e);
    s.historicoPendente.push(e);
    if (e.autor === 'jogador') s.meta.turnos++;
  }
  tocar(s);
  return s.historico.length;
}

function tocar(s) {
  s.meta.atualizadoEm = Date.now();
  s.sujo.meta = true;
}

/* ------------------------------------------------------------
   A MESA ROLA  (§82)

   O Árbitro diz QUAIS dados; é aqui que eles saem. Este é o único
   ponto do Módulo 3 que consome acaso para uma rolagem, e ele grava
   o que saiu no histórico da sessão — que é o que torna uma noite
   repetível e conferível depois.

   O QUE ESTE ARQUIVO NÃO FAZ, E NÃO PODE FAZER: apurar. Contar
   sucessos, achar o par de dez, decidir se foi Falha Bestial — tudo
   isso é regra, e regra é do Árbitro. Daqui saem números.

   O TETO existe porque o pedido vem de fora: sem ele, `normais:
   1e9` aloca um vetor de um bilhão de posições e derruba o processo.
   Ele não é regra de jogo — a maior parada concebível no V5 não
   passa de duas dezenas —, é a peneira de quem aceita corpo de rede.
   ------------------------------------------------------------ */

const TETO_DE_DADOS = 100;

const d10 = () => 1 + Math.floor(Math.random() * 10);

const inteiroNaoNegativo = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
};

export function rolar(id, pedido) {
  const s = carregar(id);
  if (!s) return null;

  const p = pedido || {};
  let normais = inteiroNaoNegativo(p.normais);
  let fome = inteiroNaoNegativo(p.fome);
  let cortado = '';
  if (normais + fome > TETO_DE_DADOS) {
    cortado = `pedido de ${normais + fome} dados cortado em ${TETO_DE_DADOS}`;
    console.warn(`[mesa] ${id}: ${cortado}`);
    fome = Math.min(fome, TETO_DE_DADOS);
    normais = TETO_DE_DADOS - fome;
  }

  const valores = {
    normais:   Array.from({ length: normais }, d10),
    dadosFome: Array.from({ length: fome },    d10)
  };
  /* O pedido volta junto com os valores, e não só os valores: o
     Árbitro apura contra o pedido que ELE fez, e quem lê o histórico
     depois consegue refazer a conta sem adivinhar a dificuldade. */
  const devolvido = {
    normais, fome,
    dificuldade: inteiroNaoNegativo(p.dificuldade),
    rotulo: String(p.rotulo || ''),
    piscina: inteiroNaoNegativo(p.piscina) || (normais + fome)
  };

  const entrada = { autor: 'dados', em: Date.now(), pedido: devolvido, valores };
  if (cortado) entrada.aviso = cortado;
  s.historico.push(entrada);
  s.historicoPendente.push(entrada);
  tocar(s);

  return { pedido: devolvido, valores, aviso: cortado || undefined };
}

/* ------------------------------------------------------------
   O AUTOSAVE
   ------------------------------------------------------------ */

export function salvar(id, { tudo = false } = {}) {
  const s = vivas.get(id);
  if (!s) return { ok: false, motivo: 'sessão não está em memória' };
  const partes = [];
  try {
    if (tudo || s.sujo.ficha) { Pasta.gravarParte(id, 'ficha', s.ficha); s.sujo.ficha = false; partes.push('ficha'); }
    if (tudo || s.sujo.mundo) { Pasta.gravarParte(id, 'mesa', s.mundo); s.sujo.mundo = false; partes.push('mesa'); }
    if (s.historicoPendente.length) {
      Pasta.anexarHistorico(id, s.historicoPendente);
      partes.push(`${s.historicoPendente.length} turno(s)`);
      s.historicoPendente = [];
    }
    if (tudo || s.sujo.meta) { Pasta.gravarParte(id, 'meta', s.meta); s.sujo.meta = false; partes.push('meta'); }
    s.ultimoSalvamento = Date.now();
    return { ok: true, partes };
  } catch (e) {
    /* Disco cheio ou pasta sem permissão. A sessão em memória segue
       íntegra e as marcas de sujeira ficam ligadas de propósito: a
       próxima passada tenta de novo. */
    console.warn(`[mesa] autosave de ${id} falhou: ${e.message}`);
    return { ok: false, motivo: e.message };
  }
}

export function salvarTodas() {
  const feitos = [];
  for (const [id, s] of vivas) {
    if (!s.sujo.ficha && !s.sujo.mundo && !s.sujo.meta && !s.historicoPendente.length) continue;
    const r = salvar(id);
    feitos.push({ id, ok: r.ok, partes: r.partes || [], motivo: r.motivo });
  }
  return feitos;
}

let relogio = null;

/* `aoSalvar` existe para o servidor avisar o Cliente pelo WebSocket
   sem que este arquivo precise saber que WebSocket existe. */
export function ligarAutosave(ms = INTERVALO_AUTOSAVE, aoSalvar = null) {
  if (relogio) return relogio;
  relogio = setInterval(() => {
    const feitos = salvarTodas();
    const ruins = feitos.filter(f => !f.ok);
    /* Silencioso quando dá certo — é o pedido do desenho. Falha,
       não: perder sessão calado é o defeito que a §47 fechou. */
    if (ruins.length) console.warn(`[mesa] autosave falhou em ${ruins.map(r => r.id).join(', ')}`);
    if (aoSalvar && feitos.length) aoSalvar(feitos);
  }, ms);
  relogio.unref();
  return relogio;
}

export function desligarAutosave() {
  if (relogio) { clearInterval(relogio); relogio = null; }
  return salvarTodas();
}

/* ------------------------------------------------------------
   CHECKIN — o único momento em que o banco ouve falar da ficha
   ------------------------------------------------------------ */

/** O que MUDOU na ficha desde o checkout. É isto que o jogador aceita. */
export function alteracoesDaFicha(id) {
  const s = carregar(id);
  if (!s) return null;
  const antes = s.fichaOriginal, agora = s.ficha;
  const mudou = [];
  for (const chave of new Set([...Object.keys(antes), ...Object.keys(agora)])) {
    const a = JSON.stringify(antes[chave]), b = JSON.stringify(agora[chave]);
    if (a !== b) mudou.push({ campo: chave, antes: antes[chave], agora: agora[chave] });
  }
  return mudou;
}

export async function checkin(id, { aceite = false } = {}) {
  const s = carregar(id);
  if (!s) return { ok: false, motivo: 'Sessão desconhecida.' };
  /* "mediante aceite do usuário". Sem o aceite explícito isto não é
     um checkin: é uma prévia do que seria gravado. */
  if (!aceite) {
    return { ok: false, precisaAceite: true, alteracoes: alteracoesDaFicha(id),
      motivo: 'O checkin só acontece com o aceite do jogador.' };
  }

  const r = await devolverFicha(s.ficha);
  s.meta.checkinFeito = r.ok;
  s.meta.checkinEm = Date.now();
  s.meta.checkinOrigem = r.origem;
  s.sujo.meta = true;
  salvar(id);

  if (!r.ok) {
    /* NÃO é sucesso, e também não é perda: o pacote volta para o
       Cliente gravar do lado dele, e a pasta continua com tudo. */
    return { ok: false, origem: r.origem, motivo: r.motivo, pacote: r.pacote,
      alteracoes: alteracoesDaFicha(id) };
  }
  /* Do checkin em diante, a base de comparação é o que foi gravado.
     Sem isto, um segundo checkin reapresenta alterações já aceitas. */
  s.fichaOriginal = JSON.parse(JSON.stringify(s.ficha));
  return { ok: true, origem: r.origem, fichaId: r.fichaId };
}

/* ------------------------------------------------------------
   ENCERRAR
   ------------------------------------------------------------ */

export async function encerrar(id, { aceite = false, comCheckin = true } = {}) {
  const s = carregar(id);
  if (!s) return { ok: false, motivo: 'Sessão desconhecida.' };

  let resultado = null;
  if (comCheckin) {
    resultado = await checkin(id, { aceite });
    if (!resultado.ok && resultado.precisaAceite) return resultado;
  }
  s.meta.encerrada = true;
  s.sujo.meta = true;
  salvar(id, { tudo: true });
  vivas.delete(id);
  return { ok: true, checkin: resultado };
}

export function apagar(id) {
  vivas.delete(id);
  return Pasta.apagarPasta(id);
}

/* ------------------------------------------------------------
   LEITURA
   ------------------------------------------------------------ */

function publica(s) {
  return { id: s.id, meta: s.meta, ficha: s.ficha, mundo: s.mundo, historico: s.historico };
}

export function estadoDe(id) {
  const s = carregar(id);
  return s ? publica(s) : null;
}

/** A lista. Lê só os `meta.json` — não abre ficha nem histórico de ninguém. */
export function listar() {
  const emDisco = Pasta.listarPastas();
  const vistos = new Set(emDisco.map(m => m.id));
  /* Sessão recém-aberta que ainda não passou pelo autosave existe só
     em memória; ela também é da lista. */
  for (const [id, s] of vivas) if (!vistos.has(id)) emDisco.push(s.meta);
  return emDisco
    .map(m => Object.assign({}, m, { viva: vivas.has(m.id) }))
    .sort((a, b) => (b.atualizadoEm || 0) - (a.atualizadoEm || 0));
}

export const quantasVivas = () => vivas.size;

/** Só para os testes: esquece o que está em memória sem tocar no disco. */
export function esquecerTudo() { vivas.clear(); }

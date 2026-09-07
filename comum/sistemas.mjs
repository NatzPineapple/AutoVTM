/* ============================================================
   VITÆ — Ligar e diagnosticar os sistemas
   ------------------------------------------------------------
   Um lugar só para responder duas perguntas:

     1. o que está de pé?           →  estado()
     2. dá para subir o que falta?  →  ligar()

   O QUE ESTE ARQUIVO NÃO FAZ, E NÃO TEM COMO FAZER: subir o
   próprio servidor. Se você está lendo isto, o servidor já está
   rodando — é ele quem executa este código. Página de navegador
   não liga processo do sistema operacional, e o botão da capa não
   mente sobre isso: quando o proxy não responde, ele diz que o
   proxy é o que falta e mostra o comando.

   Quem liga TUDO do zero é `ferramentas/iniciar.cmd`.

   A §80 acrescentou os MÓDULOS. Antes havia um processo só, e
   "ligado" queria dizer "o ollama respondeu". Agora cada módulo
   tem processo e porta, e a pergunta virou plural: o Gateway está
   de pé (senão você não estaria vendo esta tela), mas o
   MesaServer pode não estar — e sem ele a mesa não abre sessão.
   ============================================================ */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { PORTAS } from './portas.mjs';

const PROJETO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENDERECO_OLLAMA = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

/* ------------------------------------------------------------
   OS MÓDULOS

   Um registro por módulo do desenho. `arquivo` é o que se executa
   para subir; `saude` é o que se pergunta para saber se subiu;
   `encerrar` é a rota que o faz sair sozinho.

   POR QUE PEDIR EM VEZ DE MATAR: `taskkill` no MesaServer perde a
   sessão que estava em memória e ainda não passou pelo autosave.
   A rota de encerrar grava tudo antes de sair. Matar é o plano B,
   e só para quem não responde.

   O ESTADO "PREVISTO" DEIXOU DE EXISTIR NA §84. Ele nasceu na §80,
   quando Ficha, Árbitro e Cronista eram portas reservadas sem
   processo atrás, e servia para o painel não pedir que se ligasse o
   que não havia como ligar. Os cinco módulos existem agora, e uma
   luz oca que nunca acende é folclore — a mesma regra que faz um
   arquivo sair da lista de grandes conhecidos quando encolhe.
   ------------------------------------------------------------ */
export const MODULOS = [
  { id: 'gateway', numero: 1, nome: 'Gateway', porta: PORTAS.gateway,
    saude: '/api/estado', arquivo: 'modulos/gateway/proxy.mjs',
    /* Ele é quem executa este código: não se sobe nem se pergunta. */
    esteProcesso: true,
    nota: 'Serve o app e as campanhas, e encaminha /api para os módulos.' },
  { id: 'ficha', numero: 2, nome: 'FichaServer', porta: PORTAS.ficha,
    saude: '/ficha/saude', encerrar: '/ficha/encerrar',
    arquivo: 'modulos/ficha/ficha-servidor.mjs',
    faltando: 'O checkout usa a ficha que o navegador manda, e o checkin não persiste.',
    nota: 'Guarda as fichas fora de sessão. MongoDB quando houver, pasta quando não.' },
  { id: 'mesa', numero: 3, nome: 'MesaServer', porta: PORTAS.mesa,
    saude: '/mesa/saude', encerrar: '/mesa/encerrar',
    arquivo: 'modulos/mesa/mesa-servidor.mjs',
    faltando: 'A mesa não abre sessão nem faz checkout da ficha.',
    nota: 'O estado da partida ativa: checkout, autosave e checkin.' },
  { id: 'arbitro', numero: 4, nome: 'Árbitro', porta: PORTAS.arbitro,
    saude: '/arbitro/saude', encerrar: '/arbitro/encerrar',
    arquivo: 'modulos/arbitro/arbitro-servidor.mjs',
    faltando: 'As regras só respondem dentro do navegador.',
    nota: 'Stateless: diz quais dados e apura. Não rola — quem rola é a Mesa (§82).' },
  { id: 'cronista', numero: 5, nome: 'Cronista', porta: PORTAS.cronista,
    saude: '/cronista/saude', encerrar: '/cronista/encerrar',
    arquivo: 'modulos/cronista/cronista-servidor.mjs',
    faltando: 'Sem ele o Gateway não tem a quem pedir narração, crônica nem intenção.',
    nota: 'As três camadas de modelo. Sem provedor, elas caem no determinístico.' }
];

export const moduloPor = (id) => MODULOS.find(m => m.id === id) || null;

const enderecoDoModulo = (m) => `http://127.0.0.1:${m.porta}`;

/** Ele responde? O Gateway é o próprio processo: não se pergunta. */
export async function moduloNoAr(m, ms = 1500) {
  return !!(await saudeDoModulo(m, ms));
}

/* O CORPO DA SAÚDE, E NÃO SÓ O SIM/NÃO.  (§86, item M7)

   O painel precisava de mais que "está de pé": para avisar antes de
   desligar, ele precisa saber que HÁ SESSÃO VIVA — e esse número já
   existe, em `/mesa/saude`. Trocar o booleano pelo corpo custa nada e
   destrava o aviso. */
export async function saudeDoModulo(m, ms = 1500) {
  if (m.esteProcesso) return { modulo: m.id, ligado: true };
  try {
    const r = await fetch(`${enderecoDoModulo(m)}${m.saude}`, { signal: AbortSignal.timeout(ms) });
    if (!r.ok) return null;
    return await r.json().catch(() => ({ modulo: m.id, ligado: true }));
  } catch (e) { return null; }
}

/** Sobe o processo do módulo e espera ele atender. */
export async function subirModulo(m, { esperaMs = 12000 } = {}) {
  if (m.esteProcesso) return { ok: true, jaEstava: true };
  if (await moduloNoAr(m)) return { ok: true, jaEstava: true };

  const alvo = path.join(PROJETO, m.arquivo);
  if (!fs.existsSync(alvo)) return { ok: false, motivo: `Não achei ${m.arquivo}.` };

  try {
    const filho = spawn(process.execPath, [alvo], {
      cwd: PROJETO, detached: true, stdio: 'ignore', windowsHide: true });
    filho.unref();
  } catch (e) {
    return { ok: false, motivo: `Não consegui subir ${m.nome}: ${e.message}` };
  }

  const ate = Date.now() + esperaMs;
  while (Date.now() < ate) {
    await new Promise(r => setTimeout(r, 300));
    if (await moduloNoAr(m, 1000)) return { ok: true, jaEstava: false };
  }
  return { ok: false,
    motivo: `${m.nome} foi iniciado e não respondeu em ${Math.round(esperaMs / 1000)}s. `
          + `Rode à mão para ver o erro: node ${m.arquivo}` };
}

/** Pede ao módulo que se encerre, e confere que ele saiu. */
export async function pararModulo(m, { esperaMs = 8000 } = {}) {
  if (m.esteProcesso) return { ok: true, jaEstava: true };
  if (!await moduloNoAr(m)) return { ok: true, jaEstava: true };
  if (!m.encerrar) return { ok: false, motivo: `${m.nome} não tem rota de encerrar.` };

  try {
    /* SEM `Origin`, e isso não é descuido.  (§80)

       A primeira versão mandava `Origin: http://127.0.0.1:<porta do
       Gateway>`. O módulo compara esse cabeçalho com a porta de Gateway
       que ELE conhece — e as duas divergem assim que alguém sobe os dois
       com `PORTA` diferente do padrão. O resultado era 403 no pedido de
       encerrar, e o botão dizendo "continuou respondendo" sem explicar
       por quê. Achado por um órfão de teste, que é exatamente o caso
       real: dois processos subidos em momentos diferentes.

       Sem `Origin`, o módulo cai na outra metade da sua própria regra —
       `Host` de laço local — que é a garantia que de fato importa aqui:
       chamada entre módulos não vem de navegador nenhum. */
    await fetch(`${enderecoDoModulo(m)}${m.encerrar}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(4000)
    });
  } catch (e) {
    /* Conexão cortada é o esperado quando ele sai rápido demais; a
       verificação abaixo é que decide, não este erro. */
    console.warn(`[sistemas] ${m.nome} cortou a conexão ao encerrar: ${e.message}`);
  }

  const ate = Date.now() + esperaMs;
  while (Date.now() < ate) {
    await new Promise(r => setTimeout(r, 300));
    if (!await moduloNoAr(m, 800)) return { ok: true, jaEstava: false };
  }
  return { ok: false, motivo: `${m.nome} continuou respondendo depois do pedido de parada.` };
}

/* Os modelos que cada papel usa. Se mudar o padrão em `narrador.mjs`
   ou `intencao.mjs`, muda aqui junto — e há teste cobrando isso. */
export const PAPEIS = [
  { id: 'narrador', nome: 'Narrador',
    variavel: 'VITAE_MODELO_NARRADOR', padrao: 'mistral-nemo:12b',
    faltando: 'A mesa cai no Narrador simulado: respostas pré-escritas.' },
  { id: 'cronista', nome: 'Cronista',
    variavel: 'VITAE_MODELO', padrao: 'mistral-nemo:12b',
    faltando: 'O fechamento de capítulo e o dossiê saem no modo determinístico.' },
  { id: 'intencao', nome: 'Extrator de intenção',
    variavel: 'VITAE_MODELO_INTENCAO', padrao: 'qwen2.5:7b',
    faltando: 'A leitura do que você escreve fica só no caminho determinístico.' }
];

const modeloDoPapel = (p) => process.env[p.variavel] || p.padrao;

/* ------------------------------------------------------------
   OLLAMA
   ------------------------------------------------------------ */

export async function ollamaNoAr(ms = 2000) {
  try {
    const r = await fetch(`${ENDERECO_OLLAMA}/api/tags`, { signal: AbortSignal.timeout(ms) });
    if (!r.ok) return null;
    const d = await r.json();
    return (d.models || []).map(m => m.name);
  } catch (e) { return null; }
}

/* Onde o ollama costuma estar quando não está no PATH. O instalador do
   Windows põe em LOCALAPPDATA e nem sempre exporta.

   Os CAMINHOS ABSOLUTOS QUE EXISTEM vêm primeiro, e o nome cru por
   último: `spawn('ollama.exe')` depende do PATH, e foi exatamente o
   que falhou na primeira tentativa desta função. */
function caminhosDoOllama() {
  const nome = os.platform() === 'win32' ? 'ollama.exe' : 'ollama';
  const absolutos = [];
  if (process.env.LOCALAPPDATA) {
    absolutos.push(path.join(process.env.LOCALAPPDATA, 'Programs', 'Ollama', nome));
  }
  if (process.env.ProgramFiles) {
    absolutos.push(path.join(process.env.ProgramFiles, 'Ollama', nome));
  }
  absolutos.push('/usr/local/bin/ollama', '/opt/homebrew/bin/ollama', '/usr/bin/ollama');
  return [...absolutos.filter(c => fs.existsSync(c)), nome];
}

/* `spawn` NÃO lança para executável inexistente: ele emite 'error'
   depois, de forma assíncrona. A primeira versão desta função tinha um
   `try/catch` em volta e um `break` — o que fazia ela desistir no
   primeiro candidato, sempre, achando que tinha dado certo. */
function tentarSpawn(exe) {
  return new Promise((resolve) => {
    let respondido = false;
    const fim = (r) => { if (!respondido) { respondido = true; resolve(r); } };
    try {
      const filho = spawn(exe, ['serve'], { detached: true, stdio: 'ignore', windowsHide: true });
      filho.on('error', (e) => fim({ ok: false, motivo: e.message }));
      filho.on('spawn', () => { filho.unref(); fim({ ok: true }); });
      setTimeout(() => fim({ ok: true }), 1500);   /* sem evento: seguiu vivo */
    } catch (e) { fim({ ok: false, motivo: e.message }); }
  });
}

/** Sobe `ollama serve` solto do processo pai e espera ele atender. */
export async function subirOllama({ esperaMs = 25000 } = {}) {
  if (await ollamaNoAr()) return { ok: true, jaEstava: true };

  const candidatos = caminhosDoOllama();
  const erros = [];
  let subiu = false;
  for (const exe of candidatos) {
    const r = await tentarSpawn(exe);
    if (r.ok) { subiu = true; break; }
    erros.push(`${exe}: ${r.motivo}`);
  }
  if (!subiu) {
    return { ok: false, motivo: 'Não achei o ollama nesta máquina. Instale em ollama.com, '
      + 'ou rode `ollama serve` à mão. Tentei: ' + erros.join(' · ') };
  }

  const ate = Date.now() + esperaMs;
  while (Date.now() < ate) {
    await new Promise(r => setTimeout(r, 700));
    const modelos = await ollamaNoAr(1500);
    if (modelos) return { ok: true, jaEstava: false, modelos };
  }
  return { ok: false,
    motivo: `O ollama foi iniciado e não respondeu em ${Math.round(esperaMs / 1000)}s. `
          + 'Na primeira vez ele demora mais; tente de novo em alguns segundos.' };
}

/* ------------------------------------------------------------
   DESLIGAR

   Ligar é conveniência; desligar é liberar memória. Um 12B carregado
   ocupa vários gigabytes de RAM ou VRAM, e quem termina de jogar
   costuma querer isso de volta sem procurar o Gerenciador de Tarefas.

   O que este arquivo NÃO decide: se o ollama era seu antes. Ele pode
   estar servindo outra coisa nesta máquina, e por isso o botão diz o
   que vai parar, e a interface pede dois cliques.
   ------------------------------------------------------------ */

function comandoDeParada() {
  if (os.platform() === 'win32') return ['taskkill', ['/IM', 'ollama.exe', '/F', '/T']];
  return ['pkill', ['-f', 'ollama']];
}

export async function pararOllama({ esperaMs = 8000 } = {}) {
  if (!await ollamaNoAr()) return { ok: true, jaEstava: true };

  const [exe, args] = comandoDeParada();
  const falha = await new Promise((resolve) => {
    try {
      const filho = spawn(exe, args, { stdio: 'ignore', windowsHide: true });
      filho.on('close', () => resolve(null));
      filho.on('error', (e) => resolve(e.message));
      setTimeout(() => resolve(null), 4000);
    /* `return resolve(...)` e não `resolve(...)` de propósito: a regra
       da §44 quer ver a saída explícita, e `resolve` sozinho é o que
       ela pega quando alguém engole o erro. */
    } catch (e) { return resolve(e.message); }
  });
  if (falha) console.warn(`[sistemas] ${exe} falhou: ${falha}`);

  const ate = Date.now() + esperaMs;
  while (Date.now() < ate) {
    await new Promise(r => setTimeout(r, 400));
    if (!await ollamaNoAr(1000)) return { ok: true, jaEstava: false };
  }
  return { ok: false, motivo: 'O ollama continuou respondendo depois do pedido de parada.' };
}

/** Desliga o que foi pedido, NA ORDEM CERTA.

    A ordem não é gosto: os módulos saem primeiro porque o MesaServer
    grava as sessões ao encerrar, e ele precisa do disco e do próprio
    laço de eventos para isso. Depois vai o ollama, que é memória. O
    Gateway sai por último, e quem o encerra é ele mesmo — este arquivo
    só diz que é para encerrar. */
export async function desligar({ ollama = true, modulos = true } = {}) {
  const passos = [];

  if (modulos) {
    for (const m of MODULOS) {
      if (m.esteProcesso) continue;
      const r = await pararModulo(m);
      passos.push({ passo: m.id, ok: r.ok,
        texto: r.ok ? (r.jaEstava ? `${m.nome} já estava parado.` : `${m.nome} encerrado.`)
                    : r.motivo });
    }
  }

  if (ollama) {
    const r = await pararOllama();
    passos.push({ passo: 'ollama', ok: r.ok,
      texto: r.ok ? (r.jaEstava ? 'O ollama já estava parado.' : 'Ollama desligado.') : r.motivo });
  }

  return { passos, ...(await estado()) };
}

/* ------------------------------------------------------------
   O DIAGNÓSTICO
   ------------------------------------------------------------ */

function campanhas() {
  const dir = path.join(PROJETO, 'campanhas');
  try { return fs.readdirSync(dir).filter(f => f.endsWith('.md')); }
  catch (e) { return []; }
}

/** Uma linha por MÓDULO: processo e porta. Separado das linhas de
    recurso de propósito — "o MesaServer está no ar" e "o Narrador tem
    modelo instalado" são perguntas de natureza diferente, e misturá-las
    numa lista só foi o que fez o painel da §75 dizer "6 fora" quando o
    que faltava era um `ollama pull`. */
async function estadoDosModulos() {
  const fora = [];
  for (const m of MODULOS) {
    const saude = await saudeDoModulo(m);
    const ligado = !!saude;
    fora.push({
      id: m.id, numero: m.numero, nome: m.nome, porta: m.porta,
      ligado,
      podeLigar: !m.esteProcesso,
      detalhe: `porta ${m.porta}`,
      nota: m.nota || '',
      faltando: ligado ? '' : (m.faltando || ''),
      comando: m.arquivo ? `node ${m.arquivo}` : '',
      /* O que o módulo tem EM ANDAMENTO. Hoje só o MesaServer responde
         alguma coisa aqui, e é disto que o aviso de desligar vive. (§86) */
      sessoesVivas: (saude && Number(saude.sessoesVivas)) || 0
    });
  }
  return fora;
}

/** Uma linha por sistema, com o motivo quando está fora. */
export async function estado() {
  const modelos = await ollamaNoAr();
  const instalados = modelos || [];
  const temModelo = (m) => instalados.some(x => x === m || x.split(':')[0] === m.split(':')[0]);
  const modulos = await estadoDosModulos();

  const linhas = [{
    id: 'servidor', nome: 'Servidor', ligado: true,
    detalhe: `porta ${process.env.PORTA || 5173}`,
    /* Ele responde, logo está de pé — a pergunta só existe do lado
       do navegador, onde a ausência de resposta é a resposta. */
    nota: 'Serve o app e as campanhas, e encaminha /api.'
  }, {
    id: 'ollama', nome: 'Ollama', ligado: !!modelos,
    detalhe: modelos ? `${instalados.length} modelo(s)` : 'não responde',
    nota: modelos ? ENDERECO_OLLAMA : 'Sem ele, nenhuma IA responde.'
  }];

  for (const p of PAPEIS) {
    const modelo = modeloDoPapel(p);
    const ligado = !!modelos && temModelo(modelo);
    linhas.push({
      id: p.id, nome: p.nome, ligado,
      detalhe: modelo,
      nota: ligado ? '' : (!modelos ? 'Depende do ollama.' : `Modelo não instalado: ollama pull ${modelo}`),
      faltando: ligado ? '' : p.faltando
    });
  }

  const md = campanhas();
  linhas.push({
    id: 'campanhas', nome: 'Campanhas', ligado: md.length > 0,
    detalhe: `${md.length} arquivo(s)`,
    nota: md.length ? 'Servidas por /campanhas/.' : 'Nenhum .md em campanhas/.'
  });


  return {
    modulos, linhas,
    tudoLigado: linhas.every(l => l.ligado) && modulos.every(m => m.ligado),
    modelosInstalados: instalados
  };
}

/** Sobe o que der, e devolve o diagnóstico depois de tentar.

    Os módulos vêm ANTES do ollama porque são baratos — sobem em
    menos de um segundo — e porque o ollama pode demorar meio minuto
    na primeira partida. Quem está olhando o painel vê o que é rápido
    ficar verde primeiro. */
export async function ligar({ modulos = true, ollama = true } = {}) {
  const passos = [];

  if (modulos) {
    for (const m of MODULOS) {
      if (m.esteProcesso) continue;
      const r = await subirModulo(m);
      passos.push({ passo: m.id, ok: r.ok,
        texto: r.ok ? (r.jaEstava ? `${m.nome} já estava de pé.` : `${m.nome} iniciado.`)
                    : r.motivo });
    }
  }

  if (ollama) {
    if (await ollamaNoAr()) {
      passos.push({ passo: 'ollama', ok: true, texto: 'O ollama já estava de pé.' });
    } else {
      const r = await subirOllama();
      passos.push({ passo: 'ollama', ok: r.ok, texto: r.ok ? 'Ollama iniciado.' : r.motivo });
    }
  }

  const depois = await estado();
  /* Modelo que falta não se baixa sozinho: `ollama pull` são gigabytes,
     e isso é decisão de quem está na máquina, não do botão. */
  for (const l of depois.linhas) {
    if (!l.ligado && /ollama pull/.test(l.nota || '')) {
      passos.push({ passo: l.id, ok: false, texto: l.nota });
    }
  }
  return { passos, ...depois };
}

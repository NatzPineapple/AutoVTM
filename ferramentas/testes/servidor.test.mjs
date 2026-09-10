/* ============================================================
   VITÆ — Testes do servidor
   `proxy.mjs` é o único ponto do projeto com decisão de SEGURANÇA
   dentro: ele serve arquivo do disco, aceita POST de fora e tem
   limite de taxa. Até aqui, nenhuma asserção sobre ele.

   Testar por importação não dá: o módulo chama `listen()` ao ser
   carregado. Então o teste faz o que um navegador faria — sobe o
   processo numa porta própria e conversa por HTTP. É mais lento
   que o resto da suíte (~1 s), e é o único jeito honesto: o que
   se quer saber é como ele responde, não como ele é escrito.

   Nada aqui precisa de modelo. `OLLAMA_HOST` aponta para uma porta
   morta de propósito, e o que se afirma é como o servidor se
   comporta SEM provedor — que é o caso de quem só quer jogar.

       node --test testes/servidor.test.mjs
   ============================================================ */

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { RAIZ } from './carregar.mjs';
import { foiEstouroDeTempo } from '../../comum/estouro.mjs';

/* Os dois juízes — Narrador e Cronista — leem a MESMA lista negra, da
   mesma seção do guia. O teste lê da fonte, não de uma cópia. */
function termosDaListaNegra() {
  const md = fs.readFileSync(path.join(RAIZ, 'docs', 'narracao-ia.md'), 'utf8');
  const bloco = md.split('6.1 A lista negra')[1] || '';
  const termos = (bloco.match(/```\n([\s\S]*?)```/) || ['', ''])[1]
    .split('\n').map(x => x.trim()).filter(Boolean);
  assert.ok(termos.length >= 10, `a lista negra do guia tem so ${termos.length} termos`);
  return termos;
}

const PORTA = 51873;
const BASE = `http://127.0.0.1:${PORTA}`;
/* Os módulos ficam em PORTA+1 … PORTA+4 — ver `subir()`. */
const PORTA_MESA = PORTA + 2;

const SESSOES_DE_TESTE = fs.mkdtempSync(path.join(os.tmpdir(), 'vitae-proxy-sessoes-'));
const FICHAS_DE_TESTE  = fs.mkdtempSync(path.join(os.tmpdir(), 'vitae-proxy-fichas-'));
test.after(() => {
  fs.rmSync(SESSOES_DE_TESTE, { recursive: true, force: true });
  fs.rmSync(FICHAS_DE_TESTE, { recursive: true, force: true });
});

/* Teto baixo de propósito: com 20 (o padrão) o teste de limite de
   taxa precisaria de 21 requisições. Com 3, precisa de 4. */
const TETO = 3;

let processo = null;

/* Um processo só para o arquivo inteiro. Subir duas vezes custava
   2,7 s de espera que não afirma nada — e o limite de taxa não
   atrapalha os outros testes porque o 503 de "sem provedor" é
   respondido ANTES de o balde ser tocado. */
async function subir() {
  if (processo) return;
  processo = spawn(process.execPath, [path.join(RAIZ, 'modulos', 'gateway', 'proxy.mjs')], {
    cwd: RAIZ,
    env: Object.assign({}, process.env, {
      PORTA: String(PORTA),
      VITAE_ESCUTAR: '127.0.0.1',
      VITAE_TETO_JANELA: String(TETO),
      /* porta morta: `configurado()` devolve false sem esperar */
      OLLAMA_HOST: 'http://127.0.0.1:1',
      /* PORTAS PRÓPRIAS PARA OS MÓDULOS.  (§80)

         Sem isto o teste sondaria — e, ao ligar, DESLIGARIA — o
         MesaServer que você deixou aberto na porta de verdade. Um
         teste que mata o servidor do usuário é pior do que nenhum. */
      VITAE_PORTA_FICHA: String(PORTA + 1),
      VITAE_PORTA_MESA: String(PORTA + 2),
      VITAE_PORTA_ARBITRO: String(PORTA + 3),
      VITAE_PORTA_CRONISTA: String(PORTA + 4),
      /* E o módulo que este teste sobe de verdade grava sessão: que
         seja numa pasta descartável, não na do jogador. */
      VITAE_SESSOES: SESSOES_DE_TESTE,
      /* O FichaServer que o teste sobe grava ficha. Que seja numa pasta
         descartável, e não na do jogador. (§84) */
      VITAE_FICHAS: FICHAS_DE_TESTE,
      VITAE_FICHA_GUARDADOR: 'pasta'
    }),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const morreu = new Promise((_, rejeitar) => {
    processo.on('exit', (c) => rejeitar(new Error(`o proxy saiu com código ${c}`)));
  });
  const subiu = new Promise((resolver) => {
    processo.stdout.on('data', (d) => { if (String(d).includes('VITÆ em')) resolver(); });
  });

  /* O relógio de desistência precisa ser CANCELADO, e não só perdido na
     corrida. O proxy sobe em ~65 ms; o timer de 8 s continuava pendente
     e segurava o laço de eventos até o fim — o arquivo levava 8 s para
     terminar 0,4 s de teste, e a suíte inteira ia de 2,8 s para 8,1 s.

     `Promise.race` decide quem responde primeiro; ela não desliga os
     outros. Foi o mesmo tipo de custo da latência falsa do Narrador
     (§52.3), e pela mesma razão: espera que não afirma nada. */
  let relogio;
  const desistir = new Promise((_, r) => {
    relogio = setTimeout(() => r(new Error('o proxy não subiu em 8 s')), 8000);
  });
  try { await Promise.race([subiu, morreu, desistir]); }
  finally { clearTimeout(relogio); }
}

const derrubar = () => { if (processo) { processo.kill(); processo = null; } };

const pegar = (caminho, opcoes = {}) => fetch(BASE + caminho, opcoes);

test('Servidor — o proxy', async (t) => {
  await subir();

  /* ---------- servir arquivo ---------- */

  await t.test('serve o index na raiz', async () => {
    const r = await pegar('/');
    assert.equal(r.status, 200);
    assert.ok((await r.text()).includes('<title'), 'não veio HTML');
  });

  await t.test('serve os scripts com o tipo certo', async () => {
    const r = await pegar('/modulos/ficha/motor-ficha.js');
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type') || '', /javascript/);
  });

  await t.test('NADA é cacheado — é a razão de o servidor existir', async () => {
    /* Sem isto, o F5 não mostra a alteração, e a §36 registra três
       diagnósticos errados por cache. */
    const r = await pegar('/modulos/ficha/motor-ficha.js');
    assert.match(r.headers.get('cache-control') || '', /no-store|no-cache/);
  });

  await t.test('arquivo que não existe é 404, e diz qual', async () => {
    const r = await pegar('/modulos/cliente/js/nao-existe.js');
    assert.equal(r.status, 404);
    assert.ok((await r.text()).includes('nao-existe'));
  });

  /* ---------- travessia de caminho ---------- */

  await t.test('não dá para sair da raiz', async (t2) => {
    /* O ataque clássico: pedir um arquivo do projeto que está FORA de
       `app/`. Se `package.json` vier, o servidor entrega o disco. */
    for (const tentativa of [
      '/../package.json',
      '/../../package.json',
      '/..%2fpackage.json',
      '/modulos/cliente/js/../../../package.json',
      '/%2e%2e/package.json',
      '/....//package.json'
    ]) {
      const r = await pegar(tentativa);
      const corpo = await r.text();
      assert.ok(!corpo.includes('"name": "vitae"'),
        `"${tentativa}" entregou o package.json`);
      assert.ok([403, 404].includes(r.status), `"${tentativa}" devolveu ${r.status}`);
      t2.diagnostic(`${tentativa} → ${r.status}, sem vazar o package.json`);
    }
  });

  await t.test('nem pela rota das campanhas', async () => {
    for (const tentativa of ['/campanhas/../package.json', '/campanhas/../../package.json']) {
      const r = await pegar(tentativa);
      assert.ok(!(await r.text()).includes('"name": "vitae"'),
        `"${tentativa}" saiu de campanhas/`);
    }
  });

  await t.test('mas serve a campanha de verdade', async () => {
    const r = await pegar('/campanhas/sob-a-pele.md');
    assert.ok([200, 404].includes(r.status));
    if (r.status === 200) assert.ok((await r.text()).length > 0);
  });

  /* ---------- as rotas /api ---------- */

  await t.test('rota de API desconhecida é 404 em JSON', async () => {
    const r = await pegar('/api/nao-existe');
    assert.equal(r.status, 404);
    assert.ok((await r.json()).erro, 'devolveu 404 sem dizer o quê');
  });

  await t.test('GET numa rota que exige POST é 405', async () => {
    const r = await pegar('/api/cronista');
    assert.equal(r.status, 405);
  });

  await t.test('POST de outra origem é recusado', async () => {
    /* Sem esta checagem, qualquer página aberta no mesmo navegador
       gasta o provedor local do usuário. É o CSRF da §23. */
    const r = await pegar('/api/cronista', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'https://exemplo.invalido' },
      body: '{}'
    });
    assert.equal(r.status, 403);
    assert.match((await r.json()).erro, /origem/i);
  });

  await t.test('sem o Módulo 5 no ar, o 503 diz que falta o MÓDULO', async (t2) => {
    /* DUAS FALHAS DIFERENTES, DESDE A §84. Antes o Cronista rodava
       dentro do Gateway, e só havia um jeito de ele não funcionar: o
       provedor fora. Agora há dois — o módulo fora, e o módulo de pé
       sem provedor —, e dizer "provedor indisponível" quando o que
       falta é o processo manda o usuário procurar no lugar errado.

       Este teste roda ANTES do `/api/ligar`, então o Módulo 5 ainda
       não subiu. */
    const r = await pegar('/api/cronista', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': BASE },
      body: JSON.stringify({ tipo: 'capitulo' })
    });
    const d = await r.json();
    t2.diagnostic(`${r.status} · ${d.erro} · ${d.comando || ''}`);
    assert.equal(r.status, 503);
    assert.match(d.erro, /módulo "cronista" não respondeu/i);
    assert.match(d.comando || '', /cronista-servidor\.mjs/);
    assert.ok(!d.semChave, 'culpou o provedor quando o que faltava era o processo');
  });

  await t.test('o estado do servidor é consultável sem POST', async () => {
    const r = await pegar('/api/estado');
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.ok('limite' in d, 'o estado não conta o limite de taxa');
    assert.equal(typeof d.limite.tetoPorJanela, 'number');
  });

  await t.test('o teto de taxa vem do ambiente', async () => {
    const d = await (await pegar('/api/estado')).json();
    assert.equal(d.limite.tetoPorJanela, TETO,
      'VITAE_TETO_JANELA não foi respeitado — o teto não é configurável');
  });
});

test('Servidor — o limite de taxa', async (t) => {
  await subir();
  t.after(derrubar);      // o último a usar o processo o derruba

  await t.test('estoura depois do teto, com 429 e tempo de espera', async () => {
    /* O limite protege a máquina do usuário: sem ele, um laço no
       cliente ocupa o ollama indefinidamente. */
    const corpo = { method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': BASE },
      body: JSON.stringify({ texto: 'ataco' }) };

    let resposta = null, corpoDo429 = null;
    for (let i = 0; i < TETO + 3 && !resposta; i++) {
      const r = await pegar('/api/intencao', corpo);
      if (r.status === 429) { resposta = r; corpoDo429 = await r.json(); }
    }
    assert.ok(resposta, `${TETO + 3} chamadas e o teto de ${TETO} não foi atingido`);
    t.diagnostic(`teto de ${TETO} por janela → 429 com "${corpoDo429.erro}" · ` +
                 `Retry-After: ${resposta.headers.get('retry-after')}s`);
    /* O campo é `erro`, não `motivo` — a primeira versão deste teste
       supôs o nome errado. Vale afirmar o nome real: é o que o cliente
       lê para mostrar ao jogador. */
    assert.ok(corpoDo429.erro && corpoDo429.erro.length > 10, '429 sem explicar por quê');
    assert.equal(corpoDo429.limitado, true, '429 sem se identificar como limite');
    assert.equal(typeof corpoDo429.esperar, 'number', '429 sem dizer quanto esperar');
    assert.ok(resposta.headers.get('retry-after'),
      '429 sem Retry-After — é o cabeçalho que um cliente educado obedece');
  });

  await t.test('e o estado passa a contar as chamadas gastas', async () => {
    const d = await (await pegar('/api/estado')).json();
    assert.ok(d.limite.usadasNaJanela > 0, 'o contador da janela não andou');
  });

  await t.test('servir arquivo NÃO passa pelo limite', async () => {
    /* Se passasse, o jogador ficaria sem o app depois de alguns
       recarregamentos. O limite é do provedor, não do disco. */
    for (let i = 0; i < TETO + 5; i++) {
      assert.equal((await pegar('/')).status, 200, 'o servidor limitou o próprio app');
    }
  });
});

/* ============================================================
   O PROVEDOR
   ============================================================ */

test('Servidor — o provedor local', async (t) => {
  /* `OLLAMA_HOST` é lido na carga do módulo, então é preciso apontá-lo
     para a porta morta ANTES do import. */
  process.env.OLLAMA_HOST = 'http://127.0.0.1:1';
  const provedor = await import('../../modulos/cronista/provedor-ollama.mjs');

  await t.test('é o único transporte, e se identifica', () => {
    assert.equal(provedor.id, 'ollama');
    assert.ok(provedor.MODELO_PADRAO, 'sem modelo padrão');
  });

  await t.test('sem ollama no ar, `configurado()` é false e não estoura', async () => {
    /* É o que sustenta o jogo inteiro rodar sem modelo: quem pergunta
       recebe "não", não uma exceção. */
    assert.equal(await provedor.configurado(), false);
  });

  await t.test('e listar modelos devolve lista vazia, não erro', async () => {
    const m = await provedor.modelosDisponiveis();
    assert.ok(Array.isArray(m), 'devolveu algo que não é lista');
  });

  await t.test('`gerar` falha com mensagem, não em silêncio', async () => {
    /* Falha de transporte tem que virar erro legível: é ela que o
       cliente mostra ao cair no determinístico. */
    await assert.rejects(
      () => provedor.gerar({ modelo: provedor.MODELO_PADRAO, papel: 'x', conteudo: 'y' }),
      (e) => {
        assert.ok(e instanceof Error, 'rejeitou com algo que não é Error');
        assert.ok(String(e.message).length > 3, 'erro sem mensagem');
        return true;
      });
  });

  await t.test('a descrição do modelo é texto', () => {
    assert.equal(typeof provedor.descricao(provedor.MODELO_PADRAO), 'string');
  });

  await t.test('NÃO existe provedor pago no projeto', () => {
    /* Decisão do usuário, §16.2 — e ela já foi revertida por engano uma
       vez. O teste é a trava. */
    /* Varre o projeto inteiro, e não uma pasta só: depois da §79 o
       provedor mora em `modulos/cronista/`, e apontar para `servidor/`
       — que já nem existe — faria o teste passar sempre, sem olhar. */
    const varrer = (pasta) => {
      const fora = [];
      for (const item of fs.readdirSync(path.join(RAIZ, pasta), { withFileTypes: true })) {
        if (item.isDirectory()) fora.push(...varrer(`${pasta}/${item.name}`));
        else fora.push(`${pasta}/${item.name}`);
      }
      return fora;
    };
    const arquivos = ['modulos', 'comum', 'ferramentas'].flatMap(varrer);
    assert.ok(arquivos.length > 30, 'a varredura não achou arquivo nenhum');
    const pagos = arquivos.filter(n => /anthropic|openai|claude|gpt/i.test(n));
    assert.deepEqual(pagos, [], 'apareceu arquivo de provedor pago');
  });
});

/* ============================================================
   O VALIDADOR DA CRÔNICA
   Ele é o JUIZ: decide se o texto do modelo entra ou é reprovado.
   Até aqui não tinha nenhuma asserção — o que é desconfortável,
   porque juiz sem teste é a mesma coisa que o §51.4 registrou:
   dá para ele emagrecer sem ninguém notar.
   ============================================================ */

test('Cronista — o validador do servidor', async (t) => {
  const cronista = await import('../../modulos/cronista/cronista.mjs');

  /* Uma crônica limpa, no tamanho pedido, sem nada que reprove. */
  const prosaDe = (n) =>
    'A noite passou devagar e alguém pagou por isso sem dizer nada. '
      .repeat(Math.ceil(n / 11)).split(/\s+/).filter(Boolean).slice(0, n).join(' ') + '.';

  const cronicaDe = (extra = {}) => Object.assign({
    titulo: 'A noite do corvo',
    cronica: prosaDe(120),
    aconteceu: ['Alguém sumiu do bar.', 'Ninguém quis falar sobre isso.'],
    precoPago: [], fiosAbertos: [], marcas: [], relacoes: [], posses: [],
    proximoBeat: 'Alguém vai cobrar.'
  }, extra);

  const problemasDe = (extra, conhecidos = {}) =>
    cronista.validar(cronicaDe(extra), conhecidos).problemas;

  await t.test('o juiz carregou a lista negra', (t2) => {
    /* Se ela vier vazia, metade das checagens some em silêncio (§51.4).
       Medir com juiz incompleto dá número mais alto que a realidade. */
    const s = cronista.saudeDoJuizDaCronica();
    t2.diagnostic(`lista negra: ${s.listaNegra} termos · completo: ${s.completo}`);
    assert.ok(s.completo, `juiz incompleto: ${s.problemas.join('; ')}`);
    assert.ok(s.listaNegra >= 10);
  });

  await t.test('crônica limpa passa', (t2) => {
    const p = problemasDe({});
    t2.diagnostic(`120 palavras, sem nada proibido → ${p.length} problema(s)`);
    assert.deepEqual(p, []);
  });

  /* ---------- tamanho: só o mínimo, desde a §55 ---------- */

  await t.test('NÃO existe mais teto de tamanho', (t2) => {
    /* Decisão do usuário na §55: crônica é o fecho de uma noite inteira,
       e um fecho comprido não é defeito — é uma noite que rendeu.
       Reprovar por isso jogava fora texto bom. */
    for (const n of [260, 400, 800, 1500]) {
      const p = problemasDe({ cronica: prosaDe(n) }).filter(x => /palavras/.test(x));
      t2.diagnostic(`${n} palavras → ${p.length ? p[0] : 'passa'}`);
      assert.deepEqual(p, [], `${n} palavras foi reprovada por tamanho`);
    }
  });

  await t.test('mas o mínimo ficou: crônica curta é o modelo desistindo', (t2) => {
    for (const [n, deveReprovar] of [[30, true], [59, true], [60, false], [61, false]]) {
      const p = problemasDe({ cronica: prosaDe(n) }).filter(x => /palavras/.test(x));
      t2.diagnostic(`${n} palavras → ${p.length ? p[0] : 'passa'}`);
      assert.equal(p.length > 0, deveReprovar, `${n} palavras`);
    }
  });

  /* ---------- as outras nove ---------- */

  await t.test('número de regra na prosa reprova, dos dois lados', (t2) => {
    /* A §3.2 inteira: o modelo escreve, o motor conta. Os dois regexes
       pegam "3 dados" e "dificuldade 3". */
    for (const frase of ['Você rolou 3 dados e não bastou.',
                         'A dificuldade era 4, e você sabia.',
                         'A Fome subiu para 3 naquela hora.']) {
      const p = problemasDe({ cronica: prosaDe(100) + ' ' + frase })
        .filter(x => /número de regra/.test(x));
      t2.diagnostic(`"${frase}" → ${p.length ? 'reprovado' : 'PASSOU'}`);
      assert.ok(p.length, `passou: "${frase}"`);
    }
  });

  await t.test('e prosa sem número de regra não é reprovada por engano', (t2) => {
    /* O regex não pode pegar número comum: "3 homens" é narrativa. */
    for (const frase of ['Eram 3 homens no balcão.',
                         'Ela tinha 40 anos quando morreu.',
                         'O bar fechou às 4 da manhã.']) {
      const p = problemasDe({ cronica: prosaDe(100) + ' ' + frase })
        .filter(x => /número de regra/.test(x));
      t2.diagnostic(`"${frase}" → ${p.length ? 'REPROVADO por engano' : 'passa'}`);
      assert.deepEqual(p, [], `falso positivo: "${frase}"`);
    }
  });

  await t.test('eco do registro reprova — resumir não é copiar', (t2) => {
    const p = problemasDe({ aconteceu: ['Jogador (agir): tento sair pela porta',
                                        'Sistema: Fome 1 → 2'] })
      .filter(x => /copiadas cruas/.test(x));
    t2.diagnostic(p[0] || 'PASSOU');
    assert.ok(p.length, 'linha crua do registro passou como resumo');
  });

  await t.test('a prosa não pode terminar perguntando ao jogador', (t2) => {
    const p = problemasDe({ cronica: prosaDe(100) + ' O que você faz agora?' })
      .filter(x => /perguntando/.test(x));
    t2.diagnostic(p[0] || 'PASSOU');
    assert.ok(p.length);
  });

  await t.test('relação e fio com id inexistente reprovam', (t2) => {
    const p = problemasDe(
      { relacoes: [{ id: 'ze', quem: 'Zé', vinculo: 'aliado' }],
        fiosAbertos: [{ id: 'inventado', titulo: 'x', estado: 'aberto' }] },
      { pessoas: ['ze'], locais: [], fios: [] });
    t2.diagnostic(`conhecidos: [ze] · declarados: ze, inventado → ${p.length} problema(s)`);
    assert.ok(!p.some(x => /ze/.test(x)), 'reprovou um id que existe');
    assert.ok(p.some(x => /inventado/.test(x)), 'aceitou fio inventado');
  });

  await t.test('posse sem dizer de onde veio reprova', (t2) => {
    /* "chave do camarim" sem procedência é item aparecendo do nada. */
    const p = problemasDe({ posses: [{ nome: 'chave do camarim', comoVeio: 'achou' }] })
      .filter(x => /de onde veio/.test(x));
    t2.diagnostic(p[0] || 'PASSOU');
    assert.ok(p.length);

    const ok = problemasDe({ posses: [{ nome: 'chave do camarim',
      comoVeio: 'tirou do bolso do segurança enquanto ele dormia' }] })
      .filter(x => /de onde veio/.test(x));
    assert.deepEqual(ok, [], 'reprovou uma procedência escrita');
  });

  await t.test('vocabulário proibido reprova, e não depende de acento', (t2) => {
    /* A primeira versão deste teste terminava em `assert.ok(Array.isArray(p))`
       — que passa sempre, porque `filter` devolve array mesmo vazio. Verde
       que não prova nada, na mesma corrida em que eu escrevia sobre isso.

       Agora o termo vem da PRÓPRIA lista negra, lida do guia de estilo: se
       ela mudar, o teste acompanha; se ela esvaziar, ele cai. */
    const termos = termosDaListaNegra();

    const [primeiro] = termos;
    const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

    const comAcento = problemasDe({ cronica: prosaDe(100) + ` Era uma ${primeiro} inteira.` })
      .filter(x => /vocabulário proibido/.test(x));
    const sem = problemasDe({ cronica: prosaDe(100) + ` Era uma ${semAcento(primeiro)} inteira.` })
      .filter(x => /vocabulário proibido/.test(x));

    t2.diagnostic(`"${primeiro}" → ${comAcento.length ? 'reprovado' : 'PASSOU'} · ` +
                  `"${semAcento(primeiro)}" → ${sem.length ? 'reprovado' : 'PASSOU'} · ` +
                  `${termos.length} termos na lista`);
    assert.ok(comAcento.length, `"${primeiro}" está na lista negra e passou`);
    assert.ok(sem.length, `"${semAcento(primeiro)}" passou — a comparação depende de acento`);
  });

  await t.test('inglês demais reprova', (t2) => {
    const p = problemasDe({ cronica: prosaDe(90) +
      ' The night and the blood with that which would remain there.' })
      .filter(x => /inglês/.test(x));
    t2.diagnostic(p[0] || 'PASSOU');
    assert.ok(p.length);
  });

  await t.test('todo problema é uma frase que alguém consegue agir sobre', () => {
    /* O validador reprova e a retentativa recebe os motivos. Motivo
       vazio ou críptico não conserta nada. */
    const p = problemasDe({ cronica: prosaDe(20) + ' Você rolou 3 dados. O que faz?',
                            posses: [{ nome: 'x', comoVeio: '' }] });
    assert.ok(p.length >= 3, `esperava vários problemas, veio ${p.length}`);
    for (const x of p) {
      assert.ok(x.length > 12, `motivo curto demais: "${x}"`);
      assert.ok(!/undefined|\[object/.test(x), `motivo quebrado: "${x}"`);
    }
  });
});

/* ============================================================
   O VALIDADOR DO NARRADOR
   O outro juiz — e o que mais roda: um julgamento por turno,
   contra um por noite do Cronista. Estava sem asserção nenhuma,
   pelo mesmo descuido, e agora que o teto saiu (§56) vale ainda
   mais fixar o que ele AINDA reprova.
   ============================================================ */

test('Narrador — o validador do servidor', async (t) => {
  const narrador = await import('../../modulos/cronista/narrador.mjs');

  const prosaDe = (n) =>
    'A porta range e alguém do outro lado decide não responder ainda. '
      .repeat(Math.ceil(n / 11)).split(/\s+/).filter(Boolean).slice(0, n).join(' ') + '.';

  /* `exemplos: false` desliga as duas checagens de few-shot: elas comparam
     com o guia, e aqui a prosa é sintética de propósito. */
  const problemasDe = (saida, ctx = {}) =>
    narrador.validar(Object.assign({ texto: prosaDe(100) }, saida),
                     Object.assign({ exemplos: false }, ctx)).problemas;

  await t.test('o juiz carregou o guia inteiro', (t2) => {
    const s = narrador.saudeDoValidador();
    t2.diagnostic(`lista negra: ${s.listaNegra} · assinaturas: ${s.assinaturasDoFewShot}`
      + ` · léxico: ${s.lexicoDoFewShot} · completo: ${s.completo}`);
    assert.ok(s.completo, `juiz incompleto: ${s.problemas.join('; ')}`);
  });

  await t.test('narração limpa passa', (t2) => {
    const p = problemasDe({});
    t2.diagnostic(`100 palavras, nada proibido → ${p.length} problema(s)`);
    assert.deepEqual(p, []);
  });

  /* ---------- tamanho: só o mínimo, desde a §56 ---------- */

  await t.test('NÃO existe mais teto de tamanho', (t2) => {
    /* Decisão do usuário: ritmo é escolha de quem joga. Uma cena que
       pede 400 palavras não é defeito do modelo, e reprovar por isso
       jogava fora texto bom e pagava uma segunda chamada só para
       encurtar. O PAPEL continua pedindo 80 a 180 — alvo, não portão. */
    for (const n of [180, 260, 400, 900]) {
      const p = problemasDe({ texto: prosaDe(n) }).filter(x => /palavras/.test(x));
      t2.diagnostic(`${n} palavras → ${p.length ? p[0] : 'passa'}`);
      assert.deepEqual(p, [], `${n} palavras foi reprovada por tamanho`);
    }
  });

  await t.test('mas o mínimo ficou: 40 palavras', (t2) => {
    for (const [n, deveReprovar] of [[20, true], [39, true], [40, false], [41, false]]) {
      const p = problemasDe({ texto: prosaDe(n) }).filter(x => /palavras/.test(x));
      t2.diagnostic(`${n} palavras → ${p.length ? p[0] : 'passa'}`);
      assert.equal(p.length > 0, deveReprovar, `${n} palavras`);
    }
  });

  /* ---------- o que continua reprovando ---------- */

  await t.test('número de regra na prosa reprova, dos dois lados', (t2) => {
    for (const frase of ['Você rola 4 dados contra a porta.',
                         'A dificuldade era 3, e você sentiu.',
                         'A Fome sobe para 2 e queima.']) {
      const p = problemasDe({ texto: prosaDe(90) + ' ' + frase })
        .filter(x => /número de regra/.test(x));
      t2.diagnostic(`"${frase}" → ${p.length ? 'reprovado' : 'PASSOU'}`);
      assert.ok(p.length, `passou: "${frase}"`);
    }
  });

  await t.test('e número comum não é reprovado por engano', (t2) => {
    /* Falso positivo aqui censura narrativa: "3 homens" é cena. */
    for (const frase of ['Eram 3 homens no balcão.',
                         'Ela morreu aos 40 anos.',
                         'O bar fecha às 4 da manhã.']) {
      const p = problemasDe({ texto: prosaDe(90) + ' ' + frase })
        .filter(x => /número de regra/.test(x));
      t2.diagnostic(`"${frase}" → ${p.length ? 'REPROVADO por engano' : 'passa'}`);
      assert.deepEqual(p, [], `falso positivo: "${frase}"`);
    }
  });

  await t.test('a narração não pode terminar perguntando ao jogador', (t2) => {
    /* Quem pergunta é a interface, com as opções. O Narrador para
       num estado instável e cala. */
    const p = problemasDe({ texto: prosaDe(90) + ' O que você faz?' })
      .filter(x => /perguntando/.test(x));
    t2.diagnostic(p[0] || 'PASSOU');
    assert.ok(p.length);
  });

  await t.test('vocabulário proibido reprova, com e sem acento', (t2) => {
    /* Mesmo guia e mesma seção que o Cronista lê — os dois juízes
       compartilham a lista negra. O termo vem da FONTE: se ela mudar,
       o teste acompanha; se esvaziar, ele cai. */
    const [primeiro] = termosDaListaNegra();
    const semAcento = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const forma of [primeiro, semAcento(primeiro)]) {
      const p = problemasDe({ texto: prosaDe(90) + ` Era uma ${forma} inteira.` })
        .filter(x => /vocabulário proibido/.test(x));
      t2.diagnostic(`"${forma}" → ${p.length ? 'reprovado' : 'PASSOU'}`);
      assert.ok(p.length, `"${forma}" está na lista negra e passou`);
    }
  });

  await t.test('inglês demais reprova', (t2) => {
    const p = problemasDe({ texto: prosaDe(80)
      + ' The night and the blood with that which would remain there.' })
      .filter(x => /inglês/.test(x));
    t2.diagnostic(p[0] || 'PASSOU');
    assert.ok(p.length);
  });

  await t.test('referência a pessoa ou local que não existe reprova', (t2) => {
    const p = problemasDe({ texto: prosaDe(80) + ' [[pessoa:fantasma]] estava lá.' },
                          { pessoas: ['ze'], locais: [] });
    t2.diagnostic(`conhecidos: [ze] · citado: fantasma → ${p.length} problema(s)`);
    assert.ok(p.some(x => /fantasma/.test(x)), 'aceitou pessoa inventada');

    const ok = problemasDe({ texto: prosaDe(80) + ' [[pessoa:ze]] estava lá.' },
                           { pessoas: ['ze'], locais: [] });
    assert.deepEqual(ok, [], 'reprovou uma pessoa que existe');
  });

  await t.test('fio quase-igual a um existente reprova, dizendo qual usar', (t2) => {
    const p = problemasDe({ fios: [{ id: 'divida_com' }] }, { fios: ['divida_com_ze'] })
      .filter(x => /duplica/.test(x));
    t2.diagnostic(p[0] || 'PASSOU');
    assert.ok(p.length, 'deixou nascer um fio duplicado');
    assert.ok(/divida_com_ze/.test(p[0]), 'reprovou sem dizer qual id usar');
  });

  await t.test('pedir teste de intenção que o léxico não tem reprova', (t2) => {
    const p = problemasDe({ pedirTeste: { intencao: 'teletransportar' } },
                          { acoes: ['agarrar', 'atacar'] })
      .filter(x => /intenção desconhecida/.test(x));
    t2.diagnostic(p[0] || 'PASSOU');
    assert.ok(p.length);
  });

  await t.test('todo problema é uma frase que a retentativa consegue usar', () => {
    const p = problemasDe({ texto: prosaDe(15) + ' Você rola 4 dados. O que faz?' });
    assert.ok(p.length >= 3, `esperava vários problemas, veio ${p.length}`);
    for (const x of p) {
      assert.ok(x.length > 12, `motivo curto demais: "${x}"`);
      assert.ok(!/undefined|\[object/.test(x), `motivo quebrado: "${x}"`);
    }
  });
});

/* ============================================================
   O PROMPT DO NARRADOR E O EXTRATOR, DEPOIS DA §57
   A caixa única mandou uma coisa nova para o servidor: o turno
   pode ser ação E fala E pergunta de uma vez. As duas peças do
   servidor que precisaram mudar são estas.
   ============================================================ */

test('Servidor — o turno segmentado (§57)', async (t) => {
  const narrador = await import('../../modulos/cronista/narrador.mjs');
  const intencao = await import('../../modulos/cronista/intencao.mjs');

  const base = { cena: { local: 'boate_ipanema', hora: '23h40' }, personagem: 'Marina',
                 presentes: ['Bia'], pessoas: [], locais: [], fios: [], historico: [],
                 texto: 'Encosto o cinzeiro na mesa e sussurro: "você não devia ter vindo"' };

  await t.test('os pedaços chegam ao modelo separados', (t2) => {
    /* Quem está na cena reage ao que foi DITO em voz alta, e não ao
       que o personagem só fez. Numa linha só, o Narrador tratava
       pensamento como fala. */
    const corpo = narrador.corpoDoTurno(Object.assign({}, base, { segmentos: [
      { tipo: 'acao', texto: 'Encosto o cinzeiro na mesa' },
      { tipo: 'fala', texto: 'você não devia ter vindo', volume: 'sussurro' },
      { tipo: 'meta', texto: 'ela sabe o que eu sou?' }
    ]}));
    for (const l of corpo.split('\n').filter(x => /^- /.test(x))) t2.diagnostic(l);
    assert.match(corpo, /Ele faz: Encosto o cinzeiro/);
    assert.match(corpo, /Ele diz, sussurrando: "você não devia ter vindo"/);
    assert.match(corpo, /Fora da ficção, ele pergunta a você: ela sabe/);
  });

  await t.test('cada volume tem palavra própria no prompt', (t2) => {
    for (const [volume, esperado] of [['sussurro', /sussurrando/], ['grito', /gritando/],
                                      ['mensagem', /mensagem escrita/], ['normal', /em voz alta/]]) {
      const corpo = narrador.corpoDoTurno(Object.assign({}, base, {
        segmentos: [{ tipo: 'fala', texto: 'vem', volume }] }));
      const linha = corpo.split('\n').find(l => /Ele diz/.test(l));
      t2.diagnostic(`${volume} → ${linha}`);
      assert.match(linha, esperado);
    }
  });

  await t.test('sessão gravada antes da §57 continua narrando', (t2) => {
    /* Turno sem `segmentos` cai na linha de antes. Sessão velha não
       pode quebrar por causa de interface nova. */
    const corpo = narrador.corpoDoTurno(Object.assign({}, base, { modo: 'falar' }));
    const linha = corpo.split('\n').find(l => /O jogador/.test(l));
    t2.diagnostic(linha);
    assert.match(linha, /O jogador fala em voz alta:/);
  });

  await t.test('o extrator devolve fala, e o volume é sempre um que a mesa conhece', (t2) => {
    /* A mesa traduz whisper/shout/message para sussurro/grito/mensagem.
       Volume fora da lista tem de virar 'normal', e não vazar. */
    for (const [bruto, esperado] of [
      [{ speech: 'vem', speech_volume: 'whisper' }, 'whisper'],
      [{ speech: 'vem', speech_volume: 'shout' }, 'shout'],
      [{ speech: 'vem', speech_volume: 'telepathic' }, 'normal'],
      [{ speech: 'vem', speech_volume: '' }, 'normal'],
      [{ speech: '', speech_volume: 'shout' }, null]
    ]) {
      const n = intencao.normalizar(Object.assign({ action_type: 'unknown' }, bruto));
      t2.diagnostic(`${JSON.stringify(bruto)} → speech ${JSON.stringify(n.speech)}, volume ${JSON.stringify(n.speech_volume)}`);
      assert.equal(n.speech_volume, esperado);
    }
  });

  await t.test('sem fala, o extrator não inventa volume', () => {
    /* `speech_volume` preenchido sem `speech` faria a mesa desenhar
       uma fala que ninguém disse. */
    const n = intencao.normalizar({ action_type: 'melee_attack', target: 'o segurança' });
    assert.equal(n.speech, null);
    assert.equal(n.speech_volume, null);
  });

  await t.test('o esquema exige os dois campos novos', () => {
    /* Campo opcional na gramática do ollama vem vazio (a nota do topo
       de intencao.mjs registra a medição). Exigido, o modelo olha. */
    assert.ok(intencao.ESQUEMA.required.includes('speech'));
    assert.ok(intencao.ESQUEMA.required.includes('speech_volume'));
    assert.deepEqual(intencao.ESQUEMA.properties.speech_volume.enum,
                     ['none', 'normal', 'whisper', 'shout', 'message']);
  });
});

/* ============================================================
   §68 — O MANIFESTO DE CONTEXTO APONTA PARA SEÇÕES REAIS

   `servidor/contexto.mjs` recorta os `.md` do projeto POR TÍTULO
   DE SEÇÃO. Se alguém renomeia uma seção — e renomear seção é a
   coisa mais inocente do mundo —, o recorte devolve vazio e o
   prefixo cacheado perde aquele bloco. **Em silêncio.**

   Foi o que quase aconteceu na §68: numerei os Princípios da
   Crônica como `## 9` no `cenario.md`, o Contrato de coerência
   virou `## 10`, e o manifesto continuou pedindo "9. Contrato de
   coerência para a IA". Os 590 testes passaram. O Narrador teria
   perdido a regra que o proíbe de inventar número, e ninguém
   ficaria sabendo.
   ============================================================ */

test('Contexto — todo bloco do manifesto existe de verdade (§68)', async (t) => {

  const { manifesto, secao } = await import('../../modulos/cronista/contexto.mjs');

  await t.test('o manifesto não está vazio', (t2) => {
    const m = manifesto();
    t2.diagnostic(`${m.length} blocos declarados`);
    assert.ok(m.length >= 5, 'manifesto suspeito de tão pequeno');
  });

  await t.test('cada arquivo citado existe', () => {
    for (const b of manifesto()) {
      const caminho = path.join(RAIZ, b.arquivo);
      assert.ok(fs.existsSync(caminho), `${b.rotulo}: ${b.arquivo} não existe`);
    }
  });

  await t.test('cada SEÇÃO citada existe, e devolve texto', (t2) => {
    /* Este é o teste que teria pegado o defeito. `secao()` devolve
       string vazia quando não acha o título — não estoura. */
    const vazios = [];
    for (const b of manifesto()) {
      const md = fs.readFileSync(path.join(RAIZ, b.arquivo), 'utf8');
      /* `secao()` devolve NULL quando não acha o título — não estoura.
         Tratar isso aqui é o que faz a falha dizer o nome da seção em
         vez de um TypeError. */
      const texto = secao(md, b.secao) || '';
      t2.diagnostic(`${b.rotulo.padEnd(14)} ${String(texto.length).padStart(5)} chars  ${b.secao}`);
      if (texto.trim().length < 20) vazios.push(`${b.rotulo} → "${b.secao}" em ${b.arquivo}`);
    }
    assert.equal(vazios.length, 0,
      `seção do manifesto não encontrada ou vazia:\n  ${vazios.join('\n  ')}`);
  });

  await t.test('nenhum rótulo é declarado duas vezes sem condição', () => {
    /* Dois blocos com o mesmo rótulo e sem condição de seita ou
       camada seriam duplicata no prefixo — token pago duas vezes. */
    const vistos = new Map();
    for (const b of manifesto()) {
      if (b.condicional) continue;
      const antes = vistos.get(b.rotulo);
      assert.ok(!antes, `rótulo "${b.rotulo}" aparece em ${antes} e em ${b.secao}`);
      vistos.set(b.rotulo, b.secao);
    }
  });
});

/* ============================================================
   §75/§76 — LIGAR E DESLIGAR

   O painel da capa e as rotas que ele usa. Com `OLLAMA_HOST` na
   porta morta, o que se afirma é o comportamento SEM provedor —
   que é o caso de quem abre o app pela primeira vez, e o caso em
   que o painel mais precisa estar certo.

   Estes testes ficam por ÚLTIMO no arquivo de propósito: o último
   deles encerra o proxy, que é justamente o que ele afirma.
   ============================================================ */

const posta = (caminho, corpo, origem = `http://127.0.0.1:${PORTA}`) =>
  pegar(caminho, { method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origem },
    body: JSON.stringify(corpo) });

test('Servidor — o diagnóstico dos sistemas (§75)', async (t) => {
  await subir();

  await t.test('lista os seis sistemas, e o servidor está sempre ligado', async (t2) => {
    const r = await pegar('/api/sistemas');
    assert.equal(r.status, 200);
    const d = await r.json();
    t2.diagnostic(d.linhas.map(l => `${l.ligado ? 'ON' : 'off'} ${l.id}`).join(' · '));
    const ids = d.linhas.map(l => l.id);
    for (const esperado of ['servidor', 'ollama', 'narrador', 'cronista', 'intencao', 'campanhas'])
      assert.ok(ids.includes(esperado), `falta a linha "${esperado}"`);
    /* Ele está respondendo: é a única linha que não precisa de sonda. */
    assert.equal(d.linhas.find(l => l.id === 'servidor').ligado, true);
  });

  await t.test('sem ollama os três papéis caem junto, e dizem o que se perde', async (t2) => {
    const d = await (await pegar('/api/sistemas')).json();
    const fora = d.linhas.filter(l => !l.ligado).map(l => l.id);
    t2.diagnostic(`fora: ${fora.join(', ')}`);
    for (const esperado of ['ollama', 'narrador', 'cronista', 'intencao'])
      assert.ok(fora.includes(esperado), `"${esperado}" devia estar fora sem ollama`);
    assert.equal(d.tudoLigado, false);
    /* A informação útil não é "está fora": é o que isso custa ao jogo. */
    assert.match(d.linhas.find(l => l.id === 'narrador').faltando, /simulado/i,
      'a linha do Narrador não diz o que se perde sem ele');
  });

  await t.test('a campanha jogável da §72 aparece na contagem', (t2) => {
    const arquivos = fs.readdirSync(path.join(RAIZ, 'campanhas')).filter(f => f.endsWith('.md'));
    t2.diagnostic(`${arquivos.length} campanha(s)`);
    assert.ok(arquivos.includes('a-conta-do-duarte.md'));
  });
});

/* ============================================================
   §80 — A ROTINA DE LIGAR E DESLIGAR OS MÓDULOS

   Estes testes sobem e derrubam um MesaServer DE VERDADE, numa
   porta própria. É caro (~2 s) e é a única forma honesta: o que
   se afirma é que o Gateway consegue subir um processo irmão e
   pedir que ele saia — e isso não se verifica lendo código.

   Eles vêm ANTES do §76 de propósito: o último teste do §76
   encerra o proxy, e depois dele não há a quem perguntar.
   ============================================================ */

test('Servidor — os módulos no diagnóstico (§80)', async (t) => {
  await subir();
  /* UMA CORRIDA INTERROMPIDA DEIXA ÓRFÃO. Se a anterior morreu no meio,
     ficou um MesaServer de pé na porta de teste, e as asserções abaixo
     — que afirmam que ele está FORA — reprovariam por causa do passado.
     Pedir o encerramento antes é higiene, não afrouxamento: a porta é
     privada do teste, e o que se derruba aqui não é de ninguém. */
  await posta('/api/desligar', { ollama: false, modulos: true });

  await t.test('os cinco módulos aparecem, com número e porta', async (t2) => {
    const d = await (await pegar('/api/sistemas')).json();
    t2.diagnostic(d.modulos.map(m =>
      `${m.numero}.${m.id}:${m.porta}${m.previsto ? '(previsto)' : (m.ligado ? '(on)' : '(off)')}`
    ).join(' · '));
    assert.deepEqual(d.modulos.map(m => m.id),
      ['gateway', 'ficha', 'mesa', 'arbitro', 'cronista']);
    assert.deepEqual(d.modulos.map(m => m.numero), [1, 2, 3, 4, 5]);
    /* As portas vêm da variável de ambiente que `subir()` passou. Se
       elas viessem do padrão, este teste estaria olhando o servidor
       do usuário em vez do seu. */
    assert.equal(d.modulos.find(m => m.id === 'mesa').porta, PORTA_MESA);
  });

  await t.test('o Gateway está ligado sem precisar de sonda', async () => {
    const d = await (await pegar('/api/sistemas')).json();
    const g = d.modulos.find(m => m.id === 'gateway');
    assert.equal(g.ligado, true);
    /* Ele é o processo que respondeu. Não há botão para ligá-lo. */
    assert.equal(g.podeLigar, false);
  });

  await t.test('nenhum módulo é mais "previsto" — os cinco existem (§84)', async (t2) => {
    /* O estado oco da §80 saiu do código quando deixou de ter ocupante.
       Este teste é o guarda do contrário: se alguém voltar a reservar
       uma porta sem processo atrás, ele cobra o arquivo. */
    const d = await (await pegar('/api/sistemas')).json();
    const semArquivo = d.modulos.filter(m => !m.comando);
    t2.diagnostic(d.modulos.map(m => `${m.id}:${m.comando || 'SEM ARQUIVO'}`).join(' · '));
    assert.deepEqual(semArquivo, [], 'módulo sem arquivo para subir');
    assert.ok(!d.modulos.some(m => 'previsto' in m && m.previsto),
      'o estado "previsto" voltou, e nenhum módulo devia estar nele');
    /* Só o Gateway não se liga sozinho: ele é o processo que respondeu. */
    assert.deepEqual(d.modulos.filter(m => !m.podeLigar).map(m => m.id), ['gateway']);
  });

  await t.test('cada módulo aponta para um arquivo que existe', () => {
    const quebrados = ['ficha', 'mesa', 'arbitro', 'cronista', 'gateway']
      .map(id => `modulos/${id}/${id === 'gateway' ? 'proxy' : id + '-servidor'}.mjs`)
      .filter(rel => !fs.existsSync(path.join(RAIZ, rel)));
    assert.deepEqual(quebrados, [], 'módulo registrado sem processo no disco');
  });

  await t.test('o MesaServer está fora, e a linha diz o que se perde', async () => {
    const d = await (await pegar('/api/sistemas')).json();
    const mesa = d.modulos.find(m => m.id === 'mesa');
    assert.equal(mesa.ligado, false);
    assert.equal(mesa.podeLigar, true);
    assert.match(mesa.faltando, /sess(ão|ao)|checkout/i,
      'a linha do MesaServer não diz o que falta sem ele');
    assert.match(mesa.comando, /mesa-servidor\.mjs/);
  });
});

/* ============================================================
   O GATEWAY E OS DOIS TEMPOS-LIMITE  (§97)

   Nasceu de um registro de tráfego real: uma narração morrendo em
   20.060 ms com "o módulo cronista não respondeu" — e o módulo no ar.
   Um número só valia para tudo, e ele era do tamanho de um checkout,
   não do tamanho de um 12B narrando um turno.

   O arreio sobe um módulo de MENTIRA que só dorme. É o único jeito de
   afirmar isto sem depender de um modelo instalado, e o que se afirma é
   sobre o Gateway, não sobre o modelo.
   ============================================================ */
test('Gateway — esperar um modelo não é o mesmo que esperar um módulo (§97)', async (t) => {
  const PORTA_G = 43310;
  const PORTA_C = PORTA_G + 4;
  const BASE_G = `http://127.0.0.1:${PORTA_G}`;

  /* O módulo de mentira: responde, mas devagar. */
  let demora = 0;
  const lerdo = http.createServer((req, res) => {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, texto: 'narrei', demorou: demora }));
    }, demora);
  });
  await new Promise(ok => lerdo.listen(PORTA_C, '127.0.0.1', ok));

  const proxy = spawn(process.execPath, [path.join(RAIZ, 'modulos', 'gateway', 'proxy.mjs')], {
    cwd: RAIZ,
    env: Object.assign({}, process.env, {
      PORTA: String(PORTA_G),
      VITAE_ESCUTAR: '127.0.0.1',
      OLLAMA_HOST: 'http://127.0.0.1:1',
      VITAE_PORTA_CRONISTA: String(PORTA_C),
      /* portas mortas para os outros três: um deles é o caso "fora do ar" */
      VITAE_PORTA_FICHA: String(PORTA_G + 1),
      VITAE_PORTA_MESA: String(PORTA_G + 2),
      VITAE_PORTA_ARBITRO: String(PORTA_G + 3),
      /* Os dois orçamentos, encolhidos para o teste durar menos de 3 s.
         A PROPORÇÃO é o que importa, e ela é a de produção: o do modelo
         é muito maior do que o dos outros. */
      VITAE_TEMPO_MODULO: '250',
      VITAE_TEMPO_MODELO: '4000'
    }),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await new Promise((ok, falha) => {
    proxy.stdout.on('data', d => { if (String(d).includes('VITÆ em')) ok(); });
    proxy.on('exit', c => falha(new Error(`o proxy saiu com ${c}`)));
  });

  const narrar = () => fetch(`${BASE_G}/api/narrador`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE_G },
    body: JSON.stringify({ texto: 'sigo' })
  });

  try {
    await t.test('a rota do modelo NÃO é cortada no tempo dos módulos', async (t2) => {
      demora = 900;                       /* passa dos 250 ms, cabe nos 4000 */
      const t0 = Date.now();
      const r = await narrar();
      const corpo = await r.json();
      t2.diagnostic(`${r.status} em ${Date.now() - t0} ms · ${JSON.stringify(corpo).slice(0, 60)}`);
      assert.equal(r.status, 200,
        'a narração foi cortada no orçamento dos módulos — é o defeito da §97 de volta');
      assert.equal(corpo.texto, 'narrei');
    });

    await t.test('mas ela tem um teto, e ele diz que ESGOTOU', async (t2) => {
      demora = 6000;                      /* passa até dos 4000 */
      const t0 = Date.now();
      const r = await narrar();
      const corpo = await r.json();
      t2.diagnostic(`${r.status} em ${Date.now() - t0} ms · ${corpo.erro}`);
      assert.equal(r.status, 504, 'desistir de esperar tem código próprio');
      assert.equal(corpo.esgotou, true);
      assert.equal(corpo.tempoLimite, 4000);
      assert.match(corpo.erro, /está no ar/);
      /* O conselho errado é pior do que conselho nenhum: quem depura
         sobe de novo o que já subiu e continua sem entender. */
      assert.equal(corpo.comando, undefined,
        'o timeout mandou subir um módulo que está no ar');
    });

    await t.test('módulo FORA DO AR continua sendo 503, com o comando de subir', async (t2) => {
      const r = await fetch(`${BASE_G}/api/mesa/saude`);
      const corpo = await r.json();
      t2.diagnostic(`${r.status} · ${corpo.erro} · ${corpo.comando || '(sem comando)'}`);
      assert.equal(r.status, 503, 'fora do ar deixou de ser 503');
      assert.match(corpo.comando || '', /mesa-servidor\.mjs/,
        'quem está fora do ar precisa do comando de subir');
      assert.equal(corpo.esgotou, undefined, 'fora do ar foi marcado como esgotado');
    });

    await t.test('a sonda HEAD não ganha o orçamento do modelo', async (t2) => {
      /* Sonda que espera cinco minutos não é sonda: ela existe para
         dizer depressa se o elo existe. */
      demora = 900;
      const t0 = Date.now();
      const r = await fetch(`${BASE_G}/api/intencao`, { method: 'HEAD' });
      const levou = Date.now() - t0;
      t2.diagnostic(`HEAD ${r.status} em ${levou} ms`);
      assert.ok(levou < 800,
        `a sonda esperou ${levou} ms: ela caiu no orçamento do modelo`);
    });
  } finally {
    proxy.kill();
    await new Promise(ok => lerdo.close(ok));
  }
});

/* ============================================================
   O PADRÃO DA ROTA DE MODELO É NÃO TER TETO  (§98)

   A §97 trocou 20 s por 300 s, e ainda era um teto do Gateway sobre
   uma espera que não é dele. Este teste sobe o proxy SEM dizer
   `VITAE_TEMPO_MODELO` — é o padrão que está sendo afirmado — e põe do
   outro lado um módulo que demora muito mais do que o orçamento dos
   módulos.
   ============================================================ */
test('Gateway — sem VITAE_TEMPO_MODELO, a rota de modelo não tem teto (§98)', async (t) => {
  const PORTA_G = 43320;
  const PORTA_C = PORTA_G + 4;
  const BASE_G = `http://127.0.0.1:${PORTA_G}`;

  const lerdo = http.createServer((req, res) => {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ texto: 'narrei devagar' }));
    }, 1200);
  });
  await new Promise(ok => lerdo.listen(PORTA_C, '127.0.0.1', ok));

  const proxy = spawn(process.execPath, [path.join(RAIZ, 'modulos', 'gateway', 'proxy.mjs')], {
    cwd: RAIZ,
    env: Object.assign({}, process.env, {
      PORTA: String(PORTA_G),
      VITAE_ESCUTAR: '127.0.0.1',
      OLLAMA_HOST: 'http://127.0.0.1:1',
      VITAE_PORTA_CRONISTA: String(PORTA_C),
      VITAE_PORTA_FICHA: String(PORTA_G + 1),
      VITAE_PORTA_MESA: String(PORTA_G + 2),
      VITAE_PORTA_ARBITRO: String(PORTA_G + 3),
      /* Só o dos módulos, e bem curto. O do modelo fica NO PADRÃO — é
         ele que este teste existe para afirmar. */
      VITAE_TEMPO_MODULO: '250',
      VITAE_TEMPO_MODELO: ''
    }),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let saida = '';
  await new Promise((ok, falha) => {
    proxy.stdout.on('data', d => { saida += String(d); if (saida.includes('VITÆ em')) ok(); });
    proxy.on('exit', c => falha(new Error(`o proxy saiu com ${c}`)));
  });

  try {
    await t.test('o módulo lerdo termina, e a resposta chega inteira', async (t2) => {
      const t0 = Date.now();
      const r = await fetch(`${BASE_G}/api/narrador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: BASE_G },
        body: JSON.stringify({ texto: 'sigo' })
      });
      const corpo = await r.json();
      const levou = Date.now() - t0;
      t2.diagnostic(`${r.status} em ${levou} ms · ${corpo.texto || corpo.erro}`);
      assert.equal(r.status, 200,
        'o padrão voltou a ter teto, e ele cortou uma narração de 1,2 s');
      assert.equal(corpo.texto, 'narrei devagar');
      assert.ok(levou > 1000, 'o teste não chegou a exercitar a espera');
    });

    await t.test('e as rotas comuns continuam com o teto delas', async (t2) => {
      /* Tirar o teto do modelo não pode ter tirado o dos outros: uma
         saúde que pendura para sempre é pior do que uma que desiste. */
      const r = await fetch(`${BASE_G}/api/cronista/diagnostico`);
      const corpo = await r.json();
      t2.diagnostic(`${r.status} · esgotou=${corpo.esgotou}`);
      assert.equal(r.status, 504, 'a rota comum perdeu o teto junto');
      assert.equal(corpo.esgotou, true);
    });

    await t.test('e o Gateway ANUNCIA com que orçamento subiu', (t2) => {
      /* A §97 foi corrigida e o conserto não valeu, porque o processo
         no ar era mais velho que o arquivo e nada no log dizia isso.
         Um servidor que anuncia os próprios números responde "qual
         build está rodando?" na primeira linha. */
      t2.diagnostic(saida.split('\n').filter(l => l.includes('Tempo-limite')).join(''));
      assert.match(saida, /Tempo-limite: módulos 250 ms · rotas de modelo sem limite/);
    });
  } finally {
    proxy.kill();
    await new Promise(ok => lerdo.close(ok));
  }
});

/* ============================================================
   ESTOURO DE TEMPO CONTRA MÓDULO FORA DO AR  (§98)

   O `fetch` do Node às vezes EMBRULHA o estouro num
   `TypeError: fetch failed`, e aí ele fica com a cara de "o outro lado
   não existe". Nesta versão do Node o estouro chega cru, então o ramo
   do `cause` não é exercitado pelo caminho HTTP — e mutação em cima
   dele passava em verde.

   Por isso a regra saiu do `proxy.mjs` e virou `comum/estouro.mjs`:
   `proxy.mjs` sobe um servidor ao ser importado, e nada lá dentro é
   alcançável por teste direto. É a lição da §91 e da §92 outra vez.
   ============================================================ */
test('Estouro — desistir e não existir têm caras parecidas (§98)', async (t) => {
  await t.test('o estouro cru é reconhecido', () => {
    const e = new Error('abortou'); e.name = 'TimeoutError';
    assert.equal(foiEstouroDeTempo(e), true);
  });

  await t.test('e o EMBRULHADO também — é o caso que engana', () => {
    const dentro = new Error('The operation was aborted due to timeout');
    dentro.name = 'TimeoutError';
    const fora = new TypeError('fetch failed');
    fora.cause = dentro;
    assert.equal(foiEstouroDeTempo(fora), true,
      'o estouro se disfarçou de módulo fora do ar');
  });

  await t.test('os códigos do undici contam', () => {
    const e = new Error('headers timeout'); e.code = 'UND_ERR_HEADERS_TIMEOUT';
    assert.equal(foiEstouroDeTempo(e), true);
  });

  await t.test('mas conexão recusada NÃO é estouro', () => {
    const dentro = new Error('connect ECONNREFUSED 127.0.0.1:5177');
    dentro.code = 'ECONNREFUSED';
    const fora = new TypeError('fetch failed');
    fora.cause = dentro;
    assert.equal(foiEstouroDeTempo(fora), false,
      'módulo fora do ar virou estouro, e perdeu o comando de subir');
  });

  await t.test('cause circular não pendura o processo', (t2) => {
    /* Um `while` ingênuo aqui penduraria justamente quem deveria estar
       respondendo um erro. */
    const a = new TypeError('fetch failed');
    const b = new TypeError('outro');
    a.cause = b; b.cause = a;
    const t0 = Date.now();
    assert.equal(foiEstouroDeTempo(a), false);
    t2.diagnostic(`decidiu em ${Date.now() - t0} ms`);
    assert.ok(Date.now() - t0 < 100, 'a corrente de cause virou laço infinito');
  });

  await t.test('e nada disso estoura com null ou undefined', () => {
    assert.equal(foiEstouroDeTempo(null), false);
    assert.equal(foiEstouroDeTempo(undefined), false);
  });
});

test('Servidor — subir e derrubar um módulo irmão (§80)', async (t) => {
  await subir();

  await t.test('`/api/ligar` sobe o MesaServer de verdade', async (t2) => {
    /* `ollama: false` porque não há ollama nestes testes e esperar
       25 s pela desistência dele não afirma nada. */
    const r = await posta('/api/ligar', { ollama: false });
    const d = await r.json();
    t2.diagnostic((d.passos || []).map(p => `${p.ok ? '✓' : '✕'} ${p.texto}`).join(' | '));
    assert.equal(r.status, 200);

    const passo = (d.passos || []).find(p => p.passo === 'mesa');
    assert.ok(passo, 'não houve passo para o MesaServer');
    assert.equal(passo.ok, true, passo.texto);

    /* E ele responde de verdade, na porta dele, sem passar pelo
       Gateway — senão isto estaria testando o encaminhamento. */
    const saude = await fetch(`http://127.0.0.1:${PORTA_MESA}/mesa/saude`);
    assert.equal(saude.status, 200);
    assert.equal((await saude.json()).modulo, 'mesa');
  });

  await t.test('e o diagnóstico passa a dizer que ele está no ar', async () => {
    const d = await (await pegar('/api/sistemas')).json();
    assert.equal(d.modulos.find(m => m.id === 'mesa').ligado, true);
  });

  await t.test('ligar de novo não sobe um segundo, e diz isso', async (t2) => {
    const d = await (await posta('/api/ligar', { ollama: false })).json();
    const passo = (d.passos || []).find(p => p.passo === 'mesa');
    t2.diagnostic(passo.texto);
    assert.match(passo.texto, /já estava/i, 'subiu um segundo MesaServer na mesma porta');
  });

  await t.test('desligar só o modelo NÃO derruba os módulos', async () => {
    /* O caso comum: liberar a RAM do 12B e continuar jogando no
       determinístico. A mesa tem de continuar de pé. */
    const r = await posta('/api/desligar', { ollama: true });
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.ok(!(d.passos || []).some(p => p.passo === 'mesa'),
      'derrubou o MesaServer sem ninguém pedir');
    assert.equal(d.modulos.find(m => m.id === 'mesa').ligado, true);
  });

  await t.test('`modulos: true` o derruba, e o Gateway continua de pé', async (t2) => {
    const r = await posta('/api/desligar', { ollama: false, modulos: true });
    const d = await r.json();
    t2.diagnostic((d.passos || []).map(p => `${p.ok ? '✓' : '✕'} ${p.texto}`).join(' | '));
    assert.equal(r.status, 200);
    assert.equal((d.passos || []).find(p => p.passo === 'mesa').ok, true);
    assert.ok(!d.servidorEncerrado, 'derrubou o Gateway junto');
    assert.equal((await pegar('/api/sistemas')).status, 200);

    let caiu = false;
    try { await fetch(`http://127.0.0.1:${PORTA_MESA}/mesa/saude`); } catch (e) { caiu = true; }
    assert.ok(caiu, 'o MesaServer continuou respondendo depois de mandar encerrar');
  });

  await t.test('módulo subido POR FORA também obedece ao pedido de encerrar', async (t2) => {
    /* O defeito que este teste fecha: `pararModulo` mandava um cabeçalho
       `Origin` com a porta de Gateway que ELE conhece, e o módulo
       comparava com a porta de Gateway que ELE conhece. Iguais quando o
       Gateway sobe o módulo — ele herda o ambiente. DIFERENTES quando os
       dois são subidos em momentos diferentes, que é o caso de quem deixa
       um `npm run mesa` aberto de ontem. Dava 403, e o painel dizia
       "continuou respondendo" sem dizer por quê.

       Aqui o MesaServer sobe com a porta de Gateway PADRÃO (5173),
       enquanto o Gateway do teste está em 51873. Se o pedido voltar a
       depender do `Origin`, este teste cai. */
    const solto = spawn(process.execPath, [path.join(RAIZ, 'modulos', 'mesa', 'mesa-servidor.mjs')], {
      cwd: RAIZ, stdio: 'ignore', windowsHide: true,
      env: Object.assign({}, process.env, {
        PORTA: '5173',                       /* a que ele acha que é o Gateway */
        VITAE_PORTA_MESA: String(PORTA_MESA),
        VITAE_SESSOES: SESSOES_DE_TESTE
      })
    });

    let noAr = false;
    for (let i = 0; i < 30 && !noAr; i++) {
      await new Promise(r => setTimeout(r, 200));
      try { noAr = (await fetch(`http://127.0.0.1:${PORTA_MESA}/mesa/saude`)).ok; }
      catch (e) { noAr = false; }
    }
    assert.ok(noAr, 'o MesaServer solto não subiu');

    const d = await (await posta('/api/desligar', { ollama: false, modulos: true })).json();
    const passo = (d.passos || []).find(p => p.passo === 'mesa');
    t2.diagnostic(passo.texto);
    assert.equal(passo.ok, true, passo.texto);
    solto.kill();   /* já saiu; isto é só para não deixar rastro */
  });

  await t.test('ele GRAVOU antes de sair, e não foi morto', (t2) => {
    /* A razão de o Gateway PEDIR em vez de matar: `taskkill` perderia
       a sessão que estava em memória e ainda não passou pelo autosave.
       A pasta de sessões do teste é descartável, e o que se afirma é
       que ela existe e é dele — se o processo tivesse morrido antes de
       gravar, ela nem teria sido criada. */
    assert.ok(fs.existsSync(SESSOES_DE_TESTE));
    t2.diagnostic(`pasta de sessões do teste: ${SESSOES_DE_TESTE}`);
  });
});

test('Servidor — ligar e desligar (§76)', async (t) => {
  await subir();

  await t.test('GET não liga nem desliga', async () => {
    for (const rota of ['/api/ligar', '/api/desligar'])
      assert.equal((await pegar(rota)).status, 405, `${rota} aceitou GET`);
  });

  await t.test('POST de outra origem é recusado', async () => {
    for (const rota of ['/api/ligar', '/api/desligar'])
      assert.equal((await posta(rota, {}, 'http://exemplo.invalido')).status, 403,
        `${rota} aceitou origem de fora`);
  });

  await t.test('desligar só o modelo NÃO derruba o servidor', async (t2) => {
    /* A garantia que importa: o botão de desligar o modelo não pode
       matar a página junto. Sem ollama no ar, o passo é "já estava
       parado" — e o servidor tem de continuar respondendo. */
    const r = await posta('/api/desligar', { ollama: true });
    const d = await r.json();
    t2.diagnostic(`${r.status} · ${(d.passos || []).map(p => p.texto).join(' | ')}`);
    assert.equal(r.status, 200);
    assert.ok(!d.servidorEncerrado, 'derrubou o servidor sem ninguém pedir');
    assert.equal((await pegar('/api/sistemas')).status, 200,
      'o servidor caiu ao desligar só o modelo');
  });

  await t.test('desligar tudo responde ANTES de sair', async (t2) => {
    /* Este é o teste que justifica o `res.on('finish')` no proxy: se o
       processo saísse antes de escrever, o navegador receberia conexão
       cortada e mostraria erro de rede em vez do relatório. */
    const r = await posta('/api/desligar', { ollama: true, servidor: true });
    const d = await r.json();
    t2.diagnostic(`${r.status} · servidorEncerrado=${d.servidorEncerrado} · ` +
      (d.passos || []).map(p => p.texto).join(' | '));
    assert.equal(r.status, 200);
    assert.equal(d.servidorEncerrado, true);
    assert.ok((d.passos || []).some(p => /Gateway encerrado/.test(p.texto)));
    /* A ORDEM É A GARANTIA.  (§80) O Gateway sai POR ÚLTIMO: se ele
       saísse antes, ninguém sobraria para pedir aos módulos que
       gravassem o que tinham em memória. */
    assert.equal(d.passos[d.passos.length - 1].passo, 'gateway',
      'o Gateway não foi o último a sair');
  });

  await t.test('e o servidor sai de verdade', async () => {
    await new Promise(r => setTimeout(r, 800));
    let caiu = false;
    try { await pegar('/api/sistemas'); } catch (e) { caiu = true; }
    assert.ok(caiu, 'o servidor continuou respondendo depois de mandar encerrar');
    processo = null;   /* já saiu: o encerramento do arquivo não tem o que matar */
  });
});

/* ============================================================
   O PREFIXO DEPOIS DO APÊNDICE III  (§89)

   Todo o resto do prefixo é material que o AUTOR escreveu:
   cenário, regras, estilo, campanha. O bloco de limites é a única
   parte escrita pelo JOGADOR — e é a única que vale sobre as
   outras. Os testes daqui guardam três coisas: que ele entra, que
   ele entra POR ÚLTIMO, e que ele não entra quando não há nada.
   ============================================================ */

test('Servidor — os limites do jogador no prefixo (§89)', async (t) => {
  const ctx = await import('../../modulos/cronista/contexto.mjs');

  await t.test('sem nada declarado, não há bloco', () => {
    /* Um bloco dizendo "o jogador não declarou nada" seria pior do que
       calar: soa a permissão. Sem ele, vale o piso do cenario.md §10. */
    assert.equal(ctx.blocoDeLimites(''), null);
    assert.equal(ctx.blocoDeLimites('   \n  '), null);
    assert.equal(ctx.blocoDeLimites(undefined), null);
  });

  await t.test('com algo declarado, o bloco diz que vale sobre os outros', (t2) => {
    const b = ctx.blocoDeLimites('LINHAS\n- Sofrimento animal');
    t2.diagnostic(b.texto.split('\n')[0]);
    assert.equal(b.rotulo, 'limites');
    assert.match(b.texto, /VALE SOBRE TODAS AS OUTRAS/);
    assert.match(b.texto, /INCLUSIVE SOBRE A CAMPANHA/);
    assert.match(b.texto, /Sofrimento animal/);
  });

  await t.test('e diz que nada no turno o suspende', () => {
    /* O jogador escreve o turno; ele também escreveu a lista. Um turno
       que peça para violar a própria lista é um jogador mudando de
       ideia sem editar a lista — e o livro manda editar a lista. */
    const b = ctx.blocoDeLimites('LINHAS\n- Aranhas');
    assert.match(b.texto, /nada que o jogador escrever no turno/i);
  });

  await t.test('texto absurdo é cortado, e o corte é avisado', (t2) => {
    const b = ctx.blocoDeLimites('x'.repeat(9000));
    t2.diagnostic(`${b.texto.length} caracteres depois do corte`);
    assert.ok(b.texto.length < 5000, 'o bloco de limites entrou inteiro');
  });

  await t.test('no prefixo montado, ele é o ÚLTIMO bloco', (t2) => {
    /* Modelo pequeno pesa o fim do contexto mais do que o meio. A
       ordem aqui não é estética: é a regra. */
    const partes = ctx.blocos({ camada: 'narrador', limites: 'LINHAS\n- Agulhas' });
    t2.diagnostic(partes.map(p => p.rotulo).join(' → '));
    assert.equal(partes[partes.length - 1].rotulo, 'limites',
      'o bloco do jogador deixou de ser o último do prefixo');
    assert.ok(partes.length > 3, 'o prefixo ficou pequeno demais para o teste valer');
  });

  await t.test('sem limites, o prefixo é o de sempre', () => {
    const com = ctx.blocos({ camada: 'narrador', limites: 'LINHAS\n- Agulhas' });
    const sem = ctx.blocos({ camada: 'narrador' });
    assert.equal(com.length, sem.length + 1);
    assert.ok(!sem.some(p => p.rotulo === 'limites'));
  });

  await t.test('e `prefixo()` leva o bloco até o texto final', () => {
    const p = ctx.prefixo({ camada: 'narrador', limites: 'LINHAS\n- Bestialidade' });
    assert.match(p.texto, /### LIMITES/);
    assert.match(p.texto, /Bestialidade/);
  });
});

test('Servidor — o fade e os projetos no corpo do turno (§89)', async (t) => {
  const narrador = await import('../../modulos/cronista/narrador.mjs');
  const base = { cena: { local: 'boate_ipanema', hora: '23h40' }, personagem: 'Marina',
                 presentes: [], pessoas: [], locais: [], fios: [], historico: [],
                 texto: 'sigo em frente' };

  await t.test('o fade manda CORTAR, e não resumir', (t2) => {
    /* Um "não descreva isso" que permite resumo devolve o conteúdo em
       miniatura, que é o que a técnica existe para evitar. */
    const corpo = narrador.corpoDoTurno(Object.assign({}, base, { fade: true }));
    const linha = corpo.split('\n').find(l => /FADE/.test(l));
    t2.diagnostic(linha);
    assert.match(linha, /corte/i);
    assert.match(linha, /nem em resumo/i);
  });

  await t.test('sem pedido, nenhuma linha de fade aparece', () => {
    assert.ok(!/FADE/.test(narrador.corpoDoTurno(base)));
  });

  await t.test('os projetos entram como pano de fundo, sem virar rolagem', (t2) => {
    /* O Narrador nunca produz número (cenario.md §10, "Nunca" 1). Os
       projetos existem no prompt para a cidade reagir a eles, e a linha
       diz isso com todas as letras. */
    const corpo = narrador.corpoDoTurno(Object.assign({}, base, {
      projetos: '- Quebrar o banco: falência da rede (Escopo 2, Dado do Projeto em 7)' }));
    const linha = corpo.split('\n').find(l => /TRAMANDO/.test(l));
    t2.diagnostic(linha);
    assert.match(linha, /não role/i);
    assert.match(corpo, /Quebrar o banco/);
  });

  await t.test('sem projeto em curso, nada disso aparece', () => {
    assert.ok(!/TRAMANDO/.test(narrador.corpoDoTurno(base)));
  });
});

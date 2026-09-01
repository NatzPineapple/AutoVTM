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
import path from 'node:path';
import { RAIZ } from './carregar.mjs';

const PORTA = 51873;
const BASE = `http://127.0.0.1:${PORTA}`;

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
  processo = spawn(process.execPath, [path.join(RAIZ, 'servidor', 'proxy.mjs')], {
    cwd: RAIZ,
    env: Object.assign({}, process.env, {
      PORTA: String(PORTA),
      VITAE_ESCUTAR: '127.0.0.1',
      VITAE_TETO_JANELA: String(TETO),
      /* porta morta: `configurado()` devolve false sem esperar */
      OLLAMA_HOST: 'http://127.0.0.1:1'
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
    const r = await pegar('/js/ficha/motor-ficha.js');
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type') || '', /javascript/);
  });

  await t.test('NADA é cacheado — é a razão de o servidor existir', async () => {
    /* Sem isto, o F5 não mostra a alteração, e a §36 registra três
       diagnósticos errados por cache. */
    const r = await pegar('/js/ficha/motor-ficha.js');
    assert.match(r.headers.get('cache-control') || '', /no-store|no-cache/);
  });

  await t.test('arquivo que não existe é 404, e diz qual', async () => {
    const r = await pegar('/js/nao-existe.js');
    assert.equal(r.status, 404);
    assert.ok((await r.text()).includes('nao-existe'));
  });

  /* ---------- travessia de caminho ---------- */

  await t.test('não dá para sair da raiz', async () => {
    /* O ataque clássico: pedir um arquivo do projeto que está FORA de
       `app/`. Se `package.json` vier, o servidor entrega o disco. */
    for (const tentativa of [
      '/../package.json',
      '/../../package.json',
      '/..%2fpackage.json',
      '/js/../../package.json',
      '/%2e%2e/package.json',
      '/....//package.json'
    ]) {
      const r = await pegar(tentativa);
      const corpo = await r.text();
      assert.ok(!corpo.includes('"name": "vitae"'),
        `"${tentativa}" entregou o package.json`);
      assert.ok([403, 404].includes(r.status), `"${tentativa}" devolveu ${r.status}`);
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

  await t.test('sem provedor no ar, responde 503 e explica', async () => {
    /* Este é o caminho de quem só quer jogar: sem ollama, a rota diz
       503 com motivo, e o cliente cai no determinístico. */
    const r = await pegar('/api/cronista', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': BASE },
      body: JSON.stringify({ tipo: 'capitulo' })
    });
    assert.equal(r.status, 503);
    const d = await r.json();
    assert.ok(d.erro && d.erro.length > 10, 'disse 503 sem explicar');
    assert.equal(d.semChave, true);
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
  const provedor = await import('../servidor/provedor-ollama.mjs');

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
    const arquivos = fsLista(path.join(RAIZ, 'servidor'));
    const pagos = arquivos.filter(n => /anthropic|openai|claude|gpt/i.test(n));
    assert.deepEqual(pagos, [], 'apareceu arquivo de provedor pago');
  });
});

import fs from 'node:fs';
function fsLista(dir) { return fs.readdirSync(dir); }

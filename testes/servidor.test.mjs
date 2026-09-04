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
import { RAIZ } from './carregar.mjs';

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

  await t.test('não dá para sair da raiz', async (t2) => {
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
    const arquivos = fs.readdirSync(path.join(RAIZ, 'servidor'));
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
  const cronista = await import('../servidor/cronista.mjs');

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
  const narrador = await import('../servidor/narrador.mjs');

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
  const narrador = await import('../servidor/narrador.mjs');
  const intencao = await import('../servidor/intencao.mjs');

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

  const { manifesto, secao } = await import('../servidor/contexto.mjs');

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

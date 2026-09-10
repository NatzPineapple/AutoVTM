/* ============================================================
   VITÆ — Testes do próprio arreio
   Um arreio que carrega os arquivos numa ordem diferente da do
   navegador testa um app que não existe. Estes testes existem
   para que ele não possa divergir em silêncio.
   ============================================================ */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ, ORDEM, AREAS, ARQUIVOS, PASTA_DA_AREA, memoriaLocal } from './carregar.mjs';

const html = fs.readFileSync(path.join(RAIZ, 'modulos', 'cliente', 'index.html'), 'utf8');
const naPagina = [...html.matchAll(/<script\s+src="([^"]+\.js)"/g)].map(m => m[1]);

test('arreio — a ordem de carga', async (t) => {
  await t.test('é exatamente a do index.html', () => {
    /* A ordem não é decorativa: const lido antes do arquivo rodar é TDZ
       (§43). Se alguém acrescentar script na página e esquecer daqui, o
       teste cai — que é o ponto. */
    /* §79: a URL é o caminho no repositório, então a comparação é
       direta — tirar a barra da frente é toda a tradução que existe.
       Antes havia um `'app/' +` aqui, e ele era a prova de que a URL
       e o disco não conversavam. */
    assert.deepEqual(ORDEM, naPagina.map(s => s.replace(/^\//, '')));
  });

  await t.test('todo arquivo listado existe no disco', () => {
    const sumidos = ORDEM.filter(rel => !fs.existsSync(path.join(RAIZ, rel)));
    assert.deepEqual(sumidos, [], 'arquivo na lista que não existe');
  });

  await t.test('todo .js das quatro áreas está na lista', () => {
    /* O caminho inverso: arquivo criado na pasta e esquecido do
       index.html carrega nunca, e o app abre mudo (§36). */
    const esquecidos = [];
    for (const area of Object.keys(AREAS)) {
      const pasta = path.join(RAIZ, PASTA_DA_AREA[area]);
      for (const arq of fs.readdirSync(pasta)) {
        if (!arq.endsWith('.js')) continue;
        const rel = `${PASTA_DA_AREA[area]}/${arq}`;
        if (!ORDEM.includes(rel)) esquecidos.push(rel);
      }
    }
    assert.deepEqual(esquecidos, [], 'arquivo na pasta que ninguém carrega');
  });
});

test('arreio — o localStorage de mentira', async (t) => {
  await t.test('devolve null para chave que não existe', () => {
    assert.equal(memoriaLocal().getItem('nada'), null);
  });

  await t.test('guarda como string, igual ao de verdade', () => {
    const m = memoriaLocal();
    m.setItem('n', 7);
    assert.strictEqual(m.getItem('n'), '7');
  });

  await t.test('estoura QuotaExceededError ao passar da cota', () => {
    const m = memoriaLocal({ cota: 10 });
    assert.throws(() => m.setItem('k', 'x'.repeat(50)), /QuotaExceededError/);
  });

  await t.test('o que não coube não fica meio gravado', () => {
    const m = memoriaLocal({ cota: 10 });
    try { m.setItem('k', 'x'.repeat(50)); } catch {}
    assert.equal(m.getItem('k'), null);
  });
});

/* ============================================================
   VITÆ — Servidor de desenvolvimento
   Serve os arquivos e nada mais: sem /api, sem Cronista, sem
   Narrador. Para jogar de verdade é o Gateway que se usa
   (`npm run proxy`); isto aqui é para mexer no criador de ficha
   sem depender de módulo nenhum estar de pé.

     node ferramentas/dev.mjs

   Quem decide o que pode ser lido é `comum/servir-estatico.mjs`,
   o MESMO arquivo que o Gateway usa. Eram duas cópias da mesma
   regra até a §79, e uma delas ia envelhecer.
   ============================================================ */

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from '../comum/servir-estatico.mjs';

const PROJETO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = Number(process.env.PORTA || 5173);

const servidor = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  servir(PROJETO, req, res, url);
});

servidor.listen(PORTA, () => {
  console.log(`VITÆ em http://localhost:${PORTA}`);
  console.log('Sem cache: toda alteração aparece no F5.');
  console.log('Sem /api: para a mesa com IA, use `npm run proxy`.');
});

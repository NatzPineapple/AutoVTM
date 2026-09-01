import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJETO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = path.join(PROJETO, 'app');
const CAMPANHAS = path.join(PROJETO, 'campanhas');
const PORTA = Number(process.env.PORTA || 5173);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.woff2': 'font/woff2'
};

const servidor = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const daCampanha = url.startsWith('/campanhas/');
  const base = daCampanha ? CAMPANHAS : RAIZ;
  const relativo = daCampanha ? url.slice('/campanhas/'.length) : (url === '/' ? 'index.html' : url);
  const alvo = path.normalize(path.join(base, relativo));

  if (!alvo.startsWith(base)) {
    res.writeHead(403).end('Fora da raiz');
    return;
  }

  fs.readFile(alvo, (erro, dados) => {
    if (erro) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Não encontrado: ' + url);
      return;
    }
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(alvo).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(dados);
  });
});

servidor.listen(PORTA, () => {
  console.log(`VITÆ em http://localhost:${PORTA}`);
  console.log('Sem cache: toda alteração aparece no F5.');
});

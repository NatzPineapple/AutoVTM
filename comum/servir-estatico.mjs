/* ============================================================
   VITÆ — Servir arquivo estático
   ------------------------------------------------------------
   Um lugar só para a pergunta "este pedido pode ler este
   arquivo?". O Gateway e o servidor de desenvolvimento faziam a
   mesma coisa em dois lugares, e depois da §79 a resposta ficou
   mais delicada: o navegador não carrega mais de UMA pasta.

   A REGRA DA URL, e ela vale para o projeto todo: **a URL é o
   caminho no repositório.** `/modulos/arbitro/motores/motor-dados.js`
   é `modulos/arbitro/motores/motor-dados.js`, sem tradução no meio.

   Foi escolha, e contra a alternativa de manter as URLs antigas
   com uma tabela de tradução. Tabela de tradução é um segundo
   lugar onde a estrutura está escrita — e a lição que este
   projeto já pagou três vezes é que duas escritas do mesmo fato
   divergem em silêncio. Aqui, se o arquivo mudou de pasta, a URL
   muda junto e a página quebra na hora, não seis semanas depois.

   O QUE PROTEGE: uma LISTA DE RAÍZES PERMITIDAS. Antes, o teto
   era "dentro de app/". Agora é "dentro de uma destas três", e o
   resto do repositório — docs/, Livros/, .git/, ferramentas/testes/,
   package.json — não é servível por caminho nenhum, nem por
   travessia, nem por acerto.
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';

/* A capa. Trocar isto é trocar o que o navegador abre em `/`. */
export const PAGINA_INICIAL = 'modulos/cliente/index.html';

/* Só estas três. `docs/` fica de fora de propósito: o Cronista lê
   docs/ pelo sistema de arquivos, do lado do servidor, e não há
   motivo para o navegador poder baixá-los. */
export const RAIZES_PERMITIDAS = ['modulos', 'comum', 'campanhas'];

export const TIPOS = {
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

export const SEM_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

/**
 * Traduz uma URL em caminho absoluto, ou devolve null quando o
 * pedido não tem direito ao arquivo. Não toca o disco: é só a
 * decisão, e ela é testável sozinha.
 */
export function resolver(projeto, url) {
  const limpo = (url === '/' || url === '') ? PAGINA_INICIAL : url.replace(/^\/+/, '');
  const alvo = path.normalize(path.join(projeto, limpo));

  /* A permissão é por RAIZ, e não por "está dentro do repositório".
     `path.relative` a partir de cada raiz permitida: sair dela põe um
     `..` no começo, e é isso que se recusa. */
  for (const raiz of RAIZES_PERMITIDAS) {
    const base = path.join(projeto, raiz);
    const dentro = path.relative(base, alvo);
    if (dentro && !dentro.startsWith('..') && !path.isAbsolute(dentro)) return alvo;
  }
  return null;
}

/** Responde o arquivo, ou 403/404. Devolve o que fez, para quem registra. */
export function servir(projeto, req, res, url) {
  const alvo = resolver(projeto, url);
  if (!alvo) {
    res.writeHead(403, Object.assign({ 'Content-Type': 'text/plain; charset=utf-8' }, SEM_CACHE));
    res.end('Fora das raízes servíveis');
    return { codigo: 403, alvo: null };
  }
  let dados;
  try { dados = fs.readFileSync(alvo); }
  catch (e) {
    res.writeHead(404, Object.assign({ 'Content-Type': 'text/plain; charset=utf-8' }, SEM_CACHE));
    res.end('Não encontrado: ' + url);
    return { codigo: 404, alvo, motivo: e.code };
  }
  res.writeHead(200, Object.assign({
    'Content-Type': TIPOS[path.extname(alvo).toLowerCase()] || 'application/octet-stream'
  }, SEM_CACHE));
  res.end(dados);
  return { codigo: 200, alvo };
}

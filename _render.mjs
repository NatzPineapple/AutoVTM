import * as mupdf from 'mupdf';
import fs from 'node:fs';
import path from 'node:path';

const [pdf, saida, de, ate, escalaArg] = process.argv.slice(2);
const escala = Number(escalaArg || 2);

fs.mkdirSync(saida, { recursive: true });
const doc = mupdf.Document.openDocument(fs.readFileSync(pdf), 'application/pdf');
const total = doc.countPages();
const inicio = Math.max(1, Number(de));
const fim = Math.min(total, Number(ate));

console.log(`${total} páginas no documento; renderizando ${inicio} a ${fim} em ${escala}x`);

for (let n = inicio; n <= fim; n++) {
  const pagina = doc.loadPage(n - 1);
  const pix = pagina.toPixmap(mupdf.Matrix.scale(escala, escala), mupdf.ColorSpace.DeviceRGB, false, true);
  const arquivo = path.join(saida, `p${String(n).padStart(3, '0')}.png`);
  fs.writeFileSync(arquivo, pix.asPNG());
  pix.destroy();
  pagina.destroy();
}
console.log('pronto');

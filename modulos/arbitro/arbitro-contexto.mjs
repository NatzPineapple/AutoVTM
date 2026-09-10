/* ============================================================
   VITÆ — O Árbitro dentro do Node  (§84)
   ------------------------------------------------------------
   O Módulo 4 tem um problema que os outros não têm: **ele já
   existe, e existe como script clássico de navegador.** São doze
   arquivos em `modulos/arbitro/`, mais a área Ficha e os dados,
   todos sem `export`, todos contando com o escopo global.

   Havia duas saídas, e a segunda é a que este arquivo é:

     1. reescrever o Árbitro como ESM. Duas implementações da
        mesma regra durante a migração, e a certeza de que elas
        divergiriam — é a lição que este projeto já pagou três
        vezes, e a mais cara delas foi sobre DOCUMENTO, não código.
     2. **rodar os mesmos arquivos** num contexto de `node:vm`, que
        é exatamente o que `ferramentas/testes/carregar.mjs` faz desde a §44
        para poder afirmar qualquer coisa sobre eles.

   Então o ArbitroServer não tem regra de jogo dentro. Ele tem um
   contexto, e o contexto tem o Árbitro — o MESMO que o navegador
   carrega, byte por byte. Corrigir uma regra continua sendo mexer
   num arquivo só.

   O QUE ISTO NÃO É: um sandbox de segurança. `node:vm` não é
   isolamento, e não é para isso que está aqui — o código que roda
   dentro é o do próprio projeto.
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { AREAS, caminhoDe } from '../../comum/ordem-de-carga.mjs';

const PROJETO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/* As três áreas que o Árbitro precisa, na ordem de carga. `cronista`
   e `front` ficam de fora de propósito: o Módulo 4 não sabe de
   narrativa nem de tela, e carregá-los aqui apagaria a fronteira que
   `fronteiras.test.mjs` existe para guardar. */
export const AREAS_DO_ARBITRO = ['data', 'ficha', 'arbitro'];

/* `const` e `let` de topo não viram propriedade do objeto global —
   nem no navegador, nem aqui. Mesma pegadinha da §43.5, e mesma
   solução do arreio: exportá-los à mão depois de cada arquivo. */
function exportarTopo(fonte) {
  const nomes = new Set();
  const re = /^(?:const|let|var|class|function)\s+([A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = re.exec(fonte))) nomes.add(m[1]);
  if (!nomes.size) return '';
  return `\n;Object.assign(globalThis, { ${[...nomes].join(', ')} });\n`;
}

/* O Árbitro não toca o DOM — é a regra mais antiga do projeto, e há
   teste varrendo o código-fonte atrás de tag. Mas `data-*.js` e a
   área Ficha montam string de HTML para a folha oficial, e algumas
   delas chamam `document` de leve. Um nó oco basta, e se algum dia
   não bastar, o erro aparece na hora em vez de sair HTML errado. */
function documentoOco() {
  const no = () => ({
    innerHTML: '', textContent: '', dataset: {}, value: '',
    style: { setProperty() {}, removeProperty() {}, getPropertyValue() { return ''; } },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild() {}, removeChild() {}, remove() {}, setAttribute() {},
    getAttribute() { return null; }, addEventListener() {}, click() {},
    querySelector() { return no(); }, querySelectorAll() { return []; }
  });
  return {
    body: no(), createElement: no, getElementById: no,
    querySelector: no, querySelectorAll: () => [], addEventListener() {},
    createTextNode: () => ({})
  };
}

/* O Módulo 4 é STATELESS, e `localStorage` é estado. O que sobra dele
   aqui é uma casca que não guarda nada e diz por quê se alguém tentar
   — é o `Seitas.soOficial()` e o `Matilha`, que leem preferência do
   navegador e não têm o que ler num serviço sem sessão. */
function memoriaQueNaoGuarda() {
  return {
    length: 0, key: () => null, getItem: () => null,
    setItem() { /* o Módulo 4 não guarda estado; ver o comentário acima */ },
    removeItem() {}, clear() {}
  };
}

/** Monta o contexto e roda as três áreas dentro dele. */
export function montarContexto() {
  const contexto = {
    console, setTimeout, clearTimeout, setInterval, clearInterval,
    localStorage: memoriaQueNaoGuarda(),
    document: documentoOco(),
    navigator: { userAgent: 'vitae-arbitro' },
    fetch: async () => { throw new Error('O Árbitro não faz chamada de rede.'); },
    Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Map, Set, Promise, Error,
    AbortController, URL, TextEncoder, TextDecoder
  };
  /* `ficha-modelo.js` chama `window.addEventListener` no topo, para
     ajustar a escala da folha ao redimensionar. Num serviço não há
     janela nem redimensionamento; sem estes ocos, o arquivo estoura
     no carregamento e leva o processo junto. */
  contexto.addEventListener = () => {};
  contexto.removeEventListener = () => {};
  contexto.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
  contexto.getComputedStyle = () => ({ getPropertyValue: () => '' });
  contexto.requestAnimationFrame = (fn) => setTimeout(fn, 0);
  contexto.cancelAnimationFrame = (t) => clearTimeout(t);
  contexto.scrollTo = () => {};
  contexto.window = contexto;
  contexto.globalThis = contexto;
  vm.createContext(contexto);

  const carregados = [];
  for (const area of AREAS_DO_ARBITRO) {
    for (const nome of AREAS[area]) {
      const rel = caminhoDe(area, nome);
      const fonte = fs.readFileSync(path.join(PROJETO, rel), 'utf8');
      try {
        new vm.Script(fonte + exportarTopo(fonte), { filename: rel }).runInContext(contexto);
        carregados.push(rel);
      } catch (e) {
        throw new Error(`O Árbitro não carregou ${rel}: ${e.message}`);
      }
    }
  }

  /* A FONTE DO ACASO NÃO É DELE.  (§82)

     O Árbitro deste processo NUNCA rola: ele diz quais dados e apura
     os valores que a Mesa mandar. A fonte instalada aqui estoura de
     propósito — se alguma rota fizer o Árbitro sortear, o erro aparece
     na hora, com o nome da regra que foi quebrada. */
  contexto.Dados.usarFonte(() => {
    throw new Error('O Módulo 4 não rola dado: quem rola é a Mesa (§82).');
  });

  contexto.__carregados = carregados;
  return contexto;
}

/** Roda uma expressão dentro do contexto. Existe pelo mesmo motivo do
    `executar` do arreio: `let` de topo não se alcança pelo objeto. */
export const dentro = (ctx, codigo) => vm.runInContext(codigo, ctx);

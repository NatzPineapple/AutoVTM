/* ============================================================
   VITÆ — Arreio dos testes automatizados
   O app é script clássico de navegador: sem módulo, sem export,
   tudo em `const` no escopo léxico global. Isso é decisão do
   projeto (sem build, sem framework) e não vai mudar por causa
   de teste.

   Então o teste faz o que o navegador faz: lê os arquivos na
   ordem e roda todos no MESMO contexto, com `vm`. O que sai é o
   objeto global desse contexto, com os módulos dentro.

   Zero dependência: `node:vm`, `node:fs` e o runner nativo.
   Rode com `npm test`.
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* A ordem é a mesma do index.html, e pelo mesmo motivo: const lido
   antes do arquivo rodar é erro de TDZ. Manter as duas em sincronia
   é obrigação — há teste que compara uma com a outra. */
export const AREAS = {
  data: ['data-traits', 'data-clans', 'data-disciplinas', 'data-predadores', 'data-vantagens',
         'data-brasil', 'data-sabbat', 'data-anarquistas', 'data-independentes', 'data-seitas',
         'data-mesa', 'data-recombinacao', 'data-escudo', 'data-itens', 'data-ressonancia'],
  ficha: ['ficha-vocabulario', 'motor-ficha', 'motor-matilha', 'ficha-regras', 'ficha-oficial', 'fichas'],
  arbitro: ['motor-dados', 'motor-arbitro', 'arbitro-lexico', 'arbitro-tabelas', 'motor-estado', 'motor-combate', 'motor-grafo',
            'motor-especialista', 'motor-cadeia', 'motor-navegacao', 'motor-entrada', 'motor-intencao'],
  cronista: ['compilador', 'diretor', 'recombinador', 'escada', 'narrador',
             'motor-cronica', 'cronista', 'legado'],
  front: ['dados-ui', 'criador-paineis', 'app', 'sessoes', 'mesa-render', 'mesa', 'mesa-acoes']
};

export const ORDEM = Object.entries(AREAS)
  .flatMap(([area, nomes]) => nomes.map(n => `app/js/${area}/${n}.js`));

/* localStorage de mentira, com a mesma semântica da coisa real:
   guarda string, devolve null quando não existe, e estoura quando
   passa da cota — que é o caso que o `catch (e) {}` de sessoes.js
   engole em silêncio (§14.1, item 2). */
export function memoriaLocal({ cota = Infinity } = {}) {
  const mapa = new Map();
  return {
    get length() { return mapa.size; },
    key(i) { return [...mapa.keys()][i] ?? null; },
    getItem(k) { return mapa.has(String(k)) ? mapa.get(String(k)) : null; },
    setItem(k, v) {
      const texto = String(v);
      const total = [...mapa.values()].reduce((a, x) => a + x.length, 0) + texto.length;
      if (total > cota) {
        const erro = new Error('QuotaExceededError');
        erro.name = 'QuotaExceededError';
        throw erro;
      }
      mapa.set(String(k), texto);
    },
    removeItem(k) { mapa.delete(String(k)); },
    clear() { mapa.clear(); },
    _mapa: mapa
  };
}

/* DOM mínimo. Não é jsdom e não tenta ser: o que a área Ficha faz
   com `document` é montar string de HTML, e o que ela toca de
   verdade é `getElementById` e `querySelector`. Teste que precisar
   de DOM real pertence à página de diagnóstico, no navegador. */
function documentoDeMentira() {
  const noVazio = () => ({
    innerHTML: '', textContent: '', dataset: {}, value: '',
    /* `style` precisa de `setProperty`: o criador ajusta a escala da
       folha oficial por variável CSS. Objeto vazio derrubava o render
       dos nove passos. */
    style: { setProperty() {}, removeProperty() {}, getPropertyValue() { return ''; } },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild() {}, removeChild() {}, remove() {},
    setAttribute() {}, getAttribute() { return null; },
    addEventListener() {}, click() {},
    /* O front chama estes ao trocar de modo e ao redesenhar. Faltavam,
       e o teste morria com "ta.focus is not a function" — falha do
       arreio, não do código. Nó de mentira precisa aceitar tudo o que
       o código faz com um nó de verdade. */
    focus() {}, blur() {}, select() {}, scrollIntoView() {}, scrollTo() {},
    insertAdjacentHTML() {}, contains() { return false; },
    closest() { return null; },
    get scrollHeight() { return 0; }, get scrollTop() { return 0; }, set scrollTop(_) {},
    querySelector() { return noVazio(); }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { x: 0, y: 0, width: 0, height: 0 }; }
  });
  /* O documento LEMBRA dos elementos que já entregou.

     Antes ele fabricava um nó novo a cada chamada, e o efeito era
     silencioso e enganoso: `$('#app').innerHTML = html` escrevia num
     objeto, e a leitura seguinte vinha de outro — vazio. Todo teste de
     render "passava" sobre string vazia, ou reprovava sem motivo
     aparente.

     Um registro por chave (id ou seletor) resolve, e é o mínimo para
     que dê para AFIRMAR alguma coisa sobre o que o front desenhou. Não
     é DOM: não há árvore, não há pai nem filho. Teste que precise de
     árvore de verdade pertence à página de diagnóstico. */
  const registro = new Map();
  const lembrado = (chave) => {
    if (!registro.has(chave)) registro.set(chave, noVazio());
    return registro.get(chave);
  };

  return {
    body: lembrado('body'),
    createElement: () => noVazio(),
    getElementById: (id) => lembrado(`#${id}`),
    querySelector: (sel) => lembrado(String(sel)),
    querySelectorAll: () => [],
    addEventListener() {},
    createTextNode: () => ({}),
    _registro: registro
  };
}

/* `const`, `let` e `class` de topo NÃO viram propriedade do objeto global —
   nem no navegador, nem aqui. Só `var` e `function` fazem isso. É a mesma
   pegadinha da §43.5, e é por isso que o teste precisa exportá-los à mão:
   sem isto, `g.Ficha` vem `undefined` e `g.derivados` vem certo, o que
   confunde muito antes de esclarecer. */
function exportarTopo(fonte) {
  const nomes = new Set();
  const re = /^(?:const|let|var|class|function)\s+([A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = re.exec(fonte))) nomes.add(m[1]);
  if (!nomes.size) return '';
  return `
;Object.assign(globalThis, { ${[...nomes].join(', ')} });
`;
}

/**
 * Carrega as áreas pedidas num contexto só e devolve o global dele.
 *
 *   const g = carregar(['data', 'ficha']);
 *   g.Ficha.indiceForca(ficha)
 *
 * Pedir uma área NÃO puxa as dependências dela automaticamente: se
 * faltar algo, o erro aparece na hora e diz o quê. Isso é de
 * propósito — é assim que o teste flagra dependência que não devia
 * existir.
 */
export function carregar(areas = Object.keys(AREAS), extras = {}) {
  const contexto = {
    console, setTimeout, clearTimeout, setInterval, clearInterval,
    localStorage: extras.localStorage || memoriaLocal(),
    document: documentoDeMentira(),
    navigator: { userAgent: 'vitae-testes' },
    fetch: extras.fetch || (async () => { throw new Error('fetch não existe nos testes'); }),
    Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Map, Set, Promise, Error,
    /* o interpretador de modelo aborta a busca por tempo limite */
    AbortController, URL, TextEncoder, TextDecoder
  };
  contexto.addEventListener = () => {};
  contexto.removeEventListener = () => {};
  contexto.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
  contexto.scrollTo = () => {};
  contexto.requestAnimationFrame = (fn) => setTimeout(fn, 0);
  contexto.cancelAnimationFrame = (t) => clearTimeout(t);
  contexto.getComputedStyle = () => ({ getPropertyValue: () => '' });
  contexto.window = contexto;
  contexto.globalThis = contexto;
  Object.assign(contexto, extras);

  vm.createContext(contexto);

  const pedidas = Array.isArray(areas) ? areas : [areas];

  for (const area of pedidas) {
    if (!AREAS[area]) throw new Error(`Área desconhecida: ${area}`);
    for (const nome of AREAS[area]) {
      const arquivo = path.join(RAIZ, 'app', 'js', area, `${nome}.js`);
      const fonte = fs.readFileSync(arquivo, 'utf8');
      try {
        new vm.Script(fonte + exportarTopo(fonte), { filename: `${area}/${nome}.js` })
          .runInContext(contexto);
      } catch (e) {
        throw new Error(`Falhou ao carregar ${area}/${nome}.js: ${e.message}`);
      }
    }
  }

  /* A latência falsa do Narrador simulado é 500–1.200 ms por turno. Ela
     existe para a interface mostrar 'escrevendo' e não verifica nada —
     e cobrava nove vezes o tempo da suíte inteira. Aqui ela é zero.
     Quem quiser exercitá-la num teste, devolve o valor. */
  if (contexto.NarradorSimulado) contexto.NarradorSimulado.latenciaMs = [0, 0];

  return contexto;
}

/**
 * Roda código DENTRO do contexto carregado, e devolve o resultado.
 *
 *   executar(g, 'M = MESA_VAZIA(); M.ficha = ficha; salvarMesa()');
 *
 * Existe por causa do `let`: `g.M = …` cria uma propriedade nova no
 * objeto global e NÃO rebobina o `let M` do escopo léxico, que é o que
 * `salvarMesa()` enxerga. É a mesma pegadinha da §43.5, do outro lado —
 * lá não dava para LER um `const` pelo objeto global; aqui não dá para
 * ESCREVER num `let`.
 */
export function executar(g, codigo) {
  return vm.runInContext(codigo, g);
}

/**
 * O mesmo que `executar`, mas devolve uma CÓPIA congelada no tempo.
 *
 *   const antes = instantaneo(g, 'M.contador');
 *   executar(g, 'aplicarPasso(...)');
 *   const depois = instantaneo(g, 'M.contador');
 *
 * Existe por uma armadilha que já custou dois testes: **`executar`
 * devolve a REFERÊNCIA VIVA**, não uma cópia. O `vm` do Node cria um
 * contexto novo, e não um heap novo — o objeto que volta é o mesmo que
 * está lá dentro.
 *
 * Então isto NÃO funciona:
 *
 *   const antes = executar(g, 'M.contador');   // referência viva
 *   executar(g, 'aplicarPasso(...)');          // mexe no contador
 *   const depois = executar(g, 'M.contador');  // o MESMO objeto
 *   assert.equal(depois.local, antes.local + 1);   // nunca passa
 *
 * `antes.local` andou junto. O teste compara o objeto consigo mesmo, e
 * o que ele afirma é sempre falso — ou, pior, sempre verdadeiro, se a
 * asserção for de igualdade.
 *
 * Valor primitivo (`M.mensagens.length`) é copiado e está a salvo; o
 * risco é só com objeto e lista.
 */
export function instantaneo(g, codigo) {
  const v = vm.runInContext(codigo, g);
  return (v && typeof v === 'object') ? JSON.parse(JSON.stringify(v)) : v;
}

/**
 * Vicia os dados: as próximas rolagens saem exatamente nesta ordem.
 *
 *   comDadosViciados(g, [10, 10, 6, 2]);
 *
 * `Dados.rolar` chama `this.d10()`, então trocar o método basta — não é
 * preciso mexer no `Math.random`, que é compartilhado com o processo.
 * Acabada a lista, volta a valer o dado honesto, e o teste que precisar
 * de garantia usa `restaurar()`.
 *
 * Boa parte da regra do V5 é apurável sem rolar nada: `Dados._apurar()`
 * recebe os dados prontos e é pura. Prefira ela quando der; isto aqui é
 * para o que rola por dentro, como o combate.
 */
export function comDadosViciados(g, valores) {
  const original = g.Dados.d10;
  let i = 0;
  g.Dados.d10 = () => (i < valores.length ? valores[i++] : original.call(g.Dados));
  return {
    restaurar() { g.Dados.d10 = original; },
    get consumidos() { return i; }
  };
}

/** Uma ficha jogável, montada à mão para não depender do FICHA_EXEMPLO. */
export function fichaDeTeste(g, extra = {}) {
  const f = g.FICHA_VAZIA();
  Object.assign(f, {
    nome: 'Cobaia', jogador: 'testes', conceito: 'cobaia de laboratório',
    cla: 'brujah', geracao: '12', seita: 'camarilla', predador: 'alcateia',
    modoHabilidade: 'equilibrado', sexo: 'feminino'
  });
  f.atributos = { forca: 3, destreza: 3, vigor: 3, carisma: 2, manipulacao: 2,
                  autocontrole: 3, inteligencia: 2, raciocinio: 3, determinacao: 3 };
  f.habilidades = { briga: 3, atletismo: 2, furtividade: 2, persuasao: 2, intimidacao: 2,
                    consciencia: 2, investigacao: 1, ocultismo: 1, manha: 1, labia: 1 };
  f.disciplinas = { potencia: 2, celeridade: 1 };
  f.poderes = { potencia: ['Poder Letal', 'Vigor Sobrenatural'], celeridade: ['Graça Felina'] };
  f.conviccoes = ['Não toco em criança', '', ''];
  f.marcos = ['Bia', '', ''];
  return Object.assign(f, extra);
}

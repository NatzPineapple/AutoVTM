/* ============================================================
   VITÆ — As fronteiras entre as áreas
   Item X2 da §45.5: as checagens da §43.3 proibiam uma lista de
   nomes escrita à mão — `M`, `Cronista`, `Narrador`, `Diretor`,
   `Escada` — e deixaram passar `Dados`, `clan` e `FICHA_VAZIA`.
   Lista escrita à mão envelhece, e envelheceu duas vezes: a §47
   achou o F1 e o F2, a §49 achou `predador()` no Árbitro.

   Aqui nada é escrito à mão. **Tudo é derivado do código**: cada
   arquivo declara nomes, cada arquivo usa nomes, e a fronteira é
   a pergunta de quem pode usar o quê.

   A regra é a ordem de carga: uma área pode usar o que as áreas
   ANTERIORES declaram, e nunca o que as posteriores declaram.

       data → ficha → arbitro → cronista → front

   Item X3 junto: os tamanhos de arquivo, que a §45.5 registrou
   como "envelhece calado num documento", passam a ser conferidos
   aqui em vez de escritos lá.

       node --test testes/fronteiras.test.mjs
   ============================================================ */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { AREAS, ORDEM, RAIZ, carregar } from './carregar.mjs';

const ORDEM_DAS_AREAS = ['data', 'ficha', 'arbitro', 'cronista', 'front'];

const semComentario = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');

/* Comentário E literal de texto. Sem tirar as strings, a varredura
   acusa `data-clans.js usa "cidade"` — porque os arquivos de dados são
   prosa em português, e a prosa tem as palavras "cidade", "quando",
   "predador". Foi o primeiro resultado desta checagem: dezenas de
   violações, todas dentro de aspas.

   As crases viram ``, o que também apaga a interpolação `${...}` — e
   isso custa alguma cobertura em template string. É o preço certo:
   falso positivo em massa torna a checagem inútil, e o que passa por
   interpolação é quase sempre render, não dependência de motor. */
const soCodigo = (t) => semComentario(t)
  .replace(/`(?:\\[\s\S]|[^`\\])*`/g, '``')
  .replace(/'(?:\\[\s\S]|[^'\\\n])*'/g, "''")
  .replace(/"(?:\\[\s\S]|[^"\\\n])*"/g, '""')
  /* Literal de expressão regular também some: `/^_|_$/` fazia a
     varredura acusar que meio projeto "usa `$`", que é o nome do
     atalho de querySelector do front. */
  .replace(/(^|[=(,:[!&|?{;\n])\s*\/(?![/*])(?:\\.|\[[^\]]*\]|[^/\\\n])+\/[gimsuy]*/g, '$1 //re ');

/* Nomes que o arquivo LIGA localmente: método de objeto, parâmetro,
   variável desestruturada, laço. Não são dependência de escopo global,
   e sem esta lista a checagem acusa `Matilha.salvar(registro)` de usar
   a `salvar()` do criador — três falsos positivos por arquivo. */
function ligadosNoArquivo(fonte) {
  const limpa = soCodigo(fonte);
  const nomes = new Set(declarados(fonte));
  /* método de objeto e função aninhada: `  nome(args) {` */
  for (const m of limpa.matchAll(/^\s+(?:get |set |async )?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/gm)) {
    nomes.add(m[1]);
  }
  /* parâmetros de qualquer função ou arrow */
  for (const m of limpa.matchAll(/\(([^()]*)\)\s*(?:=>|\{)/g)) {
    for (const p of m[1].split(',')) {
      const id = p.trim().replace(/^\.\.\./, '').split(/[=:\s]/)[0];
      if (/^[A-Za-z_$][\w$]*$/.test(id)) nomes.add(id);
    }
  }
  /* declaração dentro de função: `    const perfil = {}` */
  for (const m of limpa.matchAll(/^\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) nomes.add(m[1]);
  /* desestruturação, laços e captura de erro */
  for (const m of limpa.matchAll(/(?:const|let|var)\s*[{[]([^}\]]*)[}\]]/g)) {
    for (const p of m[1].split(',')) {
      const id = p.trim().split(/[=:\s]/).pop().trim();
      if (/^[A-Za-z_$][\w$]*$/.test(id)) nomes.add(id);
    }
  }
  for (const m of limpa.matchAll(/(?:for\s*\(\s*(?:const|let|var)\s+|catch\s*\(\s*)([A-Za-z_$][\w$]*)/g)) {
    nomes.add(m[1]);
  }
  return nomes;
}

const fonteDe = (area, nome) =>
  fs.readFileSync(path.join(RAIZ, 'app', 'js', area, `${nome}.js`), 'utf8');

/** Nomes que um arquivo declara no topo — os que viram globais. */
function declarados(fonte) {
  return [...soCodigo(fonte).matchAll(/^(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)]
    .map(m => m[1]);
}

/** Nomes que um arquivo USA como identificador livre, e não como
    propriedade de objeto. O `(?<![.\w$])` é o que separa `perfil()`
    de `Seitas.perfil()` — método de objeto não é dependência. */
const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function usados(fonte, candidatos) {
  const limpa = soCodigo(fonte);
  const achados = new Set();
  for (const nome of candidatos) {
    /* Nome de uma letra só fica de fora. O caso é o `$` do front, o
       atalho de `querySelector`: casá-lo com segurança exigiria um
       parser de verdade, porque ele aparece em `${}` de template
       aninhado e em literal de expressão regular. Um alias de uma
       letra não é o tipo de dependência que esta checagem existe para
       achar — e falso positivo em massa torna checagem inútil. */
    if (nome.length < 2) continue;
    /* Três exclusões, e cada uma custou uma rodada desta checagem:

       `(?<![.\w$])`  — `Seitas.perfil()` não é `perfil()`. Método de
                        objeto não é dependência de escopo.
       `(?!\s*:)`     — `cidade: 'rio'` é CHAVE de objeto, não uso da
                        variável `cidade`. Sem isto, todo arquivo de
                        dados vira violação.
       `escapar()`    — sem escapar, o candidato `$` vira o metacaractere
                        "fim de linha" e casa com tudo. */
    const re = new RegExp(`(?<![.\\w$])${escapar(nome)}(?![\\w$])(?!\\s*:)`);
    if (re.test(limpa)) achados.add(nome);
  }
  return achados;
}

/** Mapa completo: quem declara o quê. */
const declaracoes = new Map();          // nome → área
for (const area of ORDEM_DAS_AREAS) {
  for (const arquivo of AREAS[area]) {
    for (const nome of declarados(fonteDe(area, arquivo))) {
      if (!declaracoes.has(nome)) declaracoes.set(nome, area);
    }
  }
}

test('Fronteiras — a direção das dependências', async (t) => {
  await t.test('nenhuma área usa nome declarado por área POSTERIOR', () => {
    /* Esta é a checagem que a §43.3 não tinha, e é a que teria pego o
       F1, o F2 e o `predador()` do Árbitro de uma vez só. */
    const violacoes = [];
    for (let i = 0; i < ORDEM_DAS_AREAS.length; i++) {
      const area = ORDEM_DAS_AREAS[i];
      const posteriores = new Set();
      for (const [nome, dona] of declaracoes) {
        if (ORDEM_DAS_AREAS.indexOf(dona) > i) posteriores.add(nome);
      }
      for (const arquivo of AREAS[area]) {
        const fonte = fonteDe(area, arquivo);
        const proprios = ligadosNoArquivo(fonte);
        for (const nome of usados(fonte, posteriores)) {
          if (proprios.has(nome)) continue;
          violacoes.push(`${area}/${arquivo}.js usa ${nome} (de ${declaracoes.get(nome)})`);
        }
      }
    }
    assert.deepEqual(violacoes, [], 'dependência apontando para cima');
  });

  await t.test('nenhum nome global é declarado em duas áreas', () => {
    /* Em script clássico, dois `const` de mesmo nome no escopo global
       é SyntaxError e o app abre mudo. Vale pegar antes do navegador. */
    const vistos = new Map();
    const repetidos = [];
    for (const area of ORDEM_DAS_AREAS) {
      for (const arquivo of AREAS[area]) {
        for (const nome of declarados(fonteDe(area, arquivo))) {
          const onde = `${area}/${arquivo}.js`;
          if (vistos.has(nome)) repetidos.push(`${nome}: ${vistos.get(nome)} e ${onde}`);
          else vistos.set(nome, onde);
        }
      }
    }
    assert.deepEqual(repetidos, [], 'nome global declarado duas vezes');
  });

  await t.test('cada área carrega com as anteriores, e só', () => {
    /* A prova executável: se `ficha` precisasse do front, isto
       estouraria. É o que tornou o F1 visível na §44. */
    for (let i = 0; i < ORDEM_DAS_AREAS.length; i++) {
      const ate = ORDEM_DAS_AREAS.slice(0, i + 1);
      assert.doesNotThrow(() => carregar(ate), `${ate.join(' + ')} não carrega`);
    }
  });
});

test('Fronteiras — o que cada área não pode saber', async (t) => {
  await t.test('nenhum motor de Ficha ou Árbitro devolve HTML', () => {
    const html = /<\/?(div|span|button|input|table|section|p|ul|li|h[1-6])\b/i;
    const sujos = [];
    for (const area of ['ficha', 'arbitro']) {
      for (const arquivo of AREAS[area]) {
        if (arquivo === 'ficha-oficial') continue;   // é render por projeto (§43)
        if (html.test(semComentario(fonteDe(area, arquivo)))) sujos.push(`${area}/${arquivo}.js`);
      }
    }
    assert.deepEqual(sujos, [], 'motor devolvendo HTML');
  });

  await t.test('a Ficha não sabe de mesa nem de crônica', () => {
    const proibidos = ['M', 'Cronista', 'Narrador', 'Diretor', 'Escada', 'Recombinador'];
    const sujos = [];
    for (const arquivo of AREAS.ficha) {
      for (const nome of usados(fonteDe('ficha', arquivo), proibidos)) {
        sujos.push(`ficha/${arquivo}.js → ${nome}`);
      }
    }
    assert.deepEqual(sujos, [], 'a Ficha passou a depender de sessão');
  });

  await t.test('o Árbitro não sabe de crônica nem de legado', () => {
    const proibidos = ['Cronista', 'Narrador', 'Diretor', 'Escada', 'Legado', 'Compilador'];
    const sujos = [];
    for (const arquivo of AREAS.arbitro) {
      for (const nome of usados(fonteDe('arbitro', arquivo), proibidos)) {
        sujos.push(`arbitro/${arquivo}.js → ${nome}`);
      }
    }
    assert.deepEqual(sujos, [], 'o Árbitro passou a depender da narrativa');
  });

  await t.test('ninguém fora do front lê o `S` do criador', () => {
    const sujos = [];
    for (const area of ['data', 'ficha', 'arbitro', 'cronista']) {
      for (const arquivo of AREAS[area]) {
        const limpa = soCodigo(fonteDe(area, arquivo));
        if (/(?<![\w$.])S\s*[.[]/.test(limpa)) sujos.push(`${area}/${arquivo}.js`);
        if (/[(,]\s*\w+\s*=\s*S\s*[),]/.test(limpa)) sujos.push(`${area}/${arquivo}.js (padrão = S)`);
      }
    }
    assert.deepEqual(sujos, [], 'voltou a existir dependência do S global');
  });

  await t.test('o front não recalcula regra por conta própria', () => {
    /* Ele pode CHAMAR o Árbitro; não pode refazer a conta. É a prova do
       defeito nº 1 da auditoria: interface e rolagem dando números
       diferentes. */
    const sujos = [];
    for (const arquivo of AREAS.front) {
      const limpa = soCodigo(fonteDe('front', arquivo));
      if (/_apurar\s*\(/.test(limpa)) sujos.push(`${arquivo}.js recalcula rolagem`);
      if (/\bd10\s*\(\s*\)/.test(limpa) && arquivo !== 'dados-ui') sujos.push(`${arquivo}.js rola dado`);
    }
    assert.deepEqual(sujos, [], 'o front virou dono de regra');
  });
});

/* ============================================================
   X3 — TAMANHO DE ARQUIVO, CONFERIDO EM VEZ DE ESCRITO
   ============================================================ */

const TETO = 750;

/* Os que ainda passam do teto, com o motivo. Encolher esta lista é o
   objetivo; encompridá-la sem escrever o porquê é o que o teste
   impede. Item X3: o README registrava contagens à mão, e as três
   estavam velhas quando foram conferidas. */
const GRANDES_CONHECIDOS = {
  'front/mesa.js': 'fluxo do turno, combate e persistência de estado',
  'front/criador-paineis.js': 'nove painéis em template string; trava na decisão de framework (§16.1)',
  'front/mesa-render.js': 'todo o HTML da mesa; mesma trava',
  'front/app.js': 'estado do criador, telas e importação/exportação; mesma trava'
};

test('Tamanho — nenhum arquivo cresce sem alguém saber (X3)', async (t) => {
  const linhasDe = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8').split('\n').length;

  await t.test('só os arquivos conhecidos passam de 750 linhas', () => {
    const grandes = [];
    for (const rel of ORDEM) {
      const curto = rel.replace('app/js/', '');
      const n = linhasDe(rel);
      if (n > TETO && !(curto in GRANDES_CONHECIDOS)) grandes.push(`${curto}: ${n} linhas`);
    }
    assert.deepEqual(grandes, [], `arquivo novo passou de ${TETO} linhas`);
  });

  await t.test('e os conhecidos não incharam mais 20%', () => {
    /* Não congela o tamanho — congelar obrigaria a mexer no teste a
       cada linha. Impede o crescimento silencioso, que é o problema. */
    const LIMITE = Math.round(TETO * 2.2);
    const estourando = [];
    for (const [curto, motivo] of Object.entries(GRANDES_CONHECIDOS)) {
      const n = linhasDe(`app/js/${curto}`);
      if (n > LIMITE) estourando.push(`${curto}: ${n} linhas (${motivo})`);
    }
    assert.deepEqual(estourando, [], `arquivo conhecido passou de ${LIMITE} linhas`);
  });

  await t.test('a lista de grandes conhecidos não tem fantasma', () => {
    /* Arquivo que encolheu abaixo do teto tem que SAIR da lista, senão
       a lista vira folclore. */
    const fantasmas = Object.keys(GRANDES_CONHECIDOS)
      .filter(curto => linhasDe(`app/js/${curto}`) <= TETO);
    assert.deepEqual(fantasmas, [], 'arquivo já não é grande e continua na lista');
  });

  await t.test('o README conta a mesma história', () => {
    /* Item X3 na origem: o documento dizia 1.017, 921 e 1.058 quando os
       arquivos tinham 1.716, 976 e 1.039. Aqui só se confere que ele
       não afirma número de linha nenhum sobre arquivo que mudou — os
       números vivem neste teste, não lá. */
    const readme = fs.readFileSync(path.join(RAIZ, 'README.md'), 'utf8');
    /* Só linhas de TRÊS colunas — `| arquivo | linhas | motivo |`. As de
       quatro são as tabelas históricas ("antes | depois", §27.1), e
       aquelas números velhos são o registro, não um erro. */
    const tabela = readme.match(/^\| `[\w.-]+\.js` \| [\d.]+ \| [^|]*\|\s*$/gm) || [];
    const erradas = [];
    for (const linha of tabela) {
      const [, arq, num] = linha.match(/`([\w.-]+\.js)` \| ([\d.]+)/);
      const achado = ORDEM.find(r => r.endsWith(`/${arq}`)) ||
                     (fs.existsSync(path.join(RAIZ, 'app', arq)) ? `app/${arq}` : null);
      if (!achado) continue;
      const real = linhasDe(achado);
      const dito = Number(num.replace('.', ''));
      if (Math.abs(real - dito) > real * 0.1) erradas.push(`${arq}: README diz ${dito}, são ${real}`);
    }
    assert.deepEqual(erradas, [], 'contagem de linha velha no README');
  });
});

/* ============================================================
   NENHUMA FALHA ENGOLIDA EM SILÊNCIO
   ============================================================ */

test('Nada engole exceção sem dizer nada', async (t) => {
  const CATCH_VAZIO = /catch\s*\([^)]*\)\s*\{\s*\}/;

  const arquivosDoApp = () => {
    const lista = [];
    for (const area of ORDEM_DAS_AREAS) {
      for (const nome of AREAS[area]) lista.push([`app/js/${area}`, `${nome}.js`]);
    }
    for (const nome of fs.readdirSync(path.join(RAIZ, 'servidor'))) {
      if (nome.endsWith('.mjs')) lista.push(['servidor', nome]);
    }
    return lista;
  };

  await t.test('não existe `catch` vazio em lugar nenhum', () => {
    /* Foi o padrão mais caro deste projeto. O MESMO `catch` de uma
       linha escondeu: perda de sessão (N2), perda da ficha em edição
       (N3), perda de matilha (F5), perda de legado, o interruptor de
       material oficial voltando sozinho — e o pior de todos, o
       validador emagrecendo quando o guia de estilo não carregava
       (§51.4), o que fazia o modelo "passar" em checagens que já não
       existiam.

       Este teste existe porque eu escrevi "não há mais nenhum" no
       README ANTES de conferir, e a afirmação estava errada por seis.
       Agora ela não depende da minha palavra. */
    const sujos = [];
    for (const [pasta, nome] of arquivosDoApp()) {
      const limpa = semComentario(fs.readFileSync(path.join(RAIZ, pasta, nome), 'utf8'));
      if (CATCH_VAZIO.test(limpa)) sujos.push(`${pasta}/${nome}`);
    }
    assert.deepEqual(sujos, [], 'voltou a existir catch vazio');
  });

  await t.test('todo `catch` avisa, devolve ou relança', () => {
    /* A outra metade do mesmo defeito: `catch` que faz alguma coisa
       inútil é tão mudo quanto o vazio. O que vale é sair de lá com
       um `return`, um `throw`, um `console` ou um aviso ao jogador. */
    const suspeitos = [];
    for (const [pasta, nome] of arquivosDoApp()) {
      const limpa = semComentario(fs.readFileSync(path.join(RAIZ, pasta, nome), 'utf8'));
      for (const m of limpa.matchAll(/catch\s*\([^)]*\)\s*\{([^{}]*)\}/g)) {
        const corpo = m[1].trim();
        /* `reject(...)` é relançar numa Promise — sai do `catch` tão
           alto quanto um `throw`. */
        if (!/console\.|return|throw|reject|toast|aviso|problemas/.test(corpo)) {
          suspeitos.push(`${pasta}/${nome}: ${corpo.slice(0, 40) || '(vazio)'}`);
        }
      }
    }
    assert.deepEqual(suspeitos, [], 'catch que não avisa nem devolve');
  });
});

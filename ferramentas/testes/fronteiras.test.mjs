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
import os from 'node:os';
 import { spawn } from 'node:child_process';
import { AREAS, ORDEM, ARQUIVOS, ORDEM_DAS_AREAS, RAIZ, caminhoDe, carregar } from './carregar.mjs';

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
  fs.readFileSync(path.join(RAIZ, caminhoDe(area, nome)), 'utf8');

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
        if (arquivo === 'ficha-modelo') continue;   // é render por projeto (§43)
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
       diferentes. Front e Mesa juntos: a Mesa é quem instala a fonte e
       quem rola de verdade (§82), então ela é a mais provável de
       reincidir. */
    const sujos = [];
    for (const area of ['front', 'mesa']) for (const arquivo of AREAS[area]) {
      const limpa = soCodigo(fonteDe(area, arquivo));
      if (/_apurar\s*\(/.test(limpa)) sujos.push(`${arquivo}.js recalcula rolagem`);
      if (/\bd10\s*\(\s*\)/.test(limpa) && arquivo !== 'dados-ui') sujos.push(`${arquivo}.js rola dado`);
    }
    assert.deepEqual(sujos, [], 'o front virou dono de regra');
  });
});

/* ============================================================
   O RELATOR TAMBÉM PRECISA SER CONFERIDO  (§94)

   Ele é quem responde "passou?", e na §94 ele respondeu errado: um
   grupo que estourou ANTES de rodar os filhos apareceu com ✖ na lista
   e mesmo assim o resumo dizia "0 reprovaram". A regra "só as folhas
   contam" estava certa para o caso comum e cega para esse.

   Um relator que erra para menos é pior que nenhum: ele dá a
   tranquilidade sem o fato. Este teste roda o relator de verdade, por
   fora, sobre um arquivo de mentira com os três casos.
   ============================================================ */
test('Relator — ele conta o que reprovou, inclusive o grupo que estourou (§94)', async (t) => {
  /* A pasta fica DENTRO do projeto, e não em os.tmpdir(): tanto o
     reporter quanto o arquivo de teste são passados ao `node --test`
     como caminho, e caminho absoluto do Windows não sobrevive nem ao
     carregador de ESM nem ao casamento de arquivos do runner. Um nível
     de pasta a mais também mantém o arquivo fora de
     `ferramentas/testes/*.test.mjs`, que é o que o `npm test` varre. */
  const relativa = 'ferramentas/testes/.relator-de-mentira';
  const pasta = path.join(RAIZ, relativa);
  fs.mkdirSync(pasta, { recursive: true });
  const alvo = path.join(pasta, 'mentira.test.mjs');
  fs.writeFileSync(alvo, [
    "import test from 'node:test';",
    "import assert from 'node:assert/strict';",
    "test('grupo que estoura antes dos filhos', async (t) => {",
    "  JSON.parse('{ quebrado');",
    "  await t.test('nunca chega aqui', () => assert.ok(true));",
    "});",
    "test('grupo cujo filho reprova', async (t) => {",
    "  await t.test('o filho que reprova', () => assert.equal(1, 2));",
    "});",
    "test('grupo que passa', async (t) => {",
    "  await t.test('o filho que passa', () => assert.ok(true));",
    "});"
  ].join('\n'));

  /* O FILHO NÃO PODE HERDAR O AMBIENTE DO PAI.

     O runner marca `NODE_TEST_CONTEXT` no processo, e um `node --test`
     que enxerga essa marca se recusa a rodar: "run() is being called
     recursively within a test file. skipping running files". Ele avisa
     no STDERR e sai com o stdout vazio — o que, com o stderr jogado
     fora, aparece como um relator que não imprimiu nada. Foram duas
     corridas até alguém ler o stderr, e é por isso que ele agora entra
     na mensagem de falha. */
  const ambiente = () => {
    const e = Object.assign({}, process.env, { VITAE_SEM_REGISTRO: '1' });
    delete e.NODE_TEST_CONTEXT;
    delete e.NODE_OPTIONS;
    return e;
  };

  const saida = await new Promise((ok) => {
    const proc = spawn(process.execPath,
      /* caminho RELATIVO de propósito: o carregador de ESM do Node recusa
         caminho absoluto do Windows como reporter ('protocol c:'), e é por
         isso que o package.json também usa './ferramentas/testes/relator.mjs'. */
      ['--test', '--test-reporter=./ferramentas/testes/relator.mjs',
       '--test-reporter-destination=stdout', `${relativa}/mentira.test.mjs`],
      { cwd: RAIZ, env: ambiente() });
    let txt = '', ruim = '';
    proc.stdout.on('data', (b) => { txt += b; });
    proc.stderr.on('data', (b) => { ruim += b; });
    proc.on('close', () => ok(txt || `[nada no stdout] ${ruim.slice(0, 400)}`));
  });

  try {
    await t.test('o grupo que estourou entra na conta', (t2) => {
      t2.diagnostic(saida.trim().split('\n').slice(-6).join(' · '));
      assert.match(saida, /grupo que estoura antes dos filhos/,
        'o grupo que estourou não apareceu no resumo');
    });

    await t.test('e o filho que reprovou também', () => {
      assert.match(saida, /o filho que reprova/);
    });

    await t.test('mas o grupo com filho ruim NÃO é contado duas vezes', (t2) => {
      const n = (saida.match(/✖ (\d+) de (\d+) reprovaram/) || [])[1];
      t2.diagnostic(`reprovaram: ${n}`);
      assert.equal(n, '2', 'o grupo agregador virou uma reprovação a mais');
    });

    await t.test('e o que passou continua contado', () => {
      assert.match(saida, /de 3 reprovaram/,
        'o total perdeu o teste que passou');
    });
  } finally {
    fs.rmSync(pasta, { recursive: true, force: true });
  }
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
  /* A CONDUÇÃO DO COMBATE SAIU NA §100, e com ela o teto próprio que
     este arquivo teve entre a §93 e a §100. A dívida tinha nome — o item
     F1 — e foi paga: 1.747 linhas viraram 1.507, e o limite comum voltou
     a servir.

     O teto próprio saiu junto. Config que sobra depois de paga a dívida
     é config morta, e este projeto já achou cinco tabelas mortas (§67,
     §90 duas vezes, §91, §100) — esta não vira a sexta. */
  /* Os três de Mesa mudaram de rótulo na reorganização que juntou
     `mesa.js` e companhia a `modulos/mesa/`, ao lado de
     `mesa-servidor.mjs`. GRANDES_CONHECIDOS é indexado pela
     área, e a área deles agora é `mesa`, não `front` — o motivo de
     cada um continua o mesmo. */
  /* `front/criador-paineis.js` SAIU desta lista: a decisão N5/N6
     (§16.2, "sem framework não há o que dividir") foi revista a pedido
     do usuário, e os nove painéis viraram nove arquivos em
     `paineis/`. O tronco caiu para menos de cem linhas — só o que mais
     de um painel usa (`numeroDoPasso`, `pontosHTML`, `campoSeita`). */
  'mesa/mesa.js': 'fluxo do turno e persistência de estado; a rodada mora em mesa-combate.js',
  'mesa/mesa-render.js': 'todo o HTML da mesa; mesma trava',
  'front/app.js': 'estado do criador, telas e importação/exportação; mesma trava',
  /* Passou do teto na §89, com o Apêndice II e o Apêndice III. As duas
     metades do §89 no front são ORQUESTRAÇÃO — chamam `Projetos` e
     `Limites`, aplicam o resultado, mandam redesenhar —, que é
     exatamente o que o cabeçalho deste arquivo diz ser o dono dele.
     Partir o front em mais arquivos é a decisão N5/N6, e ela já foi
     tomada: não entra. */
  'mesa/mesa-acoes.js': 'o despachante e a orquestração de toda ação da mesa; mesma trava'
};


test('Tamanho — nenhum arquivo cresce sem alguém saber (X3)', async (t) => {
  const linhasDe = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8').split('\n').length;

  /* GRANDES_CONHECIDOS é indexado pela ÁREA (`front/mesa.js`), que é o
     conceito estável; a PASTA mudou na §79 e a área não. */
  const caminhoCurto = (curto) => {
    const [area, arq] = curto.split('/');
    return caminhoDe(area, arq.replace(/\.js$/, ''));
  };

  await t.test('só os arquivos conhecidos passam de 750 linhas', () => {
    const grandes = [];
    for (const { curto, rel } of ARQUIVOS) {
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
      const n = linhasDe(caminhoCurto(curto));
      if (n > LIMITE) estourando.push(`${curto}: ${n} linhas de ${LIMITE} (${motivo})`);
    }
    assert.deepEqual(estourando, [], `arquivo conhecido passou de ${LIMITE} linhas`);
  });

  await t.test('a lista de grandes conhecidos não tem fantasma', () => {
    /* Arquivo que encolheu abaixo do teto tem que SAIR da lista, senão
       a lista vira folclore. */
    const fantasmas = Object.keys(GRANDES_CONHECIDOS)
      .filter(curto => linhasDe(caminhoCurto(curto)) <= TETO);
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
                     null;
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

  /* Os `.js` que o navegador carrega, MAIS todo `.mjs` de servidor do
     projeto. A varredura de `.mjs` era só `servidor/`; depois da §79 ela
     desce por `modulos/`, `comum/` e `ferramentas/`, senão um módulo
     novo nasce fora da regra sem ninguém notar.

     `ferramentas/testes/` fica DE FORA desde que `testes/` mudou de
     pasta para lá: esta regra é sobre o app, não sobre os testes que o
     verificam. Um teste que espera o servidor cair (`catch (e) { caiu =
     true; }`, com o `assert.ok(caiu, ...)` logo depois) não é exceção
     engolida — é o próprio teste. Antes da mudança de pasta, `testes/`
     nunca foi varrido por este teste; a exclusão aqui só devolve o
     mesmo alcance de antes. */
  const mjsDe = (pasta) => {
    const fora = [];
    const raiz = path.join(RAIZ, pasta);
    if (!fs.existsSync(raiz)) return fora;
    for (const item of fs.readdirSync(raiz, { withFileTypes: true })) {
      if (pasta === 'ferramentas' && item.name === 'testes') continue;
      const rel = `${pasta}/${item.name}`;
      if (item.isDirectory()) fora.push(...mjsDe(rel));
      else if (item.name.endsWith('.mjs')) fora.push(rel);
    }
    return fora;
  };

  const arquivosDoApp = () => {
    const lista = [];
    for (const area of ORDEM_DAS_AREAS) {
      for (const nome of AREAS[area]) lista.push(['', caminhoDe(area, nome)]);
    }
    for (const pasta of ['modulos', 'comum', 'ferramentas']) {
      for (const rel of mjsDe(pasta)) lista.push(['', rel]);
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

/* ============================================================
   A SEPARAÇÃO POR MÓDULO  (§79)

   A estrutura de pastas passou a ser a arquitetura, e não uma
   arrumação. Isso só vale enquanto ninguém puder desfazê-la sem
   perceber — e "sem perceber" é exatamente como as pastas antigas
   se desalinharam do `index.html` na §36, com o app abrindo mudo
   e 26 erros 404 que ninguém viu.
   ============================================================ */

test('Estrutura — uma pasta por módulo', async (t) => {
  const { resolver, RAIZES_PERMITIDAS, PAGINA_INICIAL } =
    await import('../../comum/servir-estatico.mjs');
  const { PASTA_DA_AREA } = await import('./carregar.mjs');

  await t.test('as pastas antigas não voltaram a existir', () => {
    /* `app/` e `servidor/` foram embora na §79. Recriar uma delas é
       o começo silencioso da volta ao layout antigo. */
    const ressuscitadas = ['app', 'servidor'].filter(p => fs.existsSync(path.join(RAIZ, p)));
    assert.deepEqual(ressuscitadas, [], 'pasta anterior à §79 de volta no projeto');
  });

  await t.test('toda área aponta para uma pasta que existe', () => {
    const quebradas = Object.entries(PASTA_DA_AREA)
      .filter(([, pasta]) => !fs.existsSync(path.join(RAIZ, pasta)))
      .map(([area, pasta]) => `${area} → ${pasta}`);
    assert.deepEqual(quebradas, [], 'PASTA_DA_AREA aponta para pasta inexistente');
  });

  await t.test('nenhum código ainda escreve os caminhos antigos', (t2) => {
    /* A varredura pega o que o `sed` da mudança não pegou. Documento
       fica de fora: o README tem um REGISTRO histórico, e lá `app/js/`
       é o que era verdade na §36, não um erro. */
    const varrer = (pasta) => {
      const fora = [];
      for (const item of fs.readdirSync(path.join(RAIZ, pasta), { withFileTypes: true })) {
        if (item.isDirectory()) fora.push(...varrer(`${pasta}/${item.name}`));
        else if (/\.(mjs|js|html|cmd|json)$/.test(item.name)) fora.push(`${pasta}/${item.name}`);
      }
      return fora;
    };
    const sujos = [];
    for (const rel of ['modulos', 'comum', 'ferramentas', 'testes'].flatMap(varrer)) {
      const texto = semComentario(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
      if (/\bapp\/js\/|\bnode servidor\/|['"`]\.\.\/servidor\//.test(texto)) sujos.push(rel);
    }
    t2.diagnostic(sujos.length ? sujos.join(', ') : 'nenhum');
    assert.deepEqual(sujos, [], 'caminho anterior à §79 ainda escrito em código');
  });

  await t.test('a página inicial existe onde o servidor a procura', () => {
    assert.ok(fs.existsSync(path.join(RAIZ, PAGINA_INICIAL)), PAGINA_INICIAL);
  });

  await t.test('só as três raízes são servíveis', (t2) => {
    /* Antes da §79 o teto era "dentro de app/". Agora é uma lista, e
       ela precisa ser a lista CURTA: servir a raiz do repositório
       entregaria docs/, testes/, package.json e os PDFs de Livros/. */
    assert.deepEqual([...RAIZES_PERMITIDAS].sort(), ['campanhas', 'comum', 'modulos']);

    const negados = ['/package.json', '/README.md', '/docs/regras.md', '/ferramentas/testes/carregar.mjs',
      '/Livros/basico.pdf', '/.git/config', '/sessoes/s1/ficha.json',
      '/../package.json', '/modulos/../package.json', '/comum/../../etc/passwd'];
    const vazando = negados.filter(u => resolver(RAIZ, u) !== null);
    t2.diagnostic(`${negados.length} tentativas, ${vazando.length} passaram`);
    assert.deepEqual(vazando, [], 'caminho fora das raízes foi aceito');

    /* E o que TEM de passar continua passando — senão o teste acima
       passaria com uma função que recusa tudo. */
    for (const u of ['/', '/modulos/cliente/js/app.js', '/comum/dados/data-traits.js',
                     '/campanhas/a-conta-do-duarte.md']) {
      assert.ok(resolver(RAIZ, u), `recusou ${u}, que é legítimo`);
    }
  });
});

/* ============================================================
   O README APONTA PARA COISAS QUE EXISTEM  (§81)

   O X3 trancou as CONTAGENS de linha. O que ele não tranca são os
   CAMINHOS, e foi exatamente isso que a §79 quebrou em quatro
   lugares: o documento e a interface mandavam rodar
   `node servidor/proxy.mjs` semanas depois de esse arquivo ter
   mudado de pasta.

   Caminho velho em documento é pior que contagem velha: a
   contagem só desinforma, o caminho faz quem lê digitar um
   comando que não funciona.
   ============================================================ */

test('Documento — o README aponta para arquivos que existem', async (t) => {
  const readme = fs.readFileSync(path.join(RAIZ, 'README.md'), 'utf8');
  /* As seções de REGISTRO citam caminhos de propósito — `app/js/...` era
     verdade na §36. Por isso a varredura olha só as quatro raízes de
     hoje: um caminho que começa por elas é uma afirmação sobre o
     presente, e tem de valer agora. */
  const RAIZES = ['modulos/', 'comum/', 'ferramentas/', 'testes/'];
  const pareceArquivo = (c) => /\.(js|mjs|cmd|html|css|json|md|txt)$/.test(c);

  await t.test('todo caminho de arquivo citado em `crase` está no disco', (t2) => {
    const citados = new Set();
    for (const m of readme.matchAll(/`([A-Za-z0-9_./-]+)`/g)) {
      const c = m[1];
      if (RAIZES.some(r => c.startsWith(r)) && pareceArquivo(c)) citados.add(c);
    }
    t2.diagnostic(`${citados.size} caminhos citados`);
    assert.ok(citados.size > 15, 'a varredura não achou caminho nenhum — o filtro quebrou');
    const sumidos = [...citados].filter(c => !fs.existsSync(path.join(RAIZ, c)));
    assert.deepEqual(sumidos, [], 'o README cita arquivo que não existe');
  });

  await t.test('todo `node <arquivo>` do README roda alguma coisa', (t2) => {
    /* O caso concreto da §79: `node servidor/proxy.mjs` em quatro
       lugares, e o arquivo já em `modulos/gateway/`. */
    /* Mesmo recorte do teste acima, e pelo mesmo motivo: as seções de
       registro CITAM o comando velho para contar qual era o defeito —
       "mandavam rodar `node servidor/proxy.mjs`" é a descrição do erro
       da §79, não uma instrução. O que precisa valer hoje é o que
       aponta para as pastas de hoje. */
    const comandos = [...readme.matchAll(/node\s+([A-Za-z0-9_./-]+\.(?:mjs|js|cmd))/g)]
      .map(m => m[1])
      .filter(c => RAIZES.some(r => c.startsWith(r)));
    const unicos = [...new Set(comandos)];
    t2.diagnostic(unicos.join(' · '));
    assert.ok(unicos.length >= 3, 'nenhum comando `node` achado');
    const quebrados = unicos.filter(c => !fs.existsSync(path.join(RAIZ, c)));
    assert.deepEqual(quebrados, [], 'o README manda rodar arquivo que não existe');
  });

  await t.test('o README não erra o NÚMERO DE ARQUIVOS de teste', (t2) => {
    /* A §81.3 registrou que o total de testes é a única contagem do
       README que ninguém confere: ele só existe depois que o runner
       termina, e um teste não consegue afirmá-lo sobre si mesmo.

       A contagem de ARQUIVOS não tem esse problema, e ela envelhece
       junto — o documento disse "dez arquivos" com doze no disco, e
       "11 arquivos" com doze, as duas vezes ao lado do total errado.
       Trancar a metade que dá para trancar é melhor que nenhuma. */
    const reais = fs.readdirSync(path.join(RAIZ, 'ferramentas', 'testes'))
      .filter(n => n.endsWith('.test.mjs')).length;
    const POR_EXTENSO = { dez: 10, onze: 11, doze: 12, treze: 13, catorze: 14, quatorze: 14 };
    const ditos = new Set();
    for (const m of readme.matchAll(/(\d+|dez|onze|doze|treze|catorze|quatorze) arquivos?/gi)) {
      const n = POR_EXTENSO[m[1].toLowerCase()] ?? Number(m[1]);
      /* Só números plausíveis para arquivo de teste: a palavra
         "arquivos" aparece em muita frase deste documento. */
      if (Number.isInteger(n) && n >= 5 && n <= 40) ditos.add(n);
    }
    t2.diagnostic(`${reais} no disco · o README diz ${[...ditos].sort((a, b) => a - b).join(', ')}`);
    /* Os registros de seção citam contagens velhas de propósito — é o
       histórico. O que não pode faltar é o número CERTO estar entre os
       citados. */
    assert.ok(ditos.has(reais),
      `o README não menciona os ${reais} arquivos de teste que existem`);
  });

  await t.test('todo `npm run x` do README existe no package.json', (t2) => {
    const scripts = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8')).scripts;
    const pedidos = [...new Set([...readme.matchAll(/npm run ([a-z:]+)/g)].map(m => m[1]))];
    t2.diagnostic(pedidos.join(' · '));
    const orfaos = pedidos.filter(x => !(x in scripts));
    assert.deepEqual(orfaos, [], 'o README manda rodar script que não existe');
  });

  await t.test('a interface não manda o jogador rodar arquivo inexistente', (t2) => {
    /* Metade do defeito da §79 estava no CÓDIGO, não no documento:
       `app.js` e `mesa.js` mostram o comando ao jogador quando o
       servidor não responde, e mostravam um caminho morto. */
    const front = [
      ...AREAS.front.map(n => ({ area: 'front', n })),
      ...AREAS.mesa.map(n => ({ area: 'mesa', n }))
    ].map(({ area, n }) =>
      fs.readFileSync(path.join(RAIZ, caminhoDe(area, n)), 'utf8')).join('\n');
    const comandos = [...new Set([...front.matchAll(/node\s+([A-Za-z0-9_./-]+\.mjs)/g)].map(m => m[1]))];
    t2.diagnostic(comandos.join(' · '));
    assert.ok(comandos.length >= 2, 'a interface não mostra comando nenhum');
    const quebrados = comandos.filter(c => !fs.existsSync(path.join(RAIZ, c)));
    assert.deepEqual(quebrados, [], 'a interface manda rodar arquivo que não existe');
  });
});

/* ============================================================
   UMA REGRA DE ORIGEM, NUM LUGAR SÓ  (§86, item M6)

   Ela estava escrita cinco vezes, e já discordou de si mesma uma
   vez: o 403 do pedido de encerrar, na §80.3. O que estes testes
   trancam é que não volte a haver uma sexta.
   ============================================================ */

test('Estrutura — a verificação de origem vive num lugar só (§86)', async (t) => {
  const Origem = await import('../../comum/origem.mjs');
  const { PORTAS } = await import('../../comum/portas.mjs');

  const pedido = (cabecalhos) => ({ headers: cabecalhos });

  await t.test('nenhum módulo reimplementa a regra', (t2) => {
    /* A trava principal. Se alguém colar de novo o `ORIGENS_ACEITAS` num
       módulo, o teste cobra — porque foi assim que a divergência da §80
       nasceu, e ela não custou nada até custar. */
    const arquivos = [];
    const varrer = (pasta) => {
      for (const item of fs.readdirSync(path.join(RAIZ, pasta), { withFileTypes: true })) {
        const rel = `${pasta}/${item.name}`;
        if (item.isDirectory()) varrer(rel);
        else if (item.name.endsWith('.mjs')) arquivos.push(rel);
      }
    };
    varrer('modulos'); varrer('comum');

    const sujos = arquivos.filter(rel => {
      if (rel === 'comum/origem.mjs') return false;
      const fonte = fs.readFileSync(path.join(RAIZ, rel), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, ' ');
      return /ORIGENS_ACEITAS|HOST_LOCAL/.test(fonte);
    });
    t2.diagnostic(`${arquivos.length} .mjs varridos`);
    assert.deepEqual(sujos, [], 'a regra de origem foi copiada de novo');
  });

  await t.test('os cinco módulos usam a função de `comum/`', (t2) => {
    const alvos = ['modulos/gateway/proxy.mjs', 'modulos/ficha/ficha-servidor.mjs',
                   'modulos/mesa/mesa-servidor.mjs', 'modulos/arbitro/arbitro-servidor.mjs',
                   'modulos/cronista/cronista-servidor.mjs'];
    const semImportar = alvos.filter(rel =>
      !/from '\.\.\/\.\.\/comum\/origem\.mjs'/.test(fs.readFileSync(path.join(RAIZ, rel), 'utf8')));
    t2.diagnostic(`${alvos.length} módulos, ${semImportar.length} sem importar`);
    assert.deepEqual(semImportar, [], 'módulo que não usa a regra comum');
  });

  await t.test('aceita a página do Gateway e a do próprio módulo', () => {
    const p = PORTAS.mesa;
    for (const h of ['localhost', '127.0.0.1', '[::1]']) {
      assert.equal(Origem.daPropriaCasa(pedido({ origin: `http://${h}:${PORTAS.gateway}` }), p), true,
        `recusou a página do Gateway em ${h}`);
      /* A ASSIMETRIA QUE NINGUÉM TINHA NOTADO: antes da §86 o Gateway
         aceitava `[::1]` na porta dele e os módulos não aceitavam
         `[::1]` na sua. Uma implementação, e some. */
      assert.equal(Origem.daPropriaCasa(pedido({ origin: `http://${h}:${p}` }), p), true,
        `recusou a própria página em ${h}`);
    }
  });

  await t.test('recusa origem de fora', () => {
    for (const mau of ['http://exemplo.invalido', 'https://localhost:5173',
                       'http://localhost:8080', 'http://127.0.0.1.evil.com:5173', 'null']) {
      assert.equal(Origem.daPropriaCasa(pedido({ origin: mau }), PORTAS.mesa), false,
        `aceitou ${mau}`);
    }
  });

  await t.test('sem `Origin`, vale o `Host` de laço local', (t2) => {
    /* É o que permite CHAMADA ENTRE MÓDULOS: `fetch` de servidor para
       servidor não manda `Origin`, e não deve — ele não vem de navegador.
       Foi a correção da §80.3, e agora ela é a regra escrita. */
    for (const host of ['127.0.0.1:5175', 'localhost:5175', '[::1]:5175', 'localhost']) {
      assert.equal(Origem.daPropriaCasa(pedido({ host }), PORTAS.mesa), true, `recusou ${host}`);
    }
    for (const host of ['exemplo.invalido', '10.0.0.4:5175', '']) {
      assert.equal(Origem.daPropriaCasa(pedido({ host }), PORTAS.mesa), false, `aceitou ${host}`);
    }
    t2.diagnostic('quatro hosts locais aceitos, três de fora recusados');
  });

  await t.test('pedido sem cabeçalho nenhum não estoura', () => {
    assert.equal(Origem.daPropriaCasa({}, PORTAS.mesa), false);
    assert.equal(Origem.daPropriaCasa(null, PORTAS.mesa), false);
  });
});

/* ============================================================
   O AVISO DE SESSÃO VIVA  (§86, item M7)
   ============================================================ */

test('Estrutura — desligar avisa que há sessão em andamento (§86)', async (t) => {
  const Sistemas = await import('../../comum/sistemas.mjs');

  await t.test('a saúde do módulo devolve o CORPO, e não só sim/não', (t2) => {
    /* Era booleano até a §86, e o aviso precisa do número que já existia
       em `/mesa/saude`. */
    assert.equal(typeof Sistemas.saudeDoModulo, 'function');
    const fonte = fs.readFileSync(path.join(RAIZ, 'comum', 'sistemas.mjs'), 'utf8');
    assert.match(fonte, /sessoesVivas/, 'o diagnóstico não carrega as sessões vivas');
    t2.diagnostic('saudeDoModulo existe e o estado carrega sessoesVivas');
  });

  await t.test('o Gateway não precisa de sonda para saber de si', async () => {
    const g = Sistemas.moduloPor('gateway');
    const s = await Sistemas.saudeDoModulo(g);
    assert.ok(s && s.ligado, 'o próprio processo se declarou fora');
  });

  await t.test('módulo fora devolve null, e não inventa sessão', async (t2) => {
    /* PORTA MORTA, E NÃO "o que estiver no ar".

       A primeira versão deste teste perguntava ao módulo `mesa` de
       verdade — e passou a falhar quando havia um MesaServer aberto na
       máquina, porque ele respondia. Teste que depende de o ambiente
       estar vazio afirma o ambiente, não o código. */
    const morto = { id: 'fantasma', nome: 'Fantasma', porta: 59999, saude: '/nada' };
    const s = await Sistemas.saudeDoModulo(morto, 300);
    t2.diagnostic(`porta morta → ${s}`);
    assert.equal(s, null);
    /* E `sessoesVivas` sai zero quando não há corpo: o `|| 0` da §86 é
       o que impede um `undefined` de virar "NaN sessões" no aviso. */
    assert.equal((s && Number(s.sessoesVivas)) || 0, 0);
  });

  await t.test('o estado carrega sessoesVivas para todo módulo', async (t2) => {
    const d = await Sistemas.estado();
    const semCampo = d.modulos.filter(m => typeof m.sessoesVivas !== 'number');
    t2.diagnostic(d.modulos.map(m => `${m.id}:${m.sessoesVivas}`).join(' · '));
    assert.deepEqual(semCampo, [], 'módulo sem a contagem de sessões');
  });
});

/* ============================================================
   AS DUAS LISTAS DE PENDÊNCIA CONTÊM OS MESMOS ITENS  (§87)

   O cabeçalho de `docs/Organização de arquivos.txt` avisa, com
   todas as letras: *"duas listas para o mesmo fato divergem em
   silêncio"*. Elas divergiram — G1, G3 e G5 estavam na tabela por
   peso do README e já não estavam no arquivo.

   ------------------------------------------------------------
   QUANDO ESTE TESTE FALHAR, REPARE PARA QUE LADO.
   ------------------------------------------------------------
   **O arquivo de pendências MANDA. O README segue.**

   `docs/Organização de arquivos.txt` é onde o usuário mexe à mão,
   e item que sumiu de lá sumiu porque ELE tirou. Isso não é perda
   de dado: é decisão, e é a única forma que ele tem de dizer
   "isto não é mais pendência".

   Então o reparo certo é quase sempre **tirar do README**, e
   nunca "restaurar no arquivo o que o README ainda cita". Este
   comentário existe porque eu reparei para o lado errado na
   primeira vez: repus três itens que tinham sido apagados de
   propósito, e chamei isso de conserto.

   O outro sentido — item no arquivo que a tabela não cita — é o
   que de fato pede escrita no README: trabalho aberto que a
   ordenação por peso não ordena.
   ============================================================ */

test('Documento — as duas listas de pendência não divergem (§87)', async (t) => {
  const pend = fs.readFileSync(path.join(RAIZ, 'docs', 'Organização de arquivos.txt'), 'utf8');
  const readme = fs.readFileSync(path.join(RAIZ, 'README.md'), 'utf8');

  /* No arquivo de pendências, item aberto é uma linha `  X9. ...` antes
     da seção FECHADO. */
  const aberto = pend.slice(0, pend.indexOf('== FECHADO =='));
  const naPendencia = new Set(
    [...aberto.matchAll(/^ {2}([A-Z]\d+)\. /gm)].map(m => m[1]));

  /* No README, a tabela por peso da §14.1.2 cita o id entre parênteses.

     O RECORTE VAI ATÉ A PRIMEIRA LINHA EM BRANCO, e não até uma linha
     específica. A primeira versão procurava `| 15 |` para achar o fim —
     e no dia em que a tabela encolheu para doze itens, `indexOf`
     devolveu -1, o recorte pegou metade do documento e o teste acusou
     nove itens históricos (A1, F3, N7…) de estarem fora da pendência.
     Delimitador que depende do CONTEÚDO da tabela quebra quando a
     tabela muda, que é justamente quando ele precisa funcionar. */
  const ini = readme.indexOf('| | Item | Área | Peso |');
  assert.ok(ini > 0, 'não achei a tabela por peso no README');
  const fim = readme.indexOf('\n\n', ini);
  const noReadme = new Set(
    [...readme.slice(ini, fim).matchAll(/\(([A-Z]\d+)\)/g)].map(m => m[1]));

  await t.test('as duas listas têm os mesmos itens', (t2) => {
    const soNaPendencia = [...naPendencia].filter(x => !noReadme.has(x)).sort();
    const soNoReadme = [...noReadme].filter(x => !naPendencia.has(x)).sort();
    t2.diagnostic(`${naPendencia.size} no arquivo · ${noReadme.size} na tabela do README`);

    /* AQUI HAVIA UM PISO DE DEZ ITENS, e ele reprovou na §89 — não
       porque algo quebrou, mas porque G8 e G9 foram PAGOS e a lista
       caiu para oito. Um piso assim mede o tamanho da dívida e
       chama isso de saúde do teste: quanto melhor o projeto fica,
       mais perto ele chega de reprovar.

       O que o piso queria proteger é outra coisa: que a varredura
       ainda ENTENDA o formato do arquivo. E isso as duas asserções
       abaixo já pegam melhor — regex que parou de casar devolve
       zero, e aí os oito itens do README aparecem como órfãos, com
       nome e tudo. O piso era, no melhor caso, redundante. */
    assert.ok(aberto.includes('== ABERTO =='),
      'o arquivo de pendências mudou de forma: não achei a seção ABERTO');
    /* Os dois sentidos falham, e o reparo é diferente em cada um:

         só na PENDÊNCIA  →  falta no README. Escreva lá.
         só no README     →  o usuário TIROU da pendência. Tire do README
                             também; não reponha no arquivo. */
    assert.deepEqual(soNaPendencia, [],
      'item aberto na pendência que a tabela por peso do README não cita');
    assert.deepEqual(soNoReadme, [],
      'o README ainda cita item que saiu da pendência — tire do README, não reponha no arquivo');
  });

  await t.test('nenhum item aberto aparece também como FECHADO', (t2) => {
    const fechado = pend.slice(pend.indexOf('== FECHADO =='));
    const fechados = new Set([...fechado.matchAll(/^ {2}([A-Z]\d+) \.+/gm)].map(m => m[1]));
    const nosDois = [...naPendencia].filter(x => fechados.has(x)).sort();
    t2.diagnostic(`${fechados.size} fechados · ${nosDois.length} em duplicidade`);
    assert.deepEqual(nosDois, [], 'item listado como aberto E como pago');
  });

  await t.test('a tabela por peso é numerada em sequência', (t2) => {
    const numeros = [...readme.slice(ini, fim).matchAll(/^\| (\d+) \| /gm)].map(m => Number(m[1]));
    t2.diagnostic(numeros.join(', '));
    /* Um `15` repetido passou despercebido nesta mesma seção, ao
       renumerar a tabela à mão depois de fechar um item. */
    assert.deepEqual(numeros, numeros.map((_, i) => i + 1),
      'a numeração da tabela por peso pulou ou repetiu');
  });
});

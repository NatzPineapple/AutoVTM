/* ============================================================
   VITÆ — Comparador de modelos do Cronista
   Roda a mesma noite N vezes em cada modelo e mede o que
   interessa: quantas vezes o validador reprova, por quê, e
   quanto tempo custa. O juiz é o mesmo validador da produção.

     node servidor/comparador.mjs mistral-nemo:12b granite4.1:8b
     node servidor/comparador.mjs --repeticoes 10 mistral-nemo:12b
     node servidor/comparador.mjs --camada narrador --repeticoes 10 mistral-nemo:12b
     node servidor/comparador.mjs --camada intencao --repeticoes 2 qwen2.5:7b
     node servidor/comparador.mjs --camada intencao --sem-contexto qwen2.5:7b
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cronicar } from './cronista.mjs';
import { narrar, saudeDoValidador } from './narrador.mjs';
import { extrair, TIPOS } from './intencao.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function argumentos(argv) {
  const opcoes = { provedor: 'ollama', repeticoes: 3, tipo: 'capitulo', camada: 'cronista',
                   amostra: null, exemplos: null, modelos: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--provedor') opcoes.provedor = argv[++i];
    else if (a === '--repeticoes') opcoes.repeticoes = Number(argv[++i]);
    else if (a === '--tipo') opcoes.tipo = argv[++i];
    else if (a === '--amostra') opcoes.amostra = argv[++i];
    else if (a === '--camada') opcoes.camada = argv[++i];
    else if (a === '--exemplos') opcoes.exemplos = argv[++i] === 'sim';
    else if (a === '--sem-contexto') opcoes.semContexto = true;
    else opcoes.modelos.push(a);
  }
  if (!opcoes.amostra) {
    opcoes.amostra = opcoes.camada === 'narrador' ? 'servidor/amostras/turno-camarim.json'
                   : opcoes.camada === 'intencao' ? 'servidor/amostras/intencoes.json'
                   : 'servidor/amostras/noite-carnaval.json';
  }
  return opcoes;
}

const pad = (t, n) => String(t).padEnd(n);
const padE = (t, n) => String(t).padStart(n);

function barra(titulo) {
  console.log('\n' + '─'.repeat(78));
  console.log(titulo);
  console.log('─'.repeat(78));
}

async function medir(modelo, dados, opcoes) {
  const corridas = [];
  for (let i = 0; i < opcoes.repeticoes; i++) {
    const inicio = Date.now();
    try {
      const comuns = { provedor: opcoes.provedor, modelo, tempoLimite: 600000 };
      if (opcoes.exemplos !== null) comuns.exemplos = opcoes.exemplos;
      const r = opcoes.camada === 'narrador'
        ? await narrar(dados, comuns)
        : await cronicar(opcoes.tipo, dados, comuns);
      corridas.push({
        ok: true,
        passouDePrimeira: r.problemasNaPrimeira.length === 0,
        problemas: r.problemasNaPrimeira,
        valido: r.valido,
        tentativas: r.tentativas,
        ms: r.milissegundos,
        uso: r.uso,
        saida: r.saida
      });
      process.stdout.write(r.problemasNaPrimeira.length === 0 ? '.' : '×');
    } catch (e) {
      corridas.push({ ok: false, erro: e.message, ms: Date.now() - inicio });
      process.stdout.write('!');
    }
  }
  process.stdout.write('\n');
  return corridas;
}


const SUJEIRA = ['\`\`\`', 'claro', 'desculpe', 'como posso', 'assistente'];

async function medirIntencao(modelo, dados, opcoes) {
  const contexto = opcoes.semContexto ? {} : (dados.cena || {});
  const erros = [], foraDoFormato = [], faltando = [], tempos = [];
  let acertos = 0, total = 0;

  for (let i = 0; i < opcoes.repeticoes; i++) {
    for (const caso of dados.casos) {
      const r = await extrair(caso.frase, { modelo, contexto });
      const s = r.intencao;
      tempos.push(r.milissegundos);
      total++;

      if (!TIPOS.includes(s.action_type)) {
        foraDoFormato.push(`${caso.frase}: tipo inválido ${s.action_type}`);
        process.stdout.write('!');
        continue;
      }
      const texto = Object.values(s).filter(v => typeof v === 'string').join(' ').toLowerCase();
      const suja = SUJEIRA.filter(p => texto.includes(p));
      if (suja.length) foraDoFormato.push(`${caso.frase}: texto conversacional ${suja.join(', ')}`);

      if (s.action_type === caso.tipo) { acertos++; process.stdout.write('.'); }
      else { erros.push(`${caso.frase}: veio ${s.action_type}, esperado ${caso.tipo}`); process.stdout.write('×'); }

      const vazios = (caso.exige || []).filter(c => !s[c]);
      if (vazios.length) faltando.push(`${caso.frase}: sem ${vazios.join(', ')}`);
    }
  }
  process.stdout.write('\n');
  tempos.sort((a, b) => a - b);
  return { modelo, total, acertos, taxa: total ? +(100 * acertos / total).toFixed(1) : 0,
           foraDoFormato, erros, faltando,
           mediana: tempos[Math.floor(tempos.length / 2)] || 0, pior: tempos[tempos.length - 1] || 0 };
}

function tabelaIntencao(resultados, opcoes) {
  barra('RESULTADO');
  console.log(pad('modelo', 22) + padE('tipo ok', 9) + padE('formato', 9) +
              padE('ms med', 9) + padE('ms pior', 9));
  for (const r of resultados) {
    console.log(pad(r.modelo, 22) + padE(`${r.acertos}/${r.total}`, 9) +
                padE(r.foraDoFormato.length ? `${r.foraDoFormato.length} ✕` : 'ok', 9) +
                padE(r.mediana, 9) + padE(r.pior, 9));
  }
  for (const r of resultados) {
    for (const [rotulo, lista] of [['FORA DO FORMATO', r.foraDoFormato],
                                   ['TIPO ERRADO', r.erros],
                                   ['CAMPO ESPERADO VAZIO', r.faltando]]) {
      if (!lista.length) continue;
      barra(`${r.modelo} — ${rotulo}`);
      lista.forEach(x => console.log('  ' + x));
    }
  }
}

function palavras(t) { return String(t || '').trim().split(/\s+/).filter(Boolean).length; }

/* ------------------------------------------------------------
   QUANTO DESTE NÚMERO É RUÍDO

   A §34.4 registrou duas corridas idênticas do mesmo modelo dando
   6/10 e 2/10. O comparador imprimia "6/10" como se fosse medida, e
   a partir daí toda conclusão sobre prompt era chute com aparência
   de dado.

   Intervalo de Wilson: mais honesto que o normal para proporção com
   n pequeno, e não devolve limite fora de [0,1] — que é exatamente
   onde este projeto vive.
   ------------------------------------------------------------ */
function wilson(acertos, total, z = 1.96) {
  if (!total) return { p: 0, min: 0, max: 1 };
  const p = acertos / total;
  const d = 1 + z * z / total;
  const centro = (p + z * z / (2 * total)) / d;
  const meio = (z * Math.sqrt(p * (1 - p) / total + z * z / (4 * total * total))) / d;
  return { p, min: Math.max(0, centro - meio), max: Math.min(1, centro + meio) };
}

const pct = (x) => `${Math.round(x * 100)}%`;

/** Quantas repetições seriam precisas para o intervalo ficar menor
    que `larguraAlvo`. Responde a pergunta que sempre aparece: "roda
    mais quantas vezes?" */
function repeticoesNecessarias(p, larguraAlvo = 0.20, z = 1.96) {
  const variancia = Math.max(p * (1 - p), 0.05);
  return Math.ceil(4 * z * z * variancia / (larguraAlvo * larguraAlvo));
}

/** Dois modelos são distinguíveis quando os intervalos não se tocam. */
function comparar(a, b) {
  const ia = wilson(a.validas, a.corridas);
  const ib = wilson(b.validas, b.corridas);
  const separados = ia.min > ib.max || ib.min > ia.max;
  return { ia, ib, separados };
}

function resumir(modelo, corridas) {
  const boas = corridas.filter(c => c.ok);
  const falhas = corridas.filter(c => !c.ok);
  const dePrimeira = boas.filter(c => c.passouDePrimeira).length;
  const validas = boas.filter(c => c.valido).length;
  const media = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const motivos = {};
  boas.forEach(c => c.problemas.forEach(p => {
    const chave = p.replace(/: ".*"$/, '').replace(/: .*$/, '');
    motivos[chave] = (motivos[chave] || 0) + 1;
  }));

  const prosa = boas.map(c => palavras(c.saida.cronica || c.saida.dossie || c.saida.texto));

  return {
    modelo,
    corridas: corridas.length,
    erros: falhas.length,
    dePrimeira,
    validas,
    msMedio: media(boas.map(c => c.ms)),
    entradaMedia: media(boas.map(c => c.uso.entrada)),
    saidaMedia: media(boas.map(c => c.uso.saida)),
    palavrasMedia: media(prosa),
    motivos,
    exemplo: boas.length ? boas[boas.length - 1].saida : null,
    mensagensDeErro: falhas.map(f => f.erro)
  };
}

async function principal() {
  const opcoes = argumentos(process.argv.slice(2));
  if (!opcoes.modelos.length) {
    console.log('Informe ao menos um modelo. Exemplo:');
    console.log('  node servidor/comparador.mjs mistral-nemo:12b granite4.1:8b');
    process.exit(1);
  }

  const dados = JSON.parse(fs.readFileSync(path.join(RAIZ, opcoes.amostra), 'utf8'));

  barra(`VITÆ — comparador do Cronista`);
  console.log(`amostra    : ${opcoes.amostra}`);
  console.log(`camada     : ${opcoes.camada}${opcoes.camada === 'cronista' ? ' · ' + opcoes.tipo : ''}`);
  console.log(`few-shot   : ${opcoes.exemplos === null ? 'padrão do provedor' : (opcoes.exemplos ? 'ligado' : 'desligado')}`);
  console.log(`provedor   : ${opcoes.provedor}`);
  console.log(`repetições : ${opcoes.repeticoes} por modelo`);
  console.log(`modelos    : ${opcoes.modelos.join(', ')}`);
  const saude = saudeDoValidador();
  console.log(`\nO JUIZ: o mesmo validador da produção, e ele carregou —`);
  console.log(`  lista negra de vocabulário : ${saude.listaNegra} termos`);
  console.log(`  assinaturas do few-shot    : ${saude.assinaturasDoFewShot}`);
  console.log(`  léxico do few-shot         : ${saude.lexicoDoFewShot} palavras`);
  if (!saude.completo) {
    console.log(`\n  *** O JUIZ ESTÁ INCOMPLETO. Medir agora dá número mais alto`);
    console.log(`      do que a realidade, porque checagens estão desligadas: ***`);
    saude.problemas.forEach(p => console.log(`      - ${p}`));
  }
  console.log(`. = passou de primeira   × = reprovou e precisou de retentativa   ! = erro`);

  if (opcoes.camada === 'intencao') {
    const resultados = [];
    for (const modelo of opcoes.modelos) {
      process.stdout.write(`\n${modelo} `);
      resultados.push(await medirIntencao(modelo, dados, opcoes));
    }
    tabelaIntencao(resultados, opcoes);
    fs.writeFileSync(path.join(RAIZ, 'servidor/amostras/ultima-comparacao.json'),
      JSON.stringify({ opcoes, resultados }, null, 1));
    return;
  }

  const resumos = [];
  for (const modelo of opcoes.modelos) {
    process.stdout.write(`\n${modelo} `);
    const corridas = await medir(modelo, dados, opcoes);
    resumos.push(resumir(modelo, corridas));
  }

  barra('RESULTADO');
  console.log(pad('modelo', 22) + padE('1ª ok', 7) + padE('válido', 8) +
              padE('intervalo', 16) + padE('erros', 6) + padE('seg', 6) +
              padE('entrada', 8) + padE('saída', 7) + padE('palavras', 9));
  for (const r of resumos) {
    const w = wilson(r.validas, r.corridas);
    console.log(
      pad(r.modelo, 22) +
      padE(`${r.dePrimeira}/${r.corridas}`, 7) +
      padE(`${r.validas}/${r.corridas}`, 8) +
      padE(`${pct(w.min)} a ${pct(w.max)}`, 16) +
      padE(r.erros, 6) +
      padE((r.msMedio / 1000).toFixed(1), 6) +
      padE(r.entradaMedia, 8) +
      padE(r.saidaMedia, 7) +
      padE(r.palavrasMedia, 9));
  }

  barra('O QUE ESTE NÚMERO PERMITE AFIRMAR');
  for (const r of resumos) {
    const w = wilson(r.validas, r.corridas);
    const largura = w.max - w.min;
    console.log(`\n${r.modelo}: ${r.validas} de ${r.corridas} ` +
                `(${pct(w.p)}, e o real está entre ${pct(w.min)} e ${pct(w.max)})`);
    if (largura > 0.30) {
      const n = repeticoesNecessarias(w.p);
      console.log(`  O intervalo tem ${pct(largura)} de largura. ISSO NÃO É MEDIDA — é indício.`);
      console.log(`  Para estreitar a 20 pontos, seriam ~${n} repetições em vez de ${r.corridas}.`);
    } else {
      console.log(`  Intervalo de ${pct(largura)}: dá para comparar com outra corrida.`);
    }
  }

  if (resumos.length >= 2) {
    console.log('');
    for (let i = 0; i < resumos.length; i++) {
      for (let j = i + 1; j < resumos.length; j++) {
        const a = resumos[i], b = resumos[j];
        const c = comparar(a, b);
        const melhor = a.validas / a.corridas >= b.validas / b.corridas ? a : b;
        console.log(c.separados
          ? `  ${a.modelo} × ${b.modelo}: DISTINGUÍVEIS — ${melhor.modelo} é melhor.`
          : `  ${a.modelo} × ${b.modelo}: NÃO DÁ PARA DISTINGUIR. Os intervalos se tocam,\n` +
            `    e a diferença observada cabe dentro do ruído. Não conclua nada daqui.`);
      }
    }
  }

  barra('POR QUE O VALIDADOR REPROVOU');
  for (const r of resumos) {
    const chaves = Object.keys(r.motivos);
    console.log(`\n${r.modelo}`);
    if (!chaves.length) console.log('  nenhuma reprovação');
    else chaves.sort((a, b) => r.motivos[b] - r.motivos[a])
      .forEach(k => console.log(`  ${padE(r.motivos[k], 3)} × ${k}`));
    if (r.mensagensDeErro.length) {
      console.log('  erros de transporte:');
      [...new Set(r.mensagensDeErro)].forEach(m => console.log(`    ${m}`));
    }
  }

  barra('UMA AMOSTRA DE CADA');
  for (const r of resumos) {
    console.log(`\n### ${r.modelo}`);
    if (!r.exemplo) { console.log('  (nenhuma corrida completou)'); continue; }
    const s = r.exemplo;
    console.log(`título : ${s.titulo || '—'}`);
    console.log(`prosa  : ${(s.cronica || s.dossie || s.texto || '').replace(/\n/g, ' ')}`);
    if (s.pedirTeste) console.log(`teste  : ${s.pedirTeste.intencao} — ${s.pedirTeste.motivo}`);
    if (s.aconteceu) console.log(`fatos  : ${s.aconteceu.join(' | ')}`);
    if (s.precoPago && s.precoPago.length) console.log(`preço  : ${s.precoPago.join(' | ')}`);
    if (s.proximoBeat) console.log(`gancho : ${s.proximoBeat}`);
  }

  const destino = path.join(RAIZ, 'servidor/amostras/ultima-comparacao.json');
  fs.writeFileSync(destino, JSON.stringify({ opcoes, resumos }, null, 2));
  console.log(`\nresultado completo em ${path.relative(RAIZ, destino)}`);
}

principal().catch(e => { console.error(e); process.exit(1); });

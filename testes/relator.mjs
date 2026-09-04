/* ============================================================
   VITÆ — Relator dos testes
   Escreve um registro legível de TUDO o que rodou, para auditoria:
   qual teste, em que arquivo, quanto tempo, passou ou não, e a
   mensagem completa de cada falha.

   O runner do Node já mostra isso no terminal, e o terminal rola.
   Um arquivo não rola: dá para abrir depois, comparar duas
   corridas, procurar por nome e mandar para alguém.

   Zero dependência — é um "reporter" nativo do `node --test`, que
   é só um módulo exportando uma função que recebe o fluxo de
   eventos.

       npm test              roda e escreve o registro
       npm run testes:log    mostra o registro mais recente

   Sai em `testes/registro/`, ignorado pelo git: registro é
   resultado de execução, não código.
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PASTA = path.join(AQUI, 'registro');

const doisDigitos = (n) => String(n).padStart(2, '0');

function carimbo(d) {
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}` +
         ` ${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}:${doisDigitos(d.getSeconds())}`;
}
function nomeDoArquivo(d) {
  return `${d.getFullYear()}${doisDigitos(d.getMonth() + 1)}${doisDigitos(d.getDate())}` +
         `-${doisDigitos(d.getHours())}${doisDigitos(d.getMinutes())}${doisDigitos(d.getSeconds())}.md`;
}

const ms = (n) => (n == null ? '' : `${n < 1 ? n.toFixed(2) : Math.round(n)} ms`);

const curto = (arquivo) => {
  if (!arquivo) return '(sem arquivo)';
  return path.relative(path.dirname(AQUI), arquivo).replace(/\\/g, '/');
};

export default async function* relator(fonte) {
  const inicio = new Date();
  const t0 = Date.now();

  /* arquivo → lista de { nome, nivel, ok, duracao, erro } */
  const porArquivo = new Map();
  const falhas = [];
  let passaram = 0, reprovaram = 0, pulados = 0;

  /* EVIDÊNCIA — o que o teste realmente viu.

     "✓ dois dez valem 4 sucessos" diz que passou. Não diz quais dados
     saíram, nem quantos sucessos foram contados. Quem audita a suíte
     precisa do segundo, e um registro que só tem o primeiro obriga a
     abrir o código para saber o que foi conferido.

     O teste anexa com `t.diagnostic(...)`, que é o mecanismo nativo do
     runner.

     ELAS CHEGAM DEPOIS do resultado do teste a que pertencem — o runner
     emite `test:pass` e só então as diagnósticas daquele teste. A
     primeira versão deste relator supôs o contrário e pendurou cada
     evidência no teste SEGUINTE: o registro ficou coerente, legível e
     errado, dizendo que "o 6 conta e o 5 não" tinha visto `[6,7,8,9]`.

     Por isso a evidência vai para o ÚLTIMO teste fechado naquele
     arquivo. As linhas de resumo do próprio runner ("tests 435") também
     vêm por aqui e se distinguem por não terem arquivo. */
  const ultimoDoArquivo = new Map();

  const guardar = (arquivo, item) => {
    const chave = curto(arquivo);
    if (!porArquivo.has(chave)) porArquivo.set(chave, []);
    porArquivo.get(chave).push(item);
  };

  for await (const evento of fonte) {
    const d = evento.data || {};

    if (evento.type === 'test:diagnostic' && d.file) {
      const dono = ultimoDoArquivo.get(curto(d.file));
      if (dono) dono.evidencias.push(String(d.message || ''));
      continue;
    }

    if (evento.type === 'test:pass' || evento.type === 'test:fail') {
      /* O runner emite um evento por teste E um por grupo. O grupo tem
         `nesting: 0` e agrega os filhos; contá-lo dobraria o total. Só
         os folhas são contados, e os grupos viram cabeçalho. */
      const ehGrupo = (d.nesting || 0) === 0;
      const ok = evento.type === 'test:pass';
      const item = {
        nome: d.name || '(sem nome)',
        nivel: d.nesting || 0,
        ok,
        pulado: !!(d.skip || d.todo),
        duracao: d.details && d.details.duration_ms,
        erro: (d.details && d.details.error) || null,
        evidencias: []
      };
      guardar(d.file, item);
      /* o próximo diagnóstico deste arquivo pertence a este teste */
      if (!ehGrupo) ultimoDoArquivo.set(curto(d.file), item);

      if (!ehGrupo) {
        if (item.pulado) pulados++;
        else if (ok) passaram++;
        else reprovaram++;
      }
      if (!ok && !ehGrupo) {
        falhas.push({ arquivo: curto(d.file), nome: item.nome, erro: item.erro,
                      linha: d.line, evidencias: item.evidencias });
      }
    }
  }

  /* ---------- o registro ---------- */
  const L = [];
  const total = passaram + reprovaram + pulados;
  const verde = reprovaram === 0;

  L.push(`# Registro de testes — VITÆ`);
  L.push('');
  L.push(`**${carimbo(inicio)}** · ${((Date.now() - t0) / 1000).toFixed(2)} s`);
  L.push('');
  L.push(verde ? `## ${passaram} de ${total} passaram. Nada quebrado.`
               : `## ${reprovaram} de ${total} REPROVARAM.`);
  L.push('');
  L.push('| | |');
  L.push('|---|---|');
  L.push(`| Passaram | ${passaram} |`);
  L.push(`| Reprovaram | ${reprovaram} |`);
  if (pulados) L.push(`| Pulados | ${pulados} |`);
  L.push(`| Arquivos | ${porArquivo.size} |`);
  const comEvidencia = [...porArquivo.values()].flat()
    .filter(i => i.evidencias && i.evidencias.length).length;
  L.push(`| Com evidência | ${comEvidencia} |`);
  L.push('');
  L.push('> O runner do Node imprime um número maior — ele conta cada GRUPO como');
  L.push('> um teste, além dos testes dentro dele. Aqui só as folhas são contadas,');
  L.push('> que é o número de coisas realmente afirmadas.');
  L.push('');

  if (falhas.length) {
    L.push('---');
    L.push('');
    L.push('## O que reprovou');
    L.push('');
    for (const f of falhas) {
      L.push(`### ✖ ${f.nome}`);
      L.push('');
      L.push(`\`${f.arquivo}${f.linha ? ':' + f.linha : ''}\``);
      L.push('');
      if (f.evidencias && f.evidencias.length) {
        /* O que o teste viu antes de reprovar. Numa falha é onde ela mais
           serve: diz com que entrada o defeito apareceu. */
        L.push('O que o teste viu:');
        L.push('');
        f.evidencias.forEach(x => L.push(`- ${x}`));
        L.push('');
      }
      const e = f.erro;
      if (e) {
        L.push('```');
        L.push(String(e.message || e).trim());
        if (e.cause && e.cause.message && e.cause.message !== e.message) {
          L.push(String(e.cause.message).trim());
        }
        L.push('```');
      }
      L.push('');
    }
  }

  L.push('---');
  L.push('');
  L.push('## Tudo o que rodou');
  L.push('');
  L.push('Na ordem em que rodou, com o tempo de cada um. Grupo em negrito,');
  L.push('teste recuado. É esta lista que responde "isto está coberto?".');
  L.push('');

  for (const [arquivo, itens] of porArquivo) {
    const reprovadosAqui = itens.filter(i => !i.ok && i.nivel > 0).length;
    const contados = itens.filter(i => i.nivel > 0).length;
    L.push(`### ${arquivo} — ${contados} testes${reprovadosAqui ? `, ${reprovadosAqui} reprovaram` : ''}`);
    L.push('');
    for (const i of itens) {
      const marca = i.pulado ? '○' : i.ok ? '✓' : '✖';
      if (i.nivel === 0) {
        L.push(`- ${marca} **${i.nome}** — ${ms(i.duracao)}`);
      } else {
        L.push(`${'  '.repeat(i.nivel)}- ${marca} ${i.nome} — ${ms(i.duracao)}`);
      }
      for (const e of i.evidencias || []) {
        L.push(`${'  '.repeat(i.nivel + 1)}· ${e}`);
      }
    }
    L.push('');
  }

  L.push('---');
  L.push('');
  L.push('*Gerado por `testes/relator.mjs`. Cada `npm test` escreve um arquivo novo');
  L.push('e atualiza `ultimo.md`. Nada aqui entra no git.*');

  const texto = L.join('\n') + '\n';
  try {
    fs.mkdirSync(PASTA, { recursive: true });
    fs.writeFileSync(path.join(PASTA, nomeDoArquivo(inicio)), texto);
    fs.writeFileSync(path.join(PASTA, 'ultimo.md'), texto);
    podar(PASTA);
  } catch (e) {
    yield `\n[relator] não deu para escrever o registro: ${e.message}\n`;
  }

  /* O que aparece no terminal fica curto: o registro completo está no
     arquivo, e repetir tudo aqui só faria rolar mais. */
  yield '\n';
  yield verde
    ? `✓ ${passaram} testes, ${porArquivo.size} arquivos, ${((Date.now() - t0) / 1000).toFixed(2)} s\n`
    : `✖ ${reprovaram} de ${total} reprovaram\n`;
  for (const f of falhas) {
    yield `  ✖ ${f.nome}\n    ${String((f.erro && f.erro.message) || '').split('\n')[0]}\n`;
  }
  yield `\nRegistro: testes/registro/ultimo.md\n`;
}

/* Guarda os vinte últimos. Sem isso, a pasta vira um cemitério e
   ninguém acha a corrida de ontem no meio de trezentas. */
function podar(pasta, quantos = 20) {
  const arquivos = fs.readdirSync(pasta)
    .filter(n => /^\d{8}-\d{6}\.md$/.test(n))
    .sort()
    .reverse();
  for (const velho of arquivos.slice(quantos)) {
    try { fs.unlinkSync(path.join(pasta, velho)); } catch (e) {}
  }
}

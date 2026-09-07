/* ============================================================
   VITÆ — Regras da ficha em criação
   Cálculo e validação, sem uma linha de HTML. É o que o
   diagnóstico exercita e o que a interface consulta.

   Se uma função daqui devolver string com tag, ela está no
   arquivo errado.
   ============================================================ */

function migrarFicha(f) {
  f.seitaDados = f.seitaDados || {};
  if (f.seita) dadosSeitaDe(f);
  return f;
}

function definirEm(raiz, caminho, valor) {
  const partes = caminho.split('.');
  let alvo = raiz;
  for (let i = 0; i < partes.length - 1; i++) {
    const p = /^\d+$/.test(partes[i + 1]) ? [] : {};
    if (alvo[partes[i]] == null) alvo[partes[i]] = p;
    alvo = alvo[partes[i]];
  }
  alvo[partes[partes.length - 1]] = valor;
}

function lerEm(raiz, caminho) {
  return caminho.split('.').reduce((o, k) => (o == null ? undefined : o[k]), raiz);
}

function todosAtributos() {
  return Object.values(ATRIBUTOS).flatMap(g => g.lista);
}

function todasHabilidades() {
  return Object.values(HABILIDADES).flatMap(g => g.lista);
}

function nomeSexo(id) {
  const s = SEXOS.find(x => x.id === id);
  if (!s) return '—';
  return s.nota ? `${s.nome} (${s.nota})` : s.nome;
}

function nomeHabilidade(id) {
  const h = todasHabilidades().find(x => x.id === id);
  return h ? h.nome : id;
}

function derivados(f) {
  const c = claDe(f.cla);
  const p = predadorDe(f.predador);
  const atr = f.atributos || {};
  const vigor = atr.vigor || 0;
  const auto  = atr.autocontrole || 0;
  const det   = atr.determinacao || 0;
  let humanidade = 7 + (p?.humanidade || 0) + (f.humanidadeMod || 0);
  humanidade = Math.max(0, Math.min(10, humanidade));

  const ger = Number(f.geracao) || 13;
  const faixa = (typeof Escudo !== 'undefined')
    ? Escudo.GERACAO_POTENCIA.find(x => ger >= x.geracoes[0] && ger <= x.geracoes[1])
    : null;
  const bonusPredador = p?.potenciaSangue || 0;
  const potencia = (f.mortal || c?.sangueFraco) ? 0
    : Math.min(10, (faixa ? faixa.min : 1) + bonusPredador);

  return {
    vitalidade: vigor + 3,
    vontade: auto + det,
    humanidade,
    potencia,
    geracao: f.geracao
  };
}

function sincronizarMatilha(f) {
  if (perfilDe(f).bussola.tipo !== 'caminho') return;
  const d = dadosSeitaDe(f);
  const nome = (d.matilha || {}).nome;
  if (!nome) return;
  const grupo = Matilha.de(f);
  if (!grupo) return;
  ['tipo', 'sacerdote', 'ductus'].forEach(campo => {
    if (d.matilha[campo] !== undefined && d.matilha[campo] !== grupo[campo]) {
      Matilha.definir(grupo.id, campo, d.matilha[campo]);
    }
  });
}

/* FICHA PARCIAL NÃO DERRUBA A BIBLIOTECA.  (§85)

   `contagem(f.atributos, …)` estourava quando a ficha não tinha
   `atributos` — e uma ficha assim não é hipótese: ela existe em
   `localStorage` de versão antiga, e desde a §85 pode chegar do
   FichaServer, de outra máquina ou de um `.json` importado à mão.

   O efeito era desproporcional: UMA ficha incompleta derrubava a tela
   inteira da biblioteca, porque `listarFichas().map(resumoDaFicha)`
   morria na primeira. Achado por um teste da Ponte — e não por uma
   asserção dele: o erro vazou como atividade assíncrona órfã depois
   que o teste terminou.

   O `|| {}` fica AQUI, e não em cada chamador, porque é aqui que a
   suposição mora. */
function contagem(obj, lista) {
  const c = { 1:0, 2:0, 3:0, 4:0, 5:0 };
  const fonte = obj || {};
  lista.forEach(t => { const v = fonte[t.id] || 0; if (v >= 1) c[v]++; });
  return c;
}

function disciplinasDisponiveis(f) {
  const c = claDe(f.cla);
  if (!c) return [];
  if (c.sangueFraco) return ['alquimia'];
  if (c.disciplinasLivres) return Object.keys(DISCIPLINAS).filter(d => d !== 'alquimia');
  const base = [...c.disciplinas];
  const p = predadorDe(f.predador);
  if (p && f.predadorDisciplina && !base.includes(f.predadorDisciplina)) base.push(f.predadorDisciplina);
  return base;
}

function totalPontosDisc(f) {
  return Object.values(f.disciplinas || {}).reduce((a, b) => a + b, 0);
}

function totalVantagens(f) {
  const ant = Object.values(f.antecedentes || {}).reduce((a,b)=>a+b, 0);
  const mer = Object.values(f.meritos || {}).reduce((a,b)=>a+b, 0);
  return ant + mer;
}

function totalDefeitos(f) {
  return Object.values(f.defeitos || {}).reduce((a,b)=>a+b, 0);
}

/* A FUNÇÃO QUE DIZ "ESTA FICHA ESTÁ INCOMPLETA" NÃO PODE MORRER COM
   UMA FICHA INCOMPLETA.  (§85)

   Ela lia `f.atributos`, `f.habilidades`, `f.especializacoes` e
   `f.conviccoes` sem perguntar — três pontos diferentes, todos com o
   mesmo pressuposto: que a ficha tem forma completa. Uma ficha sem eles
   derrubava `resumoDaFicha`, e com isso a TELA INTEIRA da biblioteca,
   porque `listarFichas().map(resumoDaFicha)` morre na primeira.

   Isso não é hipótese: ficha assim existe em `localStorage` de versão
   antiga, e desde a §85 pode chegar do FichaServer, de outra máquina ou
   de um `.json` importado à mão.

   O reparo é na ENTRADA, e não campo a campo: normalizar uma vez cobre
   a função inteira, inclusive o que alguém acrescentar amanhã. Foi
   assim que os três apareceram — o primeiro reparo revelou o segundo,
   que revelou o terceiro. */
function pendenciasDaFicha(fichaCrua) {
  const f = Object.assign(FICHA_VAZIA(), fichaCrua || {});
  const problemas = [];

  const ca = contagem(f.atributos, todosAtributos());
  for (const [v, q] of Object.entries(DIST_ATRIBUTOS)) {
    if ((ca[v] || 0) !== q) problemas.push(`Atributos: você tem ${ca[v] || 0} de ${q} traços em ${v}.`);
  }

  if (!f.modoHabilidade) problemas.push('Habilidades: nenhum modo de distribuição escolhido.');
  else {
    const ch = contagem(f.habilidades, todasHabilidades());
    for (const [v, q] of Object.entries(DIST_HABILIDADES[f.modoHabilidade].cotas)) {
      if ((ch[v] || 0) !== q) problemas.push(`Habilidades: ${ch[v] || 0} de ${q} em nível ${v}.`);
    }
  }

  /* Mesmo cuidado do `contagem` acima, e pela mesma razão: ficha parcial
     não pode derrubar a lista de pendências — que é justamente a tela
     que existe para DIZER que a ficha está parcial. (§85) */
  const habs = f.habilidades || {};
  const esps = f.especializacoes || {};
  todasHabilidades().forEach(h => {
    if ((habs[h.id] || 0) > 0 && ESPECIALIZACAO_OBRIGATORIA.includes(h.id) && !esps[h.id])
      problemas.push(`${h.nome} exige uma especialização.`);
  });

  const alvoDisc = 3 + (f.predadorDisciplina ? 1 : 0);
  const td = totalPontosDisc(f);
  if (td !== alvoDisc) problemas.push(`Disciplinas: ${td} de ${alvoDisc} pontos distribuídos.`);

  Object.entries(f.disciplinas || {}).forEach(([id, v]) => {
    const escolhidos = ((f.poderes || {})[id] || []).length;
    /* Ficha antiga pode carregar Disciplina cujo id saiu do catálogo — e
       aí `DISCIPLINAS[id].nome` estourava, derrubando a lista de
       pendências inteira. Item 7 da §14.1. Nomear o id cru é pior que o
       nome, e muito melhor que uma tela em branco. */
    const nome = (DISCIPLINAS[id] || {}).nome || id;
    if (!DISCIPLINAS[id]) problemas.push(`Disciplina desconhecida na ficha: "${id}".`);
    else if (escolhidos < v) problemas.push(`${nome}: faltam ${v - escolhidos} poder(es) a escolher.`);
  });

  if (!f.cla) problemas.push('Nenhum clã escolhido.');
  if (!f.predador) problemas.push('Nenhum Tipo de Predador escolhido.');
  if (totalVantagens(f) !== 7) problemas.push(`Vantagens: ${totalVantagens(f)} de 7 pontos.`);
  if (totalDefeitos(f) !== 2) problemas.push(`Defeitos: ${totalDefeitos(f)} de 2 pontos.`);
  if (!f.conviccoes[0]) problemas.push('Ao menos uma Convicção é necessária.');

  const { erros, avisos } = validarSeita(f);
  erros.forEach(x => problemas.push(x));

  return { problemas, avisos, completa: problemas.length === 0 };
}

function validarSeita(f) {
  const erros = [], avisos = [];
  if (!f.seita) { avisos.push('Nenhuma seita escolhida: a ficha usa Humanidade e Pilares por padrão.'); return { erros, avisos }; }

  const pf = perfilDe(f);
  const d = dadosSeitaDe(f);
  const p = predadorDe(f.predador);

  if (p && p.seita && p.seita !== pf.id)
    erros.push(`O Predador ${p.nome} é exclusivo do ${perfilDe({ seita: p.seita }).nome}.`);

  if (!pf.statusPositivo && ((f.antecedentes || {}).status || 0) > 0)
    erros.push(`${pf.nome}: Status de seita não existe para você. Reputação aqui não é Antecedente.`);

  if (pf.id === 'camarilla' && f.cla === 'caitiff' && ((f.antecedentes || {}).status || 0) > 0)
    erros.push('A Camarilla não concede Status a Caitiff.');

  if (pf.bussola.tipo !== 'caminho' && d.caminho)
    erros.push('Caminho da Iluminação só existe no Sabá.');

  if (pf.bussola.tipo === 'caminho') {
    if (!d.caminho) erros.push('Nenhum Caminho da Iluminação escolhido.');
    const ritae = (d.conviccoesRitae || []);
    (f.conviccoes || []).forEach((cv, i) => {
      if (cv && !ritae[i]) erros.push(`Convicção ${i + 1} não aponta para nenhum Ritae-Pilar.`);
      if (cv && ritae[i] && !(d.implementos || [])[i])
        avisos.push(`Convicção ${i + 1}: o Ritae-Pilar não tem implemento declarado.`);
    });
    const usados = ritae.filter(Boolean);
    if (new Set(usados).size !== usados.length)
      erros.push('Duas Convicções apontam para o mesmo Ritae-Pilar.');
    if (!(d.matilha || {}).nome) avisos.push('Sem matilha: você carrega o Defeito Suspeito.');
    const gasto = TRACOS_ARENA.reduce((a, t) => a + ((d.arena || {})[t.id] || 0), 0);
    if (gasto > (d.pontosMatilha || 1))
      erros.push(`Arena: ${gasto} pontos gastos e só ${d.pontosMatilha || 1} disponível.`);
  }

  if (pf.id === 'anarquistas') {
    if (!(d.baronia || {}).nome) avisos.push('Sem baronia: você é anarquista de nome, sem território nem gente.');
    if (!(d.favoresDevidos || []).some(x => x && x.o_que))
      avisos.push('Nenhum favor em aberto. No Movimento, isso é raro o bastante para explicar.');
  }

  if (pf.id === 'independente') {
    if (!d.negocio) avisos.push('Nenhum negócio definido: é o que você vende que te mantém vivo.');
    if (!(d.contratos || []).some(x => x && x.servico))
      avisos.push('Nenhum contrato em aberto. Um Independente sem contrato não tem proteção nenhuma.');
  }

  return { erros, avisos };
}

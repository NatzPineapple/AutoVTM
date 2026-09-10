/* ============================================================
   VITÆ — A condução do combate na mesa
   (F1, pago na §100)

   Este bloco morava em `mesa.js`, e saiu de lá pela razão que o
   `fronteiras.test.mjs` escreveu quando lhe deu um teto próprio na §93:

     "Dentro dele há um bloco coerente — a condução do combate, de
      `combateAtivo` a `golpe` — e é ele que sai na próxima vez que
      este número não couber."

   O número não coube na §100, quando o turno de desfecho entrou. Sair
   não foi decisão nova: foi a dívida com nome vencendo, do jeito que
   ela tinha sido escrita.

   NÃO É UMA QUEBRA DA DECISÃO N5/N6. Aquela decisão diz que o front não
   se parte em pedaços de TELA por gosto — e isto não é um pedaço de
   tela: é um ASSUNTO inteiro, do mesmo tipo que já justificou
   `mesa-render.js` e `mesa-acoes.js`. O que fica em `mesa.js` é o
   turno; o que vem para cá é a rodada.

   O que este arquivo é, e não é:

   · É ORQUESTRAÇÃO. Ele lê `M`, chama os motores do Árbitro
     (`Combate`, `Rodada`, `Agarramento`) e escreve o resultado de
     volta em `M`. Regra de combate não mora aqui — mora em
     `modulos/arbitro/motor-combate.js` e `motor-combate-avancado.js`.

   · NÃO ROLA DADO por conta própria. Quem rola é a Mesa, pela §82, e
     é por isso que `golpe` chama `rolarPelaMesa`.

   Carrega DEPOIS de `mesa.js` e ANTES de `mesa-acoes.js`: ele usa
   `M`, `msgId` e `rolarPelaMesa` de lá, e o despachante usa ele.
   ============================================================ */

const INTENCOES_DE_COMBATE = ['lutar', 'atirar'];

function combateAtivo() {
  return !!(M.combate && M.combate.ativo);
}

function abrirCombate({ motivo = '', oponentes = [], modelo = 'comum' } = {}) {
  if (combateAtivo()) return false;
  M.combate.ativo = true;
  M.combate.motivo = motivo;

  if (!oponentes.length && !M.combate.oponentes.length) oponentes = [{ modelo }];
  for (const o of oponentes) {
    gerarOponente(o.modelo || modelo, o.nome || null, { silencioso: true });
  }

  anunciar([{ tipo: 'critico',
    texto: motivo ? `Começou briga: ${motivo}` : 'Começou briga.' }]);
  anunciar([{ tipo: 'combate',
    texto: `Na briga: ${M.combate.oponentes.map(o => o.nome).join(', ')}.` }]);

  const lista = combatentes();
  if (lista.filter(c => !Rodada.foraDeCombate(c)).length >= 2) {
    const r = Rodada.abrir(lista);
    M.combate.rodada = r;
    anunciar([{ tipo: 'combate', texto: `Rodada ${r.numero}. ${Rodada.descreverOrdem(r)}` }]);
  }
  return true;
}

function fecharCombate(texto) {
  if (!combateAtivo()) return;
  M.combate.ativo = false;
  M.combate.rodada = null;
  M.combate.oponentes = [];
  M.combate.motivo = '';
  anunciar([{ tipo: 'nota', texto: texto || 'A briga acabou. Você volta a agir por turno.' }]);
}

function conferirFimDoCombate() {
  if (!combateAtivo()) return;
  const dePe = (M.combate.oponentes || []).filter(o => !Rodada.foraDeCombate(o));
  if (!dePe.length) { fecharCombate('Ninguém de pé contra você. A briga acabou.'); return; }
  if (Rodada.foraDeCombate({ ficha: M.ficha })) {
    fecharCombate('Você caiu. A briga acabou sem você.');
  }
}

function normalizarOponentes() {
  M.combate.proximoId = M.combate.proximoId || 1;
  for (const o of M.combate.oponentes || []) {
    if (!o.ref) o.ref = `op:${M.combate.proximoId++}`;
    if (o.armaDele === undefined) o.armaDele = '';
    if (!Array.isArray(o.estados)) o.estados = [];
  }
}

function combatentes() {
  normalizarOponentes();
  const lista = [{ ref: 'voce', nome: M.ficha ? M.ficha.nome : 'Você',
                   ficha: M.ficha, estados: estadosAtuais(), vampiro: true }];
  for (const o of M.combate.oponentes || []) {
    lista.push({ ref: o.ref, nome: o.nome, ficha: o.ficha, estados: o.estados, oponente: o });
  }
  return lista;
}

function oponentePorRef(ref) {
  return (M.combate.oponentes || []).find(o => o.ref === ref) || null;
}

function abrirRodada() {
  const lista = combatentes();
  if (lista.filter(c => !Rodada.foraDeCombate(c)).length < 2) {
    anunciar([{ tipo: 'nota', texto: 'Não há briga: falta com quem trocar golpe.' }]);
    salvarMesa(); renderMesa(); return;
  }
  const r = Rodada.abrir(lista);
  M.combate.rodada = r;
  anunciar([{ tipo: 'combate', texto: `Rodada ${r.numero}. ${Rodada.descreverOrdem(r)}` }]);
  correrTurnosDosOponentes();
}

function encerrarRodada() {
  M.combate.rodada = null;
  anunciar([{ tipo: 'nota', texto: 'A ordem de iniciativa foi desfeita. Os golpes voltam a ser avulsos.' }]);
  salvarMesa(); renderMesa();
}

/* ------------------------------------------------------------
   O FOGO NÃO APAGA SOZINHO  (§66)

   As armas incendiárias das págs. 379–381 causam dano POR TURNO
   até serem apagadas. `Combate.resolver` devolve isso em `queima`;
   a mesa guarda a queima em quem pegou fogo e cobra a cada volta
   da rodada. Quem apaga é o jogador — cada item diz com o quê.
   ------------------------------------------------------------ */
function pegarFogo(registro, queima, nome) {
  if (!registro || !queima) return;
  registro.queimas = registro.queimas || [];
  registro.queimas.push(queima);
  M.combate.estado = 'ativo';
  anunciar([{ tipo: 'critico', texto: `${nome} está em chamas.` }]);
}

function arderNoTurno(registro, ficha, nome) {
  const queimas = (registro && registro.queimas) || [];
  if (!queimas.length || !ficha) return;
  const r = Combate.queimar(ficha, queimas);
  anunciar([{ tipo: 'perigo', texto: `${nome} ainda queima.` }, ...r.eventos]);
}

function avancarVez() {
  const r = Rodada.avancar(M.combate.rodada, combatentes());
  M.combate.rodada = r.fim && r.rodada && r.rodada.encerrada ? null : r.rodada;
  anunciar(r.eventos);
  const vez = M.combate.rodada && Rodada.atual(M.combate.rodada);
  if (vez) {
    if (vez.ref === 'voce') arderNoTurno(M.combate, M.ficha, 'Você');
    else {
      const o = oponentePorRef(vez.ref);
      if (o) arderNoTurno(o, o.ficha, o.nome);
    }
  }
  return r;
}

function correrTurnosDosOponentes() {
  let voltas = 0;
  while (M.combate.rodada && !M.combate.rodada.encerrada && voltas++ < 40) {
    const vez = Rodada.atual(M.combate.rodada);
    if (!vez) { if (avancarVez().fim) break; continue; }
    if (vez.ref === 'voce') break;

    const o = oponentePorRef(vez.ref);
    if (!o) { if (avancarVez().fim) break; continue; }

    const escolha = Rodada.escolhaDoOponente(o, { ref: 'voce' });
    if (!escolha.possivel) {
      anunciar([{ tipo: 'nota', texto: escolha.motivo }]);
    } else {
      anunciar([{ tipo: 'combate', texto: `É a vez de ${o.nome}.` }]);
      const g = golpe({ atacante: o.ficha, defensor: M.ficha, tipo: escolha.tipo,
        arma: escolha.arma, armadura: null,
        estadosAtacante: o.estados, estadosDefensor: estadosAtuais(), alvoVampiro: true,
        terreno: terrenoDoOponente(o), doJogador: false });
      if (g.queima) pegarFogo(M.combate, g.queima, 'Você');
      if (g.torpor) anunciar([{ tipo: 'critico', texto: 'Você caiu em torpor. A briga acabou para você.' }]);
    }
    if (Rodada.foraDeCombate({ ficha: M.ficha })) {
      M.combate.rodada = null;
      anunciar([{ tipo: 'critico', texto: 'Você não fica mais de pé. A rodada para aqui.' }]);
      break;
    }
    if (avancarVez().fim) break;
  }
  conferirFimDoCombate();
  salvarMesa();
  renderMesa();
}

/* A navegação do oponente, traduzida para o que o combate entende.
   Sem isto o elo 3 seria decorativo: ele descreveria a distância e o
   dado continuaria sendo rolado como se todo mundo estivesse coladinho.

   Desde a §49 o oponente é nó do grafo (item A7), com o `ref` de id, e
   por isso a navegação enxerga onde ele está de verdade: no local da
   cena, ou no que a cena declarar. Antes disto ele era invisível ao
   elo 3, e o que se sabia era só o que viesse declarado no objeto. */
function terrenoDoOponente(oponente) {
  if (!oponente || typeof Navegacao === 'undefined') return { distancia: null, cobertura: null };
  try {
    const grafo = Grafo.de(M);
    const nav = Navegacao.navegar({
      grafo, contexto: Grafo.contexto(grafo, 'voce'),
      plano: { acoes: [{ alvo: oponente.ref || null }] }, mesa: M,
      alvo: { id: oponente.ref || null, distancia: oponente.distancia,
              cobertura: oponente.cobertura }
    });
    return Navegacao.paraCombate(nav);
  } catch (e) {
    console.warn('navegação do combate falhou:', e && e.message);
    return { distancia: null, cobertura: null };
  }
}

/* Como a briga se apresenta ao jogador: "mesmo ambiente", "ambiente ao
   lado · −2 dados", "cobertura: parede de concreto". É o elo 3 virando
   texto — sem isso ele decide e ninguém sabe por quê. */
function terrenoDescrito(oponente) {
  if (!oponente || typeof Navegacao === 'undefined') return '';
  try {
    const grafo = Grafo.de(M);
    return Navegacao.descrever(Navegacao.navegar({
      grafo, contexto: Grafo.contexto(grafo, 'voce'),
      plano: { acoes: [{ alvo: oponente.ref || null }] }, mesa: M,
      alvo: { id: oponente.ref || null, distancia: oponente.distancia,
              cobertura: oponente.cobertura }
    }));
  } catch (e) { return ''; }
}

function golpe({ atacante, defensor, tipo, arma, armadura, estadosAtacante, estadosDefensor,
                 alvoVampiro, terreno = null, doJogador = true, alvoNaBriga = true }) {
  const t = terreno || { distancia: null, cobertura: null, penalidade: 0 };
  /* §90 — as opções do Conflito Avançado. Ataque Total e surpresa são
     de quem ataca; Defesa Total é de quem se defende, e por isso ela
     vale quando o golpe vem PARA CIMA do jogador. */
  const op = (M.combate && M.combate.opcoes) || {};
  const r = Combate.resolver({
    atacante, defensor, tipo,
    arma: arma === 'Desarmado' ? null : arma,
    armadura: armadura === 'Sem armadura' ? null : armadura,
    estadosAtacante, estadosDefensor, alvoVampiro,
    distancia: t.distancia, cobertura: t.cobertura, penalidadeTerreno: t.penalidade || 0,
    ataqueTotal: doJogador && !!op.ataqueTotal,
    surpresa: doJogador && !!op.surpresa,
    localizado: (doJogador && op.localizado) ? { onde: op.localizado } : null,
    defesaTotal: !doJogador && !!op.defesaTotal,
    ferimentosIncapacitantes: !!op.ferimentos,
    alvoNaBriga
  });
  if (r.possivel === false) {
    anunciar(r.bloqueios.map(b => ({ tipo: 'critico', texto: b })));
    return r;
  }
  M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: r.rolAtq, ts: Date.now() });
  if (r.rolDef) M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: r.rolDef, ts: Date.now() });
  anunciar(r.eventos);

  /* AS TRÊS OPÇÕES DE UM ATAQUE SÓ SE APAGAM DEPOIS DELE.  (§90)

     Ataque Total, surpresa e mira são decisões DE UM GOLPE — o livro é
     explícito no Ataque Total ("não permita que se defenda de nenhum
     ataque" vale pelo turno) e a surpresa, por definição, só surpreende
     uma vez. Deixá-las grudadas repetiria o mesmo erro que a §57 achou
     no volume da fala e a §89 no pedido de fade. */
  if (doJogador && (op.ataqueTotal || op.surpresa || op.localizado)) {
    M.combate.opcoes.ataqueTotal = false;
    M.combate.opcoes.surpresa = false;
    M.combate.opcoes.localizado = '';
  }
  /* Defesa Total custa o turno de quem a usou: ela vale por uma
     defesa, e some junto. */
  if (!doJogador && op.defesaTotal) M.combate.opcoes.defesaTotal = false;
  return r;
}

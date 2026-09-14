/* ============================================================
   VITÆ — Cadeia de arbitragem
   O caminho novo, em quatro elos:

     1 INTERPRETADOR  texto livre  ->  plano de ações
     2 GRAFO          o plano é possível NESTE MUNDO?
     3 NAVEGAÇÃO      só em combate: distância, rota, linha de tiro
     4 ESPECIALISTA   o que a REGRA do V5 diz sobre isso

   Cada elo tem uma pergunta só, e nenhum invade a do outro. O
   interpretador não sabe se é possível; o grafo não sabe regra;
   o especialista não lê texto.

   ESTADO: os quatro elos estão prontos e LIGADOS ao turno. A mesa
   entra por `arbitrarTurno()`, em `front/mesa.js`, com queda para
   `Arbitro.avaliar()` se algo aqui estourar (§48.1).

     elo 1  `lexico` sempre; `llm` quando o extrator de intenção
            responde. A mesa escolhe uma vez por sessão (§48.2).
     elo 3  `navmesh`, em `motor-navegacao.js` (§48.3).

   Os mapas INTERPRETADORES e NAVEGADORES continuam existindo, e a
   troca da §48 provou o que eles valiam: os dois elos foram
   substituídos sem uma linha de mudança nesta orquestração.

   Este cabeçalho dizia "elos 1 e 3 provisórios" por quatro seções
   depois de deixarem de ser — e alguém leu e acreditou. Comentário
   que descreve estado envelhece igual a número em documento (§50.3):
   quando trocar a implementação de um elo, TROQUE ESTAS LINHAS.
   ============================================================ */

const Cadeia = {

  INTERPRETADORES: {},
  NAVEGADORES: {},

  interpretadorPadrao: 'lexico',
  navegadorPadrao: 'navmesh',

  registrarInterpretador(id, fn) { this.INTERPRETADORES[id] = fn; },
  registrarNavegador(id, fn) { this.NAVEGADORES[id] = fn; },

  arbitrar({ ficha, estados = [], texto = '', modo = 'agir', mesa = null,
             intencao = null, alvo = null, dificuldade = null, fala = null,
             interpretador = null, navegador = null } = {}) {

    const grafo = Grafo.de(mesa || {});
    const contexto = Grafo.contexto(grafo, 'voce');
    const nomeInterp = interpretador || this.interpretadorPadrao;
    const interpretar = this.INTERPRETADORES[nomeInterp];
    if (!interpretar) throw new Error(`Interpretador desconhecido: ${nomeInterp}`);

    const plano = intencao
      ? this.planoDeIntencao(intencao, alvo)
      : interpretar({ texto, modo, grafo, contexto, ficha });

    return this.montar({ ficha, estados, mesa, alvo, dificuldade, fala, navegador },
                       grafo, contexto, plano, nomeInterp);
  },

  montar({ ficha, estados = [], mesa = null, alvo = null, dificuldade = null,
           fala = null, navegador = null }, grafo, contexto, plano, nomeInterp) {
    const inicio = Date.now();
    const emCombate = !!(mesa && mesa.combate && mesa.combate.ativo);

    const validacao = plano.acoes.length
      ? Grafo.validar(grafo, plano, { quem: 'voce' })
      : { possivel: null, bloqueios: [], avisos: [], fatos: [] };

    let navegacao = null;
    const nomeNav = navegador || this.navegadorPadrao;
    if (emCombate) {
      const navegar = this.NAVEGADORES[nomeNav];
      if (!navegar) throw new Error(`Navegador desconhecido: ${nomeNav}`);
      navegacao = navegar({ grafo, contexto, plano, mesa, alvo });
    }

    const conclusao = Especialista.avaliar({
      ficha, estados, plano, validacao, grafo,
      contexto: Object.assign({}, contexto, { emCombate, navegacao }),
      dificuldade, alvo, fala
    });

    return {
      plano, validacao, navegacao, conclusao, grafo,
      resumoDoGrafo: Grafo.resumo(grafo),
      milissegundos: Date.now() - inicio,
      elos: {
        interpretador: nomeInterp,
        grafo: validacao.possivel,
        /* Este rótulo dizia "livre" para caminho desimpedido — e "livre"
           era o NOME do navegador provisório da §41. Quem lesse
           `elos.navegacao: 'livre'` concluía que o elo 3 continuava
           provisório, e concluiu. Agora ele diz o que a navegação achou,
           e nomeia quem respondeu. */
        navegacao: navegacao
          ? `${nomeNav}: ${navegacao.bloqueado ? 'bloqueado'
              : navegacao.penalidade ? `passável, ${navegacao.penalidade} dados`
              : 'ao alcance'}`
          : 'fora de combate',
        especialista: conclusao.possivel
      }
    };
  },

  /* Mesma cadeia, com o elo 1 assíncrono. Existe porque o interpretador de
     modelo precisa de await e o léxico não — e porque manter o caminho
     síncrono intacto é o que deixa o LLM ser opcional de verdade. */
  async arbitrarComModelo(entrada) {
    const grafo = Grafo.de(entrada.mesa || {});
    const contexto = Grafo.contexto(grafo, 'voce');
    const nome = entrada.interpretador || 'llm';
    const interpretar = this.INTERPRETADORES[nome];
    if (!interpretar) throw new Error(`Interpretador desconhecido: ${nome}`);

    const plano = entrada.intencao
      ? this.planoDeIntencao(entrada.intencao, entrada.alvo)
      : await interpretar({ texto: entrada.texto || '', modo: entrada.modo || 'agir',
                            grafo, contexto, ficha: entrada.ficha });

    return this.montar(entrada, grafo, contexto, plano, nome);
  },

  planoDeIntencao(intencao, alvo) {
    return {
      origem: 'direta',
      confianca: 1,
      acoes: [{ verbo: intencao, intencao, alvo: (alvo && alvo.id) || null,
                alvoTexto: (alvo && alvo.nome) || null, ordem: 0 }]
    };
  },

  /* Compatibilidade: devolve no formato que a mesa já sabe desenhar. */
  comoVeredito(saida) {
    const c = saida.conclusao;
    return {
      possivel: c.possivel,
      leitura: { intencao: c.intencao, acao: c.acao,
                 confianca: saida.plano.confianca, termos: saida.plano.termos || [],
                 /* §57 — a saída crua do extrator. A mesa lê dela o
                    `speech`, para o caso de o jogador ter escrito a fala
                    sem aspas. Vem null no caminho do léxico. */
                 bruta: saida.plano.bruta || null },
      acao: c.acao,
      bloqueios: c.bloqueios,
      avisos: c.avisos,
      custos: c.custos,
      rotas: c.rotas,
      dificuldade: c.dificuldade,
      origemDificuldade: c.origemDificuldade,
      escalar: c.escalar,
      cadeia: saida.elos,
      rastro: c.rastro
    };
  }
};


/* ------------------------------------------------------------
   ELO 1 — o interpretador determinístico
   Usa o léxico do Árbitro e enriquece com o alvo achado no grafo.

   Ele NÃO é provisório: é o piso. O interpretador de modelo entrou
   na §42 e se registra como `llm` em `motor-intencao.js`; quando o
   serviço não responde, ou devolve `unknown`, o plano volta a ser
   montado por este. É o que faz o modelo ser opcional de verdade —
   mesma regra do Narrador e do Cronista.
   ------------------------------------------------------------ */

Cadeia.registrarInterpretador('lexico', ({ texto, modo, grafo, contexto }) => {
  const leitura = Arbitro.interpretar(texto, modo);
  if (!leitura.intencao) {
    return { origem: 'lexico', confianca: 0, acoes: [], termos: [] };
  }

  const def = leitura.acao || {};
  const alvo = Cadeia.acharAlvo(texto, grafo, contexto, def);

  return {
    origem: 'lexico',
    confianca: leitura.confianca,
    termos: leitura.termos,
    ambiguo: leitura.ambiguo,
    alternativas: leitura.alternativas,
    acoes: [{
      verbo: def.nome || leitura.intencao,
      intencao: leitura.intencao,
      disciplina: leitura.disciplina || (leitura.poder && leitura.poder.disciplina) ||
                  (def.disciplina && def.disciplina.id) || null,
      poder: leitura.poder && leitura.poder.nome,
      alvo: alvo && !def.movimento ? alvo.id : null,
      alvoTexto: alvo ? alvo.nome : null,
      destino: def.movimento && alvo && alvo.tipo === 'local' ? alvo.id : null,
      exigeAlcance: !!(alvo && ['objeto', 'pessoa'].includes(alvo.tipo) && !def.movimento),
      exigeAberto: !!(def.exigeAberto && alvo && alvo.tipo !== 'pessoa'),
      ordem: 0
    }]
  };
});

Cadeia.acharAlvo = function (texto, grafo, contexto, definicao) {
  const n = Arbitro.normalizar(texto);
  if (!n) return null;
  const preferido = definicao && definicao.movimento ? 'local'
                  : definicao && definicao.manipulacao ? 'objeto' : null;

  const candidatos = [];
  for (const no of grafo.nos.values()) {
    if (no.id === 'voce' || no.tipo === 'fato') continue;
    for (const termo of [no.nome, no.id]) {
      const t = Arbitro.normalizar(termo);
      if (!t || t.length <= 2 || !n.includes(t)) continue;
      let peso = t.length;
      if (preferido && no.tipo === preferido) peso += 8;
      if (!preferido && no.tipo === 'objeto') peso += 4;
      candidatos.push({ no, peso });
    }
  }
  if (!candidatos.length) return null;
  candidatos.sort((a, b) => b.peso - a.peso);
  return candidatos[0].no;
};


/* ------------------------------------------------------------
   ELO 3 — quem responde
   O navegador de verdade vive em `motor-navegacao.js`, que se
   registra aqui como `navmesh` (§48.3).

   O provisório `livre` — que devolvia terreno desimpedido para
   qualquer situação, com `provisorio: true` — foi APAGADO na §53.
   Ele já não era o padrão desde a §48, e continuar registrado o
   fazia parecer uma alternativa escolhível. Não era: era código
   morto com aparência de opção, e o nome dele ainda aparecia no
   rastro dos elos, fazendo o leitor concluir que o elo 3 seguia
   provisório.

   Navegador desconhecido agora ESTOURA em `montar`, em vez de
   deixar `navegacao` nula em silêncio. Elo que não roda tem que
   dar erro, não sumir.
   ------------------------------------------------------------ */

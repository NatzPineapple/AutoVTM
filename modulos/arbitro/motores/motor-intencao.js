/* ============================================================
   VITÆ — Elo 1 da cadeia: interpretador por modelo
   ------------------------------------------------------------
   O extrator (`modulos/cronista/intencao.mjs`, qwen2.5:7b) lê a frase
   do jogador em linguagem natural e devolve SEMÂNTICA — o que ele quer
   fazer e com o quê. Este arquivo é a fronteira onde essa semântica
   vira regra do V5.

   O QUE MUDOU, E POR QUÊ.

   O modelo nunca consultou `Lexico.ACOES` — o prompt não conhece um
   verbo do projeto sequer. Quem consultava era ESTE arquivo, no
   desempate: `interagir` tem dezesseis ações possíveis, e a escolha
   entre elas era feita casando palavra contra as `frases` do léxico —
   as mesmas 607 linhas de dicionário que o modelo veio substituir.
   Quando nada casava, caía em `candidatas[0]`, e o resultado é o
   defeito que se via jogando:

       "suborno o segurança"   ->  Pegar
       "conserto o rádio"      ->  Pegar
       "acalmo o cachorro"     ->  Pegar

   Agora o desempate é SEMÂNTICO, e o vocabulário que ele consulta é o
   da regra — o nome da ação, o domínio dela (`persuasao`,
   `furtividade`, `tecnica`) e as perícias desse domínio —, não o
   dicionário de frases coloquiais. O que casa é a
   `intencao_detalhada`: uma frase que o modelo escreve dizendo o que o
   jogador quer ALCANÇAR, e não o que ele digitou.

   E QUANDO NADA CASA, ELE DIZ QUE NÃO SABE. A versão anterior nunca
   devolvia vazio: preenchia com a primeira candidata e o turno seguia
   rolando os dados errados, calado. Agora o plano volta sem ação, o
   léxico tenta (é a rota de fuga), e se nem ele souber a cena sobe para
   o Narrador com o motivo escrito.

   O QUE ESTE ARQUIVO NÃO FAZ:

   · não decide se a ação é possível — isso é o Elo 2, o Grafo;
   · não produz número nenhum — a §3.2 continua inteira, e quem monta
     piscina e dificuldade é o Elo 4, o Especialista;
   · não substitui `Arbitro.ACOES`. O Elo 4 lê `rotas`, `exige`,
     `dominio` e `alcance` de lá: sem um id resolvido, não há parada de
     dados para montar. Interpretar é livre; a REGRA continua escrita.
   ============================================================ */

const Intencao = {
  ROTA: '/api/intencao',
  TEMPO_LIMITE: 30000,

  estado: { verificado: false, disponivel: false, modelo: '' },

  async verificar() {
    try {
      const r = await fetch(this.ROTA, { method: 'HEAD', cache: 'no-store' });
      const modelo = r.headers.get('X-Modelo') || '';
      this.estado = { verificado: true, disponivel: r.ok, modelo };
    } catch (e) {
      this.estado = { verificado: true, disponivel: false, modelo: '' };
    }
    return this.estado;
  },

  /* ----------------------------------------------------------
     DE CATEGORIA SEMÂNTICA PARA AÇÃO DA REGRA

     Os tipos que o modelo devolve são de RPG genérico; os ids abaixo
     são do V5 deste projeto. Quando a categoria tem uma ação só, não
     há o que desempatar. Quando tem várias, quem decide é
     `escolherPorSemantica`.
     ---------------------------------------------------------- */
  POR_TIPO: {
    atacar_corpo_a_corpo: ['lutar'],
    atacar_distancia:     ['atirar'],
    mover:                ['ir_para'],
    investigar:           ['achar_escondido', 'escutar', 'farejar', 'rastrear', 'ocultismo'],
    interagir:            ['pegar', 'abrir', 'arrombar', 'largar', 'entregar', 'esconder',
                           'persuadir', 'intimidar', 'seduzir', 'caçar', 'passar_por_humano'],
    conjurar:             [],
    desconhecido:         []
  },

  /* O vocabulário de REGRA contra o qual a frase-resumo é comparada.
     São os domínios de `Ficha.DOMINIOS`, que já existem porque o
     Árbitro monta paradas com eles — não é lista nova, é a taxonomia
     que o projeto já usa para dizer de que assunto é uma ação. */
  palavrasDoDominio(id) {
    const d = (typeof Ficha !== 'undefined' && Ficha.DOMINIOS) ? Ficha.DOMINIOS[id] : null;
    if (!d) return [];
    /* O nome do domínio ("Persuasão e sedução") e as perícias dele
       ("persuasao", "labia", "etiqueta") — quebrados em palavras. */
    return [d.nome, ...(d.pericias || []).map(p => String(p).replace(/_/g, ' '))]
      .join(' ').split(/\s+/).filter(x => x.length > 3);
  },

  /* ----------------------------------------------------------
     O DESEMPATE

     Pontua cada candidata contra a frase que o modelo escreveu. Três
     fontes, e todas são vocabulário de regra:

       · o NOME da ação ("Arrombar", "Persuadir") — o sinal mais forte,
         porque é a própria coisa sendo nomeada;
       · o DOMÍNIO dela e as perícias desse domínio;
       · o alvo e a ferramenta que o modelo extraiu, que ajudam quando
         a frase-resumo é curta.

     Sem pontuação nenhuma devolve null — e null aqui é uma resposta,
     não uma falha. Ver o cabeçalho.
     ---------------------------------------------------------- */
  escolherPorSemantica(candidatas, bruta) {
    const frase = Arbitro.normalizar([
      bruta.intencao_detalhada, bruta.alvo, bruta.ferramenta_arma
    ].filter(Boolean).join(' '));
    if (!frase) return null;

    let melhor = null;
    for (const id of candidatas) {
      const acao = Arbitro.ACOES[id];
      if (!acao) continue;

      let peso = 0;
      const nome = Arbitro.normalizar(acao.nome || '').split(/[\s-]+/)[0];
      /* O nome da ação vale mais que o domínio: "arrombar a gaveta" é
         `arrombar`, ainda que o domínio dela também case com `pegar`. */
      if (nome && nome.length > 3 && frase.includes(nome)) peso += 10;

      for (const p of this.palavrasDoDominio(acao.dominio)) {
        if (frase.includes(Arbitro.normalizar(p))) { peso += 3; break; }
      }

      if (peso && (!melhor || peso > melhor.peso)) melhor = { id, peso };
    }
    return melhor ? melhor.id : null;
  },

  /* Semântica -> `{ intencao, disciplina, poder }`, ou o motivo de não
     ter dado. Nenhum ramo aqui inventa ação: ou resolve, ou explica. */
  traduzir(bruta) {
    const tipo = bruta && bruta.tipo_acao;
    if (!tipo || tipo === 'desconhecido') {
      return { intencao: null, motivo: (bruta && bruta.motivo) || 'sem intenção mecânica' };
    }

    if (tipo === 'conjurar') {
      const achado = this.acharPoder(bruta.poder);
      if (achado) {
        return { intencao: `poder:${achado.disciplina}:${achado.nome}`,
                 disciplina: achado.disciplina, poder: achado.nome };
      }
      const disc = this.acharDisciplina(bruta.poder);
      if (disc) return { intencao: `disciplina:${disc}`, disciplina: disc };
      return { intencao: null, motivo: `poder não reconhecido: ${bruta.poder || '—'}` };
    }

    const candidatas = this.POR_TIPO[tipo] || [];
    if (!candidatas.length) return { intencao: null, motivo: `tipo sem ação: ${tipo}` };
    if (candidatas.length === 1) return { intencao: candidatas[0] };

    const escolhida = this.escolherPorSemantica(candidatas, bruta);
    if (escolhida) return { intencao: escolhida };

    /* O que a versão anterior resolvia com `candidatas[0]`. Dizer "não
       sei" deixa o léxico tentar, e depois o Narrador — os dois sabem
       lidar com isso. Chutar "Pegar" rolava Destreza + Furto por uma
       ação que era outra coisa, e ninguém via. */
    return { intencao: null,
             motivo: `"${bruta.intencao_detalhada || bruta.alvo || tipo}" não casou com `
                   + `nenhuma ação de ${tipo}` };
  },

  acharPoder(nome) {
    if (!nome) return null;
    const n = Arbitro.normalizar(nome);
    for (const [did, d] of Object.entries(DISCIPLINAS)) {
      for (const nivel of Object.values(d.poderes || {})) {
        for (const p of nivel) {
          const pn = Arbitro.normalizar(p.nome);
          if (pn && (n === pn || n.includes(pn) || pn.includes(n))) {
            return { disciplina: did, nome: p.nome };
          }
        }
      }
    }
    return null;
  },

  acharDisciplina(nome) {
    if (!nome) return null;
    const n = Arbitro.normalizar(nome);
    for (const [did, d] of Object.entries(DISCIPLINAS)) {
      const dn = Arbitro.normalizar(d.nome);
      if (dn && (n.includes(dn) || dn.includes(n))) return did;
    }
    return null;
  },

  /* O que existe NESTA cena, para o modelo reconhecer nome próprio. A
     medição da §94 mostrou o modelo falhando em "chamo o Sussurro
     Sedutor": não tinha como saber que aquilo era um poder. */
  contextoDaCena(ficha, grafo, contexto) {
    const poderes = [];
    for (const lista of Object.values((ficha && ficha.poderes) || {})) {
      for (const nome of lista || []) poderes.push(nome);
    }
    return {
      poderes,
      presentes: (contexto.presentes || []).map(p => p.nome),
      objetos: (contexto.naMao || []).concat(contexto.objetosAqui || []).map(o => o.nome),
      locais: (contexto.saidas || []).map(l => l.nome)
    };
  },

  async extrair({ texto, ficha, grafo, contexto }) {
    const corpo = Object.assign({ texto }, this.contextoDaCena(ficha, grafo, contexto));
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), this.TEMPO_LIMITE);
    try {
      const r = await fetch(this.ROTA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
        signal: controle.signal
      });
      if (!r.ok) return null;
      const bruta = await r.json();
      /* JSON válido que não é uma leitura: sem `tipo_acao` não há o que
         traduzir, e tratar como resposta faria o turno seguir com um
         objeto vazio. Devolver null é cair na rota de fuga. */
      return (bruta && typeof bruta === 'object' && bruta.tipo_acao) ? bruta : null;
    } catch (e) {
      return null;
    } finally {
      clearTimeout(relogio);
    }
  },

  /* ----------------------------------------------------------
     O PAYLOAD PARA O ELO 2

     O Grafo pergunta uma coisa só: isto é possível NESTE mundo? Para
     responder, ele precisa do id de um nó — e é `Cadeia.acharAlvo` que
     liga o texto do alvo ("o envelope pardo") ao nó da cena
     (`obj_envelope`).

     `alvoTexto` viaja junto de propósito: quando o alvo NÃO existe no
     grafo, `alvo` fica null e é esse texto que o Especialista usa para
     dizer "não há envelope nenhum aqui" em vez de "alvo inválido".
     ---------------------------------------------------------- */
  planoDe(bruta, grafo, contexto, texto) {
    const t = this.traduzir(bruta);
    if (!t.intencao) {
      return { origem: 'llm', confianca: 0, acoes: [], termos: [],
               bruta, motivo: t.motivo };
    }

    const def = Arbitro.ACOES[t.intencao] || {};
    /* O alvo extraído vem PRIMEIRO, e o texto cru depois: o modelo já
       isolou o alvo da frase, e procurar por ele casa melhor do que
       varrer a frase inteira atrás de um nó. */
    const alvo = Cadeia.acharAlvo(
      [bruta.alvo, bruta.ferramenta_arma, texto].filter(Boolean).join(' '),
      grafo, contexto, def);

    return {
      origem: 'llm',
      confianca: 0.9,
      termos: [bruta.alvo, bruta.ferramenta_arma, bruta.poder].filter(Boolean),
      bruta,
      acoes: [{
        verbo: def.nome || t.intencao,
        intencao: t.intencao,
        disciplina: t.disciplina || (def.disciplina && def.disciplina.id) || null,
        poder: t.poder || null,
        alvo: alvo && !def.movimento ? alvo.id : null,
        alvoTexto: bruta.alvo || (alvo ? alvo.nome : null),
        destino: def.movimento && alvo && alvo.tipo === 'local' ? alvo.id : null,
        exigeAlcance: !!(alvo && ['objeto', 'pessoa'].includes(alvo.tipo) && !def.movimento),
        exigeAberto: !!(def.exigeAberto && alvo && alvo.tipo !== 'pessoa'),
        modificadorDito: bruta.circunstancia || null,
        /* A frase do modelo segue viva até o fim da cadeia: é ela que o
           Narrador lê para descrever o que o personagem TENTOU, e não o
           rótulo mecânico da ação. */
        objetivo: bruta.intencao_detalhada || null,
        ordem: 0
      }]
    };
  }
};


/* ------------------------------------------------------------
   A ROTA DE FUGA, EM TRÊS DEGRAUS

   O léxico deixou de ser o interpretador e passou a ser isto: o que
   responde quando o modelo não responde. Três casos, e nos três o
   turno continua — é a regra do projeto desde a §29, e ela vale mais
   aqui do que em qualquer outro lugar: falhar na leitura da frase não
   custa um aviso, custa o turno inteiro.

     1. serviço fora do ar, estouro de tempo, HTTP ruim ou JSON sem
        `tipo_acao`  ->  `extrair` devolve null, e o léxico lê;
     2. o modelo leu, mas não deu para resolver em ação  ->  o léxico
        tenta a mesma frase, e se souber, ele ganha;
     3. nem o léxico sabe  ->  volta o plano vazio com o motivo, e o
        Especialista escala para o Narrador.
   ------------------------------------------------------------ */
Cadeia.registrarInterpretador('llm', async ({ texto, modo, grafo, contexto, ficha }) => {
  const bruta = await Intencao.extrair({ texto, ficha, grafo, contexto });
  if (!bruta) return Cadeia.INTERPRETADORES.lexico({ texto, modo, grafo, contexto, ficha });

  const plano = Intencao.planoDe(bruta, grafo, contexto, texto);
  if (plano.acoes.length) return plano;

  const doLexico = Cadeia.INTERPRETADORES.lexico({ texto, modo, grafo, contexto, ficha });
  if (doLexico.acoes.length) {
    return Object.assign(doLexico, { origem: 'lexico apos llm', bruta, motivo: plano.motivo });
  }
  return plano;
});

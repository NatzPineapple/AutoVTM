const Combate = {

  ATAQUES: {
    desarmado:    { nome: 'Desarmado', atributo: 'forca', pericia: 'briga',
                    defesa: ['destreza', ['briga', 'atletismo']], natureza: 'superficial', alcance: 'toque' },
    branca:       { nome: 'Arma branca', atributo: 'destreza', pericia: 'armas_brancas',
                    defesa: ['destreza', ['armas_brancas', 'atletismo']], natureza: 'superficial', alcance: 'toque' },
    branca_duas:  { nome: 'Arma branca de duas mãos', atributo: 'forca', pericia: 'armas_brancas',
                    defesa: ['destreza', ['armas_brancas', 'atletismo']], natureza: 'superficial', alcance: 'toque' },
    fogo:         { nome: 'Arma de fogo', atributo: 'autocontrole', pericia: 'armas_fogo',
                    defesa: ['destreza', ['atletismo']], natureza: 'superficial', alcance: 'visao',
                    aDistancia: true },
    fogo_no_corpo:{ nome: 'Arma de fogo no corpo a corpo', atributo: 'forca', pericia: 'armas_fogo',
                    defesa: ['destreza', ['briga', 'armas_brancas']], natureza: 'superficial', alcance: 'toque' },
    arremesso:    { nome: 'Arremesso', atributo: 'destreza', pericia: 'atletismo',
                    defesa: ['destreza', ['atletismo']], natureza: 'superficial', alcance: 'visao',
                    aDistancia: true },
    garras:       { nome: 'Garras', atributo: 'forca', pericia: 'briga',
                    defesa: ['destreza', ['briga', 'atletismo']], natureza: 'agravado', alcance: 'toque' }
  },

  /* O capítulo "Itens" (págs. 378–381) vem ANTES da tabela do Escudo,
     e por um motivo medido: sem ele, "lança-chamas" e "coquetel
     molotov" caíam no caso final e viravam dano 0, Superficial —
     exatamente as armas que o livro escreveu para queimar vampiro.
     (§66) */
  /* Casa o texto escrito na bolsa com um item da lista. Sem regex
     frouxa: primeiro o nome inteiro, depois o texto do jogador
     CONTENDO o nome do item — "meu velho lança-chamas" é um
     lança-chamas, "chama" não é. Ganha o nome mais longo, para
     "lançador de estacas" não virar "estaca". */
  itemPor(nome) {
    if (!nome || typeof ITENS === 'undefined') return null;
    const n = Arbitro.normalizar(nome);
    let achado = null;
    for (const it of ITENS) {
      const alvo = Arbitro.normalizar(it.nome);
      if (n === alvo) return it;
      if (n.includes(alvo) && (!achado || alvo.length > Arbitro.normalizar(achado.nome).length)) achado = it;
    }
    return achado;
  },

  armaPor(nome) {
    if (!nome) return { dano: 0, armas: 'Desarmado' };
    const item = this.itemPor(nome);
    if (item) return { dano: item.dano || 0, armas: item.nome, item };
    const n = Arbitro.normalizar(nome);
    for (const a of Escudo.DANO_ARMA) {
      const partes = Arbitro.normalizar(a.armas).split(/[;,()]/).map(x => x.trim()).filter(Boolean);
      if (partes.some(p => p && (n.includes(p) || p.includes(n)))) return a;
    }
    return { dano: 0, armas: nome };
  },

  armaduraPor(nome) {
    if (!nome) return { valor: 0, tipo: 'Sem armadura' };
    const n = Arbitro.normalizar(nome);
    return Escudo.ARMADURA.find(a => Arbitro.normalizar(a.tipo).includes(n) || n.includes(Arbitro.normalizar(a.tipo)))
      || { valor: 0, tipo: nome };
  },

  /* `esquivar` é a escolha do defensor (§63, A3):
       true  → só Atletismo, se estiver entre as opções
       false → só perícia de combate
       null  → a maior parada, como sempre foi
     O livro garante ao defensor o direito de esquivar SEMPRE em Briga
     e Armas Brancas (pág. 125); quando Atletismo não é opção do modelo
     de ataque, o pedido é ignorado e o motor diz por quê. */
  piscinaDefesa(ficha, defesa, estados, cobertura = 0, esquivar = null) {
    if (!defesa) return null;
    const [atr, opcoes] = defesa;
    let candidatas = opcoes;
    if (esquivar === true)  candidatas = opcoes.filter(p => p === 'atletismo');
    if (esquivar === false) candidatas = opcoes.filter(p => p !== 'atletismo');
    if (!candidatas.length) candidatas = opcoes;

    let melhor = { total: 0, periciaId: candidatas[0] };
    for (const p of candidatas) {
      const cand = Dados.piscinaDe(ficha, atr, p);
      if (cand.total > melhor.total) melhor = cand;
    }
    const pen = Arbitro.penalidadeDeEstados(estados || [], 'fisico');
    /* Piso de 1 dado, como toda parada (§63, A1). */
    return { total: Math.max(1, melhor.total + pen.dados + cobertura), periciaId: melhor.periciaId,
             atributoId: atr, penalidade: pen.dados, cobertura };
  },

  modificadorDeCobertura(nome) {
    if (!nome) return null;
    return Escudo.COBERTURA.find(c => Arbitro.normalizar(c.nome) === Arbitro.normalizar(nome)) || null;
  },

  /* `penalidadeTerreno` é como o elo 3 chega ao dado quando o que ele
     tem a dizer não é uma distância. O caso concreto é o alvo no
     ambiente ao lado: você atravessa e golpeia no mesmo turno, e isso
     custa −2 — não é bloqueio de alcance (§49). */
  resolver({ atacante, defensor, tipo = 'desarmado', arma = null, armadura = null,
             estadosAtacante = [], estadosDefensor = [], cobertura = null,
             alvoVampiro = true, distancia = null, estacionario = false,
             penalidadeTerreno = 0, esquivar = null }) {
    const eventos = [];
    const modelo = this.ATAQUES[tipo] || this.ATAQUES.desarmado;
    const info = this.armaPor(arma);
    const arm = this.armaduraPor(armadura);

    const capAtq = Arbitro.capacidadesDe(estadosAtacante);
    const exige = modelo.aDistancia ? ['maos', 'visao'] : ['movimento', 'corpo'];
    const bloqueios = [];
    for (const c of exige) {
      if (!capAtq.ativas.has(c)) {
        bloqueios.push(`${Arbitro.CAPACIDADES[c]} é necessário, e o atacante está ${capAtq.removidas[c]}.`);
      }
    }
    /* Alcance do ITEM manda sobre o do modelo de ataque: uma escopeta
       com munição sopro de dragão alcança 15 m, não a linha de visão
       (pág. 380); o hafla alcança 80 m. (§66) */
    const alcanceModelo = Arbitro.ALCANCES[modelo.alcance];
    const alcance = (info.item && info.item.alcance != null)
      ? { nome: `${info.item.nome} — alcance efetivo`, metros: info.item.alcance }
      : alcanceModelo;
    let penAlcance = 0;
    if (distancia != null && distancia > alcance.metros) {
      if (modelo.aDistancia) {
        penAlcance = -2;
        eventos.push({ tipo: 'nota',
          texto: `Alvo a ${distancia} m, além dos ${alcance.metros} m de alcance efetivo: −2 dados.` });
      } else {
        bloqueios.push(`${modelo.nome} alcança ${alcance.metros} m, e o alvo está a ${distancia} m.`);
      }
    }
    if (bloqueios.length) return { possivel: false, bloqueios, eventos };

    const penAtq = Arbitro.penalidadeDeEstados(estadosAtacante, 'fisico');
    const base = Dados.piscinaDe(atacante, modelo.atributo, modelo.pericia);
    const penTerreno = Math.min(0, penalidadeTerreno | 0);
    if (penTerreno) eventos.push({ tipo: 'nota',
      texto: `Terreno: ${penTerreno} dados para chegar ao alvo.` });
    /* Arma camuflada: "penalizam a parada de dados de ataque do
       usuário em um dado" (pág. 379). (§66) */
    const penItem = (info.item && info.item.penalidadeAtaque) || 0;
    if (penItem) eventos.push({ tipo: 'nota',
      texto: `${info.item.nome}: ${penItem} dado no ataque — não dá para equilibrar direito.` });
    let piscinaAtq = Math.max(1, base.total + penAtq.dados + penAlcance + penTerreno + penItem);

    let modCobertura = 0;
    if (modelo.aDistancia && cobertura) {
      const cob = this.modificadorDeCobertura(cobertura);
      if (cob) {
        modCobertura = cob.modificador;
        eventos.push({ tipo: 'nota', texto: `${cob.nome}: ${cob.modificador >= 0 ? '+' : ''}${cob.modificador} na defesa do alvo.` });
      }
    }

    /* ----------------------------------------------------------
       ESQUIVAR É ESCOLHA DO DEFENSOR, E TEM PREÇO.  (§63, item A3)

       O livro (básico, pág. 125):

         "Quando engajado em uma Briga ou conflito com Armas Brancas,
          o defensor SEMPRE PODE OPTAR por usar Destreza + Atletismo
          em vez de uma habilidade de combate para se defender. Caso
          faça isso, NÃO INFLIGIRÁ NENHUM DANO ao oponente, não
          importando a sua margem, caso vença."

       Isto era escolhido pelo motor, pela MAIOR PARADA, e o preço não
       existia. A troca — defender melhor OU poder revidar — é decisão
       tática de cada turno, e o jogador não a tinha.

       `esquivar` agora manda:
         true   → força Destreza + Atletismo. Não revida.
         false  → força a perícia de combate. Conflito bilateral.
         null   → o motor escolhe a maior parada, como antes, e DIZ
                  qual escolheu. É o que um PN faz sozinho.
       ---------------------------------------------------------- */
    const def = estacionario ? null
      : this.piscinaDefesa(defensor, modelo.defesa, estadosDefensor, modCobertura, esquivar);
    if (estacionario) {
      eventos.push({ tipo: 'nota', texto: 'Alvo estacionário: sem parada de defesa, dificuldade 1 fixa.' });
    }

    /* Defesa com Atletismo é esquiva: o defensor não causa dano.
       Com perícia de combate, o conflito é BILATERAL — os dois podem
       ferir, e é aí que o empate muda de significado. */
    const ehEsquiva = !!(def && def.periciaId === 'atletismo');
    const bilateral = !!(def && !ehEsquiva && !modelo.aDistancia);
    if (def) {
      eventos.push({ tipo: 'nota', texto: ehEsquiva
        ? `${nomeHabilidade(def.periciaId)}: esquiva. Vencendo, não revida.`
        : `${nomeHabilidade(def.periciaId)}: defende revidando. Empate fere os dois.` });
    }

    /* Dificuldade mínima do item, quando não há parada de defesa:
       hafla 3, coquetel Molotov 4 (pág. 380). Contra alvo que se
       defende, a disputa continua sendo a disputa. (§66) */
    const difMin = (info.item && info.item.dificuldadeMin) || 1;
    if (!def && difMin > 1) eventos.push({ tipo: 'nota',
      texto: `${info.item.nome}: Dificuldade mínima ${difMin}.` });

    const rolAtq = Dados.rolar({ piscina: piscinaAtq, fome: atacante.fome || 0,
      dificuldade: def ? 0 : difMin,
      rotulo: `${nomeAtributo(modelo.atributo)} + ${nomeHabilidade(modelo.pericia)}` });

    /* Arma incendiária caseira: numa FALHA TOTAL, o fogo volta para as
       mãos e o rosto de quem atirou — 3 de Agravado (pág. 379). */
    let coice = null;
    if (info.item && info.item.coice && rolAtq.tipo === 'total') {
      const c = info.item.coice;
      eventos.push({ tipo: 'perigo',
        texto: `Falha total com ${info.item.nome}: o fogo pega nas suas mãos e no seu rosto.` });
      const q = Estado.aplicarDano(atacante, { quantidade: c.dano, tipo: c.natureza,
        fonte: info.item.nome, semMetade: true });
      eventos.push(...q.eventos);
      coice = { dano: c.dano, natureza: c.natureza };
    }

    let rolDef = null, margem;
    if (def) {
      rolDef = Dados.rolar({ piscina: def.total, fome: defensor.fome || 0, dificuldade: 0,
        rotulo: `Defesa — ${nomeAtributo(def.atributoId)} + ${nomeHabilidade(def.periciaId)}` });
      margem = rolAtq.sucessos - rolDef.sucessos;
    } else {
      margem = rolAtq.sucessos - 1;
    }

    /* ---------- o empate ---------- */

    /* Conflito BILATERAL: "Um empate resulta em ambos os lados
       infligindo dano no outro como se os dois tivessem obtido vitória
       com uma margem de um." (pág. 125) */
    const empate = def && margem === 0;
    let revide = null;

    if (empate && bilateral) {
      eventos.push({ tipo: 'combate',
        texto: `Empate em ${rolAtq.sucessos}: os dois acertam, com margem 1.` });
      revide = this._aplicarRevide(atacante, defensor, 1, eventos, estadosDefensor, modelo);
      margem = 1;
    } else if (margem < 0 && bilateral) {
      /* O defensor venceu com perícia de combate: quem venceu subtrai
         os sucessos do perdedor e aplica o resto como dano (pág. 125).
         Com Atletismo isso não acontece — é o preço da esquiva. */
      eventos.push({ tipo: 'combate',
        texto: `Defesa venceu por ${-margem}: o defensor revida.` });
      revide = this._aplicarRevide(atacante, defensor, -margem, eventos, estadosDefensor, modelo);
      return { possivel: true, acertou: false, margem, rolAtq, rolDef, eventos, dano: 0,
               esquiva: ehEsquiva, bilateral, revide, coice };
    }

    if (margem <= 0) {
      eventos.push({ tipo: 'combate', texto: def
        ? `Ataque bloqueado: ${rolAtq.sucessos} contra ${rolDef.sucessos} de defesa.`
        : `Errou: ${rolAtq.sucessos} sucesso(s) contra dificuldade 1.` });
      return { possivel: true, acertou: false, margem, rolAtq, rolDef, eventos, dano: 0,
               esquiva: ehEsquiva, bilateral, revide, coice };
    }

    const item = info.item || null;

    /* Hafla: "três níveis de dano Agravado imediatamente" — além da
       margem, e não no lugar dela (pág. 380). (§66) */
    const imediato = (item && item.danoImediato) || 0;
    const bruto = margem + info.dano + imediato;

    /* Raufoss "ignora qualquer armadura pessoal" (pág. 380). */
    const absorve = (item && item.ignoraArmadura) ? 0 : arm.valor;
    if (item && item.ignoraArmadura && arm.valor) eventos.push({ tipo: 'nota',
      texto: `${item.nome} atravessa ${arm.tipo}: a armadura não absorve nada.` });
    const dano = Math.max(0, bruto - absorve);
    if (absorve) eventos.push({ tipo: 'nota', texto: `${arm.tipo} absorve ${Math.min(absorve, bruto)}.` });

    let natureza = modelo.natureza;
    const comArma = ['branca', 'branca_duas', 'fogo', 'fogo_no_corpo', 'arremesso'].includes(tipo);
    if (!alvoVampiro && comArma) natureza = 'agravado';
    /* A natureza do ITEM manda: fogo é Agravado em vampiro, e é esse o
       ponto do capítulo inteiro. `contraVampiro` marca o caso da
       munição sopro de dragão, que só vira Agravado contra vampiro. */
    if (item && item.natureza && (!item.contraVampiro || alvoVampiro)) natureza = item.natureza;

    if (imediato) eventos.push({ tipo: 'combate',
      texto: `${item.nome}: ${imediato} níveis de dano Agravado no ato.` });

    /* Lançador de redes: "o dano é subtraído da Destreza do alvo, e
       não da sua Vitalidade" (pág. 380). */
    let aplicado = { eventos: [], destruido: false, torpor: false };
    let enredado = null;
    if (item && item.alvoDano === 'destreza') {
      const antes = (defensor.atributos && defensor.atributos.destreza) || 0;
      const metade = Math.ceil(dano / 2);   /* "diminuído pela metade como dano Superficial" */
      const agora = Math.max(0, antes - metade);
      if (defensor.atributos) defensor.atributos.destreza = agora;
      enredado = { antes, agora, perdeu: antes - agora, imobilizado: agora === 0 };
      eventos.push({ tipo: 'combate',
        texto: `Rede: ${metade} de Destreza (${antes} → ${agora}).${
          agora === 0 ? ' Enredado por completo: não pode atacar.' : ''}` });
      eventos.push({ tipo: 'nota', texto: item.regra });
    } else {
      eventos.push({ tipo: 'combate',
        texto: `Acerto com margem ${margem}${info.dano ? ` + ${info.dano} da arma` : ''}: ${dano} de dano ${
          natureza === 'agravado' ? 'Agravado' : 'Superficial'}.` });
      aplicado = Estado.aplicarDano(defensor, { quantidade: dano, tipo: natureza,
        fonte: info.armas, semMetade: !alvoVampiro });
      eventos.push(...aplicado.eventos);
    }

    /* A queima continua depois do turno. O motor não roda o relógio
       da cena sozinho: ele DEVOLVE a queima, e quem toca o turno
       chama `Combate.queimar`. */
    let queima = null;
    if (item && item.queima) {
      queima = { item: item.nome, pontos: item.queima.pontos, apaga: item.queima.apaga,
                 ambiente: !!item.queima.ambiente, pagina: item.pagina };
      eventos.push({ tipo: 'perigo',
        texto: `${item.nome}: o alvo pega fogo — ${item.queima.pontos} de Agravado por turno até apagar. Apaga com: ${item.queima.apaga}.` });
      eventos.push({ tipo: 'nota', texto: 'Fogo exposto também é gatilho de frenesi de Terror (pág. 220).' });
    }

    /* O lançador de estacas da SI atira "quase à queima-roupa" e causa
       o dano de estacas comuns (pág. 381) — a regra da estaca no
       coração vale para ele igual, e antes da §66 não valia porque o
       teste exigia `tipo === 'branca'`. */
    const ehEstaca = /estaca/i.test(arma || '') && (tipo === 'branca' || (item && item.id === 'lancador_de_estacas'));
    if (ehEstaca && dano >= 5) {
      eventos.push({ tipo: 'critico', texto: Escudo.NOTA_ESTACA });
    }

    const conseq = Arbitro.consequencias(rolAtq);
    if (conseq) eventos.push({ tipo: 'nota',
      texto: `${conseq.titulo} no ataque. Escolha: ${conseq.escolhas.join(' · ')}` });

    return { possivel: true, acertou: true, margem, dano, natureza,
             arma: info, armadura: arm, rolAtq, rolDef, eventos,
             /* §63 (A3): num empate bilateral os dois acertam, então
                `acertou` e `revide` podem vir juntos. */
             esquiva: ehEsquiva, bilateral, revide, coice, queima, enredado,
             destruido: aplicado.destruido, torpor: aplicado.torpor };
  },


  /* ----------------------------------------------------------
     A QUEIMA CONTINUA DEPOIS DO TURNO  (§66)

     Toda arma incendiária das págs. 379–381 termina do mesmo jeito:
     tantos pontos de Agravado POR TURNO, até apagar. `resolver`
     devolve isso em `queima`; quem toca o relógio da cena chama
     aqui, uma vez por turno, com as queimas ativas.

     O motor não decide sozinho quando apaga — cada item diz o que
     apaga ele, e isso é ação de alguém. O que ele faz é não deixar a
     queima ser esquecida.

     O lança-chamas é o caso de zero pontos: "+0 dano Agravado ao
     atingir o alvo e a cada turno depois disso" (pág. 380). Zero é
     zero, e o motor diz isso em vez de inventar um número.
     ---------------------------------------------------------- */
  queimar(ficha, queimas = []) {
    const eventos = [];
    let total = 0;
    for (const q of (queimas || [])) {
      if (!q || q.apagada) continue;
      const pontos = q.pontos | 0;
      total += pontos;
      if (!pontos) {
        eventos.push({ tipo: 'nota',
          texto: `${q.item} continua queimando, mas o livro dá +0 por turno (pág. ${q.pagina}). O dano vem da margem do ataque.` });
        continue;
      }
      const r = Estado.aplicarDano(ficha, { quantidade: pontos, tipo: 'agravado',
        fonte: q.item, semMetade: true });
      eventos.push({ tipo: 'perigo', texto: `${q.item} queima: ${pontos} de Agravado neste turno.` });
      eventos.push(...r.eventos);
    }
    if (queimas && queimas.length) eventos.push({ tipo: 'nota',
      texto: 'Enquanto queimar, é gatilho de frenesi de Terror (pág. 220).' });
    return { total, eventos };
  },


  /* ----------------------------------------------------------
     O REVIDE DO DEFENSOR  (§63, item A3)

     Num conflito bilateral, o vencedor "subtrai os sucessos do
     perdedor do seu total e aplica o restante na forma de dano"
     (básico, pág. 125) — e isso vale para os dois lados. Quando o
     defensor vence com perícia de combate, quem apanha é o atacante.

     A arma do defensor não é modelada: ele reage com o que tem no
     corpo. Por isso o dano é a margem crua, natureza Superficial —
     que é o que Briga e Armas Brancas causam a vampiro.
     ---------------------------------------------------------- */
  _aplicarRevide(atacante, defensor, margem, eventos, estadosDefensor, modelo) {
    const capDef = Arbitro.capacidadesDe(estadosDefensor || []);
    if (!capDef.ativas.has('corpo') || !capDef.ativas.has('movimento')) {
      eventos.push({ tipo: 'nota', texto: 'O defensor venceu, mas não tem corpo para revidar.' });
      return null;
    }
    const dano = Math.max(0, margem | 0);
    if (!dano) return null;

    eventos.push({ tipo: 'combate',
      texto: `Revide: ${dano} de dano Superficial no atacante.` });
    const aplicado = Estado.aplicarDano(atacante, { quantidade: dano, tipo: 'superficial',
      fonte: 'revide em combate' });
    eventos.push(...aplicado.eventos);
    return { dano, natureza: 'superficial',
             destruido: aplicado.destruido, torpor: aplicado.torpor };
  },
  gerarMortal(modelo = 'comum', profissao = null) {
    const m = Escudo.MODELOS_MORTAIS[modelo] || Escudo.MODELOS_MORTAIS.comum;
    const cotas = {
      fraco:     { pares: [[2, 2]], resto: 1 },
      comum:     { pares: [[3, 2], [2, 3]], resto: 1 },
      talentoso: { pares: [[4, 1], [3, 2], [2, 2]], resto: 1 },
      fatal:     { pares: [[5, 2], [4, 2], [3, 2]], resto: 2 }
    }[modelo] || { pares: [[3, 2], [2, 3]], resto: 1 };

    const atrs = Object.values(ATRIBUTOS).flatMap(g => g.lista).map(a => a.id);
    const atributos = {};
    let i = 0;
    for (const [valor, quantos] of cotas.pares) {
      for (let k = 0; k < quantos && i < atrs.length; k++, i++) atributos[atrs[i]] = valor;
    }
    for (; i < atrs.length; i++) atributos[atrs[i]] = cotas.resto;

    const habilidades = {};
    const prof = profissao ? Escudo.PROFISSOES[profissao] : null;
    if (prof) prof.pericias.forEach(([id, v]) => { habilidades[id] = Math.max(habilidades[id] || 0, v); });

    const ficha = {
      nome: prof ? prof.nome : m.nome, modelo, atributos, habilidades,
      especializacoes: {}, disciplinas: {}, poderes: {}, meritos: {}, defeitos: {},
      antecedentes: {}, conviccoes: [], marcos: [], fome: 0, geracao: '0',
      danoSuperficial: 0, danoAgravado: 0, danoVontade: 0, maculas: 0, mortal: true
    };
    ficha.vitalidadeMortal = (atributos.vigor || 2) + 3;
    return { ficha, descricao: m };
  }
};


/* ============================================================
   VITÆ — Rodadas e iniciativa
   O V5 não publica sistema de iniciativa: o livro deixa a ordem
   com o Mestre. Como aqui não há Mestre humano, a ordem precisa
   ser determinística e auditável, então ela é convenção da mesa,
   registrada na Parte B do README §31: Destreza + Raciocínio,
   somados a um d10 de desempate, menos a penalidade de estados.
   Nada disso é regra da Paradox, e nada disso produz dano.
   ============================================================ */

const Rodada = {
  INICIATIVA: { primario: 'destreza', secundario: 'raciocinio' },

  iniciativaDe(ficha, estados) {
    const a = (ficha && ficha.atributos) || {};
    const base = (a[this.INICIATIVA.primario] || 0) + (a[this.INICIATIVA.secundario] || 0);
    const pen = Arbitro.penalidadeDeEstados(estados || [], 'fisico');
    const dado = Dados.d10();
    return { base, penalidade: pen.dados, dado, total: Math.max(0, base + pen.dados) + dado };
  },

  foraDeCombate(combatente) {
    const f = combatente && combatente.ficha;
    if (!f) return true;
    const t = Estado.trilhas(f);
    if (f.mortal) return t.vitalidade.livres === 0;
    return t.vitalidade.max > 0 && t.vitalidade.agr >= t.vitalidade.max;
  },

  ordenar(combatentes) {
    return (combatentes || [])
      .filter(c => !this.foraDeCombate(c))
      .map(c => Object.assign({ ref: c.ref, nome: c.nome, agiu: false },
                              this.iniciativaDe(c.ficha, c.estados)))
      .sort((a, b) => b.total - a.total || b.base - a.base ||
                      String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
  },

  abrir(combatentes, numero = 1) {
    const ordem = this.ordenar(combatentes);
    if (!ordem.length) return null;
    return { numero, ordem, indice: 0, encerrada: false };
  },

  atual(rodada) {
    if (!rodada || rodada.encerrada) return null;
    return rodada.ordem[rodada.indice] || null;
  },

  vezDe(rodada, ref) {
    const a = this.atual(rodada);
    return !!a && a.ref === ref;
  },

  sincronizar(rodada, combatentes) {
    if (!rodada) return null;
    const vivos = new Set((combatentes || []).filter(c => !this.foraDeCombate(c)).map(c => c.ref));
    const atual = this.atual(rodada);
    rodada.ordem = rodada.ordem.filter(x => vivos.has(x.ref));
    if (!rodada.ordem.length) { rodada.encerrada = true; rodada.indice = 0; return rodada; }
    const novo = atual ? rodada.ordem.findIndex(x => x.ref === atual.ref) : -1;
    rodada.indice = novo >= 0 ? novo : rodada.ordem.findIndex(x => !x.agiu);
    if (rodada.indice < 0) rodada.indice = rodada.ordem.length;
    return rodada;
  },

  avancar(rodada, combatentes) {
    if (!rodada) return { rodada: null, fim: true, eventos: [] };
    const eventos = [];
    const atual = this.atual(rodada);
    if (atual) atual.agiu = true;

    this.sincronizar(rodada, combatentes);
    let i = rodada.indice;
    while (i < rodada.ordem.length && rodada.ordem[i].agiu) i++;
    rodada.indice = i;

    if (i < rodada.ordem.length) return { rodada, fim: false, eventos };

    const restantes = (combatentes || []).filter(c => !this.foraDeCombate(c));
    if (restantes.length < 2) {
      rodada.encerrada = true;
      eventos.push({ tipo: 'combate', texto: 'A briga acabou. Ninguém mais tem com quem trocar golpe.' });
      return { rodada, fim: true, eventos };
    }

    const nova = this.abrir(restantes, rodada.numero + 1);
    eventos.push({ tipo: 'combate', texto: `Rodada ${nova.numero}. ${this.descreverOrdem(nova)}` });
    return { rodada: nova, fim: false, eventos };
  },

  descreverOrdem(rodada) {
    if (!rodada || !rodada.ordem.length) return 'Ninguém de pé.';
    return `Ordem: ${rodada.ordem.map(x => `${x.nome} (${x.total})`).join(', ')}.`;
  },

  escolhaDoOponente(oponente, alvo) {
    const arma = (oponente && oponente.armaDele) || '';
    const tipo = /pistola|9 ?mm|espingarda|rifle|revólver|revolver|\.22|\.357|\.38/i.test(arma)
      ? 'fogo'
      : (arma ? 'branca' : 'desarmado');
    const cap = Arbitro.capacidadesDe((oponente && oponente.estados) || []);
    const exige = tipo === 'fogo' ? ['maos', 'visao'] : ['movimento', 'corpo'];
    const impedido = exige.filter(c => !cap.ativas.has(c));
    if (impedido.length) {
      return { possivel: false, tipo, arma,
               motivo: `${oponente.nome} não consegue agir: ${
                 impedido.map(c => Arbitro.CAPACIDADES[c]).join(' e ')} fora.` };
    }
    return { possivel: true, tipo, arma: arma || null, alvo: (alvo && alvo.ref) || 'voce' };
  }
};

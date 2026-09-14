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

  /* O CASADOR PASSOU A LER `nomes`.  (§90)

     Antes ele quebrava o texto da linha em pedaços por `;,()` e casava
     contra os pedaços. Funcionava, e escondia dois defeitos: a lista
     de pedaços era o texto de EXIBIÇÃO, então corrigir a tradução de
     uma linha mudava silenciosamente o que ela casa — e o que não está
     escrito na linha não casa, mesmo sendo a mesma arma com outro nome.

     Agora a linha tem duas coisas separadas: `armas`/`tipo`, que é o
     texto do livro e vai para a tela, e `nomes`, que é o que o jogador
     pode ter escrito. Mudar um não mexe no outro.

     Ganha o nome MAIS LONGO, para "bastão de baseball" não virar
     "bastão" e "colete kevlar" não virar "colete". */
  _casarPorNomes(lista, nome, campoTexto) {
    const n = Arbitro.normalizar(nome);
    let achado = null, tamanho = -1;
    for (const linha of lista) {
      const nomes = linha.nomes || Arbitro.normalizar(linha[campoTexto])
        .split(/[;,()]/).map(x => x.trim()).filter(Boolean);
      for (const cru of nomes) {
        const alvo = Arbitro.normalizar(cru);
        if (!alvo) continue;
        if ((n === alvo || n.includes(alvo) || alvo.includes(n)) && alvo.length > tamanho) {
          achado = linha; tamanho = alvo.length;
        }
      }
    }
    return achado;
  },

  armaPor(nome) {
    if (!nome) return { dano: 0, armas: 'Desarmado' };
    const item = this.itemPor(nome);
    if (item) return { dano: item.dano || 0, armas: item.nome, item };
    const linha = this._casarPorNomes(Escudo.DANO_ARMA, nome, 'armas');
    if (!linha) return { dano: 0, armas: nome };
    /* `armas` é O QUE O JOGADOR ESCREVEU, e não o texto da linha.

       Desde que a linha passou a trazer o texto do livro inteiro
       (§90), usá-la como nome fazia o registro dizer "Vitalidade: 4 de
       dano — Impacto pesado (cassetete, taco, chave de roda, bastão de
       baseball); perfuração leve (…)" para uma facada. A linha continua
       inteira em `categoria`, para quem quiser mostrar de onde veio o
       número. */
    return { dano: linha.dano, armas: nome, categoria: linha.armas, pagina: linha.pagina };
  },

  /* `contraBalas` é a nota "zero contra balas" do couro virada regra
     (pág. 304): a mesma peça vale 2 contra lâmina e 0 contra bala. */
  armaduraPor(nome, { contraBala = false } = {}) {
    if (!nome) return { valor: 0, tipo: 'Sem armadura' };
    const linha = this._casarPorNomes(Escudo.ARMADURA, nome, 'tipo');
    if (!linha) return { valor: 0, tipo: nome };
    if (contraBala && linha.contraBalas != null) {
      return Object.assign({}, linha, { valor: linha.contraBalas, contraBala: true });
    }
    return linha;
  },

  /* `esquivar` é a escolha do defensor (§63, A3):
       true  → só Atletismo, se estiver entre as opções
       false → só perícia de combate
       null  → a maior parada, como sempre foi
     O livro garante ao defensor o direito de esquivar SEMPRE em Briga
     e Armas Brancas (pág. 125); quando Atletismo não é opção do modelo
     de ataque, o pedido é ignorado e o motor diz por quê. */
  piscinaDefesa(ficha, defesa, estados, cobertura = 0, esquivar = null, { defesaTotal = false } = {}) {
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
    /* Defesa Total: "ganha um dado bônus em todas as suas rolagens de
       defesa no turno" (pág. 298). */
    const bonusTotal = defesaTotal ? 1 : 0;
    /* Piso de 1 dado, como toda parada (§63, A1). */
    return { total: Math.max(1, melhor.total + pen.dados + cobertura + bonusTotal),
             periciaId: melhor.periciaId, atributoId: atr,
             penalidade: pen.dados, cobertura, defesaTotal: bonusTotal };
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
             penalidadeTerreno = 0, esquivar = null,
             /* ----- Conflito Avançado: Combate Físico (§90, págs. 298–303) -----
                Todas opcionais, todas escolha de quem ataca ou de quem se
                defende, e todas desligadas por omissão — é assim que o
                livro as apresenta ("os seguintes sistemas OPCIONAIS"). */
             ataqueTotal = false, defesaTotal = false, surpresa = false,
             localizado = null, alvoNaBriga = true, ferimentosIncapacitantes = false }) {
    const eventos = [];
    const modelo = this.ATAQUES[tipo] || this.ATAQUES.desarmado;
    const info = this.armaPor(arma);
    /* Couro é 2 contra lâmina e 0 contra bala (pág. 304): quem decide
       qual dos dois é o TIPO DE ATAQUE, então a armadura só pode ser
       lida depois de saber com o que se está atirando. */
    const arm = this.armaduraPor(armadura, { contraBala: tipo === 'fogo' || tipo === 'fogo_no_corpo' });
    let ferimento = null;

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
    /* §73 (H1): a tarefa aqui é o golpe, e o que a descreve é a ARMA.
       Quem tem "Facas" em Armas Brancas ganha o dado com uma faca na
       mão, e não com um taco. Sem arma nomeada não há o que enquadrar,
       e o dado entra como entrava. */
    const casaEsp = Arbitro.casadorDeEspecializacao(
      [arma, modelo.nome].filter(Boolean).join(' '));
    const base = Dados.piscinaDe(atacante, modelo.atributo, modelo.pericia,
      casaEsp ? { casaEspecializacao: casaEsp } : undefined);
    const penTerreno = Math.min(0, penalidadeTerreno | 0);
    if (penTerreno) eventos.push({ tipo: 'nota',
      texto: `Terreno: ${penTerreno} dados para chegar ao alvo.` });
    /* Arma camuflada: "penalizam a parada de dados de ataque do
       usuário em um dado" (pág. 379). (§66) */
    const penItem = (info.item && info.item.penalidadeAtaque) || 0;
    if (penItem) eventos.push({ tipo: 'nota',
      texto: `${info.item.nome}: ${penItem} dado no ataque — não dá para equilibrar direito.` });

    /* ARMA DE FOGO DENTRO DO CORPO A CORPO  (§90, pág. 302)

       "o usuário da arma de fogo sofre uma penalidade de −2 dados, caso
        alveje alguém que esteja FORA do combate corpo a corpo, e outra
        penalidade de −2 caso sua arma seja MAIOR DO QUE UMA PISTOLA."

       O `regras.md` §15.2 já trazia as duas desde a §63; o motor tinha
       só o modelo de ataque, sem nenhuma delas. `alvoNaBriga` é o
       primeiro caso e vem de quem chama; o segundo sai do próprio nome
       da arma, porque é o que a mesa tem. */
    let penFogoCorpo = 0;
    if (tipo === 'fogo_no_corpo') {
      if (!alvoNaBriga) {
        penFogoCorpo -= 2;
        eventos.push({ tipo: 'nota',
          texto: 'Atirando de dentro da briga em alguém que está fora dela: −2 dados.' });
      }
      if (this.maiorQuePistola(arma)) {
        penFogoCorpo -= 2;
        eventos.push({ tipo: 'nota',
          texto: `${arma} é maior que uma pistola: −2 dados no meio da briga.` });
      }
    }

    let piscinaAtq = Math.max(1, base.total + penAtq.dados + penAlcance + penTerreno
                                 + penItem + penFogoCorpo);

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
    /* ATAQUE SURPRESA  (§90, pág. 300)

       "O primeiro ataque surpresa costuma ser feito contra uma
        Dificuldade 1 FIXA, o que permite golpes devastadores."

       A forma é a mesma do alvo estacionário que já existia: sem parada
       de defesa. O que muda é o nome e a razão — e que ele não combina
       com Ataque Total, por regra do próprio livro (pág. 298). */
    const semDefesa = estacionario || surpresa;
    const def = semDefesa ? null
      : this.piscinaDefesa(defensor, modelo.defesa, estadosDefensor, modCobertura, esquivar,
                           { defesaTotal });
    if (estacionario) {
      eventos.push({ tipo: 'nota', texto: 'Alvo estacionário: sem parada de defesa, dificuldade 1 fixa.' });
    }
    if (surpresa) {
      eventos.push({ tipo: 'nota', texto: 'Ataque surpresa: Dificuldade 1 fixa, sem parada de defesa.' });
    }

    /* ATAQUE TOTAL  (§90, pág. 298)

       "conceda ao atacante um bônus de +1 no dano, mas não permita que
        se defenda de nenhum ataque. (…) Esta opção NÃO PODE SER USADA
        COM ATAQUE SURPRESA. Caso o ataque falhe, todos que estejam
        agindo contra o combatente ganham um dado adicional nas suas
        paradas no próximo turno."

       O bônus é de DANO, não de dados — trocar segurança por dados
       seria outro jogo. E o preço é devolvido no resultado, porque
       quem toca o relógio da cena é a Mesa, não este motor. */
    let ataqueTotalAtivo = ataqueTotal;
    if (ataqueTotal && surpresa) {
      ataqueTotalAtivo = false;
      eventos.push({ tipo: 'nota',
        texto: 'Ataque Total não vale com ataque surpresa (pág. 298): ele foi ignorado.' });
    }
    if (ataqueTotalAtivo) {
      eventos.push({ tipo: 'nota',
        texto: 'Ataque Total: +1 de dano, e você não se defende de nada neste turno.' });
      if (modelo.aDistancia) eventos.push({ tipo: 'nota',
        texto: 'Ataque Total com arma à distância também descarrega a arma (pág. 298).' });
    }
    if (defesaTotal && def) {
      eventos.push({ tipo: 'nota',
        texto: 'Defesa Total: +1 dado nesta defesa, e nada além de uma ação menor neste turno.' });
    }

    /* ATAQUE LOCALIZADO  (§90, págs. 302–303)

       "Após realizar o teste, ele SUBTRAI SUCESSOS (…) Normalmente, o
        modificador é de −2 sucessos, embora o Narrador possa aumentar
        ou diminuir esse número dependendo da natureza do alvo."

       Subtrai SUCESSO, e não dado: o livro é explícito, e a diferença
       importa — tirar dados mexe na chance de falha bestial, tirar
       sucessos não. É esta a regra que faltava para a estaca. */
    const alvoLocal = localizado
      ? { onde: String(localizado.onde || localizado || '').trim() || 'um ponto específico',
          custo: Math.abs(localizado.custo != null ? localizado.custo | 0 : this.CUSTO_LOCALIZADO) }
      : null;
    if (alvoLocal) eventos.push({ tipo: 'nota',
      texto: `Ataque localizado em ${alvoLocal.onde}: −${alvoLocal.custo} sucesso(s) no resultado.` });

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

    /* O custo do ataque localizado sai AQUI, do resultado, e não da
       parada — "após realizar o teste, ele subtrai sucessos" (pág.
       302). Fazer isso antes da rolagem mudaria a chance de Falha
       Bestial, que o livro não mandou mudar. */
    if (alvoLocal) margem -= alvoLocal.custo;

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
    /* Ataque Total: "+1 no dano" (pág. 298). */
    const bruto = margem + info.dano + imediato + (ataqueTotalAtivo ? 1 : 0);

    let natureza = modelo.natureza;
    const comArma = ['branca', 'branca_duas', 'fogo', 'fogo_no_corpo', 'arremesso'].includes(tipo);
    if (!alvoVampiro && comArma) natureza = 'agravado';
    /* A natureza do ITEM manda: fogo é Agravado em vampiro, e é esse o
       ponto do capítulo inteiro. `contraVampiro` marca o caso da
       munição sopro de dragão, que só vira Agravado contra vampiro. */
    if (item && item.natureza && (!item.contraVampiro || alvoVampiro)) natureza = item.natureza;

    /* §95 (A10) — Perdição do Sangue-Ralo, pág. 111. Vem DEPOIS do
       item porque é a natureza do DEFENSOR, e ela ganha da arma. */
    if (typeof Perdicoes !== 'undefined' && alvoVampiro
        && Perdicoes.agravadoContraSangueRalo(defensor, tipo) && natureza !== 'agravado') {
      natureza = 'agravado';
      eventos.push({ tipo: 'perigo', texto: Perdicoes.NOTA_RALO_DANO });
    }

    /* ----------------------------------------------------------
       A ARMADURA NÃO SUBTRAI DANO. ELA CONVERTE.  (§90)

       Este motor fazia `dano = bruto − armadura`. O livro diz outra
       coisa, e diz por quê:

         "Cada ponto de armadura transforma 1 ponto de dano Agravado
          originário de ARMAS PERFURANTES OU DE LÂMINA (por rolagem de
          dano) em dano Superficial, que então é cortado pela metade
          como de costume. Essa proteção SÓ COSTUMA SER ÚTIL PARA
          MORTAIS E SANGUES-RALOS, já que vampiros já consideram esses
          tipos de dano Superficiais."                    (pág. 304)

       A diferença não é de número, é de quem a armadura serve. Subtrair
       faz colete proteger vampiro, que é exatamente o que a última
       frase manda não acontecer: contra um vampiro, bala e lâmina já
       são Superficiais, e não sobra Agravado para converter. Um neonato
       de Kevlar ficava mais duro do que o livro permite, e ficava sem
       ninguém perceber, porque o número saía menor e número menor não
       parece defeito.

       Fogo continua passando inteiro: o livro limita a conversão a
       arma perfurante ou de lâmina, e chama o fogo pelo nome no
       capítulo dos Itens.
       ---------------------------------------------------------- */
    /* "PERFURANTE OU DE LÂMINA" NÃO É O TIPO DE ATAQUE.

       A primeira escrita desta regra olhava só `tipo`, e o coquetel
       Molotov é `tipo: 'fogo'` — então a armadura tática passou a
       absorver fogo, que é exatamente a coisa que o capítulo dos Itens
       existe para não deixar acontecer. Quem achou foi a mutação, e não
       o teste: nada afirmava o LIMITE da conversão.

       O corte certo é pela ORIGEM do Agravado. Ele vem de duas portas:

         . da classe da arma — bala e lâmina em mortal, garra em
           qualquer um. Aqui a armadura converte;
         . do ITEM, que declara a própria natureza — fogo, sopro de
           dragão, hafla. Aqui ela não converte nada, e é essa a razão
           de o fogo ser o que mata vampiro.

       As garras ficam dentro: são perfuração, e o livro não as
       excetua. É leitura, e está dita em `regras.md` §15.9.

       `PERFURA_OU_CORTA` é o SEGUNDO CINTO, e a mutação provou isso:
       apagá-la não derruba teste nenhum. O conjunto de tipos que chega
       aqui com `natureza === 'agravado'` e sem item já é exatamente
       ele — `comArma` mais as garras. A lista fica porque ela ESCREVE o
       limite do livro num lugar onde alguém vai procurar por ele, e
       porque um tipo de ataque novo entraria por fora dela; o que ela
       não faz é proteger hoje. */
    const PERFURA_OU_CORTA = ['branca', 'branca_duas', 'fogo', 'fogo_no_corpo', 'arremesso', 'garras'];
    const agravadoDoItem = !!(item && item.natureza === 'agravado');
    const armaduraVale = arm.valor > 0
      && natureza === 'agravado'
      && PERFURA_OU_CORTA.includes(tipo)
      && !agravadoDoItem
      && !(item && item.ignoraArmadura);

    if (item && item.ignoraArmadura && arm.valor) eventos.push({ tipo: 'nota',
      texto: `${item.nome} atravessa ${arm.tipo}: a armadura não absorve nada.` });

    const convertido = armaduraVale ? Math.min(arm.valor, bruto) : 0;
    const dano = bruto;
    const danoAgravado = bruto - convertido;
    const danoSuperficial = convertido;

    if (convertido) {
      eventos.push({ tipo: 'nota',
        texto: `${arm.tipo} converte ${convertido} de Agravado em Superficial; ${
          danoAgravado === 0 ? 'nenhum ponto segue Agravado'
          : danoAgravado === 1 ? '1 ponto segue Agravado'
          : `${danoAgravado} pontos seguem Agravado`}.` });
    } else if (arm.valor > 0 && natureza !== 'agravado') {
      eventos.push({ tipo: 'nota',
        texto: `${arm.tipo} não faz nada aqui: o dano já é Superficial, e a armadura só `
             + `converte Agravado de lâmina ou perfuração (pág. 304).` });
    }
    if (arm.contraBala) eventos.push({ tipo: 'nota',
      texto: `${arm.tipo} vale zero contra bala (pág. 304).` });

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
          natureza === 'agravado' ? 'Agravado' : 'Superficial'}${
          convertido ? ` (${convertido} viraram Superficial na armadura)` : ''}.` });

      /* Duas aplicações quando a armadura converteu: a metade Agravada
         entra inteira, e a convertida entra como Superficial — e é
         cortada pela metade "como de costume", que é o que o livro
         manda. Uma chamada só não daria para separar as duas. */
      const debilitadoAntes = Estado.trilhas(defensor).vitalidade.livres === 0;
      if (danoAgravado) {
        const a = Estado.aplicarDano(defensor, { quantidade: danoAgravado, tipo: natureza,
          fonte: info.armas, semMetade: !alvoVampiro });
        eventos.push(...a.eventos);
        aplicado = a;
      }
      if (danoSuperficial) {
        const s = Estado.aplicarDano(defensor, { quantidade: danoSuperficial, tipo: 'superficial',
          fonte: info.armas, semMetade: !alvoVampiro });
        eventos.push(...s.eventos);
        aplicado = { eventos: [], destruido: aplicado.destruido || s.destruido,
                     torpor: aplicado.torpor || s.torpor };
      }
      ferimento = this._ferimentoIncapacitante(defensor, {
        debilitadoAntes, dano, ferimentosIncapacitantes, eventos, alvoVampiro });
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

    /* A ESTACA TEM DUAS CONDIÇÕES, E O MOTOR LIA UMA.  (§90)

       O rodapé da tabela de armas (pág. 304) pede ATAQUE LOCALIZADO NO
       CORAÇÃO **e** 5+ de dano. Aqui bastavam os 5 pontos, e o ataque
       localizado nem existia — então a estaca paralisava de graça, sem
       o preço de −2 sucessos que é justamente o que a torna uma aposta.

       Um golpe de estaca que sai grande sem ter sido mirado agora diz
       o que faltou, em vez de calar: é informação de regra, e o jogador
       precisa dela para escolher no turno seguinte. */
    const noCoracao = !!(alvoLocal && /cora[çc][ãa]o|peito|t[óo]rax/i.test(alvoLocal.onde));
    let paralisou = false;
    if (ehEstaca && alvoVampiro && typeof Perdicoes !== 'undefined'
        && !Perdicoes.estacaParalisa(defensor)) {
      eventos.push({ tipo: 'nota', texto: Perdicoes.NOTA_RALO_ESTACA });   /* §95, pág. 111 */
    } else if (ehEstaca && alvoVampiro) {
      if (noCoracao && dano >= 5) {
        paralisou = true;
        eventos.push({ tipo: 'critico', texto: Escudo.NOTA_ESTACA });
      } else if (dano >= 5 && !noCoracao) {
        eventos.push({ tipo: 'nota',
          texto: 'Dano suficiente para estacar, mas o golpe não foi mirado no coração: '
               + 'a estaca não paralisa (pág. 304).' });
      } else if (noCoracao) {
        eventos.push({ tipo: 'nota',
          texto: `Estaca no coração com ${dano} de dano: faltam ${5 - dano} para paralisar (pág. 304).` });
      }
    }

    /* CRÍTICO CONTRA MORTAL ANÔNIMO  (§90, pág. 303)

       "se um jogador rolar um crítico para o seu personagem em combate
        contra um oponente mortal ANÔNIMO, este fica incapacitado sem a
        necessidade de calcular o dano."

       É regra de RITMO, e o livro diz isso: existe para não gastar
       turno com segurança de boate. `anonimo` é marca de quem gerou o
       oponente — um PN com nome próprio na cena não é anônimo. */
    let incapacitado = false;
    if (rolAtq.critico && !alvoVampiro && defensor && defensor.anonimo) {
      incapacitado = true;
      eventos.push({ tipo: 'critico',
        texto: `Crítico contra mortal anônimo: ${defensor.nome || 'o sujeito'} cai, e não se `
             + `calcula dano (pág. 303).${rolAtq.tipo === 'perigo' ? ' Em Sucesso em Perigo, costuma ser morte.' : ''}` });
    }

    const conseq = Arbitro.consequencias(rolAtq);
    if (conseq) eventos.push({ tipo: 'nota',
      texto: `${conseq.titulo} no ataque. Escolha: ${conseq.escolhas.join(' · ')}` });

    return { possivel: true, acertou: true, margem, dano, natureza,
             danoAgravado, danoSuperficial, convertidoPelaArmadura: convertido,
             arma: info, armadura: arm, rolAtq, rolDef, eventos,
             /* §63 (A3): num empate bilateral os dois acertam, então
                `acertou` e `revide` podem vir juntos. */
             esquiva: ehEsquiva, bilateral, revide, coice, queima, enredado,
             /* §90 — o que a Mesa precisa saber para o turno seguinte. */
             ataqueTotal: ataqueTotalAtivo, defesaTotal: !!(def && def.defesaTotal),
             surpresa: !!surpresa, localizado: alvoLocal, paralisou, incapacitado, ferimento,
             descarregou: !!(ataqueTotalAtivo && modelo.aDistancia),
             destruido: aplicado.destruido, torpor: aplicado.torpor };
  },

  /* Quanto custa mirar. O livro dá o padrão e diz que o Narrador mexe
     nele: −1 para o pneu de um carro, −4 para a tubulação de
     combustível de um avião em decolagem (pág. 303). */
  CUSTO_LOCALIZADO: 2,

  /* Mora em `motor-combate-avancado.js`, com o resto do capítulo. */
  maiorQuePistola(arma) { return ArmaGrande.eh(arma); },

  /* Os Ferimentos Incapacitantes são sistema do capítulo avançado, e
     moram em `motor-combate-avancado.js`. Aqui fica só a chamada, que
     é onde o gatilho do livro acontece: ao sofrer dano. */
  _ferimentoIncapacitante(defensor, opcoes) {
    return Ferimentos.talvez(defensor, opcoes);
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
  /* §95 — O CORPO DESTA FUNÇÃO MUDOU DE CASA.

     Ela nunca resolveu combate: monta um antagonista a partir de
     `Escudo.MODELOS_MORTAIS` e `Escudo.PROFISSOES`, que são tabelas do
     Escudo do Mestre. Estava aqui por vizinhança, não por dono.

     Saiu porque o `motor-combate` encostou no teto de tamanho ao
     receber a Perdição do Sangue-Ralo, e a resposta certa é a mesma da
     §93: tirar de dentro o que não era dele, e não afrouxar o teto.

     Foi para `TabelasV5`, que é onde as tabelas do Escudo do Mestre já
     são lidas. O nome fica aqui, porque `mesa.js` e os testes chamam
     por ele. */
  gerarMortal(modelo = 'comum', profissao = null) {
    return TabelasV5.gerarMortal(modelo, profissao);
  }
};


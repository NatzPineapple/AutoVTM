/* ============================================================
   VITÆ — As ações da mesa
   Uma responsabilidade: **o que cada clique da mesa faz**. Nada
   aqui desenha (isso é do `mesa-render.js`) e nada aqui decide
   regra (isso é do Árbitro): estas funções orquestram — chamam o
   motor, aplicam o resultado, mandam redesenhar.

   O DESPACHANTE — item N4 da §45.4

   Eram 48 `case` num `switch` só, dentro do ouvinte de clique, e o
   arquivo não parava de crescer com eles: 1.140 → 1.285 → 1.411 →
   1.503 linhas. É o mesmo problema que a §22.3 resolveu na escada
   trocando `if` encadeado por classes.

   Agora é um mapa de `ação → função`. Cada uma recebe o `data-id` do
   elemento clicado e, quando precisa, o próprio elemento. Duas coisas
   melhoram junto com o tamanho:

   - dá para TESTAR uma ação sem simular clique nenhum;
   - dá para PERGUNTAR quais ações existem, que é o que a checagem
     nova faz: todo `data-mesa` do HTML tem que ter dono aqui.
   ============================================================ */
const ACOES_MESA = {

  /* Marcador de "não faz nada". Existe para que `closest('[data-mesa]')`
     pare neste elemento em vez de subir até um pai clicável — item da
     doca que não abre nada, dentro de algo que abre.

     Ter dono explícito não é burocracia: sem ele, o despachante da §50
     escreve "Ação de mesa sem dono: nada" no console a cada clique, e
     aviso que aparece sempre é aviso que ninguém lê. */
  'nada'() {},
  /* A LOGO VOLTA PARA A TELA INICIAL. SEMPRE.  (§92)

     Os três cabeçalhos da Mesa tinham logo, e nenhum dos três ia para
     a capa: dois levavam ao saguão — e o do próprio saguão levava a
     ele mesmo, um clique morto — e o terceiro chamava `sair`, que
     chama o `render()` DO CRIADOR. E o `render()` do criador desenha
     o passo em que ele parou, seja qual for: era isso que fazia a
     logo cair "numa página aleatória".

     Logo de topo é o botão mais previsível de qualquer interface, e
     o destino dela é um só. Os botões ao lado continuam levando ao
     saguão e ao criador, com o nome escrito. */
  'capa'(id, alvo) {
        salvarMesa(); renderCapa(); return;
  },

  'sair'(id, alvo) {
        salvarMesa(); render(); return;
  },

  'saguao'(id, alvo) {
        salvarMesa(); renderSaguao(); return;
  },

  'cronicar'(id, alvo) {
        fecharCronica(id); return;
  },

  'esquecer-legado'(id, alvo) {
        const corte = id.indexOf(':');
        const colecao = id.slice(0, corte);
        const chave = id.slice(corte + 1);
        Legado.esquecer(M.ficha, colecao, chave);
        if (colecao === 'relacoes') M.pessoas = M.pessoas.filter(p => !(p.doLegado && p.id === chave));
        if (colecao === 'fios') M.fios = M.fios.filter(f => !(f.doLegado && f.id === chave));
        anunciar([{ tipo: 'nota', texto: 'Tirado do legado. Não atravessa mais.' }]);
        salvarMesa(); renderMesa(); return;
  },

  'aplicar-legado'(id, alvo) {
        const p = Legado.aplicarProposta(M.ficha, id);
        if (!p) return;
        anunciar([{ tipo: 'nota', texto: `${
          p.classe === 'defeitos' ? 'Defeito' : p.classe === 'meritos' ? 'Mérito' : 'Antecedente'
        } ${p.nome} ${p.de} → ${p.para}, vindo do legado. ${p.porque}` }]);
        salvarMesa(); renderMesa(); return;
  },

  'recusar-legado'(id, alvo) {
        Legado.recusarProposta(M.ficha, id);
        anunciar([{ tipo: 'nota', texto: 'A conversão foi recusada. O legado continua sendo só memória.' }]);
        salvarMesa(); renderMesa(); return;
  },

  'minha-arma'(id, alvo) {
        M.combate.arma = id; salvarMesa(); renderMesa(); return;
  },

  'fugir-do-combate'(id, alvo) {
        fecharCombate('Você saiu da briga.');
        salvarMesa(); renderMesa(); return;
  },

  'pegar-item'(id, alvo) {
        const campo = $('#bolsa-nome');
        const nome = campo ? campo.value.trim() : '';
        if (!nome) { toast('Escreva o que você está pegando.'); return; }
        M.bolsa = M.bolsa || [];
        /* Item do livro da categoria "arma" já entra como arma, mesmo
           guardado pelo botão comum — quem escreveu "Coquetel Molotov"
           não guardou um souvenir (§66). */
        const doLivro = Combate.itemPor(nome);
        M.bolsa.push({ nome, arma: id === 'arma' || !!(doLivro && doLivro.categoria === 'arma'),
                       comoVeio: `Pego em ${M.cena.hora || 'algum momento'}`, ts: Date.now() });
        anunciar([{ tipo: 'nota', texto: `Você guarda: ${nome}.` }]);
        salvarMesa(); renderMesa(); return;
  },

  /* ----------------------------------------------------------
     JOGO PONDERADO — Apêndice III  (§89)

     A Carta X NÃO PERGUNTA NADA. Nem "tem certeza?", nem "por quê?".
     O livro dispensa a explicação com todas as letras (pág. 422), e
     a §37.4 já proíbe o `confirm()` — aqui as duas coisas apontam
     para o mesmo lugar: o toque age.
     ---------------------------------------------------------- */
  'carta-x'(id, alvo) {
        usarCartaX(); return;
  },

  'desvanecer'(id, alvo) {
        pedirFade(); return;
  },

  'declarar-limite'(id, alvo) {
        const campo = $(`#limite-${id === 'veu' ? 'veu' : 'linha'}`);
        const texto = campo ? campo.value.trim() : '';
        if (!texto) { toast('Escreva o que esta crônica não vai encostar.'); return; }
        adicionarLimite(id, texto);
        return;
  },

  /* `id` chega como "tipo:texto". O texto pode ter dois-pontos dentro,
     então o corte é no PRIMEIRO — o mesmo cuidado que a ação
     `esquecer-legado` já tomava. */
  'sugerir-limite'(id, alvo) {
        const corte = id.indexOf(':');
        adicionarLimite(id.slice(0, corte), id.slice(corte + 1));
        return;
  },

  /* Virar Véu ou virar Linha é a mesma operação de declarar: entrar de
     um lado tira do outro. O livro deixa a troca nos dois sentidos. */
  'mover-limite'(id, alvo) {
        const corte = id.indexOf(':');
        adicionarLimite(id.slice(0, corte), id.slice(corte + 1));
        return;
  },

  'tirar-limite'(id, alvo) {
        removerLimite(id); return;
  },

  'declarar-retirada'(id, alvo) {
        const corte = id.indexOf(':');
        adicionarLimite(id.slice(0, corte), id.slice(corte + 1));
        return;
  },

  /* ----------------------------------------------------------
     PROJETOS — Apêndice II  (§89)
     ---------------------------------------------------------- */
  'criar-projeto'(id, alvo) {
        const v = (sel) => { const c = $(sel); return c ? c.value.trim() : ''; };
        const nome = v('#prj-nome');
        if (!nome) { toast('Escreva o que você quer, em termos de história.'); return; }
        criarProjeto({
          nome,
          objetivo: v('#prj-objetivo'),
          antecedente: v('#prj-antecedente'),
          escopo: Number(v('#prj-escopo')) || 1,
          parada: v('#prj-parada'),
          piscina: Number(v('#prj-piscina')) || 1,
          incremento: v('#prj-incremento') || 'meses'
        });
        return;
  },

  /* Cultivar uma bolsa é um projeto, e o preço mora no Apêndice II e
     não no capítulo de Ressonância — é o buraco que a §67 deixou
     aberto. O chip só PREENCHE o formulário: quem anota é o jogador. */
  'projeto-de-bolsa'(id, alvo) {
        const r = Projetos.ESCOPO_DA_RESSONANCIA.find(x => x.id === id);
        if (!r) return;
        const por = (sel, valor) => { const c = $(sel); if (c) c.value = valor; };
        por('#prj-nome', r.rotulo);
        por('#prj-objetivo', 'Alimentar-se da mesma bolsa por meses, até o sangue dela mudar de humor.');
        por('#prj-antecedente', 'Rebanho');
        por('#prj-escopo', String(r.escopo));
        por('#prj-parada', 'Manha + Rebanho');
        toast(`Escopo ${r.escopo}: Dificuldade ${r.escopo + Projetos.DIFICULDADE_EXTRA} no Lançamento.`);
        return;
  },

  /* ----------------------------------------------------------
     CONFLITO AVANÇADO E ESTADOS DE CONDENAÇÃO  (§90)
     ---------------------------------------------------------- */
  'opcao-combate'(id, alvo)  { alternarOpcaoDeCombate(id); return; },
  'mirar'(id, alvo)          { mirarEm(id === 'nada' ? '' : id); return; },
  'mirar-onde'(id, alvo) {
        const campo = $('#mirar-onde');
        mirarEm(campo ? campo.value : ''); return;
  },
  'agarrar'(id, alvo)        { agarrarOponente(id); return; },
  'agarramento'(id, alvo)    { turnoDeAgarramento(id); return; },
  'duelo-social'(id, alvo)   { duelarSocialmente(id); return; },
  'conceder-social'(id, alvo){ concederSocialmente(); return; },
  'plateia'(id, alvo) {
        const campo = $('#plateia');
        definirTestemunhas(campo ? campo.value : ''); return;
  },

  'reinante'(id, alvo) {
        const campo = $('#laco-reinante');
        definirReinante(campo ? campo.value : ''); return;
  },
  'beber-do-reinante'(id, alvo) { beberDoReinante(id !== 'bolsa'); return; },
  'resistir-ao-laco'(id, alvo)  { resistirAoLaco(id === 'presenca'); return; },
  'partir-o-laco'(id, alvo)     { tentarPartirOLaco(); return; },
  'meses-do-laco'(id, alvo)     { passarMesesDoLaco(Number(id) || 1); return; },

  'comecar-diablerie'(id, alvo) {
        const v = (sel) => { const c = $(sel); return c ? c.value.trim() : ''; };
        comecarDiablerie({ potencia: v('#dbl-potencia'), geracao: v('#dbl-geracao'),
                           determinacao: v('#dbl-determinacao'), disciplinas: v('#dbl-disciplinas') });
        return;
  },
  'rolar-diablerie'(id, alvo)    { rolarDiablerie(); return; },
  'consumar-diablerie'(id, alvo) { consumarDiablerie(); return; },
  'abandonar-diablerie'(id, alvo){ abandonarDiablerie(); return; },

  /* As quatro ações de experiência saíram daqui e foram para o
     criador (`paineis/painel-experiencia.js`): gastar experiência é
     editar a ficha, e a Mesa não edita ficha fora do que o jogo faz
     nela. O que a Mesa faz com experiência é ganhá-la no fim da
     sessão. */

  'lancar-projeto'(id, alvo)   { lancarProjeto(id); return; },
  'objetivo-projeto'(id, alvo) { rolarObjetivoDoProjeto(id); return; },
  'avancar-projeto'(id, alvo)  { avancarProjeto(id); return; },
  'encerrar-projeto'(id, alvo) { encerrarProjeto(id); return; },
  'apagar-projeto'(id, alvo)   { apagarProjeto(id); return; },

  /* Quem sobe o ollama DEPOIS de abrir a mesa não precisa recarregar
     a página para o modelo entrar. A detecção era feita uma vez só,
     em `abrirMesa`. (§75) */
  'religar-narrador'(id, alvo) {
        toast('Procurando o modelo…');
        Promise.all([Narrador.detectar(), Cronista.verificar()]).then(([temIA]) => {
          anunciar([{ tipo: temIA ? 'nota' : 'bloqueio',
            texto: temIA
              ? `Narrador ligado: ${Narrador.nome}. As respostas passam a vir do modelo.`
              : 'Nenhum modelo respondeu. Confira se o ollama está de pé e se a mesa está aberta pelo proxy.' }]);
          salvarMesa(); renderMesa();
        });
        return;
  },

  'apagar-fogo'(id, alvo) {
        const lista = (M.combate && M.combate.queimas) || [];
        const q = lista[+id];
        if (!q) return;
        lista.splice(+id, 1);
        anunciar([{ tipo: 'nota', texto: `O fogo de ${q.item} apagou.` }]);
        salvarMesa(); renderMesa(); return;
  },

  'largar-item'(id, alvo) {
        const item = (M.bolsa || [])[+id];
        if (!item) return;
        M.bolsa.splice(+id, 1);
        anunciar([{ tipo: 'nota', texto: `Você larga: ${item.nome}.` }]);
        salvarMesa(); renderMesa(); return;
  },

  'gerar-oponente'(id, alvo) {
        gerarOponente(id); return;
  },

  'remover-oponente'(id, alvo) {
        M.combate.oponentes = (M.combate.oponentes || []).filter(o => o.ref !== id);
        if (M.combate.rodada) {
          const r = Rodada.sincronizar(M.combate.rodada, combatentes());
          if (r && r.encerrada) M.combate.rodada = null;
        }
        salvarMesa(); renderMesa(); return;
  },

  'abrir-rodada'(id, alvo) {
        abrirRodada(); return;
  },

  'encerrar-rodada'(id, alvo) {
        encerrarRodada(); return;
  },

  'passar-vez'(id, alvo) {
        const rod = M.combate.rodada;
        if (!rod || !Rodada.vezDe(rod, 'voce')) {
          anunciar([{ tipo: 'nota', texto: 'Não é a sua vez.' }]);
          salvarMesa(); renderMesa(); return;
        }
        /* §90 — passar a vez põe no FIM da ordem, e mantém lá pelo
           resto do conflito (pág. 300). Antes isto era só um avanço de
           índice: o jogador passava e voltava a agir no lugar de
           sempre na rodada seguinte, que é o contrário do que a regra
           oferece como troca. */
        anunciar(Rodada.passar(rod, 'voce').eventos);
        correrTurnosDosOponentes(); return;
  },

  'atacar'(id, alvo) {
        const corte = id.lastIndexOf(':');
        const ref = id.slice(0, corte);
        const tipo = id.slice(corte + 1);
        const o = oponentePorRef(ref);
        if (!o) return;
        const rod = M.combate.rodada;
        if (rod && !rod.encerrada && !Rodada.vezDe(rod, 'voce')) {
          const vez = Rodada.atual(rod);
          anunciar([{ tipo: 'nota',
            texto: `Ainda não é a sua vez: quem age agora é ${vez ? vez.nome : 'ninguém'}.` }]);
          salvarMesa(); renderMesa(); return;
        }
        if (Rodada.foraDeCombate({ ficha: o.ficha })) {
          anunciar([{ tipo: 'nota', texto: `${o.nome} já está fora da briga.` }]);
          salvarMesa(); renderMesa(); return;
        }
        const r = golpe({ atacante: M.ficha, defensor: o.ficha, tipo,
          arma: M.combate.arma, armadura: o.armadura,
          estadosAtacante: estadosAtuais(), estadosDefensor: o.estados, alvoVampiro: false,
          terreno: terrenoDoOponente(o) });
        if (r.queima) pegarFogo(o, r.queima, o.nome);
        if (r.destruido) anunciar([{ tipo: 'critico', texto: `${o.nome} não levanta mais.` }]);
        if (rod && !rod.encerrada && r.possivel !== false) {
          avancarVez();
          correrTurnosDosOponentes(); return;
        }
        conferirFimDoCombate();
        salvarMesa(); renderMesa(); return;
  },

  'revidar'(id, alvo) {
        const o = oponentePorRef(id);
        if (!o) return;
        if (M.combate.rodada && !M.combate.rodada.encerrada) {
          anunciar([{ tipo: 'nota',
            texto: 'Com a rodada aberta, quem revida é a ordem de iniciativa, não este botão.' }]);
          salvarMesa(); renderMesa(); return;
        }
        const escolha = Rodada.escolhaDoOponente(o, { ref: 'voce' });
        if (!escolha.possivel) {
          anunciar([{ tipo: 'nota', texto: escolha.motivo }]);
          salvarMesa(); renderMesa(); return;
        }
        const r = golpe({ atacante: o.ficha, defensor: M.ficha, tipo: escolha.tipo,
          arma: escolha.arma, armadura: null,
          estadosAtacante: o.estados, estadosDefensor: estadosAtuais(), alvoVampiro: true,
          terreno: terrenoDoOponente(o), doJogador: false });
        if (r.queima) pegarFogo(M.combate, r.queima, 'Você');
        if (r.torpor) anunciar([{ tipo: 'critico', texto: 'Você caiu em torpor.' }]);
        salvarMesa(); renderMesa(); return;
  },

  /* O QUE A BESTA COBRA, escolhido pelo jogador e aplicado pelo Árbitro.

     `data-id` é `<id da mensagem>:<índice da escolha>`. A mensagem
     guarda as opções que o Árbitro ofereceu, então o clique não
     consegue pedir nada que não tenha sido oferecido — e o `escolhido`
     fecha a linha para não pagar duas vezes.

     Os botões de "+1 superficial" e "Fome +1" que existiam para isto
     saíram: alterar a ficha sem ação em jogo não é do jogador. */
  'consequencia'(id, alvo) {
        const corte = id.lastIndexOf(':');
        const msg = M.mensagens.find(x => x.id === id.slice(0, corte));
        if (!msg || msg.escolhido) return;
        const escolha = (msg.escolhas || [])[+id.slice(corte + 1)];
        if (!escolha) return;
        /* O resultado vem da MENSAGEM da rolagem, e não de `M.rolagens`:
           aquele mapa é indexado pelo id do pedido do Narrador, e um
           reteste de Vontade reescreve o resultado na mensagem. */
        const r = (M.mensagens.find(x => x.id === msg.rolagem) || {}).resultado;
        msg.escolhido = escolha;
        aplicarNoEstado(f => Estado.aplicarConsequencia(f, r, escolha));
        return;
  },

  'curar'(id, alvo) {
        aplicarNoEstado(f => Estado.curar(f, id === 'vontade'
          ? { trilha: 'vontade' }
          : { trilha: 'vitalidade', tipo: 'superficial' }));
        return;
  },

  'alimentar'(id, alvo) {
        /* §101 — Predadores.alimentar embrulha Estado.alimentar: só ele sabe do cadáver. */
        aplicarNoEstado(f => (typeof Predadores !== 'undefined' ? Predadores : Estado).alimentar(f, id));
        return;
  },

  'provocacao'(id, alvo) {
        aplicarNoEstado(f => Estado.provocacao(f));
        return;
  },

  /* SAÍRAM DAQUI, E NÃO FORAM PARA LUGAR NENHUM: `dano`, `fome`,
     `macula`, `atenuante` e `estado-manual`.

     Eram cinco botões que escreviam na ficha sem nada ter acontecido no
     jogo — "+1 superficial", "Fome +1", "+2 Máculas", ligar "cego" à
     mão. O estado do personagem é do Árbitro: ele conta que houve dano,
     e a Mesa grava. Quem marcava era o jogador, e o `fonte` dos dois
     piores dizia isso com todas as letras — "marcado na doca".

     Por onde o estado muda agora:

       . o combate, por `Combate.resolver` → `Estado.aplicarDano`;
       . a consequência da rolagem, pela ação `consequencia` acima;
       . o Narrador, pelos `efeitos` que `aplicarResposta` grava;
       . as ações declaradas abaixo, que passam por um motor do Árbitro.

     O que ficou SEM caminho está na lista de pendências: marcar
     "cego" ou "surdo" não nasce de lugar nenhum hoje. */

  /* DOIS CLIQUES, E NÃO `confirm()`.  (§76)

     A §69 pôs `confirm()` do navegador aqui, e isso contraria a regra
     da §37.4 — nascida de um defeito: o `confirm()` devolvia false em
     silêncio e o botão parecia morto. A confirmação vive na interface.

     `M.pilarParaPerder` guarda qual está armado, e o render mostra
     "Perder mesmo" com a saída ao lado. */
  'perder-pilar'(id, alvo) {
        /* "Uma vez perdida uma dessas pessoas, a Convicção a ela
           associada também estará perdida." (pág. 173) — §69, A8. */
        return armarOuPerderPilar(id, false);
  },

  'perder-pilar-culpa'(id, alvo) {
        return armarOuPerderPilar(id, true);
  },

  'cancelar-perder-pilar'(id, alvo) {
        M.pilarParaPerder = null;
        salvarMesa(); renderMesa(); return;
  },

  'desejo-agora'(id, alvo) {
        /* O Desejo paga NA HORA, uma vez por sessão (pág. 174) — A7. */
        aplicarNoEstado(f => Estado.realizarDesejo(f));
        return;
  },

  'remorso'(id, alvo) {
        aplicarNoEstado(f => Estado.testeDeRemorso(f));
        return;
  },

  'ritae'(id, alvo) {
        aplicarNoEstado(f => Estado.celebrarRitae(f, id));
        return;
  },

  'vaulderie'(id, alvo) {
        aplicarNoEstado(f => Estado.vaulderie(f));
        return;
  },

  'frenesi'(id, alvo) {
        aplicarNoEstado(f => Estado.testeDeFrenesi(f, {
          tipo: id, gatilho: (GATILHOS_FRENESI.find(g => g.tipo === id) || {}).gatilho }));
        return;
  },

  'cavalgar'(id, alvo) {
        aplicarNoEstado(f => Estado.testeDeFrenesi(f, { tipo: 'fome', cavalgar: true }));
        return;
  },

  'fim-sessao'(id, alvo) {
        aplicarNoEstado(f => Estado.fimDeSessao(f, {
          cumpriuDesejo:   id === 'desejo',
          cumpriuAmbicao:  id === 'ambicao',
          beneficiouPilar: id === 'pilar'
        }));
        return;
  },

  'nova-historia'(id, alvo) {
        escolha = { campanha: null, personagem: null, importada: escolha.importada };
        renderNovaHistoria(); return;
  },

  'escolher-campanha'(id, alvo) {
        escolha.campanha = id; renderNovaHistoria(); return;
  },

  'escolher-personagem'(id, alvo) {
        escolha.personagem = id; renderNovaHistoria(); return;
  },

  'comecar-noite'(id, alvo) {
        comecarNoite(); return;
  },

  'continuar-sessao'(id, alvo) {
        if (carregarSessao(id)) renderMesa();
        else { toast('Não consegui abrir essa noite.'); renderSaguao(); }
        return;
  },

/* O CHECKIN, EM DOIS CLIQUES.  (§85, item M2)

     O primeiro busca a prévia no Módulo 3 — o que mudou na ficha desde
     o checkout — e mostra. O segundo grava. O servidor já recusa sem
     aceite (409), então a interface não está sendo educada por conta
     própria: ela é o outro lado de uma regra que existe no módulo. */
  async 'checkin'(id, alvo) {
        if (!M.sessaoServidor) return;
        M.checkinPrevia = { alteracoes: [] };
        renderMesa();
        await Ponte.espelharAgora(M);
        const alt = await Ponte.alteracoes();
        M.checkinPrevia = (alt === null)
          ? { erro: 'O MesaServer não respondeu.' }
          : { alteracoes: alt };
        renderMesa(); return;
  },

  async 'checkin-aceitar'(id, alvo) {
        const r = await Ponte.checkin({ aceite: true });
        /* 200 gravou no FichaServer; 202 gravou só na pasta da sessão.
           Os dois são respostas, e a diferença importa para quem joga:
           uma diz "está na sua biblioteca", a outra diz "está guardada,
           mas o Módulo 2 não estava lá". */
        if (r.status === 200) {
          M.checkinPrevia = { feito: 'Guardada na biblioteca.' };
          if (r.fichaId) M.ficha.fichaId = r.fichaId;
          toast('Ficha guardada na biblioteca.');
        } else if (r.status === 202) {
          M.checkinPrevia = { feito: 'Guardada na sessão — o FichaServer não estava no ar.' };
          /* Não se perde: a cópia da sessão tem tudo, e a biblioteca
             local do navegador também. */
          if (r.pacote && r.pacote.ficha) guardarFicha(r.pacote.ficha);
          toast('O FichaServer não respondeu; guardei no navegador.');
        } else {
          M.checkinPrevia = { erro: r.motivo || r.erro || `HTTP ${r.status}` };
        }
        salvarMesa(); renderMesa(); return;
  },

  'checkin-cancelar'(id, alvo) {
        M.checkinPrevia = null;
        renderMesa(); return;
  },

  'apagar-sessao'(id, alvo) {
        const s = listarSessoes().find(x => x.id === id);
        if (!s) return;
        if (sessaoParaApagar !== id) {
          sessaoParaApagar = id;
          renderSaguao();
          toast('Clique de novo para apagar de vez.');
          return;
        }
        apagarSessao(id);
        sessaoParaApagar = '';
        toast(`${s.personagem} em ${s.campanha} foi apagada.`);
        renderSaguao(); return;
  },

  'cancelar-apagar-sessao'(id, alvo) {
        sessaoParaApagar = '';
        renderSaguao(); return;
  },

  'importar-ficha'(id, alvo) {
        importarFichaParaMesa(); return;
  },

  'aba'(id, alvo) {
        M.aba = id; M.itemAberto = '';
        /* Sair da aba desarma o Limpar. Sem isto, voltar depois e dar
           um clique apagaria o registro de primeira — que é justamente
           o que os dois cliques existem para impedir. */
        if (typeof Trafego !== 'undefined') Trafego.vista.armado = false;
        renderDoca(); return;
  },

  'doca'(id, alvo) {
        M.docaAberta = !M.docaAberta; renderDoca(); return;
  },

  'fechar-doca'(id, alvo) {
        M.docaAberta = false; renderDoca(); return;
  },

  /* ----------------------------------------------------------
     A ABA DE DEBUG  (§93)

     Quatro ações, e nenhuma delas toca em `M`: o filtro, a linha
     aberta e as próprias linhas moram no `Trafego`. Por isso
     nenhuma chama `salvarMesa()` — não há o que salvar, e salvar
     seria justamente o que o cabeçalho do `trafego.js` promete não
     fazer.

     As duas que têm regra — limpar e copiar — moram em funções com
     nome, fora do `switch`. É a lição da §91 e da §92: regra
     escondida num `case` não tem como ser testada sem simular
     clique, e a mutação passa em verde.
     ---------------------------------------------------------- */

  'debug-par'(id, alvo) {
        Trafego.vista.par = id;
        Trafego.vista.aberta = 0;
        Trafego.vista.armado = false;
        renderDoca(); return;
  },

  'debug-linha'(id, alvo) {
        Trafego.vista.aberta = (Trafego.vista.aberta === +id) ? 0 : +id;
        Trafego.vista.armado = false;
        renderDoca(); return;
  },

  'debug-limpar'(id, alvo) {
        limparTrafego(); renderDoca(); return;
  },

  'debug-copiar'(id, alvo) {
        copiarTrafego(); return;
  },


  /* §57 — correção à mão do que foi LIDO do texto. Vale por
     esta mensagem: enviarTurno zera os dois depois de enviar. */
  'volume'(id, alvo) {
        M.volumeManual = id;
        if (M.alvoManual) {
          const permitidos = (id === 'mensagem' ? pessoasComContato() : pessoasNaCena()).map(p => p.id);
          if (!permitidos.includes(M.alvoManual)) M.alvoManual = null;
        }
        renderLeitura();
        return;
  },

  'item'(id, alvo) {
        const chave = `${alvo.dataset.tipo}:${id}`;
        M.itemAberto = M.itemAberto === chave ? '' : chave;
        renderDoca(); return;
  },

  'abrir-ref'(id, alvo) {
        const tipo = alvo.dataset.tipo;
        M.aba = tipo === 'pessoa' ? 'pessoas' : 'locais';
        M.itemAberto = `${tipo}:${id}`;
        M.docaAberta = true;
        renderDoca(); return;
  },

  'rolar'(id, alvo) {
        rolarDoJogador(alvo.dataset.msg, +alvo.dataset.rota);
        return;
  },

  'reteste'(id, alvo) {
        retestarComVontade(id);
        return;
  },

  'enviar'(id, alvo) {
        const ta = $('#entrada');
        if (ta) enviarTurno(ta.value);
        return;
  },
};

/* Arma no primeiro clique, executa no segundo. A chave é o índice mais
   a natureza da perda, porque "perdi" e "foi por minha causa" custam
   Máculas diferentes e não podem se confundir. (§76) */
function armarOuPerderPilar(id, porSuasAcoes) {
  const i = +id;
  const chave = `${i}:${porSuasAcoes ? 'culpa' : 'perda'}`;
  if (M.pilarParaPerder !== chave) {
    M.pilarParaPerder = chave;
    const nome = (M.ficha.marcos || [])[i] || 'esse Pilar';
    toast(`Perder ${nome}? A Convicção cai junto. Clique de novo.`);
    salvarMesa(); renderMesa();
    return;
  }
  M.pilarParaPerder = null;
  aplicarNoEstado(f => Estado.perderPilar(f, i, { porSuasAcoes }));
}

/* ------------------------------------------------------------
   LIMPAR E COPIAR O TRÁFEGO  (§93)
   ------------------------------------------------------------ */

/* Dois cliques para apagar, e aqui isso não é zelo excessivo: a
   evidência que se perde é exatamente a que fez a pessoa abrir a aba,
   e ela não volta. É o idioma da §37.4, o mesmo de `perder-pilar` —
   a confirmação vive na interface, nunca num `confirm()`.

   Devolve `true` quando apagou de verdade, para o teste não precisar
   ler a tela para saber qual dos dois cliques foi. */
function limparTrafego() {
  if (!Trafego.vista.armado && Trafego.linhas.length) {
    Trafego.vista.armado = true;
    toast(`Apagar as ${Trafego.linhas.length} linhas do registro? Clique de novo.`);
    return false;
  }
  Trafego.vista.armado = false;
  Trafego.limpar();
  return true;
}

/* Copia o que está À VISTA, e não o registro inteiro: quem filtrou por
   "só o que falhou" quer colar as falhas, não as duzentas linhas.

   A área de transferência recusa em contexto inseguro e quando a aba
   não está em foco, e recusar não pode virar erro de turno — daí o
   `catch` que avisa e devolve, como manda o `fronteiras.test.mjs`. */
async function copiarTrafego() {
  Trafego.vista.armado = false;
  const texto = Trafego.comoTexto(Trafego.vista.par);
  if (!texto) { toast('Não há nada à vista para copiar.'); return false; }
  try {
    await navigator.clipboard.writeText(texto);
    toast(`${Trafego.filtrar(Trafego.vista.par).length} linhas copiadas.`);
    return true;
  } catch (e) {
    console.warn('[trafego] a área de transferência recusou:', e);
    toast('O navegador não deixou copiar. O registro está no console.');
    console.log(texto);
    return false;
  }
}

/* ------------------------------------------------------------
   JOGO PONDERADO — Apêndice III  (§89)

   Três coisas, e a mais importante é a que não tem código: NADA
   AQUI PERGUNTA POR QUÊ. O livro é explícito na Carta X — "caso
   queiram se explicar, podem fazê-lo, mas isso não é necessário"
   (pág. 422) — e uma tela que exige motivo para retirar uma cena
   é uma tela que cobra o preço que o livro mandou não cobrar.

   Pelo mesmo motivo não há confirmação: a §37.4 já diz que a
   confirmação vive na interface e nunca num `confirm()`, e aqui
   ela nem na interface deve viver. O botão faz na hora. Desfazer
   é que precisa de esforço, não fazer.
   ------------------------------------------------------------ */

/* O trecho que vai para a lista de retiradas — e daí para o
   prefixo do Narrador, como "isto não aconteceu". Curto de
   propósito: é para ele reconhecer o assunto, não relê-lo. */
function trechoRetirado(m) {
  return String((m && m.texto) || '')
    .replace(/\[\[(?:pessoa|local):([a-z0-9_]+)(?:\|([^\]]+))?\]\]/gi, (_, id, rot) => rot || id)
    .replace(/\*\*|\*/g, '').replace(/\s+/g, ' ').trim().slice(0, 90);
}

function usarCartaX() {
  /* A carta pega a última narração que ainda está de pé. Se a última
     coisa na tela já foi retirada, ela sobe para a anterior — apertar
     duas vezes desfaz duas passagens, que é o que a mesa física faz. */
  const alvo = [...M.mensagens].reverse()
    .find(m => m.autor === 'narrador' && !m.retirado);

  if (!alvo) {
    anunciar([{ tipo: 'nota', texto:
      'Carta X: não há narração para retirar. O jogo segue de onde estava.' }]);
    salvarMesa(); renderMesa(); return null;
  }

  alvo.retirado = true;
  M.limites = Limites.normalizar(M.limites);
  M.limites.retiradas.push({ ts: Date.now(), trecho: trechoRetirado(alvo) });
  M.limites = Limites.normalizar(M.limites);

  M.mensagens.push({ id: msgId(), autor: 'sistema', cartaX: true, ts: Date.now(),
    texto: 'Carta X. Aquilo não aconteceu, e o Narrador não volta a isso. '
         + 'Você não precisa dizer por quê — mas, se quiser, a aba Limites transforma '
         + 'isto numa Linha ou num Véu.' });
  registrar('Carta X — uma passagem foi retirada.');
  salvarMesa(); renderMesa();
  return alvo;
}

/* O fade (pág. 421). Vale por um turno: o jogador pede o corte, o
   próximo turno corta. Sem modelo de pé, o Narrador simulado ignora
   o pedido — mas a mensagem na tela já cortou a cena para quem lê,
   que é metade do que a técnica faz. */
function pedirFade() {
  M.pedidoDeFade = true;
  M.mensagens.push({ id: msgId(), autor: 'sistema', ts: Date.now(),
    texto: 'A cena desvanece. O que vier agora começa depois — sem o meio.' });
  registrar('Fade pedido pelo jogador.');
  salvarMesa(); renderMesa();
}

function adicionarLimite(tipo, texto) {
  const t = String(texto || '').replace(/\s+/g, ' ').trim();
  if (!t) return;
  M.limites = Limites.normalizar(M.limites);
  /* Entrar de um lado é sair do outro: o livro deixa um Véu virar
     Linha e vice-versa, e "vice-versa" é uma troca, não uma cópia. */
  M.limites.linhas = M.limites.linhas.filter(x => x !== t);
  M.limites.veus = M.limites.veus.filter(x => x !== t);
  (tipo === 'veu' ? M.limites.veus : M.limites.linhas).push(t);
  M.limites = Limites.normalizar(M.limites);
  registrar(`${tipo === 'veu' ? 'Véu' : 'Linha'} declarado: ${t}`);
  salvarMesa(); renderMesa();
}

function removerLimite(texto) {
  const t = String(texto || '');
  M.limites = Limites.normalizar(M.limites);
  M.limites.linhas = M.limites.linhas.filter(x => x !== t);
  M.limites.veus = M.limites.veus.filter(x => x !== t);
  registrar(`Limite retirado da lista: ${t}`);
  salvarMesa(); renderMesa();
}

/* ------------------------------------------------------------
   PROJETOS — Apêndice II  (§89)

   A mesa guarda e rola; quem sabe a regra é `Projetos`. As duas
   rolagens seguem o caminho síncrono da §82, como o frenesi e o
   Remorso — o que a pendência M10 já declara: só a rolagem de AÇÃO
   passa pelo Módulo 3 hoje.
   ------------------------------------------------------------ */
function projetoPor(id) { return (M.projetos || []).find(p => p.id === id) || null; }

function criarProjeto(campos) {
  const p = Projetos.novo(campos || {});
  if (!p.nome) return null;
  M.projetos = (M.projetos || []).concat([p]);
  anunciar([{ tipo: 'nota', texto:
    `Projeto anotado: "${p.nome}". Escopo ${p.escopo}, logo Dificuldade `
    + `${Projetos.dificuldadeDeLancamento(p)} no Lançamento. Ele só começa a correr quando for lançado.` }]);
  salvarMesa(); renderMesa();
  return p;
}

function apagarProjeto(id) {
  M.projetos = (M.projetos || []).filter(p => p.id !== id);
  registrar('Projeto apagado da lista.');
  salvarMesa(); renderMesa();
}

/* A parada de um projeto é "Habilidade + Antecedente" (pág. 415).
   O Antecedente não é Atributo nem Perícia — ele não tem uma
   piscina que a ficha saiba montar —, então quem soma é o jogador,
   e o campo guarda o número escolhido. Isso é honesto: o livro faz
   o Narrador determinar a parada caso a caso. */
function piscinaDoProjeto(p) {
  return Math.max(1, Number(p && p.piscina) || 1);
}

function lancarProjeto(id) {
  const p = projetoPor(id);
  if (!p || p.estado === 'lancado') return;
  const pedido = Projetos.pedidoDeLancamento(p, {
    piscina: piscinaDoProjeto(p), fome: M.ficha ? (M.ficha.fome || 0) : 0
  });
  const r = Dados.apurar(pedido, Dados.rodar(pedido));
  M.rolagens[`prj_lanc_${p.id}_${Date.now()}`] = r;
  anunciar([{ tipo: 'nota', texto: `${r.rotulo} — ${Dados.descrever(r)}` }]);
  anunciar(Projetos.apurarLancamento(p, r).eventos);
  salvarMesa(); renderMesa();
}

function rolarObjetivoDoProjeto(id) {
  const p = projetoPor(id);
  if (!p || p.estado !== 'lancado') return;

  const meuPedido = Projetos.pedidoDeObjetivo(p, {
    piscina: piscinaDoProjeto(p), fome: M.ficha ? (M.ficha.fome || 0) : 0
  });
  const meu = Projetos.semCritico(Dados.apurar(meuPedido, Dados.rodar(meuPedido)));

  const opPedido = Projetos.pedidoDaOposicao(p);
  const oposicao = Dados.apurar(opPedido, Dados.rodar(opPedido));

  anunciar([{ tipo: 'nota', texto:
    `${meu.rotulo} — ${meu.sucessos} sucesso(s), sem crítico possível. `
    + `A oposição rolou ${oposicao.piscina} dado(s) e fez ${oposicao.sucessos}`
    + `${oposicao.critico ? ', com crítico' : ''}.` }]);
  anunciar(Projetos.apurarObjetivo(p, meu, oposicao).eventos);
  salvarMesa(); renderMesa();
}

function avancarProjeto(id) {
  const p = projetoPor(id);
  if (!p) return;
  anunciar(Projetos.passarIncremento(p).eventos);
  salvarMesa(); renderMesa();
}

function encerrarProjeto(id) {
  const p = projetoPor(id);
  if (!p) return;
  anunciar(Projetos.encerrar(p).eventos);
  salvarMesa(); renderMesa();
}


/* ------------------------------------------------------------
   CONFLITO AVANÇADO — as opções na mesa  (§90)

   Elas moram em `M.combate.opcoes` e não em argumentos de clique
   porque são ESTADO DO TURNO: o jogador liga "Ataque Total" e
   depois escolhe em quem bater. Ligar e bater no mesmo clique
   tiraria dele a chance de olhar a parada antes.
   ------------------------------------------------------------ */
function alternarOpcaoDeCombate(id) {
  const op = M.combate.opcoes;
  if (!(id in op) || id === 'localizado') return;
  op[id] = !op[id];

  /* O livro proíbe a dupla, e a interface diz isso quando ela é
     tentada — em vez de deixar as duas acesas e ignorar uma na hora
     de rolar (pág. 298). */
  if (id === 'ataqueTotal' && op.ataqueTotal && op.surpresa) {
    op.surpresa = false;
    anunciar([{ tipo: 'nota', texto:
      'Ataque Total e ataque surpresa não valem juntos (pág. 298): a surpresa saiu.' }]);
  }
  if (id === 'surpresa' && op.surpresa && op.ataqueTotal) {
    op.ataqueTotal = false;
    anunciar([{ tipo: 'nota', texto:
      'Ataque surpresa e Ataque Total não valem juntos (pág. 298): o Ataque Total saiu.' }]);
  }
  if (id === 'ferimentos') {
    anunciar([{ tipo: 'nota', texto: op.ferimentos
      ? 'Ferimentos Incapacitantes ligados: quem for ferido já Debilitado rola 1d10 na tabela '
        + 'da pág. 303. O 13+ é torpor imediato.'
      : 'Ferimentos Incapacitantes desligados.' }]);
  }
  salvarMesa(); renderMesa();
}

function mirarEm(onde) {
  M.combate.opcoes.localizado = String(onde || '').trim();
  if (M.combate.opcoes.localizado) {
    anunciar([{ tipo: 'nota', texto:
      `Mirando ${M.combate.opcoes.localizado}: o próximo golpe perde ${
        Combate.CUSTO_LOCALIZADO} sucessos, e vale por um golpe só (pág. 302).` }]);
  }
  salvarMesa(); renderMesa();
}

/* ------------------------------------------------------------
   AGARRAMENTO  (§90, pág. 301)
   ------------------------------------------------------------ */
function agarrarOponente(ref) {
  const o = oponentePorRef(ref);
  if (!o) return;
  const r = Agarramento.agarrar({ atacante: M.ficha, defensor: o.ficha,
    estadosAtacante: estadosAtuais(), estadosDefensor: o.estados });
  M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: r.meu, ts: Date.now() });
  M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: r.dele, ts: Date.now() });
  anunciar(r.eventos);
  if (r.agarrou) {
    M.combate.agarrados[ref] = true;
    /* O estado `agarrado` já existia em `motor-arbitro.js` e só podia
       ser marcado à mão. Agora há um caminho até ele jogando. */
    if (!o.estados.includes('agarrado')) o.estados.push('agarrado');
  }
  if (M.combate.rodada && !M.combate.rodada.encerrada) {
    avancarVez(); correrTurnosDosOponentes(); return;
  }
  salvarMesa(); renderMesa();
}

function turnoDeAgarramento(id) {
  const corte = id.lastIndexOf(':');
  const ref = id.slice(0, corte);
  const escolha = id.slice(corte + 1);
  const o = oponentePorRef(ref);
  if (!o) return;
  const r = Agarramento.resolverTurno({ atacante: M.ficha, defensor: o.ficha, escolha,
    estadosAtacante: estadosAtuais(), estadosDefensor: o.estados, alvoVampiro: false });
  M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: r.meu, ts: Date.now() });
  M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: r.dele, ts: Date.now() });
  anunciar(r.eventos);
  if (r.escapou) {
    delete M.combate.agarrados[ref];
    o.estados = o.estados.filter(e => e !== 'agarrado');
  }
  if (r.destruido) anunciar([{ tipo: 'critico', texto: `${o.nome} não levanta mais.` }]);
  if (M.combate.rodada && !M.combate.rodada.encerrada) {
    avancarVez(); correrTurnosDosOponentes(); return;
  }
  conferirFimDoCombate();
  salvarMesa(); renderMesa();
}

/* ------------------------------------------------------------
   COMBATE SOCIAL  (§90, págs. 304–305)

   Ele usa o mesmo oponente do combate físico — a mesma ficha, com
   a mesma trilha de Força de Vontade. É o que o livro pede ao dizer
   "resolva conflitos sociais com as mesmas mecânicas".
   ------------------------------------------------------------ */
function duelarSocialmente(id) {
  const corte = id.lastIndexOf(':');
  const ref = id.slice(0, corte);
  const rota = id.slice(corte + 1);
  const o = oponentePorRef(ref);
  if (!o) return;
  const r = CombateSocial.resolver({ atacante: M.ficha, defensor: o.ficha, rota,
    testemunhas: M.combate.testemunhas || '',
    estadosAtacante: estadosAtuais(), estadosDefensor: o.estados });
  if (r.possivel === false) { anunciar(r.eventos); salvarMesa(); renderMesa(); return; }
  M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: r.meu, ts: Date.now() });
  M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: r.seu, ts: Date.now() });
  anunciar(r.eventos);
  salvarMesa(); renderMesa();
}

function concederSocialmente() {
  anunciar(CombateSocial.conceder({ quem: 'Você' }).eventos);
  salvarMesa(); renderMesa();
}

function definirTestemunhas(texto) {
  M.combate.testemunhas = String(texto || '').trim();
  const aud = CombateSocial.extraDaAudiencia(M.combate.testemunhas);
  anunciar([{ tipo: 'nota', texto:
    `Plateia: ${aud.testemunhas} — ${aud.extra ? `+${aud.extra}` : 'nenhum'} de dano extra à `
    + `Força de Vontade. Só conta quem está interessado no resultado (pág. 305).` }]);
  salvarMesa(); renderMesa();
}

/* ------------------------------------------------------------
   ESTADOS DE CONDENAÇÃO — o Laço e a Diablerie  (§90)
   ------------------------------------------------------------ */
function beberDoReinante(daVeia) {
  const nome = (M.laco && M.laco.reinante) || '';
  if (!nome) { toast('Diga primeiro de quem você bebeu.'); return; }
  const r = Lacos.beber(M.laco, { daVeia, bebedor: M.ficha });
  M.laco = r.laco;
  anunciar(r.eventos);
  salvarMesa(); renderMesa();
}

function definirReinante(nome) {
  M.laco = Lacos.normalizar(Object.assign({}, M.laco, { reinante: String(nome || '').trim() }));
  salvarMesa(); renderMesa();
}

function resistirAoLaco(naPresenca) {
  const r = Lacos.resistir(M.ficha, M.laco, { naPresenca, estados: estadosAtuais() });
  if (r.meu) {
    M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: r.meu, ts: Date.now() });
    M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: r.dele, ts: Date.now() });
  }
  anunciar(r.eventos);
  salvarMesa(); renderMesa();
}

function tentarPartirOLaco() {
  const r = Lacos.tentarPartir(M.ficha, M.laco, { estados: estadosAtuais() });
  M.laco = r.laco;
  if (r.meu) {
    M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: r.meu, ts: Date.now() });
    M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: r.dele, ts: Date.now() });
  }
  anunciar(r.eventos);
  /* Vencer o desafio da sessão é o mês passado longe dele. */
  if (r.venceu) {
    const p = Lacos.passarTempo(M.laco, Lacos.DIAS_POR_QUEDA);
    M.laco = p.laco;
    anunciar(p.eventos);
  }
  salvarMesa(); renderMesa();
}

function passarMesesDoLaco(meses) {
  const r = Lacos.passarTempo(M.laco, Math.max(1, meses | 0) * Lacos.DIAS_POR_QUEDA);
  M.laco = r.laco;
  anunciar(r.eventos);
  salvarMesa(); renderMesa();
}

/* A DIABLERIE, EM DOIS PASSOS E COM UM PONTO DE NÃO-RETORNO.

   O primeiro passo é uma sequência: uma rolagem por turno, tantas
   quanto a Potência de Sangue da vítima, e UMA falha perde tudo. Por
   isso ela vive em `M.diablerie` e não numa chamada só — o jogador
   tem de poder olhar para o que já rolou antes de rolar de novo. */
function comecarDiablerie({ potencia, geracao, determinacao, disciplinas }) {
  M.diablerie = {
    potenciaDaVitima: Math.max(1, Number(potencia) || 1),
    geracaoDaVitima: Number(geracao) || null,
    determinacaoDaVitima: Math.max(0, Number(determinacao) || 0),
    disciplinasDaVitima: String(disciplinas || '').split(',').map(x => x.trim()).filter(Boolean),
    rolagens: [], concluida: false, frustrada: false
  };
  anunciar([{ tipo: 'perigo', texto:
    `Diablerie começada. São ${M.diablerie.potenciaDaVitima} rolagem(ns) de Força + Determinação `
    + `contra Dificuldade ${Lacos.DIABLERIE.dificuldade}, uma por turno — e uma falha apaga a `
    + `centelha sem consumi-la (pág. 235).` }]);
  salvarMesa(); renderMesa();
}

function rolarDiablerie() {
  const d = M.diablerie;
  if (!d || d.concluida || d.frustrada) return;
  const pedido = Lacos.pedidoDaCentelha(M.ficha);
  const r = Dados.apurar(pedido, Dados.rodar(pedido));
  d.rolagens.push({ passou: r.passou, sucessos: r.sucessos, tipo: r.tipo });
  M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: r, ts: Date.now() });

  const passo = Lacos.tomarACentelha(d.potenciaDaVitima, d.rolagens);
  anunciar(passo.eventos);
  if (passo.completou) d.concluida = true;
  else if (!passo.emCurso) d.frustrada = true;
  salvarMesa(); renderMesa();
}

function consumarDiablerie() {
  const d = M.diablerie;
  if (!d || !d.concluida) return;
  const meuPedido = Lacos.pedidoDoControle(M.ficha);
  const meu = Dados.apurar(meuPedido, Dados.rodar(meuPedido));
  const delaPedido = Lacos.pedidoDaVitima({ determinacao: d.determinacaoDaVitima,
                                            potenciaSangue: d.potenciaDaVitima });
  const dela = Dados.apurar(delaPedido, Dados.rodar(delaPedido));
  M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: meu, ts: Date.now() });
  M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: dela, ts: Date.now() });

  const r = Lacos.efeitos(M.ficha, { meu, dela,
    potenciaDaVitima: d.potenciaDaVitima, geracaoDaVitima: d.geracaoDaVitima,
    disciplinasDaVitima: d.disciplinasDaVitima });
  anunciar(r.eventos);
  M.diablerie = null;
  salvarMesa(); renderMesa();
}

function abandonarDiablerie() {
  M.diablerie = null;
  anunciar([{ tipo: 'nota', texto: 'Você recua. O corpo se decompõe na Morte Final do mesmo jeito.' }]);
  salvarMesa(); renderMesa();
}

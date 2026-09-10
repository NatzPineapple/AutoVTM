/* ============================================================
   VITÆ — A Mesa
   Interface de jogo: fluxo de conversa com o Narrador + doca de
   contexto (ficha, locais, pessoas, história, registro).

   Esta camada só fala com o Narrador pelo contrato de narrador.js.
   Trocar o adaptador simulado por um de IA não exige mudar nada aqui.
   ============================================================ */

/* A MESA É QUEM ROLA.  (§82)

   O Árbitro diz quais dados; quem os produz é esta camada. Sem esta
   linha, `Dados.d10()` estoura — de propósito: o Árbitro deixou de
   ter um `Math.random` de reserva, e o dia em que ninguém instalar a
   fonte a falha aparece na hora, e não como um número inventado.

   `mesa.js` carrega antes de qualquer rolagem acontecer, e o
   `diagnostico.html` carrega este arquivo pela mesma razão.

   Quando o Módulo 3 assumir a sessão (pendência M2), esta fonte passa
   a ser o `POST /api/mesa/sessoes/:id/rolagem`, que rola no servidor e
   grava no histórico. A troca é de uma linha, e é o motivo de a fonte
   ser instalável em vez de escrita dentro do Árbitro. */
Dados.usarFonte(() => 1 + Math.floor(Math.random() * 10));

const MESA_VAZIA = () => ({
  criadaEm: Date.now(),
  ficha: null,
  cena: { local: '', hora: '', descricao: '' },
  mensagens: [],
  locais: [],
  pessoas: [],
  fatos: [],
  fios: [],
  registro: [],
  registroMestre: [],
  cronicas: [],
  recombinados: [],
  combate: { ativo: false, motivo: '', oponentes: [], arma: 'Desarmado', profissao: '',
             rodada: null, proximoId: 1,
             /* §90 — as opções do Conflito Avançado (págs. 298–303).
                `ferimentos` é de MESA e fica ligado até alguém desligar;
                as outras três valem por UM ataque, como o pedido de fade
                da §89, e o motor as apaga depois de usar. */
             opcoes: { ataqueTotal: false, defesaTotal: false, surpresa: false,
                       ferimentos: false, localizado: '' },
             /* ref do oponente → true, enquanto ele estiver agarrado. */
             agarrados: {} },
  bolsa: [],
  rolagens: {},
  estados: [],
  contador: { local: 0, llm: 0 },
  campanha: null,
  diretor: null,
  opcaoAberta: null,
  aba: 'ficha',
  modo: 'agir',
  /* §57 — lidos do texto a cada tecla; só o "Manual" é escolha do
     jogador, e ele vale por uma mensagem. */
  volumeManual: null,
  alvoManual: null,
  volume: 'normal',
  alvoFala: 'geral',
  rascunho: '',
  itemAberto: '',
  docaAberta: false,
  /* §85 — a sessão do Módulo 3, quando o checkout deu certo, e a
     prévia do checkin enquanto ela está na tela. */
  sessaoServidor: '', origemDaFicha: '', checkinPrevia: null,

  /* §89 — o Apêndice III. A lista é do JOGADOR e vive na crônica,
     porque é isso que o livro manda (pág. 421): montada antes do
     jogo e editável a qualquer momento. */
  limites: Limites.vazio(),
  /* O pedido de fade vale por UM turno, como a correção de volume
     da §57: o jogador pede o corte, o próximo turno corta, e o
     pedido some. Deixá-lo grudado cortaria a cena seguinte também. */
  pedidoDeFade: false,

  /* §89 — o Apêndice II. O que corre ENTRE as noites. */
  projetos: [],

  /* §91 — o que está selecionado na aba de Experiência. */
  compraXP: { classe: 'atributo', id: '', para: 0 },

  /* §90 — os Estados de Condenação (págs. 233–235). O Laço que PESA
     sobre este personagem: ele é o escravo, e `reinante` é quem o
     enlaçou. Enlaçar os outros é assunto de PN, e não tem ficha aqui. */
  laco: Lacos.novo({}),
  /* A Diablerie em curso, quando há uma: uma sequência de testes que
     uma falha perde. */
  diablerie: null
});

let M = MESA_VAZIA();
let mesaOcupada = false;
let sessaoParaApagar = '';

/* ------------------------------------------------------------
   PERSISTÊNCIA
   ------------------------------------------------------------ */


/* ------------------------------------------------------------
   ABERTURA
   ------------------------------------------------------------ */
/* O PREDADOR NÃO É OBRIGATÓRIO PARA TODO MUNDO.  (§91, pág. 149)

   "Os sugadores de sangue mais recentes, como os sangues-ralos e
    diversas Crianças da Noite, NÃO SELECIONAM um tipo de Predador,
    pois ainda estão descobrindo esse aspecto da sua existência
    noturna."

   A mesa exigia Predador de todos, e com isso um sangue-ralo — que o
   livro diz não escolher — não conseguia abrir mesa. */
function fichaJogavel(f) {
  if (!(f && f.nome && f.cla)) return false;
  if (f.predador) return true;
  const c = claDe(f.cla);
  return !!(c && (c.sangueFraco || f.idadeDaCoterie === 'crianca'));
}

function iniciarMesa(ficha) {
  const f = JSON.parse(JSON.stringify(ficha));
  const semente = sementeDaCidade(f.cidade);

  M = MESA_VAZIA();
  M.ficha = f;
  M.cena = semente.cena;
  M.locais = semente.locais;
  M.pessoas = semente.pessoas;
  M.fatos = semente.fatos;
  M.fios = semente.fios;

  const heranca = Legado.de(f);
  if (!Legado.vazioDe(heranca)) {
    Legado.pessoasParaSemente(f).forEach(p => mesclar(M.pessoas, p, 'pes_'));
    Legado.fiosParaSemente(f).forEach(x => mesclar(M.fios, x, 'fio_'));
    M.legado = { cronicas: heranca.cronicas.length, resumo: Legado.resumoCurto(f) };
  }

  const cid = CIDADES.find(c => c.id === f.cidade);
  M.mensagens = [
    { id: msgId(), autor: 'cena', titulo: cid ? cid.nome : 'A cidade',
      sub: M.cena.hora, ts: Date.now() },
    { id: msgId(), autor: 'narrador', texto: semente.abertura, ts: Date.now(), simulado: true }
  ];
  if (M.legado) {
    M.mensagens.push({ id: msgId(), autor: 'sistema',
      texto: `Você não chega aqui inteiro: ${M.legado.resumo}.`, ts: Date.now() });
    registrar(`Legado carregado — ${M.legado.resumo}`);
  }
  registrar(`Mesa aberta — ${f.nome}, ${clan(f.cla)?.nome || '—'}`);

  if (typeof NarradorSimulado !== 'undefined') NarradorSimulado.reiniciar();
  salvarMesa();
  /* O CHECKOUT.  (§85, item M2)

     Fora do caminho síncrono de propósito: `iniciarMesa` é chamada de
     três lugares e nenhum deles espera. O checkout acontece logo
     depois, e quando volta a Ponte passa a espelhar e o canal abre.

     Com o Módulo 3 fora, nada disto acontece e a mesa roda local — que
     é como ela rodou até a §85. */
  abrirSessaoNoServidor();
}

async function abrirSessaoNoServidor() {
  if (!M.ficha) return;
  const r = await Ponte.abrirSessao(M.ficha, M.campanha);
  if (!r.ok) return;
  M.sessaoServidor = r.id;
  M.origemDaFicha = r.origemDaFicha;
  registrar(`Sessão aberta no servidor — ficha de ${r.origemDaFicha}`);
  /* O canal só AVISA (§78.3), e tudo o que ele avisaria já passou pelas
     rotas HTTP deste mesmo cliente. Então ele NÃO muda estado — se
     mudasse, seriam duas fontes para o mesmo fato. Ele existe para o
     dia em que outra coisa mexer na sessão (o autosave do módulo, outra
     aba, o Cronista tomando iniciativa), e por ora só deixa rastro. */
  Ponte.ouvir((evento) => console.info('[mesa] canal:', evento.tipo));
  salvarMesa();
}

let _seq = 0;
const msgId = () => `m${Date.now().toString(36)}${(_seq++).toString(36)}`;

function registrar(texto) {
  M.registro.push({ ts: Date.now(), texto });
}

/* ------------------------------------------------------------
   TEXTO: markdown mínimo + referências [[tipo:id]]
   ------------------------------------------------------------ */

/* ------------------------------------------------------------
   TURNO
   ------------------------------------------------------------ */
async function enviarTurno(texto) {
  if (mesaOcupada) return;
  const limpo = (texto || '').trim();
  if (!limpo) return;

  /* §57 — A LEITURA VEM DO TEXTO, NÃO DE UM BOTÃO.
     `M.modo` continua existindo e continua viajando até o Narrador e
     o Cronista; ele deixou de ser escolha do jogador e passou a ser o
     que o segmentador leu. `M.volumeManual` e `M.alvoManual` são a
     correção à mão desta mensagem, e valem mais que a leitura.

     Quem pode ser alvo é a união de "está na cena" com "você tem
     contato" — porque o volume só se sabe DEPOIS de ler o texto, e
     mensagem alcança quem não está presente. Se o alvo lido não puder
     ouvir, quem barra é `alvoDeFala` com o Árbitro, como sempre foi. */
  const alvosPossiveis = pessoasNaCena()
    .concat(pessoasComContato().filter(p => !(M.cena.presentes || []).includes(p.id)));
  const seg = Entrada.segmentar(limpo, { pessoas: alvosPossiveis });
  const volume = M.volumeManual || seg.volume;
  const alvoFala = M.alvoManual || seg.alvo;

  M.modo = seg.modo;
  M.volume = volume;
  M.alvoFala = alvoFala;

  const ehFala = !!seg.fala;
  const alvo = ehFala ? alvoDeFala(alvoFala) : null;

  /* Só a AÇÃO vai para o léxico. Antes o texto inteiro ia, e a fala
     envenenava a leitura: "atiro" dentro de aspas é ameaça, não um
     disparo, e o Árbitro pedia teste de Armas de Fogo por causa dela. */
  const leitura = Arbitro.interpretar(Entrada.textoParaArbitrar(seg), seg.modo);

  const msgJogador = {
    id: msgId(), autor: 'jogador', modo: seg.modo, texto: limpo, ts: Date.now(),
    segmentos: seg.segmentos,
    termos: seg.acao ? leitura.termos || [] : [],
    acaoNome: leitura.acao ? leitura.acao.nome : '',
    volume: ehFala ? volume : null,
    alvoFala: ehFala ? alvoFala : null
  };
  M.mensagens.push(msgJogador);
  M.rascunho = '';
  /* A correção à mão vale por UMA mensagem. Deixá-la grudada fazia o
     sussurro do turno anterior virar o volume padrão do próximo. */
  M.volumeManual = null;
  M.alvoManual = null;
  mesaOcupada = true;
  renderFluxo();
  atualizarCompositor();

  const estados = estadosAtuais();
  const veredito = M.modo === 'perguntar'
    ? { possivel: true, bloqueios: [], avisos: [] }
    : await arbitrarTurno({ texto: Entrada.textoParaArbitrar(seg), estados,
                            fala: ehFala ? { volume: M.volume, alvo } : null });

  if (!combateAtivo() && veredito.possivel !== false &&
      INTENCOES_DE_COMBATE.includes(leitura.intencao)) {
    abrirCombate({ motivo: leitura.acao ? leitura.acao.nome.toLowerCase() : 'você partiu para cima' });
  }

  /* §57 — segundo leitor. Se o jogador escreveu a fala sem aspas, a
     pontuação não tinha como pegar, e o extrator pegou. A mensagem já
     está na tela: o que muda aqui é o desenho dela, no render do fim. */
  const refinado = Entrada.comModelo(seg, veredito.leitura && veredito.leitura.bruta,
                                     alvosPossiveis);
  if (refinado.leuComModelo) {
    msgJogador.segmentos = refinado.segmentos;
    msgJogador.modo = refinado.modo;
    msgJogador.volume = refinado.volume;
    msgJogador.alvoFala = refinado.alvo;
    M.modo = refinado.modo;
  }

  const turno = turnoDaMesa({ texto: limpo, leitura, veredito, estados, seg: refinado });
  const passo = await escadaDaMesa().descer(turno);

  /* §93 — qual dos cinco degraus respondeu. */
  if (typeof Trafego !== 'undefined') Trafego.degrauQueRespondeu(passo);

  aplicarPasso(passo, turno);

  /* O fade vale por um turno só (§89). O corte já foi pedido; deixá-lo
     ligado cortaria também a cena que vem depois do corte. */
  M.pedidoDeFade = false;

  mesaOcupada = false;
  salvarMesa();
  renderFluxo(); renderTopo(); renderDoca(); renderCombate(); atualizarCompositor();
}

/* ------------------------------------------------------------
   A CADEIA NO TURNO — itens A1 e A2 da §45.2

   Até a §48 a mesa chamava `Arbitro.avaliar()`, e a cadeia de
   quatro elos — grafo, navegação, especialista — existia sem
   nunca rodar em jogo. Agora o turno passa por ela.

   Três coisas seguram esta troca, e as três importam:

   1. O ELO 1 SE ADAPTA. Se o extrator de intenção estiver de pé,
      o interpretador é o de modelo; se não, é o léxico. A
      verificação é feita uma vez por sessão, e o léxico continua
      sendo o caminho completo — o jogo nunca depende do modelo.

   2. O FORMATO NÃO MUDA. `comoVeredito()` devolve o que a mesa já
      sabia desenhar. Nenhum render mudou por causa desta troca.

   3. HÁ REDE. Se a cadeia estourar por qualquer motivo, o turno
      cai no `Arbitro.avaliar()` de sempre e o jogador não fica
      sabendo. Um defeito na cadeia não pode virar turno perdido.
   ------------------------------------------------------------ */

let _interpretadorDaMesa = null;

async function interpretadorDaMesa() {
  if (_interpretadorDaMesa) return _interpretadorDaMesa;
  if (typeof Intencao === 'undefined') return (_interpretadorDaMesa = 'lexico');
  const e = Intencao.estado.verificado ? Intencao.estado : await Intencao.verificar();
  return (_interpretadorDaMesa = e.disponivel ? 'llm' : 'lexico');
}

async function arbitrarTurno({ texto, estados, fala }) {
  const alvo = fala ? fala.alvo : null;
  const entrada = { ficha: M.ficha, estados, texto, modo: M.modo, mesa: M, alvo, fala };

  /* §93 — a pergunta e as duas voltas possíveis. A forma de cada linha
     está no `trafego.js`, junto do resto do registro. */
  const anota = (typeof Trafego !== 'undefined');
  const t0 = Date.now();
  if (anota) Trafego.perguntaAoArbitro({ texto, modo: M.modo, estados, fala,
    personagem: M.ficha && M.ficha.nome });

  try {
    const qual = await interpretadorDaMesa();
    const saida = qual === 'llm'
      ? await Cadeia.arbitrarComModelo(Object.assign({ interpretador: 'llm' }, entrada))
      : Cadeia.arbitrar(entrada);
    M.ultimaCadeia = saida.elos;
    const veredito = Cadeia.comoVeredito(saida);
    if (anota) Trafego.vereditoDoArbitro(veredito,
      { qual, ms: Date.now() - t0, elos: M.ultimaCadeia });
    return veredito;
  } catch (e) {
    console.warn('Cadeia falhou; caindo no Árbitro direto:', e && e.message);
    M.ultimaCadeia = { erro: (e && e.message) || 'falhou', interpretador: 'nenhum' };
    const veredito = Arbitro.avaliar({ ficha: M.ficha, estados, texto, fala });
    if (anota) Trafego.vereditoDoArbitro(veredito, { qual: 'cadeia falhou',
      ms: Date.now() - t0, elos: M.ultimaCadeia, erro: (e && e.message) || 'falhou' });
    return veredito;
  }
}

function turnoDaMesa({ texto, leitura, veredito, estados, seg, resultado = '' }) {
  return {
    texto, leitura, veredito, estados,
    /* O texto INTEIRO vai para o Narrador — ele precisa da fala. Os
       segmentos vão junto para ele não ter de adivinhar de novo o que
       era ação e o que era fala (§57). */
    segmentos: seg ? seg.segmentos : [],
    modo: M.modo, ficha: M.ficha, cena: M.cena,
    locais: M.locais, pessoas: M.pessoas, fatos: M.fatos, fios: M.fios,
    campanha: M.campanha, estadoDiretor: M.diretor,
    usados: M.recombinados || [],
    paraNarrador() {
      return {
        campanha: { cena: M.cena, locais: M.locais, pessoas: M.pessoas,
                    fatos: M.fatos, fios: M.fios },
        ficha: M.ficha, estados, texto, modo: M.modo,
        segmentos: seg ? seg.segmentos : [],
        historico: M.mensagens.slice(-20),
        arquivoCampanha: M.campanha && M.campanha.arquivo ? M.campanha.arquivo.split('/').pop() : null,
        indiceCapitulo: (M.diretor && M.diretor.capitulo) || 0,
        arbitro: veredito.avisos && veredito.avisos.length ? veredito.avisos.join(' ') : '',

        /* §100 — O CAMPO QUE NINGUÉM PREENCHIA.

           O prefixo do Narrador manda, e mandava desde sempre: "você
           NÃO decide se uma ação deu certo. Se o resultado do teste
           vier no pedido, narre esse resultado. Se não vier, narre até
           onde a ação chega e PARE."

           `resultado` sempre chegava vazio, então o Narrador parava —
           todo turno, obedecendo. O jogador rolava o teste pedido e a
           ação nunca concluía, e não havia como culpar o modelo: ele
           fazia o que o contrato dizia.

           É a quinta vez que este projeto acha o mesmo padrão: o dado
           existe, o leitor existe, e nada no meio chama. §67, §90 (duas
           vezes), §91 — e agora aqui. */
        resultado: resultado || '',
        gancho: ganchoDaCena(),
        /* §89 — o que o jogador declarou que não quer ver, e o que ele
           está tramando há meses. Os dois viajam com o TURNO e não com
           o prefixo dos `.md`, porque nenhum dos dois é meu: são dele. */
        limites: M.limites,
        projetos: M.projetos,
        fade: !!M.pedidoDeFade
      };
    }
  };
}

/* O NARRADOR, OBSERVADO.  (§93)

   Quem envelopa é o `Trafego`; a Mesa só escolhe QUEM vai dentro do
   envelope e como montar o corpo — as duas coisas que ela sabe e ele
   não. O porquê do envelope está lá, em `Trafego.envelopar`. */
function narradorObservado() {
  if (typeof Trafego === 'undefined') return Narrador;
  const daProxy = (typeof NarradorProxy !== 'undefined'
                   && Narrador.nome === NarradorProxy.nome
                   && typeof NarradorProxy.montar === 'function');
  return Trafego.envelopar(Narrador, daProxy ? (t) => NarradorProxy.montar(t) : null);
}

let _escada = null;
function escadaDaMesa() {
  if (!_escada) {
    _escada = new Escada([
      new DegrauArbitro(),
      new DegrauCampanha(Diretor),
      new DegrauRecombinacao(Recombinador),
      new DegrauNarrador(narradorObservado())
    ]);
  }
  return _escada;
}

function aplicarPasso(passo, turno) {
  if (!passo) return;
  const { degrau, resposta } = passo;

  if (degrau.custa) M.contador.llm++; else M.contador.local++;

  const campanha = escadaDaMesa().degraus.find(d => d instanceof DegrauCampanha);
  if (campanha && degrau !== campanha) aplicarEventosDiretor(campanha.eventosResiduais());

  if (resposta.tipo === 'arbitro') {
    M.mensagens.push({ id: msgId(), autor: 'arbitro', veredito: resposta.veredito, ts: Date.now() });
    registrar(resposta.registro);
    return;
  }
  if (resposta.tipo === 'diretor') {
    aplicarEventosDiretor(resposta.eventos);
    return;
  }
  if (resposta.tipo === 'narracao') {
    M.recombinados = (M.recombinados || []).concat(resposta.marcas || []).slice(-40);
    M.mensagens.push({ id: msgId(), autor: 'narrador', texto: resposta.texto,
      degrau: resposta.degrau, ts: Date.now() });
    return;
  }
  aplicarResposta(resposta);
}


/** Aplica ao estado da mesa tudo que o Narrador devolveu. */
function aplicarResposta(r) {
  if (!r) return;

  (r.locais || []).forEach(l => mesclar(M.locais, l, 'loc_'));
  (r.pessoas || []).forEach(p => mesclar(M.pessoas, p, 'pes_'));

  if (r.cena) {
    const cena = Object.assign({}, r.cena);
    if (cena.local) {
      const alvo = idSeguro(cena.local, 'loc_');
      if (M.locais.some(l => l.id === alvo)) cena.local = alvo; else delete cena.local;
    }
    if (cena.presentes) {
      cena.presentes = cena.presentes
        .map(id => idSeguro(id, 'pes_'))
        .filter(id => M.pessoas.some(p => p.id === id));
    }
    M.cena = Object.assign({}, M.cena, cena);
    const loc = M.locais.find(l => l.id === M.cena.local);
    M.mensagens.push({ id: msgId(), autor: 'cena',
      titulo: loc?.nome || M.cena.local, sub: M.cena.hora, ts: Date.now() });
  }

  (r.fatos || []).forEach(f => {
    const novo = Object.assign({}, f, { id: 'f' + msgId() });
    M.fatos.push(novo);
    M.mensagens.push({ id: msgId(), autor: 'sistema',
      texto: `Anotado: ${novo.titulo}`, ts: Date.now() });
    registrar(`Fato revelado — ${novo.titulo}`);
  });

  (r.fios || []).forEach(fio => mesclar(M.fios, fio, 'fio_'));

  (r.efeitos || []).forEach(ef => {
    const antes = M.ficha[ef.campo] || 0;
    const depois = ef.valor !== undefined ? ef.valor : antes + (ef.delta || 0);
    M.ficha[ef.campo] = Math.max(0, depois);
    const rot = { fome: 'Fome', humanidadeMod: 'Humanidade',
                  danoSuperficial: 'Dano superficial', danoAgravado: 'Dano agravado' }[ef.campo] || ef.campo;
    M.mensagens.push({ id: msgId(), autor: 'sistema',
      texto: `${rot}: ${antes} → ${M.ficha[ef.campo]}${ef.motivo ? ' · ' + ef.motivo : ''}`, ts: Date.now() });
    registrar(`${rot} ${antes} → ${M.ficha[ef.campo]}`);
  });

  if (r.rolagemOculta) rolarDoMestre(r.rolagemOculta);

  if (r.texto) {
    M.mensagens.push({ id: msgId(), autor: 'narrador', texto: r.texto,
      rolagem: r.rolagem, simulado: r.simulado, erro: r.erro,
      modelo: r.modelo, validado: r.validado, avisoValidador: r.avisoValidador,
      ts: Date.now() });
  }
}

const ID_ACEITO = /^[a-z0-9_]{1,40}$/;

function idSeguro(bruto, prefixo) {
  const limpo = String(bruto || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
  return ID_ACEITO.test(limpo) ? limpo : `${prefixo}${Date.now().toString(36)}`;
}

function mesclar(lista, item, prefixo) {
  const limpo = Object.assign({}, item, { id: idSeguro(item.id, prefixo || 'e') });
  const ex = lista.find(x => x.id === limpo.id);
  if (ex) Object.assign(ex, limpo);
  else lista.push(limpo);
}

/* A ROLAGEM DO TURNO PASSA PELA MESA.  (§85, item M2)

   A §82 partiu a rolagem em três: o Árbitro diz QUAIS dados, a Mesa
   roda, o Árbitro apura. Até aqui os três passos aconteciam no
   navegador, porque não havia a quem pedir.

   Agora há. `Dados.pedir` e `Dados.apurar` continuam locais — são puros,
   e mandá-los pela rede seria dois saltos para não ganhar nada. O que
   vai ao servidor é o passo do MEIO, que é o único que produz alguma
   coisa: os valores. E o Módulo 3 os grava no `historico.jsonl`, que é
   o que torna a noite repetível.

   Sem sessão no servidor, roda local — como rodou até agora. */
/* A CADEIA INTEIRA, QUANDO OS MÓDULOS ESTÃO DE PÉ.  (§87, item M8)

   O Árbitro diz quais dados (5176) · a Mesa roda e grava (5175) · o
   Árbitro apura e confere a quantidade (5176). O navegador desenha.

   E em cada uma das duas pontas ele CONFERE contra a resposta local.
   As duas cópias são o mesmo código — a §84 carrega os mesmos arquivos
   num `vm` —, então elas devem concordar sempre. Quando não concordam,
   não é regra diferente: é `.js` velho no cache do navegador (a §36),
   ou um módulo subido antes de uma correção. Nada notava isso antes.

   `situacao` é o que o servidor precisa para montar o pedido sozinho.
   Sem ela — ou com o Módulo 4 fora — vale o pedido local. */
async function rolarPelaMesa(opcoes, situacao = null) {
  const local = Dados.pedir(opcoes);

  let pedido = local;
  if (situacao) {
    const doArbitro = await Ponte.pedidoDoArbitro(situacao);
    if (doArbitro && doArbitro.pedido) {
      Ponte.conferir('pedido', local, doArbitro.pedido,
        ['normais', 'fome', 'dificuldade', 'piscina']);
      /* O RÓTULO FICA O LOCAL, e só ele.

         O do servidor é `Destreza + Ladroagem`; o daqui pode trazer
         `(+2 de Dificuldade)`, que é a cobrança da ROTA (§63, A4) e não
         da piscina — o Módulo 4 não recebe a rota inteira, então não
         tem como saber. Adotar o pedido inteiro apagaria da tela a
         razão de a dificuldade ter subido.

         Por isso `rotulo` também não entra na conferência: ele difere
         de propósito, e comparar o que difere de propósito é como
         escrever um teste que falha sempre. */
      pedido = Object.assign({}, doArbitro.pedido, { rotulo: local.rotulo });
    }
  }

  const daMesa = await Ponte.rolar(pedido);
  const valores = (daMesa && daMesa.valores) ? daMesa.valores : Dados.rodar(pedido);

  const aqui = Dados.apurar(pedido, valores);
  const doArbitro = await Ponte.apurarNoArbitro(pedido, valores);
  if (doArbitro && doArbitro.veredito) {
    Ponte.conferir('veredito', aqui, doArbitro.veredito, ['tipo', 'sucessos', 'passou']);
  }

  /* De onde veio cada metade, para o registro e para o teste. O veredito
     mostrado é o LOCAL mesmo quando o servidor respondeu: eles são
     iguais — e quando não são, a divergência já foi registrada e trocar
     de fonte no meio esconderia o problema em vez de mostrá-lo. */
  aqui.ondeRolou = (daMesa && daMesa.valores) ? 'mesa' : 'local';
  aqui.ondePensou = (pedido !== local || doArbitro) ? 'arbitro' : 'local';

  /* §93 — os três passos da §82 numa linha só. */
  if (typeof Trafego !== 'undefined') Trafego.rolagem(aqui, { pedido, valores, doArbitro });
  return aqui;
}

async function rolarDoJogador(idMensagem, indiceRota) {
  if (M.rolagens[idMensagem]) return;
  const msg = M.mensagens.find(x => x.id === idMensagem);
  const pedido = msg && msg.rolagem;
  if (!pedido) return;

  const rota = rotasDoPedido(pedido)[indiceRota];
  if (!rota) return;

  const p = piscinaDaRota(rota, pedido);
  /* §63 (A4): a rota pode cobrar Dificuldade a mais. Hoje só o caminho
     eletrônico do arrombamento cobra, e o livro é quem cobra (pág. 410). */
  const extra = rota.dificuldadeExtra || 0;
  /* A MESMA situação que `piscinaDaRota` usou aqui, agora também no
     formato que o Módulo 4 entende. Ela é montada UMA vez e serve às
     duas pontas — se as duas fossem montadas separadamente, elas
     divergiriam e a conferência acusaria a si mesma. (§87) */
  const acao = Arbitro.ACOES[(pedido && pedido.intencao) || ''];
  const resultado = await rolarPelaMesa({
    piscina: p.total,
    fome: M.ficha.fome || 0,
    dificuldade: (pedido.dificuldade || 0) + extra,
    rotulo: p.rotulo + (extra ? ` (+${extra} de Dificuldade)` : '')
  }, {
    ficha: M.ficha, rota,
    estados: estadosAtuais(),
    dominio: acao ? acao.dominio : null,
    intencao: (pedido && pedido.intencao) || null,
    disciplina: acao && acao.disciplina ? acao.disciplina.id : null,
    dificuldade: (pedido.dificuldade || 0) + extra
  });
  resultado.composicao = { base: p.base, especializacao: p.especializacao,
    modificadores: p.modificadores, penalidadeEstado: p.penalidadeEstado };

  M.rolagens[idMensagem] = { rota: indiceRota, resultado };
  const idRolagem = msgId();
  M.mensagens.push({ id: idRolagem, autor: 'rolagem', resultado, animar: true, ts: Date.now() });
  registrar(`${resultado.rotulo} — ${Dados.descrever(resultado)}`);

  const conseq = Arbitro.consequencias(resultado);
  if (conseq) {
    M.mensagens.push({ id: msgId(), autor: 'sistema',
      texto: `${conseq.titulo}: ${conseq.escolhas.join(' · ')}`, ts: Date.now() });
  }
  if (M.campanha && M.diretor && M.opcaoAberta) {
    const rv = Diretor.resolverTeste(M.campanha, M.diretor,
      { opcao: M.opcaoAberta, resultado, ficha: M.ficha });
    M.opcaoAberta = null;
    aplicarEventosDiretor(rv.eventos);
  }
  salvarMesa();
  renderFluxo(false);

  const cartao = document.querySelector(`[data-rolagem="${idRolagem}"]`);
  if (cartao) {
    await DadosUI.animar(cartao, resultado);
    rolarFluxo(true);
  }
  const guardado = M.mensagens.find(x => x.id === idRolagem);
  if (guardado) guardado.animar = false;
  salvarMesa();
  renderDoca();

  /* §100 — e agora a metade que faltava: contar como foi. */
  await narrarDesfecho(pedido, resultado);
}

/* ------------------------------------------------------------
   O TURNO DE DESFECHO  (§100)

   O jogador pede uma ação, o Narrador pede um teste, o jogador rola —
   e acabava aí. Faltava a metade que fecha: **contar como foi**.

   Não é um turno do jogador; é a segunda metade do turno dele. Por isso
   o texto não vem da caixa: vem do que foi tentado e do que os dados
   disseram. E por isso ele desce a MESMA escada — um desfecho é
   narração como qualquer outra, e os degraus de cima podem respondê-lo
   de graça.

   Mora fora do ouvinte de clique, e com nome, porque é regra: a lição
   da §91 e da §92 é que o que fica escondido num `case` não tem como
   ser testado sem simular clique.
   ------------------------------------------------------------ */

/* A frase que o Narrador lê como "o que foi tentado". O pedido do
   Narrador (`descricao`) é melhor do que o rótulo da parada, porque foi
   ele que escreveu o que estava em jogo — "ouvir se Bia está falando
   com alguém" diz mais do que "Inteligência + Investigação". */
function textoDoDesfecho(pedido, resultado) {
  const oQue = (pedido && (pedido.descricao || pedido.texto || pedido.rotulo))
    || (resultado && resultado.rotulo) || 'a ação';
  return String(oQue).trim();
}

/* O resultado em UMA linha, do jeito que o prefixo do Narrador espera
   lê-lo: já apurado, sem deixar nada para ele decidir.

   QUEM FRASEIA UMA ROLAGEM É `Dados.descrever`, e só ela. A primeira
   versão desta função somava "dificuldade N" e "N sucesso(s)" por cima
   — e `descrever` já devolve "Sucesso — 3 sucessos contra dificuldade
   2.". A linha saía com a mesma informação três vezes.

   Quem mostrou foi a mutação: apagar o "dificuldade" daqui não derrubou
   teste nenhum, porque a palavra continuava vindo de `descrever`. Teste
   que passa com e sem a linha estava afirmando o texto errado. */
function resultadoParaNarrador(resultado) {
  if (!resultado) return '';
  return `${resultado.rotulo}: ${Dados.descrever(resultado)}`;
}

async function narrarDesfecho(pedido, resultado) {
  /* Combate tem narração própria (`golpe`), e chamar o Narrador aqui
     dobraria a descrição do mesmo golpe. */
  if (combateAtivo()) return null;
  if (mesaOcupada || !resultado) return null;

  mesaOcupada = true;
  renderFluxo();
  try {
    const texto = textoDoDesfecho(pedido, resultado);
    const turno = turnoDaMesa({
      texto,
      leitura: { acao: null },
      /* O Árbitro já falou neste turno: o veredito dele virou a parada
         que acabou de ser rolada. Repetir os avisos faria o Narrador
         reclamar duas vezes da mesma coisa. */
      veredito: { possivel: true, avisos: [] },
      estados: estadosAtuais(),
      seg: { segmentos: [] },
      resultado: resultadoParaNarrador(resultado)
    });

    const passo = await escadaDaMesa().descer(turno);
    if (typeof Trafego !== 'undefined') Trafego.degrauQueRespondeu(passo);
    aplicarPasso(passo, turno);
    return passo;
  } finally {
    mesaOcupada = false;
    salvarMesa();
    renderFluxo(); renderTopo(); renderDoca(); renderCombate(); atualizarCompositor();
  }
}

function vontadeDisponivel() {
  const d = derivados(M.ficha);
  return d.vontade - (M.ficha.danoVontade || 0);
}

async function retestarComVontade(idMensagem) {
  const msg = M.mensagens.find(x => x.id === idMensagem);
  if (!msg || msg.autor !== 'rolagem') return;
  if (!Dados.podeRetestar(msg.resultado)) return;

  if (vontadeDisponivel() <= 0) {
    M.mensagens.push({ id: msgId(), autor: 'sistema',
      texto: 'Sem Força de Vontade para gastar', ts: Date.now() });
    renderFluxo();
    return;
  }

  const antes = msg.resultado;
  const indices = Dados.dadosRetestaveis(antes);
  const depois = Dados.retestarVontade(antes, indices);

  M.ficha.danoVontade = (M.ficha.danoVontade || 0) + 1;
  msg.resultado = depois;
  msg.animar = true;

  const chave = Object.keys(M.rolagens).find(k => M.rolagens[k].resultado === antes);
  if (chave) M.rolagens[chave].resultado = depois;

  registrar(`Reteste de Vontade — ${indices.length} dado(s): ${
    Dados.descrever(antes)} → ${Dados.descrever(depois)}`);
  salvarMesa();
  renderFluxo(false);
  renderTopo();

  const cartao = document.querySelector(`[data-rolagem="${idMensagem}"]`);
  if (cartao) await DadosUI.animar(cartao, depois);
  msg.animar = false;
  salvarMesa();
}

function rolarDoMestre({ piscina, fome = 0, dificuldade = 0, rotulo = 'Mestre' }) {
  const r = Dados.rolar({ piscina, fome, dificuldade, rotulo });
  M.registroMestre.push({ ts: Date.now(), texto: `${rotulo} — ${Dados.descrever(r)}` });
  salvarMesa();
  return r;
}

/* ------------------------------------------------------------
   RENDER — mensagens
   ------------------------------------------------------------ */


function alvoDeFala(id) {
  if (!id || id === 'geral') return null;
  const p = M.pessoas.find(x => x.id === id);
  if (!p) return null;
  const naCena = (M.cena.presentes || []).includes(p.id);
  return {
    id: p.id, nome: p.nome, contato: !!p.contato,
    distancia: naCena ? 2 : 500,
    audivel: naCena
  };
}


function estadosAtuais() {
  return Estado.estadosDe(M.ficha, M.estados);
}

function ganchoDaCena() {
  if (!M.campanha || !M.diretor) return '';
  const cena = Diretor.cenaAtual(M.campanha, M.diretor);
  if (!cena) return '';
  const opcoes = (cena.opcoes || []).map(o => o.intencao).filter(Boolean);
  return opcoes.length ? `as opções previstas da cena são ${opcoes.join(', ')}` : '';
}


/* ------------------------------------------------------------
   RENDER — doca
   ------------------------------------------------------------ */


function gerarOponente(modelo, nomeDado = null, { silencioso = false } = {}) {
  const gerado = Combate.gerarMortal(modelo, M.combate.profissao || null);
  const n = (M.combate.oponentes || []).length + 1;
  const nome = nomeDado || `${gerado.ficha.nome} ${n}`;
  M.combate.proximoId = M.combate.proximoId || 1;
  M.combate.oponentes.push({
    ref: `op:${M.combate.proximoId++}`,
    /* §90 — nome dado pela cena tira o anonimato, e com ele a regra do
       crítico que incapacita sem calcular dano (pág. 303). "Mortal
       comum 3" é figurante; "Beatriz" não é. */
    nome, ficha: Object.assign(gerado.ficha, { nome, anonimo: !nomeDado }),
    modelo, armadura: 'Sem armadura', armaDele: '', estados: []
  });
  if (silencioso) return;
  anunciar([{ tipo: 'combate', texto: `${nome} entra na briga.` }]);
  if (M.combate.rodada && !M.combate.rodada.encerrada) {
    anunciar([{ tipo: 'nota',
      texto: `${nome} chegou com a rodada em andamento e só entra na ordem na próxima.` }]);
  }
  salvarMesa();
  renderMesa();
}

function normalizarMesa() {
  const padrao = MESA_VAZIA();
  for (const chave of ['combate', 'contador', 'cena']) {
    M[chave] = Object.assign({}, padrao[chave], M[chave] || {});
  }
  if (!Array.isArray(M.bolsa)) M.bolsa = [];
  /* §89 — sessão gravada antes do Apêndice III não tem os limites, e
     uma vinda do Módulo 3 pode ter qualquer coisa no lugar deles. */
  M.limites = Limites.normalizar(M.limites);
  if (!Array.isArray(M.projetos)) M.projetos = [];
  /* §90 — sessão de antes dos Estados de Condenação. */
  M.laco = Lacos.normalizar(M.laco);
  M.combate.opcoes = Object.assign({}, padrao.combate.opcoes, M.combate.opcoes || {});
  if (!M.combate.agarrados || typeof M.combate.agarrados !== 'object') M.combate.agarrados = {};
  normalizarOponentes();
}

/* A CONDUÇÃO DO COMBATE SAIU DAQUI.  (F1, §100)

   De `combateAtivo` a `golpe`, tudo mora em `mesa-combate.js` desde a
   §100. O motivo está no cabeçalho de lá, e ele foi escrito na §93:
   este arquivo tem teto próprio no `fronteiras.test.mjs`, e o bloco
   que sairia quando o teto não coubesse já estava escolhido.

   `mesa.js` continua dono do TURNO; a RODADA é de lá. */

function anunciar(eventos) {
  for (const e of eventos || []) {
    M.mensagens.push({ id: msgId(), autor: 'sistema', texto: e.texto,
      critico: e.tipo === 'critico', ts: Date.now() });
    registrar(e.texto);
  }
}

function aplicarNoEstado(fn) {
  const r = fn(M.ficha) || {};
  anunciar(r.eventos);
  salvarMesa();
  renderMesa();
  return r;
}


let cronistaOcupado = false;

async function fecharCronica(tipo) {
  if (cronistaOcupado || !M.ficha) return;
  cronistaOcupado = true;
  toast(tipo === 'dossie' ? 'Fechando a crônica…' : 'Fechando o capítulo…');

  const r = await Cronista.cronicar(M, tipo);
  M.cronicas = M.cronicas || [];
  M.cronicas.push({
    tipo, ts: Date.now(), saida: r.saida, origem: r.origem,
    modelo: r.modelo || '', valido: r.valido, problemas: r.problemas || []
  });
  if (r.origem === 'modelo') M.contador.llm++;
  registrar(r.origem === 'modelo'
    ? `Cronista (${r.modelo}) fechou ${tipo === 'dossie' ? 'a crônica' : 'o capítulo'}.`
    : `Cronista determinístico fechou ${tipo === 'dossie' ? 'a crônica' : 'o capítulo'}.`);

  if (tipo === 'dossie') {
    const reg = Legado.registrar(M.ficha, r.saida, {
      campanha: M.campanha ? (M.campanha.meta && M.campanha.meta.campanha) || '' : 'Noite livre',
      cidade: M.ficha.cidade
    });
    registrar(`Legado gravado — ${Legado.resumoCurto(M.ficha)}.`);
    M.mensagens.push({ id: msgId(), autor: 'sistema',
      texto: `Isto atravessa para a próxima crônica: ${Legado.resumoCurto(M.ficha)}.`, ts: Date.now() });
  }

  if (r.falha) toast(`Cronista caiu no determinístico: ${r.falha}`);
  else if (r.valido === false) toast('O validador reprovou o texto. Veja as marcas na aba Registro.');

  cronistaOcupado = false;
  M.aba = 'registro';
  salvarMesa();
  renderMesa();
}


/* ------------------------------------------------------------
   RENDER — tela inteira
   ------------------------------------------------------------ */
/* Os pedaços são renderizados separadamente: trocar de aba na doca não pode
   reconstruir o fluxo de conversa (isso fazia o chat saltar e voltar). */


function renderCombate() {
  const palco = $('#combate-palco');
  if (!palco) return;
  palco.innerHTML = painelCombateHTML();
}

function renderCompositor() {
  const alvo = $('.compositor-interno');
  if (!alvo) return renderMesa();
  const ta = $('#entrada');
  if (ta) M.rascunho = ta.value;
  alvo.innerHTML = compositorHTML();
  focarEntrada();
  salvarMesa();
}

function renderMesa() {
  if (!M.ficha) return renderSaguao();

  const loc = M.locais.find(l => l.id === M.cena.local);
  const modo = MODOS_MESA.find(x => x.id === M.modo);

  $('#app').innerHTML = `
  <div class="mesa">
    <header class="mesa-topo">
      <div class="topo-marca" data-mesa="capa" title="Tela inicial">VIT<span>Æ</span></div>
      <div class="mesa-cena">
        <div class="local">${esc(loc?.nome || M.cena.local || 'Em algum lugar')}</div>
        <div class="hora">${esc(M.cena.hora || '')}</div>
      </div>
      <div class="hud">${hudHTML()}</div>
      <button class="btn fantasma doca-alternar" data-mesa="doca">Contexto</button>
      <button class="btn fantasma" data-mesa="saguao">Noites</button>
      <button class="btn fantasma" data-mesa="sair">Criador</button>
    </header>

    ${avisoDoNarradorHTML()}

    <div class="mesa-chat">
      <div class="fluxo" id="fluxo">
        <div class="fluxo-interno" id="fluxo-interno">${fluxoHTML()}</div>
      </div>

      <div class="compositor">
        <div id="combate-palco">${painelCombateHTML()}</div>
        <div class="compositor-interno">${compositorHTML()}</div>
      </div>
    </div>

    <div class="doca-fundo ${M.docaAberta ? 'on' : ''}" data-mesa="fechar-doca"></div>

    <aside class="doca ${M.docaAberta ? 'aberta' : ''}">
      <div class="doca-cabeca">
        <span>Contexto</span>
        <button class="doca-fechar" data-mesa="fechar-doca" title="Recolher">✕</button>
      </div>
      <div class="doca-abas">${abasHTML()}</div>
      <div class="doca-corpo">${corpoDocaHTML()}</div>
    </aside>
  </div>`;

  rolarFluxo(false);
  focarEntrada();
}

/* Só a doca. Preserva o scroll do corpo quando a aba não mudou. */
let _abaAnterior = null;
function renderDoca() {
  const doca = $('.doca');
  if (!doca) return renderMesa();

  const corpo = doca.querySelector('.doca-corpo');
  const manterScroll = _abaAnterior === M.aba;
  const scroll = corpo.scrollTop;

  doca.classList.toggle('aberta', M.docaAberta);
  $('.doca-fundo')?.classList.toggle('on', M.docaAberta);
  doca.querySelector('.doca-abas').innerHTML = abasHTML();
  corpo.innerHTML = corpoDocaHTML();
  if (manterScroll) corpo.scrollTop = scroll;

  _abaAnterior = M.aba;
  salvarMesa();
}

/* Só o fluxo de conversa. */
function renderFluxo(suave = true) {
  const interno = $('#fluxo-interno');
  if (!interno) return renderMesa();
  interno.innerHTML = fluxoHTML();
  rolarFluxo(suave);
}

function rolarFluxo(suave) {
  const fluxo = $('#fluxo');
  if (!fluxo) return;
  fluxo.scrollTo({ top: fluxo.scrollHeight, behavior: suave ? 'smooth' : 'auto' });
}

/* Só o topo (cena + vitais). */
function renderTopo() {
  if (!$('.mesa-topo')) return;
  const loc = M.locais.find(l => l.id === M.cena.local);
  $('.mesa-cena .local').textContent = loc?.nome || M.cena.local || 'Em algum lugar';
  $('.mesa-cena .hora').textContent = M.cena.hora || '';
  $('.hud').innerHTML = hudHTML();
}

/* Só o compositor: habilita/desabilita e ajusta o texto de apoio. */
function atualizarCompositor() {
  const ta = $('#entrada'), btn = $('.btn-enviar');
  if (!ta) return;
  ta.disabled = mesaOcupada;
  if (btn) btn.disabled = mesaOcupada;
  ta.placeholder = DICA_ENTRADA;
  if (ta.value !== M.rascunho) ta.value = M.rascunho;
  autoCrescer(ta);
  if (!mesaOcupada) focarEntrada();
}

/* Só a linha de leitura. Chamada a cada tecla — por isso não pode
   redesenhar o compositor: o textarea perderia o cursor. */
function renderLeitura() {
  const alvo = $('#leitura');
  if (alvo) alvo.innerHTML = leituraHTML();
}

function focarEntrada() {
  const ta = $('#entrada');
  if (ta && !mesaOcupada) { ta.focus(); autoCrescer(ta); }
}

let escolha = { campanha: null, personagem: null };

function personagensDisponiveis() {
  const lista = [];
  if (typeof S !== 'undefined' && fichaJogavel(S)) {
    lista.push({ id: 'atual', nome: S.nome, ficha: S, origem: 'sua ficha do criador' });
  }
  for (const f of listarFichas()) {
    if (!fichaJogavel(f)) continue;
    if (lista.some(x => x.ficha.nome === f.nome && x.ficha.cla === f.cla)) continue;
    lista.push({ id: `guardada:${f.fichaId}`, nome: f.nome, ficha: f, origem: 'da biblioteca' });
  }
  if (!lista.some(x => x.ficha.nome === FICHA_EXEMPLO.nome && x.ficha.cla === FICHA_EXEMPLO.cla)) {
    lista.push({ id: 'exemplo', nome: FICHA_EXEMPLO.nome, ficha: FICHA_EXEMPLO,
                 origem: 'pré-gerada' });
  }
  if (escolha.importada) {
    lista.push({ id: 'importada', nome: escolha.importada.nome, ficha: escolha.importada,
                 origem: 'importada de arquivo' });
  }
  return lista;
}

function cartaoPersonagem(p, selecionado) {
  const c = clan(p.ficha.cla);
  const d = derivados(p.ficha);
  return `<div class="cartao clicavel ${selecionado ? 'selec' : ''}"
      data-mesa="escolher-personagem" data-id="${esc(p.id)}">
    ${c ? `<span class="fita" style="background:linear-gradient(90deg,${c.cor},transparent)"></span>` : ''}
    <div class="cla-topo">
      ${c ? `<span class="cla-simbolo">${c.simbolo}</span>` : ''}
      <div><div class="cla-nome">${esc(p.nome)}</div>
      <div class="cla-epiteto">${c ? esc(c.nome) : ''} · ${esc(p.ficha.geracao)}ª geração</div></div>
    </div>
    ${p.ficha.conceito ? `<p class="cla-lema">${esc(p.ficha.conceito)}</p>` : ''}
    <div class="saguao-linha">
      <span>Vitalidade ${d.vitalidade}</span><span>Vontade ${d.vontade}</span>
      <span>Humanidade ${d.humanidade}</span>
    </div>
    <div class="cla-discs">${esc(p.origem)}</div>
  </div>`;
}

function renderSaguao() {
  const sessoes = listarSessoes();

  const cartoes = sessoes.map(s => `
    <div class="sessao-cartao">
      ${s.clas ? `<span class="fita" style="background:linear-gradient(90deg,${s.clas.cor},transparent)"></span>` : ''}
      <div class="sessao-corpo" data-mesa="continuar-sessao" data-id="${s.id}">
        <div class="sessao-topo">
          <span class="sessao-personagem">${esc(s.personagem)}</span>
          <span class="sessao-quando">${quando(s.atualizadoEm)}</span>
        </div>
        <div class="sessao-meta">${esc(s.cla)} · ${esc(s.campanha)}</div>
        ${s.capitulo ? `<div class="sessao-onde">${esc(s.capitulo)}</div>` : ''}
        ${s.cena ? `<div class="sessao-onde cena">Cena: ${esc(s.cena)}</div>` : ''}
        <div class="sessao-rodape">
          <span>${s.turnos} turno${s.turnos === 1 ? '' : 's'}</span>
          <span>Fome ${s.fome}</span>
          <span>${s.contador.llm} chamada${s.contador.llm === 1 ? '' : 's'} ao Narrador</span>
        </div>
      </div>
      ${sessaoParaApagar === s.id ? `
        <button class="sessao-apagar confirmando" data-mesa="apagar-sessao" data-id="${s.id}"
          title="Clique para apagar de vez">Apagar<br>mesmo</button>
        <button class="sessao-apagar" data-mesa="cancelar-apagar-sessao" data-id="${s.id}"
          title="Deixar como está">↩</button>` : `
        <button class="sessao-apagar" data-mesa="apagar-sessao" data-id="${s.id}"
          title="Apagar esta noite">✕</button>`}
    </div>`).join('');

  $('#app').innerHTML = `
  <div class="saguao">
    <header class="saguao-cabeca">
      <div class="topo-marca" data-mesa="capa" title="Tela inicial">VIT<span>Æ</span></div>
      <div>
        <div class="sub">A Mesa</div>
        <h1>Suas noites</h1>
      </div>
      <button class="btn fantasma" data-mesa="sair" style="margin-left:auto">Ir para o criador</button>
    </header>

    <div class="saguao-corpo">
      ${sessoes.length ? `
        <h3 class="sub">Em andamento</h3>
        <div class="sessoes">${cartoes}</div>
        <hr class="ornamento">` : `
        <div class="caixa ouro"><h4>Nenhuma noite começada</h4>
        <p>Escolha uma história e um personagem para abrir a primeira.</p></div>`}

      <div class="centro mt">
        <button class="btn primario grande" data-mesa="nova-historia">Começar uma nova noite</button>
      </div>
    </div>
  </div>`;
  window.scrollTo({ top: 0 });
}

function renderNovaHistoria() {
  const pessoas = personagensDisponiveis();
  if (!escolha.personagem && pessoas.length) escolha.personagem = pessoas[0].id;

  const campanhas = CAMPANHAS.map(c => {
    const cid = CIDADES.find(x => x.id === c.cidade);
    return `<div class="cartao clicavel ${escolha.campanha === c.id ? 'selec' : ''}"
        data-mesa="escolher-campanha" data-id="${c.id}">
      <div class="cla-nome">${esc(c.nome)}</div>
      <div class="cla-epiteto">${c.arquivo
        ? `${c.capitulos} capítulos · ${cid ? esc(cid.nome) : ''} · Índice ${esc(c.ifAlvo)}`
        : 'sem roteiro'}</div>
      <p class="quiet" style="margin:.55rem 0">${esc(c.resumo)}</p>
      <div class="cla-discs">${esc(c.tom)}</div>
    </div>`;
  }).join('');

  const camp = CAMPANHAS.find(c => c.id === escolha.campanha);
  const pers = pessoas.find(p => p.id === escolha.personagem);
  const cidCamp = camp && camp.cidade;
  const cidPers = pers && pers.ficha.cidade;
  const conflito = cidCamp && cidPers && cidCamp !== cidPers;

  $('#app').innerHTML = `
  <div class="saguao">
    <header class="saguao-cabeca">
      <div class="topo-marca" data-mesa="capa" title="Tela inicial">VIT<span>Æ</span></div>
      <div>
        <div class="sub">Nova noite</div>
        <h1>História e personagem</h1>
      </div>
      <button class="btn fantasma" data-mesa="saguao" style="margin-left:auto">Voltar</button>
    </header>

    <div class="saguao-corpo">
      <h3 class="sub">1 · A história</h3>
      <div class="grade g2 mt">${campanhas}</div>

      <hr class="ornamento">

      <h3 class="sub">2 · O personagem</h3>
      <div class="grade g2 mt">${pessoas.map(p =>
        cartaoPersonagem(p, escolha.personagem === p.id)).join('')}</div>
      <div class="centro mt">
        <button class="btn fantasma" data-mesa="importar-ficha">Importar ficha .json</button>
      </div>

      ${conflito ? `<div class="caixa mt2"><h4>Cidades diferentes</h4>
        <p>A campanha se passa em ${esc(CIDADES.find(x=>x.id===cidCamp)?.nome || cidCamp)} e a ficha é de
        ${esc(CIDADES.find(x=>x.id===cidPers)?.nome || cidPers)}. Dá para jogar assim — o cenário da
        campanha prevalece —, mas os locais e contatos da ficha não vão bater.</p></div>` : ''}

      ${(typeof location !== 'undefined' && !/^https?:$/.test(location.protocol)
         && CAMPANHAS.some(c => c.arquivo)) ? `
        <div class="caixa mt2" style="border-color:var(--sangue)"><h4>Sem servidor</h4>
        <p>O app está aberto como <b>arquivo</b>, e campanha com roteiro é carregada por
        <code>fetch</code>. Só a <b>Noite livre</b> vai abrir assim.</p>
        <p class="quiet" style="margin:.4rem 0 0;font-size:.82rem">Para jogar as outras:
        <code>node ferramentas/dev.mjs</code> — ou <code>node modulos/gateway/proxy.mjs</code>, que também
        liga o Narrador — e abra <code>http://localhost:5173</code>.</p></div>` : ''}

      ${escolha.erroDaCampanha && camp && escolha.erroDaCampanha.id === camp.id ? `
        <div class="caixa mt2" style="border-color:var(--sangue)"><h4>Esta campanha não abriu</h4>
        <p>${esc(escolha.erroDaCampanha.motivo)}</p>
        <p class="quiet" style="margin:.4rem 0 0;font-size:.82rem">A mesa recusa campanha que não
        compila em vez de entrar com zero opções. Escolha outra, ou conserte o arquivo — a lista
        completa de erros está no console.</p></div>` : ''}

      ${camp && pers ? `
        <div class="caixa ouro mt2"><h4>Pronto</h4>
        <p><b>${esc(pers.nome)}</b> em <b>${esc(camp.nome)}</b>.
        ${camp.arquivo ? `Dificuldade base calibrada para Índice ${
          Ficha.calibragem(pers.ficha).indice} — ${esc(Ficha.calibragem(pers.ficha).nome)}.` : ''}</p></div>` : ''}

      <div class="centro mt2">
        <button class="btn primario grande" data-mesa="comecar-noite"
          ${camp && pers ? '' : 'disabled'}>Começar a noite</button>
      </div>
    </div>
  </div>`;
  window.scrollTo({ top: 0 });
}


/* ------------------------------------------------------------
   CAMPANHA QUE NÃO COMPILA NÃO ENTRA  (§72, metade barata do G1)

   Antes: a mesa mostrava um toast e SEGUIA. Com grafo vazio, o
   jogador entrava numa história de zero opções e zero narração e
   não tinha como saber por quê — o motivo estava no console, que
   ninguém abre no meio de uma sessão.

   Agora ela recusa e DIZ o que está errado, com as três primeiras
   linhas de erro do compilador. Vinte linhas, e é o que separa
   "campanha quebrada" de "o jogo está quebrado" aos olhos de quem
   está jogando.
   ------------------------------------------------------------ */
/* "Failed to fetch" não é diagnóstico: é o navegador repetindo que não
   deu. Quem lê essa frase no meio de uma sessão não sabe o que fazer.

   As três causas reais, e cada uma tem conserto diferente (§74). */
function porQueNaoLeu(erro, protocolo) {
  const p = protocolo || (typeof location !== 'undefined' ? location.protocol : '');
  const semServidor = !!p && !/^https?:$/.test(p);
  if (semServidor) {
    return 'O app está aberto como ARQUIVO, e campanha precisa de servidor. '
         + 'Rode `node ferramentas/dev.mjs` (ou `proxy.mjs`) e abra http://localhost:5173. '
         + 'Sem servidor, só a Noite livre funciona.';
  }
  if (erro && erro.name === 'TypeError') {
    return 'O servidor não respondeu. Ele ainda está de pé? '
         + '(`node ferramentas/dev.mjs` ou `node modulos/gateway/proxy.mjs`)';
  }
  return erro && erro.message ? erro.message : 'motivo desconhecido';
}

async function iniciarCampanha(ficha, caminho) {
  let md;
  try {
    const resposta = await fetch(caminho);
    if (!resposta.ok) throw new Error(`o arquivo não está lá (HTTP ${resposta.status})`);
    md = await resposta.text();
  } catch (e) {
    console.warn('Campanha não pôde ser lida:', caminho, e && e.name, e && e.message);
    throw new Error(`Não deu para ler ${caminho.split('/').pop()}. ${porQueNaoLeu(e)}`);
  }

  const campanha = Compilador.compilar(md);
  if (campanha.erros.length) {
    console.warn(`Campanha "${caminho}" não compila. ${campanha.erros.length} erro(s):`, campanha.erros);
    const amostra = campanha.erros.slice(0, 3).join(' · ');
    throw new Error(`Esta campanha não compila (${campanha.erros.length} erro${
      campanha.erros.length === 1 ? '' : 's'}). ${amostra}${campanha.erros.length > 3 ? ' …' : ''}`);
  }

  iniciarMesa(ficha);
  M.campanha = campanha;
  M.campanha.arquivo = caminho;
  M.diretor = Diretor.iniciar(campanha);
  M.mensagens = [];
  const ab = Diretor.abrirCena(campanha, M.diretor, M.diretor.cena);
  aplicarEventosDiretor(ab.eventos);
  registrar(`Campanha "${campanha.meta.campanha}" iniciada.`);
  salvarMesa();
  return campanha;
}

function aplicarEventosDiretor(eventos) {
  for (const e of eventos) {
    if (e.tipo === 'capitulo') {
      M.mensagens.push({ id: msgId(), autor: 'cena', titulo: e.titulo, sub: e.resumo, ts: Date.now() });
    } else if (e.tipo === 'cena') {
      if (e.local) M.cena.local = e.local;
      if (e.hora) M.cena.hora = e.hora;
      M.mensagens.push({ id: msgId(), autor: 'cena', titulo: e.titulo, sub: e.hora || '', ts: Date.now() });
    } else if (e.tipo === 'narracao') {
      M.mensagens.push({ id: msgId(), autor: 'narrador', texto: e.texto, daCampanha: true, ts: Date.now() });
    } else if (e.tipo === 'revelacao') {
      const fato = { id: e.fato, titulo: e.fato.replace(/^f_/, '').replace(/_/g, ' '),
                     texto: 'Revelado em cena.' };
      if (!M.fatos.find(f => f.id === e.fato)) M.fatos.push(fato);
      M.mensagens.push({ id: msgId(), autor: 'sistema', texto: `Anotado: ${fato.titulo}`, ts: Date.now() });
    } else if (e.tipo === 'combate') {
      abrirCombate({ motivo: 'a campanha declarou a briga', oponentes: e.oponentes || [] });
    } else if (e.tipo === 'pedido') {
      M.opcaoAberta = e.opcao;
      M.mensagens.push({ id: msgId(), autor: 'narrador', texto: '', daCampanha: true,
        rolagem: { dificuldade: e.dificuldade.valor,
                   motivo: `Dificuldade ${e.dificuldade.valor}, ${e.dificuldade.origem}.`,
                   rotas: e.opcao.rotas, intencao: e.opcao.intencao },
        ts: Date.now() });
    } else if (e.tipo === 'custo' || e.tipo === 'dano' || e.tipo === 'macula' ||
               e.tipo === 'fome' || e.tipo === 'nota' || e.tipo === 'critico') {
      M.mensagens.push({ id: msgId(), autor: 'sistema', texto: e.texto, ts: Date.now() });
      registrar(e.texto);
    } else if (e.tipo === 'erro') {
      M.mensagens.push({ id: msgId(), autor: 'sistema', texto: e.texto, ts: Date.now() });
    }
  }
}

/* ------------------------------------------------------------
   O AVISO DIZ O QUE ESTÁ LIGADO  (§75)

   Este bloco era HTML FIXO dizendo "Narrador simulado — nenhuma IA
   conectada". Ele aparecia igual com o modelo ligado: o app mentia
   sobre o próprio estado, e não havia como saber, olhando a tela,
   se a IA estava respondendo ou não.

   Agora ele lê o adaptador em uso. Quando não há IA, diz o que
   FALTA — que era a informação útil desde o começo.
   ------------------------------------------------------------ */
function avisoDoNarradorHTML() {
  if (typeof Narrador !== 'undefined' && Narrador.temIA) {
    return `<div class="mesa-aviso ligado">
      <b>Narrador: ${esc(Narrador.nome)}</b>
      <span class="so-largo">— modelo local respondendo pelo proxy. Nada é pré-escrito.</span>
    </div>`;
  }
  const semServidor = typeof location !== 'undefined' && !/^https?:$/.test(location.protocol);
  return `<div class="mesa-aviso">
    <b>Narrador simulado</b>
    <span class="so-largo">— respostas pré-escritas. ${semServidor
      ? 'O app está aberto como arquivo: suba <code>node modulos/gateway/proxy.mjs</code> e abra http://localhost:5173.'
      : 'Para ligar o modelo: <code>ollama serve</code> e <code>node modulos/gateway/proxy.mjs</code>.'}</span>
    <span class="chip" data-mesa="religar-narrador" title="Procurar o modelo de novo">Procurar o modelo</span>
  </div>`;
}

/* Ponto de entrada usado pelo criador: abre o saguão, nunca o chat direto. */
function abrirMesa(fichaNova) {
  Narrador.detectar().then(temIA => {
    if (temIA) registrar(`Narrador ligado: ${Narrador.nome}.`);
    if (document.querySelector('.doca')) renderDoca();
    /* O aviso do topo depende do que a detecção achou, e a detecção é
       assíncrona: sem este redesenho ele fica congelado no estado
       anterior até o próximo clique. (§75) */
    if (document.querySelector('.mesa-aviso')) renderMesa();
  });
  if (fichaNova) { iniciarMesa(fichaNova); return renderMesa(); }
  renderSaguao();
}

function importarFichaParaMesa() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const dados = JSON.parse(fr.result);
        if (dados.identidade && !dados.atributos?.forca) {
          toast('Esse é o .json extraído, que é só de leitura. Use o "Exportar .json".');
          return;
        }
        if (!fichaJogavel(dados)) {
          toast('Ficha incompleta: precisa de nome, clã e Tipo de Predador.');
          return;
        }
        escolha.importada = dados;
        escolha.personagem = 'importada';
        renderNovaHistoria();
        toast(`${dados.nome} importada.`);
      } catch (e) { toast('Arquivo inválido.'); }
    };
    fr.readAsText(f);
  };
  inp.click();
}

async function comecarNoite() {
  const camp = CAMPANHAS.find(c => c.id === escolha.campanha);
  const pers = personagensDisponiveis().find(p => p.id === escolha.personagem);
  if (!camp || !pers) return;

  M = MESA_VAZIA();
  if (camp.arquivo) {
    try {
      await iniciarCampanha(pers.ficha, camp.arquivo);
    } catch (e) {
      /* Recusa: a mesa NÃO abre. O jogador fica no saguão, com o
         motivo na tela, e pode escolher outra. (§72) */
      M = MESA_VAZIA();
      toast(e.message);
      escolha.erroDaCampanha = { id: camp.id, motivo: e.message };
      renderNovaHistoria();
      return;
    }
  } else {
    iniciarMesa(pers.ficha);
  }
  delete escolha.erroDaCampanha;
  M.campanhaId = camp.id;
  salvarMesa();
  renderMesa();
}

/* ------------------------------------------------------------
   INTERAÇÃO
   ------------------------------------------------------------ */
function autoCrescer(ta) {
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
}

/* O mapa de ações vive em `mesa-acoes.js` desde a §50 (item N4). O
   ouvinte abaixo só encontra o dono e chama. */



document.addEventListener('click', (e) => {
  const alvo = e.target.closest('[data-mesa]');
  if (!alvo) return;
  const acao = alvo.dataset.mesa;
  const id = alvo.dataset.id;

  if (sessaoParaApagar && acao !== 'apagar-sessao') sessaoParaApagar = '';

  const fn = ACOES_MESA[acao];
  if (!fn) { console.warn('Ação de mesa sem dono:', acao); return; }
  fn(id, alvo);
});

document.addEventListener('input', (e) => {
  if (e.target.id !== 'entrada') return;
  M.rascunho = e.target.value;
  autoCrescer(e.target);
  /* A leitura acompanha o que está sendo digitado. Só ela é
     redesenhada: redesenhar o compositor inteiro perderia o cursor. */
  renderLeitura();
});

document.addEventListener('change', (e) => {
  const campo = e.target.dataset && e.target.dataset.mesaCampo;
  if (!campo) return;
  const valor = e.target.value;

  if (campo.startsWith('oponente:')) {
    const corte = campo.lastIndexOf(':');
    const o = oponentePorRef(campo.slice('oponente:'.length, corte));
    if (o) o[campo.slice(corte + 1)] = valor;
  } else if (campo.startsWith('combate:')) {
    M.combate[campo.split(':')[1]] = valor;
  } else if (campo === 'compraXPId') {
    /* §91 — escolher O QUE comprar zera o nível-alvo: a cotação passa
       a valer para o traço novo, e não para o degrau do anterior. */
    M.compraXP = Object.assign({ classe: 'atributo' }, M.compraXP, { id: valor, para: 0 });
    salvarMesa(); renderDoca(); return;
  } else {
    M[campo] = valor;
  }
  /* §57 — corrigir o alvo à mão muda a linha de leitura ("lido do seu
     texto" vira "corrigido à mão"). */
  if (campo === 'alvoManual') renderLeitura();
  salvarMesa();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && M.docaAberta && $('.doca')) {
    M.docaAberta = false; renderDoca(); return;
  }
  if (e.target.id !== 'entrada') return;
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    enviarTurno(e.target.value);
  }
});

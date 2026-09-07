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
             rodada: null, proximoId: 1 },
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
  sessaoServidor: '', origemDaFicha: '', checkinPrevia: null
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
function fichaJogavel(f) {
  return !!(f && f.nome && f.cla && f.predador);
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
  aplicarPasso(passo, turno);

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
  try {
    const qual = await interpretadorDaMesa();
    const saida = qual === 'llm'
      ? await Cadeia.arbitrarComModelo(Object.assign({ interpretador: 'llm' }, entrada))
      : Cadeia.arbitrar(entrada);
    M.ultimaCadeia = saida.elos;
    return Cadeia.comoVeredito(saida);
  } catch (e) {
    console.warn('Cadeia falhou; caindo no Árbitro direto:', e && e.message);
    M.ultimaCadeia = { erro: (e && e.message) || 'falhou', interpretador: 'nenhum' };
    return Arbitro.avaliar({ ficha: M.ficha, estados, texto, fala });
  }
}

function turnoDaMesa({ texto, leitura, veredito, estados, seg }) {
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
        gancho: ganchoDaCena()
      };
    }
  };
}

let _escada = null;
function escadaDaMesa() {
  if (!_escada) {
    _escada = new Escada([
      new DegrauArbitro(),
      new DegrauCampanha(Diretor),
      new DegrauRecombinacao(Recombinador),
      new DegrauNarrador(Narrador)
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
async function rolarPelaMesa(opcoes) {
  const pedido = Dados.pedir(opcoes);
  const doServidor = await Ponte.rolar(pedido);
  if (doServidor && doServidor.valores) {
    const r = Dados.apurar(doServidor.pedido || pedido, doServidor.valores);
    r.ondeRolou = 'mesa';
    return r;
  }
  const r = Dados.apurar(pedido, Dados.rodar(pedido));
  r.ondeRolou = 'local';
  return r;
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
  const resultado = await rolarPelaMesa({
    piscina: p.total,
    fome: M.ficha.fome || 0,
    dificuldade: (pedido.dificuldade || 0) + extra,
    rotulo: p.rotulo + (extra ? ` (+${extra} de Dificuldade)` : '')
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
    nome, ficha: Object.assign(gerado.ficha, { nome }),
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
  normalizarOponentes();
}

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
        terreno: terrenoDoOponente(o) });
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
                 alvoVampiro, terreno = null }) {
  const t = terreno || { distancia: null, cobertura: null, penalidade: 0 };
  const r = Combate.resolver({
    atacante, defensor, tipo,
    arma: arma === 'Desarmado' ? null : arma,
    armadura: armadura === 'Sem armadura' ? null : armadura,
    estadosAtacante, estadosDefensor, alvoVampiro,
    distancia: t.distancia, cobertura: t.cobertura, penalidadeTerreno: t.penalidade || 0
  });
  if (r.possivel === false) {
    anunciar(r.bloqueios.map(b => ({ tipo: 'critico', texto: b })));
    return r;
  }
  M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: r.rolAtq, ts: Date.now() });
  if (r.rolDef) M.mensagens.push({ id: msgId(), autor: 'rolagem', resultado: r.rolDef, ts: Date.now() });
  anunciar(r.eventos);
  return r;
}


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
      <div class="topo-marca" data-mesa="saguao" title="Suas noites">VIT<span>Æ</span></div>
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
      <div class="topo-marca" data-mesa="sair">VIT<span>Æ</span></div>
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
      <div class="topo-marca" data-mesa="saguao">VIT<span>Æ</span></div>
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

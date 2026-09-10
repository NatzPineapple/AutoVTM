/* ============================================================
   VITÆ — O tráfego entre a Mesa, o Árbitro e o Cronista
   (§93)

   Uma pergunta só: **o que foi de um lado para o outro?**

   As três camadas conversam o tempo todo, e até agora essa conversa
   era invisível. Quando um turno saía errado, dava para ver o
   RESULTADO — a parada, o veredito, a narração — e não o que tinha
   sido perguntado. Depurar assim é adivinhar.

   Três coisas que este arquivo NÃO faz, e que valem mais escritas do
   que subentendidas:

   1. ELE NÃO MUDA NADA. Todo gancho é observador: registra e sai. Se
      este objeto sumir, o jogo roda igual — os chamadores perguntam
      por `typeof` antes de falar com ele.

   2. ELE NÃO VIVE NA SESSÃO. O registro fica **em memória**, e não
      em `M`. `salvarMesa()` serializa `M` inteiro para o
      `localStorage` e o espelha no Módulo 3 a cada turno: um log de
      cargas úteis ali dentro estouraria a cota do navegador — que
      este projeto já viu estourar (§75.5) — e mandaria a ficha para
      o servidor mais uma vez por turno, de graça. Recarregar a página
      limpa o registro, e está certo assim: ele é sobre a sessão
      viva, não sobre a história dela.

   3. ELE NÃO GUARDA TUDO. Cada linha tem teto de caracteres e a lista
      é um anel: entra no fim, cai do começo. Um turno com histórico
      leva alguns KB, e sem os dois tetos a aba de Debug viraria o
      maior consumidor de memória do app.
   ============================================================ */

const Trafego = {

  /* Quantas linhas o anel guarda. Duzentas cobrem uma cena inteira
     com folga, e cabem na casa dos poucos megabytes. */
  LIMITE: 200,

  /* Teto por carga útil. O turno que vai ao Cronista inclui a ficha e
     vinte mensagens de histórico; inteiro, ele passa de 10 KB. */
  TETO_DA_CARGA: 4000,

  /* Os três lados da conversa, e os módulos como um quarto. Os ids
     são os que aparecem na tela e nos filtros. */
  LADOS: {
    mesa:     { nome: 'Mesa',     cor: 'mesa' },
    arbitro:  { nome: 'Árbitro',  cor: 'arbitro' },
    cronista: { nome: 'Cronista', cor: 'cronista' },
    modulo:   { nome: 'Módulos',  cor: 'modulo' }
  },

  linhas: [],
  _seq: 0,
  /* Contador de tudo o que já passou, inclusive o que já caiu do anel
     — sem ele, "200 linhas" esconderia que houve 4.000. */
  total: 0,

  /* Serialização defensiva: aqui passa carga vinda de fetch, de
     WebSocket e do próprio motor, e nenhuma delas é confiável para
     `JSON.stringify` — ciclo, `undefined`, `BigInt`, um `Error`. Um
     erro aqui derrubaria o turno, e este arquivo prometeu não mudar
     nada. */
  resumir(dados) {
    if (dados === undefined) return '';
    if (typeof dados === 'string') return this._cortar(dados);
    try {
      return this._cortar(JSON.stringify(dados, this._semCiclo(), 1));
    } catch (e) {
      return `[não deu para serializar: ${e && e.message}]`;
    }
  },

  _cortar(texto) {
    const t = String(texto == null ? '' : texto);
    return t.length > this.TETO_DA_CARGA
      ? `${t.slice(0, this.TETO_DA_CARGA)}\n… (+${t.length - this.TETO_DA_CARGA} caracteres)`
      : t;
  },

  /* O corpo de um POST chega como string JSON. Guardar a string crua
     faria a tela mostrar uma linha só, escapada; devolver o objeto
     deixa o `JSON.stringify` de `resumir` indentar. */
  _talvezObjeto(texto) {
    if (typeof texto !== 'string') return texto;
    try { return JSON.parse(texto); } catch (e) { return texto; }
  },

  _semCiclo() {
    const vistos = new WeakSet();
    return (chave, valor) => {
      if (valor instanceof Error) return `${valor.name}: ${valor.message}`;
      if (typeof valor === 'bigint') return String(valor);
      if (typeof valor === 'function') return '[função]';
      if (valor && typeof valor === 'object') {
        if (vistos.has(valor)) return '[ciclo]';
        vistos.add(valor);
      }
      return valor;
    };
  },

  /* A única porta de entrada.

     `de` e `para` são ids de `LADOS`; `assunto` é a frase curta que a
     tela mostra; `via` diz se a conversa foi chamada de função no
     mesmo navegador, HTTP para um módulo, ou o canal em tempo real. */
  registrar({ de, para, assunto, via = 'local', dados, ms = null, erro = '' }) {
    const linha = {
      id: ++this._seq,
      ts: Date.now(),
      de: this.LADOS[de] ? de : 'mesa',
      para: this.LADOS[para] ? para : 'mesa',
      assunto: String(assunto || ''),
      via,
      ms: (typeof ms === 'number' && isFinite(ms)) ? Math.round(ms) : null,
      erro: String(erro || ''),
      carga: this.resumir(dados)
    };
    this.linhas.push(linha);
    this.total++;
    if (this.linhas.length > this.LIMITE) this.linhas.splice(0, this.linhas.length - this.LIMITE);
    return linha;
  },

  /* Ida e volta numa chamada só: quem chama passa uma função e o
     tráfego mede o tempo e registra os dois lados.

     É a forma que mais aparece nos ganchos, e ela existe para o
     gancho não ter de repetir `Date.now()` nem lembrar de registrar a
     volta quando a ida estourou. */
  async medir({ de, para, assunto, via = 'local', envio, resumoDaVolta }, executar) {
    this.registrar({ de, para, assunto: `${assunto} →`, via, dados: envio });
    const t0 = Date.now();
    try {
      const r = await executar();
      this.registrar({ de: para, para: de, assunto: `${assunto} ←`, via,
                       ms: Date.now() - t0,
                       dados: resumoDaVolta ? resumoDaVolta(r) : r });
      return r;
    } catch (e) {
      this.registrar({ de: para, para: de, assunto: `${assunto} ✕`, via,
                       ms: Date.now() - t0, erro: (e && e.message) || 'falhou' });
      throw e;
    }
  },


  /* ============================================================
     OS GANCHOS DA MESA

     A Mesa diz QUANDO; o que cada linha carrega se decide aqui.

     Duas razões para a forma morar deste lado. A primeira é tamanho:
     `mesa.js` já é o maior arquivo do front e não vai crescer por
     causa de um observador. A segunda é a que importa — resumo com
     forma é REGRA (o que sobe, o que fica de fora, o que vira
     contagem), e regra escrita dentro de `mesa.js` só se alcança
     rodando um turno inteiro. Aqui ela se alcança direto, que é a
     lição da §91 e da §92.
     ============================================================ */

  /* A ficha inteira vai na chamada de verdade; no registro sobe só o
     que identifica o turno. Ela já aparece por extenso no envio ao
     Cronista, e repeti-la a cada pergunta encheria o anel com a mesma
     coisa. */
  perguntaAoArbitro({ texto, modo, estados, fala, personagem }) {
    return this.registrar({ de: 'mesa', para: 'arbitro', assunto: 'arbitrar o turno →',
      dados: { texto, modo, estados, fala: fala || null, personagem } });
  },

  vereditoDoArbitro(v, { qual, ms, elos, erro } = {}) {
    return this.registrar({ de: 'arbitro', para: 'mesa',
      assunto: `veredito ← (${qual})`, ms, erro: erro || '',
      dados: {
        possivel: v.possivel, acao: v.acao && v.acao.nome, dificuldade: v.dificuldade,
        rotas: (v.rotas || []).map(r => `${r.atributo} + ${r.pericia}`),
        bloqueios: (v.bloqueios || []).map(b => b.motivo),
        avisos: v.avisos, elos } });
  },

  /* Os três passos da §82 — "o Árbitro diz quais, a Mesa roda, o
     Árbitro apura" — numa LINHA SÓ, e não em três: as três metades
     acontecem no mesmo instante, e três carimbos de hora iguais só
     encheriam o anel. É o desenho mais importante deste projeto, e era
     justamente o que não dava para ver: a rolagem pronta aparecia; a
     divisão de trabalho que a produziu, não. */
  rolagem(aqui, { pedido, valores, doArbitro }) {
    return this.registrar({ de: 'arbitro', para: 'mesa', assunto: 'pedir · rodar · apurar',
      via: (aqui.ondeRolou === 'mesa' || aqui.ondePensou === 'arbitro') ? 'http' : 'local',
      dados: {
        pediu: { onde: aqui.ondePensou, normais: pedido.normais, fome: pedido.fome,
                 dificuldade: pedido.dificuldade, rotulo: pedido.rotulo },
        rodou: { onde: aqui.ondeRolou, normais: valores.normais, dadosFome: valores.dadosFome },
        apurou: { tipo: aqui.tipo, sucessos: aqui.sucessos, margem: aqui.margem,
                  conferidoComOModulo: !!doArbitro } } });
  },

  /* Os quatro degraus de cima respondem sem sair do navegador, e não
     apareciam em lugar nenhum. Esta é a linha que explica o turno que
     NÃO chamou o modelo — e "por que ele não chamou" é a pergunta que
     mais se faz nesta aba. */
  degrauQueRespondeu(passo) {
    if (!passo || !passo.degrau) return null;
    return this.registrar({ de: 'cronista', para: 'mesa',
      assunto: `respondeu o degrau ${passo.degrau.numero} — ${passo.degrau.nome}`,
      dados: { custa: passo.degrau.custa, tipo: passo.resposta && passo.resposta.tipo } });
  },

  /* O ENVELOPE DO NARRADOR.

     O envio ao Cronista é a única conversa que não passa nem pelo
     Árbitro nem pela Ponte: ela sai de dentro do `DegrauNarrador`, com
     `fetch` próprio. Pôr o gancho lá dentro faria a área Cronista
     depender do front, e a §48 barra isso. Então o que se entrega ao
     degrau é um Narrador ENVELOPADO: mesma interface (`responder`), de
     modo que o degrau não sabe que ele existe.

     `montar` é opcional porque é do adaptador de Proxy e o Narrador
     simulado não tem. Quando há, o que se registra é o CORPO REAL que
     sobe ao Módulo 5, e não o turno de dentro do navegador. */
  envelopar(narrador, montar) {
    const eu = this;
    return {
      async responder(turno) {
        return eu.medir({
          de: 'mesa', para: 'cronista',
          assunto: `turno para ${narrador.nome || 'o Narrador'}`,
          /* `temIA` é o nome do campo no `Narrador`; `ia` é o do
             adaptador cru, que é o que chega quando o envelope recebe
             um NarradorProxy direto. Ler só um dos dois faz o Proxy
             aparecer na aba como se fosse conversa local. */
          via: (narrador.temIA || narrador.ia) ? 'http' : 'local',
          envio: (typeof montar === 'function') ? montar(turno) : turno,
          resumoDaVolta: (r) => eu.voltaDoNarrador(r)
        }, () => narrador.responder(turno));
      }
    };
  },

  /* A narração volta com o texto e com o que ela DESCOBRIU. O texto vai
     inteiro, porque é o que se quer ler; os achados viram contagem,
     porque na aba interessa se vieram três pessoas novas, e não quais
     — essas já têm doca própria. */
  voltaDoNarrador(r) {
    const quantos = (a) => (a || []).length;
    return {
      texto: r && r.texto, modelo: r && r.modelo, validado: r && r.validado,
      avisoValidador: r && r.avisoValidador,
      pediuTeste: !!(r && r.rolagem), cena: r && r.cena,
      novos: { locais: quantos(r && r.locais), pessoas: quantos(r && r.pessoas),
               fatos: quantos(r && r.fatos), fios: quantos(r && r.fios) }
    };
  },

  /* Os pares que a tela oferece como filtro. "Tudo" primeiro. */
  PARES: [
    { id: 'tudo',     rotulo: 'Tudo' },
    { id: 'arbitro',  rotulo: 'Mesa ↔ Árbitro' },
    { id: 'cronista', rotulo: 'Mesa ↔ Cronista' },
    { id: 'modulo',   rotulo: 'Módulos' },
    { id: 'erro',     rotulo: 'Só o que falhou' }
  ],

  /* O QUE A ABA ESTÁ MOSTRANDO — filtro, linha aberta, e o pisca do
     travinha de segurança do botão de limpar.

     Mora aqui, e não em `M`, pela mesma razão do item 2 lá em cima:
     `M` inteiro vai para o localStorage e para o Módulo 3 a cada
     turno, e escolha de filtro de tela não é estado de jogo. Some ao
     recarregar, junto com o registro que ela filtra. */
  vista: { par: 'tudo', aberta: 0, armado: false },

  filtrar(par) {
    if (!par || par === 'tudo') return this.linhas.slice();
    if (par === 'erro') return this.linhas.filter(l => l.erro);
    return this.linhas.filter(l => l.de === par || l.para === par);
  },

  limpar() { this.linhas = []; this.total = 0; this._seq = 0; this.vista.aberta = 0; this.vista.armado = false; },

  /* Para o botão de copiar: uma linha por linha, legível fora daqui.
     A carga vai junto, porque é ela que se quer colar num relatório. */
  comoTexto(par) {
    return this.filtrar(par).map(l => {
      const hora = new Date(l.ts).toLocaleTimeString('pt-BR', { hour12: false });
      const cabeca = `${hora}  ${this.LADOS[l.de].nome} → ${this.LADOS[l.para].nome}`
        + `  [${l.via}]  ${l.assunto}${l.ms != null ? `  ${l.ms} ms` : ''}`
        + `${l.erro ? `  ERRO: ${l.erro}` : ''}`;
      return l.carga ? `${cabeca}\n${l.carga}` : cabeca;
    }).join('\n\n');
  }
};

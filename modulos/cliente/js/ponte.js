/* ============================================================
   VITÆ — A Ponte com os módulos  (Cliente → Módulos, §85)
   ------------------------------------------------------------
   Isto é o item M2, e o item M2 é o seguinte: desde a §78 os
   módulos existem, respondem e têm teste — e **o navegador não
   chamava nenhum deles**. A ficha morava no `localStorage`, a
   sessão também, e as rotas ficavam ali esperando.

   Esta camada liga os dois lados. Ela é a ÚNICA parte do Cliente
   que sabe que existe servidor: `mesa.js`, `app.js`, `fichas.js`
   e `sessoes.js` continuam chamando o que sempre chamaram.

   ------------------------------------------------------------
   O DESENHO, E POR QUE ELE NÃO É "TROCAR localStorage POR HTTP"
   ------------------------------------------------------------
   Duas restrições que não dá para negociar:

   1. **O front é síncrono.** `salvarMesa()` roda a cada mutação de
      estado — 45 chamadas espalhadas — e devolve booleano.
      `listarFichas()` é chamada DENTRO de uma template string, no
      meio do render. Transformar as duas em `async` reescreveria o
      front inteiro, e não é isso que o M2 pede.

   2. **O app tem de funcionar com os módulos fora.** É a regra do
      projeto desde a §16, e vale aqui igual: sem ollama a mesa cai
      no determinístico e DIZ que caiu; sem MesaServer ela joga
      local e diz isso também.

   Então a Ponte é **espelho, não substituto**:

     · o `localStorage` continua sendo a gravação IMEDIATA, e é o
       que faz o F5 funcionar sem servidor nenhum;
     · a Ponte espelha para os módulos em segundo plano, com
       represa — a pasta da sessão, o autosave e o checkin passam a
       existir de verdade;
     · na abertura, ela traz do servidor o que o navegador não tem,
       e manda redesenhar.

   O que NÃO é espelho, e vai direto ao módulo: o **checkout**, o
   **checkin** e a **rolagem** — os três pontos onde a resposta do
   servidor muda o que acontece na tela.

   NADA AQUI ESTOURA PARA CIMA. Toda chamada devolve um resultado
   com `ok`, e quando não deu certo o motivo fica em `Ponte.motivo`
   e aparece no painel da capa.
   ============================================================ */

const Ponte = {

  /* ----------------------------------------------------------
     O QUE ESTÁ DE PÉ
     ---------------------------------------------------------- */
  ligada: false,          /* o MesaServer respondeu */
  fichaServer: false,     /* o FichaServer respondeu */
  arbitro: false,         /* o ArbitroServer respondeu */
  portaMesa: 0,           /* para o WebSocket, que não passa pelo Gateway */
  guardador: '',          /* 'mongo' ou 'pasta', quando há FichaServer */
  motivo: 'ainda não perguntei',
  sessaoId: '',           /* a sessão aberta no Módulo 3, se houver */

  TEMPO: 6000,

  /* TODO O HTTP DE MÓDULO PASSA POR AQUI, e é por isso que o gancho do
     tráfego mora neste lugar e em nenhum outro: um ponto só registra
     tudo, e não há como uma rota nova escapar do registro por
     esquecimento. (§93)

     O `de`/`para` é escolhido pelo CAMINHO, e não por quem chamou: a
     Mesa fala com o Árbitro pelo `/api/arbitro`, com o Cronista pelo
     `/api/narrador`, e com os outros três módulos como "Módulos". */
  _lado(caminho) {
    if (/\/api\/arbitro/.test(caminho)) return 'arbitro';
    if (/\/api\/(narrador|cronista|intencao)/.test(caminho)) return 'cronista';
    return 'modulo';
  },

  async _pedir(caminho, opcoes = {}) {
    /* `AbortSignal.timeout` não existe em navegador muito velho nem no
       `vm` dos testes sem o extra; sem ele a chamada só não desiste. */
    const corte = (typeof AbortSignal !== 'undefined' && AbortSignal.timeout)
      ? { signal: AbortSignal.timeout(this.TEMPO) } : {};
    const metodo = (opcoes.method || 'GET').toUpperCase();
    const outroLado = this._lado(caminho);
    const anota = (typeof Trafego !== 'undefined');
    const t0 = Date.now();
    if (anota) {
      Trafego.registrar({ de: 'mesa', para: outroLado, via: 'http',
        assunto: `${metodo} ${caminho} →`,
        dados: opcoes.body ? Trafego._talvezObjeto(opcoes.body) : undefined });
    }
    try {
      const r = await fetch(caminho, Object.assign({ cache: 'no-store' }, corte, opcoes));
      const corpo = await r.json().catch(() => ({}));
      if (anota) {
        Trafego.registrar({ de: outroLado, para: 'mesa', via: 'http',
          assunto: `${metodo} ${caminho} ← ${r.status}`, ms: Date.now() - t0,
          erro: r.ok ? '' : `HTTP ${r.status}`, dados: corpo });
      }
      return { ok: r.ok, status: r.status, corpo };
    } catch (e) {
      if (anota) {
        Trafego.registrar({ de: outroLado, para: 'mesa', via: 'http',
          assunto: `${metodo} ${caminho} ✕`, ms: Date.now() - t0, erro: e.message });
      }
      return { ok: false, status: 0, corpo: {}, erro: e.message };
    }
  },

  _postar(caminho, corpo, metodo = 'POST') {
    return this._pedir(caminho, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo || {})
    });
  },

  /** Pergunta o que existe. Chamada na abertura e pelo painel da capa. */
  async descobrir() {
    const m = await this._pedir('/api/mesa/saude');
    this.ligada = !!(m.ok && m.corpo.modulo === 'mesa');
    this.portaMesa = this.ligada ? (m.corpo.porta || 0) : 0;

    const f = await this._pedir('/api/ficha/saude');
    this.fichaServer = !!(f.ok && f.corpo.modulo === 'ficha');
    this.guardador = this.fichaServer ? ((f.corpo.guardador || {}).tipo || '') : '';

    const a = await this._pedir('/api/arbitro/saude');
    this.arbitro = !!(a.ok && a.corpo.modulo === 'arbitro');

    this.motivo = this.ligada
      ? (this.fichaServer ? '' : 'O FichaServer não respondeu: as fichas ficam no navegador.')
      : (m.erro || `O MesaServer não respondeu (${m.status}).`);
    return { ligada: this.ligada, fichaServer: this.fichaServer,
             arbitro: this.arbitro, motivo: this.motivo };
  },

  /* ==========================================================
     FICHAS  —  espelho de mão dupla
     ========================================================== */

  /** Traz do FichaServer o que o navegador não tem. Devolve quantas entraram. */
  async sincronizarFichas() {
    if (!this.fichaServer) return { ok: false, novas: 0, motivo: 'sem FichaServer' };
    const r = await this._pedir('/api/ficha');
    if (!r.ok) return { ok: false, novas: 0, motivo: `HTTP ${r.status}` };

    let novas = 0;
    for (const resumo of (r.corpo.fichas || [])) {
      const local = fichaPorId(resumo.fichaId);
      /* O servidor só vence quando a cópia dele é MAIS NOVA. Sem esta
         comparação, abrir o app desfaria a última edição feita offline —
         que é o pior defeito possível numa sincronização. */
      if (local && (local.guardadaEm || 0) >= (resumo.guardadaEm || 0)) continue;
      const inteira = await this._pedir(`/api/ficha/${encodeURIComponent(resumo.fichaId)}`);
      if (!inteira.ok || !inteira.corpo.ficha) continue;
      /* NORMALIZA ANTES DE ENTRAR.  (§85)

         Ficha que vem de fora pode estar incompleta — de uma versão
         antiga do app, de outra máquina, ou simplesmente parcial. E
         `resumoDaFicha` lê `f.atributos.forca` sem perguntar: uma ficha
         sem `atributos` derruba a tela da biblioteca inteira.

         Foi um teste que achou isto, e não em asserção: o erro vazou
         DEPOIS que o teste terminou, como atividade assíncrona órfã.

         `guardarFicha` da área Ficha é LOCAL — ela não conhece a Ponte,
         e é isso que impede o eco de voltar ao servidor. */
      const completa = Object.assign(FICHA_VAZIA(), inteira.corpo.ficha);
      if (guardarFicha(completa)) novas++;
    }
    return { ok: true, novas };
  },

  /** Manda uma ficha para o servidor. Sem esperar: quem chamou já gravou local. */
  guardarFicha(f) {
    if (!this.fichaServer || !f || !f.nome) return;
    this._postar('/api/ficha', { ficha: f }).then(r => {
      if (!r.ok) console.warn('[ponte] o FichaServer recusou a ficha:', r.status, r.corpo.erro);
    });
  },

  apagarFicha(id) {
    if (!this.fichaServer || !id) return;
    this._pedir(`/api/ficha/${encodeURIComponent(id)}`, { method: 'DELETE' }).then(r => {
      if (!r.ok && r.status !== 404) console.warn('[ponte] não apaguei no servidor:', r.status);
    });
  },

  /* ==========================================================
     SESSÃO  —  checkout, espelho, checkin
     ========================================================== */

  /** CHECKOUT. Vai direto ao módulo: a resposta decide o que a mesa mostra. */
  async abrirSessao(ficha, campanha = null) {
    this.sessaoId = '';
    if (!this.ligada) return { ok: false, motivo: 'sem MesaServer' };
    /* Manda a ficha JUNTO com o id: se o FichaServer estiver fora, o
       Módulo 3 usa esta e marca `origemDaFicha: cliente`. É o contrato
       que `cliente-ficha.mjs` escreveu na §78. */
    const r = await this._postar('/api/mesa/sessoes',
      { fichaId: ficha.fichaId || '', ficha, campanha });
    if (!r.ok || !r.corpo.id) {
      return { ok: false, motivo: r.corpo.erro || `HTTP ${r.status}` };
    }
    this.sessaoId = r.corpo.id;
    return { ok: true, id: r.corpo.id, origemDaFicha: r.corpo.origemDaFicha };
  },

  /** Reata uma sessão que já existia no servidor, ao voltar para ela. */
  async reatarSessao(id) {
    this.sessaoId = '';
    if (!this.ligada || !id) return { ok: false };
    const r = await this._pedir(`/api/mesa/sessoes/${encodeURIComponent(id)}`);
    if (!r.ok) return { ok: false, motivo: `HTTP ${r.status}` };
    this.sessaoId = id;
    return { ok: true, estado: r.corpo };
  },

  /* ----------------------------------------------------------
     O ESPELHO, COM REPRESA

     `salvarMesa()` roda a cada tecla de rascunho e a cada clique.
     Espelhar cada uma seria uma requisição por caractere digitado.
     A represa junta o que mudou e manda uma vez.
     ---------------------------------------------------------- */
  INTERVALO_ESPELHO: 1500,
  _represa: null,
  _turnosEnviados: 0,
  espelhadas: 0,

  espelhar(M) {
    if (!this.ligada || !this.sessaoId || !M || !M.ficha) return false;
    if (this._represa) return true;
    this._represa = setTimeout(() => {
      this._represa = null;
      this._despejar(M).catch(e => console.warn('[ponte] espelho falhou:', e.message));
    }, this.INTERVALO_ESPELHO);
    return true;
  },

  async _despejar(M) {
    const id = this.sessaoId;
    if (!id) return;
    /* A ficha e o mundo vão como estão; o histórico vai só o que ainda
       não foi — é o mesmo raciocínio do `historicoPendente` do módulo,
       do lado de cá do fio. */
    await this._postar(`/api/mesa/sessoes/${id}/ficha`, { mudancas: M.ficha }, 'PATCH');
    await this._postar(`/api/mesa/sessoes/${id}/mundo`, { mudancas: {
      cena: M.cena, locais: M.locais, pessoas: M.pessoas, fatos: M.fatos, fios: M.fios,
      estados: M.estados, bolsa: M.bolsa, combate: M.combate, campanha: M.campanha,
      diretor: M.diretor,
      abas: { aba: M.aba, modo: M.modo, itemAberto: M.itemAberto, rascunho: M.rascunho }
    } }, 'PATCH');

    const novos = (M.mensagens || []).slice(this._turnosEnviados);
    if (novos.length) {
      const r = await this._postar(`/api/mesa/sessoes/${id}/turno`, { entradas: novos });
      if (r.ok) this._turnosEnviados = (M.mensagens || []).length;
    }
    this.espelhadas++;
  },

  /** Força o despejo agora — antes de um checkin, ou ao sair da mesa. */
  async espelharAgora(M) {
    if (this._represa) { clearTimeout(this._represa); this._represa = null; }
    if (!this.ligada || !this.sessaoId) return false;
    await this._despejar(M);
    return true;
  },

  /** A prévia do que mudou desde o checkout — para a tela do aceite. */
  async alteracoes() {
    if (!this.ligada || !this.sessaoId) return null;
    const r = await this._pedir(`/api/mesa/sessoes/${this.sessaoId}/alteracoes`);
    return r.ok ? (r.corpo.alteracoes || []) : null;
  },

  /** CHECKIN. Sem `aceite` isto é prévia, e o módulo devolve 409. */
  async checkin({ aceite = false } = {}) {
    if (!this.ligada || !this.sessaoId) return { ok: false, motivo: 'sem sessão no servidor' };
    const r = await this._postar(`/api/mesa/sessoes/${this.sessaoId}/checkin`, { aceite });
    /* 200 gravou no FichaServer; 202 gravou só na pasta da sessão, e o
       pacote volta para o Cliente. Os dois são respostas, não falhas —
       e a diferença precisa chegar ao jogador. */
    return { ok: r.ok, status: r.status, ...r.corpo };
  },

  async encerrarSessao({ aceite = false, comCheckin = true } = {}) {
    if (!this.ligada || !this.sessaoId) return { ok: false };
    const r = await this._postar(`/api/mesa/sessoes/${this.sessaoId}/encerrar`,
      { aceite, comCheckin });
    if (r.ok) { this.sessaoId = ''; this._turnosEnviados = 0; }
    return { ok: r.ok, status: r.status, ...r.corpo };
  },

  /* ==========================================================
     ROLAGEM  —  §82, com a Mesa rolando de verdade
     ========================================================== */

  /**
   * Os três passos, com o passo 2 no servidor. Devolve `null` quando
   * não deu — e quem chamou rola local, como sempre fez.
   */
  async rolar(pedido) {
    if (!this.ligada || !this.sessaoId) return null;
    const r = await this._postar(`/api/mesa/sessoes/${this.sessaoId}/rolagem`, { pedido });
    if (!r.ok || !r.corpo.valores) return null;
    return r.corpo;
  },

  /* ==========================================================
     O ÁRBITRO DO SERVIDOR  (§87, item M8)

     O Módulo 4 existia desde a §84 e ninguém o consultava. E a
     pendência dizia a verdade incômoda: **é o mesmo código.** A §84
     carrega os mesmos arquivos num `node:vm`, então pedir a ele o
     que o navegador já sabe calcular não corrige regra nenhuma.

     Então por que consultar?

     1. **Porque as duas cópias PODEM divergir, e hoje ninguém
        notaria.** Não por regra diferente — por navegador com `.js`
        velho em cache (é a §36, o defeito mais caro deste projeto),
        por módulo subido antes de uma correção, por `data-*.js`
        editado de um lado só. Duas respostas para a mesma pergunta,
        vindas de runtimes diferentes, viram uma CONFERÊNCIA — e o
        que era código duplicado passa a ser segunda opinião.

     2. **Porque fecha a cadeia da §82 do lado do servidor:** o
        Árbitro diz quais dados (5176), a Mesa roda e grava (5175), o
        Árbitro apura e confere a quantidade (5176). O navegador
        desenha.

     Quando o módulo não responde, tudo isto some e o turno resolve
     local — como resolveu até aqui.
     ========================================================== */

  divergencias: 0,
  ultimaDivergencia: null,

  /** PASSO 1 no servidor. Devolve `{ pedido, composicao }` ou null. */
  async pedidoDoArbitro(situacao) {
    if (!this.arbitro) return null;
    const r = await this._postar('/api/arbitro/pedido', situacao);
    if (!r.ok || !r.corpo.pedido) return null;
    return r.corpo;
  },

  /** PASSO 3 no servidor. Devolve `{ veredito, descricao }` ou null. */
  async apurarNoArbitro(pedido, valores) {
    if (!this.arbitro) return null;
    const r = await this._postar('/api/arbitro/apurar', { pedido, valores });
    if (!r.ok || !r.corpo.veredito) return null;
    return r.corpo;
  },

  /**
   * Compara duas respostas para a mesma pergunta e registra quando
   * elas diferem. NÃO decide quem vence — só conta e diz.
   *
   * Quem vence é sempre o servidor, quando ele respondeu: se as duas
   * discordam, a do navegador é a suspeita (cache velho é a causa
   * provável, e o servidor não tem cache).
   */
  conferir(assunto, local, doServidor, campos) {
    if (!local || !doServidor) return true;
    const diferentes = campos.filter(c => JSON.stringify(local[c]) !== JSON.stringify(doServidor[c]));
    if (!diferentes.length) return true;
    this.divergencias++;
    this.ultimaDivergencia = {
      assunto, campos: diferentes, em: Date.now(),
      local: Object.fromEntries(diferentes.map(c => [c, local[c]])),
      servidor: Object.fromEntries(diferentes.map(c => [c, doServidor[c]]))
    };
    /* Alto no console, e de propósito: isto quer dizer que o navegador
       e o servidor discordam sobre a REGRA, e a causa mais provável é
       um `.js` velho em cache — o defeito da §36. */
    console.warn(`[ponte] o Árbitro do servidor discorda do navegador em "${assunto}":`,
      diferentes.map(c => `${c} local=${JSON.stringify(local[c])} servidor=${JSON.stringify(doServidor[c])}`).join(' · '),
      '— recarregue a página (Ctrl+F5); se persistir, o módulo está numa versão diferente.');
    return false;
  },

  /* ==========================================================
     O CANAL EM TEMPO REAL
     Direto na porta do módulo: ele não passa pelo Gateway (§78.3).
     ========================================================== */
  _canal: null,
  eventos: 0,

  /* O canal pode mandar texto solto, e isso é legítimo: quem ouve decide.
     O `null` sai por `return`, e não por variável atribuída dentro de um
     `catch` mudo — a regra da §44, que o próprio teste cobrou aqui. */
  _talvezJSON(texto) {
    try { return JSON.parse(texto); }
    catch (e) { return null; }
  },

  ouvir(aoEvento) {
    if (!this.ligada || !this.portaMesa || !this.sessaoId) return false;
    if (typeof WebSocket === 'undefined') return false;
    this.calar();
    try {
      const url = `ws://127.0.0.1:${this.portaMesa}/mesa/ws?sessao=${encodeURIComponent(this.sessaoId)}`;
      const c = new WebSocket(url);
      c.onmessage = (ev) => {
        this.eventos++;
        const d = this._talvezJSON(ev.data);
        /* §93 — o canal só AVISA (§78.3), mas o aviso também é conversa,
           e sem ele o Debug mostraria só metade do que a Mesa recebe. */
        if (typeof Trafego !== 'undefined') {
          Trafego.registrar({ de: 'modulo', para: 'mesa', via: 'ws',
            assunto: `canal — ${(d && d.tipo) || 'evento'}`, dados: d || ev.data });
        }
        if (d && aoEvento) aoEvento(d);
      };
      /* Canal caído não é falha de jogo: ele só AVISA, e tudo o que ele
         avisaria já passou pelas rotas HTTP. Um aviso no console basta. */
      c.onerror = () => console.warn('[ponte] o canal em tempo real caiu.');
      c.onclose = () => { this._canal = null; };
      this._canal = c;
      return true;
    } catch (e) {
      console.warn('[ponte] não abri o canal:', e.message);
      return false;
    }
  },

  calar() {
    if (this._canal) { try { this._canal.close(); } catch (e) { console.warn('[ponte] fechar o canal:', e.message); } }
    this._canal = null;
  },

  /** Só para os testes: esquece o que sabia, sem tocar em nada. */
  _esquecer() {
    this.ligada = false; this.fichaServer = false; this.arbitro = false; this.portaMesa = 0;
    this.divergencias = 0; this.ultimaDivergencia = null;
    this.sessaoId = ''; this._turnosEnviados = 0; this.espelhadas = 0; this.eventos = 0;
    if (this._represa) { clearTimeout(this._represa); this._represa = null; }
    this.calar();
  }
};

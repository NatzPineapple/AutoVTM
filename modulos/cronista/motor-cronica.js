/* ============================================================
   VITÆ — Sistema especialista da crônica
   O que o Especialista faz para a REGRA, este faz para a MEMÓRIA:
   recebe a sessão inteira e decide o que dela merece atravessar.

   Mesma forma da cadeia de arbitragem (§38): regras declarativas
   com condição e efeito, encadeamento para frente, e RASTRO de
   quem disparou. Regra nova entra na lista; o motor não muda.

   Duas diferenças de escopo em relação ao Especialista:

   1. Aqui existe ORÇAMENTO. A janela de contexto é finita, e uma
      sessão de sessenta turnos não cabe nela. Cada evento carrega
      um peso, e o corte é por peso, não pelo fim da lista.
   2. Aqui a pergunta não é "isso é possível" e sim "isso importa".
      Quem responde onde as coisas estão continua sendo o Grafo.
   ============================================================ */

const Cronica = {

  MAXIMO_CICLOS: 8,

  /* ------------------------------------------------------------
     A CONTA DA JANELA, EM UM LUGAR SÓ

     Ela estava espalhada num comentário, e o comentário estava certo
     e incompleto: 3.573 de prefixo mais 4.000 de eventos mais 400 de
     saída dão 7.973 numa janela de 8.192. Sobravam 219 tokens — e
     fatos e fios entravam por cima disso, inteiros, porque viajavam
     por campo próprio e não passavam por orçamento nenhum (§51.2).

     Com quarenta fatos, o pedido estourava a janela e o modelo
     truncava a entrada pela frente: o Cronista perdia o começo da
     noite sem que nada avisasse. É a mesma classe do estouro que a
     §41 fechou para os eventos, pela porta que ficou aberta.

     Agora os tetos são DERIVADOS da janela, e há teste conferindo que
     a soma cabe. Um número não pode subir sem outro descer.
     ------------------------------------------------------------ */
  JANELA_TOKENS: 8192,
  PREFIXO_TOKENS: 3573,      // medido em contexto.mjs, §29
  SAIDA_TOKENS: 400,
  MARGEM_TOKENS: 200,        // a contagem por caractere é aproximada

  /* O que sobra, repartido. Eventos levam a maior parte porque são a
     noite; estado leva o bastante para caber a lista do que existe. */
  get CORPO_TOKENS() {
    return this.JANELA_TOKENS - this.PREFIXO_TOKENS - this.SAIDA_TOKENS - this.MARGEM_TOKENS;
  },
  get ORCAMENTO_TOKENS() { return this.CORPO_TOKENS - this.RESERVA_ESTADO_TOKENS; },

  TOKENS_POR_CARACTERE: 1 / 3.6,

  PESOS: {
    fato: 100,
    fio: 95,
    barrado: 80,
    cena: 70,
    rolagemBestial: 65,
    combate: 60,
    jogador: 40,
    narracao: 30,
    rolagem: 20,
    sistema: 10
  },

  memoriaDe({ mesa, tipo = 'capitulo', grafo = null }) {
    const f = (mesa && mesa.ficha) || {};
    return {
      mesa, tipo, ficha: f,
      grafo: grafo || (typeof Grafo !== 'undefined' ? Grafo.de(mesa || {}) : null),
      perfil: typeof Seitas !== 'undefined' ? Seitas.perfil(f.seita) : null,
      derivados: typeof derivados === 'function' ? derivados(f) : {},
      trilhas: typeof Estado !== 'undefined' ? Estado.trilhas(f) : null,

      eventos: [], mudancas: [], preco: [], marcas: [], relacoes: [],
      cortados: 0, rastro: []
    };
  },

  /* ---------- coleta: a sessão vira eventos com peso ---------- */

  encolher(t, max = 220) {
    const limpo = String(t || '')
      .replace(/\[\[(?:pessoa|local):([a-z0-9_]+)(?:\|[^\]]+)?\]\]/gi, '$1')
      .replace(/\*\*|\*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return limpo.length > max ? limpo.slice(0, max - 1) + '…' : limpo;
  },

  coletar(m) {
    const mesa = m.mesa || {};
    const brutos = [];
    let ordem = 0;

    for (const msg of mesa.mensagens || []) {
      ordem++;
      if (msg.autor === 'cena' && msg.titulo) {
        brutos.push({ ordem, peso: this.PESOS.cena,
          texto: `Cena: ${msg.titulo}${msg.sub ? ` — ${this.encolher(msg.sub, 140)}` : ''}` });
      } else if (msg.autor === 'jogador') {
        brutos.push({ ordem, peso: this.PESOS.jogador,
          texto: `Jogador (${msg.modo || 'agir'}): ${this.encolher(msg.texto)}` });
      } else if (msg.autor === 'narrador') {
        brutos.push({ ordem, peso: this.PESOS.narracao,
          texto: `Narração: ${this.encolher(msg.texto)}` });
      } else if (msg.autor === 'sistema' && msg.texto) {
        const grave = /torpor|morre|não levanta|Morte Final|frenesi|Mácula/i.test(msg.texto);
        brutos.push({ ordem, peso: grave ? this.PESOS.combate : this.PESOS.sistema,
          texto: `Sistema: ${this.encolher(msg.texto)}` });
      } else if (msg.autor === 'arbitro' && msg.veredito) {
        const b = (msg.veredito.bloqueios || [])[0];
        if (b) brutos.push({ ordem, peso: this.PESOS.barrado,
          texto: `Barrado: ${this.encolher(b.motivo, 140)}` });
      } else if (msg.autor === 'rolagem' && msg.resultado) {
        const r = msg.resultado;
        const marcante = ['bestial', 'perigo', 'critico', 'total'].includes(r.tipo);
        brutos.push({ ordem, peso: marcante ? this.PESOS.rolagemBestial : this.PESOS.rolagem,
          texto: `Teste de ${r.rotulo}: ${r.tipo}` });
      }
    }

    for (const r of mesa.registro || []) {
      ordem++;
      brutos.push({ ordem, peso: this.PESOS.sistema, texto: this.encolher(r.texto) });
    }

    return brutos.filter(x => x.texto);
  },

  /* ------------------------------------------------------------
     FATOS E FIOS TAMBÉM TÊM TETO

     Eles não são eventos da sessão: são estado, e chegam ao Cronista
     por campo próprio em `pedidoDe`. Por isso ficavam FORA do
     orçamento — e `PESOS.fato` (100) e `PESOS.fio` (95), os dois
     maiores da tabela, estavam declarados sem nunca serem usados.

     Peso que nada aplica é regra morta, e esta escondia um buraco de
     verdade: cinquenta fatos de 180 caracteres são ~2.500 tokens que
     entravam por cima dos 4.000 já contados, mais o prefixo de 3.573,
     numa janela de 8.192. O orçamento por peso fechou o estouro dos
     eventos (§41) e deixou este aberto.

     A reserva é pequena de propósito: fato e fio são linha de uma
     frase, e o que interessa ao Cronista é QUAIS existem, não a
     redação de cada um. Achado pelo teste que perguntou se todo peso
     declarado é usado.
     ------------------------------------------------------------ */
  RESERVA_ESTADO_TOKENS: 500,

  caberEstado(mesa) {
    const limite = this.RESERVA_ESTADO_TOKENS;
    const custo = (t) => Math.ceil((String(t || '').length + 1) * this.TOKENS_POR_CARACTERE);

    const candidatos = [
      ...(mesa.fatos || []).map((x, i) => ({ tipo: 'fato', i, peso: this.PESOS.fato,
        item: x, custo: custo(x.titulo) + custo(x.texto) })),
      /* Fio fechado não é dívida em aberto: cede a vez ao que ainda
         cobra alguma coisa do personagem. */
      ...(mesa.fios || []).map((x, i) => ({ tipo: 'fio', i,
        peso: this.PESOS.fio - (x.estado === 'fechado' ? 40 : 0),
        item: x, custo: custo(x.titulo) }))
    ];

    /* PISO PARA O QUE ESTÁ EM ABERTO.

       Peso puro dava um resultado ruim e mensurável: com 80 fatos e 40
       fios, sobrava UM fio. Fato pesa 100 e fio 95, então fato ganha
       sempre — e fio aberto é o gancho do próximo capítulo. Perder 39
       de 40 é perder a continuidade da crônica para caber o passado.

       Então um terço da reserva é dos fios abertos, se houver. O resto
       é disputado por peso, como antes. */
    const abertos = candidatos.filter(c => c.tipo === 'fio' && c.item.estado !== 'fechado');
    const piso = Math.floor(limite / 3);
    const mantidos = new Set();
    let usado = 0, cortados = 0;

    for (const c of abertos.slice().sort((a, b) => b.i - a.i)) {
      if (usado + c.custo > piso) break;
      mantidos.add(c); usado += c.custo;
    }

    const porImportancia = candidatos.slice().sort((a, b) => b.peso - a.peso || b.i - a.i);
    for (const c of porImportancia) {
      if (mantidos.has(c)) continue;
      if (usado + c.custo > limite) { cortados++; continue; }
      mantidos.add(c); usado += c.custo;
    }
    const daOrdem = (tipo) => candidatos
      .filter(c => c.tipo === tipo && mantidos.has(c))
      .sort((a, b) => a.i - b.i)
      .map(c => c.item);

    return { fatos: daOrdem('fato'), fios: daOrdem('fio'), cortados, tokens: usado };
  },

  /* Corte por peso, com a ordem preservada na saída. O que sai é o
     de menor peso, e empate desempata pelo mais antigo — o fim da
     sessão é o que o jogador lembra. */
  caber(m, brutos) {
    const limite = this.ORCAMENTO_TOKENS;
    /* +1 caractere pela quebra de linha que o join() põe entre os eventos:
       sem isso o total medido depois estoura o teto por pouco. */
    const custo = (t) => Math.ceil((t.length + 1) * this.TOKENS_POR_CARACTERE);

    let total = brutos.reduce((a, x) => a + custo(x.texto), 0);
    if (total <= limite) return brutos.slice().sort((a, b) => a.ordem - b.ordem);

    const porImportancia = brutos.slice()
      .sort((a, b) => b.peso - a.peso || b.ordem - a.ordem);
    const mantidos = [];
    let usado = 0;
    for (const x of porImportancia) {
      const c = custo(x.texto);
      if (usado + c > limite) { m.cortados++; continue; }
      mantidos.push(x); usado += c;
    }
    return mantidos.sort((a, b) => a.ordem - b.ordem);
  },

  /* ---------- as regras ---------- */

  REGRAS: [
    {
      id: 'coleta', prioridade: 5,
      quando: (m) => !m.eventos.length,
      entao: (m) => {
        const brutos = Cronica.coletar(m);
        m.brutos = brutos.length;
        m.eventos = Cronica.caber(m, brutos).map(x => x.texto);
      }
    },
    {
      id: 'fome', prioridade: 10,
      quando: () => true,
      entao: (m) => {
        m.mudancas.push([
          'a Fome está quieta', 'a Fome está quieta', 'a Fome incomoda',
          'a Fome pesa em tudo que ela olha',
          'a Fome domina: pessoas viraram quantidade',
          'a Besta está no volante'
        ][Math.min(5, m.ficha.fome || 0)]);
        if ((m.ficha.fome || 0) >= 4) m.preco.push('A noite terminou com a Fome alta.');
      }
    },
    {
      id: 'vitalidade', prioridade: 11,
      quando: (m) => !!m.trilhas,
      entao: (m) => {
        const t = m.trilhas;
        if (t.vitalidade.agr > 0) {
          m.mudancas.push('carrega ferida que não fecha antes de alimentar farto');
          m.preco.push('Há dano Agravado, e ele custa três Checagens de Sangue por noite.');
          m.marcas.push({ texto: 'Ferida que não fechou antes do fim da história.', tipo: 'cicatriz' });
        }
        if (t.vitalidade.livres === 0) m.mudancas.push('a trilha de Vitalidade encheu: está Debilitada');
        else if (t.vitalidade.livres < t.vitalidade.max) m.mudancas.push('saiu machucada, mas de pé');
        else m.mudancas.push('saiu sem um arranhão');
      }
    },
    {
      id: 'vontade', prioridade: 12,
      quando: (m) => !!m.trilhas,
      entao: (m) => {
        const t = m.trilhas;
        if (t.vontade.livres === 0) m.mudancas.push('a Força de Vontade acabou');
        else if (t.vontade.livres < t.vontade.max) m.mudancas.push('gastou vontade para se segurar');
        if ((m.ficha.danoVontade || 0) > 0) m.preco.push('A Força de Vontade saiu gasta.');
      }
    },
    {
      id: 'maculas', prioridade: 13,
      quando: (m) => (m.ficha.maculas || 0) > 0,
      entao: (m) => {
        const n = m.ficha.maculas || 0;
        const rotulo = m.perfil ? m.perfil.bussola.rotulo : 'Humanidade';
        m.mudancas.push(n === 1
          ? `ficou uma Mácula na trilha de ${rotulo}`
          : `ficaram várias Máculas na trilha de ${rotulo}`);
        m.preco.push(n === 1
          ? 'Ficou uma Mácula para o teste de Remorso.'
          : `Ficaram ${n} Máculas para o teste de Remorso.`);
        m.marcas.push({ texto: 'Fez algo que não consegue desfazer, e sabe disso.', tipo: 'trauma' });
      }
    },
    {
      id: 'degeneracao', prioridade: 14,
      quando: (m) => !!m.trilhas && m.trilhas.humanidade.vazias === 0 && (m.ficha.maculas || 0) > 0,
      entao: (m) => {
        m.mudancas.push('as Máculas transbordaram a trilha: degeneração');
        m.preco.push('Degeneração: Debilitado em todas as paradas, e dano Agravado na Vontade.');
      }
    },
    {
      id: 'bussola-baixa', prioridade: 15,
      quando: (m) => (m.derivados.humanidade || 10) <= 4,
      entao: (m) => {
        const rotulo = m.perfil ? m.perfil.bussola.rotulo : 'Humanidade';
        m.mudancas.push(`a ${rotulo} dela já está perigosamente baixa`);
        m.marcas.push({ texto: 'A cidade começou a reparar no que ele virou.', tipo: 'reputacao' });
      }
    },
    {
      id: 'estados-que-ficaram', prioridade: 16,
      quando: (m) => !!(m.mesa && m.mesa.estados && m.mesa.estados.length),
      entao: (m) => {
        m.mudancas.push(`ainda está: ${m.mesa.estados
          .map(e => (Arbitro.ESTADOS[e] || {}).nome || e).join(', ')}`);
      }
    },
    {
      id: 'relacoes-relevantes', prioridade: 20,
      quando: (m) => m.tipo === 'dossie',
      entao: (m) => {
        const vistos = Cronica.tocados(m);
        m.relacoes = (m.mesa.pessoas || [])
          .filter(p => p.relacao && p.conhecido !== false && vistos.has(p.id));
        m.tocados = vistos;
      }
    },
    {
      id: 'posses-da-bolsa', prioridade: 21,
      quando: (m) => m.tipo === 'dossie' && !!(m.mesa.bolsa && m.mesa.bolsa.length),
      entao: (m) => {
        m.posses = (m.mesa.bolsa || [])
          .map(i => ({ nome: i.nome, comoVeio: i.comoVeio || 'veio desta crônica' }));
      }
    }
  ],

  /* Quem entrou na história. O Grafo responde melhor que regex:
     ele já sabe quem está na cena e o que você carrega. O texto
     ainda é varrido, porque citar alguém também conta. */
  tocados(m) {
    const ids = new Set();
    const mesa = m.mesa || {};

    if (m.grafo && typeof Grafo !== 'undefined') {
      const ctx = Grafo.contexto(m.grafo, 'voce');
      ctx.presentes.forEach(p => ids.add(p.id));
      Grafo.vizinhos(m.grafo, 'voce', 'carrega').forEach(id => {
        const dono = Grafo.vizinhos(m.grafo, id, 'carregado_por')[0];
        if (dono && dono !== 'voce') ids.add(dono);
      });
    }
    for (const id of (mesa.cena && mesa.cena.presentes) || []) ids.add(id);

    const varrer = (t) => {
      const texto = String(t || '');
      let x;
      const re = /\[\[pessoa:([a-z0-9_]+)(?:\|[^\]]+)?\]\]/gi;
      while ((x = re.exec(texto))) ids.add(x[1]);
      for (const p of mesa.pessoas || []) {
        if (!p.nome) continue;
        const curto = String(p.nome).split(/\s+/)[0];
        if (curto.length > 2 &&
            new RegExp(`\\b${curto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(texto)) {
          ids.add(p.id);
        }
      }
    };

    for (const msg of mesa.mensagens || []) {
      if (msg.alvoFala && msg.alvoFala !== 'geral') ids.add(msg.alvoFala);
      varrer(msg.texto); varrer(msg.titulo);
    }
    for (const r of mesa.registro || []) varrer(r.texto);
    for (const x of mesa.fatos || []) { varrer(x.titulo); varrer(x.texto); }
    for (const x of mesa.fios || []) varrer(x.titulo);
    for (const o of (mesa.combate && mesa.combate.oponentes) || []) varrer(o.nome);
    return ids;
  },

  avaliar(entrada) {
    const m = this.memoriaDe(entrada);
    const disparadas = new Set();
    const ordenadas = this.REGRAS.slice().sort((a, b) => a.prioridade - b.prioridade);

    for (let ciclo = 0; ciclo < this.MAXIMO_CICLOS; ciclo++) {
      let mudou = false;
      for (const regra of ordenadas) {
        if (disparadas.has(regra.id)) continue;
        let vale = false;
        try { vale = !!regra.quando(m); }
        catch (e) { m.rastro.push({ regra: regra.id, erro: e.message }); disparadas.add(regra.id); continue; }
        if (!vale) continue;

        const antes = { eventos: m.eventos.length, mudancas: m.mudancas.length,
                        preco: m.preco.length, marcas: m.marcas.length,
                        relacoes: m.relacoes.length };
        try { regra.entao(m); }
        catch (e) { m.rastro.push({ regra: regra.id, erro: e.message }); }
        disparadas.add(regra.id);
        mudou = true;

        m.rastro.push({ regra: regra.id, prioridade: regra.prioridade, ciclo,
          produziu: {
            eventos: m.eventos.length - antes.eventos,
            mudancas: m.mudancas.length - antes.mudancas,
            preco: m.preco.length - antes.preco,
            marcas: m.marcas.length - antes.marcas,
            relacoes: m.relacoes.length - antes.relacoes
          } });
      }
      if (!mudou) break;
    }

    return {
      tipo: m.tipo,
      eventos: m.eventos, mudancas: m.mudancas, preco: m.preco,
      marcas: m.marcas, relacoes: m.relacoes, posses: m.posses || [],
      tocados: m.tocados || new Set(),
      orcamento: { brutos: m.brutos || 0, mantidos: m.eventos.length, cortados: m.cortados,
                   tokens: Math.ceil(m.eventos.join('\n').length * this.TOKENS_POR_CARACTERE),
                   teto: this.ORCAMENTO_TOKENS },
      rastro: m.rastro
    };
  },

  explicar(r) {
    if (!r) return '';
    const l = [];
    l.push(`Crônica de ${r.tipo}: ${r.mudancas.length} mudança(s), ${r.preco.length} preço(s), ` +
           `${r.marcas.length} marca(s), ${r.relacoes.length} vínculo(s).`);
    l.push(`Eventos: ${r.orcamento.mantidos} de ${r.orcamento.brutos} brutos, ` +
           `${r.orcamento.tokens} de ${r.orcamento.teto} tokens` +
           (r.orcamento.cortados ? `, ${r.orcamento.cortados} cortados por orçamento` : ''));
    l.push(`Regras: ${r.rastro.map(x => x.regra).join(' → ')}`);
    return l.join('\n');
  }
};

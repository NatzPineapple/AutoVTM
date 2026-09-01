/* ============================================================
   VITÆ — Camada do Narrador
   ------------------------------------------------------------
   NÃO HÁ IA AQUI. Este arquivo define apenas o CONTRATO que um
   adaptador de IA deverá cumprir, mais um adaptador simulado que
   devolve texto pré-escrito para exercitar a interface.

   Para plugar a IA depois, escreva um objeto com o mesmo formato
   e registre com  Narrador.usar(meuAdaptador).
   Nada na interface precisa mudar.
   ============================================================ */

/**
 * @typedef {Object} Turno         O que a mesa envia ao Narrador.
 * @property {Object} campanha     Estado completo da campanha (cena, locais, pessoas, fatos).
 * @property {Object} ficha        Ficha do personagem do jogador.
 * @property {string} texto        O que o jogador escreveu.
 * @property {'agir'|'falar'|'examinar'|'perguntar'} modo
 * @property {Array}  historico    Mensagens anteriores, mais recentes por último.
 *
 * @typedef {Object} Resposta      O que o Narrador devolve.
 * @property {string}  texto            Prosa da narração. Aceita **negrito**, *itálico*
 *                                      e referências [[pessoa:id]] / [[local:id]].
 * @property {Object=} cena             { local, hora, descricao } — troca de cena.
 * @property {Array=}  locais           Locais novos ou atualizados.
 * @property {Array=}  pessoas          Pessoas novas ou atualizadas.
 * @property {Array=}  fatos            Fatos revelados: { titulo, texto }.
 * @property {Array=}  fios             Fios da trama abertos/fechados: { id, titulo, estado }.
 * @property {Object=} rolagem          Pedido de teste: { pericia, atributo, dificuldade, motivo }.
 * @property {Array=}  efeitos          Mudanças na ficha: [{ campo, delta|valor, motivo }].
 *                                      campos aceitos: fome, humanidadeMod,
 *                                      danoSuperficial, danoAgravado.
 */

const Narrador = {
  /** @type {{nome:string, ia:boolean, responder:(t:Turno)=>Promise<Resposta>}} */
  adaptador: null,

  usar(adaptador) { this.adaptador = adaptador; },

  get nome() { return this.adaptador?.nome || 'nenhum'; },
  get temIA() { return !!this.adaptador?.ia; },

  /** @param {Turno} turno @returns {Promise<Resposta>} */
  async responder(turno) {
    if (!this.adaptador) throw new Error('Nenhum adaptador de Narrador registrado.');
    return this.adaptador.responder(turno);
  }
};

/* ============================================================
   ADAPTADOR SIMULADO
   Devolve trechos pré-escritos, sem nenhum modelo por trás.
   Serve só para provar o fluxo da interface.
   ============================================================ */

const NarradorSimulado = {
  nome: 'Simulado',
  ia: false,

  /* Roteiro fixo: as primeiras respostas seguem uma ordem, para que
     dê para testar troca de cena, revelação de fato e pedido de rolagem. */
  roteiro: [
    {
      texto: 'A porta do camarim se fecha atrás de você e o barulho da pista vira um pulso surdo, '
           + 'do outro lado da parede. **Alguém esteve aqui.** O ar tem cheiro de cigarro caro e de '
           + 'medo velho — o tipo de medo que fica impregnado no estofado.\n\n'
           + 'Sobre a penteadeira, um envelope pardo com seu nome escrito à mão.',
      rolagem: {
        dificuldade: 3,
        motivo: 'O camarim mudou desde ontem. Descobrir o quê depende de como você olha.',
        rotas: [
          { atributo: 'raciocinio', pericia: 'investigacao',
            enquadramento: 'você varre o camarim com método', risco: 'demora' },
          { atributo: 'raciocinio', pericia: 'consciencia',
            enquadramento: 'você deixa o instinto apontar', risco: 'margem menor' },
          { atributo: 'inteligencia', pericia: 'ocultismo',
            enquadramento: 'você já viu esse tipo de marca antes', risco: 'o que você reconhece te reconhece' }
        ]
      }
    },
    {
      texto: 'Você abre o envelope com a unha. Dentro, três fotografias e nada mais.\n\n'
           + 'Nas duas primeiras, você — na praia, de madrugada, inclinada sobre um turista. '
           + 'A terceira é de [[pessoa:bia]], em plena luz do dia, saindo do prédio onde mora. '
           + 'Alguém marcou o rosto dela com caneta vermelha.',
      fatos: [{ titulo: 'Alguém te fotografou caçando',
                texto: 'Duas fotos da Praia de Copacabana e uma da sua Pilar em plena luz do dia. '
                     + 'Quem tirou sabe onde você caça e sabe de quem você gosta.' }],
      fios: [{ id: 'fotografo', titulo: 'Quem tirou as fotos?', estado: 'aberto' }]
    },
    {
      texto: 'A cortina do camarim se move sem que haja vento. Quando você olha de novo para o espelho, '
           + 'ele devolve o quarto vazio — como sempre devolve, sem você dentro.\n\n'
           + '*A Fome sobe um degrau. Não é o cheiro do sangue. É a raiva.*',
      efeitos: [{ campo: 'fome', delta: 1, motivo: 'tensão' }]
    },
    {
      texto: 'Do corredor vem a voz do segurança, cansada e sem pressa: — Dona Inácia, tem um moço '
           + 'aqui querendo falar com a senhora. Diz que é da parte do Sr. Duarte.\n\n'
           + 'Seu senhor não manda recado. Seu senhor aparece.',
      pessoas: [{ id: 'mensageiro', nome: 'O moço de terno claro', tipo: 'Desconhecido',
                  relacao: 'suspeito', conhecido: true, contato: false,
                  descricao: 'Diz vir da parte de Duarte de Alvim. Não pisca o suficiente.' }],
      cena: { presentes: ['bia', 'mensageiro'] }
    }
  ],

  /* Fragmentos genéricos para quando o roteiro acaba. */
  fragmentos: {
    agir: [
      'Você se move e o mundo demora meio segundo a mais do que deveria para reagir. Ninguém comenta.',
      'Funciona — ou pelo menos ninguém te impede. O que não é a mesma coisa, e você sabe.',
      'Feito. Fica a sensação de que alguém anotou.'
    ],
    falar: [
      'As palavras saem certas. A pessoa do outro lado escuta até o fim, o que já é raro.',
      'Há uma pausa longa demais antes da resposta, e a pausa diz mais do que a resposta.',
      'Você fala. Do outro lado, alguém decide acreditar — por enquanto.'
    ],
    examinar: [
      'Você olha com atenção e o cômodo entrega um detalhe pequeno, do tipo que só importa depois.',
      'Nada de estranho. Nada que você consiga nomear, pelo menos.',
      'Há marcas recentes onde não deveria haver marca nenhuma.'
    ],
    perguntar: [
      'O Narrador anota a pergunta e devolve o silêncio de quem vai responder na hora certa.',
      'Isso é coisa que se descobre andando, não perguntando.'
    ]
  },

  passo: 0,

  /* Latência falsa, só para a interface exercitar o estado "escrevendo".
     É configurável porque o teste paga por ela: com 500–1.200 ms por
     turno, a suíte de jornadas levava a suíte inteira de 2,8 s para
     25 s — nove vezes mais lenta, por uma espera que não verifica nada.

     Suíte lenta deixa de ser rodada, e suíte que não se roda é o mesmo
     que suíte que não existe. */
  latenciaMs: [500, 1200],

  async responder(turno) {
    const [min, max] = this.latenciaMs;
    if (max > 0) await new Promise(r => setTimeout(r, min + Math.random() * (max - min)));

    if (this.passo < this.roteiro.length) {
      return { ...this.roteiro[this.passo++], simulado: true };
    }
    const pool = this.fragmentos[turno.modo] || this.fragmentos.agir;
    const texto = pool[Math.floor(Math.random() * pool.length)];
    return { texto, simulado: true };
  },

  reiniciar() { this.passo = 0; }
};

/* ============================================================
   ADAPTADOR DO PROXY
   Fala com /api/narrador. Monta o volátil, recebe a saída
   estruturada e a traduz para o formato que aplicarResposta()
   já consome. O pedido de teste vem sem número: quem monta as
   rotas e a dificuldade é o Árbitro, aqui no navegador.
   ============================================================ */

const NarradorProxy = {
  nome: 'Proxy',
  ia: true,
  modelo: '',

  async disponivel() {
    try {
      const r = await fetch('/api/estado', { cache: 'no-store' });
      if (!r.ok) return false;
      const d = await r.json();
      this.modelo = d.modeloNarrador || d.modelo || '';
      this.nome = this.modelo || 'Proxy';
      return !!d.narrador;
    } catch (e) { return false; }
  },

  resumirMensagem(m) {
    const corte = (t, n = 200) => {
      const limpo = String(t || '')
        .replace(/\[\[(?:pessoa|local):([a-z0-9_]+)(?:\|[^\]]+)?\]\]/gi, '$1')
        .replace(/\*\*|\*/g, '').replace(/\s+/g, ' ').trim();
      return limpo.length > n ? limpo.slice(0, n - 1) + '…' : limpo;
    };
    if (m.autor === 'cena') return `[cena] ${m.titulo || ''}${m.sub ? ` — ${m.sub}` : ''}`;
    if (m.autor === 'jogador') return `[jogador ${m.modo || 'agir'}] ${corte(m.texto)}`;
    if (m.autor === 'narrador') return `[narração] ${corte(m.texto)}`;
    if (m.autor === 'sistema') return `[sistema] ${corte(m.texto, 120)}`;
    if (m.autor === 'arbitro') {
      const b = (m.veredito && m.veredito.bloqueios || [])[0];
      return b ? `[barrado] ${corte(b.motivo, 120)}` : '';
    }
    if (m.autor === 'rolagem' && m.resultado) return `[teste] ${m.resultado.rotulo}: ${m.resultado.tipo}`;
    return '';
  },

  condicaoDe(f) {
    const t = Estado.trilhas(f);
    const partes = [];
    partes.push([
      'a Fome está quieta', 'a Fome está quieta', 'a Fome incomoda',
      'a Fome pesa em tudo que ele olha', 'a Fome domina: pessoas viraram quantidade',
      'a Besta está no volante'
    ][Math.min(5, f.fome || 0)]);
    if (t.vitalidade.livres === 0) partes.push('Debilitado');
    else if (t.vitalidade.livres < t.vitalidade.max) partes.push('machucado');
    if (t.vontade.livres === 0) partes.push('sem Força de Vontade');
    if ((f.maculas || 0) > 0) partes.push('com Mácula recente');
    return partes.join('; ');
  },

  montar(turno) {
    const f = turno.ficha;
    const c = claDe(f.cla);
    const pf = Seitas.perfil(f.seita);
    const camp = turno.campanha || {};
    const presentes = (camp.cena && camp.cena.presentes || [])
      .map(id => (camp.pessoas || []).find(p => p.id === id))
      .filter(Boolean).map(p => `${p.id} (${p.nome})`);

    return {
      texto: turno.texto,
      modo: turno.modo,
      seita: f.seita || '',
      cidade: f.cidade || '',
      arquivoCampanha: turno.arquivoCampanha || null,
      indiceCapitulo: turno.indiceCapitulo || 0,
      personagem: `${f.nome || 'sem nome'} — ${c ? c.nome : 'sem clã'}${pf.id ? `, ${pf.nome}` : ''}`,
      lealdade: pf.id ? `${pf.nome} · ${Seitas.resumo(f, typeof Matilha !== 'undefined' ? Matilha.de(f) : null)}` : '',
      condicao: this.condicaoDe(f),
      cena: camp.cena || {},
      presentes,
      pessoas: (camp.pessoas || []).map(p => ({ id: p.id, nome: p.nome, relacao: p.relacao })),
      locais: (camp.locais || []).map(l => ({ id: l.id, nome: l.nome })),
      fios: (camp.fios || []).filter(x => x.estado !== 'fechado')
        .map(x => ({ id: x.id, titulo: x.titulo })),
      historico: (turno.historico || []).slice(-8).map(m => this.resumirMensagem(m)).filter(Boolean),
      legado: Legado.resumoParaModelo(f),
      arbitro: turno.arbitro || '',
      resultado: turno.resultado || '',
      gancho: turno.gancho || '',
      acoes: Object.keys(Arbitro.ACOES)
    };
  },

  traduzir(saida, turno) {
    const r = { texto: saida.texto };
    if (saida.cena) r.cena = saida.cena;
    if (saida.locais && saida.locais.length) {
      r.locais = saida.locais.map(l => Object.assign({ conhecido: true, perigo: 2, campoDeCaca: 4 }, l));
    }
    if (saida.pessoas && saida.pessoas.length) {
      r.pessoas = saida.pessoas.map(p => Object.assign({ conhecido: true, contato: false }, p));
    }
    if (saida.fatos && saida.fatos.length) r.fatos = saida.fatos;
    if (saida.fios && saida.fios.length) r.fios = saida.fios;

    if (saida.efeitos && saida.efeitos.length) {
      r.efeitos = saida.efeitos
        .filter(e => e.campo === 'fome')
        .map(e => ({ campo: 'fome', delta: 1, motivo: e.motivo }));
    }

    if (saida.pedirTeste) {
      const veredito = Arbitro.avaliar({
        ficha: turno.ficha,
        estados: turno.estados || [],
        intencao: saida.pedirTeste.intencao
      });
      if (veredito && veredito.rotas && veredito.rotas.length) {
        r.rolagem = {
          intencao: saida.pedirTeste.intencao,
          motivo: saida.pedirTeste.motivo,
          dificuldade: veredito.dificuldade,
          rotas: veredito.rotas.map(x => ({
            atributo: x.atributo, pericia: x.pericia, atributo2: x.atributo2,
            enquadramento: x.enquadramento, risco: x.risco
          }))
        };
      }
    }
    return r;
  },

  async responder(turno) {
    const resposta = await fetch('/api/narrador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.montar(turno))
    });
    const d = await resposta.json();
    if (!resposta.ok) throw new Error(d.erro || `HTTP ${resposta.status}`);

    const r = this.traduzir(d.saida, turno);
    r.modelo = d.modelo;
    r.validado = d.valido;
    if (!d.valido) r.avisoValidador = d.problemas.join('; ');
    return r;
  }
};

Narrador.usar(NarradorSimulado);

Narrador.detectar = async function () {
  if (await NarradorProxy.disponivel()) {
    this.usar(NarradorProxy);
    return true;
  }
  this.usar(NarradorSimulado);
  return false;
};

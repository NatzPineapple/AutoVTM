/* ============================================================
   VITÆ — Léxico do Árbitro
   Uma responsabilidade: **transformar o que o jogador escreveu em
   uma intenção mecânica**, e marcar no texto os termos que a
   produziram. Nada aqui decide se a ação é possível, nem toca em
   dado — quem julga é o Árbitro, quem rola é o Dados.

   Saiu de `motor-arbitro.js` na §48 (item A4 da §45.2). O arquivo
   tinha 976 linhas e cinco assuntos; este é o maior deles, porque
   ACOES é um dicionário de verbos do português brasileiro e
   dicionário é grande por natureza — não por acoplamento.

   `Arbitro.interpretar()`, `Arbitro.normalizar()`,
   `Arbitro.ACOES` e companhia continuam existindo: o Árbitro
   delega para cá. Nenhum chamador mudou.
   ============================================================ */

const Lexico = {

  ACOES: {
    esconder: {
      nome: 'Esconder-se', dominio: 'furtividade',
      frases: ['esconder', 'escondo', 'me escondo', 'furtividade', 'sorrateiro', 'sorrateiramente',
               'sumir de vista', 'me embosco', 'disfarçar na multidao', 'passar despercebido',
               'na sombra', 'nas sombras', 'silenciosamente', 'sem ser visto'],
      exige: ['movimento'],
      rotas: [
        { atributo: 'destreza', pericia: 'furtividade', enquadramento: 'você se encolhe e some', risco: 'demora' },
        { atributo: 'raciocinio', pericia: 'furtividade', enquadramento: 'você lê o ambiente antes de se mover', risco: 'margem menor' },
        { atributo: 'manipulacao', pericia: 'labia', enquadramento: 'você finge pertencer ao lugar', risco: 'alguém puxa conversa' }
      ]
    },
    pegar: {
      nome: 'Pegar', dominio: 'tecnica', manipulacao: true,
      frases: ['pegar', 'pego', 'apanhar', 'apanho', 'recolher', 'recolho', 'guardar no bolso',
               'coloco no bolso', 'tomar para mim', 'pego de volta', 'levo comigo', 'embolso'],
      exige: ['maos'],
      rotas: [
        { atributo: 'destreza', pericia: 'furto', enquadramento: 'você tira sem ninguém ver', risco: 'alguém repara' }
      ]
    },
    largar: {
      nome: 'Largar', dominio: 'tecnica', manipulacao: true,
      frases: ['largar', 'largo', 'solto', 'soltar', 'deixo cair', 'jogo fora', 'abandono aqui',
               'deixo no chao', 'me desfaço'],
      exige: ['maos'],
      rotas: []
    },
    abrir: {
      nome: 'Abrir', dominio: 'tecnica', manipulacao: true, exigeAberto: true,
      frases: ['abrir', 'abro', 'destampar', 'levantar a tampa', 'puxo a gaveta',
               'escancaro', 'abrir a porta'],
      exige: ['maos'],
      rotas: [
        { atributo: 'destreza', pericia: 'furto', enquadramento: 'você abre com jeito', risco: 'demora' },
        { atributo: 'forca', pericia: 'atletismo', enquadramento: 'você abre na força', risco: 'barulho' }
      ]
    },
    entregar: {
      nome: 'Entregar', dominio: 'persuasao', manipulacao: true,
      frases: ['entregar', 'entrego', 'dar para', 'dou para', 'passo para', 'ofereço',
               'devolvo', 'estendo a mao com'],
      exige: ['maos'],
      rotas: [
        { atributo: 'carisma', pericia: 'persuasao', enquadramento: 'você entrega como quem faz um favor', risco: 'vira dívida' }
      ]
    },
    ir_para: {
      nome: 'Ir para outro lugar', dominio: 'rua', movimento: true,
      frases: ['ir para', 'vou para', 'vou ate', 'sigo para', 'me desloco', 'atravesso para',
               'saio para', 'rumo a', 'caminho ate'],
      exige: ['movimento'],
      rotas: []
    },
    arrombar: {
      nome: 'Arrombar ou destrancar', dominio: 'tecnica', exigeAberto: true,
      frases: ['arrombar', 'arrombo', 'destrancar', 'destranco', 'forcar a fechadura', 'ladroagem',
               'abrir o cofre', 'picking', 'chaveiro', 'quebrar a porta'],
      exige: ['maos', 'visao'],
      rotas: [
        { atributo: 'destreza', pericia: 'furto', enquadramento: 'você trabalha a fechadura', risco: 'demora' },
        { atributo: 'forca', pericia: 'briga', enquadramento: 'você arromba com o ombro', risco: 'barulho' },
        { atributo: 'inteligencia', pericia: 'tecnologia', enquadramento: 'você burla a fechadura eletrônica', risco: 'registro no sistema' }
      ]
    },
    achar_escondido: {
      nome: 'Achar algo escondido', dominio: 'investigacao',
      frases: ['procurar', 'procuro', 'vasculhar', 'vasculho', 'revistar', 'revisto', 'investigar',
               'investigo', 'achar', 'encontrar', 'onde esta', 'busco', 'examinar o comodo',
               'olhar em volta', 'reviro'],
      exige: ['visao'],
      rotas: [
        { atributo: 'raciocinio', pericia: 'consciencia', enquadramento: 'você varre o cômodo', risco: 'demora' },
        { atributo: 'inteligencia', pericia: 'investigacao', enquadramento: 'você procura como quem sabe onde se esconde coisa', risco: 'bagunça visível' },
        { atributo: 'raciocinio', pericia: 'intuicao', enquadramento: 'você pensa como quem escondeu', risco: 'margem menor' }
      ]
    },
    persuadir: {
      nome: 'Convencer alguém', dominio: 'persuasao',
      frases: ['convencer', 'convenco', 'persuadir', 'persuado', 'negociar', 'negocio', 'argumentar',
               'peco', 'pedir', 'proponho', 'propor', 'barganhar', 'falo com', 'converso com'],
      exige: ['fala', 'mente'], alcance: 'voz',
      rotas: [
        { atributo: 'carisma', pericia: 'persuasao', enquadramento: 'você pede com jeito', risco: 'fica devendo um favor' },
        { atributo: 'manipulacao', pericia: 'labia', enquadramento: 'você mente com naturalidade', risco: 'se for pego, é pior' },
        { atributo: 'inteligencia', pericia: 'politica', enquadramento: 'você invoca precedente e etiqueta', risco: 'formaliza a disputa' }
      ]
    },
    seduzir: {
      nome: 'Seduzir', dominio: 'persuasao',
      frases: ['seduzir', 'seduzo', 'flertar', 'flerto', 'cantar', 'paquerar', 'encantar', 'encanto',
               'levo pra cama', 'olhar nos olhos', 'me aproximo dele', 'me aproximo dela'],
      exige: ['visao'], alcance: 'ambiente',
      rotas: [
        { atributo: 'carisma', pericia: 'labia', enquadramento: 'você deixa acontecer', risco: 'testemunhas' },
        { atributo: 'manipulacao', pericia: 'persuasao', enquadramento: 'você conduz sem parecer que conduz', risco: 'a pessoa percebe depois' },
        { atributo: 'carisma', pericia: 'performance', enquadramento: 'você faz disso um espetáculo', risco: 'atenção demais' }
      ]
    },
    intimidar: {
      nome: 'Intimidar', dominio: 'intimidacao',
      frases: ['intimidar', 'intimido', 'ameacar', 'ameaco', 'assustar', 'assusto', 'coagir',
               'encaro', 'peito', 'meto medo', 'grito com'],
      exige: [], alcance: 'ambiente',
      rotas: [
        { atributo: 'forca', pericia: 'intimidacao', enquadramento: 'você usa o corpo', risco: 'vira violência' },
        { atributo: 'manipulacao', pericia: 'intimidacao', enquadramento: 'você ameaça sem dizer o quê', risco: 'a pessoa guarda mágoa' },
        { atributo: 'carisma', pericia: 'lideranca', enquadramento: 'você manda como quem tem autoridade', risco: 'precisa sustentar o blefe' }
      ]
    },
    lutar: {
      nome: 'Atacar corpo a corpo', dominio: 'confronto',
      frases: ['atacar', 'ataco', 'bater', 'bato', 'socar', 'soco', 'brigar', 'brigo', 'agarrar',
               'agarro', 'derrubar', 'derrubo', 'esfaquear', 'golpear', 'parto pra cima'],
      exige: ['movimento', 'corpo'], alcance: 'toque',
      rotas: [
        { atributo: 'forca', pericia: 'briga', enquadramento: 'você vai com tudo', risco: 'barulho e sangue' },
        { atributo: 'destreza', pericia: 'briga', enquadramento: 'você é preciso', risco: 'menos dano' },
        { atributo: 'destreza', pericia: 'armas_brancas', enquadramento: 'você saca a lâmina', risco: 'ferimento agravado no alvo' }
      ]
    },
    atirar: {
      nome: 'Atirar', dominio: 'confronto',
      frases: ['atirar', 'atiro', 'disparar', 'disparo', 'saco a arma', 'armas de fogo', 'mirar'],
      exige: ['maos', 'visao'], alcance: 'visao',
      rotas: [
        { atributo: 'destreza', pericia: 'armas_fogo', enquadramento: 'você mira e dispara', risco: 'barulho, câmeras, polícia' }
      ]
    },
    caçar: {
      nome: 'Caçar e se alimentar', dominio: 'rua',
      frases: ['cacar', 'caco', 'me alimentar', 'alimentar', 'beber', 'bebo', 'morder', 'mordo',
               'saciar', 'presa', 'procuro presa', 'procurar presa', 'preciso comer',
               'preciso de sangue', 'matar a fome', 'me alimento'],
      exige: ['movimento'], alcance: 'toque',
      rotas: []
    },
    rastrear: {
      nome: 'Rastrear', dominio: 'rua',
      frases: ['rastrear', 'rastreio', 'seguir', 'sigo', 'perseguir', 'persigo', 'na pista',
               'atras dele', 'atras dela', 'farejar'],
      exige: ['movimento'],
      rotas: [
        { atributo: 'raciocinio', pericia: 'sobrevivencia', enquadramento: 'você lê o rastro', risco: 'demora' },
        { atributo: 'raciocinio', pericia: 'manha', enquadramento: 'você pergunta a quem sabe', risco: 'alguém avisa o alvo' },
        { atributo: 'inteligencia', pericia: 'investigacao', enquadramento: 'você cruza informação', risco: 'deixa registro' }
      ]
    },
    falar_com_animais: {
      nome: 'Falar com animais', dominio: 'rua',
      frases: ['falar com animais', 'falo com o cachorro', 'falo com os ratos', 'chamar os ratos',
               'comandar o animal', 'animalismo', 'empatia com animais', 'converso com o bicho'],
      exige: ['fala', 'visao'], alcance: 'voz',
      disciplina: { id: 'animalismo', nivel: 1 },
      rotas: [
        { atributo: 'manipulacao', pericia: 'empatia_animais', enquadramento: 'você fala e o bicho escuta', risco: 'nenhum' },
        { atributo: 'carisma', pericia: 'empatia_animais', enquadramento: 'você se faz entender pelo tom', risco: 'margem menor' }
      ]
    },
    ocultismo: {
      nome: 'Reconhecer o sobrenatural', dominio: 'ocultismo',
      frases: ['ocultismo', 'ritual', 'simbolo', 'sigilo', 'reconheco o simbolo', 'magia',
               'feiticaria', 'abismo', 'o que significa isso'],
      exige: ['mente'],
      rotas: [
        { atributo: 'inteligencia', pericia: 'ocultismo', enquadramento: 'você já leu sobre isso', risco: 'nenhum' },
        { atributo: 'raciocinio', pericia: 'ocultismo', enquadramento: 'você reconhece de longe', risco: 'margem menor' },
        { atributo: 'inteligencia', pericia: 'academicos', enquadramento: 'você busca o contexto histórico', risco: 'demora' }
      ]
    },
    passar_por_humano: {
      nome: 'Passar por humano', dominio: 'persuasao',
      frases: ['passar por humano', 'finjo estar vivo', 'disfarcar', 'rubor da vida', 'parecer normal',
               'me passo por'],
      exige: ['mente'],
      rotas: [
        { atributo: 'manipulacao', pericia: 'labia', enquadramento: 'você atua', risco: 'um detalhe escapa' },
        { atributo: 'carisma', pericia: 'performance', enquadramento: 'você encena estar vivo', risco: 'cansa rápido' }
      ]
    },
    celebrar_ritae: {
      nome: 'Celebrar um Ritae', dominio: 'ocultismo',
      frases: ['celebrar', 'celebro', 'ritae', 'rito', 'vaulderie', 'sangrar no calice',
               'calice', 'monomacia', 'banquete de sangue', 'conduzo o rito', 'sacerdote celebra'],
      exige: ['maos', 'sangue', 'mente'], alcance: 'toque', seita: 'sabbat',
      rotas: [
        { atributo: 'carisma', pericia: 'ocultismo', enquadramento: 'você conduz como manda o cânone', risco: 'um erro anula o efeito para todos' },
        { atributo: 'manipulacao', pericia: 'performance', enquadramento: 'você faz o rito valer pelo espetáculo', risco: 'o Sacerdote nota a improvisação' },
        { atributo: 'determinacao', pericia: 'ocultismo', enquadramento: 'você aguenta o rito até o fim', risco: 'custa Vontade' }
      ]
    },
    invocar_vinculum: {
      nome: 'Invocar o Vinculum', dominio: 'intimidacao',
      frases: ['invocar o vinculum', 'invoco o vinculum', 'apelo ao sangue da matilha',
               'lembro do vinculo', 'pelo sangue que dividimos'],
      exige: ['fala'], alcance: 'voz', seita: 'sabbat',
      rotas: [
        { atributo: 'carisma', pericia: 'lideranca', enquadramento: 'você invoca o sangue dividido', risco: 'abusar disso leva a exílio ou Monomacia' },
        { atributo: 'manipulacao', pericia: 'intimidacao', enquadramento: 'você cobra o vínculo como dívida', risco: 'a matilha guarda mágoa' }
      ]
    },
    cobrar_favor: {
      nome: 'Cobrar um favor', dominio: 'persuasao',
      frases: ['cobrar o favor', 'cobro o favor', 'voce me deve', 'me deve uma',
               'lembra do que eu fiz', 'chamar a divida', 'cobro a divida'],
      exige: ['fala'], alcance: 'voz', seita: 'anarquistas',
      rotas: [
        { atributo: 'carisma', pericia: 'persuasao', enquadramento: 'você lembra sem humilhar', risco: 'o favor acaba aqui' },
        { atributo: 'manipulacao', pericia: 'intimidacao', enquadramento: 'você cobra na frente dos outros', risco: 'ganha um inimigo permanente' },
        { atributo: 'inteligencia', pericia: 'politica', enquadramento: 'você transforma a dívida em acordo novo', risco: 'formaliza o que era informal' }
      ]
    },
    chamar_baronia: {
      nome: 'Chamar a baronia', dominio: 'intimidacao',
      frases: ['chamar a baronia', 'chamo o pessoal', 'chamar o barao', 'aciono a baronia',
               'peco reforco', 'chamo reforco'],
      exige: ['fala'], alcance: 'ilimitado', seita: 'anarquistas',
      rotas: [
        { atributo: 'carisma', pericia: 'lideranca', enquadramento: 'você pede e o pessoal vem', risco: 'alguém morre no lugar de você' },
        { atributo: 'manipulacao', pericia: 'manha', enquadramento: 'você espalha que o território está ameaçado', risco: 'a corte fica sabendo' }
      ]
    },
    vender_servico: {
      nome: 'Vender um serviço', dominio: 'persuasao',
      frases: ['vender', 'vendo', 'ofereco meus servicos', 'proponho um negocio', 'tenho um preco',
               'fecho contrato', 'negocio um contrato'],
      exige: ['fala', 'mente'], alcance: 'voz', seita: 'independente',
      rotas: [
        { atributo: 'manipulacao', pericia: 'financas', enquadramento: 'você precifica sem piedade', risco: 'o cliente cobra exclusividade' },
        { atributo: 'carisma', pericia: 'persuasao', enquadramento: 'você vende confiança antes do serviço', risco: 'prometeu prazo demais' },
        { atributo: 'inteligencia', pericia: 'ocultismo', enquadramento: 'você mostra o que só você sabe fazer', risco: 'alguém aprende observando' }
      ]
    },
    pedir_passagem: {
      nome: 'Pedir passagem em domínio alheio', dominio: 'persuasao',
      frases: ['pedir passagem', 'peco passagem', 'peco permissao', 'me apresento ao dono',
               'peco licenca pra cacar', 'pedir hospitalidade'],
      exige: ['fala', 'mente'], alcance: 'voz',
      rotas: [
        { atributo: 'carisma', pericia: 'etiqueta', enquadramento: 'você faz do jeito certo', risco: 'fica devendo' },
        { atributo: 'manipulacao', pericia: 'labia', enquadramento: 'você omite metade do motivo', risco: 'se for pego, vira invasão' },
        { atributo: 'inteligencia', pericia: 'politica', enquadramento: 'você invoca precedente', risco: 'formaliza a disputa' }
      ]
    },
    escutar: {
      nome: 'Escutar', dominio: 'investigacao',
      frases: ['escutar', 'escuto', 'ouvir', 'ouco', 'colar o ouvido', 'colo o ouvido', 'atras da porta',
               'presto atencao no som', 'escuto a conversa', 'fico na escuta', 'apuro o ouvido'],
      exige: ['audicao'], alcance: 'ambiente',
      rotas: [
        { atributo: 'raciocinio', pericia: 'consciencia', enquadramento: 'você filtra o barulho de fundo', risco: 'demora' },
        { atributo: 'inteligencia', pericia: 'investigacao', enquadramento: 'você sabe o que procurar na conversa', risco: 'precisa ficar parado' },
        { atributo: 'raciocinio', pericia: 'intuicao', enquadramento: 'você ouve o que não foi dito', risco: 'margem menor' }
      ]
    },
    farejar: {
      nome: 'Farejar', dominio: 'rua',
      frases: ['farejar', 'farejo', 'cheirar', 'cheiro o ar', 'sinto o cheiro',
               'que cheiro e esse', 'sigo o cheiro', 'cheiro de sangue'],
      exige: ['olfato'], alcance: 'ambiente',
      rotas: [
        { atributo: 'raciocinio', pericia: 'consciencia', enquadramento: 'você separa um cheiro do resto', risco: 'nenhum' },
        { atributo: 'raciocinio', pericia: 'sobrevivencia', enquadramento: 'você segue o rastro pelo nariz', risco: 'perde tempo' }
      ]
    },
    resistir_frenesi: {
      nome: 'Resistir ao frenesi', dominio: 'confronto',
      frases: ['resistir', 'me seguro', 'segurar a besta', 'controlar a fome', 'nao ceder'],
      exige: [],
      rotas: [
        { atributo: 'autocontrole', pericia: null, atributo2: 'determinacao',
          enquadramento: 'você segura a Besta', risco: 'custa Vontade se falhar' }
      ]
    }
  },

  LETRAS_ACENTUADAS: {
    a: 'aáàâãä', e: 'eéèêë', i: 'iíìîï', o: 'oóòôõö', u: 'uúùûü', c: 'cç', n: 'nñ'
  },

  regexDeTermo(termo) {
    const palavras = this.normalizar(termo).split(' ').filter(Boolean);
    if (!palavras.length) return null;
    const corpo = palavras.map(p => p.split('').map(ch => {
      const cls = this.LETRAS_ACENTUADAS[ch];
      return cls ? `[${cls}]` : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('')).join('\\s+');
    return new RegExp(`(^|[^\\p{L}])(${corpo})(?=[^\\p{L}]|$)`, 'giu');
  },

  marcarTermos(texto, termos, envolver) {
    if (!termos || !termos.length) return esc(texto);
    const faixas = [];
    for (const t of termos) {
      const re = this.regexDeTermo(t);
      if (!re) continue;
      let m;
      while ((m = re.exec(texto)) !== null) {
        const ini = m.index + m[1].length;
        faixas.push({ ini, fim: ini + m[2].length });
        re.lastIndex = ini + m[2].length;
      }
    }
    if (!faixas.length) return esc(texto);
    faixas.sort((a, b) => a.ini - b.ini || b.fim - a.fim);
    const juntas = [];
    for (const f of faixas) {
      const ult = juntas[juntas.length - 1];
      if (ult && f.ini <= ult.fim) ult.fim = Math.max(ult.fim, f.fim);
      else juntas.push({ ...f });
    }
    let saida = '', pos = 0;
    for (const f of juntas) {
      saida += esc(texto.slice(pos, f.ini));
      saida += envolver(texto.slice(f.ini, f.fim));
      pos = f.fim;
    }
    return saida + esc(texto.slice(pos));
  },

  normalizar(t) {
    return String(t || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  },

  interpretar(texto, modo) {
    const n = this.normalizar(texto);
    if (!n) return { intencao: null, confianca: 0, termos: [] };

    const marcados = [];
    for (const [id, acao] of Object.entries(this.ACOES)) {
      let peso = 0; const termos = [];
      for (const frase of acao.frases) {
        const f = this.normalizar(frase);
        if (!f) continue;
        if (n.includes(f)) { peso += f.split(' ').length * 2 + f.length / 8; termos.push(frase); }
      }
      if (peso > 0) marcados.push({ id, acao, peso, termos });
    }

    for (const h of Object.values(HABILIDADES).flatMap(g => g.lista)) {
      const hn = this.normalizar(h.nome);
      if (n.includes(hn)) {
        const alvo = marcados.find(m => m.acao.rotas.some(r => r.pericia === h.id));
        if (alvo) { alvo.peso += 3; alvo.termos.push(h.nome); }
      }
    }

    for (const [did, d] of Object.entries(DISCIPLINAS)) {
      for (const nivel of Object.values(d.poderes || {})) {
        for (const p of nivel) {
          if (n.includes(this.normalizar(p.nome))) {
            marcados.push({ id: 'poder:' + did + ':' + p.nome, peso: 12,
              termos: [p.nome], poder: { disciplina: did, nome: p.nome },
              acao: { nome: p.nome, exige: [], rotas: [], dominio: null } });
          }
        }
      }
      if (n.includes(this.normalizar(d.nome))) {
        marcados.push({ id: 'disciplina:' + did, peso: 8, termos: [d.nome],
          disciplina: did, acao: { nome: d.nome, exige: [], rotas: [], dominio: null } });
      }
    }

    if (!marcados.length) return { intencao: null, confianca: 0, termos: [], modo };

    marcados.sort((a, b) => b.peso - a.peso);
    const topo = marcados[0];
    const segundo = marcados[1];
    const margem = segundo ? topo.peso - segundo.peso : topo.peso;
    const ambiguo = !!(segundo && margem < topo.peso * 0.3);
    const forca = Math.min(1, topo.peso / 10);
    const confianca = Math.max(0, Math.min(1,
      ambiguo ? 0.25 + 0.30 * forca : 0.55 + 0.45 * forca));

    return {
      intencao: topo.id, acao: topo.acao, poder: topo.poder, disciplina: topo.disciplina,
      confianca: +confianca.toFixed(2), termos: topo.termos,
      ambiguo,
      alternativas: marcados.slice(1, 3).map(m => ({ id: m.id, nome: m.acao.nome })),
      modo
    };
  },
};

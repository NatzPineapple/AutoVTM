const Arbitro = {

  /* ------------------------------------------------------------
     DELEGAÇÃO — item A4 da §45.2
     Léxico e tabelas do Escudo saíram deste arquivo na §48 e viraram
     objetos próprios. Estas linhas existem para que os ~45 pontos que
     chamam `Arbitro.alguma_coisa` continuem funcionando: a divisão é
     de responsabilidade, não de interface pública.

     Se você está acrescentando um verbo, vá para `arbitro-lexico.js`.
     Se está acrescentando consulta a tabela, `arbitro-tabelas.js`.
     Aqui ficam capacidades, estados, alcance, modificadores e rotas.
     ------------------------------------------------------------ */
  get ACOES() { return Lexico.ACOES; },
  normalizar(t) { return Lexico.normalizar(t); },
  interpretar(texto, modo) { return Lexico.interpretar(texto, modo); },
  regexDeTermo(termo) { return Lexico.regexDeTermo(termo); },
  marcarTermos(texto, termos, envolver) { return Lexico.marcarTermos(texto, termos, envolver); },

  naFaixa(tabela, valor, campo = 'faixa') { return TabelasV5.naFaixa(tabela, valor, campo); },
  dificuldadeDescrita(n) { return TabelasV5.dificuldadeDescrita(n); },
  oposicaoDe(nivel) { return TabelasV5.oposicaoDe(nivel); },
  dificuldadeDeCaca(zona) { return TabelasV5.dificuldadeDeCaca(zona); },
  potenciaDeGeracao(ger) { return TabelasV5.potenciaDeGeracao(ger); },
  tabelaPotencia(ps) { return TabelasV5.tabelaPotencia(ps); },
  gatilhosDeFrenesi(tipo) { return TabelasV5.gatilhosDeFrenesi(tipo); },
  dificuldadeFrenesi(tipo, gatilho, humanidade) { return TabelasV5.dificuldadeFrenesi(tipo, gatilho, humanidade); },
  consequencias(resultado) { return TabelasV5.consequencias(resultado); },
  compulsaoAleatoria(cla) { return TabelasV5.compulsaoAleatoria(cla); },
  ferimentoPor(danoAgravado) { return TabelasV5.ferimentoPor(danoAgravado); },
  maculasPor(ato) { return TabelasV5.maculasPor(ato); },
  danoSocialExtra(testemunhas) { return TabelasV5.danoSocialExtra(testemunhas); },
  alimentacaoPor(fonte) { return TabelasV5.alimentacaoPor(fonte); },


  VOLUMES: {
    sussurro: { nome: 'Sussurro', metros: 1.5, exige: ['fala'],
                nota: 'Só quem está encostado em você ouve.',
                modificador: { dominios: ['intimidacao'], dados: -1 } },
    normal:   { nome: 'Fala normal', metros: 15, exige: ['fala'],
                nota: 'Todos no ambiente ouvem.' },
    grito:    { nome: 'Grito', metros: 60, exige: ['fala'],
                nota: 'Chega longe — e chega a quem você não queria.',
                risco: 'Atrai atenção de todos no alcance.',
                modificador: { dominios: ['persuasao'], dados: -1 } },
    mensagem: { nome: 'Mensagem', metros: Infinity, exige: ['maos'],
                nota: 'Não precisa de voz: precisa de aparelho e de contato.',
                exigeContato: true, semVoz: true,
                modificador: { dominios: ['persuasao', 'intimidacao'], dados: -1 } }
  },

  avaliarFala({ ficha, estados = [], volume = 'normal', alvo = null, dominio = null }) {
    const v = this.VOLUMES[volume] || this.VOLUMES.normal;
    const cap = this.capacidadesDe(estados);
    const bloqueios = [], avisos = [];

    for (const c of v.exige) {
      if (!cap.ativas.has(c)) {
        bloqueios.push({ tipo: 'estado',
          motivo: `${this.CAPACIDADES[c]} é necessário para ${v.nome.toLowerCase()}, e você está ${cap.removidas[c]}.` });
      }
    }

    if (v.exigeContato && alvo && !alvo.contato) {
      bloqueios.push({ tipo: 'contato',
        motivo: `Você não tem como mandar mensagem para ${alvo.nome}. Não há contato.` });
    }

    if (alvo && typeof alvo.distancia === 'number' && alvo.distancia > v.metros) {
      bloqueios.push({ tipo: 'alcance',
        motivo: `${v.nome} alcança ${v.metros} m, e ${alvo.nome} está a ${alvo.distancia} m.` });
    }
    if (!v.semVoz && alvo && alvo.audivel === false) {
      bloqueios.push({ tipo: 'alcance', motivo: `${alvo.nome} não consegue ouvir você.` });
    }

    if (v.risco) avisos.push(v.risco);
    if (v.nota) avisos.push(v.nota);

    let modificador = 0;
    if (v.modificador && dominio && v.modificador.dominios.includes(dominio)) {
      modificador = v.modificador.dados;
    }

    return { possivel: bloqueios.length === 0, volume: v, bloqueios, avisos, modificador };
  },

  CAPACIDADES: {
    fala:      'Falar em voz alta',
    audicao:   'Ouvir',
    visao:     'Enxergar',
    olfato:    'Sentir cheiro',
    maos:      'Usar as mãos',
    movimento: 'Mover-se',
    corpo:     'Comandar o próprio corpo',
    mente:     'Raciocinar com clareza',
    sangue:    'Gastar Vitae'
  },

  ESTADOS: {
    mudo:        { nome: 'Mudo', remove: ['fala'], desc: 'Sem voz, por lesão, mordaça ou poder.' },
    amordacado:  { nome: 'Amordaçado', remove: ['fala'], desc: 'A boca está impedida.' },
    cego:        { nome: 'Cego', remove: ['visao'], desc: 'Sem visão, por lesão, escuridão total ou poder.' },
    surdo:       { nome: 'Surdo', remove: ['audicao'], desc: 'Sem audição.' },
    algemado:    { nome: 'Algemado', remove: ['maos'], desc: 'As mãos estão presas.' },
    agarrado:    { nome: 'Agarrado', remove: ['movimento'], penalidade: { dados: -2, alvo: 'fisico' },
                   desc: 'Preso por alguém em combate corpo a corpo.' },
    imobilizado: { nome: 'Imobilizado', remove: ['movimento', 'maos'], desc: 'Amarrado ou preso.' },
    estacado:    { nome: 'Estacado', remove: ['fala', 'movimento', 'maos', 'corpo', 'sangue'],
                   desc: 'Estaca no coração: consciente e completamente indefeso.' },
    torpor:      { nome: 'Torpor', remove: ['fala', 'visao', 'audicao', 'maos', 'movimento', 'corpo', 'mente', 'sangue'],
                   desc: 'Sono forçado. Nenhuma ação é possível.' },
    debilitado:  { nome: 'Debilitado', penalidade: { dados: -2, alvo: 'fisico' },
                   desc: 'Trilha de Vitalidade cheia. Pode ser ignorado por um turno gastando Vontade.' },
    debil_mental:{ nome: 'Debilitação mental', penalidade: { dados: -2, alvo: 'mental_social' },
                   desc: 'Trilha de Força de Vontade cheia.' },
    frenesi:     { nome: 'Em frenesi', remove: ['mente'], desc: 'A Besta assumiu. Nada de ação complexa.' },
    em_chamas:   { nome: 'Em chamas', penalidade: { dados: -3, alvo: 'todos' },
                   desc: 'Fogo. Dano Agravado por turno e teste de frenesi de Terror.' },
    luz_solar:   { nome: 'Sob luz solar', penalidade: { dados: -3, alvo: 'todos' },
                   desc: 'Dano Agravado por turno. Quase nada mais importa.' },
    submerso:    { nome: 'Submerso', remove: ['fala'], desc: 'Debaixo d\'água.' },
    fome_maxima: { nome: 'Fome 5',
                   desc: 'A Besta domina. Não impede a ação: cobra Força de Vontade para agir com clareza.' },
    exangue:     { nome: 'Sem Vitae', remove: ['sangue'], desc: 'Não há sangue para pagar Provocação.' }
  },

  ALCANCES: {
    toque:     { nome: 'Toque', metros: 0 },
    curto:     { nome: 'Curto', metros: 5 },
    ambiente:  { nome: 'Mesmo ambiente', metros: 15 },
    voz:       { nome: 'Alcance da voz', metros: 50 },
    visao:     { nome: 'Linha de visão', metros: 100 },
    longo:     { nome: 'Longa distância', metros: 1000 },
    ilimitado: { nome: 'Sem limite de distância', metros: Infinity }
  },

  DISCIPLINA_EXIGE: {
    animalismo:  { capacidades: ['fala', 'visao'], alcance: 'voz',
                   nota: 'Você fala com o animal e o encara. Sem voz ou sem visão, não há comando.' },
    auspicios:   { capacidades: [], alcance: 'visao' },
    celeridade:  { capacidades: ['corpo', 'movimento'], alcance: 'toque' },
    dominacao:   { capacidades: ['fala', 'visao'], alcance: 'curto',
                   nota: 'Exige contato visual e voz de comando.' },
    fortitude:   { capacidades: ['corpo'], alcance: 'toque' },
    ofuscacao:   { capacidades: [], alcance: 'toque' },
    potencia:    { capacidades: ['corpo'], alcance: 'toque' },
    presenca:    { capacidades: ['visao'], alcance: 'ambiente' },
    metamorfose: { capacidades: ['corpo'], alcance: 'toque' },
    feiticaria:  { capacidades: ['sangue', 'maos'], alcance: 'visao',
                   nota: 'Feitiçaria exige gesto e Vitae.' },
    oblivio:     { capacidades: ['sangue'], alcance: 'visao' },
    alquimia:    { capacidades: ['maos', 'sangue'], alcance: 'toque' }
  },

  PODER_EXIGE: {
    'Voz Irresistível':   { capacidades: ['fala'], alcance: 'voz',
                            nota: 'Dispensa contato visual: basta a voz, mesmo por telefone.' },
    'Convocar':           { capacidades: [], alcance: 'ilimitado' },
    'Olhar Aterrorizante':{ capacidades: ['visao'], alcance: 'ambiente' },
    'Fascínio':           { capacidades: ['visao'], alcance: 'ambiente' },
    'Manto de Sombras':   { capacidades: [], alcance: 'toque' },
    'Sentir a Besta':     { capacidades: [], alcance: 'ambiente' },
    'Toque do Espírito':  { capacidades: ['maos'], alcance: 'toque' },
    'Clarividência':      { capacidades: ['mente'], alcance: 'ilimitado' },
    'Telepatia':          { capacidades: ['mente'], alcance: 'visao' },
    'Manto Obscuro':      { capacidades: [], alcance: 'toque' },
    'Visão de Oblívio':   { capacidades: ['visao'], alcance: 'visao' },
    'Do Pó ao Pó':        { capacidades: ['maos', 'sangue'], alcance: 'toque' },
    'Braços de Arimã':    { capacidades: ['visao', 'sangue'], alcance: 'formula',
                            formula: (nivel) => nivel * 2,
                            nota: 'Os braços alcançam o dobro do seu Oblívio em metros, e se movem por superfícies.' },
    'Projetar Sombra':    { capacidades: ['sangue'], alcance: 'formula',
                            formula: (nivel) => nivel * 2 },
    'Perspectiva da Sombria': { capacidades: ['sangue'], alcance: 'formula',
                            formula: (nivel) => nivel * 2 },
    'Precognição Fatal':  { capacidades: ['sangue'], alcance: 'visao',
                            nota: 'Precisa ver ou ouvir o alvo. Não funciona em vampiros.' },
    'Armas Ferais':       { capacidades: ['maos', 'corpo'], alcance: 'toque' },
    'Forma de Névoa':     { capacidades: ['corpo'], alcance: 'toque' },
    'Corpo Letal':        { capacidades: ['maos', 'corpo'], alcance: 'toque' }
  },

  /* AMÁLGAMAS SÃO DERIVADAS DO DADO.  (§64)

     Isto era uma lista escrita à mão com DUAS entradas, ao lado de um
     `data-disciplinas.js` que anota a amálgama no próprio poder. Duas
     listas para o mesmo fato, e elas discordavam: o livro tem oito
     amálgamas só no básico, e o motor conhecia duas.

     Agora há uma fonte só. Poder novo com `amalgama` no dado passa a
     valer sem ninguém lembrar de mexer aqui — que é o erro que esta
     função existe para não deixar acontecer de novo. */
  get AMALGAMAS() {
    if (this._amalgamas) return this._amalgamas;
    const mapa = {};
    for (const d of Object.values(DISCIPLINAS)) {
      for (const nivel of Object.values(d.poderes || {})) {
        for (const poder of nivel) {
          if (poder.amalgama) mapa[poder.nome] = poder.amalgama;
        }
      }
    }
    return (this._amalgamas = mapa);
  },

  MODIFICADORES: [
    { id: 'aparencia', tipo: 'merito', dados: (v) => v >= 4 ? 2 : 1,
      dominios: ['persuasao'], nome: 'Aparência Impressionante' },
    { id: 'malandro', tipo: 'merito', dados: (v) => v,
      dominios: ['rua'], nome: 'Malandragem' },
    { id: 'calma_beast', tipo: 'merito', dados: () => 1,
      intencoes: ['resistir_frenesi'], nome: 'Besta Calma' },
    { id: 'cheiro_sangue', tipo: 'merito', dados: () => 1,
      intencoes: ['caçar', 'rastrear'], nome: 'Cheiro de Sangue' },
    { id: 'devocao_terreiro', tipo: 'merito', dados: (v) => v,
      dominios: ['ocultismo'], nome: 'Filho de Santo' },
    { id: 'predador_obvio', tipo: 'defeito', dados: () => -2,
      intencoes: ['caçar', 'seduzir', 'persuadir'], nome: 'Predador Óbvio' },
    { id: 'infamia', tipo: 'defeito', dados: (v) => -v,
      dominios: ['persuasao'], nome: 'Infâmia' },
    { id: 'estigma', tipo: 'defeito', dados: () => -1,
      intencoes: ['passar_por_humano', 'seduzir'], nome: 'Estigma' },
    { id: 'melindroso', tipo: 'defeito', dados: (v) => -v,
      intencoes: ['caçar'], nome: 'Comedor Melindroso' },
    { id: 'sem_mascara', tipo: 'defeito', dados: () => -2,
      intencoes: ['passar_por_humano'], nome: 'Sem Identidade' }
  ],

  capacidadesDe(estados) {
    const ativas = new Set(Object.keys(this.CAPACIDADES));
    const removidas = {};
    for (const e of estados || []) {
      const est = this.ESTADOS[e];
      if (!est) continue;
      for (const c of est.remove || []) { ativas.delete(c); removidas[c] = est.nome; }
    }
    return { ativas, removidas };
  },

  penalidadeDeEstados(estados, natureza) {
    let total = 0; const causas = [];
    for (const e of estados || []) {
      const est = this.ESTADOS[e];
      if (!est || !est.penalidade) continue;
      const p = est.penalidade;
      const aplica = p.alvo === 'todos'
        || (p.alvo === 'fisico' && natureza === 'fisico')
        || (p.alvo === 'mental_social' && natureza !== 'fisico');
      if (aplica) { total += p.dados; causas.push(`${est.nome} ${p.dados}`); }
    }
    return { dados: total, causas };
  },

  modificadoresDe(ficha, dominio, intencao) {
    const lista = [];
    for (const m of this.MODIFICADORES) {
      const fonte = m.tipo === 'merito' ? ficha.meritos : ficha.defeitos;
      const v = (fonte || {})[m.id];
      if (!v) continue;
      const casaDominio = m.dominios && dominio && m.dominios.includes(dominio);
      const casaIntencao = m.intencoes && intencao && m.intencoes.includes(intencao);
      if (!casaDominio && !casaIntencao) continue;
      const dados = m.dados(v);
      if (dados) lista.push({ nome: m.nome, dados, tipo: m.tipo });
    }
    return lista;
  },

  alcanceDe(poderNome, disciplinaId, nivel) {
    const p = this.PODER_EXIGE[poderNome];
    if (p && p.alcance === 'formula') {
      return { nome: 'Alcance calculado', metros: p.formula(nivel || 1), nota: p.nota };
    }
    if (p && p.alcance) return Object.assign({}, this.ALCANCES[p.alcance], { nota: p.nota });
    const d = this.DISCIPLINA_EXIGE[disciplinaId];
    if (d) return Object.assign({}, this.ALCANCES[d.alcance], { nota: d.nota });
    return this.ALCANCES.ambiente;
  },

  exigenciasDe(poderNome, disciplinaId) {
    const p = this.PODER_EXIGE[poderNome];
    if (p) return { capacidades: p.capacidades || [], nota: p.nota };
    const d = this.DISCIPLINA_EXIGE[disciplinaId];
    if (d) return { capacidades: d.capacidades || [], nota: d.nota };
    return { capacidades: [] };
  },

  avaliar({ ficha, estados = [], texto = '', intencao = null, alvo = null,
            dificuldade = null, fala = null }) {
    const leitura = intencao
      ? { intencao, acao: this.ACOES[intencao], confianca: 1, termos: [] }
      : this.interpretar(texto);

    const bloqueios = [], avisos = [], custos = [];
    const cap = this.capacidadesDe(estados);

    if (!leitura.acao) {
      return { possivel: null, leitura, bloqueios, avisos: ['Intenção não reconhecida pelo léxico.'],
               custos, rotas: [], escalar: true };
    }

    const acao = leitura.acao;
    const natureza = ['confronto', 'furtividade', 'rua'].includes(acao.dominio) ? 'fisico' : 'mental';

    if (acao.seita && acao.seita !== ficha.seita) {
      bloqueios.push({ tipo: 'seita',
        motivo: `${acao.nome} é prática do ${Seitas.perfil(acao.seita).nome}, e você não é ${
          Seitas.perfil(acao.seita).lexico.tratamento} deles.` });
    }

    let disciplinaId = leitura.disciplina || (leitura.poder && leitura.poder.disciplina) || (acao.disciplina && acao.disciplina.id);
    let poderNome = leitura.poder && leitura.poder.nome;
    const nivelTem = disciplinaId ? (ficha.disciplinas || {})[disciplinaId] || 0 : 0;

    if (disciplinaId) {
      const nivelMin = acao.disciplina ? acao.disciplina.nivel : 1;
      if (nivelTem < nivelMin) {
        bloqueios.push({ tipo: 'disciplina',
          motivo: `Você não tem ${DISCIPLINAS[disciplinaId]?.nome || disciplinaId} ${nivelMin}. Seu nível é ${nivelTem}.` });
      }
      if (poderNome) {
        const conhecidos = (ficha.poderes || {})[disciplinaId] || [];
        if (!conhecidos.includes(poderNome)) {
          bloqueios.push({ tipo: 'poder', motivo: `Você não conhece o poder ${poderNome}.` });
        }
        const am = this.AMALGAMAS[poderNome];
        if (am) {
          const t = (ficha.disciplinas || {})[am.disciplina] || 0;
          if (t < am.nivel) {
            bloqueios.push({ tipo: 'amalgama',
              motivo: `${poderNome} é Amálgama: exige ${DISCIPLINAS[am.disciplina]?.nome} ${am.nivel}. Você tem ${t}.` });
          }
        }
      }
    }

    const exig = disciplinaId ? this.exigenciasDe(poderNome, disciplinaId) : { capacidades: acao.exige || [] };
    const precisa = new Set([...(acao.exige || []), ...(exig.capacidades || [])]);
    for (const c of precisa) {
      if (!cap.ativas.has(c)) {
        bloqueios.push({ tipo: 'estado',
          motivo: `${this.CAPACIDADES[c]} é necessário, e você está ${cap.removidas[c]}.` });
      }
    }
    if (exig.nota) avisos.push(exig.nota);

    let alcance = null;
    if (disciplinaId) alcance = this.alcanceDe(poderNome, disciplinaId, nivelTem);
    else if (acao.alcance) alcance = this.ALCANCES[acao.alcance];

    if (alcance && alvo && typeof alvo.distancia === 'number') {
      if (alvo.distancia > alcance.metros) {
        bloqueios.push({ tipo: 'alcance',
          motivo: `Alcance de ${alcance.metros === Infinity ? 'ilimitado' : alcance.metros + ' m'}, e o alvo está a ${alvo.distancia} m.` });
      }
      if (precisa.has('visao') && alvo.visivel === false) {
        bloqueios.push({ tipo: 'alcance', motivo: 'Você precisa ver o alvo, e não há linha de visão.' });
      }
      if (precisa.has('fala') && alvo.audivel === false) {
        bloqueios.push({ tipo: 'alcance', motivo: 'O alvo precisa ouvir você, e não ouve.' });
      }
    }

    if (disciplinaId && disciplinaId !== 'auspicios') {
      if (!cap.ativas.has('sangue')) {
        bloqueios.push({ tipo: 'custo', motivo: 'O poder exige Provocação e você não tem Vitae.' });
      } else {
        custos.push({ tipo: 'provocacao', nota: 'Uma Provocação. Pode subir a Fome.' });
      }
    }
    if ((ficha.fome || 0) >= 5) {
      avisos.push('Fome 5: só age racionalmente gastando Força de Vontade.');
    }

    let vozAvaliada = null;
    if (fala) {
      vozAvaliada = this.avaliarFala({ ficha, estados, volume: fala.volume,
                                       alvo: fala.alvo, dominio: acao.dominio });
      vozAvaliada.bloqueios.forEach(b => bloqueios.push(b));
      vozAvaliada.avisos.forEach(a => avisos.push(a));
    }

    const pen = this.penalidadeDeEstados(estados, natureza);
    const mods = this.modificadoresDe(ficha, acao.dominio, leitura.intencao);
    if (vozAvaliada && vozAvaliada.modificador) {
      mods.push({ nome: vozAvaliada.volume.nome, dados: vozAvaliada.modificador, tipo: 'voz' });
    }
    let dif = dificuldade != null ? dificuldade
      : (typeof Ficha !== 'undefined' ? Ficha.calibragem(ficha).dificuldadeBase : 3);
    let origemDificuldade = dificuldade != null ? 'definida pelo Narrador' : 'calibrada pela ficha';

    if (leitura.intencao === 'caçar') {
      const m = this.cacaEmMatilha(ficha);
      if (m && m.dentroDaArea) {
        avisos.push(`Perambulação ${m.perambulacao}: caçando dentro da área da matilha ${m.matilha}, o resultado é sucesso com um custo — a Fome sacia e fica um rastro sangrento.`);
      } else if (m) {
        avisos.push(`Fora da área de Perambulação: a dificuldade de caça da matilha é a padrão.`);
      }
    }

    if (leitura.intencao === 'caçar' && alvo) {
      if (typeof alvo.campoDeCaca === 'number') {
        dif = alvo.campoDeCaca;
        const c = Escudo.CAMPO_DE_CACA.find(x => x.dificuldade === dif);
        origemDificuldade = `campo de caça${c ? ': ' + c.lugares : ''}`;
      } else if (alvo.zona) {
        const campo = this.dificuldadeDeCaca(alvo.zona);
        if (campo) {
          dif = campo.dificuldade;
          origemDificuldade = `campo de caça: ${campo.lugares}`;
        }
      }
    }
    if (leitura.intencao === 'atirar' && alvo && alvo.cobertura) {
      const cob = Escudo.COBERTURA.find(c => this.normalizar(c.nome) === this.normalizar(alvo.cobertura));
      if (cob) {
        dif = Math.max(1, dif + cob.modificador);
        avisos.push(`${cob.nome}: ${cob.modificador >= 0 ? '+' : ''}${cob.modificador} na dificuldade do tiro.`);
      }
    }
    if (alvo && alvo.oposicao) {
      const op = this.oposicaoDe(alvo.oposicao);
      dif = alvo.oposicao;
      origemDificuldade = `oposição ${op.nome} — ${op.exemplos}`;
    }

    let candidatas = acao.rotas || [];
    if (!candidatas.length && leitura.intencao === 'caçar') candidatas = this.rotasDeCaca(ficha);

    const rotas = candidatas.map(r => {
      const pf = this.piscinaFinal(ficha, { rota: r, estados, dominio: acao.dominio,
                                            intencao: leitura.intencao, fala,
                                            disciplina: disciplinaId, texto });
      return Object.assign({}, pf, {
        atributo: r.atributo, pericia: r.pericia, atributo2: r.atributo2,
        enquadramento: r.enquadramento, risco: r.risco,
        /* §63 (A4): algumas rotas custam Dificuldade a mais — o caminho
           eletrônico do arrombamento é +1 (básico, pág. 410). */
        dificuldadeExtra: r.dificuldade || 0, nota: r.nota || '',
        piscina: pf.total, viavel: pf.total > 0
      });
    }).filter(r => r.viavel);

    if (!rotas.length && candidatas.length) {
      bloqueios.push({ tipo: 'piscina', motivo: 'Nenhuma rota sobra com dados suficientes para tentar.' });
    }
    if (rotas.length && !rotas.some(r => r.piscina >= 5)) {
      avisos.push('Nenhuma rota confortável: a melhor tem poucos dados.');
    }

    return {
      possivel: bloqueios.length === 0,
      leitura, acao: { id: leitura.intencao, nome: acao.nome, dominio: acao.dominio },
      bloqueios, avisos, custos, alcance, fala: vozAvaliada,
      dificuldade: dif,
      dificuldadeDescrita: this.dificuldadeDescrita(dif),
      origemDificuldade,
      rotas: rotas.sort((a, b) => b.piscina - a.piscina),
      escalar: leitura.confianca < 0.45 || !!leitura.ambiguo
    };
  },

  rotasDeCaca(ficha) {
    const p = predadorDe(ficha.predador);
    if (!p || !p.piscinas) return [];
    const rotas = p.piscinas.map(([a, h]) => ({
      atributo: a, pericia: h,
      enquadramento: p.nome.toLowerCase(),
      risco: p.defeitos && p.defeitos.length ? p.defeitos[0].nome : ''
    }));
    const m = this.cacaEmMatilha(ficha);
    if (m && m.companheiros > 0) {
      rotas.push({ atributo: 'carisma', pericia: 'lideranca',
                   enquadramento: 'o Sacerdote conduz e a matilha ajuda',
                   risco: 'deixar a matilha com fome custa o cargo',
                   bonusMatilha: m.companheiros });
    }
    return rotas;
  },

  cacaEmMatilha(ficha) {
    if (typeof Seitas === 'undefined') return null;
    if (perfilDe(ficha).bussola.tipo !== 'caminho') return null;
    const d = (ficha.seitaDados || {}).sabbat || {};
    if (!(d.matilha && d.matilha.nome)) return null;
    const grupo = typeof Matilha !== 'undefined' ? Matilha.de(ficha) : null;
    const arena = (grupo && grupo.arena) || d.arena || {};
    const companheiros = grupo
      ? Math.max(0, grupo.membros.length - 1)
      : (d.companheiros == null ? 2 : d.companheiros);
    return {
      matilha: grupo ? grupo.nome : d.matilha.nome,
      perambulacao: arena.perambulacao || 0,
      companheiros,
      dentroDaArea: (arena.perambulacao || 0) > 0
    };
  },

  piscinaFinal(ficha, { rota, estados = [], dominio = null, intencao = null, fala = null,
                        disciplina = null, texto = '', belezaDoLocal = null, luz = null }) {
    /* §73 (H1): com o texto da ação em mãos, a especialização deixa de
       ser dado de graça e passa a valer só quando a tarefa se enquadra. */
    const casa = this.casadorDeEspecializacao(texto || intencao || '');
    const base = rota.pericia
      ? Dados.piscinaDe(ficha, rota.atributo, rota.pericia, casa ? { casaEspecializacao: casa } : undefined)
      : { total: (ficha.atributos[rota.atributo] || 0) + (ficha.atributos[rota.atributo2] || 0),
          especializacao: 0, atributoId: rota.atributo, periciaId: rota.atributo2 };

    const natureza = ['confronto', 'furtividade', 'rua'].includes(dominio) ? 'fisico' : 'mental';
    const pen = this.penalidadeDeEstados(estados, natureza);
    const mods = this.modificadoresDe(ficha, dominio, intencao);

    if (fala) {
      const v = this.avaliarFala({ ficha, estados, volume: fala.volume, alvo: fala.alvo, dominio });
      if (v.modificador) mods.push({ nome: v.volume.nome, dados: v.modificador, tipo: 'voz' });
    }
    if (rota.bonusMatilha) {
      mods.push({ nome: `Matilha (${rota.bonusMatilha} companheiro${rota.bonusMatilha === 1 ? '' : 's'})`,
                  dados: rota.bonusMatilha, tipo: 'matilha' });
    }
    /* §95 (A10) — AS PERDIÇÕES DE CLÃ ENTRAM AQUI.

       Quatro das seis terminam neste mesmo lugar, porque as quatro
       fazem a mesma coisa: tiram dados de uma parada. Elas entram como
       modificador negativo, junto dos outros, e o piso de 1 dado do
       §63 (A1) continua segurando o fundo — o livro manda rolar o
       dado, e Perdição nenhuma pode zerar uma parada.

       Elas vêm ANTES dos bônus de propósito: quem lê a lista na tela
       vê primeiro o que o sangue cobra, e depois o que ele dá. */
    if (typeof Perdicoes !== 'undefined') {
      mods.push(...Perdicoes.modificadores(ficha, {
        atributo: base.atributoId || rota.atributo, disciplina, texto, belezaDoLocal }));
    }

    /* §96 — a luz do ambiente, que só Oblívio paga (Oblivio.pdf, pág. 4).
       O caso que IMPEDE não passa por aqui: sem sombra não há parada a
       montar, e quem responde isso é `MotorOblivio.vereditoDaLuz`. */
    if (typeof MotorOblivio !== 'undefined') {
      mods.push(...MotorOblivio.modificadores(ficha, { disciplina, luz }));
    }

    const bonusPS = this.bonusDePotencia(ficha, disciplina);
    if (bonusPS) mods.push(bonusPS);
    const bonusRes = this.bonusDeRessonancia(ficha, disciplina);
    if (bonusRes) mods.push(bonusRes);

    const soma = mods.reduce((a, m) => a + m.dados, 0);
    /* Piso de 1 dado (§63, A1). Era Math.max(0, ...), e zero fazia a rota ser
       descartada por `viavel` — a ação nem era oferecida. O livro manda rolar
       o dado (básico, págs. 119 e 120). */
    const total = Math.max(1, base.total + pen.dados + soma);
    return {
      base: base.total, especializacao: base.especializacao,
      modificadores: mods, penalidadeEstado: pen.dados, causasEstado: pen.causas,
      total,
      rotulo: rota.pericia
        ? `${nomeAtributo(rota.atributo)} + ${nomeHabilidade(rota.pericia)}`
        : `${nomeAtributo(rota.atributo)} + ${nomeAtributo(rota.atributo2)}`
    };
  },

  /* ----------------------------------------------------------
     O DADO DA RESSONÂNCIA  (§67)

     Básico, pág. 228: "Beber sangue com temperamento intenso
     confere ao bebedor um dado adicional em paradas de dados
     relacionadas a uma Disciplina que corresponda àquela
     Ressonância."

     Duas travas, e as duas são do livro:
       — só vale se a Disciplina em uso for uma das DUAS que
         aquela Ressonância alimenta (tabela da pág. 227);
       — só vale com temperamento INTENSO ou AGUDO. Efêmero não
         dá dado nenhum, e a maioria das vítimas é efêmera.

     Antes da §67 a Ressonância era um nome no rodapé da ficha:
     com ou sem ela, a parada dava o mesmo número.
     ---------------------------------------------------------- */
  /* ----------------------------------------------------------
     "SE A TAREFA SE ENQUADRA NA ESPECIALIZAÇÃO"  (§73, item H1)

     O livro deixa isso com o Narrador (pág. 159). Numa mesa solo,
     quem faz esse papel é o léxico: a especialização vale quando o
     nome dela aparece no que o jogador escreveu.

     Regras do casamento, e cada uma tem motivo:
       — por PALAVRA, não por substring: "Facas" não casa "fachada";
       — singular e plural contam igual: "Facas" casa "a faca";
       — palavra com menos de 4 letras não decide sozinha ("Um Por
         Cento", "GTA") — nesses casos exige a expressão inteira;
       — basta UMA palavra longa casar: "Combate Esportivo" vale numa
         luta de "combate".

     Quando não há texto — a folha desenhando a parada, o combate
     resolvendo por modelo —, não há tarefa a enquadrar, e o
     predicado não é passado: o dado entra, como entrava.
     ---------------------------------------------------------- */
  casadorDeEspecializacao(texto) {
    const alvo = this.normalizar(texto || '');
    if (!alvo) return null;
    /* Dobra singular e plural no mesmo talo. O caso que obrigou a
       tratar `ns` primeiro: "Lobisomens" e "lobisomem" — sem isso, a
       especialização casava o plural e perdia o singular. */
    const semPlural = (w) => w.replace(/ns$/, 'm').replace(/s$/, '');
    const palavras = new Set(alvo.split(/[^\p{L}\p{N}]+/u).filter(Boolean).map(semPlural));
    return (nomeEsp) => {
      const n = this.normalizar(nomeEsp || '');
      if (!n) return false;
      if (Lexico.contemTermo(alvo, n)) return true;        /* a expressão inteira */
      const partes = n.split(/[^\p{L}\p{N}]+/u).filter(x => x.length >= 4).map(semPlural);
      return partes.some(p => palavras.has(p));
    };
  },

  bonusDeRessonancia(ficha, disciplina) {
    if (!disciplina || !ficha || typeof Ressonancia === 'undefined') return null;
    const r = Ressonancia.por(ficha.ressonancia);
    if (!r || !r.disciplinas.includes(disciplina)) return null;
    const t = Ressonancia.temperamentoPor(ficha.temperamento);
    if (!t || !t.dados) return null;
    return { nome: `Ressonância ${r.nome} (${t.nome})`, dados: t.dados, tipo: 'ressonancia' };
  },

  bonusDePotencia(ficha, disciplina) {
    if (!disciplina) return null;
    if (typeof derivados !== 'function') return null;
    const ps = derivados(ficha).potencia || 0;
    const dados = Math.floor(ps / 2);
    if (dados <= 0) return null;
    return { nome: `Potência de Sangue ${ps}`, dados, tipo: 'potencia' };
  },

  explicar(v) {
    if (v.possivel === null) return 'Não reconheci a ação. O Narrador precisa interpretar.';
    if (!v.possivel) return 'Não dá: ' + v.bloqueios.map(b => b.motivo).join(' ');
    const melhor = v.rotas[0];
    return `Pode. Melhor rota: ${melhor.rotulo}, ${melhor.piscina} dados, dificuldade ${v.dificuldade}.`;
  }
};

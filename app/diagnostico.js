/* ============================================================
   VITÆ — Diagnóstico
   Os dois validadores que viviam em scripts de sessão e se
   perdiam: referências (todo id citado existe?) e comportamento
   (a regra chega mesmo ao dado?).

   O segundo é o que importa. O Árbitro já passou em todos os
   testes isolados uma vez, e mesmo assim seus modificadores não
   chegavam aos dados. Teste a costura, não só a peça.
   ============================================================ */

const Diagnostico = {
  resultados: [],

  checar(grupo, nome, fn) {
    let estado = 'ok', detalhe = '';
    try {
      const r = fn();
      if (r === true || r === undefined) estado = 'ok';
      else if (r === false) { estado = 'falhou'; detalhe = 'condição falsa'; }
      else if (Array.isArray(r)) {
        if (r.length) { estado = 'falhou'; detalhe = r.slice(0, 8).join(' · ') + (r.length > 8 ? ` … +${r.length - 8}` : ''); }
      } else if (typeof r === 'string') { estado = 'falhou'; detalhe = r; }
      else if (r && typeof r === 'object' && r.detalhe) { estado = r.ok ? 'ok' : 'falhou'; detalhe = r.detalhe; }
    } catch (e) {
      estado = 'erro'; detalhe = e.message;
    }
    this.resultados.push({ grupo, nome, estado, detalhe });
  },

  fichaDeTeste(extra) {
    const f = FICHA_VAZIA();
    Object.assign(f, {
      nome: 'Cobaia', cla: 'lasombra', geracao: '12', cidade: 'rio', seita: 'camarilla',
      modoHabilidade: 'equilibrado', predador: 'sereia'
    });
    f.atributos = { forca: 2, destreza: 3, vigor: 3, carisma: 3, manipulacao: 3, autocontrole: 2,
                    inteligencia: 2, raciocinio: 3, determinacao: 2 };
    f.habilidades = { briga: 2, labia: 3, persuasao: 3, furtividade: 2, investigacao: 2,
                      consciencia: 2, ocultismo: 1, manha: 2, atletismo: 2, intimidacao: 2 };
    f.disciplinas = { ofuscacao: 2, potencia: 1 };
    f.poderes = { ofuscacao: ['Manto das Sombras', 'Passo Invisível'], potencia: ['Poder Letal'] };
    f.conviccoes = ['Não toco em criança', '', ''];
    f.marcos = ['Bia', '', ''];
    return Object.assign(f, extra || {});
  },

  /* ---------- referências ---------- */

  referencias() {
    const idsDisc = Object.keys(DISCIPLINAS);
    const idsAtr = Object.values(ATRIBUTOS).flatMap(g => g.lista.map(a => a.id));
    const idsHab = Object.values(HABILIDADES).flatMap(g => g.lista.map(h => h.id));
    const idsCla = CLAS.map(c => c.id);
    const idsPred = PREDADORES.map(p => p.id);
    const idsSeita = SEITAS.map(s => s.id);
    const idsDominio = Object.keys(Ficha.DOMINIOS);
    const idsAcao = Object.keys(Arbitro.ACOES);
    const idsMerito = MERITOS.map(m => m.id);
    const idsDefeito = DEFEITOS.map(m => m.id);
    const idsAnt = ANTECEDENTES.map(a => a.id);

    const G = 'Referências';

    this.checar(G, 'Disciplinas de clã existem', () =>
      CLAS.flatMap(c => (c.disciplinas || []).filter(d => !idsDisc.includes(d))
        .map(d => `${c.id}: ${d}`)));

    this.checar(G, 'Clãs citados nas cidades existem', () =>
      CIDADES.flatMap(c => (c.clas || []).filter(x => !idsCla.includes(x))
        .map(x => `${c.id}: ${x}`)));

    this.checar(G, 'Predadores típicos das cidades existem', () =>
      CIDADES.flatMap(c => (c.predadoresTipicos || []).filter(x => !idsPred.includes(x))
        .map(x => `${c.id}: ${x}`)));

    this.checar(G, 'Ressonância das cidades existe', () =>
      CIDADES.filter(c => c.ressonancia && !RESSONANCIAS.some(r => r.id === c.ressonancia))
        .map(c => `${c.id}: ${c.ressonancia}`));

    this.checar(G, 'Disciplinas dos Predadores existem', () =>
      PREDADORES.flatMap(p => (p.disciplina || []).filter(d => !idsDisc.includes(d))
        .map(d => `${p.id}: ${d}`)));

    this.checar(G, 'Piscinas dos Predadores usam ids válidos', () =>
      PREDADORES.flatMap(p => (p.piscinas || []).flatMap(([a, h]) => {
        const erros = [];
        if (!idsAtr.includes(a)) erros.push(`${p.id}: atributo ${a}`);
        if (!idsHab.includes(h)) erros.push(`${p.id}: habilidade ${h}`);
        return erros;
      })));

    this.checar(G, 'Todo Predador tem piscinas (senão caçar não monta rota)', () =>
      PREDADORES.filter(p => !p.piscinas || !p.piscinas.length).map(p => p.id));

    this.checar(G, 'Especializações dos Predadores usam habilidades válidas', () =>
      PREDADORES.flatMap(p => ((p.especializacao || {}).opcoes || [])
        .filter(([h]) => !idsHab.includes(h)).map(([h]) => `${p.id}: ${h}`)));

    this.checar(G, 'Rotas das ações usam ids válidos', () =>
      Object.entries(Arbitro.ACOES).flatMap(([id, a]) => (a.rotas || []).flatMap(r => {
        const erros = [];
        if (r.atributo && !idsAtr.includes(r.atributo)) erros.push(`${id}: atributo ${r.atributo}`);
        if (r.atributo2 && !idsAtr.includes(r.atributo2)) erros.push(`${id}: atributo2 ${r.atributo2}`);
        if (r.pericia && !idsHab.includes(r.pericia)) erros.push(`${id}: perícia ${r.pericia}`);
        return erros;
      })));

    this.checar(G, 'Domínio de cada ação existe', () =>
      Object.entries(Arbitro.ACOES).filter(([, a]) => a.dominio && !idsDominio.includes(a.dominio))
        .map(([id, a]) => `${id}: ${a.dominio}`));

    this.checar(G, 'Capacidades exigidas pelas ações existem', () =>
      Object.entries(Arbitro.ACOES).flatMap(([id, a]) =>
        (a.exige || []).filter(c => !Arbitro.CAPACIDADES[c]).map(c => `${id}: ${c}`)));

    this.checar(G, 'Alcances citados pelas ações existem', () =>
      Object.entries(Arbitro.ACOES).filter(([, a]) => a.alcance && !Arbitro.ALCANCES[a.alcance])
        .map(([id, a]) => `${id}: ${a.alcance}`));

    this.checar(G, 'Seita exigida por ação existe', () =>
      Object.entries(Arbitro.ACOES).filter(([, a]) => a.seita && !idsSeita.includes(a.seita))
        .map(([id, a]) => `${id}: ${a.seita}`));

    this.checar(G, 'Estados removem capacidades que existem', () =>
      Object.entries(Arbitro.ESTADOS).flatMap(([id, e]) =>
        (e.remove || []).filter(c => !Arbitro.CAPACIDADES[c]).map(c => `${id}: ${c}`)));

    this.checar(G, 'Poderes de PODER_EXIGE existem em alguma Disciplina', () => {
      const todos = new Set(Object.values(DISCIPLINAS)
        .flatMap(d => Object.values(d.poderes || {}).flat().map(p => p.nome)));
      return Object.keys(Arbitro.PODER_EXIGE).filter(n => !todos.has(n));
    });

    this.checar(G, 'Amálgamas apontam para Disciplinas existentes', () =>
      Object.entries(Arbitro.AMALGAMAS).filter(([, a]) => !idsDisc.includes(a.disciplina))
        .map(([n, a]) => `${n}: ${a.disciplina}`));

    this.checar(G, 'Modificadores apontam para Méritos ou Defeitos reais', () =>
      Arbitro.MODIFICADORES.filter(m =>
        !(m.tipo === 'merito' ? idsMerito : idsDefeito).includes(m.id)).map(m => `${m.tipo} ${m.id}`));

    this.checar(G, 'Modificadores citam domínios e intenções que existem', () =>
      Arbitro.MODIFICADORES.flatMap(m => [
        ...(m.dominios || []).filter(d => !idsDominio.includes(d)).map(d => `${m.id}: domínio ${d}`),
        ...(m.intencoes || []).filter(i => !idsAcao.includes(i)).map(i => `${m.id}: intenção ${i}`)
      ]));

    this.checar(G, 'Domínios do Índice de Força usam ids válidos', () =>
      Object.entries(Ficha.DOMINIOS).flatMap(([id, d]) => [
        ...d.atributos.filter(a => !idsAtr.includes(a)).map(a => `${id}: atributo ${a}`),
        ...d.pericias.filter(p => !idsHab.includes(p)).map(p => `${id}: perícia ${p}`)
      ]));

    this.checar(G, 'Antecedentes da Rede existem', () =>
      Ficha.ANTECEDENTES_REDE.filter(id => !idsAnt.includes(id)));

    this.checar(G, 'Pesos de Defeito apontam para Defeitos reais', () =>
      Object.keys(Ficha.PESO_DEFEITO).filter(id => !idsDefeito.includes(id)));

    this.checar(G, 'Atrito de clã cita clãs e seitas reais', () =>
      Object.entries(CLA_SEITA_ATRITO).flatMap(([cla, a]) => [
        ...(idsCla.includes(cla) ? [] : [`clã ${cla}`]),
        ...(a.improvavel || []).filter(s => !idsSeita.includes(s)).map(s => `${cla}: seita ${s}`)
      ]));

    this.checar(G, 'Perfis de seita cobrem todas as seitas', () =>
      idsSeita.filter(id => !PERFIS_SEITA[id]));

    this.checar(G, 'Ritae-Pilares dos Caminhos existem', () =>
      CAMINHOS.flatMap(c => (c.ritaePilares || [])
        .filter(r => !RITAE.some(x => x.id === r)).map(r => `${c.id}: ${r}`)));

    this.checar(G, 'Caminhos citados pelos Predadores do Sabá existem', () =>
      PREDADORES_SABBAT.flatMap(p => (p.caminhosComuns || [])
        .filter(c => !CAMINHOS.some(x => x.id === c)).map(c => `${p.id}: ${c}`)));

    this.checar(G, 'Traços de Arena batem com o que o código lê', () =>
      TRACOS_ARENA.filter(t => !['perambulacao', 'alcance', 'prestigio'].includes(t.id)).map(t => t.id));

    this.checar(G, 'Linhagens são declaradas para clãs reais', () =>
      Object.keys(LINHAGENS).filter(id => !idsCla.includes(id)));

    this.checar(G, 'Sementes: cena aponta para local que existe', () =>
      CIDADES.flatMap(c => {
        const s = sementeDaCidade(c.id);
        if (!s.cena || !s.cena.local) return [];
        return s.locais.some(l => l.id === s.cena.local) ? [] : [`${c.id}: ${s.cena.local}`];
      }));

    this.checar(G, 'Sementes: presentes existem entre as pessoas', () =>
      CIDADES.flatMap(c => {
        const s = sementeDaCidade(c.id);
        return ((s.cena && s.cena.presentes) || [])
          .filter(p => !s.pessoas.some(x => x.id === p)).map(p => `${c.id}: ${p}`);
      }));

    this.checar(G, 'Relações das sementes têm banco de recombinação', () => {
      const conhecidas = Object.keys(PRESENCA_POR_RELACAO);
      return CIDADES.flatMap(c => (sementeDaCidade(c.id).pessoas || [])
        .filter(p => p.relacao && !conhecidas.includes(p.relacao))
        .map(p => `${c.id}: ${p.relacao}`));
    });

    this.checar(G, 'Relações declaradas em RELACOES têm banco de recombinação', () =>
      Object.keys(RELACOES).filter(r => !PRESENCA_POR_RELACAO[r]));

    this.checar(G, 'Campanhas apontam para cidades reais', () =>
      CAMPANHAS.filter(c => c.cidade && !CIDADES.some(x => x.id === c.cidade)).map(c => c.id));

    this.checar(G, 'Fontes de sangue da doca existem na tabela do Escudo', () =>
      (typeof FONTES_DE_SANGUE === 'undefined' ? [] : FONTES_DE_SANGUE)
        .filter(f => !Arbitro.alimentacaoPor(f.fonte)).map(f => f.fonte));
  },

  /* ---------- comportamento ---------- */

  comportamento() {
    const G = 'Comportamento';

    this.checar(G, 'Modificador nomeado chega ao total da piscina', () => {
      const f = this.fichaDeTeste();
      const sem = Arbitro.piscinaFinal(f, { rota: { atributo: 'carisma', pericia: 'labia' },
        dominio: 'persuasao', intencao: 'seduzir' });
      f.meritos = { aparencia: 4 };
      const com = Arbitro.piscinaFinal(f, { rota: { atributo: 'carisma', pericia: 'labia' },
        dominio: 'persuasao', intencao: 'seduzir' });
      if (com.total !== sem.total + 2) return `esperado ${sem.total + 2}, veio ${com.total}`;
      if (!com.modificadores.some(m => m.nome === 'Aparência Impressionante')) return 'modificador não veio nomeado';
      return true;
    });

    this.checar(G, 'Defeito reduz a piscina de caça', () => {
      const f = this.fichaDeTeste();
      const sem = Arbitro.avaliar({ ficha: f, texto: 'preciso de sangue' });
      f.defeitos = { melindroso: 2 };
      const com = Arbitro.avaliar({ ficha: f, texto: 'preciso de sangue' });
      const a = sem.rotas[0] ? sem.rotas[0].total : 0;
      const b = com.rotas[0] ? com.rotas[0].total : 0;
      return b === a - 2 ? true : `esperado ${a - 2}, veio ${b}`;
    });

    this.checar(G, 'Interface e rolagem usam a MESMA piscina', () => {
      const f = this.fichaDeTeste({ meritos: { aparencia: 4 } });
      const v = Arbitro.avaliar({ ficha: f, texto: 'seduzo o segurança' });
      const rota = v.rotas[0];
      const recalculado = Arbitro.piscinaFinal(f, {
        rota, dominio: 'persuasao', intencao: v.leitura.intencao });
      return rota.total === recalculado.total ? true
        : `exibido ${rota.total}, recalculado ${recalculado.total}`;
    });

    this.checar(G, 'Alguma ação exige cada capacidade (senão a capacidade é inerte)', () => {
      const usadas = new Set();
      Object.values(Arbitro.ACOES).forEach(a => (a.exige || []).forEach(c => usadas.add(c)));
      Object.values(Arbitro.DISCIPLINA_EXIGE).forEach(d => (d.capacidades || []).forEach(c => usadas.add(c)));
      Object.values(Arbitro.PODER_EXIGE).forEach(p => (p.capacidades || []).forEach(c => usadas.add(c)));
      return Object.keys(Arbitro.CAPACIDADES).filter(c => !usadas.has(c));
    });

    this.checar(G, 'Estado derivado da ficha chega ao Árbitro', () => {
      const f = this.fichaDeTeste({ fome: 5 });
      const estados = Estado.estadosDe(f, []);
      if (!estados.includes('fome_maxima')) return 'fome_maxima não foi derivada';
      const v = Arbitro.avaliar({ ficha: f, estados, texto: 'reconheço o símbolo' });
      if (!v.avisos.some(a => /Fome 5/.test(a))) return 'Fome 5 não avisou nada ao Árbitro';
      const emFrenesi = Arbitro.avaliar({ ficha: f, estados: ['frenesi'], texto: 'reconheço o símbolo' });
      return emFrenesi.possivel === false ? true : 'frenesi não barrou ação que exige raciocínio';
    });

    this.checar(G, 'Debilitado penaliza só o físico', () => {
      const f = this.fichaDeTeste();
      f.danoSuperficial = Estado.trilhas(f).vitalidade.max;
      const estados = Estado.estadosDe(f, []);
      const fisico = Arbitro.piscinaFinal(f, { rota: { atributo: 'forca', pericia: 'briga' },
        estados, dominio: 'confronto' });
      const social = Arbitro.piscinaFinal(f, { rota: { atributo: 'carisma', pericia: 'labia' },
        estados, dominio: 'persuasao' });
      if (fisico.penalidadeEstado !== -2) return `físico deveria levar −2, levou ${fisico.penalidadeEstado}`;
      if (social.penalidadeEstado !== 0) return `social não deveria ser penalizado, levou ${social.penalidadeEstado}`;
      return true;
    });

    this.checar(G, 'Torpor barra qualquer ação', () => {
      const f = this.fichaDeTeste();
      const v = Arbitro.avaliar({ ficha: f, estados: ['torpor'], texto: 'parto pra cima dele' });
      return v.possivel === false ? true : 'torpor não barrou o ataque';
    });

    this.checar(G, 'Mortal não leva meia-lesão', () => {
      const gerado = Combate.gerarMortal ? Combate.gerarMortal('comum') : null;
      const alvo = (gerado && gerado.ficha) || Object.assign(this.fichaDeTeste(), { mortal: true, geracao: '0' });
      const antes = alvo.danoSuperficial || 0;
      Estado.aplicarDano(alvo, { quantidade: 4, tipo: 'superficial' });
      const levou = (alvo.danoSuperficial || 0) - antes;
      return levou === 4 ? true : `mortal deveria levar 4, levou ${levou}`;
    });

    this.checar(G, 'Vampiro leva metade do Superficial', () => {
      const f = this.fichaDeTeste();
      Estado.aplicarDano(f, { quantidade: 4, tipo: 'superficial' });
      return (f.danoSuperficial || 0) === 2 ? true : `esperado 2, veio ${f.danoSuperficial}`;
    });

    this.checar(G, 'Predador exclusivo de seita é barrado nas outras', () => {
      const f = this.fichaDeTeste({ seita: 'camarilla' });
      const permitidos = Seitas.predadoresPermitidos(f).map(p => p.id);
      return permitidos.includes('reivindicador') ? 'Camarilla recebeu Predador do Sabá' : true;
    });

    this.checar(G, 'Potência de Sangue do Predador do Sabá entra na ficha', () => {
      const f = this.fichaDeTeste({ seita: 'sabbat', predador: 'reivindicador', geracao: '12' });
      const base = this.fichaDeTeste({ geracao: '12' });
      const esperado = derivados(base).potencia + 1;
      return derivados(f).potencia === esperado ? true
        : `esperado ${esperado}, veio ${derivados(f).potencia}`;
    });

    this.checar(G, 'Bússola do Sabá é o Caminho, e a das outras é Humanidade', () => {
      const sab = this.fichaDeTeste({ seita: 'sabbat' });
      const cam = this.fichaDeTeste({ seita: 'camarilla' });
      if (Estado.bussolaDe(sab).tipo !== 'caminho') return 'Sabá não usa Caminho';
      if (Estado.bussolaDe(cam).tipo !== 'humanidade') return 'Camarilla não usa Humanidade';
      return true;
    });

    this.checar(G, 'Caça em matilha soma um dado por companheiro', () => {
      const f = this.fichaDeTeste({ seita: 'sabbat', predador: 'reivindicador' });
      Seitas.dados(f, 'sabbat');
      f.seitaDados.sabbat.matilha = { nome: 'Teste de Diagnóstico', tipo: '', sacerdote: '', ductus: '' };
      const grupo = Matilha.de(f);
      if (!grupo) return 'matilha não foi registrada';
      Matilha.adicionarNPC(grupo.id, 'Irmão Um', '');
      Matilha.adicionarNPC(grupo.id, 'Irmã Dois', '');
      const v = Arbitro.avaliar({ ficha: f, texto: 'preciso de sangue' });
      const rota = v.rotas.find(r => (r.modificadores || []).some(m => m.tipo === 'matilha'));
      const mapa = Matilha.todas();
      delete mapa[grupo.id];
      Matilha.guardar(mapa);
      if (!rota) return 'a rota da matilha não apareceu';
      const mod = rota.modificadores.find(m => m.tipo === 'matilha');
      return mod.dados === 2 ? true : `esperado +2 por 2 companheiros, veio +${mod.dados}`;
    });

    this.checar(G, 'Vinculum é coletivo entre fichas da mesma matilha', () => {
      const a = this.fichaDeTeste({ nome: 'Um', seita: 'sabbat' });
      const b = this.fichaDeTeste({ nome: 'Dois', seita: 'sabbat' });
      Seitas.dados(a, 'sabbat'); Seitas.dados(b, 'sabbat');
      a.seitaDados.sabbat.matilha = { nome: 'Coletiva de Diagnóstico' };
      const grupo = Matilha.de(a);
      Matilha.entrar(b, grupo.id);
      Estado.vaulderie(a);
      const va = Matilha.de(a).vinculum, vb = Matilha.de(b).vinculum;
      const mapa = Matilha.todas(); delete mapa[grupo.id]; Matilha.guardar(mapa);
      return va === vb && va === 2 ? true : `a=${va}, b=${vb}, esperado 2 e 2`;
    });

    this.checar(G, 'Filtro de material oficial esconde o que é de comunidade', () => {
      const antes = Seitas.soOficial();
      const f = this.fichaDeTeste({ seita: 'sabbat' });
      Seitas.definirSoOficial(true);
      const pred = Seitas.predadoresPermitidos(f).filter(p => p.seita).length;
      const ritae = Seitas.filtrar(RITAE).length;
      Seitas.definirSoOficial(antes);
      if (pred !== 0) return `${pred} Predadores de comunidade sobreviveram ao filtro`;
      if (ritae >= RITAE.length) return 'nenhum Ritae foi filtrado';
      return true;
    });

    this.checar(G, 'Recombinador não responde quando há teste a fazer', () => {
      const f = this.fichaDeTeste();
      const leitura = Arbitro.interpretar('arrombo a porta', 'agir');
      const veredito = Arbitro.avaliar({ ficha: f, texto: 'arrombo a porta' });
      const r = Recombinador.tentar({ ficha: f, cena: { local: 'x', presentes: [] },
        locais: [], pessoas: [], fatos: [], fios: [], modo: 'agir', leitura, veredito, usados: [] });
      return r === null ? true : 'recombinou uma ação que pedia rolagem';
    });

    this.checar(G, 'Recombinador responde a olhar em volta, e cita o local', () => {
      const f = this.fichaDeTeste();
      const locais = [{ id: 'bar', nome: 'Bar', descricao: 'Um balcão comprido de fórmica, com o verniz gasto no meio. O dono não olha para ninguém.' }];
      const veredito = Arbitro.avaliar({ ficha: f, texto: 'olho em volta' });
      const r = Recombinador.tentar({ ficha: f, cena: { local: 'bar', presentes: [] },
        locais, pessoas: [], fatos: [], fios: [], modo: 'examinar',
        leitura: Arbitro.interpretar('olho em volta', 'examinar'), veredito, usados: [] });
      if (!r) return 'não recombinou';
      if (!/balcão|dono/.test(r.texto)) return 'não aproveitou a descrição do local';
      return true;
    });

    this.checar(G, 'Ficha nova cai na faixa calibrada de Índice de Força', () => {
      const f = this.fichaDeTeste();
      f.antecedentes = { contatos: 2, recursos: 2, refugio: 1, mascara: 1 };
      const i = Ficha.indiceForca(f).total;
      return (i >= 30 && i <= 60) ? true : `IF ${i} fora da faixa esperada de 30 a 60`;
    });

    this.checar(G, 'Grupo de seita não rebaixa ficha sem grupo', () => {
      const f = this.fichaDeTeste({ seita: 'camarilla' });
      const antes = Ficha.indiceForca(f).total;
      const g = this.fichaDeTeste({ seita: 'camarilla' });
      g.seitaDados = {};
      return Ficha.indiceForca(g).total === antes ? true : 'o componente Rede mudou sem grupo';
    });

    this.checar(G, 'Ficha antiga, sem seitaDados, continua carregando', () => {
      const f = this.fichaDeTeste();
      delete f.seitaDados;
      const migrada = migrarFicha(f);
      Ficha.indiceForca(migrada);
      Ficha.extrair(migrada);
      return true;
    });

    this.checar(G, 'Sessão da mesa sobrevive a ida e volta pelo JSON', () => {
      const f = this.fichaDeTeste();
      const copia = JSON.parse(JSON.stringify({ ficha: f, cronicas: [], recombinados: [] }));
      return copia.ficha.nome === 'Cobaia' ? true : 'a ficha não sobreviveu à serialização';
    });
  },

  arquitetura() {
    const G = 'Arquitetura';

    this.checar(G, 'A escada tem os degraus na ordem documentada', () => {
      const e = new Escada([new DegrauArbitro(), new DegrauCampanha(Diretor),
                            new DegrauRecombinacao(Recombinador), new DegrauNarrador(Narrador)]);
      const numeros = e.degraus.map(d => d.numero);
      const ordenada = numeros.every((n, i) => i === 0 || n > numeros[i - 1]);
      if (!ordenada) return `fora de ordem: ${numeros.join(', ')}`;
      return true;
    });

    this.checar(G, 'Só o degrau do Narrador custa chamada', () => {
      const e = new Escada([new DegrauArbitro(), new DegrauCampanha(Diretor),
                            new DegrauRecombinacao(Recombinador), new DegrauNarrador(Narrador)]);
      const caros = e.degraus.filter(d => d.custa).map(d => d.nome);
      return caros.length === 1 && caros[0] === 'Narrador' ? true : `custam: ${caros.join(', ')}`;
    });

    this.checar(G, 'Todo degrau cumpre a interface atende/responder', () => {
      const classes = [DegrauArbitro, DegrauCampanha, DegrauRecombinacao, DegrauNarrador];
      return classes.filter(C => {
        const d = new C(Diretor);
        return typeof d.atende !== 'function' || typeof d.responder !== 'function'
            || typeof d.numero !== 'number';
      }).map(C => C.name);
    });

    this.checar(G, 'A escada para no primeiro degrau que atende', () => {
      const marcas = [];
      class Sempre extends Degrau {
        constructor(n) { super(n, 'teste' + n, false); }
        atende() { marcas.push(this.numero); return true; }
        responder() { return { tipo: 'narracao', texto: 'x', degrau: this.numero }; }
      }
      const e = new Escada([new Sempre(1), new Sempre(2)]);
      let resultado = null;
      e.descer({}).then(r => { resultado = r; });
      return marcas.length === 1 && marcas[0] === 1 ? true : `avaliou ${marcas.join(', ')}`;
    });
  },

  seguranca() {
    const G = 'Segurança';

    this.checar(G, 'Id do modelo com aspas é saneado na ingestão', () => {
      const lista = [];
      mesclar(lista, { id: 'x" onmouseover="alert(1)', nome: 'Injetado' }, 'pes_');
      const id = lista[0].id;
      if (/["'<>]/.test(id)) return `id perigoso entrou: ${id}`;
      if (!/^[a-z0-9_]{1,40}$/.test(id)) return `id fora do formato: ${id}`;
      return true;
    });

    this.checar(G, 'Id com acento e espaço vira id válido', () => {
      const lista = [];
      mesclar(lista, { id: 'Moço de Terno Claro', nome: 'X' }, 'pes_');
      return lista[0].id === 'moco_de_terno_claro' ? true : `veio ${lista[0].id}`;
    });

    this.checar(G, 'Id vazio ganha um id gerado, não quebra', () => {
      const lista = [];
      mesclar(lista, { id: '', nome: 'X' }, 'pes_');
      return /^pes_/.test(lista[0].id) ? true : `veio ${lista[0].id}`;
    });

    this.checar(G, 'Todo data-id de entidade do modelo é escapado no HTML', () => {
      const fonte = docaPessoas.toString() + docaLocais.toString();
      const cruas = [...fonte.matchAll(/data-id="\$\{(?!esc\()([^}]*)\}/g)].map(m => m[1]);
      return cruas;
    });

    this.checar(G, 'Ids longos demais são cortados', () => {
      const lista = [];
      mesclar(lista, { id: 'a'.repeat(200), nome: 'X' }, 'pes_');
      return lista[0].id.length <= 40 ? true : `${lista[0].id.length} caracteres`;
    });
  },

  combate() {
    const G = 'Combate';

    const briga = () => {
      const eu = Object.assign(this.fichaDeTeste(), { nome: 'Eu' });
      eu.atributos.destreza = 5; eu.atributos.raciocinio = 5;
      const outro = Combate.gerarMortal('comum').ficha;
      outro.nome = 'Outro';
      outro.atributos.destreza = 1; outro.atributos.raciocinio = 1;
      return [{ ref: 'voce', nome: 'Eu', ficha: eu, estados: [] },
              { ref: 'op:1', nome: 'Outro', ficha: outro, estados: [] }];
    };

    this.checar(G, 'Iniciativa usa Destreza + Raciocínio e um d10', () => {
      const f = this.fichaDeTeste();
      f.atributos.destreza = 3; f.atributos.raciocinio = 4;
      const i = Rodada.iniciativaDe(f, []);
      if (i.base !== 7) return `base ${i.base}, esperado 7`;
      if (i.dado < 1 || i.dado > 10) return `d10 fora da faixa: ${i.dado}`;
      return i.total === i.base + i.dado ? true : 'total não bate com base + dado';
    });

    this.checar(G, 'Estado que penaliza físico atrasa na iniciativa', () => {
      const f = this.fichaDeTeste();
      f.atributos.destreza = 3; f.atributos.raciocinio = 3;
      const limpo = Rodada.iniciativaDe(f, []);
      const ferido = Rodada.iniciativaDe(f, ['debilitado']);
      if (!Arbitro.ESTADOS.debilitado) return 'estado debilitado não existe mais';
      return ferido.penalidade < 0 && (limpo.base + ferido.penalidade) < limpo.base
        ? true : `penalidade ${ferido.penalidade} não chegou à iniciativa`;
    });

    this.checar(G, 'Ordem sai decrescente e todo mundo entra uma vez', () => {
      const lista = briga();
      const r = Rodada.abrir(lista);
      if (!r || r.ordem.length !== 2) return 'ordem incompleta';
      if (r.ordem[0].total < r.ordem[1].total) return 'ordem não está decrescente';
      const refs = r.ordem.map(x => x.ref);
      return new Set(refs).size === refs.length ? true : 'alguém entrou duas vezes';
    });

    this.checar(G, 'Só age quem está na vez', () => {
      const lista = briga();
      const r = Rodada.abrir(lista);
      const primeiro = Rodada.atual(r);
      const outro = r.ordem.find(x => x.ref !== primeiro.ref);
      return Rodada.vezDe(r, primeiro.ref) && !Rodada.vezDe(r, outro.ref)
        ? true : 'a vez não é exclusiva';
    });

    this.checar(G, 'Rodada vira quando todos agiram, e renumera', () => {
      const lista = briga();
      let r = Rodada.abrir(lista);
      let passo = Rodada.avancar(r, lista);
      if (passo.fim) return 'fechou cedo demais';
      passo = Rodada.avancar(passo.rodada, lista);
      if (passo.fim) return 'fechou com dois de pé';
      return passo.rodada.numero === 2 ? true : `rodada ${passo.rodada.numero}, esperado 2`;
    });

    this.checar(G, 'Quem cai sai da ordem e a briga fecha', () => {
      const lista = briga();
      const r = Rodada.abrir(lista);
      const alvo = lista[1];
      Estado.aplicarDano(alvo.ficha, { quantidade: 40, tipo: 'agravado', fonte: 'teste', semMetade: true });
      if (!Rodada.foraDeCombate(alvo)) return 'mortal drenado continua de pé';
      const passo = Rodada.avancar(r, lista);
      if (!passo.fim) return 'a briga não fechou com um só de pé';
      return passo.rodada.ordem.every(x => x.ref !== alvo.ref) ? true : 'o caído ficou na ordem';
    });

    this.checar(G, 'Vampiro Debilitado ainda luta; em torpor, não', () => {
      const f = this.fichaDeTeste();
      const c = { ref: 'voce', nome: 'Eu', ficha: f, estados: [] };
      const max = Estado.trilhas(f).vitalidade.max;
      Estado.aplicarDano(f, { quantidade: max * 3, tipo: 'superficial', fonte: 'teste' });
      if (Rodada.foraDeCombate(c)) return 'Debilitado saiu da briga, e não devia';
      Estado.aplicarDano(f, { quantidade: max, tipo: 'agravado', fonte: 'teste' });
      return Rodada.foraDeCombate(c) ? true : 'torpor não tirou da briga';
    });

    this.checar(G, 'Oponente com arma de fogo escolhe atirar', () => {
      const e = Rodada.escolhaDoOponente({ nome: 'X', armaDele: 'Pistola .22', estados: [] }, null);
      const d = Rodada.escolhaDoOponente({ nome: 'Y', armaDele: '', estados: [] }, null);
      const b = Rodada.escolhaDoOponente({ nome: 'Z', armaDele: 'Canivete', estados: [] }, null);
      if (e.tipo !== 'fogo') return `pistola virou ${e.tipo}`;
      if (d.tipo !== 'desarmado') return `sem arma virou ${d.tipo}`;
      return b.tipo === 'branca' ? true : `canivete virou ${b.tipo}`;
    });

    this.checar(G, 'Estado que tira capacidade impede o oponente de agir', () => {
      const e = Rodada.escolhaDoOponente({ nome: 'X', armaDele: '', estados: ['torpor'] }, null);
      return e.possivel === false ? true : 'agiu em torpor';
    });
  },

  mundoDeTeste() {
    return {
      ficha: this.fichaDeTeste(),
      cena: { local: 'sala', hora: '23h', presentes: ['bia'] },
      locais: [
        { id: 'sala', nome: 'sala', zona: 'Centro', conhecido: true },
        { id: 'corredor', nome: 'corredor', zona: 'Centro', conhecido: true },
        { id: 'longe', nome: 'lugar distante', zona: 'Outra', conhecido: true },
        { id: 'ignoto', nome: 'lugar ignoto', zona: 'Outra', conhecido: false }
      ],
      pessoas: [{ id: 'bia', nome: 'Bia', relacao: 'aliado', conhecido: true }],
      fatos: [], fios: [], mensagens: [], registro: [],
      bolsa: [{ nome: 'Canivete', arma: true }],
      combate: { ativo: false, oponentes: [] },
      grafo: {
        nos: [
          { id: 'cofre', tipo: 'objeto', nome: 'cofre', estado: 'trancado' },
          { id: 'chave', tipo: 'objeto', nome: 'chave do cofre' },
          { id: 'copo',  tipo: 'objeto', nome: 'copo' },
          { id: 'jarra', tipo: 'objeto', nome: 'jarra' }
        ],
        arestas: [
          { de: 'cofre', relacao: 'esta_em', para: 'sala' },
          { de: 'copo',  relacao: 'esta_em', para: 'sala' },
          { de: 'jarra', relacao: 'esta_em', para: 'longe' },
          { de: 'chave', relacao: 'dentro_de', para: 'cofre' },
          { de: 'cofre', relacao: 'trancado_por', para: 'chave' }
        ]
      }
    };
  },

  grafo() {
    const G = 'Grafo';
    const mundo = () => this.mundoDeTeste();

    this.checar(G, 'Toda relação tem inverso, é simétrica, ou se declara de mão única', () =>
      Object.entries(Grafo.RELACOES)
        .filter(([, r]) => !r.simetrica && !r.inverso && !r.unidirecional)
        .map(([id]) => id));

    this.checar(G, 'Inverso de relação aponta de volta para a original', () =>
      Object.entries(Grafo.RELACOES).filter(([id, r]) => {
        if (!r.inverso) return false;
        const outra = Grafo.RELACOES[r.inverso];
        return !outra || outra.inverso !== id;
      }).map(([id]) => id));

    this.checar(G, 'Ligar cria a aresta inversa sozinha', () => {
      const g = Grafo.vazio();
      Grafo.acrescentarNo(g, { id: 'l', tipo: 'local', nome: 'L' });
      Grafo.acrescentarNo(g, { id: 'o', tipo: 'objeto', nome: 'O' });
      Grafo.ligar(g, 'o', 'esta_em', 'l');
      return Grafo.ligado(g, 'l', 'abriga', 'o') ? true : 'o inverso não foi criado';
    });

    this.checar(G, 'A bolsa vira objeto carregado', () => {
      const g = Grafo.de(mundo());
      const naMao = Grafo.contexto(g, 'voce').naMao.map(o => o.nome);
      return naMao.includes('Canivete') ? true : `na mão: ${naMao.join(', ') || 'nada'}`;
    });

    this.checar(G, 'Objeto no mesmo lugar está ao alcance; em outro, não', () => {
      const g = Grafo.de(mundo());
      const perto = Grafo.aoAlcanceDaMao(g, 'voce', 'copo');
      const longe = Grafo.aoAlcanceDaMao(g, 'voce', 'jarra');
      if (!perto.ok) return 'o copo, que está aqui, ficou fora de alcance';
      return longe.ok ? 'a jarra, que está longe, ficou ao alcance' : true;
    });

    this.checar(G, 'Objeto dentro de recipiente fechado fica fora de alcance', () => {
      const g = Grafo.de(mundo());
      const r = Grafo.aoAlcanceDaMao(g, 'voce', 'chave');
      if (r.ok) return 'a chave trancada no cofre ficou ao alcance';
      return r.motivo === 'dentro de fechado' ? true : `motivo veio "${r.motivo}"`;
    });

    this.checar(G, 'Abrir o recipiente libera o que está dentro', () => {
      const m = mundo();
      m.grafo.estados = { cofre: 'aberto' };
      const g = Grafo.de(m);
      return Grafo.aoAlcanceDaMao(g, 'voce', 'chave').ok
        ? true : 'com o cofre aberto a chave continuou fora de alcance';
    });

    this.checar(G, 'ondeEsta atravessa continência e carga', () => {
      const g = Grafo.de(mundo());
      if (Grafo.ondeEsta(g, 'chave') !== 'sala') return 'a chave não foi localizada na sala';
      const canivete = [...g.nos.values()].find(n => n.nome === 'Canivete');
      return Grafo.ondeEsta(g, canivete.id) === 'sala'
        ? true : 'o que você carrega não ficou no seu lugar';
    });

    this.checar(G, 'Caminho existe entre locais adjacentes e não entre zonas', () => {
      const m = mundo();
      m.grafo.arestas.push({ de: 'sala', relacao: 'adjacente', para: 'corredor' });
      const g = Grafo.de(m);
      const perto = Grafo.caminho(g, 'sala', 'corredor');
      const longe = Grafo.caminho(g, 'sala', 'longe');
      if (!perto || perto.length !== 2) return 'não achou o caminho de um salto';
      return longe ? 'inventou caminho entre zonas sem adjacência' : true;
    });

    this.checar(G, 'Movimento: adjacente é a pé, cidade é travessia, ignoto é barrado', () => {
      const m = mundo();
      m.grafo.arestas.push({ de: 'sala', relacao: 'adjacente', para: 'corredor' });
      const g = Grafo.de(m);
      const testar = (destino) => Grafo.validar(g,
        { acoes: [{ verbo: 'ir', intencao: 'ir_para', destino }] });

      const a = testar('corredor');
      if (a.possivel !== true) return 'adjacente foi barrado';
      if ((a.fatos.find(f => f.destino) || {}).modo !== 'a pé') return 'adjacente não saiu a pé';

      const b = testar('longe');
      if (b.possivel !== true) return 'lugar conhecido em outra zona foi barrado';
      if ((b.fatos.find(f => f.destino) || {}).modo !== 'travessia da cidade') return 'não marcou travessia';

      const c = testar('ignoto');
      return c.possivel === false ? true : 'lugar desconhecido não foi barrado';
    });

    this.checar(G, 'Alvo que não existe no mundo é barrado', () => {
      const g = Grafo.de(mundo());
      const r = Grafo.validar(g, { acoes: [{ verbo: 'pegar', intencao: 'pegar',
        alvo: 'dragao_de_ouro', alvoTexto: 'dragão de ouro' }] });
      return r.possivel === false && /não existe/.test(r.bloqueios[0].motivo)
        ? true : 'inventou um alvo que não existe';
    });
  },

  especialista() {
    const G = 'Especialista';

    this.checar(G, 'Toda regra tem id, prioridade, quando e entao', () =>
      Especialista.REGRAS.filter(r =>
        !r.id || typeof r.prioridade !== 'number' ||
        typeof r.quando !== 'function' || typeof r.entao !== 'function'
      ).map(r => r.id || '(sem id)'));

    this.checar(G, 'Nenhum id de regra repetido', () => {
      const vistos = new Set(), repetidos = [];
      for (const r of Especialista.REGRAS) {
        if (vistos.has(r.id)) repetidos.push(r.id);
        vistos.add(r.id);
      }
      return repetidos;
    });

    this.checar(G, 'Cada regra dispara no máximo uma vez', () => {
      const mesa = this.mundoDeTeste();
      const r = Cadeia.arbitrar({ ficha: mesa.ficha, estados: [], texto: 'persuadir a Bia',
        modo: 'agir', mesa });
      const ids = r.conclusao.rastro.map(x => x.regra);
      return ids.length === new Set(ids).size ? true : 'houve regra repetida no rastro';
    });

    this.checar(G, 'O rastro nomeia quem produziu cada bloqueio', () => {
      const mesa = this.mundoDeTeste();
      const r = Cadeia.arbitrar({ ficha: mesa.ficha, estados: ['torpor'],
        texto: 'me escondo nas sombras', modo: 'agir', mesa });
      if (r.conclusao.possivel !== false) return 'torpor não barrou a ação';
      return r.conclusao.rastro.some(x => x.regra === 'capacidade-removida')
        ? true : `rastro sem a regra de capacidade: ${r.conclusao.rastro.map(x => x.regra).join(', ')}`;
    });

    this.checar(G, 'Especialista e Árbitro concordam na dificuldade e nas rotas', () => {
      const mesa = this.mundoDeTeste();
      const textos = ['me escondo nas sombras', 'persuadir a Bia', 'intimido o sujeito'];
      const divergentes = [];
      for (const texto of textos) {
        const velho = Arbitro.avaliar({ ficha: mesa.ficha, estados: [], texto });
        const novo = Cadeia.arbitrar({ ficha: mesa.ficha, estados: [], texto, modo: 'agir', mesa });
        if (velho.possivel !== novo.conclusao.possivel) divergentes.push(`${texto}: possível`);
        if (velho.dificuldade !== novo.conclusao.dificuldade) divergentes.push(`${texto}: dificuldade`);
        const a = (velho.rotas || []).map(r => r.piscina.total).join(',');
        const b = (novo.conclusao.rotas || []).map(r => r.piscina.total).join(',');
        if (a !== b) divergentes.push(`${texto}: piscinas ${a} vs ${b}`);
      }
      return divergentes;
    });
  },

  cadeia() {
    const G = 'Cadeia';

    this.checar(G, 'Os quatro elos estão registrados ou declarados provisórios', () => {
      if (typeof Grafo === 'undefined') return 'Grafo não carregou';
      if (typeof Especialista === 'undefined') return 'Especialista não carregou';
      if (!Cadeia.INTERPRETADORES[Cadeia.interpretadorPadrao]) return 'sem interpretador padrão';
      if (!Cadeia.NAVEGADORES[Cadeia.navegadorPadrao]) return 'sem navegador padrão';
      return true;
    });

    this.checar(G, 'O navegador só entra em combate', () => {
      const fora = this.mundoDeTeste();
      const dentro = this.mundoDeTeste();
      dentro.combate.ativo = true;
      const a = Cadeia.arbitrar({ ficha: fora.ficha, estados: [], texto: 'me escondo', modo: 'agir', mesa: fora });
      const b = Cadeia.arbitrar({ ficha: dentro.ficha, estados: [], texto: 'me escondo', modo: 'agir', mesa: dentro });
      if (a.navegacao) return 'navegou fora de combate';
      return b.navegacao ? true : 'não navegou dentro do combate';
    });

    this.checar(G, 'A navegação NÃO é mais provisória', () => {
      const m = this.mundoDeTeste();
      m.combate.ativo = true;
      const r = Cadeia.arbitrar({ ficha: m.ficha, estados: [], texto: 'me escondo', modo: 'agir', mesa: m });
      if (!r.navegacao) return 'não navegou dentro do combate';
      return r.navegacao.provisorio === false
        ? true : 'o navegador voltou a ser o provisório da §41';
    });

    this.checar(G, 'A navegação distingue mesmo ambiente de ambiente ao lado', () => {
      const g = Grafo.vazio();
      Grafo.acrescentarNo(g, { id: 'a', tipo: 'local', nome: 'Sala A', zona: 'z' });
      Grafo.acrescentarNo(g, { id: 'b', tipo: 'local', nome: 'Sala B', zona: 'z' });
      Grafo.acrescentarNo(g, { id: 'voce', tipo: 'personagem', nome: 'Você' });
      Grafo.acrescentarNo(g, { id: 'alvo', tipo: 'pessoa', nome: 'Alvo' });
      Grafo.ligar(g, 'voce', 'esta_em', 'a');
      Grafo.ligar(g, 'alvo', 'esta_em', 'a');
      Grafo.adjacenciaPorZona(g);
      const perto = Navegacao.navegar({ grafo: g, contexto: Grafo.contexto(g, 'voce'),
        plano: { acoes: [{ alvo: 'alvo' }] }, mesa: {}, alvo: null });

      const g2 = Grafo.vazio();
      Grafo.acrescentarNo(g2, { id: 'a', tipo: 'local', nome: 'Sala A', zona: 'z' });
      Grafo.acrescentarNo(g2, { id: 'b', tipo: 'local', nome: 'Sala B', zona: 'z' });
      Grafo.acrescentarNo(g2, { id: 'voce', tipo: 'personagem', nome: 'Você' });
      Grafo.acrescentarNo(g2, { id: 'alvo', tipo: 'pessoa', nome: 'Alvo' });
      Grafo.ligar(g2, 'voce', 'esta_em', 'a');
      Grafo.ligar(g2, 'alvo', 'esta_em', 'b');
      Grafo.adjacenciaPorZona(g2);
      const longe = Navegacao.navegar({ grafo: g2, contexto: Grafo.contexto(g2, 'voce'),
        plano: { acoes: [{ alvo: 'alvo' }] }, mesa: {}, alvo: null });

      if (perto.penalidade !== 0) return 'mesmo ambiente cobrou penalidade';
      if (longe.penalidade !== -2) return 'ambiente ao lado não cobrou os −2';
      return true;
    });

    this.checar(G, 'A mesa arbitra pela cadeia, não pelo Árbitro direto', () => {
      /* Item A1: a cadeia foi construída na §41 e só passou a rodar em
         jogo na §48. Se `arbitrarTurno` sumir, o turno voltou ao
         caminho antigo e os elos viraram enfeite outra vez. */
      if (typeof arbitrarTurno !== 'function') return 'a mesa não tem arbitrarTurno';
      if (typeof terrenoDoOponente !== 'function') return 'o combate não consulta a navegação';
      return true;
    });

    this.checar(G, 'Intenção direta dispensa o interpretador', () => {
      const m = this.mundoDeTeste();
      const r = Cadeia.arbitrar({ ficha: m.ficha, estados: [], intencao: 'esconder', mesa: m });
      return r.plano.origem === 'direta' && r.conclusao.intencao === 'esconder'
        ? true : `origem "${r.plano.origem}", intenção "${r.conclusao.intencao}"`;
    });

    this.checar(G, 'comoVeredito devolve o formato que a mesa desenha', () => {
      const m = this.mundoDeTeste();
      const v = Cadeia.comoVeredito(
        Cadeia.arbitrar({ ficha: m.ficha, estados: [], texto: 'me escondo', modo: 'agir', mesa: m }));
      const faltando = ['possivel', 'bloqueios', 'avisos', 'rotas', 'dificuldade', 'leitura']
        .filter(k => !(k in v));
      return faltando.length ? `faltam campos: ${faltando.join(', ')}` : true;
    });

    this.checar(G, 'Verbo de manipulação chega ao grafo com alvo', () => {
      const m = this.mundoDeTeste();
      const r = Cadeia.arbitrar({ ficha: m.ficha, estados: [], texto: 'pego o copo', modo: 'agir', mesa: m });
      const acao = r.plano.acoes[0];
      if (!acao || acao.intencao !== 'pegar') return `intenção veio "${acao && acao.intencao}"`;
      return acao.alvo === 'copo' ? true : `alvo veio "${acao.alvo}"`;
    });

    this.checar(G, 'A cadeia inteira responde em menos de 50 ms', () => {
      const m = this.mundoDeTeste();
      const r = Cadeia.arbitrar({ ficha: m.ficha, estados: [], texto: 'me escondo nas sombras',
        modo: 'agir', mesa: m });
      return r.milissegundos < 50 ? true : `${r.milissegundos} ms`;
    });
  },

  intencao() {
    const G = 'Intenção';
    const bruta = (extra) => Object.assign({
      action_type: 'unknown', target: null, weapon: null,
      spell_name: null, modifier: null, reason: null }, extra);

    this.checar(G, 'Todo tipo do esquema tem tradução declarada', () =>
      ['melee_attack', 'ranged_attack', 'cast_spell', 'move', 'interact', 'unknown']
        .filter(t => !(t in Intencao.POR_TIPO)));

    this.checar(G, 'Toda ação citada na tradução existe no Árbitro', () => {
      const faltando = [];
      for (const lista of Object.values(Intencao.POR_TIPO)) {
        for (const id of lista) if (!Arbitro.ACOES[id]) faltando.push(id);
      }
      return faltando;
    });

    this.checar(G, 'Os cinco tipos com mecânica viram intenção do V5', () => {
      const casos = [
        ['melee_attack', 'lutar'], ['ranged_attack', 'atirar'],
        ['move', 'ir_para'], ['interact', 'pegar']
      ];
      const erros = [];
      for (const [tipo, esperado] of casos) {
        const t = Intencao.traduzir(bruta({ action_type: tipo }));
        if (t.intencao !== esperado) erros.push(`${tipo} virou ${t.intencao}`);
      }
      const poder = Intencao.traduzir(bruta({ action_type: 'cast_spell',
        spell_name: 'Manto das Sombras' }));
      if (poder.intencao !== 'poder:ofuscacao:Manto das Sombras') {
        erros.push(`cast_spell virou ${poder.intencao}`);
      }
      return erros;
    });

    this.checar(G, 'unknown não vira ação nenhuma', () => {
      const t = Intencao.traduzir(bruta({ action_type: 'unknown', reason: 'conversa' }));
      return t.intencao === null ? true : `virou ${t.intencao}`;
    });

    this.checar(G, 'Poder inventado não vira intenção', () => {
      const t = Intencao.traduzir(bruta({ action_type: 'cast_spell',
        spell_name: 'Bola de Fogo Suprema' }));
      return t.intencao === null ? true : `aceitou poder inexistente: ${t.intencao}`;
    });

    this.checar(G, 'O verbo desempata dentro de interact', () => {
      const esconder = Intencao.traduzir(bruta({ action_type: 'interact',
        frase: 'me escondo nas sombras' }));
      const arrombar = Intencao.traduzir(bruta({ action_type: 'interact',
        frase: 'arrombo a fechadura' }));
      if (esconder.intencao !== 'esconder') return `esconder virou ${esconder.intencao}`;
      return arrombar.intencao === 'arrombar' ? true : `arrombar virou ${arrombar.intencao}`;
    });

    this.checar(G, 'O plano do modelo tem o mesmo formato do plano do léxico', () => {
      const mesa = this.mundoDeTeste();
      const g = Grafo.de(mesa);
      const ctx = Grafo.contexto(g, 'voce');
      const doLexico = Cadeia.INTERPRETADORES.lexico(
        { texto: 'me escondo', modo: 'agir', grafo: g, contexto: ctx, ficha: mesa.ficha });
      const doModelo = Intencao.planoDe(
        bruta({ action_type: 'interact', frase: 'me escondo' }), g, ctx, 'me escondo');
      const chaves = (p) => p.acoes.length ? Object.keys(p.acoes[0]).sort().join(',') : '';
      const faltando = Object.keys(doLexico.acoes[0] || {})
        .filter(k => !(k in (doModelo.acoes[0] || {})));
      return faltando.length ? `o plano do modelo não tem: ${faltando.join(', ')}` : true;
    });

    this.checar(G, 'O contexto da cena sai da ficha e do grafo', () => {
      const mesa = this.mundoDeTeste();
      mesa.ficha.poderes = { ofuscacao: ['Manto das Sombras'] };
      const g = Grafo.de(mesa);
      const c = Intencao.contextoDaCena(mesa.ficha, g, Grafo.contexto(g, 'voce'));
      if (!c.poderes.includes('Manto das Sombras')) return 'não listou o poder da ficha';
      if (!c.presentes.includes('Bia')) return 'não listou quem está na cena';
      return c.objetos.includes('Canivete') ? true : 'não listou o que está na mão';
    });

    this.checar(G, 'Sem o serviço no ar, a cadeia continua respondendo', () => {
      const mesa = this.mundoDeTeste();
      const r = Cadeia.arbitrar({ ficha: mesa.ficha, estados: [],
        texto: 'me escondo nas sombras', modo: 'agir', mesa });
      return r.conclusao.intencao === 'esconder'
        ? true : 'o caminho sem modelo parou de funcionar';
    });
  },

  mesaNova() {
    const G = 'Mesa';

    this.checar(G, 'A doca não tem mais aba de Combate', () =>
      ABAS_DOCA.some(a => a.id === 'combate') ? 'a aba voltou para a doca' : true);

    this.checar(G, 'A doca tem aba de Bolsa, e ela renderiza', () => {
      if (!ABAS_DOCA.some(a => a.id === 'bolsa')) return 'não existe aba Bolsa';
      return typeof docaBolsa === 'function' ? true : 'docaBolsa não existe';
    });

    this.checar(G, 'Intenção de ataque é reconhecida pelo Árbitro', () => {
      const faltando = INTENCOES_DE_COMBATE.filter(i => !Arbitro.ACOES[i]);
      if (faltando.length) return `intenção sem ação no Árbitro: ${faltando.join(', ')}`;
      const l = Arbitro.interpretar('parto pra cima do segurança', 'agir');
      return INTENCOES_DE_COMBATE.includes(l.intencao)
        ? true : `léxico devolveu "${l.intencao}", que não abre combate`;
    });

    this.checar(G, 'O compilador entende o gatilho de combate', () => {
      const md = ['---', 'campanha: T', '---', '', '# Capítulo 1 — Um', '', '## Cena :: beco',
        'local: beco', '', '### Narração', 'Escuro.', '', '### Gatilhos',
        '- menciona(grito) => combate: 2x comum, fatal (Chefe)', ''].join('\n');
      const c = Compilador.compilar(md);
      if (c.erros.length) return c.erros.join(' · ');
      const g = c.capitulos[0].cenas[0].gatilhos[0];
      if (!g || g.acao.tipo !== 'combate') return 'o gatilho não virou ação de combate';
      return g.acao.oponentes.length === 3 ? true : `${g.acao.oponentes.length} oponentes, esperado 3`;
    });

    this.checar(G, 'Modelo de oponente inválido é recusado, não ignorado', () => {
      const md = ['---', 'campanha: T', '---', '', '# Capítulo 1 — Um', '', '## Cena :: beco',
        'local: beco', '', '### Narração', 'Escuro.', '', '### Gatilhos',
        '- sempre => combate: dragao', ''].join('\n');
      return Compilador.compilar(md).erros.length ? true : 'passou modelo inexistente';
    });

    this.checar(G, 'Bolsa vira posse no dossiê', () => {
      const mesa = { ficha: this.fichaDeTeste(), cena: { presentes: [] }, estados: [],
        pessoas: [], locais: [], fatos: [], fios: [], registro: [], cronicas: [], mensagens: [],
        combate: { oponentes: [] }, bolsa: [{ nome: 'Isqueiro', comoVeio: 'ficou na mão' }] };
      const d = Cronista.determinista(mesa, 'dossie');
      return d.posses.length === 1 && d.posses[0].nome === 'Isqueiro'
        ? true : 'a bolsa não chegou ao dossiê';
    });

    this.checar(G, 'Toda campanha registrada aponta para arquivo existente', () => {
      const semArquivo = CAMPANHAS.filter(c => c.arquivo === undefined);
      return semArquivo.length ? semArquivo.map(c => c.id) : true;
    });
  },

  biblioteca() {
    const G = 'Fichas';

    this.checar(G, 'Guardar, ler e apagar ficha na biblioteca', () => {
      const f = Object.assign(this.fichaDeTeste(), { nome: 'Cobaia Biblioteca ' + Date.now() });
      const id = guardarFicha(f);
      if (!id) return 'não guardou';
      const lida = fichaPorId(id);
      if (!lida || lida.nome !== f.nome) return 'não leu de volta';
      if (!listarFichas().some(x => x.fichaId === id)) return 'não apareceu na listagem';
      apagarFicha(id);
      return fichaPorId(id) ? 'não apagou' : true;
    });

    this.checar(G, 'A folha oficial desenha uma ficha que não é a do criador', () => {
      const f = Object.assign(this.fichaDeTeste(), { nome: 'Nome Improvável Zyx' });
      const html = fichaOficialHTML(f);
      if (!html.includes('Nome Improvável Zyx')) return 'a folha não usou a ficha recebida';
      return html.includes(String(S.nome || ' ')) && S.nome
        ? 'a folha vazou a ficha global S' : true;
    });

    this.checar(G, 'Apagar não depende de confirm() nativo', () => {
      const original = window.confirm;
      window.confirm = () => false;
      let falha = null;
      try {
        const f = Object.assign(this.fichaDeTeste(), { nome: 'Cobaia Apagar ' + Date.now() });
        const id = guardarFicha(f);
        const antes = listarFichas().length;
        fichaParaApagar = '';
        const bater = () => {
          const el = document.createElement('span');
          el.dataset.acao = 'apagar-ficha'; el.dataset.id = id;
          document.body.appendChild(el); el.click(); el.remove();
        };
        bater();
        if (listarFichas().length !== antes) falha = 'apagou no primeiro clique, sem confirmar';
        bater();
        if (!falha && listarFichas().length !== antes - 1) {
          falha = 'o segundo clique não apagou — confirm() suprimido ainda bloqueia';
        }
        apagarFicha(id);
        fichaParaApagar = '';
      } finally { window.confirm = original; }
      return falha || true;
    });

    this.checar(G, 'Sexo tem os quatro valores e o rótulo resolve', () => {
      if (SEXOS.length !== 4) return `${SEXOS.length} opções, esperado 4`;
      const semNome = SEXOS.filter(x => !x.id || !x.nome);
      if (semNome.length) return 'opção sem id ou nome';
      return nomeSexo('intersexo_nulo') === 'Intersexo (nulidade)'
        ? true : `rótulo saiu "${nomeSexo('intersexo_nulo')}"`;
    });
  },

  legado() {
    const G = 'Legado';
    const cobaia = () => Object.assign(this.fichaDeTeste(), { nome: 'Cobaia do Legado' });

    this.checar(G, 'Dossiê grava vínculo, marca, posse e fio', () => {
      const f = cobaia();
      Legado.apagar(f);
      Legado.registrar(f, {
        titulo: 'T', dossie: 'prosa',
        relacoes: [{ id: 'lia', quem: 'Lia', natureza: 'café', vinculo: 'amor', dividaEmAberto: 'não sabe' }],
        marcas: [{ texto: 'Cicatriz no ombro', tipo: 'cicatriz' }],
        posses: [{ nome: 'Isqueiro', comoVeio: 'ficou na mão dela' }],
        fiosAbertos: [{ id: 'fio_x', titulo: 'Quem mandou?', estado: 'aberto' }],
        ganchoFuturo: 'algo'
      }, { campanha: 'Crônica Um', cidade: 'rio' });
      const r = Legado.de(f);
      Legado.apagar(f);
      if (!r) return 'não gravou';
      if (r.relacoes.length !== 1 || r.relacoes[0].vinculo !== 'amor') return 'vínculo perdido';
      if (r.marcas.length !== 1 || r.marcas[0].tipo !== 'cicatriz') return 'marca perdida';
      if (r.posses.length !== 1) return 'posse perdida';
      if (r.fios.length !== 1) return 'fio perdido';
      if (r.relacoes[0].deCronica !== 'Crônica Um') return `deCronica errado: ${r.relacoes[0].deCronica}`;
      return true;
    });

    this.checar(G, 'Fio fechado não entra no legado', () => {
      const f = cobaia();
      Legado.apagar(f);
      Legado.registrar(f, { titulo: 'T', dossie: '', relacoes: [], marcas: [], posses: [],
        fiosAbertos: [{ id: 'a', titulo: 'aberto', estado: 'aberto' },
                      { id: 'b', titulo: 'resolvido', estado: 'fechado' }], ganchoFuturo: '' },
        { campanha: 'C' });
      const r = Legado.de(f);
      Legado.apagar(f);
      return r.fios.length === 1 && r.fios[0].id === 'a' ? true : `veio ${r.fios.map(x => x.id).join(',')}`;
    });

    this.checar(G, 'Duas crônicas acumulam sem duplicar a mesma pessoa', () => {
      const f = cobaia();
      Legado.apagar(f);
      const dossie = (vinculo, campanha) => Legado.registrar(f, {
        titulo: 'T', dossie: '', marcas: [], posses: [], fiosAbertos: [], ganchoFuturo: '',
        relacoes: [{ id: 'lia', quem: 'Lia', natureza: 'x', vinculo, dividaEmAberto: '—' }]
      }, { campanha });
      dossie('amizade', 'Um');
      dossie('amor', 'Dois');
      const r = Legado.de(f);
      Legado.apagar(f);
      if (r.cronicas.length !== 2) return `${r.cronicas.length} crônicas`;
      if (r.relacoes.length !== 1) return `${r.relacoes.length} entradas para a mesma pessoa`;
      return r.relacoes[0].vinculo === 'amor' ? true : 'não atualizou o vínculo';
    });

    this.checar(G, 'Legado vira pessoas para a semente da mesa', () => {
      const f = cobaia();
      Legado.apagar(f);
      Legado.registrar(f, { titulo: 'T', dossie: '', marcas: [], posses: [], fiosAbertos: [], ganchoFuturo: '',
        relacoes: [{ id: 'lia', quem: 'Lia', natureza: 'x', vinculo: 'amor', dividaEmAberto: '—' },
                   { id: 'rex', quem: 'Rex', natureza: 'y', vinculo: 'inimigo', dividaEmAberto: '—' }]
      }, { campanha: 'C' });
      const pessoas = Legado.pessoasParaSemente(f);
      Legado.apagar(f);
      const lia = pessoas.find(p => p.id === 'lia');
      const rex = pessoas.find(p => p.id === 'rex');
      if (!lia || !rex) return 'não converteu';
      if (lia.relacao !== 'aliado') return `amor virou ${lia.relacao}`;
      if (rex.relacao !== 'ameaca') return `inimigo virou ${rex.relacao}`;
      return pessoas.every(p => p.doLegado) ? true : 'faltou marcar doLegado';
    });

    this.checar(G, 'Resumo para o modelo cita vínculo, marca e posse', () => {
      const f = cobaia();
      Legado.apagar(f);
      Legado.registrar(f, { titulo: 'T', dossie: 'o que houve', ganchoFuturo: 'o que vem',
        relacoes: [{ id: 'lia', quem: 'Lia Marques', natureza: 'café', vinculo: 'amor', dividaEmAberto: 'não sabe' }],
        marcas: [{ texto: 'Cicatriz no ombro', tipo: 'cicatriz' }],
        posses: [{ nome: 'Isqueiro do Duarte', comoVeio: 'ficou na mão' }],
        fiosAbertos: [] }, { campanha: 'C' });
      const t = Legado.resumoParaModelo(f);
      Legado.apagar(f);
      for (const termo of ['Lia Marques', 'Cicatriz', 'Isqueiro do Duarte', 'o que vem']) {
        if (!t.includes(termo)) return `faltou "${termo}"`;
      }
      return true;
    });

    this.checar(G, 'Esquecer tira do legado', () => {
      const f = cobaia();
      Legado.apagar(f);
      Legado.registrar(f, { titulo: 'T', dossie: '', marcas: [], posses: [], fiosAbertos: [], ganchoFuturo: '',
        relacoes: [{ id: 'lia', quem: 'Lia', natureza: 'x', vinculo: 'amor', dividaEmAberto: '—' }] },
        { campanha: 'C' });
      Legado.esquecer(f, 'relacoes', 'lia');
      const r = Legado.de(f);
      Legado.apagar(f);
      return r.relacoes.length === 0 ? true : 'continuou lá';
    });

    this.checar(G, 'Personagem sem passado tem legado vazio', () => {
      const f = Object.assign(this.fichaDeTeste(), { nome: 'Nunca Jogou ' + Date.now() });
      return Legado.vazioDe(Legado.de(f)) && Legado.resumoParaModelo(f) === '' ? true : 'veio algo';
    });

    this.checar(G, 'Id do legado separa personagens diferentes', () => {
      const a = Object.assign(this.fichaDeTeste(), { nome: 'Ana', cla: 'brujah' });
      const b = Object.assign(this.fichaDeTeste(), { nome: 'Ana', cla: 'toreador' });
      return Legado.idDe(a) !== Legado.idDe(b) ? true : 'mesmo id para clãs diferentes';
    });

    this.checar(G, 'Toda conversão aponta para vantagem que existe', () => {
      const faltando = [];
      const conferir = (alvo) => {
        if (!alvo) return;
        if (!Legado.tetoDe(alvo.classe, alvo.id)) faltando.push(`${alvo.classe}.${alvo.id}`);
      };
      Object.values(Legado.CONVERSOES.marca).forEach(conferir);
      Object.values(Legado.CONVERSOES.relacao).forEach(conferir);
      conferir(Legado.CONVERSOES.posse);
      return faltando;
    });

    this.checar(G, 'Conversão do legado só entra na ficha depois do clique', () => {
      const f = cobaia();
      Legado.apagar(f);
      f.defeitos = {};
      Legado.registrar(f, {
        titulo: 'T', dossie: 'p', relacoes: [], posses: [], fiosAbertos: [], ganchoFuturo: '',
        marcas: [{ texto: 'A cidade reparou.', tipo: 'reputacao' }]
      }, { campanha: 'C', cidade: 'rio' });

      const props = Legado.propostas(f);
      const p = props.find(x => x.id === 'infamia');
      if (!p) { Legado.apagar(f); return 'reputação não virou proposta de Infâmia'; }
      if ((f.defeitos.infamia || 0) !== 0) { Legado.apagar(f); return 'entrou na ficha sem clique'; }

      Legado.aplicarProposta(f, p.marca);
      const entrou = f.defeitos.infamia === 1;
      const sumiu = !Legado.propostas(f).some(x => x.marca === p.marca);
      Legado.apagar(f);
      if (!entrou) return 'o clique não escreveu na ficha';
      return sumiu ? true : 'a proposta voltou depois de aplicada';
    });

    this.checar(G, 'Trauma não vira Defeito, e recusar cala a proposta', () => {
      const f = cobaia();
      Legado.apagar(f);
      Legado.registrar(f, {
        titulo: 'T', dossie: 'p', relacoes: [], posses: [], fiosAbertos: [], ganchoFuturo: '',
        marcas: [{ texto: 'Fez algo que não desfaz.', tipo: 'trauma' },
                 { texto: 'Ferida aberta.', tipo: 'cicatriz' }]
      }, { campanha: 'C', cidade: 'rio' });

      const props = Legado.propostas(f);
      if (props.some(x => x.chave === 'Fez algo que não desfaz.')) {
        Legado.apagar(f); return 'trauma virou Defeito';
      }
      const cic = props.find(x => x.id === 'estigma');
      if (!cic) { Legado.apagar(f); return 'cicatriz não virou proposta'; }
      Legado.recusarProposta(f, cic.marca);
      const calou = !Legado.propostas(f).some(x => x.marca === cic.marca);
      const naFicha = (f.defeitos || {}).estigma || 0;
      Legado.apagar(f);
      if (naFicha) return 'recusar escreveu na ficha';
      return calou ? true : 'a proposta recusada voltou';
    });

    this.checar(G, 'Dossiê só promove a vínculo quem entrou na história', () => {
      const f = cobaia();
      const mesa = {
        ficha: f, cena: { presentes: [] }, estados: [],
        pessoas: [
          { id: 'principe', nome: 'Inês Cardoso', relacao: 'autoridade' },
          { id: 'lia', nome: 'Lia', relacao: 'aliado' }
        ],
        locais: [], fatos: [], fios: [], registro: [], cronicas: [], combate: { oponentes: [] },
        mensagens: [{ id: 'm1', autor: 'jogador', modo: 'agir', texto: 'Procuro [[pessoa:lia]].' }]
      };
      const rel = Cronista.relacoesRelevantes(mesa).map(p => p.id);
      if (rel.includes('principe')) return 'quem não apareceu virou vínculo';
      return rel.includes('lia') ? true : 'quem apareceu ficou de fora';
    });
  },

  recombinacao() {
    const G = 'Recombinação';

    const todos = () => [].concat(
      ...SENTIDOS_POR_FOME,
      ...Object.values(PRESENCA_POR_RELACAO),
      FECHOS_INSTAVEIS,
      ...Object.values(ENQUADRAMENTO_POR_MODO)
    ).filter(Boolean);

    this.checar(G, 'Todo nível de Fome tem banco cheio', () => {
      const magros = SENTIDOS_POR_FOME
        .map((x, i) => x.length < 10 ? `Fome ${i}: ${x.length}` : null).filter(Boolean);
      return magros;
    });

    this.checar(G, 'Toda relação que o legado produz tem fragmento de presença', () => {
      const doLegado = ['aliado', 'contato', 'complicado', 'suspeito', 'ameaca', 'autoridade', 'neutro'];
      const naSemente = [];
      for (const cid of CIDADES) {
        const s = sementeDaCidade(cid.id);
        (s.pessoas || []).forEach(p => { if (p.relacao) naSemente.push(p.relacao); });
      }
      const todas = [...new Set(doLegado.concat(naSemente))];
      return todas.filter(r => !PRESENCA_POR_RELACAO[r] || PRESENCA_POR_RELACAO[r].length < 3);
    });

    this.checar(G, 'Nenhum fragmento usa vocabulário proibido', () => {
      const negra = ['tapeçaria', 'sinfonia', 'jornada', 'labirinto', 'multifacetado', 'crucial',
        'palpável', 'inabalável', 'inexorável', 'implacável', 'etéreo', 'visceral', 'sombrio',
        'testamento', 'orquestrar', 'desvendar', 'em última análise', 'no final das contas',
        'em suma', 'um arrepio percorreu', 'o ar ficou pesado', 'o tempo pareceu parar',
        'silêncio ensurdecedor'];
      const sem = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      return todos().filter(t => negra.some(n => sem(t).includes(sem(n)))).slice(0, 5);
    });

    this.checar(G, 'Nenhum fragmento devolve pergunta ao jogador', () =>
      todos().filter(t => /\?/.test(t)).slice(0, 5));

    this.checar(G, 'Nenhum fragmento usa travessão explicativo', () =>
      todos().filter(t => /\s—\s/.test(t)).slice(0, 5));

    this.checar(G, 'Uma cena típica passa de 20 mil combinações', () => {
      const n = SENTIDOS_POR_FOME[2].length * PRESENCA_POR_RELACAO.aliado.length
              * FECHOS_INSTAVEIS.length * ENQUADRAMENTO_POR_MODO.examinar.length;
      return n >= 20000 ? true : `só ${n} combinações`;
    });
  },

  provedor() {
    const G = 'Provedor';

    this.checar(G, 'A mesa não menciona chave de API nem provedor pago', () => {
      const e = Object.assign({}, Cronista.estado, { verificado: true, disponivel: false });
      const antes = Cronista.estado;
      Cronista.estado = e;
      let html = '';
      try { html = cronistaHTML(); } finally { Cronista.estado = antes; }
      return /chave de api|anthropic|claude|esforço/i.test(html)
        ? 'o selo do Cronista ainda fala de provedor pago' : true;
    });

    this.checar(G, 'O Cronista não guarda campo de esforço', () =>
      'esforco' in Cronista.estado ? 'o estado ainda tem esforco' : true);
  },

  livro() {
    const G = 'Livro básico';

    this.checar(G, 'Surto e Perdição da tabela de Potência batem com o básico', () => {
      const esperado = {
        0:  ['+1 dado', 0], 1:  ['+2 dados', 2], 2:  ['+2 dados', 2],
        3:  ['+3 dados', 3], 4:  ['+3 dados', 3], 5:  ['+4 dados', 4],
        6:  ['+4 dados', 4], 7:  ['+5 dados', 5], 8:  ['+5 dados', 5],
        9:  ['+6 dados', 6], 10: ['+6 dados', 6]
      };
      const erros = [];
      for (const [ps, [surto, perdicao]] of Object.entries(esperado)) {
        const t = Escudo.POTENCIA_SANGUE[ps];
        if (!t) { erros.push(`PS ${ps} não existe`); continue; }
        if (t.surto !== surto) erros.push(`PS ${ps} surto "${t.surto}", esperado "${surto}"`);
        if (t.perdicao !== perdicao) erros.push(`PS ${ps} perdição ${t.perdicao}, esperado ${perdicao}`);
      }
      return erros;
    });

    this.checar(G, 'Bônus de Disciplina é metade da Potência, e o motor aplica', () => {
      const erros = [];
      const original = window.derivados;
      try {
        for (let ps = 0; ps <= 10; ps++) {
          window.derivados = () => ({ potencia: ps });
          const b = Arbitro.bonusDePotencia({ atributos: {} }, 'animalismo');
          const doMotor = b ? b.dados : 0;
          if (doMotor !== Math.floor(ps / 2)) {
            erros.push(`PS ${ps}: motor deu ${doMotor}, metade é ${Math.floor(ps / 2)}`);
          }
          const daTabela = parseInt(Escudo.POTENCIA_SANGUE[ps].bonusDisciplina, 10) || 0;
          if (doMotor !== daTabela) {
            erros.push(`PS ${ps}: motor ${doMotor} contra tabela ${daTabela}`);
          }
        }
      } finally { window.derivados = original; }
      return erros;
    });

    this.checar(G, 'Bônus de Potência não entra em ação sem Disciplina', () => {
      const original = window.derivados;
      let comum, disc;
      try {
        window.derivados = () => ({ potencia: 10 });
        comum = Arbitro.bonusDePotencia({ atributos: {} }, null);
        disc  = Arbitro.bonusDePotencia({ atributos: {} }, 'ofuscacao');
      } finally { window.derivados = original; }
      if (comum) return 'entrou numa ação sem Disciplina';
      return disc ? true : 'não entrou numa ação de Disciplina';
    });

    this.checar(G, 'Interface e rolagem passam a MESMA Disciplina à piscina', () => {
      const f = this.fichaDeTeste();
      f.disciplinas = { animalismo: 3 };
      f.poderes = { animalismo: ['Sussurros Selvagens'] };
      const v = Arbitro.avaliar({ ficha: f, estados: [], texto: 'falo com o cachorro' });
      if (!v.rotas || !v.rotas.length) return 'a ação não produziu rota';
      const antes = M.ficha;
      M.ficha = f;
      let iguais;
      try {
        const pela = piscinaDaRota(v.rotas[0], { intencao: v.leitura.intencao });
        iguais = pela.total === v.rotas[0].piscina;
        if (!iguais) return `interface ${pela.total} contra rolagem ${v.rotas[0].piscina}`;
      } finally { M.ficha = antes; }
      return true;
    });

    this.checar(G, 'Resistir a frenesi não rola dados de Fome', () => {
      const f = this.fichaDeTeste();
      f.fome = 5;
      const r = Estado.testeDeFrenesi(f, { tipo: 'furia' });
      if (!r.rolagem) return 'não houve rolagem';
      return r.rolagem.fome === 0 ? true : `rolou ${r.rolagem.fome} dado(s) de Fome`;
    });

    this.checar(G, 'Teste de Remorso não rola dados de Fome', () => {
      const f = this.fichaDeTeste();
      f.fome = 5; f.maculas = 2;
      const r = Estado.testeDeRemorso(f);
      if (!r.rolagem) return 'não houve rolagem';
      return r.rolagem.fome === 0 ? true : `rolou ${r.rolagem.fome} dado(s) de Fome`;
    });

    this.checar(G, 'Cura de Agravado custa três Checagens e tira 1 nível', () => {
      const f = this.fichaDeTeste();
      f.danoAgravado = 3;
      const antesFome = f.fome || 0;
      const r = Estado.curar(f, { tipo: 'agravado', trilha: 'vitalidade' });
      if (r.curado !== 1) return `curou ${r.curado}, esperado 1`;
      if (f.danoAgravado !== 2) return `trilha ficou com ${f.danoAgravado}, esperado 2`;
      const checagens = r.eventos.filter(e => /provoca|checagem/i.test(e.texto || '')).length;
      return checagens >= 1 || (f.fome || 0) > antesFome
        ? true : 'não houve Checagem de Sangue nenhuma';
    });

    this.checar(G, 'Arma de fogo usa Autocontrole, não Destreza', () => {
      const a = Combate.ATAQUES.fogo;
      if (a.atributo !== 'autocontrole') return `atributo é "${a.atributo}"`;
      return a.pericia === 'armas_fogo' ? true : `perícia é "${a.pericia}"`;
    });

    this.checar(G, 'Os cinco tipos de ataque do livro existem', () => {
      const precisa = ['desarmado', 'branca', 'branca_duas', 'fogo', 'fogo_no_corpo', 'arremesso'];
      return precisa.filter(t => !Combate.ATAQUES[t]);
    });

    this.checar(G, 'Arma branca de duas mãos usa Força; arremesso usa Atletismo', () => {
      const d = Combate.ATAQUES.branca_duas, a = Combate.ATAQUES.arremesso;
      if (d.atributo !== 'forca' || d.pericia !== 'armas_brancas') return 'duas mãos errada';
      return (a.atributo === 'destreza' && a.pericia === 'atletismo') ? true : 'arremesso errado';
    });

    this.checar(G, 'Cobertura entra na parada de defesa, não na dificuldade', () => {
      const alvo = this.fichaDeTeste();
      const semCob = Combate.piscinaDefesa(alvo, ['destreza', ['atletismo']], [], 0);
      const comCob = Combate.piscinaDefesa(alvo, ['destreza', ['atletismo']], [], 2);
      if (!semCob || !comCob) return 'piscinaDefesa devolveu nulo';
      return comCob.total === semCob.total + 2
        ? true : `${semCob.total} vira ${comCob.total} com +2 de cobertura`;
    });

    this.checar(G, 'Fora do alcance é penalidade, não bloqueio, para arma à distância', () => {
      const atk = this.fichaDeTeste();
      const alvo = Combate.gerarMortal('comum').ficha;
      const r = Combate.resolver({ atacante: atk, defensor: alvo, tipo: 'fogo',
        alvoVampiro: false, distancia: 500, estadosAtacante: [], estadosDefensor: [] });
      if (r.possivel === false) return 'bloqueou em vez de penalizar';
      return r.eventos.some(e => /alcance efetivo/i.test(e.texto || ''))
        ? true : 'não anunciou a penalidade de alcance';
    });

    this.checar(G, 'Alvo estacionário não tem parada de defesa, e a dificuldade é 1', () => {
      const atk = this.fichaDeTeste();
      const alvo = Combate.gerarMortal('comum').ficha;
      const r = Combate.resolver({ atacante: atk, defensor: alvo, tipo: 'fogo',
        alvoVampiro: false, estacionario: true });
      if (r.rolDef) return 'rolou defesa para alvo estacionário';
      return r.rolAtq && r.rolAtq.dificuldade === 1
        ? true : `dificuldade ${r.rolAtq && r.rolAtq.dificuldade}, esperado 1`;
    });

    this.checar(G, 'Sangue animal e ensacado só falham acima de Potência 2', () => {
      const erradas = Escudo.ALIMENTACAO
        .filter(x => /2 ou mais/i.test(x.obs || ''))
        .map(x => x.fonte);
      return erradas;
    });

    this.checar(G, 'Distribuição de Habilidades usa o nome oficial', () => {
      const nomes = Object.values(DIST_HABILIDADES).map(m => m.nome);
      if (nomes.some(n => /Faz-Tudo/i.test(n))) return 'ainda existe "Faz-Tudo"';
      return nomes.some(n => /Pau pra Toda Obra/i.test(n))
        ? true : `nenhum modo chamado "Pau pra Toda Obra": ${nomes.join(', ')}`;
    });
  },

  cronica() {
    const G = 'Crônica';

    const sessao = (turnos, extras = {}) => {
      const f = this.fichaDeTeste();
      const mesa = {
        ficha: Object.assign(f, extras.ficha || {}),
        cena: { local: 'sala', hora: '23h', presentes: ['bia'] },
        locais: [{ id: 'sala', nome: 'sala', zona: 'Centro', conhecido: true }],
        pessoas: [
          { id: 'bia', nome: 'Bia', relacao: 'aliado', conhecido: true },
          { id: 'ines', nome: 'Inês', relacao: 'autoridade', conhecido: true }
        ],
        fatos: [], fios: [], registro: [], cronicas: [], estados: [],
        bolsa: extras.bolsa || [], combate: { ativo: false, oponentes: [] },
        mensagens: []
      };
      for (let i = 0; i < turnos; i++) {
        mesa.mensagens.push({ id: 'j' + i, autor: 'jogador', modo: 'agir',
          texto: 'faço mais uma coisa qualquer nesta cena, num texto de tamanho realista' });
        mesa.mensagens.push({ id: 'n' + i, autor: 'narrador',
          texto: 'A narração responde com um parágrafo de tamanho normal e deixa algo instável no ar.' });
        mesa.registro.push({ ts: i, texto: 'registro do turno ' + i });
      }
      return mesa;
    };

    this.checar(G, 'Toda regra da crônica tem id, prioridade, quando e entao', () =>
      Cronica.REGRAS.filter(r =>
        !r.id || typeof r.prioridade !== 'number' ||
        typeof r.quando !== 'function' || typeof r.entao !== 'function'
      ).map(r => r.id || '(sem id)'));

    this.checar(G, 'Nenhum id de regra da crônica repetido', () => {
      const vistos = new Set(), repetidos = [];
      for (const r of Cronica.REGRAS) { if (vistos.has(r.id)) repetidos.push(r.id); vistos.add(r.id); }
      return repetidos;
    });

    this.checar(G, 'Cada regra da crônica dispara no máximo uma vez', () => {
      const a = Cronica.avaliar({ mesa: sessao(10), tipo: 'dossie' });
      const ids = a.rastro.map(x => x.regra);
      return ids.length === new Set(ids).size ? true : 'houve regra repetida';
    });

    this.checar(G, 'Sessão longa cabe no orçamento de contexto', () => {
      const erros = [];
      for (const turnos of [20, 40, 60, 200, 600]) {
        const a = Cronica.avaliar({ mesa: sessao(turnos), tipo: 'capitulo' });
        if (a.orcamento.tokens > a.orcamento.teto) {
          erros.push(`${turnos} turnos: ${a.orcamento.tokens} tokens, teto ${a.orcamento.teto}`);
        }
      }
      return erros;
    });

    this.checar(G, 'O corte é por peso: o que importa sobrevive ao volume', () => {
      const mesa = sessao(400);
      mesa.mensagens.splice(6, 0, { id: 'arb', autor: 'arbitro',
        veredito: { bloqueios: [{ tipo: 'estado', motivo: 'PEDRA_DE_TOQUE_BARRADO' }] } });
      mesa.mensagens.splice(9, 0, { id: 'rol', autor: 'rolagem',
        resultado: { rotulo: 'PEDRA_DE_TOQUE_BESTIAL', tipo: 'bestial' } });

      const a = Cronica.avaliar({ mesa, tipo: 'capitulo' });
      if (!a.orcamento.cortados) return 'não cortou nada numa sessão de 400 turnos';
      const faltando = [];
      if (!a.eventos.some(e => /PEDRA_DE_TOQUE_BARRADO/.test(e))) faltando.push('o barrado');
      if (!a.eventos.some(e => /PEDRA_DE_TOQUE_BESTIAL/.test(e))) faltando.push('a falha bestial');
      return faltando.length ? `cortou ${faltando.join(' e ')}, que estão no topo do peso` : true;
    });

    this.checar(G, 'A ordem dos eventos é preservada depois do corte', () => {
      const a = Cronica.avaliar({ mesa: sessao(300), tipo: 'capitulo' });
      const turnos = a.eventos
        .map(e => { const m = e.match(/registro do turno (\d+)/); return m ? +m[1] : null; })
        .filter(x => x !== null);
      for (let i = 1; i < turnos.length; i++) {
        if (turnos[i] < turnos[i - 1]) return `fora de ordem: ${turnos[i - 1]} antes de ${turnos[i]}`;
      }
      return true;
    });

    this.checar(G, 'Preço e marcas saem da mesma análise que a prosa', () => {
      const mesa = sessao(5, { ficha: { fome: 5, maculas: 2, danoAgravado: 1 } });
      const a = Cronica.avaliar({ mesa, tipo: 'dossie' });
      const d = Cronista.determinista(mesa, 'dossie', a);
      if (JSON.stringify(d.precoPago || d.preco || []) !== JSON.stringify(a.preco) &&
          !(d.dossie || '').includes(a.preco[0] || '\u0000')) {
        return 'a prosa determinística não usou o preço da análise';
      }
      return JSON.stringify(d.marcas) === JSON.stringify(a.marcas)
        ? true : 'as marcas divergiram entre a análise e a saída';
    });

    this.checar(G, 'Dossiê continua não promovendo quem não apareceu', () => {
      const mesa = sessao(3);
      mesa.mensagens.push({ id: 'x', autor: 'jogador', modo: 'agir',
        texto: 'procuro [[pessoa:bia]] no meio da festa' });
      const a = Cronica.avaliar({ mesa, tipo: 'dossie' });
      const ids = a.relacoes.map(p => p.id);
      if (ids.includes('ines')) return 'quem não apareceu virou vínculo';
      return ids.includes('bia') ? true : 'quem apareceu ficou de fora';
    });

    this.checar(G, 'A Bolsa vira posse no dossiê', () => {
      const mesa = sessao(3, { bolsa: [{ nome: 'Chave do camarim', comoVeio: 'tomada' }] });
      const a = Cronica.avaliar({ mesa, tipo: 'dossie' });
      return a.posses.some(p => p.nome === 'Chave do camarim')
        ? true : 'a bolsa não chegou às posses';
    });

    this.checar(G, 'O Cronista delega ao motor e não guarda regra própria', () => {
      const mesa = sessao(4, { ficha: { fome: 5 } });
      const doMotor = Cronica.avaliar({ mesa, tipo: 'capitulo' });
      const pelaFachada = Cronista.mudancasDe(mesa);
      return JSON.stringify(pelaFachada) === JSON.stringify(doMotor.mudancas)
        ? true : 'a fachada do Cronista divergiu do motor';
    });
  },

  areas() {
    const G = 'Áreas';

    /* O mapa das quatro áreas, e o que cada uma NÃO pode fazer. A §43 moveu os
       arquivos; estas checagens impedem que a fronteira se dissolva de volta. */
    const DONO = {
      ficha:    { Ficha, Matilha },
      arbitro:  { Dados, Arbitro, Estado, Combate, Rodada, Grafo, Especialista, Cadeia, Intencao },
      cronista: { Compilador, Diretor, Recombinador, Escada, Narrador, Cronica, Cronista, Legado }
    };

    this.checar(G, 'Todo objeto de área existe e é objeto', () => {
      const faltando = [];
      for (const [area, mapa] of Object.entries(DONO)) {
        for (const [n, v] of Object.entries(mapa)) {
          /* Escada é classe, não objeto literal: função também vale. */
          const existe = v && (typeof v === 'object' || typeof v === 'function');
          if (!existe) faltando.push(`${area}/${n}`);
        }
      }
      return faltando;
    });

    this.checar(G, 'Nenhum motor devolve HTML', () => {
      const sujos = [];
      const html = /<\/?(div|span|button|table|p|h[1-6]|select|input|option)\b/i;
      for (const [area, mapa] of Object.entries(DONO)) {
        if (area === 'cronista') continue;
        for (const [n, alvo] of Object.entries(mapa)) {
          if (!alvo || typeof alvo !== 'object') continue;
          for (const [chave, fn] of Object.entries(alvo)) {
            if (typeof fn !== 'function') continue;
            if (html.test(String(fn))) sujos.push(`${n}.${chave}`);
          }
        }
      }
      return sujos;
    });

    this.checar(G, 'O front não é dono de regra de mecânica', () => {
      /* piscinaDaRota e afins podem CHAMAR o Árbitro; o que não podem é
         recalcular por conta própria. A prova é a de sempre: interface e
         rolagem têm que dar o mesmo número. */
      const f = this.fichaDeTeste();
      f.disciplinas = { animalismo: 3 };
      f.poderes = { animalismo: ['Sussurros Selvagens'] };
      const v = Arbitro.avaliar({ ficha: f, estados: [], texto: 'falo com o cachorro' });
      if (!v.rotas.length) return 'a ação não produziu rota';
      const antes = M.ficha; M.ficha = f;
      try {
        const pela = piscinaDaRota(v.rotas[0], { intencao: v.leitura.intencao });
        return pela.total === v.rotas[0].piscina
          ? true : `interface ${pela.total} contra motor ${v.rotas[0].piscina}`;
      } finally { M.ficha = antes; }
    });

    this.checar(G, 'A Ficha não sabe de mesa nem de crônica', () => {
      const proibido = /\b(M\.|Cronista\.|Cronica\.|Narrador\.|Diretor\.|Escada\b)/;
      const sujos = [];
      for (const [n, alvo] of Object.entries(DONO.ficha)) {
        if (!alvo || typeof alvo !== 'object') continue;
        for (const [chave, fn] of Object.entries(alvo)) {
          if (typeof fn === 'function' && proibido.test(String(fn))) sujos.push(`${n}.${chave}`);
        }
      }
      return sujos;
    });

    this.checar(G, 'O Árbitro não sabe de crônica nem de legado', () => {
      const proibido = /\b(Cronista\.|Cronica\.|Legado\.|Diretor\.)/;
      const sujos = [];
      for (const [n, alvo] of Object.entries(DONO.arbitro)) {
        if (!alvo || typeof alvo !== 'object') continue;
        for (const [chave, fn] of Object.entries(alvo)) {
          if (typeof fn === 'function' && proibido.test(String(fn))) sujos.push(`${n}.${chave}`);
        }
      }
      return sujos;
    });
  },

  rodar() {
    this.resultados = [];
    this.referencias();
    this.comportamento();
    this.arquitetura();
    this.seguranca();
    this.combate();
    this.grafo();
    this.especialista();
    this.cadeia();
    this.intencao();
    this.mesaNova();
    this.biblioteca();
    this.legado();
    this.recombinacao();
    this.provedor();
    this.livro();
    this.cronica();
    this.areas();
    return this.resultados;
  },

  resumo() {
    const total = this.resultados.length;
    const falhas = this.resultados.filter(r => r.estado !== 'ok').length;
    return { total, falhas, ok: total - falhas };
  }
};

function renderDiagnostico() {
  const r = Diagnostico.rodar();
  const s = Diagnostico.resumo();
  const grupos = [...new Set(r.map(x => x.grupo))];

  const linhas = grupos.map(g => `
    <h3 class="sub mt2">${g}</h3>
    <div class="cartao">
      ${r.filter(x => x.grupo === g).map(x => `
        <div class="linha-traco">
          <span class="traco-nome">${x.nome}${x.detalhe ? `<small>${esc(x.detalhe)}</small>` : ''}</span>
          <span class="${x.estado === 'ok' ? 'gold' : 'blood-text'}">${
            x.estado === 'ok' ? '✓' : x.estado === 'erro' ? '! erro' : '✕ falhou'}</span>
        </div>`).join('')}
    </div>`).join('');

  document.getElementById('app').innerHTML = `
    <main class="envoltorio">
      <div class="painel-cabeca">
        <div class="num">Diagnóstico</div>
        <h2>${s.falhas ? 'Há coisa quebrada' : 'Tudo de pé'}</h2>
        <p>${s.ok} de ${s.total} checagens passaram.
        As de <b>Referências</b> perguntam se todo id citado existe. As de
        <b>Comportamento</b> perguntam se a regra chega mesmo ao dado — que é onde
        a auditoria achou os defeitos que os testes isolados não achavam.</p>
      </div>
      <div class="cotas">
        <span class="cota ${s.falhas ? 'excedeu' : 'ok'}"><b>${s.ok}/${s.total}</b> checagens</span>
        <span class="cota ${s.falhas ? 'excedeu' : ''}"><b>${s.falhas}</b> falhas</span>
      </div>
      <div style="display:flex;gap:.6rem;margin:1rem 0">
        <button class="btn primario" onclick="renderDiagnostico()">Rodar de novo</button>
        <a class="btn" href="index.html">Voltar ao VITÆ</a>
      </div>
      ${linhas}
    </main>`;
}

document.addEventListener('DOMContentLoaded', renderDiagnostico);

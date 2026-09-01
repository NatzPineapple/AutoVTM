/* ============================================================
   VITAE — Perfis de seita
   Um objeto por seita, todos com a mesma forma. Nenhum outro
   arquivo compara o id da seita: todos perguntam ao perfil.
   ============================================================ */

const PERFIL_PADRAO = {
  id: '', nome: 'Sem lealdade definida',
  bussola: { tipo: 'humanidade', rotulo: 'Humanidade' },
  ancoras: { tipo: 'pessoa', rotulo: 'Pilar', plural: 'Pilares',
             dica: 'Pilares são mortais. Quando morrem, a Convicção vai junto.' },
  grupo: { chave: '', rotulo: '', coletivo: false, pontos: 0, desc: '' },
  cargos: [],
  statusPositivo: true,
  refugio: 'pessoal',
  predadores: { extras: [], vetados: [] },
  defeitosImpostos: () => [],
  lexico: { proprios: 'Membros', tratamento: 'Membro' },
  ondeDoi: '',
  passos: { alma: 'humanidade', grupo: '' }
};

const PERFIS_SEITA = {
  camarilla: {
    id: 'camarilla', nome: 'Camarilla',
    bussola: { tipo: 'humanidade', rotulo: 'Humanidade' },
    ancoras: { tipo: 'pessoa', rotulo: 'Pilar', plural: 'Pilares',
               dica: 'Pilares são mortais. Quando morrem, a Convicção vai junto.' },
    grupo: { chave: 'circulo', rotulo: 'Círculo', coletivo: false, pontos: 0,
             desc: 'Interesse comum, não amizade. Aguenta enquanto o interesse aguentar.' },
    cargos: ['Nenhum', 'Xerife', 'Guardião do Elísio', 'Harpia', 'Chicoteador', 'Escriba', 'Senescal'],
    statusPositivo: true,
    refugio: 'pessoal',
    predadores: { extras: [], vetados: ['sabbat'] },
    defeitosImpostos: (f) => {
      const lista = [];
      if (f.cla === 'caitiff' && (f.antecedentes || {}).status)
        lista.push({ id: 'caitiff_sem_status', nome: 'Caitiff sem Status reconhecido', pontos: 0,
                     peso: 0, motivo: 'A Camarilla não concede Status a Caitiff.' });
      return lista;
    },
    lexico: { proprios: 'Membros', tratamento: 'Membro' },
    ondeDoi: 'O cargo que você quer, e o que precisa fazer para conseguir.',
    passos: { alma: 'humanidade', grupo: 'circulo' }
  },

  anarquistas: {
    id: 'anarquistas', nome: 'Movimento Anarquista',
    bussola: { tipo: 'humanidade', rotulo: 'Humanidade' },
    ancoras: { tipo: 'pessoa', rotulo: 'Pilar', plural: 'Pilares',
               dica: 'Pilares são mortais. Quando morrem, a Convicção vai junto.' },
    grupo: { chave: 'baronia', rotulo: 'Baronia', coletivo: true, pontos: 0,
             desc: 'Território dividido e favores em aberto. Lealdade é local, nunca institucional.' },
    cargos: [],
    statusPositivo: true,
    refugio: 'pessoal',
    predadores: { extras: [], vetados: ['sabbat'] },
    defeitosImpostos: () => [],
    lexico: { proprios: 'Anarquistas', tratamento: 'Membro' },
    ondeDoi: 'O favor que você deve a quem você despreza.',
    passos: { alma: 'humanidade', grupo: 'baronia' }
  },

  sabbat: {
    id: 'sabbat', nome: 'Sabá',
    bussola: { tipo: 'caminho', rotulo: 'Caminho da Iluminação' },
    ancoras: { tipo: 'ritae', rotulo: 'Ritae-Pilar', plural: 'Ritae-Pilares',
               dica: 'Duas Convicções nunca apontam para o mesmo Ritae. Destruir o implemento custa a Convicção.' },
    grupo: { chave: 'matilha', rotulo: 'Matilha', coletivo: true, pontos: 1,
             desc: 'A Vaulderie torna o afeto químico e coletivo. Sair não é opção que se cogite.' },
    cargos: ['Nenhum', 'Sacerdote de matilha', 'Ductus', 'Templário', 'Paladino', 'Bispo'],
    statusPositivo: true,
    refugio: 'comunal',
    predadores: { extras: 'sabbat', vetados: [] },
    defeitosImpostos: (f) => {
      const d = (f.seitaDados || {}).sabbat || {};
      const lista = [];
      if (!(d.matilha && d.matilha.nome))
        lista.push({ id: 'suspeito', nome: 'Suspeito', pontos: 1, peso: 1,
                     motivo: 'Cainita sem matilha e sem Vinculum.' });
      if (d.refugioComunal === false)
        lista.push({ id: 'segredo_refugio', nome: 'Segredo Sombrio (Refúgio Pessoal)', pontos: 1, peso: 1,
                     motivo: 'Manter refúgio pessoal é incomum a ponto de ser suspeito.' });
      if (f.cla === 'caitiff')
        lista.push({ id: 'suspeito_caitiff', nome: 'Suspeito (perante as outras seitas)', pontos: 1, peso: 1,
                     motivo: 'Caitiff do Sabá só compra Status dentro do Sabá.' });
      return lista;
    },
    lexico: { proprios: 'Cainitas', tratamento: 'Cainita' },
    ondeDoi: 'O implemento do Ritae, que quebra e leva a Convicção junto.',
    passos: { alma: 'caminho', grupo: 'matilha' }
  },

  independente: {
    id: 'independente', nome: 'Independentes',
    bussola: { tipo: 'humanidade', rotulo: 'Humanidade' },
    ancoras: { tipo: 'pessoa', rotulo: 'Pilar', plural: 'Pilares',
               dica: 'Pilares são mortais. Quando morrem, a Convicção vai junto.' },
    grupo: { chave: 'rede', rotulo: 'Rede', coletivo: true, pontos: 0,
             desc: 'Você não tem seita. Tem clientes, e um contrato que não pode romper.' },
    cargos: [],
    statusPositivo: false,
    refugio: 'pessoal',
    predadores: { extras: [], vetados: ['sabbat'] },
    defeitosImpostos: () => [],
    lexico: { proprios: 'Independentes', tratamento: 'Membro' },
    ondeDoi: 'O contrato que você não pode cumprir e não pode romper.',
    passos: { alma: 'humanidade', grupo: 'rede' }
  },

  nenhuma: {
    id: 'nenhuma', nome: 'Sem Seita',
    bussola: { tipo: 'humanidade', rotulo: 'Humanidade' },
    ancoras: { tipo: 'pessoa', rotulo: 'Pilar', plural: 'Pilares',
               dica: 'Pilares são mortais. Quando morrem, a Convicção vai junto.' },
    grupo: { chave: 'ninguem', rotulo: 'Quem procura por você', coletivo: false, pontos: 0,
             desc: 'Liberdade total e ninguém para chamar quando der errado.' },
    cargos: [],
    statusPositivo: false,
    refugio: 'pessoal',
    predadores: { extras: [], vetados: ['sabbat'] },
    defeitosImpostos: () => [],
    lexico: { proprios: 'autarcas', tratamento: 'Membro' },
    ondeDoi: 'A noite em que precisou de alguém e não havia ninguém.',
    passos: { alma: 'humanidade', grupo: 'ninguem' }
  }
};

const CLA_SEITA_ATRITO = {
  brujah:      { improvavel: ['camarilla'], motivo: 'Os Brujah deixaram a Camarilla em 2018. Ficar é declaração.' },
  gangrel:     { improvavel: ['camarilla'], motivo: 'Os Gangrel saíram em 1999 e não voltaram.' },
  ventrue:     { improvavel: ['anarquistas', 'sabbat'], motivo: 'Ventrue mandam por hábito. Fora da Torre, isso custa caro.' },
  tremere:     { improvavel: ['sabbat'], motivo: 'A maldição do clã atrapalha o Vinculum: eles participam com dificuldade adicional.' },
  toreador:    { improvavel: ['sabbat'], motivo: 'A corte é o habitat. A matilha é o oposto dele.' },
  nosferatu:   { improvavel: [], motivo: '' },
  malkaviano:  { improvavel: [], motivo: '' },
  lasombra:    { improvavel: [], motivo: 'Entrada recente na Camarilla. Metade do clã não aceitou.' },
  banu_haqim:  { improvavel: [], motivo: 'Entrada recente na Camarilla. Ninguém esqueceu quem eles caçavam.' },
  hecata:      { improvavel: ['camarilla', 'sabbat'], motivo: 'Vendem serviço a todos os lados. Jurar lealdade quebra o negócio.' },
  ministerio:  { improvavel: ['camarilla'], motivo: 'Ninguém quer dever favor a quem lucra com dependência.' },
  ravnos:      { improvavel: ['camarilla', 'sabbat'], motivo: 'Sem território fixo, não têm o que dar em garantia.' },
  tzimisce:    { improvavel: ['camarilla'], motivo: 'A Fundação exige território próprio. A Torre não concede.' },
  salubri:     { improvavel: ['camarilla', 'sabbat'], motivo: 'Caçados como diablerie ambulante em qualquer corte.' },
  caitiff:     { improvavel: [], motivo: 'Sem linhagem, sem quem responda por você em nenhuma seita.' },
  sangue_fraco:{ improvavel: ['camarilla', 'sabbat'], motivo: 'Descartáveis por todos, tolerados enquanto úteis.' }
};

const Seitas = {
  CHAVE_SO_OFICIAL: 'vitae:so-oficial',

  soOficial() {
    try { return localStorage.getItem(this.CHAVE_SO_OFICIAL) === 'sim'; }
    catch (e) { return false; }
  },

  /* Devolve false quando não coube. O interruptor de material oficial
     é escolha de crônica (§19): se não gravar, ele volta ao padrão no
     recarregamento e o jogador vê conteúdo que tinha desligado. */
  definirSoOficial(ligado) {
    try { localStorage.setItem(this.CHAVE_SO_OFICIAL, ligado ? 'sim' : 'nao'); return true; }
    catch (e) {
      console.warn('Seitas.definirSoOficial falhou:', e && e.message);
      return false;
    }
  },

  ehComunidade(item) {
    return String((item || {}).origem || '').includes('comunidade');
  },

  visivel(item) {
    if (!this.soOficial()) return true;
    return String((item || {}).origem || 'oficial') !== 'comunidade';
  },

  sistemaVisivel(item) {
    if (!this.soOficial()) return true;
    return !this.ehComunidade(item);
  },

  filtrar(lista) {
    return (lista || []).filter(x => this.visivel(x));
  },

  perfil(id) {
    return PERFIS_SEITA[id] || PERFIL_PADRAO;
  },

  dados(f, chave) {
    const id = chave || f.seita;
    if (!id) return {};
    f.seitaDados = f.seitaDados || {};
    f.seitaDados[id] = f.seitaDados[id] || this.inicial(id);
    return f.seitaDados[id];
  },

  inicial(id) {
    return ({
      camarilla:    { cargo: '', apresentado: true, primogenitoPadrinho: '',
                      circulo: { nome: '', papel: '' } },
      anarquistas:  { baronia: { nome: '', bairro: '', tipo: '' }, papel: '',
                      favoresDevidos: [], favoresACobrar: [], reconhecidaPorCorte: false },
      sabbat:       { caminho: '', conviccoesRitae: ['', '', ''], implementos: ['', '', ''],
                      matilha: { nome: '', tipo: '', sacerdote: '', ductus: '' },
                      vinculum: 1, arena: { perambulacao: 0, alcance: 0, prestigio: 0 },
                      pontosMatilha: 1, ritaeConhecidos: [], refugioComunal: true,
                      humanidadeTravada: false },
      independente: { linhagem: '', negocio: '', clientes: ['', ''], contratos: [],
                      seitaDeFachada: '' },
      nenhuma:      { motivo: '', ultimaCorte: '', procuradoPor: [] }
    })[id] || {};
  },

  bussola(f) { return this.perfil(f.seita).bussola; },
  ancoras(f) { return this.perfil(f.seita).ancoras; },
  grupo(f)   { return this.perfil(f.seita).grupo; },

  defeitosImpostos(f) {
    const p = this.perfil(f.seita);
    const daSeita = p.defeitosImpostos ? p.defeitosImpostos(f) : [];
    return daSeita;
  },

  pesoDosDefeitosImpostos(f) {
    return this.defeitosImpostos(f).reduce((a, d) => a + (d.peso || 0), 0);
  },

  predadoresPermitidos(f) {
    const p = this.perfil(f.seita);
    return PREDADORES.filter(x => {
      if (x.seita && x.seita !== p.id) return false;
      if (x.seita && p.predadores.extras !== x.seita) return false;
      return this.visivel(x);
    });
  },

  atritoDeCla(claId, seitaId) {
    const a = CLA_SEITA_ATRITO[claId];
    if (!a || !seitaId) return null;
    if (!a.improvavel.includes(seitaId)) return null;
    return a.motivo;
  },

  /* O `grupo` vem de fora porque `Matilha` é da área Ficha, e esta
     é a de dados — a camada mais baixa de todas. Alcançar para cima
     funcionava (havia um `typeof` guardando), e mesmo assim era
     inversão: o vocabulário do jogo não pode depender de quem o usa.
     Achado pela checagem de fronteira da §50. */
  redeColetiva(f, grupo = null) {
    const id = f.seita;
    if (!id || !(f.seitaDados || {})[id]) return 0;
    const d = f.seitaDados[id];
    if (id === 'sabbat') {
      const a = (grupo && grupo.arena) || d.arena || {};
      const pontos = grupo ? grupo.pontosMatilha : (d.pontosMatilha || 0);
      return (a.perambulacao || 0) + (a.alcance || 0) + (a.prestigio || 0) + (pontos || 0);
    }
    if (id === 'anarquistas') {
      return ((d.baronia && d.baronia.nome) ? 1 : 0)
           + Math.min(3, (d.favoresACobrar || []).filter(x => x && x.o_que).length);
    }
    if (id === 'independente') {
      return Math.min(2, (d.clientes || []).filter(Boolean).length)
           + Math.min(2, (d.contratos || []).filter(x => x && x.servico).length);
    }
    return 0;
  },

  /* `grupo` de fora, pelo mesmo motivo de `redeColetiva`: `Matilha`
     é da área Ficha, e esta é a de dados. Sem o grupo, o resumo cai no
     que a própria ficha guarda — que é o que ele fazia antes de a
     matilha virar registro coletivo (§37). */
  resumo(f, grupo = null) {
    const p = this.perfil(f.seita);
    if (!p.id) return '';
    const d = (f.seitaDados || {})[p.id] || {};
    if (p.id === 'sabbat') {
      const cam = CAMINHOS.find(x => x.id === d.caminho);
      const nomeDaMatilha = grupo ? grupo.nome : ((d.matilha || {}).nome || '');
      return [nomeDaMatilha ? `matilha ${nomeDaMatilha}` : 'sem matilha',
              `Vinculum ${grupo ? grupo.vinculum : (d.vinculum || 0)}`,
              cam ? cam.nome : 'sem Caminho'].join(' · ');
    }
    if (p.id === 'anarquistas') {
      const t = TIPOS_BARONIA.find(x => x.id === (d.baronia || {}).tipo);
      return [(d.baronia && d.baronia.nome) ? `baronia ${d.baronia.nome}` : 'sem baronia',
              t ? t.nome : '', d.papel ? (PAPEIS_BARONIA.find(x => x.id === d.papel) || {}).nome : '']
        .filter(Boolean).join(' · ');
    }
    if (p.id === 'independente') {
      const n = NEGOCIOS.find(x => x.id === d.negocio);
      return [d.linhagem || 'sem linhagem', n ? n.nome : '',
              `${(d.contratos || []).filter(x => x && x.servico).length} contrato(s)`]
        .filter(Boolean).join(' · ');
    }
    if (p.id === 'camarilla') return d.cargo && d.cargo !== 'Nenhum' ? d.cargo : 'sem cargo na corte';
    if (p.id === 'nenhuma') return d.motivo || 'sem corte, sem chamada';
    return '';
  }
};

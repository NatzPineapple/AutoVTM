const Estado = {

  trilhas(f) {
    const d = derivados(f);
    return {
      vitalidade: { max: d.vitalidade, sup: f.danoSuperficial || 0, agr: f.danoAgravado || 0,
                    livres: Math.max(0, d.vitalidade - (f.danoSuperficial || 0) - (f.danoAgravado || 0)) },
      vontade:    { max: d.vontade, sup: f.danoVontade || 0, agr: f.danoVontadeAgravado || 0,
                    livres: Math.max(0, d.vontade - (f.danoVontade || 0) - (f.danoVontadeAgravado || 0)) },
      humanidade: { valor: d.humanidade, maculas: f.maculas || 0,
                    vazias: Math.max(0, 10 - d.humanidade - (f.maculas || 0)) }
    };
  },

  estadosDerivados(f) {
    const t = this.trilhas(f);
    const lista = [];
    if (t.vitalidade.livres === 0 && t.vitalidade.max > 0) lista.push('debilitado');
    if (t.vontade.livres === 0 && t.vontade.max > 0) lista.push('debil_mental');
    if ((f.fome || 0) >= 5) { lista.push('fome_maxima'); lista.push('exangue'); }
    if (t.vitalidade.agr >= t.vitalidade.max && t.vitalidade.max > 0) lista.push('torpor');
    return lista;
  },

  estadosDe(f, manuais) {
    return Array.from(new Set([...(manuais || []), ...this.estadosDerivados(f)]));
  },

  aplicarDano(f, { quantidade, tipo = 'superficial', fonte = '', trilha = 'vitalidade', semMetade = false }) {
    const eventos = [];
    let n = Math.max(0, quantidade | 0);
    if (!n) return { eventos, destruido: false, torpor: false };

    const agravadoDireto = tipo === 'agravado';
    const chaveSup = trilha === 'vontade' ? 'danoVontade' : 'danoSuperficial';
    const chaveAgr = trilha === 'vontade' ? 'danoVontadeAgravado' : 'danoAgravado';

    if (!agravadoDireto && !semMetade && !f.mortal && trilha === 'vitalidade') {
      /* ARREDONDA PARA CIMA.  (§63, item A6)

         O livro, na pág. 126, em letra que não deixa dúvida:

           "A menos que especificado o contrário, divida dano Superficial
            pela metade (ARREDONDANDO PARA CIMA) antes de aplicá-lo à
            trilha."

         Era `Math.floor`, e o projeto tinha até escrito que "1 virando 0
         é regra, não defeito". Não é: 1 vira 1. O erro era sistemático —
         todo dano Superficial ÍMPAR chegava com meio ponto a menos, e o
         soco isolado não marcava nada.

         Com o arredondamento certo, `n` nunca é zero aqui (n ≥ 1 desde o
         começo do método), então a saída antecipada saiu junto. */
      const antes = n;
      n = Math.ceil(n / 2);
      eventos.push({ tipo: 'nota', texto: `Dano Superficial em vampiro: ${antes} vira ${n}.` });
    }

    const max = this.trilhas(f)[trilha].max;
    let sup = f[chaveSup] || 0, agr = f[chaveAgr] || 0;
    let transbordou = 0, excedente = 0, destruido = false;

    for (let i = 0; i < n; i++) {
      const livres = Math.max(0, max - sup - agr);
      if (agravadoDireto) {
        if (livres > 0) agr++;
        else if (sup > 0) { sup--; agr++; transbordou++; }
        else { excedente = n - i; break; }
      } else {
        if (livres > 0) sup++;
        else if (sup > 0) { sup--; agr++; transbordou++; }
        else { excedente = n - i; break; }
      }
    }
    /* O laço NÃO decide destino. Ele preenche a trilha e conta o que
       não coube; quem decide entre torpor, morte e Morte Final é o
       bloco logo abaixo, que conhece a fonte do dano e a natureza do
       personagem.

       Item A5 da §45.2: aqui havia `destruido = true` quando a trilha
       acabava. O efeito era que um golpe MAIOR que a Vitalidade inteira
       matava um vampiro sem fogo e sem sol — o ramo de torpor existia e
       nunca era alcançado, porque `destruido` já tinha sido marcado. O
       básico (pág. 136) é explícito: trilha inteira de Agravado é
       **torpor** para vampiro; Morte Final é fogo e luz do sol.

       Excedente não vira dano extra nem morte: a trilha já está cheia,
       e não há onde marcar. */

    f[chaveSup] = sup; f[chaveAgr] = agr;
    eventos.push({ tipo: 'dano', trilha, quantidade: n, natureza: tipo, fonte,
                   texto: `${trilha === 'vontade' ? 'Força de Vontade' : 'Vitalidade'}: ${n} de dano ${
                     agravadoDireto ? 'Agravado' : 'Superficial'}${fonte ? ' — ' + fonte : ''}.` });
    if (transbordou) eventos.push({ tipo: 'nota',
      texto: `Trilha cheia: ${transbordou} Superficial virou Agravado.` });
    if (excedente) eventos.push({ tipo: 'nota',
      texto: `${excedente} de dano além da trilha: não há mais onde marcar.` });

    const t = this.trilhas(f);
    const emTorpor = trilha === 'vitalidade' && t.vitalidade.agr >= t.vitalidade.max;
    if (t[trilha].livres === 0) eventos.push({ tipo: 'estado',
      texto: trilha === 'vitalidade' ? 'Debilitado: −2 em piscinas físicas.'
                                     : 'Debilitação mental: −2 em piscinas sociais e mentais.' });
    if (emTorpor) {
      const fogoOuSol = /fogo|sol|chama/i.test(fonte);
      if (f.mortal) {
        eventos.push({ tipo: 'critico', texto: 'Trilha cheia de Agravado: o mortal morre.' });
        destruido = true;
      } else if (fogoOuSol) {
        eventos.push({ tipo: 'critico', texto: 'Trilha cheia de Agravado por fogo ou sol: Morte Final.' });
        destruido = true;
      } else {
        eventos.push({ tipo: 'critico',
          texto: `Trilha cheia de Agravado: torpor por ${this.duracaoTorpor(f)}.` });
      }
    }
    return { eventos, destruido, torpor: emTorpor && !destruido };
  },

  duracaoTorpor(f) {
    const h = derivados(f).humanidade;
    const linha = Escudo.HUMANIDADE[Math.max(1, Math.min(9, h))];
    return linha ? linha.torpor : 'tempo indeterminado';
  },

  curar(f, { tipo = 'superficial', trilha = 'vitalidade' } = {}) {
    const eventos = [];
    const d = derivados(f);
    const tabela = Escudo.POTENCIA_SANGUE[Math.min(10, d.potencia)];
    const quanto = parseInt(tabela.recuperada, 10) || 1;

    if (trilha === 'vitalidade' && tipo === 'superficial') {
      const prov = this.provocacao(f);
      eventos.push(...prov.eventos);
      const cura = Math.min(quanto, f.danoSuperficial || 0);
      f.danoSuperficial = Math.max(0, (f.danoSuperficial || 0) - cura);
      eventos.push({ tipo: 'cura', texto: `Recuperou ${cura} de dano Superficial.` });
      return { eventos, curado: cura };
    }
    if (trilha === 'vontade') {
      const maior = Math.max(f.atributos.autocontrole || 0, f.atributos.determinacao || 0);
      const cura = Math.min(maior, f.danoVontade || 0);
      f.danoVontade = Math.max(0, (f.danoVontade || 0) - cura);
      eventos.push({ tipo: 'cura', texto: `Recuperou ${cura} de Força de Vontade Superficial.` });
      return { eventos, curado: cura };
    }
    if (trilha === 'vitalidade' && tipo === 'agravado') {
      if (!(f.danoAgravado || 0)) {
        eventos.push({ tipo: 'nota', texto: 'Não há dano Agravado a curar.' });
        return { eventos, curado: 0 };
      }
      for (let i = 0; i < 3; i++) eventos.push(...this.provocacao(f).eventos);
      f.danoAgravado = Math.max(0, (f.danoAgravado || 0) - 1);
      eventos.push({ tipo: 'cura',
        texto: 'Recuperou 1 de dano Agravado. Custou três Checagens de Sangue, e leva a noite.' });
      return { eventos, curado: 1 };
    }
    eventos.push({ tipo: 'nota', texto: 'Nada a curar nesta combinação de trilha e natureza.' });
    return { eventos, curado: 0 };
  },

  provocacao(f, { permitirRerrolagem = true } = {}) {
    const eventos = [];
    const d = derivados(f);
    const tabela = Escudo.POTENCIA_SANGUE[Math.min(10, d.potencia)];
    let dado = Dados.d10();
    let rerrolou = false;

    if (permitirRerrolagem && dado <= 5 && tabela.rerrolagem !== 'Nenhuma') {
      const segundo = Dados.d10();
      rerrolou = true;
      eventos.push({ tipo: 'nota', texto: `Rerrolagem de Sangue (${tabela.rerrolagem}): ${dado} → ${segundo}.` });
      dado = Math.max(dado, segundo);
    }

    const subiu = dado <= 5;
    if (subiu && (f.fome || 0) < 5) {
      f.fome = (f.fome || 0) + 1;
      eventos.push({ tipo: 'fome', texto: `Provocação ${dado}: a Fome sobe para ${f.fome}.` });
      this.secarRessonancia(f, eventos);
    } else if (subiu) {
      eventos.push({ tipo: 'fome', texto: `Provocação ${dado}, mas a Fome já está em 5.` });
    } else {
      eventos.push({ tipo: 'nota', texto: `Provocação ${dado}: a Fome não sobe.` });
    }
    return { eventos, dado, subiu, rerrolou };
  },

  /* ----------------------------------------------------------
     A RESSONÂNCIA DA BOLSA  (§67)

     Básico, pág. 228: "Para determinar o temperamento de uma
     vítima em potencial que o Narrador não tenha criado e
     detalhado antes da sessão, role 1d10 para obter um
     temperamento aleatório. Se você rolar 6+ no dado, role de
     novo para determinar a Ressonância do humano."

     As duas tabelas já estavam em `data-escudo.js` desde sempre
     — e NINGUÉM AS ROLAVA. Eram dado morto.

     Devolve sempre `{ temperamento, ressonancia }`, com
     `ressonancia` nula quando o temperamento é equilibrado (o
     livro não manda rolar a segunda tabela nesse caso).
     ---------------------------------------------------------- */
  /* "Esse bônus dura até que a próxima dose de sangue do vampiro o
     dilua ou até que o sistema do vampiro fique sem sangue ao
     alcançar Fome 5." (pág. 228) A diluição é a própria
     `impregnar`, que sobrescreve; a Fome 5 é aqui. (§67) */
  secarRessonancia(f, eventos) {
    if ((f.fome || 0) < 5) return false;
    if (!f.temperamento || f.temperamento === 'nenhum') return false;
    const r = Ressonancia.por(f.ressonancia);
    f.temperamento = '';
    eventos.push({ tipo: 'nota',
      texto: `Fome 5: o sangue secou. A Ressonância ${r ? r.nome : ''} não vale mais dado.` });
    return true;
  },

  sortearBolsa() {
    const d1 = Dados.d10();
    const faixa = Escudo.TEMPERAMENTO_ALEATORIO.find(t => d1 >= t.faixa[0] && d1 <= t.faixa[1]);
    let id = (faixa && faixa.id) || 'nenhum';
    const rolagens = [d1];
    /* "9-0: Intenso, potencialmente agudo: role novamente abaixo
        — 1-8: Intenso, 9-0: Agudo" */
    if (id === 'intenso') {
      const d2 = Dados.d10();
      rolagens.push(d2);
      if (d2 >= 9) id = 'agudo';
    }
    if (id === 'nenhum') return { temperamento: 'nenhum', ressonancia: null, rolagens };
    const d3 = Dados.d10();
    rolagens.push(d3);
    const linha = Escudo.RESSONANCIA_ALEATORIA.find(r => d3 >= r.faixa[0] && d3 <= r.faixa[1]);
    return { temperamento: id, ressonancia: linha ? linha.ressonancia : null, rolagens };
  },

  /* O sangue "muda um pouco a própria Ressonância do vampiro"
     (pág. 226). Aqui é onde isso acontece — e é o que faz o dado
     da pág. 228 chegar à parada de Disciplina. */
  impregnar(f, bolsa, eventos) {
    if (!bolsa || !bolsa.ressonancia) return null;
    const r = Ressonancia.por(bolsa.ressonancia);
    const t = Ressonancia.temperamentoPor(bolsa.temperamento);
    if (!r || !t) return null;

    f.ressonancia = r.id;
    f.temperamento = t.id;
    eventos.push({ tipo: 'nota',
      texto: `Sangue ${r.nome}, temperamento ${t.nome}.${
        t.dados ? ` +${t.dados} dado em ${Ressonancia.disciplinasDe(r.id)} até diluir ou até a Fome 5.` : ''}` });

    if (t.discrasia) {
      const lista = Ressonancia.discrasiasDe(r.id);
      if (!lista.length) {
        eventos.push({ tipo: 'nota',
          texto: `${r.nome} agudo, mas animais não fornecem Discrasias (pág. 227).` });
      } else {
        eventos.push({ tipo: 'critico',
          texto: `Temperamento agudo: há uma Discrasia neste sangue. Para usá-la é preciso matar e drenar a bolsa, ou se alimentar dela por três noites (pág. 228).` });
      }
    }
    return { ressonancia: r.id, temperamento: t.id };
  },

  alimentar(f, fonteNome, bolsa = null) {
    const eventos = [];
    const linha = Arbitro.alimentacaoPor(fonteNome);
    if (!linha) return { eventos: [{ tipo: 'nota', texto: 'Fonte de sangue desconhecida.' }], saciou: 0 };

    const d = derivados(f);
    const ps = d.potencia;
    const animalOuBolsa = /animal|animais|bolsa|cavalo|cachorro|gatos|ratos/i.test(linha.fonte);
    let sacia = typeof linha.sacia === 'number' ? linha.sacia : 4;

    if (animalOuBolsa) {
      if (ps >= 4) {
        eventos.push({ tipo: 'bloqueio', texto: `Potência de Sangue ${ps}: animais e bolsas não saciam mais nada.` });
        return { eventos, saciou: 0 };
      }
      if (ps >= 2) {
        sacia = Math.floor(sacia / 2);
        eventos.push({ tipo: 'nota', texto: `Potência de Sangue ${ps}: sacia metade.` });
      }
    } else if (ps >= 4) {
      const menos = ps >= 10 ? 3 : ps >= 6 ? 2 : 1;
      sacia = Math.max(0, sacia - menos);
      eventos.push({ tipo: 'nota', texto: `Potência de Sangue ${ps}: ${menos} a menos por humano.` });
    }

    const antes = f.fome || 0;
    f.fome = Math.max(0, antes - sacia);
    eventos.push({ tipo: 'fome', texto: `${linha.fonte}: saciou ${sacia}. Fome ${antes} → ${f.fome}. (${linha.tempo})` });
    if (linha.obs) eventos.push({ tipo: 'nota', texto: linha.obs });

    /* Sangue de bolsa "nunca oferece Ressonância intensa" — é o que
       `data-predadores.js` já dizia do Saco de Sangue, e o que a
       tabela do Escudo confirma. Sangue animal tem Ressonância, mas
       não tem Discrasia (pág. 227). (§67) */
    let ressonancia = null;
    if (sacia > 0 && !/bolsa/i.test(linha.fonte)) {
      const sorteada = bolsa || (/animal|animais|cavalo|cachorro|gatos|ratos/i.test(linha.fonte)
        ? Object.assign(this.sortearBolsa(), { ressonancia: 'animal' })
        : this.sortearBolsa());
      ressonancia = this.impregnar(f, sorteada, eventos);
    }
    return { eventos, saciou: sacia, ressonancia };
  },

  /* ----------------------------------------------------------
     MÁCULA A SERVIÇO DE UMA CONVICÇÃO  (§69, item A9)

     Básico, pág. 239, em letra que não deixa dúvida:

       "Se o Princípio foi violado EM RESPEITO A UMA CONVICÇÃO,
        reduza as Máculas ganhas em UMA OU MAIS."

     E o exemplo da mesma página: Joana esmaga a cabeça de quem ia
     revelar a natureza dela ao irmão caçula. O ato valeria 3
     Máculas; como Joana tem a Convicção "minha família deve ser
     mantida fora disto", ela recebe APENAS 2.

     `porConviccao` é o texto da Convicção invocada. A redução é de
     1 por padrão — o mínimo do livro —, e `reducao` permite mais,
     que é a parte que fica com o Narrador. Pode zerar: o livro não
     dá piso, e uma Mácula única a serviço de uma Convicção é
     justamente o caso em que não sobra nada para marcar.
     ---------------------------------------------------------- */
  ganharMacula(f, quantidade, motivo, { porConviccao = '', reducao = 1 } = {}) {
    const bruto = Math.max(0, quantidade | 0);
    let n = bruto;
    const eventos = [];

    if (porConviccao) {
      const menos = Math.min(bruto, Math.max(1, reducao | 0));
      n = bruto - menos;
      eventos.push({ tipo: 'nota',
        texto: `Em respeito à Convicção "${porConviccao}": ${bruto} Mácula${
          bruto === 1 ? '' : 's'} vira${bruto - menos === 1 ? '' : 'm'} ${n} (pág. 239).` });
    }

    f.maculas = (f.maculas || 0) + n;
    const t = this.trilhas(f);
    eventos.push({ tipo: 'macula',
      texto: `${n} Mácula${n === 1 ? '' : 's'}${motivo ? ' — ' + motivo : ''}. Total: ${f.maculas}.` });
    if (t.humanidade.vazias === 0) {
      eventos.push({ tipo: 'critico', texto: 'As Máculas ultrapassaram a trilha: teste de Remorso agora.' });
    }
    return { eventos, precisaRemorso: t.humanidade.vazias === 0 };
  },

  /* ----------------------------------------------------------
     PERDER UM PILAR DERRUBA A CONVICÇÃO  (§69, item A8)

     Básico, pág. 173:

       "Uma vez perdida uma dessas pessoas, a Convicção a ela
        associada TAMBÉM ESTARÁ PERDIDA."

     A regra estava escrita no `regras.md` desde sempre e nenhuma
     linha a executava: o mortal morria e a Convicção continuava na
     ficha, valendo redução de Mácula (A9) e alívio de fim de sessão.

     `porSuasAcoes` escolhe a linha da tabela de Máculas do Escudo
     — 2 pela perda, 3 se foi você. É a mesma tabela que já estava
     em `MACULAS_POR_ATO`, e que ninguém consultava para isto.

     A Convicção NÃO é apagada do vetor: ela é esvaziada na posição,
     porque Convicção e Pilar são pareados por índice e mexer no
     comprimento desalinharia os outros pares. Esvaziar é o que a
     ficha já entende como "não existe".
     ---------------------------------------------------------- */
  perderPilar(f, indice, { porSuasAcoes = false, motivo = '' } = {}) {
    const i = indice | 0;
    const eventos = [];
    const pilar = (f.marcos || [])[i];
    const conviccao = (f.conviccoes || [])[i];

    if (!pilar && !conviccao) {
      eventos.push({ tipo: 'nota', texto: 'Não há Pilar nessa posição.' });
      return { eventos, perdeu: false };
    }

    f.marcos[i] = '';
    f.conviccoes[i] = '';
    eventos.push({ tipo: 'critico',
      texto: `${pilar || 'O Pilar'} se foi${motivo ? ` — ${motivo}` : ''}.` });
    if (conviccao) eventos.push({ tipo: 'critico',
      texto: `A Convicção que ele encarnava cai junto: "${conviccao}" (pág. 173).` });

    const linha = Arbitro.maculasPor(porSuasAcoes ? 'Pilar destruído por suas ações' : 'Pilar destruído');
    if (linha) {
      const m = this.ganharMacula(f, linha.maculas, linha.ato);
      eventos.push(...m.eventos);
    }

    /* Ficar sem NENHUMA Convicção não tem regra própria no livro, mas
       é um fato que a mesa precisa ver: a bússola moral do personagem
       ficou sem nada a que se prender.

       (A trava de `podeComprarHumanidade` é do Sabá, e lá a âncora é
       um Ritae, não um mortal — não cabe aqui. O primeiro rascunho
       desta função a chamava, e o teste mostrou que ela nunca
       dispararia para quem tem Pilar mortal.) */
    const restam = (f.conviccoes || []).filter(Boolean).length;
    if (!restam) eventos.push({ tipo: 'critico',
      texto: 'Sem nenhuma Convicção: não sobrou linha que você não cruze.' });

    return { eventos, perdeu: true, pilar, conviccao, conviccoesRestantes: restam };
  },

  bussolaDe(f) {
    return (typeof Seitas !== 'undefined' ? Seitas.perfil(f.seita) : { bussola: { tipo: 'humanidade', rotulo: 'Humanidade' } }).bussola;
  },

  caminhoDe(f) {
    if (this.bussolaDe(f).tipo !== 'caminho') return null;
    const d = (f.seitaDados || {}).sabbat || {};
    return CAMINHOS.find(c => c.id === d.caminho) || null;
  },

  compulsaoDe(f, { deCaminho = false } = {}) {
    const cam = this.caminhoDe(f);
    if (deCaminho && cam) {
      return { origem: 'caminho', nome: cam.compulsao.nome, texto: cam.compulsao.texto,
               eventos: [{ tipo: 'compulsao',
                 texto: `Compulsão de Caminho — ${cam.compulsao.nome}: ${cam.compulsao.texto}` }] };
    }
    const c = claDe(f.cla);
    if (!c) return { origem: 'nenhuma', eventos: [{ tipo: 'nota', texto: 'Sem clã, sem Compulsão.' }] };
    return { origem: 'cla', nome: c.compulsao.nome, texto: c.compulsao.texto,
             alternativa: cam ? cam.compulsao.nome : null,
             eventos: [{ tipo: 'compulsao', texto: `Compulsão de clã — ${c.compulsao.nome}: ${c.compulsao.texto}` }] };
  },

  podeComprarHumanidade(f) {
    if (this.bussolaDe(f).tipo !== 'caminho') return { pode: true, motivo: '' };
    const temPilarMortal = (f.marcos || []).some(Boolean);
    return temPilarMortal
      ? { pode: true, motivo: 'Ainda resta um Pilar mortal.' }
      : { pode: false, motivo: 'Sem nenhuma Convicção ligada a Pilar mortal: a Humanidade se mantém, mas não se compra mais.' };
  },

  vaulderie(f) {
    const eventos = [];
    if (this.bussolaDe(f).tipo !== 'caminho') {
      return { eventos: [{ tipo: 'bloqueio', texto: 'A Vaulderie é rito do Sabá.' }], vinculum: 0 };
    }
    const d = Seitas.dados(f, 'sabbat');
    const grupo = Matilha.de(f);
    const antes = grupo ? grupo.vinculum : (d.vinculum || 0);
    const depois = Math.min(3, antes + 1);
    if (grupo) {
      Matilha.definir(grupo.id, 'vinculum', depois);
      eventos.push({ tipo: 'vinculum',
        texto: `Vaulderie da matilha ${grupo.nome}: Vinculum ${antes} → ${depois} para ${grupo.membros.length} celebrante(s).` });
    } else {
      eventos.push({ tipo: 'nota', texto: 'Sem matilha registrada: o Vinculum fica só na sua ficha.' });
      eventos.push({ tipo: 'vinculum', texto: `Vaulderie celebrada: Vinculum ${antes} → ${depois}.` });
    }
    d.vinculum = depois;
    if (f.laçoDeSangue || f.lacoDeSangue) {
      f.lacoDeSangue = 0; f['laçoDeSangue'] = 0;
      eventos.push({ tipo: 'nota', texto: 'Todos os Laços de Sangue que não são Vinculum foram quebrados.' });
    }
    if (depois >= 3) {
      eventos.push({ tipo: 'nota', texto: 'Vinculum 3: imune a Laços de Sangue que não sejam Vinculum.' });
    }
    return { eventos, vinculum: depois };
  },

  invocarVinculum(f, alvoFicha) {
    const alvoDoTeste = alvoFicha || f;
    const grupo = Matilha.de(alvoDoTeste);
    const d = Seitas.dados(alvoDoTeste, 'sabbat');
    const forca = grupo ? grupo.vinculum : (d.vinculum || 0);
    if (!forca) return { eventos: [{ tipo: 'bloqueio', texto: 'Não há Vinculum a invocar.' }], rolagem: null };
    const alvo = alvoFicha || f;
    const piscina = (alvo.atributos.determinacao || 0) + (alvo.atributos.inteligencia || 0);
    const r = Dados.rolar({ piscina, fome: alvo.fome || 0, dificuldade: forca,
                            rotulo: 'Resistir ao Vinculum' });
    const eventos = [{ tipo: 'nota', texto: `Vinculum de Força ${forca}: Determinação + Inteligência contra ${forca}.` }];
    eventos.push(r.passou
      ? { tipo: 'vinculum', texto: 'Você consegue agir contra a matilha nesta cena.' }
      : { tipo: 'critico', texto: 'O sangue fala mais alto. Você obedece.' });
    return { eventos, rolagem: r, resistiu: r.passou };
  },

  celebrarRitae(f, ritaeId) {
    const eventos = [];
    if (this.bussolaDe(f).tipo !== 'caminho') {
      return { eventos: [{ tipo: 'bloqueio', texto: 'Os Ritae são do Sabá.' }] };
    }
    const rito = RITAE.find(r => r.id === ritaeId);
    if (!rito) return { eventos: [{ tipo: 'nota', texto: 'Ritae desconhecido.' }] };
    const d = Seitas.dados(f, 'sabbat');
    eventos.push({ tipo: 'ritae', texto: `${rito.nome}: ${rito.efeito}` });

    if (ritaeId === 'vaulderie') return { eventos: [...eventos, ...this.vaulderie(f).eventos] };

    const ehPilar = (d.conviccoesRitae || []).includes(ritaeId);
    if (!ehPilar) {
      eventos.push({ tipo: 'nota', texto: 'Este Ritae não é Pilar seu: vale o efeito do rito, não o alívio da Convicção.' });
      return { eventos, pilar: false };
    }
    const grupo = Matilha.de(f);
    const inedito = grupo ? Matilha.celebrar(grupo, ritaeId) : d.ritaeUsadoNaSessao !== ritaeId;
    if (!inedito) {
      eventos.push({ tipo: 'nota', texto: 'Este Ritae-Pilar já rendeu alívio nesta sessão.' });
      return { eventos, pilar: true, usado: true };
    }
    d.ritaeUsadoNaSessao = ritaeId;
    if ((f.maculas || 0) > 0) {
      f.maculas = Math.max(0, f.maculas - 1);
      eventos.push({ tipo: 'macula', texto: `Ritae-Pilar celebrado: uma Mácula removida. Restam ${f.maculas}.` });
      return { eventos, pilar: true, removeuMacula: true };
    }
    eventos.push({ tipo: 'nota', texto: 'Sem Máculas a remover. O alívio fica disponível como teste de Remorso quando houver.' });
    return { eventos, pilar: true };
  },

  testeDeRemorso(f) {
    const t = this.trilhas(f);
    if (!t.humanidade.maculas) {
      return { eventos: [{ tipo: 'nota', texto: 'Sem Máculas: não há Remorso a testar.' }], rolagem: null };
    }
    const piscina = Math.max(1, t.humanidade.vazias);
    const r = Dados.rolar({ piscina, fome: 0, dificuldade: 1, rotulo: 'Remorso' });
    const eventos = [];
    if (r.sucessos >= 1) {
      eventos.push({ tipo: 'remorso', texto: `Remorso com ${piscina} dado${piscina === 1 ? '' : 's'}: ${r.sucessos} sucesso(s). A Humanidade se mantém em ${t.humanidade.valor}.` });
    } else {
      f.humanidadeMod = (f.humanidadeMod || 0) - 1;
      eventos.push({ tipo: 'critico', texto: `Remorso falhou. Humanidade cai para ${derivados(f).humanidade}.` });
    }
    f.maculas = 0;
    eventos.push({ tipo: 'nota', texto: 'As Máculas se apagam com a alvorada.' });
    return { eventos, rolagem: r, perdeu: r.sucessos < 1 };
  },

  testeDeFrenesi(f, { tipo = 'furia', gatilho = '', cavalgar = false }) {
    const d = derivados(f);
    const info = Arbitro.dificuldadeFrenesi(tipo, gatilho, d.humanidade);
    const eventos = [];

    if (cavalgar) {
      eventos.push({ tipo: 'frenesi',
        texto: `Cavalgar a Onda: você entrega o controle de propósito e escolhe como a Besta age. Sem teste.` });
      return { eventos, rolagem: null, resistiu: false, cavalgou: true, info };
    }

    const piscina = (f.atributos.autocontrole || 0) + (f.atributos.determinacao || 0)
                  + (info.modificadorHumanidade || 0);
    const r = Dados.rolar({ piscina, fome: 0, dificuldade: info.dificuldade,
                            rotulo: `Resistir ao frenesi de ${tipo}` });
    eventos.push({ tipo: 'nota',
      texto: `${info.gatilho || tipo} — dificuldade ${info.dificuldade}. ${info.nota}` });

    if (r.passou) {
      eventos.push({ tipo: 'frenesi', texto: `Resistiu ao frenesi de ${tipo} por uma cena.` });
    } else {
      eventos.push({ tipo: 'critico', texto: `Frenesi de ${tipo}: a Besta assume o controle.` });
    }
    return { eventos, rolagem: r, resistiu: r.passou, cavalgou: false, info };
  },

  aplicarConsequencia(f, resultado, escolha) {
    const eventos = [];
    const c = Arbitro.consequencias(resultado);
    if (!c) return { eventos };
    const alvo = escolha || c.escolhas[0];

    if (/mácula|macula/i.test(alvo)) {
      eventos.push(...this.ganharMacula(f, 1, resultado.tipo === 'perigo' ? 'Sucesso em Perigo' : 'Falha Bestial').eventos);
    } else if (/fome/i.test(alvo)) {
      if ((f.fome || 0) < 5) { f.fome = (f.fome || 0) + 1;
        eventos.push({ tipo: 'fome', texto: `A Fome sobe para ${f.fome}.` });
        this.secarRessonancia(f, eventos); }
    } else if (/agravado/i.test(alvo)) {
      eventos.push(...this.aplicarDano(f, { quantidade: 1, tipo: 'agravado', fonte: 'Falha Bestial' }).eventos);
    } else if (/compulsão|compulsao/i.test(alvo)) {
      const comp = Arbitro.compulsaoAleatoria(f.cla);
      eventos.push({ tipo: 'compulsao', texto: `Compulsão (1d10 = ${comp.dado}): ${comp.compulsao}.` });
      const cam = this.caminhoDe(f);
      if (cam) eventos.push({ tipo: 'nota',
        texto: `Você pode acionar a Compulsão de Caminho no lugar: ${cam.compulsao.nome} — ${cam.compulsao.texto}` });
    } else {
      eventos.push({ tipo: 'nota', texto: alvo });
    }
    return { eventos, escolha: alvo, opcoes: c.escolhas };
  },

  CUSTO_XP: {
    atributo:      (n) => n * 5,
    habilidade:    (n) => n * 3,
    especializacao: () => 3,
    disciplinaCla: (n) => n * 5,
    disciplinaFora:(n) => n * 7,
    disciplinaCaitiff: (n) => n * 6,
    ritual:        (n) => n * 3,
    formula:       (n) => n * 3,
    vantagem:      (n) => n * 3,
    potenciaSangue:(n) => n * 10
  },

  custoDe(tipo, novoNivel) {
    const fn = this.CUSTO_XP[tipo];
    return fn ? fn(novoNivel) : null;
  },

  /* ----------------------------------------------------------
     O DESEJO PAGA NA HORA  (§69, item A7)

     Básico, pág. 174:

       "Uma vez por sessão, quando o personagem decididamente agir
        para promover ou realizar seu Desejo, ele poderá recuperar
        IMEDIATAMENTE um ponto de dano Superficial à Força de
        Vontade."

     E a mesma página diz para que serve:

       "Esta mecânica oferece intencionalmente aos jogadores um
        incentivo para que o personagem AJA, em vez de esperar
        passivamente pela trama ou ficar procrastinando
        defensivamente."

     O motor pagava só no fechamento da sessão. O ponto chegava, mas
     chegava depois de a noite acabar — quer dizer, o incentivo a
     agir agora não existia.

     `desejoUsadoNaSessao` segue o padrão de `ritaeUsadoNaSessao`:
     marca na ficha, e `fimDeSessao` limpa.
     ---------------------------------------------------------- */
  realizarDesejo(f, { desejo = '' } = {}) {
    const eventos = [];
    if (f.desejoUsadoNaSessao) {
      eventos.push({ tipo: 'nota', texto: 'O Desejo já rendeu Vontade nesta sessão. Uma vez por sessão.' });
      return { eventos, pagou: false, usado: true };
    }
    f.desejoUsadoNaSessao = true;
    const alvo = desejo || f.desejo || '';
    if (!(f.danoVontade || 0)) {
      eventos.push({ tipo: 'nota',
        texto: `Agiu pelo Desejo${alvo ? ` — "${alvo}"` : ''}, mas não há Vontade Superficial para recuperar.` });
      return { eventos, pagou: false };
    }
    f.danoVontade = Math.max(0, f.danoVontade - 1);
    eventos.push({ tipo: 'cura',
      texto: `Agiu pelo Desejo${alvo ? ` — "${alvo}"` : ''}: 1 de Vontade Superficial recuperada, na hora (pág. 174).` });
    return { eventos, pagou: true };
  },

  fimDeSessao(f, { cumpriuAmbicao = false, cumpriuDesejo = false, beneficiouPilar = false } = {}) {
    const eventos = [];
    let xp = 1;

    const cura = this.curar(f, { trilha: 'vontade' });
    eventos.push(...cura.eventos);

    /* O Desejo é pago na hora por `realizarDesejo` (A7). Este ramo
       continua existindo para quem só marca no fechamento — e não
       paga duas vezes na mesma sessão. */
    if (cumpriuDesejo && f.desejoUsadoNaSessao) {
      eventos.push({ tipo: 'nota', texto: 'O Desejo já foi pago durante a sessão.' });
    } else if (cumpriuDesejo && (f.danoVontade || 0) > 0) {
      f.danoVontade = Math.max(0, f.danoVontade - 1);
      eventos.push({ tipo: 'cura', texto: 'Agiu conforme o Desejo: mais 1 de Vontade Superficial recuperado.' });
    }
    if (cumpriuAmbicao && (f.danoVontadeAgravado || 0) > 0) {
      f.danoVontadeAgravado = Math.max(0, f.danoVontadeAgravado - 1);
      xp += 1;
      eventos.push({ tipo: 'cura', texto: 'Agiu conforme a Ambição: 1 de Vontade Agravada recuperada.' });
    }
    if (beneficiouPilar && (f.danoVontadeAgravado || 0) > 0) {
      f.danoVontadeAgravado = Math.max(0, f.danoVontadeAgravado - 1);
      eventos.push({ tipo: 'cura', texto: 'Beneficiou um Pilar ou defendeu uma Convicção: 1 de Vontade Agravada recuperada.' });
    }

    if ((f.maculas || 0) > 0) {
      const rem = this.testeDeRemorso(f);
      eventos.push(...rem.eventos);
    }

    /* A sessão acabou: o Desejo volta a poder ser cobrado (A7). */
    delete f.desejoUsadoNaSessao;

    if (this.bussolaDe(f).tipo === 'caminho') {
      const d = Seitas.dados(f, 'sabbat');
      delete d.ritaeUsadoNaSessao;
      Matilha.novaSessao(Matilha.de(f));
      const compra = this.podeComprarHumanidade(f);
      if (!compra.pode) eventos.push({ tipo: 'nota', texto: compra.motivo });
    }

    f.xpTotal = String((parseInt(f.xpTotal, 10) || 0) + xp);
    eventos.push({ tipo: 'xp', texto: `${xp} ponto${xp === 1 ? '' : 's'} de experiência. Total: ${f.xpTotal}.` });
    return { eventos, xp };
  }
};

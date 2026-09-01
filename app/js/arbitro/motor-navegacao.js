/* ============================================================
   VITÆ — Elo 3 da cadeia: navegação
   Substitui o navegador provisório da §41, que devolvia "terreno
   livre" para tudo (item A3 da §45.2).

   A pergunta deste elo é uma só, e não é a do Grafo nem a do
   Especialista: **dá para alcançar o alvo daqui, agora, e a que
   preço?** Distância, caminho, linha de tiro e cobertura. Se dá
   para agir é o elo 2 que diz; o que a REGRA cobra é o elo 4.

   ------------------------------------------------------------
   O MODELO ESPACIAL, E POR QUE ELE NÃO É UMA MALHA DE METROS

   A tentação era desenhar uma grade e pôr coordenadas em tudo.
   Seria inventar informação: nenhuma campanha do projeto declara
   posição, e um metro tirado do nada vira dificuldade tirada do
   nada — exatamente o que a §3.2 proíbe.

   Então a navegação usa o espaço que o mundo REALMENTE declara,
   que é o do grafo: o local em que cada um está, a adjacência
   entre locais e o que está trancado ou fechado no caminho. Isso
   dá quatro situações, e as quatro têm resposta honesta:

     mesmo local      -> alcançável, distância do ambiente
     local adjacente  -> exige aproximar-se: uma rodada de
                         movimento antes do golpe
     local conhecido  -> longe demais para uma briga
     desconhecido     -> não dá para ir para onde não se sabe

   Quando a cena DECLARA distância — o oponente com `distancia`,
   o alvo de fala com a sua —, o declarado ganha do inferido. O
   mundo específico sempre vence o modelo geral.
   ============================================================ */

const Navegacao = {

  /* Distância presumida quando ninguém declarou nada. São os
     alcances do próprio Árbitro, não números novos: estar no mesmo
     ambiente É o alcance "ambiente" (15 m). */
  PRESUMIDA: {
    mesmo_local: 'ambiente',
    adjacente:   'visao',
    distante:    'longo'
  },

  metrosDe(chaveAlcance) {
    const a = Arbitro.ALCANCES[chaveAlcance];
    return a ? a.metros : null;
  },

  /* ------------------------------------------------------------
     ONDE O ALVO ESTÁ, EM RELAÇÃO A VOCÊ
     ------------------------------------------------------------ */
  situacao(grafo, alvoId, quem = 'voce') {
    if (!alvoId) return { relacao: 'sem_alvo', saltos: null };

    const aqui = Grafo.ondeEsta(grafo, quem);
    const la = Grafo.ondeEsta(grafo, alvoId);
    const no = Grafo.por(grafo, alvoId);

    if (!no) return { relacao: 'inexistente', saltos: null };
    if (!la) return { relacao: 'sem_lugar', saltos: null, no };
    if (aqui && la === aqui) return { relacao: 'mesmo_local', saltos: 0, no, local: la };

    const saltos = aqui ? Grafo.saltos(grafo, aqui, la) : Infinity;
    if (saltos === 1) return { relacao: 'adjacente', saltos, no, local: la };
    if (Number.isFinite(saltos)) return { relacao: 'distante', saltos, no, local: la };

    const destino = Grafo.por(grafo, la);
    if (destino && destino.conhecido === false) {
      return { relacao: 'desconhecido', saltos: null, no, local: la };
    }
    return { relacao: 'sem_caminho', saltos: null, no, local: la };
  },

  /* ------------------------------------------------------------
     LINHA DE TIRO
     Não é metáfora: o que barra é coisa fechada no caminho. O
     grafo sabe de continência e de tranca, e é só isso que se usa —
     nada de "o Narrador achou que estava escuro".
     ------------------------------------------------------------ */
  linhaDeTiro(grafo, alvoId, situacao, quem = 'voce') {
    if (!alvoId) return { ok: true, motivo: '' };

    /* Dentro de algo fechado: o Grafo já responde isso, e responde
       melhor do que uma regra nova responderia. */
    const mao = Grafo.aoAlcanceDaMao(grafo, quem, alvoId);
    if (!mao.ok && mao.motivo && /fechado|dentro/i.test(mao.motivo)) {
      return { ok: false, motivo: `Não há linha de visão: o alvo ${mao.motivo}.` };
    }

    const no = situacao.no;
    if (no && /escondid|oculto|invisiv/i.test(String(no.estado || ''))) {
      return { ok: false, motivo: 'Você não vê o alvo: ele está escondido.' };
    }

    if (situacao.relacao === 'mesmo_local') return { ok: true, motivo: '' };

    /* Porta trancada entre você e ele barra o tiro, e não barra o
       movimento — quem barra movimento é o elo 2. */
    if (situacao.local) {
      const trancas = Grafo.trancas(grafo, situacao.local) || [];
      const fechada = trancas.find(t => t && !Grafo.ABERTOS.includes(String(t.estado || 'aberto')));
      if (fechada) {
        return { ok: false, motivo: `${fechada.nome} está no caminho, e fechada.` };
      }
    }

    if (situacao.relacao === 'adjacente') return { ok: true, motivo: '' };
    return { ok: false, motivo: 'O alvo não está à vista daqui.' };
  },

  /* ------------------------------------------------------------
     COBERTURA
     Só o que a cena declara. Não existe cobertura padrão: a tabela
     do Escudo trata "Sem cobertura" como −2 na defesa, e aplicar
     isso a todo mundo por omissão baixaria a defesa do jogo
     inteiro sem ninguém ter decidido nada.
     ------------------------------------------------------------ */
  coberturaDe(alvo, situacao) {
    const declarada = (alvo && alvo.cobertura) ||
                      (situacao.no && situacao.no.cobertura) || null;
    if (!declarada) return null;
    const c = Combate.modificadorDeCobertura(declarada);
    return c ? { nome: c.nome, modificador: c.modificador, nota: c.nota || '' } : null;
  },

  /* ------------------------------------------------------------
     O NAVEGADOR
     Devolve o mesmo contrato que o `livre` da §41 devolvia — por
     isso a troca não exigiu mudança em nada que consome isto. Aquele
     foi apagado na §53; este é o único que existe.
     ------------------------------------------------------------ */
  navegar({ grafo, contexto, plano, mesa, alvo }) {
    const acao = (plano && plano.acoes && plano.acoes[0]) || {};
    const alvoId = acao.alvo || acao.destino || (alvo && alvo.id) || null;
    const sit = this.situacao(grafo, alvoId);
    const vista = this.linhaDeTiro(grafo, alvoId, sit);
    const cobertura = this.coberturaDe(alvo, sit);

    /* Declarado ganha de inferido. E quando não há nem um nem outro —
       alvo que não é nó do grafo, ou ação sem alvo — a distância é
       **nula**, não "longe".

       Isto não é detalhe. A primeira versão caía em 'longo' (1000 m)
       para o desconhecido, e como o oponente de combate vive em
       `M.combate.oponentes` e não no grafo, TODO soco passou a ser
       barrado por alcance: "Desarmado alcança 0 m, e o alvo está a
       1000 m". Não saber onde alguém está não é o mesmo que saber que
       ele está longe. */
    const declarada = (alvo && typeof alvo.distancia === 'number') ? alvo.distancia
                    : (sit.no && typeof sit.no.distancia === 'number') ? sit.no.distancia
                    : null;
    const presumida = this.PRESUMIDA[sit.relacao];
    const distancia = declarada != null
      ? declarada
      : (presumida ? this.metrosDe(presumida) : null);

    const base = {
      provisorio: false,
      bloqueado: false,
      motivo: '',
      relacao: sit.relacao,
      saltos: sit.saltos,
      distancia,
      distanciaDeclarada: declarada != null,
      rota: null,
      linhaDeTiro: vista.ok,
      cobertura,
      penalidade: 0,
      nome: '',
      nota: ''
    };

    if (!alvoId) {
      return Object.assign(base, { nota: 'Sem alvo: nada a percorrer.' });
    }

    if (sit.relacao === 'inexistente' || sit.relacao === 'desconhecido' ||
        sit.relacao === 'sem_caminho') {
      return Object.assign(base, {
        bloqueado: true,
        motivo: sit.relacao === 'desconhecido'
          ? 'Você não sabe chegar lá — e não se atravessa uma cidade que não se conhece no meio de uma briga.'
          : 'Não há caminho daqui até o alvo.'
      });
    }

    if (sit.relacao === 'distante') {
      return Object.assign(base, {
        bloqueado: true,
        motivo: `O alvo está a ${sit.saltos} lugares daqui. Isso é travessia, não é briga: saia do combate primeiro.`
      });
    }

    if (sit.relacao === 'adjacente') {
      /* Não barra: cobra. Aproximar-se é a ação da rodada, e o
         golpe fica −2 por ter sido dado em movimento. */
      base.rota = this.rotaAte(grafo, sit.local);
      return Object.assign(base, {
        penalidade: -2,
        nome: 'Alvo no ambiente ao lado',
        nota: `Você precisa cruzar até ${(Grafo.por(grafo, sit.local) || {}).nome || 'lá'} antes de acertar: −2 por agir em movimento.`,
        linhaDeTiro: vista.ok,
        motivo: vista.ok ? '' : vista.motivo
      });
    }

    /* Mesmo local. */
    if (!vista.ok) {
      return Object.assign(base, { bloqueado: false, linhaDeTiro: false, motivo: vista.motivo,
        nota: vista.motivo });
    }
    return Object.assign(base, { nota: 'Alvo ao alcance, no mesmo ambiente.' });
  },

  rotaAte(grafo, destino, quem = 'voce') {
    const aqui = Grafo.ondeEsta(grafo, quem);
    if (!aqui || !destino) return null;
    const caminho = Grafo.caminho(grafo, aqui, destino);
    if (!caminho) return null;
    return caminho.map(id => ({ id, nome: (Grafo.por(grafo, id) || {}).nome || id }));
  },

  /* Como o combate pergunta. `Combate.resolver` aceita `distancia` e
     `cobertura`; isto traduz a navegação para esses dois campos, e é
     o que faz o elo 3 chegar ao dado. */
  /* A regra é uma só, e é conservadora de propósito: **só impõe
     distância quando ela é sabida.** Declarada pela cena, ou inferida
     de uma posição real no grafo. Fora disso, `null` — e o combate
     resolve como sempre resolveu, sem conferir alcance.

     Impor distância por omissão é o defeito mais caro que este arquivo
     pode ter: `Combate.resolver` compara com o alcance da arma, e um
     número inventado barra o golpe. Melhor não dizer nada do que dizer
     "longe" sobre quem você não localizou. */
  paraCombate(nav) {
    const nada = { distancia: null, cobertura: null, penalidade: 0 };
    if (!nav) return nada;
    const cobertura = nav.cobertura ? nav.cobertura.nome : null;
    const penalidade = nav.penalidade || 0;

    /* Distância medida é uma coisa; estar no cômodo ao lado é outra, e
       confundir as duas quebra o desenho. O ambiente vizinho vale −2
       (você atravessa e golpeia no mesmo turno) — traduzi-lo para os
       100 m presumidos faria `Combate.resolver` BARRAR o soco por
       alcance, que é o contrário do que a §48.3 decidiu. Distância só
       viaja para o combate quando a cena a mediu. */
    if (nav.distanciaDeclarada && typeof nav.distancia === 'number') {
      return { distancia: nav.distancia, cobertura, penalidade };
    }
    if (nav.relacao === 'distante') {
      return { distancia: nav.distancia, cobertura, penalidade };
    }
    return { distancia: null, cobertura, penalidade };
  },

  descrever(nav) {
    if (!nav) return '';
    if (nav.bloqueado) return nav.motivo;
    const partes = [];
    if (nav.relacao === 'mesmo_local') partes.push('mesmo ambiente');
    else if (nav.relacao === 'adjacente') partes.push('ambiente ao lado');
    if (nav.distancia != null && Number.isFinite(nav.distancia)) partes.push(`${nav.distancia} m`);
    if (!nav.linhaDeTiro) partes.push('sem linha de visão');
    if (nav.cobertura) partes.push(`cobertura: ${nav.cobertura.nome}`);
    if (nav.penalidade) partes.push(`${nav.penalidade} dados`);
    return partes.join(' · ');
  }
};

Cadeia.registrarNavegador('navmesh', (entrada) => Navegacao.navegar(entrada));
Cadeia.navegadorPadrao = 'navmesh';

/* ============================================================
   VITÆ — Oblívio no dado
   (§96 — `Livros/Regras/Oblivio.pdf`)

   O projeto tinha a lista de poderes de Oblívio desde a §65, e **mais
   nada**: nenhuma das regras GERAIS da Disciplina existia. Era o
   mesmo defeito da §95 com as Perdições — texto certo, e nada
   acontecendo.

   Três coisas passaram a acontecer:

   1. **A luz.** Oblívio não funciona onde não há sombra, e paga um
      dado em cômodo moderadamente iluminado. É a regra mais própria
      da Disciplina e a que mais muda uma cena.
   2. **A Checagem de Sangue que corrói.** 1 *ou* 10 dão Mácula, e não
      só o 1 como em qualquer outra.
   3. **A porta das Cerimônias.** Cada uma exige um poder, e sem ele
      não se compra nem se realiza.

   O que este arquivo NÃO faz, como o `motor-perdicoes.js` da §95: ele
   não rola dado e não decide. Responde "pode?", "quantos dados?" e
   "quanto custa?", e quem rola continua sendo quem já rolava.
   ============================================================ */

const MotorOblivio = {

  /* ==========================================================
     A LUZ NA PARADA

     Devolve um veredito, e não um número, porque a regra tem DOIS
     resultados diferentes: um que penaliza e um que impede. Achatar os
     dois num "-99 dados" faria a interface oferecer uma rolagem que o
     livro proíbe, e o piso de 1 dado (§63, A1) ainda a deixaria rolar.
     ========================================================== */
  souOblivio(disciplina) {
    return String(disciplina || '').toLowerCase() === 'oblivio';
  },

  vereditoDaLuz(disciplina, luz) {
    if (!this.souOblivio(disciplina)) return { vale: false, impede: false, dados: 0 };
    const l = Oblivio.luzDe(luz);
    if (!l) {
      /* Desconhecido não é intenso. Mesma decisão da beleza do
         ambiente na Perdição Toreador (§95). */
      return { vale: false, impede: false, dados: 0 };
    }
    return { vale: true, impede: !!l.impede, dados: l.dados || 0,
             rotulo: l.rotulo, motivo: l.motivo || l.nota || '' };
  },

  /* O modificador para a lista de `Arbitro.piscinaFinal`. Só o caso do
     meio produz dado; o que impede não entra aqui, porque não há
     parada para modificar. */
  modificadores(_ficha, { disciplina = null, luz = null } = {}) {
    const v = this.vereditoDaLuz(disciplina, luz);
    return (v.vale && !v.impede && v.dados)
      ? [{ nome: `Oblívio sob ${v.rotulo.toLowerCase()}`, dados: v.dados, tipo: 'oblivio' }]
      : [];
  },

  /* ==========================================================
     A CHECAGEM DE SANGUE QUE CORRÓI
     ========================================================== */
  apurarChecagem(valor, { segundo = null } = {}) {
    const opcoes = Oblivio.opcoesDaChecagem(valor, segundo);
    const escolhido = opcoes[0];
    const eventos = [];
    if (escolhido.fome) {
      eventos.push({ tipo: 'perigo', texto: 'Checagem de Sangue: a Fome sobe um nível.' });
    }
    if (escolhido.macula) {
      eventos.push({ tipo: 'perigo', texto:
        `Oblívio cobra: ${escolhido.valor} na Checagem de Sangue gera Mácula, `
        + 'além da Fome (pág. 4).' });
    }
    return { opcoes, escolhido, eventos,
             podeEscolher: opcoes.length > 1,
             macula: escolhido.macula, fome: escolhido.fome };
  },

  /* ==========================================================
     AS CERIMÔNIAS
     ========================================================== */

  /* Os poderes que o personagem tem, pelo NOME — que é como o livro
     escreve o pré-requisito. `f.poderes` guarda por disciplina. */
  poderesDe(f) {
    const p = (f && f.poderes && f.poderes.oblivio) || [];
    return Array.isArray(p) ? p.map(x => String(x && x.nome || x)) : Object.keys(p);
  },

  temOPoder(f, nome) {
    const alvo = String(nome || '').toLowerCase();
    return this.poderesDe(f).some(n => String(n).toLowerCase() === alvo);
  },

  /* A PORTA. "Cada cerimônia tem como pré-requisito um poder de
     Oblívio (…) contanto que também possua o poder pré-requisito da
     Cerimônia." Vale para comprar e para realizar. */
  podeAprender(f, nomeDaCerimonia) {
    const c = Oblivio.cerimonia(nomeDaCerimonia);
    if (!c) return { pode: false, motivo: 'Esta Cerimônia não existe no Oblívio.' };

    const nivelNaFicha = (f && f.disciplinas && f.disciplinas.oblivio) || 0;
    if (nivelNaFicha < c.nivel) {
      return { pode: false, cerimonia: c, motivo:
        `Cerimônia de nível ${c.nivel} exige Oblívio ${c.nivel}; a ficha tem ${nivelNaFicha}.` };
    }
    if (!this.temOPoder(f, c.requer)) {
      return { pode: false, cerimonia: c, motivo:
        `${c.nome} exige o poder ${c.requer}, e a ficha não o tem (pág. 14).` };
    }
    return { pode: true, cerimonia: c, motivo: '' };
  },

  /* "custo em pontos de experiência igual ao nível da Cerimônia x 3" */
  custoEmXP(nomeDaCerimonia) {
    const c = Oblivio.cerimonia(nomeDaCerimonia);
    return c ? c.nivel * Oblivio.XP_POR_NIVEL : 0;
  },

  /* "Uma Cerimônia leva pelo menos o quadrado do seu valor em semanas
      para ser aprendida." */
  semanasParaAprender(nomeDaCerimonia) {
    const c = Oblivio.cerimonia(nomeDaCerimonia);
    return c ? c.nivel * c.nivel : 0;
  },

  /* O PEDIDO, no formato da §82: o Árbitro diz quais dados, a Mesa
     rola, o Árbitro apura.

     "requer uma Checagem de Sangue, cinco minutos por nível para
      lançar, e sucesso em um teste de Determinação + Oblívio
      (Dificuldade = nível da Cerimônia + 1)." */
  pedidoDaCerimonia(f, nomeDaCerimonia, { luz = null } = {}) {
    const porta = this.podeAprender(f, nomeDaCerimonia);
    if (!porta.pode) return { possivel: false, motivo: porta.motivo };

    const c = porta.cerimonia;
    const luzV = this.vereditoDaLuz('oblivio', luz);
    if (luzV.impede) return { possivel: false, motivo: luzV.motivo, cerimonia: c };

    const atr = (f.atributos && f.atributos[Oblivio.TESTE.atributo]) || 0;
    const disc = (f.disciplinas && f.disciplinas.oblivio) || 0;
    const piscina = Math.max(1, atr + disc + (luzV.dados || 0));

    return {
      possivel: true,
      cerimonia: c,
      normais: piscina,
      dificuldade: c.nivel + 1,
      rotulo: `${c.nome} — Determinação + Oblívio`,
      custaChecagemDeSangue: true,
      minutos: c.nivel * Oblivio.MINUTOS_POR_NIVEL,
      nota: `Dificuldade ${c.nivel + 1} (nível ${c.nivel} + 1), `
          + `${c.nivel * Oblivio.MINUTOS_POR_NIVEL} minutos de preparo, `
          + 'e uma Checagem de Sangue (pág. 14).'
    };
  },

  /* "o usuário só pode realizar Cerimônias benéficas EM SI MESMO" e
     "Carniçais, necromantes ou sangues-ralos que bebam de temperamentos
      vazios ganham acesso temporário a poderes de Oblívio, mas NÃO a
      Cerimônias." */
  BENEFICA_SO_EM_SI:
    'Cerimônia benéfica só vale no próprio usuário, salvo se o texto dela disser o contrário (pág. 14).',
  SEM_CERIMONIA_EMPRESTADA:
    'Quem ganhou Oblívio bebendo de temperamento vazio tem os poderes, e não as Cerimônias (pág. 14).'
};

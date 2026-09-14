/* ============================================================
   VITÆ — O que o Tipo de Predador faz no dado
   (§101 — Guia do Jogador, págs. 106–109)

   O par de `motor-perdicoes.js`: aquele responde "o que o CLÃ faz na
   parada?"; este responde "o que o TIPO DE PREDADOR faz?".

   Até aqui o Predador só existia na CRIAÇÃO — dava a especialização,
   o ponto de Disciplina, a Humanidade, as vantagens — e depois sumia.
   O Guia traz regras que valem DURANTE o jogo, e elas não tinham onde
   morar:

     · o Ladrão de Túmulos bebe de cadáver, e a tabela do Escudo não
       tem cadáver — nem deve ter, porque para os outros não é fonte;
     · o Alçapão navega o próprio labirinto somando Refúgio à parada.

   Como as Perdições, a regra mora no DADO do Predador (`alimentacao`,
   `labirinto`) e este motor só a lê. Ficha sem esse Predador recebe o
   que o básico diz: nada.

   Nasceu porque `motor-estado.js` estava a seis linhas do teto de 750
   e o cadáver não cabia lá — e não devia caber: é regra de Predador.
   ============================================================ */

const Predadores = {

  de(f) {
    return (typeof predadorDe === 'function' && f) ? predadorDe(f.predador) : null;
  },

  /* ==========================================================
     O CADÁVER  (Guia, pág. 108 — Ladrão de Túmulos)

     "Um cadáver frio pode saciar até 3 pontos de Fome, mas sofre as
      mesmas penalidades de saciedade que o sangue ensacado."

     Devolve `null` para quem não tem a regra: é o chamador que decide
     o que dizer, e o que ele diz é que a tabela do básico não tem
     cadáver.
     ========================================================== */
  ehCadaver(fonteNome) {
    return /cad[aá]ver|corpo frio|defunto/i.test(String(fonteNome || ''));
  },

  alimentarDeCadaver(f, eventos) {
    const pred = this.de(f);
    const regra = pred && pred.alimentacao;
    if (!regra || regra.fonte !== 'cadaver') return null;

    const ps = derivados(f).potencia;
    let sacia = regra.saciaAte;
    if (regra.comoSangueEnsacado) {
      if (ps >= 4) {
        eventos.push({ tipo: 'bloqueio',
          texto: `Potência de Sangue ${ps}: um cadáver sacia como sangue ensacado — nada.` });
        return { eventos, saciou: 0, ressonancia: null };
      }
      if (ps >= 2) {
        sacia = Math.floor(sacia / 2);
        eventos.push({ tipo: 'nota',
          texto: `Potência de Sangue ${ps}: um cadáver sacia como sangue ensacado — metade.` });
      }
    }
    const antes = f.fome || 0;
    f.fome = Math.max(0, antes - sacia);
    eventos.push({ tipo: 'fome',
      texto: `Cadáver frio: saciou ${sacia}. Fome ${antes} → ${f.fome}. (${pred.nome}, Guia pág. 108)` });
    return { eventos, saciou: sacia, ressonancia: null };
  },

  SEM_CADAVER:
    'Um cadáver não é fonte de sangue para você: só o Ladrão de Túmulos bebe dos mortos (Guia, pág. 108).',

  /* A PORTA DE ENTRADA da alimentação.

     `Estado.alimentar` fica PURO — só a tabela do Escudo, que é do
     básico. Este embrulho olha antes se a fonte é um cadáver e se a
     ficha tem quem saiba bebê-lo; tudo o mais desce para o Estado sem
     mudança. Quem alimenta na Mesa chama aqui; quem testa o básico
     continua chamando o Estado direto. */
  alimentar(f, fonteNome, bolsa = null) {
    if (this.ehCadaver(fonteNome)) {
      const eventos = [];
      return this.alimentarDeCadaver(f, eventos)
          || { eventos: [{ tipo: 'nota', texto: this.SEM_CADAVER }], saciou: 0, ressonancia: null };
    }
    return Estado.alimentar(f, fonteNome, bolsa);
  },

  /* ==========================================================
     O LABIRINTO  (Guia, pág. 109 — Alçapão)

     "Navegar pelo labirinto dentro de sua toca exige Raciocínio +
      Percepção (mas você pode adicionar seus pontos de Refúgio em dados
      à reserva, já que você conhece isso muito bem)."

     Devolve o modificador no formato de `Arbitro.piscinaFinal`, ou uma
     lista vazia — que é o que qualquer outro Predador recebe.
     ========================================================== */
  modificadores(f, { atributo = null, pericia = null, noProprioRefugio = false } = {}) {
    const pred = this.de(f);
    const regra = pred && pred.labirinto;
    if (!regra || !noProprioRefugio) return [];
    const [atr, per] = regra.piscina;
    if (atributo !== atr || pericia !== per) return [];
    const refugio = this._pontosDeRefugio(f);
    if (!refugio) return [];
    return [{ nome: `${pred.nome}: conhece o próprio labirinto (+Refúgio)`, dados: refugio, tipo: 'predador' }];
  },

  _pontosDeRefugio(f) {
    const v = (f && f.vantagens) || [];
    const lista = Array.isArray(v) ? v : Object.values(v);
    return lista
      .filter(x => x && /ref[uú]gio/i.test(String(x.id || x.nome || '')))
      .reduce((n, x) => n + (Number(x.pontos) || 0), 0);
  }
};

/* ============================================================
   VITÆ — A escada de decisão, como objetos
   O documento sempre descreveu uma escada de cinco degraus. O
   código tinha um if encadeado dentro de enviarTurno.

   Aqui cada degrau é uma classe com a mesma interface:
     atende(turno) -> boolean
     responder(turno) -> Promise<Resposta> | Resposta

   Acrescentar um degrau é acrescentar uma classe e uma linha na
   lista. Nada mais no projeto precisa mudar.
   ============================================================ */

class Degrau {
  constructor(numero, nome, custa) {
    this.numero = numero;
    this.nome = nome;
    this.custa = !!custa;
  }
  atende() { return false; }
  responder() { return null; }
}

class DegrauArbitro extends Degrau {
  constructor() { super(0, 'Árbitro barra a ação', false); }

  atende(t) { return t.veredito.possivel === false; }

  responder(t) {
    return { tipo: 'arbitro', veredito: t.veredito,
             registro: `Árbitro barrou: ${t.veredito.bloqueios.map(b => b.motivo).join(' ')}` };
  }
}

class DegrauCampanha extends Degrau {
  constructor(diretor) { super(1, 'Texto pronto da campanha', false); this.diretor = diretor; }

  atende(t) {
    if (!t.campanha || !t.estadoDiretor) return false;
    this.turnoDoDiretor = this.diretor.processarTurno(t.campanha, t.estadoDiretor,
      { leitura: t.leitura, veredito: t.veredito, ficha: t.ficha, texto: t.texto });
    return this.turnoDoDiretor.degrau <= 2;
  }

  responder() {
    return { tipo: 'diretor', eventos: this.turnoDoDiretor.eventos };
  }

  eventosResiduais() {
    return this.turnoDoDiretor
      ? this.turnoDoDiretor.eventos.filter(e => e.tipo !== 'pedido')
      : [];
  }
}

class DegrauRecombinacao extends Degrau {
  constructor(recombinador) { super(3, 'Recombinação', false); this.recombinador = recombinador; }

  atende(t) {
    this.saida = this.recombinador.tentar({
      ficha: t.ficha, cena: t.cena, locais: t.locais, pessoas: t.pessoas,
      fatos: t.fatos, fios: t.fios, modo: t.modo,
      leitura: t.leitura, veredito: t.veredito, usados: t.usados || []
    });
    return !!this.saida;
  }

  responder() {
    return { tipo: 'narracao', texto: this.saida.texto, degrau: 3, marcas: this.saida.marcas };
  }
}

class DegrauNarrador extends Degrau {
  constructor(narrador) { super(4, 'Narrador', true); this.narrador = narrador; }

  atende() { return true; }

  async responder(t) {
    try {
      const r = await this.narrador.responder(t.paraNarrador());
      return Object.assign({ tipo: 'resposta' }, r);
    } catch (err) {
      return { tipo: 'resposta', texto: `*O Narrador não respondeu.* \`${err.message}\``, erro: true };
    }
  }
}

class Escada {
  constructor(degraus) {
    this.degraus = degraus;
  }

  async descer(turno) {
    for (const degrau of this.degraus) {
      if (!degrau.atende(turno)) continue;
      const resposta = await degrau.responder(turno);
      return { degrau, resposta };
    }
    return null;
  }
}

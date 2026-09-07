/* ============================================================
   VITÆ — Degrau 3 da escada: recombinação
   Monta prosa a partir do que já foi escrito — a descrição do
   local, quem está presente, o que mudou — sem chamar modelo.

   É conservador de propósito: se não tiver material concreto
   suficiente, devolve null e o turno sobe para o degrau 4.
   Texto ruim de graça é pior que texto bom pago.
   ============================================================ */

const Recombinador = {
  INTENCOES_SEGURAS: ['achar_escondido', 'ocultismo', 'passar_por_humano', 'rastrear'],

  aplicavel({ modo, veredito, leitura }) {
    if (modo === 'perguntar') return false;
    if (!veredito) return false;
    if (veredito.possivel === false) return false;
    if (veredito.rotas && veredito.rotas.length) return false;

    if (modo === 'examinar') return true;

    if (!leitura || !leitura.intencao) return false;
    return veredito.possivel === true && this.INTENCOES_SEGURAS.includes(leitura.intencao);
  },

  sortear(lista, usados, chave) {
    const disponiveis = lista.filter(x => !usados.includes(`${chave}:${x}`));
    const fonte = disponiveis.length ? disponiveis : lista;
    return fonte[Math.floor(Math.random() * fonte.length)];
  },

  horasAteAmanhecer(hora) {
    const m = String(hora || '').match(/(\d{1,2})\s*h/i);
    if (!m) return null;
    const h = +m[1];
    if (h >= 18) return 6 + (24 - h);
    if (h <= 6) return 6 - h;
    return null;
  },

  compor(contexto) {
    const { ficha, cena, locais, pessoas, fatos, fios, modo, usados } = contexto;
    const local = locais.find(l => l.id === cena.local);
    const presentes = (cena.presentes || [])
      .map(id => pessoas.find(p => p.id === id)).filter(Boolean);

    const partes = [];
    const marcas = [];

    const enquadra = ENQUADRAMENTO_POR_MODO[modo] || ENQUADRAMENTO_POR_MODO.agir;
    const abertura = this.sortear(enquadra, usados, 'modo');
    if (abertura) { partes.push(abertura); marcas.push(`modo:${abertura}`); }

    if (local && local.descricao) {
      const frases = local.descricao.split(/(?<=\.)\s+/).filter(f => f.length > 25);
      if (frases.length) {
        const f = this.sortear(frases, usados, 'local');
        partes.push(f.trim());
        marcas.push(`local:${f}`);
      }
    }

    const fome = Math.min(5, ficha.fome || 0);
    const sentido = this.sortear(SENTIDOS_POR_FOME[fome], usados, 'fome');
    partes.push(sentido);
    marcas.push(`fome:${sentido}`);

    if (presentes.length) {
      const alvo = presentes[Math.floor(Math.random() * presentes.length)];
      const banco = PRESENCA_POR_RELACAO[alvo.relacao] || PRESENCA_POR_RELACAO.desconhecido;
      const modelo = this.sortear(banco, usados, 'presenca');
      partes.push(modelo.replace('{nome}', this.nomeCurto(alvo.nome)));
      marcas.push(`presenca:${modelo}`);
    }

    const horas = this.horasAteAmanhecer(cena.hora);
    if (horas !== null) {
      const pressao = PRESSAO_DO_RELOGIO.filter(p => horas <= p.antes).pop();
      if (pressao) { partes.push(pressao.texto); marcas.push(`relogio:${pressao.texto}`); }
    }

    const abertos = (fios || []).filter(f => f.estado !== 'fechado');
    if (abertos.length && Math.random() < 0.35) {
      const fio = abertos[Math.floor(Math.random() * abertos.length)];
      partes.push(`E continua sem resposta: ${String(fio.titulo).replace(/[.?!]+$/, '')}.`);
      marcas.push(`fio:${fio.id}`);
    } else {
      const fecho = this.sortear(FECHOS_INSTAVEIS, usados, 'fecho');
      partes.push(fecho);
      marcas.push(`fecho:${fecho}`);
    }

    return { partes, marcas };
  },

  nomeCurto(nome) {
    const apelido = String(nome || '').match(/["“]([^"”]+)["”]/);
    if (apelido) return apelido[1];
    return String(nome || '').split(/\s+/)[0];
  },

  tentar(contexto) {
    if (!this.aplicavel(contexto)) return null;

    const { partes, marcas } = this.compor(contexto);
    if (partes.filter(Boolean).length < 3) return null;

    const texto = partes.filter(Boolean).join(' ');
    const palavras = texto.split(/\s+/).filter(Boolean).length;
    if (palavras < 25) return null;

    return { texto, marcas, degrau: 3 };
  }
};

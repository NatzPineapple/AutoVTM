/* ============================================================
   QUEM ROLA É A MESA.  (§82)

   A regra do usuário, em uma linha:

     **o Árbitro diz QUAIS dados; a Mesa roda; o Árbitro pega o
     resultado.**

   Três passos, e cada um tem dono:

     1. `Dados.pedir(...)`   ÁRBITRO — quantos dados comuns, quantos
                             de Fome, contra que Dificuldade. Puro:
                             não sorteia nada, e dá o mesmo pedido
                             para a mesma situação, sempre.
     2. `Dados.rodar(p)`     MESA — os valores. O acaso entra AQUI, e
                             só aqui.
     3. `Dados.apurar(p, v)` ÁRBITRO — o veredito. Puro: recebe os
                             valores prontos.

   O QUE MUDOU DE VERDADE: este arquivo não tem mais `Math.random`.
   A fonte do acaso é INSTALADA de fora, pela Mesa, e sem ela
   `d10()` estoura em vez de inventar um número. Antes, o Árbitro
   era dono do sorteio — e um serviço que decide regra e sorteia
   ao mesmo tempo não é determinístico nem auditável: não dá para
   repetir uma noite, nem para o servidor conferir o que o cliente
   diz que rolou.

   Com a fonte de fora, o Árbitro passa a ser **função pura de
   (situação, valores)**, e a sessão da Mesa fica com o registro do
   que saiu — que é o que o `historico.jsonl` da §78 quer guardar.
   ============================================================ */

const Dados = {

  /* A Mesa instala isto. `carregar.mjs` instala nos testes;
     `mesa.js` instala no navegador; o MesaServer, no servidor. */
  _fonte: null,

  /** Instala a fonte e devolve a anterior, para quem precisa repor. */
  usarFonte(fn) {
    const antes = this._fonte;
    this._fonte = (typeof fn === 'function') ? fn : null;
    return antes;
  },

  temFonte() { return typeof this._fonte === 'function'; },

  /* SEM FONTE, ESTOURA. Não há valor padrão de propósito: cair num
     `Math.random` de reserva devolveria o Árbitro à condição de dono
     do acaso sem ninguém notar, que é exatamente o que a §82 desfaz. */
  d10() {
    if (!this._fonte) {
      throw new Error('Dados.d10: nenhuma fonte de acaso instalada. '
        + 'Quem rola é a Mesa — use Dados.usarFonte() antes. (§82)');
    }
    const v = this._fonte() | 0;
    if (v < 1 || v > 10) {
      throw new Error(`Dados.d10: a fonte devolveu ${v}, que não é um d10.`);
    }
    return v;
  },

  /* ----------------------------------------------------------
     PASSO 1 — O ÁRBITRO DIZ QUAIS
     Puro. É aqui que mora a regra da parada mínima, e é este
     objeto que viaja até a Mesa quando os dois são processos.
     ---------------------------------------------------------- */
  pedir({ piscina, fome = 0, dificuldade = 0, rotulo = '' }) {
    const total = Math.max(1, piscina | 0);
    const nFome = Math.max(0, Math.min(fome | 0, total));
    return {
      normais: total - nFome, fome: nFome,
      dificuldade: dificuldade | 0, rotulo,
      /* `piscina` viaja junto porque o veredito a mostra ao jogador,
         e o passo 3 não deve ter de recalcular o que o passo 1 já
         decidiu — recalcular é onde as duas metades divergem. */
      piscina: total
    };
  },

  /* ----------------------------------------------------------
     PASSO 2 — A MESA RODA
     O único consumo de acaso de uma rolagem, no projeto inteiro.
     ---------------------------------------------------------- */
  rodar(pedido) {
    return {
      normais:   Array.from({ length: pedido.normais }, () => this.d10()),
      dadosFome: Array.from({ length: pedido.fome },    () => this.d10())
    };
  },

  /* ----------------------------------------------------------
     PASSO 3 — O ÁRBITRO PEGA O RESULTADO
     Puro. Aceita valores vindos de qualquer lugar — inclusive de
     outro processo, que é o caso quando a Mesa é o Módulo 3.
     ---------------------------------------------------------- */
  apurar(pedido, valores) {
    return this._apurar({
      normais: valores.normais || [], dadosFome: valores.dadosFome || [],
      dificuldade: pedido.dificuldade, piscina: pedido.piscina,
      fome: pedido.fome, rotulo: pedido.rotulo
    });
  },

  /* Ler reserva de dados é leitura de ficha, e desde a §47 mora na área
     Ficha (`piscinaDaFicha`). Isto aqui é a porta de entrada de sempre,
     para não mexer nos chamadores — o Árbitro rola, a Ficha lê. */
  piscinaDe(ficha, atributoId, periciaId, opcoes) {
    return piscinaDaFicha(ficha, atributoId, periciaId, opcoes);
  },

  /* A PARADA MÍNIMA É 1.  (§63, item A1)

     O livro diz duas vezes: "Nenhuma parada de dados pode ser inferior a 1,
     portanto uma rolagem de uma parada vazia ainda é feita com um dado"
     (básico, pág. 119), e "Penalidades jamais podem diminuir uma parada para
     menos de um dado" (pág. 120).

     Rolar zero dado devolvia zero sucesso sempre — o oposto do que o V5 quer.
     Onde o livro dá ao desesperado um dado, com chance real de sucesso E de
     falha bestial, o app dizia que não dava. */
  /* Os três passos em sequência, para quem não precisa separá-los —
     e é a maioria: o combate, o frenesi e o Remorso resolvem tudo
     dentro de um turno só. A separação importa quando a Mesa e o
     Árbitro são processos diferentes, e aí quem chama usa
     `pedir` → `rodar` → `apurar` à mão. */
  rolar(opcoes) {
    const pedido = this.pedir(opcoes);
    return this.apurar(pedido, this.rodar(pedido));
  },

  /* ----------------------------------------------------------
     O RETESTE ACEITA QUALQUER DADO COMUM.  (§63, item A2)

     O livro não restringe o reteste às falhas. Ele diz o contrário,
     e nomeia o caso:

       "o jogador pode (e deve) optar por rerrolar, gastando, para
        isso, Força de Vontade, seja para SE LIVRAR DE 0s COMUNS e
        assim NEUTRALIZAR UM CRÍTICO BESTIAL, ou para transformar
        uma rolagem fracassada em um sucesso"   (básico, pág. 205)

     E o exemplo da pág. 206 mostra Mario rerrolando um 10 junto com
     duas falhas, de uma vez.

     O que havia aqui filtrava por `< 6` em DOIS lugares: na sugestão
     (o que é certo, e continua) e no próprio reteste (o que travava).
     Pior: `podeRetestar` devolvia false quando não havia falha — logo
     a rolagem que MAIS precisa do reteste, o crítico bestial sem
     falhas, era a única que não podia ser retestada.

     Dados de Fome continuam fora, e essa trava é do livro (pág. 206):
     `r.normais` é o único vetor que este código toca.
     ---------------------------------------------------------- */

  /* A sugestão da interface. Falhas primeiro, da pior para a melhor —
     é o caso comum. Mas num crítico bestial não há o que ganhar
     rerrolando falha: o que se quer é quebrar o par de 10 que fez o
     crítico, e para isso o alvo é o 10 COMUM. */
  dadosRetestaveis(r) {
    const porValor = (a, b) => a.v - b.v;
    const comIndice = r.normais.map((v, i) => ({ i, v }));

    /* `tipo: 'perigo'` é o Crítico Bestial — o id interno guarda o nome
       antigo ("Sucesso em Perigo"), que a §58 aposentou na prosa. */
    if (r.tipo === 'perigo') {
      const dezes = comIndice.filter(x => x.v === 10);
      if (dezes.length) return dezes.slice(0, 3).map(x => x.i);
    }
    return comIndice.filter(x => x.v < 6).sort(porValor).slice(0, 3).map(x => x.i);
  },

  /* Pode retestar se ainda não retestou e há dado comum na mesa.
     Não depende de haver falha: ver o comentário acima. */
  podeRetestar(r) {
    return !r.retestado && r.normais.length > 0;
  },

  retestarVontade(r, indices) {
    /* Sem escolha explícita, cai na sugestão. Com escolha, o único
       filtro é existir: o jogador manda no próprio ponto de Vontade. */
    const validos = (indices && indices.length ? indices : this.dadosRetestaveis(r))
      .filter(i => Number.isInteger(i) && i >= 0 && i < r.normais.length);
    const alvo = [...new Set(validos)].slice(0, 3);
    const normais = r.normais.slice();
    alvo.forEach(i => { normais[i] = this.d10(); });
    const novo = this._apurar({
      normais, dadosFome: r.dadosFome.slice(),
      dificuldade: r.dificuldade, piscina: r.piscina, fome: r.fome, rotulo: r.rotulo
    });
    novo.retestado = true;
    novo.indicesRetestados = alvo;
    return novo;
  },

  _apurar({ normais, dadosFome, dificuldade, piscina, fome, rotulo }) {
    const todos = normais.concat(dadosFome);
    const dezes = todos.filter(v => v === 10).length;
    const dezesFome = dadosFome.filter(v => v === 10).length;
    const unsFome = dadosFome.filter(v => v === 1).length;
    const pares = Math.floor(dezes / 2);
    const basicos = todos.filter(v => v >= 6).length;
    const sucessos = basicos + pares * 2;
    const critico = pares >= 1;
    const passou = dificuldade > 0 ? sucessos >= dificuldade : sucessos > 0;

    let tipo;
    if (passou && critico && dezesFome > 0) tipo = 'perigo';
    else if (passou && critico)             tipo = 'critico';
    else if (passou)                        tipo = 'sucesso';
    else if (unsFome > 0)                   tipo = 'bestial';
    else if (sucessos === 0)                tipo = 'total';
    else                                    tipo = 'falha';

    return {
      rotulo, piscina, fome, dificuldade,
      normais, dadosFome,
      sucessos, basicos, pares, dezes, dezesFome, unsFome,
      critico, passou, tipo,
      margem: dificuldade > 0 ? sucessos - dificuldade : sucessos,
      retestado: false, indicesRetestados: []
    };
  },

  provocacao() {
    const v = this.d10();
    return { valor: v, subiuFome: v <= 5 };
  },

  ROTULOS: {
    perigo:  { nome: 'Sucesso em Perigo',
               nota: 'Você conseguiu — e a Besta cobrou o preço em público.' },
    critico: { nome: 'Sucesso Crítico',
               nota: 'Muito além do necessário.' },
    sucesso: { nome: 'Sucesso', nota: '' },
    falha:   { nome: 'Falha', nota: 'Não foi o bastante.' },
    total:   { nome: 'Falha Total',
               nota: 'Nenhum sucesso. Pior do que não ter tentado.' },
    bestial: { nome: 'Falha Bestial',
               nota: 'A Fome respondeu por você. A consequência é grave.' }
  },

  descrever(r) {
    const t = this.ROTULOS[r.tipo];
    const alvo = r.dificuldade > 0 ? ` contra dificuldade ${r.dificuldade}` : '';
    return `${t.nome} — ${r.sucessos} sucesso${r.sucessos === 1 ? '' : 's'}${alvo}.`;
  }
};

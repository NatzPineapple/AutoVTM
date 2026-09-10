/* ============================================================
   VITÆ — Oblívio: as regras da Disciplina e as Cerimônias
   (§96 — lido em `Livros/Regras/Oblivio.pdf`)

   Oblívio **não está no manual básico**. Pela tabela de autoridade do
   topo de `docs/regras.md`, quem manda na matéria dele é o
   `Oblivio.pdf` — tradução profissional —, e é dele que sai tudo aqui.

   `Sombras-na-Torre.pdf` traz o mesmo texto e é **conteúdo de
   comunidade**, tradução livre declarada pelo próprio autor. Onde os
   dois dizem a mesma coisa, a citação é do profissional; onde
   divergem no NOME, vale o do básico e, na falta dele, o do
   profissional. É por isso que aqui se lê *Gravidade da Perdição* e
   não *Severidade da Perdição*, que é como a comunidade traduziu.

   A LISTA DE PODERES NÃO MORA AQUI. Ela está em `data-disciplinas.js`
   desde sempre, e duplicá-la seria repetir o defeito da §64 — duas
   listas para o mesmo fato divergem, e divergem em silêncio. O que
   mora aqui é o que não existia em lugar nenhum: as regras gerais da
   Disciplina e as Cerimônias.
   ============================================================ */

const Oblivio = {

  /* ==========================================================
     A LUZ  (Oblivio.pdf, pág. 4)

     "Os poderes de Oblívio são ineficazes em áreas com iluminação
      intensa. A luz do dia e cômodos sem sombras são proibitivos,
      impedindo o funcionamento da Disciplina, embora luz ultravioleta
      e infravermelha não imponham nenhuma restrição ao seu uso.
      Cômodos moderadamente iluminados aplicam uma penalidade de um
      dado à rolagem da Disciplina."

     Três estados, e o do meio é o único que vira dado. O primeiro
     IMPEDE — e impedir não é penalizar: não há parada a montar.
     ========================================================== */
  LUZ: {
    escuro:    { rotulo: 'Escuro ou com sombras', dados: 0, impede: false },
    moderada:  { rotulo: 'Moderadamente iluminado', dados: -1, impede: false },
    intensa:   { rotulo: 'Iluminação intensa, luz do dia ou sem sombras',
                 dados: 0, impede: true,
                 motivo: 'Não há sombra de onde chamar: a Disciplina não funciona (pág. 4).' },
    /* Declarada de propósito, e não esquecida: o livro nomeia as duas
       e diz que NÃO restringem. Sem esta linha, alguém leria "luz é
       luz" e a penalidade cairia onde o livro isenta. */
    invisivel: { rotulo: 'Ultravioleta ou infravermelha', dados: 0, impede: false,
                 nota: 'UV e infravermelho não impõem restrição nenhuma (pág. 4).' }
  },

  /* O padrão é `null` — DESCONHECIDO, e não escuro nem claro. É a
     mesma decisão da beleza do ambiente na Perdição Toreador (§95):
     quem não disse como é o lugar não disse que ele é claro, e punir
     por informação ausente é inventar regra. */
  luzDe(estado) {
    return this.LUZ[estado] || null;
  },

  /* ==========================================================
     A CHECAGEM DE SANGUE  (Oblivio.pdf, pág. 4)

     "Ao realizar uma Checagem de Sangue para um poder ou Cerimônia de
      Oblívio, um resultado '1' ou '10' gera Mácula, além do nível de
      Fome ganho. Se a Potência de Sangue do usuário permitir uma
      rerrolagem de uma Checagem de Sangue, o usuário pode escolher
      qualquer um dos dois resultados."

     O 1 e o 10 juntos são o detalhe que se perde numa leitura rápida:
     a Checagem de Sangue comum só se importa com o 1. Aqui as duas
     pontas do dado cobram, e é isso que faz Oblívio corroer quem usa.
     ========================================================== */
  MACULA_EM: [1, 10],

  macula(valorDoDado) {
    return this.MACULA_EM.includes(Number(valorDoDado));
  },

  /* Com rerrolagem, o usuário ESCOLHE — e escolher inclui escolher o
     resultado que dá Mácula, que às vezes é o que se quer (a Fome
     também está em jogo). Por isso a função devolve as duas opções em
     vez de decidir sozinha. */
  opcoesDaChecagem(primeiro, segundo) {
    const opcao = (v) => ({ valor: v, macula: this.macula(v), fome: Number(v) === 1 });
    return (segundo == null) ? [opcao(primeiro)] : [opcao(primeiro), opcao(segundo)];
  },

  /* ==========================================================
     AS CERIMÔNIAS  (Oblivio.pdf, pág. 14)

     "A menos que dito o contrário, realizar uma Cerimônia requer uma
      Checagem de Sangue, cinco minutos por nível para lançar, e
      sucesso em um teste de Determinação + Oblívio (Dificuldade =
      nível da Cerimônia + 1)."

     E a porta que separa necromante de feiticeiro de sangue:

     "Cada cerimônia tem como pré-requisito um poder de Oblívio. Esse
      requisito serve como uma porta de entrada para necromantes pela
      qual feiticeiros de sangue não precisam passar."
     ========================================================== */
  MINUTOS_POR_NIVEL: 5,
  XP_POR_NIVEL: 3,
  TESTE: { atributo: 'determinacao', disciplina: 'oblivio' },

  /* AS DEZ, com o poder que cada uma exige.

     `regras.md` §14.7 listava TREZE, e três delas — Cadáver
     Irracional, Servo Homuncular e Cadáver Violento — não são
     Cerimônias: são os BLOCOS DE ESTATÍSTICA das criaturas que as
     Cerimônias criam ("Parada de Dados Padrão: Físico 2, Social 0,
     Mental 0"). O mesmo tipo de engano da §65, do outro lado: lá o
     dado tinha dois poderes que não existem, aqui o documento tinha
     três Cerimônias que são criaturas.

     O nível do pré-requisito é SEMPRE o nível da Cerimônia, e há
     teste afirmando isso — é a regra escrita virando invariante. */
  CERIMONIAS: [
    { nivel: 1, nome: 'Invocar o Espírito',           requer: 'Grilhões que Vinculam' },
    { nivel: 1, nome: 'A Dádiva da Vida Falsa',       requer: 'Do Pó ao Pó' },
    { nivel: 2, nome: 'Despertar do Servo Homuncular', requer: 'Onde a Mortalha Afina' },
    { nivel: 2, nome: 'Obrigar Espíritos',            requer: 'Onde a Mortalha Afina' },
    { nivel: 3, nome: 'Espírito Anfitrião',           requer: 'Aura de Decadência' },
    { nivel: 3, nome: 'Hordas Trôpegas',              requer: 'Aura de Decadência' },
    { nivel: 4, nome: 'Vincular o Espírito',          requer: 'Praga Necrótica' },
    { nivel: 4, nome: 'Rasgar a Mortalha',            requer: 'Praga Necrótica' },
    { nivel: 5, nome: 'Ex Nihilo',                    requer: 'Espírito em Declínio' },
    { nivel: 5, nome: 'Benção Lazarena',              requer: 'Skulds Realizada' }
  ],

  cerimonia(nome) {
    const alvo = String(nome || '').trim().toLowerCase();
    return this.CERIMONIAS.find(c => c.nome.toLowerCase() === alvo) || null;
  },

  de(nivel) {
    return this.CERIMONIAS.filter(c => c.nivel === Number(nivel));
  },

  /* O que a criação permite: UMA Cerimônia de Nível 1, e só se o
     personagem tiver o poder que ela exige. */
  NA_CRIACAO: 1
};

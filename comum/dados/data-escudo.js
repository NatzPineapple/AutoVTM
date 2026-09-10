const Escudo = {

  DIFICULDADE_ACAO: [
    { nivel: 1, nome: 'Rotineiro',       exemplos: ['atirar em um alvo parado', 'convencer um amigo a te ajudar'] },
    { nivel: 2, nome: 'Direto',          exemplos: ['seduzir alguém que já está a fim', 'intimidar um fraco'] },
    { nivel: 3, nome: 'Moderado',        exemplos: ['instalar um sistema de som no carro', 'andar em corda bamba'] },
    { nivel: 4, nome: 'Desafiador',      exemplos: ['localizar a fonte de um sussurro', 'criar uma arte memorável'] },
    { nivel: 5, nome: 'Difícil',         exemplos: ['convencer um policial de que a droga não é sua', 'reconstruir um bloco de motor'] },
    { nivel: 6, nome: 'Muito difícil',   exemplos: ['correr em corda bamba sobre o fogo', 'acalmar um inimigo violento e com raiva'] },
    { nivel: 7, nome: 'Quase impossível',exemplos: ['encontrar um morador de rua específico numa metrópole em uma noite', 'recitar um longo texto numa língua que você não conhece'] }
  ],

  ANTAGONISTAS: [
    { dificuldade: 1, ate: 1,    nome: 'Insignificante', exemplos: 'inexperiente ou doente' },
    { dificuldade: 2, ate: 2,    nome: 'Fraco',          exemplos: 'humano normal, bandido ou policial de rua' },
    { dificuldade: 3, ate: 3,    nome: 'Normal',         exemplos: 'humano talentoso ou carniçal, assassino ou policial treinado, Sangue Fraco recém-Abraçado' },
    { dificuldade: 4, ate: 4,    nome: 'Desafiador',     exemplos: 'neonato, Sangue Fraco motivado, carniçal antigo, operador da Segunda Inquisição' },
    { dificuldade: 5, ate: 6,    nome: 'Forte',          exemplos: 'ancilla, comandante da Segunda Inquisição, lobisomem novo' },
    { dificuldade: 7, ate: null, nome: 'Muito forte',    exemplos: 'ancião, lobisomem adulto' }
  ],

  CAMPO_DE_CACA: [
    { dificuldade: 2, lugares: 'Favela, cortiço, conjunto habitacional, periferia' },
    { dificuldade: 3, lugares: 'Bairro boêmio ou moderno, bairro velho, bairro de trabalhadores' },
    { dificuldade: 4, lugares: 'Bairro de trabalhadores saudáveis, área de negócios ou de turistas, centro da cidade, aeroportos, cassino' },
    { dificuldade: 5, lugares: 'Fábricas, portos, parques, bairro de classe média' },
    { dificuldade: 6, lugares: 'Bairro rico' }
  ],

  COBERTURA: [
    { modificador: -2, nome: 'Sem cobertura' },
    { modificador: -1, nome: 'Apenas encoberto', nota: 'arbusto, árvore pequena contra rifle de calibre' },
    { modificador:  0, nome: 'Cobertura forte', nota: 'carro, parede de concreto' },
    { modificador: +1, nome: 'Trincheira', nota: 'saco de areia, bunker militar' },
    { modificador: +2, nome: 'Seteira', nota: 'tanque de guerra' }
  ],

  /* AUDIÊNCIA NO COMBATE SOCIAL — básico, pág. 305  (§90)

     "O dano à Força de Vontade dói mais quando há terceiros assistindo
      à sua queda. Adicione um modificador de dano dependendo da
      audiência (APENAS ESTAR PRESENTE NÃO CONTA; a audiência precisa
      estar INTERESSADA no resultado da disputa.)"

     Terceira tabela desta leitura em que o texto do Escudo não casava
     com o nome do livro: a linha de +2 dizia "Vampiros importantes para
     você", e o livro diz "Membros cujas opiniões você valoriza em si
     mesmas". Como o casador comparava a frase inteira, escrever o nome
     do livro devolvia +0 — o valor mais seguro, e o mais errado.

     Daí `nomes`, como na armadura e nas armas: `testemunhas` é o texto
     do livro, para a tela e para a anti-deriva; `nomes` é o que o
     jogador pode ter escrito. */
  DANO_SOCIAL: [
    { extra: 0, pagina: 305, testemunhas: 'Apenas os oponentes',
      nomes: ['apenas os oponentes', 'ninguém', 'só nós dois', 'a sós'] },
    { extra: 1, pagina: 305, testemunhas: 'Sua coterie',
      nomes: ['sua coterie', 'coterie', 'a coterie', 'seu bando', 'sua matilha'] },
    { extra: 2, pagina: 305, testemunhas: 'Membros cujas opiniões você valoriza em si mesmas: seu mentor, amante',
      nomes: ['membros cujas opiniões você valoriza', 'mentor', 'amante', 'seu mentor',
              'vampiros importantes para você'] },
    { extra: 3, pagina: 305, testemunhas: 'Primogênito, Harpia ou outras figuras socialmente importantes; outro rival verdadeiro além do seu oponente atual',
      nomes: ['primogênito', 'primogenito', 'harpia', 'harpias', 'figuras socialmente importantes',
              'rival verdadeiro', 'outro rival'] },
    { extra: 4, pagina: 305, testemunhas: 'O Príncipe, Barão ou outra figura poderosa',
      nomes: ['o príncipe', 'príncipe', 'principe', 'barão', 'barao', 'figura poderosa',
              'justicar', 'arconte'] }
  ],

  CRITICO_BAGUNCADO: [
    'Ganha uma ou mais Máculas',
    'Quebra da Máscara',
    'Perde um ponto de Vantagem',
    'Falha no teste, apesar dos sucessos'
  ],

  FALHA_BESTIAL: [
    'Compulsão',
    'Perde um ponto de Vantagem',
    'Recebe um ou mais dano Agravado',
    'Aumenta a Fome em um'
  ],

  COMPULSOES_ALEATORIAS: [
    { faixa: [1, 3],  nome: 'Fome' },
    { faixa: [4, 5],  nome: 'Dominação' },
    { faixa: [6, 7],  nome: 'Destruir' },
    { faixa: [8, 9],  nome: 'Paranoia' },
    { faixa: [10, 10], nome: 'Compulsão do Clã', nota: 'Caitiff e Sangue Fraco rolam de novo' }
  ],

  GATILHOS_FRENESI: {
    furia: [
      { dificuldade: 2, gatilho: 'Amigo assassinado' },
      { dificuldade: 3, gatilho: 'Um amor ou Pilar ferido' },
      { dificuldade: 4, gatilho: 'Um amor ou Pilar assassinado' },
      { dificuldade: 2, gatilho: 'Provocação física ou dano' },
      { dificuldade: 2, gatilho: 'Insultado por um inferior' },
      { dificuldade: 2, gatilho: 'Humilhação pública' }
    ],
    fome: [
      { dificuldade: 2, gatilho: 'Ver um ferimento aberto ou sentir cheiro forte de sangue, com Fome 4 ou mais' },
      { dificuldade: 3, gatilho: 'Provar sangue com Fome 4 ou mais' },
      { dificuldade: 4, gatilho: 'Falhar numa Provocação com Fome 5' }
    ],
    terror: [
      { dificuldade: 2, gatilho: 'Fogueira' },
      { dificuldade: 3, gatilho: 'Dentro de uma construção em chamas' },
      { dificuldade: 2, gatilho: 'Pegando fogo' },
      { dificuldade: 3, gatilho: 'Luz solar indireta, pela janela' },
      { dificuldade: 4, gatilho: 'Exposto à luz solar' }
    ]
  },

  HUMANIDADE: {
    9: { modFrenesi: 3, torpor: 'três dias' },
    8: { modFrenesi: 2, torpor: 'uma semana' },
    7: { modFrenesi: 2, torpor: 'duas semanas' },
    6: { modFrenesi: 2, torpor: 'um mês' },
    5: { modFrenesi: 1, torpor: 'um ano' },
    4: { modFrenesi: 1, torpor: 'uma década' },
    3: { modFrenesi: 1, torpor: 'cinco décadas' },
    2: { modFrenesi: 0, torpor: 'um século' },
    1: { modFrenesi: 0, torpor: 'cinco séculos' }
  },

  MACULAS_POR_ATO: [
    { maculas: 1, ato: 'Tornar um humano em carniçal' },
    { maculas: 2, ato: 'Abraçar um mortal' },
    { maculas: 1, ato: 'Dano em um Pilar' },
    { maculas: 2, ato: 'Dano em um Pilar por ações suas' },
    { maculas: 2, ato: 'Pilar destruído' },
    { maculas: 3, ato: 'Pilar destruído por suas ações' }
  ],

  ALIMENTACAO: [
    { fonte: 'Vários animais pequenos (3 ou 4 gatos, 12 ou mais ratos)', sacia: 1, tempo: 'Uma cena',
      obs: 'Sacia metade em Potência de Sangue 2, e nada acima disso. Ressonância Animal, sem Discrasia.' },
    { fonte: 'Animal médio (guaxinim, cachorro, coiote)', sacia: 1, tempo: 'Um turno',
      obs: 'Sacia metade em Potência de Sangue 2, e nada acima disso. Ressonância Animal, sem Discrasia.' },
    { fonte: 'Animal grande (cavalo)', sacia: 2, tempo: 'Uma cena',
      obs: 'Sacia metade em Potência de Sangue 2, e nada acima disso. Ressonância Animal, sem Discrasia.' },
    { fonte: 'Bolsa de sangue', sacia: 1, tempo: 'Um turno',
      obs: 'Sacia metade em Potência de Sangue 2, e nada acima disso. Sem Dissonância nem Discrasia.' },
    { fonte: 'Pequeno gole de humano', sacia: 1, tempo: 'Três turnos',
      obs: 'Inclui lamber a ferida após a mordida.' },
    { fonte: 'Máximo de um humano sem causar dano', sacia: 2, tempo: 'Uma cena', obs: '' },
    { fonte: 'Beber até deixar o humano em risco de vida', sacia: '1 a 4', tempo: '1 turno por Fome saciada',
      obs: 'Dano Agravado igual à Fome saciada. O humano testa Força + Vigor contra a Fome saciada para sobreviver.' },
    { fonte: 'Drenar e matar um humano', sacia: 5, tempo: '5 turnos',
      obs: 'Única forma de chegar a Fome 0.' }
  ],

  POTENCIA_SANGUE: {
    0 : { surto: '+1 dado', recuperada: '1 superficial', bonusDisciplina: 'Nenhum',
         rerrolagem: 'Nenhuma', perdicao: 0,
         penalidade: 'Nenhuma' },
    1 : { surto: '+2 dados', recuperada: '1 superficial', bonusDisciplina: 'Nenhum',
         rerrolagem: 'Nível 1', perdicao: 2,
         penalidade: 'Nenhuma' },
    2 : { surto: '+2 dados', recuperada: '2 superficiais', bonusDisciplina: '+1 dado',
         rerrolagem: 'Nível 1', perdicao: 2,
         penalidade: 'Sangue animal e ensacado saciam meia Fome' },
    3 : { surto: '+3 dados', recuperada: '2 superficiais', bonusDisciplina: '+1 dado',
         rerrolagem: 'Até Nível 2', perdicao: 3,
         penalidade: 'Sangue animal e ensacado não saciam nada' },
    4 : { surto: '+3 dados', recuperada: '3 superficiais', bonusDisciplina: '+2 dados',
         rerrolagem: 'Até Nível 2', perdicao: 3,
         penalidade: 'Animal e ensacado não saciam; sacia 1 a menos por humano' },
    5 : { surto: '+4 dados', recuperada: '3 superficiais', bonusDisciplina: '+2 dados',
         rerrolagem: 'Até Nível 3', perdicao: 4,
         penalidade: 'Animal e ensacado não saciam; sacia 1 a menos por humano; precisa drenar e matar para descer abaixo de 2' },
    /* PS 6 e 7 dividem a MESMA célula no livro (básico, pág. 216), e ela diz
       'sacia 2 a menos'. Estava 1 aqui: a célula é mesclada entre duas linhas,
       e foi lida na altura da linha de baixo. Corrigido na §59. */
    6 : { surto: '+4 dados', recuperada: '3 superficiais', bonusDisciplina: '+3 dados',
         rerrolagem: 'Até Nível 3', perdicao: 4,
         penalidade: 'Animal e ensacado não saciam; sacia 2 a menos por humano; precisa drenar e matar para descer abaixo de 2' },
    7 : { surto: '+5 dados', recuperada: '3 superficiais', bonusDisciplina: '+3 dados',
         rerrolagem: 'Até Nível 4', perdicao: 5,
         penalidade: 'Animal e ensacado não saciam; sacia 2 a menos por humano; precisa drenar e matar para descer abaixo de 2' },
    /* Mesmo caso: PS 8 e 9 dividem a célula, e ela diz 'abaixo de 3'. §59. */
    8 : { surto: '+5 dados', recuperada: '4 superficiais', bonusDisciplina: '+4 dados',
         rerrolagem: 'Até Nível 4', perdicao: 5,
         penalidade: 'Animal e ensacado não saciam; sacia 2 a menos por humano; precisa drenar e matar para descer abaixo de 3' },
    9 : { surto: '+6 dados', recuperada: '4 superficiais', bonusDisciplina: '+4 dados',
         rerrolagem: 'Até Nível 5', perdicao: 6,
         penalidade: 'Animal e ensacado não saciam; sacia 2 a menos por humano; precisa drenar e matar para descer abaixo de 3' },
    10: { surto: '+6 dados', recuperada: '5 superficiais', bonusDisciplina: '+5 dados',
         rerrolagem: 'Até Nível 5', perdicao: 6,
         penalidade: 'Animal e ensacado não saciam; sacia 3 a menos por humano; precisa drenar e matar para descer abaixo de 3' }
  },

  GERACAO_POTENCIA: [
    { geracoes: [4, 4],   min: 5, max: 10 },
    { geracoes: [5, 5],   min: 4, max: 9 },
    { geracoes: [6, 6],   min: 3, max: 8 },
    { geracoes: [7, 7],   min: 3, max: 7 },
    { geracoes: [8, 8],   min: 2, max: 6 },
    { geracoes: [9, 9],   min: 2, max: 5 },
    { geracoes: [10, 11], min: 1, max: 4 },
    { geracoes: [12, 13], min: 1, max: 3 },
    { geracoes: [14, 16], min: 0, max: 0 }
  ],

  FERIMENTOS: [
    { faixa: [1, 6],  nome: 'Atordoado', efeito: 'Gaste 1 ponto de Força de Vontade ou perca um turno.' },
    { faixa: [7, 8],  nome: 'Traumatismo craniano', efeito: 'Rolagens Físicas −1; Mentais −2.' },
    { faixa: [9, 10], nome: 'Membro quebrado ou cegueira', efeito: '−3 nos testes que usem o membro, ou −3 nos testes que envolvam visão, inclusive combate. O Narrador decide qual faz mais sentido.' },
    { faixa: [11, 11], nome: 'Ferimento grave', efeito: '−2 em todos os testes, +1 a cada dano adicional sofrido.' },
    { faixa: [12, 12], nome: 'Aleijado', efeito: 'Mesmo efeito do membro quebrado, mas o membro perdido não volta a funcionar.' },
    { faixa: [13, 99], nome: 'Fim', efeito: 'Morte para humanos, torpor para vampiros.' }
  ],

  /* ARMADURA — básico, pág. 304  (§90)

     As duas linhas do meio estavam TROCADAS. O projeto tinha copiado
     o Escudo do Mestre e chamava de "Colete balístico" a linha de 2 e
     de "Jaqueta de Kevlar" a de 4; o livro chama a de 2 de **tecido
     balístico** e a de 4 de **colete Kevlar / jaqueta flak**. Não é
     briga de tradução: quem escrevesse "colete Kevlar" — o nome do
     livro — não casava com linha nenhuma e ficava com armadura ZERO,
     porque `armaduraPor` comparava a frase inteira.

     Daí o campo `nomes`: a lista do que o jogador pode escrever. O
     `tipo` é o texto do livro, para a tela e para a anti-deriva.

     `contraBalas` é a nota da primeira linha virada regra: couro é
     2 contra lâmina e **0 contra bala**. */
  ARMADURA: [
    { valor: 2, tipo: 'Roupa reforçada, couro pesado', pagina: 304, contraBalas: 0,
      nomes: ['roupa reforçada', 'couro pesado', 'couro', 'jaqueta de couro'] },
    { valor: 2, tipo: 'Tecido balístico', pagina: 304,
      nomes: ['tecido balístico', 'colete balístico', 'balístico'] },
    { valor: 4, tipo: 'Colete Kevlar, jaqueta flak', pagina: 304,
      nomes: ['colete kevlar', 'jaqueta flak', 'kevlar', 'flak', 'jaqueta de kevlar'] },
    { valor: 6, tipo: 'Armadura tática da SWAT, armadura militar', pagina: 304,
      penalidadeDestreza: -1,
      nomes: ['armadura tática', 'swat', 'armadura militar', 'tática'] }
  ],

  /* DANO DE ARMA — básico, pág. 304  (§90)

     Mesmo defeito, do outro lado: a linha de +2 é "Impacto **Pesado**
     (cassetete, taco, chave de roda, bastão de baseball)", e o projeto
     tinha "Impacto médio (bastão, barra de ferro)". Quem escrevia
     "cassetete" ou "taco de baseball" — as palavras do livro — caía no
     caso final e levava dano ZERO com uma arma de +2.

     `armas` é o texto do livro. `nomes` é o que o casador usa, e ele
     inclui os exemplos do livro MAIS os sinônimos que já casavam antes,
     porque exemplo de livro é exemplo, não lista fechada.

     A escopeta aparece duas vezes de propósito, e é do livro: +3
     "dentro do alcance efetivo" e +4 "só à curta distância". O casador
     não sabe a distância, então "escopeta" cai em +3 e "espingarda 12"
     em +4 — o que o livro escreveu em cada linha. */
  DANO_ARMA: [
    { dano: 0, pagina: 304, armas: 'Arma improvisada, estaca',
      nomes: ['arma improvisada', 'estaca', 'improvisada'] },
    { dano: 1, pagina: 304, armas: 'Impacto leve (soco inglês)',
      nomes: ['impacto leve', 'soco inglês', 'soqueira'] },
    { dano: 2, pagina: 304,
      armas: 'Impacto pesado (cassetete, taco, chave de roda, bastão de baseball); '
           + 'perfuração leve (virote de besta, canivete); disparo leve (pistola .22)',
      nomes: ['impacto pesado', 'cassetete', 'taco', 'chave de roda', 'bastão de baseball',
              'bastão', 'barra de ferro', 'cacetete', 'perfuração leve', 'virote de besta',
              'virote', 'canivete', 'ponta de besta', 'disparo leve', 'pistola .22', '.22'] },
    { dano: 3, pagina: 304,
      armas: 'Arma branca pesada (espada de lâmina larga, machado de bombeiro); '
           + 'disparo médio (rifle .308, pistola 9 mm, escopeta dentro do alcance efetivo)',
      nomes: ['arma branca pesada', 'espada de lâmina larga', 'machado de bombeiro',
              'espada', 'machado', 'facão', 'disparo médio', 'rifle .308', '.308',
              'pistola 9 mm', '9 mm', '9mm', 'escopeta'] },
    { dano: 4, pagina: 304,
      armas: 'Disparo pesado (espingarda 12 à curta distância, Magnum .357); '
           + 'arma branca enorme (claymore, viga de aço)',
      nomes: ['disparo pesado', 'espingarda 12', 'espingarda', 'calibre 12', '.12',
              'magnum .357', '.357', 'magnum', 'arma branca enorme', 'claymore', 'viga de aço'] }
  ],

  /* A NOTA DA ESTACA É UM RODAPÉ DA TABELA, E ELE TEM DUAS CONDIÇÕES.

     "Se um atacante com uma estaca de madeira obtiver sucesso em um
      ATAQUE LOCALIZADO NO CORAÇÃO de um vampiro e infligir 5+ pontos
      de dano, a estaca perfura o coração e paralisa o vampiro."
                                                     (básico, pág. 304)

     O projeto lia só a segunda metade. Ver §90 e `motor-combate.js`. */
  NOTA_ESTACA: 'Ataque localizado no coração com estaca de madeira que cause 5 ou mais '
             + 'de dano paralisa o vampiro (pág. 304).',

  MODELOS_MORTAIS: {
    fraco:    { nome: 'Mortal fraco',    atributos: '2 em 2, o resto em 1',
                habilidades: '3 em 2, 5 em 1', vantagens: 'nenhuma' },
    comum:    { nome: 'Mortal comum',    atributos: '2 em 3, 3 em 2, o resto em 1',
                habilidades: '3 em 3, 4 em 2, 5 em 1', vantagens: 'até 3 pontos, até 2 em defeitos' },
    talentoso:{ nome: 'Mortal talentoso',atributos: '1 em 4, 2 em 3, 2 em 2, o resto em 1',
                habilidades: '2 em 4 (1 com especialização), 4 em 3, 4 em 2, 4 em 1', vantagens: 'até 10 pontos, até 4 em defeitos' },
    fatal:    { nome: 'Mortal fatal',    atributos: '2 em 5, 2 em 4, 2 em 3, o resto em 2',
                habilidades: '1 em 5, 3 em 4, 5 em 3, 6 em 2, 3 especializações', vantagens: 'até 15 pontos, sem defeitos' }
  },

  PROFISSOES: {
    artista:      { nome: 'Artista',      pericias: [['oficios', 3, 'Artes'], ['performance', 3], ['intuicao', 3], ['academicos', 2], ['consciencia', 2], ['ocultismo', 2]] },
    programador:  { nome: 'Programador',  pericias: [['tecnologia', 3], ['academicos', 3], ['oficios', 3], ['financas', 2], ['persuasao', 2]] },
    executivo:    { nome: 'Executivo',    pericias: [['financas', 3], ['intimidacao', 3], ['persuasao', 3], ['intuicao', 2], ['labia', 2]] },
    investigador: { nome: 'Investigador', pericias: [['investigacao', 3], ['intuicao', 3], ['consciencia', 2], ['briga', 2], ['armas_fogo', 2]] },
    viciado:      { nome: 'Viciado',      pericias: [['manha', 3], ['empatia_animais', 3], ['briga', 3], ['intuicao', 2], ['furto', 2], ['labia', 2]] },
    mafioso:      { nome: 'Mafioso',      pericias: [['briga', 3], ['labia', 3], ['manha', 3], ['intimidacao', 2], ['furto', 2], ['armas_brancas', 2], ['armas_fogo', 2]] },
    estudante:    { nome: 'Estudante',    pericias: [['academicos', 3], ['ciencias', 3], ['oficios', 2, 'Escrever'], ['persuasao', 2]] },
    socialite:    { nome: 'Socialite',    pericias: [['performance', 3], ['tecnologia', 3], ['financas', 3], ['intuicao', 2], ['etiqueta', 2], ['labia', 2]] },
    veterano:     { nome: 'Veterano',     pericias: [['atletismo', 3], ['consciencia', 3], ['armas_fogo', 3], ['furtividade', 2], ['sobrevivencia', 2], ['lideranca', 2]] }
  },

  SANGUE_CONTAMINADO: [
    { substancia: 'Álcool',                        efeito: '−1 em Destreza e Inteligência' },
    { substancia: 'Cocaína, metanfetamina, speed', efeito: '−1 na dificuldade de resistir ao frenesi. Gastar 2 de Força de Vontade para rerrolar em Sucesso em Perigo ou Falha Bestial' },
    { substancia: 'Alucinógenos',                  efeito: '−2 em Raciocínio, Determinação e Manipulação' },
    { substancia: 'Heroína, morfina, opiáceos',    efeito: '−2 em todos os testes físicos; −1 na dificuldade de resistir ao frenesi' },
    { substancia: 'Maconha',                       efeito: '−1 em Raciocínio; −1 na dificuldade de resistir ao frenesi' },
    { substancia: 'Veneno',                        efeito: '−1 em todas as paradas e 1 a 3 de dano Superficial por cena' }
  ],

  /* Os nomes vêm do BÁSICO, pág. 228, e não da tabela do Escudo do
     Mestre. As duas trazem as mesmas faixas, mas o Escudo traduz
     "Efêmero" como "Fugaz" e "Agudo" como "Apurada" — e, na mesma
     página, "Celeridade" como "Rapiz" e "Proteanismo" como
     "Metamorfose". Onde os dois discordam, vale o básico. (§67) */
  TEMPERAMENTO_ALEATORIO: [
    { faixa: [1, 5],  temperamento: 'Equilibrada', id: 'nenhum', nota: 'ressonância insignificante' },
    { faixa: [6, 8],  temperamento: 'Efêmero', id: 'efemero' },
    { faixa: [9, 10], temperamento: 'Intenso', id: 'intenso', nota: 'role de novo: 1-8 Intenso, 9-10 Agudo' }
  ],

  RESSONANCIA_ALEATORIA: [
    { faixa: [1, 3],  ressonancia: 'fleumatico' },
    { faixa: [4, 6],  ressonancia: 'melancolico' },
    { faixa: [7, 8],  ressonancia: 'colerico' },
    { faixa: [9, 10], ressonancia: 'sanguineo' }
  ],

  FIM_DE_SESSAO: [
    '1 a 2 pontos de experiência. No fim da história, mais 1.',
    'Recupere 1 de Força de Vontade Agravada se o personagem agiu ativamente conforme sua Ambição.',
    'Recupere 1 ou mais Agravado ao beneficiar significativamente um Pilar, ou ao defender uma Convicção mesmo contra o próprio interesse.',
    'Uma vez por sessão, recupere dano Superficial de Vontade ao agir conforme o Desejo.',
    'A critério do Narrador, recupere pontos ao interpretar dramaticamente Sucesso em Perigo, Falha Bestial, frenesi ou Compulsão.',
    'Todo personagem com Mácula na trilha de Humanidade faz um teste de Remorso no fim da sessão.'
  ]
};

/* ============================================================
   VITÆ — Disciplinas e poderes

   REESCRITO NA §64, PÁGINA POR PÁGINA, contra o manual básico
   (págs. 244–288). A lista anterior tinha 126 poderes e batia com
   o livro em cerca de um terço: nomes plausíveis nos lugares
   errados, poderes que não existem, e poderes do livro ausentes.
   Animalismo tinha ONZE poderes e só um deles — Sentir a Besta —
   estava certo.

   Regra desta lista, e ela é dura:

     UM PODER SÓ ENTRA AQUI SE ESTIVER NA PÁGINA.

   Cada disciplina traz a página de origem. Quem for acrescentar
   poder de suplemento, marque a fonte junto — o que não tem fonte
   não deveria estar aqui.

   Oblívio é a exceção declarada: não existe no básico, e vem do
   `Livros/Regras/Oblivio.pdf`, que pela tabela de autoridade de
   `docs/regras.md` manda na matéria dele. Está por conferir.

   AMÁLGAMAS estão anotadas no poder E em `Arbitro.AMALGAMAS` —
   as duas listas precisam concordar, e há teste que confere.
   ============================================================ */

const DISCIPLINAS = {
  animalismo: {
    nome: 'Animalismo', simbolo: '🜛', cor: '#6b7a3f', pagina: '244–247',
    resumo: 'Comando sobre bestas e sobre a Besta alheia. O sangue reconhece o sangue selvagem.',
    poderes: {
      1: [
        { nome: 'Famulus Enlaçado', desc: 'Enlace um animal e transforme-o em famulus: vínculo mental, ordens simples, e ele defende você. Um por vampiro.' },
        { nome: 'Sentir a Besta', desc: 'Sinta a Besta em mortais, vampiros e outros seres — hostilidade, Fome, e se há algo sobrenatural ali.' }
      ],
      2: [
        { nome: 'Sussurros Selvagens', desc: 'Comunicação em mão dupla com animais, e convocação de um tipo de animal que esteja presente.' }
      ],
      3: [
        { nome: 'Enxame Não Vivo', desc: 'Estenda o Animalismo a enxames de insetos, tratando o enxame como uma criatura. Amálgama: Ofuscação 2.',
          amalgama: { disciplina: 'ofuscacao', nivel: 2 } },
        { nome: 'Subjugar a Besta', desc: 'Encare o alvo e adormeça a Besta dele: mortais ficam apáticos; vampiros não podem Surto de Sangue e ficam imunes a crítico bestial.' },
        { nome: 'Suculência Animal', desc: 'Sangue animal sacia 1 nível a mais, e consumir o próprio famulus sacia 4 de Fome.' }
      ],
      4: [
        { nome: 'Comunhão de Espíritos', desc: 'Transfira sua mente para o corpo de um animal e o controle livremente. Seu corpo fica imóvel, como em Torpor.' }
      ],
      5: [
        { nome: 'Controle Animal', desc: 'Comande bandos inteiros como extensões do próprio corpo. Animais morrem às dúzias para apaziguar você.' },
        { nome: 'Expulsar a Besta', desc: 'Projete sua Besta para um alvo próximo: ele entra no frenesi no seu lugar.' }
      ]
    }
  },

  auspicios: {
    nome: 'Auspícios', simbolo: '👁', cor: '#7a6aa8', pagina: '248–251',
    resumo: 'Sentidos afiados até a dor. Ver o que ninguém deveria ver — e não conseguir desver.',
    poderes: {
      1: [
        { nome: 'Sentidos Aguçados', desc: 'Ver no escuro total, ouvir ultrassom, farejar medo. Some o valor de Auspícios às rolagens de percepção.' },
        { nome: 'Sentir o Invisível', desc: 'Perceba o que se esconde à vista: Ofuscação, fantasmas, feitiços e rituais inativos.' }
      ],
      2: [
        { nome: 'Premonição', desc: 'Arrepios, intuições e visões curtas que tiram você do perigo ou revelam o que estava escondido.' }
      ],
      3: [
        { nome: 'Compartilhar os Sentidos', desc: 'Estenda a mente e sinta o ambiente pelos sentidos de outra pessoa.' },
        { nome: 'Perscrutar a Alma', desc: 'Leia a aura: estado emocional, Ressonância, se é sobrenatural, se está sob Feitiçaria, se cometeu Diablerie no último ano.' }
      ],
      4: [
        { nome: 'Toque do Espírito', desc: 'Toque um objeto ou lugar e sinta o resíduo de quem passou por ali — quem, o quê e em que circunstância.' }
      ],
      5: [
        { nome: 'Clarividência', desc: 'Em transe, reúna informação de uma área inteira: movimentação, boatos, o que fugiu do comum.' },
        { nome: 'Possessão', desc: 'Domine a vontade de um mortal e ocupe o corpo dele por completo. Amálgama: Dominação 3.',
          amalgama: { disciplina: 'dominacao', nivel: 3 } },
        { nome: 'Telepatia', desc: 'Leia pensamentos superficiais e projete os seus. Contra vampiro involuntário, custa Força de Vontade.' }
      ]
    }
  },

  celeridade: {
    nome: 'Celeridade', simbolo: '⚡', cor: '#c9a227', pagina: '252–254',
    resumo: 'Velocidade sobrenatural. Você chega antes de a frase terminar.',
    poderes: {
      1: [
        { nome: 'Graça Felina', desc: 'Equilíbrio perfeito: passa automaticamente em qualquer rolagem de Destreza ou Atletismo para se equilibrar.' },
        { nome: 'Reflexos Rápidos', desc: 'Sem penalidade de defesa por falta de cobertura contra armas de fogo, e uma ação menor de graça por turno.' }
      ],
      2: [
        { nome: 'Rapidez', desc: 'Some o valor de Celeridade às paradas de Destreza fora de combate, e uma vez por turno à defesa com Destreza + Atletismo.' }
      ],
      3: [
        { nome: 'Piscadela', desc: 'Cubra até 50 metros em linha reta e ainda aja no mesmo turno. Para quem olha, parece teleporte.' },
        { nome: 'Travessia', desc: 'Corra ou escale qualquer superfície em alta velocidade, inclusive vertical e líquida.' }
      ],
      4: [
        { nome: 'Elegância Direto da Fonte', desc: 'Quem beber do seu Sangue ganha metade da sua Celeridade por uma noite.' },
        { nome: 'Mira Infalível', desc: 'O mundo desacelera: o ataque à distância é feito contra Dificuldade 1, sem defesa. Amálgama: Auspícios 2.',
          amalgama: { disciplina: 'auspicios', nivel: 2 } }
      ],
      5: [
        { nome: 'Fração de Segundo', desc: 'Reaja antes do fato: substitua a narração do Narrador dentro do razoável — a porta que fecha, a emboscada que começou.' },
        { nome: 'Golpe Relâmpago', desc: 'Ataque com Briga ou Armas Brancas antes que o oponente possa se defender: Dificuldade 1, sem esquiva.' }
      ]
    }
  },

  dominacao: {
    nome: 'Dominação', simbolo: '☉', cor: '#a8863c', pagina: '254–257',
    resumo: 'A vontade do outro como instrumento. Exige o olhar, e a voz que a vítima entenda.',
    poderes: {
      1: [
        { nome: 'Compelir', desc: 'Uma ordem curta, de uma frase, cumprida ao pé da letra em um único turno.' },
        { nome: 'Nublar Memória', desc: '"Esqueça!" — a vítima perde os últimos minutos. O bastante para mascarar uma alimentação.' }
      ],
      2: [
        { nome: 'Dementação', desc: 'Conversa casual que agita os demônios internos da vítima até afogar a razão dela. Amálgama: Ofuscação 2.',
          amalgama: { disciplina: 'ofuscacao', nivel: 2 } },
        { nome: 'Mesmerismo', desc: 'Comandos complexos, executados no melhor da capacidade da vítima. Nada de condicional.' }
      ],
      3: [
        { nome: 'Diretriz Submersa', desc: 'Sugestão pós-hipnótica que dorme até um gatilho: uma data, uma pessoa, uma frase. Nunca expira.' },
        { nome: 'A Mente Esquecida', desc: 'Reescreva fragmentos inteiros da memória da vítima, que os aceita como seus.' }
      ],
      4: [
        { nome: 'Racionalizar', desc: 'A vítima passa a acreditar que tudo o que fez sob Dominação foi decisão dela, e defende o absurdo.' }
      ],
      5: [
        { nome: 'Decreto Terminal', desc: 'Comandos que levam a vítima a se ferir ou morrer passam a ser possíveis — resistidos, mas possíveis.' },
        { nome: 'Manipulação em Massa', desc: 'Amplifique qualquer outro poder seu para atingir uma multidão. Todos precisam ver seus olhos.' }
      ]
    }
  },

  fortitude: {
    nome: 'Fortitude', simbolo: '🛡', cor: '#7b6a4f', pagina: '257–259',
    resumo: 'Resistir. Ao golpe, ao fogo, ao encantamento — e continuar de pé como se nada tivesse acontecido.',
    poderes: {
      1: [
        { nome: 'Mente Inescrutável', desc: 'Some Fortitude a toda rolagem para resistir a coerção, intimidação, sedução — e a Dominação e Presença.' },
        { nome: 'Resiliência', desc: 'Some o valor de Fortitude à sua trilha de Vitalidade.' }
      ],
      2: [
        { nome: 'Feras Tenazes', desc: 'Estenda a Fortitude aos animais que você influencia. Amálgama: Animalismo 1.',
          amalgama: { disciplina: 'animalismo', nivel: 1 } },
        { nome: 'Tenacidade', desc: 'Subtraia Fortitude de todo dano Superficial sofrido, antes da divisão pela metade. Nunca reduz a menos de um.' }
      ],
      3: [
        { nome: 'Desafio à Perdição', desc: 'Converta dano Agravado em Superficial, até o seu valor de Fortitude. O convertido não cura naquela cena.' },
        { nome: 'Fortificar a Fachada Interior', desc: 'Proteja a mente do escrutínio sobrenatural: aumenta a Dificuldade de Perscrutar a Alma, Telepatia e afins.' }
      ],
      4: [
        { nome: 'Resistência Direto da Fonte', desc: 'Quem beber do seu Sangue ganha metade da sua Fortitude por uma noite.' }
      ],
      5: [
        { nome: 'Pele de Mármore', desc: 'Ignore a primeira fonte de dano físico de cada turno, fogo incluído — mas não luz solar.' }
      ]
    }
  },

  ofuscacao: {
    nome: 'Ofuscação', simbolo: '🌑', cor: '#4a4a58', pagina: '260–263',
    resumo: 'Não ser visto, não ser lembrado, não ser você. A Disciplina de quem prefere não ter estado ali.',
    poderes: {
      1: [
        { nome: 'Manto de Sombras', desc: 'Parado e em silêncio, você se mistura ao ambiente. Só detecção mecânica ou sobrenatural o encontra.' },
        { nome: 'Silêncio da Morte', desc: 'Anula todo som que você produz. Não engana microfone, e só afeta a audição.' }
      ],
      2: [
        { nome: 'Passagem Invisível', desc: 'Circule por aí funcionalmente invisível, dentro das limitações de Ofuscação.' }
      ],
      3: [
        { nome: 'Fantasma na Máquina', desc: 'A Ofuscação passa a valer por meios eletrônicos: câmeras, transmissões e vigilância automatizada.' },
        { nome: 'Máscara de Mil Faces', desc: 'Em vez de sumir, pareça um estranho qualquer — e interaja normalmente com quem encontrar.' }
      ],
      4: [
        { nome: 'Desaparecer', desc: 'Ative Manto de Sombras e Passagem Invisível mesmo sendo observado. A memória de quem viu fica nublada.' },
        { nome: 'Ocultar', desc: 'Esconda um objeto inanimado — porta, carro, casa pequena — e tudo que estiver dentro. Amálgama: Auspícios 3.',
          amalgama: { disciplina: 'auspicios', nivel: 3 } }
      ],
      5: [
        { nome: 'Disfarce do Impostor', desc: 'Assuma a aparência de um indivíduo específico, depois de estudá-lo. Pré-requisito: Máscara de Mil Faces.' },
        { nome: 'Ocultar o Grupo', desc: 'Estenda a sua Ofuscação a companheiros voluntários. Se um for revelado, os outros continuam escondidos.' }
      ]
    }
  },

  potencia: {
    nome: 'Potência', simbolo: '✊', cor: '#8e2f2f', pagina: '263–265',
    resumo: 'Força além do que o corpo comporta. A Besta solta pelos punhos.',
    poderes: {
      1: [
        { nome: 'Corpo Letal', desc: 'Ataques desarmados causam dano Agravado a mortais, e ignoram um nível de armadura por ponto de Potência.' },
        { nome: 'Salto Vertiginoso', desc: 'Salte três vezes o seu nível de Potência em metros na vertical, e cinco vezes na horizontal, sem impulso.' }
      ],
      2: [
        { nome: 'Poderio', desc: 'Some Potência ao dano desarmado e a feitos de Força, e metade dela ao dano com Armas Brancas.' }
      ],
      3: [
        { nome: 'Alimentação Brutal', desc: 'O "Beijo Selvagem": drene um humano em segundos, a marteladas. Cada Fome saciada causa um Agravado na vítima.' },
        { nome: 'Centelha de Fúria', desc: 'Incite fúria e frenesi em espectadores tão facilmente quanto fascinação. Amálgama: Presença 3.',
          amalgama: { disciplina: 'presenca', nivel: 3 } },
        { nome: 'Pegada Sobrenatural', desc: 'Crave os dedos em quase qualquer superfície: escale e fique pendurado sem apoio, sem teste.' }
      ],
      4: [
        { nome: 'Força Direto da Fonte', desc: 'Quem beber do seu Sangue ganha metade da sua Potência por uma noite.' }
      ],
      5: [
        { nome: 'Punho de Caim', desc: 'Com as mãos vazias, cause dano Agravado a mortais e sobrenaturais: desmembre, perfure, decapite.' },
        { nome: 'Terremoto', desc: 'Um golpe no chão cria uma onda de choque num raio de cinco metros. Uma vez por cena.' }
      ]
    }
  },

  presenca: {
    nome: 'Presença', simbolo: '❥', cor: '#b8446b', pagina: '265–268',
    resumo: 'Atrair ou repelir. A Disciplina que mexe com a emoção, e não com a mente — a vítima sabe, e não se importa.',
    poderes: {
      1: [
        { nome: 'Amedontrar', desc: 'Some Presença a rolagens de Intimidação. Atacar você exige um teste de Determinação + Autocontrole.' },
        { nome: 'Fascínio', desc: 'A atenção de todos se volta para você. Some Presença a Persuasão e Performance.' }
      ],
      2: [
        { nome: 'Beijo Indelével', desc: 'O seu Beijo vicia: a vítima fica fortalecida, obcecada, e vem atrás de outra dose.' }
      ],
      3: [
        { nome: 'Olhar Aterrorizante', desc: 'Mostre as presas e o rosto predador: mortais fogem, vampiros travam ou entram em Rötschreck.' },
        { nome: 'Transe', desc: 'Concentre a atração em uma pessoa só. Ela faz o que puder para permanecer nas suas boas graças.' }
      ],
      4: [
        { nome: 'Convocar', desc: 'Chame para si quem já sofreu Fascínio, Transe ou Majestade, ou provou o seu Sangue. Ele sabe onde você está.' },
        { nome: 'Voz Irresistível', desc: 'A sua Presença vira canal para Dominação: basta a voz, sem contato visual. Amálgama: Dominação 1.',
          amalgama: { disciplina: 'dominacao', nivel: 1 } }
      ],
      5: [
        { nome: 'Magnetismo de Estrela', desc: 'A Presença passa a afetar quem o vê ao vivo em transmissão ou o ouve por telefone. Gravação não retém.' },
        { nome: 'Majestade', desc: 'Quem o vir fica incapaz de agir ou falar contra você. Opor-se exige vencer uma disputa, e a liberdade dura turnos.' }
      ]
    }
  },

  /* O livro chama esta Disciplina de PROTEANISMO (pág. 269). O id
     `metamorfose` fica: ele é interno, aparece em `data-clans.js` e
     nas fichas gravadas, e trocá-lo custaria mais do que rende.
     Mesma divisão do `piscina` × "parada de dados" da §58: o
     identificador fica, o nome segue o livro.

     E "Metamorfose" continua existindo — como o PODER de nível 4. */
  metamorfose: {
    nome: 'Proteanismo', simbolo: '🐺', cor: '#5b6b3a', pagina: '269–271',
    resumo: 'A carne que não aceita a própria forma. Garras, névoa, terra e bicho.',
    poderes: {
      1: [
        { nome: 'Olhos da Besta', desc: 'Enxergue na ausência total de luz. Os olhos ficam inumanos: +2 em Intimidação contra mortais.' },
        { nome: 'Peso Pena', desc: 'Reduza sua massa efetiva: evite sensores de pressão e dano de queda, colisão e impacto.' }
      ],
      2: [
        { nome: 'Armas Ferais', desc: 'Unhas viram garras e presas viram adagas: arma leve e perfurante, +2 de dano, sem penalidade de ataque localizado.' }
      ],
      3: [
        { nome: 'Fusão com a Terra', desc: 'Afunde no solo natural e volte a emergir na noite seguinte. Não funciona sobre concreto ou asfalto.' },
        { nome: 'Mudança de Forma', desc: 'Assuma a forma de um animal de massa parecida — geralmente lobo, felino ou cobra grande.' }
      ],
      4: [
        { nome: 'Metamorfose', desc: 'Uma forma animal a mais, agora podendo mudar de tamanho: morcego, rato, inseto enorme, cobra. Pré-requisito: Mudança de Forma.' }
      ],
      5: [
        { nome: 'Coração Vagante', desc: 'O coração solta-se e passeia pelo peito: estacar você fica quase impossível, e dá para se livrar da estaca.' },
        { nome: 'Forma de Névoa', desc: 'Vire uma nuvem de névoa, intocável exceto por fogo, luz solar e ataque sobrenatural.' }
      ]
    }
  },

  feiticaria: {
    nome: 'Feitiçaria de Sangue', simbolo: '⛧', cor: '#8b2942', pagina: '271–274',
    ritual: true,
    resumo: 'Subjugar o próprio Sangue. Nenhum mortal usaria magia deste modo. Destrava Rituais até o seu nível.',
    poderes: {
      1: [
        { nome: 'Um Gosto por Sangue', desc: 'Prove uma gota e saiba Ressonância, se é mortal ou vampiro, a Potência de Sangue e se houve Diablerie no último ano.' },
        { nome: 'Vitae Corrosivo', desc: 'Torne o próprio Vitae corrosivo a matéria morta: corrói cerca de 35 cm por Checagem de Sangue.' }
      ],
      2: [
        { nome: 'Extinguir Vitae', desc: 'Coagule o Sangue de outro vampiro à vista: a Fome dele sobe um, ou dois num crítico.' }
      ],
      3: [
        { nome: 'Picada de Escorpião', desc: 'Transmute o Sangue em veneno paralisante. Incapacita mortais; em vampiros, atrapalha.' },
        { nome: 'Sangue Potente', desc: 'Aumente a própria Potência de Sangue em um por uma cena — e exceda o limite da geração enquanto durar.' }
      ],
      4: [
        { nome: 'Roubo de Vitae', desc: 'Abra uma artéria à distância e beba a torrente do outro lado do aposento. Não deixa traço ao terminar.' }
      ],
      5: [
        { nome: 'Caldeirão de Sangue', desc: 'Ferva o sangue da vítima nas próprias veias. Cada ponto de margem é um Agravado, e custa Mácula.' },
        { nome: 'Carícia de Baal', desc: 'Veneno letal para mortais e Membros: mortal que sofra um ponto morre; vampiro ferido cai em Torpor ao dormir.' }
      ]
    }
  },

  /* NÃO ESTÁ NO MANUAL BÁSICO. Vem de `Livros/Regras/Oblivio.pdf`,
     que pela tabela de autoridade manda na matéria dele. Continua
     POR CONFERIR — a §64 leu só o básico. */
  oblivio: {
    nome: 'Oblívio', simbolo: '🜏', cor: '#3f3a5c', pagina: 'Oblivio.pdf — por conferir',
    resumo: 'O nada entre as coisas. Lasombra o chamam de Abismo; Hecata, de outro lado. É o mesmo silêncio.',
    ritual: true,
    poderes: {
      1: [
        { nome: 'Manto Obscuro', desc: 'As sombras do ambiente o disfarçam: +2 dados em Furtividade e em Intimidação contra mortais.' },
        { nome: 'Visão de Oblívio', desc: 'Enxergue em trevas totais e perceba fantasmas que não estejam se escondendo.' },
        { nome: 'Do Pó ao Pó', desc: 'Introduza Vitae num cadáver e o desintegre em três turnos.' },
        { nome: 'Grilhões que Vinculam', desc: 'Identifique os objetos e locais que prendem um fantasma à existência.' }
      ],
      2: [
        { nome: 'Projetar Sombra', desc: 'Conjure uma sombra sobrenatural própria, da qual outros poderes podem partir.' },
        { nome: 'Braços de Arimã', desc: 'Tentáculos de sombra que agarram, sufocam e atacam à distância. Amálgama: Potência 2.',
          amalgama: { disciplina: 'potencia', nivel: 2 } },
        { nome: 'Precognição Fatal', desc: 'Veja a morte futura de alguém que não seja vampiro. Amálgama: Auspícios 2.',
          amalgama: { disciplina: 'auspicios', nivel: 2 } },
        { nome: 'Onde a Mortalha Afina', desc: 'Sinta onde o véu entre os vivos e as Terras Sombrias está fino.' }
      ],
      3: [
        { nome: 'Perspectiva da Sombria', desc: 'Projete seus sentidos através da própria sombra, à distância.' },
        { nome: 'Toque de Oblívio', desc: 'O contato com o Abismo apodrece a carne da vítima.' },
        { nome: 'Aura de Decadência', desc: 'Tudo ao seu redor murcha, apodrece e adoece.' },
        { nome: 'Banquete de Paixões', desc: 'Alimente-se das emoções de um fantasma em vez de sangue.' }
      ],
      4: [
        { nome: 'A Mortalha Estígia', desc: 'Cubra uma área inteira com escuridão do Mundo Inferior.' },
        { nome: 'Praga Necrótica', desc: 'Infecte a vítima com uma decadência que corrói Vitalidade a cada cena.' }
      ],
      5: [
        { nome: 'Passo Sombrio', desc: 'Entre numa sombra e saia de outra, em qualquer lugar conhecido.' },
        { nome: 'Avatar Tenebroso', desc: 'Torne-se sombra viva: intangível, devastador e quase impossível de ferir.' },
        /* 'Tempestade de Ossos' e 'Chamado do Além' estavam aqui e NÃO
           EXISTEM: nenhuma ocorrência no Oblivio.pdf. A lista certa já
           estava em regras.md §14.7 desde sempre, e o dado é que tinha
           dois poderes inventados. Corrigido na §65, e agora há teste
           que compara as duas listas. */
        { nome: 'Skulds Realizada', desc: 'O que estava destinado se cumpre: o Oblívio realiza no alvo aquilo que já era o fim dele.' },
        { nome: 'Espírito em Declínio', desc: 'Arraste um espírito para o declínio final, ou empurre uma alma até a dissolução.' }
      ]
    }
  },

  alquimia: {
    nome: 'Alquimia de Sangue-Ralo', simbolo: '⚗', cor: '#7f8a4a', pagina: '282–287',
    resumo: 'O sangue ralo como reagente. Destila-se o que não se herda — e um poder por vez.',
    poderes: {
      1: [
        { nome: 'Longo Alcance', desc: 'Agarre, segure e empurre objetos ou pessoas sem tocar: até 100 kg, a até 10 metros.' },
        { nome: 'Neblina', desc: 'Uma névoa que segue você, ocultando a identidade: −2 na parada de quem tentar identificá-lo ou alvejá-lo à distância.' }
      ],
      2: [
        { nome: 'Envolver', desc: 'Uma névoa cola no alvo, cegando-o — e, em mortais, sufocando. −3 em detecção visual e ataque à distância.' },
        { nome: 'Defracionar', desc: 'Elixir homeopático que devolve o frescor a sangue hospitalar fracionado, para quem não tem Esôfago de Ferro.' }
      ],
      3: [
        { nome: 'Hieros Gamos Profano', desc: 'Molda o corpo humano à forma idealizada de quem bebe. Permanente até ser refeito, e pode manifestar Defeitos.' }
      ],
      4: [
        { nome: 'Ímpeto Aéreo', desc: 'Erga-se do solo e voe ou paire à velocidade de corrida, carregando até a massa de um humano médio.' }
      ],
      5: [
        { nome: 'Despertar Adormecido', desc: 'Elixir que, misturado a sangue humano, desperta um vampiro do Torpor conforme a Potência de Sangue dele.' }
      ]
    }
  }
};

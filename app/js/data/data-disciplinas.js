/* ============================================================
   VITAE — Disciplinas e poderes (V5 / Livro das Disciplinas)
   Cada nivel lista os poderes disponiveis para escolha.
   ============================================================ */

const DISCIPLINAS = {
  animalismo: {
    nome: 'Animalismo', simbolo: '🜛', cor: '#6b7a3f',
    resumo: 'Comando sobre bestas e sobre a Besta alheia. O sangue reconhece o sangue selvagem.',
    poderes: {
      1: [
        { nome: 'Sussurro da Vespa', desc: 'Chame um enxame de criaturas da região. Elas obedecem grosseiramente.' },
        { nome: 'Sentir a Besta', desc: 'Perceba raiva, fome sobrenatural e Besta desperta em quem estiver por perto.' }
      ],
      2: [
        { nome: 'Companheiro Feral', desc: 'Um animal se torna aliado leal e permanente.' },
        { nome: 'Atiçar a Fera Adormecida', desc: 'Desperte a Besta de outro Membro, empurrando-o ao frenesi.' }
      ],
      3: [
        { nome: 'Cavalgar a Onda Selvagem', desc: 'Projete sua mente para dentro de um animal e o controle à distância.' },
        { nome: 'Aquietar a Besta', desc: 'Sufoque a Besta de alguém: nada de frenesi, nada de fúria, nada de medo.' },
        { nome: 'Latido Ancestral', desc: 'Um grito primal que congela mortais e animais de terror.' }
      ],
      4: [
        { nome: 'Súplica de Sangue', desc: 'Chame animais de longe; eles vêm e se oferecem para você beber.' },
        { nome: 'Súbito Frenesi', desc: 'Force outro vampiro ao frenesi de fome ou fúria, sem chance de resistir facilmente.' }
      ],
      5: [
        { nome: 'Animais Ancestrais', desc: 'Sua manada ganha inteligência e obedece a ordens complexas.' },
        { nome: 'Coabitação', desc: 'Aloje a alma de outro vampiro dentro de um animal — indefinidamente.' }
      ]
    }
  },

  auspicios: {
    nome: 'Auspícios', simbolo: '👁', cor: '#7a6aa8',
    resumo: 'Sentidos afiados até a dor. Ver o que ninguém deveria ver — e não conseguir desver.',
    poderes: {
      1: [
        { nome: 'Sentidos da Fera', desc: 'Todos os sentidos elevados. Adicione dados a percepção e a defesas de emboscada.' },
        { nome: 'Sentir o Invisível', desc: 'Detecte o sobrenatural ativo ao seu redor: magia, Disciplinas, presenças ocultas.' }
      ],
      2: [
        { nome: 'Premonição', desc: 'Lampejos do que está por vir. O Narrador lhe entrega um aviso — cifrado.' }
      ],
      3: [
        { nome: 'Toque do Espírito', desc: 'Toque um objeto e leia o eco emocional das mãos que passaram por ele.' },
        { nome: 'Compartilhar Sentidos', desc: 'Enxergue e ouça através dos sentidos de outra pessoa, à distância.' }
      ],
      4: [
        { nome: 'Sondagem Espiritual', desc: 'Leia superficialmente a mente do alvo: emoções, intenções, mentiras.' }
      ],
      5: [
        { nome: 'Clarividência', desc: 'Projete seus sentidos para qualquer lugar que você conheça bem.' },
        { nome: 'Possessão', desc: 'Expulse a alma de um mortal e habite o corpo dele.' },
        { nome: 'Telepatia', desc: 'Converse mente a mente e vasculhe pensamentos em profundidade.' }
      ]
    }
  },

  celeridade: {
    nome: 'Celeridade', simbolo: '⚡', cor: '#c9a227',
    resumo: 'O tempo dos vivos é lento demais. Você se move nos intervalos entre os batimentos deles.',
    poderes: {
      1: [
        { nome: 'Graça Felina', desc: 'Sucesso automático em qualquer teste de equilíbrio.' },
        { nome: 'Reflexos Rápidos', desc: 'Some dados à sua defesa e à iniciativa.' }
      ],
      2: [
        { nome: 'Velocidade Sobrenatural', desc: 'Corra em disparada impossível — vultos e rastros.' },
        { nome: 'Reflexos Aprimorados', desc: 'Reaja antes de qualquer mortal conseguir processar.' }
      ],
      3: [
        { nome: 'Golpe do Vento', desc: 'Ataque múltiplas vezes em um único turno.' },
        { nome: 'Passo Sopro', desc: 'Cruze uma distância enorme antes que alguém pisque.' }
      ],
      4: [
        { nome: 'Enxame de Golpes', desc: 'Uma tempestade de ataques contra vários alvos.' },
        { nome: 'Fuga Instintiva', desc: 'Escape reflexivamente de qualquer ataque que você veja chegar.' }
      ],
      5: [
        { nome: 'Vento Repentino', desc: 'Movimente-se tão rápido que testemunhas nem registram sua passagem.' },
        { nome: 'Aparar Balas', desc: 'Desvie ou intercepte projéteis com as mãos.' }
      ]
    }
  },

  dominacao: {
    nome: 'Dominação', simbolo: '☉', cor: '#a8863c',
    resumo: 'A voz que a vítima confunde com a própria vontade. Olhe nos olhos e assine por ela.',
    poderes: {
      1: [
        { nome: 'Fascinação', desc: 'Uma ordem de uma palavra, obedecida no ato.' },
        { nome: 'Coagir', desc: 'Uma ordem curta que o alvo executa sem questionar.' }
      ],
      2: [
        { nome: 'Domínio Mesmerizante', desc: 'Implante uma sugestão complexa que o alvo cumprirá mais tarde.' },
        { nome: 'Sussurro Sedutor', desc: 'Comande pela voz apenas, sem contato visual — na multidão ou pelo telefone.' }
      ],
      3: [
        { nome: 'A Névoa do Esquecimento', desc: 'Apague ou reescreva memórias recentes do alvo.' },
        { nome: 'Submissão', desc: 'Domine outro vampiro apesar da diferença de geração.' }
      ],
      4: [
        { nome: 'Condicionamento', desc: 'Moldar o alvo até que resistir a você seja quase impossível.' },
        { nome: 'Alterar Lembranças', desc: 'Reconstrua um passado inteiro dentro da cabeça de alguém.' }
      ],
      5: [
        { nome: 'Passar por Cima', desc: 'Domine uma multidão inteira com uma única ordem.' },
        { nome: 'Fantoche de Carne', desc: 'Assuma o controle motor completo de um mortal.' }
      ]
    }
  },

  fortitude: {
    nome: 'Fortitude', simbolo: '🛡', cor: '#7b6a4f',
    resumo: 'A carne morta que se recusa a ceder. Não é coragem: é teimosia entranhada no osso.',
    poderes: {
      1: [
        { nome: 'Resiliência', desc: 'Some sua Fortitude à absorção de dano superficial.' },
        { nome: 'Inabalável', desc: 'Dados extras para resistir a coerção, terror e Disciplinas mentais.' }
      ],
      2: [
        { nome: 'Escudo de Aço', desc: 'Converta dano agravado em superficial uma vez por cena.' },
        { nome: 'Obstinado', desc: 'Recupere Força de Vontade ao ser desafiado.' }
      ],
      3: [
        { nome: 'Fortalecer o Interior', desc: 'Compartilhe sua resistência com um aliado próximo.' },
        { nome: 'Peles do Fundador', desc: 'Sua pele resiste até a fogo e luz por instantes preciosos.' }
      ],
      4: [
        { nome: 'Alma de Aço', desc: 'Reduza dano agravado de qualquer fonte, inclusive fogo e sol.' },
        { nome: 'Sangue do Mártir', desc: 'Absorva o golpe destinado a outra pessoa.' }
      ],
      5: [
        { nome: 'Fúria de Prometeu', desc: 'Continue de pé mesmo quando deveria estar em torpor.' },
        { nome: 'Carne de Mármore', desc: 'Torne-se praticamente imune a dano físico por uma cena.' }
      ]
    }
  },

  ofuscacao: {
    nome: 'Ofuscação', simbolo: '🌑', cor: '#4a4a58',
    resumo: 'Não é invisibilidade: é a mentira que a mente do observador conta para si mesma.',
    poderes: {
      1: [
        { nome: 'Manto das Sombras', desc: 'Fique imperceptível enquanto não se mover nem falar.' },
        { nome: 'Presença Silenciosa', desc: 'Passe despercebido mesmo em movimento, desde que ninguém o procure.' }
      ],
      2: [
        { nome: 'Manto do Desconhecido', desc: 'A imperceptibilidade acompanha você em movimento.' },
        { nome: 'Rosto Esquecível', desc: 'Ninguém consegue descrever você depois — nem lembrar direito.' }
      ],
      3: [
        { nome: 'Máscara das Mil Faces', desc: 'Assuma um rosto e um corpo comuns, sem identidade fixa.' },
        { nome: 'Manto Compartilhado', desc: 'Estenda seu véu a companheiros próximos.' }
      ],
      4: [
        { nome: 'Rosto Roubado', desc: 'Copie a aparência exata de uma pessoa real.' },
        { nome: 'Alma Sem Reflexo', desc: 'Torne-se imune a leituras de mente e detecção sobrenatural.' }
      ],
      5: [
        { nome: 'Vestir o Rebanho', desc: 'Cubra um grupo inteiro com seu véu.' },
        { nome: 'Impostor Impecável', desc: 'A imitação é perfeita até para quem convive com o original.' }
      ]
    }
  },

  potencia: {
    nome: 'Potência', simbolo: '✊', cor: '#8e2f2f',
    resumo: 'Força que rasga porta de aço e crânio com a mesma indiferença.',
    poderes: {
      1: [
        { nome: 'Poder Letal', desc: 'Seus golpes desarmados causam dano agravado a mortais.' },
        { nome: 'Salto Sobrenatural', desc: 'Salte alturas e distâncias absurdas.' }
      ],
      2: [
        { nome: 'Impulso Selvagem', desc: 'Some sua Potência aos testes de Força por uma cena.' },
        { nome: 'Punho de Ferro', desc: 'Quebre objetos e ossos sem precisar de teste.' }
      ],
      3: [
        { nome: 'Fúria Brutal', desc: 'Dobre o dano de um único golpe devastador.' },
        { nome: 'Investida', desc: 'Atravesse a cena e derrube o alvo no mesmo movimento.' }
      ],
      4: [
        { nome: 'Golpe Terrível', desc: 'Um ataque que arranca membros e destrói veículos.' },
        { nome: 'Desperdício', desc: 'Danifique tudo ao redor com uma explosão de força.' }
      ],
      5: [
        { nome: 'Força Fatal', desc: 'Trate objetos maciços como papel e mortais como insetos.' },
        { nome: 'Força de Aço', desc: 'Some pontos permanentes de Potência aos testes de Força.' }
      ]
    }
  },

  presenca: {
    nome: 'Presença', simbolo: '❥', cor: '#b8446b',
    resumo: 'A gravidade do desejo. As pessoas se aproximam sabendo que vão se machucar.',
    poderes: {
      1: [
        { nome: 'Admiração', desc: 'Torne-se irresistivelmente simpático a quem estiver ao seu redor.' },
        { nome: 'Terror', desc: 'Inspire pavor imediato: mortais fogem, vampiros hesitam.' }
      ],
      2: [
        { nome: 'Presença Fatal', desc: 'Some dados a testes Sociais contra qualquer alvo que o veja.' },
        { nome: 'Chamado Silencioso', desc: 'Convoque alguém à distância; a pessoa virá sem saber por quê.' }
      ],
      3: [
        { nome: 'Convocação', desc: 'Chame um alvo específico de qualquer distância; ele viajará até você.' },
        { nome: 'Manto do Predador', desc: 'Sua presença abre caminho: todos se afastam do seu percurso.' }
      ],
      4: [
        { nome: 'Espírito Irresistível', desc: 'Todos que o veem tornam-se propensos a obedecer e a proteger você.' },
        { nome: 'Coração Suspenso', desc: 'Torne alguém obcecado por você por uma noite inteira.' }
      ],
      5: [
        { nome: 'Majestade', desc: 'Ninguém consegue agir contra você sem gastar Força de Vontade.' },
        { nome: 'Estrela', desc: 'Torne-se o centro absoluto de qualquer ambiente; ninguém olha para outro lugar.' }
      ]
    }
  },

  metamorfose: {
    nome: 'Metamorfose', simbolo: '🐺', cor: '#5b6b3a',
    resumo: 'A carne lembra que já foi outra coisa. Garras, névoa, terra, bicho.',
    poderes: {
      1: [
        { nome: 'Olhos da Fera', desc: 'Enxergue perfeitamente no escuro e intimide com o olhar bestial.' },
        { nome: 'Peso da Pena', desc: 'Torne-se leve como pluma; quedas não o machucam.' }
      ],
      2: [
        { nome: 'Garras da Fera', desc: 'Garras que causam dano agravado até a outros vampiros.' },
        { nome: 'Terra Acolhedora', desc: 'Afunde na terra para dormir protegido do sol.' }
      ],
      3: [
        { nome: 'Forma de Fera', desc: 'Transforme-se em lobo, morcego ou outro animal predador.' },
        { nome: 'Sangue Ferido', desc: 'Redistribua ferimentos pelo corpo e continue funcional.' }
      ],
      4: [
        { nome: 'Forma de Névoa', desc: 'Vire vapor: atravesse frestas, ignore ataques físicos.' },
        { nome: 'Metamorfose', desc: 'Remodele o próprio corpo em qualquer forma humana.' }
      ],
      5: [
        { nome: 'A Forma Sem Nome', desc: 'Torne-se um enxame ou uma massa amorfa de matéria viva.' },
        { nome: 'Carne Mutável', desc: 'Molde carne alheia como se fosse sua — uma vez por noite.' }
      ]
    }
  },

  feiticaria: {
    nome: 'Feitiçaria do Sangue', simbolo: '⛧', cor: '#8b2942',
    resumo: 'Transformar Vitae em fórmula. Tremere e Banu Haqim escrevem em veias.',
    ritual: true,
    poderes: {
      1: [
        { nome: 'Corrupção do Sangue', desc: 'Apodreça o sangue de um alvo à distância, causando dano.' },
        { nome: 'Vermes de Sangue', desc: 'Transforme uma poça de sangue em vermes vorazes.' }
      ],
      2: [
        { nome: 'Extinguir a Vitae', desc: 'Queime a Vitae de outro vampiro, aumentando a Fome dele.' },
        { nome: 'Roubo de Vitae', desc: 'Puxe sangue de um alvo sem tocá-lo.' }
      ],
      3: [
        { nome: 'Sangue Escaldante', desc: 'Faça o sangue da vítima ferver dentro das veias.' },
        { nome: 'Chamado do Sangue', desc: 'Encontre qualquer pessoa de quem você já bebeu.' }
      ],
      4: [
        { nome: 'Ferver o Sangue', desc: 'Provoque hemorragia devastadora com um gesto.' },
        { nome: 'Sangue Idêntico', desc: 'Disfarce a assinatura do seu sangue como a de outro.' }
      ],
      5: [
        { nome: 'Rapina de Baal', desc: 'Explosão de sangue que fere todos ao redor.' },
        { nome: 'Cauterizar a Ferida', desc: 'Impeça permanentemente que um alvo se cure.' }
      ]
    },
    rituais: {
      1: ['Sentir o Sangue', 'Sangue Cadavérico', 'Sanguinária', 'Vigor Empurrado', 'Círculo de Proteção'],
      2: ['Sangue Coagulado', 'Poço da Verdade', 'Vermes das Escrituras', 'Comunicar com o Sire'],
      3: ['Marca de Caim', 'Danos ao Espelho', 'Sangue Envenenado', 'Alistamento do Ferro'],
      4: ['Defesa do Sangue Sagrado', 'Escudo Escarlate', 'Incorporar a Chama'],
      5: ['Chamado do Grande Rebanho', 'Cerco de Ferro', 'Passagem para o Abismo']
    }
  },

  oblivio: {
    nome: 'Oblívio', simbolo: '🜏', cor: '#3f3a5c',
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
        { nome: 'Braços de Arimã', desc: 'Tentáculos de sombra que agarram, sufocam e atacam à distância. Amálgama: Potência 2.' },
        { nome: 'Precognição Fatal', desc: 'Veja a morte futura de alguém que não seja vampiro. Amálgama: Auspícios 2.' },
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
        { nome: 'Skulds Realizada', desc: 'Force o destino previsto a se cumprir agora.' },
        { nome: 'Espírito em Declínio', desc: 'Provoque decadência espiritual em vampiros e mortais.' }
      ]
    },
    rituaisRotulo: 'Cerimônias',
    rituais: {
      1: ['A Dádiva da Vida Falsa', 'Invocar o Espírito', 'Cadáver Irracional'],
      2: ['Despertar do Servo Homuncular', 'Obrigar Espíritos', 'Servo Homuncular'],
      3: ['Espírito Anfitrião', 'Hordas Trôpegas', 'Cadáver Violento'],
      4: ['Vincular o Espírito', 'Rasgar a Mortalha'],
      5: ['Ex Nihilo', 'Benção Lazarena']
    }
  },

  alquimia: {
    nome: 'Alquimia de Sangue Fraco', simbolo: '⚗', cor: '#7f8a4a',
    resumo: 'Sangue destilado em fórmula. O único poder que a 14ª geração consegue fabricar.',
    exclusivaSangueFraco: true,
    poderes: {
      1: [
        { nome: 'Efeito Duplo', desc: 'Uma fórmula que imita um poder de Disciplina de nível 1.' },
        { nome: 'Ressonância Roubada', desc: 'Extraia e engarrafe a ressonância de um mortal.' }
      ],
      2: [
        { nome: 'Concocção Envolvente', desc: 'Fórmula que imita poderes de nível 2.' },
        { nome: 'Fórmula do Sol Falso', desc: 'Resista brevemente à luz solar.' }
      ],
      3: [
        { nome: 'Destilação Profunda', desc: 'Fórmulas de nível 3, com efeitos duradouros.' },
        { nome: 'Sopro de Vida', desc: 'Simule sinais vitais completos por horas.' }
      ],
      4: [
        { nome: 'Elixir Aprimorado', desc: 'Fórmulas de nível 4 e mistura de efeitos.' }
      ],
      5: [
        { nome: 'Grande Obra', desc: 'Fórmulas de nível 5 — e a promessa de reverter a maldição.' }
      ]
    }
  }
};

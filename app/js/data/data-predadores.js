/* ============================================================
   VITAE — Tipos de Predador (V5 + Guia do Jogador)
   ============================================================ */

const PREDADORES = [
  {
    id: 'gato_de_rua', nome: 'Gato de Rua', simbolo: '🐈‍⬛',
    lema: 'Você caça na força e no susto.',
    desc: 'Becos, estacionamentos, terminais vazios. Você pega quem ninguém vai procurar e não pede licença.',
    teste: 'Força ou Destreza + Briga',
    piscinas: [['forca','briga'],['destreza','briga']],
    especializacao: { opcoes: [['briga', 'Luta Suja'], ['atletismo', 'Corrida']] },
    disciplina: ['celeridade', 'potencia'],
    humanidade: -1,
    vantagens: [{ nome: 'Contatos Criminosos', pontos: 3, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Aplicação da Lei (Inimigo)', pontos: 1, tipo: 'defeito' }]
  },
  {
    id: 'ensacador', nome: 'Ensacador', simbolo: '🩸',
    lema: 'Sangue de bolsa, sem rosto, sem culpa.',
    desc: 'Bancos de sangue, hospitais, necrotérios, o mercado paralelo. Frio, seguro, insosso.',
    teste: 'Inteligência + Manha ou Finanças',
    piscinas: [['inteligencia','manha'],['inteligencia','financas']],
    especializacao: { opcoes: [['manha', 'Mercado Negro'], ['medicina', 'Bancos de Sangue']] },
    disciplina: ['ofuscacao', 'animalismo'],
    vantagens: [{ nome: 'Fornecedor de Sangue', pontos: 1, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Comedor Melindroso', pontos: 1, tipo: 'defeito' }],
    nota: 'Sangue de bolsa nunca oferece Ressonância intensa.'
  },
  {
    id: 'sanguessuga', nome: 'Sanguessuga de Sangue', simbolo: '🧛',
    lema: 'Você bebe dos seus.',
    desc: 'Vitae de outros Membros. É proibido, é viciante e é a fofoca mais perigosa da cidade sobre você.',
    teste: 'Nenhum — é sempre caçada e sempre política',
    piscinas: [['forca','briga'],['manipulacao','labia']],
    especializacao: { opcoes: [['briga', 'Vampiros'], ['ocultismo', 'Vitae']] },
    disciplina: ['ofuscacao', 'potencia'],
    humanidade: -1,
    vantagens: [],
    defeitos: [
      { nome: 'Predador Óbvio', pontos: 2, tipo: 'defeito' },
      { nome: 'Caçador Feio (Perde 1 ponto de Humanidade)', pontos: 0, tipo: 'nota' }
    ],
    nota: 'Você não pode ter o Antecedente Rebanho e ganha o Defeito Vício de Sangue.'
  },
  {
    id: 'cutelo', nome: 'Cutelo', simbolo: '🏠',
    lema: 'Uma família que não sabe que é despensa.',
    desc: 'Você mantém uma vida civil: amigos, parceiros, filhos talvez. Bebe deles em doses pequenas e mente muito bem.',
    teste: 'Manipulação + Subterfúgio',
    piscinas: [['manipulacao','labia']],
    especializacao: { opcoes: [['persuasao', 'Mentiras Longas'], ['intuicao', 'Detectar Mentiras']] },
    disciplina: ['dominacao', 'animalismo'],
    vantagens: [{ nome: 'Rebanho', pontos: 2, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Perseguido pela Máscara', pontos: 2, tipo: 'defeito' }]
  },
  {
    id: 'consensualista', nome: 'Consensualista', simbolo: '🤝',
    lema: 'Você só bebe de quem diz sim.',
    desc: 'Nada de Dominação, nada de coerção. Você conta a verdade — ou uma versão dela — e recebe permissão.',
    teste: 'Manipulação + Persuasão',
    piscinas: [['manipulacao','persuasao']],
    especializacao: { opcoes: [['medicina', 'Transfusão'], ['persuasao', 'Doadores']] },
    disciplina: ['auspicios', 'fortitude'],
    humanidade: 1,
    vantagens: [],
    defeitos: [
      { nome: 'Violador da Máscara', pontos: 1, tipo: 'defeito' },
      { nome: 'Prey Exclusion (não pode caçar inocentes)', pontos: 1, tipo: 'defeito' }
    ]
  },
  {
    id: 'fazendeiro', nome: 'Fazendeiro', simbolo: '🐄',
    lema: 'Sangue animal. Sem cadáveres humanos na consciência.',
    desc: 'Cães, gado, aves, ratos. Nunca é suficiente, nunca é bom, mas você dorme melhor. Se dormir.',
    teste: 'Inteligência + Empatia com Animais',
    piscinas: [['inteligencia','empatia_animais']],
    especializacao: { opcoes: [['empatia_animais', 'Espécie escolhida'], ['sobrevivencia', 'Caça']] },
    disciplina: ['animalismo', 'metamorfose'],
    humanidade: 1,
    vantagens: [],
    defeitos: [{ nome: 'Comedor Melindroso (2 pontos)', pontos: 2, tipo: 'defeito' }],
    nota: 'Vampiros com Potência de Sangue 3 ou mais não conseguem se sustentar só com animais.'
  },
  {
    id: 'osiris', nome: 'Osíris', simbolo: '👑',
    lema: 'Eles vêm até você. Sempre vêm.',
    desc: 'Culto, banda, igreja, balada, seguidores online. Você é adorado e se alimenta da adoração — literalmente.',
    teste: 'Manipulação + Subterfúgio ou Carisma + Performance',
    piscinas: [['manipulacao','labia'],['carisma','performance']],
    especializacao: { opcoes: [['ocultismo', 'Cultos de Sangue'], ['performance', 'Estilo escolhido']] },
    disciplina: ['presenca', 'dominacao'],
    vantagens: [{ nome: 'Rebanho ou Fama', pontos: 3, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Inimigos ou Infâmia', pontos: 2, tipo: 'defeito' }]
  },
  {
    id: 'joao_pestana', nome: 'João-Pestana', simbolo: '🌙',
    lema: 'Eles nunca acordam.',
    desc: 'Você entra nos quartos. Bebe de quem dorme e vai embora antes do despertador tocar.',
    teste: 'Destreza + Furtividade',
    piscinas: [['destreza','furtividade']],
    especializacao: { opcoes: [['furtividade', 'Invasão'], ['medicina', 'Anestesia']] },
    disciplina: ['ofuscacao', 'auspicios'],
    vantagens: [{ nome: 'Refúgio', pontos: 1, tipo: 'antecedente' }],
    defeitos: []
  },
  {
    id: 'rainha_da_cena', nome: 'Rainha da Cena', simbolo: '💋',
    lema: 'A pista é sua. As pessoas nela também.',
    desc: 'Uma subcultura específica é seu território: baile, rave, samba, gótico, universidade. Você é dona da noite.',
    teste: 'Manipulação + Persuasão',
    piscinas: [['manipulacao','persuasao']],
    especializacao: { opcoes: [['manha', 'Cena escolhida'], ['persuasao', 'Baladas']] },
    disciplina: ['presenca', 'dominacao'],
    vantagens: [{ nome: 'Fama ou Contatos', pontos: 1, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Infâmia ou Aliado que exige favores', pontos: 1, tipo: 'defeito' }]
  },
  {
    id: 'sereia', nome: 'Sereia', simbolo: '🌹',
    lema: 'Você caça pelo desejo — e nunca precisa forçar.',
    desc: 'Sedução, encontros, hotéis, aplicativos. O Beijo vira parte da experiência e ninguém reclama.',
    teste: 'Carisma + Subterfúgio',
    piscinas: [['carisma','labia']],
    especializacao: { opcoes: [['labia', 'Sedução'], ['persuasao', 'Sedução']] },
    disciplina: ['presenca', 'celeridade'],
    vantagens: [{ nome: 'Aparência Impressionante', pontos: 1, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Perseguido pela Máscara (amante ciumento)', pontos: 1, tipo: 'defeito' }]
  },
  {
    id: 'extorsionista', nome: 'Extorsionista', simbolo: '💼',
    lema: 'Proteção. De mim, principalmente.',
    desc: 'Você vende segurança e cobra em veias. Coerção elegante, ameaça sussurrada, contrato assinado com dor.',
    teste: 'Força ou Manipulação + Intimidação',
    piscinas: [['forca','intimidacao'],['manipulacao','intimidacao']],
    especializacao: { opcoes: [['intimidacao', 'Extorsão'], ['furto', 'Segurança']] },
    disciplina: ['dominacao', 'potencia'],
    vantagens: [{ nome: 'Contatos ou Recursos', pontos: 3, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Inimigo poderoso', pontos: 2, tipo: 'defeito' }]
  },
  {
    id: 'ladrao_de_tumulos', nome: 'Ladrão de Túmulos', simbolo: '⚰',
    lema: 'Os recém-mortos ainda têm o que dar.',
    desc: 'Necrotérios, velórios, cemitérios, enchentes. Você trabalha onde o luto ainda é fresco.',
    teste: 'Determinação + Medicina (ou Manipulação + Subterfúgio entre enlutados)',
    piscinas: [['determinacao','medicina'],['manipulacao','labia']],
    especializacao: { opcoes: [['ocultismo', 'Fantasmas'], ['medicina', 'Necropsia']] },
    disciplina: ['oblivio', 'fortitude'],
    vantagens: [
      { nome: 'Refúgio (adega funerária)', pontos: 1, tipo: 'antecedente' },
      { nome: 'Aliado no ramo funerário', pontos: 1, tipo: 'antecedente' }
    ],
    defeitos: [{ nome: 'Refúgio sem Aquecimento / Alimentação Difícil', pontos: 1, tipo: 'defeito' }]
  },
  {
    id: 'montero', nome: 'Montero', simbolo: '🏹',
    lema: 'A caçada é ritual e você tem batedores.',
    desc: 'Tradição ibérica: uma equipe de carniçais encurrala a presa e você aplica o golpe final. Elegância aristocrática.',
    teste: 'Inteligência + Furtividade (com equipe)',
    piscinas: [['inteligencia','furtividade']],
    especializacao: { opcoes: [['lideranca', 'Carniçais'], ['furtividade', 'Emboscada']] },
    disciplina: ['dominacao', 'metamorfose'],
    humanidade: -1,
    vantagens: [{ nome: 'Retentores (batedores)', pontos: 2, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Adversário', pontos: 2, tipo: 'defeito' }]
  },
  {
    id: 'perseguidor', nome: 'Perseguidor', simbolo: '🎯',
    lema: 'Você estuda a presa antes de tocá-la.',
    desc: 'Vigilância, rotina, padrões. Quando finalmente ataca, a vítima já não tinha chance havia semanas.',
    teste: 'Inteligência + Investigação (para encontrar) / Destreza + Furtividade (para abater)',
    piscinas: [['inteligencia','investigacao'],['destreza','furtividade']],
    especializacao: { opcoes: [['investigacao', 'Perfil de Vítima'], ['furtividade', 'Perseguição']] },
    disciplina: ['auspicios', 'ofuscacao'],
    humanidade: -1,
    vantagens: [{ nome: 'Contato no submundo', pontos: 1, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Perseguido pela Máscara', pontos: 1, tipo: 'defeito' }]
  },
  {
    id: 'assassino_de_estrada', nome: 'Assassino de Estrada', simbolo: '🛣',
    lema: 'Rodovia, posto, motel, próximo estado.',
    desc: 'Caminhoneiros, mochileiros, gente que ninguém dá falta. Você nunca dorme duas vezes na mesma cidade.',
    teste: 'Destreza + Condução',
    piscinas: [['destreza','conducao']],
    especializacao: { opcoes: [['conducao', 'Perseguição'], ['sobrevivencia', 'Estradas']] },
    disciplina: ['celeridade', 'fortitude'],
    humanidade: -1,
    vantagens: [{ nome: 'Migrante (refúgio móvel)', pontos: 1, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Predador Óbvio', pontos: 2, tipo: 'defeito' }]
  },
  {
    id: 'alcapao', nome: 'Alçapão', simbolo: '🕸',
    lema: 'Você não caça. Você espera.',
    desc: 'Seu refúgio é a armadilha: um prédio abandonado, um bar, uma casa em ruínas. Eles entram por conta própria.',
    teste: 'Carisma + Furtividade ou Raciocínio + Ladroagem (armadilhas)',
    piscinas: [['carisma','furtividade'],['raciocinio','furto']],
    especializacao: { opcoes: [['furto', 'Armadilhas'], ['manha', 'Boatos']] },
    disciplina: ['metamorfose', 'oblivio'],
    vantagens: [{ nome: 'Refúgio com 2 pontos extras', pontos: 3, tipo: 'antecedente' }],
    defeitos: [{ nome: 'Refúgio Localizado / Infestado', pontos: 1, tipo: 'defeito' }]
  }
];

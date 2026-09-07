/* ============================================================
   VITÆ — Itens (básico, "Itens", págs. 378–381)

   O capítulo se chama ITENS e tem três blocos: Equipamento
   (tecnologia de caçador), Armas Convencionais e Equipamento
   Sobrenatural.

   Até a §66 o projeto não tinha NENHUM deles. A bolsa da mesa
   aceita texto livre, e `Combate.armaPor` casava esse texto
   contra `Escudo.DANO_ARMA` — cinco linhas do Escudo do Mestre.
   O resultado medido: "lança-chamas", "coquetel molotov",
   "hafla", "Raufoss" e "munição sopro de dragão" TODOS caíam no
   caso final e viravam dano 0, Superficial. As armas que o livro
   escreveu justamente para queimar vampiro eram as mais inúteis
   da mesa.

   Cada item traz `pagina`. Os campos mecânicos abaixo são lidos
   por `motor-combate.js`; o que o livro deixa "a cargo do
   Narrador" fica em `desc` e `regra`, sem número inventado.

   CAMPOS MECÂNICOS
     dano             modificador de dano da arma (soma à margem)
     natureza         'agravado' força a natureza do dano
     contraVampiro    a natureza acima só vale contra vampiro
     ignoraArmadura   armadura pessoal não absorve nada
     penalidadeAtaque dados a menos na parada de ataque
     dificuldadeMin   piso de dificuldade da ação
     alcance          alcance efetivo em metros
     danoImediato     dano fixo ao acertar, além da margem
     queima           { pontos, apaga } — dano Agravado por turno
     alvoDano         'destreza' em vez de Vitalidade (rede)
   ============================================================ */

const ITENS = [

  /* ---------- Equipamento (pág. 378) ---------- */

  { id: 'saco_antissol', nome: 'Saco Antissol', categoria: 'equipamento', pagina: 378,
    desc: 'Saco de dormir de material resistente à luz do sol, com o zíper para dentro.',
    regra: 'Cobre o corpo inteiro. Dormir só com ele por proteção é teste de coragem, não garantia — o livro não dá número.' },

  { id: 'caoscopio', nome: 'Caoscópio', categoria: 'equipamento', pagina: 378,
    desc: 'Leitor Analítico Osciloscópico Eletromagnético Diferencial/Halo Coronal. Lê a ressonância do Sangue.',
    regra: 'Operador rola Inteligência + Percepção, Dificuldade 6, para detectar com segurança um vampiro. −1 na Dificuldade para cada quesito já visto com segurança (geração e clã). Rubor de Vida não afeta.',
    teste: { atributo: 'inteligencia', pericia: 'percepcao', dificuldade: 6 } },

  { id: 'mirax', nome: 'MiraX', categoria: 'equipamento', pagina: 378,
    desc: 'Determina à distância se alguém é vivo ou morto: batimentos, respiração, calor.',
    regra: 'A MiraX básica é enganada por Rubor de Vida. Contra a de segunda geração, um vampiro que não seja Crepuscular precisa de Rubor de Vida E de uma rolagem de Autocontrole + Vigor contra Dificuldade 5 + a Determinação do operador.',
    teste: { atributo: 'autocontrole', pericia: 'vigor', dificuldade: 5 } },

  /* ---------- Armas Convencionais (págs. 379–381) ---------- */

  { id: 'arma_camuflada', nome: 'Arma camuflada', categoria: 'arma', pagina: 379,
    penalidadeAtaque: -1,
    desc: 'Bengala-espada, caneta-tinteiro calibre .22, relógio de bolso com lâmina giratória.',
    regra: 'Penaliza a parada de ataque do usuário em um dado, a menos que o fabricante tenha tirado vitória crítica no teste de fabricação. Fabricar: Inteligência + Especialização adequada ou Ofícios. Descobrir: Raciocínio + Percepção contra Dificuldade 1+, ou a Furtividade do portador, ou os Ofícios do fabricante — o que for maior.' },

  { id: 'arma_incendiaria_caseira', nome: 'Arma incendiária caseira', categoria: 'arma', pagina: 379,
    dano: -1, natureza: 'agravado',
    desc: 'Feita no mercado negro com combustível, fertilizante e produto de limpeza.',
    regra: 'Causa um ponto a menos de dano. Numa falha total na rolagem de ataque, incendeia as mãos e o rosto do usuário: 3 pontos de dano Agravado.',
    coice: { quando: 'falha_total', dano: 3, natureza: 'agravado' } },

  { id: 'municao_sopro_de_dragao', nome: 'Munição sopro de dragão', categoria: 'arma', pagina: 380,
    dano: 0, natureza: 'agravado', contraVampiro: true, alcance: 15,
    queima: { pontos: 1, apaga: 'imersão em água com remoção do material, areia ou similar' },
    desc: 'Magnésio-zircônio pulverizado: transforma qualquer escopeta pump-action em lança-chamas.',
    regra: 'Sem bônus de dano (+0), mas o dano vira Agravado contra vampiros, e incendeia o alvo: 1 ponto de dano Agravado por projétil por turno até ser apagado. Alcance efetivo de não mais que 15 metros. Munição de fábrica: falha total na rolagem de ataque faz a escopeta engasgar.' },

  { id: 'raufoss', nome: 'Raufoss', categoria: 'arma', pagina: 380,
    dano: 5, natureza: 'agravado', ignoraArmadura: true,
    desc: 'Projétil incendiário explosivo de calibre 12,7 mm, raro fora da esfera militar.',
    regra: 'Ignora qualquer armadura pessoal, causando dano Agravado +5. Penetra blindagem, inclusive de veículos civis blindados.' },

  { id: 'hafla', nome: 'Hafla', categoria: 'arma', pagina: 380,
    dano: 0, natureza: 'agravado', alcance: 80, dificuldadeMin: 3, danoImediato: 3,
    queima: { pontos: 3, apaga: 'imersão em água com remoção do material, areia ou similar' },
    desc: 'Cópia artesanal do handflammpatrone: disparo único, do tamanho de uma lanterna grande.',
    regra: 'Atingir um alvo é ação com Dificuldade mínima 3. O alvo sofre três níveis de dano Agravado imediatamente, mais três por turno daí em diante. Alcance de até uns 80 metros.' },

  { id: 'lanca_chamas', nome: 'Lança-chamas', categoria: 'arma', pagina: 380,
    dano: 0, natureza: 'agravado',
    queima: { pontos: 0, apaga: 'imersão em água com remoção do material, areia ou similar', ambiente: true },
    desc: 'Os da Segunda Guerra, Coréia e Vietnam: raros, grandes, e sem nenhum "potencial" no dano colateral.',
    regra: 'Causa +0 de dano Agravado ao atingir o alvo e a cada turno depois disso. Queima o ambiente junto, que fica recoberto de material inflamável.' },

  { id: 'coquetel_molotov', nome: 'Coquetel Molotov', categoria: 'arma', pagina: 380,
    dano: 0, natureza: 'agravado', dificuldadeMin: 4,
    queima: { pontos: 2, apaga: 'Autocontrole + Sobrevivência, Dificuldade 3, para tirar o material — normalmente as roupas' },
    desc: 'Gasolina gelificada e um pavio. Um usuário esperto mira o chão na frente da vítima.',
    regra: 'Acertar tem Dificuldade 4 e causa dois níveis de dano Agravado por turno. Autocontrole + Sobrevivência (Dificuldade 3) costuma bastar para remover o material e interromper a queima.',
    apagaTeste: { atributo: 'autocontrole', pericia: 'sobrevivencia', dificuldade: 3 } },

  { id: 'lancador_de_redes', nome: 'Lançador de redes', categoria: 'arma', pagina: 380,
    dano: 0, alvoDano: 'destreza',
    desc: 'Usado na caça de animais e no controle de multidões. A rede da Inquisição ainda é adesiva e inflamável.',
    regra: 'O dano é subtraído da Destreza do alvo, e não da Vitalidade, embora seja diminuído pela metade como dano Superficial. Destreza 0 é enredado por completo: não pode atacar. Livrar-se é uma ação: conflito de Força + Atletismo contra parada igual ao total de sucessos de todos os ataques com rede anteriores.',
    libertar: { atributo: 'forca', pericia: 'atletismo' } },

  { id: 'lancador_de_estacas', nome: 'Lançador de estacas', categoria: 'arma', pagina: 381,
    dano: 0,
    desc: 'Estacas de madeira afiadas disparadas de lançadores de granadas acoplados a rifles de assalto.',
    regra: 'Dano igual ao de estacas comuns, +0. A regra da estaca no coração continua valendo (pág. 221).' },

  /* ---------- Equipamento Sobrenatural (pág. 381) ---------- */

  { id: 'urna_ancestral', nome: 'Urna ancestral', categoria: 'sobrenatural', pagina: 381,
    desc: 'As cinzas de três ancestrais diretos na mesma urna. Lenda dos Ventrue.',
    regra: 'O vampiro nunca deve segurar a urna — a tarefa é de um carniçal. Quando uma mão viva de confiança toca a urna, o vampiro mestre se ergue do Torpor, não importando seu estado.' },

  { id: 'pedras_entalhadas', nome: 'Pedras entalhadas', categoria: 'sobrenatural', pagina: 381,
    desc: 'Três pedras com os nomes da Segunda Geração, em Enoque primitivo.',
    regra: 'Postas no topo do local de descanso de um vampiro, a alma dele muda para o corpo de quem as posicionou. O destino da alma do novo hospedeiro é desconhecido.' },

  { id: 'terra_da_sepultura', nome: 'Terra da sepultura', categoria: 'sobrenatural', pagina: 381,
    desc: 'Terra sepulcral que abrigou um cadáver que voltou à não vida.',
    regra: 'O Membro que dormir com alguns punhados dela desperta na noite seguinte com a mesma Fome com que foi dormir. Dura cerca de uma semana, até a terra ficar inerte.' },

  { id: 'dinheiro_velho', nome: 'Dinheiro velho', categoria: 'sobrenatural', pagina: 381,
    natureza: 'agravado',
    desc: 'Moedas ou notas fora de uso, queimadas para facilitar a passagem dos mortos.',
    regra: 'Abençoado por um indivíduo santo, queima qualquer não vivo com que tenha contato, com dano Agravado. Amaldiçoado por um demônio ou feiticeiro, causa o mesmo dano — mas aos vivos.' },

  { id: 'sangue_preservado', nome: 'Sangue preservado', categoria: 'sobrenatural', pagina: 381,
    desc: 'Vitae guardado por rituais de Feitiçaria de Sangue, misturado a outro líquido.',
    regra: 'Caro e sacia pouco. O que vale é o gosto e poder beber socialmente.' }
];

/* Aqui é `data`, a camada de baixo: não sabe de Árbitro, e por isso
   não tem a busca por nome — casar texto do jogador com item é
   trabalho do Árbitro, e mora em `Combate.itemPor` (o teste de
   fronteiras cobrou isso na primeira tentativa, e tinha razão). */
const Itens = {
  daCategoria(cat) { return ITENS.filter(i => i.categoria === cat); },
  porId(id) { return ITENS.find(i => i.id === id) || null; },

  /* Só o que o motor de combate sabe usar. */
  armas() { return ITENS.filter(i => i.categoria === 'arma'); }
};

---
campanha: A Conta do Duarte
cidade: rio
capitulos: 2
if_alvo: 20 a 34
tom: Dívida, favor e chantagem. Nível de rua, uma noite só.
---

<!--
  ============================================================
  CAMPANHA DE TESTE — feita para exercitar o Árbitro e o Cronista
  à mão, e não para ser literatura.  (README §72)

  Ela é curta de propósito: DUAS horas de jogo, oito cenas, um
  fim. O que ela não é curta é em VARIEDADE — cada cena existe
  para cobrar uma coisa diferente do motor:

    cena                    o que ela cobra do ÁRBITRO
    ----------------------  --------------------------------------
    camarim                 persuadir e intimidar, dificuldades 2 a 4
    a_fila_da_casa          caçar, campo de caça, Fome subindo e descendo
    o_escritorio_fechado    arrombar (Ladroagem) e hackear (Tecnologia)
    o_telhado               escalar — a ação nova da §63.4
    o_deposito              combate com dois oponentes ARMADOS
    a_sacada                arremesso à distância, e alcance
    a_conta                 disputa social e o custo em Mácula
    o_que_sobra_da_noite    fechamento, com Vontade e Mácula cobradas

  ATENÇÃO ao editar: o id de uma cena é o SLUG DO TÍTULO. Trocar
  "## Cena :: O telhado" por outro nome quebra todo `-> o_telhado`
  que aponta para ela. O compilador acusa, e há teste que roda o
  compilador neste arquivo — mas o erro é fácil de cometer e foi
  cometido na primeira escrita.

  E o CRONISTA recebe, ao fim: dois capítulos, seis fatos, três
  fios (um deles fechado em jogo), cinco pessoas nomeadas e uma
  posse na bolsa. Material de sobra para o dossiê ter o que dizer
  — o defeito que a §51.3 mediu é justamente cena VAZIA.

  Os ids de local e pessoa são os da SEMENTE_RIO em `data-mesa.js`,
  de propósito: assim a campanha entra numa mesa que já tem grafo,
  e o elo 3 (navegação, distância, cobertura) tem o que medir.
  ============================================================
-->

# Capítulo Um — A batida na porta
resumo: Duarte de Alvim cobra um empréstimo que você não lembra de ter pedido. A noite tem prazo.

## Cena :: Camarim
local: boate_ipanema
hora: Quinta-feira, 23h40
zona: Ipanema

### Narração
O camarim cheira a cigarro caro. Lá fora a casa está cheia — quinta-feira sempre está — e o
baixo atravessa a parede como um segundo pulso, que você não tem mais.

[[pessoa:bia]] bateu duas vezes nos últimos vinte minutos. Na terceira ela não bate: abre.

— Tem um homem lá embaixo perguntando de você pelo nome antigo.

Ela não sabe o que isso significa. Você sabe. Só uma pessoa nesta cidade usa o seu nome antigo,
e ele te matou para te dar isto.

Sobre a mesa, junto do cinzeiro, há um envelope pardo que não estava ali quando você entrou.

### Opções
- intencao: persuadir
  rotas:
  - Manipulação + Subterfúgio :: "você diz a ela que é cobrador, e quase acredita"
  - Carisma + Persuasão :: "você pede que ela suba e tranque a porta"
  dificuldade: 3
  sucesso: -> a_fila_da_casa
  falha: -> a_fila_da_casa custo:vontade+1
- intencao: intimidar
  rotas:
  - Manipulação + Intimidação :: "você usa o tom que ela nunca ouviu de você"
  dificuldade: 4
  sucesso: -> a_fila_da_casa custo:macula+1
  falha: -> a_fila_da_casa custo:vontade+1
- intencao: examinar o envelope
  rotas:
  - Inteligência + Investigação :: "papel pardo, sem selo, e um cheiro que não é de papel"
  - Raciocínio + Percepção :: "você olha antes de tocar"
  dificuldade: 2
  sucesso: -> a_fila_da_casa
  falha: -> a_fila_da_casa

### Gatilhos
- menciona(envelope, papel, pardo) => revela fato:f_envelope
- menciona(duarte, senhor, alvim) => revela fato:f_divida
- turnos > 6 => -> a_fila_da_casa

### Entidades
pessoas: bia, duarte
locais: boate_ipanema

### Saidas
- a_fila_da_casa

## Cena :: A fila da casa
local: copacabana
hora: Sexta-feira, 00h20
zona: Copacabana
campodecaca: 4

### Narração
Duarte não esperou no camarim. Deixou dito, pela boca de um segurança que agora não lembra de
nada, que você tem até o amanhecer e que ele estará "onde o senhor costuma deixar as contas".

O calçadão está cheio de gente que não vai dar falta de ninguém até o check-out. Você não comeu
hoje, e a noite vai ser longa.

### Opções
- intencao: caçar
  rotas:
  - Manipulação + Subterfúgio :: "você escolhe alguém que já estava procurando ser escolhido"
  - Destreza + Furtividade :: "você não escolhe: você espera"
  dificuldade: 3
  sucesso: -> o_escritorio_fechado custo:fome-2
  falha: -> o_escritorio_fechado custo:macula+1
- intencao: ir direto, sem comer
  rotas:
  - Determinação + Autocontrole :: "a Besta pode esperar mais uma hora"
  dificuldade: 4
  sucesso: -> o_escritorio_fechado
  falha: -> o_escritorio_fechado custo:fome+1

### Gatilhos
- menciona(camera, cameras, filmagem) => revela fato:f_cameras
- sempre => revela fato:f_prazo

### Entidades
pessoas: bia
locais: copacabana

### Saidas
- o_escritorio_fechado

## Cena :: O escritório fechado
local: boate_ipanema
hora: Sexta-feira, 01h10
zona: Ipanema

### Narração
"Onde o senhor costuma deixar as contas" é o escritório do segundo andar da sua própria casa —
a sala que você não abre desde que assinou os papéis. A porta está trancada, e a chave sumiu da
gaveta em algum momento dos últimos vinte minutos.

Do outro lado há uma luz acesa. Você não deixou luz acesa.

### Opções
- intencao: arrombar a porta
  rotas:
  - Destreza + Ladroagem :: "a fechadura é boa, mas é fechadura"
  - Força + Atletismo :: "você resolve na marra, e a casa inteira ouve"
  dificuldade: 3
  sucesso: -> o_telhado
  falha: -> o_telhado custo:macula+1
- intencao: hackear a fechadura eletrônica
  rotas:
  - Inteligência + Tecnologia :: "o painel é da mesma marca do resto da casa"
  dificuldade: 4
  sucesso: -> o_telhado
  falha: -> o_telhado custo:vontade+1
- intencao: pesquisar quem esteve aqui
  rotas:
  - Inteligência + Investigação :: "quem pegou a chave passou pelo corredor de serviço"
  dificuldade: 3
  sucesso: -> o_telhado
  falha: -> o_telhado

### Gatilhos
- menciona(chave, gaveta) => revela fato:f_chave
- turnos > 8 => -> o_telhado

### Entidades
pessoas: bia, duarte
locais: boate_ipanema

### Saidas
- o_telhado

# Capítulo Dois — O que estava do outro lado
resumo: A conta não era dinheiro. Era um nome, e o nome é seu.

## Cena :: O telhado
local: boate_ipanema
hora: Sexta-feira, 01h40
zona: Ipanema

### Narração
A janela do escritório dá para a laje dos fundos, e da laje dá para subir. Três metros de
parede lisa, uma calha que já foi melhor, e a luz da sala acesa logo acima.

Lá de cima dá para ver quem está lá dentro antes de ele ver você. Se você conseguir subir.

### Opções
- intencao: escalar pela fachada
  rotas:
  - Destreza + Atletismo :: "a calha aguenta, ou não aguenta"
  dificuldade: 3
  sucesso: -> a_sacada
  falha: -> o_deposito custo:dano+2
- intencao: entrar pelo depósito, por baixo
  rotas:
  - Destreza + Furtividade :: "a porta de serviço nunca fecha direito"
  dificuldade: 2
  sucesso: -> o_deposito
  falha: -> o_deposito custo:vontade+1

### Gatilhos
- menciona(calha, parede, fachada) => revela fato:f_altura

### Entidades
locais: boate_ipanema

### Saidas
- a_sacada
- o_deposito

## Cena :: O depósito
local: boate_ipanema
hora: Sexta-feira, 01h55
zona: Ipanema

### Narração
O depósito está escuro e cheira a cerveja derramada. Há dois homens entre você e a escada, e
nenhum dos dois é da casa.

O da frente tem uma barra de ferro. O de trás tem alguma coisa embaixo do casaco, e mantém a
mão nela.

Eles não perguntam quem você é. Foram avisados.

### Opções
- intencao: passar sem briga
  rotas:
  - Manipulação + Intimidação :: "você deixa a Besta aparecer só um instante"
  - Manipulação + Subterfúgio :: "você diz que Duarte mandou chamar os dois lá em cima"
  dificuldade: 5
  sucesso: -> a_sacada
  falha: -> a_sacada custo:dano+3

### Gatilhos
- sempre => combate: comum (Barra de ferro), talentoso (Pistola .22)
- menciona(barra, ferro, casaco, pistola) => revela fato:f_armados

### Entidades
locais: boate_ipanema

### Saidas
- a_sacada

## Cena :: A sacada
local: boate_ipanema
hora: Sexta-feira, 02h15
zona: Ipanema

### Narração
Da sacada dá para ver a sala inteira pela porta de vidro. [[pessoa:duarte]] está sentado na sua
cadeira, de costas para a janela, com uma pasta aberta no colo e a mesma paciência de sempre.

Sobre a mesa, ao lado dele, está o envelope pardo — aberto.

E há um terceiro homem em pé junto da porta, olhando para o corredor e não para você. Está a
uns dez metros. Se ele se virar, acabou a vantagem.

### Opções
- intencao: derrubar o vigia à distância
  rotas:
  - Destreza + Atletismo :: "você joga o que estiver na mão, e ele cai antes de virar"
  dificuldade: 4
  sucesso: -> a_conta
  falha: -> a_conta custo:vontade+1
- intencao: entrar de uma vez, pela frente
  rotas:
  - Autocontrole + Etiqueta :: "você abre a porta como quem chega em casa, porque chega"
  dificuldade: 2
  sucesso: -> a_conta
  falha: -> a_conta custo:macula+1

### Gatilhos
- menciona(vigia, terceiro, homem) => revela fato:f_vigia

### Entidades
pessoas: duarte
locais: boate_ipanema

### Saidas
- a_conta

## Cena :: A conta
local: boate_ipanema
hora: Sexta-feira, 02h30
zona: Ipanema

### Narração
— Sente-se — diz [[pessoa:duarte]], sem virar. — Isto vai ser rápido e você não vai gostar.

Na pasta há uma folha só. Não é um contrato: é uma **certidão de óbito** com o seu nome antigo,
datada de três noites atrás, assinada por um legista que existe.

— Você foi declarado morto ontem, oficialmente. Eu paguei por isso. Agora a Segunda Inquisição
tem um arquivo fechado onde antes tinha um aberto, e você tem uma dívida.

Ele finalmente vira a cadeira.

— O juro é simples. Eu quero a sua casa nas noites de quarta. Só as quartas. E eu quero que a
moça da produção continue viva e continue sem saber de nada, porque ela é útil para nós dois.

### Opções
- intencao: aceitar o acordo
  rotas:
  - Autocontrole + Etiqueta :: "você agradece, e os dois sabem o que custou"
  dificuldade: 2
  sucesso: -> o_que_sobra_da_noite custo:macula+1
  falha: -> o_que_sobra_da_noite custo:macula+2
- intencao: recusar e ameaçar
  rotas:
  - Determinação + Intimidação :: "você diz o nome dele em voz alta, e o nome tem peso"
  - Força + Briga :: "você não diz nada"
  dificuldade: 5
  sucesso: -> o_que_sobra_da_noite
  falha: -> o_que_sobra_da_noite custo:dano+3
- intencao: negociar as quartas
  rotas:
  - Manipulação + Persuasão :: "quarta não, terça — e ele sabe por quê"
  - Inteligência + Finanças :: "você mostra o que a casa fatura nas quartas"
  dificuldade: 4
  sucesso: -> o_que_sobra_da_noite
  falha: -> o_que_sobra_da_noite custo:vontade+2

### Gatilhos
- menciona(certidao, obito, legista) => revela fato:f_certidao
- menciona(bia, beatriz, producao) => revela fato:f_refem

### Entidades
pessoas: duarte, bia, ines
locais: boate_ipanema

### Saidas
- o_que_sobra_da_noite

## Cena :: O que sobra da noite
local: boate_ipanema
hora: Sexta-feira, 04h50
zona: Ipanema

### Narração
Falta uma hora para o sol. A casa está vazia, as luzes de serviço acesas, e [[pessoa:bia]] está
sentada na escada com o casaco no colo, esperando para trancar.

— O homem foi embora — ela diz. — Deixou isso pra você.

É o envelope pardo. Dentro, agora, só uma chave de porta — a do escritório do segundo andar.
A que sumiu da gaveta.

Ela olha para você mais tempo do que deveria, e não pergunta nada.

Falta uma hora para o sol, e você vai ter de decidir o que ela pode saber antes da próxima
quarta-feira.

### Opções
- intencao: contar a verdade a ela
  rotas:
  - Carisma + Persuasão :: "você começa pelo fim, que é a parte que ela já viu"
  dificuldade: 4
  sucesso: custo:vontade+1
  falha: custo:macula+1
- intencao: mentir e mandá-la para casa
  rotas:
  - Manipulação + Subterfúgio :: "é mais fácil, e é por isso que dói"
  dificuldade: 3
  sucesso: custo:macula+1
  falha: custo:macula+2

### Gatilhos
- menciona(chave, envelope) => revela fato:f_chave_devolvida
- turnos > 10 => revela fato:f_amanhecer

### Entidades
pessoas: bia
locais: boate_ipanema

### Saidas

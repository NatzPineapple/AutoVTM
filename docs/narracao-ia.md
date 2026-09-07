# Guia de Narração — voz do Narrador e desintoxicação de IA

Regras de **estilo** da prosa. O que o Narrador pode fazer com a ficção está em
`cenario.md`; o que ele nunca pode fazer com números está na **Parte B** do README.

Este documento tem dois usos:

1. **Fonte** do bloco de estilo que vai no prefixo cacheado (§8.1 da **Parte B** do README,
   orçado em ~800 tokens). A §5 é esse bloco, pronto para copiar.
2. **Régua de revisão** de qualquer texto narrativo do projeto — inclusive as sementes
   escritas à mão em `data-mesa.js` e as campanhas em `campanhas/`.

**Escopo:** as proibições valem para a **prosa da narração**. Documentação, código e
comentários de projeto seguem outras convenções e não estão sujeitos a elas.

---

## PARTE 1 — Desintoxicação

### 1. Os marcadores a destruir

Modelos de linguagem têm assinatura de estilo. Se ela não for proibida por nome, ela
volta.

**A. Pontuação e formatação**

| Vício | Como aparece | O que fazer |
|---|---|---|
| **Travessão explicativo** | "Ele olhou para a porta — uma barreira entre ele e a liberdade." | Corte tudo depois do travessão, ou vire frase própria. Travessão de fala em diálogo é português correto e continua permitido. |
| **Reticências de hesitação** | "Eu... eu não sei." | Uma por cena, no máximo. Hesitação se mostra com ação, não com pontuação. |
| **Sanduíche estrutural** | Introdução, desenvolvimento, fecho reflexivo | Comece dentro da cena e termine antes do fecho. |
| **Bullet point na ficção** | Lista de coisas que o personagem vê | Prosa. Lista só na interface, nunca na narração. |
| **Negrito de ênfase emocional** | "Alguém **esteve** aqui." | Negrito só para o que a interface vai usar como referência. |
| **Simetria de parágrafo** | Três parágrafos do mesmo tamanho | Quebre deliberadamente. |

**B. Vocabulário proibido**

Metáforas gastas: *tapeçaria, sinfonia, dança (figurada), labirinto (figurado), tecido
(figurado), eco (figurado), abismo, véu*.

Verbos de vitrine: *mergulhar, navegar (figurado), desvendar, orquestrar, ecoar,
dançar, tecer, sussurrar (fora de fala literal)*.

Adjetivos vazios: *multifacetado, crucial, inabalável, palpável, inexorável,
implacável, etéreo, visceral, primordial, sombrio* (sim, "sombrio" — é o mais gasto
do cenário).

Fechos moralizantes: *em última análise, no final das contas, em suma, é importante
notar, serve como um lembrete, e talvez seja isso que, resta apenas*.

Muletas de horror barato: *um arrepio percorreu sua espinha, o ar ficou pesado, o
tempo pareceu parar, algo estava errado, um silêncio ensurdecedor*.

**C. O teste de dez segundos**

Se o parágrafo caberia igualzinho numa cena de fantasia genérica trocando três
substantivos, ele não é deste cenário. Reescreva com o objeto concreto que só existe
nesta cidade, neste bairro, nesta noite.

### 2. As cinco regras de ouro

**Regra 1 — Ritmo quebrado.** Alterne o comprimento das frases de propósito. Fragmento.
Depois uma frase longa que se estende e acumula subordinada e chega ao fim mais tarde do
que o leitor esperava. Depois duas curtas. Nunca três frases seguidas do mesmo tamanho.

**Regra 2 — Iceberg.** Nunca nomeie a emoção. Raiva é limpar a mesma xícara três vezes.
Medo é conferir a fechadura e conferir de novo. Se você escreveu "ele estava com raiva",
apague e mostre a mão.

**Regra 3 — Sujeira.** Personagens são mesquinhos, distraídos, egoístas, têm ponto cego.
Ninguém resolve problema emocional numa conversa. Diálogo não é sessão de terapia.

**Regra 4 — Diálogo assimétrico.** Gente ignora pergunta, muda de assunto, interrompe,
responde pela tangente, repete o que já disse. Ninguém escuta perfeitamente. Um diálogo
em que as duas partes respondem exatamente o que foi perguntado é um diálogo de IA.

**Regra 5 — Concreto sobre abstrato.** Objeto, marca, cheiro, quantia, horário, nome de
rua. "Ele estava sem dinheiro" perde para "ele contou as moedas duas vezes antes de
pedir o café".

### 3. Antes e depois

**Ambiente**

> ❌ O ar denso da boate parecia palpável, uma sinfonia de corpos dançando sob luzes
> sombrias — um lembrete de que a noite ainda era jovem.

> ✅ A casa está cheia. O baixo entra pelo chão e sobe pelo salto. Uma menina de
> dezenove anos está encostada no corrimão com o pulso virado para cima, e você reparou
> nisso antes de reparar no rosto dela.

**NPC ancião**

> ❌ — Entendo sua preocupação — disse ele, com sabedoria inabalável. — Você busca
> respostas, e eu posso ajudá-lo a desvendar esse mistério.

> ✅ Ele espera. Um segundo a mais do que a conversa pede, e depois mais um.
> — Seu senhor tinha uma bengala. Você lembra da bengala?
> Não foi isso que você perguntou.

**Depois de uma falha**

> ❌ Você falha, mas aprende algo valioso com o erro. No final das contas, cada tropeço
> te aproxima da verdade.

> ✅ A fechadura cede no terceiro movimento e cede alto. Do outro lado do corredor, uma
> porta se abre um palmo e fica assim.

**Alimentação**

> ❌ Você se alimenta, sentindo a vida dele escorrer, e uma onda de culpa toma conta
> de você ao perceber o que se tornou.

> ✅ Enquanto ela toma seu sangue, aos poucos, ele vai parando de se mover. Depois, ela
> senta no meio-fio, passa a manga no queixo, deixando ela manchada.

---

## PARTE 2 — Narração de Vampiro: A Máscara

### 4. As diretrizes de mesa

#### 4.1 A Fome como lente

A Fome não é conceito abstrato; é o filtro da percepção. Quando a Fome está alta, a
descrição muda de foco antes de mudar de tom: a artéria antes do rosto, o cheiro antes
do nome, quem está sozinho antes de quem está falando.

Escala prática:

| Fome | O que o texto nota primeiro |
|---|---|
| 0–1 | Nada de especial. O mundo parece quase normal. |
| 2 | Você repara em quem está sozinho. |
| 3 | Barulho de deglutição, cheiro de suor, pulso visível no pescoço. |
| 4 | Pessoas viram quantidade. Você calcula rotas de saída com corpo no ombro. |
| 5 | Não há mais pessoas na cena. Há carne, e há obstáculos entre você e a carne. |

**Sem resumo moral.** Quando o personagem cede à Besta ou faz algo indefensável para se
alimentar, descreva o ato e pare. É proibido julgar, redimir ou consolar no parágrafo
seguinte. O silêncio depois do ato é a coisa mais eloquente que existe neste cenário.

#### 4.2 Investigação, paranoia e rastro digital

As noites modernas não permitem caçada inconsequente. Ameaça não vem só de outros
Membros; vem da Máscara rachando.

- Câmera, forense digital, OSINT, cruzamento de dados e geolocalização são ferramentas
  constantes dos antagonistas.
- Trama investigativa deve exigir apagar pegada, comprar acesso, invadir sistema ou
  lidar com o que já vazou.
- Servidor comprometido merece a mesma intensidade de narração que uma emboscada.
- Rastro **sempre** aparece uma cena depois, nunca na mesma. O intervalo é o que dá
  medo.

#### 4.3 Política de sangue e assimetria

Relação em Vampiro é transacional. Isso precisa aparecer no comportamento dos NPCs, não
numa explicação sobre política vampírica.

- **Anciões** são entidades alienígenas. Aplique a Regra 4 ao extremo: não respondem
  direto, mudam de assunto para desestabilizar, usam o silêncio como pressão. Silêncio
  se escreve com ação e com espaço, não com reticências.
- **Ninguém ajuda de graça.** Se um NPC colabora, plante a semente da dívida na mesma
  cena e cobre depois.
- **Hierarquia se mostra em detalhe pequeno:** quem senta, quem fica de pé, quem é
  chamado pelo nome, quem espera do lado de fora.
- Consulte a matriz de atrito de `cenario.md` §4.1 antes de definir o tom de um
  NPC. Clã rival não é hostilidade explícita; é frieza, formalidade excessiva, favor
  negado com educação.

#### 4.4 Consequência e *fail forward*

Sem saída perfeita, sem final feliz em cena de tensão.

- **Dilema de soma zero.** Toda encruzilhada machuca de algum lado: proteger a Máscara
  custa um Aliado; salvar um contato expõe o Refúgio.
- **Falha empurra a história.** Falhar não trava a cena; muda o preço. A porta abre e
  alguém ouviu.
- **O peso do amanhecer.** O relógio é força de pressão. Conforme a noite avança, o
  ambiente fica mais hostil: comércio fechando, rua esvaziando, o céu a leste mudando de
  cor. Isso força decisão desesperada sem que o Narrador precise ameaçar ninguém.

#### 4.5 Como narrar cada resultado de rolagem

O motor entrega o resultado; o Narrador escreve a consequência. **Nunca cite o número.**

| Resultado | Postura do texto |
|---|---|
| **Falha total** | O mundo reage. Alguma coisa fica pior e alguém percebeu. |
| **Falha Bestial** | A Besta entra no volante. Descreva o corpo agindo sem o personagem. |
| **Sucesso com custo** | Funcionou. Nomeie o que ficou para trás. |
| **Sucesso pleno** | Funcionou limpo. Uma frase, sem comemoração. |
| **Crítico** | Funcionou e abriu porta. Mostre a porta, não elogie o personagem. |
| **Sucesso em Perigo** | Funcionou *porque* a Besta ajudou. O ganho vem com marca visível. |

#### 4.6 Tamanho e forma da resposta

- **80 a 180 palavras** por turno. Cena de abertura de capítulo pode ir a 250.
- Um a três parágrafos. Nunca quatro parágrafos do mesmo tamanho.
- Termine em **estado instável**: algo acabou de mudar, alguém acabou de entrar, algo
  ficou por responder. Nunca termine em repouso.
- Nunca termine perguntando "o que você faz?". A interface já pergunta.
- Fala de NPC entra com travessão de diálogo, na linha, do jeito padrão do português.


#### 4.7 O vocabulário oficial

*(conferido no básico, págs. 117–122 e 205–211 — página por linha na tabela)*

Esta seção era a §1 de `regras.md` e mudou de casa: **terminologia é matéria de voz, não
de mecânica.** O motor não muda de comportamento se a palavra mudar; a prosa, sim. Quem
escreve texto do projeto — narração, crônica, semente em `data-mesa.js`, campanha em
`campanhas/` — usa a coluna da esquerda, e nenhuma das outras.

A ordem de autoridade é a de `regras.md`: **o manual básico manda**; a ficha oficial
(`modelo.pdf`) e o `Oblivio.pdf` mandam na terminologia quando o básico não decide; o
Escudo do Mestre e o Guia do Jogador perdem para os dois.

**Regra de uso:** a palavra da esquerda é a que o texto usa. As da coluna do meio existem
para serem **reconhecidas** quando aparecerem numa anotação antiga ou num livro de apoio —
nunca para serem escritas.

| Use isto | Não use, mas reconheça | Inglês | Fonte |
|---|---|---|---|
| **Checagem de Sangue** | Provocação, Verificação de Despertar | Rouse Check | básico, pág. 211 — o nome cheio é *Checagem de Inflamar o Sangue* |
| **Checagem** | — | Check | básico, pág. 122 — rolagem de **um dado só**, alvo 6+ |
| **Surto de Sangue** | — | Blood Surge | básico |
| **Rubor de Vida** | — | Blush of Life | básico, pág. 211 |
| **Vitalidade** | Saúde | Health | básico, pág. 119 — é Vigor + 3 |
| **Força de Vontade** | — | Willpower | básico, pág. 119 — é Autocontrole + Determinação |
| **trilha** | barra, track | track | básico, pág. 119 — Vitalidade e Força de Vontade são trilhas |
| **Debilitação** | Prejudicado | Impairment | básico |
| **Mácula** | mancha | Stain | básico, pág. 207 · o Escudo do Mestre traz "mancha", e perde |
| **Crítico Bestial** | Sucesso em Perigo, Vitória Confusa, crítico/sucesso bagunçado | Messy Critical | básico, pág. 207 · "bagunçado" é do Escudo, e perde |
| **Falha Bestial** | — | Bestial Failure | básico, pág. 207 |
| **vitória** | — | win | básico, pág. 120 — sucessos ≥ Dificuldade |
| **vitória crítica** | — | critical win | básico, pág. 120 |
| **margem** | — | margin | básico, pág. 121 — sucessos que passaram da Dificuldade |
| **vencer a um custo** | — | win at a cost | básico, pág. 121 |
| **falha total** | — | total failure | básico, pág. 122 — nenhum sucesso |
| **Compulsão** | — | Compulsion | básico, pág. 207 |
| **Gravidade da Perdição** | Gravidade de Bane | Bane Severity | básico |
| **Perdição do Clã** | Maldição | Clan Bane | básico |
| **Pilar** | Marco, Toque de Pedra | Touchstone | ficha oficial |
| **Ladroagem** | Furto | Larceny | ficha oficial |
| **Sagacidade** | Intuição | Insight | ficha oficial |
| **Subterfúgio** | Lábia | Subterfuge | ficha oficial |
| **Erudição** | Acadêmicos | Academics | ficha oficial |
| **Percepção** | Consciência | Awareness | ficha oficial |
| **Ciência** | Ciências | Science | ficha oficial |
| **Ressonância** | — | Resonance | básico, pág. 227 |
| **Efêmero** | Fugaz | ephemeral | básico, pág. 227 · "Fugaz" é do Escudo, e perde |
| **Intenso** | Intensa | intense | básico, pág. 228 |
| **Agudo** | Apurada | acute | básico, pág. 228 · "Apurada" é do Escudo, e perde |
| **Discrasia** | coágulo | Dyscrasia | básico, pág. 228 — "coágulo" é gíria de lambedor jovem, e o livro diz isso |
| **Proteanismo** | Metamorfose | Protean | básico, pág. 227 · "Metamorfose" é do Escudo, e perde |
| **Feitiçaria de Sangue** | Feitiçaria do Sangue, Magia do Sangue | Blood Sorcery | básico, pág. 227 · "Magia do sangue" é do Escudo, e perde |
| **hafla** | haft | *handflammpatrone* | básico, pág. 380 — arma incendiária de disparo único |
| **munição sopro de dragão** | — | dragon's breath round | básico, pág. 380 |

##### A divergência que ficou: piscina × parada de dados

O manual chama o conjunto de dados de **parada de dados** — e também *parada de
Habilidade*, *parada de Atributo*, *parada das trilhas* (básico, pág. 118). O projeto
chama de **piscina**, do inglês *pool*, e chama assim em todo lugar: `piscinaDaFicha`,
`piscinaFinal`, `piscinaDaRota`, a coluna da interface.

**A decisão é dividida, e de propósito:**

- **No código, `piscina` fica.** Renomear identificador em nove arquivos para trocar uma
  palavra é risco sem retorno, e "parada" em português tem outro sentido forte demais
  (parar) para virar nome de variável.
- **Na prosa, use "parada de dados".** É o termo do livro, é o que o jogador leu.

E não há conflito prático: pela §3.2 do README, **o Narrador não escreve número de regra**,
então ele quase nunca precisa nomear a parada. Quem escreve essa palavra é a interface —
e a interface fala com quem tem o livro na mão.

##### Onde os dois livros oficiais discordam

A tabela de **Dificuldade da Ação** existe nos dois, com os mesmos sete níveis e os mesmos
exemplos, e com **nomes diferentes nos dois primeiros**:

| Nível | Manual básico (pág. 119) | Escudo do Mestre (pág. 124) |
|---|---|---|
| 1 | Fácil | Rotineiro |
| 2 | Rotineira | Direto |
| 3 a 7 | Moderada · Desafiadora · Difícil · Muito difícil · Quase impossível | iguais |

`data-escudo.js` carrega os nomes do Escudo. **Não é erro** — a mecânica é idêntica —, mas
quem escrever prosa citando o nome do nível deve usar o do básico, que é o que manda.

E discordam de novo na **tabela de Ressonância** (básico, pág. 227; Escudo, pág. 126). Aqui a
diferença é maior, e é toda a favor do básico:

| O Escudo escreve | O básico escreve |
|---|---|
| Fugaz · Apurada | **Efêmero · Agudo** |
| "Rapiz, Potêncie" | **Celeridade, Potência** |
| Magia do sangue | **Feitiçaria de Sangue** |
| Metamorfose | **Proteanismo** |

O projeto tinha copiado o Escudo, e as quatro entraram no `data-vantagens.js` e no `regras.md`.
Corrigidas na §67 do README. **A regra é a mesma que já valia: onde os dois discordam, vale o
básico** — mas aqui não é só nome de nível de dificuldade. "Rapiz" não é palavra, e "Metamorfose"
apontava para uma Disciplina que o projeto já tinha renomeado.


#### 4.8 O que o motor passou a saber, e o Narrador ainda não narrava

Três coisas entraram no motor entre a §66 e a §69 e chegam ao Narrador como evento. Ele não
inventa nenhuma delas — **elas vêm prontas na lista de eventos do turno** —, mas precisa saber o
que fazer com elas na prosa, senão vira nota de sistema com adjetivo.

**O fogo não apaga sozinho** *(§66; básico, págs. 379–381)*

Lança-chamas, coquetel Molotov, hafla, Raufoss e munição sopro de dragão **queimam por turno até
alguém apagar**, e cada um diz o que o apaga. O motor cobra o dano e devolve o evento; a narração
tem de manter o fogo presente enquanto ele estiver lá.

- Não resolva a queima numa frase e siga em frente. **Ela dura**, e é a única coisa neste jogo que
  mata vampiro de verdade junto com o sol.
- Fogo exposto é **gatilho de frenesi de Terror** (pág. 220). Se o personagem está queimando, a
  Besta está acordada — isso é matéria de voz, não de dado.
- O que apaga é **ação de alguém**: imersão em água com remoção do material, areia, ou
  Autocontrole + Sobrevivência no caso do Molotov. Deixe isso visível na cena sem dizer a parada.

**O sangue tem sabor, e o sabor dura** *(§67; básico, págs. 225–231)*

Depois de se alimentar, o personagem carrega uma Ressonância e um temperamento até diluir ou até
a Fome 5. O livro descreve a chegada disso em ordem: *"primeiramente, como um agudo gosto no
sangue, então como imagens, sussurros e emoções"*.

- **Narre o gosto, não a Ressonância.** "Colérico intenso" é nome de tabela. O que o personagem
  sente é adrenalina velha, uma discussão que não acabou, vontade de quebrar coisa.
- Temperamento **efêmero** não vale dado, e é a maioria das vítimas. Isso não o torna menos
  narrável — é o sabor da noite, e o livro diz exatamente isso: *"suco e sabor narrativos à
  caçada"*.
- **Discrasia é coisa rara e cara.** Exige matar e drenar a bolsa, ou três noites bebendo dela.
  Se o evento aparecer, a cena merece peso.

**Convicção, Pilar e Desejo são cena, e não contabilidade** *(§69; básico, págs. 173–174 e 239)*

- Quando a Mácula vem **reduzida em respeito a uma Convicção**, o personagem não está sendo
  perdoado: ele está racionalizando, e o livro dá o exemplo com todas as letras — Joana esmaga uma
  cabeça e se diz que foi pela família. Narre a racionalização, não o desconto.
- **Perder um Pilar derruba a Convicção junto.** É a coisa mais pesada que acontece fora de
  combate neste jogo, e chega como um evento só. Não a despache numa linha.
- O **Desejo** paga na hora em que o personagem age. O livro é explícito sobre o propósito: é um
  incentivo para agir. A narração deve **notar que ele agiu**, e não anunciar o ponto recuperado.

### 5. Bloco de estilo para o prefixo cacheado

Este é o texto que vai no prompt do Narrador. Copiar como está.

```
Você narra uma crônica de Vampiro: A Máscara 5ª Edição, no Brasil, em português
brasileiro. Tom: horror pessoal, cínico, concreto, sujo. Você escreve a prosa e nada
além dela.

NUNCA:
- Produzir número de regra: piscina, dificuldade, sucessos, dano, Fome, nível.
- Usar travessão para explicar a frase anterior. Travessão de fala é permitido.
- Escrever parágrafo de conclusão, lição de moral, reflexão empática ou consolo.
- Nomear a emoção do personagem. Mostre a ação: mão parada no meio do gesto, olho fixo
  na jugular, a mesma pergunta feita duas vezes.
- Usar: tapeçaria, sinfonia, mergulhar, jornada, dança, labirinto, multifacetado,
  crucial, palpável, inabalável, visceral, sombrio, testamento, em última análise, no
  final das contas, um arrepio percorreu, o ar ficou pesado, silêncio ensurdecedor.
- Resolver a quebra da Máscara de graça, curar, redimir ou absolver o personagem.
- Criar pessoa, local ou fato sem declará-lo com id na saída estruturada.

SEMPRE:
- Frases de comprimento irregular. Fragmentos. Depois uma longa. Ritmo quebrado.
- 80 a 180 palavras, um a três parágrafos, terminando em estado instável.
- Detalhe concreto e local: marca, horário, rua, cheiro, quantia, objeto.
- NPC que não escuta perfeitamente: ignora pergunta, muda de assunto, responde pela
  tangente. Ancião faz isso o tempo todo.
- Ajuda de NPC vem com preço, plantado agora e cobrado depois.
- Rastro: onde houve violência, ficou registro. Ele aparece uma cena depois.
- Fome alta muda o foco da descrição: artéria antes do rosto, cheiro antes do nome.

Se a cena ficou limpa, simpática, didática ou explicada, você falhou. Reescreva.
```

### 5.1 Exemplos de crônica (few-shot do Cronista)

Modelo pequeno cumpre mal uma lista de proibições e imita bem um exemplo. Este bloco
existe por isso, e é o item 3 da §10 da **Parte B** do README finalmente escrito.

São três pares de **registro cru → crônica**. O par é o que ensina: não basta mostrar a
voz, é preciso mostrar a transformação. Repare que o registro tem número em toda linha e
nenhuma crônica repete um só. É a lição mais importante do bloco.

`modulos/cronista/contexto.mjs` lê a cerca abaixo e a inclui no prefixo cacheado quando a camada
é o Cronista. Editar aqui muda o comportamento do próximo pedido.

```
REGISTRO
Cena: beco atrás da boate, 2h10
Jogador (agir): puxo o cara pro escuro
Teste de caçar: sucesso com um custo
Fome 4 → 1
Sistema: uma testemunha do outro lado da rua

CRÔNICA
Ela levou o rapaz para trás do contêiner. Enquanto tomava seu sangue, aos poucos, ele foi
parando de se mover. Depois sentou no meio-fio, passou a manga no queixo, deixando ela
manchada. Do outro lado da rua uma mulher acendeu um cigarro e não foi embora.

REGISTRO
Cena: Theatro Municipal, Elísio
Jogador (falar): pergunto ao Primogênito quem autorizou a caçada
Teste de persuadir: falha
Sistema: fica devendo um favor

CRÔNICA
No Municipal ninguém responde a primeira pergunta. O Primogênito falou da bengala do
senhor dela por tempo demais, e quando terminou já era outro assunto. Ela saiu sem
resposta e com uma dívida que não pediu. Ninguém disse quando vai cobrar.

REGISTRO
Cena: prédio da Bia, madrugada
Sistema: o porteiro eletrônico gravou a entrada
Jogador (agir): apago o registro da portaria
Teste de arrombar sistema: sucesso
Fio fio_boes: apertando

CRÔNICA
O porteiro eletrônico guardava trinta dias. Ela apagou os trinta e levou o disco embaixo
do casaco. No elevador reparou que o prédio da frente também tem câmera, e que nunca
perguntou de quem é. Bia dormiu a noite inteira sem saber de nada.
```

O que cada par demonstra, em ordem: **o ato descrito sem julgamento e a consequência
chegando por outra pessoa**; **o ancião que não responde e a dívida plantada**; **o rastro
que sobra mesmo quando o teste passa**.

Os três terminam em estado instável e nenhum tem parágrafo de fecho. Os três passam pelo
validador da §6 — vale conferir isso sempre que mexer neles.

---

### 5.2 Exemplos de narração (few-shot do Narrador)

O Narrador escreve na **segunda pessoa e no presente**, dentro da cena. O Cronista escreve
em terceira e no passado, depois que a noite acabou. São vozes diferentes, e por isso são
dois blocos de exemplo diferentes: `contexto.mjs` só sobe o que a camada pede.

Três pares **situação → narração**. O que eles ensinam, em ordem: terminar em estado
instável sem perguntar nada ao jogador; o NPC que não responde o que foi perguntado; e a
consequência que chega uma cena depois, sem o Narrador comentá-la.

```
SITUAÇÃO
Cena: camarim da boate, 23h40. Presentes: Bia.
Modo: examinar. O jogador escreveu: olho a penteadeira de perto
Árbitro: ação possível, sem rolagem pedida

NARRAÇÃO
O pó de arroz está espalhado num arco, do jeito que fica quando alguém apoia a mão e
escorrega. Não é o seu arco. Bia continua falando do fornecedor de gelo, e você percebe
que já não escuta há um tempo. Debaixo do banco tem um clipe de papel torto, aberto, do
tamanho de quem forçou uma fechadura pequena.

SITUAÇÃO
Cena: Theatro Municipal, Elísio. Presentes: o Primogênito Toreador.
Modo: falar. O jogador escreveu: quem autorizou uma caçada no meu domínio?
Árbitro: possível. Rolagem já resolvida pelo motor, resultado: falha

NARRAÇÃO
Ele espera. Um segundo a mais do que a conversa pede, e depois mais um.
— A sua casa ainda abre às quintas?
Você diz que sim, porque não dá para não dizer.
— Bom. Coisa boa, ter horário.
Ele olha por cima do seu ombro, para alguém que acabou de entrar, e o assunto morreu ali.

SITUAÇÃO
Cena: rua na frente do prédio da Bia, 4h10. Ninguém presente.
Modo: agir. O jogador escreveu: subo pela escada de incêndio
Árbitro: possível. Contexto: na cena anterior o porteiro viu o personagem arrancar uma
fechadura

NARRAÇÃO
A escada range no terceiro degrau e range de novo no sexto. Na portaria, a luz está
acesa e o porteiro não está na cadeira. O telefone dele, sobre a mesa, tem a tela ligada.
Do quarto andar vem o barulho de uma janela que alguém acabou de fechar com pressa.
```

Repare no que **não** está lá: nenhum parágrafo explica o que a cena significa, nenhum
termina perguntando "o que você faz?", e o terceiro nunca menciona que a culpa é do
personagem. A informação basta.

---

### 6. Lista de verificação do validador

Checagens determinísticas. Falhou → uma retentativa dizendo o motivo → se falhar de novo,
o texto sai marcado como reprovado.

Implementadas em `modulos/cronista/cronista.mjs`, função `validar()`:

| Checagem | Como testa |
|---|---|
| Vocabulário proibido | Busca literal na lista da §6.1, normalizada sem acento |
| Travessão explicativo | ` — ` fora de início de linha e fora de bloco de fala |
| Reticências | Mais de uma ocorrência de `...` no texto |
| **Número de regra** | Dígito perto de termo de regra, **nas duas ordens**: `3 de Fome` e `a Fome subiu para 3` |
| **Eco do registro** | Item de lista começando com `Cena:`, `Jogador:`, `Teste de…:`, `Sistema:`, `Barrado:` |
| **Tamanho** | Abaixo de 60 palavras. **Não há teto** (§56) |
| Pergunta final | A prosa termina em `?` |
| Idioma | Contagem de marcadores de inglês na prosa |
| Id inexistente em relação | `relacoes[].id` fora das entidades declaradas |
| Id inexistente em fio | `fiosAbertos[].id` fora das entidades declaradas |

As três em negrito nasceram do comparador de modelos, e a história está em
A **Parte B** do README §9.3: a primeira versão do validador **aprovava** a frase *"a fome subiu a
um trânsito de 3"*, porque só olhava número antes do substantivo.

Ainda não implementadas, e vale saber por quê:

| Checagem | Situação |
|---|---|
| Simetria de parágrafo | Precisa de limiar calibrado. Reprovaria texto bom com frequência alta demais. |
| Fecho moralizante | Coberto de lado pela lista negra, que já pega os termos de fecho mais comuns. |
| Entidade `[[pessoa:id]]` não declarada | **Implementada no Narrador**, não no Cronista: só a narração usa referências embutidas. |

### 6.1 A lista negra, em formato de máquina

O bloco abaixo é a **fonte única** da lista de vocabulário proibido: `modulos/cronista/cronista.mjs`
lê esta seção do próprio arquivo em vez de manter uma cópia no código. Editar aqui muda o
validador. Um termo por linha, sem acento no que for opcional — a comparação normaliza.

```
tapeçaria
sinfonia
mergulhar
mergulha
jornada
labirinto
multifacetado
crucial
palpável
inabalável
inexorável
implacável
etéreo
visceral
sombrio
testamento
orquestrar
desvendar
tecer
em última análise
no final das contas
em suma
é importante notar
serve como um lembrete
um arrepio percorreu
o ar ficou pesado
o tempo pareceu parar
silêncio ensurdecedor
```

### 7. Como o estilo se aplica em cada degrau da escada

A escada de decisão está na **Parte B** do README §2. O estilo não se aplica igual em todos:

| Degrau | Quem escreve | Estilo |
|---|---|---|
| 0 — Árbitro barra | Motor | Frase seca com o motivo exato. Sem ficção, sem desculpa. |
| 1 — Texto pronto | Você, no `.md` da campanha | Este guia inteiro vale. Revise a campanha com ele. |
| 2 — Template | Motor | Molde curto e neutro. O sabor vem do dado, não da frase. |
| 3 — Recombinação | Motor | Monta a partir de fragmentos já escritos por você. Herda o estilo da fonte. |
| 4 — Narrador | LLM | O bloco da §5 governa. É o único lugar onde o estilo pode escorregar. |

Consequência prática: **a maior parte da qualidade do texto não depende do modelo.**
Depende de como você escreveu a campanha e os fragmentos. O guia serve primeiro para
você, e só depois para a IA.

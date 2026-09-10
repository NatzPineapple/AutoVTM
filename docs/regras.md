# Regras — VITÆ

Referência única de regras do projeto. Reúne quatro documentos que viviam separados:
as regras do V5, as tabelas do Escudo do Mestre, o que muda na ficha por seita, e o
que muda para jogar de Sabá.

Existe para não precisarmos reabrir os PDFs a cada implementação. Toda regra aqui está
escrita no formato em que o motor precisa dela.

## Fontes, e qual delas ganha

`Livros/` foi reorganizado em subpastas — `Regras/`, `Campanhas/`, `Adição Narrativa/` — e
os caminhos antigos deste documento estavam quebrados até esta revisão.

A ordem de autoridade, do maior para o menor:

| Fonte | Peso |
|---|---|
| `Livros/Regras/vampiro-a-mascara---manual-basico-5-edicao.pdf` | **Manda em tudo.** Tradução oficial, e a única fonte primária de regra do sistema |
| `Livros/Regras/modelo.pdf` (ficha oficial) e `Oblivio.pdf` | Traduções profissionais; mandam na terminologia |
| Os demais em `Livros/Regras/` | Suplementos, cada um na sua matéria |
| `Livros/Regras/V5-Guia-Do-Jogador.pdf` | Tradução automática ruim. **Só apoio**, e perde de qualquer outro |

> **O manual básico chegou depois deste documento existir.** Boa parte do que está aqui foi
> compilada quando a melhor fonte disponível era o Guia do Jogador — que é justamente o de
> menor confiança. A revisão contra o básico começou; o que já foi conferido com a página do
> livro à vista está marcado com a página, assim: *(básico, pág. 205)*. **O que não tem essa
> marca ainda não foi reconferido.**
>
> **A Parte I está fechada: as 17 seções de regra (§2 a §18) foram conferidas contra o
> manual básico.** A §1 saiu daqui — virou vocabulário, em `narracao-ia.md` §4.7 — e a §19 é
> inventário do motor, não regra. Na Parte II, 3 das 15 — a §15 nasceu conferida, do Apêndice I.
>
> **A revisão está achando erro de conteúdo, e não pouco.** A tabela de Dificuldade da §5
> estava com os rótulos deslocados em um nível e fechava em 6 em vez de 7 — vinha do Guia do
> Jogador. A §8 dizia que o Surto de Sangue só vale para Atributo **físico** (vale para
> qualquer um). A §11 recuperava Vontade **no fim** da sessão, e é no início. A §6 dizia que
> **empate mantém o status quo**, e o livro dá a vitória a quem age. E a tabela de Potência
> de Sangue, **já marcada como conferida**, tinha duas células erradas.
>
> **Documento desatualizado não é inofensivo só porque o código está certo:** quem lê daqui
> para implementar a próxima regra programa pelo que está escrito.
>
> **E cuidado com célula mesclada.** Duas das correções acima vieram do mesmo engano: no
> livro, a coluna de penalidade de alimentação mescla as linhas 6–7 e 8–9, e o texto foi
> lido na altura da linha de baixo. A 2x as bordas do bloco não dão para separar; foi
> preciso recortar a coluna e renderizar a 5x.

> **Cuidado com `pdftotext` no manual básico.** Ele é digitalizado, e o OCR sai corrompido em
> 40% das linhas — 76% das páginas têm mais de um quarto do texto sujo. Extrair texto dele e
> confiar no resultado **introduz erro de regra**. Para conferir uma regra, renderize a página
> como imagem e leia:
>
> ```bash
> npm install --no-save mupdf
> node _render.mjs "Livros/Regras/vampiro-a-mascara---manual-basico-5-edicao.pdf" saida/ 207 209 2
> ```
>
> As páginas do PDF vêm **2 à frente** das páginas impressas no livro: PDF 207 = livro 205.

| Parte | O que traz | Era |
|---|---|---|
| **I — Regras do V5** | Terminologia, dados, Disciplinas, estados, combate, criação, XP | regras.md Parte I |
| **II — Escudo do Mestre** | Tabelas de decisão: dificuldade, oposição, caça, ferimento, NPCs, **e a parada de cada ação padrão** | regras.md Parte II |
| **III — Fichas por seita** | O que muda na criação quando a seita é bifurcação, não rótulo | regras.md Parte III |
| **IV — Jogando de Sabá** | O que substitui ou acrescenta às regras base | regras.md Parte IV |

As seções mantêm a numeração original de cada parte. Quando um texto diz "§15", ele fala
da seção 15 **da própria parte** — a Parte I tem uma §15 e a Parte II tem outra.

---

# Parte I — Regras do V5

> Era o arquivo `docs/regras-v5.md`. As regras base: terminologia, dados, Disciplinas,
> estados, combate, criação e experiência. O que muda por seita está na Parte III; o que
> muda no Sabá, na Parte IV.

---

## 1. Terminologia

**Mudou de arquivo: está em `docs/narracao-ia.md` §4.7.**

A tabela de termos vivia aqui e foi para o guia de narração, porque o que ela decide é
**voz, não mecânica**: o motor não muda de comportamento se a palavra mudar; a prosa, sim.
Lá ela está conferida contra o básico, com a página em cada linha, e com as duas coisas
que faltavam:

- **piscina × parada de dados** — o livro diz "parada de dados"; o código diz "piscina".
  A decisão é dividida: o identificador fica, a prosa usa a do livro.
- **Checagem de Sangue** é o nome oficial do que este projeto chamava de "Provocação"
  (básico, pág. 211).

---

## 2. O teste

*(conferido no básico, págs. 205–207)*

```
Piscina = Atributo + Habilidade (+1 se a especialização se aplica)
Dados de Fome = min(Fome atual, Piscina)   ← substituem dados normais, não somam
```

Rola-se d10 por dado. **6 a 10 é sucesso. 10 é crítico.**

### Onde os dados de Fome NÃO entram

> Livro básico, pág. 205: *"os personagens jamais incluem dados de Fome em paradas de
> Checagens, Força de Vontade e Humanidade."*

Três piscinas rolam **sempre com Fome 0**, e é fácil errar porque o resto do jogo usa Fome
em tudo:

| Piscina | Por quê |
|---|---|
| **Checagem de Sangue** (Provocação) | É o teste que *causa* a Fome; ela não pode se realimentar |
| **Força de Vontade** (Autocontrole + Determinação) | Inclui **resistir a frenesi**, que o livro chama explicitamente de "teste de Força de Vontade" (pág. 220) |
| **Humanidade** | Inclui o **teste de Remorso** |

Consequência direta: nessas três **não existe Crítico Bestial nem Falha Bestial**, porque
não há dado de Fome para produzir o 10 ou o 1.

### Contagem de sucessos

1. Conte cada dado 6+ como **1 sucesso**.
2. Conte quantos **10** saíram no total (normais + Fome).
3. Cada **par de 10** rende **+2 sucessos adicionais** — ou seja, o par vale 4.
4. Um 10 sobrando (ímpar) vale só o sucesso dele.

```
sucessos = (quantidade de dados ≥ 6) + floor(quantidade de 10 / 2) × 2
```

**Reteste de Força de Vontade** — gastando 1 ponto, o jogador rerrola **até três dados
comuns**. Serve para tirar 0s comuns (neutralizando um Crítico Bestial) ou para transformar
uma falha em sucesso (escapando de uma Falha Bestial). **Dado de Fome nunca é rerrolado**:
a Fome zomba da tentativa da mente racional de domá-la.

Exemplos verificados no motor:

| Dados | Sucessos | Por quê |
|---|---|---|
| 10, 10, 7, 2 | **5** | 3 dados ≥6, mais 1 par de 10 (+2) |
| 10, 10, 10, 10 | **8** | 4 dados ≥6, mais 2 pares (+4) |
| 10, 7, 2, 2 | **2** | 2 dados ≥6, nenhum par |

---

## 3. Os seis resultados

*(conferido no básico, págs. 206–207)*

Avaliados **nesta ordem**:

| Resultado | Condição | Efeito |
|---|---|---|
| **Crítico Bestial** | Passou **e** houve par de 10 **e** ao menos um 10 veio de dado de **Fome** | Você conseguiu, mas a Besta obteve o crítico, não você. O Narrador impõe uma consequência que custa Máscara ou Humanidade. |
| **Sucesso Crítico** | Passou **e** houve par de 10, sem 10 na Fome | Sucesso excepcional, benefício extra. |
| **Sucesso** | Sucessos ≥ dificuldade | Faz o que pretendia. |
| **Falha Bestial** | Falhou **e** ao menos um dado de Fome mostrou **1** | Falha com consequência grave: a Besta assume. Pode gerar Mácula, frenesi ou compulsão. |
| | *Livro básico, pág. 207:* **"se a sua rolagem for bem-sucedida de qualquer modo, você não pode obter uma falha bestial, não importando quantos dados de Fome resultem em 1."** | A ordem de avaliação da tabela já garante isso. |
| **Falha Total** | Zero sucessos, sem 1 na Fome | Pior do que não ter tentado. O Narrador pode oferecer um Impulso Desesperado. |
| **Falha** | Sucessos > 0 mas < dificuldade | Não foi o bastante. |

**Regra crítica de ordem:** um 1 em dado de Fome **só** causa Falha Bestial se o
teste tiver falhado. Um 1 na Fome num teste bem-sucedido não faz nada.

**Margem** = sucessos − dificuldade. Usada em testes disputados e em vários poderes.

---

## 4. Reteste de Força de Vontade

*(conferido no básico, págs. 122, 205 e 206)*

Implementado em `Dados.retestarVontade()`.

O texto do livro, na íntegra, porque quase toda regra desta seção está nele:

> Personagens podem gastar 1 ponto de Força de Vontade para rerrolar até três dados
> comuns em qualquer rolagem de Habilidade ou Atributo, incluindo rolagens envolvendo
> Disciplinas vampíricas. Personagens não podem gastar Força de Vontade para rerrolar
> dados de Fome ou rolagens de trilha, como Força de Vontade ou Humanidade. Um ponto de
> Força de Vontade gasto conta como um nível de dano Superficial à Força de Vontade e é
> marcado como tal. *(básico, pág. 122)*

### O que vale

- Custa **1 ponto de Força de Vontade**, marcado como **1 de dano Superficial na trilha de
  Vontade**.
- Rerrola **até 3 dados comuns**.
- Vale em **qualquer rolagem de Habilidade ou Atributo**, Disciplinas incluídas.

### As duas proibições

**1. Dados de Fome, nunca.** O livro põe isso numa caixa própria, em letra destacada:

> **Dados de Fome jamais podem ser rerrolados usando Força de Vontade** *(básico, pág. 206)*

E dá a razão na pág. 205: *"pois a Fome zomba da tentativa que a mente racional faz para
domá-la"*.

> **Correção de fonte.** Este documento justificava a proibição por dedução — o mérito de
> coterie Salubri "Restrição" existe para permitir rerrolar dados de Fome, logo a regra
> padrão proíbe. A dedução estava certa, mas era dedução. **O livro afirma direto**, e a
> citação acima substitui o raciocínio.

**2. Rolagens de trilha, nunca** — Força de Vontade e Humanidade. **Esta regra faltava
neste documento.** É consistente com a pág. 205, que exclui dados de Fome de "paradas de
Checagens, Força de Vontade e Humanidade", e com a pág. 207: *"Você não rola dados de Fome
em uma rolagem de Força de Vontade ou Humanidade, portanto, não pode obter um crítico
bestial nessas rolagens."*

### Uma vez por rolagem

**O livro não diz isso em nenhuma frase de regra** — mas é como o exemplo dele se comporta:
na pág. 206, Mario rerrola, obtém 4 sucessos, e a Narradora então lhe **oferece vencer a um
custo** em vez de um segundo reteste. O app mantém "uma vez por teste, e o resultado é
final", e fica registrado que isto é leitura do exemplo, não citação.

### Para que serve, além de virar falha em sucesso

A pág. 205 lembra um uso que é fácil esquecer: gastar Vontade para **se livrar de 10s
comuns e assim neutralizar um crítico bestial**. O reteste não serve só para ganhar — serve
para não ganhar do jeito errado.

E lembra que economizar é bobagem: *"assume-se que a maioria dos vampiros emprega sua
vontade para esse propósito todas as noites"*. Força de Vontade baixa aumenta o risco de
frenesi.

### Na interface

O jogador escolhe os dados; o app pré-seleciona os que falharam, do pior para o melhor.
Como o exemplo do livro mostra um jogador rerrolando **um 10 e duas falhas**, a seleção
automática é sugestão, e não trava.

### Recuperação

Ao fim de cada sessão, ou ao cumprir sua Ambição/Desejo, some **Autocontrole ou
Determinação (o maior)** de dano Superficial de Vontade.

---

## 5. Dificuldade

*(conferido no básico, págs. 119, 120 e 121)*

### O que Dificuldade é, e o que não é

> Ao contrário de edições anteriores de **Vampiro**, note que a Dificuldade significa a
> quantidade de dados bem-sucedidos exigida para realizar a tarefa, e **não** o número a
> ser tirado em cada dado, que sempre é 6 ou mais. *(básico, pág. 119)*

Dificuldade é **número de sucessos**. Sucessos ≥ Dificuldade é uma **vitória**.

### A tabela

*(básico, pág. 119)*

| Dificuldade | Nome | Exemplos do livro |
|---|---|---|
| 1 sucesso | Fácil | atingir um alvo parado; convencer um amigo leal a ajudá-lo |
| 2 sucessos | Rotineira | seduzir alguém que já esteja no clima; intimidar um fracote |
| 3 sucessos | Moderada | substituir o sistema de som de um carro; caminhar na corda-bamba |
| 4 sucessos | Desafiadora | localizar a fonte de um sussurro; criar uma obra de arte memorável |
| 5 sucessos | Difícil | convencer um policial de que a cocaína não é sua; reconstruir um bloco de motor destruído |
| 6 sucessos | Muito difícil | correr na corda-bamba sob fogo cruzado; acalmar uma multidão hostil e violenta |
| 7+ sucessos | Quase impossível | encontrar um indivíduo sem-teto em Los Angeles à noite; recitar perfeitamente um texto longo numa língua que você não fala |

> **A tabela que estava aqui estava errada, e de dois jeitos.** Ela tinha seis linhas
> (1 Trivial · 2 Fácil · 3 Padrão · 4 Difícil · 5 Muito difícil · 6+ Quase impossível):
> os rótulos estavam **deslocados em um nível** e o topo fechava em 6 em vez de 7. Ela
> vinha do Guia do Jogador, que é a fonte de menor confiança.
>
> **O motor nunca usou essa tabela.** `data-escudo.js` carrega os sete níveis certos, com
> os mesmos exemplos do livro — era só este documento que estava errado. Os nomes dos
> níveis 1 e 2 lá são os do Escudo do Mestre ("Rotineiro", "Direto"), e os dois livros
> oficiais realmente discordam nesse ponto; a comparação está em `narracao-ia.md` §4.7.

### As três formas de definir oposição

Quando um PN se opõe, o Narrador escolhe a mais rápida *(básico, pág. 119)*:

1. a tabela acima;
2. **metade da parada do PN**, arredondando para baixo;
3. **o valor da Habilidade do PN** como Dificuldade — e mesmo com Habilidade 0, a
   Dificuldade é 1. Valores 2 ou 3 são os mais comuns.

### Modificadores

*(básico, pág. 120)*

Há dois tipos, e a diferença é de quem é a circunstância:

| Tipo | Reflete | Exemplos do livro |
|---|---|---|
| **Mudar o tamanho da parada** | circunstância do **personagem** | está drogado, usando uma especialização, parecendo aterrorizante |
| **Alterar a Dificuldade** | circunstância da **ação** | clima chuvoso, equipamento em más condições, sob fogo cruzado, terreno hostil |

Três regras que o motor precisa respeitar:

- **±2 dados ≈ ∓1 de Dificuldade.** "Aumentar ou diminuir a parada de dados em dois dados
  tem o mesmo efeito estatístico de aumentar ou diminuir a Dificuldade em 1."
- **Teto para modificador improvisado do Narrador: ±2 de Dificuldade, ou ±3 dados.** Não
  vale para especializações nem para regras específicas.
- **Penalidade jamais leva a parada abaixo de 1 dado.** E "nenhuma parada de dados pode ser
  inferior a 1, portanto uma rolagem de uma parada vazia ainda é feita com um dado"
  *(pág. 119)*.

**Equipamento** *(pág. 119)*: se o Narrador considerar o equipamento central à atividade,
equipamento improvisado, não confiável ou de baixa qualidade dá **+1 à Dificuldade**. **Sem
equipamento nenhum, a tarefa é impossível** — não é uma penalidade, é um bloqueio.

### Vitória automática

*(básico, pág. 120)*

Quando a parada é o **dobro da Dificuldade**, o Narrador pode conceder a vitória sem rolar.
O livro manda aplicar isso **vigorosamente** fora de combate — testes de informação, papo,
manobras que abrem cena. Raramente em combate ou sob estresse.

Em vitória automática, **a margem é sempre zero** *(pág. 121)*.

### Margem

*(básico, pág. 121)*

Sucessos que passaram da Dificuldade. Dificuldade 4 com sete sucessos → margem 3. Dano,
muitos efeitos de poder e outras regras usam a margem para calcular o grau do efeito.

### Vencer a um custo

*(básico, pág. 121)*

Rolagem com **algum** sucesso, mas insuficiente: o Narrador pode oferecer que você alcance
o objetivo e algo saia caro — dano, atenção hostil, perda de algo de valor. O custo é
tanto pior quanto maior for o número de sucessos faltantes, e **o jogador sempre pode
recusar e falhar** em vez de pagar.

### Trabalho em equipe

*(básico, pág. 122)*

Role a **maior parada** entre os participantes, **+1 dado por auxiliar** que tenha ao menos
1 ponto na Habilidade envolvida. **Se nenhuma Habilidade estiver envolvida, ninguém pode
ajudar.**

### No VITÆ

A dificuldade base vem da **calibragem pelo Índice de Força** (Parte B do README §4),
exceto em testes-marco fixados na campanha. Teste sem dificuldade declarada usa **1
sucesso basta**, que é a Dificuldade 1 do livro.

---

## 6. Tipos de teste

*(conferido no básico, págs. 122–125 e 293–294)*

### 6.1 Simples

Piscina contra Dificuldade. É a §2 e a §5.

### 6.2 Checagem

Rolagem de **um dado só**, alvo **6 ou mais** *(pág. 122)*. A Checagem de Sangue é a mais
comum, mas o termo é geral.

Três travas que valem para **toda** checagem *(págs. 122–123)*:

- **Não se pode gastar Força de Vontade para rerrolar uma checagem.**
- **Vitória automática jamais se aplica.**
- **"Pegar a metade" jamais se aplica.**

### 6.3 Disputa

Os dois lados montam parada e rolam. **As Características não precisam ser as mesmas**: o
Narrador pode pedir Destreza + Furtividade de quem se esgueira e rolar Raciocínio +
Percepção pelo guarda *(pág. 123)*.

O procedimento, na ordem do livro:

1. você descreve o que quer fazer, e como;
2. o Narrador decide se há oposição e diz **quais Características suas** entram na parada;
3. o Narrador escolhe as **do oponente**;
4. cada lado rola e conta sucessos.

> **O EMPATE É VITÓRIA DE QUEM AGE.** O livro é literal:
>
> *"Se o personagem que está agindo rolou mais sucessos **ou a mesma quantidade** que o
> personagem opositor, o teste é uma vitória."* *(pág. 123)*
>
> **Correção:** esta seção dizia "empate mantém o status quo". Está errado, e o erro é caro
> — empate não é raro, e a regra decide a favor de quem tomou a iniciativa. É a diferença
> entre um sistema que premia agir e um que premia esperar.

**PEGAR A METADE** *(pág. 123)* — para reduzir rolagens, conte os dados da parada, **divida
por dois arredondando para baixo**, e considere o resultado o número de sucessos. O livro
recomenda para PNs em disputas básicas, e **encoraja permitir que os jogadores façam o
mesmo**.

### 6.4 Conflito

Disputa que **resulta em dano** — físico ou mental *(pág. 125)*. Vale para qualquer
interação hostil, de briga de rua a debate na corte.

Ambos rolam **simultaneamente**. O vencedor **subtrai os sucessos do perdedor** do seu total
e aplica o restante como dano, à Vitalidade ou à Força de Vontade.

E aqui o livro separa dois casos, e a diferença é a que mais importa:

| | Quando | O empate |
|---|---|---|
| **Unilateral** | só um lado pode causar dano — o defensor está desviando de um tiro | o livro não abre exceção: vence quem tiver mais sucessos |
| **Bilateral** | os dois podem causar dano; as ações se fundem em **uma única rolagem de disputa** | **os dois causam dano, como se cada um tivesse vencido com margem 1** |

**ESQUIVANDO** *(pág. 125)* — engajado em Briga ou Armas Brancas, **o defensor sempre pode
optar** por Destreza + Atletismo em vez de uma habilidade de combate. **Se optar, não causa
dano nenhum ao oponente**, não importa a margem, mesmo vencendo. É uma escolha do jogador,
com preço: defender-se melhor ou poder revidar.

**MÚLTIPLOS OPONENTES** *(pág. 125)* — quem enfrenta vários **perde 1 dado da parada a cada
oponente sucessivo** ao se defender. Para atacar mais de um, **divide a parada**.

**QUEM VAI PRIMEIRO** *(pág. 125)* — sem surpresa, age-se em ordem descendente: corpo a
corpo **já engajado**, depois **à distância**, depois corpo a corpo **recém-iniciado**,
depois todo o resto. Desempate por **Destreza + Raciocínio**; persistindo, pelos pontos da
Habilidade usada.

### 6.5 Estendido

Para tarefas que não cabem em uma rolagem *(págs. 293–294)*. **Cinco versões**, e o
documento só tinha uma:

| Versão | Como funciona |
|---|---|
| **Padrão** | O Narrador põe uma Dificuldade **muito alta (10+)** e você acumula sucessos em uma série de rolagens até alcançá-la |
| **Série de testes** | Uma Dificuldade **comum** a várias tarefas, exigindo um número de **vitórias** — cada alarme, cada fechadura, cada volume do grimório |
| **Estendido difícil** | Combina os dois, e conta **só a margem** de cada tarefa rumo à Dificuldade final. Feito para uma ou duas rolagens por sessão, em metas de longo prazo com pouca oposição |
| **Em cascata** | A **margem de cada tarefa vira dados extras na próxima** — sucesso gera sucesso. Em compensação, **uma falha encerra o teste** |
| **Disputa estendida** | Dois lados correndo para completar primeiro. Cada um rola uma vez por incremento; vence quem acumular o bastante antes. Empatando no mesmo incremento, vence quem acumulou mais sucessos |

Na **disputa estendida com interferência direta**, o Narrador pede uma disputa básica por
incremento: o vencedor subtrai os sucessos do perdedor dos seus e aplica o resto ao total
acumulado; **o perdedor não acumula nada naquele incremento**.

**FALHA TOTAL** *(pág. 294)* — apaga **todos** os sucessos e vitórias acumulados; recomeça-se
do zero. Em alguns casos o Narrador pode determinar que **nem recomeçar é possível**.

**TRABALHO EM EQUIPE no estendido** *(pág. 294)* — vale para a maioria deles; e mesmo quando
não vale, o Narrador pode permitir **ignorar ou tentar consertar uma falha total** em vez de
estragar o teste inteiro.

### 6.6 Em equipe

*(básico, pág. 122)*

Role a **maior parada** entre os participantes, **+1 dado por auxiliar** que tenha ao menos
**1 ponto na Habilidade envolvida**. **Se nenhuma Habilidade estiver envolvida, ninguém pode
ajudar.**

---

## 7. Fome e alimentação

*(conferido no básico, pág. 212)*

A Fome vai de **0 a 5**.

- **Fome 0** só é possível logo após se alimentar fartamente (e não dura).
- **Fome 5** é o limite: o vampiro entra em frenesi de fome e não consegue mais agir
  racionalmente sem gastar Força de Vontade.

**Fome 0 só se alcança de um jeito:** drenando e matando um humano. Nenhuma outra fonte
chega lá.

| Fonte | Sacia | Tempo | Notas |
|---|---|---|---|
| Vários animais pequenos (3–4 gatos, 12+ ratos) | 1 | Uma cena | Ressonância Animal, sem Discrasia |
| Animal médio (guaxinim, cachorro, coiote) | 1 | Um turno | Ressonância Animal, sem Discrasia |
| Animal grande (cavalo) | 2 | Uma cena | |
| Bolsa de banco de sangue | 1 | Um turno | Sem Dissonância nem Discrasia |
| Humano, alguns goles | 1 | Três turnos | Inclui fechar a ferida com uma lambida |
| Humano, o máximo sem causar dano | 2 | Uma cena | |
| Humano, até causar dano | 1 a 4 | Um turno por Fome saciada | Fome saciada = dano Agravado. O humano rola **Força + Vigor** contra Dificuldade igual à Fome saciada para sobreviver |
| Humano completamente drenado e morto | 5 | 5 turnos | **Único modo de chegar a Fome 0** |
| Cadáver fresco (Ladrão de Túmulos) | Até 3 | | Mesmas penalidades do sangue ensacado |
| Vitae de outro vampiro | Varia | | Cria Vínculo — ver Parte I §19 |

**O limiar de Potência de Sangue, que estava errado até esta revisão:**

| Potência | Sangue animal e ensacado |
|---|---|
| 0 a 1 | Sacia normalmente |
| **2** | Sacia **meia** Fome |
| **Acima de 2** (3+) | **Não sacia nada** |

> O documento e o `data-escudo.js` diziam "não satisfaz Potência de Sangue **2 ou mais**".
> É um a menos: em PS 2 o sangue ainda serve, pela metade. Só de **PS 3 em diante** é que
> não sacia coisa alguma. A tabela de Potência da Parte II §5 concorda com isto.

**Ressonância** — o humor emocional do sangue. Colérico, Melancólico, Fleumático,
Sanguíneo, mais Vazio (sem ressonância) e Animal. Alimentar-se de uma ressonância
intensa dá dados temporários às Disciplinas ligadas a ela.

---

## 8. Checagem de Sangue e Surto de Sangue

*(conferido no básico, págs. 211, 217 e 218)*

> **A seção mudou de nome.** Chamava-se "Provocação e Surto de Sangue". O livro chama de
> **Checagem de Sangue** — nome cheio, *Checagem de Inflamar o Sangue* (pág. 211). O termo
> "Provocação" era invenção do projeto, e fica só como apelido reconhecível.

### 8.1 Checagem de Sangue

Rola **um único dado**. **6 ou mais é sucesso; 1 a 5 aumenta a Fome em 1.**

Quando ela é exigida *(pág. 211)*: ao despertar a cada pôr do sol, ao bombear Sangue para
os Atributos, ao ativar Rubor de Vida, ao curar o corpo ferido, e para ativar a maioria dos
poderes de Disciplina.

**A regra que mais muda o jogo, e é fácil errar** *(pág. 217)*:

> Lembre-se de que falhar em uma Checagem não significa que o dom falha, mas apenas que a
> Fome aumenta em 1.

Três consequências que o livro deixa explícitas:

- **A Fome ganha é somada DEPOIS de o efeito ser resolvido** *(pág. 211)*. Por isso é
  aceitável rolar a Checagem junto com — ou até depois de — os outros testes envolvidos,
  desde que o dado de Fome não se misture à parada.
- **Dados de Fome não entram na parada de uma Checagem** *(pág. 205)*. A Checagem é o teste
  que *causa* a Fome; ela não se realimenta.
- **Com Fome 5, o vampiro jamais pode Inflamar o Sangue intencionalmente** *(pág. 211)*. Se
  algum fator externo o forçar a uma Checagem, ele rola **imediatamente um teste de frenesi
  de fome com Dificuldade 4** — e, como sempre, falhar na Checagem ainda ativa o efeito.

**Rerrolagem de Checagem** — a partir de certa Potência de Sangue, o jogador rola **dois
dados e fica com o maior** em Checagens para poderes de Disciplina até certo nível. Um
sucesso em qualquer dos dois evita o aumento de Fome; o livro observa que isso equivale a
rerrolar a Checagem *(pág. 211)*. A faixa por nível está na Parte II §5.

### 8.2 Surto de Sangue

*(básico, pág. 218)*

Adiciona dados a uma parada que empregue um **Atributo** — e o livro diz **Físicos, Sociais
**ou** Mentais**.

> **Correção.** Esta seção dizia "um Atributo **físico**". Está errado: o Surto vale para
> qualquer Atributo. O texto do livro é "aumentar temporariamente seus Atributos, sejam
> Físicos, Sociais ou Mentais".

- Custa **uma Checagem de Sangue**.
- Quantos dados depende da **Potência de Sangue** (Parte II §5).
- **Uma por rolagem**, e vale para **uma única rolagem**.
- **Proibido** em rolagem de **Força de Vontade** ou **Humanidade**, em rolagem que valha
  para mais de uma cena, em **Combate de Rolagem Única**, e sempre que o Narrador
  desaprovar.
- **Não** se aplica vitória automática nem "Pegar Metade" a uma rolagem aumentada por Surto.
- Os dados do Surto **permanecem** numa rerrolagem paga com Força de Vontade.

### 8.3 Recuperação vampírica, que é Checagem também

*(básico, pág. 218)*

| O quê | Como |
|---|---|
| **Superficial na Vitalidade** | Um ou mais pontos por **uma** Checagem de Sangue, conforme a Potência. **Uma Checagem por turno.** |
| **Agravado na Vitalidade** | Esperar até a **noite seguinte** e fazer **três** Checagens de Sangue, **além** da Checagem regular do despertar |

> Em Oblívio há uma regra extra: numa Checagem para poder ou Cerimônia de Oblívio, um
> resultado **1 ou 10** gera uma **Mácula**, além da Fome ganha.

---

## 9. Potência de Sangue

*(conferido no básico, págs. 215–217; a tabela consolidada está em **Parte II §5**)*

### 9.1 Como ela se move

- **Sobe com a idade:** como regra geral, **+1 a cada 100 anos ativo**. Experiências
  intensas ou exposição a Sangue muito potente aceleram.
- **Cai no torpor:** **−1 a cada 50 anos** em Torpor.
- **Nunca sai da faixa da geração** — nem abaixo do mínimo, nem acima do máximo.
- **Sangues-ralos nunca aumentam**, a não ser que abram caminho com **Diablerie** para a
  13ª Geração e além.

A Potência inicial vem do **mínimo da geração** (12ª–13ª → 1; 9ª → 2; 14ª–16ª → 0), e não
de um valor fixo. A tabela Geração → mín./máx. está na Parte II §5.

### 9.2 O que ela governa

Seis colunas, todas na tabela da Parte II §5: **Surto de Sangue**, **dano recuperado por
Checagem**, **bônus de poder de Disciplina**, **rerrolagem de Checagem para Disciplinas**,
**Gravidade da Perdição** e **penalidade de alimentação**.

### 9.3 Os dois extremos

**Potência 0 — Sangue-Ralo** *(pág. 215)*. Além do que está na tabela:

- **Sofre dano como os mortais.**
- **Não** pode criar Laços de Sangue, realizar o Abraço com certeza de sucesso, nem criar
  carniçais.
- **Apenas meios sobrenaturais** podem levá-lo a frenesi.
- Sofre **só 1 ponto de dano Superficial por turno** sob luz solar direta.

**Potência 6 e acima** *(pág. 217)*: o livro diz que esses vampiros **não são destinados a
personagens de jogador**, e que os níveis constam na tabela **para uso do Narrador**. O app
permite chegar lá pela geração baixa; quem monta antagonista é quem usa.

### 9.4 Duas células corrigidas

A tabela da Parte II §5 e `data-escudo.js` traziam dois valores errados na coluna de
penalidade de alimentação. Os dois vieram do mesmo engano: **a célula do livro é mesclada
entre duas linhas**, e foi lida na altura da linha de baixo.

| PS | Estava | É |
|---|---|---|
| 6 | sacia **1** a menos por humano | sacia **2** a menos (bloco mesclado 6–7) |
| 8 | matar para descer abaixo de **2** | abaixo de **3** (bloco mesclado 8–9) |

Os dois foram corrigidos no documento e no dado. É texto exibido ao jogador, não entra em
conta nenhuma — mas é regra que ele lê e usa.

---

## 10. Vitalidade e dano

*(conferido no básico, pág. 127)*

```
Vitalidade = Vigor + 3
```

Duas naturezas de dano:

- **Superficial** — contundente, garras, quedas. Para vampiros, **divide-se por dois,
  arredondando para CIMA**, antes de marcar.

  > **Estava escrito "para baixo" aqui, e o motor fazia isso.** O livro diz o contrário, e
  > em letra clara: *"A menos que especificado o contrário, divida dano Superficial pela
  > metade (arredondando para cima) antes de aplicá-lo à trilha."* (básico, pág. 126).
  > O erro era sistemático — todo Superficial ímpar chegava com meio ponto a menos, e **um
  > soco isolado não marcava nada**. Corrigido no motor e aqui, na §63 (item A6).
  >
  > Cuidado para não confundir com "Pegar Metade" (Parte I §6.3), que É para baixo.
- **Agravado** — fogo, luz solar, presas e garras de outros sobrenaturais, dano de Perdição.

**A ordem importa:** divida o Superficial pela metade **antes** de qualquer conversão.

**Debilitação** — com a trilha totalmente marcada, perde-se 2 dados nas piscinas que usem
Atributos físicos. (A Debilitação vinda de **degeneração de Humanidade** é diferente e vale
para *todas* as paradas — §12.)

**Conversão enquanto Debilitado** — cada nível de dano que chegar, **de qualquer natureza**,
converte um Superficial existente em Agravado: o `/` da trilha vira `X`. Não é só o
excedente que transborda; é todo dano recebido com a trilha cheia.

**O fim da trilha** — trilha inteira de Agravado tira o personagem do conflito, possivelmente
em definitivo: **coma ou morte** para mortal, **torpor** para vampiro. Fogo e luz solar levam
à Morte Final.

### Cura

| O quê | Como |
|---|---|
| **Superficial à Vitalidade** | Vampiro remove, **a cada turno**, a Quantidade Recuperada da tabela de Potência de Sangue, Inflamando o Sangue (uma Provocação). Mortal remove até o **Vigor** no início da sessão |
| **Agravado à Vitalidade** | **1 nível por noite**, e o custo é alto: esperar até a noite seguinte e fazer **três Checagens de Sangue**, além da Checagem regular do despertar *(pág. 218)* |
| **Superficial à Força de Vontade** | No início da sessão, até **Autocontrole ou Determinação, o que for maior** |
| **Agravado à Força de Vontade** | 1 nível no início da sessão seguinte, se o personagem **agiu conforme a Ambição** |

> Duas correções desta revisão: a cura de Superficial é **por turno**, não por noite; e dano
> Agravado à Vitalidade **tem** cura regular — 1 por noite com Provocação. O documento dizia
> que exigia "alimentação farta" e tempo indefinido, o que não está no livro.

Mortais com Medicina podem converter Agravado em Superficial: Inteligência + Medicina,
Dificuldade igual ao total de Agravado, **+1 na Dificuldade se estiver se tratando**. O
máximo convertível é **metade da Medicina, arredondando para cima**.

---

## 11. Força de Vontade

*(conferido no básico, págs. 126, 157 e 158)*

```
Força de Vontade (máximo) = Autocontrole + Determinação
```

É uma **trilha**, como a Vitalidade: tem um valor máximo e uma parada temporária, que é o
que sobra sem dano *(pág. 157)*.

> **Não se compra Força de Vontade.** Nem na criação, nem com experiência. Sobe só
> aumentando Autocontrole e/ou Determinação *(pág. 157)*. O app já faz assim — `vontade` é
> derivada em `ficha-regras.js`, e não existe custo de XP para ela.

### 11.1 Os quatro gastos

*(básico, pág. 158)*

1. **Rerrolar até 3 dados normais** (não Fome), exceto onde as regras excluem: rolagens de
   paradas de **trilhas** e Conflitos de Rolagem Única (§4).
2. **Assumir o controle do personagem por um turno** durante um frenesi ou sob coerção
   sobrenatural, como Dominação e Presença.
3. **Realizar movimentos minuciosos** — flexionar um dedo, abrir os olhos — **com o coração
   empalado** por uma estaca.
4. **Ignorar penalidades por dano à Vitalidade, incluindo Debilitação, por um turno.**

> **O que estava aqui errava em dois pontos.** Dizia "resistir a frenesi ou compulsão": o
> livro não fala em resistir, fala em **assumir o controle por um turno** — o frenesi
> continua, o personagem é que age. E faltava inteiro o gasto nº 3, o do empalado.

### 11.2 Como o gasto é marcado, e o que acontece quando acaba

*(básico, pág. 126 — a caixa da página)*

> Quando um ponto de uma trilha é gasto voluntariamente, como quando se usa Força de Vontade
> para rerrolar dados, marque-o como dano Superficial, um "/". **Se todos os pontos já
> tiverem recebido dano Superficial, transforme um em dano Agravado**, conforme as regras
> normais de Debilitação. **Dano Superficial sofrido graças a gastos não é dividido pela
> metade.**

Duas regras que faltavam aqui, e as duas importam:

- **A trilha cheia de Superficial não impede gastar** — o gasto passa a custar **Agravado**.
  Quem quer muito, paga mais caro; não fica sem opção.
- **A divisão por dois não vale para gasto.** Dano Superficial *sofrido* é dividido pela
  metade, arredondando para cima, antes de ir para a trilha; dano de **gasto** vai inteiro.

### 11.3 Debilitação por Vontade

*(básico, págs. 126 e 158)*

Sem pontos sobrando — por Superficial, por Agravado ou pela mistura dos dois — o personagem
está **Debilitado** e leva **−2 dados nos testes Sociais e Mentais**.

E o livro repete ali a regra da parada mínima: *"ele ainda consegue rolar um dado se for
necessário rolar sua parada, conforme as regras normais"*. É a mesma regra da §5 que o motor
ainda não segue — ver §14.1 do README, item A1.

### 11.4 Recuperação

*(básico, pág. 158)*

**No INÍCIO de uma sessão**, remove-se da trilha uma quantidade de dano Superficial igual ao
**Autocontrole ou à Determinação, o maior dos dois**.

> **Correção:** este documento dizia "ao fim da sessão". O livro diz no início — e a
> diferença tem consequência, porque existe uma **exceção**: se a noite de jogo terminar em
> cena de ação em que Vontade baixa aumenta a tensão, os personagens **mantêm** toda a
> Vontade com que terminaram a última sessão. Recuperar no fim apagaria o gancho.

A recuperação ao cumprir a **Ambição** ou o **Desejo** continua valendo; ela não está nesta
página, e ainda não foi reconferida.

---

## 12. Humanidade, Máculas e degeneração

*(conferido no básico, pág. 239)*

Humanidade vai de 0 a 10. Personagem novo começa em **7**.

- **Convicção** — uma linha que o personagem não cruza. Até três.
- **Pilar** — um mortal vivo que encarna aquela Convicção. Se o Pilar morre, a
  Convicção cai junto.

**Mácula** — marca temporária na trilha de Humanidade, ganha ao violar uma Convicção ou ao
cometer um ato claramente desumano. Anota-se **da direita para a esquerda**, enquanto a
Humanidade se preenche da esquerda para a direita; o espaço vazio entre as duas é o que a
mecânica usa. Uma violação clara mas justificável rende 1 Mácula; um ato verdadeiramente
bestial rende 2 ou mais. Violar um Princípio **em respeito a uma Convicção** reduz as
Máculas em uma ou mais.

**São dois eventos diferentes, e o documento os confundia até esta revisão:**

**Degeneração — acontece na hora, quando as Máculas transbordam.** Se o personagem acumula
mais Máculas do que os espaços vazios da trilha, ele:

- fica **Debilitado**, e aqui a penalidade de dois dados vale em **todas** as paradas — não
  só nas físicas, como na Debilitação vinda da Vitalidade;
- sofre **1 ponto de dano Agravado na Força de Vontade para cada Mácula que não coube**;
- fica **incapaz de violar um Princípio de propósito**; se for forçado a isso, faz teste de
  **frenesi de terror com Dificuldade 4**;
- permanece assim até o fim da sessão, quando o Remorso é testado normalmente. Pode encerrar
  antes **perdendo 1 ponto de Humanidade de propósito**, o que cancela as Máculas — ele
  racionaliza o que fez e aceita no que virou.

**Teste de Remorso — acontece no fim da sessão**, para todo personagem com qualquer Mácula
na trilha, tenha havido transbordo ou não.

- Piscina = **espaços vazios** da trilha, ou seja (10 − Humanidade − Máculas). **Mínimo 1
  dado**, mesmo com a trilha inteira preenchida.
- **Sem dados de Fome** — é rolagem de Humanidade (§2).
- **Ao menos 1 sucesso:** sentiu culpa o bastante. Mantém a Humanidade e **remove todas as
  Máculas**.
- **Nenhum sucesso:** a Besta venceu. **Perde 1 ponto de Humanidade** e então remove todas
  as Máculas.

> Exemplo do livro (pág. 239): Humanidade 6 com 2 Máculas rola **dois** dados.

Humanidade baixa aumenta a Gravidade da Perdição e o tempo de sono forçado durante o
dia. Humanidade 0 significa **Wight**: o personagem vira um monstro do Narrador.

---

### 12.1 Convicções *(básico, "Crenças", pág. 172)*

Cada personagem começa com **entre uma e três** Convicções: valores humanos que ele tenta
manter mesmo depois da morte. Não são Características — **não têm valor numérico** — e
mesmo assim têm efeito nas regras, porque as regras existem exatamente para representar e
desenvolver esse drama.

Podem refletir um código religioso, um núcleo ético pessoal, um código vampírico, ou apenas
as coisas que o personagem faz e se recusa a fazer sem nunca ter pesado o porquê. **O
Narrador pode rejeitar uma Convicção sugerida** por gosto ou por não caber na história que
pretende conduzir.

Exemplos do livro, todos eles:

| | |
|---|---|
| Não matarás | Roube dos ricos, dê aos pobres |
| Mate apenas os indignos/incrédulos/em combate justo/em legítima defesa | Rejeite a riqueza, pois ela corrompe |
| Nunca exponha crianças à violência | Nunca aja contra (insira seu próprio grupo/fé/seita) |
| Ame teu próximo como a ti mesmo | Ajude sempre as mulheres necessitadas |
| Desobediência é desonra | Defenda os marginalizados |
| Proteja os inocentes do perigo | Respeite o/a (insira a religião aqui) como sagrada e obedeça às suas leis morais |
| Coragem é a maior das virtudes | A verdade é sagrada; não mentirás |
| Mantenha sempre um juramento | A escravidão é má |
| Obedeça à autoridade | Minha pátria, certa ou errada |
| Ninguém pode me controlar | Nunca usar drogas (ou beber álcool) |
| Não torturarás | O culpado deve ser punido |
| Que cada um atue segundo suas habilidades, que cada um receba conforme suas necessidades | |

**Duas consequências mecânicas:**

- **Violar uma Convicção pode render uma ou mais Máculas**, a critério do Narrador. O motor
  tem os botões de Mácula na doca de Estado; **quem decide que houve violação é o jogador**, e
  é assim que deve ser — a Convicção não tem valor numérico para o motor comparar.
- **Mácula cometida a serviço de uma Convicção é reduzida em uma ou mais** (pág. 239).
  Implementado na §69: `Estado.ganharMacula` aceita `porConviccao`, e a doca liga a
  **atenuante** antes de marcar a Mácula. O exemplo do livro — 3 Máculas viram 2 porque Joana
  tem a Convicção *"minha família deve ser mantida fora disto"* — é teste, na suíte e no
  diagnóstico.

### 12.2 Pilares *(básico, pág. 173)*

Cada vampiro começa com **tantos Pilares quanto Convicções** — âncoras, alicerces, pedras de
toque, conforme o vampiro. São humanos que representam o que você valorizava em vida, e cada
um encarna uma Convicção específica.

> **Um Pilar tem de ser um ser humano vivo.** "Conectar-se à Humanidade por meio do desumano
> é, no mínimo, percorrer o caminho mais longo."

**Perdida a pessoa, perde-se a Convicção associada.** É a regra que dá peso a todo NPC que a
campanha declara como Pilar. Implementada na §69: `Estado.perderPilar(f, i)` esvazia o Pilar
**e** a Convicção pareada, cobra a Mácula da tabela do Escudo — **2** pela perda, **3** se foi
por ação sua — e avisa quando não sobrou Convicção nenhuma. A posição é esvaziada, não
removida do vetor: Convicção e Pilar são pareados por índice, e mexer no comprimento
desalinharia os outros pares.

Um Pilar pode ser: o cônjuge, amante ou pai/mãe humano ainda vivo; o filho humano ou, para
vampiros mais velhos, um descendente da família; alguém que se parece com quem você amou em
vida; alguém que você admirou em vida ou o descendente dele; uma das raras pessoas decentes
que existem, mesmo aos seus olhos — um voluntário no abrigo de animais, um padre, uma
enfermeira, uma idosa simpática do bairro; alguém que representa algo que você valorizou e a
que ainda se apega — um soldado, um jogador de beisebol, um músico, um clérigo da sua fé;
alguém que guarda ou protege algo que você valoriza — o porteiro do prédio em que você
morou, o policial da antiga ronda, um repórter comprometido, a mãe solteira que vive na casa
onde você passou a infância, **o cuidador que varre seu túmulo**.

No projeto, Convicção e Pilar são **pareados por índice** (`conviccoes[i]` ↔ `marcos[i]`),
que é exatamente o pareamento do livro. No Sabá a âncora troca de natureza: prende-se a um
**Ritae**, não a um mortal — ver Parte IV §5.

### 12.3 Ambição e Desejo *(básico, págs. 173–174)*

Relacionados, não idênticos. **Ambição** é objetivo de longo prazo — a aspiração de uma vida
que você não tem mais. **Desejo** é imediato: o anseio por uma vingança apressada, ou a
satisfação por meio dela.

| | Ambição | Desejo |
|---|---|---|
| Prazo | a crônica inteira | uma sessão |
| Quando paga | **no fim da sessão** em que o personagem trabalhou ativamente por ela | **imediatamente**, uma vez por sessão, ao agir decididamente por ele |
| O que recupera | 1 ponto de dano **Agravado** à Força de Vontade | 1 ponto de dano **Superficial** à Força de Vontade |

**A Ambição precisa ser mensurável** — "alcançar Humanidade 10", "libertar Chicago da
Camarilla", "trazer a Morte Final para (o ancião racista desta crônica)". Não serve "acabar
com o racismo". Se for improvável que se realize, ou se realizá-la encerraria a crônica,
ainda assim serve de caldo — só precisa ser **teoricamente atingível**. Alcançada, o jogador
escolhe outra.

**O Desejo se conecta ao mundo exterior.** A regra prática do livro: não vale a pena
considerar como Desejo algo que não envolva alguém ou algo listado no Mapa de
Relacionamentos. *"Eu quero dirigir um Maserati cor de cereja"* falha; *"eu quero dirigir o
Maserati cor de cereja de Cytherea"* funciona. E o Desejo muda rápido demais para ser
escrito na ficha — é rascunho, e o Narrador precisa vê-lo.

> **A intenção declarada da mecânica:** dar ao jogador incentivo para **agir**, em vez de
> esperar passivamente pela trama ou procrastinar defensivamente.

**O que o motor faz hoje:** `Estado.fimDeSessao` paga a Ambição no fechamento, com a natureza
certa — Agravado —, e ainda paga por beneficiar um Pilar.

O **Desejo paga na hora**, desde a §69: `Estado.realizarDesejo(f)` devolve 1 de Vontade
Superficial **uma vez por sessão**, no momento em que o jogador clica *"Agi pelo Desejo —
agora"*, e `fimDeSessao` limpa a marca para a noite seguinte. Marcar o Desejo também no
fechamento não paga duas vezes: o motor avisa que já foi pago.

> Antes da §69 o ponto só chegava depois de a noite acabar. O livro é explícito sobre o
> propósito — *"um incentivo para que o personagem **aja**, em vez de esperar passivamente
> pela trama ou ficar procrastinando defensivamente"* — e um incentivo pago no fim da sessão
> não é incentivo.

---

## 13. Frenesi e Compulsão

*(conferido no básico, pág. 220)*

**Frenesi** tem três gatilhos: **Fome**, **Fúria** e **Terror** (fogo, sol, Fé
verdadeira).

Resistir: **Autocontrole + Determinação** contra uma dificuldade dada pela situação.
Sucesso segura por uma cena. Falha entrega o controle ao Narrador.

O livro chama isso de **"teste de Força de Vontade"** (pág. 220), e a consequência é a da
§2: **vai sem dados de Fome**, e portanto não pode dar Crítico Bestial nem Falha Bestial.

**Enquanto está em frenesi**, o vampiro:

- fica **imune a penalidades de Vitalidade** que não cheguem a ser mutilações;
- só usa **Disciplinas físicas** — Celeridade, Fortitude, Potência;
- **resiste a Disciplinas mentais** (Dominação, Presença) com **três dados extras**; se não
  houver piscina de resistência, quem usa a Disciplina leva **+2 na Dificuldade**;
- **não pode gastar Força de Vontade para rerrolar**, mas pode gastar **1 ponto para assumir
  o controle por um único turno**;
- não pode ser provocado a outro frenesi nem ganhar Compulsões enquanto durar.

O **frenesi de fome** termina quando a Fome cai para **1 ou menos**. O de **terror** termina
quando o vampiro não percebe mais o perigo, ou quando a cena acaba. O de **fúria** dura até
o alvo ser destruído — e aí cabe um teste de Força de Vontade com Dificuldade 3, ou 5 se
ainda houver inimigos de pé.

**Curtir a Onda** — entregar o controle de propósito, escolhendo como a Besta age. **Sem
teste.**

**Impulso Desesperado** — em vez de aceitar uma falha, o jogador pode invocar a Besta:
o teste vira sucesso, mas o personagem age de forma desesperada e ganha uma Mácula.

**Compulsão de Clã** — disparada por Falha Bestial (ou a critério do Narrador). Cada
clã tem a sua, listada em `comum/dados/data-clans.js`, e ela impõe penalidade de dois dados
até ser satisfeita.

---

## 14. Disciplinas

*(conferido no básico, págs. 244–288 — as regras gerais na 244, e a lista de poderes de cada
Disciplina página por página na §64 do README)*

### 14.1 Aprendendo

- Escala de **1 a 5**, como qualquer outra Característica.
- Para gastar experiência numa Disciplina, o personagem **precisa ter se alimentado da
  Ressonância adequada**. Não é livre.
- Para aprender uma Disciplina **inteiramente nova que não seja do clã**, precisa também
  **beber o Sangue de alguém que a possua**.
- Na criação: duas Disciplinas do clã, **2 pontos numa e 1 na outra**, mais **1 ponto** do
  Tipo de Predador.

### 14.2 Escolhendo poderes

- Cada ponto ganho na Disciplina dá **um poder**, do **nível dele ou abaixo**.
- Um vampiro tem normalmente **o mesmo número de pontos e de poderes** numa Disciplina —
  nem mais, nem menos.
- Um poder **Amálgama não pode ser escolhido** sem o pré-requisito, em nível nenhum.

### 14.3 Usando

- Ativar custa **Provocação** quando o poder diz; alguns são gratuitos ou passivos.
- **Um poder de Disciplina ativado por turno.** Mas **qualquer quantidade pode estar ativa
  ao mesmo tempo** — o limite é de ativação, não de manutenção.
- **Poderes não se ativam retroativamente.** Eles respondem a uma ação tomada contra o
  usuário; não a interrompem.

### 14.4 O bônus de Potência de Sangue

Vampiros somam **metade da Potência de Sangue, arredondando para baixo**, às paradas para
**usar ou resistir** a Disciplinas. É a coluna *Bônus de Poder de Disciplina* da tabela na
Parte II §5 — as duas dizem a mesma coisa, e é assim que se confere uma contra a outra.

Duas travas:

- O bônus entra **só** nas paradas que se beneficiam diretamente da Disciplina, ou que usam
  a Disciplina como uma das Características da rolagem.
- Se **mais de uma Disciplina** aumenta a mesma rolagem, o bônus entra **uma vez só**.

> **Este aviso estava velho, e era falso.** Ele dizia que o bônus não existia no motor e que
> `bonusDisciplina` não era lido por linha nenhuma. **Existe:** `Arbitro.bonusDePotencia()`
> é chamada por `piscinaFinal()`, devolve `Math.floor(potência / 2)` e só entra quando há
> Disciplina na parada. Conferido contra a tabela da Parte II §5, geração por geração, e há
> teste que compara os dois (§65).
>
> Fica o registro do erro, que é do tipo que este documento já cometeu duas vezes: **o aviso
> sobreviveu ao conserto.** Quem lesse aqui concluiria que o bônus não é aplicado, e ele é.

### 14.5 Amálgamas

Poder que exige proficiência em **mais de uma** Disciplina. O personagem precisa ter a
quantidade de pontos listada na outra Disciplina para adquiri-lo.

Para efeito de tipo e classificação, um poder Amálgama **pertence às duas Disciplinas**.

Exemplo: *Braços de Arimã* é Oblívio 2 com Amálgama Potência 2.

> **As amálgamas não são mais uma lista à mão.** Cada poder declara a sua em
> `data-disciplinas.js`, e `Arbitro.AMALGAMAS` é derivada dali. Eram duas listas para o
> mesmo fato, e discordavam: o livro tem oito amálgamas só no básico, e o motor conhecia
> duas. §64.4 do README.

### 14.6 Rituais e Cerimônias *(Cerimônias conferidas no `Oblivio.pdf`, pág. 14 — §96)*

**Feitiçaria do Sangue** usa **Rituais**; **Oblívio** usa **Cerimônias**. Ambos exigem
tempo, preparação e componentes, e o nível **não pode passar do nível da Disciplina**. O
custo em experiência é o **nível × 3** (§17).

**O que faltava das Cerimônias, e agora está no motor** (`motor-oblivio.js`):

| | Regra |
|---|---|
| Custo | Uma **Checagem de Sangue** |
| Preparo | **Cinco minutos por nível** |
| Teste | **Determinação + Oblívio**, Dificuldade = **nível da Cerimônia + 1** |
| Pré-requisito | **Cada Cerimônia exige um poder de Oblívio**, e não se compra nem se realiza sem ele |
| Na criação | **Uma** Cerimônia de Nível 1, se o personagem tiver o poder que ela exige |
| Aprender em jogo | XP, um professor que a conheça, e **no mínimo nível² semanas** |

> "Cada cerimônia tem como pré-requisito um poder de Oblívio. Esse requisito serve como uma
> **porta de entrada para necromantes pela qual feiticeiros de sangue não precisam passar**."

Duas restrições que o livro escreve e que não são de dado: o usuário só realiza Cerimônias
**benéficas em si mesmo**, salvo texto em contrário; e quem ganhou Oblívio **bebendo de
temperamento vazio** — carniçais, necromantes, sangues-ralos — leva os **poderes**, não as
Cerimônias.

### 14.6.1 As regras gerais de Oblívio *(`Oblivio.pdf`, pág. 4 — §96)*

Oblívio é a única Disciplina do projeto com regras próprias de ambiente, e elas nunca
existiram no motor.

**A luz manda.** Três estados, e o primeiro não é penalidade, é impedimento:

| Ambiente | Efeito |
|---|---|
| Iluminação intensa, luz do dia, cômodo **sem sombras** | **Impede.** A Disciplina não funciona |
| Cômodo **moderadamente iluminado** | **−1 dado** na rolagem da Disciplina |
| Luz **ultravioleta ou infravermelha** | **Nenhuma restrição** — o livro isenta as duas por nome |

**A Checagem de Sangue de Oblívio corrói pelas duas pontas.** Numa Checagem comum só o **1**
cobra; aqui:

> "um resultado **'1' ou '10'** gera Mácula, além do nível de Fome ganho. Se a Potência de
> Sangue do usuário permitir uma rerrolagem (…), o usuário pode **escolher qualquer um dos
> dois resultados**."

**Tipo:** Mental · **Ameaça à Máscara:** média para alta · **Ressonância de Sangue:**
psicopatas e emocionalmente desconectados; sangue sem Ressonância.

Projeções e espíritos de Oblívio sofrem fogo e sol como vampiros de **Potência de Sangue 1**,
e mais **um nível de Agravado por rodada** sob luz direta e brilhante.

### 14.7 Oblívio — lista oficial

Extraída de `Livros/Regras/Oblivio.pdf`. Azul = mais comum entre Lasombra; vermelho = Hecata.

> **Esta tabela estava certa, e o dado errado.** `data-disciplinas.js` trazia no nível 5
> *Tempestade de Ossos* e *Chamado do Além* — **nenhum dos dois aparece uma única vez** no
> `Oblivio.pdf`. Os quatro daqui aparecem. Corrigido no dado na §65, e as duas listas agora
> são comparadas por teste: se divergirem, de qualquer lado, `npm test` cai.
>
> Vale a nota: aqui **o documento tinha razão contra o código**, o inverso do que a §58 à §60
> encontrou. A regra não é "o código está certo" nem "o documento está certo" — **é o livro.**

| Nível | Poderes |
|---|---|
| 1 | Manto Obscuro · Visão de Oblívio · Do Pó ao Pó · Grilhões que Vinculam |
| 2 | Projetar Sombra · Braços de Arimã *(Amálgama: Potência 2)* · Precognição Fatal *(Amálgama: Auspícios 2)* · Onde a Mortalha Afina |
| 3 | Perspectiva da Sombria · Toque de Oblívio · Aura de Decadência · Banquete de Paixões |
| 4 | A Mortalha Estígia · Praga Necrótica |
| 5 | Passo Sombrio · Avatar Tenebroso · Skulds Realizada · Espírito em Declínio |

**Cerimônias — dez, e cada uma com o poder que exige** *(§96)*

> **Esta tabela tinha três Cerimônias que não existem.** *Cadáver Irracional*, *Servo
> Homuncular* e *Cadáver Violento* não são Cerimônias: são os **blocos de estatística das
> criaturas** que as Cerimônias criam — *"Parada de Dados Padrão: Físico 2, Social 0, Mental
> 0"*, *"Atributos Secundários: Vitalidade 6, Força de Vontade 0"*.
>
> É o mesmo engano da §65, do outro lado: lá o **dado** tinha dois poderes que não existem,
> aqui o **documento** tinha três Cerimônias que são criaturas. A regra continua a mesma —
> não é "o código está certo" nem "o documento está certo", **é o livro**.

| Nível | Cerimônia | Poder exigido |
|---|---|---|
| 1 | Invocar o Espírito | Grilhões que Vinculam |
| 1 | A Dádiva da Vida Falsa | Do Pó ao Pó |
| 2 | Despertar do Servo Homuncular | Onde a Mortalha Afina |
| 2 | Obrigar Espíritos | Onde a Mortalha Afina |
| 3 | Espírito Anfitrião | Aura de Decadência |
| 3 | Hordas Trôpegas | Aura de Decadência |
| 4 | Vincular o Espírito | Praga Necrótica |
| 4 | Rasgar a Mortalha | Praga Necrótica |
| 5 | Ex Nihilo | Espírito em Declínio |
| 5 | Benção Lazarena | Skulds Realizada |

**O nível do poder exigido é sempre o nível da Cerimônia** — em todas as dez. Há teste
afirmando isso: é regra escrita virando invariante.

Projeções e espíritos de Oblívio sofrem dano de fogo e sol como se fossem vampiros de
Potência de Sangue 1.

### 14.8 Onde estão os poderes das outras Disciplinas

**Em `comum/dados/data-disciplinas.js`, e só lá.**

A tentação seria repetir aqui as onze listas do básico, como a §14.7 faz com Oblívio. Não
repete, e a razão é o defeito que a §64 achou: **duas listas para o mesmo fato divergem**, e
divergem em silêncio. Foi assim que `Arbitro.AMALGAMAS` ficou com duas entradas enquanto o
livro tinha oito, e foi assim que oito referências de `PODER_EXIGE` passaram a apontar para
poder inexistente.

O que o dado carrega, e este documento não precisa repetir:

- os **112 poderes**, por Disciplina e por nível;
- a **página de origem** de cada Disciplina, no campo `pagina`;
- a **amálgama** de cada poder que tem uma, no próprio poder.

A §14.7 continua aqui porque Oblívio **não está no manual básico** e a sua lista foi extraída
à mão do `Oblivio.pdf` — ela é fonte, e não cópia. E há teste que compara as duas: se o dado
e esta tabela divergirem, de qualquer lado, `npm test` cai (§65).


---

## 15. Combate

*(conferido no básico em duas passadas: as págs. 301–302 na §63, e o capítulo "Conflito
Avançado" inteiro — págs. 295–305 — na §90. O que estava aqui antes da §63 vinha do Guia do
Jogador e divergia do livro em quatro pontos; a §90 achou mais três, e um deles não era
divergência de tradução, era regra inventada — ver §15.7)*

### 15.1 Corpo a corpo

| Ataque | Piscina |
|---|---|
| Desarmado, garras | **Força + Briga** |
| Arma branca de **uma** mão | **Destreza + Armas Brancas** |
| Arma branca de **duas** mãos | **Força + Armas Brancas** |

**Defesa:** o defensor rola a mesma coisa que o atacante, **ou Destreza + Atletismo para
esquivar**.

Quando os dois se atacam ao mesmo tempo, ambos rolam uma vez e **só quem tirar mais
sucessos causa dano**.

*Opcional:* quem tem a arma mais longa ganha **+1 dado no primeiro turno**.

### 15.2 À distância

| Situação | Piscina |
|---|---|
| Tiro normal | **Autocontrole + Armas de Fogo** |
| Tiro de franco-atirador | Determinação + Armas de Fogo |
| Duelo "à meia-noite", primeiro tiro | Destreza + Armas de Fogo |
| Arma de arremesso | **Destreza + Atletismo** |
| Arma de fogo **dentro** do corpo a corpo | **Força + Armas de Fogo** |

> **Atenção:** a piscina padrão é **Autocontrole**, não Destreza. O documento dizia Destreza
> até esta revisão, e isso veio do Guia do Jogador. Destreza só aparece no caso específico do
> duelo.

**Defesa contra ataque à distância:** **Destreza + Atletismo** — manter-se em movimento e
usar a cobertura disponível. Não é "só se houver cobertura": é a defesa normal.

**Alvo estacionário** não tem parada de defesa: defende-se com **Dificuldade 1 fixa**.

**Fora do alcance efetivo da arma: −2 dados.** Não é impossível — é penalidade.

Atirando de dentro de um corpo a corpo: **−2 dados** se o alvo estiver fora da briga, e
**mais −2** se a arma for maior que uma pistola. Quem usa a arma de fogo no meio da briga
não sofre a penalidade de estar sem cobertura.

*Opcional:* poder de fogo superior, ou disposição de gastar mais munição, dá **+1 dado**.

### 15.3 Cobertura

**A cobertura modifica a parada de DEFESA, em dados** — não a dificuldade do atacante.

| Cobertura | Modificador em dados |
|---|---|
| Nenhuma | **−2** |
| Apenas ocultação (arbusto, árvore pequena contra rifle) | **−1** |
| Cobertura rígida (bloco de motor, esquina de concreto) | **0** |
| Entrincheiramento (sacos de areia, casamata) | **+1** |
| Ameia (fenda de disparo de veículo militar) | **+2** |

### 15.4 Agarramento

Força + Briga, disputado. Quem agarra e vence **não causa dano**: contém o oponente, que
não pode se mover nem atacar terceiros, mas ainda age contra o agarrador normalmente.

No turno seguinte, o agarrador disputa **Força + Briga** de novo e, vencendo, escolhe:

- causar dano pela margem, como num ataque normal;
- **morder** (se for vampiro), causando **2 de dano Agravado** — ver Ataques com Mordida;
- apenas mantê-lo imóvel.

Se o agarrado vencer, escapa e se move livremente no turno seguinte. Mordida contra alvo
agarrado **não sofre a penalidade de ataque localizado**.

### 15.5 Mordida

*(básico, pág. 213)*

Declarar **antes de rolar**. Duas formas: vencer uma disputa de agarramento, ou ataque
localizado com **Força + Briga** e **penalidade de 1 sucesso**.

Acertando, as presas entram e causam **exatamente 2 de dano Agravado**, independente da
margem ou do modificador de dano da arma. Alimentar-se causa **1 de Agravado por turno** em
mortais. Contra vampiro, o ataque para se alimentar **aumenta a Fome do alvo**.

### 15.6 Dano

Dano = **margem de sucesso + bônus da arma**. Desarmado causa Superficial; armas brancas e
de fogo causam Superficial em vampiros e **Agravado em mortais**.

**Ataques localizados** — mirar parte específica para um resultado que não seja trauma
máximo: furar pneu, arrancar objeto da mão, acertar a perna de quem foge. É também o que se
usa para **estacar o coração** e **decapitar**.

**Dividir a piscina** — é possível atacar vários alvos dividindo os dados, com todas as
penalidades que isso implica.

### 15.7 Iniciativa *(pág. 300, e pág. 125)*

O básico tem **dois** sistemas, e o projeto usava um terceiro, que não é de livro nenhum —
`d10 + Destreza + Raciocínio`. Corrigido na §90.

| Sistema | Onde | O que é |
|---|---|---|
| **Básico** | pág. 125 | não há valor: ordena-se por situação — corpo a corpo **já engajado**, depois **à distância**, depois corpo a corpo **recém-iniciado**, depois o resto. Desempate por Destreza + Raciocínio, e depois pelos pontos da Habilidade usada |
| **Avançado** | pág. 300 | **Iniciativa = Autocontrole + Percepção**, e ela é **estática**: não se rola, e não muda durante o combate, "mesmo quando um combatente muda a Habilidade de combate que ele usa" |

**O motor usa o avançado**, e a escolha é de projeto: esta mesa **desenha** uma lista de
iniciativa, e quem desenha uma lista já escolheu o sistema que tem uma. O livro avisa que ele
*"desacelera o combate significativamente"*.

**Num duelo formal**, Destreza substitui Autocontrole; num duelo **muito** formal, Determinação.

**Desempates, na ordem do livro:** personagens dos jogadores antes dos do Narrador · vampiros
antes de mortais · Autocontrole decrescente · e então, diz o livro, *role um dado*.

> **O último degrau é o único que diverge.** Aqui o desempate final é o **nome**, e não um dado.
> Duas razões: este motor não produz acaso desde a §82, e a ordem é desenhada numa lista que o
> jogador relê — ordem estável vale mais do que o quarto critério de um empate que já passou
> por três.

**Passar a vez** *(pág. 300)* põe o combatente **por último**, e o mantém lá pelo resto do
conflito. Quem passa depois entra **antes** de quem já tinha passado.

### 15.8 As opções do Conflito Avançado *(págs. 298–303)*

Todas opcionais, todas escolha de quem ataca ou de quem se defende.

| Opção | Efeito | Preço |
|---|---|---|
| **Ataque Total** | **+1 no dano** | não se defende de nada no turno; descarrega a arma à distância; **não vale com surpresa**; falhando, quem age contra ele ganha +1 dado no turno seguinte |
| **Defesa Total** | **+1 dado** em todas as defesas do turno | nada além de uma ação menor |
| **Ataque surpresa** | o primeiro é contra **Dificuldade 1 fixa** | exige vencer Destreza + Furtividade contra o melhor Raciocínio + Percepção da oposição |
| **Ataque localizado** | atinge um ponto escolhido | **−2 sucessos** no resultado, e o Narrador pode mudar o número: −1 para o pneu de um carro, −4 para a tubulação de combustível de um avião |
| **Ações menores** | preparar arma, recarregar, andar alguns passos | **subtraem dados** da ação principal; o Narrador diz quantas cabem |

**O ataque localizado subtrai SUCESSO, e não dado.** O livro é explícito — *"após realizar o
teste, ele subtrai sucessos"* —, e a diferença importa: tirar dados mexeria na chance de Falha
Bestial, e o livro não mandou mexer nela.

**A estaca depende dele.** O rodapé da tabela de armas *(pág. 304)* pede **ataque localizado no
coração** *e* **5+ de dano**. Até a §90 o motor lia só a segunda metade, e a estaca paralisava
sem pagar os −2 sucessos que são justamente o que a tornam uma aposta.

**Ferimentos Incapacitantes** *(pág. 303)* — opcional, "para jogadores à procura de um combate
mais substancial". Depois de sofrer dano **estando já Debilitado**, rola-se **1d10 + o dano
Agravado atual** na trilha de Vitalidade:

| Rolagem | Ferimento |
|---|---|
| 1–6 | **Atordoado** — gaste 1 de Força de Vontade ou perca um turno |
| 7–8 | **Trauma grave na cabeça** — Físicas −1, Mentais −2 |
| 9–10 | **Membro quebrado** (−3 com aquele membro) **ou Cegado** (−3 no que envolva visão, inclusive combate). O Narrador decide |
| 11 | **Ferimento Maciço** — tudo −2, e +1 a todo dano adicional |
| 12 | **Aleijado** — como o membro quebrado, mas o membro é perdido |
| 13+ | Morte, para mortais; **torpor imediato**, para vampiros |

**Crítico contra mortal anônimo** *(pág. 303)* — incapacita **sem calcular dano**. É regra de
ritmo, e o livro diz isso: existe para não gastar turno com segurança de boate. Um crítico
bestial, nesse caso, costuma ser letal. PN com nome próprio na cena não é anônimo.

### 15.9 Armadura *(pág. 304)*

> **A armadura NÃO subtrai dano. Ela converte.**
>
> *"Cada ponto de armadura transforma 1 ponto de dano Agravado originário de armas perfurantes
> ou de lâmina (por rolagem de dano) em dano Superficial, que então é cortado pela metade como
> de costume. Essa proteção só costuma ser útil para mortais e sangues-ralos, já que vampiros já
> consideram esses tipos de dano Superficiais."*

O motor subtraía até a §90, e a diferença não é de número: é de **quem a armadura serve**.
Contra um vampiro, bala e lâmina já são Superficiais, e não sobra Agravado para converter —
um neonato de colete não fica mais duro. **Fogo passa inteiro**: a conversão vale só para arma
perfurante ou de lâmina, e o corte é pela **origem** do Agravado — a classe da arma converte,
o item que declara a própria natureza (fogo, hafla, sopro de dragão) não.

> **Leitura, e não texto do livro:** as **garras** contam como perfuração aqui. O livro não as
> excetua nem as nomeia; a alternativa seria deixá-las de fora por não serem "arma", e isso faria
> um colete parar uma faca e não parar uma garra.

| Armadura | Valor |
|---|---|
| Roupa reforçada, couro pesado | **2** — e **zero contra balas** |
| Tecido balístico | 2 |
| Colete Kevlar, jaqueta flak | 4 |
| Armadura tática da SWAT, armadura militar | 6 — e **−1 dado** em rolagens de Destreza |

### 15.10 Dano de arma *(pág. 304)*

| Valor | Armas |
|---|---|
| **+0** | Arma improvisada, estaca |
| **+1** | Impacto leve (soco inglês) |
| **+2** | Impacto pesado (cassetete, taco, chave de roda, bastão de baseball) · perfuração leve (virote de besta, canivete) · disparo leve (pistola .22) |
| **+3** | Arma branca pesada (espada de lâmina larga, machado de bombeiro) · disparo médio (rifle .308, pistola 9 mm, escopeta dentro do alcance efetivo) |
| **+4** | Disparo pesado (espingarda 12 à curta distância, Magnum .357) · arma branca enorme (claymore, viga de aço) |

> **Estes nomes eram do Escudo, e dois deles não casavam.** A linha de +2 se chamava "Impacto
> médio (bastão, barra de ferro)"; quem escrevesse **cassetete** ou **taco de baseball** — as
> palavras do livro — caía no caso final e levava **dano 0** com uma arma de +2. Na armadura era
> pior: as duas linhas do meio estavam trocadas, e "Colete Kevlar" não casava com nada.
> Corrigido na §90, e o casador passou a ter uma lista de **nomes** separada do texto de
> exibição, para que corrigir uma tradução não mude em silêncio o que ela reconhece.

### 15.11 Combate social — "Facas em seus Sorrisos" *(págs. 304–305)*

*"Resolva conflitos sociais com as mesmas mecânicas usadas para combates físicos."* Mudam três
coisas:

1. a trilha ferida é a **Força de Vontade**;
2. a Iniciativa, quando importa, é **Raciocínio + Etiqueta**;
3. há um bônus de dano pela **audiência**.

Os dois lados rolam, o vencedor subtrai os sucessos do perdedor e aplica o resto como dano à
Força de Vontade. **Conceder acontece antes das paradas serem roladas**, e quem concede não
sofre dano nenhum — é a válvula que impede a discussão perdida de virar moedor.

| Quem assiste | Dano extra à Força de Vontade |
|---|---|
| Apenas os oponentes | +0 |
| Sua coterie | +1 |
| Membros cujas opiniões você valoriza: mentor, amante | +2 |
| Primogênito, Harpia, outro rival verdadeiro | +3 |
| O Príncipe, o Barão ou outra figura poderosa | +4 |

**Apenas estar presente não conta**: a audiência precisa estar *interessada no resultado*.

O combate social **pode se estender** por dias, semanas ou séculos, e termina quando um lado se
dá por vencido — em geral ao ficar **Debilitado**, às vezes só no colapso mental total, com a
trilha de Vontade cheia de Agravado.

### 15.12 O que o motor NÃO aplica do Conflito Avançado

| Item | Págs. | Por quê |
|---|---|---|
| **Três, Dois, Feito** · **Já terminamos aqui?** | 295 | conselho de ritmo ao Narrador: encerrar a cena após três interações. Não há o que um motor arbitre |
| **Concessões** | 295 | conclusão negociada entre Narrador e jogadores. A recompensa mecânica (+1 num Antecedente da coterie, ou um ponto de Vontade de volta) é fácil; a negociação é a regra, e ela é entre pessoas |
| **Manobra · Bloqueio · Avanço** | 297 | ações variantes cujo efeito é "+1 a 3 dados, a critério do Narrador". Sem um Narrador que julgue o que é manobra, virariam bônus de graça |
| **Movimento em conflitos** | 298 | *"O movimento em Vampiro costuma ser abstrato"*; o mapa é opcional e o projeto resolve alcance pelo grafo de locais desde a §49 |
| **Recarregar e contar munição** | 302 | o livro o oferece como sabor opcional — *"em Vampiro geralmente não se anota o gasto de munição"* |

### 15.13 Conflito de Rolagem Única *(págs. 296 e 298–299 — §95)*

Resolver um conflito inteiro — ou **encerrar** um que já está rolando — numa rolagem só.

> "Um conflito não precisa necessariamente ser resolvido como uma série detalhada de
> interações (…). Ele também pode ser resolvido de um modo mais geral, especialmente se
> contiver menos potencial para gerar drama ou envolver poucos jogadores."

**São DUAS tabelas de Dificuldade, e este documento tinha só metade de uma.** A versão anterior
da §15.12 dizia *"Dificuldade 2/4/6"*, que é a primeira tabela sem os ajustes — e usá-la para
encerrar uma briga em andamento dá a resposta errada em três dos quatro casos.

**Abrir o conflito inteiro — pelo poder da oposição** *(pág. 298–299)*

| Situação | Dificuldade |
|---|---|
| A oposição é significativamente mais fraca, ou a meta é simples de ser alcançada | **2** |
| Ambos os lados se igualam em poder, ou a meta é um desafio e tanto | **4** |
| A oposição é muito mais forte, ou a meta é extremamente difícil | **6** |

**Encerrar um conflito em andamento — pelos últimos três turnos** *(pág. 296)*

| Situação | Dificuldade |
|---|---|
| A maior parte do combate foi favorável, ou venceram os últimos três turnos | **3** |
| Ambos os lados sofreram igualmente, ou venceram dois de três turnos | **4** |
| Se deram mal, ou venceram só uma interação de três | **5** |
| Tiveram a sorte de sobreviver, ou perderam os últimos três turnos | **6** |

**Os dois ajustes**, cada um de 1, e independentes entre si:

- vantagem em **Disciplinas ou poderes sobrenaturais** equivalentes;
- vantagem de **posição, preparação ou surpresa**.

**Como rola:** cada jogador faz **uma** rolagem com parada adequada, **sem rerrolagem de Força
de Vontade e sem Surto de Sangue**. **A oposição não rola.** Quanto mais personagens vencerem,
melhor o resultado: a oposição pode se separar, cair ferida, abandonar o local, render-se.

**O dano, que é o coração da regra:**

> "Cada personagem do jogador sofre uma quantidade de dano igual à diferença entre seus
> sucessos e o **dobro** da Dificuldade. Esse dano **não pode ser diminuído por armadura ou
> meios sobrenaturais, como Fortitude**. (…) **Não diminua pela metade o dano Superficial**
> nesse caso."

**Vencer não isenta.** No exemplo do livro, Rebeca supera a Dificuldade 4 com cinco sucessos e
ainda leva 3 pontos de Agravado na Força de Vontade — 8 − 5 = 3. É o preço da vitória, e é o
ponto da regra.

A natureza do dano depende da oposição e das armas: agentes da Segunda Inquisição costumam
causar **Agravado**.

**Opcional:** em vez de aplicar níveis de dano, permitir que os jogadores o diminuam adotando
**Máculas** — por terem alcançado o objetivo com brutalidade maior.

---

## 16. Criação de personagem

*(conferido no básico em duas passadas: o sumário da pág. 136, e o capítulo inteiro — págs.
135–154 — na §91)*

| Etapa | Regra |
|---|---|
| Atributos | Um em 4, três em 3, quatro em 2, um em 1 |
| Habilidades | **Especialista** 1×4, 3×3, 3×2, 3×1 · **Equilibrado** 3×3, 5×2, 7×1 · **Pau pra Toda Obra** 1×3, 8×2, 10×1 |
| Especializações | **Erudição, Ofícios, Performance e Ciência ganham uma de graça**, mais **uma gratuita à escolha**, mais **uma do Tipo de Predador**. Máximo por Habilidade = o valor dela |
| Disciplinas | Duas do clã: **2 pontos numa, 1 na outra**, mais 1 do Tipo de Predador. Caitiff escolhe duas quaisquer. **Sangue-ralo não tem Disciplina intrínseca** |
| Vantagens | 7 pontos entre Antecedentes e Méritos |
| Defeitos | 2 pontos |
| Convicções | 1 a 3, cada uma com seu Pilar |
| Humanidade | 7, ajustada pelo Tipo de Predador |
| Potência de Sangue | 1 (0 para Sangue Fraco) |

O que o Tipo de Predador concede **não conta** no orçamento de 7 e 2 pontos.

### 16.1 O Mar do Tempo — idade da coterie

A idade define Potência de Sangue inicial e experiência de partida:

| Faixa | Quando foi Abraçada | Geração e Potência | Extras |
|---|---|---|---|
| **Criança** | Nos últimos 15 anos | 14ª–16ª (sangue-ralo) → PS **0**; 12ª–13ª → PS **1** | — |
| **Neófita** | Entre 1940 e uma década atrás | 12ª–13ª → PS **1** | **15 pontos de experiência** |
| **Ancilla** | Entre 1780 e 1940 | 10ª–11ª → PS **2** | **+2 Vantagens, +2 Defeitos, −1 Humanidade, 35 pontos de experiência** |

---

### 16.2 A vida humana — o método longo *(págs. 145–146)*

O quadro das três distribuições **é a alternativa**, e o livro diz isso no título: *"Escolha
alternativa rápida de Habilidades"* *(pág. 147)*. Alternativa a este método, que é o texto
principal e que o projeto não tinha até a §91.

Aqui as Habilidades não são distribuídas: são **contadas** a partir da vida que o personagem teve.

| Etapa | O que dá |
|---|---|
| **Profissão** | duas Habilidades em **3** e duas em **2**, mais uma **especialização profissional** |
| **Evento-chave** | uma em **3** e outra em **2** |
| **Passatempos** | **três** Habilidades em **1** |
| **Habilidades adicionais** | **Especialista**: mais uma em **4** · **Generalista**: mais duas em **2** e quatro em **1** |

> **E aqui está o que só se vê somando.**
>
> Profissão + evento + passatempos + **Especialista** = uma em 4, três em 3, três em 2, três em 1
> — **a distribuição Especialista**.
>
> Profissão + evento + passatempos + **Generalista** = três em 3, cinco em 2, sete em 1
> — **a distribuição Equilibrado**.
>
> **O método longo gera o quadro rápido.** Não são dois sistemas concorrentes: o quadro é este
> método escrito de trás para frente. Só o **Pau pra Toda Obra** existe apenas no quadro.

O livro dá **nove pacotes profissionais**, **dez eventos** e **dez passatempos**, todos em
`data-criacao.js`. Numa mesa solo isso vale mais do que numa mesa com gente: quem escolheu
"Mafioso", "Vítima de crime" e "Tirador de racha" já tem três cenas antes da primeira noite.

**A especialização livre não sai de onde nasceu** *(pág. 146)*: ao ganhar o primeiro ponto em
Erudição, Ofícios, Performance ou Ciência escolhe-se uma especialização para **aquela**
Habilidade, e ela não pode ser movida para outra. A profissional, sim: quem for Especialista pode
levá-la para a Habilidade de nível 4.

> **Um erro do livro, declarado.** O evento nº 2, "Separação dolorosa", oferece *"Manipulação ou
> Subterfúgio"* — e **Manipulação é Atributo**, numa caixa que lista Habilidades. Não dá para saber
> se é erro de tradução ou do original, e inventar a Habilidade "certa" seria escrever a regra em
> vez de lê-la. A entrada ficou com uma opção só, e o motivo está escrito nela.

### 16.3 O que o Predador acrescenta *(pág. 149)*

Cada tipo de Predador dá uma especialização, um ponto numa Disciplina e as Vantagens e Defeitos
listados — e nada disso conta no orçamento de 7 e 2 pontos. E há uma regra que faltava ao motor:

> *"Se um tipo de Predador adicionar uma especialização cuja Habilidade correspondente **você não
> possua**, ganhe um ponto nessa Habilidade."*

Sem ela, o Predador entregava uma especialização pendurada numa Habilidade zerada — e
especialização em Habilidade que ninguém tem é enfeite.

**O Predador não é obrigatório para todos.** *"Os sugadores de sangue mais recentes, como os
sangues-ralos e diversas Crianças da Noite, não selecionam um tipo de Predador, pois ainda estão
descobrindo esse aspecto da sua existência noturna."* A mesa exigia Predador de todos, e com isso
um sangue-ralo não conseguia abrir mesa.

### 16.4 Sangue-ralo na criação *(págs. 142, 149 e 151)*

| Regra | |
|---|---|
| Clã | **nenhum** |
| Disciplinas | **não distribui ponto nenhum**. As que ele usa são temporárias, e vêm da Ressonância do sangue que bebeu |
| Alquimia Sangue-Ralo | aprende-se por uma **Qualidade** ou com **experiência** — não de graça na criação |
| Qualidades e Defeitos | de **uma a três** Qualidades de Sangue-Ralo, e **o mesmo número** de Defeitos |
| Antecedentes vedados | **Laço, Mawla, Lacaios e Status** não se compram na criação |
| Potência de Sangue | **0** |

O projeto mandava pôr um ponto em Alquimia — um ponto que o livro não dá.

> **O que ficou de fora:** as Qualidades e os Defeitos de Sangue-Ralo em si estão nas **págs.
> 182–183**, fora deste capítulo. Eles não existem em `data-vantagens.js`, e a §91 não os
> inventou.

### 16.5 Humanidade e Coterie na criação

**A Humanidade começa em 7**, e há uma opção: *"O Narrador pode permitir que os personagens de uma
crônica só de vampiros Crianças da Noite comecem com Humanidade 8"* *(pág. 149)*.

**Todos recebem um ponto de Coterie** *(pág. 151)* — *"no caso de coteries pequenas, o Narrador
pode dar a cada jogador dois pontos"*. Ele compra o Domínio e Antecedentes de coterie
compartilhados. **Uma mesa solo é a menor coterie que existe**, e por isso o piso aqui são dois.

---

## 17. Experiência *(pág. 151)*

*(conferido na §91. A tabela estava certa e completa desde a §61; o que faltava era tudo o resto.)*

| Compra | Custo |
|---|---|
| Aumento em Atributo | novo nível **× 5** |
| Aumento em Habilidade | novo nível **× 3** |
| Nova Especialização | **3** |
| Disciplina do Clã | novo nível **× 5** |
| Outra Disciplina | novo nível **× 7** |
| Disciplina de Caitiff | novo nível **× 6** |
| Ritual de Feitiçaria de Sangue | nível do Ritual **× 3** |
| Fórmula de Sangue-Ralo | nível da Fórmula **× 3** |
| Vantagem | **3 por ponto** |
| Potência de Sangue | novo nível **× 10** |

### 17.1 As duas regras que transformam a tabela num sistema

**"Novo nível" é o nível que se COMPRA, e não o que se tem.** Passar de dois para três pontos em
Autocontrole custa 3 × 5 = 15.

> **E não se salta etapa.**
>
> *"Você não pode saltar etapas e comprar quatro pontos de Autocontrole por 20 pontos, se
> atualmente tiver apenas dois pontos nesse Atributo. Você precisa primeiro comprar o terceiro
> ponto por 15 pontos de experiência e, em seguida, comprar os quatro pontos por 20."*

Subir de 2 para 4 custa **15 + 20 = 35**, e não 20. É esta segunda regra que faz da tabela uma
escada — e é justamente ela que some quando alguém implementa só a primeira.

### 17.2 A carteira

`xpTotal` e `xpGasta` eram dois campos de **texto** na ficha, preenchidos à mão. O motor somava
experiência no fim de cada sessão e **nunca gastava nada**: `CUSTO_XP` e `Estado.custoDe` existiam
desde a §61 e **nenhuma linha do jogo os chamava**.

É a quarta tabela morta que este projeto encontra do mesmo jeito — a Ressonância na §67, os
Ferimentos Incapacitantes e a audiência do combate social na §90. `motor-experiencia.js` é o
caminho que faltava: aba **Experiência** na mesa, com a conta aberta.

### 17.3 A experiência de partida — o Mar do Tempo *(pág. 137)*

| Idade | Experiência | E mais |
|---|---|---|
| **Criança da Noite** | — | a criação já terminou |
| **Neófita** | **15** | — |
| **Ancilla** | **35** | +1 Potência de Sangue, +2 Vantagens, +2 Defeitos, −1 Humanidade |

Ela é gasta **ao final da criação** *(pág. 144)*, e o Narrador pode deixar até as Crianças da Noite
remanejarem pontos depois do prelúdio.

## 18. Perigos permanentes

*(conferido no básico, págs. 221–223 — a seção "Os Perigos do Sangue")*

> **A seção era uma tabela de sete linhas sem número nenhum.** Ela dizia o que cada perigo
> é, e não o que ele faz — e o que o Narrador precisa em jogo é o segundo. O livro dá ritmo,
> dificuldade e limiar para quase todos.

O livro abre lembrando o que **não** ameaça: *"Balas apenas machucam os Membros; espadas só
causam arranhões."* Poucas coisas causam dano de verdade.

### 18.1 Luz solar

**Dano Agravado à Vitalidade, em ritmo igual à Gravidade da Perdição, em pontos por turno.**
Não é uma taxa fixa: um vampiro com Perdição 2 leva 2 por turno; um com Perdição 5, cinco.

| Situação | Ritmo |
|---|---|
| Luz solar direta | **Perdição** pontos de Agravado **por turno** |
| Luz obscurecida — cortina, dia muito nublado, casaco pesado, luvas, máscara, chapéu de aba larga e botas | **turno sim, turno não, ou menos** |
| **Sangue-ralo**, luz direta | **1 ponto Superficial por turno** |

Sangues-ralos podem usar protetor solar de alto fator e cobrir-se **com menos roupa** que
Membros verdadeiros para chegar ao ritmo alternado.

### 18.2 Fogo

**Agravado à Vitalidade, conforme a quantidade do corpo exposta**, e quem decide é o
Narrador. O livro dá a escala: **mão exposta ≈ 1 ponto**; **engolfado ≈ 3 ou mais por
turno**.

Vampiros **não queimam mais rápido** que mortais — o fogo é ameaça por ser onipresente, não
por ser especialmente veloz contra eles.

### 18.3 Frio extremo

Não mata, mas leva ao Torpor pela porta dos fundos:

- Após **uma hora** a **−30 °C ou menos**, rolar **Vigor + Determinação, Dificuldade 2**,
  para continuar se movendo.
- Testa-se de novo **a cada hora**, com **Dificuldade +1** a cada rolagem.
- **Falhou:** para de se mover, e só consegue usar **Disciplinas mentais**.
- **Uma hora depois disso:** a carne congela e ele entra em **Torpor**.
- **Água gelada** testa **a cada meia hora**. Vampiro congelado **afunda** — não há ar nos
  pulmões para dar flutuabilidade.

O perigo é maior do que parece porque vampiros **não têm calor corporal** (salvo alguns
minutos depois de se alimentar) e por isso **não percebem** a queda de temperatura.

### 18.4 Decapitação

**Destrói instantaneamente.** Em corpo a corpo exige:

- **ataque localizado**, com penalidade de **−2**;
- **arma cortante apropriada** — machado, cimitarra, espada de lâmina larga;
- que cause **10 ou mais pontos de dano de qualquer tipo** à Vitalidade — **antes** da
  divisão pela metade, no caso de Superficial.

### 18.5 Estacas

Para estacar, o caçador martela a estaca no vampiro **adormecido**, ou atravessa-lhe o
coração **durante um combate**. No combate:

- **ataque localizado**, penalidade **−2**;
- **5 ou mais pontos de dano de qualquer tipo** — de novo, **antes** de cortar pela metade;
- o dano pode vir de arma à distância (besta com virotes de madeira) ou de corpo a corpo
  (Força + Armas Brancas com a estaca);
- **a estaca sempre tem modificador de dano +0**, não importa como é aplicada.

Contra vampiro **incapacitado ou adormecido**, e sem pressa ou distração, **nenhuma rolagem
é exigida**, a critério do Narrador.

**O estado de estacado** *(pág. 223)*:

- **Paralisa, e não mata.** O vampiro inicialmente **permanece consciente**.
- Gastando **1 ponto de Força de Vontade**, faz movimentos mínimos — contrair um dedo, abrir
  os olhos — e **nada além disso**.
- Pode usar **Disciplinas mentais** (Auspícios, Presença, Dominação), mas **não pode dar
  ordens**, a menos que consiga se comunicar telepaticamente.
- Continua fazendo **uma Checagem de Sangue a cada pôr do sol** para despertar. Mais cedo ou
  mais tarde, a Fome crescente o leva ao **Torpor**.

### 18.6 Torpor

Hibernação entre a não-vida e a Morte Final. Nela o vampiro **jaz completamente morto para
os arredores**, reduzido à aparência de um cadáver enrugado: **não usa Disciplina nem reage
a estímulo comum**.

**As três portas de entrada** *(pág. 223)*:

1. Tentar despertar à noite com **Fome 5** e **falhar** na Checagem de Sangue.
2. Sofrer **Agravado suficiente para completar a trilha de Vitalidade** — Torpor automático.
3. **Voluntariamente** — e ainda assim a Fome sobe a cada noite até cair no caso 1.

**Duração:** determinada pela **Humanidade** (Tabela de Humanidade, pág. 241). **Estacado, o
vampiro continua em Torpor além do período** até alguém remover a estaca; removida depois do
fim do período, ele **desperta imediatamente**, ou na mesma noite.

**Enquanto dorme por dano:** tenta inconscientemente recuperar, **1 ponto de Vitalidade por
noite**. Recuperando-se totalmente — todo o dano e todos os impedimentos —, pode despertar.
Se Checagens fracassadas levarem a Fome **acima de 5**, cai no Torpor do caso 1.

**Ao fim do período**, se não estiver estacado, rola **Determinação + Percepção, Dificuldade
2**, toda vez que uma vítima em potencial se aproxima. Sucesso: desperta o bastante para se
alimentar — **provavelmente entrando em frenesi de fome**. Quando a **Fome cai para 4 ou
menos**, ergue-se plenamente recuperado.

> **Vampiros despertam do Torpor com Fome 5.** É a regra que decide o que acontece na cena
> seguinte, e a que mais vale ter à mão.

**Interromper o Torpor:** alimentar o adormecido com sangue vampírico de **Potência de
Sangue maior que a dele**, em quantidade suficiente para saciar **1 de Fome**.

### 18.7 Morte Final

O que mata *(pág. 223)*: **fogo**, **luz solar**, **decapitação**, **ácido que dissolva por
completo o corpo**, **explosões de alta pressão que o desmembrem**, e **pressão** como a das
profundezas submarinas. O Narrador pode conhecer doenças vampíricas que matem por dentro.

**A regra mecânica, e é a que o motor implementa:**

> Quando toda a trilha de Vitalidade está preenchida com dano Agravado, o vampiro entra em
> **Torpor**. **Qualquer dano Agravado adicional oriundo de fogo ou luz solar** sofrido
> nesse estado causa a **Morte Final** — assim como a decapitação ou a destruição total do
> corpo.

Isto confirma a correção da §49.1 do README (item A5): **trilha cheia de Agravado é torpor,
não morte**; quem mata é a fonte. `motor-estado.js` faz exatamente isso.

Balas em quantidade suficiente levam ao **Torpor** — e ali o vampiro vira alvo indefeso.

### 18.8 Fé Verdadeira

*(básico, pág. 222)* — **faltava inteira nesta seção**, e é o perigo que mais muda uma cena
com mortais.

Característica de 1 a 5, que **não se compra com experiência** (embora experiências
aterrorizantes possam alterá-la). Não se concentra em clérigos, e se manifesta em qualquer
religião — o símbolo funciona pelo ardor de quem o segura, não pelo cargo.

| Nível | O que o mortal consegue |
|---|---|
| **1** | Brandindo símbolo e orando, rola **Determinação + Fé Verdadeira** em disputa contra a **parada de Força de Vontade** do vampiro. **Cada sucesso do fiel** obriga o vampiro a recuar um passo e evitar seus olhos. Tocá-lo com o símbolo causa **1 Agravado por sucesso**. **Um crítico** força fuga e dispara **frenesi de terror com Dificuldade igual à Fé Verdadeira** |
| **2** | Resiste a **Dominação** e outros controles de mente gastando Força de Vontade — 1 ponto protege por **tantos turnos quanto o valor de Fé** |
| **3** | **Sente a presença** de um vampiro. Não é radar: o mortal só sabe que algo impuro espreita |
| **4** | **Não pode ser transformado em carniçal**, e **nunca sucumbe** a Disciplina que afete a mente |
| **5** | Brandindo o símbolo ou orando em voz alta, **força o vampiro a um teste de Remorso**. Mesmo vencendo, ele sucumbe à repulsa por si mesmo e só age em autodefesa por **tantos turnos quanto suas Máculas atuais** (mínimo 1); depois, **remove todas as Máculas**. Sem nenhum sucesso, **perde permanentemente 1 de Determinação**, não remove Mácula nenhuma e foge em frenesi de terror — e, se não puder fugir, **sofre dano como se o símbolo fosse luz solar direta** |

### 18.9 Os que o livro não trata aqui

Continuam valendo, e vêm de outras seções:

| Perigo | Onde está |
|---|---|
| **Diablerie** | Reduz a geração, mancha a aura por anos, crime capital em toda seita. §9 e Parte IV |
| **Vínculo de Sangue** | Três goles do mesmo vampiro em noites separadas; amor imposto, enfraquece se não for renovado |
| **Segunda Inquisição** | Vigilância eletrônica e força letal. No Brasil, o BOES — ver `data-brasil.js` |

---

## 19. Clãs — a Perdição, e a Gravidade da Perdição *(págs. 63–114)*

O básico tem **sete clãs**, mais Caitiff e Sangue-Ralo. Banu Haqim, Hecata, Lasombra,
Ministério, Ravnos, Salubri e Tzimisce — que também estão em `data-clans.js` — vieram do
Companion e de livros de seita, e **não foram conferidos contra a página**.

### 19.1 O que o livro chama de Perdição

O termo é **Perdição** (*Bane*), não "maldição". E o livro é uniforme num ponto que muda tudo:

> **Toda Perdição de clã se mede em Gravidade da Perdição.**

A Gravidade da Perdição sai da Potência do Sangue — `Escudo.POTENCIA_SANGUE[n].perdicao`,
tabela da pág. 216 — e vale de 0 (Potência 0) a 6 (Potência 9–10).

Ela já existia nos dados e já era impressa na folha oficial, mas **nada a calculava**. Sem o
valor à mão, as nove Perdições foram escritas com números inventados no lugar dela. Desde a §88
ela é derivada de verdade: `derivados(f).gravidadePerdicao`.

### 19.2 As nove Perdições do básico

| Clã | Perdição *(pág.)* |
|---|---|
| **Brujah** *(67)* | Subtraia da parada para resistir a frenesi de **fúria** dados iguais à Gravidade. Piso de 1 dado |
| **Gangrel** *(73)* | Em frenesi ganha aspectos animalescos em quantidade igual à Gravidade; cada um reduz 1 Atributo; duram **mais uma noite** depois do frenesi. Curtir a Onda → só um aspecto |
| **Malkaviano** *(79)* | Ao sofrer **Falha Bestial ou Compulsão**, penalidade igual à Gravidade em **uma** categoria de parada (Física, Social ou Mental), pela cena inteira, somada às penalidades de Compulsão |
| **Nosferatu** *(85)* | Defeito **Repulsivo (-2)**, sem subir Qualidade Visual; esconder deformidade sofre penalidade igual à Gravidade, **inclusive por Disciplina**. Ser visto **não quebra a Máscara** |
| **Toreador** *(91)* | Em ambiente **menos do que belo**, redutor igual à Gravidade nas paradas para **acionar Disciplinas** |
| **Tremere** *(97)* | O Vitae **não cria Laço com outros Membros**; com mortais e carniçais exige goles extras iguais à Gravidade |
| **Ventrue** *(102)* | Só um tipo de mortal alimenta; outro sangue volta em vômito a menos que gaste Força de Vontade igual à Gravidade. **Determinação + Percepção (Dif. 4+)** fareja o tipo certo |
| **Caitiff** *(107)* | **Sem Perdição.** Defeito Suspeito (•), sem Status na criação, Narrador pode impor 1–2 dados em Sociais. Disciplina custa **seis** vezes o nível |
| **Sangue-Ralo** *(111)* | **Potência 0 sempre**, Sem-Clã, sem Perdição nem Compulsão. Sofre Agravado de **cortante e perfurante** além de fogo; **estaca não paralisa** |

### 19.3 O que o motor aplica, e o que ainda é texto

**Aplicado (§88):** a Perdição **Brujah**. `Estado.testeDeFrenesi` subtrai a Gravidade da parada
quando o clã é Brujah e o frenesi é de fúria, e diz que subtraiu. Medido: Gravidade 2 → Brujah
rola 6 dados onde o Ventrue rola 8.

**Aplicado na §95** — `modulos/arbitro/motor-perdicoes.js`, e cada uma numa função com nome:

| Clã | O que passou a acontecer |
|---|---|
| **Gangrel** | O frenesi gera aspectos em número igual à Gravidade, cada um tira 1 dado do Atributo dele, e eles duram **mais uma noite**. Curtir a Onda segura em um só |
| **Malkaviano** | Falha Bestial e Compulsão ligam a penalidade de Gravidade na **categoria escolhida na criação**, pela cena inteira, **somada** à da Compulsão |
| **Nosferatu** | Esconder a aparência custa a Gravidade em dados, **inclusive por Disciplina** |
| **Toreador** | Em ambiente menos que belo, a Gravidade sai das paradas para **acionar Disciplina** |
| **Tremere** | O Vitae **não enlaça outro Membro**, e em mortal ou carniçal exige **goles extras iguais à Gravidade** |
| **Sangue-Ralo** | Cortante e perfurante entram **Agravado**, e a **estaca não paralisa** |

**Ainda declarativo**, e por falta de gancho, não de regra:

- **Nosferatu:** o Defeito Repulsivo não entra automaticamente na criação — é passo de ficha, não
  de arbitragem.
- **Toreador:** a beleza do ambiente chega de fora e o padrão é **desconhecido**, não feio. Punir
  por informação ausente seria inventar regra que o livro não escreveu.
- **Ventrue:** a alimentação por tipo de mortal continua sem mecanizar; ela precisa de um tipo na
  bolsa, que o motor de Ressonância ainda não carrega.

Cada um desses exige um gancho que o motor não tem — ambiente estético, tipo de bolsa, contagem
de goles do Laço. Estão **declarados** em vez de meio feitos, que é a regra do projeto para
divergência conhecida sem implementação.

### 19.4 O que estava errado antes

As nove estavam erradas, e sempre do mesmo jeito: **número inventado no lugar da Gravidade**.

| Clã | O projeto dizia | Por que importa |
|---|---|---|
| Brujah | soma a Potência de Sangue à **dificuldade** | somar à dificuldade muda quantos sucessos bastam; **tirar dados** muda a chance de não haver sucesso nenhum — e é isso que empurra para a Falha Bestial |
| Gangrel | "de uma a três" feições, duram "a noite" | a quantidade é a Gravidade, e a duração é **mais uma noite depois** |
| Malkaviano | "sob estresse ou Fome alta, dois dados" | o gatilho é **Falha Bestial ou Compulsão**, e a penalidade é de cena |
| Nosferatu | "**falha automática** em se passar por humano" | o livro dá penalidade, não falha automática — e diz que ele **não quebra a Máscara** |
| Toreador | "diante de algo **belo**, perca dois dados em **todos** os testes" | **o gatilho estava invertido**: o livro penaliza o ambiente FEIO, e só em Disciplinas |
| Tremere | "um gole a mais / um a menos" | ele **não cria Laço com Membros**, e os goles extras são a Gravidade |
| Ventrue | "gastar Força de Vontade" | a quantidade é a Gravidade, e falta o teste de Determinação + Percepção |
| Caitiff | "custa mais experiência" | é **seis vezes** o nível, e faltavam Suspeito (•) e a trava de Status |
| Sangue-Ralo | texto vago | faltava o Agravado de cortante/perfurante e a estaca que não paralisa |

O Toreador é o mais grave: um Toreador jogado com a regra antiga era penalizado exatamente
quando o livro manda **não** penalizar.

---

## 20. Projetos — o que corre entre as noites *(Apêndice II, págs. 415–418)*

Tudo o que este projeto sabia fazer acontecia **dentro de uma noite**. Um plano de anos —
comprar a Harpia, quebrar o banco, virar Mawla — não tinha onde morar, e virava conversa.
O Apêndice II é o subsistema que resolve isso, e ele cabe numa mesa solo melhor do que na
mesa para a qual foi escrito: quem joga sozinho não tem com quem negociar o tempo entre as
sessões, e o Dado do Projeto negocia por ele.

> A palavra vem do latim *proicere*, "jogar adiante" — como em jogar os dados.

### 20.1 As três medidas

| Medida | O que é | Como se acha |
|---|---|---|
| **Escopo** | quantos pontos de Antecedente o projeto entrega | escolha do jogador, com o Narrador |
| **Incremento** | quanto tempo passa por rolagem | duração provável **dividida por dez** |
| **Dado do Projeto** | quanto falta | começa em **10**, cai **um por incremento** |

O Escopo é o preço e a medida ao mesmo tempo: ele fixa a Dificuldade do Lançamento
(**Escopo + 2**) e o quanto o jogador arrisca (**Escopo + 1, menos a margem**). Um projeto
com duração estimada **menor do que dez dias não é projeto**: é teste estendido *(pág. 293)*.

### 20.2 A rolagem de Lançamento *(pág. 415)*

Teste simples, parada de **Habilidade + Antecedente**, Dificuldade **Escopo + 2**. O jogador
**não pode gastar Força de Vontade nem usar Surto de Sangue**. O Narrador pode permitir
Disciplinas, especialmente se os alvos forem mortais.

| Resultado | O que acontece |
|---|---|
| **Crítico** | não compromete ponto nenhum — e o projeto passa a resistir a uma derrota de Objetivo |
| **Sucesso** | compromete **Escopo + 1 − margem** pontos, **mínimo 1** |
| **Falha** | pode recomeçar do zero, com **+1** na Dificuldade do Lançamento |
| **Falha total** | um inimigo novo, ou um velho energizado; o Narrador pode custar-lhe pontos do Antecedente |

Pontos comprometidos ficam **retidos**: não valem em jogo até o projeto terminar de um jeito
ou de outro.

> **O exemplo do livro, conferido em teste.** Istvan quer cinco pontos de Recursos e já tem
> dois: Escopo 3, logo Dificuldade 5. Rola oito dados e faz seis sucessos — margem 1. O risco
> é 3 + 1 − 1 = **três pontos**. É esse número que o teste da §89 exige.

### 20.3 A rolagem de Objetivo, e a vantagem da casa *(pág. 416)*

Rolagem de **conflito** contra uma parada igual ao **valor atual do Dado do Projeto**. Pode
ser feita a qualquer momento. Também aqui não entram Força de Vontade, Surto de Sangue nem,
em geral, Disciplinas.

E aqui está a regra mais estranha do livro inteiro:

> **A rolagem de Objetivo não gera críticos: cada 10 conta como um sucesso comum. Pior ainda,
> os críticos contam para a oposição.** O livro chama isso, com todas as letras, de *vantagem
> da casa do status quo*.

É a única regra do V5 que desliga o crítico **de um lado só**. Por isso ela mora em
`motor-projetos.js` e não em `motor-dados.js`: lá, ela valeria para todo mundo. A **Falha
Bestial não some junto** — ela não depende de crítico, e o livro não a exclui.

| | O que acontece |
|---|---|
| **Vitória** | o Dado do Projeto cai pela **margem**. Abaixo de 1, o projeto **deu certo** |
| **Derrota** | perde pontos de Antecedente iguais à margem da oposição, **começando pelos retidos** |
| **Retidos a zero** | o projeto **falha de repente** — salvo se o Lançamento tiver sido crítico |

Nos dois casos o Narrador **deve criar uma razão dentro do jogo** para a virada, e pode não
compartilhá-la com o jogador.

### 20.4 Encerrar, e o que não se encerra junto *(pág. 417)*

Quem iniciou **sempre pode encerrar**, e os pontos retidos voltam. Os inimigos ganhados pelo
caminho não se encerram junto.

### 20.5 O empate — leitura, não texto do livro

O apêndice descreve vencer e perder, e não diz o que é um empate na rolagem de Objetivo. A
§6.4 deste documento já lê conflito empatado como **margem zero**, e margem zero não move
nada: o incremento passou e o Dado ficou onde estava. **Isto é leitura do projeto**, e está
escrito aqui por isso.

### 20.6 O que o motor NÃO aplica deste apêndice

| Item | Por quê |
|---|---|
| **A Longue Durée** *(pág. 417)* | exige jogar um capítulo de lançamento em **Memoriam** *(pág. 311)*, e o projeto não tem Memoriam. Inventar a Memoriam para poder ter a Longue Durée seria escrever a regra que falta, não a que existe |
| **Projetos da oposição** *(págs. 417–418)* | detectar, interferir, saquear e sequestrar a conspiração de um PN é ferramenta de Narrador para uma mesa com gente. O que sobrevive é `Projetos.interferir()`, que move o Dado por fora — a porta por onde a camada narrativa mexe no relógio |
| **Comprar o objetivo com experiência** *(pág. 417)* | o livro deixa isso a critério do Narrador, sem número |

### 20.7 O preço de cultivar uma bolsa *(pág. 415)*

Está aqui, e não no capítulo de Ressonância — que é por que a §67 leu as págs. 225–231
inteiras e saiu sem ele:

| O que se quer da bolsa | Escopo do projeto |
|---|---|
| Mudar a Ressonância e levá-la a **Intensa** | **1** |
| Mudar a Ressonância e acrescentar uma **Discrasia** | **2** |

Com Escopo 1 e 2, a Dificuldade do Lançamento é 3 e 4. Ver Parte II §11.8.

---

## 21. Jogo ponderado — Linhas, Véus e a Carta X *(Apêndice III, págs. 419–423)*

É o único apêndice do livro cuja regra protege a **pessoa**, e não o personagem. São sete
técnicas; três atravessam para um aplicativo sem perder nada, e quatro não.

### 21.1 As três que atravessam

| Técnica | Pág. | O que é | Como ficou aqui |
|---|---|---|---|
| **Linhas e Véus** | 421 | *(Ron Edwards)* Linha não é tocada nem mencionada de passagem; Véu pode acontecer mas não é jogado | aba **Limites**, lista do jogador, no prefixo do Narrador |
| **A Carta X** | 422 | *(John Stavropolous)* uma carta no centro da mesa; qualquer um a toca e a cena para | botão sobre a caixa de texto |
| **Fade** | 421 | a câmera corta antes e volta depois | botão **Desvanecer**, vale por um turno |

**A lista é do jogador.** Essa é a regra inteira, e é onde o projeto estava errado: até a §89
a única trava era a que **eu** escrevi no `cenario.md` §10, que o jogador herdava e não podia
editar. Ela continua, como **piso** — um Narrador automático precisa de trava mesmo quando
ninguém declarou nada. O que faltava era o teto.

O livro é explícito em três pontos que a interface tinha de respeitar:

1. a lista é montada **antes do jogo** e é **editável a qualquer momento**;
2. um **Véu pode virar Linha e vice-versa**, e entradas podem ser apagadas;
3. na Carta X, *"caso queiram se explicar, podem fazê-lo, mas isso não é necessário"*.

O item 3 é por que o botão **não pede motivo e não pede confirmação**. A §37.4 já proibia o
`confirm()` do navegador; aqui nem na interface a pergunta cabe.

Linhas e Véus **não servem para eliminar antagonistas** *(pág. 421)* — "não quero que
vampiros façam parte do jogo" não é Linha. Servem para restringir o que dos antagonistas é
encenado.

### 21.2 O que a Carta X faz com o texto retirado

| | |
|---|---|
| na tela | a narração some da cena e deixa uma lacuna marcada; ela **não é apagada da sessão** |
| no histórico que sobe ao modelo | vira `[retirado pelo jogador — não aconteceu]`, **sem o texto** |
| no prefixo | um resumo curto sobe uma vez, com a ordem de **não voltar ao assunto** |

Devolver o trecho inteiro ao modelo é a forma mais garantida de ele voltar ao assunto; não
dizer nada é a forma mais garantida de ele repetir. O resumo curto com a ordem é o meio.

### 21.3 As quatro que não atravessam

| Técnica | Pág. | Por quê |
|---|---|---|
| **Sistema Refletores** | 421 | três círculos coloridos para o Narrador ler a sala. Numa mesa de um jogador não há sala para ler: pedir mais ou menos intensidade é dizer isso na caixa de texto que já existe |
| **Verificação de Bem-Estar** | 422 | sinais de mão entre pessoas presentes |
| **A Porta está Sempre Aberta** | 422 | sair da sessão sem dar satisfação. Num aplicativo é fechar a aba, e a sessão fica onde estava |
| **Descompressão** | 422 | conversa pós-jogo, fora do personagem, entre os participantes |

Elas estão declaradas em `data-limites.js`, com o motivo, e a aba Limites as mostra. Técnica
de segurança que some sem explicação parece técnica que ninguém achou importante.

### 21.4 O resto do apêndice

O Apêndice III abre com duas seções que **não são técnicas**: "A Identidade de Personagens e
Jogadores" *(pág. 419)* e "Fascismo em Jogo" *(págs. 419–420)*, mais "Violência Sexual nos
Jogos" *(págs. 420–421)*. São orientação editorial dirigida a pessoas, não regra. O que delas
tem consequência mecânica já está no projeto:

- *"As Máculas são suas amigas"* — violar um Princípio da Crônica custa Mácula: `cenario.md`
  §9.1, implementado desde a §69;
- *"Princípios da Crônica"* — nenhum dos conjuntos de exemplo permite abusar de humanos:
  `cenario.md` §9;
- *"Permita a autorreflexão"* — as regras de Remorso *(pág. 239)*: §12 desta Parte.

---

## 22. Estados de Condenação — Laço, carniçais e Diablerie *(págs. 233–235)*

*(lido na §90. O projeto não tinha nenhum dos três — nem regra, nem dado, nem texto.)*

> *"Sangue vampírico pode exercer profundas mudanças naqueles que o consomem, seja o bebedor
> mortal ou não vivo. Se essas mudanças são para a melhor ou para a pior depende, como os
> Anarchs leninistas dizem, de quem está bebendo quem."*

Três estados, e o livro os organiza por **quem bebe de quem**: o Laço prende quem bebe a quem
doou; o carniçal é o mortal que bebeu e ficou; a Diablerie é beber o vampiro inteiro. Os três se
medem em **tempo** — noites, meses, anos —, e por isso combinam mais com os Projetos da §20 do
que com o combate.

### 22.1 O Laço de Sangue *(págs. 233–234)*

**Quem prende é o `reinante`; quem fica preso é o `escravo`.** São as palavras do livro, e ele
as usa o tempo todo.

| Regra | Valor |
|---|---|
| Goles para o Laço ficar completo | **3**, em três noites distintas |
| Intervalo máximo entre goles, para o Laço se formar | **um ano** |
| Força do Laço | o número de vezes que bebeu, **no máximo 6** |
| Queda | **−1 por mês** sem uma gota sequer |
| Escravos que um reinante segura | tantos quanto a sua **Potência de Sangue** |
| Reinantes que um escravo pode ter | **um**, e enquanto Enlaçado ele fica **imune** a outras tentativas |

**O sangue tem de vir direto da veia**: *"perde seu poder de Enlaçar em questão de segundos a
menos que seja ingerido"*. Vitae de bolsa **não enlaça** — e isso importa nesta mesa, que tem
bolsa desde a §67.

**Uma cria é um terço Enlaçada ao Senhor** no primeiro ano, por já ter provado o Sangue dele
uma vez.

Passando do limite de escravos, o **Laço mais antigo desaparece ao longo de uma semana**.

**Agir contra os desejos do reinante** exige uma disputa de **Determinação + Inteligência vs. a
Força do Laço**. E o ritmo é a regra inteira:

| Onde | Quantas vezes |
|---|---|
| **Na presença** dele | uma vez **por turno** |
| Fora da percepção dele | uma vez **por cena** |

**Partir o Laço** exige reduzir a Força a 0 evitando o reinante por um longo período, com um
teste de desafio **uma vez por sessão** — ou mais, se o Narrador julgar que algo fez o escravo
lembrar dele. *"Poucos escravos podem resistir tanto tempo, especialmente se seu reinante vier
em seu encalço."*

Nada impede enlaçar um vampiro de **geração menor** ou de Sangue mais potente. Um Laço mútuo é o
**casamento de Sangue**, e *"não envolve amor — envolve obsessão e vício"*.

### 22.2 Carniçais *(pág. 234)*

Uma quantidade de Vitae equivalente a **uma Checagem de Sangue** sustenta um mortal ou animal
por cerca de **um mês**:

- o primeiro ponto de uma Disciplina conhecida pelo mestre, ou um único poder de nível 1 dele;
- o **envelhecimento cessa**, às vezes rejuvenescendo alguns anos;
- ferimentos curam com o **dobro** da velocidade — **exceto** os causados por fogo.

**Usar poder acima do nível 1** custa **1 de dano Agravado à Vitalidade**, *em vez* de uma
Checagem de Sangue. É troca, não acréscimo.

Ao contrário do Abraço e do Laço, a Vitae **guardada** em recipiente hermético e ao abrigo do sol
ainda alimenta carniçal por alguns dias.

### 22.3 Diablerie *(págs. 234–235)*

São **duas provas em sequência**, e a diferença entre elas é o que faz a Diablerie ser o que é.

**1. Tomar a centelha.** Com o alvo já incapacitado e drenado: **Força + Determinação,
Dificuldade 3**, uma rolagem por turno, **tantas quanto a Potência de Sangue da vítima**. *"Se
apenas uma falhar, a centelha que anima a vítima se apaga sem ser consumida."* Nos dois casos o
corpo se decompõe na Morte Final.

**2. Segurar o que se tomou.**

- o diablerista **perde 1 ponto de Humanidade**, sem rolagem;
- rola uma disputa de **Humanidade + a sua Potência de Sangue** vs. **Determinação + a Potência
  da vítima**;
- **mesmo perdendo**, cada sucesso da sua rolagem vale **5 pontos de experiência** para gastar
  na hora — em Potência de Sangue, até o valor da vítima, ou nas Disciplinas que ela conhecia;
- perdendo, ele perde **mais um ponto de Humanidade por sucesso de diferença**. Se isso a levar
  a **0**, *"a mente da presa substitui a do diablerista"*: ele vira o corpo hospedeiro dela, e o
  personagem passa a ser um PN.

> **O que quase todo mundo lê errado é o terceiro item.** O prêmio vem mesmo perdendo. O que se
> perde na disputa é o **controle**, não a experiência — e é isso que torna a Diablerie tentadora
> justamente para quem já não tem muita Humanidade a perder.

**Se a vítima era de geração menor**, o diablerista **desce uma geração**.

**Veias negras** tornam-se visíveis na aura, e persistem por **um ano** — ou, se a geração do
diablerista era maior que a da presa, por uma quantidade de anos igual à **diferença original
entre as gerações**.

---

## 23. O que o motor já implementa

| Regra | Onde | Estado |
|---|---|---|
| Piscina, dados de Fome, contagem, pares de 10 | `js/arbitro/motor-dados.js` | Implementado e testado com 20.000 rolagens |
| Os seis resultados | `js/arbitro/motor-dados.js` | Implementado |
| Reteste de Vontade (3 dados, exceto Fome) | `js/arbitro/motor-dados.js` + `js/front/mesa.js` | Implementado |
| Provocação | `Estado.provocacao()` | Implementado, com Rerrolagem de Sangue |
| Índice de Força e calibragem | `js/ficha/motor-ficha.js` | Implementado |
| Extração da ficha para JSON | `js/ficha/motor-ficha.js` | Implementado |
| Tabela de Potência de Sangue | `js/data/data-vantagens.js` | Dados presentes, usados na ficha oficial |
| Tabelas do Escudo do Mestre | `js/data/data-escudo.js` + `js/arbitro/motor-arbitro.js` | Implementado |
| Vitalidade, dano, torpor | `js/arbitro/motor-estado.js` | Implementado |
| Humanidade, Máculas, Remorso | `js/arbitro/motor-estado.js` | Implementado |
| Frenesi e Compulsão | `js/arbitro/motor-estado.js` | Implementado |
| Combate | `js/arbitro/motor-combate.js` | Implementado |
| Experiência e fim de sessão | `js/arbitro/motor-estado.js` | Implementado |
| Projetos — Escopo, Lançamento, Dado do Projeto, Objetivo | `modulos/arbitro/motor-projetos.js` | Implementado — §20, menos a Longue Durée |
| Linhas, Véus, Carta X e fade | `comum/dados/data-limites.js` + a aba Limites | Implementado — §21 |
| Conflito Avançado: Ataque/Defesa Total, surpresa, mira, agarramento, Ferimentos, combate social | `modulos/arbitro/motor-combate-avancado.js` | Implementado — §15.7 a §15.12 |
| Conflito de Rolagem Única, com as duas tabelas de Dificuldade | `modulos/arbitro/motor-combate-avancado.js` → `RolagemUnica` | Implementado — §15.13 (§95) |
| As Perdições de clã, da Brujah ao Sangue-Ralo | `modulos/arbitro/motor-perdicoes.js` | Implementado — §19.3 (§95) |
| Oblívio: a luz, a Checagem que gera Mácula, e a porta das Cerimônias | `comum/dados/data-oblivio.js` + `modulos/arbitro/motor-oblivio.js` | Implementado — §14.6 e §14.6.1 (§96) |
| Laço de Sangue, carniçais e Diablerie | `modulos/arbitro/motor-lacos.js` + a aba Sangue | Implementado — §22 |
| Experiência: a escada da pág. 151, a carteira e a compra | `modulos/arbitro/motor-experiencia.js` + a aba Experiência | Implementado — §17 |
| A vida humana: profissão, evento e passatempos | `comum/dados/data-criacao.js` + o passo "A vida que você teve" | Implementado — §16.2 |

---

# Parte II — Escudo do Mestre

> Era o arquivo `docs/escudo-do-mestre.md`. Referência de **valores**: existe para o
> Mestre — humano ou IA — não precisar inventar número nenhum ao montar uma situação.

Toda tabela desta parte está implementada em `comum/dados/data-escudo.js` e é consultável
pelo Árbitro. **Fonte:** `Livros/Escudo-Do-Mestre.pdf`, págs. 124–127 — onde ele diverge do
que estava documentado antes, **ele venceu**; ver §12 desta parte.

---

## 1. Dificuldade da ação

A tabela mais importante do documento. Nunca escolha uma dificuldade "por sentimento":
ache o exemplo mais próximo.

| Dif. | Nome | Exemplos |
|---|---|---|
| 1 | Rotineiro | atirar em um alvo parado · convencer um amigo a te ajudar |
| 2 | Direto | seduzir alguém que já está a fim · intimidar um fraco |
| 3 | Moderado | instalar um sistema de som no carro · andar em corda bamba |
| 4 | Desafiador | localizar a fonte de um sussurro · criar uma arte memorável |
| 5 | Difícil | convencer um policial de que a droga não é sua · reconstruir um bloco de motor |
| 6 | Muito difícil | correr em corda bamba sobre o fogo · acalmar um inimigo violento e com raiva |
| 7+ | Quase impossível | achar um morador de rua específico numa metrópole em uma noite · recitar um longo texto numa língua que não conhece |

`Arbitro.dificuldadeDescrita(n)` devolve o nome e os exemplos.

## 2. Antagonistas simples

Quando a oposição é uma pessoa, a dificuldade **é** o nível dela.

| Dif. | Nível | Quem é |
|---|---|---|
| 1 | Insignificante | inexperiente ou doente |
| 2 | Fraco | humano normal, bandido ou policial de rua |
| 3 | Normal | humano talentoso ou carniçal, assassino ou policial treinado, Sangue Fraco recém-Abraçado |
| 4 | Desafiador | neonato, Sangue Fraco motivado, carniçal antigo, operador da Segunda Inquisição |
| 5–6 | Forte | ancilla, comandante da Segunda Inquisição, lobisomem novo |
| 7+ | Muito forte | ancião, lobisomem adulto |

## 3. Campo de caça

A dificuldade de caçar **vem do bairro**, não do personagem.

| Dif. | Onde |
|---|---|
| 2 | Favela, cortiço, conjunto habitacional, periferia |
| 3 | Bairro boêmio ou moderno, bairro velho, bairro de trabalhadores |
| 4 | Bairro de trabalhadores saudáveis, área de negócios ou de turistas, centro, aeroportos, cassino |
| 5 | Fábricas, portos, parques, bairro de classe média |
| 6 | Bairro rico |

Note o que a tabela diz sobre o cenário: **é mais fácil caçar onde ninguém procura os
desaparecidos.** Vale a pena deixar isso explícito na mesa.

## 4. Alimentação — quanto cada fonte sacia

| Fonte | Sacia | Tempo | Observação |
|---|---|---|---|
| Vários animais pequenos (3–4 gatos, 12+ ratos) | 1 | Uma cena | Não satisfaz Potência 2+. Ressonância Animal, sem Discrasia |
| Animal médio (cachorro) | 1 | Um turno | idem |
| Animal grande (cavalo) | 2 | Uma cena | idem |
| Bolsa de sangue | 1 | Um turno | Não satisfaz Potência acima de 2. Sem Ressonância nem Discrasia |
| Pequeno gole de humano | 1 | Três turnos | Inclui lamber a ferida |
| Máximo sem causar dano | 2 | Uma cena | |
| Beber até risco de vida | 1–4 | 1 turno por Fome saciada | Dano Agravado igual à Fome saciada. O humano testa Força + Vigor contra a Fome saciada para sobreviver |
| Drenar e matar | 5 | 5 turnos | **Única forma de chegar a Fome 0** |

## 5. Potência de Sangue — tabela completa

*(conferido no básico, pág. 216 — a tabela consolidada)*

> **Esta tabela foi corrigida na revisão contra o manual básico, e a correção é grande.**
> A versão anterior vinha do Escudo do Mestre e tinha **duas colunas inteiras deslocadas em
> um**: todo o **Surto de Sangue** e, do PS 1 para cima, toda a **Gravidade da Perdição**.
> Mais o Bônus de Disciplina do PS 2 e a penalidade de alimentação do PS 3.
> `comum/dados/data-escudo.js` ainda carrega os valores antigos — ver §14.1 do README.

| PS | Surto | Recuperada | Bônus Disc. | Rerrolagem | Perdição | Penalidade de alimentação |
|---|---|---|---|---|---|---|
| 0 | **+1** | 1 sup. | — | — | 0 | Nenhuma |
| 1 | **+2** | 1 sup. | — | Nível 1 | **2** | Nenhuma |
| 2 | **+2** | 2 sup. | **+1** | Nível 1 | **2** | Animal e bolsa saciam **meia** Fome |
| 3 | **+3** | 2 sup. | +1 | Até Nível 2 | **3** | Animal e bolsa **não saciam nada** |
| 4 | **+3** | 3 sup. | +2 | Até Nível 2 | **3** | Não saciam; 1 a menos por humano |
| 5 | **+4** | 3 sup. | +2 | Até Nível 3 | **4** | Não saciam; 1 a menos; matar para descer abaixo de 2 |
| 6 | **+4** | 3 sup. | +3 | Até Nível 3 | **4** | Não saciam; **2** a menos; matar para descer abaixo de 2 |
| 7 | **+5** | 3 sup. | +3 | Até Nível 4 | **5** | Não saciam; 2 a menos; matar para descer abaixo de 2 |
| 8 | **+5** | 4 sup. | +4 | Até Nível 4 | **5** | Não saciam; 2 a menos; matar para descer abaixo de **3** |
| 9 | **+6** | 4 sup. | +4 | Até Nível 5 | **6** | Não saciam; 2 a menos; matar para descer abaixo de 3 |
| 10 | **+6** | 5 sup. | +5 | Até Nível 5 | **6** | Não saciam; 3 a menos; matar para descer abaixo de 3 |

**Recuperada** e **Rerrolagem** estavam corretas e não mudaram.

> **Segunda correção, na §59:** duas células da coluna de alimentação estavam erradas — PS 6
> ("1 a menos", é 2) e PS 8 ("abaixo de 2", é 3). As duas vieram do mesmo engano, e ele vale
> registrar: **a célula do livro é mesclada entre duas linhas**, e foi lida na altura da linha
> de baixo. O bloco 6–7 é um só, e o 8–9 também. `data-escudo.js` foi corrigido junto.

### Surto de Sangue — as travas

*(básico, pág. 218)*

- Custa **uma Checagem de Sangue**, e vale para **uma única rolagem**.
- **Uma por rolagem.** Não se acumulam.
- Só entra em parada que **use um Atributo** — Físico, Social **ou** Mental.
- **Proibido** em rolagem de **Força de Vontade** ou **Humanidade**, em rolagem que valha
  para mais de uma cena, e em Combate de Rolagem Única.
- **Não** se aplica vitória automática nem "Pegar Metade" a uma rolagem aumentada por Surto.
- Os dados do Surto **permanecem** numa rerrolagem paga com Força de Vontade.

> E a regra que mais muda o jogo — que é da pág. **217**, e não da 218 como estava escrito:
> **falhar numa Checagem de Sangue não faz o dom falhar; só aumenta a Fome em 1.**

### Geração → Potência de Sangue

| Geração | Mín. | Máx. |
|---|---|---|
| 4ª | 5 | 10 |
| 5ª | 4 | 9 |
| 6ª | 3 | 8 |
| 7ª | 3 | 7 |
| 8ª | 2 | 6 |
| 9ª | 2 | 5 |
| 10ª–11ª | 1 | 4 |
| 12ª–13ª | 1 | 3 |
| 14ª–16ª | 0 | 0 |

O app agora deriva a Potência inicial do **mínimo da geração**, em vez de fixar 1.

## 6. Consequências — o que oferecer

Quando o resultado sai, o Mestre **escolhe uma** destas. Não invente outra.

**Sucesso em Perigo:** ganha uma ou mais Máculas · quebra da Máscara · perde um ponto
de Vantagem · falha no teste apesar dos sucessos.

**Falha Bestial:** Compulsão · perde um ponto de Vantagem · recebe um ou mais dano
Agravado · aumenta a Fome em um.

### Compulsão aleatória (1d10)

| Dado | Compulsão |
|---|---|
| 1–3 | Fome |
| 4–5 | Dominação |
| 6–7 | Destruir |
| 8–9 | Paranoia |
| 10 | Compulsão do Clã — Caitiff e Sangue Fraco rolam de novo |

## 7. Frenesi — dificuldade por gatilho

Resistência é sempre **Autocontrole + Determinação**, com o modificador de Humanidade
da §8.

| Fúria | Dif. |
|---|---|
| Amigo assassinado | 2 |
| Um amor ou Pilar ferido | 3 |
| Um amor ou Pilar assassinado | 4 |
| Provocação física ou dano | 2 |
| Insultado por um inferior | 2 |
| Humilhação pública | 2 |

| Fome | Dif. |
|---|---|
| Ver ferimento aberto ou sentir cheiro forte de sangue, com Fome 4+ | 2 |
| Provar sangue com Fome 4+ | 3 |
| Falhar numa Provocação com Fome 5 | 4 |

| Terror | Dif. |
|---|---|
| Fogueira | 2 |
| Dentro de construção em chamas | 3 |
| Pegando fogo | 2 |
| Luz solar indireta, pela janela | 3 |
| Exposto à luz solar | 4 |

## 8. Humanidade

| Humanidade | Modificador para resistir ao frenesi | Duração do torpor |
|---|---|---|
| 9 | 3 | três dias |
| 8 | 2 | uma semana |
| 7 | 2 | duas semanas |
| 6 | 2 | um mês |
| 5 | 1 | um ano |
| 4 | 1 | uma década |
| 3 | 1 | cinco décadas |
| 2 | 0 | um século |
| 1 | 0 | cinco séculos |

**Perder o último ponto:** o vampiro entra em frenesi violento, todos os Atributos
Físicos sobem para 5 pelo resto da cena, e se sobreviver entrega-se à Besta e vira NPC.

### Máculas por ato

| Ato | Máculas |
|---|---|
| Tornar um humano em carniçal | +1 |
| Abraçar um mortal | +2 |
| Dano em um Pilar | +1 |
| Dano em um Pilar **por ações suas** | +2 |
| Pilar destruído | +2 |
| Pilar destruído **por suas ações** | +3 |

## 9. Combate

### Ferimento (dano Agravado + 1d10)

| Total | Ferimento |
|---|---|
| 1–6 | Atordoado: gaste 1 de Força de Vontade ou perca um turno |
| 7–8 | Traumatismo craniano: Físicas −1, Mentais −2 |
| 9–10 | Membro quebrado (−3 com o membro) ou cegueira (−3 em tudo que envolva visão, inclusive combate) |
| 11 | Ferimento grave: −2 em tudo, +1 a cada dano adicional |
| 12 | Aleijado: como membro quebrado, mas permanente |
| 13+ | Morte para humanos, torpor para vampiros |

### Dano de arma

| Dano | Armas |
|---|---|
| +0 | Improvisada, estaca |
| +1 | Impacto leve (soco inglês) |
| +2 | Impacto médio (bastão, barra); perfurante leve (besta, canivete); calibre leve (.22) |
| +3 | Arma branca pesada (espada, machado); calibre médio (.308, 9 mm, espingarda) |
| +4 | Calibre pesado (.12 de perto, .357 Magnum); arma branca grande (claymore, viga) |

**Estaca:** um ataque no coração que cause 5 ou mais de dano paralisa o vampiro.

### Armadura

Roupa reforçada ou couro **2** (zero contra balas) · Colete balístico **2** ·
Jaqueta de Kevlar **4** · Armadura tática SWAT ou militar **6** (−1 de Destreza).

### Cobertura (modificador de dificuldade do atirador)

Sem cobertura **−2** · Apenas encoberto **−1** · Cobertura forte **±0** ·
Trincheira **+1** · Seteira **+2**.

### Dano social — testemunhas somam

| Quem assiste | Dano extra |
|---|---|
| Apenas os oponentes | +0 |
| Sua coterie | +1 |
| Vampiros importantes para você: mentor, amante | +2 |
| Primogênito, Harpias, outras figuras importantes | +3 |
| O Príncipe, o Barão, outra figura de poder | +4 |

## 10. Montando NPCs

### Modelos de mortais

| Modelo | Atributos | Habilidades | Vantagens |
|---|---|---|---|
| Fraco | 2 em 2, resto em 1 | 3 em 2, 5 em 1 | nenhuma |
| Comum | 2 em 3, 3 em 2, resto em 1 | 3 em 3, 4 em 2, 5 em 1 | até 3 pontos (até 2 em defeitos) |
| Talentoso | 1 em 4, 2 em 3, 2 em 2, resto em 1 | 2 em 4 (1 com especialização), 4 em 3, 4 em 2, 4 em 1 | até 10 pontos (até 4 em defeitos) |
| Fatal | 2 em 5, 2 em 4, 2 em 3, resto em 2 | 1 em 5, 3 em 4, 5 em 3, 6 em 2, 3 especializações | até 15 pontos, sem defeitos |

### Profissões prontas

Artista · Programador · Executivo · Investigador · Viciado · Mafioso · Estudante ·
Socialite · Veterano. As perícias de cada uma estão em `Escudo.PROFISSOES`.

## 11. Ressonância, temperamento e sangue contaminado

*(básico, "O Sangue é a Vida" e "Ressonância", págs. 225–231)*

### 11.1 Os quatro humores *(pág. 226)*

| Humor | Elemento | Função junguiana | Hormônio | Emoções e condições |
|---|---|---|---|---|
| Colérico | Fogo | Emoção | Adrenalina | irado, violento, provocador, passional, invejoso |
| Melancólico | Terra | Pensamento | Tireoide | triste, assustado, intelectual, deprimido, equilibrado |
| Fleumático | Água | Intuição | Pituitária | preguiçoso, apático, calmo, controlador, sentimental |
| Sanguíneo | Ar | Sensação | Testosterona/estrogênio | excitado, feliz, viciado, ativo, volúvel, entusiasmado |

### 11.2 Ressonância e Disciplinas *(pág. 227)*

| Ressonância | Disciplinas |
|---|---|
| Colérica | Celeridade, Potência |
| Melancólica | Fortitude, Ofuscação |
| Fleumática | Auspícios, Dominação |
| Sanguínea | Feitiçaria de Sangue, Presença |
| Sangue animal | Animalismo, Proteanismo |

**São cinco.** O projeto trazia uma sexta, "Vazio", que não aparece em nenhum dos dez livros de
`Livros/Regras`; saiu na §67. E o texto "Alimenta:" que o criador mostra é **derivado dos ids das
Disciplinas**, não uma segunda lista — foi assim que "Metamorfose" e "Feitiçaria do Sangue"
envelheceram sem ninguém notar.

### 11.3 Temperamento — é ele que vale dado *(págs. 227–228)*

| Temperamento | O que é | No dado |
|---|---|---|
| **Efêmero** | no instante, por estímulo momentâneo | **nada** — só sabor, e ingrediente da Alquimia Sangue-Ralo |
| **Intenso** | tendência muito forte para uma Ressonância | **+1 dado** nas paradas das duas Disciplinas daquela Ressonância |
| **Agudo** | tão intenso que cria reação autossustentável | o **mesmo +1**, mais uma **Discrasia** |

O bônus dura **até a próxima dose diluir** o sangue **ou até chegar a Fome 5**.

> **Cuidado com os nomes.** A tabela do Escudo do Mestre traduz *Efêmero* como "Fugaz" e *Agudo*
> como "Apurada" — e, na mesma página, *Celeridade* como "Rapiz", *Feitiçaria de Sangue* como
> "Magia do sangue" e *Proteanismo* como "Metamorfose". O projeto tinha copiado o Escudo. Onde os
> dois discordam, **vale o básico**.

### 11.4 Rolando a bolsa *(pág. 228)*

Role 1d10 para o temperamento. **Se der 6 ou mais**, role de novo para a Ressonância.

| Temperamento aleatório | Ressonância aleatória |
|---|---|
| 1–5 Ressonância equilibrada, insignificante | 1–3 Fleumática |
| 6–8 Efêmero | 4–6 Melancólica |
| 9–0 Intenso, potencialmente agudo — role de novo abaixo | 7–8 Colérica |
| 1–8 Intenso · 9–0 **Agudo** | 9–0 Sanguínea |

O Narrador pode alterar a ordem conforme o ambiente: casas noturnas encorajam o Sanguíneo e não
atraem o Fleumático.

Para **descobrir** a Ressonância de uma vítima sem provar o sangue: perseguir ou conversar por uma
cena e rolar **Determinação + Sagacidade**. Provar resolve todas as dúvidas.

### 11.5 Discrasia *(págs. 228, 230–231)*

Temperamento agudo carrega uma **Discrasia** — "mistura ruim", no termo de Hipócrates; "coágulo",
para os lambedores mais novos. Para usá-la, salvo indicação em contrário, é preciso **matar e drenar
a bolsa** ou **alimentar-se dela por três noites**. O efeito dura até se alimentar de novo ou chegar
a Fome 5.

São **26 exemplos** no livro, e eles moram em `data-ressonancia.js` — não são repetidos aqui, pela
mesma razão da §14.8 e da §16: duas listas para o mesmo fato divergem em silêncio.

> **Animais não fornecem Discrasias** (pág. 227), exceto certas feras das profecias Gangrel. Sangue
> de bolsa não fornece nem Ressonância intensa.

### 11.6 Ressonância e experiência *(pág. 231)*

Para justificar gasto de experiência em uma Disciplina, o personagem **deve se alimentar de sangue
com a Ressonância correspondente**. A quantidade cresce com a pontuação buscada, e o Narrador pode
exigir Ressonâncias cada vez mais potentes, até Discrasias. Aprender Disciplina de fora do clã ainda
exige provar o Sangue de alguém que a possua.

> **Esta é a única parte do capítulo que o motor ainda não cobra.** O gasto de experiência não passa
> pela Ressonância — está registrado como pendência, e não como regra cumprida.

### 11.7 Sangue contaminado

Dura uma ou duas cenas: Álcool −1 Destreza e Inteligência · Cocaína e derivados −1 na dificuldade de
resistir ao frenesi, e 2 de Vontade para rerrolar em Sucesso em Perigo ou Falha Bestial ·
Alucinógenos −2 Raciocínio, Determinação e Manipulação · Opiáceos −2 físicos e −1 para resistir ao
frenesi · Maconha −1 Raciocínio e −1 para resistir ao frenesi · Veneno −1 em tudo e 1–3 Superficial
por cena.

### 11.8 O preço de cultivar uma bolsa *(Apêndice II, pág. 415)*

A §67 leu as págs. 225–231 inteiras e saiu sem o preço mecânico de **mudar** a Ressonância de
uma bolsa, porque ele não está no capítulo: está a duzentas páginas dali, no Apêndice II.
Cultivar uma bolsa é um **projeto**, e o Escopo é o preço.

| O que se quer | Escopo | Dificuldade do Lançamento |
|---|---|---|
| Mudar a Ressonância e levá-la a **Intensa** | 1 | 3 |
| Mudar a Ressonância e acrescentar uma **Discrasia** | 2 | 4 |

O incremento é o do projeto — meses, tipicamente, porque é o tempo de se alimentar da mesma
pessoa até o sangue dela mudar de humor. Parte I §20.7.

## 12. Correções que este livro impôs

Registro honesto do que eu tinha errado antes:

| O que | Eu tinha | Correto |
|---|---|---|
| Surto de Sangue em PS 1 | +2 dados | **+1 dado** |
| Bônus de Disciplina em PS 2 | +1 dado | **Nenhum** (só a partir de PS 3) |
| Gravidade da Perdição em PS 3 | 2 | **1** |
| Penalidade em PS 3 | animais não saciam | **saciam metade** |
| Tabela de Potência | ia só até 5 | **vai até 10** |
| Potência inicial | fixa em 1 | **mínimo da geração** |
| Ressonância Melancólica | Fortitude, Oblívio | **Fortitude, Ofuscação** |

Duas ressalvas sobre a fonte: o escudo tem um **erro de digitação** — duas linhas
"Humanidade 7" na tabela de Humanidade, onde a segunda é claramente **5** pela
sequência. E a linha de Remorso do fim de sessão está comprimida como "humanidade −
caixas marcadas"; a regra do livro básico é **caixas vazias da trilha**, ou seja
10 − Humanidade − Máculas, mínimo 1. Mantive a do básico.

## 13. Fim de sessão

- 1 a 2 pontos de experiência. No fim da história, mais 1.
- Recupere 1 de Força de Vontade **Agravada** se o personagem agiu ativamente conforme
  sua **Ambição**.
- Recupere 1 ou mais Agravado ao beneficiar significativamente um **Pilar**, ou ao
  defender uma **Convicção** mesmo contra o próprio interesse.
- Uma vez por sessão, recupere dano **Superficial** de Vontade ao agir conforme o **Desejo**.
- A critério do Narrador, recupere pontos ao interpretar dramaticamente Sucesso em
  Perigo, Falha Bestial, frenesi ou Compulsão.
- Todo personagem com Mácula na trilha faz **teste de Remorso** no fim da sessão.

## 14. Como o Árbitro consulta

```js
Arbitro.dificuldadeDescrita(4)        // { nivel:4, nome:'Desafiador', exemplos:[...] }
Arbitro.oposicaoDe(5)                 // { nome:'Forte', exemplos:'ancilla, ...' }
Arbitro.dificuldadeDeCaca('Rocinha')  // { dificuldade:2, lugares:'Favela, ...' }
Arbitro.potenciaDeGeracao(9)          // { min:2, max:5 }
Arbitro.tabelaPotencia(3)             // linha completa da tabela
Arbitro.dificuldadeFrenesi('terror', 'exposto a luz solar', 7)
Arbitro.consequencias(resultado)      // escolhas para Perigo / Bestial
Arbitro.compulsaoAleatoria('lasombra')
Arbitro.ferimentoPor(3)               // dano agravado + 1d10 → ferimento
Arbitro.maculasPor('Abraçar um mortal')
Arbitro.danoSocialExtra('O Príncipe')
Arbitro.alimentacaoPor('Bolsa de sangue')
```

`Arbitro.avaliar()` já usa três delas sozinho: **campo de caça** define a dificuldade
quando a intenção é caçar e o alvo traz `zona`; **cobertura** ajusta a dificuldade de
tiro; e **oposição** substitui a dificuldade quando o alvo traz `oposicao`.

---

## 15. Ações padrão — a parada de cada uma

*(conferido no básico, págs. 407–410 — o Apêndice I)*

O Apêndice I é o catálogo de ações comuns **com a parada de dados de cada uma**. É a fonte
que faltava para `arbitro-lexico.js` → `ACOES`, que tem exatamente essa forma: verbo →
atributo + perícia.

> **O livro autoriza o desenho do projeto.** A abertura do Apêndice é explícita:
>
> *"As paradas de dados e regras fornecidas aqui existem somente para orientar o Narrador.
> Sempre é ele quem determina qual parada de dados um jogador deve montar [...] e ele sempre
> pode mudar a parada no melhor interesse da narrativa."* *(pág. 407)*
>
> Ou seja: as **rotas alternativas** que cada ação do léxico oferece não são invenção contra
> o livro — são o que ele manda o Narrador fazer. O que a tabela abaixo cobra é outra coisa:
> quando o livro **nomeia** uma parada, a rota deve ser aquela.

### 15.1 Ações mentais

| Ação | Parada | Notas do livro |
|---|---|---|
| **Percepção** | Atributo **varia** + Percepção | Raciocínio para notar no momento; **Inteligência** para reconhecer; **Determinação** para pescar algo em meio a distração. "Você ouve um som" é Raciocínio; "você ouve o guarda chegando" é Inteligência |
| Perceber alvo vivo | idem | **Dificuldade base = a Furtividade do alvo** |
| Examinar cena de crime | **Inteligência + Investigação** | |
| Detectar sinal sobrenatural, ou qualidade no sangue apesar da Fome | **Determinação** + Percepção | |
| **Pesquisa** | **Inteligência + a Habilidade relevante** | Não só Erudição ou Ciência: de Finanças a Ocultismo. **Dificuldade 3 para quase tudo, no máximo 4.** Informação obscura sobe. Costuma pedir **teste estendido** |
| **Preparação** | **Inteligência + Habilidade ligada ao item** | Teste no meio da sessão para saber se o personagem trouxe algo. **Não se rola para item "assinatura"** — o Brujah trouxe a pistola, o Nosferatu trouxe as gazuas. Quanto mais incomum, maior a Dificuldade |
| **Rastreamento** | **Raciocínio + Sobrevivência** | **Dificuldade base = a Sobrevivência do alvo.** Clima ruim e tempo decorrido aumentam. Sucessos extras dão velocidade, peso, número de pessoas |
| **Hackear** | **Inteligência + Tecnologia** | Dificuldade **4** para segurança corporativa, **6** para bases de dados seguras, **8+** para a NSA. **Falha total alerta a segurança** |
| Engenharia social | **Manipulação + Subterfúgio** ou **Inteligência + Manha** | O livro diz que é assim que a maior parte do hackeamento real acontece |
| **Criação artística** | Atributo varia + **Ofícios** (plásticas), **Performance** (performáticas) ou **Erudição** (arquitetura, literatura) | Arte com mensagem secreta usa a Habilidade "codificada" e **exige valor mais alto na Habilidade aparente** |
| **Explosivos** | criar: **Inteligência + Ciência**; montar: **Inteligência + Tecnologia**; usar: **Inteligência + Ladroagem** (cofre, parede) | Arremessar granada é **ação de arremesso comum** |
| **Ocultamento** | esconder-se na natureza: **Inteligência + Sobrevivência**; urbana: **Inteligência + Manha**; limpar cena: **Determinação + Ladroagem** | **O resultado vira a Dificuldade de quem procurar** |

### 15.2 Ações físicas

| Ação | Parada | Notas do livro |
|---|---|---|
| **Ações de força** | levantar/esmagar: **Força + Atletismo**; arremessar coisa pesada: **o MENOR entre Força e Destreza, + Atletismo** | **Poderio (Potência 2) soma às ações de força.** Levantar é **tudo ou nada**. Arrastar pode valer **+1 de Força efetiva** |
| **Condução** | alta velocidade, manobra, trânsito: **Destreza + Condução**; clima ruim: **Raciocínio + Condução** | **Não se rola para dirigir normalmente.** Cada complicação **+1** sobre Dificuldade 3 (ou 4 com veículo pesado); versão extrema, **+2**. Falha desacelera ou para; falha total pode ser batida |
| **Escalada** | **Destreza + Atletismo** | **Falha total** = emaranhado e preso, ou cai. Corda e equipamento **−2 ou mais**. Pegada Sobrenatural dispensa o teste |
| **Dano por queda** | — | **1 nível de Superficial por metro** de queda livre. Cair em pé e **neutralizar o dano** exige **Destreza + Atletismo com Dificuldade igual aos metros** |
| **Esgueirar-se** | **Destreza + Furtividade** vs. **Raciocínio + Percepção** | Escuridão, barulho ambiente, vento a favor: **+1 dado ao que se esgueira**. Scanner, dispositivo de segurança, posição elevada: **+1 ao observador**. Ofuscação pode dispensar o teste |
| **Espreitamento** (seguir alguém) | sem ser notado: **Raciocínio + Percepção** vs. **Determinação + Manha** do alvo | Descoberto sem saber: **Raciocínio + Furtividade ou Manha** vs. Raciocínio + Percepção. **+1** em área agitada, **+2** em área abarrotada ou com muitas saídas. Trabalho em equipe **só ajuda quem espreita**. Se todos souberem, virou perseguição |
| **Invasão** | **sempre Ladroagem** como Habilidade; o Atributo varia | fechadura ou sensor laser: **Destreza**; cofre ou circuito de alarme: **Inteligência**; perceber câmera: **Raciocínio**; arrombar sem estragos: **Força** (e talvez Potência); instalar sistema: **Inteligência** |

**Invasão, as três regras que a parada não mostra** *(pág. 410)*:

- **Precisa acertar na primeira tentativa** contra segurança ativa, ou o intruso **dispara o
  alarme**.
- **Ladroagem baixa não abre tudo:** Ladroagem 1 abre uma fechadura Yale, **não um cofre**.
- **Ferramentas** adequadas são o padrão; improvisadas custam **+1 de Dificuldade**, e cartão
  de crédito com grampo de cabelo, **+2**. Sistema **puramente eletrônico** pode ser
  penetrado com **Inteligência + Tecnologia, com +1 de Dificuldade**.

**Dificuldades de invasão que o livro dá:** edifício comercial ou museu **4 a 5**; cofre de
banco e instalação segura, mais; instalação do governo **4** na entrada, **6** na ala segura,
**8** no cofre com material perigoso.

### 15.3 A tabela de Força

*(básico, pág. 409)* — **o que se faz sem rolar nada**, pelo valor de Força. O livro a
apresenta para Narradores que preferem número a impressão.

| Força | Ação | Peso |
|---|---|---|
| 1 | Esmagar uma lata de cerveja | 20 kg — árvore de Natal, placa de trânsito |
| 2 | Quebrar uma cadeira de madeira | 45 kg — vaso sanitário |
| 3 | **Derrubar uma porta de madeira** | 115 kg — tampa de bueiro, geladeira |
| 4 | Quebrar uma tábua de madeira | 180 kg — caixão cheio |
| 5 | Quebrar uma porta corta-fogo; rasgar cerca de arame | 250 kg — motocicleta |
| 6 | Arremessar uma motocicleta; partir algemas | 360 kg — poste de aço alto |
| 7 | Virar de ponta-cabeça um carro pequeno; abrir um cadeado | 410 kg — cavalo |
| 8 | Quebrar cano de chumbo; atravessar parede de tijolos com um soco | 455 kg — poste telefônico, piano de cauda |
| 9 | Atravessar concreto com um soco; partir correntes; arrancar porta de carro | 545 kg — tronco de árvore, avião pequeno |
| 10 | Quebrar cano de aço; entortar viga de aço laminado | 680 kg — lancha |
| 11 | Virar carro médio; atravessar placa de metal de 2,5 cm | 910 kg — drone Predator |
| 12 | Quebrar poste de iluminação de metal; arremessar bola de demolição | 1,3 t — helicóptero, carro esportivo |
| 13 | Virar um utilitário; arremessar um carro esportivo | 1,8 t — carro da polícia |
| 14 | Virar um ônibus; arrancar a porta de um cofre | 2,25 t — contêiner vazio, caminhonete |
| 15 | Virar um caminhão; arremessar um utilitário | 2,75 t — Humvee |

Personagens com Força menor **podem tentar Força + Atletismo** para mover carga acima do que
o valor permite.

> **Derrubar uma porta de madeira é Força 3, sem teste.** O léxico hoje transforma isso numa
> rolagem — ver §62 do README.

---

## 16. Itens — o que existe para carregar

*(básico, "Itens", págs. 378–381)* — o capítulo tem três blocos, e o motor lê os três a
partir de `comum/dados/data-itens.js`. **Cada item traz a página de onde veio.** Como nas
Disciplinas (§14.8), a lista não é repetida aqui: duas listas para o mesmo fato divergem em
silêncio, e este documento já pagou esse preço uma vez.

O que **muda o dado** está abaixo. O resto — Saco Antissol, urna ancestral, pedras
entalhadas, terra da sepultura, dinheiro velho, sangue preservado — o livro entrega "a cargo
do Narrador", e o arquivo guarda o texto sem inventar número.

### 16.1 Armas convencionais

| Arma | Pág. | Dano | Natureza | O que mais |
|---|---|---|---|---|
| Arma camuflada | 379 | — | — | **−1 dado no ataque**, salvo vitória crítica na fabricação |
| Arma incendiária caseira | 379 | **−1** | Agravado | falha total incendeia as mãos e o rosto do atirador: **3 de Agravado** |
| Munição sopro de dragão | 380 | +0 | Agravado **contra vampiro** | alcance **15 m**; queima **1 por turno** até apagar |
| Raufoss | 380 | **+5** | Agravado | **ignora qualquer armadura pessoal** |
| Hafla | 380 | +0 | Agravado | alcance **80 m**; Dificuldade mínima **3**; **3 níveis no ato** e **3 por turno** |
| Lança-chamas | 380 | +0 | Agravado | queima o alvo **e o ambiente** a cada turno |
| Coquetel Molotov | 380 | +0 | Agravado | Dificuldade **4**; **2 por turno**; apaga com Autocontrole + Sobrevivência (Dif. 3) |
| Lançador de redes | 380 | +0 | — | o dano sai da **Destreza**, não da Vitalidade; Destreza 0 = enredado, não ataca |
| Lançador de estacas | 381 | +0 | — | dano de estaca comum; a regra da estaca no coração vale (pág. 221) |

> **O lança-chamas causa +0 por turno, e isso não é erro de leitura.** O livro escreve
> "+0 dano Agravado ao atingir o alvo e a cada turno depois disso" (pág. 380): o dano vem da
> margem do ataque, e a queima repete a margem, não um valor próprio. `Combate.queimar` diz
> isso em voz alta em vez de inventar um número.

### 16.2 Como a queima chega ao turno

`Combate.resolver` **devolve** a queima em `queima`; ele não roda o relógio da cena. Quem
toca o turno — a mesa, em `avancarVez` — chama `Combate.queimar(ficha, queimas)` uma vez por
volta. Quem apaga é o jogador, pelo botão da doca de Estado, e cada item diz **com o quê**
se apaga.

Fogo exposto é gatilho de **frenesi de Terror** (pág. 220, §11 desta parte). O motor anuncia;
o teste continua sendo do jogador.

### 16.3 Equipamento de caçador

| Item | Pág. | Teste |
|---|---|---|
| MiraX | 378 | a básica cai com Rubor de Vida. Contra a de segunda geração: Rubor de Vida **e** Autocontrole + Vigor contra Dificuldade 5 + a Determinação do operador |
| Caoscópio | 378 | Inteligência + Percepção, Dificuldade **6**. **−1** por quesito já visto com segurança (geração e clã). Rubor de Vida não afeta |
| Saco Antissol | 378 | sem número: cobre o corpo inteiro, e dormir só com ele é coragem, não garantia |

> A frase da MiraX está transcrita como está impressa: *"Dificuldade 5 + a Determinação do
> operador"*. É uma dificuldade alta para o padrão do sistema, e o livro não a explica. Fica
> registrada como está, e não corrigida por conta própria.

---

---

## 17. Habilidades — as 27, e a regra da especialização

*(básico, "Habilidades", págs. 159–171)*

As 27 Habilidades, com a descrição de cada uma e a página de onde veio, moram em
`comum/dados/data-traits.js` e aparecem no **hover de cada linha** do passo do Ofício
(§71.2 do README). Como nas Disciplinas (§14.8) e nos Itens (§16), a lista **não é repetida
aqui**: duas listas para o mesmo fato divergem em silêncio, e este documento já pagou esse
preço três vezes.

O que fica aqui é o que é **regra**, e não catálogo.

### 17.1 Os três grupos *(págs. 159, 164 e 168)*

| Grupo | Do que dependem |
|---|---|
| **Físicas** | inteiramente, ou em grande parte, de controle, aptidão ou esforço físico |
| **Sociais** | do espaço entre as pessoas — do seu talento e da sua personalidade, mas a resposta da outra parte também conta |
| **Mentais** | quase que inteiramente de conhecimento especializado e dos dons intelectuais |

Nove em cada grupo. A ficha oficial usa **Ladroagem**, **Sagacidade**, **Subterfúgio**,
**Erudição**, **Percepção** e **Ciência** — os ids internos correspondentes são `furto`,
`intuicao`, `labia`, `academicos`, `consciencia` e `ciencias`, e essa diferença já custou um
defeito (README §72.2).

### 17.2 Especializações — a regra inteira *(pág. 159)*

Uma especialização é competência particular num aspecto de uma Habilidade: campo estudado a
fundo, praticado com intensidade, ou para o qual há aptidão especial.

| A regra | O texto do livro |
|---|---|
| **Vale +1 dado** | *"o jogador ganha um dado extra em sua parada de dados"* |
| **Só quando a tarefa se enquadra** | *"Se o Narrador decidir que um personagem está tentando realizar uma tarefa que se enquadra em sua especialização"* |
| **Uma por rolagem** | *"Um personagem pode aplicar apenas uma de suas especializações a uma rolagem"* |
| **Quantas você pode ter** | para a maioria das Habilidades, **tantas quanto o seu valor** nela |
| **Ofícios é exceção** | *"você pode ter mais especializações em Ofícios do que pontos"* (pág. 164) |
| **Quatro vêm com uma de graça** | **Ofícios, Erudição, Ciência e Performance**, ao serem adquiridas |

E a trava que o livro pede ao Narrador: **não permita especialização tão abrangente que se
aplique a quase todo uso da Habilidade.** O exemplo é explícito — nada de "Muay Thai" como
especialização de Briga, porque qualquer briga poderia ser um ataque de Muay Thai, e isso é
um dado extra grátis em todo teste de Briga.

> **A condição é a regra, e o motor não a cobrava.** Até a §73 do README o dado da
> especialização era **incondicional**: quem tivesse *"Lobisomens"* em Briga ganhava o dado
> ao socar um segurança. Medido: sete dados nas duas ações.
>
> Agora quem decide é o texto da ação — `Arbitro.casadorDeEspecializacao`. Casa por palavra
> e não por pedaço de palavra ("Facas" não casa "fachada"), dobra singular e plural
> ("Lobisomens" casa "lobisomem"), e exige a expressão inteira quando todas as palavras são
> curtas ("Um Por Cento", "GTA"). **No combate, quem enquadra é a arma:** *Facas* vale com
> uma faca na mão, e não com um taco.
>
> Onde **não há texto** — a ficha impressa desenhando a parada — não há tarefa a enquadrar, e
> o dado entra. É o que a folha deve mostrar: a parada de quando a especialização vale.

### 17.3 Atletismo no lugar da perícia de combate *(pág. 160)*

> *"Um personagem pode usar Atletismo no lugar de qualquer Habilidade Física de combate em uma
> rolagem de conflito, mas, nesse caso, ele nunca acerta seu oponente, não importa quantos
> sucessos obtenha."*

É a mesma regra da pág. 125, e o motor a cumpre desde a §63.3 do README: `esquivar` é escolha
do defensor, e defesa com Atletismo **não revida**. O capítulo das Habilidades a repete, o que
confirma que ela vale para qualquer conflito, e não só para Briga e Armas Brancas.

### 17.4 Onde uma Habilidade puxa outra

O livro cruza perícias em dois pontos que o motor já respeita:

- **Ladroagem e Tecnologia** *(pág. 163)*: sistemas de ponta são controlados por computador,
  *"portanto podem envolver a Habilidade Tecnologia para serem desativados"*. É por isso que
  `arrombar` tem uma rota eletrônica com Inteligência + Tecnologia e **+1 de Dificuldade**
  (§15 e README §63.4).
- **Medicina cura Agravado em mortais** *(pág. 170)*: *"Personagens usam Medicina para curar
  dano Agravado à Vitalidade em mortais"*. O motor cura o **vampiro** pela Potência de Sangue
  (§10) e **não modela cura de mortal por Medicina** — é lacuna conhecida, não regra
  cumprida.

### 17.5 Acrescentar Habilidade nova *(pág. 162)*

O livro permite, e manda pensar antes: a nova Habilidade não caberia melhor como
**especialização** de uma existente? Pilotar Helicóptero funciona como especialização de
Condução; Pilotar Jato, de Tecnologia; Paraquedismo, de Atletismo.

Este projeto **não acrescenta Habilidade**: as 27 são a ficha oficial, e `data-traits.js` é
conferido contra ela por teste. Fica registrado porque a pergunta vai aparecer.

### 17.6 O que ainda não é cobrado

**Uma especialização por perícia é tudo o que a ficha guarda.** `f.especializacoes` é
`{ periciaId: 'nome' }` — um nome só. O livro permite **tantas quanto o valor na Habilidade**,
e mais que isso em Ofícios. Quem tem Briga 3 poderia ter três, e aqui tem uma.

Isso não dá dado a mais nem a menos numa rolagem — a regra de **uma por rolagem** continua
valendo de qualquer jeito —, mas empobrece o personagem e obriga a escolher no lugar errado.
Está no README §14.1 como **H2**, e é pendência declarada, não regra cumprida.

# Parte III — Fichas por seita

> Era o arquivo `docs/fichas-por-seita.md`. O que muda na criação de personagem quando a
> seita deixa de ser um rótulo e passa a ser uma **bifurcação**.

**Estado: implementado.** As sete fatias da §9 desta parte entraram e foram verificadas no
navegador; a §11 registra onde o código divergiu deste desenho e por quê.

Antes desta fase, `S.seita` era escolhida no passo I e servia só para exibição. Agora ela
governa os passos VI, VII e VIII, a bússola moral, o grupo do personagem e o modo como o
mundo reage — sem quebrar ficha nenhuma já salva.

Fontes: regras.md Parte I, regras.md Parte IV (que marca o que é comunidade e o que é
oficial), `cenario.md` para a reação do mundo.

---

## 1. O princípio: um adaptador, não quatro criadores

A tentação é escrever `if (S.seita === 'sabbat')` espalhado por `app.js`. Não faça isso.
Já temos precedente do que acontece quando dois caminhos calculam a mesma coisa: o
defeito 1 da auditoria.

**Regra:** existe **um** objeto por seita, com a **mesma forma**, e todo o resto do app
lê esse objeto. Quem quiser saber como se chama a bússola moral pergunta ao perfil;
ninguém compara string de seita fora de `data-seitas.js`.

```js
Seitas.perfil(S.seita).bussola.rotulo
Seitas.perfil(S.seita).grupo.rotulo
Seitas.perfil(S.seita).predadoresPermitidos(S)
```

Isso vale também para o motor. `Estado.testeDeRemorso()` não pergunta a seita; pergunta
`perfil.bussola.tipo`.

---

## 2. O quadro geral

| Eixo | `camarilla` | `anarquistas` | `sabbat` | `independente` | `nenhuma` |
|---|---|---|---|---|---|
| Bússola moral | Humanidade | Humanidade | **Caminho da Iluminação** | Humanidade | Humanidade |
| Âncoras | Pilares mortais | Pilares mortais | **Ritae-Pilares** | Pilares mortais | Pilares mortais |
| Grupo | Círculo | **Baronia** | **Matilha** | **Rede / Família** | Nenhum |
| Estado coletivo | Nenhum | Território e favores | Vinculum, Arena, Pontos de Matilha | Contratos em aberto | Nenhum |
| Cargo | Corte formal | Informal, por baronia | Hierarquia rala e violenta | Comercial | Nenhum |
| Status | Comprável, reconhecido | Comprável, local | Comprável só dentro do Sabá | Não existe; vale reputação | Não existe |
| Refúgio | Pessoal | Pessoal ou dividido | **Comunal por padrão** | Pessoal | Pessoal |
| Predadores | Lista padrão | Lista padrão | Padrão **+ 8 exclusivos** | Padrão + tendências de clã | Padrão |
| Vínculo de Sangue | Regra normal | Regra normal | Zerado; vira Vinculum | Regra normal | Regra normal |
| Preço de entrada | Etiqueta e vigilância | Nenhum, e nenhuma proteção | Humanidade | Dívida perpétua | Solidão |

O `sabbat` é o único que troca **subsistema**. `anarquistas` e `independente` trocam
**contexto e recursos**, o que é bem mais barato de implementar — e é por isso que a §9
sugere fazê-los primeiro.

---

## 3. Estrutura de dados

### 3.1 Campo novo na ficha

Um campo só, com formato dependente da seita. Fichas antigas carregam `{}` e continuam
válidas.

```js
seitaDados: {}
```

Em `FICHA_VAZIA()`, entra logo depois de `bairro`. A migração é uma linha no carregador:
`S.seitaDados = S.seitaDados || {}`.

Formas por seita:

```js
camarilla: {
  cargo: '',
  apresentado: true,
  primogenitoPadrinho: '',
  circulo: { nome: '', papel: '' }
}

anarquistas: {
  baronia: { nome: '', bairro: '', tipo: '' },
  papel: '',
  favoresDevidos: [],
  favoresACobrar: [],
  reconhecidaPorCorte: false
}

sabbat: {
  caminho: '',
  conviccoesRitae: ['', '', ''],
  matilha: { nome: '', tipo: '', sacerdote: '', ductus: '' },
  vinculum: 1,
  arena: { perambulacao: 0, alcance: 0, prestigio: 0 },
  pontosMatilha: 1,
  ritaeConhecidos: [],
  refugioComunal: true
}

independente: {
  linhagem: '',
  negocio: '',
  clientes: [],
  contratos: [],
  seitaDeFachada: ''
}

nenhuma: {
  motivo: '',
  ultimaCorte: '',
  procuradoPor: []
}
```

### 3.2 `data-seitas.js` — o perfil

Arquivo novo, dados puros, no padrão dos outros `data-*.js`.

```js
const PERFIS_SEITA = {
  camarilla: {
    id: 'camarilla',
    bussola:   { tipo: 'humanidade', rotulo: 'Humanidade' },
    ancoras:   { tipo: 'pessoa', rotulo: 'Pilar', plural: 'Pilares' },
    grupo:     { rotulo: 'Círculo', coletivo: false, pontos: 0 },
    cargos:    ['Nenhum', 'Xerife', 'Guardião do Elísio', 'Harpia', 'Chicoteador', 'Escriba'],
    statusPositivo: true,
    predadoresExtras: [],
    predadoresVetados: [],
    meritosGratuitos: [],
    defeitosImpostos: [],
    refugio: 'pessoal',
    passos: { alma: 'humanidade', amarras: 'circulo' }
  },
  ...
};
```

Os campos que importam para o resto do app:

| Campo | Quem consome |
|---|---|
| `bussola.tipo` | `motor-estado.js` (Remorso, Máculas), `ficha-oficial.js` (rótulo no PDF) |
| `ancoras.tipo` | passo VIII, doca de Pessoas na mesa |
| `grupo` | passo VII, `motor-ficha.js` (componente Rede do Índice de Força) |
| `cargos` | passo I |
| `statusPositivo` | validação do passo VII |
| `predadoresExtras` / `predadoresVetados` | passo VI |
| `defeitosImpostos` | validação do passo VII e cálculo de Fragilidade |
| `passos.*` | qual variante de tela renderizar |

### 3.3 `data-sabbat.js`

Quatro tabelas, todas já descritas em regras.md Parte IV. Marcar a origem em cada
registro, porque a maior parte é conteúdo de comunidade e a mesa precisa saber:

```js
const CAMINHOS = [
  { id: 'caim', nome: 'Caminho de Caim', alcunha: 'Devoradores, Noddistas',
    compulsao: { nome: 'Voraz', texto: '...' },
    vantagemMatilha: { nome: 'Lições de Nod', texto: '...' },
    ritaePilaresTipicos: ['monomacia', 'vaulderie', 'bando_de_guerra'],
    origem: 'comunidade' },
  ...
];

const RITAE = [
  { id: 'vaulderie', nome: 'Vaulderie', classe: 'auctoritas',
    efeito: '...', podeSerPilar: true, origem: 'oficial/comunidade' },
  ...
];

const TIPOS_MATILHA = [
  { id: 'ritualistas', nome: 'Ritualistas', exige: { arena: 'prestigio', minimo: 1 },
    ritaeDeMatilha: '...', origem: 'comunidade' },
  ...
];

const PREDADORES_SABBAT = [
  { id: 'reivindicador', nome: 'Reivindicador',
    piscinas: [['forca','briga'], ['forca','ocultismo']],
    ganha: { disciplinas: {...}, vantagens: {...}, potenciaSangue: +1 },
    custo: { humanidade: -2, saciaSo: 'diablerie' },
    caminhosComuns: ['caim','morte_e_alma'], origem: 'comunidade' },
  ...
];
```

Os oito predadores do Sabá entram no mesmo formato dos 16 existentes em
`data-predadores.js`, com `piscinas` — senão a ação `caçar` do Árbitro não monta rota,
que foi o defeito 3 da auditoria.

### 3.4 `data-anarquistas.js`

```js
const TIPOS_BARONIA = [
  { id: 'bairro',    nome: 'Baronia de bairro',   territorio: 'um bairro definido' },
  { id: 'corredor',  nome: 'Corredor',            territorio: 'uma via e o que ela liga' },
  { id: 'cooperativa', nome: 'Cooperativa',       territorio: 'sem território, só gente' },
  { id: 'ocupacao',  nome: 'Ocupação',            territorio: 'um prédio, e a briga por ele' }
];

const PAPEIS_BARONIA = [
  { id: 'barao',     nome: 'Barão',      desc: 'Responde pela baronia. Enquanto entregar.' },
  { id: 'emissario', nome: 'Emissário',  desc: 'Fala com a corte, com outras baronias, com quem for.' },
  { id: 'varredor',  nome: 'Varredor',   desc: 'Contra-vigilância. Apaga o que a baronia deixa.' },
  { id: 'braco',     nome: 'Braço',      desc: 'Resolve na força quando o resto falhou.' },
  { id: 'nenhum',    nome: 'Só mais um', desc: 'Sem papel. É a maioria.' }
];
```

Os nomes de papel variam de baronia para baronia; o campo é livre e a lista é sugestão.
Isso é fiel ao cenário e evita inventar cargo canônico onde não há.

**Economia de favores.** É o que substitui hierarquia no Movimento e o que dá tração
narrativa: cada item de `favoresDevidos` e `favoresACobrar` é
`{ id, com, o_que, prazo, cobrado }`. O Diretor usa isso como gatilho pronto.

### 3.5 `data-independentes.js`

```js
const LINHAGENS = {
  hecata:     ['Giovanni', 'Pisanob', 'Samedi', 'Dunsirn', 'Rossellini', 'Família local'],
  ministerio: ['Ministério do Desejo', 'Ministério da Dor', 'Casa própria'],
  ravnos:     ['Sem linhagem — sobrevivente'],
  tzimisce:   ['Voivode', 'Escultor', 'Fazendeiro de terra própria'],
  salubri:    ['Curador', 'Guerreiro (raro)']
};

const NEGOCIOS = [
  { id: 'funeraria',  nome: 'Funerária',       clientes: ['corte', 'baronia', 'mortais'] },
  { id: 'informacao', nome: 'Informação',      clientes: ['todos'] },
  { id: 'ritual',     nome: 'Serviço ritual',  clientes: ['corte', 'independentes'] },
  { id: 'passagem',   nome: 'Passagem segura', clientes: ['quem está fugindo'] },
  { id: 'carne',      nome: 'Acesso a mortais',clientes: ['quem não sabe caçar'] }
];
```

O contrato é a peça central: `{ id, cliente, servico, preco, prazo, quebrado }`. Um
Independente sem contrato em aberto está errado — é assim que a seita paga por não ter
seita.

---

## 4. O que muda em cada passo

### Passo I — A Cidade
A seita passa a ser **decisão travante**. Depois de escolhida, o app avisa em uma linha
o que ela implica (bússola, grupo, custo) e libera os campos de `seitaDados` que
pertencem a este passo: cargo (Camarilla), baronia e papel (Anarquistas), matilha
(Sabá), linhagem e negócio (Independente), motivo (nenhuma).

Trocar a seita depois do passo VIII precisa confirmar, porque zera Convicções ligadas a
Ritae e o grupo.

### Passo II — O Sangue
Filtro de coerência, **aviso e não bloqueio**: clãs improváveis na seita escolhida
recebem uma linha explicando o atrito (`cenario.md` §4.1). Um Ventrue do Sabá é
jogável e é uma história inteira; o app diz isso em vez de impedir.

No Sabá, o clã se chama **Antitribu** na exibição.

### Passos III e IV — O Corpo e O Ofício
Sem alteração. Atributos e Habilidades são iguais em toda seita.

### Passo V — Os Dons
Alteração só via Predador (passo VI) e via Vantagem de Caminho, que dá Disciplina de clã
extra à matilha inteira. Nada muda na tela.

### Passo VI — A Caça
A lista de Tipos de Predador passa a ser
`PREDADORES.filter(permitido) + perfil.predadoresExtras`. No Sabá entram os 8 exclusivos,
todos com custo de Humanidade e restrição de saciedade — o que torna a escolha uma
declaração de personagem, não uma otimização.

### Passo VII — As Amarras
Ganha um bloco **O Grupo**, cujo título e conteúdo vêm de `perfil.grupo`:

| Seita | Bloco |
|---|---|
| Camarilla | Círculo: nome e papel. Sem pontos. |
| Anarquistas | Baronia: nome, bairro, tipo, papel, e a primeira dívida em aberto. |
| Sabá | Matilha: nome, tipo, Sacerdote, Ductus, **1 Ponto de Matilha** e os traços de Arena. |
| Independente | Rede: linhagem, negócio, dois clientes e um contrato em aberto. |
| Nenhuma | Nada. Em vez disso, quem procura por você. |

Validações novas:

- `statusPositivo === false` e o jogador comprou Status → erro, com o motivo.
- Sabá sem matilha → impõe **Suspeito (●)** automaticamente (`defeitosImpostos`).
- Sabá com refúgio pessoal → exige **Suspeito (●)** ou **Segredo Sombrio (●)**.
- Caitiff do Sabá → **Suspeito (●)** perante as outras seitas, já na criação.
- Independente sem nenhum contrato → aviso, não erro.

Os Defeitos impostos **não** consomem o orçamento de 2 pontos, do mesmo jeito que os do
Predador já não consomem. Eles entram na Fragilidade do Índice de Força.

### Passo VIII — A Alma
É aqui que a bifurcação aparece de verdade.

**`bussola.tipo === 'humanidade'`** (Camarilla, Anarquistas, Independentes, nenhuma):
tela atual. Três Convicções, três Marcos, Ambição, Desejo, Ressonância.

**`bussola.tipo === 'caminho'`** (Sabá):

1. Escolher o **Caminho da Iluminação**. A compulsão dele passa a poder substituir a de
   clã, e isso vira uma opção no `motor-estado.js`.
2. Cada Convicção aponta para um **Ritae-Pilar**, não para uma pessoa. Regra dura:
   **duas Convicções nunca podem apontar para o mesmo Ritae** — validação na tela.
3. Os **implementos** do Ritae são declarados junto (cálice, lâmina, fragmento). São
   alvos, e são o que o Diretor vai usar contra o personagem.
4. Marcos continuam existindo, ligados ao Caminho.

Quem escolhe Caminho continua com uma Humanidade numérica, mas **não pode comprá-la** a
partir do momento em que não tem mais Convicção ligada a Pilar mortal. A ficha guarda
isso como `seitaDados.sabbat.humanidadeTravada`.

### Passo IX — A Ficha
O modelo oficial não tem campo para Caminho, Vinculum nem Arena. Solução sem inventar
folha nova: reaproveitar os campos existentes com rótulo trocado, e mandar o excedente
para a **segunda folha**, no bloco de registro livre.

| No PDF | Camarilla / Anarquistas / Independentes | Sabá |
|---|---|---|
| Humanidade | Humanidade | Humanidade, com nota do Caminho |
| Convicções | Convicções | Convicções (Ritae) |
| Pilares | Pilares | Ritae-Pilares |
| Círculo | Círculo | Matilha, tipo e Ductus |
| Registro livre | — | Vinculum, Arena, Pontos de Matilha, implementos |

A validação de pendências do passo IX passa a consultar o perfil: falta de Ritae-Pilar é
pendência no Sabá e não existe nas demais.

---

## 5. O que muda nos motores

| Módulo | Mudança | Tamanho |
|---|---|---|
| `motor-estado.js` | `testeDeRemorso()` consulta `perfil.bussola`. No Caminho, a celebração de um Ritae-Pilar habilita **um teste de Remorso ou a remoção de uma Mácula, uma vez por sessão**. Compulsão de Caminho como alternativa à de clã. | médio |
| `motor-estado.js` | Vinculum: cria, sobe até 3, zera Laços antigos, e a partir de 3 bloqueia Laço novo. Invocar exige Determinação + Inteligência contra a Força de Vínculo. | médio |
| `motor-arbitro.js` | Ações novas no léxico: `celebrar_ritae`, `invocar_vinculum`, `cobrar_favor`, `chamar_baronia`, `vender_servico`, `pedir_passagem`. Cada uma com rotas e capacidades declaradas. | pequeno |
| `motor-arbitro.js` | Caça em matilha: dentro da Perambulação, sucesso com custo automático; fora, dificuldade padrão. Sacerdote rola com +1 dado por companheiro. | pequeno |
| `motor-ficha.js` | Componente **Rede** do Índice de Força passa a somar o grupo: Arena e Pontos de Matilha no Sabá, território e favores a cobrar nos Anarquistas, contratos nos Independentes. Recalibrar depois, com as mesmas 3 fichas de referência. | médio |
| `motor-ficha.js` | Componente **Fragilidade** absorve os Defeitos impostos por seita. | pequeno |
| `ficha-oficial.js` | Rótulos vindos do perfil, e o bloco extra da segunda folha. | pequeno |
| `mesa.js` | A doca de **Pessoas** vira doca de **Ritae** quando `ancoras.tipo === 'ritae'`. Estado coletivo da matilha aparece na doca do grupo. | médio |
| `diretor.js` | Gatilhos novos: celebração de Ritae, cobrança de favor, contrato vencendo. São gatilhos de campanha, e é aí que essa estrutura paga por si. | pequeno |

Nenhum deles mexe em `motor-dados.js`. As regras de dado são as mesmas em toda seita, e
continuam sendo.

---

## 6. O que muda para o Narrador

A seita é uma das poucas coisas que entram no **prefixo cacheado** e mudam a resposta
inteira. O recorte que sobe:

```
Seita do personagem: Sabá — matilha Cinzas da Sé, Vinculum 2, Caminho de Caim.
Como o mundo reage: [linha da matriz de seitas em cenario.md §3.1]
Léxico: Cainita, matilha, Sacerdote, Ductus, Ritae, Vaulderie. Nunca "Membro".
```

Três consequências de estilo, que valem junto com `narracao-ia.md`:

1. **Vocabulário.** O Sabá diz Cainita e trata "Membro" como brandura da Camarilla. Os
   Anarquistas não dizem Elísio nem Primogênito sem ironia. Independentes usam o termo
   do cliente que estão atendendo naquela cena.
2. **Quem aparece.** A matriz da §3.1 do `cenario.md` define se o NPC chega
   negociando, cobrando ou já com a mão na arma. Um Cainita andando por Elísio da
   Camarilla é uma cena de perseguição, não de conversa.
3. **Onde dói.** Cada seita tem um ponto fraco próprio, e é ele que a campanha deve
   apertar:

| Seita | Onde dói |
|---|---|
| Camarilla | O cargo que você quer, e o que precisa fazer para conseguir |
| Anarquistas | O favor que você deve a quem você despreza |
| Sabá | O implemento do Ritae, que quebra e leva a Convicção junto |
| Independente | O contrato que você não pode cumprir e não pode romper |
| Nenhuma | A noite em que precisou de alguém e não havia ninguém |

---

## 7. Regras de validação, resumidas

| Regra | Vale para | Severidade |
|---|---|---|
| Duas Convicções no mesmo Ritae | sabbat | erro |
| Ritae-Pilar sem implemento declarado | sabbat | aviso |
| Comprar Humanidade com Caminho e sem Pilar mortal | sabbat | erro |
| Refúgio pessoal sem o Defeito correspondente | sabbat | erro |
| Sem matilha | sabbat | impõe Suspeito (●) |
| Status positivo fora da própria seita | sabbat, independente, nenhuma | erro |
| Predador exclusivo do Sabá em outra seita | todas | erro |
| Caminho escolhido fora do Sabá | todas | erro |
| Nenhum contrato em aberto | independente | aviso |
| Nenhum favor em aberto | anarquistas | aviso |
| Clã improvável para a seita | todas | aviso, nunca erro |

O padrão é o mesmo do resto do criador: erro trava o passo IX, aviso aparece e deixa
passar.

---

## 8. Compatibilidade com o que já existe

- Ficha salva sem `seitaDados` carrega com `{}` e se comporta como hoje.
- Ficha com `seita: 'camarilla'` não muda em nada: o perfil da Camarilla é exatamente o
  comportamento atual, escrito como dado em vez de estar implícito no código.
- O JSON exportado ganha um campo. Importadores antigos ignoram; o app novo aceita os
  dois.
- O PDF continua com duas folhas e a mesma diagramação.

---

## 9. Ordem sugerida de implementação

Em fatias que rodam e são verificáveis sozinhas, na tradição do projeto.

| Fatia | Entrega | Depende de |
|---|---|---|
| **A** | `data-seitas.js` com os cinco perfis; `seitaDados` na ficha; migração; todo rótulo lido do perfil. Nada muda visualmente na Camarilla. | — |
| **B** | Anarquistas: baronia, papel, favores, bloco do grupo no passo VII, gatilho de cobrança no Diretor. | A |
| **C** | Independentes: linhagem, negócio, contratos, gatilho de vencimento. | A |
| **D** | Predadores do Sabá em `data-predadores.js`, com `piscinas`, e o filtro do passo VI. | A |
| **E** | Caminhos e Ritae: passo VIII alternativo, validação de Convicções, `bussola` no `motor-estado.js`. | A, D |
| **F** | Matilha e Vinculum: estado coletivo, Arena, caça em matilha, doca de Ritae na mesa. | E |
| **G** | Recalibrar o Índice de Força com o componente Rede ampliado, nas mesmas 3 fichas. | B, C, F |

A e B entregam valor imediato e não tocam em subsistema nenhum. E e F são o trabalho de
verdade, e é razoável que fiquem depois da Fase 3 da **Parte B** do README — o Vinculum e os
Ritae rendem muito mais como gatilho de campanha do que como campo de ficha.

---

## 10. O que este documento não resolve

Registro honesto do que fica em aberto, para não construirmos sobre expectativa errada:

1. ~~**A matilha é estado coletivo e o app modela um personagem só.**~~ **Resolvido.**
   `js/ficha/motor-matilha.js` tirou Vinculum, Arena, Pontos e membros de dentro da ficha: agora
   vivem num registro próprio em `vitae:matilhas`, e a ficha guarda só `matilhaId`. Duas
   fichas na mesma matilha compartilham o Vinculum de verdade — verificado. Ficha antiga
   migra sozinha. Detalhes na **Parte B** do README §20.
2. ~~**A maior parte das mecânicas de Sabá é conteúdo de comunidade.**~~ **Resolvido como
   escolha do jogador.** O interruptor existe no passo I: com ele ligado, somem os 8
   Predadores, os tipos de matilha e 10 dos 13 Ritae; os Caminhos ficam sem sistema, que é
   exatamente o que o livro oficial entrega. Ver **Parte B** §19.
3. **Caminhos além dos cinco** — do Sol, da Besta, do Acordo de Honra — aparecem no livro
   oficial sem sistema. Ficam de fora até alguém escrever o sistema.
4. **Anarquistas e Independentes não têm subsistema exclusivo** no V5 da forma que o Sabá
   tem. O que este documento propõe para eles é estrutura de mesa, não regra de livro, e
   é deliberadamente leve por isso.

---

## 11. O que a implementação mudou em relação a este desenho

Registro das divergências, para o documento não mentir sobre o código.

| Ponto | Desenho | O que ficou | Por quê |
|---|---|---|---|
| Divisor do componente Rede | ampliar o teto | teto continua em **12** | Ampliar o teto rebaixaria toda ficha já existente. Com o teto intacto, `FICHA_EXEMPLO` segue em 42 e só quem tem grupo sobe. |
| Contribuição do grupo | somar tudo | limitada a **4 pontos** | Evita que Arena e contratos dominem um componente que vale 15. |
| Predadores do Sabá | arquivo separado | declarados em `data-sabbat.js` e **empurrados para `PREDADORES`** | O helper `predador(id)` é usado em todo o app. Duas listas exigiriam mudar todos os pontos de consulta. |
| Passo do grupo | bloco novo no passo VII | bloco no passo **VII** e campos de identidade no passo **I** | Nome de matilha e baronia pertencem à mesma decisão que a seita. Arena e favores são orçamento, e orçamento é o passo VII. |
| `defeitosImpostos` | lista estática | **função da ficha** | Depende do estado: refúgio pessoal, ausência de matilha e clã Caitiff mudam a lista enquanto o jogador edita. |
| Campos aninhados | não previsto | `data-caminho="a.b.c"` no handler de input | `seitaDados` é profundo, e o handler antigo só sabia gravar em `S[campo]`. |
| Companheiros de matilha | não previsto | campo `companheiros`, padrão **2** | A caça em matilha soma um dado por companheiro. Sem o número, a regra não tinha como chegar ao dado. |

**O que não mudou:** o Sabá continua sendo a única seita que troca subsistema, a ficha
antiga continua carregando sem alteração de comportamento, e nenhuma regra de dado foi
tocada.

---

# Parte IV — Jogando de Sabá

> Era o arquivo `docs/regras-sabbat.md`. Tudo aqui **substitui ou acrescenta** às regras
> da Parte I; o que não estiver listado funciona igual.

## Sobre as fontes — leia antes

Os dois livros de Sabá no projeto **não têm o mesmo peso**:

| Livro | Origem | O que traz |
|---|---|---|
| `Livros/SABBAT.pdf` (PT) | Oficial Paradox — *The Sabbat: The Black Hand* | Cenário, os Caminhos, os Ritae, antagonistas. Trata o Sabá como **inimigo**, não como personagem jogável. |
| `Livros/Vampire-the-Masquerade-v5-Black-Hand-Playing-the-Sabbat.pdf` (EN) | **Storytellers Vault** — conteúdo de comunidade, sob o Community Content Agreement | Os **sistemas** que tornam o Sabá jogável: Vaulderie, Vinculum, matilhas, Ritae com efeito mecânico, Tipos de Predador. |

Ou seja: **a maior parte das mecânicas abaixo é material de comunidade, não cânone
Paradox.** O livro oficial descreve os Caminhos e os Ritae, mas nunca dá sistema para
jogá-los. Isso não os torna ruins — são bem construídos e encaixam no V5 —, mas se a
sua mesa exige apenas material oficial, só o cenário e os Caminhos sobrevivem.

Marquei cada seção com a origem.

---

## 1. Léxico

| Termo | Significado |
|---|---|
| **Cainita** | Como o Sabá chama a si mesmo. "Membro" é considerado brandura da Camarilla. |
| **Matilha** | O círculo do Sabá. Quase sempre reforçada pela Vaulderie. |
| **Sacerdote de matilha** | Líder espiritual e tático da matilha. |
| **Vaulderie** | O ritual de sangue compartilhado que quebra Vínculos antigos e cria o Vinculum. |
| **Vinculum** | O Laço de Sangue coletivo da matilha (plural: *vincula*). |
| **Auctoritas Ritae** | O cânone de ritos que todo o Sabá segue. |
| **Ignoblis Ritae** | Ritos locais, criados pela própria matilha. |
| **Caminho da Iluminação** | Condicionamento que **substitui a Humanidade** como bússola. |
| **Cabeça-de-pá** *(shovelhead)* | Recruta Abraçado em massa, carne de linha de frente. |
| **Guerra da Gehenna** | A luta aberta contra os Antediluvianos. |
| **Guerra Fria** | Intriga e sabotagem contra domínios de outras seitas. |
| **Antitribu** | Como o Sabá nomeia os clãs dentro da seita, renegando a linhagem. |

---

## 2. Caminhos da Iluminação
*(cenário: livro oficial · sistema: comunidade)*

O Caminho **substitui a Humanidade**. A diferença filosófica importa para a mesa: a
Humanidade nega a Besta; o Caminho a **cultiva**. Para o Sabá, a Besta é parte do que
se é, não algo a sufocar.

### 2.1 A mecânica central — Ritae como Pilar

Esta é a peça que muda tudo:

> **O Sabá não liga Convicções a Pilares vivos. Liga a Auctoritas Ritae específicas.**

- Cada Convicção de Caminho tem um **Ritae-Pilar** no lugar de um mortal.
- **Duas Convicções nunca podem apontar para o mesmo Ritae.**
- Quando o Ritae é interrompido ou desrespeitado, o Cainita ganha **Máculas ou entra
  em frenesi**, exatamente como se um Pilar tivesse sido ferido.
- Isso vale também para os **implementos**: o cálice da Vaulderie, o fragmento noddista,
  a lâmina ritual. Destruir um implemento insubstituível pode **custar a Convicção**
  ligada àquele Ritae. É por isso que matilhas guardam esses objetos com obsessão.

**Sistema:** uma vez por sessão, quando a matilha celebra um dos Ritae-Pilares do
personagem, ele pode **fazer um teste de Remorso ou remover uma Mácula**.

### 2.2 Adotar e abandonar um Caminho

- Adotar exige **um professor**. Não se aprende de livro; errar leva a *wassail* ou
  Morte Final.
- Após sobreviver aos **Ritos de Criação**, o recém-Abraçado tem **um mês** para aceitar
  um Caminho. Nesse prazo ele pode ganhar uma Convicção nova ou **substituir uma
  existente** por uma do Caminho. É comum a fé ser testada destruindo o Pilar da
  Convicção substituída.
- Quando o Cainita **não tem mais nenhuma Convicção ligada a Pilar mortal**, está
  inteiramente no Caminho: mantém a Humanidade atual e ganha Máculas normalmente,
  mas **não pode mais comprar pontos de Humanidade**.
- **Sair de um Caminho** é quase impossível. A maioria das tentativas falha e deixa o
  Cainita como *wight* — ou pior.

### 2.3 Compulsão de Caminho

Quando a **Compulsão de Clã** for disparada, o jogador pode acionar a **Compulsão de
Caminho** no lugar dela. Alguns Caminhos ainda exigem **Cavalgar a Onda** em vez de
resistir ao frenesi de Fúria ou Fome.

Cada Caminho tem **Vantagens** compráveis quando o personagem tem Convicções de
Caminho em número igual ao custo. **Toda a matilha se beneficia**, e algumas exigem a
Ressonância do Caminho para ativar.

### 2.4 Os cinco Caminhos

| Caminho | Como se chamam | Compulsão | Vantagem de matilha |
|---|---|---|---|
| **de Caim** | Devoradores, Noddistas | **Voraz** — precisa se alimentar já, subjugando mortais ou vampiros mais fracos. Se não baixar a Fome em 1 até o fim da cena, −2 dados. | *Lições de Nod*: toda a matilha compra **Feitiçaria de Sangue como Disciplina de clã**. 1×/história o Sacerdote impõe um Ritual benéfico à matilha na Vaulderie. |
| **dos Cátaros** | Diabos, Albigenses | **Exibicionista** — expõe a natureza vampírica em grande estilo e exige atenção, submissão e medo dos mortais presentes pelo resto da cena. | *Anjos do Desejo*: toda a matilha compra **Presença como Disciplina de clã**. Com a Ressonância certa, +2 dados para resistir a poderes de Presença pelo resto da sessão. |
| **da Morte e da Alma** | Ceifadores | **Necro-Curioso** — obceca-se pelas propriedades espirituais de algo por perto. Se o alvo for mortal, pode matá-lo para estudar. | Ligada a Oblívio e à comunhão com os mortos. |
| **do Poder e da Voz Interior** | Unificadores | **Supremacia** — cansou de servir. −3 dados em qualquer ação da cena que não seja tomar o que julga merecer ou exigir obediência. | Hierarquia, domínio e comando. |
| **de Lilith** | Bahari, Lilins | **Buscador de Dor** — obceca-se por algo perigoso por perto (fogueira, lupino, arma) e normalmente quer ser ferido por aquilo. | Dor como sacramento e transformação. |

**Ritae-Pilares típicos por Caminho:** Caim → Monomacia, Vaulderie, Bando de Guerra ·
Cátaros → Ritos de Criação, Banquete de Sangue, Vaulderie · Morte e Alma → Ritos de
Criação, Festival dos Mortos, Vaulderie.

O livro oficial em português traz ainda **Caminho do Sol** (Prometeicos — recente,
usa Alquimia, e nem todo sacerdote reconhece como Caminho de verdade), além de
**Caminho da Besta**, **do Acordo de Honra** e menções ao **de Lilith** como
caminhos periféricos ou abandonados.

---

## 3. Vaulderie e Vinculum
*(comunidade)*

O coração da seita. A matilha sangra num cálice sob a condução do Sacerdote e bebe a
mistura.

**Sistema:**

- A Vaulderie cria um Laço de Sangue coletivo, o **Vinculum**.
- Começa com **Força de Vínculo 1** e **sobe 1 a cada celebração, até o máximo de 3**.
- Todos os Laços de Sangue **não-Vinculum** dos celebrantes são **quebrados e zerados**.
- Com Vinculum de **Força 3 ou mais**, o Cainita fica **imune a novos Laços** que não
  sejam Vinculum.
- Matilhas estabelecidas mantêm Vinculum 3 permanentemente. A maioria celebra duas ou
  três vezes por mês.

**Invocar o Vinculum:** um Sacerdote (ou outro Sabá) pode usar o vínculo para dobrar
os irmãos. O alvo precisa vencer **Determinação + Inteligência vs. Força de Vínculo**
para agir contra. Abusar disso leva ao exílio ou a uma Monomacia.

**Sem matilha, sem Vinculum:** o Cainita ganha imediatamente o Defeito **Suspeito (●)**.
O Defeito só sai quando ele estabelece Vinculum de Força 3 numa matilha nova. Recusar-se
a entrar numa matilha rende **Evitado (●●)** e pode virar alvo de **Caçada Selvagem**.

> **Tremere:** a maldição do clã atrapalha o Vinculum. Eles participam, mas com
> dificuldade adicional para formar e invocar o vínculo.

---

## 4. A Matilha
*(comunidade)*

A matilha substitui a coterie. Todo Sabá começa com **1 Ponto de Matilha**, gasto
coletivamente em Vantagens de Matilha e traços de Arena. Pontos de Vantagem pessoais
também podem ser convertidos.

### 4.1 Traços de Arena

| Traço | O que faz |
|---|---|
| **Perambulação** *(Rove)* | Cada ponto soma +1 à dificuldade de detectar ou barrar a matilha em trânsito, e define quanta distância ela cobre sem novos testes. Caçando dentro da área de Perambulação, a matilha **sempre obtém sucesso com um custo**; fora dela, a dificuldade padrão de caça é 6. |
| **Alcance** *(Grasp)* | Cada ponto dá +1 dado para subverter, minar ou intimidar um grupo mortal que ameace a Arena da matilha. |
| **Prestígio** *(Clout)* | 1 ponto dá dificuldade 7 para convocar outras matilhas em auxílio; cada ponto adicional reduz em 1. Sacerdotes com muito Prestígio reivindicam títulos de Bispo ou Arcebispo com mais facilidade. |

### 4.2 Caçada em matilha

Caçando junto, o Sabá **por padrão obtém sucesso com um custo**: sacia a Fome e deixa
um rastro sangrento. Para uma caçada discreta, o **Sacerdote rola**, somando **+1 dado
por companheiro que ajuda**. Deixar a matilha com fome em nome da discrição é jeito
rápido de perder o cargo — ou coisa pior.

### 4.3 Refúgio comunal

Os pontos de Refúgio são somados para comprar Méritos e Defeitos de um espaço
compartilhado. Manter refúgio **pessoal** é tão incomum que exige o Defeito
**Suspeito (●)** ou **Segredo Sombrio (Refúgio Pessoal) (●)**.

### 4.4 Tipos de matilha

Carregadores · Carrapatos de Cripta · Hacktivistas · Faxineiros · Célula de Jyhad ·
Menagerie · Paladinos · Press Gang · Saqueadores · Removedores · Ritualistas ·
Errantes.

Cada tipo tem um **Ritae de Matilha** próprio, com efeito mecânico, e exige um nível
mínimo de traço de Arena, Vantagem ou Defeito. **Um Cainita só se beneficia de um
Ritae de Matilha por vez.** Mudar de tipo exige um Bispo (ou Sabá de prestígio)
celebrando o **Vínculo** *(Binding)*.

---

## 5. Os Ritae
*(nomes: oficial · efeitos mecânicos: comunidade)*

**Requisito geral:** todo Sabá sabe executar os ritos de forma rudimentar. Para render
**benefício**, a matilha inteira precisa estar presente **e** o Sacerdote precisa ter
ao menos **1 ponto na Vantagem Ritae**. Um Sacerdote ignorante também anula o efeito
dos Ritae-Pilares dos companheiros.

### 5.1 Auctoritas Ritae

| Ritae | Efeito |
|---|---|
| **Vaulderie** | Cria e fortalece o Vinculum. Ver §3. |
| **Vínculo** *(Binding)* | Vinculum de todos sobe a **Força 6 pela noite**. Imunidade a subversão de lealdade e a dano de Vontade em conflito social que dependa de duvidar da matilha. Celebrado por Bispo, permite à matilha **trocar de tipo ou de foco de Arena** por acordo unânime. |
| **Banho de Sangue** | Cria Vinculum de Força 3 entre os celebrantes e o líder ungido. Após um mês cai para 1, mas nunca se rompe enquanto o líder se mantiver. |
| **Banquete de Sangue** | 1×/história, **zera a Fome** ignorando Defeitos de alimentação e Perdições de clã. Pelo resto da noite, role +1 dado nas Provocações e escolha o melhor. Custa 2 a 3 mortais mortos ou gravemente feridos por participante. |
| **Ritos de Criação** | Ver §2.2. Abre a janela de um mês para adotar um Caminho. |
| **Festival dos Mortos** *(Festivo)* | Sente a presença de mortos com quem já se dividiu a Vaulderie. Deixar um deles possuí-lo por uma noite **cura todo o dano de Vontade e remove todas as Máculas** — e pode render Disciplina, Loresheet ou Especialização raras. |
| **Dança do Fogo** | Cura **1 de Vontade Agravada**. Sem se queimar, os Defeitos de Status do Sabá caem 1 ponto pela sessão (Evitado vira Suspeito; Suspeito é suprimido). |
| **Jogos do Instinto** | Cura 1 de Vontade Agravada. Cumprindo o objetivo sem quebrar tabus, mesma redução de Status da Dança do Fogo. |
| **Monomacia** | Duelo formal. Quem assiste ou participa não pode entrar noutro na mesma sessão. O resultado **não pode ser contestado socialmente** pelo resto da sessão. Se o vencedor optar por diablerie, **não pode mitigar a perda de Humanidade** de forma alguma. |
| **Sermões de Caim** | Cura 1 de Vontade Superficial. Quem confessa seus pecados ganha **Suspeito** até o fim da história — e, enquanto o tiver, **resiste ou Cavalga a Onda do frenesi de Fome automaticamente**, estendendo o benefício à matilha presente. |
| **Ballo Grande** | Cura 1 de Vontade ou Vitalidade Agravada ao anoitecer. Participando de ao menos 3 noites, a matilha **não registra como morta-viva** em escrutínio místico ou tecnológico pelo resto da história, e a aura fica limpa de sinais de diablerie. |
| **Bando de Guerra** | O diablerista ganha **6 pontos de experiência por sucesso** no teste de diablerie contra o alvo. Estando num Caminho, sofre **1 de Vontade Agravada em vez da perda de Humanidade**. Participar com sucesso eleva o Status no Sabá a 2 pontos pela história. |
| **Caçada Selvagem** | Perseguindo o alvo, todos ganham **+2 dados em testes de Raciocínio** e ficam irreconhecíveis para mortais comuns. |

### 5.2 Ignoblis Ritae

Ritos da própria matilha. Servem para **trocar a Ressonância da matilha** para a do
Sacerdote, ou para **curar 1 de Vontade Superficial** em cada membro. Cada tipo de
matilha tem os seus.

### 5.3 Numinous Ritae

Ritos maiores. Levam **ao menos uma noite** e causam **1 de Vontade Agravada em toda a
matilha**. Exemplos: *Sonhos de Ratziel*, *Lança Enoquiana*, *Runa do Labirinto*,
*Signo Saturnino*, *Chave do Sepulcro*, *Sigilo Inscrito*, *Sangue Estrelado para
Pedras Antigas*.

---

## 6. Tipos de Predador do Sabá
*(comunidade — exclusivos da seita)*

Todos custam Humanidade. Todos fecham a porta da alimentação fácil.

| Tipo | Caminhos comuns | Teste de caça | Ganha | Preço |
|---|---|---|---|---|
| **Catador** | Cátaros, Morte e Alma | Vigor + Atletismo ou Ocultismo | Oblívio 1 + Fortitude ou Potência 1; Garganta de Ferro (●●●) | −1 Humanidade; só cadáver recém-exumado zera a Fome |
| **Reivindicador** | Caim, Morte e Alma | Força + Briga ou Ocultismo | Feitiçaria de Sangue 1 + Potência ou Metamorfose 1; **+1 Potência de Sangue**; +2 dados em diablerie | **−2 Humanidade**; só diablerie zera a Fome |
| **Hedonista** | Cátaros, Lilith | Carisma + Atletismo ou Subterfúgio | Presença 1 + Auspícios ou Potência 1; trata a Humanidade como 2 mais alta para o Rubor da Vida | −1 Humanidade; só mortal intoxicado zera a Fome |
| **Domina** | Lilith, Poder e Voz Interior | Autocontrole + Sagacidade ou Intimidação | Potência 1 + Animalismo ou Dominação 1; Recursos (●●●) | −1 Humanidade; só mortal **voluntário** zera a Fome |
| **Masoquista** | Cátaros, Lilith, Morte e Alma | Determinação + Sagacidade ou Subterfúgio | Fortitude 1 + Auspícios ou Feitiçaria 1; Máscara (●●); Rebanho ou Retentor (●●) | −1 Humanidade; Segredo Sombrio (Laços Mortais) (●●) |
| **Estripador** | Caim, Poder e Voz Interior | Raciocínio + Empatia com Animais ou Sobrevivência | Metamorfose 1 + Animalismo ou Ofuscação 1; **+1 Potência de Sangue**; sacia 1 a mais caçando sozinho | **−2 Humanidade**; só devorar o coração da vítima zera a Fome |
| **Executor** | Cátaros, Poder e Voz Interior | Raciocínio + Intimidação ou Manha | Potência 1 + Auspícios ou Ofuscação 1; Contatos policiais ou criminais (●●●) | −1 Humanidade; só um assassino zera a Fome |
| **Absolvedor** | Cátaros, Lilith | Raciocínio + Erudição ou Persuasão | Dominação 1 + … | −1 Humanidade |

---

## 7. Status e hierarquia
*(oficial + comunidade)*

**Títulos:** Cardeal · Arcebispo · Bispo · Prisco · Ductus · Sacerdote de matilha ·
Templário · Paladino.

O Sabá **esvaziou o meio da hierarquia**: há títulos altos, quase nada intermediário,
e a base. Numa seita descentralizada não existe gerência média. Quando várias matilhas
dividem território por muito tempo, um Sacerdote reivindica **Bispo** ou **Arcebispo**,
e a coisa se firma com um **Banho de Sangue** — ou com uma **Monomacia**, se houver
dois pretendentes de prestígio equivalente.

**Defeitos de Status do Sabá:** **Suspeito (●)** e **Evitado (●●)**. Vários Ritae
existem justamente para removê-los.

**Caitiff do Sabá** começam com **Suspeito (●)** perante Camarilla, Ashirra e
Anarquistas, e **só podem comprar Status positivo dentro do Sabá** na criação.

---

## 8. Criação de personagem do Sabá — o que muda

| Etapa | Alteração |
|---|---|
| Círculo | Vira **matilha**, com Sacerdote, tipo e Arena |
| Pontos de Matilha | **1 grátis** para todos, gastos coletivamente |
| Pilares | **Ritae-Pilares** no lugar de mortais (§2.1) |
| Humanidade | Substituída por um **Caminho da Iluminação**; sem comprar Humanidade depois de largar o último Pilar mortal |
| Compulsão | A de Caminho pode substituir a de clã |
| Tipo de Predador | Pode usar os exclusivos do §6 |
| Vínculo de Sangue | Zerado pela Vaulderie; substituído pelo Vinculum |
| Clã | Chamado **Antitribu**; anunciar interesse de clã abertamente é punível |
| Refúgio | Comunal por padrão; pessoal exige Defeito |

---

## 9. Notas para a implementação no VITÆ

O Sabá **não é uma variante cosmética** — ele troca três subsistemas inteiros:

1. **Pilares → Ritae-Pilares.** O `data-mesa.js` guarda pilares como pessoas. Uma ficha
   de Sabá precisaria ligar Convicções a Ritae, e a doca de **Pessoas** perde peso para
   uma doca de **Ritae**.
2. **Humanidade → Caminho.** Muda a compulsão, muda o teste de Remorso (que passa a
   depender da celebração de um Ritae-Pilar) e trava a compra de Humanidade.
3. **Coterie → Matilha.** Traços de Arena, Pontos de Matilha e Vinculum são estado
   **coletivo**, e o app hoje só modela um personagem.

Nada disso é difícil, mas nenhum é pequeno. Sugiro deixar para depois da Fase 2 do
**Parte B**, quando o Diretor já existir — o Vinculum e os Ritae são naturalmente
gatilhos de campanha, não de ficha.

Para o cenário brasileiro, o gancho já está em `data-brasil.js`: **São Paulo** foi um
dos maiores centros do Sabá nas Américas, e a **Catedral da Sé** abrigava o concílio que
codificava os Auctoritas Ritae. Uma crônica de Sabá em São Paulo é a mais bem
fundamentada que o material brasileiro permite.

---


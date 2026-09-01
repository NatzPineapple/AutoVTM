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
| **II — Escudo do Mestre** | Tabelas de decisão: dificuldade, oposição, caça, ferimento, NPCs | regras.md Parte II |
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

| Termo usado no app | Variantes encontradas nos livros | Inglês |
|---|---|---|
| **Provocação** | Checagem de Sangue, Verificação de Despertar | Rouse Check |
| **Rerrolagem de Sangue** | — | Rouse Reroll |
| **Surto de Sangue** | — | Blood Surge |
| **Gravidade da Perdição** | Gravidade de Bane | Bane Severity |
| **Perdição do Clã** | Maldição | Clan Bane |
| **Vitalidade** | Saúde | Health |
| **Debilitação** | Prejudicado | Impairment |
| **Mácula** | — | Stain |
| **Crítico Bestial** | Sucesso em Perigo, Vitória Confusa | Messy Critical |
| **Falha Bestial** | — | Bestial Failure |
| **Pilar** | Marco, Toque de Pedra | Touchstone |
| **Ladroagem** | Furto | Larceny |
| **Sagacidade** | Intuição | Insight |
| **Subterfúgio** | Lábia | Subterfuge |
| **Erudição** | Acadêmicos | Academics |
| **Percepção** | Consciência | Awareness |
| **Ciência** | Ciências | Science |

As seis últimas linhas vêm da ficha oficial e são as que o app usa.

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

Implementado em `Dados.retestarVontade()`.

- Custa **1 ponto de Força de Vontade** (marque 1 de dano Superficial na trilha de Vontade).
- Permite **rerrolar até 3 dados**.
- **Dados de Fome nunca podem ser rerrolados.** (Confirmado por exceção: o mérito de
  coterie Salubri "Restrição" existe justamente para permitir rerrolar dados de Fome,
  o que prova que a regra padrão proíbe.)
- **Uma vez por teste.** O resultado do reteste é final.
- Na prática o jogador escolhe os dados; o app pré-seleciona os que falharam, do pior
  para o melhor.

Recuperação de Força de Vontade: some Autocontrole **ou** Determinação (o maior) de
dano Superficial de Vontade ao fim de cada sessão, ou ao cumprir sua Ambição/Desejo.

---

## 5. Dificuldade

| Dificuldade | Situação |
|---|---|
| 1 | Trivial, mas sob pressão |
| 2 | Fácil |
| 3 | Padrão — o normal para uma tarefa que vale rolar |
| 4 | Difícil |
| 5 | Muito difícil |
| 6+ | Quase impossível para um neonato |

Testes sem dificuldade declarada usam "1 sucesso basta".

No VITÆ a dificuldade base vem da **calibragem pelo Índice de Força** (ver
`a Parte B deste README` §4), exceto em testes-marco fixados na campanha.

---

## 6. Tipos de teste

**Simples** — piscina contra dificuldade.

**Disputado** — os dois lados rolam; vence quem tiver mais sucessos. Empate mantém o
status quo. Sucesso em Perigo e Falha Bestial valem normalmente para cada lado.

**Prolongado** — acumula sucessos ao longo de várias rolagens até atingir um total.
Cada rolagem costuma custar tempo, e uma falha total zera o progresso.

**Em equipe** — um personagem lidera e os outros somam 1 dado cada, desde que tenham
ao menos 1 ponto na Habilidade usada.

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

## 8. Provocação e Surto de Sangue

**Provocação (Checagem de Sangue)** — rola 1d10. **Resultado 1 a 5 aumenta a Fome em 1.**
É o custo de quase todo poder de Disciplina.

Com Potência de Sangue suficiente, o vampiro ganha **Rerrolagem de Sangue** até certo
nível de poder: rola de novo e escolhe o melhor resultado.

**Surto de Sangue** — antes de um teste que use um Atributo físico, o vampiro pode
gastar uma Provocação para somar dados conforme a Potência de Sangue. Dura um turno.

> Em Oblívio há uma regra extra: numa Provocação para poder ou Cerimônia de Oblívio,
> um resultado **1 ou 10** gera uma **Mácula**, além da Fome ganha.

---

## 9. Potência de Sangue

> **A tabela completa 0–10 e a conversão Geração → Potência estão em
> **Parte II §5.** O que estava aqui antes tinha
> quatro valores errados, corrigidos pelo Escudo do Mestre — ver §12 daquele arquivo.

Em resumo: a Potência inicial vem do **mínimo da geração** (12ª–13ª → 1; 9ª → 2;
14ª–16ª → 0), não de um valor fixo. Ela governa Surto de Sangue, quanto dano a
Provocação recupera, bônus nas Disciplinas, rerrolagem de Provocação, Gravidade da
Perdição e o que o sangue de animal e de bolsa ainda consegue saciar.

---

## 10. Vitalidade e dano

*(conferido no básico, pág. 127)*

```
Vitalidade = Vigor + 3
```

Duas naturezas de dano:

- **Superficial** — contundente, garras, quedas. Para vampiros, **divide-se por dois,
  arredondando para baixo**, antes de marcar.
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

```
Força de Vontade = Autocontrole + Determinação
```

Gastos:

- **Reteste** — 1 ponto, rerrola até 3 dados não-Fome (§4).
- **Resistir a frenesi ou compulsão** — 1 ponto, por um turno.
- **Ignorar Debilitação** — 1 ponto, por um turno.

Recupera-se ao fim da sessão (Autocontrole ou Determinação, o maior) e ao satisfazer
a Ambição ou o Desejo.

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
clã tem a sua, listada em `app/js/data/data-clans.js`, e ela impõe penalidade de dois dados
até ser satisfeita.

---

## 14. Disciplinas

*(conferido no básico, pág. 244 — as regras gerais quase todas faltavam aqui)*

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

> **Este bônus não existe no motor.** `bonusDisciplina` está declarado em
> `data-escudo.js` e **nenhuma linha de código o lê** — a mesma classe de defeito que a
> auditoria original achou nos modificadores do Árbitro. Ver §14.1 do README.

### 14.5 Amálgamas

Poder que exige proficiência em **mais de uma** Disciplina. O personagem precisa ter a
quantidade de pontos listada na outra Disciplina para adquiri-lo.

Para efeito de tipo e classificação, um poder Amálgama **pertence às duas Disciplinas**.

Exemplo: *Braços de Arimã* é Oblívio 2 com Amálgama Potência 2.

### 14.6 Rituais e Cerimônias

**Feitiçaria do Sangue** usa **Rituais**; **Oblívio** usa **Cerimônias**. Ambos exigem
tempo, preparação e componentes, e o nível do ritual **não pode passar do nível da
Disciplina**. O custo em experiência é o **nível do ritual × 3** (§17).

### 14.7 Oblívio — lista oficial

Extraída de `Livros/Oblivio.pdf`. Azul = mais comum entre Lasombra; vermelho = Hecata.

| Nível | Poderes |
|---|---|
| 1 | Manto Obscuro · Visão de Oblívio · Do Pó ao Pó · Grilhões que Vinculam |
| 2 | Projetar Sombra · Braços de Arimã *(Amálgama: Potência 2)* · Precognição Fatal *(Amálgama: Auspícios 2)* · Onde a Mortalha Afina |
| 3 | Perspectiva da Sombria · Toque de Oblívio · Aura de Decadência · Banquete de Paixões |
| 4 | A Mortalha Estígia · Praga Necrótica |
| 5 | Passo Sombrio · Avatar Tenebroso · Skulds Realizada · Espírito em Declínio |

**Cerimônias:**

| Nível | Cerimônias |
|---|---|
| 1 | A Dádiva da Vida Falsa · Invocar o Espírito · Cadáver Irracional |
| 2 | Despertar do Servo Homuncular · Obrigar Espíritos · Servo Homuncular |
| 3 | Espírito Anfitrião · Hordas Trôpegas · Cadáver Violento |
| 4 | Vincular o Espírito · Rasgar a Mortalha |
| 5 | Ex Nihilo · Benção Lazarena |

Projeções e espíritos de Oblívio sofrem dano de fogo e sol como se fossem vampiros de
Potência de Sangue 1.

---

## 15. Combate

*(conferido no básico, págs. 301–302 — esta seção mudou bastante na revisão; o que estava
aqui antes vinha do Guia do Jogador e divergia do livro em quatro pontos)*

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

---

## 16. Criação de personagem

*(conferido no básico, pág. 136)*

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

## 17. Experiência

*(conferido no básico, pág. 151 — as nove linhas batem; faltava uma)*

| Compra | Custo |
|---|---|
| Atributo | novo nível × 5 |
| Habilidade | novo nível × 3 |
| Especialização | 3 |
| Disciplina de clã | novo nível × 5 |
| Disciplina fora do clã | novo nível × 7 |
| Caitiff | novo nível × 6 |
| Ritual ou Cerimônia | nível × 3 |
| Fórmula de Sangue-Ralo | nível da Fórmula × 3 |
| Vantagem | 3 por ponto |
| Potência de Sangue | novo nível × 10 |

---

## 18. Perigos permanentes

| Perigo | Efeito |
|---|---|
| **Luz solar** | Dano Agravado por turno, ignora Fortitude parcialmente. Destruição é o resultado normal. |
| **Fogo** | Dano Agravado. Provoca teste de frenesi de Terror. |
| **Estaca no coração** | Não mata: paralisa. O vampiro fica consciente e indefeso. |
| **Torpor** | Sono forçado após Vitalidade cheia de Agravado. A duração cresce com Humanidade baixa. |
| **Diablerie** | Drenar a alma de outro vampiro. Reduz a geração, mancha a aura por anos e é crime capital em toda seita. |
| **Vínculo de Sangue** | Três goles do mesmo vampiro em noites separadas. O vínculo é amor imposto, e enfraquece com o tempo se não for renovado. |
| **Segunda Inquisição** | Vigilância eletrônica e força letal. No Brasil, o BOES — ver `data-brasil.js`. |

---

## 19. O que o motor já implementa

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

---

# Parte II — Escudo do Mestre

> Era o arquivo `docs/escudo-do-mestre.md`. Referência de **valores**: existe para o
> Mestre — humano ou IA — não precisar inventar número nenhum ao montar uma situação.

Toda tabela desta parte está implementada em `app/js/data/data-escudo.js` e é consultável
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
> `app/js/data/data-escudo.js` ainda carrega os valores antigos — ver §14.1 do README.

| PS | Surto | Recuperada | Bônus Disc. | Rerrolagem | Perdição | Penalidade de alimentação |
|---|---|---|---|---|---|---|
| 0 | **+1** | 1 sup. | — | — | 0 | Nenhuma |
| 1 | **+2** | 1 sup. | — | Nível 1 | **2** | Nenhuma |
| 2 | **+2** | 2 sup. | **+1** | Nível 1 | **2** | Animal e bolsa saciam **meia** Fome |
| 3 | **+3** | 2 sup. | +1 | Até Nível 2 | **3** | Animal e bolsa **não saciam nada** |
| 4 | **+3** | 3 sup. | +2 | Até Nível 2 | **3** | Não saciam; 1 a menos por humano |
| 5 | **+4** | 3 sup. | +2 | Até Nível 3 | **4** | Não saciam; 1 a menos; matar para descer abaixo de 2 |
| 6 | **+4** | 3 sup. | +3 | Até Nível 3 | **4** | Não saciam; 1 a menos; matar para descer abaixo de 2 |
| 7 | **+5** | 3 sup. | +3 | Até Nível 4 | **5** | Não saciam; 2 a menos; matar para descer abaixo de 2 |
| 8 | **+5** | 4 sup. | +4 | Até Nível 4 | **5** | Não saciam; 2 a menos; matar para descer abaixo de 2 |
| 9 | **+6** | 4 sup. | +4 | Até Nível 5 | **6** | Não saciam; 2 a menos; matar para descer abaixo de 3 |
| 10 | **+6** | 5 sup. | +5 | Até Nível 5 | **6** | Não saciam; 3 a menos; matar para descer abaixo de 3 |

**Recuperada** e **Rerrolagem** estavam corretas e não mudaram.

### Surto de Sangue — as travas

*(básico, pág. 218)*

- Custa **uma Checagem de Sangue**, e vale para **uma única rolagem**.
- **Uma por rolagem.** Não se acumulam.
- Só entra em parada que **use um Atributo**.
- **Proibido** em rolagem de **Força de Vontade** ou **Humanidade**, em rolagem que valha
  para mais de uma cena, e em Combate de Rolagem Única.
- **Não** se aplica vitória automática nem "Pegar Metade" a uma rolagem aumentada por Surto.
- Os dados do Surto **permanecem** numa rerrolagem paga com Força de Vontade.

> E a regra que mais muda o jogo, da mesma página: **falhar numa Checagem de Sangue não faz
> o dom falhar — só aumenta a Fome em 1.**

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

| Humor | Elemento | Emoção | Disciplinas que alimenta |
|---|---|---|---|
| Colérico | Fogo | raiva, violência, bullying, paixão, inveja | Celeridade, Potência |
| Melancólico | Terra | triste, assustado, intelectual, depressivo | Fortitude, **Ofuscação** |
| Fleumático | Água | preguiça, apatia, calma, controle, sentimento | Auspícios, Dominação |
| Sanguíneo | Ar | excitado, feliz, viciado, ativo, entusiasta | Feitiçaria de Sangue, Presença |
| Sangue animal | — | — | Animalismo, Metamorfose |

**Temperamento aleatório (1d10):** 1–5 Balanceado · 6–8 Fugaz · 9–10 Intensa (role de
novo: 1–8 Intensa, 9–10 Apurada).
**Ressonância aleatória (1d10):** 1–3 Fleumático · 4–6 Melancólico · 7–8 Colérico ·
9–10 Sanguíneo.

**Sangue contaminado**, dura uma ou duas cenas: Álcool −1 Destreza e Inteligência ·
Cocaína e derivados −1 na dificuldade de resistir ao frenesi, e 2 de Vontade para
rerrolar em Sucesso em Perigo ou Falha Bestial · Alucinógenos −2 Raciocínio,
Determinação e Manipulação · Opiáceos −2 físicos e −1 para resistir ao frenesi ·
Maconha −1 Raciocínio e −1 para resistir ao frenesi · Veneno −1 em tudo e 1–3
Superficial por cena.

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


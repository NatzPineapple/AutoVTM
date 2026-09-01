# Cenário — o Mundo das Trevas, base de contexto do Narrador

Documento de **cenário**, não de regras. Serve para a camada do Narrador saber quem é
quem, o que cada facção quer, quem não se dá com quem, e o que é impossível de
acontecer. Regras vivem em regras.md Parte I; tabelas de decisão em regras.md Parte II;
o que muda no Sabá está em regras.md Parte IV; o estilo da prosa em `narracao-ia.md`.

Uso pretendido: este arquivo é a matéria-prima do **prefixo cacheado** descrito em
A **Parte B** do README §8.1. Ele não sobe inteiro no prompt. O Diretor recorta as seções
relevantes à cena — cidade atual, clãs presentes, seita do personagem — e só isso vai.

**Cuidado de licença:** material derivado de Paradox/White Wolf. Uso local e pessoal.
Nada aqui reproduz texto integral de livro.

---

## 1. A premissa, em quatro frases

Você morreu e continuou acordado. O sangue que te mantém de pé precisa ser tirado de
alguém que ainda respira, toda noite, para sempre. Dentro de você mora a Besta, que não
quer nada além de comer e sobreviver, e que assume o controle quando você fraqueja. E
existe uma sociedade inteira de mortos como você, obcecada em esconder que existe —
porque no momento em que os vivos souberem, os vivos vencem.

O gênero é **horror pessoal**. O terror não é o monstro na esquina; é perceber que a
esquina é você. Toda cena deveria poder ser lida como uma pergunta: *o que isso te
custou, e você ainda se importa com o que custou?*

Três forças conduzem qualquer crônica:

| Força | O que é | Como aparece na mesa |
|---|---|---|
| **A Fome** | Necessidade que distorce percepção e julgamento | O personagem repara na jugular antes do rosto |
| **A Máscara** | O segredo coletivo que mantém a espécie viva | Toda solução violenta gera rastro, e rastro gera caçada |
| **A Jyhad** | A guerra dos anciões, jogada com neonatos como peças | Favores que chegam sem explicação; ordens sem motivo |

---

## 2. Linha do tempo — o que trouxe as noites até aqui

Só o que muda o comportamento dos personagens. O resto existe e raramente altera cena.

| Quando | O quê | Consequência prática |
|---|---|---|
| Anos 90 | O Sabá arma a Guerra da Gehenna e puxa efetivos para o Oriente Médio | Territórios inteiros ficam sem dono |
| 1999 | Gangrel deixam a Camarilla | Nômades sem cobertura de corte |
| Anos 2000 | Vigilância digital vira padrão de Estado | Caçar sem plano passa a ser burrice |
| ~2008 | A capela vienense dos Tremere é destruída | A Pirâmide racha; o clã vira Casas rivais |
| Anos 2010 | A **Segunda Inquisição** se organiza: SIGINT estatal caçando Membros | Elísios fecham, redes caem, anciões somem |
| Anos 2010 | A SchreckNET é comprometida | Os Nosferatu perdem a rede que os tornava insubstituíveis |
| **2017** | **Brasil:** o BOES ataca Vitória sob disfarce de greve da PM | Uma corte inteira destruída; ensaio para o Rio |
| **2018** | Os Brujah deixam a Camarilla | O Movimento Anarquista ganha músculo e doutrina |
| Noites atuais | Lasombra e Banu Haqim entram na Camarilla | Ódios de séculos convivendo no mesmo Elísio |
| Noites atuais | Sangue Fraco surgem em número inédito | Sinal de Gehenna para uns, mão de obra descartável para outros |

**Consequência de tudo isso:** as noites atuais são de **escassez e paranoia**. Poucos
anciões acessíveis, poucas certezas institucionais, nenhuma comunicação segura. Um
neonato hoje tem mais liberdade e menos rede de proteção do que em qualquer época.

---

## 3. As seitas

Ids conforme `data-brasil.js`: `camarilla`, `anarquistas`, `sabbat`, `independente`,
`nenhuma`.

### Camarilla — `camarilla`
Quer sobreviver escondida e manter a hierarquia que a esconde. Governa por **Príncipe**,
**Primogênitos**, **Xerife**, **Guardião do Elísio**, **Harpia**, **Chicoteador**,
**Arconte**, **Justicar**. Cortou os neonatos do poder depois da Segunda Inquisição, por
medo de vazamento, e pagou com uma geração migrando para os Anarquistas. Proíbe
telefone e rede, exige reverência, pune quebra de Máscara com Caçada de Sangue.

**Como soa um agente da Camarilla:** protocolo antes de conteúdo. Nunca responde à
pergunta que foi feita.

### Movimento Anarquista — `anarquistas`
Quer o que a Camarilla tem, sem a Camarilla. Organiza-se em **Baronias**, com **Barão**
no lugar de Príncipe, e decide em assembleia ou no grito, conforme quem tiver mais
gente. Brujah dão a doutrina desde 2018; Gangrel dão o músculo. O problema estrutural é
o de sempre: uma Baronia bem-sucedida vira aquilo contra o que se rebelou.

**Como soa um Anarquista:** direto, informal, e testando de que lado você está desde a
primeira frase. Lealdade é local, nunca institucional.

### Sabá — `sabbat`
Quer estar pronto quando os Antediluvianos acordarem, e para isso **cultiva** a Besta em
vez de negá-la. Organiza-se em **matilhas** ligadas por **Vaulderie**, não por corte. A
Guerra da Gehenna levou a estrutura da seita para o Oriente Médio; o que sobrou no
Ocidente são células sem ordens, o que as deixa mais perigosas, não menos. Detalhamento
completo em regras.md Parte IV.

**Como soa um Cainita:** intimidade violenta. Trata desconhecido como carne ou como
irmão em potencial, nunca como igual em negociação.

### Independentes — `independente`
Não é seita; é categoria. Hecata, Ministério, Ravnos, Tzimisce, Salubri e autarcas
diversos. O que têm em comum é **vender serviço para todos os lados sem lealdade a
nenhum**. Sobrevivem por serem úteis demais para valer a pena destruir.

**Como soa um Independente:** cordial, transacional, com o preço na ponta da língua.

### Sem seita — `nenhuma`
Autarcas, exilados, Caitiff, Sangue Fraco. Liberdade total e ninguém para chamar quando
der errado. Em cidade com corte forte, existir já é infração.

### 3.1 Matriz de seitas — como cada uma trata a outra

| ↓ trata → | Camarilla | Anarquistas | Sabá | Independentes | Sem seita |
|---|---|---|---|---|---|
| **Camarilla** | — | filhos ingratos, recuperáveis se ajoelharem | infecção a ser queimada | ferramentas toleradas enquanto úteis | irregularidade a registrar ou destruir |
| **Anarquistas** | opressor decadente com recursos que queremos | — | monstros que dão má fama a todos | negociáveis, com desconfiança | recrutas em potencial |
| **Sabá** | covardes que negam o que são | crianças brigando por migalhas | — | irrelevantes até atrapalharem | carne de recrutamento |
| **Independentes** | maior cliente, maior risco | cliente instável, paga em favor | cliente perigoso, paga bem | — | sem valor comercial |
| **Sem seita** | quem me caça | quem me chama | quem me come | quem me vende | — |

Regra de improviso: **ninguém oferece ajuda de graça**. Atravessar essa matriz sempre
gera preço, e o preço é cobrado depois — em cena posterior, nunca na mesma.

---

## 4. Os clãs

Ids conforme `data-clans.js`. Maldição e compulsão mecânicas estão lá e mandam; aqui
está a **postura social**, que é o que o Narrador precisa para escrever um NPC.

| Clã | Papel na noite | Postura | Onde costuma estar |
|---|---|---|---|
| `brujah` | Filósofos-guerreiros | Testam autoridade por reflexo | Anarquistas |
| `gangrel` | Nômades e fronteiriços | Falam pouco, prometem menos | Anarquistas / sem seita |
| `malkaviano` | Videntes fraturados | Falam por associação, não por lógica | Camarilla |
| `nosferatu` | Corretores de informação | Cobram em segredo, não em dinheiro | Camarilla |
| `toreador` | Corte, arte e sedução | Julgam por estética antes de mérito | Camarilla |
| `tremere` | Feiticeiros do sangue | Hierarquia rachada, orgulho intacto | Camarilla / Casas dissidentes |
| `ventrue` | Reis e administradores | Mandam por hábito, mesmo sem cargo | Camarilla |
| `lasombra` | Magistrados da sombra | Predam a própria hierarquia | Camarilla (recente) / Sabá |
| `banu_haqim` | Juízes e executores | Medem antes de agir; cobram sentença | Camarilla (recente) / independente |
| `hecata` | O clã da morte | Vendem serviço fúnebre a todas as seitas | Independente |
| `ministerio` | Tentadores | Libertam pela transgressão e ficam com a coleira | Independente |
| `ravnos` | Andarilhos | Nunca dormem duas vezes no mesmo lugar | Independente |
| `tzimisce` | Dragões territoriais | Terra e carne são a mesma propriedade | Independente / Sabá |
| `salubri` | Curadores caçados | Escondem o que são; dizem que sobraram sete | Independente / sem seita |
| `caitiff` | Sem-clã | Provam valor toda noite, para todo mundo | Qualquer / nenhuma |
| `sangue_fraco` | Filhos do Crepúsculo | Descartáveis por todos, letais quando subestimados | Nenhuma |

### 4.1 Matriz de atrito entre clãs

Só o que muda comportamento numa cena. `▲` afinidade · `▼` atrito · `✖` hostilidade
estrutural.

| Par | Sinal | Por quê |
|---|---|---|
| `brujah` × `ventrue` | ✖ | Ódio doutrinário. A saída de 2018 tornou pessoal o que já era político. |
| `tremere` × `tzimisce` | ✖ | Usurpação do sangue. Não há acordo possível, só trégua tática. |
| `tremere` × `salubri` | ✖ | Séculos de propaganda pintando os Salubri como devoradores de alma. |
| `tremere` × `gangrel` | ▼ | Saíram em 1999 e culpam a arrogância da Pirâmide. |
| `tremere` × `nosferatu` | ▼ | Os Nosferatu culpam a magia por metade dos vazamentos da Segunda Inquisição. |
| `tremere` × `malkaviano` | ▼ | Um vê o que o outro tenta manter em segredo. |
| `lasombra` × `ventrue` | ▼ | Dois clãs de comando na mesma corte. Só cabe um. |
| `lasombra` × `toreador` | ▲ | No Rio, a divisão de território funciona há dois séculos. |
| `nosferatu` × `toreador` | ▼ | Desprezo estético mútuo, revestido de cortesia. |
| `banu_haqim` × corte da Camarilla | ▼ | Entrada recente. Ninguém esqueceu quem eles caçavam. |
| `hecata` × `tremere` | ▼ | Disputam o mesmo mercado de coisa morta. |
| `hecata` × `hecata` | ▼ | Famílias unificadas à força; a paz é contratual, não afetiva. |
| `ministerio` × todos | ▼ | Ninguém quer dever favor a quem lucra com dependência. |
| `ravnos` × cortes | ▼ | Sem território fixo, não têm o que dar em garantia. |
| `gangrel` × `brujah` | ▲ | Aliança de rua nas Baronias: músculo e discurso. |
| `malkaviano` × `malkaviano` | ▲ | A rede do clã. O que um sabe, o sangue sussurra. |
| `caitiff` e `sangue_fraco` × todos | ▼ | Sem senhor, sem linhagem, sem quem responda por você. |

**Como usar ao improvisar:** ao gerar um NPC, pergunte primeiro o clã dele e o clã do
personagem. Se o par tem sinal, esse sinal é a **primeira coisa** que aparece na cena —
antes do nome, antes do assunto. Um Ventrue não cumprimenta um Brujah; ele avalia.

### 4.2 Relações que não são de clã

- **Senhor e cria.** A dívida é permanente e assimétrica. O senhor cobra quando quer, e
  o pedido nunca vem como pedido.
- **Vínculo de Sangue.** Três goles em noites distintas e o afeto é imposto por dentro.
  Quem está vinculado sabe que está e não consegue querer diferente.
- **Círculo (coterie).** Interesse comum, não amizade. Aguenta enquanto o interesse
  aguentar.
- **Matilha do Sabá.** O oposto: o Vinculum torna o afeto químico e coletivo, e sair não
  é uma opção que se cogita.
- **Pilares.** Os mortais que sustentam a Humanidade do personagem. São a coisa mais
  frágil da ficha e a mais fácil de o inimigo alcançar.
- **Carniçais.** Leais porque bebem. A lealdade tem prazo, e o prazo pressiona.

---

## 5. As leis que existem para serem quebradas

As Tradições na leitura das noites atuais. A Camarilla as trata como código penal; os
Anarquistas, como boas práticas; o Sabá, só a primeira.

| Tradição | O que significa na prática |
|---|---|
| **Máscara** | Nenhum mortal pode saber. Vale para vídeo, backup, boletim de ocorrência. |
| **Domínio** | Território é de alguém. Caçar sem permissão é invasão. |
| **Progênie** | Não se Abraça sem licença do Príncipe. |
| **Responsabilidade** | O senhor responde pela cria até a apresentação. |
| **Hospitalidade** | Chegou na cidade, apresenta-se ao Príncipe. |
| **Destruição** | Só o Príncipe manda destruir um Membro. |

**O que quebra a Máscara hoje:** câmera de segurança, celular de testemunha, exame
toxicológico, ficha hospitalar, geolocalização de foto, gravação de porteiro eletrônico,
placa lida por sistema, boletim de desaparecido que forma padrão. Sangue no chão importa
menos que metadado.

**Consequência escalonada** — o Narrador sobe esta escada e nunca pula degrau:

1. Alguém percebeu e ficou quieto.
2. Alguém percebeu e contou para uma pessoa.
3. Existe registro em algum lugar.
4. Uma instituição mortal abriu procedimento.
5. A corte soube antes de você poder resolver.
6. A Segunda Inquisição cruzou os dados.

---

## 6. A Segunda Inquisição

Não é a Igreja. São **agências de Estado** com orçamento, mandato e SIGINT: interceptação
de sinal, análise de metadado, correlação de câmeras, OSINT em rede aberta. Não acreditam
em vampiro. Acreditam em anomalia estatística, e caçam anomalia.

Como conduzir:

- Ameaça **procedimental**, não sobrenatural. Não aparece rosnando; aparece como o mesmo
  carro na mesma rua, duas noites seguidas.
- Servidor comprometido vale tanto quanto ataque físico. Narre com a mesma intensidade.
- Não é onisciente. Erra recorte, queima alvo errado, atropela inocente. O erro dela é
  oportunidade de cena.
- **No Brasil** o rosto disso é o **BOES**, formado a partir do Batalhão de Missões
  Especiais de Vitória. Executou o ataque de 2017 e se reorganiza no Sudeste, com foco
  no Rio.

Contramedidas dos personagens, todas com custo: apagar gravação, comprar policial,
trocar identidade (Mérito Máscara), destruir aparelho, usar mortal como intermediário —
e escolher vítima que ninguém vai procurar, que é escolha moral, não técnica.

---

## 7. Outros habitantes da noite

Existem. Aparecem pouco. Quando aparecem, a cena muda de gênero.

| Quem | Postura | Regra de uso |
|---|---|---|
| **Lupinos / Garou** | Territoriais, militarizados, sem diplomacia | Não são encontro, são desastre natural. Fugir é a resposta certa. |
| **Magos** | Reescrevem a regra local da realidade | Raríssimos. Se aparecem, aparecem como consequência, nunca como NPC recorrente. |
| **Fantasmas / eguns** | Presos a lugar, objeto ou dívida | Domínio Hecata e de Oblívio. Ótimos para investigação. |
| **Caçadores mortais** | Fanáticos amadores, fora da Segunda Inquisição | Perigosos por serem imprevisíveis, não por serem fortes. |
| **Corpos-Secos / Unhudos** | Legado dos Afogados, nas bordas do Rio e da Amazônia | Não distinguem mortal de Membro. Servem de fronteira do mapa. |

Regra de contenção: **o Narrador não introduz outro sobrenatural por conta própria.** Só
entra se a campanha compilada declarar. Vampiro é sobre vampiros.

---

## 8. O Brasil das Trevas

As doze cidades vivem em `data-brasil.js`, com texto completo, ganchos e ressonância. O
resumo abaixo basta para improvisar; o texto longo entra quando a cena está na cidade.

| Cidade | Poder | Tensão de fundo | Ressonância |
|---|---|---|---|
| **Rio** (`rio`) | Camarilla e restos do Sabá em trégua; Príncipe Inés Tristão (Tremere) | O código Carnaval permite tudo, inclusive matar rival sem punição | sanguíneo |
| **São Paulo** (`sp`) | Camarilla retomando o vácuo do êxodo do Sabá | Metrópole sem dono e uma cripta que ninguém desativou | colérico |
| **Brasília** (`brasilia`) | Camarilla acima do solo, Nosferatu abaixo | A fortaleza foi erguida contra algo que ninguém nomeia | fleumático |
| **Manaus** (`manaus`) | Disputada; bandos do Sabá na floresta | A mata é dos Garou, e eles resolvem por eliminação | animal |
| **Vitória** (`vitoria`) | Ruína; Segunda Inquisição operando aberto | Sobreviventes que não usam telefone nem pisam em Elísio | melancólico |
| **Natal** (`natal`) | Camarilla dura, herança de uma ex-Justicar | Anarquistas com memória longa e arquivos guardados | colérico |
| **Recife** (`recife`) | Camarilla nominal, infernalismo enraizado | Grimórios escondidos em igrejas; Francisca passou por aqui | melancólico |
| **Salvador** (`salvador`) | Aberta, sem cânone | Fé genuína que não se curva a Membro nenhum | sanguíneo |
| **Santos** (`santos`) | Aberta; corredor portuário | Tudo entra e sai por contêiner, inclusive quem foge | fleumático |
| **Curitiba** (`curitiba`) | Camarilla de manual | A Máscara nunca precisou de violência porque ninguém olha | fleumático |
| **Porto Alegre** (`porto_alegre`) | Aberta; corredor com o Prata | Terreno fértil para Baronia; Tzimisce no interior | colérico |
| **Belo Horizonte** (`bh`) | Aberta; sugestão de corte clerical | Igrejas barrocas, minas desativadas e silêncio como arma | melancólico |

**Ameaças de escala nacional** (detalhe em `data-brasil.js`): BOES · Unhudos · Gorgo, a
Nictuku de Brasília · Francisca Santos dos Rodriguez, Anátema da Lista Vermelha ·
Gratiano de Veronese, Matusalém e Arcebispo do Rio · Garou da Bacia Amazônica.

### 8.1 Textura brasileira — o que faz a cena soar daqui

Não é sotaque. É infraestrutura e convívio.

- Calor, umidade, cheiro. Cidade que não esfria à noite.
- Desigualdade dentro do mesmo quarteirão: condomínio e ocupação dividindo muro.
- Religiosidade viva e plural — católica, evangélica, de matriz africana. Não é cenário
  decorativo, e às vezes é a única coisa que resiste a um Membro.
- Instituições que funcionam por exceção: quem conhece alguém, resolve.
- Violência cotidiana banalizada, o que **ajuda** a Máscara e envilece o personagem.
- Vocabulário: boteco, laje, terreiro, praça, viaduto, PM, moto de aplicativo, madrugada
  de quinta. Nunca "beco esfumaçado".

---

## 9. Contrato de coerência para a IA

Regras duras da camada narrativa. O validador da **Parte B** do README §8.3 cobre as que dão
para verificar por máquina; as de estilo vivem em `narracao-ia.md`.

**Nunca:**

1. Produzir número de regra — piscina, dificuldade, sucessos, dano, Fome. Quem rola é o
   motor.
2. Criar entidade sem declará-la na saída estruturada, com id.
3. Contradizer fato já revelado no registro da sessão.
4. Fazer um ancião aparecer, ceder ou se explicar sem que a campanha mande.
5. Introduzir outro sobrenatural fora do que a campanha declara.
6. Resolver quebra de Máscara de graça.
7. Curar, redimir ou absolver o personagem por conta própria.

**Sempre:**

1. Filtrar a descrição pela Fome quando a Fome estiver alta.
2. Dar preço a toda ajuda de NPC.
3. Fazer o relógio andar. O amanhecer é pressão constante.
4. Deixar rastro: onde houve violência, ficou registro.
5. Consultar a matriz de atrito da §4.1 antes de escolher o tom de um NPC.
6. Usar a terminologia da edição brasileira: Membro, Máscara, Fome, Vitalidade, Mácula,
   Pilar, Provocação, Ladroagem, Sagacidade, Subterfúgio, Ciência, Erudição, Percepção,
   Potência de Sangue, Ressonância, Elísio, Refúgio.

**Escala de improviso permitido** — do mais livre ao proibido:

| Nível | O que a IA pode inventar |
|---|---|
| Livre | Detalhe sensorial, figurante sem nome, clima, ruído, reação de multidão |
| Com declaração | NPC nomeado, local novo, fato novo, fio novo — todos com id na saída |
| Só com gatilho da campanha | Revelação de trama, morte de NPC declarado, troca de capítulo |
| Nunca | Regra, número, entidade canônica agindo fora do roteiro, resolução de Máscara |

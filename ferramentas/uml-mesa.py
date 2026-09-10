# -*- coding: utf-8 -*-
"""
VITÆ — Casos de Uso da Mesa
Gera docs/uml-casos-de-uso-mesa.pdf

Notação UML de caso de uso: ator (boneco), caso (elipse), fronteira do
sistema (retângulo), associação (linha), «include» e «extend» (seta
tracejada). Nada aqui é invenção: cada caso aponta para o arquivo e a
função que o realizam, e a tabela de rastreabilidade fecha a conta.
"""
import math
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas

W, H = landscape(A4)          # 842 x 595 pt

TINTA    = HexColor('#1c1b22')
SUAVE    = HexColor('#5b5a66')
CLARO    = HexColor('#9a99a4')
RUBRO    = HexColor('#8c1c20')
OURO     = HexColor('#8a6d24')
LINHA    = HexColor('#c9c7cf')
FUNDO_UC = HexColor('#f4f2ee')
FUNDO_IN = HexColor('#eef1f6')

SAIDA = 'docs/uml-casos-de-uso-mesa.pdf'

c = canvas.Canvas(SAIDA, pagesize=(W, H))
c.setTitle('VITÆ — Casos de Uso da Mesa')
c.setAuthor('VITÆ')
c.setSubject('Documentação UML de casos de uso da Mesa')

_pagina = [0]


# ----------------------------------------------------------------- utilidades

def rodape(secao=''):
    _pagina[0] += 1
    if _pagina[0] == 1:
        return
    c.setFont('Helvetica', 7.5)
    c.setFillColor(CLARO)
    c.drawString(18 * mm, 11 * mm, 'VITÆ · Casos de Uso da Mesa')
    if secao:
        c.drawCentredString(W / 2, 11 * mm, secao)
    c.drawRightString(W - 18 * mm, 11 * mm, str(_pagina[0]))
    c.setStrokeColor(LINHA)
    c.setLineWidth(0.4)
    c.line(18 * mm, 14 * mm, W - 18 * mm, 14 * mm)


def pagina(secao=''):
    rodape(secao)
    c.showPage()


def titulo_pagina(num, texto, sub=''):
    c.setFillColor(RUBRO)
    c.setFont('Helvetica-Bold', 8)
    c.drawString(18 * mm, H - 20 * mm, num.upper())
    c.setFillColor(TINTA)
    c.setFont('Helvetica-Bold', 15)
    c.drawString(18 * mm, H - 27 * mm, texto)
    if sub:
        c.setFillColor(SUAVE)
        c.setFont('Helvetica-Oblique', 9)
        c.drawString(18 * mm, H - 33 * mm, sub)


def quebrar(texto, fonte, tam, largura):
    palavras = texto.split()
    linhas, atual = [], ''
    for p in palavras:
        teste = (atual + ' ' + p).strip()
        if c.stringWidth(teste, fonte, tam) <= largura:
            atual = teste
        else:
            if atual:
                linhas.append(atual)
            atual = p
    if atual:
        linhas.append(atual)
    return linhas


def paragrafo(x, y, texto, largura, tam=9, fonte='Helvetica', cor=TINTA, lh=None):
    lh = lh or tam * 1.45
    c.setFont(fonte, tam)
    c.setFillColor(cor)
    for i, ln in enumerate(quebrar(texto, fonte, tam, largura)):
        c.drawString(x, y - i * lh, ln)
    return y - len(quebrar(texto, fonte, tam, largura)) * lh


# ------------------------------------------------------------------- desenhos

def ator(x, y, nome, papel=''):
    """Boneco UML. (x, y) é o pé; devolve o ponto de conexão do tronco."""
    c.setStrokeColor(TINTA)
    c.setFillColor(TINTA)
    c.setLineWidth(1.1)
    cabeca_r = 4.2
    cy = y + 34
    c.circle(x, cy, cabeca_r, stroke=1, fill=0)
    c.line(x, cy - cabeca_r, x, cy - 17)          # tronco
    c.line(x - 8, cy - 8, x + 8, cy - 8)          # braços
    c.line(x, cy - 17, x - 7, cy - 28)            # pernas
    c.line(x, cy - 17, x + 7, cy - 28)
    c.setFont('Helvetica-Bold', 7.6)
    c.setFillColor(TINTA)
    for i, ln in enumerate(quebrar(nome, 'Helvetica-Bold', 7.6, 78)):
        c.drawCentredString(x, y - 6 - i * 9, ln)
    if papel:
        c.setFont('Helvetica-Oblique', 6.6)
        c.setFillColor(CLARO)
        base = y - 6 - len(quebrar(nome, 'Helvetica-Bold', 7.6, 78)) * 9
        for i, ln in enumerate(quebrar(papel, 'Helvetica-Oblique', 6.6, 84)):
            c.drawCentredString(x, base - i * 7.6, ln)
    return (x, cy - 12)


def caso(cx, cy, rotulo, rw=62, rh=21, destaque=False, ident=''):
    """Elipse de caso de uso.

    A elipse CRESCE para caber o texto. A primeira versão usava altura
    fixa e o rótulo de duas linhas vazava por cima do identificador —
    "Ler a intenção do" perdia o "texto". Medir antes de desenhar é a
    única forma de o desenho não mentir sobre o que cabe.
    """
    linhas = quebrar(rotulo, 'Helvetica', 7.8, rw * 1.55)
    preciso = len(linhas) * 9.4 / 2 + (7 if ident else 0) + 7
    rh = max(rh, preciso)
    c.setLineWidth(1.0)
    c.setStrokeColor(RUBRO if destaque else SUAVE)
    c.setFillColor(FUNDO_UC if destaque else white)
    c.ellipse(cx - rw, cy - rh, cx + rw, cy + rh, stroke=1, fill=1)
    c.setFont('Helvetica', 7.8)
    c.setFillColor(TINTA)
    desloca = 3.5 if ident else 0
    topo = cy + (len(linhas) - 1) * 4.7 + desloca
    for i, ln in enumerate(linhas):
        c.drawCentredString(cx, topo - i * 9.4 - 2.6, ln)
    if ident:
        c.setFont('Helvetica-Bold', 5.8)
        c.setFillColor(RUBRO if destaque else CLARO)
        c.drawCentredString(cx, topo - len(linhas) * 9.4 - 1, ident)
    return (cx, cy, rw, rh)


def borda_elipse(e, alvo):
    """Ponto na borda da elipse na direção de `alvo`."""
    cx, cy, rw, rh = e
    dx, dy = alvo[0] - cx, alvo[1] - cy
    if dx == 0 and dy == 0:
        return (cx, cy)
    t = math.atan2(dy * rw, dx * rh)
    return (cx + rw * math.cos(t), cy + rh * math.sin(t))


def assoc(p, e):
    """Associação ator–caso: linha simples."""
    q = borda_elipse(e, p)
    c.setStrokeColor(SUAVE)
    c.setLineWidth(0.9)
    c.setDash()
    c.line(p[0], p[1], q[0], q[1])


def ponta(x1, y1, x2, y2, tam=6.0, aberta=True):
    ang = math.atan2(y2 - y1, x2 - x1)
    for s in (+1, -1):
        a = ang + math.pi + s * 0.42
        c.line(x2, y2, x2 + tam * math.cos(a), y2 + tam * math.sin(a))


def dependencia(de, para, estereotipo, desloca=(0, 0), via=None):
    """Seta tracejada com «include» / «extend».

    `via` é um ponto de desvio em pt. Reta que atravessa outro caso é
    erro de leitura, não de estética: numa primeira versão a seta de
    UC-06 para UC-01 cortava UC-02 ao meio e o rótulo «extend» caía
    sobre o texto dele.
    """
    if via is None:
        p = borda_elipse(de, (para[0], para[1]))
        q = borda_elipse(para, (de[0], de[1]))
        pontos = [p, q]
    else:
        p = borda_elipse(de, via)
        q = borda_elipse(para, via)
        pontos = [p, via, q]

    c.setStrokeColor(OURO if estereotipo == 'extend' else SUAVE)
    c.setLineWidth(0.9)
    c.setDash(3, 2)
    for i in range(len(pontos) - 1):
        c.line(pontos[i][0], pontos[i][1], pontos[i + 1][0], pontos[i + 1][1])
    c.setDash()
    a, b = pontos[-2], pontos[-1]
    ponta(a[0], a[1], b[0], b[1])

    if via is None:
        mx, my = (p[0] + q[0]) / 2, (p[1] + q[1]) / 2
    else:
        mx, my = via
    mx += desloca[0]
    my += desloca[1]
    txt = '«include»' if estereotipo == 'include' else '«extend»'
    c.setFont('Helvetica-Oblique', 6.6)
    largura = c.stringWidth(txt, 'Helvetica-Oblique', 6.6)
    c.setFillColor(white)
    c.rect(mx - largura / 2 - 1.5, my - 2.6, largura + 3, 8.4, stroke=0, fill=1)
    c.setFillColor(OURO if estereotipo == 'extend' else SUAVE)
    c.drawCentredString(mx, my, txt)


def fronteira(x, y, w, h, nome):
    c.setStrokeColor(CLARO)
    c.setLineWidth(1.0)
    c.setDash()
    c.roundRect(x, y, w, h, 6, stroke=1, fill=0)
    c.setFont('Helvetica-Bold', 8.6)
    c.setFillColor(SUAVE)
    c.drawCentredString(x + w / 2, y + h - 13, nome)


def legenda(x, y):
    c.setFont('Helvetica-Bold', 6.8)
    c.setFillColor(CLARO)
    c.drawString(x, y, 'LEGENDA')
    c.setFont('Helvetica', 6.8)
    c.setFillColor(SUAVE)
    itens = [
        ('linha cheia', 'associação ator – caso de uso'),
        ('«include»', 'o caso base SEMPRE executa o incluído'),
        ('«extend»', 'o caso estendido acontece SÓ em certas condições'),
        ('elipse cheia', 'caso de uso central desta visão'),
    ]
    for i, (a, b) in enumerate(itens):
        c.setFont('Helvetica-Bold', 6.8)
        c.setFillColor(TINTA)
        c.drawString(x, y - 10 - i * 9, a)
        c.setFont('Helvetica', 6.8)
        c.setFillColor(SUAVE)
        c.drawString(x + 52, y - 10 - i * 9, '— ' + b)


def tabela(x, y, colunas, linhas, larguras, tam=7.4, alt=13):
    c.setFont('Helvetica-Bold', 7.0)
    c.setFillColor(RUBRO)
    cx = x
    for i, col in enumerate(colunas):
        c.drawString(cx, y, col.upper())
        cx += larguras[i]
    c.setStrokeColor(LINHA)
    c.setLineWidth(0.5)
    c.line(x, y - 4, x + sum(larguras), y - 4)
    yy = y - 4
    for ln in linhas:
        alturas = []
        cx = x
        for i, cel in enumerate(ln):
            fonte = 'Helvetica-Bold' if i == 0 else 'Helvetica'
            partes = quebrar(str(cel), fonte, tam, larguras[i] - 8)
            alturas.append(len(partes))
        altura = max(alturas) * (tam * 1.35) + 5
        cx = x
        for i, cel in enumerate(ln):
            fonte = 'Helvetica-Bold' if i == 0 else 'Helvetica'
            c.setFont(fonte, tam)
            c.setFillColor(TINTA if i == 0 else SUAVE)
            for j, p in enumerate(quebrar(str(cel), fonte, tam, larguras[i] - 8)):
                c.drawString(cx, yy - 11 - j * (tam * 1.35), p)
            cx += larguras[i]
        yy -= altura
        c.setStrokeColor(LINHA)
        c.line(x, yy - 2, x + sum(larguras), yy - 2)
    return yy


# =============================================================== 1. CAPA

c.setFillColor(TINTA)
c.rect(0, 0, W, H, stroke=0, fill=1)
c.setFillColor(HexColor('#b6913f'))
c.setFont('Helvetica-Bold', 40)
c.drawString(28 * mm, H - 62 * mm, 'VITÆ')
c.setFillColor(white)
c.setFont('Helvetica-Bold', 21)
c.drawString(28 * mm, H - 76 * mm, 'Casos de Uso da Mesa')
c.setFillColor(HexColor('#b9ad9e'))
c.setFont('Helvetica', 11)
c.drawString(28 * mm, H - 86 * mm, 'Documentação UML — diagramas de caso de uso')
c.setStrokeColor(HexColor('#8c1c20'))
c.setLineWidth(2)
c.line(28 * mm, H - 92 * mm, 120 * mm, H - 92 * mm)

c.setFillColor(HexColor('#9a99a4'))
c.setFont('Helvetica', 8.6)
linhas_capa = [
    'A Mesa é a metade do VITÆ onde se JOGA — a outra é o Criador de fichas.',
    'Este documento cobre só a Mesa: o que o jogador pode fazer nela, quem',
    'a Mesa aciona para conseguir cada coisa, e onde cada caso está no código.',
]
for i, ln in enumerate(linhas_capa):
    c.drawString(28 * mm, H - 106 * mm - i * 13, ln)

c.setFont('Helvetica', 7.6)
c.setFillColor(HexColor('#6b6070'))
c.drawString(28 * mm, 30 * mm, 'Vampiro: A Máscara 5ª Edição · mesa solo narrada')
c.drawString(28 * mm, 24 * mm, 'Levantado a partir do código: ACOES_MESA (98 ações), ABAS_DOCA (12 abas) e a Escada de Degraus')
c.drawRightString(W - 28 * mm, 24 * mm, 'setembro de 2026')
pagina()


# ================================================= 2. ESCOPO E ATORES

titulo_pagina('§1', 'Escopo e atores',
              'O que está dentro da fronteira, e quem conversa com ela')

y = H - 46 * mm
y = paragrafo(18 * mm, y,
    'A fronteira deste documento é A MESA: a tela onde a noite é jogada. Fica de fora o Criador de fichas, '
    'que tem casos próprios, e ficam de fora as regras — elas moram no Árbitro, que aqui aparece como ATOR '
    'DE APOIO, e não como parte da Mesa.', 300 * mm, 9)

y -= 10
y = paragrafo(18 * mm, y,
    'A distinção importa para ler os diagramas: a Mesa não decide regra e não rola dado por conta própria. '
    'Ela ORQUESTRA — pergunta ao Árbitro o que é possível, rola o que ele mandou rolar, e pede ao Cronista '
    'que conte o que aconteceu.', 300 * mm, 9)

y -= 14
c.setFont('Helvetica-Bold', 9)
c.setFillColor(TINTA)
c.drawString(18 * mm, y, 'Os atores')
y -= 8

tabela(18 * mm, y,
       ['Ator', 'Tipo', 'O que ele faz nesta fronteira'],
       [
        ['Jogador', 'Primário · humano',
         'O único ator primário. Escreve o turno, escolhe a rota do teste, gasta Vontade, conduz o combate e declara os limites da mesa. Toda sessão começa nele.'],
        ['Árbitro', 'Apoio · sistema (Módulo 4)',
         'Diz se a ação é possível, qual a parada de dados e a dificuldade, e APURA o que foi rolado. Não tem fonte de acaso: quem rola é a Mesa.'],
        ['Cronista', 'Apoio · sistema (Módulo 5)',
         'Narra. É alcançado pela Escada de Degraus, e só o último degrau custa modelo de linguagem.'],
        ['MesaServer', 'Apoio · sistema (Módulo 3)',
         'Guarda a sessão em disco, roda a rolagem da mesa (§82), mantém o canal em tempo real e faz o autosave.'],
        ['FichaServer', 'Apoio · sistema (Módulo 2)',
         'Biblioteca de fichas. A Mesa faz checkout ao começar e checkin ao encerrar.'],
        ['Diretor de campanha', 'Apoio · sistema',
         'Serve texto pronto do capítulo quando o turno cai numa opção prevista. É o degrau 1 da Escada.'],
        ['Modelo local', 'Apoio · externo (ollama)',
         'Interpreta a intenção do texto e escreve a narração. Sem ele a Mesa continua jogando — em modo determinístico.'],
       ],
       [30 * mm, 42 * mm, 190 * mm])

c.setFont('Helvetica-Oblique', 7.6)
c.setFillColor(CLARO)
c.drawString(18 * mm, 22 * mm,
             'Todo ator de apoio pode estar FORA DO AR. A Mesa degrada em vez de parar — e isso aparece como fluxo alternativo nas fichas do §9.')
pagina('§1 · Escopo e atores')


# ============================================ 3. DIAGRAMA DE CONTEXTO

titulo_pagina('§2', 'Diagrama de contexto',
              'Visão geral: os oito grupos de caso de uso da Mesa')

fronteira(92 * mm, 24 * mm, 130 * mm, 120 * mm, 'A MESA')

jog = ator(46 * mm, 78 * mm, 'Jogador', 'ator primário')

grupos = [
    ('Jogar um turno',              128 * mm, 132 * mm, 'UC-01'),
    ('Conduzir o combate',          195 * mm, 132 * mm, 'UC-10'),
    ('Gerir a sessão',         128 * mm, 105 * mm, 'UC-20'),
    ('Cuidar da condição', 195 * mm, 105 * mm, 'UC-30'),
    ('Administrar o Sangue',        128 * mm, 78 * mm,  'UC-40'),
    ('Tocar projetos e XP',         195 * mm, 78 * mm,  'UC-50'),
    ('Declarar limites do jogo',    128 * mm, 51 * mm,  'UC-60'),
    ('Consultar e diagnosticar',    195 * mm, 51 * mm,  'UC-70'),
]
elipses = {}
for rot, x, y_, ident in grupos:
    elipses[ident] = caso(x, y_, rot, rw=52, rh=17, ident=ident)

for ident in elipses:
    assoc(jog, elipses[ident])

apoio = [
    ('Árbitro',       'Módulo 4', 262 * mm, 118 * mm, ['UC-01', 'UC-10', 'UC-30']),
    ('Cronista',           'Módulo 5', 262 * mm, 88 * mm,  ['UC-01', 'UC-70']),
    ('MesaServer',         'Módulo 3', 262 * mm, 58 * mm,  ['UC-20', 'UC-50']),
    ('FichaServer',        'Módulo 2', 262 * mm, 28 * mm,  ['UC-20']),
]
for nome, papel, x, y_, liga in apoio:
    p = ator(x, y_, nome, papel)
    for ident in liga:
        assoc(p, elipses[ident])

legenda(18 * mm, 46 * mm)

c.setFont('Helvetica-Oblique', 7.4)
c.setFillColor(CLARO)
c.drawString(18 * mm, 20 * mm,
             'Cada grupo abre num diagrama próprio nas páginas seguintes. Os identificadores UC-xx são os mesmos da tabela de rastreabilidade (§10).')
pagina('§2 · Contexto')


# ================================================ 4. UC-01 JOGAR UM TURNO

titulo_pagina('§3', 'UC-01 — Jogar um turno',
              'O caso central: uma caixa de texto, e tudo o que ela dispara')

fronteira(56 * mm, 40 * mm, 196 * mm, 104 * mm, 'A MESA · turno')

jog = ator(30 * mm, 86 * mm, 'Jogador')

# coluna 1: o que o jogador aciona          coluna 2: o que o turno inclui
uc_turno  = caso(96 * mm, 126 * mm, 'Enviar o turno escrito', rw=44, destaque=True, ident='UC-01')
uc_ler    = caso(176 * mm, 126 * mm, 'Ler a intenção do texto', rw=44, ident='UC-02')
uc_arb    = caso(176 * mm, 100 * mm, 'Arbitrar a ação', rw=42, ident='UC-03')
uc_esc    = caso(176 * mm,  74 * mm, 'Descer a Escada de Degraus', rw=46, ident='UC-04')
uc_narrar = caso(240 * mm,  56 * mm, 'Narrar o turno', rw=38, ident='UC-05')

uc_rolar  = caso(96 * mm,  86 * mm, 'Rolar o teste pedido', rw=42, ident='UC-06')
uc_vont   = caso(96 * mm,  54 * mm, 'Retestar com Vontade', rw=42, ident='UC-07')
uc_desf   = caso(160 * mm,  50 * mm, 'Narrar o desfecho', rw=40, ident='UC-08')

assoc(jog, uc_turno)
assoc(jog, uc_rolar)
assoc(jog, uc_vont)

# os três «include» saem de UC-01 para a coluna da direita, sem se cruzarem
dependencia(uc_turno, uc_ler, 'include')
dependencia(uc_turno, uc_arb, 'include')
dependencia(uc_turno, uc_esc, 'include', via=(136 * mm, 104 * mm))
dependencia(uc_esc, uc_narrar, 'include')

# os «extend» sobem pela coluna da esquerda: reta limpa, sem atravessar caso
dependencia(uc_rolar, uc_turno, 'extend')
dependencia(uc_vont, uc_rolar, 'extend')
dependencia(uc_desf, uc_rolar, 'extend')

arb = ator(272 * mm, 112 * mm, 'Árbitro')
cro = ator(272 * mm, 46 * mm, 'Cronista')
assoc(arb, uc_arb)
assoc(cro, uc_narrar)
assoc(cro, uc_desf)

c.setFont('Helvetica-Bold', 7.6)
c.setFillColor(TINTA)
c.drawString(18 * mm, 32 * mm, 'A ESCADA DE DEGRAUS (UC-04)')
c.setFont('Helvetica', 7.2)
c.setFillColor(SUAVE)
c.drawString(18 * mm, 26 * mm,
             '0 Árbitro barra  ›  1 Texto pronto da campanha  ›  2 Recombinação  ›  3 Narrador')
c.drawString(18 * mm, 20 * mm,
             'Desce até o primeiro degrau que atende. SÓ O ÚLTIMO custa modelo — os de cima respondem sem sair do navegador.')

legenda(206 * mm, 32 * mm)
pagina('§3 · UC-01 Jogar um turno')


# ==================================================== 5. UC-10 COMBATE

titulo_pagina('§4', 'UC-10 — Conduzir o combate',
              'A rodada, e o que ela permite dentro de si')

fronteira(58 * mm, 24 * mm, 196 * mm, 120 * mm, 'A MESA · combate')

jog = ator(30 * mm, 80 * mm, 'Jogador')

uc_rod  = caso(102 * mm, 118 * mm, 'Abrir a rodada', rw=40, rh=15, destaque=True, ident='UC-10')
uc_ini  = caso(178 * mm, 118 * mm, 'Ordenar a iniciativa', rw=42, rh=15, ident='UC-11')
uc_atk  = caso(102 * mm,  86 * mm, 'Atacar', rw=36, rh=14, ident='UC-12')
uc_def  = caso(178 * mm,  86 * mm, 'Revidar ou defender', rw=42, rh=15, ident='UC-13')
uc_opc  = caso(102 * mm,  56 * mm, 'Escolher opções de combate', rw=44, rh=16, ident='UC-14')
uc_agr  = caso(178 * mm,  56 * mm, 'Agarrar o oponente', rw=40, rh=14, ident='UC-15')
uc_soc  = caso(240 * mm,  86 * mm, 'Travar duelo social', rw=38, rh=14, ident='UC-16')
uc_fug  = caso(240 * mm,  56 * mm, 'Fugir do combate', rw=36, rh=13, ident='UC-17')
uc_fim  = caso(140 * mm,  32 * mm, 'Encerrar a rodada', rw=40, rh=13, ident='UC-18')

for u in (uc_rod, uc_atk, uc_opc, uc_soc, uc_fug, uc_fim):
    assoc(jog, u)

dependencia(uc_rod, uc_ini, 'include')
dependencia(uc_atk, uc_def, 'include')
dependencia(uc_agr, uc_atk, 'extend')
dependencia(uc_opc, uc_atk, 'extend')

arb = ator(276 * mm, 116 * mm, 'Árbitro', 'motor-combate')
assoc(arb, uc_atk)
assoc(arb, uc_ini)

c.setFont('Helvetica', 7.2)
c.setFillColor(SUAVE)
c.drawString(18 * mm, 20 * mm, 'A regra do combate mora em motor-combate.js e motor-combate-avancado.js. A Mesa conduz a rodada — quem resolve o golpe é o Árbitro.')
c.drawString(18 * mm, 16.5 * mm, 'A condução vive em mesa-combate.js, separada de mesa.js desde a §100.')
pagina('§4 · UC-10 Combate')


# ===================================== 6. UC-20 SESSÃO / UC-30 CONDIÇÃO

titulo_pagina('§5', 'UC-20 — Gerir a sessão  ·  UC-30 — Cuidar da condição',
              'Começar, guardar e devolver a noite; e o que acontece ao corpo e à alma')

fronteira(52 * mm, 78 * mm, 132 * mm, 62 * mm, 'A MESA · sessão')
jog1 = ator(30 * mm, 100 * mm, 'Jogador')
u_esc  = caso(88 * mm, 126 * mm, 'Escolher campanha e personagem', rw=40, rh=15, ident='UC-20')
u_com  = caso(154 * mm, 126 * mm, 'Começar a noite', rw=36, rh=13, destaque=True, ident='UC-21')
u_cont = caso(88 * mm, 105 * mm, 'Continuar sessão salva', rw=38, rh=14, ident='UC-22')
u_chk  = caso(154 * mm, 105 * mm, 'Devolver a ficha (checkin)', rw=38, rh=14, ident='UC-23')
u_imp  = caso(88 * mm, 86 * mm, 'Importar ficha', rw=34, rh=12, ident='UC-24')
u_apg  = caso(154 * mm, 86 * mm, 'Apagar sessão', rw=34, rh=12, ident='UC-25')
for u in (u_esc, u_com, u_cont, u_chk, u_imp, u_apg):
    assoc(jog1, u)
dependencia(u_com, u_esc, 'include', desloca=(0, 6))

ms = ator(206 * mm, 122 * mm, 'MesaServer')
fs = ator(206 * mm, 80 * mm, 'FichaServer')
assoc(ms, u_com)
assoc(ms, u_cont)
assoc(fs, u_chk)
assoc(fs, u_imp)

fronteira(52 * mm, 20 * mm, 132 * mm, 48 * mm, 'A MESA · condição')
jog2 = ator(30 * mm, 36 * mm, 'Jogador')
u_dan = caso(88 * mm, 56 * mm, 'Sofrer e curar dano', rw=36 , rh=13, ident='UC-30')
u_ali = caso(154 * mm, 56 * mm, 'Alimentar-se', rw=32, rh=12, ident='UC-31')
u_fre = caso(88 * mm, 33 * mm, 'Resistir ao frenesi', rw=36, rh=13, ident='UC-32')
u_rem = caso(154 * mm, 33 * mm, 'Testar Remorso e Mácula', rw=38, rh=14, ident='UC-33')
for u in (u_dan, u_ali, u_fre, u_rem):
    assoc(jog2, u)

arb = ator(206 * mm, 33 * mm, 'Árbitro', 'motor-estado')
assoc(arb, u_fre)
assoc(arb, u_rem)

c.setFont('Helvetica-Oblique', 7.2)
c.setFillColor(CLARO)
c.drawString(230 * mm, 30 * mm, 'Perder um Pilar é armado em')
c.drawString(230 * mm, 24 * mm, 'dois cliques: a confirmação vive')
c.drawString(230 * mm, 18 * mm, 'na interface, nunca num confirm().')
pagina('§5 · UC-20 e UC-30')


# ================================= 7. UC-40 SANGUE / UC-50 PROJETOS+XP

titulo_pagina('§6', 'UC-40 — Administrar o Sangue  ·  UC-50 — Projetos e Experiência',
              'Os laços que prendem, e o tempo longo que corre por fora da cena')

fronteira(52 * mm, 78 * mm, 132 * mm, 62 * mm, 'A MESA · sangue')
jog1 = ator(30 * mm, 100 * mm, 'Jogador')
s1 = caso(88 * mm, 126 * mm, 'Beber do reinante', rw=36, rh=13, ident='UC-40')
s2 = caso(154 * mm, 126 * mm, 'Resistir ou partir o Laço', rw=38, rh=14, ident='UC-41')
s3 = caso(88 * mm, 105 * mm, 'Cometer Diablerie', rw=36, rh=13, destaque=True, ident='UC-42')
s4 = caso(154 * mm, 105 * mm, 'Celebrar Ritae', rw=34, rh=12, ident='UC-43')
s5 = caso(121 * mm, 86 * mm, 'Fazer a Vaulderie', rw=36, rh=12, ident='UC-44')
for u in (s1, s2, s3, s4, s5):
    assoc(jog1, u)
dependencia(s3, s2, 'extend', desloca=(4, 0))

fronteira(52 * mm, 20 * mm, 132 * mm, 48 * mm, 'A MESA · tempo longo')
jog2 = ator(30 * mm, 36 * mm, 'Jogador')
p1 = caso(88 * mm, 56 * mm, 'Criar e lançar projeto', rw=36, rh=13, ident='UC-50')
p2 = caso(154 * mm, 56 * mm, 'Passar incremento', rw=36, rh=13, ident='UC-51')
p3 = caso(88 * mm, 33 * mm, 'Encerrar projeto', rw=34, rh=12, ident='UC-52')
p4 = caso(154 * mm, 33 * mm, 'Comprar com experiência', rw=38, rh=13, ident='UC-53')
for u in (p1, p2, p3, p4):
    assoc(jog2, u)
dependencia(p3, p2, 'extend')

arb = ator(206 * mm, 108 * mm, 'Árbitro', 'motor-lacos')
assoc(arb, s2)
assoc(arb, s3)
arb2 = ator(206 * mm, 36 * mm, 'Árbitro', 'motor-projetos · motor-experiencia')
assoc(arb2, p1)
assoc(arb2, p4)

c.setFont('Helvetica-Oblique', 7.2)
c.setFillColor(CLARO)
c.drawString(240 * mm, 128 * mm, 'A Diablerie é o único caso da')
c.drawString(240 * mm, 122 * mm, 'Mesa que baixa a Humanidade')
c.drawString(240 * mm, 116 * mm, 'por decisão explícita do jogador.')
pagina('§6 · UC-40 e UC-50')


# ============================ 8. UC-60 LIMITES / UC-70 CONSULTA

titulo_pagina('§7', 'UC-60 — Declarar limites do jogo  ·  UC-70 — Consultar e diagnosticar',
              'O Apêndice III na tela, e as doze abas da doca')

fronteira(52 * mm, 78 * mm, 132 * mm, 62 * mm, 'A MESA · jogo ponderado')
jog1 = ator(30 * mm, 100 * mm, 'Jogador')
l1 = caso(88 * mm, 126 * mm, 'Declarar Linhas e Véus', rw=38, rh=14, ident='UC-60')
l2 = caso(154 * mm, 126 * mm, 'Acionar a Carta X', rw=34, rh=13, destaque=True, ident='UC-61')
l3 = caso(88 * mm, 105 * mm, 'Pedir desvanecer (fade)', rw=38, rh=13, ident='UC-62')
l4 = caso(154 * mm, 105 * mm, 'Declarar retirada', rw=34, rh=12, ident='UC-63')
l5 = caso(121 * mm, 86 * mm, 'Mover ou tirar um limite', rw=38, rh=12, ident='UC-64')
for u in (l1, l2, l3, l4, l5):
    assoc(jog1, u)

c.setFont('Helvetica-Oblique', 7.0)
c.setFillColor(CLARO)
c.drawString(196 * mm, 126 * mm, 'A Carta X NÃO PERGUNTA POR QUÊ.')
c.drawString(196 * mm, 120 * mm, 'O livro é explícito: "caso queiram se')
c.drawString(196 * mm, 114 * mm, 'explicar, podem fazê-lo, mas isso não')
c.drawString(196 * mm, 108 * mm, 'é necessário" (básico, pág. 422).')
c.drawString(196 * mm, 100 * mm, 'Por isso ela não tem confirmação:')
c.drawString(196 * mm, 94 * mm, 'o botão faz na hora.')

fronteira(52 * mm, 20 * mm, 132 * mm, 48 * mm, 'A MESA · doca')
jog2 = ator(30 * mm, 36 * mm, 'Jogador')
d1 = caso(88 * mm, 56 * mm, 'Consultar a doca', rw=36, rh=13, ident='UC-70')
d2 = caso(154 * mm, 56 * mm, 'Fechar capítulo ou crônica', rw=38, rh=14, ident='UC-71')
d3 = caso(88 * mm, 33 * mm, 'Ver o tráfego (Debug)', rw=36, rh=13, ident='UC-72')
d4 = caso(154 * mm, 33 * mm, 'Copiar o registro', rw=34, rh=12, ident='UC-73')
for u in (d1, d2, d3, d4):
    assoc(jog2, u)
dependencia(d4, d3, 'extend')

cro = ator(206 * mm, 48 * mm, 'Cronista')
assoc(cro, d2)

c.setFont('Helvetica', 7.0)
c.setFillColor(SUAVE)
c.drawString(196 * mm, 40 * mm, 'As doze abas: ficha · estado · bolsa · locais · pessoas · história')
c.drawString(196 * mm, 34 * mm, 'projetos · experiência · sangue · limites · registro · debug')
pagina('§7 · UC-60 e UC-70')


# ================================================ 9. FICHAS DE CASO DE USO

titulo_pagina('§8', 'Ficha de caso de uso — UC-01 Jogar um turno',
              'A especificação narrativa do caso central')

y = H - 44 * mm
campos = [
    ('Identificador', 'UC-01'),
    ('Ator primário', 'Jogador'),
    ('Atores de apoio', 'Árbitro (Módulo 4), Cronista (Módulo 5), MesaServer (Módulo 3), Modelo local'),
    ('Pré-condição', 'Há uma sessão aberta com ficha jogável e uma cena em curso.'),
    ('Pós-condição', 'O fluxo ganhou a mensagem do jogador e a resposta de um degrau; a sessão foi salva.'),
    ('Gatilho', 'O jogador escreve na caixa única e envia.'),
]
for k, v in campos:
    c.setFont('Helvetica-Bold', 7.4)
    c.setFillColor(RUBRO)
    c.drawString(18 * mm, y, k.upper())
    c.setFont('Helvetica', 8.4)
    c.setFillColor(TINTA)
    fim = paragrafo(58 * mm, y, v, 220 * mm, 8.4)
    y = min(y - 13, fim - 5)

y -= 6
c.setFont('Helvetica-Bold', 8.6)
c.setFillColor(TINTA)
c.drawString(18 * mm, y, 'Fluxo principal')
y -= 11
passos = [
    'O jogador escreve o turno. A Mesa SEGMENTA o texto: o que é ação, o que é fala, para quem, e em que volume.',
    'SÓ A AÇÃO vai ao léxico — fala entre aspas não envenena a leitura.',
    'A Mesa pergunta ao Árbitro se a ação é possível e com que parada de dados («include» UC-03).',
    'A Mesa desce a Escada de Degraus («include» UC-04) e para no primeiro que atende.',
    'O degrau que atendeu responde. Só o degrau 3 — o Narrador — gasta modelo.',
    'A resposta entra no fluxo, a sessão é salva e as docas são redesenhadas.',
]
for i, p in enumerate(passos):
    c.setFont('Helvetica-Bold', 8)
    c.setFillColor(OURO)
    c.drawString(18 * mm, y, str(i + 1) + '.')
    fim = paragrafo(24 * mm, y, p, 250 * mm, 8.2)
    y = min(y - 12, fim - 4)

y -= 8
c.setFont('Helvetica-Bold', 8.6)
c.setFillColor(TINTA)
c.drawString(18 * mm, y, 'Fluxos alternativos')
y -= 10
alts = [
    ('A1 · O Árbitro barra', 'O degrau 0 atende e a ação não acontece. A Mesa diz o motivo do bloqueio. Não custa modelo.'),
    ('A2 · O Narrador pede teste', 'A narração volta com um pedido de rolagem. Estende para UC-06, e o desfecho vem no UC-08.'),
    ('A3 · O Cronista está fora do ar', 'O turno cai em modo determinístico e a Mesa registra a falha no tráfego (UC-72). A partida continua.'),
    ('A4 · A Carta X foi acionada', 'O turno é interrompido pela retirada da cena (UC-61). Não se pergunta o motivo.'),
]
for k, v in alts:
    c.setFont('Helvetica-Bold', 7.6)
    c.setFillColor(RUBRO)
    c.drawString(18 * mm, y, k)
    fim = paragrafo(70 * mm, y, v, 208 * mm, 8)
    y = min(y - 12, fim - 4)

pagina('§8 · Ficha UC-01')


# ---------------------------------------------- ficha UC-06 rolar o teste

titulo_pagina('§9', 'Ficha de caso de uso — UC-06 Rolar o teste pedido',
              'Onde a divisão de trabalho do projeto fica visível')

y = H - 44 * mm
for k, v in [
    ('Identificador', 'UC-06 (estende UC-01)'),
    ('Ator primário', 'Jogador'),
    ('Atores de apoio', 'Árbitro (pede e apura), MesaServer (rola)'),
    ('Pré-condição', 'Uma mensagem do fluxo carrega um pedido de rolagem com pelo menos uma rota.'),
    ('Pós-condição', 'O cartão de dados está no fluxo e o desfecho foi narrado (UC-08).'),
]:
    c.setFont('Helvetica-Bold', 7.4)
    c.setFillColor(RUBRO)
    c.drawString(18 * mm, y, k.upper())
    c.setFont('Helvetica', 8.4)
    c.setFillColor(TINTA)
    fim = paragrafo(58 * mm, y, v, 220 * mm, 8.4)
    y = min(y - 13, fim - 5)

y -= 8
c.setFont('Helvetica-Bold', 8.6)
c.setFillColor(TINTA)
c.drawString(18 * mm, y, 'Fluxo principal — os três passos que não podem estar no mesmo lugar')
y -= 12

trio = [
    ('PEDIR', 'Árbitro', 'Diz QUAIS dados: quantos normais, quantos de Fome, e contra que dificuldade. Não rola — o Árbitro não tem fonte de acaso, e um teste garante que ele não ganhe uma.'),
    ('RODAR', 'Mesa', 'Produz os valores. Pela porta do MesaServer quando ele está no ar; localmente quando não está.'),
    ('APURAR', 'Árbitro', 'Recebe os valores e diz o que eles significam: sucesso, falha, crítico, falha bestial. Quando o módulo também apura, as duas respostas são CONFERIDAS e a divergência é registrada.'),
]
x0 = 18 * mm
for i, (nome, quem, desc) in enumerate(trio):
    bx = x0 + i * 88 * mm
    c.setFillColor(FUNDO_IN)
    c.setStrokeColor(LINHA)
    c.setLineWidth(0.6)
    c.roundRect(bx, y - 46, 82 * mm, 46, 4, stroke=1, fill=1)
    c.setFont('Helvetica-Bold', 9)
    c.setFillColor(RUBRO)
    c.drawString(bx + 6, y - 13, nome)
    c.setFont('Helvetica-Oblique', 7)
    c.setFillColor(CLARO)
    c.drawRightString(bx + 82 * mm - 6, y - 13, quem)
    paragrafo(bx + 6, y - 24, desc, 78 * mm, 6.9, cor=SUAVE)
    if i < 2:
        c.setStrokeColor(OURO)
        c.setLineWidth(1.2)
        c.line(bx + 82 * mm + 2, y - 23, bx + 88 * mm - 2, y - 23)
        ponta(bx + 82 * mm + 2, y - 23, bx + 88 * mm - 2, y - 23, 5)

y -= 62
c.setFont('Helvetica-Bold', 8.6)
c.setFillColor(TINTA)
c.drawString(18 * mm, y, 'Fluxos alternativos')
y -= 10
for k, v in [
    ('A1 · Gastar Vontade', 'UC-07 estende este caso: rerrola os dados que falharam. DADOS DE FOME NÃO PODEM SER RERROLADOS.'),
    ('A2 · A rota cobra dificuldade extra', 'Certas rotas custam mais — o caminho eletrônico do arrombamento é uma delas, e quem cobra é o livro.'),
    ('A3 · O MesaServer está fora do ar', 'A Mesa rola localmente. O resultado é o mesmo; só a procedência muda, e ela fica registrada.'),
    ('A4 · As duas apurações divergem', 'Prevalece a local, e a divergência é CONTADA e DITA — trocar de fonte no meio esconderia o problema.'),
]:
    c.setFont('Helvetica-Bold', 7.6)
    c.setFillColor(RUBRO)
    c.drawString(18 * mm, y, k)
    fim = paragrafo(84 * mm, y, v, 194 * mm, 8)
    y = min(y - 12, fim - 4)

pagina('§9 · Ficha UC-06')


# ============================================== 10. RASTREABILIDADE

titulo_pagina('§10', 'Rastreabilidade',
              'Cada caso de uso, e onde ele está no código')

y = H - 42 * mm
y = tabela(18 * mm, y,
    ['UC', 'Caso de uso', 'Onde vive'],
    [
     ['UC-01', 'Enviar o turno escrito', 'modulos/cliente/js/mesa.js — enviarTurno()'],
     ['UC-02', 'Ler a intenção do texto', 'motor-entrada.js — segmentar() · arbitro-lexico.js — interpretar()'],
     ['UC-03', 'Arbitrar a ação', 'mesa.js — arbitrarTurno() → modulos/arbitro/motor-cadeia.js'],
     ['UC-04', 'Descer a Escada de Degraus', 'modulos/cronista/escada.js — Escada.descer()'],
     ['UC-05', 'Narrar o turno', 'modulos/cronista/escada.js — DegrauNarrador → narrador.js (adaptadores)'],
     ['UC-06', 'Rolar o teste pedido', 'mesa.js — rolarDoJogador() → rolarPelaMesa()'],
     ['UC-07', 'Retestar com Vontade', 'mesa.js — retestarComVontade()'],
     ['UC-08', 'Narrar o desfecho', 'mesa.js — narrarDesfecho()'],
     ['UC-10..18', 'Conduzir o combate', 'modulos/cliente/js/mesa-combate.js → motor-combate.js e motor-combate-avancado.js'],
     ['UC-20..25', 'Gerir a sessão', 'mesa.js · sessoes.js · ponte.js — checkout, checkin e autosave'],
     ['UC-30..33', 'Cuidar da condição', 'mesa-acoes.js → modulos/arbitro/motor-estado.js'],
     ['UC-40..44', 'Administrar o Sangue', 'mesa-acoes.js → modulos/arbitro/motor-lacos.js'],
     ['UC-50..53', 'Projetos e experiência', 'motor-projetos.js · motor-experiencia.js'],
     ['UC-60..64', 'Limites do jogo', 'comum/dados/data-limites.js → doca Limites'],
     ['UC-70..73', 'Consultar e diagnosticar', 'mesa-render.js — docas · modulos/cliente/js/trafego.js'],
    ],
    [22 * mm, 62 * mm, 178 * mm], tam=7.6)

c.setFont('Helvetica-Oblique', 7.2)
c.setFillColor(CLARO)
c.drawString(18 * mm, 24 * mm,
             'O despachante único das ações da Mesa é ACOES_MESA, em mesa-acoes.js: 98 entradas, e toda ação de tela passa por lá.')
pagina('§10 · Rastreabilidade')

c.save()
print('gerado:', SAIDA)

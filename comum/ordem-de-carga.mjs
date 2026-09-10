/* ============================================================
   VITÆ — A ordem de carga, e onde cada área mora
   ------------------------------------------------------------
   O app é script clássico de navegador: sem módulo, sem export,
   tudo em `const` no escopo léxico global. A ordem em que os
   arquivos rodam NÃO é decorativa — `const` lido antes de o
   arquivo rodar é erro de TDZ, e o app abre mudo (§36).

   Esta lista morava em `testes/carregar.mjs`, e por dois anos isso
   bastou: só o arreio precisava dela. Desde a §84 o ArbitroServer
   também precisa — ele carrega os mesmos arquivos num contexto de
   `vm` para servir o Árbitro por HTTP, e **um módulo não pode
   depender de `testes/`**.

   Então ela subiu para cá, que é onde mora o que é de todos. O
   arreio a reexporta, e quem lia dele continua lendo.

   ÁREA E PASTA NÃO SÃO A MESMA COISA desde a §79. A área é um
   conceito de projeto — quem é dono de quê, e quem pode depender
   de quem; a pasta é onde os arquivos estão. `PASTA_DA_AREA` é a
   ÚNICA tradução de uma para a outra no projeto inteiro.
   ============================================================ */

/* A ordem é a mesma do index.html, e há teste comparando as duas. */
export const AREAS = {
  data: ['data-traits', 'data-clans', 'data-disciplinas', 'data-predadores', 'data-vantagens',
         'data-brasil', 'data-sabbat', 'data-anarquistas', 'data-independentes', 'data-seitas',
         'data-mesa', 'data-recombinacao', 'data-escudo', 'data-itens', 'data-ressonancia', 'data-limites', 'data-criacao', 'data-oblivio'],
  ficha: ['ficha-vocabulario', 'motor-ficha', 'motor-matilha', 'ficha-regras', 'ficha-oficial', 'fichas'],
  arbitro: ['motor-dados', 'motor-arbitro', 'arbitro-lexico', 'arbitro-tabelas', 'motor-experiencia', 'motor-perdicoes', 'motor-oblivio', 'motor-estado', 'motor-combate', 'motor-grafo',
            'motor-especialista', 'motor-cadeia', 'motor-navegacao', 'motor-entrada', 'motor-intencao', 'motor-projetos',
            'motor-combate-avancado', 'motor-lacos'],
  cronista: ['compilador', 'diretor', 'recombinador', 'escada', 'narrador',
             'motor-cronica', 'cronista', 'legado'],
  front: ['trafego', 'ponte', 'dados-ui', 'criador-paineis', 'app', 'sessoes', 'mesa-render', 'mesa', 'mesa-combate', 'mesa-acoes']
};

export const ORDEM_DAS_AREAS = ['data', 'ficha', 'arbitro', 'cronista', 'front'];

export const PASTA_DA_AREA = {
  data:     'comum/dados',
  ficha:    'modulos/ficha',
  arbitro:  'modulos/arbitro',
  cronista: 'modulos/cronista',
  front:    'modulos/cliente/js'
};

export const caminhoDe = (area, nome) => `${PASTA_DA_AREA[area]}/${nome}.js`;

/** Um registro por arquivo: a área a que pertence e onde ele está. */
export const ARQUIVOS = Object.entries(AREAS)
  .flatMap(([area, nomes]) => nomes.map(nome => ({
    area, nome, curto: `${area}/${nome}.js`, rel: caminhoDe(area, nome)
  })));

export const ORDEM = ARQUIVOS.map(a => a.rel);

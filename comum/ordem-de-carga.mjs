/* ============================================================
   VITÆ — A ordem de carga, e onde cada área mora
   ------------------------------------------------------------
   O app é script clássico de navegador: sem módulo, sem export,
   tudo em `const` no escopo léxico global. A ordem em que os
   arquivos rodam NÃO é decorativa — `const` lido antes de o
   arquivo rodar é erro de TDZ, e o app abre mudo (§36).

   Esta lista morava em `ferramentas/testes/carregar.mjs` (então
   `testes/carregar.mjs`, antes de `testes/` mudar de pasta), e por
   dois anos isso bastou: só o arreio precisava dela. Desde a §84 o
   ArbitroServer também precisa — ele carrega os mesmos arquivos num
   contexto de `vm` para servir o Árbitro por HTTP, e **um módulo não
   pode depender de `ferramentas/testes/`**.

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
  ficha: ['ficha-vocabulario', 'motor-ficha', 'motor-matilha', 'ficha-regras', 'ficha-modelo', 'fichas'],
  arbitro: ['motor-dados', 'motor-arbitro', 'arbitro-lexico', 'arbitro-tabelas', 'motor-experiencia', 'motor-perdicoes', 'motor-oblivio', 'motor-estado', 'motor-combate', 'motor-grafo',
            'motor-especialista', 'motor-cadeia', 'motor-navegacao', 'motor-entrada', 'motor-intencao', 'motor-projetos',
            'motor-combate-avancado', 'motor-lacos'],
  cronista: ['compilador', 'diretor', 'recombinador', 'escada', 'narrador',
             'motor-cronica', 'cronista', 'legado'],
  front: ['trafego', 'ponte', 'dados-ui', 'criador-paineis',
          /* Os nove painéis do criador, cada um no seu arquivo desde a
             divisão de `criador-paineis.js` (revisão de código, sem §
             — o README registrava a decisão contrária como fechada em
             N5/N6, §16.2, e ela foi revista a pedido do usuário).
             `criador-paineis.js` continua antes na lista porque tem o
             que os nove usam (`numeroDoPasso`, `pontosHTML`,
             `campoSeita`) — mas a ordem não é exigência de carregamento,
             só de leitura: nenhum painel chama outro no topo do
             arquivo, só de dentro de função. */
          'paineis/painel-cronica', 'paineis/painel-cla', 'paineis/painel-atributos',
          'paineis/painel-habilidades', 'paineis/painel-disciplinas', 'paineis/painel-predador',
          'paineis/painel-vantagens', 'paineis/painel-alma', 'paineis/painel-ficha',
          'app'],
  /* A Mesa ganhou área própria numa revisão de código (sem número de §
     — não é uma decisão registrada no README): `mesa-servidor.mjs` (o
     Módulo 3, processo e porta próprios) já morava em `modulos/mesa/`
     desde a §78, mas as peças de navegador ficaram para trás em
     `modulos/cliente/js/`, contadas como Front — resto de quando o
     Módulo 3 ainda não existia (§43). Aqui elas se juntam à metade
     servidor, no mesmo padrão que Ficha, Árbitro e Cronista já seguem:
     a pasta é o módulo, não onde o código roda.

     `sessoes.js` veio junto, e não por semelhança de nome: o teste de
     fronteiras (`nenhuma área usa nome declarado por área POSTERIOR`)
     achou que ele usa `MESA_VAZIA` e `normalizarMesa`, os dois só
     existindo em `mesa.js` — persistência de sessão de MESA, nunca
     usada pelo criador de ficha. Era front pelo mesmo motivo histórico
     das outras quatro, não por ser genérico.

     A ORDEM entre os cinco é a mesma de antes (`sessoes` já vinha
     logo antes de `mesa-render` no front); só o rótulo da área mudou. */
  mesa: ['sessoes', 'mesa-render', 'mesa', 'mesa-combate', 'mesa-acoes']
};

export const ORDEM_DAS_AREAS = ['data', 'ficha', 'arbitro', 'cronista', 'front', 'mesa'];

export const PASTA_DA_AREA = {
  data:     'comum/dados',
  ficha:    'modulos/ficha',
  arbitro:  'modulos/arbitro',
  cronista: 'modulos/cronista',
  front:    'modulos/cliente/js',
  mesa:     'modulos/mesa'
};

export const caminhoDe = (area, nome) => `${PASTA_DA_AREA[area]}/${nome}.js`;

/** Um registro por arquivo: a área a que pertence e onde ele está. */
export const ARQUIVOS = Object.entries(AREAS)
  .flatMap(([area, nomes]) => nomes.map(nome => ({
    area, nome, curto: `${area}/${nome}.js`, rel: caminhoDe(area, nome)
  })));

export const ORDEM = ARQUIVOS.map(a => a.rel);

/* ============================================================
   VITÆ — As ações da mesa
   Uma responsabilidade: **o que cada clique da mesa faz**. Nada
   aqui desenha (isso é do `mesa-render.js`) e nada aqui decide
   regra (isso é do Árbitro): estas funções orquestram — chamam o
   motor, aplicam o resultado, mandam redesenhar.

   O DESPACHANTE — item N4 da §45.4

   Eram 48 `case` num `switch` só, dentro do ouvinte de clique, e o
   arquivo não parava de crescer com eles: 1.140 → 1.285 → 1.411 →
   1.503 linhas. É o mesmo problema que a §22.3 resolveu na escada
   trocando `if` encadeado por classes.

   Agora é um mapa de `ação → função`. Cada uma recebe o `data-id` do
   elemento clicado e, quando precisa, o próprio elemento. Duas coisas
   melhoram junto com o tamanho:

   - dá para TESTAR uma ação sem simular clique nenhum;
   - dá para PERGUNTAR quais ações existem, que é o que a checagem
     nova faz: todo `data-mesa` do HTML tem que ter dono aqui.
   ============================================================ */
const ACOES_MESA = {

  /* Marcador de "não faz nada". Existe para que `closest('[data-mesa]')`
     pare neste elemento em vez de subir até um pai clicável — item da
     doca que não abre nada, dentro de algo que abre.

     Ter dono explícito não é burocracia: sem ele, o despachante da §50
     escreve "Ação de mesa sem dono: nada" no console a cada clique, e
     aviso que aparece sempre é aviso que ninguém lê. */
  'nada'() {},
  'sair'(id, alvo) {
        salvarMesa(); render(); return;
  },

  'saguao'(id, alvo) {
        salvarMesa(); renderSaguao(); return;
  },

  'cronicar'(id, alvo) {
        fecharCronica(id); return;
  },

  'esquecer-legado'(id, alvo) {
        const corte = id.indexOf(':');
        const colecao = id.slice(0, corte);
        const chave = id.slice(corte + 1);
        Legado.esquecer(M.ficha, colecao, chave);
        if (colecao === 'relacoes') M.pessoas = M.pessoas.filter(p => !(p.doLegado && p.id === chave));
        if (colecao === 'fios') M.fios = M.fios.filter(f => !(f.doLegado && f.id === chave));
        anunciar([{ tipo: 'nota', texto: 'Tirado do legado. Não atravessa mais.' }]);
        salvarMesa(); renderMesa(); return;
  },

  'aplicar-legado'(id, alvo) {
        const p = Legado.aplicarProposta(M.ficha, id);
        if (!p) return;
        anunciar([{ tipo: 'nota', texto: `${
          p.classe === 'defeitos' ? 'Defeito' : p.classe === 'meritos' ? 'Mérito' : 'Antecedente'
        } ${p.nome} ${p.de} → ${p.para}, vindo do legado. ${p.porque}` }]);
        salvarMesa(); renderMesa(); return;
  },

  'recusar-legado'(id, alvo) {
        Legado.recusarProposta(M.ficha, id);
        anunciar([{ tipo: 'nota', texto: 'A conversão foi recusada. O legado continua sendo só memória.' }]);
        salvarMesa(); renderMesa(); return;
  },

  'minha-arma'(id, alvo) {
        M.combate.arma = id; salvarMesa(); renderMesa(); return;
  },

  'fugir-do-combate'(id, alvo) {
        fecharCombate('Você saiu da briga.');
        salvarMesa(); renderMesa(); return;
  },

  'pegar-item'(id, alvo) {
        const campo = $('#bolsa-nome');
        const nome = campo ? campo.value.trim() : '';
        if (!nome) { toast('Escreva o que você está pegando.'); return; }
        M.bolsa = M.bolsa || [];
        M.bolsa.push({ nome, arma: id === 'arma',
                       comoVeio: `Pego em ${M.cena.hora || 'algum momento'}`, ts: Date.now() });
        anunciar([{ tipo: 'nota', texto: `Você guarda: ${nome}.` }]);
        salvarMesa(); renderMesa(); return;
  },

  'largar-item'(id, alvo) {
        const item = (M.bolsa || [])[+id];
        if (!item) return;
        M.bolsa.splice(+id, 1);
        anunciar([{ tipo: 'nota', texto: `Você larga: ${item.nome}.` }]);
        salvarMesa(); renderMesa(); return;
  },

  'gerar-oponente'(id, alvo) {
        gerarOponente(id); return;
  },

  'remover-oponente'(id, alvo) {
        M.combate.oponentes = (M.combate.oponentes || []).filter(o => o.ref !== id);
        if (M.combate.rodada) {
          const r = Rodada.sincronizar(M.combate.rodada, combatentes());
          if (r && r.encerrada) M.combate.rodada = null;
        }
        salvarMesa(); renderMesa(); return;
  },

  'abrir-rodada'(id, alvo) {
        abrirRodada(); return;
  },

  'encerrar-rodada'(id, alvo) {
        encerrarRodada(); return;
  },

  'passar-vez'(id, alvo) {
        const rod = M.combate.rodada;
        if (!rod || !Rodada.vezDe(rod, 'voce')) {
          anunciar([{ tipo: 'nota', texto: 'Não é a sua vez.' }]);
          salvarMesa(); renderMesa(); return;
        }
        anunciar([{ tipo: 'combate', texto: 'Você deixa a vez passar.' }]);
        avancarVez();
        correrTurnosDosOponentes(); return;
  },

  'atacar'(id, alvo) {
        const corte = id.lastIndexOf(':');
        const ref = id.slice(0, corte);
        const tipo = id.slice(corte + 1);
        const o = oponentePorRef(ref);
        if (!o) return;
        const rod = M.combate.rodada;
        if (rod && !rod.encerrada && !Rodada.vezDe(rod, 'voce')) {
          const vez = Rodada.atual(rod);
          anunciar([{ tipo: 'nota',
            texto: `Ainda não é a sua vez: quem age agora é ${vez ? vez.nome : 'ninguém'}.` }]);
          salvarMesa(); renderMesa(); return;
        }
        if (Rodada.foraDeCombate({ ficha: o.ficha })) {
          anunciar([{ tipo: 'nota', texto: `${o.nome} já está fora da briga.` }]);
          salvarMesa(); renderMesa(); return;
        }
        const r = golpe({ atacante: M.ficha, defensor: o.ficha, tipo,
          arma: M.combate.arma, armadura: o.armadura,
          estadosAtacante: estadosAtuais(), estadosDefensor: o.estados, alvoVampiro: false,
          terreno: terrenoDoOponente(o) });
        if (r.destruido) anunciar([{ tipo: 'critico', texto: `${o.nome} não levanta mais.` }]);
        if (rod && !rod.encerrada && r.possivel !== false) {
          avancarVez();
          correrTurnosDosOponentes(); return;
        }
        conferirFimDoCombate();
        salvarMesa(); renderMesa(); return;
  },

  'revidar'(id, alvo) {
        const o = oponentePorRef(id);
        if (!o) return;
        if (M.combate.rodada && !M.combate.rodada.encerrada) {
          anunciar([{ tipo: 'nota',
            texto: 'Com a rodada aberta, quem revida é a ordem de iniciativa, não este botão.' }]);
          salvarMesa(); renderMesa(); return;
        }
        const escolha = Rodada.escolhaDoOponente(o, { ref: 'voce' });
        if (!escolha.possivel) {
          anunciar([{ tipo: 'nota', texto: escolha.motivo }]);
          salvarMesa(); renderMesa(); return;
        }
        const r = golpe({ atacante: o.ficha, defensor: M.ficha, tipo: escolha.tipo,
          arma: escolha.arma, armadura: null,
          estadosAtacante: o.estados, estadosDefensor: estadosAtuais(), alvoVampiro: true,
          terreno: terrenoDoOponente(o) });
        if (r.torpor) anunciar([{ tipo: 'critico', texto: 'Você caiu em torpor.' }]);
        salvarMesa(); renderMesa(); return;
  },

  'dano'(id, alvo) {
        const [qual, n] = id.split(':');
        const mapa = {
          sup:  { tipo: 'superficial', trilha: 'vitalidade' },
          agr:  { tipo: 'agravado',    trilha: 'vitalidade' },
          vsup: { tipo: 'superficial', trilha: 'vontade' },
          vagr: { tipo: 'agravado',    trilha: 'vontade' }
        }[qual];
        aplicarNoEstado(f => Estado.aplicarDano(f, Object.assign(
          { quantidade: +n, fonte: 'marcado na doca' }, mapa)));
        return;
  },

  'curar'(id, alvo) {
        aplicarNoEstado(f => Estado.curar(f, id === 'vontade'
          ? { trilha: 'vontade' }
          : { trilha: 'vitalidade', tipo: 'superficial' }));
        return;
  },

  'alimentar'(id, alvo) {
        aplicarNoEstado(f => Estado.alimentar(f, id));
        return;
  },

  'provocacao'(id, alvo) {
        aplicarNoEstado(f => Estado.provocacao(f));
        return;
  },

  'fome'(id, alvo) {
        const delta = id === '+1' ? 1 : -1;
        const antes = M.ficha.fome || 0;
        M.ficha.fome = Math.max(0, Math.min(5, antes + delta));
        anunciar([{ tipo: 'fome', texto: `Fome ${antes} → ${M.ficha.fome}.` }]);
        salvarMesa(); renderMesa();
        return;
  },

  'macula'(id, alvo) {
        aplicarNoEstado(f => Estado.ganharMacula(f, +id, 'marcada na doca'));
        return;
  },

  'remorso'(id, alvo) {
        aplicarNoEstado(f => Estado.testeDeRemorso(f));
        return;
  },

  'ritae'(id, alvo) {
        aplicarNoEstado(f => Estado.celebrarRitae(f, id));
        return;
  },

  'vaulderie'(id, alvo) {
        aplicarNoEstado(f => Estado.vaulderie(f));
        return;
  },

  'frenesi'(id, alvo) {
        aplicarNoEstado(f => Estado.testeDeFrenesi(f, {
          tipo: id, gatilho: (GATILHOS_FRENESI.find(g => g.tipo === id) || {}).gatilho }));
        return;
  },

  'cavalgar'(id, alvo) {
        aplicarNoEstado(f => Estado.testeDeFrenesi(f, { tipo: 'fome', cavalgar: true }));
        return;
  },

  'estado-manual'(id, alvo) {
        const i = M.estados.indexOf(id);
        if (i >= 0) M.estados.splice(i, 1); else M.estados.push(id);
        const nome = Arbitro.ESTADOS[id].nome;
        anunciar([{ tipo: 'estado', texto: i >= 0 ? `${nome}: não mais.` : `${nome}.` }]);
        salvarMesa(); renderMesa();
        return;
  },

  'fim-sessao'(id, alvo) {
        aplicarNoEstado(f => Estado.fimDeSessao(f, {
          cumpriuDesejo:   id === 'desejo',
          cumpriuAmbicao:  id === 'ambicao',
          beneficiouPilar: id === 'pilar'
        }));
        return;
  },

  'nova-historia'(id, alvo) {
        escolha = { campanha: null, personagem: null, importada: escolha.importada };
        renderNovaHistoria(); return;
  },

  'escolher-campanha'(id, alvo) {
        escolha.campanha = id; renderNovaHistoria(); return;
  },

  'escolher-personagem'(id, alvo) {
        escolha.personagem = id; renderNovaHistoria(); return;
  },

  'comecar-noite'(id, alvo) {
        comecarNoite(); return;
  },

  'continuar-sessao'(id, alvo) {
        if (carregarSessao(id)) renderMesa();
        else { toast('Não consegui abrir essa noite.'); renderSaguao(); }
        return;
  },

  'apagar-sessao'(id, alvo) {
        const s = listarSessoes().find(x => x.id === id);
        if (!s) return;
        if (sessaoParaApagar !== id) {
          sessaoParaApagar = id;
          renderSaguao();
          toast('Clique de novo para apagar de vez.');
          return;
        }
        apagarSessao(id);
        sessaoParaApagar = '';
        toast(`${s.personagem} em ${s.campanha} foi apagada.`);
        renderSaguao(); return;
  },

  'cancelar-apagar-sessao'(id, alvo) {
        sessaoParaApagar = '';
        renderSaguao(); return;
  },

  'importar-ficha'(id, alvo) {
        importarFichaParaMesa(); return;
  },

  'aba'(id, alvo) {
        M.aba = id; M.itemAberto = ''; renderDoca(); return;
  },

  'doca'(id, alvo) {
        M.docaAberta = !M.docaAberta; renderDoca(); return;
  },

  'fechar-doca'(id, alvo) {
        M.docaAberta = false; renderDoca(); return;
  },

  'modo'(id, alvo) {
        M.modo = id;
        renderCompositor();
        return;
  },

  'volume'(id, alvo) {
        M.volume = id;
        if (M.alvoFala !== 'geral') {
          const permitidos = (id === 'mensagem' ? pessoasComContato() : pessoasNaCena()).map(p => p.id);
          if (!permitidos.includes(M.alvoFala)) M.alvoFala = 'geral';
        }
        renderCompositor();
        return;
  },

  'item'(id, alvo) {
        const chave = `${alvo.dataset.tipo}:${id}`;
        M.itemAberto = M.itemAberto === chave ? '' : chave;
        renderDoca(); return;
  },

  'abrir-ref'(id, alvo) {
        const tipo = alvo.dataset.tipo;
        M.aba = tipo === 'pessoa' ? 'pessoas' : 'locais';
        M.itemAberto = `${tipo}:${id}`;
        M.docaAberta = true;
        renderDoca(); return;
  },

  'rolar'(id, alvo) {
        rolarDoJogador(alvo.dataset.msg, +alvo.dataset.rota);
        return;
  },

  'reteste'(id, alvo) {
        retestarComVontade(id);
        return;
  },

  'enviar'(id, alvo) {
        const ta = $('#entrada');
        if (ta) enviarTurno(ta.value);
        return;
  },
};

/* ============================================================
   VITÆ — Render da mesa
   Todo HTML da mesa vive aqui: fluxo de mensagens, HUD, doca e
   compositor. Nenhuma função deste arquivo muda estado — elas
   leem M e devolvem string.

   Quem muda estado é o mesa.js. Se uma função daqui precisar
   escrever em M, ela está no arquivo errado.
   ============================================================ */

function formatarNarracao(txt) {
  let t = esc(txt || '');

  /* [[pessoa:bia]] ou [[local:copacabana|Praia]] */
  t = t.replace(/\[\[(pessoa|local):([a-z0-9_]+)(?:\|([^\]]+))?\]\]/gi, (_, tipo, id, rot) => {
    const lista = tipo === 'pessoa' ? M.pessoas : M.locais;
    const alvo = lista.find(x => x.id === id);
    const nome = rot || alvo?.nome || id;
    if (!alvo) return esc(nome);
    return `<span class="ref" data-mesa="abrir-ref" data-tipo="${tipo}" data-id="${id}">${esc(nome)}</span>`;
  });

  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
       .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

  return t.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

function msgHTML(m) {
  if (m.autor === 'cena') {
    return `<div class="msg cena">
      <div class="titulo">${esc(m.titulo)}</div>
      ${m.sub ? `<div class="sub">${esc(m.sub)}</div>` : ''}
      <div class="fio"></div>
    </div>`;
  }
  if (m.autor === 'sistema') {
    return `<div class="msg sistema${m.critico ? ' critico' : ''}"><span>${esc(m.texto)}</span></div>`;
  }
  if (m.autor === 'jogador') return jogadorHTML(m);

  if (m.autor === 'arbitro') {
    const v = m.veredito;
    return `<div class="msg arbitro">
      <div class="msg-autor">Árbitro <span style="opacity:.5">· regra, sem IA</span></div>
      <div class="arbitro-caixa">
        <div class="arb-titulo">${esc(v.acao ? v.acao.nome : 'Ação impedida')}</div>
        ${v.bloqueios.map(b => `<div class="arb-bloqueio">
          <span class="tag">${esc(b.tipo)}</span>${esc(b.motivo)}</div>`).join('')}
        ${v.avisos.length ? `<div class="arb-aviso">${v.avisos.map(esc).join(' ')}</div>` : ''}
      </div>
    </div>`;
  }

  if (m.autor === 'rolagem') {
    return `<div class="msg rolagem-msg">
      <div class="msg-autor" style="color:var(--sangue-viva)">${esc(M.ficha?.nome || 'Você')} rola</div>
      ${DadosUI.cartao(m.resultado, { animar: !!m.animar, id: m.id })}
    </div>`;
  }

  const procedencia = m.degrau === 3 ? '<span style="opacity:.5">· recombinado, sem modelo</span>'
    : m.simulado ? '<span style="opacity:.5">· simulado</span>'
    : m.modelo ? `<span style="opacity:.5">· ${esc(m.modelo)}</span>` : '';
  const reprovado = m.validado === false
    ? `<span class="blood-text" title="${esc(m.avisoValidador || '')}">· o validador reprovou</span>` : '';

  return `<div class="msg narrador">
    <div class="msg-autor">Narrador ${procedencia} ${reprovado}</div>
    <div class="msg-texto">${formatarNarracao(m.texto)}</div>
    ${pedidoHTML(m)}
  </div>`;
}

function pessoasNaCena() {
  const ids = M.cena.presentes || [];
  return M.pessoas.filter(p => ids.includes(p.id));
}

function pessoasComContato() {
  return M.pessoas.filter(p => p.contato && p.conhecido);
}

function jogadorHTML(m) {
  const nome = esc(M.ficha?.nome || 'Você');
  const bruto = m.texto || '';

  const termos = (m.termos && m.termos.length) ? m.termos : [];
  const marcar = (txt) => Arbitro.marcarTermos(txt, termos,
    (t) => `<mark class="acao-chave">${esc(t)}</mark>`).replace(/\n/g, '<br>');

  /* §57 — UMA MENSAGEM PODE SER VÁRIAS COISAS.

     Antes o modo escolhia um dos três desenhos e o texto inteiro ia
     dentro dele. Agora a mensagem tem pedaços, e cada um é desenhado
     como o que é: a ação entre asteriscos, a fala entre aspas com o
     volume, a pergunta em itálico apagado.

     Mensagens gravadas ANTES da §57 não têm `segmentos`. Elas caem no
     desenho antigo, embaixo — sessão velha não pode quebrar. */
  if (m.segmentos && m.segmentos.length) {
    const vol = Arbitro.VOLUMES[m.volume] || Arbitro.VOLUMES.normal;
    const alvo = m.alvoFala && m.alvoFala !== 'geral'
      ? (M.pessoas.find(p => p.id === m.alvoFala) || {}).nome : null;

    const corpo = m.segmentos.map((s) => {
      if (s.tipo === 'fala') {
        /* Fala que o MODELO leu de uma frase indireta não vai entre
           aspas: as palavras são uma reescrita, não uma citação, e pôr
           aspas seria pôr na boca do jogador uma frase que ele não
           escreveu. Ela aparece marcada, e o jogador vê o que foi
           entendido — que é a única forma de ele poder discordar. */
        if (s.deModelo) {
          return `<div class="msg-texto fala lida vol-${esc(m.volume || 'normal')}">
            ${esc(s.texto).replace(/\n/g, '<br>')}
            <span class="fala-meta">· entendido como fala</span>
          </div>`;
        }
        return `<div class="msg-texto fala vol-${esc(m.volume || 'normal')}">
          <span class="aspas">“</span>${esc(s.texto).replace(/\n/g, '<br>')}<span class="aspas">”</span>
        </div>`;
      }
      if (s.tipo === 'meta') {
        return `<div class="msg-texto meta-pergunta">
          <span class="aspas">‘</span>${esc(s.texto).replace(/\n/g, '<br>')}<span class="aspas">’</span>
        </div>`;
      }
      return `<div class="msg-texto acao">
        <span class="aspas">*</span>${marcar(s.texto)}<span class="aspas">*</span>
      </div>`;
    }).join('');

    const temFala = m.segmentos.some(s => s.tipo === 'fala');
    const etiquetas = [
      temFala ? `${esc(vol.nome)}${alvo ? ' para ' + esc(alvo) : ' · a todos'}` : '',
      termos.length ? `avaliado como ${esc(m.acaoNome || '')}` : ''
    ].filter(Boolean).map(x => `<span class="fala-meta">· ${x}</span>`).join(' ');

    return `<div class="msg jogador ${esc(m.modo || 'agir')}">
      <div class="msg-autor">${nome} ${etiquetas}</div>
      ${corpo}
    </div>`;
  }

  /* ---------- desenho anterior à §57, para sessões já gravadas ---------- */

  if (m.modo === 'falar') {
    const vol = Arbitro.VOLUMES[m.volume] || Arbitro.VOLUMES.normal;
    const alvo = m.alvoFala && m.alvoFala !== 'geral'
      ? (M.pessoas.find(p => p.id === m.alvoFala) || {}).nome : null;
    return `<div class="msg jogador falar">
      <div class="msg-autor">${nome}
        <span class="fala-meta">· ${esc(vol.nome)}${alvo ? ' para ' + esc(alvo) : ' · a todos'}</span></div>
      <div class="msg-texto fala vol-${esc(m.volume || 'normal')}">
        <span class="aspas">“</span>${esc(bruto).replace(/\n/g, '<br>')}<span class="aspas">”</span>
      </div>
    </div>`;
  }

  if (m.modo === 'perguntar') {
    return `<div class="msg jogador perguntar">
      <div class="msg-autor">${nome} <span class="fala-meta">· ao Narrador</span></div>
      <div class="msg-texto meta-pergunta">
        <span class="aspas">‘</span>${esc(bruto).replace(/\n/g, '<br>')}<span class="aspas">’</span>
      </div>
    </div>`;
  }

  const modo = MODOS_MESA.find(x => x.id === m.modo);

  return `<div class="msg jogador ${esc(m.modo || 'agir')}">
    <div class="msg-autor">${nome}
      ${modo && modo.id === 'examinar' ? '<span class="fala-meta">· examina</span>' : ''}
      ${termos.length ? `<span class="fala-meta">· avaliado como ${esc(m.acaoNome || '')}</span>` : ''}</div>
    <div class="msg-texto acao">
      <span class="aspas">*</span>${marcar(bruto)}<span class="aspas">*</span>
    </div>
  </div>`;
}

function piscinaDaRota(rota, pedido) {
  const acao = Arbitro.ACOES[(pedido && pedido.intencao) || ''];
  return Arbitro.piscinaFinal(M.ficha, {
    rota,
    estados: estadosAtuais(),
    dominio: acao ? acao.dominio : null,
    intencao: (pedido && pedido.intencao) || null,
    disciplina: acao && acao.disciplina ? acao.disciplina.id : null
  });
}

function rotasDoPedido(r) {
  if (!r) return [];
  if (r.rotas && r.rotas.length) return r.rotas;
  return [{ atributo: r.atributo, pericia: r.pericia }];
}

function pedidoHTML(m) {
  const r = m.rolagem;
  if (!r) return '';
  const feita = M.rolagens[m.id];
  const rotas = rotasDoPedido(r);

  const cab = `<div class="cab">Teste pedido${
    r.dificuldade ? ` <span class="dif">· dificuldade ${r.dificuldade}</span>` : ''}</div>
    ${r.motivo ? `<div class="motivo">${esc(r.motivo)}</div>` : ''}`;

  if (feita) {
    const rota = rotas[feita.rota] || rotas[0];
    return `<div class="pedido-rolagem">
      ${cab}
      <div class="rolagem-feita">Você escolheu ${esc(nomeAtributo(rota.atributo))} + ${esc(nomeHabilidade(rota.pericia))}</div>
    </div>`;
  }

  const botoes = rotas.map((rota, i) => {
    const p = piscinaDaRota(rota, r);
    const fraca = p.total < 5;
    const detalhe = [
      p.especializacao ? '+1 especialização' : '',
      ...p.modificadores.map(x => `${x.dados > 0 ? '+' : ''}${x.dados} ${x.nome}`),
      p.penalidadeEstado ? `${p.penalidadeEstado} estado` : ''
    ].filter(Boolean).join(' · ');
    return `<button class="rota-btn" data-mesa="rolar" data-msg="${m.id}" data-rota="${i}"
        ${detalhe ? `title="${esc(p.base)} base · ${esc(detalhe)}"` : ''}>
      <span class="piscina">${esc(p.rotulo)}</span>
      <span class="dados-n ${fraca ? 'fraca' : ''}">${p.total} dado${p.total === 1 ? '' : 's'}${
        p.especializacao ? ' ✦' : ''}</span>
      ${rota.enquadramento ? `<span class="enq">${esc(rota.enquadramento)}</span>` : ''}
      ${detalhe ? `<span class="mods">${esc(detalhe)}</span>` : ''}
      ${rota.risco ? `<span class="risco">${esc(rota.risco)}</span>` : ''}
    </button>`;
  }).join('');

  return `<div class="pedido-rolagem">
    ${cab}
    <div class="rotas-oferecidas">${botoes}</div>
  </div>`;
}

/* `nomeAtributo` vive em ficha/ficha-vocabulario.js desde a §49,
   junto de `nomeHabilidade`. Item A6 da §45.2: ela morava aqui e era
   chamada pelo Árbitro, que carrega antes do front. */

const ABAS_DOCA = [
  { id: 'ficha',    rotulo: 'Ficha' },
  { id: 'estado',   rotulo: 'Estado', conta: () => estadosAtuais().length || null },
  { id: 'bolsa',    rotulo: 'Bolsa',  conta: () => (M.bolsa || []).length || null },
  { id: 'locais',   rotulo: 'Locais',  conta: () => M.locais.length },
  { id: 'pessoas',  rotulo: 'Pessoas', conta: () => M.pessoas.length },
  { id: 'historia', rotulo: 'História', conta: () => M.fatos.length + M.fios.length },
  { id: 'registro', rotulo: 'Registro' }
];

function docaFicha() {
  const f = M.ficha, c = clan(f.cla), p = predador(f.predador), d = derivados(f);
  const cid = CIDADES.find(x => x.id === f.cidade);
  const pontos = (v, max = 5) => `<span class="pontos-mini">${
    Array.from({ length: max }, (_, i) => `<i class="${i < v ? 'on' : ''}"></i>`).join('')}</span>`;

  const linha = (rot, sub, val) => `<div class="linha">
    <span class="rot">${esc(rot)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>
    <span>${val}</span></div>`;

  const atr = Object.entries(ATRIBUTOS).map(([, g]) => `
    <div class="bloco"><h4 style="font-family:var(--sans);font-size:.55rem;letter-spacing:.2em;
      text-transform:uppercase;color:rgba(185,173,158,.4);margin:0 0 .3rem">${g.rotulo}</h4>
      ${g.lista.map(a => linha(a.nome, '', pontos(f.atributos[a.id] || 0))).join('')}
    </div>`).join('');

  const habs = Object.values(HABILIDADES).flatMap(g => g.lista)
    .filter(h => f.habilidades[h.id])
    .sort((a, b) => (f.habilidades[b.id] - f.habilidades[a.id]))
    .map(h => linha(h.nome, f.especializacoes[h.id] || '', pontos(f.habilidades[h.id]))).join('');

  const discs = Object.entries(f.disciplinas || {}).filter(([, v]) => v > 0).map(([id, v]) => `
    ${linha(DISCIPLINAS[id]?.nome || id, '', pontos(v))}
    ${(f.poderes[id] || []).map(n =>
      `<div style="padding-left:.7rem;font-size:.84rem;color:rgba(185,173,158,.55)">— ${esc(n)}</div>`).join('')}
  `).join('');

  const pf = Seitas.perfil(f.seita);
  const dSeita = f.seita ? (f.seitaDados || {})[pf.id] || {} : {};
  const ancoraDe = (i) => {
    if (pf.ancoras.tipo !== 'ritae') return f.marcos[i] || '—';
    const r = RITAE.find(x => x.id === (dSeita.conviccoesRitae || [])[i]);
    const imp = (dSeita.implementos || [])[i];
    return (r ? r.nome : '—') + (imp ? ` — ${imp}` : '');
  };

  /* Perder o Pilar derruba a Convicção (pág. 173) — §69, item A8. Só
     aparece para âncora mortal: no Sabá a âncora é um Ritae, e Ritae
     não morre. */
  const podePerder = pf.ancoras.tipo !== 'ritae';
  const conv = f.conviccoes.map((cv, i) => cv
    ? `<div style="margin-bottom:.5rem"><div style="font-size:.92rem;color:var(--osso-fosco)">${esc(cv)}</div>
       <div style="font-size:.8rem;color:var(--carne-fria);font-style:italic">${esc(pf.ancoras.rotulo)}: ${esc(ancoraDe(i))}</div>
       ${podePerder && f.marcos[i] ? `<div class="chips" style="margin-top:.25rem">
         <span class="chip" data-mesa="perder-pilar" data-id="${i}"
           title="Perdido: 2 Máculas, e a Convicção cai junto">Perdi este ${esc(pf.ancoras.rotulo.toLowerCase())}</span>
         <span class="chip" data-mesa="perder-pilar-culpa" data-id="${i}"
           title="Destruído por ação sua: 3 Máculas, e a Convicção cai junto">…e foi por minha causa</span>
       </div>` : ''}</div>`
    : '').join('') || '<p class="quiet">—</p>';

  const cam = CAMINHOS.find(x => x.id === dSeita.caminho);
  const lealdade = !pf.id ? '' : `
    <div class="doca-sec"><h4>${esc(pf.grupo.rotulo || 'Lealdade')}</h4>
      ${linha(pf.nome, '', `<span class="quiet">${esc(Seitas.resumo(f, typeof Matilha !== 'undefined' ? Matilha.de(f) : null) || '—')}</span>`)}
      ${cam ? linha('Caminho', cam.alcunha, `<span class="quiet">${esc(cam.nome)}</span>`) : ''}
      ${pf.id === 'sabbat' ? linha('Vinculum', '', `<b class="gold">${dSeita.vinculum || 0}</b>`) : ''}
      ${Seitas.defeitosImpostos(f).map(x => linha(x.nome, x.motivo, '<span class="blood-text">imposto</span>')).join('')}
    </div>`;

  return `<div class="ficha-doca">
    <div class="doca-sec">
      <div style="font-family:var(--title);font-size:1.25rem;color:var(--osso);letter-spacing:.04em">
        ${esc(f.nome)}</div>
      <div style="font-family:var(--sans);font-size:.58rem;letter-spacing:.18em;text-transform:uppercase;
        color:var(--carne-fria);margin-top:.25rem">
        ${c ? `${c.simbolo} ${esc(c.nome)}` : ''} · ${esc(f.geracao)}ª geração${p ? ` · ${esc(p.nome)}` : ''}</div>
      ${f.conceito ? `<p class="quiet" style="margin:.5rem 0 0;font-style:italic">${esc(f.conceito)}</p>` : ''}
    </div>

    <div class="doca-sec"><h4>Vitais</h4>
      ${linha('Vitalidade', '', `<b class="gold">${d.vitalidade}</b>`)}
      ${linha('Força de Vontade', '', `<b class="gold">${d.vontade}</b>`)}
      ${linha('Humanidade', '', `<b class="gold">${d.humanidade}</b>`)}
      ${linha('Fome', '', `<b class="blood-text">${f.fome || 0}</b>`)}
      ${linha('Potência de Sangue', '', `<b class="gold">${d.potencia}</b>`)}
    </div>

    <div class="doca-sec"><h4>Atributos</h4>${atr}</div>
    <div class="doca-sec"><h4>Habilidades</h4>${habs || '<p class="quiet">—</p>'}</div>
    <div class="doca-sec"><h4>Disciplinas</h4>${discs || '<p class="quiet">—</p>'}</div>
    ${c ? `<div class="doca-sec"><h4>Perdição — ${esc(c.maldicao.nome)}</h4>
      <p class="quiet" style="margin:0">${esc(c.maldicao.texto)}</p></div>` : ''}
    ${lealdade}
    <div class="doca-sec"><h4>Convicções</h4>${conv}</div>
    <div class="doca-sec"><h4>Motivação</h4>
      ${linha('Ambição', '', `<span class="quiet">${esc(f.ambicao || '—')}</span>`)}
      ${linha('Desejo', '', `<span class="quiet">${esc(f.desejo || '—')}</span>`)}
    </div>
  </div>`;
}

function docaLocais() {
  if (!M.locais.length) return '<p class="quiet">Nenhum lugar conhecido ainda.</p>';
  return M.locais.map(l => {
    const aberto = M.itemAberto === 'local:' + l.id;
    return `<div class="item ${aberto ? 'aberto' : ''} ${l.conhecido ? '' : 'desconhecido'}"
        data-mesa="item" data-tipo="local" data-id="${esc(l.id)}">
      <div class="nome">${esc(l.nome)}</div>
      <div class="meta">${esc(l.tipo)}${l.zona ? ` · ${esc(l.zona)}` : ''}
        <span class="perigo" title="Perigo ${l.perigo || 0}/5">${
          Array.from({ length: 5 }, (_, i) => `<i class="${i < (l.perigo || 0) ? 'on' : ''}"></i>`).join('')}</span>
      </div>
      ${aberto ? `<div class="desc">${esc(l.descricao)}</div>` : ''}
    </div>`;
  }).join('');
}

function docaPessoas() {
  if (!M.pessoas.length) return '<p class="quiet">Ninguém registrado ainda.</p>';
  return M.pessoas.map(p => {
    const aberto = M.itemAberto === 'pessoa:' + p.id;
    const rel = RELACOES[p.relacao] || RELACOES.neutro;
    return `<div class="item ${aberto ? 'aberto' : ''} ${p.conhecido ? '' : 'desconhecido'}"
        data-mesa="item" data-tipo="pessoa" data-id="${esc(p.id)}">
      <span class="fita-rel" style="background:${rel.cor}"></span>
      <div class="nome">${esc(p.nome)}</div>
      <div class="meta">${esc(p.tipo)} · <span style="color:${rel.cor}">${rel.rotulo}</span>
        ${p.canon ? ' · cânone' : ''}</div>
      ${aberto ? `<div class="desc">${esc(p.descricao)}</div>` : ''}
    </div>`;
  }).join('');
}

function docaHistoria() {
  const fatos = M.fatos.length ? M.fatos.map(f => `
    <div class="item" data-mesa="nada">
      <div class="nome">${esc(f.titulo)}</div>
      <div class="desc">${esc(f.texto)}</div>
    </div>`).join('') : '<p class="quiet">Nada estabelecido ainda.</p>';

  const abertos = M.fios.filter(f => f.estado !== 'fechado');
  const fechados = M.fios.filter(f => f.estado === 'fechado');
  const fio = (f) => `<div class="item" data-mesa="nada">
      <div class="nome" style="font-size:.86rem">${esc(f.titulo)}</div></div>`;

  return `
    <div class="doca-sec"><h4>Fios em aberto</h4>
      ${abertos.length ? abertos.map(fio).join('') : '<p class="quiet">Nenhum.</p>'}</div>
    <div class="doca-sec"><h4>Fatos estabelecidos</h4>${fatos}</div>
    ${fechados.length ? `<div class="doca-sec"><h4>Encerrados</h4>${fechados.map(fio).join('')}</div>` : ''}
    ${legadoHTML()}`;
}

function legadoHTML() {
  const reg = Legado.de(M.ficha);
  if (Legado.vazioDe(reg)) return '';

  const linha = (colecao, chave, titulo, sub) => `
    <div class="linha-traco" style="align-items:flex-start">
      <span class="traco-nome">${esc(titulo)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>
      <button class="btn fantasma" data-mesa="esquecer-legado"
        data-id="${esc(colecao)}:${esc(chave)}" title="Tirar do legado">Esquecer</button>
    </div>`;

  const bloco = (titulo, itens) => itens.length
    ? `<h4 style="margin-top:.8rem">${titulo}</h4>${itens.join('')}` : '';

  const propostas = Legado.propostas(M.ficha);
  const conversao = propostas.length ? `
    <h4 style="margin-top:.8rem">Vira ficha?</h4>
    <p class="quiet" style="margin:0 0 .5rem;font-size:.82rem">O motor sugere a conversão pela
    tabela; quem decide é você. Nada entra na ficha sem este clique.</p>
    ${propostas.map(p => `
      <div class="linha-traco" style="align-items:flex-start">
        <span class="traco-nome">${esc(p.rotulo)}
          <small>${esc(p.classe === 'defeitos' ? 'Defeito' : p.classe === 'meritos' ? 'Mérito' : 'Antecedente')}
          ${esc(p.nome)} ${p.de} → ${p.para} · ${esc(p.porque)}</small></span>
        <span style="display:flex;gap:.3rem">
          <button class="btn fantasma" data-mesa="aplicar-legado"
            data-id="${esc(p.marca)}">Aplicar</button>
          <button class="btn fantasma" data-mesa="recusar-legado"
            data-id="${esc(p.marca)}" title="Não converter, e não perguntar de novo">Deixar</button>
        </span>
      </div>`).join('')}` : '';

  return `
  <div class="doca-sec" style="border-top:1px solid rgba(182,145,63,.2);margin-top:1rem;padding-top:.8rem">
    <h4>O que veio de antes</h4>
    <p class="quiet" style="margin:0 0 .6rem;font-size:.82rem">
      ${reg.cronicas.length} crônica(s) atrás deste personagem. O Narrador e o Cronista sabem
      de tudo isto. O que não fizer sentido nesta história, esqueça.</p>

    ${bloco('Vínculos', reg.relacoes.map(r => linha('relacoes', r.id,
      `${r.quem} — ${(Legado.VINCULOS[r.vinculo] || {}).rotulo || 'conhecido'}`,
      [r.natureza, r.dividaEmAberto && r.dividaEmAberto !== '—' ? `Em aberto: ${r.dividaEmAberto}` : '',
       `de ${r.deCronica}`].filter(Boolean).join(' · '))))}

    ${bloco('Marcas', reg.marcas.map(m => linha('marcas', m.texto,
      `${Legado.TIPOS_DE_MARCA[m.tipo] || 'Marca'}: ${m.texto}`, `de ${m.deCronica}`)))}

    ${bloco('Posses', reg.posses.map(p => linha('posses', p.nome, p.nome,
      `${p.comoVeio} · de ${p.deCronica}`)))}

    ${bloco('Sem resposta', reg.fios.map(f => linha('fios', f.id, f.titulo, `de ${f.deCronica}`)))}

    ${conversao}

    ${reg.cronicas.length ? `<h4 style="margin-top:.8rem">Crônicas anteriores</h4>
      ${reg.cronicas.map(c => `<div style="margin-bottom:.6rem">
        <div style="color:var(--osso-fosco);font-size:.9rem">${esc(c.titulo)}${
          c.cidade ? ` · ${esc((CIDADES.find(x => x.id === c.cidade) || {}).nome || c.cidade)}` : ''}</div>
        <p class="quiet" style="margin:.2rem 0 0;font-size:.82rem">${esc(c.dossie || '')}</p>
      </div>`).join('')}` : ''}
  </div>`;
}

const FONTES_DE_SANGUE = [
  { rotulo: 'Gole discreto',  fonte: 'Pequeno gole de humano' },
  { rotulo: 'Sem ferir',      fonte: 'Máximo de um humano sem causar dano' },
  { rotulo: 'Até o limite',   fonte: 'Beber até deixar o humano em risco de vida' },
  { rotulo: 'Drenar e matar', fonte: 'Drenar e matar um humano' },
  { rotulo: 'Bolsa',          fonte: 'Bolsa de sangue' },
  { rotulo: 'Animal',         fonte: 'Animal médio (guaxinim, cachorro, coiote)' }
];

const GATILHOS_FRENESI = [
  { tipo: 'fome',   gatilho: 'Sangue à vista com Fome alta' },
  { tipo: 'furia',  gatilho: 'Provocação direta' },
  { tipo: 'terror', gatilho: 'Fogo ou luz solar' }
];

const ARMAS_RAPIDAS = ['Desarmado', 'Canivete', 'Bastão', 'Estaca', 'Espada', 'Pistola .22', '9 mm', 'Espingarda'];

const ARMADURAS_RAPIDAS = ['Sem armadura', 'Couro', 'Colete balístico', 'Jaqueta de Kevlar', 'Armadura tática'];

function painelCombateHTML() {
  if (!combateAtivo()) return '';

  const oponentes = M.combate.oponentes || [];
  const rodada = M.combate.rodada && !M.combate.rodada.encerrada ? M.combate.rodada : null;
  const vez = rodada ? Rodada.atual(rodada) : null;
  const minhaVez = !rodada || (vez && vez.ref === 'voce');
  const suaArma = M.combate.arma || 'Desarmado';

  /* O elo 3 virando texto. Sem isto ele decide a penalidade e o
     jogador vê o dado mudar sem saber por quê — que é justamente a
     acusação da §3: o Árbitro não pode dizer "não" e virar as costas,
     nem "−2" e ficar calado. */
  const terreno = (o) => {
    const d = typeof terrenoDescrito === 'function' ? terrenoDescrito(o) : '';
    return d ? `<div class="linha"><span class="rot">Terreno<small>${esc(d)}</small></span></div>` : '';
  };

  const cartoes = oponentes.map(o => {
    const t = Estado.trilhas(o.ficha);
    const fora = Rodada.foraDeCombate(o);
    const naVez = vez && vez.ref === o.ref;
    const trilha = Array.from({ length: t.vitalidade.max }, (_, k) =>
      `<i class="${k < t.vitalidade.livres ? 'on' : ''}"></i>`).join('');

    return `
    <div class="combate-alvo ${fora ? 'caido' : ''} ${naVez ? 'na-vez' : ''}">
      <div class="combate-alvo-topo">
        <span class="combate-nome">${esc(o.nome)}</span>
        <span class="combate-selo">${fora ? 'fora de combate' : naVez ? 'é a vez dele' : ''}</span>
      </div>
      <div class="linha">
        <span class="rot">Vitalidade<small>${t.vitalidade.livres} de ${t.vitalidade.max}${
          t.vitalidade.agr ? ` · ${t.vitalidade.agr} agravado` : ''}</small></span>
        <span class="pontos-mini">${trilha}</span>
      </div>
      ${terreno(o)}
      ${fora ? '' : `
      <div class="chips" style="margin-top:.45rem">
        ${Object.entries(Combate.ATAQUES).map(([tipo, a]) =>
          `<span class="chip ${minhaVez ? '' : 'apagado'}" data-mesa="atacar"
            data-id="${o.ref}:${tipo}">${esc(a.nome)}</span>`).join('')}
      </div>`}
    </div>`;
  }).join('');

  const ordem = rodada ? `
    <ol class="combate-ordem">
      ${rodada.ordem.map(x => `<li class="${x.ref === (vez && vez.ref) ? 'agora' : ''}">
        ${esc(x.nome)} <span>${x.total}</span>${x.agiu ? ' · já agiu' : ''}</li>`).join('')}
    </ol>` : '';

  return `
  <div class="combate-painel">
    <div class="combate-cabeca">
      <span class="combate-titulo">Combate${rodada ? ` · rodada ${rodada.numero}` : ''}</span>
      <span class="combate-vez">${rodada
        ? `vez de <b>${esc(vez ? vez.nome : '—')}</b>`
        : 'sem ordem de iniciativa'}</span>
    </div>
    ${M.combate.motivo ? `<p class="combate-motivo">${esc(M.combate.motivo)}</p>` : ''}
    ${ordem}
    <div class="combate-arma">
      <span class="rot">Sua arma</span>
      <div class="chips">${ARMAS_RAPIDAS.map(a =>
        `<span class="chip ${suaArma === a ? 'on' : ''}" data-mesa="minha-arma"
          data-id="${esc(a)}">${esc(a)}</span>`).join('')}</div>
    </div>
    <div class="combate-alvos">${cartoes}</div>
    <div class="chips" style="margin-top:.6rem">
      ${rodada && minhaVez ? '<span class="chip" data-mesa="passar-vez">Passar a vez</span>' : ''}
      <span class="chip" data-mesa="fugir-do-combate">Sair da briga</span>
    </div>
  </div>`;
}

function docaBolsa() {
  const itens = M.bolsa || [];

  /* O que o livro diz sobre o item, quando ele é do livro (§66). Quem
     sabe casar nome com item é o Árbitro — o front só pergunta. */
  const cartoes = itens.map((it, i) => {
    const doLivro = Combate.itemPor(it.nome);
    return `
    <div class="doca-sec">
      <div class="linha-traco" style="align-items:flex-start">
        <span class="traco-nome">${esc(it.nome)}
          ${it.comoVeio ? `<small>${esc(it.comoVeio)}</small>` : ''}</span>
        <button class="btn fantasma" data-mesa="largar-item" data-id="${i}"
          title="Tirar da bolsa">Largar</button>
      </div>
      ${doLivro ? `<p class="quiet" style="margin:.35rem 0 0;font-size:.8rem">
        <strong>${esc(doLivro.nome)}</strong> — pág. ${doLivro.pagina}. ${esc(doLivro.regra)}</p>` : ''}
      ${(it.arma || (doLivro && doLivro.categoria === 'arma')) ? `<div class="chips" style="margin-top:.3rem">
        <span class="chip ${M.combate.arma === it.nome ? 'on' : ''}"
          data-mesa="minha-arma" data-id="${esc(it.nome)}">Usar como arma</span></div>` : ''}
    </div>`;
  }).join('');

  return `
  <div class="doca-sec">
    <h4>O que você carrega</h4>
    <p class="quiet" style="margin:0 0 .6rem;font-size:.82rem">O que a campanha te deu e o que
    você pegou pelo caminho. Itens marcados como arma aparecem no combate. O que sobrar aqui
    no fim da crônica entra no legado como posse.</p>
    <div class="campo">
      <label>Pegar alguma coisa</label>
      <input id="bolsa-nome" placeholder="Ex.: chave do camarim" list="bolsa-itens-do-livro">
      <datalist id="bolsa-itens-do-livro">
        ${ITENS.map(i => `<option value="${esc(i.nome)}">${esc(i.desc)}</option>`).join('')}
      </datalist>
    </div>
    <p class="quiet" style="margin:.3rem 0 0;font-size:.78rem">O campo sugere os itens do capítulo
    "Itens" (págs. 378–381). Escolhendo um deles, a mesa já sabe a regra: o que queima, o que
    ignora armadura, o que atrapalha a mira.</p>
    <div class="chips" style="margin-top:.4rem">
      <span class="chip" data-mesa="pegar-item" data-id="item">Guardar</span>
      <span class="chip" data-mesa="pegar-item" data-id="arma">Guardar como arma</span>
    </div>
  </div>

  ${cartoes || '<div class="doca-sec"><p class="quiet">A bolsa está vazia.</p></div>'}`;
}

function docaEstado() {
  const f = M.ficha;
  const d = derivados(f);
  const t = Estado.trilhas(f);
  const pf = Seitas.perfil(f.seita);
  const ativos = estadosAtuais();
  const cam = Estado.caminhoDe(f);

  const trilha = (rot, livres, max, agr) => `
    <div class="linha">
      <span class="rot">${rot}<small>${livres} livres de ${max}${agr ? ` · ${agr} agravado` : ''}</small></span>
      <span class="pontos-mini">${Array.from({ length: max }, (_, i) =>
        `<i class="${i < livres ? 'on' : ''}"></i>`).join('')}</span>
    </div>`;

  const botao = (acao, id, rotulo, titulo) =>
    `<span class="chip" data-mesa="${acao}" data-id="${id}" title="${esc(titulo || '')}">${rotulo}</span>`;

  const manuais = ['cego', 'surdo', 'mudo', 'algemado', 'agarrado', 'imobilizado',
                   'estacado', 'em_chamas', 'luz_solar', 'submerso', 'frenesi']
    .map(id => `<span class="chip ${M.estados.includes(id) ? 'on' : ''}"
       data-mesa="estado-manual" data-id="${id}"
       title="${esc(Arbitro.ESTADOS[id].desc)}">${esc(Arbitro.ESTADOS[id].nome)}</span>`).join('');

  const derivadosAtivos = Estado.estadosDerivados(f)
    .map(id => `<span class="chip on" style="opacity:.7" title="derivado da ficha, não se desliga à mão">${
      esc(Arbitro.ESTADOS[id].nome)}</span>`).join('');

  /* O fogo que ainda está pegando, e o que apaga cada um (§66). Sem
     este bloco a queima corria por turno e o jogador não tinha onde
     interrompê-la. */
  const queimas = (M.combate && M.combate.queimas) || [];
  const fogo = queimas.length ? `
  <div class="doca-sec">
    <h4>Você está queimando</h4>
    ${queimas.map((q, i) => `<p class="quiet" style="margin:.2rem 0;font-size:.82rem">
      <strong>${esc(q.item)}</strong> — ${q.pontos} de Agravado por turno (pág. ${q.pagina}).<br>
      Apaga com: ${esc(q.apaga)}.
      <span class="chip" data-mesa="apagar-fogo" data-id="${i}">Apaguei</span></p>`).join('')}
  </div>` : '';

  /* O sangue que está no corpo agora, e o que ele vale no dado (§67).
     Antes, a Ressonância era um nome no rodapé da ficha e nada mais. */
  const res = Ressonancia.por(f.ressonancia);
  const tmp = Ressonancia.temperamentoPor(f.temperamento);
  const discrasias = (tmp && tmp.discrasia) ? Ressonancia.discrasiasDe(f.ressonancia) : [];
  const sangue = res ? `
  <div class="doca-sec">
    <h4>O sangue no corpo</h4>
    <p class="quiet" style="margin:.2rem 0;font-size:.84rem">
      <strong style="color:${res.cor}">${esc(res.nome)}</strong>${tmp ? ` · ${esc(tmp.nome)}` : ''}
      ${tmp && tmp.dados
        ? `<br><b>+${tmp.dados} dado</b> em ${esc(Ressonancia.disciplinasDe(res.id))}, até diluir ou até a Fome 5.`
        : '<br>Sem temperamento: não vale dado nenhum (pág. 228).'}</p>
    ${discrasias.length ? `<details style="margin-top:.4rem">
      <summary class="quiet" style="cursor:pointer;font-size:.82rem">Discrasias ${esc(res.nome)} (pág. 230)</summary>
      ${discrasias.map(d => `<p class="quiet" style="margin:.3rem 0;font-size:.8rem">
        <b>${esc(d.nome)}:</b> ${esc(d.efeito)}</p>`).join('')}
      <p class="quiet" style="margin:.3rem 0;font-size:.78rem">Para usar uma delas é preciso matar e drenar
      a bolsa, ou se alimentar dela por três noites (pág. 228).</p>
    </details>` : ''}
  </div>` : '';

  return `
  ${fogo}
  ${sangue}
  <div class="doca-sec">
    <h4>Vitalidade</h4>
    ${trilha('Trilha', t.vitalidade.livres, t.vitalidade.max, t.vitalidade.agr)}
    <div class="chips">
      ${botao('dano', 'sup:1', '+1 superficial')}
      ${botao('dano', 'sup:3', '+3 superficial')}
      ${botao('dano', 'agr:1', '+1 agravado')}
      ${botao('curar', 'vitalidade', 'Curar', 'Custa uma Provocação e pode subir a Fome')}
    </div>
  </div>

  <div class="doca-sec">
    <h4>Força de Vontade</h4>
    ${trilha('Trilha', t.vontade.livres, t.vontade.max, t.vontade.agr)}
    <div class="chips">
      ${botao('dano', 'vsup:1', '+1 superficial')}
      ${botao('dano', 'vagr:1', '+1 agravada')}
      ${botao('curar', 'vontade', 'Recuperar')}
    </div>
  </div>

  <div class="doca-sec">
    <h4>Fome — ${f.fome || 0} de 5</h4>
    <div class="chips">
      ${FONTES_DE_SANGUE.map(x => botao('alimentar', x.fonte, x.rotulo)).join('')}
    </div>
    <div class="chips" style="margin-top:.4rem">
      ${botao('provocacao', '', 'Provocação', 'Rola 1d10; de 1 a 5 a Fome sobe')}
      ${botao('fome', '+1', 'Fome +1')}
      ${botao('fome', '-1', 'Fome −1')}
    </div>
  </div>

  <div class="doca-sec">
    <h4>${esc(pf.bussola.rotulo)} — ${d.humanidade}${(f.maculas || 0) ? `, ${f.maculas} Mácula(s)` : ''}</h4>
    ${(() => {
      /* Mácula A SERVIÇO de uma Convicção é reduzida em uma ou mais
         (pág. 239) — §69, item A9. O exemplo do livro é 3 → 2, então
         o controle útil não é um botão fixo: é escolher a gravidade
         do ato E dizer se houve atenuante.

         `M.atenuante` guarda o índice da Convicção invocada, e vale
         para a PRÓXIMA Mácula marcada. É a ordem em que a mesa
         pensa: primeiro "eu tinha um motivo", depois "quanto custou". */
      const cvs = (f.conviccoes || []).map((c, i) => [c, i]).filter(([c]) => c);
      const at = M.atenuante;
      const atual = (at != null && f.conviccoes[at]) ? f.conviccoes[at] : null;
      return `
    <div class="chips">
      ${[1, 2, 3].map(n => botao('macula', String(n),
        `+${n} Mácula${n === 1 ? '' : 's'}`,
        n === 1 ? 'Violação clara, porém justificável' : n === 2 ? 'Ato pesado'
                : 'Ato verdadeiramente bestial')).join('')}
      ${botao('remorso', '', 'Teste de Remorso', 'Rola os espaços vazios da trilha')}
    </div>
    ${cvs.length ? `<p class="quiet" style="margin:.5rem 0 .2rem;font-size:.8rem">
      ${atual
        ? `Atenuante ligada: a próxima Mácula vem reduzida em respeito a <b>"${esc(atual)}"</b> (pág. 239).`
        : 'Foi em respeito a uma Convicção? Ligue a atenuante antes de marcar a Mácula:'}</p>
    <div class="chips">${cvs.map(([c, i]) => `<span class="chip ${at === i ? 'on' : ''}"
      data-mesa="atenuante" data-id="${i}"
      title="${esc(c)}">${esc(c.length > 30 ? c.slice(0, 28) + '…' : c)}</span>`).join('')}</div>` : ''}`;
    })()}
    ${cam ? `<p class="quiet" style="margin:.5rem 0 0;font-size:.82rem">
      Caminho: ${esc(cam.nome)}. Celebrar um Ritae-Pilar alivia uma Mácula por sessão.</p>
      <div class="chips" style="margin-top:.4rem">
        ${(((f.seitaDados || {}).sabbat || {}).conviccoesRitae || []).filter(Boolean)
          .map(rid => botao('ritae', rid, esc((RITAE.find(x => x.id === rid) || {}).nome || rid))).join('')}
        ${botao('vaulderie', '', 'Vaulderie')}
      </div>` : ''}
  </div>

  ${f.desejo ? `<div class="doca-sec">
    <h4>Desejo</h4>
    <p class="quiet" style="margin:.2rem 0 .5rem;font-size:.84rem">"${esc(f.desejo)}"</p>
    <div class="chips">
      ${f.desejoUsadoNaSessao
        ? '<span class="chip" style="opacity:.5">Já rendeu Vontade nesta sessão</span>'
        : botao('desejo-agora', '', 'Agi pelo Desejo — agora',
                'Uma vez por sessão, na hora: 1 de Vontade Superficial (pág. 174)')}
    </div>
    <p class="quiet" style="margin:.5rem 0 0;font-size:.78rem">O livro paga <b>na hora</b> em que
    você age, e não no fim da noite — o incentivo é agir, não esperar a trama.</p>
  </div>` : ''}

  <div class="doca-sec">
    <h4>Frenesi</h4>
    <div class="chips">
      ${GATILHOS_FRENESI.map(g => botao('frenesi', g.tipo, `Resistir: ${g.tipo}`, g.gatilho)).join('')}
      ${botao('cavalgar', '', 'Cavalgar a Onda', 'Entrega o controle de propósito, sem teste')}
    </div>
  </div>

  <div class="doca-sec">
    <h4>Estados</h4>
    <div class="chips">${manuais}</div>
    ${derivadosAtivos ? `<p class="quiet" style="margin:.5rem 0 .2rem;font-size:.78rem">
      Derivados da ficha:</p><div class="chips">${derivadosAtivos}</div>` : ''}
    ${ativos.length ? `<p class="quiet" style="margin:.5rem 0 0;font-size:.8rem">
      O Árbitro já considera estes em toda avaliação.</p>` : ''}
  </div>

  <div class="doca-sec">
    <h4>Fim de sessão</h4>
    <div class="chips">
      ${botao('fim-sessao', 'nada', 'Encerrar')}
      ${botao('fim-sessao', 'desejo', '+ cumpriu o Desejo')}
      ${botao('fim-sessao', 'ambicao', '+ cumpriu a Ambição')}
      ${botao('fim-sessao', 'pilar', `+ beneficiou um ${esc(pf.ancoras.rotulo)}`)}
    </div>
    <p class="quiet" style="margin:.5rem 0 0;font-size:.8rem">Recupera Vontade, testa Remorso
    se houver Mácula, e dá a experiência da noite.</p>
  </div>`;
}

function docaRegistro() {
  return cronistaHTML() + (!M.registro.length ? '<p class="quiet">Sem registros.</p>'
    : registroHTML());
}

function cronistaHTML() {
  const e = Cronista.estado;
  const selo = !e.verificado ? 'verificando…'
    : e.disponivel ? e.modelo
    : 'modo determinístico — sem provedor local no ar';

  const feitas = [...(M.cronicas || [])].reverse().map(c => {
    const s = c.saida || {};
    const lista = (rot, arr) => (arr && arr.length)
      ? `<div style="margin-top:.5rem"><b class="gold" style="font-size:.72rem;letter-spacing:.14em;
         text-transform:uppercase">${rot}</b>${arr.map(x =>
         `<div class="quiet" style="font-size:.85rem">— ${esc(typeof x === 'string' ? x : x.titulo || x.quem)}</div>`).join('')}</div>`
      : '';
    return `
      <div class="doca-sec" style="border-left:2px solid rgba(182,145,63,.3);padding-left:.7rem">
        <h4>${esc(s.titulo || 'Crônica')}</h4>
        <div style="font-family:var(--sans);font-size:.55rem;letter-spacing:.16em;text-transform:uppercase;
          color:var(--carne-fria);margin-bottom:.4rem">
          ${c.tipo === 'dossie' ? 'Dossiê' : 'Capítulo'} · ${c.origem === 'modelo' ? esc(c.modelo || 'modelo') : 'determinístico'}
          ${c.valido === false ? ' · <span class="blood-text">validador reprovou</span>' : ''}</div>
        <p class="quiet" style="margin:0;font-size:.9rem;line-height:1.5">${esc(s.cronica || s.dossie || '')}</p>
        ${lista('Aconteceu', s.aconteceu)}
        ${lista('Preço pago', s.precoPago || s.marcas)}
        ${lista('Em aberto', s.fiosAbertos)}
        ${(s.proximoBeat || s.ganchoFuturo) ? `<p class="quiet" style="margin:.5rem 0 0;font-style:italic">
          ${esc(s.proximoBeat || s.ganchoFuturo)}</p>` : ''}
      </div>`;
  }).join('');

  return `
  <div class="doca-sec">
    <h4>Cronista</h4>
    <div style="font-family:var(--sans);font-size:.55rem;letter-spacing:.16em;text-transform:uppercase;
      color:var(--carne-fria);margin-bottom:.5rem">${esc(selo)}</div>
    <div class="chips" style="margin:0">
      <span class="chip" data-mesa="cronicar" data-id="capitulo">Fechar capítulo</span>
      <span class="chip" data-mesa="cronicar" data-id="dossie">Encerrar a crônica</span>
    </div>
    <p class="quiet" style="margin:.5rem 0 0;font-size:.8rem">Resumo de cena é determinístico e
    não custa nada. Capítulo e dossiê são as únicas chamadas de modelo desta camada.</p>
  </div>
  ${feitas}`;
}

function registroHTML() {
  return [...M.registro].reverse().map(r => `
    <div class="linha" style="display:flex;justify-content:space-between;gap:.6rem;
      padding:.35rem 0;border-bottom:1px dotted rgba(182,145,63,.12);font-size:.86rem">
      <span class="quiet">${esc(r.texto)}</span>
      <span style="font-family:var(--sans);font-size:.55rem;color:rgba(185,173,158,.3);white-space:nowrap">
        ${new Date(r.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>`).join('');
}

function hudHTML() {
  const f = M.ficha, d = derivados(f);
  const dano = (f.danoSuperficial || 0) + (f.danoAgravado || 0);
  const pips = (n, max, cls, feridos = 0) => `<div class="hud-pips ${cls || ''}">${
    Array.from({ length: max }, (_, i) =>
      `<i class="${i < n ? 'on' : ''} ${i >= max - feridos ? 'ferido' : ''}"></i>`).join('')}</div>`;
  return `
    <div class="hud-item"><span class="rot">Fome</span>${pips(f.fome || 0, 5, 'fome')}</div>
    <div class="hud-item"><span class="rot">Vitalidade</span>${pips(d.vitalidade - dano, d.vitalidade, '', dano)}</div>
    <div class="hud-item"><span class="rot">Vontade</span>${
      pips(d.vontade - (f.danoVontade || 0), d.vontade, '', f.danoVontade || 0)}</div>
    <div class="hud-item"><span class="rot">Humanidade</span>${pips(d.humanidade, 10, 'hum')}</div>`;
}

function abasHTML() {
  return ABAS_DOCA.map(a => {
    const n = a.conta ? a.conta() : null;
    return `
    <div class="doca-aba ${M.aba === a.id ? 'on' : ''}" data-mesa="aba" data-id="${a.id}">
      ${a.rotulo}${n ? `<span class="n">${n}</span>` : ''}
    </div>`;
  }).join('');
}

function corpoDocaHTML() {
  return ({
    ficha: docaFicha, estado: docaEstado, bolsa: docaBolsa,
    locais: docaLocais, pessoas: docaPessoas,
    historia: docaHistoria, registro: docaRegistro
  }[M.aba] || docaFicha)();
}

function fluxoHTML() {
  return M.mensagens.map(msgHTML).join('')
    + (mesaOcupada ? `<div class="msg narrador"><div class="escrevendo">
        <i></i><i></i><i></i> O Narrador escreve</div></div>` : '');
}

/* ------------------------------------------------------------
   O COMPOSITOR  (§57)

   Uma caixa só. Antes eram quatro botões de modo, e o jogador
   tinha de decidir o que ia escrever antes de escrever — o que
   partia em dois um turno que na mesa é um só.

   O que sumiu daqui não sumiu do jogo: modo, volume e alvo
   continuam existindo, e continuam chegando no Árbitro e no
   Narrador. Eles passaram a ser LIDOS do texto, e não escolhidos
   antes dele.

   A linha de leitura embaixo mostra o que foi entendido, e deixa
   corrigir volume e alvo quando há fala. Ela é o contrário de um
   formulário: só aparece o que o texto pediu.
   ------------------------------------------------------------ */

const DELIMITADOR = { agir: '* *', examinar: '* *', falar: '“ ”', perguntar: '‘ ’' };

/* A leitura do que está sendo digitado. É recalculada a cada tecla,
   e é barata: o segmentador é uma varredura de caracteres. */
function leituraDoRascunho() {
  const pessoas = M.volumeManual === 'mensagem' ? pessoasComContato() : pessoasNaCena();
  return Entrada.segmentar(M.rascunho || '', { pessoas });
}

/* Volume e alvo efetivos: o que o texto disse, a não ser que o
   jogador tenha corrigido à mão nesta mesma mensagem. */
function volumeEfetivo(seg) {
  return M.volumeManual || (seg.fala ? seg.volume : 'normal');
}
function alvoEfetivo(seg) {
  return M.alvoManual || (seg.fala ? seg.alvo : 'geral');
}

function leituraHTML() {
  const seg = leituraDoRascunho();
  if (!seg.segmentos.length) {
    return `<span class="leitura-vazia">aspas viram fala · parênteses viram pergunta ao Narrador</span>`;
  }

  const rotulo = { acao: 'ação', fala: 'fala', meta: 'ao Narrador' };
  const trilha = seg.segmentos.map(s =>
    `<span class="leitura-parte ${s.tipo}">${rotulo[s.tipo]}</span>`).join('<i>›</i>');

  if (!seg.fala) return `<div class="leitura-trilha">${trilha}</div>`;

  const vol = volumeEfetivo(seg);
  const alvoId = alvoEfetivo(seg);
  const lista = vol === 'mensagem' ? pessoasComContato() : pessoasNaCena();

  return `
    <div class="leitura-trilha">${trilha}</div>
    <div class="leitura-fala">
      <div class="volumes">
        ${Object.entries(Arbitro.VOLUMES).map(([id, v]) => `
          <span class="vol ${vol === id ? 'on' : ''}" data-mesa="volume" data-id="${id}"
            title="${esc(v.nota)}">${esc(v.nome)}</span>`).join('')}
      </div>
      <select class="alvo-fala" data-mesa-campo="alvoManual">
        <option value="geral" ${alvoId === 'geral' ? 'selected' : ''}>${
          vol === 'mensagem' ? 'Ninguém em especial' : 'Todos na cena'}</option>
        ${lista.map(p => `<option value="${p.id}" ${alvoId === p.id ? 'selected' : ''}>${
          esc(p.nome)}</option>`).join('')}
      </select>
      ${M.volumeManual || M.alvoManual
        ? '<span class="leitura-nota corrigido">corrigido à mão</span>'
        : '<span class="leitura-nota">lido do seu texto</span>'}
    </div>`;
}

function compositorHTML() {
  return `
    <div class="caixa-envio">
      <textarea id="entrada" rows="1" placeholder="${esc(DICA_ENTRADA)}"
        ${mesaOcupada ? 'disabled' : ''}>${esc(M.rascunho)}</textarea>
      <div class="ajuda-entrada">
        <button class="btn-exemplo" type="button" aria-describedby="exemplo-balao"
          ${mesaOcupada ? 'disabled' : ''}>Como escrever</button>
        <div class="exemplo-balao" id="exemplo-balao" role="tooltip">
          <div class="exemplo-titulo">Um turno inteiro numa mensagem só</div>
          <pre>${esc(EXEMPLO_ENTRADA.texto)}</pre>
          <ul>
            ${EXEMPLO_ENTRADA.regras.map(r =>
              `<li><b>${esc(r.marca)}</b> ${esc(r.vira)}</li>`).join('')}
          </ul>
          <div class="exemplo-nota">${esc(EXEMPLO_ENTRADA.nota)}</div>
        </div>
      </div>
      <button class="btn-enviar" data-mesa="enviar" ${mesaOcupada ? 'disabled' : ''} title="Enviar">▲</button>
    </div>
    <div class="leitura" id="leitura">${leituraHTML()}</div>
    <div class="dica-envio">
      <span>Enter envia · Shift+Enter quebra linha</span>
      <span>${esc(M.ficha.nome)}</span>
    </div>`;
}

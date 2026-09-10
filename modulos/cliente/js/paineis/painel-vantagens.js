/* ============================================================
   VITÆ — Painel VII: As Amarras (Vantagens e Defeitos)
   Um dos nove painéis que `criador-paineis.js` reunia num arquivo
   só. `campoSeita` continua no arquivo-tronco — é usada aqui e por
   `detalheSeita` (painel-cronica.js).
   ============================================================ */

function painelVantagens() {
  const vt = totalVantagens(S), dt = totalDefeitos(S);

  /* §91 — "Nenhum sangue-ralo pode comprar Laço, Mawla, Lacaios ou
     Status durante a criação de personagem" (pág. 149). Barrar em vez
     de esconder: o Antecedente continua existindo, e a tela diz por
     que ele não está ao alcance agora. */
  const ehRalo = !!(clan() && clan().sangueFraco);
  const antHTML = ANTECEDENTES.map(a => {
    const vedado = ehRalo && ANTECEDENTES_VEDADOS_A_SANGUE_RALO.includes(a.id);
    return `
    <div class="linha-traco ${vedado ? 'apagado' : ''}">
      <span class="traco-nome">${a.nome}<small>${esc(vedado
        ? 'Sangue-ralo não compra este na criação (pág. 149).' : a.desc)}</small></span>
      ${vedado ? '<span class="quiet">—</span>'
               : pontosHTML(S.antecedentes[a.id] || 0, a.max, `ant:${a.id}`, true)}
    </div>`;
  }).join('');

  const merHTML = MERITOS.map(m => {
    const atual = S.meritos[m.id] || 0;
    return `
    <div class="linha-traco">
      <span class="traco-nome">${m.nome}${m.brasil ? ' <span class="gold" title="Específico do cenário brasileiro">✦</span>' : ''}
        <small>${esc(m.desc)}</small></span>
      <div class="chips" style="margin:0">
        ${m.custos.map(c => `<span class="chip ${atual === c ? 'on' : ''}"
          data-acao="merito" data-id="${m.id}" data-valor="${c}">${c}</span>`).join('')}
      </div>
    </div>`;
  }).join('');

  const defHTML = DEFEITOS.map(m => {
    const atual = S.defeitos[m.id] || 0;
    return `
    <div class="linha-traco">
      <span class="traco-nome">${m.nome}${m.brasil ? ' <span class="gold">✦</span>' : ''}
        <small>${esc(m.desc)}</small></span>
      <div class="chips" style="margin:0">
        ${m.custos.map(c => `<span class="chip ${atual === c ? 'on' : ''}"
          data-acao="defeito" data-id="${m.id}" data-valor="${c}">${c}</span>`).join('')}
      </div>
    </div>`;
  }).join('');

  const p = predador();

  return `
  <div class="painel-cabeca">
    <div class="num">Passo ${numeroDoPasso('vantagens')}</div>
    <h2>As Amarras — o que te prende ao mundo</h2>
    <p>Distribua <b class="gold">7 pontos</b> entre Antecedentes e Méritos, e escolha
    <b class="blood-text">2 pontos</b> de Defeitos. Cada vantagem é uma corda; cada defeito é onde ela roça.</p>
  </div>
  <div class="cotas">
    <span class="cota ${vt === 7 ? 'ok' : vt > 7 ? 'excedeu' : ''}"><b>${vt}/7</b> pontos de vantagem</span>
    <span class="cota ${dt === 2 ? 'ok' : dt > 2 ? 'excedeu' : ''}"><b>${dt}/2</b> pontos de defeito</span>
  </div>
  ${p && (p.vantagens.length || p.defeitos.length) ? `
  <div class="caixa ouro"><h4>Já concedido pelo Predador ${esc(p.nome)} (fora do orçamento)</h4>
    <p>${[...p.vantagens, ...p.defeitos].map(v => esc(v.nome)).join(' · ')}</p></div>` : ''}

  <h3 class="sub mt2" style="margin-bottom:.6rem">Antecedentes</h3>
  <div class="cartao">${antHTML}</div>

  <h3 class="sub mt2" style="margin-bottom:.6rem">Méritos</h3>
  <div class="cartao">${merHTML}</div>

  <h3 class="sub mt2" style="margin-bottom:.6rem">Defeitos</h3>
  <div class="cartao">${defHTML}</div>

  ${blocoGrupoHTML()}`;
}

function blocoGrupoHTML() {
  if (!S.seita) return '';
  const pf = perfil();
  const g = pf.grupo;
  if (!g.chave) return '';
  const d = dadosSeita();
  const raiz = `seitaDados.${pf.id}`;
  const impostos = Seitas.defeitosImpostos(S);

  const corpos = {
    circulo: () => `
      <div class="grade g2">
        ${campoSeita('Nome do Círculo', `${raiz}.circulo.nome`, 'Como chamam vocês')}
        ${campoSeita('Seu papel', `${raiz}.circulo.papel`, 'O que você faz que ninguém mais faz')}
      </div>
      <p class="quiet">${esc(g.desc)}</p>`,

    baronia: () => {
      const lista = (chave, titulo, vazio) => {
        const itens = d[chave] || [];
        const linhas = itens.map((fv, i) => `
          <div class="linha-traco" style="align-items:flex-start;gap:.6rem">
            <div style="flex:1">
              <input data-caminho="${raiz}.${chave}.${i}.com" value="${esc(fv.com || '')}" placeholder="Com quem">
              <input data-caminho="${raiz}.${chave}.${i}.o_que" value="${esc(fv.o_que || '')}" placeholder="O quê" style="margin-top:.3rem">
              <input data-caminho="${raiz}.${chave}.${i}.prazo" value="${esc(fv.prazo || '')}" placeholder="Prazo, se houver" style="margin-top:.3rem">
              <div class="chips" style="margin-top:.3rem">${FAVORES_SUGERIDOS.map(s => `
                <span class="chip" data-acao="sugerefavor" data-id="${chave}:${i}" data-valor="${esc(s)}">${esc(s)}</span>`).join('')}</div>
            </div>
            <button class="btn fantasma" data-acao="delfavor" data-id="${chave}:${i}">Remover</button>
          </div>`).join('');
        return `<h3 class="sub" style="margin:.9rem 0 .4rem">${titulo}</h3>
          <div class="cartao">${linhas || `<p class="quiet">${vazio}</p>`}
          <button class="btn" data-acao="addfavor" data-id="${chave}" style="margin-top:.6rem">Adicionar</button></div>`;
      };
      return `
      <p class="quiet">${esc(g.desc)} Favor é a moeda do Movimento: o Diretor usa cada linha
      destas como gatilho pronto.</p>
      ${lista('favoresDevidos', 'Favores que você deve', 'Nenhum. Ou você é novo, ou está mentindo.')}
      ${lista('favoresACobrar', 'Favores a cobrar', 'Ninguém te deve nada ainda.')}`;
    },

    matilha: () => {
      const grupo = Matilha.de(S);
      const arenaAtual = (grupo && grupo.arena) || d.arena || {};
      const pontos = grupo ? grupo.pontosMatilha : (d.pontosMatilha || 1);
      const vinculum = grupo ? grupo.vinculum : (d.vinculum || 0);

      const arena = TRACOS_ARENA.map(t => `
        <div class="linha-traco">
          <span class="traco-nome">${t.nome}<small>${esc(t.desc)}</small></span>
          ${pontosHTML(arenaAtual[t.id] || 0, 5, `arena:${t.id}`, true)}
        </div>`).join('');
      const gasto = TRACOS_ARENA.reduce((a, t) => a + (arenaAtual[t.id] || 0), 0);
      const vinc = [1, 2, 3].map(n => `
        <span class="chip ${vinculum === n ? 'on' : ''}" data-acao="vinculum" data-valor="${n}">Força ${n}</span>`).join('');

      const membros = !grupo
        ? '<p class="quiet">Dê um nome à matilha no passo I para registrá-la.</p>'
        : grupo.membros.map((m, i) => `
            <div class="linha-traco">
              <span class="traco-nome">${esc(m.nome)}<small>${
                esc(m.papel || (m.tipo === 'jogador' ? 'você' : 'irmão de matilha'))}</small></span>
              ${m.tipo === 'jogador' ? '<span class="quiet">você</span>'
                : `<button class="btn fantasma" data-acao="delmembro" data-id="${i}">Remover</button>`}
            </div>`).join('')
          + '<button class="btn" data-acao="addmembro" style="margin-top:.6rem">Adicionar irmão de matilha</button>';

      return `
      <p class="quiet">${esc(g.desc)} A matilha começa com <b class="gold">1 Ponto de Matilha</b>,
      gasto coletivamente. Vinculum, Arena e Pontos vivem num registro da matilha, fora da sua
      ficha, e são compartilhados por todo personagem que entrar nela.</p>
      <div class="cotas">
        <span class="cota ${gasto === pontos ? 'ok' : gasto > pontos ? 'excedeu' : ''}">
          <b>${gasto}/${pontos}</b> pontos de Arena</span>
        <span class="cota"><b>${vinculum}</b> de Vinculum</span>
        <span class="cota"><b>${grupo ? grupo.membros.length : 0}</b> na matilha</span>
      </div>
      <h3 class="sub" style="margin:.9rem 0 .4rem">Membros${grupo ? ' — ' + esc(grupo.nome) : ''}</h3>
      <div class="cartao">${membros}</div>
      <h3 class="sub" style="margin:.9rem 0 .4rem">Traços de Arena</h3>
      <div class="cartao">${arena}</div>
      <h3 class="sub" style="margin:.9rem 0 .4rem">Vinculum</h3>
      <div class="cartao"><div class="chips">${vinc}</div>
        <p class="quiet" style="margin:.6rem 0 0">Sobe 1 a cada Vaulderie, até 3. Em Força 3 você fica
        imune a Laços que não sejam Vinculum. Todos os Laços antigos foram zerados.</p></div>`;
    },

    rede: () => {
      const contratos = (d.contratos || []).map((ct, i) => `
        <div class="linha-traco" style="align-items:flex-start;gap:.6rem">
          <div style="flex:1">
            <input data-caminho="${raiz}.contratos.${i}.cliente" value="${esc(ct.cliente || '')}" placeholder="Cliente">
            <input data-caminho="${raiz}.contratos.${i}.servico" value="${esc(ct.servico || '')}" placeholder="Serviço contratado" style="margin-top:.3rem">
            <input data-caminho="${raiz}.contratos.${i}.preco" value="${esc(ct.preco || '')}" placeholder="Preço combinado" style="margin-top:.3rem">
            <input data-caminho="${raiz}.contratos.${i}.prazo" value="${esc(ct.prazo || '')}" placeholder="Prazo" style="margin-top:.3rem">
            <div class="chips" style="margin-top:.3rem">${SERVICOS_SUGERIDOS.map(s => `
              <span class="chip" data-acao="sugerecontrato" data-id="${i}" data-valor="${esc(s)}">${esc(s)}</span>`).join('')}</div>
          </div>
          <button class="btn fantasma" data-acao="delcontrato" data-id="${i}">Remover</button>
        </div>`).join('');
      const clientes = [0, 1].map(i => `
        <div class="campo"><label>Cliente ${i + 1}</label>
          <input data-caminho="${raiz}.clientes.${i}" value="${esc((d.clientes || [])[i] || '')}" placeholder="Quem paga">
          <div class="chips">${CLIENTES_SUGERIDOS.slice(i * 3, i * 3 + 3).map(s => `
            <span class="chip" data-acao="sugereclientes" data-id="${i}" data-valor="${esc(s)}">${esc(s)}</span>`).join('')}</div>
        </div>`).join('');
      return `
      <p class="quiet">${esc(g.desc)}</p>
      <div class="grade g2">${clientes}</div>
      <h3 class="sub" style="margin:.9rem 0 .4rem">Contratos em aberto</h3>
      <div class="cartao">${contratos || '<p class="quiet">Nenhum. Um Independente sem contrato é um Independente sem proteção.</p>'}
        <button class="btn" data-acao="addcontrato" style="margin-top:.6rem">Adicionar contrato</button></div>`;
    },

    ninguem: () => `
      <p class="quiet">${esc(g.desc)}</p>
      ${campoSeita('Quem procura por você', `${raiz}.motivo`, 'Corte, caçador, credor, parente')}`
  };

  const corpo = (corpos[g.chave] || (() => ''))();
  const imp = impostos.length ? `
    <div class="caixa mt"><h4>Imposto pela seita (fora do orçamento)</h4>
      <p>${impostos.map(x => `${esc(x.nome)}${x.pontos ? ` (${x.pontos})` : ''} — ${esc(x.motivo)}`).join('<br>')}</p></div>` : '';

  return `<hr class="ornamento">
    <h3 class="sub" style="margin-bottom:.6rem">${esc(g.rotulo)}</h3>
    ${corpo}${imp}`;
}

/* ============================================================
   VITÆ — Montagem da ficha sobre o modelo oficial V5 (pt-BR)
   Gera duas folhas Carta prontas para impressão / PDF.
   ============================================================ */

/* ---------- primitivas ---------- */
function ofQuadros(valor, max, mini) {
  let h = `<span class="qbox${mini ? ' mini' : ''}">`;
  for (let i = 1; i <= max; i++) h += `<i class="${i <= valor ? 'on' : ''}"></i>`;
  return h + '</span>';
}

/* Trilhos de dano (Vitalidade, Força de Vontade): as caixas até o valor ficam
   disponíveis para marcar; as demais aparecem apagadas, como no modelo impresso. */
function ofTrilho(valor, max, mini) {
  let h = `<span class="qbox${mini ? ' mini' : ''}">`;
  for (let i = 1; i <= max; i++) h += `<i class="${i <= valor ? '' : 'fora'}"></i>`;
  return h + '</span>';
}

function ofCirculos(valor, max, folgaApos) {
  let h = '<span class="cbox">';
  for (let i = 1; i <= max; i++) {
    if (folgaApos && i === folgaApos + 1) h += '<i class="folga"></i>';
    h += `<i class="${i <= valor ? 'on' : ''}"></i>`;
  }
  return h + '</span>';
}

function ofMarca(pequena) {
  return `<div class="marca-v5${pequena ? ' pequena' : ''}">
    <div class="palavra">VAMPIRO</div>
    <div class="sub">A Máscara</div>
    <div class="ankh">☥</div>
  </div>`;
}

/* ---------- folha 1 ---------- */
function ofFolha1(F) {
  const c = claDe(F.cla), p = predadorDe(F.predador), d = derivados(F);

  const cabecalho = `
  <table class="of-tabela">
    <tr>
      <td style="width:34%"><span class="rot-mini">Nome</span><span class="val-campo">${esc(F.nome)}</span></td>
      <td style="width:33%"><span class="rot-mini">Conceito</span><span class="val-campo">${esc(F.conceito)}</span></td>
      <td style="width:33%"><span class="rot-mini">Predador</span><span class="val-campo">${esc(p?.nome || '')}</span></td>
    </tr>
    <tr>
      <td><span class="rot-mini">Sexo</span><span class="val-campo">${esc(nomeSexo(F.sexo))}</span></td>
      <td><span class="rot-mini">Ambição</span><span class="val-campo pequeno">${esc(F.ambicao)}</span></td>
      <td><span class="rot-mini">Clã</span><span class="val-campo">${esc(c?.nome || '')}</span></td>
    </tr>
    <tr>
      <td><span class="rot-mini">Senhor</span><span class="val-campo">${esc(F.senhor)}</span></td>
      <td><span class="rot-mini">Desejo</span><span class="val-campo pequeno">${esc(F.desejo)}</span></td>
      <td><span class="rot-mini">Geração</span><span class="val-campo">${esc(F.geracao)}ª</span></td>
    </tr>
  </table>`;

  const atributos = `
  <div class="atr-grade">
    ${Object.entries(ATRIBUTOS).map(([k, g]) => `
      <div>
        <div class="atr-grupo-tit">${g.rotulo}</div>
        ${g.lista.map(a => `
          <div class="atr-linha">
            <span class="nome">${a.nome}</span>
            ${ofQuadros(F.atributos[a.id] || 0, 5)}
          </div>`).join('')}
      </div>`).join('')}
  </div>
  <div class="vitais-linha">
    <div class="bloco"><span class="rot">Vitalidade</span>${ofTrilho(d.vitalidade, 10, true)}</div>
    <div class="bloco"><span class="rot">Força de Vontade</span>${ofTrilho(d.vontade, 10, true)}</div>
  </div>`;

  const habilidades = `
  <div class="hab-grade">
    ${Object.entries(HABILIDADES).map(([k, g]) => `
      <div>
        ${g.lista.map(h => {
          const espec = F.especializacoes[h.id];
          return `
          <div class="hab-linha">
            <span class="nome">${h.nome}</span>
            <span class="leader">${espec ? `<span>${esc(espec)}</span>` : ''}</span>
            ${ofQuadros(F.habilidades[h.id] || 0, 5)}
          </div>`;
        }).join('')}
      </div>`).join('')}
  </div>`;

  /* Disciplinas: 6 blocos (3 colunas × 2 linhas), 5 linhas de poder cada */
  const blocos = [];
  Object.entries(F.disciplinas).filter(([, v]) => v > 0).forEach(([id, v]) => {
    blocos.push({ nome: DISCIPLINAS[id]?.nome || id, nivel: v, poderes: F.poderes[id] || [] });
  });
  if (F.rituais.length) {
    blocos.push({ nome: 'Rituais', nivel: 0, poderes: F.rituais, semPontos: true });
  }
  while (blocos.length < 6) blocos.push({ nome: '', nivel: 0, poderes: [], vazio: true });

  const blocoHTML = (b) => `
    <div class="disc-cab">
      <span class="nome">${esc(b.nome)}</span>
      ${b.semPontos || b.vazio ? '' : ofQuadros(b.nivel, 5, true)}
    </div>
    ${Array.from({ length: 5 }, (_, i) => `
      <div class="disc-item${b.poderes[i] ? '' : ' vazio'}">${esc(b.poderes[i] || '·')}</div>`).join('')}`;

  const disciplinas = `
  <div class="disc-grade">
    ${[0, 1, 2].map(col => `
      <div class="disc-col">
        ${blocoHTML(blocos[col])}
        ${blocoHTML(blocos[col + 3])}
      </div>`).join('')}
  </div>`;

  const r = RESSONANCIAS.find(x => x.id === F.ressonancia);
  const rodape = `
  <div class="rodape-1">
    <div class="grupo" style="flex:1">
      <span class="rot">Ressonância</span>
      <span class="leader">${esc(r?.nome || '')}${(() => {
        /* O temperamento é o que dá o dado (pág. 228) — imprimir só a
           Ressonância é imprimir metade do fato. (§67) */
        const t = Ressonancia.temperamentoPor(F.temperamento);
        return t && t.id !== 'nenhum' ? ` · ${t.nome}` : '';
      })()}</span>
    </div>
    <div class="grupo"><span class="rot">Fome</span>${ofQuadros(F.fome, 5)}</div>
    <div class="grupo"><span class="rot">Humanidade</span>${ofQuadros(d.humanidade, 10, true)}</div>
  </div>`;

  return `
  <div class="folha">
    <div class="folha-corpo">
      ${ofMarca(false)}
      ${cabecalho}
      <div class="sec-tit">Atributos</div><hr class="sec-regua">
      ${atributos}
      <div class="sec-tit">Habilidades</div><hr class="sec-regua">
      ${habilidades}
      <div class="sec-tit">Disciplinas</div><hr class="sec-regua">
      ${disciplinas}
      ${rodape}
    </div>
    <div class="credito">© 2021 White Wolf Entertainment · ficha montada com VITÆ</div>
  </div>`;
}

/* ---------- folha 2 ---------- */
function notasDaSeita(F) {
  if (!F.seita) return [];
  const pf = perfilDe(F);
  const d = (F.seitaDados || {})[pf.id] || {};
  const linhas = [`${esc(pf.nome)} — ${esc(Seitas.resumo(F, typeof Matilha !== 'undefined' ? Matilha.de(F) : null) || '—')}`];

  if (pf.id === 'sabbat') {
    const cam = CAMINHOS.find(c => c.id === d.caminho);
    if (cam) linhas.push(`Caminho: ${esc(cam.nome)} · Compulsão ${esc(cam.compulsao.nome)}`);
    const t = TIPOS_MATILHA.find(x => x.id === (d.matilha || {}).tipo);
    if (t) linhas.push(`Tipo de matilha: ${esc(t.nome)}`);
    if ((d.matilha || {}).sacerdote) linhas.push(`Sacerdote: ${esc(d.matilha.sacerdote)}`);
    if ((d.matilha || {}).ductus) linhas.push(`Ductus: ${esc(d.matilha.ductus)}`);
    linhas.push(`Vinculum ${d.vinculum || 0} · Pontos de Matilha ${d.pontosMatilha || 0}`);
    const a = d.arena || {};
    linhas.push(`Arena: Perambulação ${a.perambulacao || 0} · Alcance ${a.alcance || 0} · Prestígio ${a.prestigio || 0}`);
    linhas.push(`Refúgio ${d.refugioComunal === false ? 'pessoal' : 'comunal'}`);
  }
  if (pf.id === 'anarquistas') {
    const t = TIPOS_BARONIA.find(x => x.id === (d.baronia || {}).tipo);
    if (t) linhas.push(`Baronia: ${esc(t.nome)}${(d.baronia || {}).bairro ? ' — ' + esc(d.baronia.bairro) : ''}`);
    const pa = PAPEIS_BARONIA.find(x => x.id === d.papel);
    if (pa) linhas.push(`Papel: ${esc(pa.nome)}`);
    (d.favoresDevidos || []).filter(x => x && x.o_que)
      .forEach(x => linhas.push(`Deve a ${esc(x.com || 'alguém')}: ${esc(x.o_que)}`));
    (d.favoresACobrar || []).filter(x => x && x.o_que)
      .forEach(x => linhas.push(`A cobrar de ${esc(x.com || 'alguém')}: ${esc(x.o_que)}`));
  }
  if (pf.id === 'independente') {
    const n = NEGOCIOS.find(x => x.id === d.negocio);
    if (d.linhagem) linhas.push(`Linhagem: ${esc(d.linhagem)}`);
    if (n) linhas.push(`Negócio: ${esc(n.nome)}`);
    (d.clientes || []).filter(Boolean).forEach(c => linhas.push(`Cliente: ${esc(c)}`));
    (d.contratos || []).filter(x => x && x.servico)
      .forEach(x => linhas.push(`Contrato: ${esc(x.servico)}${x.prazo ? ' — ' + esc(x.prazo) : ''}`));
  }
  if (pf.id === 'camarilla' && d.cargo && d.cargo !== 'Nenhum') linhas.push(`Cargo: ${esc(d.cargo)}`);
  if (pf.id === 'nenhuma' && d.ultimaCorte) linhas.push(`Última corte: ${esc(d.ultimaCorte)}`);
  return linhas;
}

function ofFolha2(F) {
  const c = claDe(F.cla), p = predadorDe(F.predador), d = derivados(F), cid = cidadeDe(F.cidade);
  const seita = SEITAS.find(s => s.id === F.seita);

  /* Princípios da Crônica */
  const principios = F.principios
    ? esc(F.principios).replace(/\n/g, '<br>')
    : [
        cid ? `Domínio: ${esc(cid.nome)}` : '',
        seita ? `Seita: ${esc(seita.nome)}` : '',
        cid ? `Poder local: ${esc(cid.poder)}` : '',
        cid ? `Príncipe: ${esc(cid.principe)}` : ''
      ].filter(Boolean).map(t => `<p>${t}</p>`).join('');

  /* Pilares & Convicções */
  const pf = perfilDe(F);
  const dSeita = F.seita ? (F.seitaDados || {})[pf.id] || {} : {};
  const ancoraDe = (i) => {
    if (pf.ancoras.tipo !== 'ritae') return F.marcos[i] || '—';
    const r = RITAE.find(x => x.id === (dSeita.conviccoesRitae || [])[i]);
    const imp = (dSeita.implementos || [])[i];
    return (r ? r.nome : '—') + (imp ? ` — ${imp}` : '');
  };
  const pilares = F.conviccoes.map((cv, i) => cv
    ? `<p>${esc(cv)}<br><span class="marco">${esc(pf.ancoras.rotulo)}: ${esc(ancoraDe(i))}</span></p>`
    : '').join('') || '<p>—</p>';

  /* Perdição do Clã */
  const perdicao = c ? `
    <p><b>${esc(c.maldicao.nome)}</b></p>
    <p>${esc(c.maldicao.texto)}</p>
    <p style="margin-top:.06in"><b>Compulsão — ${esc(c.compulsao.nome)}</b></p>
    <p>${esc(c.compulsao.texto)}</p>` : '<p>—</p>';

  /* Vantagens & Defeitos — 11 linhas */
  const linhas = [];
  ANTECEDENTES.filter(a => F.antecedentes[a.id]).forEach(a =>
    linhas.push({ nome: a.nome, pontos: F.antecedentes[a.id], max: a.max }));
  MERITOS.filter(m => F.meritos[m.id]).forEach(m =>
    linhas.push({ nome: m.nome, pontos: F.meritos[m.id] }));
  if (p) p.vantagens.forEach(v => linhas.push({ nome: v.nome, pontos: v.pontos, tag: 'predador' }));
  DEFEITOS.filter(m => F.defeitos[m.id]).forEach(m =>
    linhas.push({ nome: m.nome, pontos: F.defeitos[m.id], tag: 'defeito' }));
  if (p) p.defeitos.forEach(v => linhas.push({ nome: v.nome, pontos: v.pontos, tag: 'defeito · predador' }));
  Seitas.defeitosImpostos(F).forEach(v => linhas.push({ nome: v.nome, pontos: v.pontos, tag: 'defeito · seita' }));
  while (linhas.length < 11) linhas.push({ nome: '', pontos: 0, vazio: true });

  const vantagens = linhas.slice(0, 11).map(l => `
    <div class="vd-linha">
      <span class="nome">${esc(l.nome)}${l.tag ? ` <span class="tag">(${esc(l.tag)})</span>` : ''}</span>
      ${ofCirculos(l.pontos || 0, l.max && l.max > 5 ? 5 : 5)}
    </div>`).join('');

  /* Potência de Sangue */
  const bp = Escudo.POTENCIA_SANGUE[Math.min(d.potencia, 10)] || Escudo.POTENCIA_SANGUE[1];
  const potencia = `
  <div class="ps-cab">
    <span class="rot">Potência de Sangue</span>
    ${ofCirculos(d.potencia, 10, 5)}
  </div>
  <table class="of-tabela">
    <tr>
      <td style="width:50%"><span class="rot-mini">Surto de Sangue</span><span class="val-campo pequeno">${esc(bp.surto)}</span></td>
      <td style="width:50%"><span class="rot-mini">Quantidade Recuperada</span><span class="val-campo pequeno">${esc(bp.recuperada)}</span></td>
    </tr>
    <tr>
      <td><span class="rot-mini">Bônus de Poder</span><span class="val-campo pequeno">${esc(bp.bonusDisciplina)}</span></td>
      <td><span class="rot-mini">Rerrolagem de Sangue</span><span class="val-campo pequeno">${esc(bp.rerrolagem)}</span></td>
    </tr>
    <tr>
      <td><span class="rot-mini">Penalidade de Alimentação</span><span class="val-campo pequeno">${esc(bp.penalidade)}</span></td>
      <td><span class="rot-mini">Gravidade da Perdição</span><span class="val-campo pequeno">${esc(bp.perdicao)}</span></td>
    </tr>
  </table>`;

  const bio = `
  <div class="bio-linha"><span class="rot">Idade Verdadeira</span><span class="val">${esc(F.idadeVerdadeira || '')}</span></div>
  <div class="bio-linha"><span class="rot">Idade Aparente</span><span class="val">${esc(F.idadeAparente || '')}</span></div>
  <div class="bio-linha"><span class="rot">Data de Nascimento</span><span class="val">${esc(F.dataNascimento || '')}</span></div>
  <div class="bio-linha"><span class="rot">Data de Morte</span><span class="val">${esc(F.dataMorte || '')}</span></div>
  <div class="bio-linha alta"><span class="rot">Aparência</span><span class="val">${esc(F.aparencia || '')}</span></div>
  <div class="bio-linha alta"><span class="rot">Traços Distintivos</span><span class="val">${esc(F.tracos || '')}</span></div>
  <div class="bio-linha altissima"><span class="rot">História</span><span class="val">${esc(F.historia || '')}</span></div>`;

  const notas = [
    ...notasDaSeita(F),
    p ? `Caçada: ${esc(p.teste)}` : '',
    F.predadorEspec ? `Especialização do Predador: ${esc(nomeHabilidade(F.predadorEspec.split('|')[0]) + ' — ' + F.predadorEspec.split('|')[1])}` : '',
    F.jogador ? `Jogador: ${esc(F.jogador)}` : '',
    F.notas ? esc(F.notas).replace(/\n/g, '<br>') : ''
  ].filter(Boolean).map(t => `<p>${t}</p>`).join('');

  return `
  <div class="folha">
    <div class="folha-corpo">
      ${ofMarca(true)}
      <div class="p2-tris">
        <div class="cab">Princípios da Crônica</div>
        <div class="cab">${esc(pf.ancoras.plural)} &amp; Convicções</div>
        <div class="cab">Perdição do Clã</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr">
        <div class="p2-caixa">${principios}</div>
        <div class="p2-caixa">${pilares}</div>
        <div class="p2-caixa">${perdicao}</div>
      </div>

      <div class="p2-colunas">
        <div>
          <div class="sec-tit" style="margin-top:.08in">Vantagens &amp; Defeitos</div>
          ${vantagens}
        </div>
        <div>
          <div style="margin-top:.14in">${potencia}</div>
          <div class="xp-linha"><span class="rot">Experiência Total</span>
            <span class="leader">${esc(F.xpTotal || '')}</span></div>
          <div class="xp-linha"><span class="rot">Experiência Gasta</span>
            <span class="leader">${esc(F.xpGasta || '')}</span></div>
        </div>
      </div>

      <div class="p2-colunas p2-fundo">
        <div class="notas-caixa"><span class="rot">Notas</span><span class="val">${notas}</span></div>
        <div class="bio-coluna">${bio}</div>
      </div>
    </div>
    <div class="credito">© 2021 White Wolf Entertainment · ficha montada com VITÆ</div>
  </div>`;
}

/* ---------- montagem ---------- */
function fichaOficialHTML(F) {
  return `<div class="oficial">${ofFolha1(F)}${ofFolha2(F)}</div>`;
}

/* Ajusta a escala da pré-visualização à largura disponível */
function ajustarEscalaOficial() {
  const palco = document.querySelector('.oficial-palco');
  if (!palco) return;
  const largura = palco.clientWidth;
  const alvo = 8.5 * 96; // 8.5in em px CSS
  const escala = Math.min(1, (largura - 8) / alvo);
  palco.style.setProperty('--escala', escala);
  const oficial = palco.querySelector('.oficial');
  if (oficial) palco.style.height = (oficial.scrollHeight * escala + 24) + 'px';
}
window.addEventListener('resize', ajustarEscalaOficial);

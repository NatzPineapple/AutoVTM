/* ============================================================
   VITÆ — Ferramentas comuns dos painéis do criador
   ------------------------------------------------------------
   Até aqui, os nove painéis do criador moravam neste arquivo só,
   num único `.js` de mais de 1200 linhas. O README registrava essa
   decisão como fechada (N5/N6, §16.2): "sem framework, dividir
   seria mover template string de um arquivo para outro — o que há
   neles é HTML, não acoplamento". Essa decisão foi revista a
   pedido do usuário nesta sessão, e os nove painéis viraram nove
   arquivos em `paineis/`.

   O que sobrou aqui é só o que mais de um painel usa:

     numeroDoPasso()   todo painel com "Passo N" no cabeçalho
     pontosHTML()      atributos, habilidades, disciplinas,
                       vantagens (Arena da matilha), ficha
     campoSeita()      painel-cronica.js E painel-vantagens.js

   Um helper usado por um painel SÓ mora dentro dele (por exemplo
   `medidorHTML` foi para painel-ficha.js, `avisoFalta` para
   painel-disciplinas.js). Se um segundo painel passar a precisar
   dele, ele sobe para cá — mesmo critério, ao contrário.

   Continua sendo script clássico: sem `export`, tudo em escopo
   global. A ordem entre este arquivo e os de `paineis/` não
   importa para o carregamento (nenhum painel é chamado no TOPO de
   outro arquivo, só de dentro de função — ver `ordem-de-carga.mjs`
   para a ordem registrada mesmo assim).
   ============================================================ */

/* O número do passo é DERIVADO da ordem em `PASSOS` (§71).

   Estava escrito à mão em cada painel — "Passo IV", "Passo V" — e
   reordenar a trilha significava caçar os cinco e acertar todos. Uma
   segunda lista para o mesmo fato, que é a lição de sempre. */
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
function numeroDoPasso(id) {
  const i = (typeof PASSOS !== 'undefined') ? PASSOS.findIndex(p => p.id === id) : -1;
  return i >= 0 ? ROMANOS[i] : '';
}

function pontosHTML(valor, max, onclick, compacto, travado) {
  let h = `<div class="pontos${compacto ? ' compacto' : ''}">`;
  for (let i = 1; i <= max; i++) {
    h += `<span class="ponto${i <= valor ? ' cheio' : ''}${travado ? ' travado' : ''}"
            data-acao="${travado ? '' : onclick}" data-valor="${i}" title="${i}"></span>`;
  }
  return h + '</div>';
}

function campoSeita(rotulo, caminho, placeholder, dica) {
  return `<div class="campo"><label>${rotulo}</label>
    <input data-caminho="${caminho}" value="${esc(lerEm(S, caminho) || '')}" placeholder="${esc(placeholder || '')}">
    ${dica ? `<div class="dica">${dica}</div>` : ''}</div>`;
}

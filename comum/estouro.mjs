/* ============================================================
   VITÆ — "isto foi um estouro de tempo, ou o outro lado não existe?"
   (§98)

   Duas causas muito diferentes chegam ao mesmo `catch` de um `fetch`:

     · o outro lado NÃO EXISTE  → responder 503, e dizer como subi-lo
     · o outro lado DEMOROU     → responder 504, e não mandar subir
                                   nada, porque já está de pé

   Confundir as duas foi o defeito da §97, e ele custou duas rodadas de
   teste do jogador: quatro linhas de erro iguais no registro de
   tráfego, quando eram dois problemas distintos.

   A parte que engana é que **o `fetch` do Node às vezes embrulha o
   estouro**: chega um `TypeError: fetch failed` com o `TimeoutError`
   escondido no `cause`. Quem olha só o nome de fora vê "fetch failed" e
   conclui "está fora do ar" — que é exatamente o disfarce que a §97
   foi consertar.

   Mora num arquivo próprio, e não dentro do `proxy.mjs`, pela razão da
   §91 e da §92: **regra escondida onde teste não alcança passa em verde
   na mutação**. `proxy.mjs` sobe um servidor ao ser importado, então
   nada lá dentro é alcançável por teste direto. Aqui é.
   ============================================================ */

/* Os nomes e códigos que significam "desisti de esperar". Os dois
   primeiros são do padrão; os dois últimos são do undici, que é o
   `fetch` de dentro do Node. */
export const NOMES_DE_ESTOURO = ['TimeoutError', 'AbortError'];
export const CODIGOS_DE_ESTOURO = ['UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT',
                                   'ABORT_ERR', 'ETIMEDOUT'];

/** Um erro só, sem olhar o `cause`. */
function estourouAqui(e) {
  if (!e) return false;
  return NOMES_DE_ESTOURO.includes(e.name) || CODIGOS_DE_ESTOURO.includes(e.code);
}

/**
 * Diz se este erro é "demorou demais", inclusive quando ele vem
 * embrulhado em `cause`.
 *
 * Desce a corrente de `cause` porque o embrulho pode ter mais de uma
 * camada, e para com um limite: `cause` circular existe, e um `while`
 * ingênuo aqui penduraria o processo que deveria estar respondendo um
 * erro.
 */
export function foiEstouroDeTempo(erro, profundidade = 5) {
  let atual = erro;
  for (let i = 0; i <= profundidade && atual; i++) {
    if (estourouAqui(atual)) return true;
    atual = atual.cause;
  }
  return false;
}

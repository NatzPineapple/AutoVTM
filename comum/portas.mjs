/* ============================================================
   VITÆ — A tabela de portas
   ------------------------------------------------------------
   A arquitetura modular põe cada módulo num processo com porta
   própria. Sem um lugar só para dizer QUAL porta é de quem, o
   número vai sendo repetido em constantes espalhadas, e o dia em
   que uma delas muda o Gateway passa a encaminhar para o vazio.

   Aqui é esse lugar. Cada porta aceita uma variável de ambiente
   para quem precisa rodar duas cópias na mesma máquina — os
   testes precisam, e é assim que eles evitam brigar com o
   servidor que você deixou aberto.
   ============================================================ */

export const PORTAS = {
  /* Módulo 1 — porta de entrada. É a única que o navegador conhece. */
  gateway:  Number(process.env.PORTA || 5173),
  /* Módulo 2 — fichas fora de sessão (§83). */
  ficha:    Number(process.env.VITAE_PORTA_FICHA || 5174),
  /* Módulo 3 — o estado da mesa ativa. */
  mesa:     Number(process.env.VITAE_PORTA_MESA || 5175),
  /* Módulo 4 — o Árbitro, sem estado. */
  arbitro:  Number(process.env.VITAE_PORTA_ARBITRO || 5176),
  /* Módulo 5 — o Cronista, processo próprio desde a §84. */
  cronista: Number(process.env.VITAE_PORTA_CRONISTA || 5177)
};

/* Todo módulo escuta só no laço local por padrão. Expor na rede é
   decisão consciente, e passa pela mesma variável do proxy. */
export const ENDERECO = process.env.VITAE_ESCUTAR || '127.0.0.1';

export const enderecoDe = (modulo) => `http://127.0.0.1:${PORTAS[modulo]}`;

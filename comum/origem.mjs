/* ============================================================
   VITÆ — De onde o pedido pode vir  (§86, item M6)
   ------------------------------------------------------------
   A mesma regra estava escrita CINCO VEZES: no Gateway e nos
   quatro módulos. Era o item M6, adiado duas vezes por decisão do
   usuário — e ele já cobrou juros uma vez.

   O QUE ELE CUSTOU, na §80: `pararModulo` mandava um cabeçalho
   `Origin` com a porta de Gateway que ELE conhecia, e o módulo
   comparava com a porta de Gateway que ELE conhecia. Iguais quando
   o Gateway sobe o módulo — que herda o ambiente. **Diferentes**
   quando os dois sobem em momentos separados. Dava 403 no pedido
   de encerrar, e o painel dizia "continuou respondendo" sem dizer
   por quê. Duas cópias da mesma regra discordando.

   E havia uma segunda divergência, que ninguém tinha notado: o
   Gateway aceitava `http://[::1]:<sua porta>`, e os módulos
   aceitavam `[::1]` só para a porta do Gateway, não para a
   própria. Abrir um módulo direto por IPv6 era recusado num lado e
   aceito no outro. Nada quebrou por causa disso — mas é
   exatamente a forma que a divergência tem antes de quebrar.

   ------------------------------------------------------------
   A REGRA, AGORA NUM LUGAR SÓ
   ------------------------------------------------------------
   Um pedido de escrita é aceito quando:

     · traz `Origin` e ele é a página do Gateway ou a do próprio
       módulo, em qualquer das três formas de laço local; **ou**
     · não traz `Origin` nenhum e o `Host` é de laço local.

   O segundo caso é o que permite CHAMADA ENTRE MÓDULOS: `fetch`
   de servidor para servidor não manda `Origin`, e não deve mesmo —
   ele não vem de navegador. A garantia ali é o laço local, e é
   ela que de fato importa: quem alcança 127.0.0.1 já está na
   máquina.

   O QUE ISTO NÃO É: autenticação. Não há usuário, não há sessão
   de login, e `Origin` é um cabeçalho que qualquer cliente que não
   seja navegador escolhe mandar ou não. Isto existe contra o CSRF
   da §23 — outra página aberta no MESMO navegador gastando o
   provedor local de quem está jogando —, e para isso serve.
   ============================================================ */

import { PORTAS } from './portas.mjs';

const HOSTS_LOCAIS = ['localhost', '127.0.0.1', '[::1]'];

const HOST_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

/** As origens que uma porta aceita: as dela e as do Gateway. */
export function origensDe(porta) {
  const fora = new Set();
  for (const p of new Set([PORTAS.gateway, Number(porta)].filter(Boolean))) {
    for (const h of HOSTS_LOCAIS) fora.add(`http://${h}:${p}`);
  }
  return fora;
}

/**
 * O pedido veio da própria casa?
 *
 * `porta` é a do módulo que pergunta. O Gateway passa a dele, e o
 * conjunto sai igual ao de antes — ele É o Gateway.
 */
export function daPropriaCasa(req, porta) {
  const origem = req && req.headers ? req.headers.origin : '';
  if (origem) return origensDe(porta).has(origem);
  return HOST_LOCAL.test(String((req && req.headers && req.headers.host) || ''));
}

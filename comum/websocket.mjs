/* ============================================================
   VITÆ — WebSocket, o mínimo do RFC 6455
   ------------------------------------------------------------
   O Gateway precisa manter conexão persistente com o Cliente: a
   mesa tem eventos que NÃO nascem de um pedido do jogador — o
   Cronista tomando iniciativa, o autosave confirmando, o Árbitro
   devolvendo um veredito de uma cadeia que já tinha respondido.
   Com HTTP puro, isso vira o navegador perguntando "e agora?" em
   laço.

   Por que não o pacote `ws`: o protocolo do LADO SERVIDOR, sem
   extensões e sem `permessage-deflate`, é aperto de mão com um
   SHA-1 e um decodificador de quadro. Cabe aqui, é auditável de
   uma sentada, e mantém o projeto sem dependência de execução.

   O QUE ESTE ARQUIVO NÃO FAZ, de propósito:
     · compressão (`permessage-deflate`) — não negocia, e o RFC
       manda ignorar extensão não negociada;
     · quadro maior que `LIMITE` — corta a conexão em vez de
       alocar o que o outro lado mandar;
     · cliente WebSocket. Só servidor.
   ============================================================ */

import crypto from 'node:crypto';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const CONTINUACAO = 0x0, TEXTO = 0x1, BINARIO = 0x2;
const FECHAR = 0x8, PING = 0x9, PONG = 0xA;

/* 1 MiB. Um turno de mesa com a ficha inteira não passa de dezenas
   de KiB; o resto seria alguém tentando esgotar a memória. */
const LIMITE = 1024 * 1024;

export const ehPedidoWebSocket = (req) =>
  String(req.headers.upgrade || '').toLowerCase() === 'websocket' &&
  !!req.headers['sec-websocket-key'];

/* ------------------------------------------------------------
   QUADROS
   ------------------------------------------------------------ */

/** Monta um quadro do servidor: nunca mascarado, nunca fragmentado. */
function montar(opcode, dados) {
  const corpo = Buffer.isBuffer(dados) ? dados : Buffer.from(String(dados), 'utf8');
  const n = corpo.length;
  let cabeca;
  if (n < 126) {
    cabeca = Buffer.alloc(2);
    cabeca[1] = n;
  } else if (n < 65536) {
    cabeca = Buffer.alloc(4);
    cabeca[1] = 126;
    cabeca.writeUInt16BE(n, 2);
  } else {
    cabeca = Buffer.alloc(10);
    cabeca[1] = 127;
    cabeca.writeBigUInt64BE(BigInt(n), 2);
  }
  cabeca[0] = 0x80 | opcode;         /* FIN ligado: um quadro, uma mensagem */
  return Buffer.concat([cabeca, corpo]);
}

/** Lê um quadro do buffer. Devolve null quando ainda não chegou inteiro. */
function ler(buf) {
  if (buf.length < 2) return null;
  const primeiro = buf[0], segundo = buf[1];
  const fim = (primeiro & 0x80) !== 0;
  const opcode = primeiro & 0x0f;
  const mascarado = (segundo & 0x80) !== 0;
  let tamanho = segundo & 0x7f;
  let desloc = 2;

  if (tamanho === 126) {
    if (buf.length < 4) return null;
    tamanho = buf.readUInt16BE(2); desloc = 4;
  } else if (tamanho === 127) {
    if (buf.length < 10) return null;
    const grande = buf.readBigUInt64BE(2);
    if (grande > BigInt(LIMITE)) return { excedeu: true };
    tamanho = Number(grande); desloc = 10;
  }
  if (tamanho > LIMITE) return { excedeu: true };

  /* O RFC exige máscara em todo quadro que vem do cliente. Quadro sem
     máscara aqui é cliente quebrado, ou não é um cliente. */
  if (!mascarado) return { invalido: true };
  if (buf.length < desloc + 4 + tamanho) return null;

  const chave = buf.subarray(desloc, desloc + 4);
  const bruto = buf.subarray(desloc + 4, desloc + 4 + tamanho);
  const corpo = Buffer.allocUnsafe(tamanho);
  for (let i = 0; i < tamanho; i++) corpo[i] = bruto[i] ^ chave[i & 3];

  return { fim, opcode, corpo, consumido: desloc + 4 + tamanho };
}

/* Texto solto que não é JSON é legítimo neste canal, e quem ouve é
   que decide o que fazer com ele — por isso o `null` sai por `return`,
   e não por uma variável atribuída dentro de um `catch` mudo. */
function talvezJSON(texto) {
  try { return JSON.parse(texto); }
  catch (e) { return null; }
}

/* ------------------------------------------------------------
   A CONEXÃO
   ------------------------------------------------------------ */

/**
 * Fecha o aperto de mão e devolve uma conexão simples:
 *   .enviar(objetoOuTexto) · .fechar(codigo, motivo) · .aberta
 *   .aoReceber(fn) · .aoFechar(fn)
 */
export function aceitar(req, socket) {
  const chave = req.headers['sec-websocket-key'];
  const resposta = crypto.createHash('sha1').update(chave + GUID).digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${resposta}\r\n\r\n`
  );
  socket.setNoDelay(true);

  const con = {
    aberta: true,
    /* Quem abriu a conexão pendura aqui o que precisa saber depois —
       a sessão que este soquete está acompanhando, por exemplo. */
    marca: {},
    aoReceber: (fn) => { ouvintes.mensagem = fn; return con; },
    aoFechar:  (fn) => { ouvintes.fim = fn; return con; },
    enviar(dados) {
      if (!con.aberta) return false;
      const texto = typeof dados === 'string' ? dados : JSON.stringify(dados);
      try { socket.write(montar(TEXTO, texto)); return true; }
      catch (e) { console.warn('[ws] envio falhou:', e.message); return false; }
    },
    fechar(codigo = 1000, motivo = '') {
      if (!con.aberta) return;
      con.aberta = false;
      const corpo = Buffer.alloc(2 + Buffer.byteLength(motivo));
      corpo.writeUInt16BE(codigo, 0);
      corpo.write(motivo, 2);
      try { socket.write(montar(FECHAR, corpo)); } catch (e) { console.warn('[ws] adeus não saiu:', e.message); }
      socket.end();
    }
  };

  const ouvintes = { mensagem: null, fim: null };
  let acumulado = Buffer.alloc(0);
  /* Mensagem fragmentada: o cliente pode partir um texto em vários
     quadros, e o primeiro é quem diz o tipo. */
  let partes = [], tipoDaMensagem = null;

  const encerrar = (motivo) => {
    if (!con.aberta) return;
    con.aberta = false;
    if (ouvintes.fim) ouvintes.fim(motivo);
  };

  socket.on('data', (pedaco) => {
    acumulado = Buffer.concat([acumulado, pedaco]);
    if (acumulado.length > LIMITE * 2) { con.fechar(1009, 'grande demais'); return; }

    for (;;) {
      const q = ler(acumulado);
      if (!q) return;
      if (q.excedeu)  { con.fechar(1009, 'grande demais'); return; }
      if (q.invalido) { con.fechar(1002, 'quadro sem máscara'); return; }
      acumulado = acumulado.subarray(q.consumido);

      if (q.opcode === FECHAR) { con.fechar(1000, ''); encerrar('adeus'); return; }
      if (q.opcode === PING)   { try { socket.write(montar(PONG, q.corpo)); } catch (e) { console.warn('[ws] pong não saiu:', e.message); } continue; }
      if (q.opcode === PONG)   continue;

      if (q.opcode === TEXTO || q.opcode === BINARIO) { partes = [q.corpo]; tipoDaMensagem = q.opcode; }
      else if (q.opcode === CONTINUACAO) { partes.push(q.corpo); }
      else { con.fechar(1002, 'opcode desconhecido'); return; }

      if (!q.fim) continue;
      const inteiro = Buffer.concat(partes);
      partes = [];
      if (tipoDaMensagem === TEXTO && ouvintes.mensagem) {
        const texto = inteiro.toString('utf8');
        ouvintes.mensagem(talvezJSON(texto), texto);
      }
    }
  });

  socket.on('error', (e) => { console.warn('[ws] soquete:', e.message); encerrar(e.message); });
  socket.on('close', () => encerrar('fechado'));

  return con;
}

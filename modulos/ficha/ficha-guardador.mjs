/* ============================================================
   VITÆ — Onde a ficha mora  (Módulo 2, §83)
   ------------------------------------------------------------
   O FichaServer guarda documento JSON. O desenho pede **MongoDB**,
   e é o que este arquivo usa quando ele existe.

   MAS ELE NÃO EXIGE MONGO PARA FUNCIONAR, e isso é decisão, não
   preguiça. O projeto trata o ollama assim desde a §16: se o
   provedor não responde, o jogo roda em modo determinístico e a
   tela DIZ que está rodando. O banco recebe o mesmo tratamento —
   sem mongod de pé, a ficha vai para uma pasta em disco e o
   diagnóstico diz `pasta`, não `mongo`.

   A alternativa seria o Módulo 2 não subir sem banco. Isso
   travaria o M2 inteiro (o Cliente usar o MesaServer) atrás de
   uma instalação de servidor de banco, e trocaria um app que
   abre com dois cliques por um que pede infraestrutura.

   O DRIVER É `optionalDependency`, e a importação é dinâmica: sem
   `npm i mongodb` o arquivo carrega igual, e o guardador de pasta
   assume. É o que mantém `npm install` sem baixar nada para quem
   não quer banco — a promessa da §16.2, agora com uma nota de pé
   de página em vez de um asterisco.

   OS DOIS GUARDADORES TÊM A MESMA INTERFACE, de propósito:

     guardar(ficha) → { id }        ler(id) → ficha | null
     listar()       → [ficha]       apagar(id) → boolean
     saude()        → { tipo, ligado, detalhe }
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJETO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const ENDERECO_MONGO = process.env.VITAE_MONGO || 'mongodb://127.0.0.1:27017';
export const BANCO = process.env.VITAE_MONGO_BANCO || 'vitae';
export const COLECAO = process.env.VITAE_MONGO_COLECAO || 'fichas';
export const RAIZ_DAS_FICHAS = process.env.VITAE_FICHAS || path.join(PROJETO, 'fichas');

/* ------------------------------------------------------------
   O ID
   Mesma regra do navegador (`fichas.js`), e tem de continuar
   sendo: uma ficha exportada de lá e importada aqui precisa cair
   no mesmo documento, e não virar uma segunda cópia.
   ------------------------------------------------------------ */
export function idDaFicha(f) {
  const nome = String((f && f.nome) || 'sem_nome')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `${nome || 'sem_nome'}__${(f && f.cla) || 'sem_cla'}`;
}

/* Id vem de fora e vira nome de arquivo e chave de banco. Mesma
   peneira da §78 para o id de sessão, e pelo mesmo motivo. */
const ID_ACEITO = /^[a-z0-9][a-z0-9_-]{0,127}$/i;
export const idValido = (id) => ID_ACEITO.test(String(id || ''));

/** O que toda gravação acrescenta, seja qual for o guardador. */
function carimbar(ficha, id, criadaEm) {
  const copia = JSON.parse(JSON.stringify(ficha));
  copia.fichaId = id;
  copia.guardadaEm = Date.now();
  copia.criadaEm = criadaEm || copia.criadaEm || Date.now();
  return copia;
}

/* ============================================================
   GUARDADOR DE PASTA — um .json por ficha
   ============================================================ */

function guardadorDePasta() {
  const caminho = (id) => {
    if (!idValido(id)) throw new Error(`Id de ficha inválido: ${JSON.stringify(id)}`);
    const alvo = path.join(RAIZ_DAS_FICHAS, `${id}.json`);
    if (path.relative(RAIZ_DAS_FICHAS, alvo).includes('..')) {
      throw new Error(`Id de ficha fora da raiz: ${id}`);
    }
    return alvo;
  };

  const ler = (id) => {
    try { return JSON.parse(fs.readFileSync(caminho(id), 'utf8')); }
    catch (e) {
      if (e.code !== 'ENOENT') console.warn(`[ficha] ${id}.json ilegível: ${e.message}`);
      return null;
    }
  };

  return {
    tipo: 'pasta',

    async guardar(ficha) {
      const id = ficha.fichaId && idValido(ficha.fichaId) ? ficha.fichaId : idDaFicha(ficha);
      const antes = ler(id);
      const doc = carimbar(ficha, id, antes && antes.criadaEm);
      fs.mkdirSync(RAIZ_DAS_FICHAS, { recursive: true });
      /* Grava num parcial e renomeia: queda no meio de um `writeFile`
         deixa JSON truncado, e JSON truncado é ficha perdida. */
      const alvo = caminho(id);
      fs.writeFileSync(`${alvo}.parcial`, JSON.stringify(doc, null, 2), 'utf8');
      fs.renameSync(`${alvo}.parcial`, alvo);
      return { id, ficha: doc };
    },

    async ler(id) { return ler(id); },

    async listar() {
      let nomes;
      try { nomes = fs.readdirSync(RAIZ_DAS_FICHAS); }
      catch (e) { return []; }
      return nomes
        .filter(n => n.endsWith('.json'))
        .map(n => ler(n.slice(0, -5)))
        .filter(Boolean)
        .sort((a, b) => (b.guardadaEm || 0) - (a.guardadaEm || 0));
    },

    async apagar(id) {
      try { fs.unlinkSync(caminho(id)); return true; }
      catch (e) {
        if (e.code !== 'ENOENT') console.warn(`[ficha] não apaguei ${id}: ${e.message}`);
        return false;
      }
    },

    async saude() {
      return { tipo: 'pasta', ligado: true, detalhe: RAIZ_DAS_FICHAS,
        nota: 'Sem MongoDB: as fichas estão em arquivos JSON. Suba um mongod para trocar.' };
    },

    async fechar() {}
  };
}

/* ============================================================
   GUARDADOR DE MONGO
   ============================================================ */

async function guardadorDeMongo() {
  let driver;
  try {
    driver = await import('mongodb');
  } catch (e) {
    return { erro: 'O driver não está instalado. Rode `npm i mongodb` para usar o banco.' };
  }

  const cliente = new driver.MongoClient(ENDERECO_MONGO, {
    serverSelectionTimeoutMS: Number(process.env.VITAE_MONGO_TEMPO || 2000)
  });

  try {
    await cliente.connect();
    await cliente.db(BANCO).command({ ping: 1 });
  } catch (e) {
    /* `close()` mesmo depois de falhar: o driver deixa um temporizador
       de reconexão vivo, e ele segura o processo em pé para sempre. */
    try { await cliente.close(); } catch (e2) { console.warn('[ficha] close falhou:', e2.message); }
    return { erro: `Não consegui falar com o MongoDB em ${ENDERECO_MONGO}: ${e.message}` };
  }

  const colecao = cliente.db(BANCO).collection(COLECAO);
  /* `_id` é a chave do Mongo, e é onde o id da ficha mora — assim o
     banco garante a unicidade em vez de o código conferir. */
  const semId = ({ _id, ...resto }) => resto;

  return {
    tipo: 'mongo',

    async guardar(ficha) {
      const id = ficha.fichaId && idValido(ficha.fichaId) ? ficha.fichaId : idDaFicha(ficha);
      const antes = await colecao.findOne({ _id: id });
      const doc = carimbar(ficha, id, antes && antes.criadaEm);
      await colecao.replaceOne({ _id: id }, Object.assign({ _id: id }, doc), { upsert: true });
      return { id, ficha: doc };
    },

    async ler(id) {
      if (!idValido(id)) return null;
      const d = await colecao.findOne({ _id: id });
      return d ? semId(d) : null;
    },

    async listar() {
      const fora = await colecao.find({}).sort({ guardadaEm: -1 }).toArray();
      return fora.map(semId);
    },

    async apagar(id) {
      if (!idValido(id)) return false;
      return (await colecao.deleteOne({ _id: id })).deletedCount > 0;
    },

    async saude() {
      const n = await colecao.countDocuments();
      return { tipo: 'mongo', ligado: true,
        detalhe: `${ENDERECO_MONGO}/${BANCO}.${COLECAO}`, fichas: n };
    },

    async fechar() { await cliente.close(); }
  };
}

/* ============================================================
   A ESCOLHA
   ============================================================ */

/**
 * Devolve o guardador, e **diz por que escolheu esse**. O motivo
 * viaja até o painel da capa: quem abre o app precisa saber se a
 * ficha está indo para o banco ou para a pasta.
 */
export async function abrirGuardador({ preferir = process.env.VITAE_FICHA_GUARDADOR || 'mongo' } = {}) {
  if (preferir === 'pasta') {
    const g = guardadorDePasta();
    g.motivo = 'Pedido por VITAE_FICHA_GUARDADOR=pasta.';
    return g;
  }

  const tentativa = await guardadorDeMongo();
  if (!tentativa.erro) {
    tentativa.motivo = 'MongoDB respondeu.';
    return tentativa;
  }

  const g = guardadorDePasta();
  g.motivo = tentativa.erro;
  /* Um aviso na saída do processo, uma vez, e não a cada gravação:
     não é falha, é a configuração desta máquina. */
  console.warn(`[ficha] ${tentativa.erro} Usando a pasta ${RAIZ_DAS_FICHAS}.`);
  return g;
}

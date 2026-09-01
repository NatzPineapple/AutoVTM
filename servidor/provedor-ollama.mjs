/* ============================================================
   VITÆ — Transporte: Ollama local
   Sem dependência: fetch nativo do Node contra a API do Ollama.
   O JSON Schema vai no campo "format", que faz decodificação
   restrita por gramática — a saída é válida por construção,
   independente do tamanho do modelo.
   ============================================================ */

export const id = 'ollama';
export const MODELO_PADRAO = 'mistral-nemo:12b';

const ENDERECO = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const CONTEXTO_MINIMO = Number(process.env.VITAE_NUM_CTX || 8192);

export async function configurado() {
  try {
    const r = await fetch(`${ENDERECO}/api/tags`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch (e) { return false; }
}

export async function modelosDisponiveis() {
  try {
    const r = await fetch(`${ENDERECO}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.models || []).map(m => ({
      nome: m.name,
      parametros: m.details && m.details.parameter_size,
      gigabytes: +(m.size / 1e9).toFixed(1)
    }));
  } catch (e) { return []; }
}

export function descricao(modelo) {
  return `${modelo} · local em ${ENDERECO}`;
}

export async function gerar({ modelo, papel, contexto, conteudo, esquema, tempoLimite,
                              exemplos = [], opcoes = {} }) {
  const mensagens = [{ role: 'system', content: contexto ? `${papel}\n\n${contexto}` : papel }];
  for (const [humano, assistente] of exemplos) {
    mensagens.push({ role: 'user', content: humano });
    mensagens.push({ role: 'assistant', content: assistente });
  }
  mensagens.push({ role: 'user', content: conteudo });

  const corpo = {
    model: modelo,
    stream: false,
    format: esquema,
    options: Object.assign({ num_ctx: CONTEXTO_MINIMO }, opcoes),
    messages: mensagens
  };

  const r = await fetch(`${ENDERECO}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(tempoLimite || 300000)
  });

  if (!r.ok) {
    const detalhe = await r.text().catch(() => '');
    throw new Error(`Ollama respondeu ${r.status}: ${detalhe.slice(0, 200)}`);
  }

  const d = await r.json();
  const texto = (d.message && d.message.content) || '';
  let saida;
  try { saida = JSON.parse(texto); }
  catch (e) { throw new Error('Ollama devolveu algo que não é JSON, apesar do esquema.'); }

  return {
    saida,
    uso: {
      entrada: d.prompt_eval_count || 0,
      saida: d.eval_count || 0,
      cacheLido: 0,
      cacheEscrito: 0,
      milissegundos: Math.round((d.total_duration || 0) / 1e6)
    }
  };
}

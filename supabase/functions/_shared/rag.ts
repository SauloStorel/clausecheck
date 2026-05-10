import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings';
const VOYAGE_MODEL = 'voyage-law-2';
const QUERY_CHAR_LIMIT = 8000; // ~2k tokens — seguro para queries no voyage-law-2

export async function generateEmbedding(
  text: string,
  inputType: 'query' | 'document',
): Promise<number[]> {
  const key = Deno.env.get('VOYAGE_API_KEY');
  if (!key) throw new Error('VOYAGE_API_KEY não configurada');

  const res = await fetch(VOYAGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ input: [text], model: VOYAGE_MODEL, input_type: inputType }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage API error ${res.status}: ${err}`);
  }

  const json = await res.json();
  return json.data[0].embedding as number[];
}

export async function generateEmbeddingsBatch(
  texts: string[],
  inputType: 'query' | 'document',
): Promise<number[][]> {
  const key = Deno.env.get('VOYAGE_API_KEY');
  if (!key) throw new Error('VOYAGE_API_KEY não configurada');

  const BATCH = 100;
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const res = await fetch(VOYAGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ input: batch, model: VOYAGE_MODEL, input_type: inputType }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Voyage API error ${res.status}: ${err}`);
    }

    const json = await res.json();
    embeddings.push(...json.data.map((d: { embedding: number[] }) => d.embedding));
  }

  return embeddings;
}

// Retorna string formatada com contexto legal relevante, ou '' se não encontrar nada.
// Falha silenciosa: se RAG falhar, a análise continua sem contexto extra.
export async function searchLegalContext(
  supabase: SupabaseClient,
  queryText: string,
  topK = 5,
): Promise<string> {
  try {
    const truncated = queryText.slice(0, QUERY_CHAR_LIMIT);
    const embedding = await generateEmbedding(truncated, 'query');

    const { data, error } = await supabase.rpc('search_legal_chunks', {
      query_embedding: embedding,
      match_count: topK,
      min_similarity: 0.5,
    });

    if (error || !data?.length) return '';

    return (data as Array<{ source: string; article: string | null; content: string }>)
      .map((c) => `[${c.source}${c.article ? ` – ${c.article}` : ''}]\n${c.content}`)
      .join('\n\n');
  } catch {
    return '';
  }
}

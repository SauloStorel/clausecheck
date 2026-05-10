import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateEmbeddingsBatch } from '../_shared/rag.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ingest-secret',
};

interface Chunk {
  content: string;
  source: string;
  article?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  const secret = Deno.env.get('INGEST_SECRET');
  if (!secret || req.headers.get('x-ingest-secret') !== secret) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { chunks, replace_source } = await req.json() as {
      chunks: Chunk[];
      replace_source?: string; // se fornecido, apaga chunks antigos dessa fonte antes de inserir
    };

    if (!Array.isArray(chunks) || chunks.length === 0) {
      return new Response(JSON.stringify({ error: 'chunks[] é obrigatório e não pode ser vazio' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    if (replace_source) {
      await supabase.from('legal_chunks').delete().eq('source', replace_source);
    }

    const texts = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddingsBatch(texts, 'document');

    const rows = chunks.map((c, i) => ({
      content: c.content,
      source: c.source,
      article: c.article ?? null,
      embedding: embeddings[i],
    }));

    const { error } = await supabase.from('legal_chunks').insert(rows);
    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ inserted: rows.length }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? 'Erro interno' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});

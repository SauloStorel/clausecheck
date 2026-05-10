-- Habilita pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de chunks jurídicos
CREATE TABLE IF NOT EXISTS legal_chunks (
  id          uuid      DEFAULT gen_random_uuid() PRIMARY KEY,
  content     text      NOT NULL,
  source      text      NOT NULL,   -- ex: 'CC/2002', 'CDC', 'CLT', 'LEI_INQUILINATO'
  article     text,                 -- ex: 'Art. 421'
  embedding   vector(1024),
  created_at  timestamptz DEFAULT now()
);

-- Índice HNSW para busca aproximada eficiente
CREATE INDEX IF NOT EXISTS legal_chunks_embedding_idx
  ON legal_chunks USING hnsw (embedding vector_cosine_ops);

-- RLS
ALTER TABLE legal_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_legal_chunks"
  ON legal_chunks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "service_role_insert_legal_chunks"
  ON legal_chunks FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role_delete_legal_chunks"
  ON legal_chunks FOR DELETE
  TO service_role
  USING (true);

-- Função RPC para busca por similaridade
CREATE OR REPLACE FUNCTION search_legal_chunks(
  query_embedding vector(1024),
  match_count     int DEFAULT 5,
  min_similarity  float DEFAULT 0.5
)
RETURNS TABLE (
  id         uuid,
  content    text,
  source     text,
  article    text,
  similarity float
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    id,
    content,
    source,
    article,
    1 - (embedding <=> query_embedding) AS similarity
  FROM legal_chunks
  WHERE 1 - (embedding <=> query_embedding) >= min_similarity
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

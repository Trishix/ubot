-- Run this in Supabase SQL Editor to update the embedding dimension from 768 to 3072
-- Required because we switched from text-embedding-004 (768 dim) to gemini-embedding-001 (3072 dim)

-- 1. Delete existing embeddings (they're incompatible with the new dimension)
DELETE FROM documents;

-- 2. Alter the embedding column to use 3072 dimensions
ALTER TABLE documents
ALTER COLUMN embedding TYPE vector(3072);

-- 3. Recreate the match_documents function with the correct dimension
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE
    documents.user_id = filter_user_id
    AND 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY (documents.embedding <=> query_embedding)
  LIMIT match_count;
$$;

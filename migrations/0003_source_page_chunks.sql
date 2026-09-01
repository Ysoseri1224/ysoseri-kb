CREATE TABLE IF NOT EXISTS source_page_chunks (
  page_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content_html TEXT,
  content_text TEXT,
  PRIMARY KEY(page_id, chunk_index)
);

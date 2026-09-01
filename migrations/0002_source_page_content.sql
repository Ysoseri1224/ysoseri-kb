ALTER TABLE source_pages ADD COLUMN content_html TEXT;
ALTER TABLE source_pages ADD COLUMN content_text TEXT;
CREATE INDEX IF NOT EXISTS idx_source_pages_path ON source_pages(path);

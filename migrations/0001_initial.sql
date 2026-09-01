CREATE TABLE IF NOT EXISTS source_pages (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  path TEXT NOT NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_modified TEXT,
  etag TEXT,
  content_hash TEXT,
  fetched_at TEXT,
  html_key TEXT,
  sync_job_id TEXT
);

CREATE TABLE IF NOT EXISTS systems (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  source_anchor TEXT,
  description_html TEXT,
  potential_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  source_page_id TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS potential_entries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  system_id TEXT,
  citation_html TEXT,
  abstract_html TEXT,
  notes_html TEXT,
  method TEXT,
  authors TEXT,
  year INTEGER,
  content_text TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  source_page_id TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS implementations (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL,
  label TEXT,
  source_url TEXT,
  notes_html TEXT,
  updated_at TEXT,
  UNIQUE(entry_id, source_url)
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  implementation_id TEXT,
  entry_id TEXT,
  name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  kind TEXT,
  size_text TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS external_resources (
  id TEXT PRIMARY KEY,
  entry_id TEXT,
  label TEXT,
  url TEXT NOT NULL UNIQUE,
  resource_type TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS snapshots (
  id TEXT PRIMARY KEY,
  sync_job_id TEXT,
  url TEXT NOT NULL,
  content_hash TEXT,
  r2_key TEXT,
  captured_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_jobs (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  discovered_count INTEGER NOT NULL DEFAULT 0,
  fetched_count INTEGER NOT NULL DEFAULT 0,
  added_count INTEGER NOT NULL DEFAULT 0,
  changed_count INTEGER NOT NULL DEFAULT 0,
  missing_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  error_text TEXT
);

CREATE INDEX IF NOT EXISTS idx_systems_name ON systems(name);
CREATE INDEX IF NOT EXISTS idx_entries_system ON potential_entries(system_id);
CREATE INDEX IF NOT EXISTS idx_entries_year ON potential_entries(year);
CREATE INDEX IF NOT EXISTS idx_entries_method ON potential_entries(method);
CREATE INDEX IF NOT EXISTS idx_files_entry ON files(entry_id);

CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
  entry_id UNINDEXED,
  title,
  content,
  authors,
  method,
  tokenize = 'unicode61 remove_diacritics 2'
);

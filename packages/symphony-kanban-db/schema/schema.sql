PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  local_path TEXT,
  context TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority INTEGER,
  workspace_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS issues_workspace_id_idx ON issues(workspace_id);
CREATE INDEX IF NOT EXISTS issues_status_idx ON issues(status);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT,
  color TEXT,
  rules TEXT,
  acceptance_criteria TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS issue_tags (
  issue_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (issue_id, tag_id),
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS issue_tags_tag_id_idx ON issue_tags(tag_id);

CREATE TABLE IF NOT EXISTS issue_events (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS issue_events_issue_id_idx ON issue_events(issue_id);

CREATE TABLE IF NOT EXISTS workflow_defs (
  id TEXT PRIMARY KEY,
  tag_id TEXT NOT NULL,
  state TEXT NOT NULL,
  behavior TEXT NOT NULL,
  config_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS workflow_defs_tag_id_idx ON workflow_defs(tag_id);

CREATE TABLE IF NOT EXISTS executions (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  error_summary TEXT,
  runner TEXT,
  attempt INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS executions_issue_id_idx ON executions(issue_id);

CREATE TABLE IF NOT EXISTS execution_artifacts (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  content_truncated INTEGER DEFAULT 0,
  content_size INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS execution_artifacts_execution_id_idx ON execution_artifacts(execution_id);

CREATE TABLE IF NOT EXISTS scheduler_settings (
  id TEXT PRIMARY KEY,
  max_concurrency INTEGER NOT NULL,
  poll_interval_ms INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

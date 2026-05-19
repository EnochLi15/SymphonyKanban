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
  state TEXT,
  behavior TEXT,
  workflow_definition TEXT,
  after_create TEXT,
  before_remove TEXT,
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

CREATE TABLE IF NOT EXISTS bounty_tasks (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  context TEXT,
  acceptance_criteria TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  assignee_name TEXT,
  response TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  submitted_at TEXT,
  accepted_at TEXT,
  canceled_at TEXT,
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS bounty_tasks_issue_id_idx ON bounty_tasks(issue_id);
CREATE INDEX IF NOT EXISTS bounty_tasks_status_idx ON bounty_tasks(status);

CREATE TABLE IF NOT EXISTS planner_notifications (
  id TEXT PRIMARY KEY,
  severity TEXT NOT NULL,
  event_type TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  source_type TEXT,
  source_id TEXT,
  created_at TEXT NOT NULL,
  read_at TEXT
);

CREATE INDEX IF NOT EXISTS planner_notifications_status_idx ON planner_notifications(status);

CREATE TABLE IF NOT EXISTS planner_chat_messages (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  action_type TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS planner_chat_messages_created_at_idx
  ON planner_chat_messages(created_at);

CREATE TABLE IF NOT EXISTS planner_memories (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence REAL NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS planner_memories_scope_idx ON planner_memories(scope);
CREATE UNIQUE INDEX IF NOT EXISTS planner_memories_source_idx
  ON planner_memories(source_type, source_id, title);

CREATE TABLE IF NOT EXISTS point_ledger (
  id TEXT PRIMARY KEY,
  contributor TEXT NOT NULL,
  bounty_id TEXT NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (bounty_id) REFERENCES bounty_tasks(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS point_ledger_bounty_id_idx ON point_ledger(bounty_id);

CREATE TABLE IF NOT EXISTS planner_runs (
  id TEXT PRIMARY KEY,
  trigger TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  inspected_issues INTEGER NOT NULL,
  created_actions INTEGER NOT NULL,
  skipped_actions INTEGER NOT NULL,
  no_op_results INTEGER NOT NULL,
  queue_risks INTEGER NOT NULL,
  recommended_next_step TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS planner_runs_started_at_idx ON planner_runs(started_at);

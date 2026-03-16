# MVP B–G End-to-End Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the full MVP chain from tags/workflow config → scheduler/exec → evidence/review → blocked recovery → workspace management.

**Architecture:** API is the source of truth for issues, workflow config, executions, and artifacts. Symphony polls for Todo, enforces global concurrency, executes via Opencode SDK SSE events, and writes results back. Web UI reads/writes via API only, polling for execution state.

**Tech Stack:** Vue3 + Element Plus, Express + SQLite (better-sqlite3), TypeScript, vitest, Opencode SDK, fizzy-popper.

---

## File Structure (planned)

**DB / Schema**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-db/schema/schema.sql`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/src/db.ts`

**Shared Types**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-shared/src/index.ts`

**API**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/src/app.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/src/execution-store.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/src/workflow-store.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/src/tag-store.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/src/workspace-store.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/src/settings-store.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/test/issues.test.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/test/executions.test.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/test/workflow.test.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/test/review.test.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/test/settings.test.ts`

**Symphony**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-symphony/package.json`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-symphony/src/index.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-symphony/src/api-client.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-symphony/src/scheduler.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-symphony/src/opencode-runner.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-symphony/src/__tests__/scheduler.test.ts`

**Web**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-web/src/lib/api.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-web/src/pages/workflow/tag-workflow-view.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-web/src/pages/workspace/workspace-management-view.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-web/src/pages/workspace/workspace-settings-view.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-web/src/pages/review/review-view.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-web/src/pages/errors/blocked-error-handling-view.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-web/src/pages/sessions/web-session-run.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-web/src/pages/issues/issue-detail-view.vue`

---

## Chunk 1: Schema + Shared Types

### Task 1: Extend SQLite schema for workflows, executions, artifacts, and settings

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-db/schema/schema.sql`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/src/db.ts`
- Test: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/test/issues.test.ts`

- [ ] **Step 1: Write failing schema test for new columns/tables**

```ts
import { describe, expect, it } from "vitest";
import { db } from "../src/db.js";

it("includes execution tables", () => {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all() as Array<{ name: string }>;
  const names = tables.map((t) => t.name);
  expect(names).toContain("executions");
  expect(names).toContain("execution_artifacts");
  expect(names).toContain("workflow_defs");
  expect(names).toContain("scheduler_settings");
});

it("adds workspace context columns", () => {
  const cols = db.prepare("PRAGMA table_info(workspaces)").all() as Array<{ name: string }>;
  const names = cols.map((c) => c.name);
  expect(names).toContain("local_path");
  expect(names).toContain("context");
  expect(names).toContain("updated_at");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w packages/symphony-kanban-api`
Expected: FAIL with missing tables/columns.

- [ ] **Step 3: Update schema.sql with new tables/columns**

```sql
ALTER TABLE workspaces ADD COLUMN local_path TEXT;
ALTER TABLE workspaces ADD COLUMN context TEXT;
ALTER TABLE workspaces ADD COLUMN updated_at TEXT;

ALTER TABLE tags ADD COLUMN type TEXT;
ALTER TABLE tags ADD COLUMN color TEXT;
ALTER TABLE tags ADD COLUMN updated_at TEXT;

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
```

- [ ] **Step 4: Update db.ts to add missing columns for existing DBs**

```ts
const ensureColumn = (table: string, column: string, ddl: string) => {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    db.prepare(ddl).run();
  }
};

ensureColumn("workspaces", "local_path", "ALTER TABLE workspaces ADD COLUMN local_path TEXT");
ensureColumn("workspaces", "context", "ALTER TABLE workspaces ADD COLUMN context TEXT");
ensureColumn("workspaces", "updated_at", "ALTER TABLE workspaces ADD COLUMN updated_at TEXT");

ensureColumn("tags", "type", "ALTER TABLE tags ADD COLUMN type TEXT");
ensureColumn("tags", "color", "ALTER TABLE tags ADD COLUMN color TEXT");
ensureColumn("tags", "updated_at", "ALTER TABLE tags ADD COLUMN updated_at TEXT");

// create default scheduler settings row if none
const settingsCount = db
  .prepare("SELECT COUNT(*) as count FROM scheduler_settings")
  .get() as { count: number };
if (settingsCount.count === 0) {
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO scheduler_settings (id, max_concurrency, poll_interval_ms, updated_at) VALUES (?, ?, ?, ?)"
  ).run("scheduler-default", 3, 5000, now);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -w packages/symphony-kanban-api`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/symphony-kanban-db/schema/schema.sql packages/symphony-kanban-api/src/db.ts packages/symphony-kanban-api/test/issues.test.ts
git commit -m "feat(db): add workflow, execution, and scheduler schema"
```

### Task 2: Extend shared types

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-shared/src/index.ts`

- [ ] **Step 1: Write failing type usage test (optional, TS compile)**

No runtime test needed; we will rely on TypeScript and usage sites.

- [ ] **Step 2: Update shared types**

```ts
export type IssueStatus =
  | "Backlog"
  | "Todo"
  | "InProgress"
  | "Review"
  | "Blocked"
  | "Done";

export interface TagDTO {
  id: string;
  name: string;
  type?: string | null;
  color?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface WorkflowDefDTO {
  id: string;
  tagId: string;
  state: IssueStatus;
  behavior: string;
  configJson?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceDTO {
  id: string;
  name: string;
  localPath?: string | null;
  context?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ExecutionDTO {
  id: string;
  issueId: string;
  status: "running" | "succeeded" | "failed";
  startedAt: string;
  finishedAt?: string | null;
  errorSummary?: string | null;
  runner?: string | null;
  attempt: number;
  createdAt: string;
}

export interface ExecutionArtifactDTO {
  id: string;
  executionId: string;
  type: "log" | "diff" | "test" | "summary";
  content?: string | null;
  summary?: string | null;
  contentTruncated: boolean;
  contentSize: number;
  createdAt: string;
}

export interface ReviewDTO {
  issue: IssueDTO;
  execution: ExecutionDTO;
  artifacts: ExecutionArtifactDTO[];
}

export interface SchedulerSettingsDTO {
  id: string;
  maxConcurrency: number;
  pollIntervalMs: number;
  updatedAt: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/symphony-kanban-shared/src/index.ts
git commit -m "feat(shared): add tag/workflow/workspace/execution types"
```

---

## Chunk 2: API Stores + Endpoints

### Task 3: Add stores for tags, workflows, workspaces, settings, executions

**Files:**
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/src/tag-store.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/src/workflow-store.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/src/workspace-store.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/src/settings-store.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/src/execution-store.ts`

- [ ] **Step 1: Add tag-store**

```ts
import { db } from "./db.js";

export const listTags = () =>
  db.prepare("SELECT id, name, type, color, created_at as createdAt, updated_at as updatedAt FROM tags ORDER BY name").all();

export const createTag = (id: string, name: string, type: string | null, color: string | null, now: string) => {
  db.prepare("INSERT INTO tags (id, name, type, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, name, type, color, now, now);
};

export const updateTag = (id: string, name: string, type: string | null, color: string | null, now: string) => {
  db.prepare("UPDATE tags SET name = ?, type = ?, color = ?, updated_at = ? WHERE id = ?")
    .run(name, type, color, now, id);
};

export const deleteTag = (id: string) => {
  db.prepare("DELETE FROM tags WHERE id = ?").run(id);
};
```

- [ ] **Step 2: Add workflow-store**

```ts
import { db } from "./db.js";

export const listWorkflowDefs = () =>
  db.prepare("SELECT id, tag_id as tagId, state, behavior, config_json as configJson, created_at as createdAt, updated_at as updatedAt FROM workflow_defs ORDER BY created_at DESC").all();

export const upsertWorkflowDef = (id: string, tagId: string, state: string, behavior: string, configJson: string | null, now: string) => {
  db.prepare(
    "INSERT INTO workflow_defs (id, tag_id, state, behavior, config_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, tagId, state, behavior, configJson, now, now);
};

export const updateWorkflowDef = (id: string, state: string, behavior: string, configJson: string | null, now: string) => {
  db.prepare("UPDATE workflow_defs SET state = ?, behavior = ?, config_json = ?, updated_at = ? WHERE id = ?")
    .run(state, behavior, configJson, now, id);
};
```

- [ ] **Step 3: Add workspace-store**

```ts
import { db } from "./db.js";

export const listWorkspaces = () =>
  db.prepare("SELECT id, name, local_path as localPath, context, created_at as createdAt, updated_at as updatedAt FROM workspaces ORDER BY created_at").all();

export const createWorkspace = (id: string, name: string, localPath: string | null, context: string | null, now: string) => {
  db.prepare("INSERT INTO workspaces (id, name, local_path, context, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, name, localPath, context, now, now);
};

export const updateWorkspace = (id: string, name: string, localPath: string | null, context: string | null, now: string) => {
  db.prepare("UPDATE workspaces SET name = ?, local_path = ?, context = ?, updated_at = ? WHERE id = ?")
    .run(name, localPath, context, now, id);
};
```

- [ ] **Step 4: Add settings-store**

```ts
import { db } from "./db.js";

export const getSchedulerSettings = () =>
  db.prepare("SELECT id, max_concurrency as maxConcurrency, poll_interval_ms as pollIntervalMs, updated_at as updatedAt FROM scheduler_settings LIMIT 1").get();

export const updateSchedulerSettings = (maxConcurrency: number, pollIntervalMs: number, now: string) => {
  const row = getSchedulerSettings() as { id: string } | undefined;
  if (!row) return;
  db.prepare("UPDATE scheduler_settings SET max_concurrency = ?, poll_interval_ms = ?, updated_at = ? WHERE id = ?")
    .run(maxConcurrency, pollIntervalMs, now, row.id);
};
```

- [ ] **Step 5: Add execution-store**

```ts
import { db } from "./db.js";

export const createExecution = (id: string, issueId: string, status: string, startedAt: string, runner: string | null, attempt: number) => {
  db.prepare(
    "INSERT INTO executions (id, issue_id, status, started_at, runner, attempt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, issueId, status, startedAt, runner, attempt, startedAt);
};

export const updateExecution = (id: string, status: string, finishedAt: string | null, errorSummary: string | null) => {
  db.prepare(
    "UPDATE executions SET status = ?, finished_at = ?, error_summary = ? WHERE id = ?"
  ).run(status, finishedAt, errorSummary, id);
};

export const listExecutionsByIssue = (issueId: string) =>
  db.prepare(
    "SELECT id, issue_id as issueId, status, started_at as startedAt, finished_at as finishedAt, error_summary as errorSummary, runner, attempt, created_at as createdAt FROM executions WHERE issue_id = ? ORDER BY started_at DESC"
  ).all(issueId);

export const insertArtifact = (
  id: string,
  executionId: string,
  type: string,
  content: string | null,
  summary: string | null,
  truncated: number,
  size: number,
  now: string
) => {
  db.prepare(
    "INSERT INTO execution_artifacts (id, execution_id, type, content, summary, content_truncated, content_size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, executionId, type, content, summary, truncated, size, now);
};

export const listArtifacts = (executionId: string) =>
  db.prepare(
    "SELECT id, execution_id as executionId, type, content, summary, content_truncated as contentTruncated, content_size as contentSize, created_at as createdAt FROM execution_artifacts WHERE execution_id = ? ORDER BY created_at ASC"
  ).all(executionId);
```

- [ ] **Step 6: Commit**

```bash
git add packages/symphony-kanban-api/src/tag-store.ts packages/symphony-kanban-api/src/workflow-store.ts packages/symphony-kanban-api/src/workspace-store.ts packages/symphony-kanban-api/src/settings-store.ts packages/symphony-kanban-api/src/execution-store.ts
git commit -m "feat(api): add stores for tags, workflows, workspaces, settings, executions"
```

### Task 4: Add API endpoints for MVP flows

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/src/app.ts`
- Test: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-api/test/*.test.ts`

- [ ] **Step 1: Add artifact truncation helper**

```ts
const MAX_ARTIFACT_CHARS = 200_000;
const truncateTail = (input: string | null | undefined) => {
  if (!input) return { content: input ?? null, truncated: 0, size: 0 };
  const size = input.length;
  if (size <= MAX_ARTIFACT_CHARS) return { content: input, truncated: 0, size };
  const tail = input.slice(size - MAX_ARTIFACT_CHARS);
  return { content: tail, truncated: 1, size };
};
```

- [ ] **Step 2: Add tag CRUD endpoints**

```ts
app.post("/tags", (req, res) => {
  const { name, type, color } = req.body ?? {};
  if (!name || typeof name !== "string") return res.status(400).json({ error: "name required" });
  const now = new Date().toISOString();
  const id = randomUUID();
  createTag(id, name.trim(), type ?? null, color ?? null, now);
  res.status(201).json({ data: { id, name: name.trim(), type: type ?? null, color: color ?? null, createdAt: now, updatedAt: now } });
});

app.patch("/tags/:id", (req, res) => {
  const { name, type, color } = req.body ?? {};
  if (!name || typeof name !== "string") return res.status(400).json({ error: "name required" });
  const now = new Date().toISOString();
  updateTag(req.params.id, name.trim(), type ?? null, color ?? null, now);
  res.json({ ok: true });
});

app.delete("/tags/:id", (req, res) => {
  deleteTag(req.params.id);
  res.json({ ok: true });
});
```

- [ ] **Step 3: Add workflow endpoints**

```ts
app.get("/workflows", (_req, res) => {
  res.json({ data: listWorkflowDefs() });
});

app.post("/workflows", (req, res) => {
  const { tagId, state, behavior, configJson } = req.body ?? {};
  if (!tagId || !state || !behavior) return res.status(400).json({ error: "invalid" });
  const now = new Date().toISOString();
  const id = randomUUID();
  upsertWorkflowDef(id, tagId, state, behavior, configJson ?? null, now);
  res.status(201).json({ data: { id } });
});

app.patch("/workflows/:id", (req, res) => {
  const { state, behavior, configJson } = req.body ?? {};
  if (!state || !behavior) return res.status(400).json({ error: "invalid" });
  const now = new Date().toISOString();
  updateWorkflowDef(req.params.id, state, behavior, configJson ?? null, now);
  res.json({ ok: true });
});
```

- [ ] **Step 4: Add workspace CRUD endpoints**

```ts
app.post("/workspaces", (req, res) => {
  const { name, localPath, context } = req.body ?? {};
  if (!name || typeof name !== "string") return res.status(400).json({ error: "name required" });
  const now = new Date().toISOString();
  const id = randomUUID();
  createWorkspace(id, name.trim(), localPath ?? null, context ?? null, now);
  res.status(201).json({ data: { id } });
});

app.patch("/workspaces/:id", (req, res) => {
  const { name, localPath, context } = req.body ?? {};
  if (!name || typeof name !== "string") return res.status(400).json({ error: "name required" });
  const now = new Date().toISOString();
  updateWorkspace(req.params.id, name.trim(), localPath ?? null, context ?? null, now);
  res.json({ ok: true });
});
```

- [ ] **Step 5: Add scheduler settings endpoints (configured in tag/workflow page)**

```ts
app.get("/settings/scheduler", (_req, res) => {
  res.json({ data: getSchedulerSettings() });
});

app.patch("/settings/scheduler", (req, res) => {
  const { maxConcurrency, pollIntervalMs } = req.body ?? {};
  if (typeof maxConcurrency !== "number" || typeof pollIntervalMs !== "number") {
    return res.status(400).json({ error: "invalid settings" });
  }
  const now = new Date().toISOString();
  updateSchedulerSettings(maxConcurrency, pollIntervalMs, now);
  res.json({ ok: true });
});
```

- [ ] **Step 6: Add executions + artifacts endpoints**

```ts
app.post("/executions", (req, res) => {
  const { issueId, status, runner, attempt } = req.body ?? {};
  if (!issueId || !status || typeof attempt !== "number") {
    return res.status(400).json({ error: "invalid" });
  }
  const now = new Date().toISOString();
  const id = randomUUID();
  createExecution(id, issueId, status, now, runner ?? null, attempt);
  res.status(201).json({ data: { id } });
});

app.patch("/executions/:id", (req, res) => {
  const { status, finishedAt, errorSummary } = req.body ?? {};
  if (!status) return res.status(400).json({ error: "invalid" });
  updateExecution(req.params.id, status, finishedAt ?? null, errorSummary ?? null);
  res.json({ ok: true });
});

app.get("/executions/:id/status", (req, res) => {
  const row = db.prepare("SELECT id, status, finished_at as finishedAt FROM executions WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "not found" });
  res.json({ data: row });
});

app.get("/executions/:id/artifacts", (req, res) => {
  res.json({ data: listArtifacts(req.params.id) });
});

app.post("/executions/:id/artifacts", (req, res) => {
  const { type, content, summary } = req.body ?? {};
  if (!type) return res.status(400).json({ error: "type required" });
  const now = new Date().toISOString();
  const id = randomUUID();
  const { content: safe, truncated, size } = truncateTail(typeof content === "string" ? content : null);
  insertArtifact(id, req.params.id, type, safe, typeof summary === "string" ? summary : null, truncated, size, now);
  res.status(201).json({ data: { id, truncated: !!truncated } });
});
```

- [ ] **Step 7: Add review aggregate endpoint**

```ts
app.get("/review/:issueId", (req, res) => {
  const issue = getIssueById(req.params.issueId);
  if (!issue) return res.status(404).json({ error: "issue not found" });
  const executions = listExecutionsByIssue(req.params.issueId) as Array<{ id: string }>;
  const latest = executions[0];
  if (!latest) return res.status(404).json({ error: "no executions" });
  const artifacts = listArtifacts(latest.id);
  res.json({ data: { issue, execution: latest, artifacts } });
});
```

- [ ] **Step 8: Add transition + evidence validation endpoint**

```ts
const hasArtifacts = (executionId: string, types: string[]) => {
  const rows = listArtifacts(executionId) as Array<{ type: string }>;
  const present = new Set(rows.map((r) => r.type));
  return types.every((t) => present.has(t));
};

app.post("/issues/:id/transition", (req, res) => {
  const { toStatus } = req.body ?? {};
  const issue = getIssueById(req.params.id);
  if (!issue) return res.status(404).json({ error: "issue not found" });
  if (toStatus !== "Done" && toStatus !== "Review" && toStatus !== "InProgress" && toStatus !== "Blocked") {
    return res.status(400).json({ error: "invalid status" });
  }
  if (toStatus === "Done") {
    const executions = listExecutionsByIssue(issue.id) as Array<{ id: string }>;
    const latest = executions[0];
    if (!latest) return res.status(400).json({ error: "no execution" });
    const required = ["log", "diff", "summary"];
    if (!hasArtifacts(latest.id, required)) {
      return res.status(400).json({ error: "missing evidence" });
    }
    if (issue.tags.includes("ci-required") && !hasArtifacts(latest.id, ["test"])) {
      return res.status(400).json({ error: "missing test evidence" });
    }
  }
  db.prepare("UPDATE issues SET status = ?, updated_at = ? WHERE id = ?")
    .run(toStatus, new Date().toISOString(), issue.id);
  res.json({ ok: true });
});
```

- [ ] **Step 9: Add scheduler claim + retry endpoints**

```ts
app.get("/scheduler/claim", (_req, res) => {
  const tx = db.transaction(() => {
    const row = db.prepare(
      "SELECT id FROM issues WHERE status = 'Todo' ORDER BY priority DESC, created_at ASC LIMIT 1"
    ).get() as { id: string } | undefined;
    if (!row) return null;
    const now = new Date().toISOString();
    db.prepare("UPDATE issues SET status = 'InProgress', updated_at = ? WHERE id = ?")
      .run(now, row.id);
    return getIssueById(row.id);
  });
  const claimed = tx();
  if (!claimed) return res.json({ data: null });
  res.json({ data: claimed });
});

app.post("/issues/:id/retry", (req, res) => {
  const issue = getIssueById(req.params.id);
  if (!issue) return res.status(404).json({ error: "issue not found" });
  db.prepare("UPDATE issues SET status = 'InProgress', updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), issue.id);
  res.json({ ok: true });
});
```

- [ ] **Step 10: Add tests for evidence validation and truncation**

```ts
import request from "supertest";
import { app } from "../src/app.js";

it("rejects Done when missing artifacts", async () => {
  const res = await request(app)
    .post("/issues/ISSUE_ID/transition")
    .send({ toStatus: "Done" });
  expect(res.status).toBe(400);
});

it("truncates large artifacts to tail", async () => {
  const big = "a".repeat(210_000);
  const res = await request(app)
    .post("/executions/EXEC_ID/artifacts")
    .send({ type: "log", content: big });
  expect(res.status).toBe(201);
});
```

- [ ] **Step 11: Run tests**

Run: `npm test -w packages/symphony-kanban-api`
Expected: PASS.

- [ ] **Step 12: Commit**

```bash
git add packages/symphony-kanban-api/src/app.ts packages/symphony-kanban-api/test packages/symphony-kanban-api/src/*.ts
git commit -m "feat(api): add workflow, execution, review, scheduler endpoints"
```

---

## Chunk 3: Symphony Scheduler + Opencode Integration

### Task 5: Add Opencode SDK + scheduler loop

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-symphony/package.json`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-symphony/src/index.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-symphony/src/api-client.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-symphony/src/scheduler.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-symphony/src/opencode-runner.ts`
- Test: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-symphony/src/__tests__/scheduler.test.ts`

- [ ] **Step 1: Add dependencies**

```json
"dependencies": {
  "@opencode-ai/sdk": "^0.0.0",
  "fizzy-popper": "^0.0.0"
}
```

- [ ] **Step 2: API client wrapper**

```ts
export const buildApi = (base: string) => ({
  async claimTodo() {
    const res = await fetch(`${base}/scheduler/claim`);
    return res.json();
  },
  async createExecution(payload: Record<string, unknown>) {
    const res = await fetch(`${base}/executions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return res.json();
  },
  async updateExecution(id: string, payload: Record<string, unknown>) {
    await fetch(`${base}/executions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  },
  async addArtifact(executionId: string, payload: Record<string, unknown>) {
    await fetch(`${base}/executions/${executionId}/artifacts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  },
  async getSettings() {
    const res = await fetch(`${base}/settings/scheduler`);
    return res.json();
  },
  async transitionIssue(id: string, toStatus: string) {
    await fetch(`${base}/issues/${id}/transition`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toStatus }) });
  }
});
```

- [ ] **Step 3: Opencode runner using SSE events**

```ts
import { OpenCode } from "@opencode-ai/sdk";

export const runOpencode = async ({ baseUrl, issue, context, onArtifact, onStatus }: {
  baseUrl: string;
  issue: { id: string; title: string; description?: string };
  context: string | null;
  onArtifact: (type: string, content: string, summary?: string) => Promise<void>;
  onStatus: (status: "running" | "succeeded" | "failed", error?: string) => Promise<void>;
}) => {
  const client = new OpenCode({ baseUrl });
  await onStatus("running");
  const events = client.event.subscribe();
  for await (const event of events) {
    if (event.type === "execution_log") {
      await onArtifact("log", event.properties?.text ?? "");
    }
    if (event.type === "execution_diff") {
      await onArtifact("diff", event.properties?.diff ?? "");
    }
    if (event.type === "execution_test") {
      await onArtifact("test", event.properties?.result ?? "");
    }
    if (event.type === "execution_summary") {
      await onArtifact("summary", event.properties?.text ?? "");
    }
    if (event.type === "execution_failed") {
      await onStatus("failed", event.properties?.error ?? "unknown");
      return;
    }
    if (event.type === "execution_succeeded") {
      await onStatus("succeeded");
      return;
    }
  }
};
```

- [ ] **Step 4: Scheduler loop**

```ts
export const startScheduler = async ({ apiBase, opencodeBase }: { apiBase: string; opencodeBase: string }) => {
  const api = buildApi(apiBase);
  let running = 0;
  const tick = async () => {
    const settings = await api.getSettings();
    const max = settings.data.maxConcurrency;
    if (running >= max) return;
    const claimed = await api.claimTodo();
    const issue = claimed.data;
    if (!issue) return;
    running += 1;
    const execRes = await api.createExecution({ issueId: issue.id, status: "running", attempt: 1, runner: "opencode" });
    const executionId = execRes.data.id;
    try {
      await runOpencode({
        baseUrl: opencodeBase,
        issue,
        context: null,
        onArtifact: (type, content, summary) => api.addArtifact(executionId, { type, content, summary }),
        onStatus: async (status, error) => {
          await api.updateExecution(executionId, { status, finishedAt: new Date().toISOString(), errorSummary: error ?? null });
          if (status === "succeeded") await api.transitionIssue(issue.id, "Review");
          if (status === "failed") await api.transitionIssue(issue.id, "Blocked");
        }
      });
    } finally {
      running -= 1;
    }
  };
  const loop = async () => {
    await tick();
    const settings = await api.getSettings();
    setTimeout(loop, settings.data.pollIntervalMs);
  };
  loop();
};
```

- [ ] **Step 5: Wire index.ts**

```ts
import { startScheduler } from "./scheduler.js";

export const startSymphony = () => {
  const apiBase = process.env.API_BASE ?? "http://localhost:3001";
  const opencodeBase = process.env.OPENCODE_BASE ?? "http://localhost:4096";
  startScheduler({ apiBase, opencodeBase });
};
```

- [ ] **Step 6: Add scheduler test (mock fetch)**

```ts
import { describe, it, expect, vi } from "vitest";
import { startScheduler } from "../scheduler.js";

it("claims todo when under concurrency", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ json: async () => ({ data: { maxConcurrency: 1, pollIntervalMs: 10 } }) })
    .mockResolvedValueOnce({ json: async () => ({ data: { id: "ISSUE" } }) })
    .mockResolvedValueOnce({ json: async () => ({ data: { id: "EXEC" } }) });
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
  startScheduler({ apiBase: "http://api", opencodeBase: "http://opencode" });
  expect(fetchMock).toBeCalled();
});
```

- [ ] **Step 7: Run tests**

Run: `npm test -w packages/symphony-kanban-symphony`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/symphony-kanban-symphony
git commit -m "feat(symphony): add scheduler and opencode integration"
```

---

## Chunk 4: Web UI + API Client

### Task 6: Expand web API client

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-web/src/lib/api.ts`

- [ ] **Step 1: Add new endpoints**

```ts
async listWorkflows() { return (await fetch(`${base}/workflows`)).json(); }
async createWorkflow(payload: Record<string, unknown>) { /* POST /workflows */ }
async updateWorkflow(id: string, payload: Record<string, unknown>) { /* PATCH /workflows/:id */ }
async createTag(payload: Record<string, unknown>) { /* POST /tags */ }
async updateTag(id: string, payload: Record<string, unknown>) { /* PATCH /tags/:id */ }
async deleteTag(id: string) { /* DELETE /tags/:id */ }
async createWorkspace(payload: Record<string, unknown>) { /* POST /workspaces */ }
async updateWorkspace(id: string, payload: Record<string, unknown>) { /* PATCH /workspaces/:id */ }
async getReview(issueId: string) { /* GET /review/:issueId */ }
async transitionIssue(id: string, toStatus: string) { /* POST /issues/:id/transition */ }
async retryIssue(id: string) { /* POST /issues/:id/retry */ }
async getExecutionStatus(id: string) { /* GET /executions/:id/status */ }
async getArtifacts(executionId: string) { /* GET /executions/:id/artifacts */ }
async getSchedulerSettings() { /* GET /settings/scheduler */ }
async updateSchedulerSettings(payload: Record<string, unknown>) { /* PATCH /settings/scheduler */ }
```

- [ ] **Step 2: Commit**

```bash
git add packages/symphony-kanban-web/src/lib/api.ts
git commit -m "feat(web): add API client for workflow/execution/review"
```

### Task 7: Tag & Workflow page (includes scheduler settings)

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-web/src/pages/workflow/tag-workflow-view.vue`

- [ ] **Step 1: Replace static data with API-driven lists**

```ts
const api = buildApi(import.meta.env.VITE_API_BASE ?? "http://localhost:3001");
const tags = ref<TagDTO[]>([]);
const workflows = ref<WorkflowDefDTO[]>([]);
const settings = ref<SchedulerSettingsDTO | null>(null);

const load = async () => {
  const [tagRes, workflowRes, settingsRes] = await Promise.all([
    api.listTags(),
    api.listWorkflows(),
    api.getSchedulerSettings()
  ]);
  tags.value = tagRes.data ?? [];
  workflows.value = workflowRes.data ?? [];
  settings.value = settingsRes.data ?? null;
};
```

- [ ] **Step 2: Add save handlers for tags + workflows + settings**

```ts
const saveSettings = async () => {
  if (!settings.value) return;
  await api.updateSchedulerSettings({
    maxConcurrency: settings.value.maxConcurrency,
    pollIntervalMs: settings.value.pollIntervalMs
  });
};
```

- [ ] **Step 3: Commit**

```bash
git add packages/symphony-kanban-web/src/pages/workflow/tag-workflow-view.vue
git commit -m "feat(web): wire tag/workflow config and scheduler settings"
```

### Task 8: Workspace management + settings

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-web/src/pages/workspace/workspace-management-view.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-web/src/pages/workspace/workspace-settings-view.vue`

- [ ] **Step 1: Load workspace list from API**

```ts
const workspaces = ref<WorkspaceDTO[]>([]);
const load = async () => {
  const res = await api.listWorkspaces();
  workspaces.value = res.data ?? [];
};
```

- [ ] **Step 2: Allow create/edit and save context**

```ts
await api.createWorkspace({ name, localPath, context });
await api.updateWorkspace(id, { name, localPath, context });
```

- [ ] **Step 3: Commit**

```bash
git add packages/symphony-kanban-web/src/pages/workspace/workspace-management-view.vue packages/symphony-kanban-web/src/pages/workspace/workspace-settings-view.vue
git commit -m "feat(web): workspace list and settings wired"
```

### Task 9: Review + Blocked + Session views

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-web/src/pages/review/review-view.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-web/src/pages/errors/blocked-error-handling-view.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-web/src/pages/sessions/web-session-run.vue`

- [ ] **Step 1: Review page loads from /review/:id and actions call transition**

```ts
const review = ref<ReviewDTO | null>(null);
const load = async () => {
  const res = await api.getReview(route.params.id as string);
  review.value = res.data;
};
const approve = async () => api.transitionIssue(review.value!.issue.id, "Done");
const reject = async () => api.transitionIssue(review.value!.issue.id, "InProgress");
const requestEvidence = async () => api.transitionIssue(review.value!.issue.id, "Blocked");
```

- [ ] **Step 2: Blocked page calls retry and shows error summary from latest execution**

```ts
const retry = async () => api.retryIssue(route.params.id as string);
```

- [ ] **Step 3: Session page loads artifacts and displays log/diff/test**

```ts
const artifacts = ref<ExecutionArtifactDTO[]>([]);
const load = async () => {
  const execRes = await api.getReview(route.params.id as string);
  artifacts.value = execRes.data.artifacts ?? [];
};
```

- [ ] **Step 4: Commit**

```bash
git add packages/symphony-kanban-web/src/pages/review/review-view.vue packages/symphony-kanban-web/src/pages/errors/blocked-error-handling-view.vue packages/symphony-kanban-web/src/pages/sessions/web-session-run.vue
git commit -m "feat(web): review/blocked/session wired to executions"
```

### Task 10: Issue detail view status and execution status polling

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-mvp-b-to-g-plan/packages/symphony-kanban-web/src/pages/issues/issue-detail-view.vue`

- [ ] **Step 1: Poll execution status**

```ts
const status = ref<string | null>(null);
const poll = async () => {
  if (!executionId.value) return;
  const res = await api.getExecutionStatus(executionId.value);
  status.value = res.data.status;
};
setInterval(poll, 5000);
```

- [ ] **Step 2: Commit**

```bash
git add packages/symphony-kanban-web/src/pages/issues/issue-detail-view.vue
git commit -m "feat(web): poll execution status on issue detail"
```

---

## Chunk 5: Cross-cutting verification

### Task 11: Full test run

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: PASS (report any pre-existing failures).

- [ ] **Step 2: Commit (if needed for test adjustments)**

```bash
git add -A
git commit -m "test: update snapshots/fixtures for MVP B-G"
```

---

## Plan Review Notes

This plan explicitly places scheduler configuration in the Tag & Workflow page (`/workflow`), as requested.
Artifacts are truncated to the most recent tail content (last `MAX_ARTIFACT_CHARS`) with original size recorded.


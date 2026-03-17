import { randomUUID } from "node:crypto";
import express from "express";
import { db } from "./db.js";
import {
  createExecution,
  insertArtifact,
  listArtifacts,
  listExecutionsByIssue,
  updateExecution,
} from "./execution-store.js";
import {
  getIssueById,
  getIssueByIdIncludingDeleted,
  listIssues,
  writeIssueEvent,
} from "./issue-store.js";
import {
  getSchedulerSettings,
  updateSchedulerSettings,
} from "./settings-store.js";
import { createTag, deleteTag, listTags, updateTag } from "./tag-store.js";
import {
  createWorkflowDef,
  listWorkflowDefs,
  updateWorkflowDef,
} from "./workflow-store.js";
import {
  createWorkspace,
  listWorkspaces,
  updateWorkspace,
} from "./workspace-store.js";
import { listOpenCodeProjects } from "./opencode-client.js";

export const app = express();
app.use(express.json({ limit: "5mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN ?? "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PATCH,DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization",
  );
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

const MAX_ARTIFACT_CHARS = 200_000;
const truncateTail = (input: string | null | undefined) => {
  if (!input) return { content: input ?? null, truncated: 0, size: 0 };
  const size = input.length;
  if (size <= MAX_ARTIFACT_CHARS) return { content: input, truncated: 0, size };
  const tail = input.slice(size - MAX_ARTIFACT_CHARS);
  return { content: tail, truncated: 1, size };
};

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/workspaces", (_req, res) => {
  res.json({ data: listWorkspaces() });
});

app.get("/workspaces/import/opencode/list", async (_req, res) => {
  try {
    const rows = await listOpenCodeProjects();
    res.json({
      data: rows.map((row) => ({
        name: row.name,
        localPath: row.local_path,
      })),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to list opencode projects", error);
    res.status(502).json({ error: "opencode_list_failed" });
  }
});

app.post("/workspaces", (req, res) => {
  const { name, localPath, context } = req.body ?? {};
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name required" });
    return;
  }
  const now = new Date().toISOString();
  const id = randomUUID();
  createWorkspace(id, name.trim(), localPath ?? null, context ?? null, now);
  res.status(201).json({ data: { id } });
});

app.patch("/workspaces/:id", (req, res) => {
  const { name, localPath, context } = req.body ?? {};
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name required" });
    return;
  }
  const now = new Date().toISOString();
  updateWorkspace(req.params.id, name.trim(), localPath ?? null, context ?? null, now);
  res.json({ ok: true });
});

app.get("/tags", (_req, res) => {
  res.json({ data: listTags() });
});

app.post("/tags", (req, res) => {
  const { name, type, color, rules, acceptanceCriteria } = req.body ?? {};
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name required" });
    return;
  }
  const now = new Date().toISOString();
  const id = randomUUID();
  createTag(
    id,
    name.trim(),
    type ?? null,
    color ?? null,
    rules ?? null,
    acceptanceCriteria ?? null,
    now,
  );
  res.status(201).json({
    data: {
      id,
      name: name.trim(),
      type: type ?? null,
      color: color ?? null,
      rules: rules ?? null,
      acceptanceCriteria: acceptanceCriteria ?? null,
      createdAt: now,
      updatedAt: now,
    },
  });
});

app.patch("/tags/:id", (req, res) => {
  const { name, type, color, rules, acceptanceCriteria } = req.body ?? {};
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name required" });
    return;
  }
  const now = new Date().toISOString();
  updateTag(
    req.params.id,
    name.trim(),
    type ?? null,
    color ?? null,
    rules ?? null,
    acceptanceCriteria ?? null,
    now,
  );
  res.json({ ok: true });
});

app.delete("/tags/:id", (req, res) => {
  deleteTag(req.params.id);
  res.json({ ok: true });
});

app.get("/issues", (_req, res) => {
  res.json({ data: listIssues() });
});

app.get("/workflows", (_req, res) => {
  res.json({ data: listWorkflowDefs() });
});

app.post("/workflows", (req, res) => {
  const { tagId, state, behavior, configJson } = req.body ?? {};
  if (!tagId || !state || !behavior) {
    res.status(400).json({ error: "invalid" });
    return;
  }
  const now = new Date().toISOString();
  const id = randomUUID();
  createWorkflowDef(id, tagId, state, behavior, configJson ?? null, now);
  res.status(201).json({ data: { id } });
});

app.patch("/workflows/:id", (req, res) => {
  const { state, behavior, configJson } = req.body ?? {};
  if (!state || !behavior) {
    res.status(400).json({ error: "invalid" });
    return;
  }
  const now = new Date().toISOString();
  updateWorkflowDef(req.params.id, state, behavior, configJson ?? null, now);
  res.json({ ok: true });
});

app.get("/settings/scheduler", (_req, res) => {
  res.json({ data: getSchedulerSettings() });
});

app.patch("/settings/scheduler", (req, res) => {
  const { maxConcurrency, pollIntervalMs } = req.body ?? {};
  if (typeof maxConcurrency !== "number" || typeof pollIntervalMs !== "number") {
    res.status(400).json({ error: "invalid settings" });
    return;
  }
  const now = new Date().toISOString();
  updateSchedulerSettings(maxConcurrency, pollIntervalMs, now);
  res.json({ ok: true });
});

app.get("/issues/:id", (req, res) => {
  const issue = getIssueById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: "issue not found" });
    return;
  }
  res.json({ data: issue });
});

app.post("/issues", (req, res) => {
  const { title, description, priority, workspace_id, tags } = req.body ?? {};

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  if (!workspace_id || typeof workspace_id !== "string") {
    res.status(400).json({ error: "workspace_id is required" });
    return;
  }

  const workspace = db
    .prepare("SELECT id FROM workspaces WHERE id = ?")
    .get(workspace_id);
  if (!workspace) {
    res.status(400).json({ error: "workspace_id does not exist" });
    return;
  }

  const now = new Date().toISOString();
  const issueId = randomUUID();
  const eventId = randomUUID();
  const status = "Backlog";
  const normalizedPriority =
    typeof priority === "number" ? priority : priority ? Number(priority) : null;

  const tagNames = Array.isArray(tags)
    ? Array.from(
        new Set(
          tags
            .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
            .filter((tag) => tag.length > 0),
        ),
      )
    : [];

  const insertIssue = db.prepare(
    `INSERT INTO issues
      (id, title, description, status, priority, workspace_id, created_at, updated_at)
     VALUES
      (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertEvent = db.prepare(
    `INSERT INTO issue_events
      (id, issue_id, event_type, payload, created_at)
     VALUES
      (?, ?, ?, ?, ?)`,
  );
  const selectTag = db.prepare("SELECT id FROM tags WHERE name = ?");
  const insertTag = db.prepare(
    "INSERT INTO tags (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
  );
  const insertIssueTag = db.prepare(
    "INSERT OR IGNORE INTO issue_tags (issue_id, tag_id) VALUES (?, ?)",
  );

  const tx = db.transaction(() => {
    insertIssue.run(
      issueId,
      title.trim(),
      description ? String(description) : null,
      status,
      Number.isNaN(normalizedPriority) ? null : normalizedPriority,
      workspace_id,
      now,
      now,
    );
    insertEvent.run(
      eventId,
      issueId,
      "created",
      JSON.stringify({
        status,
        priority: Number.isNaN(normalizedPriority)
          ? null
          : normalizedPriority,
        tags: tagNames,
      }),
      now,
    );

    for (const name of tagNames) {
      const existing = selectTag.get(name) as { id: string } | undefined;
      const tagId = existing?.id ?? randomUUID();
      if (!existing) {
        insertTag.run(tagId, name, now, now);
      }
      insertIssueTag.run(issueId, tagId);
    }
  });

  try {
    tx();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to create issue", error);
    res.status(500).json({ error: "failed to create issue" });
    return;
  }

  res.status(201).json({
    data: {
      id: issueId,
      title: title.trim(),
      description: description ? String(description) : null,
      status,
      priority: Number.isNaN(normalizedPriority) ? null : normalizedPriority,
      workspaceId: workspace_id,
      tags: tagNames,
      createdAt: now,
      updatedAt: now,
    },
  });
});

app.patch("/issues/:id", (req, res) => {
  const { id } = req.params;
  const existing = getIssueById(id);
  if (!existing) {
    res.status(404).json({ error: "issue not found" });
    return;
  }

  const { title, description, priority, workspace_id, status, tags } = req.body ?? {};

  if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
    res.status(400).json({ error: "title is invalid" });
    return;
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    res.status(400).json({ error: "description is invalid" });
    return;
  }

  if (workspace_id !== undefined) {
    if (typeof workspace_id !== "string") {
      res.status(400).json({ error: "workspace_id is invalid" });
      return;
    }
    const workspace = db
      .prepare("SELECT id FROM workspaces WHERE id = ?")
      .get(workspace_id);
    if (!workspace) {
      res.status(400).json({ error: "workspace_id does not exist" });
      return;
    }
  }

  if (status !== undefined && typeof status !== "string") {
    res.status(400).json({ error: "status is invalid" });
    return;
  }

  const normalizedPriority =
    priority === undefined
      ? undefined
      : typeof priority === "number"
        ? priority
        : priority === null
          ? null
          : Number(priority);

  if (
    normalizedPriority !== undefined &&
    normalizedPriority !== null &&
    Number.isNaN(normalizedPriority)
  ) {
    res.status(400).json({ error: "priority is invalid" });
    return;
  }

  if (tags !== undefined && !Array.isArray(tags)) {
    res.status(400).json({ error: "tags must be an array" });
    return;
  }

  const tagNames =
    tags === undefined
      ? null
      : Array.from(
          new Set(
            tags
              .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
              .filter((tag) => tag.length > 0),
          ),
        );

  const nextTitle = title !== undefined ? title.trim() : existing.title;
  const nextDescription =
    description !== undefined
      ? description === null
        ? null
        : String(description)
      : existing.description;
  const nextPriority =
    normalizedPriority === undefined ? existing.priority : normalizedPriority;
  const nextStatus = status !== undefined ? status : existing.status;
  const nextWorkspaceId =
    workspace_id !== undefined ? workspace_id : existing.workspaceId;

  const now = new Date().toISOString();
  const updateIssue = db.prepare(
    `UPDATE issues
     SET title = ?, description = ?, status = ?, priority = ?, workspace_id = ?, updated_at = ?
     WHERE id = ?`,
  );
  const deleteIssueTags = db.prepare("DELETE FROM issue_tags WHERE issue_id = ?");
  const selectTag = db.prepare("SELECT id FROM tags WHERE name = ?");
  const insertTag = db.prepare(
    "INSERT INTO tags (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
  );
  const insertIssueTag = db.prepare(
    "INSERT OR IGNORE INTO issue_tags (issue_id, tag_id) VALUES (?, ?)",
  );

  const tx = db.transaction(() => {
    updateIssue.run(
      nextTitle,
      nextDescription,
      nextStatus,
      nextPriority,
      nextWorkspaceId,
      now,
      id,
    );

    if (tagNames !== null) {
      deleteIssueTags.run(id);
      for (const name of tagNames) {
        const existingTag = selectTag.get(name) as { id: string } | undefined;
        const tagId = existingTag?.id ?? randomUUID();
        if (!existingTag) {
          insertTag.run(tagId, name, now, now);
        }
        insertIssueTag.run(id, tagId);
      }
    }
  });

  try {
    tx();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to update issue", error);
    res.status(500).json({ error: "failed to update issue" });
    return;
  }

  const snapshot = getIssueById(id);
  if (!snapshot) {
    res.status(500).json({ error: "failed to load updated issue" });
    return;
  }
  writeIssueEvent(id, "issue_updated", snapshot);

  res.json({ data: snapshot });
});

app.delete("/issues/:id", (req, res) => {
  const { id } = req.params;
  const existing = getIssueById(id);
  if (!existing) {
    res.status(404).json({ error: "issue not found" });
    return;
  }

  const now = new Date().toISOString();
  try {
    db.prepare("UPDATE issues SET deleted_at = ?, updated_at = ? WHERE id = ?").run(
      now,
      now,
      id,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to delete issue", error);
    res.status(500).json({ error: "failed to delete issue" });
    return;
  }

  const snapshot = getIssueByIdIncludingDeleted(id);
  if (!snapshot) {
    res.status(500).json({ error: "failed to load deleted issue" });
    return;
  }
  writeIssueEvent(id, "issue_deleted", snapshot);

  res.json({ data: snapshot });
});

app.post("/issues/:id/transition", (req, res) => {
  const { toStatus } = req.body ?? {};
  const issue = getIssueById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: "issue not found" });
    return;
  }
  if (
    toStatus !== "Done" &&
    toStatus !== "Review" &&
    toStatus !== "InProgress" &&
    toStatus !== "Blocked"
  ) {
    res.status(400).json({ error: "invalid status" });
    return;
  }
  if (toStatus === "Done") {
    const executions = listExecutionsByIssue(issue.id) as Array<{ id: string }>;
    const latest = executions[0];
    if (!latest) {
      res.status(400).json({ error: "no execution" });
      return;
    }
    const rows = listArtifacts(latest.id) as Array<{ type: string }>;
    const present = new Set(rows.map((r) => r.type));
    const required = ["log", "diff", "summary"];
    if (!required.every((t) => present.has(t))) {
      res.status(400).json({ error: "missing evidence" });
      return;
    }
    if (issue.tags.includes("ci-required") && !present.has("test")) {
      res.status(400).json({ error: "missing test evidence" });
      return;
    }
  }
  db.prepare("UPDATE issues SET status = ?, updated_at = ? WHERE id = ?").run(
    toStatus,
    new Date().toISOString(),
    issue.id,
  );
  res.json({ ok: true });
});

app.post("/issues/:id/retry", (req, res) => {
  const issue = getIssueById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: "issue not found" });
    return;
  }
  db.prepare("UPDATE issues SET status = ?, updated_at = ? WHERE id = ?").run(
    "Todo",
    new Date().toISOString(),
    issue.id,
  );
  res.json({ ok: true });
});

app.get("/issues/:id/executions", (req, res) => {
  res.json({ data: listExecutionsByIssue(req.params.id) });
});

app.get("/scheduler/claim", (_req, res) => {
  const tx = db.transaction(() => {
    const row = db
      .prepare(
        "SELECT id FROM issues WHERE status = 'Todo' ORDER BY COALESCE(priority, 1) ASC, created_at ASC LIMIT 1",
      )
      .get() as { id: string } | undefined;
    if (!row) return null;
    const now = new Date().toISOString();
    db.prepare("UPDATE issues SET status = ?, updated_at = ? WHERE id = ?").run(
      "InProgress",
      now,
      row.id,
    );
    const claimed = getIssueById(row.id);
    if (claimed) {
      writeIssueEvent(row.id, "scheduler_claimed", claimed);
    }
    return claimed;
  });
  const claimed = tx();
  if (!claimed) {
    res.json({ data: null });
    return;
  }
  res.json({ data: claimed });
});

app.post("/executions", (req, res) => {
  const { issueId, status, runner, attempt } = req.body ?? {};
  if (!issueId || !status || typeof attempt !== "number") {
    res.status(400).json({ error: "invalid" });
    return;
  }
  const now = new Date().toISOString();
  const id = randomUUID();
  createExecution(id, issueId, status, now, runner ?? null, attempt);
  res.status(201).json({ data: { id } });
});

app.patch("/executions/:id", (req, res) => {
  const { status, finishedAt, errorSummary } = req.body ?? {};
  if (!status) {
    res.status(400).json({ error: "invalid" });
    return;
  }
  updateExecution(req.params.id, status, finishedAt ?? null, errorSummary ?? null);
  res.json({ ok: true });
});

app.get("/executions/:id/status", (req, res) => {
  const row = db
    .prepare("SELECT id, status, finished_at as finishedAt FROM executions WHERE id = ?")
    .get(req.params.id);
  if (!row) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json({ data: row });
});

app.get("/executions/:id/artifacts", (req, res) => {
  res.json({ data: listArtifacts(req.params.id) });
});

app.post("/executions/:id/artifacts", (req, res) => {
  const { type, content, summary } = req.body ?? {};
  if (!type) {
    res.status(400).json({ error: "type required" });
    return;
  }
  const now = new Date().toISOString();
  const id = randomUUID();
  const { content: safe, truncated, size } = truncateTail(
    typeof content === "string" ? content : null,
  );
  insertArtifact(
    id,
    req.params.id,
    type,
    safe,
    typeof summary === "string" ? summary : null,
    truncated,
    size,
    now,
  );
  res.status(201).json({ data: { id, truncated: !!truncated } });
});

app.get("/review/:issueId", (req, res) => {
  const issue = getIssueById(req.params.issueId);
  if (!issue) {
    res.status(404).json({ error: "issue not found" });
    return;
  }
  const executions = listExecutionsByIssue(req.params.issueId) as Array<{ id: string }>;
  const latest = executions[0];
  if (!latest) {
    res.status(404).json({ error: "no executions" });
    return;
  }
  const artifacts = listArtifacts(latest.id);
  res.json({ data: { issue, execution: latest, artifacts } });
});

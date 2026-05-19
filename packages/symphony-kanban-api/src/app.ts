import { randomUUID } from "node:crypto";
import path from "node:path";
import express from "express";
import { db } from "./db.js";
import {
  createExecution,
  listArtifacts,
  listExecutionsByIssue,
  recordArtifact,
  updateExecution,
} from "./execution-store.js";
import {
  claimNextTodoIssue,
  getIssueById,
  getIssueByIdIncludingDeleted,
  listIssueEvents,
  listIssues,
  transitionIssueStatus,
  writeIssueEvent,
} from "./issue-store.js";
import {
  getSchedulerSettings,
  updateSchedulerSettings,
} from "./settings-store.js";
import { createTag, deleteTag, listTags, updateTag } from "./tag-store.js";
import {
  createWorkspace,
  findWorkspaceIdByLocalPath,
  listWorkspaces,
  updateWorkspace,
} from "./workspace-store.js";
import { listOpenCodeProjects } from "./opencode-client.js";
import { BUILTIN_TAG_NAMES } from "./builtin-tags.js";
import {
  PlannerModelNotConfiguredError,
  runPlannerChat,
  runPlannerCycle,
} from "./planner-agent.js";
import {
  acceptBounty,
  cancelBounty,
  createBounty,
  getBountyById,
  listBounties,
  listPlannerChatMessages,
  listMemories,
  listNotifications,
  listPointLedger,
  markNotificationRead,
  submitBounty,
} from "./planner-store.js";

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
      data: rows
        .map((row) => {
          if (!row || typeof row !== "object") return null;
          const record = row as Record<string, unknown>;
          const localPath =
            (typeof record.local_path === "string" && record.local_path) ||
            (typeof record.worktree === "string" && record.worktree) ||
            (typeof record.path === "string" && record.path) ||
            "";
          if (!localPath) return null;
          const normalizedPath = localPath.replace(/\\/g, "/");
          let name =
            (typeof record.name === "string" && record.name) ||
            (normalizedPath === "/" ? "Global" : path.basename(normalizedPath));
          if (!name) name = localPath;
          return { name, localPath: normalizedPath };
        })
        .filter(Boolean),
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

app.get("/workspaces/:id/deletion-check", (req, res) => {
  const { id } = req.params;
  const workspace = db
    .prepare("SELECT id FROM workspaces WHERE id = ?")
    .get(id) as { id: string } | undefined;
  if (!workspace) {
    res.status(404).json({ error: "workspace_not_found" });
    return;
  }

  const row = db
    .prepare(
      "SELECT COUNT(*) as count FROM issues WHERE workspace_id = ? AND deleted_at IS NULL",
    )
    .get(id) as { count: number };
  const issueCount = Number(row?.count ?? 0);
  res.json({ data: { deletable: issueCount === 0, issueCount } });
});

app.delete("/workspaces/:id", (req, res) => {
  const { id } = req.params;
  const workspace = db
    .prepare("SELECT id FROM workspaces WHERE id = ?")
    .get(id) as { id: string } | undefined;
  if (!workspace) {
    res.status(404).json({ error: "workspace_not_found" });
    return;
  }

  const row = db
    .prepare(
      "SELECT COUNT(*) as count FROM issues WHERE workspace_id = ? AND deleted_at IS NULL",
    )
    .get(id) as { count: number };
  const issueCount = Number(row?.count ?? 0);
  if (issueCount > 0) {
    res.status(409).json({ error: "workspace_not_empty", issueCount });
    return;
  }

  db.prepare("DELETE FROM workspaces WHERE id = ?").run(id);
  res.json({ ok: true });
});

app.post("/workspaces/import/opencode", (req, res) => {
  const { projects } = req.body ?? {};
  if (!Array.isArray(projects)) {
    res.status(400).json({ error: "projects_required" });
    return;
  }

  const imported: string[] = [];
  const skipped: string[] = [];
  const failed: Array<{ localPath: string; reason: string }> = [];
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    for (const item of projects) {
      const name = typeof item?.name === "string" ? item.name.trim() : "";
      const localPath = typeof item?.localPath === "string" ? item.localPath.trim() : "";

      if (!name || !localPath) {
        failed.push({ localPath: localPath || "(missing)", reason: "invalid" });
        continue;
      }

      const existing = findWorkspaceIdByLocalPath(localPath);
      if (existing) {
        skipped.push(localPath);
        continue;
      }

      const id = randomUUID();
      createWorkspace(id, name, localPath, null, now);
      imported.push(localPath);
    }
  });

  try {
    tx();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to import opencode workspaces", error);
    res.status(500).json({ error: "import_failed" });
    return;
  }

  res.json({ imported, skipped, failed });
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
  const {
    name,
    type,
    color,
    rules,
    acceptanceCriteria,
    state,
    behavior,
    workflowDefinition,
    afterCreate,
    beforeRemove,
  } = req.body ?? {};
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
    state ?? null,
    behavior ?? null,
    workflowDefinition ?? null,
    afterCreate ?? null,
    beforeRemove ?? null,
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
      state: state ?? null,
      behavior: behavior ?? null,
      workflowDefinition: workflowDefinition ?? null,
      afterCreate: afterCreate ?? null,
      beforeRemove: beforeRemove ?? null,
      createdAt: now,
      updatedAt: now,
    },
  });
});

app.patch("/tags/:id", (req, res) => {
  const {
    name,
    type,
    color,
    rules,
    acceptanceCriteria,
    state,
    behavior,
    workflowDefinition,
    afterCreate,
    beforeRemove,
  } = req.body ?? {};
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
    state ?? null,
    behavior ?? null,
    workflowDefinition ?? null,
    afterCreate ?? null,
    beforeRemove ?? null,
    now,
  );
  res.json({ ok: true });
});

app.delete("/tags/:id", (req, res) => {
  const row = db
    .prepare("SELECT name FROM tags WHERE id = ?")
    .get(req.params.id) as { name: string } | undefined;
  if (row && BUILTIN_TAG_NAMES.includes(row.name as (typeof BUILTIN_TAG_NAMES)[number])) {
    res.status(409).json({ error: "builtin_tag_protected" });
    return;
  }
  deleteTag(req.params.id);
  res.json({ ok: true });
});

app.get("/issues", (_req, res) => {
  res.json({ data: listIssues() });
});

app.delete("/issues", (_req, res) => {
  const activeIssues = listIssues();
  const now = new Date().toISOString();
  const snapshots = activeIssues.map((issue) => ({
    ...issue,
    updatedAt: now,
    deletedAt: now,
  }));

  const tx = db.transaction(() => {
    db.prepare(
      "UPDATE issues SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL",
    ).run(now, now);
    for (const snapshot of snapshots) {
      writeIssueEvent(snapshot.id, "issue_deleted", snapshot);
    }
  });

  try {
    tx();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to delete all issues", error);
    res.status(500).json({ error: "failed to delete all issues" });
    return;
  }

  res.json({ data: snapshots, deletedCount: snapshots.length });
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

app.post("/planner/cycle", (req, res) => {
  const issueIds = Array.isArray(req.body?.issueIds)
    ? req.body.issueIds.filter((id: unknown) => typeof id === "string")
    : undefined;
  res.json({ data: runPlannerCycle({ issueIds }) });
});

app.get("/planner/chat", (_req, res) => {
  res.json({ data: listPlannerChatMessages() });
});

app.post("/planner/chat", async (req, res) => {
  const { message } = req.body ?? {};
  if (typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "message required" });
    return;
  }
  try {
    res.json({ data: await runPlannerChat({ message }) });
  } catch (error) {
    if (error instanceof PlannerModelNotConfiguredError) {
      res.status(503).json({
        error: "planner_model_not_configured",
        message: error.message,
      });
      return;
    }
    // eslint-disable-next-line no-console
    console.error("Planner chat failed", error);
    res.status(502).json({
      error: "planner_agent_failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/bounties", (_req, res) => {
  res.json({ data: listBounties() });
});

app.post("/bounties", (req, res) => {
  const {
    issueId,
    title,
    question,
    context,
    acceptanceCriteria,
    points,
    createdBy,
  } = req.body ?? {};
  if (
    typeof issueId !== "string" ||
    typeof title !== "string" ||
    typeof question !== "string" ||
    typeof acceptanceCriteria !== "string" ||
    typeof points !== "number"
  ) {
    res.status(400).json({ error: "invalid bounty" });
    return;
  }
  const issue = getIssueById(issueId);
  if (!issue) {
    res.status(404).json({ error: "issue not found" });
    return;
  }
  const now = new Date().toISOString();
  const bounty = createBounty({
    issueId,
    title: title.trim(),
    question: question.trim(),
    context: typeof context === "string" ? context : null,
    acceptanceCriteria: acceptanceCriteria.trim(),
    points,
    createdBy:
      typeof createdBy === "string" && createdBy.trim().length > 0
        ? createdBy.trim()
        : "user",
    now,
  });
  res.status(201).json({ data: bounty });
});

app.post("/bounties/:id/submit", (req, res) => {
  const { assigneeName, response } = req.body ?? {};
  if (typeof assigneeName !== "string" || typeof response !== "string") {
    res.status(400).json({ error: "invalid submission" });
    return;
  }
  const bounty = submitBounty(
    req.params.id,
    assigneeName.trim(),
    response.trim(),
    new Date().toISOString(),
  );
  if (!bounty || bounty.status !== "submitted") {
    res.status(409).json({ error: "bounty_not_open" });
    return;
  }
  res.json({ data: bounty });
});

app.post("/bounties/:id/accept", (req, res) => {
  const bounty = acceptBounty(req.params.id, new Date().toISOString());
  if (!bounty) {
    res.status(409).json({ error: "bounty_not_submitted" });
    return;
  }
  const recoveryAction = req.body?.recoveryAction === "retry" ? "retry" : "keep_blocked";
  const applyToContext = req.body?.applyToContext === true;
  const recovery = db.transaction(() => {
    const issue = getIssueById(bounty.issueId);
    if (!issue) return null;
    const recoveryNote = [
      "Human handoff accepted",
      `Question: ${bounty.question}`,
      `Answer: ${bounty.response ?? ""}`,
      `Assignee: ${bounty.assigneeName ?? "unknown"}`,
      `Decision: ${recoveryAction}`,
    ].join("\n");

    if (applyToContext) {
      const nextDescription = [issue.description, recoveryNote]
        .filter((part): part is string => Boolean(part && part.trim().length > 0))
        .join("\n\n");
      db.prepare("UPDATE issues SET description = ?, updated_at = ? WHERE id = ?").run(
        nextDescription,
        new Date().toISOString(),
        issue.id,
      );
    }

    if (recoveryAction === "retry") {
      db.prepare("UPDATE issues SET status = 'Todo', updated_at = ? WHERE id = ?").run(
        new Date().toISOString(),
        issue.id,
      );
    }

    const snapshot = getIssueById(issue.id);
    writeIssueEvent(issue.id, "human_handoff_accepted", {
      bountyId: bounty.id,
      recoveryAction,
      appliedToContext: applyToContext,
      question: bounty.question,
      response: bounty.response,
      assigneeName: bounty.assigneeName,
      issue: snapshot,
    });
    return snapshot;
  })();
  res.json({ data: bounty, recovery });
});

app.post("/bounties/:id/cancel", (req, res) => {
  const bounty = cancelBounty(req.params.id, new Date().toISOString());
  if (!bounty) {
    res.status(404).json({ error: "bounty_not_found" });
    return;
  }
  res.json({ data: bounty });
});

app.get("/bounties/:id", (req, res) => {
  const bounty = getBountyById(req.params.id);
  if (!bounty) {
    res.status(404).json({ error: "bounty_not_found" });
    return;
  }
  res.json({ data: bounty });
});

app.get("/planner/notifications", (_req, res) => {
  res.json({ data: listNotifications() });
});

app.post("/planner/notifications/:id/read", (req, res) => {
  markNotificationRead(req.params.id, new Date().toISOString());
  res.json({ ok: true });
});

app.get("/planner/memories", (req, res) => {
  const scope = typeof req.query.scope === "string" ? req.query.scope : undefined;
  res.json({ data: listMemories(scope) });
});

app.get("/points", (_req, res) => {
  res.json({ data: listPointLedger() });
});

app.get("/issues/:id/events", (req, res) => {
  const issue = getIssueById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: "issue not found" });
    return;
  }
  res.json({ data: listIssueEvents(req.params.id) });
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
  const status = "Todo";
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
            (tags as unknown[])
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
  transitionIssueStatus(issue.id, toStatus, "issue_transitioned");
  res.json({ ok: true });
});

app.post("/issues/:id/retry", (req, res) => {
  const issue = getIssueById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: "issue not found" });
    return;
  }
  transitionIssueStatus(issue.id, "Todo", "issue_retry_requested");
  res.json({ ok: true });
});

app.get("/issues/:id/executions", (req, res) => {
  res.json({ data: listExecutionsByIssue(req.params.id) });
});

app.get("/scheduler/claim", (_req, res) => {
  const claimed = claimNextTodoIssue();
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
  const artifact = recordArtifact(
    id,
    req.params.id,
    type,
    typeof content === "string" ? content : null,
    typeof summary === "string" ? summary : null,
    now,
  );
  res.status(201).json({ data: artifact });
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

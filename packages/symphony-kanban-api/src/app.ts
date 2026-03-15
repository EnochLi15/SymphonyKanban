import { randomUUID } from "node:crypto";
import express from "express";
import { db } from "./db.js";
import {
  getIssueById,
  getIssueByIdIncludingDeleted,
  listIssues,
  writeIssueEvent,
} from "./issue-store.js";

export const app = express();
app.use(express.json());
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
  const rows = db
    .prepare("SELECT id, name, created_at as createdAt FROM workspaces")
    .all();
  res.json({ data: rows });
});

app.get("/tags", (_req, res) => {
  const rows = db
    .prepare("SELECT id, name, created_at as createdAt FROM tags ORDER BY name")
    .all();
  res.json({ data: rows });
});

app.get("/issues", (_req, res) => {
  res.json({ data: listIssues() });
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
    "INSERT INTO tags (id, name, created_at) VALUES (?, ?, ?)",
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
        insertTag.run(tagId, name, now);
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
    "INSERT INTO tags (id, name, created_at) VALUES (?, ?, ?)",
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
          insertTag.run(tagId, name, now);
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

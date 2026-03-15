import { randomUUID } from "node:crypto";
import express from "express";
import { db } from "./db.js";

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN ?? "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
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

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on :${port}`);
});

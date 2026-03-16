import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { db } from "../src/db.js";
import { app } from "../src/app.js";

type IssueSnapshot = { id: string; status: string; updated_at: string | null };

const insertTodoIssue = (priority: number | null, createdAt: string) => {
  const id = `issue-${Math.random().toString(36).slice(2)}`;
  db.prepare(
    "INSERT INTO issues (id, title, description, status, priority, workspace_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(id, `Test ${id}`, "", "Todo", priority, "wksp-default", createdAt, createdAt);
  return id;
};

let existingTodos: IssueSnapshot[] = [];

beforeEach(() => {
  existingTodos = db
    .prepare("SELECT id, status, updated_at FROM issues WHERE status = 'Todo'")
    .all() as IssueSnapshot[];
  if (existingTodos.length > 0) {
    db.prepare("UPDATE issues SET status = 'Backlog' WHERE status = 'Todo'").run();
  }
});

afterEach(() => {
  if (existingTodos.length > 0) {
    const restore = db.prepare(
      "UPDATE issues SET status = ?, updated_at = ? WHERE id = ?",
    );
    existingTodos.forEach((row) => {
      restore.run(row.status, row.updated_at ?? new Date().toISOString(), row.id);
    });
  }
  db.prepare("DELETE FROM issues WHERE title LIKE 'Test issue-%'").run();
});

describe("scheduler claim", () => {
  it("claims the highest priority (lowest number) todo first", async () => {
    const now = new Date();
    insertTodoIssue(2, new Date(now.getTime() - 2000).toISOString());
    const highestId = insertTodoIssue(0, new Date(now.getTime() - 1000).toISOString());
    insertTodoIssue(null, new Date(now.getTime()).toISOString());

    const res = await request(app).get("/scheduler/claim");
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(highestId);

    const nextRes = await request(app).get("/scheduler/claim");
    expect(nextRes.status).toBe(200);
    expect(nextRes.body.data.priority).toBeNull();
  });
});

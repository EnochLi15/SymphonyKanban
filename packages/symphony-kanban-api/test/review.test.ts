import { describe, expect, it } from "vitest";
import request from "supertest";
import { db } from "../src/db.js";
import { app } from "../src/app.js";

const createIssueWithExecution = () => {
  const issueId = `issue-${Math.random().toString(36).slice(2)}`;
  const execId = `exec-${Math.random().toString(36).slice(2)}`;
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO issues (id, title, description, status, priority, workspace_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(issueId, "Review", "", "Review", 1, "wksp-default", now, now);
  db.prepare(
    "INSERT INTO executions (id, issue_id, status, started_at, runner, attempt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(execId, issueId, "succeeded", now, "test", 1, now);
  db.prepare(
    "INSERT INTO execution_artifacts (id, execution_id, type, content, summary, content_truncated, content_size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    `art-${Math.random().toString(36).slice(2)}`,
    execId,
    "summary",
    "ok",
    null,
    0,
    2,
    now,
  );
  return { issueId, execId };
};

describe("review api", () => {
  it("returns review aggregate", async () => {
    const { issueId } = createIssueWithExecution();
    const res = await request(app).get(`/review/${issueId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.issue.id).toBe(issueId);
  });

  it("rejects Done when missing evidence", async () => {
    const { issueId } = createIssueWithExecution();
    const res = await request(app)
      .post(`/issues/${issueId}/transition`)
      .send({ toStatus: "Done" });
    expect(res.status).toBe(400);
  });
});

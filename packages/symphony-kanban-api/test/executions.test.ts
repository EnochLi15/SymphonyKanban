import { describe, expect, it } from "vitest";
import request from "supertest";
import { db } from "../src/db.js";
import { app } from "../src/app.js";

const createIssue = () => {
  const id = `issue-${Math.random().toString(36).slice(2)}`;
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO issues (id, title, description, status, priority, workspace_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(id, "Test", "", "Todo", 1, "wksp-default", now, now);
  return id;
};

describe("executions api", () => {
  it("creates execution and stores artifacts with truncation", async () => {
    const issueId = createIssue();
    const createRes = await request(app)
      .post("/executions")
      .send({ issueId, status: "running", attempt: 1, runner: "test" });
    expect(createRes.status).toBe(201);
    const executionId = createRes.body.data.id as string;

    const big = "a".repeat(210_000);
    const artifactRes = await request(app)
      .post(`/executions/${executionId}/artifacts`)
      .send({ type: "log", content: big });
    expect(artifactRes.status).toBe(201);

    const listRes = await request(app).get(`/executions/${executionId}/artifacts`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data[0].contentTruncated).toBe(1);
  });
});

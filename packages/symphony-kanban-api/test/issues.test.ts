import { describe, expect, it } from "vitest";
import { db } from "../src/db.js";
import request from "supertest";

describe("schema", () => {
  it("includes deleted_at on issues", () => {
    const cols = db.prepare("PRAGMA table_info(issues)").all() as Array<{ name: string }>;
    const names = cols.map((c) => c.name);
    expect(names).toContain("deleted_at");
  });

  it("includes execution tables", () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as Array<{ name: string }>;
    const names = tables.map((t) => t.name);
    expect(names).toContain("executions");
    expect(names).toContain("execution_artifacts");
    expect(names).toContain("workflow_defs");
    expect(names).toContain("scheduler_settings");
    expect(names).toContain("bounty_tasks");
    expect(names).toContain("planner_notifications");
    expect(names).toContain("planner_memories");
    expect(names).toContain("planner_runs");
    expect(names).toContain("point_ledger");
  });

  it("adds workspace context columns", () => {
    const cols = db.prepare("PRAGMA table_info(workspaces)").all() as Array<{ name: string }>;
    const names = cols.map((c) => c.name);
    expect(names).toContain("local_path");
    expect(names).toContain("context");
    expect(names).toContain("updated_at");
  });
});

describe("app", () => {
  it("exports express app", async () => {
    const { app } = await import("../src/app.js");
    expect(app).toBeTruthy();
  });
});

describe("issue-store", () => {
  it("returns tags as name list", async () => {
    const { getIssueById } = await import("../src/issue-store.js");
    const row = db
      .prepare("SELECT id FROM issues WHERE deleted_at IS NULL LIMIT 1")
      .get() as { id: string } | undefined;
    if (!row) return;
    const issue = getIssueById(row.id);
    expect(issue?.tags).toBeDefined();
  });
});

describe("issues api", () => {
  it("returns 404 for missing issue", async () => {
    const { app } = await import("../src/app.js");
    const res = await request(app).get("/issues/non-existent");
    expect(res.status).toBe(404);
  });
});

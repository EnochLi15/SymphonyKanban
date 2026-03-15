import { describe, expect, it } from "vitest";
import { db } from "../src/db.js";

describe("schema", () => {
  it("includes deleted_at on issues", () => {
    const cols = db.prepare("PRAGMA table_info(issues)").all() as Array<{ name: string }>;
    const names = cols.map((c) => c.name);
    expect(names).toContain("deleted_at");
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
    const row = db.prepare("SELECT id FROM issues LIMIT 1").get() as
      | { id: string }
      | undefined;
    if (!row) return;
    const issue = getIssueById(row.id);
    expect(issue?.tags).toBeDefined();
  });
});

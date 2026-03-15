import { describe, expect, it } from "vitest";
import { db } from "../src/db.js";

describe("schema", () => {
  it("includes deleted_at on issues", () => {
    const cols = db.prepare("PRAGMA table_info(issues)").all() as Array<{ name: string }>;
    const names = cols.map((c) => c.name);
    expect(names).toContain("deleted_at");
  });
});

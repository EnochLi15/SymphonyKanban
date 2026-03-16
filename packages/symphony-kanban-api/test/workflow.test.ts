import { describe, expect, it } from "vitest";
import request from "supertest";
import { db } from "../src/db.js";
import { app } from "../src/app.js";

const ensureTag = () => {
  const id = `tag-${Math.random().toString(36).slice(2)}`;
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO tags (id, name, type, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(id, `tag-${id}`, null, null, now, now);
  return id;
};

describe("workflow api", () => {
  it("creates workflow definition", async () => {
    const tagId = ensureTag();
    const res = await request(app)
      .post("/workflows")
      .send({ tagId, state: "Todo", behavior: "ci-required", configJson: "{}" });
    expect(res.status).toBe(201);

    const listRes = await request(app).get("/workflows");
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

const makeName = () => `spec-tag-${Math.random().toString(36).slice(2)}`;

describe("tags api", () => {
  it("persists rules and acceptance criteria", async () => {
    const name = makeName();
    const createRes = await request(app)
      .post("/tags")
      .send({ name, rules: "rule-1", acceptanceCriteria: "acc-1" });
    expect(createRes.status).toBe(201);

    const listRes = await request(app).get("/tags");
    expect(listRes.status).toBe(200);
    const found = listRes.body.data.find((tag: any) => tag.name === name);
    expect(found).toBeDefined();
    expect(found.rules).toBe("rule-1");
    expect(found.acceptanceCriteria).toBe("acc-1");

    const updateRes = await request(app)
      .patch(`/tags/${found.id}`)
      .send({ name, rules: "rule-2", acceptanceCriteria: "acc-2" });
    expect(updateRes.status).toBe(200);
  });
});

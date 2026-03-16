import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";


describe("scheduler settings", () => {
  it("returns scheduler settings", async () => {
    const res = await request(app).get("/settings/scheduler");
    expect(res.status).toBe(200);
    expect(res.body.data.maxConcurrency).toBeDefined();
  });

  it("updates scheduler settings", async () => {
    const res = await request(app)
      .patch("/settings/scheduler")
      .send({ maxConcurrency: 2, pollIntervalMs: 4000 });
    expect(res.status).toBe(200);
  });
});

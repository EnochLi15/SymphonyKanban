import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
let app;
let db;
let tmpDir;
beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-kanban-api-"));
    process.env.DB_PATH = path.join(tmpDir, "kanban.sqlite");
    ({ app } = await import("./app.js"));
    ({ db } = await import("./db.js"));
});
afterAll(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.DB_PATH;
});
describe("DELETE /issues", () => {
    it("soft deletes all active issues", async () => {
        const workspaceResponse = await request(app).get("/workspaces").expect(200);
        const workspaceId = workspaceResponse.body.data[0].id;
        await request(app)
            .post("/issues")
            .send({ title: "First issue", workspace_id: workspaceId })
            .expect(201);
        await request(app)
            .post("/issues")
            .send({ title: "Second issue", workspace_id: workspaceId })
            .expect(201);
        await request(app).get("/issues").expect(({ body }) => {
            expect(body.data).toHaveLength(2);
        });
        await request(app)
            .delete("/issues")
            .expect(200)
            .expect(({ body }) => {
            expect(body.deletedCount).toBe(2);
            expect(body.data).toHaveLength(2);
            expect(body.data.every((issue) => issue.deletedAt)).toBe(true);
        });
        await request(app).get("/issues").expect(({ body }) => {
            expect(body.data).toEqual([]);
        });
        await request(app)
            .delete("/issues")
            .expect(200)
            .expect(({ body }) => {
            expect(body.deletedCount).toBe(0);
            expect(body.data).toEqual([]);
        });
    });
});

import { describe, expect, it } from "vitest";
import request from "supertest";
import { db } from "../src/db.js";

const cleanupWorkspace = (workspaceId: string) => {
  db.prepare("DELETE FROM issues WHERE workspace_id = ?").run(workspaceId);
  db.prepare("DELETE FROM workspaces WHERE id = ?").run(workspaceId);
};

describe("workspace deletion", () => {
  it("returns deletable=false with issue count when issues exist", async () => {
    const { app } = await import("../src/app.js");
    const workspaceRes = await request(app)
      .post("/workspaces")
      .send({ name: "Workspace A" });

    const workspaceId = workspaceRes.body.data.id as string;

    try {
      await request(app).post("/issues").send({
        title: "Issue 1",
        description: "",
        priority: 2,
        workspace_id: workspaceId,
        tags: [],
      });

      const res = await request(app).get(
        `/workspaces/${workspaceId}/deletion-check`,
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ deletable: false, issueCount: 1 });
    } finally {
      cleanupWorkspace(workspaceId);
    }
  });

  it("returns deletable=true with issueCount=0 when no issues", async () => {
    const { app } = await import("../src/app.js");
    const workspaceRes = await request(app)
      .post("/workspaces")
      .send({ name: "Workspace B" });

    const workspaceId = workspaceRes.body.data.id as string;

    try {
      const res = await request(app).get(
        `/workspaces/${workspaceId}/deletion-check`,
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ deletable: true, issueCount: 0 });
    } finally {
      cleanupWorkspace(workspaceId);
    }
  });

  it("rejects delete with 409 when issues exist", async () => {
    const { app } = await import("../src/app.js");
    const workspaceRes = await request(app)
      .post("/workspaces")
      .send({ name: "Workspace C" });

    const workspaceId = workspaceRes.body.data.id as string;

    try {
      await request(app).post("/issues").send({
        title: "Issue 2",
        description: "",
        priority: 2,
        workspace_id: workspaceId,
        tags: [],
      });

      const res = await request(app).delete(`/workspaces/${workspaceId}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("workspace_not_empty");
      expect(res.body.issueCount).toBe(1);
    } finally {
      cleanupWorkspace(workspaceId);
    }
  });

  it("deletes workspace when no issues", async () => {
    const { app } = await import("../src/app.js");
    const workspaceRes = await request(app)
      .post("/workspaces")
      .send({ name: "Workspace D" });

    const workspaceId = workspaceRes.body.data.id as string;

    const res = await request(app).delete(`/workspaces/${workspaceId}`);

    try {
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      const listRes = await request(app).get("/workspaces");
      expect(listRes.body.data.find((w: any) => w.id === workspaceId)).toBeFalsy();
    } finally {
      cleanupWorkspace(workspaceId);
    }
  });
});

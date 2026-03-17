import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

vi.mock("@opencode-ai/sdk", () => ({
  createOpencode: () => ({
    client: {
      project: {
        list: vi.fn(async () => [
          { name: "Alpha", local_path: "/repo/alpha" },
          { name: "Beta", local_path: "/repo/beta" },
        ]),
      },
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("opencode import api", () => {
  it("lists opencode projects", async () => {
    const res = await request(app).get("/workspaces/import/opencode/list");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      { name: "Alpha", localPath: "/repo/alpha" },
      { name: "Beta", localPath: "/repo/beta" },
    ]);
  });

  it("imports workspaces and skips existing local paths", async () => {
    await request(app)
      .post("/workspaces")
      .send({ name: "Existing", localPath: "/repo/exist" });

    const res = await request(app)
      .post("/workspaces/import/opencode")
      .send({
        projects: [
          { name: "Existing", localPath: "/repo/exist" },
          { name: "New", localPath: "/repo/new" },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.imported).toEqual(["/repo/new"]);
    expect(res.body.skipped).toEqual(["/repo/exist"]);
    expect(res.body.failed).toEqual([]);
  });
});

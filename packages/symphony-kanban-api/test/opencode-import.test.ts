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
});

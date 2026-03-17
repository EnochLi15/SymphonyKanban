import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { __resetOpenCodeClient } from "../src/opencode-client.js";

const listMock = vi.fn();
const createOpencodeMock = vi.fn();
const createOpencodeClientMock = vi.fn();

vi.mock("@opencode-ai/sdk", () => ({
  createOpencode: (...args: unknown[]) => createOpencodeMock(...args),
  createOpencodeClient: (...args: unknown[]) => createOpencodeClientMock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  __resetOpenCodeClient();
  listMock.mockResolvedValue([
    { name: "Alpha", local_path: "/repo/alpha" },
    { name: "Beta", local_path: "/repo/beta" },
  ]);
  createOpencodeMock.mockResolvedValue({
    client: {
      project: {
        list: listMock,
      },
    },
  });
  createOpencodeClientMock.mockReturnValue({
    project: {
      list: listMock,
    },
  });
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

  it("falls back to client when server is already running", async () => {
    createOpencodeMock.mockRejectedValueOnce(
      new Error("Failed to start server on port 4096"),
    );

    const res = await request(app).get("/workspaces/import/opencode/list");
    expect(res.status).toBe(200);
    expect(createOpencodeClientMock).toHaveBeenCalled();
    expect(res.body.data).toEqual([
      { name: "Alpha", localPath: "/repo/alpha" },
      { name: "Beta", localPath: "/repo/beta" },
    ]);
  });

  it("imports workspaces and skips existing local paths", async () => {
    const existingPath = `/repo/exist-${Math.random().toString(36).slice(2)}`;
    const newPath = `/repo/new-${Math.random().toString(36).slice(2)}`;
    await request(app)
      .post("/workspaces")
      .send({ name: "Existing", localPath: existingPath });

    const res = await request(app)
      .post("/workspaces/import/opencode")
      .send({
        projects: [
          { name: "Existing", localPath: existingPath },
          { name: "New", localPath: newPath },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.imported).toEqual([newPath]);
    expect(res.body.skipped).toEqual([existingPath]);
    expect(res.body.failed).toEqual([]);
  });
});

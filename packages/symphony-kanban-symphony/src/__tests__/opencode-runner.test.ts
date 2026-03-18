import { describe, expect, it } from "vitest";
import { resolveOpencodeProjectId } from "../opencode-runner.js";

describe("resolveOpencodeProjectId", () => {
  it("prefers workspace-derived project id when workspace path is available", () => {
    const workspacePath = "/Users/enoch/Workspace/test-sp";
    const rawProjectId = "L1VzZXJzL--_vXrvv73vv70c77-977-977-956ed77-9fx_Rve-_vem2mu-_ve-_vTbvv71uXXXvv719";
    const expected = Buffer.from(workspacePath, "utf8").toString("base64");

    const result = resolveOpencodeProjectId(rawProjectId, workspacePath, null);

    expect(result).toBe(expected);
  });

  it("falls back to raw project id when workspace path is missing", () => {
    const rawProjectId = "proj-raw";

    const result = resolveOpencodeProjectId(rawProjectId, null, null);

    expect(result).toBe(rawProjectId);
  });

  it("uses session directory when workspace path is missing", () => {
    const sessionDirectory = "/Users/enoch/Workspace/test-sp";
    const rawProjectId = "proj-raw";
    const expected = Buffer.from(sessionDirectory, "utf8").toString("base64");

    const result = resolveOpencodeProjectId(rawProjectId, null, sessionDirectory);

    expect(result).toBe(expected);
  });
});

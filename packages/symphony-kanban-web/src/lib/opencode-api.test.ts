import { describe, expect, it, vi } from "vitest";
import { buildApi } from "./api";

describe("opencode api", () => {
  it("calls list opencode projects endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    const api = buildApi("http://localhost:3001");
    await api.listOpencodeProjects();

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3001/workspaces/import/opencode/list",
    );

    fetchSpy.mockRestore();
  });

  it("calls import opencode projects endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ imported: [], skipped: [], failed: [] }),
    } as Response);

    const api = buildApi("http://localhost:3001");
    await api.importOpencodeProjects({
      projects: [{ name: "Alpha", localPath: "/repo/alpha" }],
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3001/workspaces/import/opencode",
      expect.objectContaining({ method: "POST" }),
    );

    fetchSpy.mockRestore();
  });
});

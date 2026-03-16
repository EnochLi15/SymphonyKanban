import { describe, expect, it, vi } from "vitest";
import { startScheduler } from "../scheduler.js";

describe("scheduler", () => {
  it("claims todo when under concurrency", async () => {
    vi.stubGlobal("setTimeout", ((fn: (...args: unknown[]) => void) => 0) as typeof setTimeout);
    const fetchMock = vi.fn(async (url: string) => ({
      json: async () => {
        if (String(url).includes("/settings/scheduler")) {
          return { data: { maxConcurrency: 1, pollIntervalMs: 10 } };
        }
        if (String(url).includes("/scheduler/claim")) {
          return { data: null };
        }
        return { data: null };
      },
    }));
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    startScheduler({ apiBase: "http://api", opencodeBase: "http://opencode" });
    await new Promise((resolve) => setImmediate(resolve));

    const calledUrls = fetchMock.mock.calls.map((call) => call[0]);
    expect(calledUrls.some((url) => String(url).includes("/settings/scheduler"))).toBe(true);
    expect(calledUrls.some((url) => String(url).includes("/scheduler/claim"))).toBe(true);

    vi.unstubAllGlobals();
  });
});

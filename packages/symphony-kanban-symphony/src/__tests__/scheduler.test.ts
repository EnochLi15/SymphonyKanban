import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { startScheduler } from "../scheduler.js";

const sessionCreate = vi.fn();
const sessionPromptAsync = vi.fn();
const sessionMessages = vi.fn();
const sessionDiff = vi.fn();
const eventSubscribe = vi.fn();

vi.mock("@opencode-ai/sdk", () => ({
  createOpencodeClient: () => ({
    session: {
      create: sessionCreate,
      promptAsync: sessionPromptAsync,
      messages: sessionMessages,
      diff: sessionDiff,
    },
    event: { subscribe: eventSubscribe },
  }),
}));

describe("scheduler", () => {
  beforeEach(() => {
    sessionCreate.mockReset();
    sessionPromptAsync.mockReset();
    sessionMessages.mockReset();
    sessionDiff.mockReset();
    eventSubscribe.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  });

  it("records opencode project id as artifact", async () => {
    const addArtifactBody: Array<{ type: string; content: string }> = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes("/settings/scheduler")) {
        return { ok: true, json: async () => ({ data: { maxConcurrency: 1, pollIntervalMs: 10 } }) };
      }
      if (String(url).includes("/scheduler/claim")) {
        return {
          ok: true,
          json: async () => ({
            data: {
              id: "issue-1",
              title: "Test",
              description: "",
              tags: [],
              workspaceId: "wksp-default",
            },
          }),
        };
      }
      if (String(url).includes("/workspaces")) {
        return { ok: true, json: async () => ({ data: [] }) };
      }
      if (String(url).includes("/executions/") && String(url).includes("/artifacts")) {
        if (init?.method === "POST") {
          const body = init?.body ? JSON.parse(String(init.body)) : {};
          addArtifactBody.push({ type: body.type, content: body.content });
        }
        return { ok: true, json: async () => ({ data: { id: "artifact-1" } }) };
      }
      if (String(url).includes("/executions") && init?.method === "POST") {
        return { ok: true, json: async () => ({ data: { id: "exec-1" } }) };
      }
      if (String(url).includes("/executions/") && init?.method === "PATCH") {
        return { ok: true, json: async () => ({ ok: true }) };
      }
      if (String(url).includes("/issues/") && String(url).includes("/transition")) {
        return { ok: true, json: async () => ({ ok: true }) };
      }
      return { ok: true, json: async () => ({ data: null }) };
    });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    sessionCreate.mockResolvedValue({ data: { id: "sess-1", projectID: "proj-1" } });
    sessionPromptAsync.mockResolvedValue({});
    sessionMessages.mockResolvedValue({ data: [] });
    sessionDiff.mockResolvedValue({ data: [] });
    eventSubscribe.mockResolvedValue({
      stream: (async function* () {
        yield { type: "session.idle", properties: {} };
      })(),
    });

    await startScheduler({ apiBase: "http://api", opencodeBase: "http://opencode" });
    const waitFor = async (predicate: () => boolean, timeoutMs = 200) => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        if (predicate()) return;
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    };
    await waitFor(() => addArtifactBody.length > 0);

    const hasProjectArtifact = addArtifactBody.some((artifact) => artifact.type === "opencode_project");
    expect(hasProjectArtifact).toBe(true);
  });
});

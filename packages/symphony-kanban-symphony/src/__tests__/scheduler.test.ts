import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { startScheduler, waitForApiReady } from "../scheduler.js";

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
      ok: true,
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

    const scheduler = await startScheduler({
      apiBase: "http://api",
      opencodeBase: "http://opencode",
    });
    await new Promise((resolve) => setImmediate(resolve));

    const calledUrls = fetchMock.mock.calls.map((call) => call[0]);
    expect(calledUrls.some((url) => String(url).includes("/settings/scheduler"))).toBe(true);
    expect(calledUrls.some((url) => String(url).includes("/scheduler/claim"))).toBe(true);
    scheduler.stop();

  });

  it("waits for API readiness and logs on cadence", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.stubGlobal("setTimeout", ((fn: (...args: unknown[]) => void) => {
      fn();
      return 0;
    }) as typeof setTimeout);

    let attempt = 0;
    const fetchMock = vi.fn(async () => {
      attempt += 1;
      if (attempt < 3) {
        throw new Error("not ready");
      }
      return { ok: true, json: async () => ({ data: {} }) };
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    await waitForApiReady({ apiBase: "http://api", retryIntervalMs: 1, logEvery: 2 });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain("attempt 2");
    expect(logSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
    logSpy.mockRestore();
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

    const scheduler = await startScheduler({
      apiBase: "http://api",
      opencodeBase: "http://opencode",
    });
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
    scheduler.stop();
  });

  it("injects workflow context into opencode prompt", async () => {
    const promptBodies: Array<{ text: string }> = [];
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
              tags: ["UserStory"],
              workspaceId: "wksp-default",
            },
          }),
        };
      }
      if (String(url).includes("/workspaces")) {
        return { ok: true, json: async () => ({ data: [] }) };
      }
      if (String(url).includes("/tags")) {
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: "tag-1",
                name: "UserStory",
                workflowDefinition: "流程定义",
                rules: "rule-1",
                acceptanceCriteria: "acc-1",
              },
            ],
          }),
        };
      }
      if (String(url).includes("/executions/") && String(url).includes("/artifacts")) {
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
    sessionPromptAsync.mockImplementation(async (payload: any) => {
      const text = payload?.body?.parts?.[0]?.text ?? "";
      promptBodies.push({ text });
      return {};
    });
    sessionMessages.mockResolvedValue({ data: [] });
    sessionDiff.mockResolvedValue({ data: [] });
    eventSubscribe.mockResolvedValue({
      stream: (async function* () {
        yield { type: "session.idle", properties: {} };
      })(),
    });

    const scheduler = await startScheduler({
      apiBase: "http://api",
      opencodeBase: "http://opencode",
    });
    const waitFor = async (predicate: () => boolean, timeoutMs = 200) => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        if (predicate()) return;
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    };
    await waitFor(() => promptBodies.length > 0);

    expect(promptBodies[0]?.text).toContain("工作流定义");
    expect(promptBodies[0]?.text).toContain("规则");
    expect(promptBodies[0]?.text).toContain("验收标准");
    scheduler.stop();
  });
});

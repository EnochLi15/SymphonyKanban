import { beforeEach, describe, expect, it, vi } from "vitest";

const createOpencodeMock = vi.fn();
const createOpencodeClientMock = vi.fn();

vi.mock("@opencode-ai/sdk", () => ({
  createOpencode: (...args: unknown[]) => createOpencodeMock(...args),
  createOpencodeClient: (...args: unknown[]) => createOpencodeClientMock(...args),
}));

const makeClient = ({
  failCreate = false,
  sessionId = "session-1",
}: {
  failCreate?: boolean;
  sessionId?: string;
} = {}) => ({
  session: {
    create: vi.fn(async () => {
      if (failCreate) {
        throw new TypeError("fetch failed");
      }
      return {
        data: {
          id: sessionId,
          projectID: "project-1",
          directory: "/repo/example",
        },
      };
    }),
    promptAsync: vi.fn(async () => ({})),
    diff: vi.fn(async () => ({ data: {} })),
    messages: vi.fn(async () => ({
      data: [{ parts: [{ type: "text", text: "done" }] }],
    })),
  },
  event: {
    subscribe: vi.fn(async () => ({
      stream: (async function* () {
        yield { type: "session.idle", properties: { sessionID: sessionId } };
      })(),
    })),
  },
});

beforeEach(async () => {
  vi.clearAllMocks();
  const { __resetEmbeddedOpencodeServer } = await import("../src/opencode-runner.js");
  __resetEmbeddedOpencodeServer();
});

describe("opencode runner", () => {
  it("starts embedded opencode server and retries when the default local base is unavailable", async () => {
    const unavailableClient = makeClient({ failCreate: true });
    const embeddedClient = makeClient({ sessionId: "session-embedded" });
    createOpencodeClientMock
      .mockReturnValueOnce(unavailableClient)
      .mockReturnValueOnce(embeddedClient);
    createOpencodeMock.mockResolvedValue({
      server: {
        url: "http://127.0.0.1:4096",
        close: vi.fn(),
      },
    });

    const { runOpencode } = await import("../src/opencode-runner.js");
    const artifacts: Array<{ type: string; content: string; summary?: string }> = [];

    const result = await runOpencode({
      baseUrl: "http://localhost:4096",
      issue: { id: "issue-1", title: "Test issue", tags: [] },
      context: null,
      workspacePath: null,
      onArtifact: async (type, content, summary) => {
        artifacts.push({ type, content, summary });
      },
    });

    expect(result.status).toBe("succeeded");
    expect(createOpencodeMock).toHaveBeenCalledTimes(1);
    expect(createOpencodeClientMock).toHaveBeenLastCalledWith({
      baseUrl: "http://127.0.0.1:4096",
    });
    expect(artifacts.map((artifact) => artifact.type)).toEqual([
      "session",
      "opencode_project",
      "log",
      "diff",
      "summary",
    ]);
  });
});

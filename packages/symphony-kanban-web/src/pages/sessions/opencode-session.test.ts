import { describe, expect, it } from "vitest";
import { buildOpencodeSessionUrl } from "./opencode-session";

describe("buildOpencodeSessionUrl", () => {
  it("builds url with project and session", () => {
    const url = buildOpencodeSessionUrl("http://127.0.0.1:4096", "proj-1", "sess-1");
    expect(url).toBe("http://127.0.0.1:4096/proj-1/session/sess-1");
  });
});

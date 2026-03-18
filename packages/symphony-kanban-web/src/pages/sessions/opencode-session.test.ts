import { describe, expect, it } from "vitest";
import { buildOpencodeSessionUrl, resolveOpencodeSessionUrl } from "./opencode-session";

describe("buildOpencodeSessionUrl", () => {
  it("builds url with project and session", () => {
    const url = buildOpencodeSessionUrl("http://127.0.0.1:4096", "proj-1", "sess-1");
    expect(url).toBe("http://127.0.0.1:4096/proj-1/session/sess-1");
  });
});

describe("resolveOpencodeSessionUrl", () => {
  it("returns empty string when missing session or project", () => {
    const artifacts = [{ type: "session", content: "sess-1" }];
    expect(resolveOpencodeSessionUrl("http://base", artifacts)).toBe("");
  });

  it("returns session url when both artifacts exist", () => {
    const artifacts = [
      { type: "session", content: "sess-1" },
      { type: "opencode_project", content: "proj-1" },
    ];
    expect(resolveOpencodeSessionUrl("http://base", artifacts)).toBe(
      buildOpencodeSessionUrl("http://base", "proj-1", "sess-1"),
    );
  });
});

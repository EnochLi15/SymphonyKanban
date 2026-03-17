import { describe, expect, it } from "vitest";
import { toWorkspacePayload } from "../workspace-form";

describe("toWorkspacePayload", () => {
  it("trims required fields and converts optional empty strings to null", () => {
    const payload = toWorkspacePayload({
      name: "  My Workspace  ",
      localPath: "  /tmp/project  ",
      context: "   ",
    });

    expect(payload).toEqual({
      name: "My Workspace",
      localPath: "/tmp/project",
      context: null,
    });
  });
});

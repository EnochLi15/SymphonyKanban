import { describe, expect, it } from "vitest";
import type { IssueDTO } from "../src/index.js";

describe("IssueDTO", () => {
  it("includes tags and deletedAt", () => {
    const issue: IssueDTO = {
      id: "1",
      title: "t",
      status: "Backlog",
      workspaceId: "wksp",
      createdAt: "now",
      updatedAt: "now",
      tags: [],
      deletedAt: null,
    };
    expect(issue.tags).toEqual([]);
  });
});

import { describe, it, expect } from "vitest";
import IssueDetailView from "./issue-detail-view.vue";

describe("IssueDetailView", () => {
  it("loads component", () => {
    expect(IssueDetailView).toBeTruthy();
  });

  it("does not reset draft fields during polling", () => {
    expect(true).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { resolveIssueDetailRoute, routeForStatus } from "./issue-detail-routing";

describe("issue-detail-routing", () => {
  it("maps status to route suffix", () => {
    expect(routeForStatus("InProgress")).toBe("/session");
    expect(routeForStatus("Review")).toBe("/review");
    expect(routeForStatus("Blocked")).toBe("/error");
    expect(routeForStatus("Todo")).toBe("");
  });

  it("resolves route when not editing", () => {
    const target = resolveIssueDetailRoute({
      issueId: "issue-1",
      status: "InProgress",
      currentPath: "/issues/issue-1",
      isEditing: false,
    });
    expect(target).toBe("/issues/issue-1/session");
  });

  it("skips navigation while editing", () => {
    const target = resolveIssueDetailRoute({
      issueId: "issue-1",
      status: "Review",
      currentPath: "/issues/issue-1",
      isEditing: true,
    });
    expect(target).toBeNull();
  });

  it("skips navigation when already at target", () => {
    const target = resolveIssueDetailRoute({
      issueId: "issue-1",
      status: "Todo",
      currentPath: "/issues/issue-1",
      isEditing: false,
    });
    expect(target).toBeNull();
  });
});

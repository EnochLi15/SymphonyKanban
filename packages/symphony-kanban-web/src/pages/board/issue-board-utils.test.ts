import { describe, it, expect } from "vitest";
import {
  normalizePriority,
  priorityLabel,
  priorityMeta,
  shouldShowStatusTag,
  statusLabel,
  sortIssues,
  filterIssues,
  groupByStatus,
  groupByPriority,
  mergeIssueUpdates,
} from "./issue-board-utils";

const baseIssue = (overrides: Partial<any> = {}) => ({
  id: "1",
  title: "Task",
  description: null,
  status: "Backlog",
  priority: 1,
  workspaceId: "w1",
  workspaceName: "Workspace A",
  tags: ["frontend"],
  createdAt: "2026-03-16T10:00:00.000Z",
  updatedAt: "2026-03-16T10:00:00.000Z",
  ...overrides,
});

describe("issue-board-utils", () => {
  it("normalizes missing priority to P1", () => {
    expect(normalizePriority(null)).toBe(1);
    expect(normalizePriority(undefined)).toBe(1);
  });

  it("maps priority to labels with importance/urgency", () => {
    expect(priorityLabel(0)).toContain("重要且紧急");
    expect(priorityLabel(1)).toContain("重要不紧急");
    expect(priorityLabel(2)).toContain("紧急不重要");
    expect(priorityLabel(3)).toContain("不紧急不重要");
  });

  it("maps status to readable labels", () => {
    expect(statusLabel("InProgress")).toContain("进行中");
  });

  it("sorts by priority then createdAt desc", () => {
    const issues = [
      baseIssue({ id: "a", priority: 2, createdAt: "2026-03-16T10:00:00.000Z" }),
      baseIssue({ id: "b", priority: 0, createdAt: "2026-03-16T09:00:00.000Z" }),
      baseIssue({ id: "c", priority: 0, createdAt: "2026-03-16T11:00:00.000Z" }),
    ];
    const sorted = sortIssues(issues);
    expect(sorted.map((i) => i.id)).toEqual(["c", "b", "a"]);
  });

  it("filters by workspace and tags", () => {
    const issues = [
      baseIssue({ id: "a", workspaceId: "w1", tags: ["frontend"] }),
      baseIssue({ id: "b", workspaceId: "w2", tags: ["backend"] }),
    ];
    const filtered = filterIssues(issues, {
      workspaceId: "w1",
      tags: ["frontend"],
    });
    expect(filtered.map((i) => i.id)).toEqual(["a"]);
  });

  it("groups by status", () => {
    const issues = [
      baseIssue({ id: "a", status: "Backlog" }),
      baseIssue({ id: "b", status: "Todo" }),
    ];
    const grouped = groupByStatus(issues);
    expect(grouped.Backlog[0].id).toBe("a");
    expect(grouped.Todo[0].id).toBe("b");
  });

  it("groups by priority", () => {
    const issues = [
      baseIssue({ id: "a", priority: 0 }),
      baseIssue({ id: "b", priority: 3 }),
    ];
    const grouped = groupByPriority(issues);
    expect(grouped.P0[0].id).toBe("a");
    expect(grouped.P3[0].id).toBe("b");
  });

  it("returns priority meta for styling", () => {
    const meta = priorityMeta(2);
    expect(meta.code).toBe("P2");
  });

  it("merges by id and preserves order", () => {
    const base = [
      baseIssue({ id: "a", status: "Todo" }),
      baseIssue({ id: "b", status: "Review" }),
    ];
    const next = [
      baseIssue({ id: "b", status: "Done" }),
      baseIssue({ id: "c", status: "Todo" }),
    ];
    const merged = mergeIssueUpdates(base, next);
    expect(merged.map((issue) => issue.id)).toEqual(["a", "b", "c"]);
    expect(merged.find((issue) => issue.id === "b")?.status).toBe("Done");
  });

  it("hides status tag in state view", () => {
    expect(shouldShowStatusTag("state")).toBe(false);
  });

  it("shows status tag in priority view", () => {
    expect(shouldShowStatusTag("priority")).toBe(true);
  });

  it("defaults to show when view mode is missing", () => {
    expect(shouldShowStatusTag(undefined)).toBe(true);
  });
});

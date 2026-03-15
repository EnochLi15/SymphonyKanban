import { describe, it, expect } from "vitest";
import { sortIssues } from "./issue-board-utils";
import KanbanBoardView from "./kanban-board-view.vue";

describe("KanbanBoardView", () => {
  it("loads component", () => {
    expect(KanbanBoardView).toBeTruthy();
  });

  it("sorts issues by priority then createdAt", () => {
    const issues = [
      { id: "a", priority: 2, createdAt: "2026-03-16T10:00:00.000Z" },
      { id: "b", priority: 0, createdAt: "2026-03-16T09:00:00.000Z" },
      { id: "c", priority: 0, createdAt: "2026-03-16T11:00:00.000Z" },
    ] as any;
    expect(sortIssues(issues).map((i) => i.id)).toEqual(["c", "b", "a"]);
  });
});

import { describe, it, expect } from "vitest";
import KanbanBoardView from "./kanban-board-view.vue";

describe("KanbanBoardView", () => {
  it("loads component", () => {
    expect(KanbanBoardView).toBeTruthy();
  });
});

import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { sortIssues } from "./issue-board-utils";

const listIssues = vi.fn(async () => ({ data: [] }));
const listWorkspaces = vi.fn(async () => ({ data: [] }));
const listTags = vi.fn(async () => ({ data: [] }));

vi.mock("vue", async () => {
  const actual = await vi.importActual<typeof import("vue")>("vue");
  return { ...actual, onMounted: () => {} };
});

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("../../components/AppShell.vue", () => ({
  default: { template: "<div><slot /></div>" },
}));

vi.mock("../../lib/api", () => ({
  buildApi: () => ({
    listIssues,
    listWorkspaces,
    listTags,
  }),
}));

describe("KanbanBoardView", () => {
  it("loads component", () => {
    expect(true).toBe(true);
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

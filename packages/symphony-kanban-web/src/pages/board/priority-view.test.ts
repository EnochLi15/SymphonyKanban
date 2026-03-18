import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PriorityView from "./priority-view.vue";

const listIssues = vi.fn(async () => ({ data: [] }));
const listWorkspaces = vi.fn(async () => ({ data: [] }));
const listTags = vi.fn(async () => ({ data: [] }));

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

describe("PriorityView", () => {
  it("loads component", () => {
    expect(PriorityView).toBeTruthy();
  });

  it("shows only the first tag on cards", async () => {
    listIssues.mockResolvedValueOnce({
      data: [
        {
          id: "issue-1",
          title: "Test",
          description: "",
          status: "Todo",
          priority: 1,
          workspaceId: "wksp-1",
          tags: ["alpha", "beta"],
          createdAt: "2026-03-16T10:00:00.000Z",
          updatedAt: "2026-03-16T10:00:00.000Z",
        },
      ],
    });

    const wrapper = mount(PriorityView, {
      global: {
        stubs: {
          "el-card": { template: "<div><slot /></div>" },
          "el-tooltip": { template: "<div><slot /></div>" },
          "el-select": { template: "<div><slot /></div>" },
          "el-option": { template: "<div><slot /></div>" },
          "el-button": { template: "<button><slot /></button>" },
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const text = wrapper.text();
    expect(text).toContain("alpha");
    expect(text).not.toContain("beta");
  });
});

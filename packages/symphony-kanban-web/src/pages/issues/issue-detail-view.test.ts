import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import IssueDetailView from "./issue-detail-view.vue";

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  }),
  useRoute: () => ({
    params: { id: "issue-1" },
    path: "/issues/issue-1",
  }),
}));

vi.mock("../../components/AppShell.vue", () => ({
  default: { template: "<div><slot /></div>" },
}));

vi.mock("../../components/opencode-session-panel.vue", () => ({
  default: { template: "<div />" },
}));

vi.mock("./issue-detail-routing", () => ({
  resolveIssueDetailRoute: () => null,
}));

vi.mock("../../lib/api", () => ({
  buildApi: () => ({
    listWorkspaces: vi.fn(async () => ({ data: [] })),
    listTags: vi.fn(async () => ({ data: [] })),
    getIssue: vi.fn(async () => ({
      data: {
        id: "issue-1",
        title: "Test",
        description: "",
        status: "Backlog",
        priority: 2,
        workspaceId: "wksp-1",
        tags: ["UserStory"],
      },
    })),
    listExecutions: vi.fn(async () => ({ data: [] })),
    getExecutionStatus: vi.fn(async () => ({ data: { status: "running" } })),
    getReview: vi.fn(async () => ({ data: null })),
    updateIssue: vi.fn(async () => ({
      data: {
        id: "issue-1",
        title: "Test",
        description: "",
        status: "Backlog",
        priority: 2,
        workspaceId: "wksp-1",
        tags: ["UserStory"],
      },
    })),
    deleteIssue: vi.fn(async () => ({ ok: true })),
  }),
}));

vi.mock("element-plus", () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
  ElMessageBox: {
    confirm: vi.fn(async () => true),
  },
}));

const ElSelectStub = {
  name: "ElSelect",
  props: ["modelValue", "multiple"],
  template: "<div><slot /></div>",
};

describe("IssueDetailView", () => {
  it("loads component", () => {
    expect(IssueDetailView).toBeTruthy();
  });

  it("uses single-select for tags", () => {
    const wrapper = mount(IssueDetailView, {
      global: {
        stubs: {
          "el-card": { template: "<div><slot /></div>" },
          "el-button": { template: "<button><slot /></button>" },
          "el-input": { template: "<input />" },
          "el-option": { template: "<div><slot /></div>" },
          "el-select": ElSelectStub,
          "el-tooltip": { template: "<div><slot /></div>" },
          "el-divider": { template: "<div />" },
          "el-tag": { template: "<span><slot /></span>" },
        },
      },
    });

    const selects = wrapper.findAllComponents(ElSelectStub);
    const hasMultiple = selects.some((select) => select.props("multiple"));
    expect(hasMultiple).toBe(false);
  });
});

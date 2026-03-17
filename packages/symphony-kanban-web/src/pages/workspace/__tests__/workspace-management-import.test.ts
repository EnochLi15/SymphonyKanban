import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import WorkspaceManagementView from "../workspace-management-view.vue";

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("../../../lib/api", () => ({
  buildApi: () => ({
    listWorkspaces: vi.fn(async () => ({ data: [] })),
    createWorkspace: vi.fn(async () => ({ data: { id: "wksp-1" } })),
    listOpencodeProjects: vi.fn(async () => ({ data: [] })),
    importOpencodeProjects: vi.fn(async () => ({ imported: [], skipped: [], failed: [] })),
  }),
}));

vi.mock("element-plus", () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("workspace management view", () => {
  it("shows opencode import button", () => {
    const wrapper = mount(WorkspaceManagementView, {
      global: {
        directives: {
          loading: () => {
            // no-op
          },
        },
        stubs: {
          AppShell: { template: "<div><slot /></div>" },
          "el-button": { template: "<button><slot /></button>" },
          "el-card": { template: "<div><slot /></div>" },
          "el-dialog": { template: "<div><slot /></div>" },
          "el-form": { template: "<form><slot /></form>" },
          "el-form-item": { template: "<div><slot /></div>" },
          "el-input": { template: "<input />" },
          "el-table": { template: "<div><slot /></div>" },
          "el-table-column": { template: "<div><slot /></div>" },
        },
      },
    });

    expect(wrapper.text()).toContain("导入 OpenCode");
  });
});

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import CreateTaskModal from "../create-task-modal.vue";

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("element-plus", () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const ElSelectStub = {
  name: "ElSelect",
  props: ["modelValue", "multiple"],
  template: "<div><slot /></div>",
};

describe("create task modal", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).includes("/workspaces")) {
        return { ok: true, json: async () => ({ data: [] }) } as Response;
      }
      if (String(url).includes("/tags")) {
        return { ok: true, json: async () => ({ data: [] }) } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses single-select for tags", () => {
    const wrapper = mount(CreateTaskModal, {
      global: {
        stubs: {
          "el-dialog": { template: "<div><slot /><slot name=\"header\" /></div>" },
          "el-form": { template: "<form><slot /></form>" },
          "el-form-item": { template: "<div><slot /></div>" },
          "el-input": { template: "<input />" },
          "el-button": { template: "<button><slot /></button>" },
          "el-option": { template: "<div><slot /></div>" },
          "el-select": ElSelectStub,
          "el-switch": { template: "<div />" },
        },
      },
    });

    const selects = wrapper.findAllComponents(ElSelectStub);
    const hasMultiple = selects.some((select) => select.props("multiple"));
    expect(hasMultiple).toBe(false);
  });
});

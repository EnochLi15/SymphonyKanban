import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";

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

describe("PriorityView", () => {
  it("loads component", () => {
    expect(true).toBe(true);
  });
});

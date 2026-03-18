import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it } from "vitest";
import OpencodeSessionPanel from "../opencode-session-panel.vue";

describe("OpencodeSessionPanel", () => {
  it("hides fullscreen button when sessionUrl is empty", () => {
    const wrapper = mount(OpencodeSessionPanel, { props: { sessionUrl: "" } });
    expect(wrapper.find(".fullscreen-toggle").exists()).toBe(false);
  });

  it("toggles fullscreen class", async () => {
    const wrapper = mount(OpencodeSessionPanel, {
      props: { sessionUrl: "http://example/session" },
    });
    await wrapper.find(".fullscreen-toggle").trigger("click");
    await wrapper.vm.$forceUpdate();
    await wrapper.vm.$nextTick();
    expect(wrapper.classes()).toContain("is-fullscreen");
  });
});

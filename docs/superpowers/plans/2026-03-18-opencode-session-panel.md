# Opencode 会话面板显示与全屏 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在卡片详情相关页面（进行中/已阻塞/审核中/已完成）显示 Opencode 会话面板，并提供页面内全屏与退出全屏按钮。

**Architecture:** 抽取可复用的 Opencode 会话面板组件，统一处理 iframe 与全屏逻辑；各页面仅负责获取 `sessionUrl` 并传入组件。完成状态下在基础详情页中补充 `review` 数据以构造会话链接。

**Tech Stack:** Vue 3, Vue Router, Element Plus（现有 UI），Vitest, @vue/test-utils

---

## File Structure (Planned)

- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/components/opencode-session-panel.vue`
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/components/__tests__/opencode-session-panel.test.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/sessions/web-session-run.test.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/review/review-view.test.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/errors/blocked-error-handling-view.test.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/sessions/opencode-session.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/sessions/opencode-session.test.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/sessions/web-session-run.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/review/review-view.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/errors/blocked-error-handling-view.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/issues/issue-detail-view.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/issues/issue-detail-view.test.ts`

## Chunk 1: Session URL Helper + Panel Component (with tests)

### Task 1: Add helper to resolve session URL from artifacts

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/sessions/opencode-session.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/sessions/opencode-session.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { buildOpencodeSessionUrl, resolveOpencodeSessionUrl } from "./opencode-session";

describe("resolveOpencodeSessionUrl", () => {
  it("returns empty string when missing session or project", () => {
    const artifacts = [{ type: "session", content: "sess-1" }];
    expect(resolveOpencodeSessionUrl("http://base", artifacts)).toBe("");
  });

  it("returns session url when both artifacts exist", () => {
    const artifacts = [
      { type: "session", content: "sess-1" },
      { type: "opencode_project", content: "proj-1" },
    ];
    expect(resolveOpencodeSessionUrl("http://base", artifacts)).toBe(
      buildOpencodeSessionUrl("http://base", "proj-1", "sess-1"),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web test -- opencode-session.test.ts`
Expected: FAIL with “resolveOpencodeSessionUrl is not defined” or similar.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { ExecutionArtifactDTO } from "symphony-kanban-shared";

export const resolveOpencodeSessionUrl = (
  baseUrl: string,
  artifacts: Array<Pick<ExecutionArtifactDTO, "type" | "content">> | undefined,
): string => {
  if (!artifacts) return "";
  const sessionId = artifacts.find((artifact) => artifact.type === "session")?.content ?? "";
  const projectId =
    artifacts.find((artifact) => artifact.type === "opencode_project")?.content ?? "";
  if (!sessionId || !projectId) return "";
  return buildOpencodeSessionUrl(baseUrl, projectId, sessionId);
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web test -- opencode-session.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/sessions/opencode-session.ts \
  /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/sessions/opencode-session.test.ts
git commit -m "feat(web): add opencode session url resolver"
```

### Task 2: Create reusable Opencode session panel component

**Files:**
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/components/opencode-session-panel.vue`
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/components/__tests__/opencode-session-panel.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { mount } from "@vue/test-utils";
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
    expect(wrapper.find(".opencode-panel-wrap").classes()).toContain("is-fullscreen");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web test -- opencode-session-panel.test.ts`
Expected: FAIL with component not found.

- [ ] **Step 3: Write minimal component**

```vue
<template>
  <div class="opencode-panel-wrap" :class="{ "is-fullscreen": isFullscreen }">
    <div class="panel">
      <div class="panel-title-row">
        <div class="panel-title">Opencode 会话</div>
        <button
          v-if="sessionUrl"
          class="fullscreen-toggle"
          type="button"
          @click="toggleFullscreen"
        >
          {{ isFullscreen ? "退出全屏" : "全屏" }}
        </button>
      </div>
      <div class="panel-body">
        <div v-if="sessionUrl" class="iframe-wrap">
          <iframe class="session-iframe" :src="sessionUrl" title="opencode-session" loading="lazy" />
        </div>
        <div v-else class="panel-empty">暂无会话</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";

defineProps<{ sessionUrl: string }>();

const isFullscreen = ref(false);

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

watch(isFullscreen, (next) => {
  document.body.style.overflow = next ? "hidden" : "";
});

onUnmounted(() => {
  document.body.style.overflow = "";
});
</script>

<style scoped>
.opencode-panel-wrap.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: #0b0b0b;
  padding: 24px;
  box-sizing: border-box;
}

.panel {
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  padding: 16px;
}

.panel-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
}

.panel-body {
  display: flex;
  flex-direction: column;
}

.iframe-wrap {
  border-radius: 8px;
  border: 1px solid var(--kanban-border);
  overflow: hidden;
  background: var(--kanban-muted);
}

.panel-empty {
  font-size: 13px;
  color: var(--kanban-text-secondary);
}

.fullscreen-toggle {
  border: 1px solid var(--kanban-border);
  background: var(--kanban-surface);
  color: var(--kanban-text-primary);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
}

.session-iframe {
  width: 100%;
  height: 520px;
  border: none;
}

.opencode-panel-wrap.is-fullscreen .session-iframe {
  height: calc(100vh - 120px);
}
</style>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web test -- opencode-session-panel.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/components/opencode-session-panel.vue \
  /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/components/__tests__/opencode-session-panel.test.ts
git commit -m "feat(web): add opencode session panel"
```

## Chunk 2: Wire panel into pages (session/review/blocked/done)

### Task 3: Replace session view panel with component

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/sessions/web-session-run.vue`
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/sessions/web-session-run.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from \"vitest\";
import WebSessionRun from \"./web-session-run.vue\";

describe(\"WebSessionRun\", () => {
  it(\"loads component\", () => {
    expect(WebSessionRun).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web test -- web-session-run.test.ts`
Expected: FAIL (test missing or failing).

- [ ] **Step 3: Implement component usage**

```vue
<script setup lang="ts">
import OpencodeSessionPanel from "../../components/opencode-session-panel.vue";
import { resolveOpencodeSessionUrl } from "./opencode-session";

const sessionUrl = computed(() =>
  resolveOpencodeSessionUrl(opencodeWebBase, review.value?.artifacts),
);
</script>

<template>
  <OpencodeSessionPanel :session-url="sessionUrl" />
</template>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web test -- web-session-run.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/sessions/web-session-run.vue
git commit -m "refactor(web): use opencode session panel in session view"
```

### Task 4: Add panel to review + blocked views

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/review/review-view.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/errors/blocked-error-handling-view.vue`
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/review/review-view.test.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/errors/blocked-error-handling-view.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from \"vitest\";
import ReviewView from \"./review-view.vue\";

describe(\"ReviewView\", () => {
  it(\"loads component\", () => {
    expect(ReviewView).toBeTruthy();
  });
});
```

```ts
import { describe, it, expect } from \"vitest\";
import BlockedErrorHandlingView from \"./blocked-error-handling-view.vue\";

describe(\"BlockedErrorHandlingView\", () => {
  it(\"loads component\", () => {
    expect(BlockedErrorHandlingView).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web test -- review-view.test.ts blocked-error-handling-view.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement component usage**

```vue
<script setup lang="ts">
import OpencodeSessionPanel from "../../components/opencode-session-panel.vue";
import { resolveOpencodeSessionUrl } from "../sessions/opencode-session";

const opencodeWebBase = import.meta.env.VITE_OPENCODE_WEB_BASE ?? "http://localhost:4096";

const sessionUrl = computed(() =>
  resolveOpencodeSessionUrl(opencodeWebBase, review.value?.artifacts),
);
</script>

<template>
  <OpencodeSessionPanel :session-url="sessionUrl" />
</template>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web test -- review-view.test.ts blocked-error-handling-view.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/review/review-view.vue \
  /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/errors/blocked-error-handling-view.vue
git commit -m "feat(web): show opencode session panel in review/blocked views"
```

### Task 5: Add panel to Done in issue detail view

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/issues/issue-detail-view.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/issues/issue-detail-view.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from \"vitest\";
import IssueDetailView from \"./issue-detail-view.vue\";

describe(\"IssueDetailView\", () => {
  it(\"loads component\", () => {
    expect(IssueDetailView).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web test -- issue-detail-view.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement review fetch + panel usage**

```ts
import { computed, onMounted, ref, watch } from "vue";
import { resolveOpencodeSessionUrl } from "../sessions/opencode-session";

const review = ref<ReviewDTO | null>(null);
const opencodeWebBase = import.meta.env.VITE_OPENCODE_WEB_BASE ?? "http://localhost:4096";

const loadReview = async () => {
  if (draft.status !== "Done") {
    review.value = null;
    return;
  }
  try {
    const res = await api.getReview(draft.id);
    review.value = res.data ?? null;
  } catch {
    review.value = null;
  }
};

watch(() => draft.status, () => {
  loadReview();
});

onMounted(() => {
  loadReview();
});

const sessionUrl = computed(() =>
  resolveOpencodeSessionUrl(opencodeWebBase, review.value?.artifacts),
);
```

```vue
<OpencodeSessionPanel v-if="draft.status === 'Done'" :session-url="sessionUrl" />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web test -- issue-detail-view.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/issues/issue-detail-view.vue
git commit -m "feat(web): show opencode session panel for done issues"
```

---

## Plan Review Loop

After each chunk, dispatch plan-document-reviewer with:
- Plan chunk path: `/Users/enoch/Workspace/SymphonyKanban/docs/superpowers/plans/2026-03-18-opencode-session-panel.md`
- Spec path: `/Users/enoch/Workspace/SymphonyKanban/docs/superpowers/specs/2026-03-18-opencode-session-panel-design.md`

If subagents are unavailable in the harness, do a manual review using the same checklist and note the limitation.

---

## Execution Handoff

Plan complete and saved to `/Users/enoch/Workspace/SymphonyKanban/docs/superpowers/plans/2026-03-18-opencode-session-panel.md`. Ready to execute?

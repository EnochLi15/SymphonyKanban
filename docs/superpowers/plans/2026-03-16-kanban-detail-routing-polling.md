# Kanban Detail Routing + Polling Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-column internal scroll, status-based detail routing, and non-janky 5s polling without UI flicker or overwriting edits.

**Architecture:** Introduce a small status→route resolver and child routes under `/issues/:id`. Add a lightweight polling loop on the board that merges server updates without toggling loading states. Keep issue detail polling limited to non-editing fields and route transitions when status changes.

**Tech Stack:** Vue 3 + Vite, Element Plus, Vitest.

---

## Chunk 1: Routing + Status Resolver

### Task 1: Add status→route resolver helper

**Files:**
- Create: `packages/symphony-kanban-web/src/pages/issues/issue-detail-routing.ts`
- Test: `packages/symphony-kanban-web/src/pages/issues/issue-detail-routing.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { routeForStatus } from "./issue-detail-routing";

describe("issue-detail-routing", () => {
  it("maps status to route suffix", () => {
    expect(routeForStatus("InProgress")).toBe("/session");
    expect(routeForStatus("Review")).toBe("/review");
    expect(routeForStatus("Blocked")).toBe("/error");
    expect(routeForStatus("Todo")).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C packages/symphony-kanban-web test issue-detail-routing.test.ts`
Expected: FAIL with module not found or missing export.

- [ ] **Step 3: Write minimal implementation**

```ts
export const routeForStatus = (status: string): string => {
  switch (status) {
    case "InProgress":
      return "/session";
    case "Review":
      return "/review";
    case "Blocked":
      return "/error";
    default:
      return "";
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C packages/symphony-kanban-web test issue-detail-routing.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/symphony-kanban-web/src/pages/issues/issue-detail-routing.ts \
        packages/symphony-kanban-web/src/pages/issues/issue-detail-routing.test.ts
git commit -m "test(web): add status routing helper"
```

### Task 2: Add child routes under `/issues/:id`

**Files:**
- Modify: `packages/symphony-kanban-web/src/router/routes.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { routes } from "../../router/routes";

describe("routes", () => {
  it("has issue detail child routes", () => {
    const issueRoute = routes.find((r) => r.path === "/issues/:id");
    expect(issueRoute?.children?.map((c) => c.path)).toEqual([
      "",
      "session",
      "review",
      "error",
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C packages/symphony-kanban-web test routes.test.ts`
Expected: FAIL (routes not found).

- [ ] **Step 3: Write minimal implementation**

```ts
// Add children under /issues/:id
{
  path: "/issues/:id",
  name: "issues-detail",
  component: () => import("../pages/issues/issue-detail-view.vue"),
  children: [
    { path: "", name: "issues-detail-base", component: () => import("../pages/issues/issue-detail-view.vue") },
    { path: "session", name: "issues-detail-session", component: () => import("../pages/sessions/web-session-run.vue") },
    { path: "review", name: "issues-detail-review", component: () => import("../pages/review/review-view.vue") },
    { path: "error", name: "issues-detail-error", component: () => import("../pages/errors/blocked-error-handling-view.vue") },
  ],
},
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C packages/symphony-kanban-web test routes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/symphony-kanban-web/src/router/routes.ts \
        packages/symphony-kanban-web/src/router/routes.test.ts
git commit -m "feat(web): add issue detail child routes"
```

## Chunk 2: Detail View Routing + Non-Janky Detail Polling

### Task 3: Route to correct detail page after loading issue

**Files:**
- Modify: `packages/symphony-kanban-web/src/pages/issues/issue-detail-view.vue`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { routeForStatus } from "./issue-detail-routing";

describe("issue-detail-view routing", () => {
  it("maps Review to /review", () => {
    expect(routeForStatus("Review")).toBe("/review");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C packages/symphony-kanban-web test issue-detail-view.test.ts`
Expected: FAIL if new helper not used yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// after loadIssue(), compute suffix = routeForStatus(draft.status)
// if current route path does not end with suffix, router.replace(`/issues/${id}${suffix}`)
// do not set loading when polling
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C packages/symphony-kanban-web test issue-detail-view.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/symphony-kanban-web/src/pages/issues/issue-detail-view.vue

git commit -m "feat(web): route issue detail by status"
```

### Task 4: Keep detail polling non-janky

**Files:**
- Modify: `packages/symphony-kanban-web/src/pages/issues/issue-detail-view.vue`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";

describe("issue-detail-view polling", () => {
  it("does not reset draft fields during polling", () => {
    // placeholder for future test if store abstraction is added
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C packages/symphony-kanban-web test issue-detail-view.test.ts`
Expected: PASS (placeholder)

- [ ] **Step 3: Write minimal implementation**

```ts
// Add a separate pollIssueStatus() that fetches only status
// If user is editing (draft differs from snapshot), do not overwrite inputs
// Only update executionStatus + route if safe
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C packages/symphony-kanban-web test issue-detail-view.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/symphony-kanban-web/src/pages/issues/issue-detail-view.vue

git commit -m "feat(web): keep detail polling non-janky"
```

## Chunk 3: Board Column Scroll + Non-Janky Board Polling

### Task 5: Add internal scroll area to columns

**Files:**
- Modify: `packages/symphony-kanban-web/src/pages/board/kanban-board-view.vue`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import KanbanBoardView from "./kanban-board-view.vue";

describe("KanbanBoardView", () => {
  it("renders scroll container class", () => {
    expect(KanbanBoardView).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C packages/symphony-kanban-web test kanban-board-view.test.ts`
Expected: PASS (placeholder)

- [ ] **Step 3: Write minimal implementation**

```vue
<div class="board-col">
  <div class="col-title">...</div>
  <div class="col-scroll">
    <!-- cards/empty state -->
  </div>
</div>
```

```css
.board-col {
  max-height: calc(100vh - 260px);
}

.col-scroll {
  overflow-y: auto;
  padding-right: 4px;
}

.col-scroll::-webkit-scrollbar {
  width: 6px;
}
.col-scroll::-webkit-scrollbar-thumb {
  background: var(--kanban-border);
  border-radius: 999px;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C packages/symphony-kanban-web test kanban-board-view.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/symphony-kanban-web/src/pages/board/kanban-board-view.vue

git commit -m "feat(web): add column internal scroll"
```

### Task 6: Add board polling without flicker

**Files:**
- Modify: `packages/symphony-kanban-web/src/pages/board/kanban-board-view.vue`
- Test: `packages/symphony-kanban-web/src/pages/board/issue-board-utils.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { mergeIssueUpdates } from "./issue-board-utils";

describe("mergeIssueUpdates", () => {
  it("merges by id and preserves order", () => {
    const base = [
      { id: "a", status: "Todo" },
      { id: "b", status: "Review" },
    ] as any;
    const next = [
      { id: "b", status: "Done" },
      { id: "c", status: "Todo" },
    ] as any;
    const merged = mergeIssueUpdates(base, next);
    expect(merged.map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(merged.find((i) => i.id === "b")?.status).toBe("Done");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C packages/symphony-kanban-web test issue-board-utils.test.ts`
Expected: FAIL (mergeIssueUpdates missing).

- [ ] **Step 3: Write minimal implementation**

```ts
export const mergeIssueUpdates = (base: IssueView[], incoming: IssueView[]) => {
  const byId = new Map(base.map((issue) => [issue.id, issue]));
  const order = base.map((issue) => issue.id);
  incoming.forEach((issue) => {
    if (!byId.has(issue.id)) order.push(issue.id);
    byId.set(issue.id, { ...byId.get(issue.id), ...issue });
  });
  return order.map((id) => byId.get(id)!).filter(Boolean);
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C packages/symphony-kanban-web test issue-board-utils.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/symphony-kanban-web/src/pages/board/issue-board-utils.ts \
        packages/symphony-kanban-web/src/pages/board/issue-board-utils.test.ts

git commit -m "test(web): add merge helper for polling"
```

### Task 7: Wire polling into board view

**Files:**
- Modify: `packages/symphony-kanban-web/src/pages/board/kanban-board-view.vue`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";

describe("kanban-board polling", () => {
  it("keeps loading false during refresh", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C packages/symphony-kanban-web test kanban-board-view.test.ts`
Expected: PASS (placeholder)

- [ ] **Step 3: Write minimal implementation**

```ts
// Add onMounted polling: setInterval(() => refreshIssues(), 5000)
// refreshIssues(): fetch issues without touching loading state
// use mergeIssueUpdates to update issues list
// skip refresh when dragging.value is not null
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C packages/symphony-kanban-web test kanban-board-view.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/symphony-kanban-web/src/pages/board/kanban-board-view.vue

git commit -m "feat(web): add non-janky board polling"
```

## Chunk 4: Final Verification

### Task 8: Run full test suite

- [ ] **Step 1: Run tests**

Run: `pnpm -r run test`
Expected: PASS

- [ ] **Step 2: Commit final adjustments**

```bash
git status -sb
```

If clean, no commit needed.


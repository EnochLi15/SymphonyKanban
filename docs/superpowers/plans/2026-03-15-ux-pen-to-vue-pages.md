# UX .pen → Vue Pages Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate runnable Vue3 pages and routes from `designs/ux.pen` and wire them into `packages/symphony-kanban-web` with functional-module routing.

**Architecture:** Use pencil MCP to extract all page-level frames into a JSON snapshot, apply deterministic grouping heuristics to map frames into functional modules, then generate Vue pages and a router config from that snapshot. Wire `vue-router` into the app so pages are directly previewable.

**Tech Stack:** Vue 3, Vite, Vue Router, Vitest

---

## File Structure (planned)

- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/router/index.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/router/routes.generated.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/gen/frame-utils.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/gen/frame-utils.test.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/gen/ux-frames.json`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/gen/generate.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/scripts/generate-ux-pages.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/pages/<module>/<Page>.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/package.json`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/main.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/App.vue`

---

## Chunk 1: Router + Grouping Utilities

### Task 1: Add Vue Router + base app wiring

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/package.json`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/router/index.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/main.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/App.vue`

- [ ] **Step 1: Write the failing test**

Create `src/gen/frame-utils.test.ts` with a failing test placeholder to confirm vitest is wired:

```ts
import { describe, it, expect } from "vitest";

describe("test harness", () => {
  it("runs", () => {
    expect(true).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web test`
Expected: FAIL with assertion error `expected true to be false`.

- [ ] **Step 3: Install Vue Router and wire app**

Update `package.json`:
```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.5.0"
  }
}
```

Create `src/router/index.ts`:
```ts
import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { generatedRoutes } from "./routes.generated";

const routes: RouteRecordRaw[] = generatedRoutes;

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
```

Update `src/main.ts`:
```ts
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";

createApp(App).use(router).mount("#app");
```

Update `src/App.vue` to render router-view:
```vue
<template>
  <router-view />
</template>
```

- [ ] **Step 4: Update failing test to pass**

Change the test to pass:
```ts
expect(true).toBe(true);
```

- [ ] **Step 5: Run tests**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages add packages/symphony-kanban-web/package.json \
  packages/symphony-kanban-web/src/router/index.ts \
  packages/symphony-kanban-web/src/main.ts \
  packages/symphony-kanban-web/src/App.vue \
  packages/symphony-kanban-web/src/gen/frame-utils.test.ts

git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages commit -m "feat(web): add router wiring"
```

### Task 2: Implement grouping utilities (TDD)

**Files:**
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/gen/frame-utils.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/gen/frame-utils.test.ts`

- [ ] **Step 1: Write failing tests for grouping + slugify**

```ts
import { describe, it, expect } from "vitest";
import { slugify, inferModule, groupFrames } from "./frame-utils";

describe("frame-utils", () => {
  it("slugify creates kebab-case", () => {
    expect(slugify("Project Settings")).toBe("project-settings");
  });

  it("inferModule picks dominant keyword", () => {
    expect(inferModule("Board Overview")).toBe("board");
  });

  it("groupFrames clusters by module", () => {
    const grouped = groupFrames([
      { id: "1", name: "Board Overview" },
      { id: "2", name: "Board Settings" },
      { id: "3", name: "Project List" },
    ]);
    expect(Object.keys(grouped)).toEqual(["board", "project"]);
    expect(grouped.board.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web test`
Expected: FAIL with module not found for `frame-utils`.

- [ ] **Step 3: Implement minimal utilities**

```ts
export type FrameMeta = { id: string; name: string };

const MODULE_KEYWORDS = [
  "board",
  "project",
  "settings",
  "member",
  "user",
  "team",
  "workflow",
  "calendar",
  "report",
  "analytics",
];

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function inferModule(name: string): string {
  const lower = name.toLowerCase();
  const match = MODULE_KEYWORDS.find((keyword) => lower.includes(keyword));
  return match ?? "general";
}

export function groupFrames(frames: FrameMeta[]): Record<string, FrameMeta[]> {
  return frames.reduce<Record<string, FrameMeta[]>>((acc, frame) => {
    const module = inferModule(frame.name);
    if (!acc[module]) acc[module] = [];
    acc[module].push(frame);
    return acc;
  }, {});
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages add \
  packages/symphony-kanban-web/src/gen/frame-utils.ts \
  packages/symphony-kanban-web/src/gen/frame-utils.test.ts

git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages commit -m "feat(web): add frame grouping utilities"
```

---

## Chunk 2: Extract Frames + Generate Pages

### Task 3: Extract frames into snapshot JSON

**Files:**
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/gen/ux-frames.json`

- [ ] **Step 1: Use pencil MCP to list page-level frames**

Call `mcp__pencil__get_editor_state` (schema load if needed), then `mcp__pencil__batch_get` on `designs/ux.pen` to list top-level frames and identify page frames.

- [ ] **Step 2: Write snapshot JSON**

Create `src/gen/ux-frames.json` with:
```json
{
  "frames": [
    { "id": "<frame-id>", "name": "<frame-name>", "children": [...] }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages add packages/symphony-kanban-web/src/gen/ux-frames.json

git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages commit -m "chore(web): snapshot ux frames"
```

### Task 4: Implement generator + route output

**Files:**
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/gen/generate.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/scripts/generate-ux-pages.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/router/routes.generated.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/src/pages/<module>/<Page>.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web/package.json`

- [ ] **Step 1: Write failing test for generated routes**

Add to `frame-utils.test.ts`:
```ts
import { buildRoutes } from "./generate";

it("buildRoutes produces module + page paths", () => {
  const routes = buildRoutes([
    { id: "1", name: "Board Overview" },
    { id: "2", name: "Project List" }
  ]);
  expect(routes.some((r) => r.path === "/board/board-overview")).toBe(true);
  expect(routes.some((r) => r.path === "/project/project-list")).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web test`
Expected: FAIL with module not found `./generate`.

- [ ] **Step 3: Implement generator logic**

`src/gen/generate.ts`:
```ts
import { groupFrames, slugify, FrameMeta } from "./frame-utils";

export type GeneratedRoute = {
  name: string;
  path: string;
  componentPath: string;
  module: string;
};

export function buildRoutes(frames: FrameMeta[]): GeneratedRoute[] {
  const grouped = groupFrames(frames);
  const routes: GeneratedRoute[] = [];
  Object.entries(grouped).forEach(([module, moduleFrames]) => {
    moduleFrames.forEach((frame) => {
      const pageSlug = slugify(frame.name);
      routes.push({
        name: `${module}-${pageSlug}`,
        path: `/${module}/${pageSlug}`,
        componentPath: `../pages/${module}/${pageSlug}.vue`,
        module,
      });
    });
  });
  return routes;
}
```

`scripts/generate-ux-pages.ts` should:
- read `src/gen/ux-frames.json`
- call `buildRoutes`
- create `src/router/routes.generated.ts`
- generate page `.vue` stubs (template placeholders with frame name)

`src/router/routes.generated.ts` format:
```ts
import type { RouteRecordRaw } from "vue-router";

export const generatedRoutes: RouteRecordRaw[] = [
  { path: "/board/board-overview", name: "board-board-overview", component: () => import("../pages/board/board-overview.vue") },
];
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web test`
Expected: PASS.

- [ ] **Step 5: Run generator**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web generate:ux`
Expected: `routes.generated.ts` and page files created.

- [ ] **Step 6: Commit**

```bash
git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages add \
  packages/symphony-kanban-web/src/gen/generate.ts \
  packages/symphony-kanban-web/scripts/generate-ux-pages.ts \
  packages/symphony-kanban-web/src/router/routes.generated.ts \
  packages/symphony-kanban-web/src/pages \
  packages/symphony-kanban-web/package.json

git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages commit -m "feat(web): generate ux pages and routes"
```

---

## Chunk 3: Verify Preview

### Task 5: Smoke-check running app

**Files:** (no new files)

- [ ] **Step 1: Run dev server**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/ux-pen-to-vue-pages/packages/symphony-kanban-web dev`
Expected: Vite dev server starts; routes are navigable.

- [ ] **Step 2: Document module map**

Add a short summary to the PR/notes of inferred module → page mapping (from generator output).

---

## Plan Review Loop Notes

Subagent-based plan review is unavailable in this environment; proceed with self-review and spot-check against the spec.


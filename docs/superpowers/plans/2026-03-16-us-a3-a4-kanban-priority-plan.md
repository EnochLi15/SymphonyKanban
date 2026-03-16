# US-A3 / US-A4 Kanban + Priority Views Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement kanban status columns and priority (Eisenhower) view with workspace/tag filters, priority-based sorting, and richer card content.

**Architecture:** The web app will fetch issues, workspaces, and tags via existing API endpoints and perform filtering, grouping, and sorting client-side. Shared view helpers will centralize label mapping and ordering logic for both Kanban and Priority views.

**Tech Stack:** Vue 3 + Element Plus, TypeScript, Vitest, Express + SQLite (no API changes expected)

---

## File Map

- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/kanban-board-view.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/priority-view.vue`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/issue-board-utils.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/issue-board-utils.test.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/kanban-board-view.test.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/priority-view.test.ts`

---

## Chunk 1: Shared Board Utilities (Labels, Filters, Sorting)

### Task 1: Add utilities for priority/status labels, grouping, filtering, and sorting

**Files:**
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/issue-board-utils.ts`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/issue-board-utils.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/issue-board-utils.test.ts
import { describe, it, expect } from "vitest";
import {
  normalizePriority,
  priorityLabel,
  priorityMeta,
  statusLabel,
  sortIssues,
  filterIssues,
  groupByStatus,
  groupByPriority,
} from "./issue-board-utils";

const baseIssue = (overrides: Partial<any> = {}) => ({
  id: "1",
  title: "Task",
  description: null,
  status: "Backlog",
  priority: 1,
  workspaceId: "w1",
  workspaceName: "Workspace A",
  tags: ["frontend"],
  createdAt: "2026-03-16T10:00:00.000Z",
  updatedAt: "2026-03-16T10:00:00.000Z",
  ...overrides,
});

describe("issue-board-utils", () => {
  it("normalizes missing priority to P1", () => {
    expect(normalizePriority(null)).toBe(1);
    expect(normalizePriority(undefined)).toBe(1);
  });

  it("maps priority to labels with importance/urgency", () => {
    expect(priorityLabel(0)).toContain("重要且紧急");
    expect(priorityLabel(1)).toContain("重要不紧急");
    expect(priorityLabel(2)).toContain("紧急不重要");
    expect(priorityLabel(3)).toContain("不紧急不重要");
  });

  it("maps status to readable labels", () => {
    expect(statusLabel("InProgress")).toContain("进行中");
  });

  it("sorts by priority then createdAt desc", () => {
    const issues = [
      baseIssue({ id: "a", priority: 2, createdAt: "2026-03-16T10:00:00.000Z" }),
      baseIssue({ id: "b", priority: 0, createdAt: "2026-03-16T09:00:00.000Z" }),
      baseIssue({ id: "c", priority: 0, createdAt: "2026-03-16T11:00:00.000Z" }),
    ];
    const sorted = sortIssues(issues);
    expect(sorted.map((i) => i.id)).toEqual(["c", "b", "a"]);
  });

  it("filters by workspace and tags", () => {
    const issues = [
      baseIssue({ id: "a", workspaceId: "w1", tags: ["frontend"] }),
      baseIssue({ id: "b", workspaceId: "w2", tags: ["backend"] }),
    ];
    const filtered = filterIssues(issues, {
      workspaceId: "w1",
      tags: ["frontend"],
    });
    expect(filtered.map((i) => i.id)).toEqual(["a"]);
  });

  it("groups by status", () => {
    const issues = [
      baseIssue({ id: "a", status: "Backlog" }),
      baseIssue({ id: "b", status: "Todo" }),
    ];
    const grouped = groupByStatus(issues);
    expect(grouped.Backlog[0].id).toBe("a");
    expect(grouped.Todo[0].id).toBe("b");
  });

  it("groups by priority", () => {
    const issues = [
      baseIssue({ id: "a", priority: 0 }),
      baseIssue({ id: "b", priority: 3 }),
    ];
    const grouped = groupByPriority(issues);
    expect(grouped.P0[0].id).toBe("a");
    expect(grouped.P3[0].id).toBe("b");
  });

  it("returns priority meta for styling", () => {
    const meta = priorityMeta(2);
    expect(meta.code).toBe("P2");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web test -- --runTestsByPath src/pages/board/issue-board-utils.test.ts`

Expected: FAIL with "Cannot find module './issue-board-utils'" or missing exports.

- [ ] **Step 3: Write minimal implementation**

```ts
// /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/issue-board-utils.ts
export type IssueView = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority?: number | null;
  workspaceId: string;
  workspaceName?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type FilterState = {
  workspaceId: string | "all";
  tags: string[];
};

export type PriorityBucket = "P0" | "P1" | "P2" | "P3";

const priorityLabels = {
  P0: "P0 重要且紧急",
  P1: "P1 重要不紧急",
  P2: "P2 紧急不重要",
  P3: "P3 不紧急不重要",
};

export const normalizePriority = (priority?: number | null): number => {
  if (priority === null || priority === undefined) return 1;
  return priority;
};

export const priorityMeta = (priority?: number | null) => {
  const value = normalizePriority(priority);
  const code = (value === 0
    ? "P0"
    : value === 1
      ? "P1"
      : value === 2
        ? "P2"
        : "P3") as PriorityBucket;
  return {
    value,
    code,
    label: priorityLabels[code],
  };
};

export const priorityLabel = (priority?: number | null): string =>
  priorityMeta(priority).label;

export const statusLabel = (status: string): string => {
  switch (status) {
    case "Backlog":
      return "待排期 (Backlog)";
    case "Todo":
      return "待办 (Todo)";
    case "InProgress":
      return "进行中 (In Progress)";
    case "Review":
      return "审核中 (Review)";
    case "Done":
      return "已完成 (Done)";
    case "Blocked":
      return "已阻塞 (Blocked)";
    default:
      return status;
  }
};

export const sortIssues = (issues: IssueView[]): IssueView[] =>
  [...issues].sort((a, b) => {
    const pa = normalizePriority(a.priority);
    const pb = normalizePriority(b.priority);
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

export const filterIssues = (issues: IssueView[], filters: FilterState): IssueView[] =>
  issues.filter((issue) => {
    const workspaceMatch =
      filters.workspaceId === "all" || issue.workspaceId === filters.workspaceId;
    const tagsMatch =
      filters.tags.length === 0 ||
      filters.tags.every((tag) => issue.tags.includes(tag));
    return workspaceMatch && tagsMatch;
  });

export const groupByStatus = (issues: IssueView[]) => {
  return {
    Backlog: issues.filter((issue) => issue.status === "Backlog"),
    Todo: issues.filter((issue) => issue.status === "Todo"),
    InProgress: issues.filter((issue) => issue.status === "InProgress"),
    Review: issues.filter((issue) => issue.status === "Review"),
    Done: issues.filter((issue) => issue.status === "Done"),
    Blocked: issues.filter((issue) => issue.status === "Blocked"),
  };
};

export const groupByPriority = (issues: IssueView[]) => {
  const buckets = {
    P0: [] as IssueView[],
    P1: [] as IssueView[],
    P2: [] as IssueView[],
    P3: [] as IssueView[],
  };
  for (const issue of issues) {
    const meta = priorityMeta(issue.priority);
    buckets[meta.code].push(issue);
  }
  return buckets;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web test -- --runTestsByPath src/pages/board/issue-board-utils.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board add \
  /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/issue-board-utils.ts \
  /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/issue-board-utils.test.ts

git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board commit -m "feat(web): add board view helpers"
```

---

## Chunk 2: Kanban Board View

### Task 2: Wire filters, workspace/tag loading, and richer cards

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/kanban-board-view.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/kanban-board-view.test.ts`

- [ ] **Step 1: Write the failing test (filters + sorting helper usage)**

```ts
// /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/kanban-board-view.test.ts
import { describe, it, expect } from "vitest";
import { sortIssues } from "./issue-board-utils";
import KanbanBoardView from "./kanban-board-view.vue";

describe("KanbanBoardView", () => {
  it("loads component", () => {
    expect(KanbanBoardView).toBeTruthy();
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web test -- --runTestsByPath src/pages/board/kanban-board-view.test.ts`

Expected: FAIL if `issue-board-utils` not yet available or import not resolved.

- [ ] **Step 3: Implement Kanban view changes**

```ts
// /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/kanban-board-view.vue
// Key edits (outline):
// - Load issues + workspaces + tags in parallel on mount
// - Maintain filter state (workspaceId, tags)
// - Map workspaceId -> workspaceName for display
// - Use helpers for labels, sorting, grouping
// - Render filters in header (el-select)
// - Render workspace name + status label on card
```

Implementation checklist inside file:
- Add new types for WorkspaceDTO/TagDTO and IssueView enriched with workspaceName.
- Add `filters` ref with `workspaceId: "all"` and `tags: []`.
- Add `workspaces` and `tags` lists for filter options.
- Replace direct `issues.value.filter` with:
  - `filteredIssues = filterIssues(issues, filters)`
  - `sortedIssues = sortIssues(filteredIssues)`
  - `grouped = groupByStatus(sortedIssues)`
- Update `columns` computed to use grouped buckets.
- Replace label helpers with `priorityLabel`, `priorityMeta`, `statusLabel`.
- Add `workspaceName` display on card.
- In `loadIssues`, fetch `listWorkspaces` and `listTags` and map names.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web test -- --runTestsByPath src/pages/board/kanban-board-view.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board add \
  /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/kanban-board-view.vue \
  /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/kanban-board-view.test.ts

git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board commit -m "feat(web): enrich kanban board view"
```

---

## Chunk 3: Priority View

### Task 3: Render priority quadrants from live data

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/priority-view.vue`
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/priority-view.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/priority-view.test.ts
import { describe, it, expect } from "vitest";
import PriorityView from "./priority-view.vue";

describe("PriorityView", () => {
  it("loads component", () => {
    expect(PriorityView).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web test -- --runTestsByPath src/pages/board/priority-view.test.ts`

Expected: FAIL if file missing.

- [ ] **Step 3: Implement priority view changes**

```ts
// /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/priority-view.vue
// Key edits (outline):
// - Load issues + workspaces + tags on mount
// - Apply same filter state as kanban
// - Use groupByPriority and sortIssues helpers
// - Render cards with title, priority label, tags, workspace name, status label
// - Keep view toggle buttons intact
```

Implementation checklist inside file:
- Add filter state and filter UI identical to kanban header.
- Use shared helpers from `issue-board-utils`.
- Implement `loadIssues` to fetch issues/workspaces/tags and map workspaceName.
- Replace static cards with `v-for` over grouped buckets.
- Each card `@click` navigates to issue detail.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web test -- --runTestsByPath src/pages/board/priority-view.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board add \
  /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/priority-view.vue \
  /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/priority-view.test.ts

git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board commit -m "feat(web): render priority view from live data"
```

---

## Chunk 4: Verification

### Task 4: Run web tests + targeted spot check

**Files:**
- Test: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/issue-board-utils.test.ts`
- Test: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/kanban-board-view.test.ts`
- Test: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web/src/pages/board/priority-view.test.ts`

- [ ] **Step 1: Run web tests**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web test`

Expected: PASS

- [ ] **Step 2: Optional manual check (dev server)**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/us-a3-a4-board/packages/symphony-kanban-web dev`

Expected: Kanban view shows filters, cards with workspace name and status labels, and priority view groups by P0-P3.

---

Plan complete and saved. Ready to execute?

# US-A2 编辑与删除任务 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在任务详情页实现内联编辑与删除，并提供后端更新/软删除接口与事件快照，支持看板拖动改状态且可追溯。

**Architecture:** 后端新增 issues 更新/删除/读取接口并记录 issue_events 快照，数据库补充 deleted_at 字段。前端通过内联编辑即时 PATCH，删除确认 DELETE，拖动状态触发 PATCH。前端/后端以 shared DTO 和状态映射保持一致。

**Tech Stack:** Vue 3 + Element Plus + Vite, Express + better-sqlite3, SQLite schema.sql, Vitest。

---

## File Structure & Responsibilities

- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-db/schema/schema.sql`
  - 给 `issues` 增加 `deleted_at` 字段（新 DB 初始化使用）。
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/db.ts`
  - 启动时检测并补齐 `issues.deleted_at`（已有 DB 的兼容）。
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/server.ts`
  - 提取 `app` 供测试，新增 GET/PATCH/DELETE，增加 CORS 方法。
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/app.ts`
  - 创建并导出 Express app（server 仅负责 listen）。
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/issue-store.ts`
  - 封装 issue 查询/更新/删除/事件快照逻辑，减少 server.ts 膨胀。
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/package.json`
  - 添加 `supertest`（或等价）用于 API 测试。
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/test/issues.test.ts`
  - 覆盖更新/删除/读取已删除等核心路径。
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-shared/src/index.ts`
  - 扩展 IssueDTO（tags、deletedAt）。
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/lib/api.ts`
  - 统一封装 issues/workspaces/tags API 调用。
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/issues/issue-detail-view.vue`
  - 从 API 拉取 issue，支持字段级内联编辑、删除确认、错误处理。
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/board/kanban-board-view.vue`
  - 从 API 拉取 issues，分列渲染；实现拖动状态更新。

---

## Chunk 1: 数据库与后端基础设施

### Task 1: 为 issues 增加 deleted_at

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-db/schema/schema.sql`

- [ ] **Step 1: 写失败测试（schema 兼容检查）**

```ts
// /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/test/issues.test.ts
import { describe, expect, it } from "vitest";
import { db } from "../src/db.js";

describe("schema", () => {
  it("includes deleted_at on issues", () => {
    const cols = db.prepare("PRAGMA table_info(issues)").all() as Array<{ name: string }>;
    const names = cols.map((c) => c.name);
    expect(names).toContain("deleted_at");
  });
});
```

- [ ] **Step 2: 运行测试确保失败**

Run: `pnpm --filter symphony-kanban-api test -- --runInBand`
Expected: FAIL with `toContain("deleted_at")`.

- [ ] **Step 3: 更新 schema.sql 添加 deleted_at**

```sql
ALTER TABLE issues ADD COLUMN deleted_at TEXT;
```

Note: SQLite 不支持 `ALTER TABLE` 在 schema.sql 中直接执行初始化时的「新增列」；因此**不要**把 ALTER 放到 schema.sql。改为在 `CREATE TABLE issues` 中加入 `deleted_at TEXT` 字段即可：

```sql
CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority INTEGER,
  workspace_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE RESTRICT
);
```

- [ ] **Step 4: 在 db.ts 里补齐已有 DB 的 deleted_at**

```ts
const issueCols = db.prepare("PRAGMA table_info(issues)").all() as Array<{ name: string }>;
const hasDeletedAt = issueCols.some((c) => c.name === "deleted_at");
if (!hasDeletedAt) {
  db.prepare("ALTER TABLE issues ADD COLUMN deleted_at TEXT").run();
}
```

- [ ] **Step 5: 运行测试确保通过**

Run: `pnpm --filter symphony-kanban-api test -- --runInBand`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-db/schema/schema.sql \
  /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/db.ts \
  /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/test/issues.test.ts

git commit -m "feat(db): add issues.deleted_at"
```

### Task 2: 提取 app 并准备测试基建

**Files:**
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/app.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/server.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/package.json`

- [ ] **Step 1: 写失败测试（app 可导入）**

```ts
// /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/test/issues.test.ts
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("app", () => {
  it("exports express app", () => {
    expect(app).toBeTruthy();
  });
});
```

- [ ] **Step 2: 运行测试确保失败**

Run: `pnpm --filter symphony-kanban-api test -- --runInBand`
Expected: FAIL with module not found `../src/app.js`.

- [ ] **Step 3: 创建 app.ts 并重构 server.ts**

```ts
// /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/app.ts
import express from "express";
import { db } from "./db.js";

export const app = express();
app.use(express.json());
// CORS + routes 将从 server.ts 移入这里
```

```ts
// /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/server.ts
import { app } from "./app.js";
const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});
```

- [ ] **Step 4: 添加 supertest**

```bash
pnpm --filter symphony-kanban-api add -D supertest
pnpm --filter symphony-kanban-api add -D @types/supertest
```

- [ ] **Step 5: 运行测试确保通过**

Run: `pnpm --filter symphony-kanban-api test -- --runInBand`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/app.ts \
  /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/server.ts \
  /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/package.json \
  /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/test/issues.test.ts

git commit -m "chore(api): export app for tests"
```

---

## Chunk 2: Issue 查询/更新/删除 + 事件快照

### Task 3: issue-store 封装查询与事件写入

**Files:**
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/issue-store.ts`

- [ ] **Step 1: 写失败测试（issue-store 读取 tags）**

```ts
// /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/test/issues.test.ts
import { describe, expect, it } from "vitest";
import { db } from "../src/db.js";
import { getIssueById } from "../src/issue-store.js";

it("returns tags as name list", () => {
  const row = db.prepare("SELECT id FROM issues LIMIT 1").get() as { id: string } | undefined;
  if (!row) return;
  const issue = getIssueById(row.id);
  expect(issue?.tags).toBeDefined();
});
```

- [ ] **Step 2: 运行测试确保失败**

Run: `pnpm --filter symphony-kanban-api test -- --runInBand`
Expected: FAIL with module not found `issue-store.js`.

- [ ] **Step 3: 实现 issue-store（查询/序列化/事件）**

```ts
// /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/issue-store.ts
import { randomUUID } from "node:crypto";
import { db } from "./db.js";

export type IssueRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number | null;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type IssueDTO = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number | null;
  workspaceId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export const getIssueById = (id: string): IssueDTO | null => {
  const row = db
    .prepare("SELECT * FROM issues WHERE id = ? AND deleted_at IS NULL")
    .get(id) as IssueRow | undefined;
  if (!row) return null;
  const tags = db
    .prepare(
      "SELECT t.name FROM tags t INNER JOIN issue_tags it ON it.tag_id = t.id WHERE it.issue_id = ? ORDER BY t.name",
    )
    .all(id) as Array<{ name: string }>;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    workspaceId: row.workspace_id,
    tags: tags.map((t) => t.name),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
};

export const listIssues = (): IssueDTO[] => {
  const rows = db
    .prepare("SELECT * FROM issues WHERE deleted_at IS NULL ORDER BY created_at DESC")
    .all() as IssueRow[];
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    workspaceId: row.workspace_id,
    tags: db
      .prepare(
        "SELECT t.name FROM tags t INNER JOIN issue_tags it ON it.tag_id = t.id WHERE it.issue_id = ? ORDER BY t.name",
      )
      .all(row.id)
      .map((t: { name: string }) => t.name),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  }));
};

export const writeIssueEvent = (issueId: string, eventType: string, payload: IssueDTO) => {
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO issue_events (id, issue_id, event_type, payload, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(randomUUID(), issueId, eventType, JSON.stringify(payload), now);
};
```

- [ ] **Step 4: 运行测试确保通过**

Run: `pnpm --filter symphony-kanban-api test -- --runInBand`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/issue-store.ts \
  /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/test/issues.test.ts

git commit -m "feat(api): add issue store helpers"
```

### Task 4: API 路由与事件写入

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/app.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/server.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/issue-store.ts`

- [ ] **Step 1: 写失败测试（PATCH/DELETE/GET）**

```ts
// /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/test/issues.test.ts
import request from "supertest";
import { app } from "../src/app.js";

describe("issues api", () => {
  it("returns 404 for deleted issue", async () => {
    const res = await request(app).get("/issues/non-existent");
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: 运行测试确保失败**

Run: `pnpm --filter symphony-kanban-api test -- --runInBand`
Expected: FAIL with 404 mismatch or missing route.

- [ ] **Step 3: 在 app.ts 中添加路由与 CORS 方法**

```ts
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PATCH,DELETE");
  // 其他 header 保持不变
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});
```

Add routes:
- `GET /issues` -> `listIssues()`
- `GET /issues/:id` -> `getIssueById()`
- `PATCH /issues/:id` -> 更新字段（title/description/priority/status/workspace_id/tags）并写 `issue_updated` 事件
- `DELETE /issues/:id` -> 软删除（set deleted_at）并写 `issue_deleted` 事件

- [ ] **Step 4: PATCH 更新逻辑（含 tags 全量替换）**

```ts
const { title, description, priority, workspace_id, status, tags } = req.body ?? {};
// 校验类型与 workspace 存在
// 更新 issues + issue_tags（先删除再插入）
// 写入 issue_events 快照
```

- [ ] **Step 5: DELETE 逻辑（软删除）**

```ts
const now = new Date().toISOString();
updateIssue.run(now, now, id); // 更新 deleted_at 与 updated_at
const snapshot = getIssueByIdIncludingDeleted(id); // 或先查询再删除
writeIssueEvent(id, "issue_deleted", snapshot);
```

- [ ] **Step 6: 运行测试确保通过**

Run: `pnpm --filter symphony-kanban-api test -- --runInBand`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/app.ts \
  /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/issue-store.ts \
  /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/test/issues.test.ts

git commit -m "feat(api): add issue read/update/delete"
```

---

## Chunk 3: Shared DTO 与 API 客户端

### Task 5: 扩展 IssueDTO

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-shared/src/index.ts`

- [ ] **Step 1: 写失败测试（类型包含 tags/deletedAt）**

```ts
// /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-shared/tests/issue.test.ts
import { describe, expect, it } from "vitest";
import type { IssueDTO } from "../src/index.js";

describe("IssueDTO", () => {
  it("includes tags and deletedAt", () => {
    const issue: IssueDTO = {
      id: "1",
      title: "t",
      status: "Backlog",
      workspaceId: "wksp",
      createdAt: "now",
      updatedAt: "now",
      tags: [],
      deletedAt: null,
    };
    expect(issue.tags).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试确保失败**

Run: `pnpm --filter symphony-kanban-shared test -- --runInBand`
Expected: FAIL with missing fields.

- [ ] **Step 3: 扩展 IssueDTO**

```ts
export interface IssueDTO {
  id: string;
  title: string;
  description?: string;
  status: IssueStatus;
  priority?: number;
  workspaceId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
```

- [ ] **Step 4: 运行测试确保通过**

Run: `pnpm --filter symphony-kanban-shared test -- --runInBand`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-shared/src/index.ts \
  /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-shared/tests/issue.test.ts

git commit -m "feat(shared): extend IssueDTO"
```

### Task 6: 前端 API 客户端

**Files:**
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/lib/api.ts`

- [ ] **Step 1: 写失败测试（api client 输出）**

```ts
// /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/lib/api.test.ts
import { describe, it, expect } from "vitest";
import { buildApi } from "./api";

describe("api", () => {
  it("builds issue routes", () => {
    const api = buildApi("http://localhost:3001");
    expect(api.base).toBe("http://localhost:3001");
  });
});
```

- [ ] **Step 2: 运行测试确保失败**

Run: `pnpm --filter symphony-kanban-web test -- --runInBand`
Expected: FAIL with module not found.

- [ ] **Step 3: 实现 API 客户端**

```ts
// /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/lib/api.ts
export const buildApi = (base: string) => ({
  base,
  async getIssue(id: string) {
    const res = await fetch(`${base}/issues/${id}`);
    if (!res.ok) throw new Error("not_found");
    return res.json();
  },
  async listIssues() {
    const res = await fetch(`${base}/issues`);
    if (!res.ok) throw new Error("load_failed");
    return res.json();
  },
  async updateIssue(id: string, payload: Record<string, unknown>) {
    const res = await fetch(`${base}/issues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("update_failed");
    return res.json();
  },
  async deleteIssue(id: string) {
    const res = await fetch(`${base}/issues/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("delete_failed");
    return res.json();
  },
  async listWorkspaces() {
    const res = await fetch(`${base}/workspaces`);
    if (!res.ok) throw new Error("workspaces_failed");
    return res.json();
  },
  async listTags() {
    const res = await fetch(`${base}/tags`);
    if (!res.ok) throw new Error("tags_failed");
    return res.json();
  },
});
```

- [ ] **Step 4: 运行测试确保通过**

Run: `pnpm --filter symphony-kanban-web test -- --runInBand`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/lib/api.ts \
  /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/lib/api.test.ts

git commit -m "feat(web): add api client"
```

---

## Chunk 4: 详情页内联编辑与删除

### Task 7: 详情页拉取与内联编辑

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/issues/issue-detail-view.vue`

- [ ] **Step 1: 写失败测试（组件导出可渲染）**

```ts
// /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/issues/issue-detail-view.test.ts
import { describe, it, expect } from "vitest";
import IssueDetailView from "./issue-detail-view.vue";

describe("IssueDetailView", () => {
  it("loads component", () => {
    expect(IssueDetailView).toBeTruthy();
  });
});
```

- [ ] **Step 2: 运行测试确保失败**

Run: `pnpm --filter symphony-kanban-web test -- --runInBand`
Expected: FAIL until test setup recognizes Vue SFC.

- [ ] **Step 3: 实现详情页数据加载与编辑**

关键逻辑：
- 根据路由 `id` 调用 `api.getIssue`
- 加载 workspaces 与 tags 选项
- 字段级即时保存：标题/描述使用 debounce，select 类（priority/status/tags/workspace）用 change 触发
- 保存失败时回滚并 `ElMessage.error`

伪代码：
```ts
const api = buildApi(apiBase);
const issue = ref<IssueDTO | null>(null);
const original = ref<IssueDTO | null>(null);

const saveField = async (patch) => {
  try {
    const res = await api.updateIssue(id, patch);
    issue.value = res.data;
    original.value = res.data;
  } catch {
    if (original.value) issue.value = { ...original.value };
    ElMessage.error("保存失败");
  }
};
```

UI 元素：
- 标题：`el-input`（@blur + debounce @input）
- 描述：`el-input type=textarea`
- 优先级：`el-select`
- 标签：`el-select multiple`
- 工作区：`el-select`
- 状态：`el-select`

- [ ] **Step 4: 删除确认与跳转**

```ts
await ElMessageBox.confirm("确定删除该任务？", "删除确认", { type: "warning" });
await api.deleteIssue(id);
ElMessage.success("任务已删除");
router.push("/board");
```

- [ ] **Step 5: 删除后访问处理**

当 `api.getIssue` 返回 404 时：
```ts
ElMessage.warning("任务已删除");
router.push("/board");
```

- [ ] **Step 6: 运行测试确保通过**

Run: `pnpm --filter symphony-kanban-web test -- --runInBand`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/issues/issue-detail-view.vue \
  /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/issues/issue-detail-view.test.ts

git commit -m "feat(web): inline edit and delete on issue detail"
```

---

## Chunk 5: 看板拖动改状态

### Task 8: 看板加载与拖动更新状态

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/board/kanban-board-view.vue`

- [ ] **Step 1: 写失败测试（组件导出可渲染）**

```ts
// /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/board/kanban-board-view.test.ts
import { describe, it, expect } from "vitest";
import KanbanBoardView from "./kanban-board-view.vue";

describe("KanbanBoardView", () => {
  it("loads component", () => {
    expect(KanbanBoardView).toBeTruthy();
  });
});
```

- [ ] **Step 2: 运行测试确保失败**

Run: `pnpm --filter symphony-kanban-web test -- --runInBand`
Expected: FAIL until test setup recognizes Vue SFC.

- [ ] **Step 3: 从 API 拉取 issues 并分列渲染**

```ts
const issues = ref<IssueDTO[]>([]);
const byStatus = computed(() => ({
  Backlog: issues.value.filter(i => i.status === "Backlog"),
  Todo: issues.value.filter(i => i.status === "Todo"),
  InProgress: issues.value.filter(i => i.status === "InProgress"),
  Review: issues.value.filter(i => i.status === "Review"),
  Blocked: issues.value.filter(i => i.status === "Blocked"),
  Done: issues.value.filter(i => i.status === "Done"),
}));
```

- [ ] **Step 4: HTML5 拖放实现**

```html
<el-card
  class="card"
  draggable="true"
  @dragstart="onDragStart(issue)"
>
```

列容器：
```html
<div class="board-col" @dragover.prevent @drop="onDrop('Todo')">
```

逻辑：
```ts
const dragging = ref<IssueDTO | null>(null);
const onDrop = async (status) => {
  if (!dragging.value) return;
  const target = dragging.value;
  dragging.value = null;
  if (target.status === status) return;
  const prev = target.status;
  target.status = status;
  try {
    const res = await api.updateIssue(target.id, { status });
    // 更新本地
  } catch {
    target.status = prev;
    ElMessage.error("状态更新失败");
  }
};
```

- [ ] **Step 5: 运行测试确保通过**

Run: `pnpm --filter symphony-kanban-web test -- --runInBand`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/board/kanban-board-view.vue \
  /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/board/kanban-board-view.test.ts

git commit -m "feat(web): drag to update issue status"
```

---

## Chunk 6: 验证

- [ ] **Step 1: API 测试**

Run: `pnpm --filter symphony-kanban-api test -- --runInBand`
Expected: PASS

- [ ] **Step 2: Web 测试**

Run: `pnpm --filter symphony-kanban-web test -- --runInBand`
Expected: PASS

- [ ] **Step 3: 手动验证**

1. 进入 `/issues/:id`，修改标题/描述/优先级/标签/工作区，观察即时保存与提示。
2. 删除任务，返回 `/board`，再次进入 `/issues/:id` 应提示并跳转。
3. 看板拖动卡片到新列，状态更新成功且刷新后保持。

---

## Plan Review Loop

Each chunk should be reviewed by plan-document-reviewer subagent. If the subagent tool is unavailable, perform a manual self-review and call out any risks before execution.

---

Plan complete and saved to `/Users/enoch/Workspace/SymphonyKanban/docs/superpowers/plans/2026-03-16-us-a2-edit-delete-issues-plan.md`. Ready to execute?

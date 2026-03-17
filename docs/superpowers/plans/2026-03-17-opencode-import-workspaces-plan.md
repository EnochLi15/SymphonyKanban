# OpenCode Import Workspaces Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a UI flow to import OpenCode projects into Workspaces via API endpoints that call `opencode-ai/sdk` in real time.

**Architecture:** The API exposes `GET /workspaces/import/opencode/list` and `POST /workspaces/import/opencode`, calling a thin SDK wrapper. The UI adds an “导入 OpenCode” button and modal that fetches the list and submits selected projects, then refreshes the workspace list.

**Tech Stack:** Vue 3 + Element Plus, Express, better-sqlite3, Vitest, opencode-ai/sdk.

---

## File Structure

- Create: `packages/symphony-kanban-api/src/opencode-client.ts`
- Modify: `packages/symphony-kanban-api/src/app.ts`
- Modify: `packages/symphony-kanban-api/src/workspace-store.ts`
- Modify: `packages/symphony-kanban-api/package.json`
- Create: `packages/symphony-kanban-api/test/opencode-import.test.ts`

- Modify: `packages/symphony-kanban-web/src/lib/api.ts`
- Modify: `packages/symphony-kanban-web/src/pages/workspace/workspace-management-view.vue`
- (Optional) Create: `packages/symphony-kanban-web/src/pages/workspace/__tests__/opencode-import.test.ts`

---

## Chunk 1: API list endpoint + SDK wrapper

### Task 1: Add SDK dependency

**Files:**
- Modify: `packages/symphony-kanban-api/package.json`

- [ ] **Step 1: Add dependency**

Run:
```bash
pnpm -w add -F symphony-kanban-api opencode-ai/sdk
```
Expected: dependency added to `packages/symphony-kanban-api/package.json` and lockfile updated.

- [ ] **Step 2: Commit**

```bash
git add packages/symphony-kanban-api/package.json pnpm-lock.yaml package-lock.json
# include whichever lockfile changes exist
git commit -m "chore(api): add opencode sdk"
```

### Task 2: List endpoint (TDD)

**Files:**
- Create: `packages/symphony-kanban-api/src/opencode-client.ts`
- Modify: `packages/symphony-kanban-api/src/app.ts`
- Create: `packages/symphony-kanban-api/test/opencode-import.test.ts`

- [ ] **Step 1: Write failing test for list endpoint**

```ts
// packages/symphony-kanban-api/test/opencode-import.test.ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

vi.mock("opencode-ai/sdk", () => ({
  createOpencode: () => ({
    client: {
      project: {
        list: vi.fn(async () => [
          { name: "Alpha", local_path: "/repo/alpha" },
          { name: "Beta", local_path: "/repo/beta" },
        ]),
      },
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("opencode import api", () => {
  it("lists opencode projects", async () => {
    const res = await request(app).get("/workspaces/import/opencode/list");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      { name: "Alpha", localPath: "/repo/alpha" },
      { name: "Beta", localPath: "/repo/beta" },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
pnpm -C packages/symphony-kanban-api test -- opencode-import
```
Expected: FAIL with route 404 or module not found for new endpoint.

- [ ] **Step 3: Add SDK wrapper (minimal)**

```ts
// packages/symphony-kanban-api/src/opencode-client.ts
import { createOpencode } from "opencode-ai/sdk";

type OpenCodeProject = { name: string; local_path: string };

let cached: ReturnType<typeof createOpencode> | null = null;

export const listOpenCodeProjects = async () => {
  if (!cached) cached = createOpencode();
  const projects = await cached.client.project.list();
  return projects as OpenCodeProject[];
};
```

- [ ] **Step 4: Implement list endpoint**

```ts
// packages/symphony-kanban-api/src/app.ts
import { listOpenCodeProjects } from "./opencode-client.js";

app.get("/workspaces/import/opencode/list", async (_req, res) => {
  try {
    const rows = await listOpenCodeProjects();
    res.json({
      data: rows.map((row) => ({
        name: row.name,
        localPath: row.local_path,
      })),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to list opencode projects", error);
    res.status(502).json({ error: "opencode_list_failed" });
  }
});
```

- [ ] **Step 5: Run test to verify it passes**

Run:
```bash
pnpm -C packages/symphony-kanban-api test -- opencode-import
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/symphony-kanban-api/src/opencode-client.ts \
  packages/symphony-kanban-api/src/app.ts \
  packages/symphony-kanban-api/test/opencode-import.test.ts

git commit -m "feat(api): list opencode projects"
```

---

## Chunk 2: API import endpoint

### Task 3: Store helper for lookup by path

**Files:**
- Modify: `packages/symphony-kanban-api/src/workspace-store.ts`

- [ ] **Step 1: Write failing test for import behavior (skips existing)**

```ts
// packages/symphony-kanban-api/test/opencode-import.test.ts
it("imports workspaces and skips existing local paths", async () => {
  await request(app)
    .post("/workspaces")
    .send({ name: "Existing", localPath: "/repo/exist" });

  const res = await request(app)
    .post("/workspaces/import/opencode")
    .send({
      projects: [
        { name: "Existing", localPath: "/repo/exist" },
        { name: "New", localPath: "/repo/new" },
      ],
    });

  expect(res.status).toBe(200);
  expect(res.body.imported).toEqual(["/repo/new"]);
  expect(res.body.skipped).toEqual(["/repo/exist"]);
  expect(res.body.failed).toEqual([]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
pnpm -C packages/symphony-kanban-api test -- opencode-import
```
Expected: FAIL (endpoint missing).

- [ ] **Step 3: Add helper to lookup by local_path**

```ts
// packages/symphony-kanban-api/src/workspace-store.ts
export const findWorkspaceIdByLocalPath = (localPath: string) => {
  const row = db
    .prepare("SELECT id FROM workspaces WHERE local_path = ?")
    .get(localPath) as { id: string } | undefined;
  return row?.id ?? null;
};
```

- [ ] **Step 4: Implement import endpoint**

```ts
// packages/symphony-kanban-api/src/app.ts
import { findWorkspaceIdByLocalPath } from "./workspace-store.js";

app.post("/workspaces/import/opencode", (req, res) => {
  const { projects } = req.body ?? {};
  if (!Array.isArray(projects)) {
    res.status(400).json({ error: "projects_required" });
    return;
  }

  const imported: string[] = [];
  const skipped: string[] = [];
  const failed: Array<{ localPath: string; reason: string }> = [];
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    for (const item of projects) {
      const name = typeof item?.name === "string" ? item.name.trim() : "";
      const localPath =
        typeof item?.localPath === "string" ? item.localPath.trim() : "";

      if (!name || !localPath) {
        failed.push({ localPath: localPath || "(missing)", reason: "invalid" });
        continue;
      }

      const existing = findWorkspaceIdByLocalPath(localPath);
      if (existing) {
        skipped.push(localPath);
        continue;
      }

      const id = randomUUID();
      createWorkspace(id, name, localPath, null, now);
      imported.push(localPath);
    }
  });

  try {
    tx();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to import opencode workspaces", error);
    res.status(500).json({ error: "import_failed" });
    return;
  }

  res.json({ imported, skipped, failed });
});
```

- [ ] **Step 5: Run test to verify it passes**

Run:
```bash
pnpm -C packages/symphony-kanban-api test -- opencode-import
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/symphony-kanban-api/src/app.ts \
  packages/symphony-kanban-api/src/workspace-store.ts \
  packages/symphony-kanban-api/test/opencode-import.test.ts

git commit -m "feat(api): import opencode workspaces"
```

---

## Chunk 3: Web UI + API client

### Task 4: API client support

**Files:**
- Modify: `packages/symphony-kanban-web/src/lib/api.ts`

- [ ] **Step 1: Write failing test (optional) for new api methods**

```ts
// packages/symphony-kanban-web/src/pages/workspace/__tests__/opencode-import.test.ts
import { describe, expect, it, vi } from "vitest";
import { buildApi } from "../../../lib/api";

it("calls opencode list endpoint", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ data: [] }),
  } as any);

  const api = buildApi("http://localhost:3001");
  await api.listOpencodeProjects();
  expect(fetchSpy).toHaveBeenCalledWith(
    "http://localhost:3001/workspaces/import/opencode/list",
  );

  fetchSpy.mockRestore();
});
```

- [ ] **Step 2: Implement new API methods**

```ts
// packages/symphony-kanban-web/src/lib/api.ts
  async listOpencodeProjects() {
    const res = await fetch(`${base}/workspaces/import/opencode/list`);
    if (!res.ok) throw new Error("opencode_list_failed");
    return res.json();
  },
  async importOpencodeProjects(payload: { projects: Array<{ name: string; localPath: string }> }) {
    const res = await fetch(`${base}/workspaces/import/opencode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("opencode_import_failed");
    return res.json();
  },
```

- [ ] **Step 3: Run test to verify it passes (if added)**

Run:
```bash
pnpm -C packages/symphony-kanban-web test -- opencode-import
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/symphony-kanban-web/src/lib/api.ts \
  packages/symphony-kanban-web/src/pages/workspace/__tests__/opencode-import.test.ts

git commit -m "feat(web): add opencode import api client"
```

### Task 5: Workspace management UI

**Files:**
- Modify: `packages/symphony-kanban-web/src/pages/workspace/workspace-management-view.vue`

- [ ] **Step 1: Write failing UI test (optional)**

```ts
// packages/symphony-kanban-web/src/pages/workspace/__tests__/opencode-import.test.ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import WorkspaceManagementView from "../workspace-management-view.vue";

it("shows opencode import button", () => {
  const wrapper = mount(WorkspaceManagementView);
  expect(wrapper.text()).toContain("导入 OpenCode");
});
```

- [ ] **Step 2: Add button and dialog state**

```vue
<!-- header-actions -->
<el-button class="action-button" @click="openImportDialog">
  导入 OpenCode
</el-button>
<el-button class="action-button action-primary" @click="createWorkspace">
  + 添加工作区
</el-button>
```

```ts
const importDialogVisible = ref(false);
const importLoading = ref(false);
const importSubmitting = ref(false);
const opencodeProjects = ref<Array<{ name: string; localPath: string }>>([]);
const selectedProjects = ref<Array<{ name: string; localPath: string }>>([]);
```

- [ ] **Step 3: Fetch list on open**

```ts
const openImportDialog = async () => {
  importDialogVisible.value = true;
  importLoading.value = true;
  try {
    const res = await api.listOpencodeProjects();
    opencodeProjects.value = res.data ?? [];
  } catch (error) {
    ElMessage.error("获取 OpenCode 项目失败");
  } finally {
    importLoading.value = false;
  }
};
```

- [ ] **Step 4: Add modal with multi-select**

Use `el-table` with `@selection-change` to keep `selectedProjects` updated.

```vue
<el-dialog v-model="importDialogVisible" class="workspace-dialog" align-center>
  <template #header>
    <div class="dialog-header">
      <div class="dialog-title">导入 OpenCode 项目</div>
      <el-button class="dialog-close" text @click="closeImportDialog">✕</el-button>
    </div>
  </template>

  <el-table
    v-loading="importLoading"
    :data="opencodeProjects"
    @selection-change="(rows) => (selectedProjects = rows)"
  >
    <el-table-column type="selection" width="48" />
    <el-table-column prop="name" label="名称" />
    <el-table-column prop="localPath" label="本地路径" />
  </el-table>

  <div class="dialog-actions">
    <el-button class="action-button action-cancel" text @click="closeImportDialog">
      取消
    </el-button>
    <el-button
      class="action-button action-primary"
      :loading="importSubmitting"
      :disabled="selectedProjects.length === 0"
      @click="submitImport"
    >
      导入
    </el-button>
  </div>
</el-dialog>
```

- [ ] **Step 5: Submit import + refresh list**

```ts
const closeImportDialog = () => {
  importDialogVisible.value = false;
  selectedProjects.value = [];
};

const submitImport = async () => {
  importSubmitting.value = true;
  try {
    const res = await api.importOpencodeProjects({
      projects: selectedProjects.value,
    });
    const imported = res.imported?.length ?? 0;
    const skipped = res.skipped?.length ?? 0;
    const failed = res.failed?.length ?? 0;
    ElMessage.success(`导入完成：成功 ${imported}，跳过 ${skipped}，失败 ${failed}`);
    closeImportDialog();
    await load();
  } catch (error) {
    ElMessage.error("导入失败");
  } finally {
    importSubmitting.value = false;
  }
};
```

- [ ] **Step 6: Run web tests (if added)**

Run:
```bash
pnpm -C packages/symphony-kanban-web test -- opencode-import
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/symphony-kanban-web/src/pages/workspace/workspace-management-view.vue \
  packages/symphony-kanban-web/src/pages/workspace/__tests__/opencode-import.test.ts

git commit -m "feat(web): import opencode workspaces"
```

---

## Chunk 4: Verification

### Task 6: Manual smoke checks

- [ ] **Step 1: Start API + Web**

```bash
pnpm -C packages/symphony-kanban-api dev
pnpm -C packages/symphony-kanban-web dev
```
Expected: API on `http://localhost:3001`, web on Vite port.

- [ ] **Step 2: Manual flow**

1. Open Workspace 管理页。
2. Click “导入 OpenCode”。
3. Confirm list loads and multi-select works.
4. Import selections, verify list refresh and toast summary.

- [ ] **Step 3: Commit any follow-up fixes**

```bash
git add packages/symphony-kanban-api/src/app.ts \
  packages/symphony-kanban-web/src/pages/workspace/workspace-management-view.vue

git commit -m "fix: opencode import flow polish"
```

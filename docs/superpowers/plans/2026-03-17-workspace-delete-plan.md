# Workspace Delete Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe workspace deletion from the workspace list page, with backend deletion checks, confirmation modal, and prevention when issues exist.

**Architecture:** Extend API with a deletion-check endpoint and a delete endpoint that enforces constraints. Frontend adds a delete button per workspace card, uses Element Plus confirmation and messaging, and refreshes list after deletion.

**Tech Stack:** Node/Express API, SQLite (db helpers), Vue 3 + Element Plus, Vitest.

---

## File Structure

- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/app.ts`
  - Add `GET /workspaces/:id/deletion-check` and `DELETE /workspaces/:id` routes.
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/workspace-store.ts`
  - Add deleteWorkspace and countIssuesByWorkspace helpers.
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/lib/api.ts`
  - Add `checkWorkspaceDeletion` and `deleteWorkspace` client calls.
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workspace/workspace-management-view.vue`
  - Add delete button, confirmation flow, messaging, and loading state.
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/test/workspace-delete.test.ts`
  - API tests for deletion check and delete behavior.

---

## Chunk 1: API Tests (TDD)

### Task 1: Add failing API tests for deletion check and delete

**Files:**
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/test/workspace-delete.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createServer } from "../src/app";
import { resetDb } from "../src/db";

const app = createServer();

describe("workspace deletion", () => {
  beforeEach(() => resetDb());
  afterEach(() => resetDb());

  it("returns deletable=false with issue count when issues exist", async () => {
    const workspaceRes = await request(app)
      .post("/workspaces")
      .send({ name: "Workspace A" });

    const workspaceId = workspaceRes.body.data.id;

    await request(app).post("/issues").send({
      title: "Issue 1",
      description: "",
      priority: 2,
      workspace_id: workspaceId,
      tags: [],
    });

    const res = await request(app).get(`/workspaces/${workspaceId}/deletion-check`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ deletable: false, issueCount: 1 });
  });

  it("returns deletable=true with issueCount=0 when no issues", async () => {
    const workspaceRes = await request(app)
      .post("/workspaces")
      .send({ name: "Workspace B" });

    const workspaceId = workspaceRes.body.data.id;

    const res = await request(app).get(`/workspaces/${workspaceId}/deletion-check`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ deletable: true, issueCount: 0 });
  });

  it("rejects delete with 409 when issues exist", async () => {
    const workspaceRes = await request(app)
      .post("/workspaces")
      .send({ name: "Workspace C" });

    const workspaceId = workspaceRes.body.data.id;

    await request(app).post("/issues").send({
      title: "Issue 2",
      description: "",
      priority: 2,
      workspace_id: workspaceId,
      tags: [],
    });

    const res = await request(app).delete(`/workspaces/${workspaceId}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("workspace_not_empty");
    expect(res.body.issueCount).toBe(1);
  });

  it("deletes workspace when no issues", async () => {
    const workspaceRes = await request(app)
      .post("/workspaces")
      .send({ name: "Workspace D" });

    const workspaceId = workspaceRes.body.data.id;

    const res = await request(app).delete(`/workspaces/${workspaceId}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const listRes = await request(app).get("/workspaces");
    expect(listRes.body.data.find((w: any) => w.id === workspaceId)).toBeFalsy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```
pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api test -- workspace-delete.test.ts
```
Expected: FAIL because routes/helpers do not exist yet.

---

## Chunk 2: API Implementation

### Task 2: Add workspace deletion helpers

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/workspace-store.ts`

- [ ] **Step 1: Add countIssuesByWorkspace helper**

```ts
export const countIssuesByWorkspace = (workspaceId: string) => {
  const row = db
    .prepare("SELECT COUNT(*) as count FROM issues WHERE workspace_id = ?")
    .get(workspaceId) as { count: number };
  return row?.count ?? 0;
};
```

- [ ] **Step 2: Add deleteWorkspace helper**

```ts
export const deleteWorkspace = (workspaceId: string) => {
  db.prepare("DELETE FROM workspaces WHERE id = ?").run(workspaceId);
};
```

- [ ] **Step 3: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/workspace-store.ts

git commit -m "feat(api): add workspace deletion helpers"
```

### Task 3: Add deletion-check and delete routes

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/app.ts`

- [ ] **Step 1: Add GET /workspaces/:id/deletion-check**

```ts
app.get("/workspaces/:id/deletion-check", (req, res) => {
  const issueCount = countIssuesByWorkspace(req.params.id);
  res.json({
    data: {
      deletable: issueCount === 0,
      issueCount,
    },
  });
});
```

- [ ] **Step 2: Add DELETE /workspaces/:id**

```ts
app.delete("/workspaces/:id", (req, res) => {
  const issueCount = countIssuesByWorkspace(req.params.id);
  if (issueCount > 0) {
    res.status(409).json({ error: "workspace_not_empty", issueCount });
    return;
  }
  deleteWorkspace(req.params.id);
  res.json({ ok: true });
});
```

- [ ] **Step 3: Run API tests**

Run:
```
pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api test -- workspace-delete.test.ts
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/app.ts

git commit -m "feat(api): add workspace delete routes"
```

---

## Chunk 3: Web API Client + UI

### Task 4: Add web API client methods

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/lib/api.ts`

- [ ] **Step 1: Add checkWorkspaceDeletion**

```ts
async checkWorkspaceDeletion(id: string) {
  const res = await fetch(`${base}/workspaces/${id}/deletion-check`);
  if (!res.ok) throw new Error("workspace_delete_check_failed");
  return res.json();
},
```

- [ ] **Step 2: Add deleteWorkspace**

```ts
async deleteWorkspace(id: string) {
  const res = await fetch(`${base}/workspaces/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const message = errorJson.error || "workspace_delete_failed";
    const error = new Error(message);
    (error as Error & { issueCount?: number }).issueCount = errorJson.issueCount;
    throw error;
  }
  return res.json();
},
```

- [ ] **Step 3: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/lib/api.ts

git commit -m "feat(web): add workspace delete API"
```

### Task 5: Add delete UI + confirmation

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workspace/workspace-management-view.vue`

- [ ] **Step 1: Add delete button in card**

Add a button on the right side, stop click propagation, and use `deletingId` for loading/disable.

- [ ] **Step 2: Add delete handler**

Pseudo:
```ts
const deletingId = ref<string | null>(null);

const handleDelete = async (workspace: WorkspaceDTO) => {
  if (deletingId.value) return;
  deletingId.value = workspace.id;
  try {
    const check = await api.checkWorkspaceDeletion(workspace.id);
    const issueCount = check.data?.issueCount ?? 0;
    if (issueCount > 0) {
      await ElMessageBox.alert(
        `该工作区下还有 ${issueCount} 个任务未清理，请先处理后再删除。`,
        "无法删除工作区",
      );
      return;
    }

    await ElMessageBox.confirm("删除后将无法恢复。", "确认删除工作区？", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });

    await api.deleteWorkspace(workspace.id);
    ElMessage.success("工作区已删除");
    await load();
  } catch (error) {
    if (error === "cancel") return;
    const message = error instanceof Error ? error.message : "删除失败";
    ElMessage.error(message);
  } finally {
    deletingId.value = null;
  }
};
```

- [ ] **Step 3: Style delete button**

Add class for delete button to align with current card layout.

- [ ] **Step 4: Manual verification**

Verify:
- 删除按钮不触发卡片跳转
- 有任务的工作区提示数量
- 无任务时出现确认弹窗
- 删除成功刷新列表

- [ ] **Step 5: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workspace/workspace-management-view.vue

git commit -m "feat(web): add workspace delete flow"
```

---

## Notes
- Use Element Plus `ElMessageBox` for confirmation + alert.
- Use `409` when workspace not empty.
- Ensure backend delete path does not allow orphaned issues.
- Reference skills: @superpowers:test-driven-development and @superpowers:verification-before-completion.

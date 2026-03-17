# Tag Workflow View Alignment Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore `tag-workflow-view.vue` to the visual baseline of commit `388d1a1` while preserving API-backed functionality and persisting `rules`/`acceptanceCriteria` on tags.

**Architecture:** Reapply the legacy layout/markup as the structural shell, then map existing tag/workflow/scheduler API data into that shell. Extend tag persistence at the DB, API, and DTO layers to store two new text fields.

**Tech Stack:** Vue 3 + Element Plus, Node/Express API, better-sqlite3, shared TypeScript DTOs, Vitest + Supertest.

---

## Chunk 1: Backend Tag Persistence (DB + API + DTO)

### Task 1: Extend DB schema and runtime migration

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-db/schema/schema.sql`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/db.ts`

- [ ] **Step 1: Write failing DB smoke test (optional)**

If a DB schema test harness exists, add a test that inserts a tag row with `rules` and `acceptance_criteria` and reads it back. If no DB unit test harness exists, skip to Step 2 and note manual verification.

- [ ] **Step 2: Update schema**

Add columns to `tags` table:
```sql
rules TEXT,
acceptance_criteria TEXT,
```

- [ ] **Step 3: Add runtime migration guards**

In `db.ts`, add:
```ts
ensureColumn("tags", "rules", "ALTER TABLE tags ADD COLUMN rules TEXT");
ensureColumn("tags", "acceptance_criteria", "ALTER TABLE tags ADD COLUMN acceptance_criteria TEXT");
```

- [ ] **Step 4: Manual verification**

Run a quick query in a local session (if available) to confirm columns exist. If no local run, note that verification will be done during API tests.

- [ ] **Step 5: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-db/schema/schema.sql \
        /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/db.ts

git commit -m "db: add rules and acceptance criteria to tags"
```

### Task 2: Update DTO + tag store + tag endpoints

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-shared/src/index.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/tag-store.ts`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/app.ts`
- Test: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/test/tags.test.ts` (new)

- [ ] **Step 1: Write failing API test**

Create a new Vitest + Supertest test for tags create/update with new fields:
```ts
import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("tags api", () => {
  it("persists rules and acceptance criteria", async () => {
    const createRes = await request(app)
      .post("/tags")
      .send({ name: "spec-tag", rules: "rule-1", acceptanceCriteria: "acc-1" });
    expect(createRes.status).toBe(201);

    const listRes = await request(app).get("/tags");
    const found = listRes.body.data.find((t: any) => t.name === "spec-tag");
    expect(found.rules).toBe("rule-1");
    expect(found.acceptanceCriteria).toBe("acc-1");

    const updateRes = await request(app)
      .patch(`/tags/${found.id}`)
      .send({ name: "spec-tag", rules: "rule-2", acceptanceCriteria: "acc-2" });
    expect(updateRes.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api test -- tags.test.ts
```
Expected: FAIL due to missing fields / columns.

- [ ] **Step 3: Update TagDTO**

Add optional fields:
```ts
rules?: string | null;
acceptanceCriteria?: string | null;
```

- [ ] **Step 4: Update tag-store queries**

Select/insert/update should include `rules` and `acceptance_criteria`:
```ts
SELECT ..., rules, acceptance_criteria as acceptanceCriteria ...
INSERT INTO tags (..., rules, acceptance_criteria, ...)
UPDATE tags SET ..., rules = ?, acceptance_criteria = ? ...
```

- [ ] **Step 5: Update tag endpoints**

In `/tags` POST and PATCH handlers:
- Accept `rules` and `acceptanceCriteria` from body.
- Persist them via `createTag`/`updateTag`.
- Include them in the response for POST.

- [ ] **Step 6: Run tests**

Run:
```bash
pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api test -- tags.test.ts
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-shared/src/index.ts \
        /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/tag-store.ts \
        /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/src/app.ts \
        /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api/test/tags.test.ts

git commit -m "feat(api): persist tag rules and acceptance criteria"
```

## Chunk 2: Frontend Layout Restoration + Data Wiring

### Task 3: Restore layout structure with API-driven data

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workflow/tag-workflow-view.vue`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/lib/api.ts` (if needed to pass new fields)

- [ ] **Step 1: Write a quick visual checklist**

Create a short checklist (in the plan execution notes) of the `388d1a1` layout markers to match:
- Three columns (tag list / form / hooks)
- Original headings and copy
- Original spacing + textarea styles + hooks block styles

- [ ] **Step 2: Rebuild template structure**

Use the `388d1a1` DOM structure and classes as the base. Insert the newer API bindings in place:
- `v-for` on tag list with active state.
- Middle column: three textareas with `v-model`.
- Hooks column: map to workflow editor inputs and save actions while preserving old class names.

- [ ] **Step 3: Reconnect script logic**

Reintroduce the API logic from the newer version:
- `tags`, `workflows`, `settings` loading
- `selectTag`, `createNewTag`, `saveTag`, `deleteTag`, `saveWorkflow`, `saveSettings`
- Ensure `tagForm` includes `rules` and `acceptanceCriteria` and they are saved.

- [ ] **Step 4: Restore CSS**

Restore the original CSS blocks removed in newer versions (textarea styles, hooks styles, etc.). Ensure new inputs inherit those styles where possible.

- [ ] **Step 5: Manual UI verification**

Open the page and check:
- Layout and spacing match `388d1a1`
- Textareas editable and save correctly
- Hooks column looks like legacy design but remains functional

- [ ] **Step 6: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workflow/tag-workflow-view.vue \
        /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/lib/api.ts

git commit -m "feat(web): restore tag workflow layout while keeping api wiring"
```

## Chunk 3: Verification

### Task 4: Run targeted checks

**Files:**
- N/A

- [ ] **Step 1: API tests**

Run:
```bash
pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-api test -- tags.test.ts
```
Expected: PASS.

- [ ] **Step 2: Optional app smoke test**

If a dev server is available:
```bash
pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web dev
```
Manually verify the UI.

- [ ] **Step 3: Commit (if any fixups)**

Only if changes were made during verification.


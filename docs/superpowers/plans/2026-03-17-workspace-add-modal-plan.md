# Workspace Add Modal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the prompt-based workspace creation flow with a single Element Plus modal form that validates required fields and submits via the existing API.

**Architecture:** Keep the UI change localized to the workspace management view. Add a small helper to normalize form payloads (trim/empty-to-null) that is unit tested, and use Element Plus `ElDialog + ElForm` for validation and submission.

**Tech Stack:** Vue 3 (SFC), Element Plus, Vitest (web package), Fetch API wrapper in `lib/api`.

---

## File Structure

- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workspace/workspace-management-view.vue`
  - Replace `window.prompt` workflow with modal + form state, validation rules, submit handler.
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workspace/workspace-form.ts`
  - Small pure helper to normalize payload (trim, empty -> null for optional fields).
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workspace/__tests__/workspace-form.test.ts`
  - Unit tests for payload normalization helper.

---

## Chunk 1: Payload Helper + Tests

### Task 1: Add failing unit test for payload normalization

**Files:**
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workspace/__tests__/workspace-form.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { toWorkspacePayload } from "../workspace-form";

describe("toWorkspacePayload", () => {
  it("trims required fields and converts optional empty strings to null", () => {
    const payload = toWorkspacePayload({
      name: "  My Workspace  ",
      localPath: "  /tmp/project  ",
      context: "   ",
    });

    expect(payload).toEqual({
      name: "My Workspace",
      localPath: "/tmp/project",
      context: null,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```
pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web test -- --runTestsByPath src/pages/workspace/__tests__/workspace-form.test.ts
```
Expected: FAIL with "Cannot find module '../workspace-form'" or "toWorkspacePayload is not a function".

- [ ] **Step 3: Implement minimal helper**

**Files:**
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workspace/workspace-form.ts`

```ts
export type WorkspaceFormInput = {
  name: string;
  localPath: string;
  context: string;
};

export type WorkspacePayload = {
  name: string;
  localPath: string;
  context: string | null;
};

const trimValue = (value: string) => value.trim();

export const toWorkspacePayload = (input: WorkspaceFormInput): WorkspacePayload => {
  const name = trimValue(input.name);
  const localPath = trimValue(input.localPath);
  const context = trimValue(input.context);

  return {
    name,
    localPath,
    context: context ? context : null,
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```
pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web test -- --runTestsByPath src/pages/workspace/__tests__/workspace-form.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workspace/workspace-form.ts \
        /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workspace/__tests__/workspace-form.test.ts

git commit -m "test: add workspace payload helper"
```

---

## Chunk 2: Workspace Add Modal UI + Submission Flow

### Task 2: Add modal template and form state

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workspace/workspace-management-view.vue`

- [ ] **Step 1: Add dialog markup (initial failing behavior)**

Add `ElDialog` + `ElForm` to template (modeled after `create-task-modal.vue`) with fields:
- 工作区名称（必填）
- 本地路径（必填）
- 上下文说明（可选）

- [ ] **Step 2: Add form state and validation rules**

Introduce:
- `dialogVisible = ref(false)`
- `submitting = ref(false)`
- `formRef = ref<FormInstance>()`
- `form = reactive({ name: "", localPath: "", context: "" })`
- `rules` for name/localPath required (trigger `blur`)

- [ ] **Step 3: Wire open/close behavior**

Replace `createWorkspace` button handler to open modal instead of `window.prompt`.
Add `handleCancel` to close and reset form state.

- [ ] **Step 4: Implement submit handler using helper**

Use `formRef.validate()` and `toWorkspacePayload(form)` to call `api.createWorkspace()`.
Behavior:
- On success: close dialog, reset form, call `load()`
- On failure: `ElMessage.error(...)`, keep inputs
- Set `submitting` to control button loading/disabled

- [ ] **Step 5: Add dialog styling**

Add styles for dialog width, header, and actions (reuse class naming style from task modal for consistency).

- [ ] **Step 6: Manual verification**

Run the app and verify:
- Clicking “+ 添加工作区” opens modal
- Leaving name/path empty shows validation error
- Successful create closes modal and refreshes list
- API failure keeps input and shows error

- [ ] **Step 7: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workspace/workspace-management-view.vue

git commit -m "feat: add workspace creation modal"
```

---

## Notes
- Use `ElMessage` for error feedback, matching existing conventions in `create-task-modal.vue`.
- Keep changes scoped to workspace management view to avoid unrelated refactors.
- Reference skills: @superpowers:test-driven-development for the helper test, @superpowers:verification-before-completion before declaring completion.

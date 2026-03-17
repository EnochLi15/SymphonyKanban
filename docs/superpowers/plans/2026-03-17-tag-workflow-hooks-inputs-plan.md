# Tag Workflow Hooks Inputs Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hooks column inputs with two plain text fields that map to `workflowForm.configJson.after_create` and `workflowForm.configJson.before_remove`, saving normalized JSON without legacy compatibility.

**Architecture:** Keep the legacy hooks layout and styles, but simplify the content of each hook block to a single text input. Add minimal serialization/parsing helpers in the page component to keep `configJson` in sync with the two inputs.

**Tech Stack:** Vue 3 + Element Plus, TypeScript.

---

## Chunk 1: UI + Data Mapping in tag-workflow-view.vue

### Task 1: Add inputs and configJson mapping

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workflow/tag-workflow-view.vue`
- Test: (manual) page load + save actions

- [ ] **Step 1: Write a small failing unit test (optional)**

If there is a page-level test harness, add a test that ensures `after_create`/`before_remove` are serialized into `configJson`. If not, note manual verification and proceed.

- [ ] **Step 2: Add reactive fields for hook text**

In `script setup`, extend local state with:
```ts
const hookForm = reactive({
  afterCreate: "",
  beforeRemove: "",
});
```

- [ ] **Step 3: Add serialization helpers**

Add helpers:
```ts
const syncHookFormFromConfig = () => {
  hookForm.afterCreate = "";
  hookForm.beforeRemove = "";
};

const syncConfigFromHookForm = () => {
  workflowForm.configJson = JSON.stringify({
    after_create: hookForm.afterCreate,
    before_remove: hookForm.beforeRemove,
  });
};
```
Note: no legacy compatibility/parsing. On selection, set empty strings and let save overwrite.

- [ ] **Step 4: Wire selection + save paths**

When selecting a tag, call `syncHookFormFromConfig()`.
Before `saveWorkflow` / `applyAll`, call `syncConfigFromHookForm()`.

- [ ] **Step 5: Update template**

Replace the hook code boxes with a single `el-input` each:
- `after_create` block uses `v-model="hookForm.afterCreate"`
- `before_remove` block uses `v-model="hookForm.beforeRemove"`

- [ ] **Step 6: Manual verification**

Open the page and verify:
- Two text inputs appear in the hooks column
- Clicking “应用并保存配置” writes `configJson` with `after_create` and `before_remove`
- “保存工作流规则” writes the same normalized JSON

- [ ] **Step 7: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workflow/tag-workflow-view.vue

git commit -m "feat(web): map hooks inputs to workflow config json"
```

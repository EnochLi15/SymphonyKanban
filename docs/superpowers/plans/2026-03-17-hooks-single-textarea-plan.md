# Hooks Single Textarea Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hooks section’s nested input with a single large textarea per hook, removing the double-border visual.

**Architecture:** Swap the hook `code-box` wrapper + inner `el-input` for a single `el-input` textarea styled to look like the original hook box (color + background) without an inner border.

**Tech Stack:** Vue 3 + Element Plus, TypeScript.

---

## Chunk 1: Hooks UI Simplification

### Task 1: Replace nested input with single textarea

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workflow/tag-workflow-view.vue`
- Test: (manual) page render

- [ ] **Step 1: Update template**

Replace each hook block’s `code-box` + inner `el-input` with a single `el-input` `textarea`:
- `after_create`: `v-model="hookForm.afterCreate"`
- `before_remove`: `v-model="hookForm.beforeRemove"`

- [ ] **Step 2: Update styles**

Add `hook-area` styles to make the textarea match the prior hook box (background, border color, font, min-height), and remove any nested input border styling.

- [ ] **Step 3: Manual verification**

Check the page visually:
- Each hook shows a single large textarea
- No inner/nested border exists
- Color scheme matches previous success/danger styling

- [ ] **Step 4: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/workflow/tag-workflow-view.vue

git commit -m "feat(web): use single textarea for hooks"
```

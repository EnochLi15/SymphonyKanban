# Global Settings Skill Download Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace MCP settings UI with a Skills card that introduces the Symphony Board CRUD skill and provides a download button in global settings.

**Architecture:** Keep all changes in the web app’s global settings view. Serve the skill zip as a static asset under the Vite `public/` directory and link to it from the UI.

**Tech Stack:** Vue 3, Element Plus, Vite, scoped CSS

---

## File Map

- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/public/skills/symphony-board-crud.zip`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/settings/global-settings-view.vue`

---

## Chunk 1: Static Skill Asset

### Task 1: Package the skill for download

**Files:**
- Create: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/public/skills/symphony-board-crud.zip`

- [ ] **Step 1: Create the public folder path**

Run:
```bash
mkdir -p /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/public/skills
```

- [ ] **Step 2: Zip the skill folder into public/**

Run:
```bash
cd /Users/enoch/.agents/skills
zip -r /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/public/skills/symphony-board-crud.zip symphony-board-crud
```

Expected: zip created at the public path.

- [ ] **Step 3: Sanity-check the zip contents**

Run:
```bash
unzip -l /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/public/skills/symphony-board-crud.zip | head -n 20
```

Expected: list shows `symphony-board-crud/SKILL.md` and `agents/openai.yaml`.

- [ ] **Step 4: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/public/skills/symphony-board-crud.zip
git commit -m "Add Symphony Board CRUD skill download asset"
```

---

## Chunk 2: Global Settings UI

### Task 2: Replace MCP section with Skills card

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/settings/global-settings-view.vue`

- [ ] **Step 1: Remove MCP section markup**

Delete the `MCP 服务集成` title, card, code block, and hint.

- [ ] **Step 2: Add Skills section markup**

Add a new section that renders:
- Section title: `技能中心 (Skills)`
- Card title: `Symphony Board CRUD`
- Intro paragraph
- Bullet list of capabilities
- Download button linking to `/skills/symphony-board-crud.zip`
- Hint line stating MCP removed

Suggested structure:
```html
<div class="section-title">技能中心 (Skills)</div>
<el-card class="skills-box">
  <div class="box-title">Symphony Board CRUD</div>
  <p class="box-copy">...</p>
  <ul class="skills-list">
    <li>...</li>
  </ul>
  <el-button class="download-button" type="primary" native-type="button">
    下载技能包
  </el-button>
  <div class="box-hint">已移除 MCP 相关内容，技能专注于看板任务管理。</div>
</el-card>
```

Wrap the button with an `<a>` tag or use `@click` + `window.location`:
```html
<a class="download-link" href="/skills/symphony-board-crud.zip" download>
  <el-button class="download-button" type="primary">下载技能包</el-button>
</a>
```

- [ ] **Step 3: Update styles**

Replace `.mcp-box` rules with `.skills-box`, add:
- `.box-copy` for intro
- `.skills-list` for bullet spacing
- `.download-link` to remove default underline
- `.download-button` to match save button style (or reuse `.save-button`)

- [ ] **Step 4: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/settings/global-settings-view.vue
git commit -m "Replace MCP settings with skills download card"
```

---

## Chunk 3: Verification

### Task 3: Manual UI verification

- [ ] **Step 1: Run the web app**

Run:
```bash
pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web dev
```

- [ ] **Step 2: Verify UI**

Open `/settings` and confirm:
- MCP section is gone.
- Skills card renders with correct copy.
- Download button points to `/skills/symphony-board-crud.zip`.
- Clicking button downloads the zip.

- [ ] **Step 3: Optional lint/test (if part of team workflow)**

Run:
```bash
pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web test
```

Expected: tests pass (if any configured).

- [ ] **Step 4: Commit if changes made during verification**

```bash
git add -A
git commit -m "Verify settings skills download UI"
```


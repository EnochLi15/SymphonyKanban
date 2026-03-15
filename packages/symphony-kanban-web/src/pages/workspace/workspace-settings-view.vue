

<template>
  <div class="workspace-settings-view">
    <aside class="sidebar">
      <div class="sidebar-title">Symphony 看板</div>
      <div class="sidebar-space"></div>
      <nav class="nav-menu">
        <el-button
          class="nav-item"
          text
          :class="{ 'nav-item--active': activeNav === 'workspaces' }"
          @click="activeNav = 'workspaces'"
        >
          工作区 (Workspaces)
        </el-button>
        <el-button
          class="nav-item"
          text
          :class="{ 'nav-item--active': activeNav === 'boards' }"
          @click="activeNav = 'boards'"
        >
          看板 (Boards)
        </el-button>
        <button class="nav-subitem" type="button" @click="activeBoard = 'recent'">
          ↳ 最近一周
        </button>
        <el-button
          class="nav-item"
          text
          :class="{ 'nav-item--active': activeNav === 'tags' }"
          @click="activeNav = 'tags'"
        >
          标签与工作流 (Tags)
        </el-button>
        <el-button
          class="nav-item"
          text
          :class="{ 'nav-item--active': activeNav === 'settings' }"
          @click="activeNav = 'settings'"
        >
          设置 (Settings)
        </el-button>
      </nav>
      <div class="sidebar-spacer"></div>
      <div class="theme-toggle">
        <el-button-group class="theme-toggle-group">
          <el-button
            class="theme-option"
            :class="{ 'theme-option--active': theme === 'light' }"
            text
            @click="setTheme('light')"
          >
            日间
          </el-button>
          <el-button
            class="theme-option"
            :class="{ 'theme-option--active': theme === 'dark' }"
            text
            @click="setTheme('dark')"
          >
            夜间
          </el-button>
        </el-button-group>
      </div>
    </aside>

    <main class="settings-content">
      <h1 class="page-title">工作区详情与配置: Symphony-Kanban</h1>

      <section class="settings-form">
        <div class="section-title">工作区路径 (Local Path)</div>
        <div class="path-box">/Users/enoch/Workspace/SymphonyKanban</div>

        <div class="section-title">
          全局规则注入 (Global Context &amp; Code Conventions)
        </div>
        <div class="context-box">
          项目说明：Symphony Kanban 是一个 AI 驱动的研发管理工具。
          <br />
          编码规范：
          <br />
          1. 强制使用 TypeScript，禁用 any。
          <br />
          2. React 组件使用 Functional Component 和 Hooks。
          <br />
          3. CSS 使用 Tailwind V4 或标准 CSS Modules。
          <br />
          4. 数据库使用 Prisma，修改 schema 后必须生成 migration。
        </div>

        <div class="button-row">
          <el-button class="save-button">保存配置</el-button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTheme } from "../../composables/useTheme";

const activeNav = ref<"workspaces" | "boards" | "tags" | "settings">(
  "workspaces"
);
const activeBoard = ref<"recent">("recent");
const { theme, setTheme } = useTheme();
</script>

<style scoped>
.workspace-settings-view {
  display: flex;
  min-height: 900px;
  width: 100%;
  background: var(--kanban-bg);
  color: var(--kanban-text-primary);
  font-family: "Inter", "DM Sans", "Space Grotesk", system-ui, -apple-system, sans-serif;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 240px;
  padding: 24px;
  background: var(--kanban-surface);
  border-right: 1px solid var(--kanban-border);
  box-sizing: border-box;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 700;
}

.sidebar-space {
  height: 24px;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  justify-content: flex-start;
  height: auto;
  border: 1px solid transparent;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--kanban-surface);
  color: var(--kanban-text-secondary);
  font-size: 14px;
  font-weight: 400;
}

.nav-item--active {
  background: transparent;
  border-color: var(--kanban-primary);
  color: var(--kanban-primary);
}

.nav-subitem {
  text-align: left;
  padding: 4px 12px 4px 24px;
  background: transparent;
  border: none;
  color: var(--kanban-text-secondary);
  font-size: 13px;
  font-weight: 400;
}

.sidebar-spacer {
  flex: 1;
}

.theme-toggle {
  display: flex;
  gap: 8px;
  padding: 4px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.theme-toggle-group {
  display: flex;
  width: 100%;
}

.theme-option {
  flex: 1;
  padding: 8px 0;
  text-align: center;
  border-radius: 4px;
  color: var(--kanban-text-secondary);
  font-size: 12px;
  font-weight: 400;
}

.theme-option--active {
  background: var(--kanban-primary);
  color: var(--kanban-text-primary);
}

.settings-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
}

.path-box {
  padding: 16px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  font-size: 14px;
  color: var(--kanban-text-secondary);
  font-family: "Space Grotesk", "Inter", "DM Sans", system-ui, -apple-system, sans-serif;
}

.context-box {
  padding: 24px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  font-size: 15px;
  color: var(--kanban-text-secondary);
  line-height: 1.6;
  min-height: 240px;
  font-family: "Space Grotesk", "Inter", "DM Sans", system-ui, -apple-system, sans-serif;
}

.button-row {
  display: flex;
  gap: 16px;
}

.save-button {
  border-radius: 6px;
  padding: 12px 24px;
  background: var(--kanban-primary);
  color: var(--kanban-text-primary);
  font-size: 14px;
  font-weight: 600;
  border: none;
}
</style>

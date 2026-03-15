

<template>
  <div class="session-view">
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

    <main class="session-content">
      <header class="session-header">
        <el-button class="back-button" text @click="goBack">← 返回</el-button>
        <h1 class="session-title">会话运行监控: AUTH-102 (运行中...)</h1>
      </header>

      <section class="session-panels">
        <div class="iframe-placeholder"></div>
        <div class="embed-title">🔗 OpenCode Web 会话嵌入区域</div>
        <div class="embed-desc">
          变更文件、Diff 视图、近期日志等内容将通过 iframe 嵌入显示在此区域
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

const goBack = () => {
  // TODO: wire to router history
};
</script>

<style scoped>
.session-view {
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

.session-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
}

.session-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  border: 1px solid var(--kanban-border);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--kanban-text-secondary);
}

.session-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.session-panels {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.iframe-placeholder {
  flex: 1;
  min-height: 420px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  padding: 32px;
  box-sizing: border-box;
}

.embed-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--kanban-text-primary);
}

.embed-desc {
  font-size: 14px;
  font-weight: 400;
  color: var(--kanban-text-secondary);
}
</style>

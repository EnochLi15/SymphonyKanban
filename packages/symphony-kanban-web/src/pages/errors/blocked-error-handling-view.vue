<template>
  <div class="blocked-view">
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
        <button
          class="nav-subitem nav-subitem--active"
          type="button"
          @click="activeBoard = 'recent'"
        >
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

    <main class="blocked-content">
      <header class="blocked-header">
        <div class="header-left">
          <el-button class="back-button" text @click="goBack">← 返回</el-button>
          <h1 class="blocked-title">任务阻塞: 数据库迁移错误</h1>
        </div>
      </header>

      <section class="blocked-panels">
        <div class="alert-box">
          <div class="alert-title">执行中断: Prisma 迁移应用失败。</div>
          <div class="alert-text">错误: 当前数据库模式中不存在关联 'User'。</div>
        </div>

        <div class="context-box">
          <div class="context-title">Agent 上下文快照</div>
          <div class="context-text">
            Agent 尝试应用 `npx prisma db push`，但遇到模式验证错误。前一个迁移
            `20260315_init` 被部分应用。
          </div>
        </div>

        <div class="blocked-actions">
          <el-button class="action-button action-retry">重试执行</el-button>
          <el-button class="action-button action-context">
            修改上下文并恢复
          </el-button>
          <el-button class="action-button action-takeover">
            手动接管 (打开终端)
          </el-button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTheme } from "../../composables/useTheme";

const activeNav = ref<"workspaces" | "boards" | "tags" | "settings">("boards");
const activeBoard = ref<"recent">("recent");
const { theme, setTheme } = useTheme();

const goBack = () => {
  // TODO: wire to router history
};
</script>

<style scoped>
.blocked-view {
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

.nav-subitem--active {
  color: var(--kanban-primary);
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

.blocked-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
}

.blocked-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
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

.blocked-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: var(--kanban-error);
}

.blocked-panels {
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
}

.alert-box {
  padding: 16px;
  border-radius: 8px;
  background: var(--kanban-error-surface);
  border: 1px solid var(--kanban-error);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--kanban-error);
}

.alert-text {
  font-size: 14px;
  font-weight: 400;
  color: var(--kanban-text-secondary);
}

.context-box {
  padding: 16px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.context-title {
  font-size: 16px;
  font-weight: 600;
}

.context-text {
  font-size: 14px;
  font-weight: 400;
  color: var(--kanban-text-secondary);
  line-height: 1.5;
}

.blocked-actions {
  display: flex;
  gap: 16px;
}

.action-button {
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--kanban-text-primary);
  border: none;
}

.action-retry {
  background: var(--kanban-primary);
}

.action-context {
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.action-takeover {
  background: var(--kanban-muted);
}
</style>

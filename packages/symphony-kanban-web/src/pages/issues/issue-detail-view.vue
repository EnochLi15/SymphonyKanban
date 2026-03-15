

<template>
  <div class="issue-view">
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

    <main class="issue-content">
      <header class="issue-header">
        <div class="header-left">
          <el-button class="back-button" text @click="goBack">← 返回</el-button>
          <h1 class="issue-title">任务详情: AUTH-102</h1>
        </div>
      </header>

      <section class="issue-details">
        <div class="main-col">
          <div class="title-input">
            支持从 opencode 获取工作区
          </div>

          <div class="subtasks">
            <div class="subtasks-title">子任务拆解 (Breakdown)</div>
            <div class="subtask subtask--done">- [x] 读取 opencode 配置文件</div>
            <div class="subtask">- [ ] 解析 workspace 路径与状态</div>
            <button class="subtask-add" type="button">+ 添加子任务</button>
          </div>
        </div>

        <aside class="side-col">
          <div class="meta-row">状态: 待排期 (Backlog)</div>
          <div class="meta-row">优先级: P2 中</div>
          <div class="meta-row">标签: feature, integration</div>

          <div class="section-title">进程配置:</div>
          <div class="meta-row meta-row--muted">并发上限: 2</div>
          <div class="meta-row meta-row--success">Todo 自动运行: 开启</div>
          <div class="meta-row meta-row--muted">排队执行优先级: 高</div>
          <div class="meta-row meta-row--danger">超时熔断: 30分钟</div>

          <div class="section-title">调度配置 (Schedule):</div>
          <div class="schedule-box">
            <div class="schedule-row">
              <span class="schedule-label">启用定时触发</span>
              <div class="toggle">
                <div class="toggle-thumb"></div>
              </div>
            </div>
            <div class="schedule-hint">执行频率 (Cron / Interval)</div>
            <div class="schedule-input">0 0 * * * (每天零点)</div>
            <div class="schedule-next">下次执行: 2026-03-16 00:00</div>
          </div>
        </aside>
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
.issue-view {
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

.issue-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
}

.issue-header {
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

.issue-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.issue-details {
  flex: 1;
  display: flex;
  gap: 24px;
  min-width: 0;
}

.main-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.title-input {
  padding: 16px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  font-size: 18px;
  font-weight: 600;
}

.subtasks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subtasks-title {
  font-size: 16px;
  font-weight: 600;
}

.subtask {
  padding: 12px;
  border-radius: 6px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  font-size: 14px;
  font-weight: 400;
  color: var(--kanban-text-primary);
}

.subtask--done {
  color: var(--kanban-text-secondary);
}

.subtask-add {
  padding: 12px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid var(--kanban-primary);
  color: var(--kanban-primary);
  font-size: 14px;
  font-weight: 400;
  text-align: left;
}

.side-col {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  border-radius: 8px;
  background: var(--kanban-surface);
  box-sizing: border-box;
}

.meta-row {
  font-size: 14px;
  font-weight: 400;
  color: var(--kanban-text-primary);
}

.meta-row--muted {
  color: var(--kanban-text-secondary);
}

.meta-row--success {
  color: var(--kanban-success);
}

.meta-row--danger {
  color: var(--kanban-error);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
}

.schedule-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 6px;
  background: var(--kanban-bg);
  border: 1px solid var(--kanban-border);
}

.schedule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.schedule-label {
  font-size: 13px;
  font-weight: 400;
  color: var(--kanban-text-primary);
}

.toggle {
  width: 40px;
  height: 20px;
  border-radius: 10px;
  background: var(--kanban-primary);
  padding: 2px;
  box-sizing: border-box;
  display: flex;
  justify-content: flex-end;
}

.toggle-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
}

.schedule-hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--kanban-text-secondary);
}

.schedule-input {
  padding: 10px;
  border-radius: 4px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  font-size: 13px;
  font-weight: 400;
  font-family: "Space Grotesk", "Inter", "DM Sans", system-ui, -apple-system, sans-serif;
  color: var(--kanban-text-primary);
}

.schedule-next {
  font-size: 11px;
  font-weight: 400;
  color: var(--kanban-success);
}
</style>

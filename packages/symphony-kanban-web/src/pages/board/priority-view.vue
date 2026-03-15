<template>
  <div class="priority-view">
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

    <main class="priority-content">
      <header class="priority-header">
        <div class="priority-title">最近一周</div>
        <div class="view-modes">
          <el-button
            class="mode"
            :class="{ 'mode--active': activeViewMode === 'state' }"
            text
            @click="activeViewMode = 'state'"
          >
            状态视图
          </el-button>
          <el-button
            class="mode"
            :class="{ 'mode--active': activeViewMode === 'priority' }"
            text
            @click="activeViewMode = 'priority'"
          >
            优先级视图
          </el-button>
          <el-button class="mode mode--muted" text @click="createTask">
            + 新建任务
          </el-button>
        </div>
      </header>

      <section class="priority-grid">
        <div class="priority-row">
          <div class="priority-quadrant quadrant-p0">
            <div class="quadrant-title">P0 (重要且紧急) - 立即做</div>
            <div class="priority-card">
              <div class="card-title">数据库迁移错误</div>
              <div class="tag-row">
                <span class="tag tag--p0">已阻塞 (Blocked)</span>
              </div>
            </div>
          </div>
          <div class="priority-quadrant quadrant-p1">
            <div class="quadrant-title quadrant-title--warning">
              P1 (重要但不紧急) - 计划做
            </div>
            <div class="priority-card">
              <div class="card-title">issues 状态自动轮转</div>
              <div class="tag-row">
                <span class="tag tag--primary">进行中 (In Progress)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="priority-row">
          <div class="priority-quadrant quadrant-p2">
            <div class="quadrant-title quadrant-title--primary">
              P2 (紧急但不重要) - 授权做
            </div>
            <div class="priority-card">
              <div class="card-title">支持从 opencode 获取工作区</div>
              <div class="tag-row">
                <span class="tag tag--neutral">待排期 (Backlog)</span>
              </div>
            </div>
          </div>
          <div class="priority-quadrant quadrant-p3">
            <div class="quadrant-title quadrant-title--muted">
              P3 (不紧急不重要) - 稍后做
            </div>
            <div class="priority-card priority-card--muted">
              <div class="card-title card-title--muted">UI 细节调整</div>
              <div class="tag-row">
                <span class="tag tag--neutral">待办 (Todo)</span>
              </div>
            </div>
          </div>
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
const activeViewMode = ref<"state" | "priority">("priority");
const { theme, setTheme } = useTheme();

const createTask = () => {
  // TODO: hook into task creation flow
};
</script>

<style scoped>
.priority-view {
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
  color: var(--kanban-primary);
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

.priority-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
}

.priority-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.priority-title {
  font-size: 28px;
  font-weight: 700;
}

.view-modes {
  display: flex;
  gap: 8px;
  padding: 4px;
  border-radius: 6px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.mode {
  height: auto;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 400;
  color: var(--kanban-text-secondary);
}

.mode--active {
  background: var(--kanban-primary);
  color: var(--kanban-text-primary);
}

.mode--muted {
  background: var(--kanban-muted);
  color: var(--kanban-text-primary);
}

.priority-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.priority-row {
  display: flex;
  gap: 16px;
  flex: 1;
}

.priority-quadrant {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 8px;
  border: 2px solid transparent;
  box-sizing: border-box;
}

.quadrant-p0 {
  background: var(--kanban-error-surface);
  border-color: var(--kanban-error);
}

.quadrant-p1 {
  background: var(--kanban-p1-surface);
  border-color: var(--kanban-warning);
}

.quadrant-p2 {
  background: #1a2235;
  border-color: var(--kanban-primary);
}

.quadrant-p3 {
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.quadrant-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--kanban-error);
}

.quadrant-title--warning {
  color: var(--kanban-warning);
}

.quadrant-title--primary {
  color: var(--kanban-primary);
}

.quadrant-title--muted {
  color: var(--kanban-text-secondary);
}

.priority-card {
  padding: 16px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.priority-card--muted {
  background: var(--kanban-bg);
}

.card-title {
  font-size: 14px;
  font-weight: 400;
}

.card-title--muted {
  color: var(--kanban-text-secondary);
}

.tag-row {
  display: flex;
  gap: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  border: 1px solid transparent;
}

.tag--p0 {
  background: var(--kanban-error);
  color: var(--kanban-text-primary);
}

.tag--primary {
  background: var(--kanban-surface);
  border-color: var(--kanban-primary);
  color: var(--kanban-primary);
}

.tag--neutral {
  background: var(--kanban-surface);
  border-color: var(--kanban-border);
  color: var(--kanban-text-secondary);
}
</style>

<template>
  <div class="kanban-view">
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

    <main class="main-content">
      <section class="hint-banner">
        <div class="hint-title">💡 用户旅程连线说明 (User Journey Map):</div>
        <div class="hint-text">
          1. 侧边栏导航：点击【工作区】去配置运行路径和全局参数，点击【标签】去设定工作流引擎。
        </div>
        <div class="hint-text">
          2. 卡片流转：卡片拖入【待办(Todo)】后将自动触发执行，执行中可点击跳至【Web 会话监控视图】查看实时日志。
        </div>
        <div class="hint-text">
          3. 标签跳转：直接点击卡片上的【P0 紧急】等标签，可跳转至【标签与工作流】管理视图。
        </div>
        <div class="hint-text">
          4. 视图切换：点击右上角【优先级视图】可切换为四象限 Eisenhower 矩阵管理模式。
        </div>
      </section>

      <header class="board-header">
        <div class="board-title">最近一周</div>
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

      <section class="board">
        <div class="board-col">
          <div class="col-title">待排期 (Backlog)</div>
          <div class="card">
            <div class="card-title">支持从 opencode 获取工作区</div>
            <div class="tag-row tag-row--space">
              <span class="tag tag--neutral">P3 低</span>
            </div>
          </div>
        </div>

        <div class="board-col">
          <div class="col-title">待办 (Todo)</div>
          <div class="card">
            <div class="card-title">issues 标签修改功能</div>
            <div class="tag-row">
              <span class="tag tag--p0">P0 紧急</span>
            </div>
          </div>
        </div>

        <div class="board-col">
          <div class="col-title">进行中 (In Progress)</div>
          <div class="card card--primary">
            <div class="card-title">issues 状态自动轮转</div>
            <div class="tag-row">
              <span class="tag tag--p1">P1 高</span>
            </div>
          </div>
        </div>

        <div class="board-col">
          <div class="col-title">审核中 (In Review)</div>
          <div class="card card--warning">
            <div class="card-title">工作区状态实时刷新</div>
            <div class="tag-row">
              <span class="tag tag--neutral">P2 中</span>
            </div>
          </div>
        </div>

        <div class="board-col">
          <div class="col-title col-title--success">已完成 (Done)</div>
        </div>

        <div class="board-col">
          <div class="col-title col-title--error">已阻塞 (Blocked)</div>
          <div class="card card--error">
            <div class="card-title">数据库迁移错误</div>
            <div class="tag-row">
              <span class="tag tag--p0">P0 紧急</span>
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
const activeViewMode = ref<"state" | "priority">("state");
const { theme, setTheme } = useTheme();

const createTask = () => {
  // TODO: hook into task creation flow
};
</script>

<style scoped>
.kanban-view {
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

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
}

.hint-banner {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 8px;
  background: var(--kanban-hint-bg);
  border: 1px solid var(--kanban-hint-border);
}

.hint-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--kanban-hint-border);
}

.hint-text {
  font-size: 14px;
  font-weight: 400;
  color: var(--kanban-hint-text);
}

.board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.board-title {
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

.board {
  flex: 1;
  display: flex;
  gap: 16px;
  min-width: 0;
}

.board-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.col-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--kanban-text-secondary);
}

.col-title--success {
  color: var(--kanban-success);
}

.col-title--error {
  color: var(--kanban-error);
}

.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.card--primary {
  border-color: var(--kanban-primary);
}

.card--warning {
  border-color: var(--kanban-warning);
}

.card--error {
  background: var(--kanban-error-surface);
  border-color: var(--kanban-error);
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--kanban-text-primary);
}

.tag-row {
  display: flex;
  gap: 8px;
}

.tag-row--space {
  justify-content: space-between;
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

.tag--neutral {
  background: var(--kanban-surface);
  border-color: var(--kanban-border);
  color: var(--kanban-text-secondary);
}

.tag--p0 {
  background: var(--kanban-error-surface);
  border-color: var(--kanban-error);
  color: var(--kanban-error);
}

.tag--p1 {
  background: var(--kanban-p1-surface);
  color: var(--kanban-warning);
}
</style>

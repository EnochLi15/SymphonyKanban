<template>
  <AppShell>
    <div class="main-content">
      <header class="board-header">
        <div class="board-title">
          最近一周
          <el-tooltip placement="right" effect="dark">
            <template #content>
              <div class="hint-popover">
                <div>1. 侧边栏导航：点击【工作区】去配置运行路径和全局参数，点击【标签】去设定工作流引擎。</div>
                <div>2. 卡片流转：卡片拖入【待办(Todo)】后将自动触发执行，执行中可点击跳至【Web 会话监控视图】查看实时日志。</div>
                <div>3. 标签跳转：直接点击卡片上的【P0 紧急】等标签，可跳转至【标签与工作流】管理视图。</div>
                <div>4. 视图切换：点击右上角【优先级视图】可切换为四象限 Eisenhower 矩阵管理模式。</div>
              </div>
            </template>
            <span class="hint-trigger">!</span>
          </el-tooltip>
        </div>
        <div class="view-modes">
          <el-button
            class="mode"
            :class="{ 'mode--active': activeViewMode === 'state' }"
            text
            @click="goStateView"
          >
            状态视图
          </el-button>
          <el-button
            class="mode"
            :class="{ 'mode--active': activeViewMode === 'priority' }"
            text
            @click="goPriorityView"
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
          <el-card class="card">
            <div class="card-title">支持从 opencode 获取工作区</div>
            <div class="tag-row tag-row--space">
              <span class="tag tag--neutral">P3 低</span>
            </div>
          </el-card>
        </div>

        <div class="board-col">
          <div class="col-title">待办 (Todo)</div>
          <el-card class="card card-clickable" @click="goIssueDetail">
            <div class="card-title">issues 标签修改功能</div>
            <div class="tag-row">
              <span class="tag tag--p0">P0 紧急</span>
            </div>
          </el-card>
        </div>

        <div class="board-col">
          <div class="col-title">进行中 (In Progress)</div>
          <el-card class="card card--primary card-clickable" @click="goIssueDetail">
            <div class="card-title">issues 状态自动轮转</div>
            <div class="tag-row">
              <span class="tag tag--p1">P1 高</span>
            </div>
          </el-card>
        </div>

        <div class="board-col">
          <div class="col-title">审核中 (In Review)</div>
          <el-card class="card card--warning">
            <div class="card-title">工作区状态实时刷新</div>
            <div class="tag-row">
              <span class="tag tag--neutral">P2 中</span>
            </div>
          </el-card>
        </div>

        <div class="board-col">
          <div class="col-title col-title--success">已完成 (Done)</div>
        </div>

        <div class="board-col">
          <div class="col-title col-title--error">已阻塞 (Blocked)</div>
          <el-card class="card card--error">
            <div class="card-title">数据库迁移错误</div>
            <div class="tag-row">
              <span class="tag tag--p0">P0 紧急</span>
            </div>
          </el-card>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import AppShell from "../../components/AppShell.vue";

const activeViewMode = ref<"state" | "priority">("state");
const router = useRouter();

const createTask = () => {
  router.push("/tasks/new");
};

const goPriorityView = () => {
  activeViewMode.value = "priority";
  router.push("/board/priority");
};

const goStateView = () => {
  activeViewMode.value = "state";
  router.push("/board");
};

const goIssueDetail = () => {
  router.push("/issues/AUTH-102");
};
</script>

<style scoped>
.main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
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
  display: flex;
  align-items: center;
  gap: 12px;
}

.hint-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background: var(--kanban-primary);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.theme-dark .hint-trigger {
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.25);
}

.theme-light .hint-trigger {
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
}

.hint-popover {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 320px;
  font-size: 12px;
  line-height: 1.5;
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
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.card :deep(.el-card__body) {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-clickable {
  cursor: pointer;
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

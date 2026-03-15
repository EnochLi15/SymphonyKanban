<template>
  <AppShell>
    <div class="priority-content">
      <header class="priority-header">
        <div class="priority-title">最近一周</div>
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

      <section class="priority-grid">
        <div class="priority-row">
          <div class="priority-quadrant quadrant-p0">
            <div class="quadrant-title">P0 (重要且紧急) - 立即做</div>
            <el-card class="priority-card">
              <div class="card-title">数据库迁移错误</div>
              <div class="tag-row">
                <span class="tag tag--p0">已阻塞 (Blocked)</span>
              </div>
            </el-card>
          </div>
          <div class="priority-quadrant quadrant-p1">
            <div class="quadrant-title quadrant-title--warning">
              P1 (重要但不紧急) - 计划做
            </div>
            <el-card class="priority-card">
              <div class="card-title">issues 状态自动轮转</div>
              <div class="tag-row">
                <span class="tag tag--primary">进行中 (In Progress)</span>
              </div>
            </el-card>
          </div>
        </div>

        <div class="priority-row">
          <div class="priority-quadrant quadrant-p2">
            <div class="quadrant-title quadrant-title--primary">
              P2 (紧急但不重要) - 授权做
            </div>
            <el-card class="priority-card">
              <div class="card-title">支持从 opencode 获取工作区</div>
              <div class="tag-row">
                <span class="tag tag--neutral">待排期 (Backlog)</span>
              </div>
            </el-card>
          </div>
          <div class="priority-quadrant quadrant-p3">
            <div class="quadrant-title quadrant-title--muted">
              P3 (不紧急不重要) - 稍后做
            </div>
            <el-card class="priority-card priority-card--muted">
              <div class="card-title card-title--muted">UI 细节调整</div>
              <div class="tag-row">
                <span class="tag tag--neutral">待办 (Todo)</span>
              </div>
            </el-card>
          </div>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import AppShell from "../../components/AppShell.vue";

const activeViewMode = ref<"state" | "priority">("priority");
const router = useRouter();

const createTask = () => {
  router.push("/tasks/create-task-modal");
};

const goPriorityView = () => {
  activeViewMode.value = "priority";
  router.push("/board/priority-view");
};

const goStateView = () => {
  activeViewMode.value = "state";
  router.push("/board/kanban-board-view");
};
</script>

<style scoped>
.priority-content {
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
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.priority-card :deep(.el-card__body) {
  padding: 16px;
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

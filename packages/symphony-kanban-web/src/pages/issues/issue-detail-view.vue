

<template>
  <AppShell>
    <div class="issue-content">
      <header class="issue-header">
        <div class="header-left">
          <el-button class="app-back-button" text @click="goBack">← 返回</el-button>
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
            <el-button class="subtask-add" text>+ 添加子任务</el-button>
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
              <el-switch v-model="scheduleEnabled" class="schedule-switch" />
            </div>
            <div class="schedule-hint">执行频率 (Cron / Interval)</div>
            <div class="schedule-input">0 0 * * * (每天零点)</div>
            <div class="schedule-next">下次执行: 2026-03-16 00:00</div>
          </div>
        </aside>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import AppShell from "../../components/AppShell.vue";

const goBack = () => {
  router.back();
};

const router = useRouter();
const scheduleEnabled = ref(true);
</script>

<style scoped>
.issue-content {
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

.schedule-switch :deep(.el-switch__core) {
  background: var(--kanban-primary);
  border-color: var(--kanban-primary);
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

<template>
  <AppShell>
    <div class="blocked-content">
      <header class="blocked-header">
        <div class="header-left">
          <el-button class="app-back-button" text @click="goBack">← 返回</el-button>
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
          <el-button class="action-button action-retry" @click="goSessionView">
            重试执行
          </el-button>
          <el-button class="action-button action-context" @click="goIssueView">
            修改上下文并恢复
          </el-button>
          <el-button class="action-button action-takeover" @click="goSessionView">
            手动接管 (打开终端)
          </el-button>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import AppShell from "../../components/AppShell.vue";

const goBack = () => {
  router.back();
};

const router = useRouter();

const goSessionView = () => {
  router.push("/sessions/AUTH-102");
};

const goIssueView = () => {
  router.push("/issues/AUTH-102");
};
</script>

<style scoped>
.blocked-content {
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

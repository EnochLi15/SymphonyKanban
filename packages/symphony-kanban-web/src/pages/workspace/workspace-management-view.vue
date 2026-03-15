<template>
  <AppShell>
    <div class="workspace-content">
      <header class="workspace-header">
        <h1 class="workspace-title">工作区管理</h1>
        <div class="header-actions">
          <el-button class="action-button action-muted">从 OpenCode 获取</el-button>
          <el-button class="action-button action-primary">+ 添加工作区</el-button>
        </div>
      </header>

      <section class="workspace-list">
        <el-card class="workspace-card" @click="goWorkspaceSettings">
          <div class="workspace-info">
            <div class="workspace-name">Symphony-Kanban</div>
            <div class="workspace-path">
              /Users/enoch/Workspace/SymphonyKanban
            </div>
          </div>
        </el-card>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import AppShell from "../../components/AppShell.vue";

const router = useRouter();

const goWorkspaceSettings = () => {
  router.push("/workspaces/Symphony-Kanban");
};
</script>

<style scoped>
.workspace-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
}

.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.workspace-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 400;
  color: var(--kanban-text-primary);
}

.action-muted {
  background: var(--kanban-muted);
  border: none;
}

.action-primary {
  background: var(--kanban-primary);
  border: none;
}

.workspace-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workspace-card {
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  cursor: pointer;
}

.workspace-card :deep(.el-card__body) {
  padding: 24px;
  display: flex;
  justify-content: space-between;
}

.workspace-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.workspace-name {
  font-size: 18px;
  font-weight: 600;
}

.workspace-path {
  font-size: 14px;
  font-weight: 400;
  color: var(--kanban-text-secondary);
  font-family: "Space Grotesk", "Inter", "DM Sans", system-ui, -apple-system,
    sans-serif;
}
</style>

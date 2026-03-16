<template>
  <AppShell>
    <div class="workspace-content">
      <header class="workspace-header">
        <h1 class="workspace-title">工作区管理</h1>
        <div class="header-actions">
          <el-button class="action-button action-primary" @click="createWorkspace">
            + 添加工作区
          </el-button>
        </div>
      </header>

      <section class="workspace-list">
        <el-card
          v-for="workspace in workspaces"
          :key="workspace.id"
          class="workspace-card"
          @click="goWorkspaceSettings(workspace.id)"
        >
          <div class="workspace-info">
            <div class="workspace-name">{{ workspace.name }}</div>
            <div class="workspace-path">
              {{ workspace.localPath || "(未设置路径)" }}
            </div>
          </div>
        </el-card>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AppShell from "../../components/AppShell.vue";
import { buildApi } from "../../lib/api";
import type { WorkspaceDTO } from "symphony-kanban-shared";

const router = useRouter();
const api = buildApi(import.meta.env.VITE_API_BASE ?? "http://localhost:3001");

const workspaces = ref<WorkspaceDTO[]>([]);

const load = async () => {
  const res = await api.listWorkspaces();
  workspaces.value = res.data ?? [];
};

const createWorkspace = async () => {
  const name = window.prompt("工作区名称");
  if (!name) return;
  const localPath = window.prompt("本地路径 (可选)") ?? "";
  const context = window.prompt("上下文说明 (可选)") ?? "";
  await api.createWorkspace({
    name,
    localPath: localPath || null,
    context: context || null,
  });
  await load();
};

const goWorkspaceSettings = (id: string) => {
  router.push(`/workspaces/${id}`);
};

onMounted(() => {
  load();
});
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

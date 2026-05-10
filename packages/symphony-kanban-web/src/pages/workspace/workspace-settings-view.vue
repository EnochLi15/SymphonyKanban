<template>
  <AppShell>
    <div class="settings-content">
      <h1 class="page-title">工作区详情与配置: {{ form.name || "" }}</h1>

      <section class="settings-form">
        <div class="section-title">工作区名称</div>
        <el-input class="path-box" v-model="form.name" />

        <div class="section-title">工作区路径 (Local Path)</div>
        <el-input class="path-box" v-model="form.localPath" />

        <div class="section-title">全局规则注入 (Global Context &amp; Code Conventions)</div>
        <el-input class="context-box" type="textarea" :rows="8" v-model="form.context" />

        <div class="button-row">
          <el-button class="save-button" @click="save">保存配置</el-button>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, reactive } from "vue";
import { useRoute } from "vue-router";
import AppShell from "../../components/AppShell.vue";
import { buildApi } from "../../lib/api";

const route = useRoute();
const api = buildApi(import.meta.env.VITE_API_BASE ?? "http://localhost:3001");

const form = reactive({
  name: "",
  localPath: "",
  context: "",
});

const load = async () => {
  const res = await api.listWorkspaces();
  const list = res.data ?? [];
  const workspace = list.find((row: any) => row.id === route.params.id);
  if (!workspace) return;
  form.name = workspace.name ?? "";
  form.localPath = workspace.localPath ?? "";
  form.context = workspace.context ?? "";
};

const save = async () => {
  await api.updateWorkspace(route.params.id as string, {
    name: form.name,
    localPath: form.localPath || null,
    context: form.context || null,
  });
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
}

.path-box :deep(.el-input__wrapper) {
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  box-shadow: none;
}

.path-box :deep(.el-input__inner) {
  color: var(--kanban-text-secondary);
  font-size: 14px;
  font-family: "Space Grotesk", "Inter", "DM Sans", system-ui, -apple-system,
    sans-serif;
}

.context-box :deep(.el-textarea__inner) {
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  color: var(--kanban-text-secondary);
  line-height: 1.6;
  font-size: 15px;
  font-family: "Space Grotesk", "Inter", "DM Sans", system-ui, -apple-system,
    sans-serif;
  box-shadow: none;
}

.button-row {
  display: flex;
  gap: 16px;
}

.save-button {
  border-radius: 6px;
  padding: 12px 24px;
  background: var(--kanban-primary);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border: none;
}
</style>

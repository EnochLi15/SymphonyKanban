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
  gap: 18px;
  padding: 26px 28px;
  box-sizing: border-box;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
}

.section-title {
  color: var(--kanban-text-secondary);
  font-size: 13px;
  font-weight: 650;
}

.path-box :deep(.el-input__wrapper) {
  background: var(--kanban-surface);
  box-shadow: 0 0 0 1px var(--kanban-border) inset;
}

.path-box :deep(.el-input__inner) {
  color: var(--kanban-text-primary);
  font-size: 14px;
  font-family: "SF Mono", ui-monospace, Menlo, Consolas, monospace;
}

.context-box :deep(.el-textarea__inner) {
  background: var(--kanban-surface);
  color: var(--kanban-text-primary);
  line-height: 1.6;
  font-size: 15px;
  font-family: "SF Mono", ui-monospace, Menlo, Consolas, monospace;
  box-shadow: 0 0 0 1px var(--kanban-border) inset;
}

.button-row {
  display: flex;
  gap: 16px;
}

.save-button {
  border-radius: var(--kanban-radius-sm);
  padding: 10px 20px;
  background: var(--kanban-primary);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border: none;
}
</style>

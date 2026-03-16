<template>
  <AppShell>
    <div class="tag-content">
      <h1 class="page-title">标签与工作流配置 (Tag &amp; Workflow Configuration)</h1>

      <section class="config-panel">
        <aside class="tag-col">
          <div class="tag-col-title">管理标签 (Tags)</div>
          <el-button
            v-for="tag in tags"
            :key="tag.id"
            class="tag-item"
            :class="{ 'tag-item--active': tag.id === selectedTagId }"
            text
            @click="selectTag(tag.id)"
          >
            {{ tag.name }}
          </el-button>
          <el-button class="tag-item tag-item--add" text @click="createNewTag">
            + 新建标签
          </el-button>
        </aside>

        <div class="form-col">
          <div class="params-row">
            <div class="param-block">
              <div class="param-label">最大并发 (max_concurrent_agents)</div>
              <el-input-number
                v-model="settings.maxConcurrency"
                :min="1"
                :max="20"
                class="param-input"
              />
            </div>
            <div class="param-block">
              <div class="param-label">轮询间隔 (ms)</div>
              <el-input-number
                v-model="settings.pollIntervalMs"
                :min="1000"
                :step="500"
                class="param-input"
              />
            </div>
          </div>
          <div class="inline-actions">
            <el-button class="action-primary" @click="saveSettings">保存调度配置</el-button>
          </div>

          <div class="form-label">标签属性 (Tag)</div>
          <div class="tag-form">
            <el-input v-model="tagForm.name" placeholder="标签名称" />
            <el-input v-model="tagForm.type" placeholder="类型 (可选)" />
            <el-input v-model="tagForm.color" placeholder="颜色 (可选)" />
            <div class="inline-actions">
              <el-button class="action-primary" @click="saveTag">保存标签</el-button>
              <el-button class="action-muted" @click="deleteTag" :disabled="!selectedTagId">
                删除标签
              </el-button>
            </div>
          </div>

          <div class="form-label">工作流行为 (Workflow Behavior)</div>
          <div class="workflow-form">
            <el-select v-model="workflowForm.state" placeholder="状态">
              <el-option v-for="state in states" :key="state" :label="state" :value="state" />
            </el-select>
            <el-input v-model="workflowForm.behavior" placeholder="行为 (如 ci-required)" />
            <el-input
              v-model="workflowForm.configJson"
              type="textarea"
              :rows="4"
              placeholder="行为配置 JSON (可选)"
            />
            <div class="inline-actions">
              <el-button class="action-primary" @click="saveWorkflow">保存工作流规则</el-button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import AppShell from "../../components/AppShell.vue";
import { buildApi } from "../../lib/api";
import type { SchedulerSettingsDTO, TagDTO, WorkflowDefDTO } from "symphony-kanban-shared";

const api = buildApi(import.meta.env.VITE_API_BASE ?? "http://localhost:3001");

const tags = ref<TagDTO[]>([]);
const workflows = ref<WorkflowDefDTO[]>([]);
const selectedTagId = ref<string | null>(null);
const states = ["Backlog", "Todo", "InProgress", "Review", "Blocked", "Done"];

const settings = reactive<SchedulerSettingsDTO>({
  id: "",
  maxConcurrency: 3,
  pollIntervalMs: 5000,
  updatedAt: "",
});

const tagForm = reactive({
  name: "",
  type: "",
  color: "",
});

const workflowForm = reactive({
  state: "Todo",
  behavior: "",
  configJson: "",
});

const selectedWorkflow = computed(() =>
  workflows.value.find((workflow) => workflow.tagId === selectedTagId.value),
);

const loadAll = async () => {
  const [tagRes, workflowRes, settingsRes] = await Promise.all([
    api.listTags(),
    api.listWorkflows(),
    api.getSchedulerSettings(),
  ]);
  tags.value = tagRes.data ?? [];
  workflows.value = workflowRes.data ?? [];
  if (settingsRes.data) {
    settings.id = settingsRes.data.id;
    settings.maxConcurrency = settingsRes.data.maxConcurrency;
    settings.pollIntervalMs = settingsRes.data.pollIntervalMs;
    settings.updatedAt = settingsRes.data.updatedAt;
  }
  if (!selectedTagId.value && tags.value.length > 0) {
    selectTag(tags.value[0].id);
  }
};

const selectTag = (id: string) => {
  selectedTagId.value = id;
  const tag = tags.value.find((row) => row.id === id);
  tagForm.name = tag?.name ?? "";
  tagForm.type = tag?.type ?? "";
  tagForm.color = tag?.color ?? "";
  const workflow = workflows.value.find((row) => row.tagId === id);
  workflowForm.state = workflow?.state ?? "Todo";
  workflowForm.behavior = workflow?.behavior ?? "";
  workflowForm.configJson = workflow?.configJson ?? "";
};

const createNewTag = async () => {
  const name = window.prompt("请输入标签名称");
  if (!name) return;
  await api.createTag({ name });
  await loadAll();
};

const saveTag = async () => {
  if (!selectedTagId.value) return;
  await api.updateTag(selectedTagId.value, {
    name: tagForm.name,
    type: tagForm.type || null,
    color: tagForm.color || null,
  });
  await loadAll();
};

const deleteTag = async () => {
  if (!selectedTagId.value) return;
  await api.deleteTag(selectedTagId.value);
  selectedTagId.value = null;
  await loadAll();
};

const saveWorkflow = async () => {
  if (!selectedTagId.value) return;
  const payload = {
    tagId: selectedTagId.value,
    state: workflowForm.state,
    behavior: workflowForm.behavior,
    configJson: workflowForm.configJson || null,
  };
  if (selectedWorkflow.value?.id) {
    await api.updateWorkflow(selectedWorkflow.value.id, payload);
  } else {
    await api.createWorkflow(payload);
  }
  await loadAll();
};

const saveSettings = async () => {
  await api.updateSchedulerSettings({
    maxConcurrency: settings.maxConcurrency,
    pollIntervalMs: settings.pollIntervalMs,
  });
};

onMounted(() => {
  loadAll();
});
</script>

<style scoped>
.tag-content {
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

.config-panel {
  display: flex;
  gap: 24px;
  flex: 1;
  min-width: 0;
}

.tag-col {
  width: 200px;
  padding: 20px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}

.tag-col-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--kanban-text-secondary);
}

.tag-item {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--kanban-border);
  background: transparent;
  color: var(--kanban-text-secondary);
  font-size: 14px;
  font-weight: 400;
  text-align: left;
  justify-content: flex-start;
}

.tag-item--active {
  background: var(--kanban-primary);
  border-color: var(--kanban-primary);
  color: var(--kanban-text-primary);
  font-weight: 600;
}

.tag-item--add {
  border-color: var(--kanban-primary);
  color: var(--kanban-primary);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.form-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 8px;
  box-sizing: border-box;
  min-width: 0;
}

.params-row {
  display: flex;
  gap: 24px;
}

.param-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-label {
  font-size: 13px;
  font-weight: 600;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
}

.tag-form,
.workflow-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.inline-actions {
  display: flex;
  gap: 12px;
}

.action-primary {
  background: var(--kanban-primary);
  color: var(--kanban-text-primary);
  border: none;
}

.action-muted {
  background: var(--kanban-muted);
  border: 1px solid var(--kanban-border);
}
</style>

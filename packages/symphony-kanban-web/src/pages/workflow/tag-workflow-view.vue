<template>
  <AppShell>
    <div class="tag-content">
      <h1 class="page-title">
        标签与工作流配置 (Tag &amp; Workflow Configuration)
      </h1>

      <section class="config-panel">
        <aside class="tag-col">
          <div class="tag-col-title">管理标签 (Tags)</div>
          <el-button class="tag-item tag-item--add" text @click="createNewTag">
            + 新建标签
          </el-button>
          <div v-for="tag in tags" :key="tag.id">
            <el-button
              class="tag-item"
              :class="{ 'tag-item--active': tag.id === selectedTagId }"
              text
              @click="selectTag(tag.id)"
            >
              {{ tag.name }}
            </el-button>
          </div>
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
              <div class="param-label">迭代上限 (max_turns)</div>
              <el-input-number
                v-model="settings.pollIntervalMs"
                :min="1000"
                :step="500"
                class="param-input"
              />
            </div>
          </div>

          <div class="form-label">工作流定义 (Workflow Definition)</div>
          <el-input
            v-model="workflowForm.configJson"
            class="form-area"
            type="textarea"
            :rows="5"
          />

          <div class="form-label">规则 (Rules)</div>
          <el-input v-model="tagForm.rules" class="form-area" type="textarea" :rows="5" />

          <div class="form-label">验收标准 (Acceptance Criteria)</div>
          <el-input
            v-model="tagForm.acceptanceCriteria"
            class="form-area"
            type="textarea"
            :rows="5"
          />
        </div>

        <aside class="hooks-col">
          <div class="hooks-title">生命周期钩子 (Hooks)</div>
          <div class="hook-block">
            <div class="hook-label hook-label--success">after_create</div>
            <el-input
              v-model="hookForm.afterCreate"
              class="hook-area hook-area--success"
              type="textarea"
              :rows="6"
              placeholder="输入 after_create"
            />
          </div>
          <div class="hook-block">
            <div class="hook-label hook-label--danger">before_remove</div>
            <el-input
              v-model="hookForm.beforeRemove"
              class="hook-area hook-area--danger"
              type="textarea"
              :rows="6"
              placeholder="输入 before_remove"
            />
          </div>
          <div class="hooks-actions">
            <el-button
              class="hook-action hook-action--delete"
              @click="deleteTag"
              :disabled="!selectedTagId"
            >
              删除
            </el-button>
            <el-button class="hook-action hook-action--apply" @click="applyAll">
              应用并保存配置
            </el-button>
          </div>
        </aside>
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
  rules: "",
  acceptanceCriteria: "",
});

const workflowForm = reactive({
  state: "Todo",
  behavior: "",
  configJson: "",
});

const hookForm = reactive({
  afterCreate: "",
  beforeRemove: "",
});

const selectedWorkflow = computed(() =>
  workflows.value.find((workflow) => workflow.tagId === selectedTagId.value),
);

const syncHookFormFromConfig = () => {
  hookForm.afterCreate = "";
  hookForm.beforeRemove = "";
};

const syncConfigFromHookForm = () => {
  workflowForm.configJson = JSON.stringify({
    after_create: hookForm.afterCreate,
    before_remove: hookForm.beforeRemove,
  });
};

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
  tagForm.rules = tag?.rules ?? "";
  tagForm.acceptanceCriteria = tag?.acceptanceCriteria ?? "";
  const workflow = workflows.value.find((row) => row.tagId === id);
  workflowForm.state = workflow?.state ?? "Todo";
  workflowForm.behavior = workflow?.behavior ?? "";
  workflowForm.configJson = workflow?.configJson ?? "";
  syncHookFormFromConfig();
};

const createNewTag = async () => {
  const name = window.prompt("请输入标签名称");
  if (!name) return;
  await api.createTag({ name });
  await loadAll();
};

const persistTag = async () => {
  if (!selectedTagId.value) return;
  await api.updateTag(selectedTagId.value, {
    name: tagForm.name,
    type: tagForm.type || null,
    color: tagForm.color || null,
    rules: tagForm.rules || null,
    acceptanceCriteria: tagForm.acceptanceCriteria || null,
  });
};

const persistWorkflow = async () => {
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
};

const saveTag = async () => {
  await persistTag();
  await loadAll();
};

const deleteTag = async () => {
  if (!selectedTagId.value) return;
  await api.deleteTag(selectedTagId.value);
  selectedTagId.value = null;
  await loadAll();
};

const saveWorkflow = async () => {
  syncConfigFromHookForm();
  await persistWorkflow();
  await loadAll();
};

const saveSettings = async () => {
  await api.updateSchedulerSettings({
    maxConcurrency: settings.maxConcurrency,
    pollIntervalMs: settings.pollIntervalMs,
  });
};

const applyAll = async () => {
  if (!selectedTagId.value) return;
  syncConfigFromHookForm();
  await Promise.all([
    persistTag(),
    persistWorkflow(),
    api.updateSchedulerSettings({
      maxConcurrency: settings.maxConcurrency,
      pollIntervalMs: settings.pollIntervalMs,
    }),
  ]);
  await loadAll();
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

.param-input :deep(.el-input__wrapper) {
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  box-shadow: none;
}

.param-input :deep(.el-input__inner) {
  color: var(--kanban-text-primary);
  font-size: 14px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
}

.form-area :deep(.el-textarea__inner) {
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  color: var(--kanban-text-secondary);
  font-size: 14px;
  font-family: "Space Grotesk", "Inter", "DM Sans", system-ui, -apple-system,
    sans-serif;
  line-height: 1.5;
  box-shadow: none;
}

.hooks-col {
  width: 340px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hooks-title {
  font-size: 16px;
  font-weight: 700;
}

.hook-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hook-label {
  font-size: 13px;
  font-weight: 600;
}

.hook-label--success {
  color: var(--kanban-success);
}

.hook-label--danger {
  color: var(--kanban-error);
}

.hook-area :deep(.el-textarea__inner) {
  background: #0f1117;
  border-radius: 6px;
  font-size: 12px;
  font-family: "Fira Code", "Space Grotesk", monospace;
  line-height: 1.5;
  opacity: 0.9;
  border: 1px solid transparent;
  box-shadow: none;
  padding: 12px;
  min-height: 200px;
}

.hook-area--success :deep(.el-textarea__inner) {
  border-color: var(--kanban-success);
  color: var(--kanban-success);
}

.hook-area--danger :deep(.el-textarea__inner) {
  border-color: var(--kanban-error);
  color: var(--kanban-error);
  min-height: 120px;
}

.hooks-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.hook-action {
  border-radius: 6px;
  padding: 14px;
  font-size: 14px;
  font-weight: 700;
}

.hook-action--delete {
  width: 100px;
  border: 1px solid var(--kanban-error);
  color: var(--kanban-error);
  background: transparent;
}

.hook-action--apply {
  flex: 1;
  background: var(--kanban-primary);
  color: var(--kanban-text-primary);
  border: none;
}
</style>

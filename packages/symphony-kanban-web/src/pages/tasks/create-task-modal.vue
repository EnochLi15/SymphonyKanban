<template>
  <div class="modal-wrapper">
    <el-dialog
      v-model="visible"
      class="task-dialog"
      :show-close="false"
      align-center
      append-to-body="false"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-title">新建任务</div>
          <el-button class="dialog-close" text @click="visible = false">✕</el-button>
        </div>
      </template>

      <el-form ref="formRef" class="task-form" :model="form" :rules="rules">
        <div class="form-block">
          <el-form-item prop="workspaceId" label="工作区 (Workspace)">
            <el-select
              v-model="form.workspaceId"
              class="field-select"
              placeholder="选择工作区"
              filterable
            >
              <el-option
                v-for="workspace in workspaces"
                :key="workspace.id"
                :label="workspace.name"
                :value="workspace.id"
              />
            </el-select>
          </el-form-item>
        </div>

        <div class="form-block">
          <el-form-item prop="title" label="标题 (Title)">
            <el-input
              v-model="form.title"
              class="field-input"
              placeholder="例如：实现登录页面"
            />
          </el-form-item>
        </div>

        <div class="form-row">
          <div class="form-block">
            <el-form-item prop="priority" label="优先级 (Priority)">
              <el-select v-model="form.priority" class="field-select">
                <el-option
                  v-for="option in priorityOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </div>
          <div class="form-block">
            <el-form-item prop="tag" label="标签 (Tags)">
              <el-select
                v-model="form.tag"
                class="field-select"
                filterable
                allow-create
                default-first-option
                placeholder="输入或选择标签"
              >
                <el-option
                  v-for="tag in tagOptions"
                  :key="tag.id"
                  :label="tag.name"
                  :value="tag.name"
                />
              </el-select>
            </el-form-item>
          </div>
        </div>

        <div class="form-block">
          <el-form-item prop="description" label="描述 (Description)">
            <el-input
              v-model="form.description"
              class="field-textarea"
              type="textarea"
              :rows="4"
              placeholder="任务详细描述，支持 Markdown"
            />
          </el-form-item>
        </div>
      </el-form>

      <div class="schedule-row">
        <div class="schedule-label">启用定时触发 (Schedule Task)</div>
        <el-switch v-model="scheduleEnabled" class="schedule-switch" />
      </div>

      <div class="dialog-actions">
        <el-button class="action-button action-cancel" text @click="handleCancel">
          取消
        </el-button>
        <el-button
          class="action-button action-primary"
          :loading="submitting"
          @click="submitForm"
        >
          创建并规划 (Create &amp; Plan)
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";

const visible = ref(true);
const scheduleEnabled = ref(false);
const router = useRouter();
const submitting = ref(false);

const formRef = ref<FormInstance>();
const form = reactive({
  workspaceId: "",
  title: "",
  priority: 2,
  tag: "",
  description: "",
});

const rules: FormRules = {
  workspaceId: [
    { required: true, message: "请选择工作区", trigger: "change" },
  ],
  title: [{ required: true, message: "请输入标题", trigger: "blur" }],
  priority: [
    { required: true, message: "请选择优先级", trigger: "change" },
  ],
};

const priorityOptions = [
  { value: 0, label: "P0 (紧急且重要)" },
  { value: 1, label: "P1 (重要不紧急)" },
  { value: 2, label: "P2 (紧急但不重要)" },
  { value: 3, label: "P3 (可延后)" },
];

const workspaces = ref<Array<{ id: string; name: string }>>([]);
const tagOptions = ref<Array<{ id: string; name: string }>>([]);
const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

watch(visible, (value) => {
  if (!value) {
    router.back();
  }
});

const loadOptions = async () => {
  try {
    const [workspaceRes, tagRes] = await Promise.all([
      fetch(`${apiBase}/workspaces`),
      fetch(`${apiBase}/tags`),
    ]);
    if (workspaceRes.ok) {
      const workspaceJson = await workspaceRes.json();
      workspaces.value = workspaceJson.data ?? [];
      if (!form.workspaceId && workspaces.value.length > 0) {
        form.workspaceId = workspaces.value[0].id;
      }
    }
    if (tagRes.ok) {
      const tagJson = await tagRes.json();
      tagOptions.value = tagJson.data ?? [];
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to load options", error);
  }
};

const handleCancel = () => {
  visible.value = false;
};

const submitForm = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    const response = await fetch(`${apiBase}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        priority: form.priority,
        workspace_id: form.workspaceId,
        tags: form.tag ? [form.tag] : [],
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || "创建失败");
    }

    ElMessage.success("任务已创建并加入 Backlog");
    visible.value = false;
    router.push("/board");
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建失败";
    ElMessage.error(message);
  } finally {
    submitting.value = false;
  }
};

onMounted(loadOptions);
</script>

<style scoped>
.modal-wrapper {
  width: 100%;
  min-height: 900px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.67);
  font-family: "Inter", "DM Sans", "Space Grotesk", system-ui, -apple-system,
    sans-serif;
}

.task-dialog :deep(.el-dialog) {
  width: 600px;
  border-radius: 12px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.task-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 24px 24px 0;
}

.task-dialog :deep(.el-dialog__body) {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--kanban-text-primary);
}

.dialog-close {
  color: var(--kanban-text-secondary);
  font-size: 20px;
}

.form-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-form :deep(.el-form-item__label) {
  font-size: 14px;
  font-weight: 400;
  color: var(--kanban-text-primary);
}

.field-input :deep(.el-input__wrapper),
.field-select :deep(.el-input__wrapper),
.field-textarea :deep(.el-textarea__inner) {
  background: transparent;
  border: 1px solid var(--kanban-border);
  box-shadow: none;
}

.field-input :deep(.el-input__inner),
.field-select :deep(.el-input__inner),
.field-textarea :deep(.el-textarea__inner) {
  color: var(--kanban-text-secondary);
  font-size: 14px;
}

.field-select :deep(.el-input__inner) {
  color: var(--kanban-text-primary);
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-block {
  flex: 1;
}

.schedule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.schedule-label {
  font-size: 14px;
  color: var(--kanban-text-primary);
}

.schedule-switch :deep(.el-switch__core) {
  background: var(--kanban-muted);
  border-color: var(--kanban-muted);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.action-button {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
}

.action-cancel {
  color: var(--kanban-text-secondary);
}

.action-primary {
  background: var(--kanban-primary);
  color: #ffffff;
  border: none;
}
</style>

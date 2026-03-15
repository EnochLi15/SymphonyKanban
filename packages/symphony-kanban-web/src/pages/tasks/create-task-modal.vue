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

      <div class="form-block">
        <div class="field-label">工作区 (Workspace)</div>
        <el-select class="field-select" model-value="Symphony-Kanban">
          <el-option label="Symphony-Kanban" value="Symphony-Kanban" />
        </el-select>
      </div>

      <div class="form-block">
        <div class="field-label">标题 (Title)</div>
        <el-input class="field-input" model-value="例如：实现登录页面" />
      </div>

      <div class="form-row">
        <div class="form-block">
          <div class="field-label">优先级 (Priority)</div>
          <el-select class="field-select" model-value="P2 (紧急但不重要)">
            <el-option label="P2 (紧急但不重要)" value="P2 (紧急但不重要)" />
          </el-select>
        </div>
        <div class="form-block">
          <div class="field-label">标签 (Tags)</div>
          <el-select class="field-select" model-value="feature, frontend">
            <el-option label="feature, frontend" value="feature, frontend" />
          </el-select>
        </div>
      </div>

      <div class="form-block">
        <div class="field-label">描述 (Description)</div>
        <el-input
          class="field-textarea"
          type="textarea"
          :rows="4"
          model-value="任务详细描述，支持 Markdown"
        />
      </div>

      <div class="schedule-row">
        <div class="schedule-label">启用定时触发 (Schedule Task)</div>
        <el-switch v-model="scheduleEnabled" class="schedule-switch" />
      </div>

      <div class="dialog-actions">
        <el-button class="action-button action-cancel" text>取消</el-button>
        <el-button class="action-button action-primary">创建并规划 (Create &amp; Plan)</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";

const visible = ref(true);
const scheduleEnabled = ref(false);
const router = useRouter();

watch(visible, (value) => {
  if (!value) {
    router.back();
  }
});
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

.field-label {
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
  color: var(--kanban-text-primary);
  border: none;
}
</style>

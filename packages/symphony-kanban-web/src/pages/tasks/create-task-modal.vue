

<template>
  <div class="modal-backdrop">
    <div class="task-dialog">
      <header class="dialog-header">
        <div class="dialog-title">新建任务</div>
        <button class="dialog-close" type="button">✕</button>
      </header>

      <div class="form-block">
        <div class="field-label">工作区 (Workspace)</div>
        <div class="field-select">
          <span>Symphony-Kanban</span>
          <span class="chevron">▼</span>
        </div>
      </div>

      <div class="form-block">
        <div class="field-label">标题 (Title)</div>
        <div class="field-input">例如：实现登录页面</div>
      </div>

      <div class="form-row">
        <div class="form-block">
          <div class="field-label">优先级 (Priority)</div>
          <div class="field-select">
            <span>P2 (紧急但不重要)</span>
            <span class="chevron">▼</span>
          </div>
        </div>
        <div class="form-block">
          <div class="field-label">标签 (Tags)</div>
          <div class="field-select">
            <span>feature, frontend</span>
            <span class="chevron">▼</span>
          </div>
        </div>
      </div>

      <div class="form-block">
        <div class="field-label">描述 (Description)</div>
        <div class="field-textarea">任务详细描述，支持 Markdown</div>
      </div>

      <div class="schedule-row">
        <div class="schedule-label">启用定时触发 (Schedule Task)</div>
        <div class="toggle">
          <div class="toggle-thumb"></div>
        </div>
      </div>

      <div class="dialog-actions">
        <button class="action-button action-cancel" type="button">取消</button>
        <button class="action-button action-primary" type="button">
          创建并规划 (Create &amp; Plan)
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  width: 100%;
  min-height: 900px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.67);
  font-family: "Inter", "DM Sans", "Space Grotesk", system-ui, -apple-system, sans-serif;
}

.task-dialog {
  width: 600px;
  padding: 32px;
  border-radius: 12px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-sizing: border-box;
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
  background: transparent;
  border: none;
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

.field-input,
.field-select,
.field-textarea {
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--kanban-border);
  color: var(--kanban-text-secondary);
  font-size: 14px;
  background: transparent;
}

.field-select {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--kanban-text-primary);
}

.chevron {
  font-size: 12px;
  color: var(--kanban-text-secondary);
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-block {
  flex: 1;
}

.field-textarea {
  height: 120px;
  display: flex;
  align-items: flex-start;
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

.toggle {
  width: 40px;
  height: 20px;
  border-radius: 10px;
  background: var(--kanban-muted);
  padding: 2px;
  box-sizing: border-box;
}

.toggle-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
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
  border: none;
}

.action-cancel {
  background: transparent;
  color: var(--kanban-text-secondary);
}

.action-primary {
  background: var(--kanban-primary);
  color: var(--kanban-text-primary);
}
</style>

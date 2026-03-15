<template>
  <AppShell>
    <div class="tag-content">
      <h1 class="page-title">
        标签与工作流配置 (Tag &amp; Workflow Configuration)
      </h1>

      <section class="config-panel">
        <aside class="tag-col">
          <div class="tag-col-title">管理标签 (Tags)</div>
          <el-button class="tag-item tag-item--active" text>bug</el-button>
          <el-button class="tag-item" text>feature</el-button>
          <el-button class="tag-item tag-item--add" text>+ 新建标签</el-button>
        </aside>

        <div class="form-col">
          <div class="params-row">
            <div class="param-block">
              <div class="param-label">最大并发 (max_concurrent_agents)</div>
              <el-input class="param-input" model-value="10"  />
            </div>
            <div class="param-block">
              <div class="param-label">迭代上限 (max_turns)</div>
              <el-input class="param-input" model-value="20"  />
            </div>
          </div>

          <div class="form-label">工作流定义 (Workflow Definition)</div>
          <el-input
            class="form-area"
            type="textarea"
            :rows="5"
            model-value="- Todo: run agent\n- In Progress: code and test\n- Review: merge pr"
            
          />

          <div class="form-label">规则 (Rules)</div>
          <el-input
            class="form-area"
            type="textarea"
            :rows="5"
            model-value="1. 必须使用 TypeScript\n2. 禁止使用 any\n3. 函数必须包含 JSDoc"
            
          />

          <div class="form-label">验收标准 (Acceptance Criteria)</div>
          <el-input
            class="form-area"
            type="textarea"
            :rows="5"
            model-value="- 测试覆盖率 > 80%\n- CI 流程全绿\n- 完成代码自审"
            
          />
        </div>

        <aside class="hooks-col">
          <div class="hooks-title">生命周期钩子 (Hooks)</div>
          <div class="hook-block">
            <div class="hook-label hook-label--success">after_create</div>
            <div class="code-box code-box--success">
              git clone --depth 1 ...<br />
              if command -v mise ...<br />
              &nbsp;&nbsp;cd elixir &amp;&amp; mix deps.get<br />
              fi
            </div>
          </div>
          <div class="hook-block">
            <div class="hook-label hook-label--danger">before_remove</div>
            <div class="code-box code-box--danger">
              cd elixir &amp;&amp; mix workspace.before_remove
            </div>
          </div>
          <div class="hooks-actions">
            <el-button class="hook-action hook-action--delete">删除</el-button>
            <el-button class="hook-action hook-action--apply">
              应用并保存配置
            </el-button>
          </div>
        </aside>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from "../../components/AppShell.vue";
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

.code-box {
  padding: 12px;
  border-radius: 6px;
  background: #0f1117;
  font-size: 12px;
  font-family: "Fira Code", "Space Grotesk", monospace;
  line-height: 1.5;
  opacity: 0.9;
}

.code-box--success {
  border: 1px solid var(--kanban-success);
  color: var(--kanban-success);
  min-height: 200px;
}

.code-box--danger {
  border: 1px solid var(--kanban-error);
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

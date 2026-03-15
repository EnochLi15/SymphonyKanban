<template>
  <AppShell>
    <div class="settings-content">
      <h1 class="page-title">全局系统设置 (Global Settings)</h1>

      <section class="settings-form">
        <div class="section-title">MCP 服务集成 (MCP Integrations)</div>

        <el-card class="mcp-box">
          <div class="box-title">MCP 服务 JSON 配置 (mcp_config.json)</div>
          <pre class="code-editor">
{
  "mcp": {
    "kanban": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_***"
      }
    }
  }
}
          </pre>
          <div class="box-hint">
            💡 全局定义的 MCP 服务将在所有工作区中可用，系统将根据工具定义自动映射任务操作。
          </div>
        </el-card>

        <div class="button-row">
          <el-button class="save-button">保存全局设置</el-button>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from "../../components/AppShell.vue";
</script>

<style scoped>
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
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

.mcp-box {
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.mcp-box :deep(.el-card__body) {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.box-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--kanban-text-primary);
}

.code-editor {
  margin: 0;
  padding: 16px;
  border-radius: 6px;
  background: #0f1117;
  border: 1px solid var(--kanban-primary);
  color: var(--kanban-primary);
  font-size: 13px;
  font-family: "Fira Code", "DM Sans", monospace;
  line-height: 1.6;
  min-height: 240px;
  white-space: pre-wrap;
}

.box-hint {
  font-size: 12px;
  color: var(--kanban-text-secondary);
}

.button-row {
  display: flex;
  gap: 16px;
}

.save-button {
  border-radius: 6px;
  padding: 12px 32px;
  background: var(--kanban-primary);
  color: var(--kanban-text-primary);
  font-size: 14px;
  font-weight: 600;
  border: none;
}
</style>

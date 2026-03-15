

<template>
  <div class="global-settings-view">
    <aside class="sidebar">
      <div class="sidebar-title">Symphony 看板</div>
      <div class="sidebar-space"></div>
      <nav class="nav-menu">
        <el-button
          class="nav-item"
          text
          :class="{ 'nav-item--active': activeNav === 'workspaces' }"
          @click="activeNav = 'workspaces'"
        >
          工作区 (Workspaces)
        </el-button>
        <el-button
          class="nav-item"
          text
          :class="{ 'nav-item--active': activeNav === 'boards' }"
          @click="activeNav = 'boards'"
        >
          看板 (Boards)
        </el-button>
        <button class="nav-subitem nav-subitem--active" type="button">
          ↳ 最近一周
        </button>
        <el-button
          class="nav-item"
          text
          :class="{ 'nav-item--active': activeNav === 'tags' }"
          @click="activeNav = 'tags'"
        >
          标签与工作流 (Tags)
        </el-button>
        <el-button
          class="nav-item"
          text
          :class="{ 'nav-item--active': activeNav === 'settings' }"
          @click="activeNav = 'settings'"
        >
          设置 (Settings)
        </el-button>
      </nav>
      <div class="sidebar-spacer"></div>
      <div class="theme-toggle">
        <el-button-group class="theme-toggle-group">
          <el-button
            class="theme-option"
            :class="{ 'theme-option--active': theme === 'light' }"
            text
            @click="setTheme('light')"
          >
            日间
          </el-button>
          <el-button
            class="theme-option"
            :class="{ 'theme-option--active': theme === 'dark' }"
            text
            @click="setTheme('dark')"
          >
            夜间
          </el-button>
        </el-button-group>
      </div>
    </aside>

    <main class="settings-content">
      <h1 class="page-title">全局系统设置 (Global Settings)</h1>

      <section class="settings-form">
        <div class="section-title">MCP 服务集成 (MCP Integrations)</div>

        <div class="mcp-box">
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
        </div>

        <div class="button-row">
          <el-button class="save-button">保存全局设置</el-button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTheme } from "../../composables/useTheme";

const activeNav = ref<"workspaces" | "boards" | "tags" | "settings">("settings");
const { theme, setTheme } = useTheme();
</script>

<style scoped>
.global-settings-view {
  display: flex;
  min-height: 900px;
  width: 100%;
  background: var(--kanban-bg);
  color: var(--kanban-text-primary);
  font-family: "Inter", "DM Sans", "Space Grotesk", system-ui, -apple-system, sans-serif;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 240px;
  padding: 24px;
  background: var(--kanban-surface);
  border-right: 1px solid var(--kanban-border);
  box-sizing: border-box;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 700;
}

.sidebar-space {
  height: 24px;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  justify-content: flex-start;
  height: auto;
  border: 1px solid transparent;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--kanban-surface);
  color: var(--kanban-text-secondary);
  font-size: 14px;
  font-weight: 400;
}

.nav-item--active {
  background: transparent;
  border-color: var(--kanban-primary);
  color: var(--kanban-primary);
}

.nav-subitem {
  text-align: left;
  padding: 4px 12px 4px 24px;
  background: transparent;
  border: none;
  color: var(--kanban-primary);
  font-size: 13px;
  font-weight: 400;
}

.sidebar-spacer {
  flex: 1;
}

.theme-toggle {
  display: flex;
  gap: 8px;
  padding: 4px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.theme-toggle-group {
  display: flex;
  width: 100%;
}

.theme-option {
  flex: 1;
  padding: 8px 0;
  text-align: center;
  border-radius: 4px;
  color: var(--kanban-text-secondary);
  font-size: 12px;
  font-weight: 400;
}

.theme-option--active {
  background: var(--kanban-primary);
  color: var(--kanban-text-primary);
}

.settings-content {
  flex: 1;
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
  padding: 24px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
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



<template>
  <div class="tag-view">
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
        <button class="nav-subitem" type="button" @click="activeBoard = 'recent'">
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

    <main class="tag-content">
      <h1 class="page-title">
        标签与工作流配置 (Tag &amp; Workflow Configuration)
      </h1>

      <section class="config-panel">
        <aside class="tag-col">
          <div class="tag-col-title">管理标签 (Tags)</div>
          <button class="tag-item tag-item--active" type="button">bug</button>
          <button class="tag-item" type="button">feature</button>
          <button class="tag-item tag-item--add" type="button">
            + 新建标签
          </button>
        </aside>

        <div class="form-col">
          <div class="params-row">
            <div class="param-block">
              <div class="param-label">最大并发 (max_concurrent_agents)</div>
              <div class="param-input">10</div>
            </div>
            <div class="param-block">
              <div class="param-label">迭代上限 (max_turns)</div>
              <div class="param-input">20</div>
            </div>
          </div>

          <div class="form-label">工作流定义 (Workflow Definition)</div>
          <div class="form-area">
            - Todo: run agent
            <br />
            - In Progress: code and test
            <br />
            - Review: merge pr
          </div>

          <div class="form-label">规则 (Rules)</div>
          <div class="form-area">
            1. 必须使用 TypeScript
            <br />
            2. 禁止使用 any
            <br />
            3. 函数必须包含 JSDoc
          </div>

          <div class="form-label">验收标准 (Acceptance Criteria)</div>
          <div class="form-area">
            - 测试覆盖率 &gt; 80%
            <br />
            - CI 流程全绿
            <br />
            - 完成代码自审
          </div>
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
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTheme } from "../../composables/useTheme";

const activeNav = ref<"workspaces" | "boards" | "tags" | "settings">("tags");
const activeBoard = ref<"recent">("recent");
const { theme, setTheme } = useTheme();
</script>

<style scoped>
.tag-view {
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
  color: var(--kanban-text-secondary);
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

.tag-content {
  flex: 1;
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

.param-input {
  padding: 12px;
  border-radius: 6px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  font-size: 14px;
  color: var(--kanban-text-primary);
}

.form-label {
  font-size: 13px;
  font-weight: 600;
}

.form-area {
  padding: 12px;
  border-radius: 6px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  font-size: 14px;
  color: var(--kanban-text-secondary);
  font-family: "Space Grotesk", "Inter", "DM Sans", system-ui, -apple-system, sans-serif;
  line-height: 1.5;
  min-height: 120px;
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

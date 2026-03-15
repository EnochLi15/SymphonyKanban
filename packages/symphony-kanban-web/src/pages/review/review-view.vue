

<template>
  <div class="review-view">
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
        <button
          class="nav-subitem nav-subitem--active"
          type="button"
          @click="activeBoard = 'recent'"
        >
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

    <main class="review-content">
      <header class="review-header">
        <div class="header-left">
          <el-button class="back-button" text @click="goBack">← 返回</el-button>
          <h1 class="review-title">审核任务: User Profile UI</h1>
        </div>
        <div class="header-actions">
          <el-button class="action-button action-reject">
            驳回 (回到进行中)
          </el-button>
          <el-button class="action-button action-more">
            要求工作量证明
          </el-button>
          <el-button class="action-button action-accept">
            通过并标记完成
          </el-button>
        </div>
      </header>

      <section class="review-panels">
        <div class="panel-left">
          <div class="panel-title">工作量证明 (测试 / CI)</div>
          <div class="ci-box">
            <div class="ci-line ci-line--success">24个前端测试全部通过。</div>
            <div class="ci-line ci-line--success">包大小在限制内 (+12KB)。</div>
          </div>

          <div class="panel-title">Agent 总结</div>
          <div class="summary-box">
            <p class="summary-text">
              我已根据设计规范实现了 Profile UI，支持暗黑模式和响应式布局。
            </p>
          </div>
        </div>

        <div class="panel-right">
          <div class="panel-title">Diff 概览</div>
          <div class="diff-box">
            <div class="diff-line">export const UserProfile = () =&gt; {</div>
            <div class="diff-line diff-line--success">
              + return &lt;div className=&quot;profile-card&quot;&gt;...&lt;/div&gt;;
            </div>
            <div class="diff-line">}</div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTheme } from "../../composables/useTheme";

const activeNav = ref<"workspaces" | "boards" | "tags" | "settings">("boards");
const activeBoard = ref<"recent">("recent");
const { theme, setTheme } = useTheme();

const goBack = () => {
  // TODO: wire to router history
};
</script>

<style scoped>
.review-view {
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

.nav-subitem--active {
  color: var(--kanban-primary);
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

.review-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
}

.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  border: 1px solid var(--kanban-border);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--kanban-text-secondary);
}

.review-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 16px;
}

.action-button {
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--kanban-text-primary);
}

.action-reject {
  background: var(--kanban-error);
}

.action-more {
  background: var(--kanban-muted);
}

.action-accept {
  background: var(--kanban-success);
}

.review-panels {
  flex: 1;
  display: flex;
  gap: 24px;
  min-width: 0;
}

.panel-left,
.panel-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
}

.ci-box {
  padding: 16px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ci-line {
  font-size: 14px;
  font-weight: 400;
}

.ci-line--success {
  color: var(--kanban-success);
}

.summary-box {
  padding: 16px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.summary-text {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--kanban-text-secondary);
}

.diff-box {
  flex: 1;
  padding: 16px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  font-family: "Fira Code", "Space Grotesk", "Inter", monospace;
  color: var(--kanban-text-primary);
}

.diff-line--success {
  color: var(--kanban-success);
}
</style>

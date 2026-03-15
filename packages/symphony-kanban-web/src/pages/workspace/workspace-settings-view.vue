<template>
  <AppShell>
    <div class="settings-content">
      <h1 class="page-title">工作区详情与配置: Symphony-Kanban</h1>

      <section class="settings-form">
        <div class="section-title">工作区路径 (Local Path)</div>
        <el-input class="path-box" model-value="/Users/enoch/Workspace/SymphonyKanban" readonly />

        <div class="section-title">
          全局规则注入 (Global Context &amp; Code Conventions)
        </div>
        <el-input
          class="context-box"
          type="textarea"
          :rows="8"
          model-value="项目说明：Symphony Kanban 是一个 AI 驱动的研发管理工具。\n编码规范：\n1. 强制使用 TypeScript，禁用 any。\n2. React 组件使用 Functional Component 和 Hooks。\n3. CSS 使用 Tailwind V4 或标准 CSS Modules。\n4. 数据库使用 Prisma，修改 schema 后必须生成 migration。"
          readonly
        />

        <div class="button-row">
          <el-button class="save-button">保存配置</el-button>
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
  gap: 24px;
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

.path-box :deep(.el-input__wrapper) {
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  box-shadow: none;
}

.path-box :deep(.el-input__inner) {
  color: var(--kanban-text-secondary);
  font-size: 14px;
  font-family: "Space Grotesk", "Inter", "DM Sans", system-ui, -apple-system,
    sans-serif;
}

.context-box :deep(.el-textarea__inner) {
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  color: var(--kanban-text-secondary);
  line-height: 1.6;
  font-size: 15px;
  font-family: "Space Grotesk", "Inter", "DM Sans", system-ui, -apple-system,
    sans-serif;
  box-shadow: none;
}

.button-row {
  display: flex;
  gap: 16px;
}

.save-button {
  border-radius: 6px;
  padding: 12px 24px;
  background: var(--kanban-primary);
  color: var(--kanban-text-primary);
  font-size: 14px;
  font-weight: 600;
  border: none;
}
</style>

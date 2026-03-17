<template>
  <AppShell>
    <div class="settings-content">
      <h1 class="page-title">全局系统设置 (Global Settings)</h1>

      <section class="settings-form">
        <div class="section-title">技能中心 (Skills)</div>

        <el-card class="skills-box">
          <div class="box-title">Symphony Board CRUD</div>
          <p class="box-copy">
            Symphony Board CRUD 技能用于在看板中新增、查看、更新与删除任务（Issue），并通过现有 API/CLI 快速管理。
          </p>
          <ul class="skills-list">
            <li>新建任务（Issue）并自动记录事件</li>
            <li>查看所有任务与状态概览</li>
            <li>更新任务信息与流转状态</li>
            <li>删除/归档任务（遵循系统安全规则）</li>
          </ul>
          <a class="download-link" href="/skills/symphony-board-crud.zip" download>
            <el-button class="download-button" type="primary">下载技能包</el-button>
          </a>
          <div class="box-hint">
            已移除 MCP 相关内容，技能专注于看板任务管理。
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

.skills-box {
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.skills-box :deep(.el-card__body) {
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

.box-copy {
  margin: 0;
  color: var(--kanban-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.skills-list {
  margin: 0;
  padding-left: 18px;
  color: var(--kanban-text-primary);
  font-size: 13px;
  line-height: 1.6;
}

.download-link {
  text-decoration: none;
}

.box-hint {
  font-size: 12px;
  color: var(--kanban-text-secondary);
}

.download-button {
  border-radius: 6px;
  padding: 12px 32px;
  background: var(--kanban-primary);
  color: var(--kanban-text-primary);
  font-size: 14px;
  font-weight: 600;
  border: none;
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

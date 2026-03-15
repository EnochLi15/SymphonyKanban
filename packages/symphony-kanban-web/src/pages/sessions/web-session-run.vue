

<template>
  <AppShell>
    <div class="session-content">
      <header class="session-header">
        <el-button class="app-back-button" text @click="goBack">← 返回</el-button>
        <h1 class="session-title">会话运行监控: AUTH-102 (运行中...)</h1>
      </header>

      <section class="session-panels">
        <div class="iframe-placeholder"></div>
        <div class="embed-title">🔗 OpenCode Web 会话嵌入区域</div>
        <div class="embed-desc">
          变更文件、Diff 视图、近期日志等内容将通过 iframe 嵌入显示在此区域
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import AppShell from "../../components/AppShell.vue";

const goBack = () => {
  router.back();
};

const router = useRouter();
</script>

<style scoped>
.session-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
}

.session-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.session-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.session-panels {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.iframe-placeholder {
  flex: 1;
  min-height: 420px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  padding: 32px;
  box-sizing: border-box;
}

.embed-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--kanban-text-primary);
}

.embed-desc {
  font-size: 14px;
  font-weight: 400;
  color: var(--kanban-text-secondary);
}
</style>

<template>
  <AppShell>
    <div class="session-content">
      <header class="session-header">
        <el-button class="app-back-button" text @click="goBack">← 返回</el-button>
        <h1 class="session-title">会话运行监控: {{ review?.issue.title || "" }}</h1>
      </header>

      <section class="session-panels">
        <div class="panel">
          <div class="panel-title">日志 (Log)</div>
          <div class="panel-body">
            <pre class="panel-text">{{ logArtifact?.content || "暂无日志" }}</pre>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">Diff</div>
          <div class="panel-body">
            <pre class="panel-text">{{ diffArtifact?.content || "暂无 diff" }}</pre>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">测试结果</div>
          <div class="panel-body">
            <pre class="panel-text">{{ testArtifact?.content || "暂无测试" }}</pre>
          </div>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppShell from "../../components/AppShell.vue";
import { buildApi } from "../../lib/api";
import type { ReviewDTO } from "symphony-kanban-shared";

const route = useRoute();
const router = useRouter();
const api = buildApi(import.meta.env.VITE_API_BASE ?? "http://localhost:3001");

const review = ref<ReviewDTO | null>(null);

const load = async () => {
  const res = await api.getReview(route.params.id as string);
  review.value = res.data ?? null;
};

const logArtifact = computed(() =>
  review.value?.artifacts.find((artifact) => artifact.type === "log"),
);
const diffArtifact = computed(() =>
  review.value?.artifacts.find((artifact) => artifact.type === "diff"),
);
const testArtifact = computed(() =>
  review.value?.artifacts.find((artifact) => artifact.type === "test"),
);

const goBack = () => {
  router.back();
};

onMounted(() => {
  load();
});
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
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel {
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  padding: 16px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.panel-text {
  font-size: 13px;
  font-family: "Fira Code", "Space Grotesk", "Inter", monospace;
  white-space: pre-wrap;
  color: var(--kanban-text-secondary);
}
</style>

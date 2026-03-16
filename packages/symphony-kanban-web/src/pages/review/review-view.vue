<template>
  <AppShell>
    <div class="review-content">
      <header class="review-header">
        <div class="header-left">
          <el-button class="app-back-button" text @click="goBack">← 返回</el-button>
          <h1 class="review-title">审核任务: {{ review?.issue.title || "" }}</h1>
        </div>
        <div class="header-actions">
          <el-button class="action-button action-reject" @click="reject">驳回 (回到进行中)</el-button>
          <el-button class="action-button action-more" @click="requestEvidence">
            要求补充证据
          </el-button>
          <el-button class="action-button action-accept" @click="approve">
            通过并标记完成
          </el-button>
        </div>
      </header>

      <section class="review-panels">
        <div class="panel-left">
          <div class="panel-title">工作量证明 (测试 / CI)</div>
          <div class="ci-box">
            <div v-if="testArtifact" class="ci-line ci-line--success">
              {{ testArtifact.content || testArtifact.summary || "测试记录" }}
            </div>
            <div v-else class="ci-line">暂无测试证据</div>
          </div>

          <div class="panel-title">Agent 总结</div>
          <div class="summary-box">
            <p class="summary-text">{{ summaryArtifact?.content || summaryArtifact?.summary || "" }}</p>
          </div>
        </div>

        <div class="panel-right">
          <div class="panel-title">Diff 概览</div>
          <div class="diff-box">
            <div v-if="diffArtifact" class="diff-line">
              {{ diffArtifact.content || diffArtifact.summary || "" }}
            </div>
            <div v-else class="diff-line">暂无 diff</div>
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
import type { ExecutionArtifactDTO, ReviewDTO } from "symphony-kanban-shared";

const route = useRoute();
const router = useRouter();
const api = buildApi(import.meta.env.VITE_API_BASE ?? "http://localhost:3001");

const review = ref<ReviewDTO | null>(null);

const load = async () => {
  const res = await api.getReview(route.params.id as string);
  review.value = res.data ?? null;
};

const summaryArtifact = computed(() =>
  review.value?.artifacts.find((artifact) => artifact.type === "summary"),
);
const diffArtifact = computed(() =>
  review.value?.artifacts.find((artifact) => artifact.type === "diff"),
);
const testArtifact = computed(() =>
  review.value?.artifacts.find((artifact) => artifact.type === "test"),
);

const approve = async () => {
  if (!review.value) return;
  await api.transitionIssue(review.value.issue.id, "Done");
  router.push("/board");
};

const reject = async () => {
  if (!review.value) return;
  await api.transitionIssue(review.value.issue.id, "InProgress");
  router.push("/board");
};

const requestEvidence = async () => {
  if (!review.value) return;
  await api.transitionIssue(review.value.issue.id, "Blocked");
  router.push(`/errors/${review.value.issue.id}`);
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.review-content {
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

.diff-line {
  white-space: pre-wrap;
}
</style>

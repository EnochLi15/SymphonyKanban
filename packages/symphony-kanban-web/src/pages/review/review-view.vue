

<template>
  <AppShell>
    <div class="review-content">
      <header class="review-header">
        <div class="header-left">
          <el-button class="app-back-button" text @click="goBack">← 返回</el-button>
          <h1 class="review-title">审核任务: User Profile UI</h1>
        </div>
        <div class="header-actions">
          <el-button class="action-button action-reject" @click="goBack">
            驳回 (回到进行中)
          </el-button>
          <el-button class="action-button action-more" @click="goSessionView">
            要求工作量证明
          </el-button>
          <el-button class="action-button action-accept" @click="goBoardView">
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

const goBoardView = () => {
  router.push("/board/kanban-board-view");
};

const goSessionView = () => {
  router.push("/sessions/web-session-run");
};
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

.diff-line--success {
  color: var(--kanban-success);
}
</style>

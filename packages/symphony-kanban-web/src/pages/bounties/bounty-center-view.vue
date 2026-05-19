<template>
  <AppShell>
    <div class="planner-page">
      <header class="planner-header">
        <div class="planner-heading">
          <div class="eyebrow">Planner Console</div>
          <h1 class="planner-title">队列看护</h1>
          <div class="planner-subtitle">
            {{ runnerLabel }} · {{ openCount }} 个待接入 · {{ unreadCount }} 条未读通知
          </div>
        </div>
        <div class="planner-actions">
          <el-button class="action-button" :loading="loading" @click="load">
            重新载入
          </el-button>
          <el-button
            class="action-button action-primary"
            :loading="plannerRunning"
            @click="runPlanner"
          >
            运行规划
          </el-button>
        </div>
      </header>

      <section class="overview-grid" aria-label="planner overview">
        <div class="status-panel" :class="`status-panel--${plannerState.tone}`">
          <div class="status-topline">
            <span class="status-dot" aria-hidden="true"></span>
            <span>{{ plannerState.label }}</span>
          </div>
          <div class="status-title">{{ plannerState.title }}</div>
          <div class="status-detail">{{ plannerState.detail }}</div>
        </div>

        <div v-for="metric in metrics" :key="metric.label" class="metric-panel">
          <div class="metric-label">{{ metric.label }}</div>
          <div class="metric-value">{{ metric.value }}</div>
          <div class="metric-note">{{ metric.note }}</div>
        </div>
      </section>

      <section class="pipeline-band" aria-label="planner pipeline">
        <div
          v-for="step in pipeline"
          :key="step.label"
          class="pipeline-step"
          :class="{ 'pipeline-step--active': step.active }"
        >
          <div class="pipeline-index">{{ step.index }}</div>
          <div>
            <div class="pipeline-label">{{ step.label }}</div>
            <div class="pipeline-value">{{ step.value }}</div>
          </div>
        </div>
      </section>

      <section v-if="lastPlannerReport" class="report-band" aria-label="planner scan report">
        <div class="report-head">
          <div>
            <h2 class="panel-title">最近扫描报告</h2>
            <div class="panel-subtitle">{{ relativeTime(lastPlannerReport.generatedAt) }}</div>
          </div>
          <div class="report-next">{{ lastPlannerReport.recommendedNextStep }}</div>
        </div>

        <div class="report-metrics">
          <div class="report-metric">
            <span>洞察</span>
            <strong>{{ lastPlannerReport.summary.insights }}</strong>
          </div>
          <div class="report-metric">
            <span>队列风险</span>
            <strong>{{ lastPlannerReport.summary.queueRisks }}</strong>
          </div>
          <div class="report-metric">
            <span>检查任务</span>
            <strong>{{ lastPlannerReport.summary.inspectedIssues }}</strong>
          </div>
          <div class="report-metric">
            <span>创建动作</span>
            <strong>{{ lastPlannerReport.summary.createdActions }}</strong>
          </div>
          <div class="report-metric">
            <span>跳过动作</span>
            <strong>{{ lastPlannerReport.summary.skippedActions }}</strong>
          </div>
          <div class="report-metric">
            <span>无需动作</span>
            <strong>{{ lastPlannerReport.summary.noOpResults }}</strong>
          </div>
        </div>

        <div v-if="lastPlannerReport.queueRisks.length > 0" class="risk-list">
          <article
            v-for="risk in lastPlannerReport.queueRisks"
            :key="risk.type"
            class="risk-row"
            :class="`risk-row--${risk.severity}`"
          >
            <strong>{{ risk.title }}</strong>
            <span>{{ risk.message }}</span>
          </article>
        </div>

        <div class="report-grid">
          <article
            v-for="issue in lastPlannerReport.inspectedIssues"
            :key="issue.issueId"
            class="report-issue"
          >
            <div class="report-issue-head">
              <span>{{ issue.status }}</span>
              <strong>{{ issue.title }}</strong>
            </div>
            <div v-if="insightByIssueId.get(issue.issueId)" class="insight-row">
              <span>{{ insightByIssueId.get(issue.issueId)?.type }}</span>
              <p>{{ insightByIssueId.get(issue.issueId)?.reason }}</p>
            </div>
            <div class="rule-list">
              <div
                v-for="rule in issue.matchedRules"
                :key="`${issue.issueId}-${rule.ruleId}-${rule.outcome}`"
                class="rule-row"
                :class="`rule-row--${rule.outcome}`"
              >
                <span>{{ rule.label }}</span>
                <strong>{{ ruleOutcomeLabel(rule.outcome) }}</strong>
                <p>{{ rule.reason }}</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <main class="planner-grid">
        <section class="work-panel">
          <div class="panel-head">
            <div>
              <h2 class="panel-title">人类接入队列</h2>
              <div class="panel-subtitle">{{ filteredBounties.length }} / {{ bounties.length }}</div>
            </div>
            <el-radio-group v-model="statusFilter" size="small">
              <el-radio-button label="active">活动</el-radio-button>
              <el-radio-button label="submitted">待验收</el-radio-button>
              <el-radio-button label="accepted">记账</el-radio-button>
              <el-radio-button label="all">全部</el-radio-button>
            </el-radio-group>
          </div>

          <div v-if="loading" class="loading-stack">
            <div v-for="item in 3" :key="item" class="skeleton-row"></div>
          </div>

          <div v-else class="bounty-stack">
            <article
              v-for="bounty in filteredBounties"
              :key="bounty.id"
              class="bounty-item"
              :class="`bounty-item--${bounty.status}`"
            >
              <div class="bounty-rail">
                <span class="rail-dot" aria-hidden="true"></span>
                <span class="rail-line" aria-hidden="true"></span>
              </div>

              <div class="bounty-body">
                <div class="bounty-card-head">
                  <div class="bounty-main">
                    <div class="bounty-kicker">
                      <span>{{ statusLabel(bounty.status) }}</span>
                      <span>记账 {{ bounty.points }} 分</span>
                      <span>{{ relativeTime(bounty.createdAt) }}</span>
                    </div>
                    <h3 class="bounty-title">{{ bounty.title }}</h3>
                  </div>
                  <el-tag :type="statusType(bounty.status)" effect="plain">
                    {{ statusLabel(bounty.status) }}
                  </el-tag>
                </div>

                <p class="bounty-question">{{ bounty.question }}</p>

                <div class="bounty-context-grid">
                  <div class="context-block">
                    <div class="context-label">阻塞上下文</div>
                    <pre>{{ bounty.context || "无附加上下文" }}</pre>
                  </div>
                  <div class="context-block">
                    <div class="context-label">验收口径</div>
                    <p>{{ bounty.acceptanceCriteria }}</p>
                  </div>
                </div>

                <div v-if="bounty.response" class="response-block">
                  <div class="response-meta">
                    <span>{{ bounty.assigneeName || "未署名" }}</span>
                    <span v-if="bounty.submittedAt">{{ relativeTime(bounty.submittedAt) }}</span>
                  </div>
                  <div class="response-text">{{ bounty.response }}</div>
                </div>

                <div class="bounty-actions">
                  <el-button
                    v-if="bounty.status === 'open'"
                    class="action-button"
                    @click="openSubmitDialog(bounty)"
                  >
                    提交答案
                  </el-button>
                  <el-button
                    v-if="bounty.status === 'submitted'"
                    class="action-button action-primary"
                    :loading="acceptingId === bounty.id"
                    @click="accept(bounty)"
                  >
                    验收并记账
                  </el-button>
                  <el-button
                    v-if="bounty.status === 'open' || bounty.status === 'submitted'"
                    class="action-button"
                    text
                    :loading="cancelingId === bounty.id"
                    @click="cancel(bounty)"
                  >
                    取消
                  </el-button>
                  <el-button class="action-button" text @click="goIssue(bounty.issueId)">
                    查看任务
                  </el-button>
                </div>
              </div>
            </article>

            <el-empty
              v-if="filteredBounties.length === 0"
              description="没有匹配的人类接入请求"
            />
          </div>
        </section>

        <aside class="observability-panel">
          <section class="side-section agent-chat">
            <div class="side-head">
              <div>
                <h2 class="side-title">Planner 对话</h2>
                <div class="side-subtitle">上下文、规划、求助入口</div>
              </div>
              <span class="agent-badge">Agent</span>
            </div>

            <div ref="chatViewport" class="chat-thread" aria-live="polite">
              <article
                v-for="message in chatMessages"
                :key="message.id"
                class="chat-message"
                :class="`chat-message--${message.role}`"
              >
                <div class="chat-role">
                  {{ message.role === "user" ? "你" : "Planner" }}
                  <span>{{ relativeTime(message.createdAt) }}</span>
                </div>
                <div class="chat-bubble">{{ message.content }}</div>
              </article>
              <div v-if="chatMessages.length === 0" class="chat-empty">
                向 planner 提问，或让它运行一次规划扫描。
              </div>
            </div>

            <div class="quick-prompts">
              <el-button
                v-for="prompt in quickPrompts"
                :key="prompt"
                class="quick-prompt"
                text
                @click="sendQuickPrompt(prompt)"
              >
                {{ prompt }}
              </el-button>
            </div>

            <div class="chat-composer">
              <el-input
                v-model="chatDraft"
                type="textarea"
                :rows="3"
                placeholder="问 planner 当前风险、让它运行规划，或描述一个阻塞点..."
                @keydown.meta.enter.prevent="sendChat"
                @keydown.ctrl.enter.prevent="sendChat"
              />
              <el-button
                class="action-button action-primary chat-send"
                :loading="chatSending"
                @click="sendChat"
              >
                发送
              </el-button>
            </div>
          </section>

          <section class="side-section side-section--alerts">
            <div class="side-head">
              <div>
                <h2 class="side-title">通知</h2>
                <div class="side-subtitle">{{ criticalCount }} 条关键</div>
              </div>
            </div>
            <div class="notice-list">
              <article
                v-for="notice in sortedNotifications"
                :key="notice.id"
                class="notice-row"
                :class="[
                  `notice-row--${notice.severity}`,
                  { 'notice-row--read': notice.status === 'read' },
                ]"
              >
                <div class="notice-topline">
                  <span>{{ severityLabel(notice.severity) }}</span>
                  <span>{{ relativeTime(notice.createdAt) }}</span>
                </div>
                <div class="notice-title">{{ notice.title }}</div>
                <div class="notice-message">{{ notice.message }}</div>
                <el-button
                  v-if="notice.status === 'unread'"
                  class="inline-action"
                  text
                  @click="markRead(notice)"
                >
                  标记已读
                </el-button>
              </article>
              <div v-if="notifications.length === 0" class="empty-text">暂无通知</div>
            </div>
          </section>

          <section class="side-section">
            <div class="side-head">
              <div>
                <h2 class="side-title">积分账本</h2>
                <div class="side-subtitle">二级结算记录 · {{ contributors.length }} 人</div>
              </div>
              <strong class="side-total">{{ totalPoints }}</strong>
            </div>
            <div class="score-list">
              <div v-for="contributor in contributors" :key="contributor.name" class="score-row">
                <div>
                  <div class="score-name">{{ contributor.name }}</div>
                  <div class="score-note">{{ contributor.count }} 次结算</div>
                </div>
                <strong>+{{ contributor.points }}</strong>
              </div>
              <div v-if="contributors.length === 0" class="empty-text">暂无结算记录</div>
            </div>
          </section>

          <section class="side-section">
            <div class="side-head">
              <div>
                <h2 class="side-title">长期记忆</h2>
                <div class="side-subtitle">
                  {{ candidateMemories.length }} 条候选 · {{ approvedMemories.length }} 条已批准
                </div>
              </div>
            </div>
            <div class="memory-list">
              <article
                v-for="memory in sortedMemories"
                :key="memory.id"
                class="memory-row"
                :class="`memory-row--${memory.status}`"
              >
                <div class="memory-title">
                  <span>{{ memory.title }}</span>
                  <strong>{{ memoryStatusLabel(memory.status) }}</strong>
                </div>
                <div class="memory-content">{{ memory.content }}</div>
                <div class="confidence-track" aria-hidden="true">
                  <span :style="{ width: `${Math.round(memory.confidence * 100)}%` }"></span>
                </div>
                <div class="memory-actions">
                  <el-button
                    v-if="memory.status !== 'approved'"
                    class="inline-action"
                    text
                    @click="approveMemory(memory)"
                  >
                    批准
                  </el-button>
                  <el-button class="inline-action" text @click="editMemory(memory)">
                    编辑
                  </el-button>
                  <el-button
                    v-if="memory.status !== 'revoked'"
                    class="inline-action"
                    text
                    @click="revokeMemory(memory)"
                  >
                    撤销
                  </el-button>
                </div>
              </article>
              <div v-if="sortedMemories.length === 0" class="empty-text">暂无记忆</div>
            </div>
          </section>
        </aside>
      </main>
    </div>

    <el-dialog
      v-model="submitDialogVisible"
      class="bounty-dialog"
      :show-close="false"
      align-center
      append-to-body="false"
    >
      <template #header>
        <div class="dialog-header">
          <div>
            <div class="dialog-kicker">Human Handoff</div>
            <div class="dialog-title">提交最小答案</div>
          </div>
          <el-button class="dialog-close" text aria-label="关闭" @click="closeSubmitDialog">
            ×
          </el-button>
        </div>
      </template>

      <el-form class="bounty-form" :model="submission" label-position="top">
        <el-form-item label="姓名">
          <el-input v-model="submission.assigneeName" autocomplete="name" />
        </el-form-item>
        <el-form-item label="答案">
          <el-input v-model="submission.response" type="textarea" :rows="7" />
        </el-form-item>
      </el-form>

      <div class="dialog-actions">
        <el-button class="action-button action-cancel" text @click="closeSubmitDialog">
          取消
        </el-button>
        <el-button
          class="action-button action-primary"
          :loading="submitting"
          @click="submitAnswer"
        >
          提交
        </el-button>
      </div>
    </el-dialog>
  </AppShell>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import type {
  BountyStatus,
  BountyTaskDTO,
  PlannerChatMessageDTO,
  PlannerMemoryDTO,
  PlannerNotificationDTO,
  PlannerRuleOutcome,
  PlannerScanReportDTO,
  PointLedgerDTO,
} from "symphony-kanban-shared";
import AppShell from "../../components/AppShell.vue";
import { buildApi } from "../../lib/api";

type StatusFilter = "active" | "submitted" | "accepted" | "all";

const router = useRouter();
const api = buildApi(import.meta.env.VITE_API_BASE ?? "http://localhost:3001");

const runnerLabel = "tmux · claude-glm";
const bounties = ref<BountyTaskDTO[]>([]);
const notifications = ref<PlannerNotificationDTO[]>([]);
const memories = ref<PlannerMemoryDTO[]>([]);
const points = ref<PointLedgerDTO[]>([]);
const chatMessages = ref<PlannerChatMessageDTO[]>([]);
const lastPlannerReport = ref<PlannerScanReportDTO | null>(null);
const loading = ref(false);
const plannerRunning = ref(false);
const submitting = ref(false);
const chatSending = ref(false);
const acceptingId = ref<string | null>(null);
const cancelingId = ref<string | null>(null);
const submitDialogVisible = ref(false);
const selectedBounty = ref<BountyTaskDTO | null>(null);
const statusFilter = ref<StatusFilter>("active");
const chatViewport = ref<HTMLElement | null>(null);
const chatDraft = ref("");
const submission = reactive({
  assigneeName: "",
  response: "",
});
const quickPrompts = ["运行规划", "当前最大风险", "整理可复用记忆"];

const openCount = computed(
  () => bounties.value.filter((bounty) => bounty.status === "open").length,
);
const submittedCount = computed(
  () => bounties.value.filter((bounty) => bounty.status === "submitted").length,
);
const acceptedCount = computed(
  () => bounties.value.filter((bounty) => bounty.status === "accepted").length,
);
const unreadCount = computed(
  () => notifications.value.filter((notice) => notice.status === "unread").length,
);
const criticalCount = computed(
  () => notifications.value.filter((notice) => notice.severity === "critical").length,
);
const approvedMemories = computed(() =>
  memories.value.filter((memory) => memory.status === "approved"),
);
const candidateMemories = computed(() =>
  memories.value.filter((memory) => memory.status === "candidate"),
);
const sortedMemories = computed(() => {
  const rank = { candidate: 0, approved: 1, revoked: 2 };
  return [...memories.value].sort((left, right) => {
    const statusDiff = rank[left.status] - rank[right.status];
    if (statusDiff !== 0) return statusDiff;
    return Date.parse(right.createdAt) - Date.parse(left.createdAt);
  });
});
const totalPoints = computed(() =>
  points.value.reduce((total, point) => total + point.points, 0),
);
const insightByIssueId = computed(() => {
  const rows = new Map<string, PlannerScanReportDTO["insights"][number]>();
  for (const insight of lastPlannerReport.value?.insights ?? []) {
    rows.set(insight.issueId, insight);
  }
  return rows;
});

const plannerState = computed(() => {
  if (criticalCount.value > 0) {
    return {
      tone: "critical",
      label: "需要关注",
      title: "关键通知待处理",
      detail: `${criticalCount.value} 条关键事件正在等待确认`,
    };
  }
  if (submittedCount.value > 0) {
    return {
      tone: "warning",
      label: "等待验收",
      title: "人类答案已提交",
      detail: `${submittedCount.value} 条人类答案可以验收并沉淀记忆`,
    };
  }
  if (openCount.value > 0) {
    return {
      tone: "active",
      label: "接入中",
      title: "阻塞点等待人类接入",
      detail: `${openCount.value} 个最小恢复请求待回答`,
    };
  }
  return {
    tone: "healthy",
    label: "平稳",
    title: "没有待接入阻塞",
    detail: "规划、看护、记忆链路处于空闲状态",
  };
});

const metrics = computed(() => [
  {
    label: "接入请求",
    value: openCount.value + submittedCount.value,
    note: `${submittedCount.value} 个待验收`,
  },
  {
    label: "已结算",
    value: acceptedCount.value,
    note: `${totalPoints.value} 分进入账本`,
  },
  {
    label: "未读通知",
    value: unreadCount.value,
    note: `${criticalCount.value} 条关键`,
  },
  {
    label: "长期记忆",
    value: approvedMemories.value.length,
    note: "已批准上下文",
  },
]);

const pipeline = computed(() => [
  {
    index: "01",
    label: "规划",
    value: `${bounties.value.length} 条求助记录`,
    active: plannerRunning.value,
  },
  {
    index: "02",
    label: "tmux 看护",
    value: runnerLabel,
    active: openCount.value + submittedCount.value > 0,
  },
  {
    index: "03",
    label: "人类接入",
    value: `${openCount.value} 个待回答`,
    active: openCount.value > 0,
  },
  {
    index: "04",
    label: "记忆",
    value: `${approvedMemories.value.length} 条沉淀`,
    active: acceptedCount.value > 0,
  },
]);

const filteredBounties = computed(() => {
  const rows = [...bounties.value].sort((left, right) => {
    const rank = { submitted: 0, open: 1, accepted: 2, canceled: 3 };
    const statusDiff = rank[left.status] - rank[right.status];
    if (statusDiff !== 0) return statusDiff;
    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  });
  if (statusFilter.value === "active") {
    return rows.filter((bounty) => bounty.status === "open" || bounty.status === "submitted");
  }
  if (statusFilter.value === "all") return rows;
  return rows.filter((bounty) => bounty.status === statusFilter.value);
});

const sortedNotifications = computed(() => {
  const severityRank = { critical: 0, warning: 1, info: 2 };
  const statusRank = { unread: 0, read: 1 };
  return [...notifications.value].sort((left, right) => {
    const statusDiff = statusRank[left.status] - statusRank[right.status];
    if (statusDiff !== 0) return statusDiff;
    const severityDiff = severityRank[left.severity] - severityRank[right.severity];
    if (severityDiff !== 0) return severityDiff;
    return Date.parse(right.createdAt) - Date.parse(left.createdAt);
  });
});

const contributors = computed(() => {
  const rows = new Map<string, { name: string; points: number; count: number }>();
  for (const point of points.value) {
    const current = rows.get(point.contributor) ?? {
      name: point.contributor,
      points: 0,
      count: 0,
    };
    current.points += point.points;
    current.count += 1;
    rows.set(point.contributor, current);
  }
  return [...rows.values()].sort((left, right) => right.points - left.points);
});

const load = async () => {
  loading.value = true;
  try {
    const [bountyRes, notificationRes, memoryRes, pointRes, chatRes] = await Promise.all([
      api.listBounties(),
      api.listPlannerNotifications(),
      api.listPlannerMemories(),
      api.listPointLedger(),
      api.listPlannerChatMessages(),
    ]);
    bounties.value = bountyRes.data ?? [];
    notifications.value = notificationRes.data ?? [];
    memories.value = memoryRes.data ?? [];
    points.value = pointRes.data ?? [];
    chatMessages.value = chatRes.data ?? [];
  } catch (error) {
    ElMessage.error("加载规划控制台失败");
  } finally {
    loading.value = false;
  }
};

const runPlanner = async () => {
  plannerRunning.value = true;
  try {
    const response = await api.runPlannerCycle();
    lastPlannerReport.value = response.data ?? null;
    await load();
    ElMessage.success(
      `规划已运行：创建 ${lastPlannerReport.value?.summary.createdActions ?? 0} 个动作`,
    );
  } catch (error) {
    ElMessage.error("运行规划失败");
  } finally {
    plannerRunning.value = false;
  }
};

const sendChat = async () => {
  const message = chatDraft.value.trim();
  if (!message) return;
  chatSending.value = true;
  try {
    const response = await api.sendPlannerChatMessage(message);
    chatDraft.value = "";
    chatMessages.value = response.data?.history ?? [
      ...chatMessages.value,
      ...(response.data?.messages ?? []),
    ];
    await load();
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "发送失败";
    ElMessage.error(message);
  } finally {
    chatSending.value = false;
  }
};

const sendQuickPrompt = async (prompt: string) => {
  chatDraft.value = prompt;
  await sendChat();
};

const openSubmitDialog = (bounty: BountyTaskDTO) => {
  selectedBounty.value = bounty;
  submission.assigneeName = "";
  submission.response = "";
  submitDialogVisible.value = true;
};

const closeSubmitDialog = () => {
  submitDialogVisible.value = false;
  selectedBounty.value = null;
};

const submitAnswer = async () => {
  if (!selectedBounty.value) return;
  if (!submission.assigneeName.trim() || !submission.response.trim()) {
    ElMessage.error("请填写姓名和答案");
    return;
  }
  submitting.value = true;
  try {
    await api.submitBounty(selectedBounty.value.id, {
      assigneeName: submission.assigneeName.trim(),
      response: submission.response.trim(),
    });
    closeSubmitDialog();
    await load();
    ElMessage.success("已提交");
  } catch (error) {
    ElMessage.error("提交失败");
  } finally {
    submitting.value = false;
  }
};

const accept = async (bounty: BountyTaskDTO) => {
  let recoveryAction: "retry" | "keep_blocked" = "keep_blocked";
  try {
    await ElMessageBox.confirm(
      "验收后可以把答案写回任务描述并重试，也可以只记录证据并保持阻塞。",
      "验收人类答案",
      {
        confirmButtonText: "写回并重试",
        cancelButtonText: "保持阻塞",
        distinguishCancelAndClose: true,
        type: "info",
      },
    );
    recoveryAction = "retry";
  } catch (action) {
    if (action !== "cancel") return;
  }

  acceptingId.value = bounty.id;
  try {
    await api.acceptBounty(bounty.id, {
      recoveryAction,
      applyToContext: recoveryAction === "retry",
    });
    await load();
    ElMessage.success("已验收并记忆");
  } catch (error) {
    ElMessage.error("验收失败");
  } finally {
    acceptingId.value = null;
  }
};

const cancel = async (bounty: BountyTaskDTO) => {
  try {
    await ElMessageBox.confirm("取消后这条人类接入请求会从活动队列移除。", "取消接入请求", {
      confirmButtonText: "取消请求",
      cancelButtonText: "保留",
      type: "warning",
    });
  } catch (error) {
    return;
  }
  cancelingId.value = bounty.id;
  try {
    await api.cancelBounty(bounty.id);
    await load();
    ElMessage.success("已取消");
  } catch (error) {
    ElMessage.error("取消失败");
  } finally {
    cancelingId.value = null;
  }
};

const markRead = async (notice: PlannerNotificationDTO) => {
  try {
    await api.markPlannerNotificationRead(notice.id);
    await load();
  } catch (error) {
    ElMessage.error("更新通知失败");
  }
};

const approveMemory = async (memory: PlannerMemoryDTO) => {
  try {
    await api.updatePlannerMemory(memory.id, { status: "approved" });
    await load();
  } catch (error) {
    ElMessage.error("批准记忆失败");
  }
};

const revokeMemory = async (memory: PlannerMemoryDTO) => {
  try {
    await api.updatePlannerMemory(memory.id, { status: "revoked" });
    await load();
  } catch (error) {
    ElMessage.error("撤销记忆失败");
  }
};

const editMemory = async (memory: PlannerMemoryDTO) => {
  try {
    const result = await ElMessageBox.prompt("编辑记忆内容", "编辑记忆", {
      inputValue: memory.content,
      inputType: "textarea",
      confirmButtonText: "保存",
      cancelButtonText: "取消",
    });
    await api.updatePlannerMemory(memory.id, {
      content: String(result.value ?? memory.content),
    });
    await load();
  } catch (error) {
    if (error !== "cancel") ElMessage.error("编辑记忆失败");
  }
};

const goIssue = (id: string) => {
  router.push(`/issues/${id}`);
};

const relativeTime = (value: string) => {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "";
  const diffMs = Date.now() - timestamp;
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
};

const statusLabel = (status: BountyStatus) =>
  ({
    open: "待接入",
    submitted: "待验收",
    accepted: "已结算",
    canceled: "已取消",
  })[status];

const statusType = (status: BountyStatus) =>
  ({
    open: "warning",
    submitted: "primary",
    accepted: "success",
    canceled: "info",
  })[status] as "warning" | "primary" | "success" | "info";

const severityLabel = (severity: PlannerNotificationDTO["severity"]) =>
  ({
    info: "信息",
    warning: "风险",
    critical: "关键",
  })[severity];

const memoryStatusLabel = (status: PlannerMemoryDTO["status"]) =>
  ({
    candidate: "候选",
    approved: "已批准",
    revoked: "已撤销",
  })[status];

const ruleOutcomeLabel = (outcome: PlannerRuleOutcome) =>
  ({
    created: "已创建",
    skipped: "已跳过",
    no_action: "无需动作",
  })[outcome];

onMounted(load);
</script>

<style scoped>
.planner-page {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 18px;
  padding: 26px;
  overflow: auto;
}

.planner-header,
.planner-actions,
.status-topline,
.bounty-card-head,
.bounty-actions,
.panel-head,
.side-head,
.notice-topline,
.response-meta,
.score-row,
.report-head,
.report-issue-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.planner-header,
.panel-head,
.side-head,
.bounty-card-head,
.score-row,
.report-head {
  justify-content: space-between;
}

.planner-heading {
  min-width: 0;
}

.eyebrow,
.dialog-kicker {
  color: var(--kanban-primary);
  font-size: 12px;
  font-weight: 760;
  letter-spacing: 0;
  text-transform: uppercase;
}

.planner-title {
  margin: 2px 0 0;
  font-size: 28px;
  font-weight: 760;
  letter-spacing: 0;
}

.planner-subtitle,
.panel-subtitle,
.side-subtitle,
.metric-note,
.pipeline-value,
.bounty-kicker,
.notice-topline,
.score-note,
.empty-text {
  color: var(--kanban-text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(240px, 1.4fr) repeat(4, minmax(128px, 1fr));
  gap: 12px;
}

.status-panel,
.metric-panel,
.pipeline-step,
.report-band,
.work-panel,
.side-section {
  border: 1px solid var(--kanban-border);
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-surface);
  box-shadow: var(--kanban-shadow-sm);
}

.status-panel {
  padding: 16px;
  background:
    linear-gradient(135deg, var(--status-tint), transparent 64%),
    var(--kanban-surface);
}

.status-panel--healthy {
  --status-tint: var(--kanban-success-soft);
  --status-color: var(--kanban-success);
}

.status-panel--active {
  --status-tint: var(--kanban-primary-soft);
  --status-color: var(--kanban-primary);
}

.status-panel--warning {
  --status-tint: var(--kanban-warning-soft);
  --status-color: var(--kanban-warning);
}

.status-panel--critical {
  --status-tint: var(--kanban-error-soft);
  --status-color: var(--kanban-error);
}

.status-topline {
  color: var(--status-color);
  font-size: 12px;
  font-weight: 720;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--status-color);
  box-shadow: 0 0 0 4px var(--status-tint);
}

.status-title {
  margin-top: 14px;
  font-size: 18px;
  font-weight: 760;
}

.status-detail {
  margin-top: 6px;
  color: var(--kanban-text-secondary);
  font-size: 13px;
}

.metric-panel {
  min-height: 110px;
  padding: 14px;
}

.metric-label {
  color: var(--kanban-text-secondary);
  font-size: 12px;
  font-weight: 650;
}

.metric-value {
  margin-top: 12px;
  font-size: 28px;
  font-variant-numeric: tabular-nums;
  font-weight: 760;
}

.pipeline-band {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.pipeline-step {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 12px;
  color: var(--kanban-text-secondary);
}

.pipeline-step--active {
  border-color: color-mix(in srgb, var(--kanban-primary) 36%, var(--kanban-border));
  background: var(--kanban-primary-soft);
  color: var(--kanban-text-primary);
}

.pipeline-index {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid var(--kanban-border);
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-surface);
  color: var(--kanban-primary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  font-weight: 760;
}

.pipeline-label {
  font-size: 13px;
  font-weight: 760;
}

.report-band {
  padding: 14px;
}

.report-next {
  max-width: 520px;
  color: var(--kanban-text-secondary);
  font-size: 13px;
  line-height: 1.45;
  text-align: right;
}

.report-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.report-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  padding: 10px 12px;
  border: 1px solid var(--kanban-border);
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-surface-muted);
  color: var(--kanban-text-secondary);
  font-size: 12px;
}

.report-metric strong {
  color: var(--kanban-text-primary);
  font-size: 20px;
  font-variant-numeric: tabular-nums;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.risk-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.risk-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--kanban-border);
  border-left: 3px solid var(--kanban-primary);
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-surface-muted);
}

.risk-row--warning {
  border-left-color: var(--kanban-warning);
}

.risk-row--critical {
  border-left-color: var(--kanban-error);
}

.risk-row strong {
  font-size: 13px;
}

.risk-row span {
  color: var(--kanban-text-secondary);
  font-size: 12px;
  line-height: 1.45;
  text-align: right;
}

.report-issue {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--kanban-border);
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-surface);
}

.report-issue-head {
  align-items: flex-start;
}

.report-issue-head span {
  flex: 0 0 auto;
  padding: 3px 7px;
  border: 1px solid var(--kanban-border);
  border-radius: var(--kanban-radius-sm);
  color: var(--kanban-text-secondary);
  font-size: 11px;
  font-weight: 720;
}

.report-issue-head strong {
  min-width: 0;
  font-size: 13px;
  line-height: 1.35;
}

.insight-row {
  margin-top: 10px;
  padding: 9px;
  border: 1px solid var(--kanban-border);
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-primary-soft);
}

.insight-row span {
  display: block;
  color: var(--kanban-primary);
  font-size: 11px;
  font-weight: 760;
}

.insight-row p {
  margin: 5px 0 0;
  color: var(--kanban-text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.rule-list {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.rule-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 5px 8px;
  padding: 9px;
  border-left: 3px solid var(--kanban-muted);
  background: var(--kanban-surface-muted);
}

.rule-row--created {
  border-left-color: var(--kanban-success);
}

.rule-row--skipped {
  border-left-color: var(--kanban-warning);
}

.rule-row--no_action {
  border-left-color: var(--kanban-primary);
}

.rule-row span,
.rule-row strong {
  font-size: 12px;
}

.rule-row p {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--kanban-text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.planner-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  align-items: start;
}

.work-panel,
.side-section {
  padding: 14px;
}

.panel-title,
.side-title {
  margin: 0;
  font-size: 16px;
  font-weight: 760;
  letter-spacing: 0;
}

.bounty-stack,
.loading-stack,
.observability-panel,
.notice-list,
.score-list,
.memory-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bounty-stack,
.loading-stack {
  margin-top: 14px;
}

.bounty-item {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 10px;
}

.bounty-rail {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding-top: 18px;
}

.rail-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--bounty-color);
  box-shadow: 0 0 0 4px var(--bounty-tint);
}

.rail-line {
  width: 1px;
  flex: 1;
  min-height: 36px;
  margin-top: 8px;
  background: var(--kanban-border);
}

.bounty-item--open {
  --bounty-color: var(--kanban-warning);
  --bounty-tint: var(--kanban-warning-soft);
}

.bounty-item--submitted {
  --bounty-color: var(--kanban-primary);
  --bounty-tint: var(--kanban-primary-soft);
}

.bounty-item--accepted {
  --bounty-color: var(--kanban-success);
  --bounty-tint: var(--kanban-success-soft);
}

.bounty-item--canceled {
  --bounty-color: var(--kanban-muted);
  --bounty-tint: var(--kanban-surface-muted);
}

.bounty-body {
  padding: 14px;
  border: 1px solid var(--kanban-border);
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-surface-raised);
}

.bounty-main {
  min-width: 0;
}

.bounty-kicker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bounty-title {
  margin: 5px 0 0;
  font-size: 16px;
  font-weight: 760;
  line-height: 1.35;
}

.bounty-question {
  margin: 12px 0;
  color: var(--kanban-text-primary);
  font-size: 14px;
  line-height: 1.6;
}

.bounty-context-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr);
  gap: 10px;
}

.context-block,
.response-block {
  padding: 10px;
  border: 1px solid var(--kanban-border);
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-surface-muted);
}

.context-label {
  margin-bottom: 6px;
  color: var(--kanban-text-primary);
  font-size: 12px;
  font-weight: 720;
}

.context-block pre,
.context-block p {
  max-height: 154px;
  margin: 0;
  overflow: auto;
  color: var(--kanban-text-secondary);
  font-family: inherit;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
}

.response-block {
  margin-top: 10px;
  background: color-mix(in srgb, var(--kanban-primary-soft) 48%, var(--kanban-surface));
}

.response-meta {
  justify-content: space-between;
  color: var(--kanban-text-primary);
  font-size: 12px;
  font-weight: 720;
}

.response-text,
.memory-content {
  margin-top: 6px;
  color: var(--kanban-text-secondary);
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
}

.bounty-actions {
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 12px;
}

.observability-panel {
  gap: 12px;
}

.side-total {
  color: var(--kanban-success);
  font-size: 22px;
  font-variant-numeric: tabular-nums;
}

.agent-chat {
  position: sticky;
  top: 0;
  z-index: 1;
}

.agent-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--kanban-primary) 30%, var(--kanban-border));
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-primary-soft);
  color: var(--kanban-primary);
  font-size: 12px;
  font-weight: 760;
}

.chat-thread {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 360px;
  margin-top: 12px;
  padding: 10px;
  overflow: auto;
  border: 1px solid var(--kanban-border);
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-surface-muted);
}

.chat-message {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.chat-message--user {
  align-items: flex-end;
}

.chat-message--assistant {
  align-items: flex-start;
}

.chat-role {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--kanban-text-secondary);
  font-size: 11px;
  font-weight: 650;
}

.chat-role span {
  color: var(--kanban-muted);
  font-weight: 500;
}

.chat-bubble {
  max-width: 92%;
  padding: 9px 10px;
  border: 1px solid var(--kanban-border);
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-surface);
  color: var(--kanban-text-primary);
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
}

.chat-message--user .chat-bubble {
  border-color: color-mix(in srgb, var(--kanban-primary) 34%, var(--kanban-border));
  background: var(--kanban-primary-soft);
}

.chat-empty {
  padding: 18px 8px;
  color: var(--kanban-text-secondary);
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.quick-prompt {
  min-height: 32px;
  padding: 0 9px;
  border: 1px solid var(--kanban-border);
  background: var(--kanban-surface);
}

.chat-composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: end;
  margin-top: 10px;
}

.chat-send {
  min-height: 44px;
}

.notice-row,
.memory-row {
  padding: 10px;
  border: 1px solid var(--kanban-border);
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-surface-muted);
}

.memory-row--candidate {
  border-color: color-mix(in srgb, var(--kanban-warning) 34%, var(--kanban-border));
  background: var(--kanban-warning-soft);
}

.memory-row--approved {
  border-color: color-mix(in srgb, var(--kanban-success) 34%, var(--kanban-border));
}

.memory-row--revoked {
  opacity: 0.62;
}

.notice-row--critical {
  border-color: color-mix(in srgb, var(--kanban-error) 30%, var(--kanban-border));
  background: var(--kanban-error-soft);
}

.notice-row--warning {
  border-color: color-mix(in srgb, var(--kanban-warning) 34%, var(--kanban-border));
  background: var(--kanban-warning-soft);
}

.notice-row--read {
  opacity: 0.72;
}

.notice-topline {
  justify-content: space-between;
}

.notice-title,
.memory-title,
.score-name {
  margin-top: 4px;
  color: var(--kanban-text-primary);
  font-size: 13px;
  font-weight: 720;
}

.memory-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.memory-title strong {
  flex: 0 0 auto;
  color: var(--kanban-text-secondary);
  font-size: 11px;
}

.notice-message {
  margin-top: 5px;
  color: var(--kanban-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.inline-action {
  min-height: 32px;
  margin-top: 4px;
  padding: 0;
}

.memory-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.score-row {
  padding: 9px 0;
  border-top: 1px solid var(--kanban-border);
}

.score-row:first-child {
  border-top: 0;
}

.score-row strong {
  color: var(--kanban-success);
  font-variant-numeric: tabular-nums;
}

.confidence-track {
  height: 5px;
  margin-top: 10px;
  overflow: hidden;
  border-radius: 99px;
  background: var(--kanban-border);
}

.confidence-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--kanban-success);
}

.skeleton-row {
  height: 150px;
  border-radius: var(--kanban-radius-sm);
  background:
    linear-gradient(90deg, transparent, var(--kanban-surface-raised), transparent),
    var(--kanban-surface-muted);
  background-size: 240px 100%, 100% 100%;
  animation: skeleton-slide 1.3s ease-in-out infinite;
}

.dialog-header,
.dialog-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dialog-title {
  color: var(--kanban-text-primary);
  font-size: 18px;
  font-weight: 760;
}

.dialog-close {
  min-width: 44px;
  min-height: 44px;
  font-size: 18px;
}

.dialog-actions {
  justify-content: flex-end;
}

@keyframes skeleton-slide {
  from {
    background-position: -240px 0, 0 0;
  }
  to {
    background-position: calc(100% + 240px) 0, 0 0;
  }
}

@media (max-width: 1180px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .status-panel {
    grid-column: 1 / -1;
  }

  .planner-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .planner-page {
    padding: 18px;
  }

  .planner-header,
  .panel-head {
    align-items: stretch;
    flex-direction: column;
  }

  .planner-actions {
    width: 100%;
  }

  .planner-actions .el-button {
    flex: 1;
  }

  .overview-grid,
  .pipeline-band,
  .report-metrics,
  .report-grid,
  .bounty-context-grid {
    grid-template-columns: 1fr;
  }

  .report-head {
    align-items: stretch;
    flex-direction: column;
  }

  .report-next {
    max-width: none;
    text-align: left;
  }

  .risk-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .risk-row span {
    text-align: left;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-row {
    animation: none;
  }
}
</style>

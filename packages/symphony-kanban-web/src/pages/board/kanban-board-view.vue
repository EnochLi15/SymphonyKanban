<template>
  <AppShell>
    <div class="main-content">
      <header class="board-header">
        <div class="board-title">
          最近一周
          <el-tooltip placement="right" effect="dark">
            <template #content>
              <div class="hint-popover">
                <div>1. 侧边栏导航：点击【工作区】去配置运行路径和全局参数，点击【标签】去设定工作流引擎。</div>
                <div>2. 卡片流转：卡片拖入【待办(Todo)】后将自动触发执行，执行中可点击跳至【Web 会话监控视图】查看实时日志。</div>
                <div>3. 标签跳转：直接点击卡片上的【P0 紧急】等标签，可跳转至【标签与工作流】管理视图。</div>
                <div>4. 视图切换：点击右上角【优先级视图】可切换为四象限 Eisenhower 矩阵管理模式。</div>
              </div>
            </template>
            <span class="hint-trigger">!</span>
          </el-tooltip>
        </div>
        <div class="view-modes">
          <el-button
            class="mode"
            :class="{ 'mode--active': activeViewMode === 'state' }"
            text
            @click="goStateView"
          >
            状态视图
          </el-button>
          <el-button
            class="mode"
            :class="{ 'mode--active': activeViewMode === 'priority' }"
            text
            @click="goPriorityView"
          >
            优先级视图
          </el-button>
          <el-button class="mode mode--muted" text @click="createTask">
            + 新建任务
          </el-button>
        </div>
      </header>

      <section class="board" v-if="loading">
        <div class="board-loading">加载中...</div>
      </section>

      <section class="board" v-else>
        <div
          v-for="column in columns"
          :key="column.status"
          class="board-col"
          @dragover.prevent
          @drop="onDrop(column.status)"
        >
          <div class="col-title" :class="column.titleClass">
            {{ column.title }}
          </div>
          <div v-if="column.items.length === 0" class="empty-col">暂无任务</div>
          <el-card
            v-for="issue in column.items"
            :key="issue.id"
            class="card card-clickable"
            draggable="true"
            @click="goIssueDetail(issue.id)"
            @dragstart="onDragStart(issue)"
          >
            <div class="card-title">{{ issue.title }}</div>
            <div class="tag-row">
              <span class="tag" :class="priorityClass(issue.priority)">
                {{ priorityLabel(issue.priority) }}
              </span>
              <span v-for="tag in issue.tags" :key="tag" class="tag tag--neutral">
                {{ tag }}
              </span>
            </div>
          </el-card>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import AppShell from "../../components/AppShell.vue";
import { buildApi } from "../../lib/api";

type IssueDTO = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority?: number | null;
  workspaceId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

const activeViewMode = ref<"state" | "priority">("state");
const router = useRouter();
const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";
const api = buildApi(apiBase);

const loading = ref(true);
const issues = ref<IssueDTO[]>([]);
const dragging = ref<IssueDTO | null>(null);

const columns = computed(() => [
  {
    status: "Backlog",
    title: "待排期 (Backlog)",
    titleClass: "",
    items: issues.value.filter((issue) => issue.status === "Backlog"),
  },
  {
    status: "Todo",
    title: "待办 (Todo)",
    titleClass: "",
    items: issues.value.filter((issue) => issue.status === "Todo"),
  },
  {
    status: "InProgress",
    title: "进行中 (In Progress)",
    titleClass: "",
    items: issues.value.filter((issue) => issue.status === "InProgress"),
  },
  {
    status: "Review",
    title: "审核中 (In Review)",
    titleClass: "",
    items: issues.value.filter((issue) => issue.status === "Review"),
  },
  {
    status: "Done",
    title: "已完成 (Done)",
    titleClass: "col-title--success",
    items: issues.value.filter((issue) => issue.status === "Done"),
  },
  {
    status: "Blocked",
    title: "已阻塞 (Blocked)",
    titleClass: "col-title--error",
    items: issues.value.filter((issue) => issue.status === "Blocked"),
  },
]);

const loadIssues = async () => {
  loading.value = true;
  try {
    const response = await api.listIssues();
    issues.value = response.data ?? [];
  } catch (error) {
    ElMessage.error("加载任务失败");
  } finally {
    loading.value = false;
  }
};

const updateIssueInList = (updated: IssueDTO) => {
  const index = issues.value.findIndex((issue) => issue.id === updated.id);
  if (index === -1) {
    issues.value = [updated, ...issues.value];
    return;
  }
  issues.value = [
    ...issues.value.slice(0, index),
    updated,
    ...issues.value.slice(index + 1),
  ];
};

const onDragStart = (issue: IssueDTO) => {
  dragging.value = issue;
};

const onDrop = async (status: string) => {
  if (!dragging.value) return;
  const target = dragging.value;
  dragging.value = null;
  if (target.status === status) return;

  const prevStatus = target.status;
  updateIssueInList({ ...target, status });
  try {
    const response = await api.updateIssue(target.id, { status });
    updateIssueInList(response.data);
  } catch (error) {
    updateIssueInList({ ...target, status: prevStatus });
    ElMessage.error("状态更新失败");
  }
};

const priorityLabel = (priority?: number | null) => {
  switch (priority) {
    case 0:
      return "P0 紧急";
    case 1:
      return "P1 高";
    case 2:
      return "P2 中";
    case 3:
      return "P3 低";
    default:
      return "P?";
  }
};

const priorityClass = (priority?: number | null) => {
  switch (priority) {
    case 0:
      return "tag--p0";
    case 1:
      return "tag--p1";
    case 2:
      return "tag--neutral";
    case 3:
      return "tag--neutral";
    default:
      return "tag--neutral";
  }
};

const createTask = () => {
  router.push("/tasks/new");
};

const goPriorityView = () => {
  activeViewMode.value = "priority";
  router.push("/board/priority");
};

const goStateView = () => {
  activeViewMode.value = "state";
  router.push("/board");
};

const goIssueDetail = (id: string) => {
  router.push(`/issues/${id}`);
};

onMounted(loadIssues);
</script>

<style scoped>
.main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
}

.board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.board-title {
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}

.hint-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background: var(--kanban-primary);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.theme-dark .hint-trigger {
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.25);
}

.theme-light .hint-trigger {
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
}

.hint-popover {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 320px;
  font-size: 12px;
  line-height: 1.5;
}

.view-modes {
  display: flex;
  gap: 8px;
  padding: 4px;
  border-radius: 6px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.mode {
  height: auto;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 400;
  color: var(--kanban-text-secondary);
}

.mode--active {
  color: var(--kanban-text-primary);
  font-weight: 600;
}

.mode--muted {
  color: var(--kanban-primary);
}

.board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.board-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 120px;
}

.board-loading {
  padding: 24px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  font-size: 14px;
}

.col-title {
  font-size: 16px;
  font-weight: 600;
}

.col-title--success {
  color: var(--kanban-success);
}

.col-title--error {
  color: var(--kanban-error);
}

.empty-col {
  font-size: 12px;
  color: var(--kanban-text-secondary);
  padding: 8px 0;
}

.card {
  border-radius: 10px;
}

.card-clickable {
  cursor: grab;
}

.card-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.tag--p0 {
  background: #ef4444;
  color: #fff;
  border-color: transparent;
}

.tag--p1 {
  background: #f59e0b;
  color: #fff;
  border-color: transparent;
}

.tag--neutral {
  color: var(--kanban-text-secondary);
}
</style>

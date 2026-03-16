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
        <div class="board-actions">
          <div class="filters">
            <el-select
              v-model="filters.workspaceId"
              class="filter-select"
              size="small"
              placeholder="工作区"
            >
              <el-option label="全部工作区" value="all" />
              <el-option
                v-for="workspace in workspaces"
                :key="workspace.id"
                :label="workspace.name"
                :value="workspace.id"
              />
            </el-select>
            <el-select
              v-model="filters.tags"
              class="filter-select"
              size="small"
              multiple
              collapse-tags
              placeholder="标签筛选"
            >
              <el-option v-for="tag in tags" :key="tag.name" :label="tag.name" :value="tag.name" />
            </el-select>
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
          <div class="col-scroll">
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
                <span class="tag tag--neutral">
                  {{ statusLabel(issue.status) }}
                </span>
                <span class="tag tag--neutral">
                  {{ issue.workspaceName ?? issue.workspaceId }}
                </span>
                <span v-for="tag in issue.tags" :key="tag" class="tag tag--neutral">
                  {{ tag }}
                </span>
              </div>
            </el-card>
          </div>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import AppShell from "../../components/AppShell.vue";
import { buildApi } from "../../lib/api";
import {
  filterIssues,
  groupByStatus,
  mergeIssueUpdates,
  priorityLabel,
  priorityMeta,
  sortIssues,
  statusLabel,
  type FilterState,
  type IssueView,
} from "./issue-board-utils";

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

type WorkspaceDTO = {
  id: string;
  name: string;
};

type TagDTO = {
  id: string;
  name: string;
};

const activeViewMode = ref<"state" | "priority">("state");
const router = useRouter();
const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";
const api = buildApi(apiBase);

const loading = ref(true);
const issues = ref<IssueView[]>([]);
const dragging = ref<IssueView | null>(null);
const workspaces = ref<WorkspaceDTO[]>([]);
const tags = ref<TagDTO[]>([]);
const filters = ref<FilterState>({ workspaceId: "all", tags: [] });
let refreshTimer: number | undefined;

const workspaceMap = computed(
  () => new Map(workspaces.value.map((workspace) => [workspace.id, workspace.name])),
);

const filteredIssues = computed(() => filterIssues(issues.value, filters.value));
const sortedIssues = computed(() => sortIssues(filteredIssues.value));
const groupedIssues = computed(() => groupByStatus(sortedIssues.value));

const columns = computed(() => [
  {
    status: "Backlog",
    title: "待排期 (Backlog)",
    titleClass: "",
    items: groupedIssues.value.Backlog,
  },
  {
    status: "Todo",
    title: "待办 (Todo)",
    titleClass: "",
    items: groupedIssues.value.Todo,
  },
  {
    status: "InProgress",
    title: "进行中 (In Progress)",
    titleClass: "",
    items: groupedIssues.value.InProgress,
  },
  {
    status: "Review",
    title: "审核中 (In Review)",
    titleClass: "",
    items: groupedIssues.value.Review,
  },
  {
    status: "Done",
    title: "已完成 (Done)",
    titleClass: "col-title--success",
    items: groupedIssues.value.Done,
  },
  {
    status: "Blocked",
    title: "已阻塞 (Blocked)",
    titleClass: "col-title--error",
    items: groupedIssues.value.Blocked,
  },
]);

const withWorkspaceName = (issue: IssueDTO): IssueView => ({
  ...issue,
  workspaceName: workspaceMap.value.get(issue.workspaceId),
});

const loadIssues = async () => {
  loading.value = true;
  try {
    const [issuesResponse, workspacesResponse, tagsResponse] = await Promise.all([
      api.listIssues(),
      api.listWorkspaces(),
      api.listTags(),
    ]);
    workspaces.value = workspacesResponse.data ?? [];
    tags.value = tagsResponse.data ?? [];
    const data = (issuesResponse.data ?? []) as IssueDTO[];
    issues.value = data.map(withWorkspaceName);
  } catch (error) {
    ElMessage.error("加载任务失败");
  } finally {
    loading.value = false;
  }
};

const refreshIssues = async () => {
  if (dragging.value) return;
  try {
    const issuesResponse = await api.listIssues();
    const data = (issuesResponse.data ?? []) as IssueDTO[];
    const next = data.map(withWorkspaceName);
    issues.value = mergeIssueUpdates(issues.value, next);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to refresh issues", error);
  }
};

const updateIssueInList = (updated: IssueDTO) => {
  const next = withWorkspaceName(updated);
  const index = issues.value.findIndex((issue) => issue.id === updated.id);
  if (index === -1) {
    issues.value = [next, ...issues.value];
    return;
  }
  issues.value = [...issues.value.slice(0, index), next, ...issues.value.slice(index + 1)];
};

const onDragStart = (issue: IssueView) => {
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

const priorityClass = (priority?: number | null) => {
  const code = priorityMeta(priority).code;
  if (code === "P0") return "tag--p0";
  if (code === "P1") return "tag--p1";
  return "tag--neutral";
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

onMounted(async () => {
  await loadIssues();
  refreshTimer = window.setInterval(() => {
    refreshIssues();
  }, 5000);
});

onUnmounted(() => {
  if (refreshTimer) {
    window.clearInterval(refreshTimer);
  }
});
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

.board-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.filters {
  display: flex;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.filter-select {
  min-width: 150px;
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
  grid-template-columns: repeat(6, minmax(220px, 1fr));
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.board-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 120px;
  max-height: calc(100vh - 260px);
  overflow: hidden;
}

.col-scroll {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-right: 4px;
}

.col-scroll::-webkit-scrollbar {
  width: 6px;
}

.col-scroll::-webkit-scrollbar-thumb {
  background: var(--kanban-border);
  border-radius: 999px;
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

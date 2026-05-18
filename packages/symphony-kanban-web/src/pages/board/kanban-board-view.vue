<template>
  <AppShell>
    <div class="main-content">
      <header class="board-header">
        <div class="board-heading">
          <div class="board-title">
            看板
            <span class="board-count">{{ filteredIssues.length }}</span>
          </div>
          <div class="board-subtitle">最近一周任务流</div>
          <el-tooltip placement="right" effect="dark">
            <template #content>
              <div class="hint-popover">
                <div>1. 侧边栏导航：点击【工作区】去配置运行路径和全局参数，点击【标签】去设定工作流引擎。</div>
                <div>2. 卡片流转：卡片拖入【待办(Todo)】后将自动触发执行，执行中可点击跳至【Web 会话监控视图】查看实时日志。</div>
                <div>3. 标签跳转：直接点击卡片上的【P0 紧急】等标签，可跳转至【标签与工作流】管理视图。</div>
                <div>4. 视图切换：点击右上角【优先级视图】可切换为四象限 Eisenhower 矩阵管理模式。</div>
              </div>
            </template>
            <button class="hint-trigger" type="button" aria-label="查看看板提示">?</button>
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
              新建任务
            </el-button>
          </div>
          <el-button
            class="clear-button"
            type="danger"
            plain
            :disabled="loading || issues.length === 0"
            :loading="clearing"
            @click="clearAllTasks"
          >
            清空任务
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
          <div class="col-header">
            <div class="col-title" :class="column.titleClass">
              {{ column.title }}
            </div>
            <span class="col-count">{{ column.items.length }}</span>
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
              @dragend="onDragEnd"
            >
              <div class="card-title">{{ issue.title }}</div>
              <div class="tag-row">
                <span class="tag" :class="priorityClass(issue.priority)">
                  {{ priorityLabel(issue.priority) }}
                </span>
                <span v-if="shouldShowStatusTag(activeViewMode)" class="tag tag--neutral">
                  {{ statusLabel(issue.status) }}
                </span>
                <span class="tag tag--neutral">
                  {{ issue.workspaceName ?? issue.workspaceId }}
                </span>
                <span v-if="issue.tags[0]" class="tag tag--neutral">
                  {{ issue.tags[0] }}
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
import { ElMessage, ElMessageBox } from "element-plus";
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
  shouldShowStatusTag,
  type ViewMode,
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

const activeViewMode = ref<ViewMode>("state");
const router = useRouter();
const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";
const api = buildApi(apiBase);

const loading = ref(true);
const clearing = ref(false);
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

const onDragEnd = () => {
  dragging.value = null;
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

const clearAllTasks = async () => {
  if (issues.value.length === 0 || clearing.value) return;

  try {
    await ElMessageBox.confirm(
      `将删除当前系统中的全部 ${issues.value.length} 个任务，删除后不会在看板中显示。`,
      "确认清空所有任务？",
      {
        confirmButtonText: "清空任务",
        cancelButtonText: "取消",
        type: "warning",
        confirmButtonClass: "el-button--danger",
      },
    );
  } catch {
    return;
  }

  clearing.value = true;
  try {
    const response = await api.deleteAllIssues();
    issues.value = [];
    dragging.value = null;
    ElMessage.success(`已清空 ${response.deletedCount ?? 0} 个任务`);
  } catch (error) {
    ElMessage.error("清空任务失败");
    await refreshIssues();
  } finally {
    clearing.value = false;
  }
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
  gap: 18px;
  padding: 26px 28px;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
}

.board-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 2px 2px;
  border: 1px solid var(--kanban-border);
  border-color: transparent;
  background: transparent;
  box-shadow: none;
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
  padding: 4px;
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  box-shadow: var(--kanban-shadow-sm);
}

.filter-select {
  min-width: 150px;
}

.board-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.board-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0;
  white-space: nowrap;
}

.board-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  margin-left: 8px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  color: var(--kanban-text-secondary);
  font-size: 13px;
  font-weight: 700;
  vertical-align: middle;
}

.board-subtitle {
  width: 100%;
  color: var(--kanban-muted);
  font-size: 13px;
  font-weight: 500;
}

.hint-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--kanban-border);
  border-radius: 999px;
  background: var(--kanban-surface);
  color: var(--kanban-text-secondary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.hint-trigger:hover {
  color: var(--kanban-primary);
  border-color: var(--kanban-border-strong);
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
  gap: 4px;
  padding: 4px;
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-surface-muted);
  border: 1px solid var(--kanban-border);
  box-shadow: none;
}

.mode {
  min-height: 34px;
  padding: 6px 12px;
  border-radius: var(--kanban-radius-sm);
  font-size: 13px;
  font-weight: 600;
  color: var(--kanban-text-secondary);
}

.mode--active {
  background: var(--kanban-surface);
  color: var(--kanban-text-primary);
  box-shadow: var(--kanban-shadow-sm);
}

.mode--muted {
  color: var(--kanban-primary);
  background: transparent;
}

.clear-button {
  min-height: 44px;
  border-radius: var(--kanban-radius-sm);
  font-weight: 600;
}

.board {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 2px 2px 12px;
  flex: 1;
  min-height: 0;
}

.board-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 0;
  min-width: 236px;
  min-height: 0;
  padding: 12px;
  border: 1px solid var(--kanban-border);
  border-radius: var(--kanban-radius-md);
  background: var(--kanban-surface-muted);
  box-shadow: none;
  transition:
    background-color var(--kanban-transition),
    border-color var(--kanban-transition);
}

.theme-dark .board-col {
  background: rgba(44, 44, 46, 0.6);
}

.board-col:hover {
  border-color: var(--kanban-border-strong);
}

.col-scroll {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.col-scroll > .card,
.col-scroll > .empty-col {
  flex-shrink: 0;
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
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  font-size: 14px;
  box-shadow: var(--kanban-shadow-sm);
}

.col-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--kanban-text-primary);
}

.col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 30px;
}

.col-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  color: var(--kanban-muted);
  font-size: 12px;
  font-weight: 700;
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
  padding: 18px 12px;
  border: 1px dashed var(--kanban-border-strong);
  border-radius: var(--kanban-radius-sm);
  background: color-mix(in srgb, var(--kanban-surface) 72%, transparent);
  text-align: center;
}

.card {
  border-radius: var(--kanban-radius-md);
  min-width: 0;
  overflow: hidden;
}

.card :deep(.el-card__body) {
  padding: 14px;
}

.card:hover {
  border-color: var(--kanban-border-strong);
  box-shadow: var(--kanban-shadow-sm);
  transform: translateY(-1px) scale(1.005);
}

.card-clickable {
  cursor: grab;
}

.card-clickable:active {
  cursor: grabbing;
}

.card-title {
  color: var(--kanban-text-primary);
  font-size: 14px;
  font-weight: 650;
  line-height: 1.45;
  margin-bottom: 8px;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 650;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.tag--p0 {
  background: var(--kanban-error);
  color: #ffffff;
  border-color: transparent;
}

.tag--p1 {
  background: var(--kanban-warning);
  color: #ffffff;
  border-color: transparent;
}

.tag--neutral {
  color: var(--kanban-text-secondary);
}

@media (max-width: 900px) {
  .main-content {
    padding: 22px 14px;
    overflow: hidden;
  }

  .board-header {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }

  .board-heading {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 6px 10px;
  }

  .board-title {
    grid-column: 1;
    font-size: 26px;
  }

  .board-subtitle {
    grid-column: 1 / -1;
    width: auto;
  }

  .hint-trigger {
    grid-column: 2;
    grid-row: 1;
  }

  .board-actions {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .filters,
  .view-modes,
  .clear-button {
    width: 100%;
  }

  .filters {
    flex-wrap: wrap;
  }

  .filter-select {
    flex: 1 1 150px;
    min-width: 0;
  }

  .view-modes {
    overflow-x: auto;
  }

  .mode {
    flex: 1 0 max-content;
    min-width: 92px;
  }

  .board {
    width: 100%;
    max-width: 100%;
  }

  .board-col {
    flex: 0 0 236px;
  }
}
</style>

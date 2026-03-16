<template>
  <AppShell>
    <div class="priority-content">
      <header class="priority-header">
        <div class="priority-title">最近一周</div>
        <div class="priority-actions">
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

      <section class="priority-grid" v-if="loading">
        <div class="priority-loading">加载中...</div>
      </section>

      <section class="priority-grid" v-else>
        <div class="priority-row">
          <div class="priority-quadrant quadrant-p0">
            <div class="quadrant-title">P0 (重要且紧急) - 立即做</div>
            <div class="quadrant-scroll">
              <div v-if="buckets.P0.length === 0" class="empty-quadrant">暂无任务</div>
              <el-card
                v-for="issue in buckets.P0"
                :key="issue.id"
                class="priority-card"
                @click="goIssueDetail(issue.id)"
              >
                <div class="card-title">{{ issue.title }}</div>
                <div class="tag-row">
                  <span class="tag tag--neutral">{{ statusLabel(issue.status) }}</span>
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
          <div class="priority-quadrant quadrant-p1">
            <div class="quadrant-title quadrant-title--warning">
              P1 (重要但不紧急) - 计划做
            </div>
            <div class="quadrant-scroll">
              <div v-if="buckets.P1.length === 0" class="empty-quadrant">暂无任务</div>
              <el-card
                v-for="issue in buckets.P1"
                :key="issue.id"
                class="priority-card"
                @click="goIssueDetail(issue.id)"
              >
                <div class="card-title">{{ issue.title }}</div>
                <div class="tag-row">
                  <span class="tag tag--neutral">{{ statusLabel(issue.status) }}</span>
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
        </div>

        <div class="priority-row">
          <div class="priority-quadrant quadrant-p2">
            <div class="quadrant-title quadrant-title--primary">
              P2 (紧急但不重要) - 授权做
            </div>
            <div class="quadrant-scroll">
              <div v-if="buckets.P2.length === 0" class="empty-quadrant">暂无任务</div>
              <el-card
                v-for="issue in buckets.P2"
                :key="issue.id"
                class="priority-card"
                @click="goIssueDetail(issue.id)"
              >
                <div class="card-title">{{ issue.title }}</div>
                <div class="tag-row">
                  <span class="tag tag--neutral">{{ statusLabel(issue.status) }}</span>
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
          <div class="priority-quadrant quadrant-p3">
            <div class="quadrant-title quadrant-title--muted">
              P3 (不紧急不重要) - 稍后做
            </div>
            <div class="quadrant-scroll">
              <div v-if="buckets.P3.length === 0" class="empty-quadrant">暂无任务</div>
              <el-card
                v-for="issue in buckets.P3"
                :key="issue.id"
                class="priority-card priority-card--muted"
                @click="goIssueDetail(issue.id)"
              >
                <div class="card-title card-title--muted">{{ issue.title }}</div>
                <div class="tag-row">
                  <span class="tag tag--neutral">{{ statusLabel(issue.status) }}</span>
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
import {
  filterIssues,
  groupByPriority,
  priorityLabel,
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

const activeViewMode = ref<"state" | "priority">("priority");
const router = useRouter();
const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";
const api = buildApi(apiBase);

const loading = ref(true);
const issues = ref<IssueView[]>([]);
const workspaces = ref<WorkspaceDTO[]>([]);
const tags = ref<TagDTO[]>([]);
const filters = ref<FilterState>({ workspaceId: "all", tags: [] });

const workspaceMap = computed(
  () => new Map(workspaces.value.map((workspace) => [workspace.id, workspace.name])),
);

const filteredIssues = computed(() => filterIssues(issues.value, filters.value));
const groupedBuckets = computed(() => groupByPriority(filteredIssues.value));
const buckets = computed(() => ({
  P0: sortIssues(groupedBuckets.value.P0),
  P1: sortIssues(groupedBuckets.value.P1),
  P2: sortIssues(groupedBuckets.value.P2),
  P3: sortIssues(groupedBuckets.value.P3),
}));

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
.priority-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
}

.priority-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.priority-actions {
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

.priority-title {
  font-size: 28px;
  font-weight: 700;
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
  background: var(--kanban-primary);
  color: var(--kanban-text-primary);
}

.mode--muted {
  background: var(--kanban-muted);
  color: var(--kanban-text-primary);
}

.priority-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.priority-loading {
  padding: 24px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  font-size: 14px;
}

.priority-row {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.priority-quadrant {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 8px;
  border: 2px solid transparent;
  box-sizing: border-box;
  min-height: 0;
}

.quadrant-p0 {
  background: var(--kanban-error-surface);
  border-color: var(--kanban-error);
}

.quadrant-p1 {
  background: var(--kanban-p1-surface);
  border-color: var(--kanban-warning);
}

.quadrant-p2 {
  background: #1a2235;
  border-color: var(--kanban-primary);
}

.quadrant-p3 {
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.quadrant-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--kanban-error);
}

.quadrant-title--warning {
  color: var(--kanban-warning);
}

.quadrant-title--primary {
  color: var(--kanban-primary);
}

.quadrant-title--muted {
  color: var(--kanban-text-secondary);
}

.empty-quadrant {
  font-size: 12px;
  color: var(--kanban-text-secondary);
}

.quadrant-scroll {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.quadrant-scroll::-webkit-scrollbar {
  width: 6px;
}

.quadrant-scroll::-webkit-scrollbar-thumb {
  background: var(--kanban-border);
  border-radius: 999px;
}

.quadrant-scroll > .priority-card,
.quadrant-scroll > .empty-quadrant {
  min-width: 0;
}

.quadrant-scroll > .empty-quadrant {
  grid-column: 1 / -1;
}

.priority-card {
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  cursor: pointer;
}

.priority-card :deep(.el-card__body) {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.priority-card--muted {
  background: var(--kanban-bg);
}

.card-title {
  font-size: 14px;
  font-weight: 400;
}

.card-title--muted {
  color: var(--kanban-text-secondary);
}

.tag-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  border: 1px solid transparent;
}

.tag--p0 {
  background: var(--kanban-error);
  color: var(--kanban-text-primary);
}

.tag--p1 {
  background: var(--kanban-warning);
  color: var(--kanban-text-primary);
}

.tag--neutral {
  background: var(--kanban-surface);
  border-color: var(--kanban-border);
  color: var(--kanban-text-secondary);
}
</style>

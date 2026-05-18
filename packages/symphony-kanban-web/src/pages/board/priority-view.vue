<template>
  <AppShell>
    <div class="priority-content">
      <header class="priority-header">
        <div class="priority-heading">
          <div class="priority-title">优先级</div>
          <div class="priority-subtitle">Eisenhower 矩阵</div>
        </div>
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
              新建任务
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
                <span v-if="issue.tags[0]" class="tag tag--neutral">
                  {{ issue.tags[0] }}
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
                <span v-if="issue.tags[0]" class="tag tag--neutral">
                  {{ issue.tags[0] }}
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
                <span v-if="issue.tags[0]" class="tag tag--neutral">
                  {{ issue.tags[0] }}
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
                <span v-if="issue.tags[0]" class="tag tag--neutral">
                  {{ issue.tags[0] }}
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
  gap: 18px;
  padding: 26px 28px;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
}

.priority-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 2px 2px;
  border: 1px solid transparent;
  background: transparent;
  box-shadow: none;
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
  padding: 4px;
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  box-shadow: var(--kanban-shadow-sm);
}

.filter-select {
  min-width: 150px;
}

.priority-heading {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.priority-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0;
  white-space: nowrap;
}

.priority-subtitle {
  color: var(--kanban-muted);
  font-size: 13px;
  font-weight: 500;
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

.priority-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.priority-loading {
  padding: 24px;
  border-radius: var(--kanban-radius-sm);
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  font-size: 14px;
  box-shadow: var(--kanban-shadow-sm);
}

.priority-row {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.priority-quadrant {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: var(--kanban-radius-md);
  border: 1px solid var(--kanban-border);
  box-sizing: border-box;
  min-height: 0;
  box-shadow: none;
}

.quadrant-p0 {
  background: linear-gradient(180deg, var(--kanban-error-surface), var(--kanban-surface-muted));
  border-color: color-mix(in srgb, var(--kanban-error) 30%, var(--kanban-border));
}

.quadrant-p1 {
  background: linear-gradient(180deg, var(--kanban-p1-surface), var(--kanban-surface-muted));
  border-color: color-mix(in srgb, var(--kanban-warning) 32%, var(--kanban-border));
}

.quadrant-p2 {
  background: linear-gradient(180deg, var(--kanban-primary-soft), var(--kanban-surface-muted));
  border-color: color-mix(in srgb, var(--kanban-primary) 28%, var(--kanban-border));
}

.quadrant-p3 {
  background: var(--kanban-surface-muted);
  border: 1px solid var(--kanban-border);
}

.quadrant-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--kanban-error);
  letter-spacing: 0;
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
  padding: 18px 12px;
  border: 1px dashed var(--kanban-border-strong);
  border-radius: var(--kanban-radius-sm);
  background: color-mix(in srgb, var(--kanban-surface) 72%, transparent);
  text-align: center;
}

.quadrant-scroll {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  align-content: start;
  grid-auto-rows: max-content;
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
  background: var(--kanban-surface-raised);
  border: 1px solid var(--kanban-border);
  border-radius: var(--kanban-radius-md);
  cursor: pointer;
  overflow: hidden;
}

.priority-card:hover {
  border-color: var(--kanban-border-strong);
  box-shadow: var(--kanban-shadow-sm);
  transform: translateY(-1px) scale(1.005);
}

.priority-card :deep(.el-card__body) {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.priority-card--muted {
  background: var(--kanban-surface-muted);
}

.card-title {
  font-size: 14px;
  font-weight: 650;
  line-height: 1.45;
  color: var(--kanban-text-primary);
  overflow-wrap: anywhere;
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
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 650;
  border: 1px solid transparent;
}

.tag--p0 {
  background: var(--kanban-error);
  color: #ffffff;
}

.tag--p1 {
  background: var(--kanban-warning);
  color: #ffffff;
}

.tag--neutral {
  background: var(--kanban-surface);
  border-color: var(--kanban-border);
  color: var(--kanban-text-secondary);
}

@media (max-width: 900px) {
  .priority-content {
    padding: 22px 14px;
    overflow: hidden;
  }

  .priority-header {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }

  .priority-actions {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .filters,
  .view-modes {
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

  .priority-grid {
    overflow: visible;
  }

  .priority-row {
    flex-direction: column;
  }

  .quadrant-scroll {
    grid-template-columns: 1fr;
  }
}
</style>

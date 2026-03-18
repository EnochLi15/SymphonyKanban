<template>
  <AppShell>
    <div class="issue-content">
      <header class="issue-header">
        <div class="header-left">
          <el-button class="app-back-button" text @click="goBack">← 返回</el-button>
          <h1 class="issue-title">任务详情</h1>
        </div>
        <el-button
          class="danger-button"
          type="danger"
          plain
          :loading="deleting"
          @click="confirmDelete"
        >
          删除任务
        </el-button>
      </header>

      <OpencodeSessionPanel v-if="draft.status === 'Done'" :session-url="sessionUrl" />

      <section class="issue-details" v-if="loading">
        <div class="loading">加载中...</div>
      </section>

      <section class="issue-details" v-else>
        <div class="main-col">
          <div class="field-card">
            <div class="field-label">标题</div>
            <el-input
              v-model="draft.title"
              placeholder="请输入任务标题"
              @input="onTitleInput"
              @blur="flushTitle"
            />
          </div>

          <div class="field-card">
            <div class="field-label">描述</div>
            <el-input
              v-model="draft.description"
              type="textarea"
              :rows="6"
              placeholder="请输入任务描述"
              @input="onDescriptionInput"
              @blur="flushDescription"
            />
          </div>
        </div>

        <aside class="side-col">
          <div class="field-card">
            <div class="field-label">执行状态</div>
            <div class="status-text">
              {{ executionStatus || "暂无执行" }}
            </div>
          </div>
          <div class="field-card">
            <div class="field-label">状态</div>
            <el-select
              v-model="draft.status"
              placeholder="选择状态"
              @change="saveStatus"
            >
              <el-option
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>

          <div class="field-card">
            <div class="field-label">优先级</div>
            <el-select
              v-model="draft.priority"
              placeholder="选择优先级"
              @change="savePriority"
            >
              <el-option
                v-for="option in priorityOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>

          <div class="field-card">
            <div class="field-label">标签</div>
            <el-select
              v-model="draft.tags"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="选择或创建标签"
              @change="saveTags"
            >
              <el-option
                v-for="tag in tagOptions"
                :key="tag.name"
                :label="tag.name"
                :value="tag.name"
              />
            </el-select>
          </div>

          <div class="field-card">
            <div class="field-label">工作区</div>
            <el-select
              v-model="draft.workspaceId"
              placeholder="选择工作区"
              @change="saveWorkspace"
            >
              <el-option
                v-for="workspace in workspaces"
                :key="workspace.id"
                :label="workspace.name"
                :value="workspace.id"
              />
            </el-select>
          </div>
        </aside>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import AppShell from "../../components/AppShell.vue";
import { buildApi } from "../../lib/api";
import { resolveIssueDetailRoute } from "./issue-detail-routing";
import OpencodeSessionPanel from "../../components/opencode-session-panel.vue";
import { resolveOpencodeSessionUrl } from "../sessions/opencode-session";
import type { ReviewDTO } from "symphony-kanban-shared";

const router = useRouter();
const route = useRoute();
const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";
const api = buildApi(apiBase);
const opencodeWebBase = import.meta.env.VITE_OPENCODE_WEB_BASE ?? "http://localhost:4096";

const loading = ref(true);
const deleting = ref(false);
const workspaces = ref<Array<{ id: string; name: string }>>([]);
const tagOptions = ref<Array<{ id: string; name: string }>>([]);
const executionStatus = ref<string | null>(null);
const executionId = ref<string | null>(null);
const review = ref<ReviewDTO | null>(null);
let executionTimer: number | undefined;
let issueStatusTimer: number | undefined;

const statusOptions = [
  { label: "待排期 (Backlog)", value: "Backlog" },
  { label: "待办 (Todo)", value: "Todo" },
  { label: "进行中 (In Progress)", value: "InProgress" },
  { label: "审核中 (Review)", value: "Review" },
  { label: "已阻塞 (Blocked)", value: "Blocked" },
  { label: "已完成 (Done)", value: "Done" },
];

const priorityOptions = [
  { label: "P0 紧急", value: 0 },
  { label: "P1 高", value: 1 },
  { label: "P2 中", value: 2 },
  { label: "P3 低", value: 3 },
];

const draft = reactive({
  id: "",
  title: "",
  description: "",
  status: "Backlog",
  priority: 2,
  workspaceId: "",
  tags: [] as string[],
});

const snapshot = ref({ ...draft });
const debounceTimers: Record<string, number | undefined> = {};
const isEditing = computed(
  () =>
    draft.title !== snapshot.value.title ||
    draft.description !== snapshot.value.description,
);

const ensureRouteForStatus = (status: string) => {
  const target = resolveIssueDetailRoute({
    issueId: draft.id,
    status,
    currentPath: route.path,
    isEditing: isEditing.value,
  });
  if (target) router.replace(target);
};

const syncDraft = (data: typeof draft) => {
  draft.id = data.id;
  draft.title = data.title ?? "";
  draft.description = data.description ?? "";
  draft.status = data.status;
  draft.priority = data.priority ?? 2;
  draft.workspaceId = data.workspaceId;
  draft.tags = Array.isArray(data.tags) ? [...data.tags] : [];
  snapshot.value = { ...draft };
};

const loadOptions = async () => {
  try {
    const [workspaceRes, tagRes] = await Promise.all([
      api.listWorkspaces(),
      api.listTags(),
    ]);
    workspaces.value = workspaceRes.data ?? [];
    tagOptions.value = tagRes.data ?? [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to load options", error);
  }
};

const loadIssue = async () => {
  loading.value = true;
  try {
    const response = await api.getIssue(String(route.params.id));
    syncDraft(response.data);
    ensureRouteForStatus(response.data.status);
  } catch (error) {
    ElMessage.warning("任务已删除");
    router.push("/board");
  } finally {
    loading.value = false;
  }
};

const loadExecution = async () => {
  try {
    const res = await api.listExecutions(String(route.params.id));
    const executions = res.data ?? [];
    if (executions.length === 0) return;
    executionId.value = executions[0].id;
    await pollExecution();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to load execution", error);
  }
};

const loadReview = async () => {
  if (draft.status !== "Done") {
    review.value = null;
    return;
  }
  try {
    const res = await api.getReview(draft.id);
    review.value = res.data ?? null;
  } catch {
    review.value = null;
  }
};

const pollExecution = async () => {
  if (!executionId.value) return;
  try {
    const res = await api.getExecutionStatus(executionId.value);
    executionStatus.value = res.data?.status ?? null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to poll execution", error);
  }
};

const pollIssueStatus = async () => {
  if (!draft.id) return;
  try {
    const response = await api.getIssue(draft.id);
    const next = response.data;
    if (!next) return;
    if (!isEditing.value) {
      syncDraft(next);
    } else if (next.status !== draft.status) {
      draft.status = next.status;
      snapshot.value = { ...snapshot.value, status: next.status };
    }
    ensureRouteForStatus(next.status);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to poll issue status", error);
  }
};

watch(
  () => draft.status,
  () => {
    loadReview();
  },
);

const savePatch = async (patch: Record<string, unknown>) => {
  try {
    const response = await api.updateIssue(draft.id, patch);
    syncDraft(response.data);
  } catch (error) {
    syncDraft(snapshot.value);
    ElMessage.error("保存失败");
  }
};

const scheduleSave = (field: string, value: unknown) => {
  const existingTimer = debounceTimers[field];
  if (existingTimer) {
    window.clearTimeout(existingTimer);
  }
  debounceTimers[field] = window.setTimeout(() => {
    savePatch({ [field]: value });
  }, 500);
};

const flushSave = (field: string, value: unknown) => {
  const existingTimer = debounceTimers[field];
  if (existingTimer) {
    window.clearTimeout(existingTimer);
  }
  savePatch({ [field]: value });
};

const onTitleInput = (value: string) => {
  scheduleSave("title", value);
};

const onDescriptionInput = (value: string) => {
  scheduleSave("description", value);
};

const flushTitle = () => {
  flushSave("title", draft.title);
};

const flushDescription = () => {
  flushSave("description", draft.description);
};

const saveStatus = () => {
  savePatch({ status: draft.status });
};

const savePriority = () => {
  savePatch({ priority: draft.priority });
};

const saveWorkspace = () => {
  savePatch({ workspace_id: draft.workspaceId });
};

const saveTags = () => {
  savePatch({ tags: draft.tags });
};

const confirmDelete = async () => {
  try {
    await ElMessageBox.confirm("确定删除该任务？", "删除确认", {
      type: "warning",
    });
  } catch {
    return;
  }

  deleting.value = true;
  try {
    await api.deleteIssue(draft.id);
    ElMessage.success("任务已删除");
    router.push("/board");
  } catch (error) {
    ElMessage.error("删除失败");
  } finally {
    deleting.value = false;
  }
};

const goBack = () => {
  router.back();
};

onMounted(async () => {
  await Promise.all([loadOptions(), loadIssue(), loadExecution()]);
  await loadReview();
  executionTimer = window.setInterval(() => {
    pollExecution();
  }, 5000);
  issueStatusTimer = window.setInterval(() => {
    pollIssueStatus();
  }, 5000);
});

onUnmounted(() => {
  if (executionTimer) {
    window.clearInterval(executionTimer);
  }
  if (issueStatusTimer) {
    window.clearInterval(issueStatusTimer);
  }
});

const sessionUrl = computed(() =>
  resolveOpencodeSessionUrl(opencodeWebBase, review.value?.artifacts),
);
</script>

<style scoped>
.issue-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
}

.issue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.issue-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.issue-details {
  flex: 1;
  display: flex;
  gap: 24px;
  min-width: 0;
}

.loading {
  padding: 24px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  font-size: 14px;
}

.main-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.side-col {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 8px;
  background: var(--kanban-surface);
  box-sizing: border-box;
}

.field-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--kanban-text-secondary);
}

.status-text {
  font-size: 14px;
  color: var(--kanban-text-secondary);
}

.danger-button {
  border-radius: 6px;
}
</style>

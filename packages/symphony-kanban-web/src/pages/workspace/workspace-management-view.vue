<template>
  <AppShell>
    <div class="workspace-content">
      <header class="workspace-header">
        <h1 class="workspace-title">工作区管理</h1>
        <div class="header-actions">
          <el-button class="action-button" @click="openImportDialog">
            导入 OpenCode
          </el-button>
          <el-button class="action-button action-primary" @click="createWorkspace">
            + 添加工作区
          </el-button>
        </div>
      </header>

      <section class="workspace-list">
        <el-card
          v-for="workspace in workspaces"
          :key="workspace.id"
          class="workspace-card"
          @click="goWorkspaceSettings(workspace.id)"
        >
          <div class="workspace-info">
            <div class="workspace-name">{{ workspace.name }}</div>
            <div class="workspace-path">
              {{ workspace.localPath || "(未设置路径)" }}
            </div>
          </div>
          <div class="workspace-actions">
            <el-button
              class="delete-button"
              text
              type="danger"
              :loading="deletingId === workspace.id"
              :disabled="deletingId !== null && deletingId !== workspace.id"
              @click.stop="handleDelete(workspace)"
            >
              删除
            </el-button>
          </div>
        </el-card>
      </section>
    </div>

    <el-dialog
      v-model="importDialogVisible"
      class="workspace-dialog"
      :show-close="false"
      align-center
      append-to-body="false"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-title">导入 OpenCode 项目</div>
          <el-button class="dialog-close" text @click="closeImportDialog">✕</el-button>
        </div>
      </template>

      <el-table
        v-loading="importLoading"
        :data="opencodeProjects"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="localPath" label="本地路径" />
      </el-table>

      <div class="dialog-actions">
        <el-button class="action-button action-cancel" text @click="closeImportDialog">
          取消
        </el-button>
        <el-button
          class="action-button action-primary"
          :loading="importSubmitting"
          :disabled="selectedProjects.length === 0"
          @click="submitImport"
        >
          导入
        </el-button>
      </div>
    </el-dialog>

    <el-dialog
      v-model="dialogVisible"
      class="workspace-dialog"
      :show-close="false"
      align-center
      append-to-body="false"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-title">添加工作区</div>
          <el-button class="dialog-close" text @click="handleCancel">✕</el-button>
        </div>
      </template>

      <el-form ref="formRef" class="workspace-form" :model="form" :rules="rules">
        <div class="form-block">
          <el-form-item prop="name" label="工作区名称">
            <el-input
              v-model="form.name"
              class="field-input"
              placeholder="例如：前端团队工作区"
            />
          </el-form-item>
        </div>

        <div class="form-block">
          <el-form-item prop="localPath" label="本地路径">
            <el-input
              v-model="form.localPath"
              class="field-input"
              placeholder="例如：/Users/you/projects/app"
            />
          </el-form-item>
        </div>

        <div class="form-block">
          <el-form-item prop="context" label="上下文说明（可选）">
            <el-input
              v-model="form.context"
              class="field-textarea"
              type="textarea"
              :rows="3"
              placeholder="例如：包含文档与运行约束"
            />
          </el-form-item>
        </div>
      </el-form>

      <div class="dialog-actions">
        <el-button class="action-button action-cancel" text @click="handleCancel">
          取消
        </el-button>
        <el-button
          class="action-button action-primary"
          :loading="submitting"
          @click="submitForm"
        >
          创建
        </el-button>
      </div>
    </el-dialog>
  </AppShell>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import AppShell from "../../components/AppShell.vue";
import { buildApi } from "../../lib/api";
import { toWorkspacePayload } from "./workspace-form";
import type { WorkspaceDTO } from "symphony-kanban-shared";

const router = useRouter();
const api = buildApi(import.meta.env.VITE_API_BASE ?? "http://localhost:3001");

const workspaces = ref<WorkspaceDTO[]>([]);
const dialogVisible = ref(false);
const importDialogVisible = ref(false);
const submitting = ref(false);
const deletingId = ref<string | null>(null);
const importLoading = ref(false);
const importSubmitting = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({
  name: "",
  localPath: "",
  context: "",
});
const opencodeProjects = ref<Array<{ name: string; localPath: string }>>([]);
const selectedProjects = ref<Array<{ name: string; localPath: string }>>([]);

const rules: FormRules = {
  name: [{ required: true, message: "请输入工作区名称", trigger: "blur" }],
  localPath: [{ required: true, message: "请输入本地路径", trigger: "blur" }],
};

const load = async () => {
  const res = await api.listWorkspaces();
  workspaces.value = res.data ?? [];
};

const resetForm = () => {
  form.name = "";
  form.localPath = "";
  form.context = "";
  formRef.value?.clearValidate();
};

const createWorkspace = () => {
  dialogVisible.value = true;
};

const handleSelectionChange = (rows: Array<{ name: string; localPath: string }>) => {
  selectedProjects.value = rows;
};

const openImportDialog = async () => {
  importDialogVisible.value = true;
  importLoading.value = true;
  try {
    const res = await api.listOpencodeProjects();
    opencodeProjects.value = res.data ?? [];
  } catch (error) {
    ElMessage.error("获取 OpenCode 项目失败");
  } finally {
    importLoading.value = false;
  }
};

const handleCancel = () => {
  dialogVisible.value = false;
  resetForm();
};

const closeImportDialog = () => {
  importDialogVisible.value = false;
  selectedProjects.value = [];
};

const submitForm = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    const payload = toWorkspacePayload(form);
    await api.createWorkspace({
      name: payload.name,
      localPath: payload.localPath,
      context: payload.context,
    });
    ElMessage.success("工作区已创建");
    dialogVisible.value = false;
    resetForm();
    await load();
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建失败";
    ElMessage.error(message);
  } finally {
    submitting.value = false;
  }
};

const submitImport = async () => {
  importSubmitting.value = true;
  try {
    const res = await api.importOpencodeProjects({
      projects: selectedProjects.value,
    });
    const imported = res.imported?.length ?? 0;
    const skipped = res.skipped?.length ?? 0;
    const failed = res.failed?.length ?? 0;
    ElMessage.success(`导入完成：成功 ${imported}，跳过 ${skipped}，失败 ${failed}`);
    closeImportDialog();
    await load();
  } catch (error) {
    ElMessage.error("导入失败");
  } finally {
    importSubmitting.value = false;
  }
};

const handleDelete = async (workspace: WorkspaceDTO) => {
  if (deletingId.value) return;
  deletingId.value = workspace.id;

  try {
    const check = await api.checkWorkspaceDeletion(workspace.id);
    const issueCount = check?.data?.issueCount ?? 0;

    if (issueCount > 0) {
      await ElMessageBox.alert(
        `该工作区下还有 ${issueCount} 个任务未清理，请先处理后再删除。`,
        "无法删除工作区",
        { confirmButtonText: "知道了" },
      );
      return;
    }

    await ElMessageBox.confirm("删除后将无法恢复。", "确认删除工作区？", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });

    await api.deleteWorkspace(workspace.id);
    ElMessage.success("工作区已删除");
    await load();
  } catch (error) {
    if (error === "cancel" || error === "close") {
      return;
    }
    if (error instanceof Error) {
      const issueCount = (error as Error & { issueCount?: number }).issueCount;
      if (error.message === "workspace_not_empty" && issueCount !== undefined) {
        ElMessage.warning(
          `该工作区下还有 ${issueCount} 个任务未清理，请先处理后再删除。`,
        );
        return;
      }
      ElMessage.error(error.message || "删除失败");
      return;
    }
    ElMessage.error("删除失败");
  } finally {
    deletingId.value = null;
  }
};

const goWorkspaceSettings = (id: string) => {
  router.push(`/workspaces/${id}`);
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.workspace-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 32px 36px;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  max-height: 100%;
}

.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid var(--kanban-border);
  border-radius: var(--kanban-radius-lg);
  background: var(--kanban-glass);
  box-shadow: var(--kanban-shadow-md);
  backdrop-filter: blur(18px) saturate(145%);
}

.workspace-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  border-radius: var(--kanban-radius-sm);
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 700;
  color: var(--kanban-text-primary);
}

.action-primary {
  background: var(--kanban-primary);
  border: none;
  color: #ffffff;
}

.workspace-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: auto;
  max-height: calc(100vh - 120px);
  padding-right: 4px;
}

.workspace-card {
  border-radius: var(--kanban-radius-md);
  background: var(--kanban-surface-raised);
  border: 1px solid var(--kanban-border);
  cursor: pointer;
  min-height: 88px;
  overflow: hidden;
}

.workspace-card:hover {
  border-color: var(--kanban-border-strong);
  box-shadow: var(--kanban-shadow-md);
  transform: translateY(-1px);
}

.workspace-card :deep(.el-card__body) {
  padding: 0 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 88px;
}

.workspace-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.workspace-actions {
  display: flex;
  align-items: center;
}

.delete-button {
  font-weight: 600;
}

.workspace-name {
  font-size: 18px;
  font-weight: 800;
}

.workspace-path {
  font-size: 14px;
  font-weight: 400;
  color: var(--kanban-text-secondary);
  font-family: "Space Grotesk", "Inter", "DM Sans", system-ui, -apple-system,
    sans-serif;
  min-height: 18px;
}

.workspace-dialog :deep(.el-dialog) {
  width: 560px;
  border-radius: var(--kanban-radius-lg);
  background: var(--kanban-glass);
  border: 1px solid var(--kanban-border);
  box-shadow: var(--kanban-shadow-lg);
  backdrop-filter: blur(18px) saturate(145%);
}

.workspace-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 24px 24px 0;
}

.workspace-dialog :deep(.el-dialog__body) {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.dialog-title {
  font-size: 18px;
  font-weight: 800;
}

.dialog-close {
  font-size: 16px;
}

.workspace-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-input,
.field-textarea {
  width: 100%;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.action-cancel {
  color: var(--kanban-text-secondary);
}

@media (max-width: 900px) {
  .workspace-content {
    padding: 20px;
    height: auto;
    overflow: visible;
  }

  .workspace-header {
    align-items: stretch;
    flex-direction: column;
  }

  .header-actions {
    flex-wrap: wrap;
  }

  .workspace-list {
    max-height: none;
  }

  .workspace-card :deep(.el-card__body) {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
    padding: 16px 18px;
  }
}
</style>

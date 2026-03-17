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
import { ElMessage } from "element-plus";
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
  gap: 24px;
  padding: 32px;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
}

.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.workspace-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 400;
  color: var(--kanban-text-primary);
}

.action-primary {
  background: var(--kanban-primary);
  border: none;
}

.workspace-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
}

.workspace-card {
  border-radius: 8px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
  cursor: pointer;
}

.workspace-card :deep(.el-card__body) {
  padding: 24px;
  display: flex;
  justify-content: space-between;
}

.workspace-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.workspace-name {
  font-size: 18px;
  font-weight: 600;
}

.workspace-path {
  font-size: 14px;
  font-weight: 400;
  color: var(--kanban-text-secondary);
  font-family: "Space Grotesk", "Inter", "DM Sans", system-ui, -apple-system,
    sans-serif;
}

.workspace-dialog :deep(.el-dialog) {
  width: 560px;
  border-radius: 12px;
  background: var(--kanban-surface);
  border: 1px solid var(--kanban-border);
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
  font-weight: 600;
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
</style>

<template>
  <aside class="app-sidebar">
    <div class="sidebar-title">Symphony 看板</div>
    <div class="sidebar-space"></div>
    <nav class="nav-menu">
      <el-menu
        class="sidebar-menu"
        :default-active="activeKey"
        :collapse="false"
        :unique-opened="true"
        @select="handleSelect"
      >
        <el-menu-item index="workspaces">工作区 (Workspaces)</el-menu-item>
        <el-menu-item index="boards">看板 (Boards)</el-menu-item>
        <el-menu-item index="boards-recent" class="menu-subitem">
          ↳ 最近一周
        </el-menu-item>
        <el-menu-item index="tags">标签与工作流 (Tags)</el-menu-item>
        <el-menu-item index="settings">设置 (Settings)</el-menu-item>
      </el-menu>
    </nav>
    <div class="sidebar-spacer"></div>
    <div class="theme-toggle">
      <el-button-group class="theme-toggle-group">
        <el-button
          class="theme-option"
          :class="{ 'theme-option--active': theme === 'light' }"
          text
          @click="setTheme('light')"
        >
          日间
        </el-button>
        <el-button
          class="theme-option"
          :class="{ 'theme-option--active': theme === 'dark' }"
          text
          @click="setTheme('dark')"
        >
          夜间
        </el-button>
      </el-button-group>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTheme } from "../composables/useTheme";

const router = useRouter();
const route = useRoute();
const { theme, setTheme } = useTheme();

const activeKey = computed(() => {
  if (route.path.startsWith("/workspace")) return "workspaces";
  if (route.path.startsWith("/board")) return "boards";
  if (route.path.startsWith("/workflow")) return "tags";
  if (route.path.startsWith("/settings")) return "settings";
  return "";
});

const handleSelect = (index: string) => {
  switch (index) {
    case "workspaces":
      router.push("/workspace/workspace-management-view");
      break;
    case "boards":
    case "boards-recent":
      router.push("/board/kanban-board-view");
      break;
    case "tags":
      router.push("/workflow/tag-workflow-view");
      break;
    case "settings":
      router.push("/settings/global-settings-view");
      break;
    default:
      break;
  }
};
</script>

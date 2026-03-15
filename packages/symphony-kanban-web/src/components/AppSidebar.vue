<template>
  <aside class="app-sidebar">
    <div class="sidebar-title">Symphony 看板</div>
    <div class="sidebar-space"></div>
    <nav class="nav-menu">
      <el-button
        v-for="item in navItems"
        :key="item.key"
        class="nav-item"
        text
        :class="{ 'nav-item--active': activeKey === item.key }"
        @click="router.push(item.path)"
      >
        {{ item.label }}
      </el-button>
      <el-button
        class="nav-subitem"
        text
        :class="{ 'nav-subitem--active': isBoardRoute }"
        @click="router.push(boardSubitem.path)"
      >
        {{ boardSubitem.label }}
      </el-button>
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

const navItems = [
  {
    key: "workspaces",
    label: "工作区 (Workspaces)",
    path: "/workspace/workspace-management-view",
  },
  {
    key: "boards",
    label: "看板 (Boards)",
    path: "/board/kanban-board-view",
  },
  {
    key: "tags",
    label: "标签与工作流 (Tags)",
    path: "/workflow/tag-workflow-view",
  },
  {
    key: "settings",
    label: "设置 (Settings)",
    path: "/settings/global-settings-view",
  },
];

const boardSubitem = {
  label: "↳ 最近一周",
  path: "/board/kanban-board-view",
};

const activeKey = computed(() => {
  if (route.path.startsWith("/workspace")) return "workspaces";
  if (route.path.startsWith("/board")) return "boards";
  if (route.path.startsWith("/workflow")) return "tags";
  if (route.path.startsWith("/settings")) return "settings";
  return "";
});

const isBoardRoute = computed(() => route.path.startsWith("/board"));
</script>

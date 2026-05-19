<template>
  <aside class="app-sidebar">
    <div class="sidebar-brand">
      <span class="brand-mark" aria-hidden="true"></span>
      <div>
        <div class="sidebar-title">Symphony</div>
        <div class="sidebar-caption">Kanban</div>
      </div>
    </div>
    <nav class="nav-menu">
      <el-menu
        class="sidebar-menu"
        :default-active="activeKey"
        :collapse="false"
        :unique-opened="true"
        @select="handleSelect"
      >
        <el-menu-item index="workspaces">
          <span class="menu-icon menu-icon--workspace" aria-hidden="true"></span>
          工作区
        </el-menu-item>
        <el-menu-item index="boards">
          <span class="menu-icon menu-icon--board" aria-hidden="true"></span>
          看板
        </el-menu-item>
        <el-menu-item index="tags">
          <span class="menu-icon menu-icon--workflow" aria-hidden="true"></span>
          工作流
        </el-menu-item>
        <el-menu-item index="bounties">
          <span class="menu-icon menu-icon--bounty" aria-hidden="true"></span>
          规划
        </el-menu-item>
        <el-menu-item index="settings">
          <span class="menu-icon menu-icon--settings" aria-hidden="true"></span>
          设置
        </el-menu-item>
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
          浅色
        </el-button>
        <el-button
          class="theme-option"
          :class="{ 'theme-option--active': theme === 'dark' }"
          text
          @click="setTheme('dark')"
        >
          深色
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
  if (route.path.startsWith("/workspaces")) return "workspaces";
  if (route.path.startsWith("/board")) return "boards";
  if (route.path.startsWith("/workflow")) return "tags";
  if (route.path.startsWith("/bounties")) return "bounties";
  if (route.path.startsWith("/settings")) return "settings";
  return "";
});

const handleSelect = (index: string) => {
  switch (index) {
    case "workspaces":
      router.push("/workspaces");
      break;
    case "boards":
    case "boards-recent":
      router.push("/board");
      break;
    case "tags":
      router.push("/workflow");
      break;
    case "bounties":
      router.push("/bounties");
      break;
    case "settings":
      router.push("/settings");
      break;
    default:
      break;
  }
};
</script>

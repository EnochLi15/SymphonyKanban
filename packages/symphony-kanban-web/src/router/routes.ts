import type { RouteRecordRaw } from "vue-router";

export const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/board" },
  {
    path: "/board",
    name: "board",
    component: () => import("../pages/board/kanban-board-view.vue"),
  },
  {
    path: "/board/priority",
    name: "board-priority",
    component: () => import("../pages/board/priority-view.vue"),
  },
  {
    path: "/issues/:id",
    name: "issues-detail",
    component: () => import("../pages/issues/issue-detail-view.vue"),
  },
  {
    path: "/sessions/:id",
    name: "sessions-run",
    component: () => import("../pages/sessions/web-session-run.vue"),
  },
  {
    path: "/reviews/:id",
    name: "reviews-detail",
    component: () => import("../pages/review/review-view.vue"),
  },
  {
    path: "/errors/:id",
    name: "errors-detail",
    component: () => import("../pages/errors/blocked-error-handling-view.vue"),
  },
  {
    path: "/workflow",
    name: "workflow",
    component: () => import("../pages/workflow/tag-workflow-view.vue"),
  },
  {
    path: "/workspaces",
    name: "workspaces",
    component: () => import("../pages/workspace/workspace-management-view.vue"),
  },
  {
    path: "/workspaces/:id",
    name: "workspaces-detail",
    component: () => import("../pages/workspace/workspace-settings-view.vue"),
  },
  {
    path: "/tasks/new",
    name: "tasks-new",
    component: () => import("../pages/tasks/create-task-modal.vue"),
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("../pages/settings/global-settings-view.vue"),
  },
];

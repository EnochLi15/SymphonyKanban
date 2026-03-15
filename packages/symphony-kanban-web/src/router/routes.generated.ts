import type { RouteRecordRaw } from "vue-router";

export const generatedRoutes: RouteRecordRaw[] = [
  { path: "/", redirect: "/board/kanban-board-view" },
  { path: "/board", redirect: "/board/kanban-board-view" },
  { path: "/sessions", redirect: "/sessions/web-session-run" },
  { path: "/review", redirect: "/review/review-view" },
  { path: "/errors", redirect: "/errors/blocked-error-handling-view" },
  { path: "/issues", redirect: "/issues/issue-detail-view" },
  { path: "/workflow", redirect: "/workflow/tag-workflow-view" },
  { path: "/workspace", redirect: "/workspace/workspace-management-view" },
  { path: "/tasks", redirect: "/tasks/create-task-modal" },
  { path: "/settings", redirect: "/settings/global-settings-view" },
  {
    path: "/board/symphony-kanban",
    name: "board-symphony-kanban",
    component: () => import("../pages/board/symphony-kanban.vue"),
  },
  {
    path: "/board/kanban-board-view",
    name: "board-kanban-board-view",
    component: () => import("../pages/board/kanban-board-view.vue"),
  },
  {
    path: "/board/priority-view",
    name: "board-priority-view",
    component: () => import("../pages/board/priority-view.vue"),
  },
  {
    path: "/sessions/web-session-run",
    name: "sessions-web-session-run",
    component: () => import("../pages/sessions/web-session-run.vue"),
  },
  {
    path: "/review/review-view",
    name: "review-review-view",
    component: () => import("../pages/review/review-view.vue"),
  },
  {
    path: "/errors/blocked-error-handling-view",
    name: "errors-blocked-error-handling-view",
    component: () => import("../pages/errors/blocked-error-handling-view.vue"),
  },
  {
    path: "/issues/issue-detail-view",
    name: "issues-issue-detail-view",
    component: () => import("../pages/issues/issue-detail-view.vue"),
  },
  {
    path: "/workflow/tag-workflow-view",
    name: "workflow-tag-workflow-view",
    component: () => import("../pages/workflow/tag-workflow-view.vue"),
  },
  {
    path: "/workspace/workspace-management-view",
    name: "workspace-workspace-management-view",
    component: () => import("../pages/workspace/workspace-management-view.vue"),
  },
  {
    path: "/workspace/workspace-settings-view",
    name: "workspace-workspace-settings-view",
    component: () => import("../pages/workspace/workspace-settings-view.vue"),
  },
  {
    path: "/tasks/create-task-modal",
    name: "tasks-create-task-modal",
    component: () => import("../pages/tasks/create-task-modal.vue"),
  },
  {
    path: "/settings/global-settings-view",
    name: "settings-global-settings-view",
    component: () => import("../pages/settings/global-settings-view.vue"),
  },
];

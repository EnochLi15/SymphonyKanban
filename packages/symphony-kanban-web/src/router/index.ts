import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { generatedRoutes } from "./routes.generated";

const routes: RouteRecordRaw[] = generatedRoutes;

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

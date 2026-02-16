// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import { useSystemStore } from "@/stores/system.store";

const routes = [
  {
    path: "/setup",
    name: "setup",
    component: () => import("@/views/setup/index.vue"),
  },
  {
    path: "/",
    name: "home",
    component: () => import("@/views/home/index.vue"),
  },
  {
    path: "/show",
    name: "show",
    component: () => import("@/views/show/index.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

/**
 * router.beforeEach: 全局前置守卫
 * 每次路由跳转（切换 URL）之前都会触发这个函数
 */
router.beforeEach(async (to) => {
  const systemStore = useSystemStore();
  const initialized = await systemStore.checkStatus();

  if (!initialized) {
    /**
     * 情况 A: 系统未初始化
     */
    if (to.name !== "setup") {
      // 如果你要去的不是 setup 页面，强制拦截并跳转到 setup
      return { name: "setup" };
    } else {
      // 如果已经在去 setup 的路上了，直接放行
      return true;
    }
  } else {
    /**
     * 情况 B: 系统已初始化
     */
    if (to.name === "setup") {
      // 如果已经初始化了，还想回 setup 页面，强制跳转到 home 页面
      return { name: "home" };
    } else {
      // 去其他页面（如 home、show），直接放行
      return true;
    }
  }
});

export default router;

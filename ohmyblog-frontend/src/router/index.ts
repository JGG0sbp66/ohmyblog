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
router.beforeEach(async (to, from, next) => {
  const systemStore = useSystemStore();
  const initialized = await systemStore.checkStatus();

  if (!initialized) {
    /**
     * 情况 A: 系统未初始化
     */
    if (to.name !== "setup") {
      // 如果你要去的不是 setup 页面，强制拦截并跳转到 setup
      return next({ name: "setup" });
    } else {
      // 如果已经在去 setup 的路上了，直接放行
      return next();
    }
  } else {
    /**
     * 情况 B: 系统已初始化
     */
    if (to.name === "setup") {
      // TODO: 后续修改为home页面
      // 如果已经初始化了，还想回 setup 页面，强制踢到 show 页面
      return next({ name: "show" });
    } else {
      // 去其他页面（如 show），直接放行
      return next();
    }
  }
});

export default router;

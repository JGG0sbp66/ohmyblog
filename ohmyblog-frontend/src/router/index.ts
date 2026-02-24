// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { useSystemStore } from "@/stores/system.store";

const routes = [
  // 初始化安装路由
  {
    path: "/setup",
    name: "setup",
    component: () => import("@/views/setup/Setup.page.vue"),
  },
  // 前台展示业务路由
  {
    path: "/",
    component: () => import("@/views/main/components/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "home",
        alias: "home",
        component: () => import("@/views/main/pages/Home.page.vue"),
      },
      {
        path: "archive",
        name: "archive",
        component: () => import("@/views/main/pages/Archive.page.vue"),
      },
      {
        path: "about",
        name: "about",
        component: () => import("@/views/main/pages/About.page.vue"),
      },
    ],
  },
  // Admin 后台管理路由
  {
    path: "/admin",
    meta: { requiresAdmin: true },
    component: () => import("@/views/admin/components/AdminLayout.vue"),
    children: [
      {
        path: "",
        name: "dashboard",
        alias: "dashboard",
        component: () => import("@/views/admin/pages/Dashboard.page.vue"),
      },
    ],
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
  const authStore = useAuthStore();
  const initialized = await systemStore.checkStatus();

  // 1) 系统未初始化：除 setup 外全部重定向到 setup
  if (!initialized) {
    return to.name === "setup" ? true : { name: "setup" };
  }

  // 2) 系统已初始化：禁止再进入 setup
  if (to.name === "setup") {
    return { name: "home" };
  }

  // 3) 需要管理员权限的路由
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);
  if (requiresAdmin) {
    if (!authStore.user) {
      await authStore.fetchMe();
    }

    if (!authStore.isAdmin) {
      return { name: "home" };
    }
  }

  // 4) 其余情况直接放行
  return true;
});

export default router;

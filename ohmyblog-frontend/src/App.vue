<!-- src/App.vue -->
<script setup lang="ts">
import { onMounted, watch, ref } from "vue";
import { useTheme } from "@/composables/theme.hook";
import { useAuthStore } from "@/stores/auth.store";
import { useSystemStore } from "@/stores/system.store";

const { initThemeConfig } = useTheme();
const authStore = useAuthStore();
const systemStore = useSystemStore();

/**
 * 是否已经加载过首屏核心业务数据。
 * 防止在系统初始化完成瞬间（Watch 触发）与首屏挂载（onMounted 触发）发生并发请求。
 */
const isAppDataLoaded = ref(false);

/**
 * 初始化应用业务数据
 * 仅在系统已初始化（initialized = true）时，拉取登录态、外观及站点信息。
 */
const initAppData = async () => {
  if (!systemStore.initialized || isAppDataLoaded.value) return;

  // 1) 同步系统配置与用户状态（并行请求，减少等待时间）
  await Promise.allSettled([
    authStore.fetchMe(), // 拉取当前用户信息
    initThemeConfig(), // 同步服务器预设外观设置
    systemStore.fetchSiteInfo(), // 拉取站点元数据 (Title, Favicon等)
    systemStore.fetchPersonalInfo(), // 拉取博主基本信息 (Avatar, Hero等)
  ]);

  isAppDataLoaded.value = true;
};

onMounted(async () => {
  // 1. 优先获取系统健康/初始化状态（路由守卫已触发过，此处会优先走 Store 缓存）
  await systemStore.checkStatus();

  // 2. 如果已初始化，则加载业务数据
  await initAppData();
});

/**
 * 监听初始化状态的变化。
 * 核心场景：用户刚完成 Setup 安装流程，状态从 false/null 变为 true。
 * 此时触发 initAppData 会让应用无感同步站点配置（如标题、主题等），无需强制刷新容器。
 */
watch(
  () => systemStore.initialized,
  (isInitialized) => {
    if (isInitialized) {
      void initAppData();
    }
  },
);
</script>

<template>
  <router-view />
</template>

<!-- src/App.vue -->
<script setup lang="ts">
import { onMounted } from "vue";
import { useTheme } from "@/composables/theme.hook";
import { useSystemStore } from "@/stores/system.store";

const { initThemeConfig } = useTheme();
const systemStore = useSystemStore();

onMounted(() => {
  // 初始化主题配置，从服务器同步外观设置
  initThemeConfig();

  // 获取站点基本信息（如标题等）
  systemStore.fetchSiteInfo();

  // 获取个性化配置（如头像等）
  systemStore.fetchPersonalInfo();
});
</script>

<template>
  <router-view />
</template>

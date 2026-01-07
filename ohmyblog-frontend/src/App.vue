<!-- src/App.vue -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useTheme } from '@/composables/theme.hook';

const { initThemeConfig } = useTheme();

onMounted(() => {
  // 初始化主题配置，从服务器同步外观设置
  initThemeConfig();

  const link = document.getElementById('dynamic-favicon') as HTMLLinkElement
  if (link) {
    // Vue 启动后，立即给它打上时间戳补丁
    link.href = `/api/uploads/system/favicon.png?v=${Date.now()}`
  }
});
</script>

<template>
  <router-view />
</template>
<!-- src/App.vue -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useTheme } from '@/composables/theme.hook';

const { initThemeConfig } = useTheme();

onMounted(() => {
  // 初始化主题配置，从服务器同步外观设置
  initThemeConfig();
});
</script>

<template>
  <router-view />
</template>
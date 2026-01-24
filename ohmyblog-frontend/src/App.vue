<!-- src/App.vue -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useTheme } from '@/composables/theme.hook';

const { initThemeConfig } = useTheme();

onMounted(() => {
  // 初始化主题配置，从服务器同步外观设置
  initThemeConfig();

  // TODO: 逻辑应该修改为
  // 1. 当管理员修改了网站的icon，才去更新 favicon 链接
  // 2. 防止每次请求都会导致浏览器重新下载icon，产生性能问题

  // const link = document.getElementById('dynamic-favicon') as HTMLLinkElement
  // if (link) {
  //   // Vue 启动后，立即给它打上时间戳补丁
  //   link.href = `/api/uploads/system/favicon.png?v=${Date.now()}`
  // }
});
</script>

<template>
  <router-view />
</template>
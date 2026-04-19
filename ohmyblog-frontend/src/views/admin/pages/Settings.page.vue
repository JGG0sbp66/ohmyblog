<!-- src/views/admin/pages/Settings.page.vue -->
<!-- TODO: 实现设置页面功能 -->
<script setup lang="ts">
import { ref } from "vue";

// 页面标题
const pageTitle = ref("设置");
</script>

<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold text-fg mb-6">{{ pageTitle }}</h1>
    <div class="bg-bg-card rounded-2xl p-6 shadow-sm">
      <p class="text-fg-muted">设置页面 - 开发中...</p>
    </div>
  </div>
</template>

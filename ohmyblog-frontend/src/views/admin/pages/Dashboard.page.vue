<!-- src/views/admin/pages/Dashboard.page.vue -->
<script setup lang="ts">
/**
 * // TODO: 后台管理仪表盘（开发中）
 * 目前仅作为占位页面，提供返回首页的简单跳转
 */
import { useRouter } from "vue-router";

const router = useRouter();

// 返回前台首页
const goHome = () => router.push("/");
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
    <h1 class="text-2xl font-bold">这里是后台管理页面</h1>
    <p class="text-gray-500 italic">功能正在开发中...</p>

    <button
      @click="goHome"
      class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
    >
      返回首页
    </button>
  </div>
</template>

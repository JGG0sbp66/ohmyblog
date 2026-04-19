<!-- src/views/admin/components/AdminLayout.vue -->
<script setup lang="ts">
import AdminSidebar from "./AdminSidebar.vue";
import AdminHeader from "./AdminHeader.vue";
</script>

<template>
  <div class="min-h-screen flex flex-col bg-bg">
    <!-- 顶部栏 - 圆角卡片样式 -->
    <AdminHeader />

    <!-- 下方内容区 - 圆角卡片样式 -->
    <div class="flex-1 flex gap-4 min-h-0 pr-4 pb-4 pt-4">
      <!-- 侧边栏 -->
      <AdminSidebar />

      <!-- 主内容区 -->
      <main class="flex-1 p-6 overflow-y-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

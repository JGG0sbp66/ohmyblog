<!-- src/views/admin/components/AdminLayout.vue -->
<script setup lang="ts">
import AdminSidebar from "./AdminSidebar.vue";
import AdminHeader from "./AdminHeader.vue";
</script>

<template>
  <div class="h-screen flex flex-col bg-bg">
    <!-- 顶部栏 - 圆角卡片样式 -->
    <AdminHeader />

    <!-- 下方内容区 - 圆角卡片样式 -->
    <div class="flex-1 flex gap-4 min-h-0 pr-4 pb-4 pt-4 overflow-hidden">
      <!-- 侧边栏 -->
      <AdminSidebar class="h-full" />

      <!-- 主内容区 -->
      <main class="flex-1 p-6 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
        <div
          class="flex-1 flex flex-col min-h-0 onload-animation anim-delay-150"
        >
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

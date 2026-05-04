<!-- src/views/admin/components/AdminLayout.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import AdminSidebar from "./AdminSidebar.vue";
import AdminHeader from "./AdminHeader.vue";

const route = useRoute();
// 记录鼠标是否悬停在顶部栏，用于编辑器模式下的交互
const isHeaderHovered = ref(false);

// 判断当前是否处于文章编辑模式，根据路由名称判断
const isEditorMode = computed(() => route.name === "post-edit");
</script>

<template>
  <div class="h-screen flex flex-col bg-bg">
    <!-- 顶部栏容器：
         1. 在编辑器模式下默认收缩，通过 transform 向上移动隐藏大部分内容
         2. 当鼠标悬停时，恢复正常位置
         3. 非编辑器模式下固定在正常位置 -->
    <div
      :class="[
        'shrink-0 z-50 h-18',
        isEditorMode && !isHeaderHovered ? '-translate-y-[calc(100%-12px)]' : 'translate-y-0',
        'transition-all duration-300 ease-in-out transform',
      ]"
      @mouseenter="isHeaderHovered = true"
      @mouseleave="isHeaderHovered = false"
    >
      <AdminHeader />
    </div>

    <!-- 下方内容区 - 圆角卡片样式 -->
    <div
      :class="[
        'flex-1 flex min-h-0 overflow-hidden transition-all duration-300 ease-in-out',
        isEditorMode && !isHeaderHovered ? '-mt-18 pt-3' : '',
      ]"
    >
      <!-- 侧边栏 -->
      <AdminSidebar class="mb-4" />

      <!-- 主内容区 -->
      <main
        class="flex-1 p-6 pt-3 flex flex-col min-h-0 overflow-y-auto custom-scrollbar"
      >
        <div
          class="flex-1 flex flex-col min-h-0 onload-animation anim-delay-150"
        >
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

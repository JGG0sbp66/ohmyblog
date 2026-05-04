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
         1. 在编辑器模式下默认收缩为 1.5 (h-1.5) 的细条，以腾出更多编辑空间
         2. 当鼠标悬停时，展开为正常高度 (h-18)
         3. 非编辑器模式下固定为正常高度 -->
    <div
      :class="[
        'shrink-0 overflow-hidden',
        isEditorMode && !isHeaderHovered ? 'h-1.5' : 'h-18',
        'transition-all duration-300 ease-in-out',
      ]"
      @mouseenter="isHeaderHovered = true"
      @mouseleave="isHeaderHovered = false"
    >
      <AdminHeader />
    </div>

    <!-- 下方内容区 - 圆角卡片样式 -->
    <div class="flex-1 flex gap-4 min-h-0 pr-4 pb-4 overflow-hidden">
      <!-- 侧边栏 -->
      <AdminSidebar class="h-full" />

      <!-- 主内容区 -->
      <main
        class="flex-1 p-6 flex flex-col min-h-0 overflow-y-auto custom-scrollbar"
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

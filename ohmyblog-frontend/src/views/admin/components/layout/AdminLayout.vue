<!-- src/views/admin/components/AdminLayout.vue -->
<!--
  后台响应式布局：
  - 桌面端使用 Header + hover Sidebar + 主内容区；
  - 移动端使用常驻 Header + 导航抽屉，并由本组件统一管理抽屉状态；
  - 文章编辑页仅在支持桌面布局时启用 Header hover 收缩。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useIsMobile } from "@/composables/breakpoint.hook";
import AdminSidebar from "./AdminSidebar.vue";
import AdminHeader from "./AdminHeader.vue";

const route = useRoute();
const isMobile = useIsMobile();

// 移动端侧边栏抽屉状态由顶层布局统一持有。
const isMobileMenuOpen = ref(false);

// 记录鼠标是否悬停在顶部栏，用于编辑器模式下的交互。
const isHeaderHovered = ref(false);

// 判断当前是否处于文章编辑模式，根据路由名称判断。
const isEditorMode = computed(() => route.name === "post-edit");

// 触屏端不使用依赖 hover 的收缩交互，始终显示完整顶部栏。
const shouldCollapseHeader = computed(
  () => isEditorMode.value && !isMobile.value && !isHeaderHovered.value,
);

const openMobileMenu = () => {
  isMobileMenuOpen.value = true;
};

// 路由变化时关闭抽屉，兼容菜单跳转和浏览器前进/后退。
watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false;
  },
);

// 离开移动断点（缩放/旋转到桌面宽度）时清理抽屉状态，
// 避免再次缩回小屏时残留的打开状态让抽屉自动重现。
watch(isMobile, (mobile) => {
  if (!mobile) isMobileMenuOpen.value = false;
});
</script>

<template>
  <div class="h-screen h-dvh flex flex-col bg-bg">
    <!-- 顶部栏容器：桌面编辑器模式下可通过 hover 展开，移动端始终完整显示。 -->
    <div
      :class="[
        'shrink-0 z-50 h-auto md:h-18',
        shouldCollapseHeader
          ? '-translate-y-[calc(100%-12px)]'
          : 'translate-y-0',
        'transition-all duration-300 ease-in-out transform',
      ]"
      @mouseenter="isHeaderHovered = true"
      @mouseleave="isHeaderHovered = false"
    >
      <AdminHeader @open-menu="openMobileMenu" />
    </div>

    <!-- 下方内容区 - 圆角卡片样式 -->
    <div
      :class="[
        'flex-1 flex min-h-0 overflow-hidden transition-all duration-300 ease-in-out',
        shouldCollapseHeader ? '-mt-18 pt-3' : '',
      ]"
    >
      <!-- 侧边栏 -->
      <AdminSidebar
        :mobile-open="isMobileMenuOpen"
        @close="isMobileMenuOpen = false"
      />

      <!-- 主内容区 -->
      <main
        class="flex-1 p-3 pt-3 md:p-6 md:pt-3 flex flex-col min-w-0 min-h-0 overflow-y-auto custom-scrollbar"
      >
        <div
          class="flex-1 flex flex-col min-w-0 min-h-0 onload-animation anim-delay-150"
        >
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

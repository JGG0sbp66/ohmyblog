<!-- src/views/admin/components/AdminLayout.vue -->
<!--
  ============================================================================
  TODO[移动端适配 · 总纲]：后台目前是桌面三段式布局（顶部 Header + 左 Sidebar + 右 main），
  下面的子组件各自有更细的 TODO。整体适配思路如下，作为索引：

  1. 断点判断统一用 VueUse 的 useBreakpoints，不要手写 window.matchMedia。
     建议新建 src/composables/breakpoint.hook.ts：
       import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";
       export function useIsMobile() {
         const bp = useBreakpoints(breakpointsTailwind);
         return bp.smaller("md"); // < 768px 视为移动端，返回响应式 Ref<boolean>
       }
     说明：breakpointsTailwind 的断点值（md=768px 等）与本项目 Tailwind v4 默认断点一致，
     若以后在 tailwind.css 的 @theme 里自定义了 --breakpoint-*，记得这里同步成自定义对象。

  2. 形态切换原则：能用纯 CSS（Tailwind 响应式前缀 md: / max-md:）解决的就用 CSS；
     只有「交互逻辑分叉」（hover 展开 vs 抽屉、并排 vs 二级导航）才用 JS 的 useIsMobile 判断。

  3. 本组件需要承载“移动端侧边栏抽屉”的开合状态，向下传给 Sidebar 和 Header：
       const isMobileMenuOpen = ref(false);
     - Header 里的汉堡按钮 -> isMobileMenuOpen = true
     - Sidebar 作为抽屉时，点遮罩 / 点菜单项 -> isMobileMenuOpen = false
     - 路由切换（watch route）时自动关闭抽屉。

  4. 编辑器模式那套 hover 收缩 Header 的交互（isHeaderHovered）在触屏上不可用，
     移动端需降级为常驻显示或用按钮切换，见下方 isEditorMode 相关 TODO。
  ============================================================================
-->
<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import AdminSidebar from "./AdminSidebar.vue";
import AdminHeader from "./AdminHeader.vue";

// TODO[移动端适配]：在此引入 useIsMobile()，并新增 isMobileMenuOpen 抽屉开合状态，
// 通过 props/emit 或 provide/inject 下发给 AdminHeader（汉堡按钮）与 AdminSidebar（抽屉）。
// 同时 watch(route) 在路由变化时把 isMobileMenuOpen 置回 false，避免跳转后抽屉还开着。

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
        isEditorMode && !isHeaderHovered
          ? '-translate-y-[calc(100%-12px)]'
          : 'translate-y-0',
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

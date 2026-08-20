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
import { useResizeObserver } from "@vueuse/core";
import { useIsMobile } from "@/composables/breakpoint.hook";
import {
  useEditorHeaderState,
  HEADER_SLIVER_PX,
} from "@/composables/editor-header.hook";
import { useLang } from "@/composables/lang.hook";
import AdminSidebar from "./AdminSidebar.vue";
import AdminHeader from "./AdminHeader.vue";
import DemoNoticeModal from "./DemoNoticeModal.vue";

const route = useRoute();
const isMobile = useIsMobile();
const { t } = useLang();

// 移动端编辑页的收起信号（滚动方向 + 编辑器聚焦），由 PostEditorContent 写入
const {
  collapsed: editorCollapsed,
  progress: editorProgress,
  expand: expandHeader,
} = useEditorHeaderState();

// 移动端侧边栏抽屉状态由顶层布局统一持有。
const isMobileMenuOpen = ref(false);

// 记录鼠标是否悬停在顶部栏，用于编辑器模式下的交互。
const isHeaderHovered = ref(false);

// 判断当前是否处于文章编辑模式，根据路由名称判断。
const isEditorMode = computed(() => route.name === "post-edit");

// 编辑页收起顶部栏，把垂直空间让给正文。两端触发源不同：
// - 桌面端：hover 展开（默认收起），鼠标能精确够到那条 12px 提示条；
// - 移动端：没有 hover，改由滚动方向 + 编辑器聚焦驱动（见 editor-header.hook.ts）。
const shouldCollapseHeader = computed(() => {
  if (!isEditorMode.value) return false;
  return isMobile.value ? editorCollapsed.value : !isHeaderHovered.value;
});

/** 收起后露出的那条是否要承载进度条与点击展开（仅移动端编辑页） */
const showHeaderSliver = computed(() => isMobile.value && isEditorMode.value);

const headerRef = ref<HTMLElement | null>(null);
const headerHeight = ref(0);

useResizeObserver(headerRef, (entries) => {
  const el = entries[0]?.target as HTMLElement | undefined;
  if (el) headerHeight.value = el.offsetHeight;
});

/**
 * 移动端收起时内容区上移的距离。
 *
 * 桌面端沿用类名里的 -mt-18（头部恒为 md:h-18 = 72px）；移动端**不能**照抄这个
 * 硬编码值 —— 编辑页的顶部栏是两行（第二行是 PostsLayout teleport 进去的 PostsNav），
 * 实际约 123px，且高度随第二行有无变化，必须实测。
 * 顶部栏本身用的是百分比位移（translate-y-[calc(100%-12px)]），天然自适应。
 */
const mobileShiftStyle = computed(() => {
  if (!isMobile.value || !shouldCollapseHeader.value) return undefined;
  const shift = Math.max(0, headerHeight.value - HEADER_SLIVER_PX);
  return { marginTop: `-${shift}px` };
});

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
  <!-- h-full（= 100% of ICB）而不是 h-dvh：见 tailwind.css 里 html/body/#app 那段。
       dvh 不随虚拟键盘收缩，配 interactive-widget=resizes-content 会让根节点比视口高，
       于是 body 产生滚动、手势滚的变成整个窗口而不是编辑器。 -->
  <div class="h-full flex flex-col bg-bg">
    <!-- 演示模式提示：仅演示站的游客会看到，自身控制显示时机 -->
    <DemoNoticeModal />

    <!-- 顶部栏容器：桌面编辑器模式下 hover 展开，移动端编辑页由滚动 / 聚焦驱动。 -->
    <div
      ref="headerRef"
      :class="[
        'relative shrink-0 z-50 h-auto md:h-18',
        shouldCollapseHeader
          ? '-translate-y-[calc(100%-12px)]'
          : 'translate-y-0',
        'transition-all duration-300 ease-in-out transform',
      ]"
      @mouseenter="isHeaderHovered = true"
      @mouseleave="isHeaderHovered = false"
    >
      <AdminHeader @open-menu="openMobileMenu" />

      <!--
        收起后仍露在屏幕上的那 12px。桌面端它只是个 hover 靶子，移动端没有 hover，
        于是让它同时承担两件事：显示正文滚动进度（被牺牲的高度换来一个新信息），
        以及点一下把顶部栏拉回来。
        仅在收起时才接收点击，展开状态下不能挡住 header 自己的按钮。

        z-20 是必需的：AdminHeader 的根元素是 relative z-10，不显式抬高层级的话
        进度条会被卡片背景盖住，只在底部两个圆角（rounded-b-2xl）背景弯走的地方
        露出两小段。
        px-3 让线的两端避开那 16px 圆角，不至于压在弯角上。
      -->
      <div
        v-if="showHeaderSliver"
        class="absolute inset-x-0 bottom-0 z-20 flex h-3 items-center px-3"
        :class="
          shouldCollapseHeader ? 'pointer-events-auto' : 'pointer-events-none'
        "
        role="button"
        :aria-label="t('components.common.admin.AdminHeader.actions.expand')"
        @click="expandHeader"
      >
        <div
          class="h-0.5 rounded-full bg-accent transition-[width,opacity] duration-150 ease-out"
          :class="shouldCollapseHeader ? 'opacity-100' : 'opacity-0'"
          :style="{ width: `${Math.round(editorProgress * 100)}%` }"
        ></div>
      </div>
    </div>

    <!-- 下方内容区 - 圆角卡片样式 -->
    <div
      :class="[
        'flex-1 flex min-h-0 overflow-hidden transition-all duration-300 ease-in-out',
        // 桌面端保持原样；移动端的位移量必须实测，见 mobileShiftStyle
        shouldCollapseHeader && !isMobile ? '-mt-18 pt-3' : '',
      ]"
      :style="mobileShiftStyle"
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
        <!-- min-h-0 不能删：后台所有页面都钉在本层高度内、自行内部滚动。
             删掉它会让长内容页面（如邮件页的无限滚动列表）把本层撑高、
             滚动打落到 main 上退化成整页滚动（a81e33e3 曾因此翻车）。 -->
        <div
          class="flex-1 flex flex-col min-w-0 min-h-0 onload-animation anim-delay-150"
        >
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

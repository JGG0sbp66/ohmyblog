<!-- src/components/base/button/SidebarButton.vue -->
<script lang="ts" setup>
import { computed } from "vue";
import type { Component } from "vue";
import UnreadBadge from "@/components/base/tag/UnreadBadge.vue";

/**
 * SidebarButton - 侧边栏按钮组件
 *
 * Props:
 * - isActive: 是否处于激活状态（默认 false）
 * - isExpanded: 侧边栏是否展开（默认 false）
 * - icon: 图标组件（必填）
 * - text: 按钮文本（必填）
 * - iconSize: 图标大小（默认 24）
 * - iconStrokeWidth: 图标线条宽度（默认 2）
 */
const props = withDefaults(
  defineProps<{
    isActive?: boolean;
    isExpanded?: boolean;
    icon: Component;
    text: string;
    iconSize?: string | number;
    iconStrokeWidth?: string | number;
    badge?: number;
  }>(),
  {
    isActive: false,
    isExpanded: false,
    iconSize: "24",
    iconStrokeWidth: "2",
    badge: undefined,
  },
);

// 静态基础样式
const baseClass = `
  h-12 flex items-center
  rounded-xl
  transition-all duration-300
  overflow-hidden
  relative
  cursor-pointer
  before:content-['']
  before:absolute before:top-0 before:left-0
  before:w-full before:h-full
  before:rounded-xl
  before:bg-bg-muted
`;

// 动态样式 - 根据 props 计算
const dynamicClass = computed(() => {
  const classes = [];

  // 展开/收起状态的宽度
  if (props.isExpanded) {
    classes.push("w-full px-4");
  } else {
    classes.push("w-12 px-0");
  }

  // 激活状态或默认状态
  if (props.isActive) {
    // 激活态：背景层显示，文字高亮
    classes.push("before:opacity-100 before:scale-100", "text-accent");
  } else {
    // 默认态：背景层隐藏，hover 时显示
    classes.push(
      "before:opacity-0 before:scale-90",
      "text-fg",
      "hover:before:opacity-100 hover:before:scale-100",
      "hover:text-accent",
    );
  }

  // 点击反馈
  classes.push("active:scale-95 active:opacity-80");

  return classes.join(" ");
});

// 内容容器样式
const contentClass = "relative z-10 pointer-events-none";

// 图标容器 - 固定宽度，始终居中
const iconContainerClass = "w-12 flex items-center justify-center shrink-0";
</script>

<template>
  <button type="button" :class="[baseClass, dynamicClass]" :title="text">
    <!-- 图标容器 - 固定宽度保证图标位置不变 -->
    <div :class="iconContainerClass">
      <component
        :is="icon"
        :size="iconSize"
        :stroke-width="iconStrokeWidth"
        :class="contentClass"
      />
    </div>
    <!-- 文本 - 只在展开时显示 -->
    <Transition name="fade">
      <span
        v-if="isExpanded"
        :class="[contentClass, 'font-medium whitespace-nowrap']"
      >
        {{ text }}
      </span>
    </Transition>
    <!-- 未读气泡：收缩时小红点，展开时数字 -->
    <UnreadBadge
      v-if="badge !== undefined"
      :count="badge"
      :is-expanded="isExpanded"
    />
  </button>
</template>

<style scoped>
.fade-enter-active {
  transition: opacity 200ms;
}

.fade-leave-active {
  transition: opacity 150ms;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>

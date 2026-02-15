<!-- src/components/base/button/ButtonSecondary.vue -->
<script lang="ts" setup>
import { computed, useSlots } from "vue";

const slots = useSlots();

/**
 * ButtonSecondary - 次要按钮组件
 *
 * Props:
 * - isActive: 是否处于激活状态（默认 false）
 * - text: 按钮文本，可选
 * - block: 是否占满容器宽度（默认 false，自适应内容宽度）
 *
 * 插槽:
 * - default: 图标或其他内容，通常放在文本左侧
 */
const props = withDefaults(
  defineProps<{
    isActive?: boolean;
    text?: string;
    block?: boolean;
  }>(),
  { isActive: false, text: "", block: false },
);

// 检测是否有插槽内容
const hasSlot = computed(() => !!slots.default);

// 静态基础样式
const baseClass = `
  flex items-center justify-center
  min-h-full px-2 py-1.5
  leading-tight
  rounded-lg
  relative overflow-hidden
  bg-transparent
  before:content-['']
  before:absolute before:top-0 before:left-0
  before:w-full before:h-full
  before:rounded-lg
  before:bg-bg-muted
`;

// 动态样式 - 根据 props 计算
const dynamicClass = computed(() => {
  const classes = [];

  // 宽度模式
  classes.push(props.block ? "w-full" : "w-fit");

  // 激活状态或默认状态
  if (props.isActive) {
    // 激活态：背景层显示，文字高亮
    classes.push("before:opacity-100 before:scale-100", "text-fg-subtle");
  } else {
    // 默认态：背景层隐藏，hover 时显示
    classes.push(
      "before:opacity-0 before:scale-85",
      "text-fg",
      "hover:before:opacity-100 hover:before:scale-100",
      "hover:text-fg-subtle",
    );
  }

  // 点击反馈
  classes.push("active:scale-85 active:opacity-80");

  return classes.join(" ");
});

// 内容容器样式
const contentClass = "relative z-10 pointer-events-none";

// 图标间距：只有同时存在 slot 和 text 时才添加
const iconSpacing = computed(() => (hasSlot.value && props.text ? "mr-2" : ""));
</script>

<template>
  <button type="button" :class="[baseClass, dynamicClass]">
    <span v-if="hasSlot" :class="[contentClass, iconSpacing]">
      <slot></slot>
    </span>
    <span v-if="props.text" :class="contentClass">
      {{ props.text }}
    </span>
  </button>
</template>

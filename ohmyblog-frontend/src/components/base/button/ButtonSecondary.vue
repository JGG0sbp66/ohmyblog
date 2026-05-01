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
 * - disabled: 是否禁用（默认 false）
 * - gap: 图标与文本之间的间距级别（对应 tailwind gap-n，默认 "2"）
 *
 * 插槽:
 * - default: 图标或其他内容，通常放在文本左侧
 */
const props = withDefaults(
  defineProps<{
    isActive?: boolean;
    text?: string;
    disabled?: boolean;
    gap?: string;
  }>(),
  { isActive: false, text: "", disabled: false, gap: "2" },
);

// 检测是否有插槽内容
const hasSlot = computed(() => !!slots.default);

// 静态基础样式
const baseClass = `
  flex items-center justify-center
  w-fit min-h-full px-2 py-1.5
  leading-tight
  rounded-lg
  relative overflow-hidden
  bg-transparent
  cursor-pointer
  before:content-['']
  before:absolute before:top-0 before:left-0
  before:w-full before:h-full
  before:rounded-lg
  before:bg-bg-muted
`;

// 动态样式 - 根据 props 计算
const dynamicClass = computed(() => {
  const classes = [];

  // 禁用态：不响应 hover/active，保持弱化显示
  if (props.disabled) {
    classes.push(
      "before:opacity-0",
      "text-fg-muted",
      "opacity-50",
      "cursor-not-allowed",
    );
    return classes.join(" ");
  }

  // 激活状态或默认状态
  if (props.isActive) {
    // 激活态：背景层显示，文字高亮
    classes.push("before:opacity-100 before:scale-100", "text-fg-subtle");
  } else {
    // 默认态：背景层隐藏，hover 时显示
    classes.push(
      "before:opacity-0 before:scale-90",
      "text-fg",
      "hover:before:opacity-100 hover:before:scale-100",
      "hover:text-fg-subtle",
    );
  }

  // 点击反馈
  classes.push("active:scale-90 active:opacity-80");

  return classes.join(" ");
});

// 内容容器样式
const contentClass = "relative z-10 pointer-events-none";

// 计算间距样式
const gapClass = computed(() => {
  if (!hasSlot.value || !props.text) return "";
  return `gap-${props.gap}`;
});
</script>

<template>
  <button
    type="button"
    :disabled="props.disabled"
    :class="[baseClass, dynamicClass, gapClass]"
  >
    <span v-if="hasSlot" :class="contentClass">
      <slot></slot>
    </span>
    <span v-if="props.text" :class="contentClass">
      {{ props.text }}
    </span>
  </button>
</template>

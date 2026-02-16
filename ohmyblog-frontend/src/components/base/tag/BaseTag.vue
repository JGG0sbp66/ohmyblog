<!-- src/components/base/tag/BaseTag.vue -->
<script setup lang="ts">
import { computed } from "vue";
import Check from "@/components/icon/Check.vue";
import XCircle from "@/components/icon/XCircle.vue";

/**
 * 基础标签/药丸组件
 */
interface Props {
  /**
   * 标签类型（预设颜色）
   * primary: 主题色
   * success: 绿色
   * warn: 橙色
   * error: 红色
   * info: 灰色
   */
  type?: "primary" | "success" | "warn" | "error" | "info";
  /** 字体大小 */
  size?: "xs" | "sm";
}

const props = withDefaults(defineProps<Props>(), {
  type: "primary",
  size: "xs",
});

// 颜色映射
const typeClasses = {
  primary: "bg-accent/10 text-accent",
  success: "bg-green-500/10 text-green-500",
  warn: "bg-orange-500/10 text-orange-500",
  error: "bg-red-500/10 text-red-500",
  info: "bg-fg-subtle/10 text-fg-subtle",
};

// 大小映射
const sizeClasses = {
  xs: "text-[10px] py-0.5 px-1.5",
  sm: "text-xs py-0.5 px-2",
};

const classes = computed(() => {
  return [
    typeClasses[props.type],
    sizeClasses[props.size],
    "rounded-full flex items-center gap-1 font-medium w-fit shrink-0",
  ];
});
</script>

<template>
  <div :class="classes">
    <!-- 图标插槽 -->
    <slot name="icon">
      <Check v-if="type === 'success'" size-class="w-3 h-3" />
      <XCircle v-else-if="type === 'error'" size-class="w-3 h-3" />
    </slot>
    <!-- 默认文本插槽 -->
    <slot />
  </div>
</template>

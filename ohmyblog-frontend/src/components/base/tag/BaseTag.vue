<!-- src/components/base/tag/BaseTag.vue -->
<script setup lang="ts">
import { computed } from "vue";
import Check from "@/components/icon/tag/Check.vue";
import XCircle from "@/components/icon/tag/XCircle.vue";

/**
 * 基础标签/药丸组件
 */
interface Props {
  /**
   * 标签类型（预设颜色）
   * primary: 主题色  success: 绿色  warn: 橙色  error: 红色  info: 灰色
   * 不传则不附加任何颜色类，可通过 class 完全自定义颜色
   */
  type?: "primary" | "success" | "warn" | "error" | "info";
  /** 字体大小 */
  size?: "xs" | "sm";
  /** 是否显示图标（默认 true，设为 false 可去掉 success/error 自带图标） */
  showIcon?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: "xs",
  showIcon: true,
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
    props.type ? typeClasses[props.type] : undefined,
    sizeClasses[props.size],
    "rounded-full flex items-center gap-1 font-medium w-fit shrink-0",
  ].filter(Boolean);
});
</script>

<template>
  <div :class="classes">
    <!-- 图标插槽：showIcon=false 时完全跳过（不渲染 slot 也不渲染默认图标） -->
    <template v-if="showIcon">
      <slot name="icon">
        <Check v-if="type === 'success'" size-class="w-3 h-3" />
        <XCircle v-else-if="type === 'error'" size-class="w-3 h-3" />
      </slot>
    </template>
    <!-- 默认文本插槽 -->
    <slot />
  </div>
</template>

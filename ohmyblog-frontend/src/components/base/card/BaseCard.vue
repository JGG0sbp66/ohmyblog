<!-- src/components/base/card/BaseCard.vue -->
<script setup lang="ts">
/**
 * 基础卡片容器组件
 * 提供统一的卡片外观，不包含任何业务结构
 */
interface Props {
  /**
   * 内边距
   * - none: 无内边距
   * - sm: p-6 (1.5rem)
   * - default: p-8 (2rem)
   * @default 'default'
   */
  padding?: "none" | "sm" | "default";

  /**
   * 自定义类名（用于宽度、布局等扩展样式）
   */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  padding: "default",
  class: "",
});

// 内边距映射
const paddingClasses = {
  none: "",
  sm: "p-6",
  default: "p-8",
};
</script>

<template>
  <div
    :class="[
      'bg-bg-card rounded-3xl shadow-lg w-full',
      paddingClasses[padding],
      props.class,
    ]"
  >
    <slot />
  </div>
</template>

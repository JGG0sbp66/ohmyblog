<!-- src/components/base/tag/UnreadBadge.vue -->
<script setup lang="ts">
/**
 * UnreadBadge - 未读消息提示组件
 *
 * 两种形态：
 * - 收缩态 (isExpanded: false): icon 右上角小红点，无数字
 * - 展开态 (isExpanded: true):  文字后跟随的数字气泡
 */
defineProps<{
  count: number;
  isExpanded: boolean;
}>();
</script>

<template>
  <template v-if="count > 0">
    <!-- 收缩态：icon 右上角小红点 -->
    <span
      v-if="!isExpanded"
      class="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 z-20 ring-2 ring-bg-card"
    />
    <!-- 展开态：文字后数字气泡 -->
    <span
      v-else
      class="relative z-10 ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1 shrink-0 pointer-events-none"
    >
      {{ count > 99 ? "99+" : count }}
    </span>
  </template>
</template>

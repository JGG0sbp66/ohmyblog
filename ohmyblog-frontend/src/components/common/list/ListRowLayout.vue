<!-- 
  src/components/common/list/ListRowLayout.vue 
  列表编辑器中每一行的通用布局。处理内容与删除按钮的横向排列与对齐。
-->
<script setup lang="ts">
import DeleteButton from "@/components/common/button/DeleteButton.vue";

defineProps<{
  /** 按钮的提示文字 */
  deleteTitle?: string;
}>();

defineEmits<{
  (e: "remove"): void;
}>();
</script>

<template>
  <div class="flex items-start gap-3 w-full group">
    <!-- 业务内容插槽 -->
    <div class="flex-1 min-w-0">
      <slot />
    </div>

    <!-- 删除按钮：固定对齐于第一行 -->
    <DeleteButton :title="deleteTitle" @click="$emit('remove')" />
  </div>
</template>

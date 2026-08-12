<!-- 
  src/components/common/list/ListRowLayout.vue 
  列表编辑器中每一行的通用布局。处理内容与删除按钮的横向排列与对齐。

  可选开启 sortable：整行都是拖拽区（见 composables/list-drag.hook），外观不变，
  只是光标变成抓手、删除按钮被排除在拖拽外。行内的输入框请由宿主套 data-drag-hold，
  这样直接拖是选文字、按住一下再拖才是搬这一行。
-->
<script setup lang="ts">
import DeleteButton from "@/components/common/button/DeleteButton.vue";

defineProps<{
  /** 按钮的提示文字 */
  deleteTitle?: string;
  /** 是否可拖拽排序 */
  sortable?: boolean;
}>();

defineEmits<{
  (e: "remove"): void;
}>();
</script>

<template>
  <div
    class="flex items-start gap-3 w-full group"
    :class="sortable ? 'cursor-grab active:cursor-grabbing' : undefined"
  >
    <!-- 业务内容插槽 -->
    <div class="flex-1 min-w-0">
      <slot />
    </div>

    <!-- 删除按钮：固定对齐于第一行；可排序时排除拖拽，免得点删除变成拖行 -->
    <DeleteButton
      :data-no-drag="sortable ? '' : undefined"
      :title="deleteTitle"
      @click="$emit('remove')"
    />
  </div>
</template>

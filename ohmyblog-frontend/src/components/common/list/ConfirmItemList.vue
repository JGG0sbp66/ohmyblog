<!-- src/components/common/list/ConfirmItemList.vue -->
<script setup lang="ts">
/**
 * 弹窗列表容器组件
 * 负责统一的边框、最大高度、滚动条样式
 */
defineProps<{
  /** 列表项数据 */
  items: any[];
}>();
</script>

<template>
  <div class="border-y border-border/40 -mx-6 my-2">
    <ul class="max-h-52 overflow-y-auto divide-y divide-border/20">
      <template v-for="(item, index) in items" :key="item.key">
        <slot :item="item" :index="index" />
      </template>
    </ul>
  </div>
</template>

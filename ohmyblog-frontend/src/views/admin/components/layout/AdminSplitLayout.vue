<!--
  src/views/admin/components/layout/AdminSplitLayout.vue
  后台页面通用左右分栏布局
  - 左侧：固定宽度列表栏（宽度通过 leftWidth prop 配置，默认 w-100）
  - 右侧：flex-1 详情栏
  - 统一负责 BaseCard 包裹、分栏动画及竖向分隔线
  
  使用方：
    <AdminSplitLayout>
      <template #left>...</template>
      <template #right>...</template>
    </AdminSplitLayout>
-->
<script setup lang="ts">
import BaseCard from "@/components/base/card/BaseCard.vue";

withDefaults(
  defineProps<{
    /** 左侧栏宽度 Tailwind class，默认 w-100 */
    leftWidth?: string;
  }>(),
  {
    leftWidth: "w-100",
  },
);
</script>

<template>
  <BaseCard padding="none" class="flex-1 overflow-hidden flex onload-animation">
    <!-- 左侧列表栏 -->
    <div
      :class="[
        leftWidth,
        'border-r border-border/40 flex flex-col bg-bg-muted/10',
        'onload-animation anim-delay-100 z-10',
      ]"
    >
      <slot name="left" />
    </div>

    <!-- 右侧详情栏 -->
    <div class="flex-1 overflow-hidden onload-animation anim-delay-150">
      <slot name="right" />
    </div>
  </BaseCard>
</template>

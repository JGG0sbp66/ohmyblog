<!-- 
  src/views/main/components/hero/editors/title/HeroTitleEditorLayout.vue 
  Hero 标题编辑器的通用布局组件，统一管理头部标题、操作按钮和主体间距。
-->
<script setup lang="ts">
defineProps<{
  /** 模块标题，例如“主标题”或“副标题” */
  title: string;
}>();
</script>

<template>
  <div class="space-y-4">
    <!-- 头部区域：包含标题、计数 Tag 和 操作按钮 -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-bold tracking-widest text-fg-subtle uppercase">
          {{ title }}
        </h3>
        <!-- 标题旁边的额外内容，如计数 Tag -->
        <slot name="title-extra" />
      </div>

      <!-- 右侧操作区域，如添加按钮 -->
      <slot name="header-actions" />
    </div>

    <!-- 主体内容 -->
    <div class="relative">
      <slot />
    </div>

    <!-- 底部区域，如分页 -->
    <slot name="footer" />
  </div>
</template>

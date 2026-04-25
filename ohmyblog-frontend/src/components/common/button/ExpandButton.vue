<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>

<template>
  <!-- 
    1. w-fit: 宽度随内容自适应
    2. min-w-9: 初始状态保持正圆
    3. px-0: 初始无内边距，防止撑开
  -->
  <div
    class="group/expand inline-flex h-9 min-w-9 w-fit cursor-pointer items-center overflow-hidden rounded-full bg-black/60 text-white/75 transition-all duration-300 hover:bg-black/70 active:bg-black/80"
  >
    <!-- 图标容器：固定宽度，确保图标始终居中 -->
    <div class="flex h-9 w-9 shrink-0 items-center justify-center">
      <slot name="icon-start"></slot>
    </div>

    <!-- 
      文字容器：使用 Grid 动画实现从 0fr 到 1fr 的平滑过渡
    -->
    <div
      class="grid grid-cols-[0fr] opacity-0 transition-[grid-template-columns,opacity,padding] duration-300 ease-out group-hover/expand:grid-cols-[1fr] group-hover/expand:pr-4 group-hover/expand:opacity-100"
    >
      <!-- 内部必须包裹一层 overflow-hidden 的 div -->
      <div class="overflow-hidden">
        <span class="whitespace-nowrap text-[0.75rem] leading-none">
          {{ text }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped></style>

<template>
  <!-- 纯视觉容器：交互和语义由父组件透传 -->
  <div
    class="group inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white/75 transition-all duration-200 hover:w-28 hover:bg-black/70 active:bg-black/80"
  >
    <!-- icon1：常态下显示 -->
    <span class="text-[1.25rem]" aria-hidden="true">
      <slot name="icon-start"></slot>
    </span>
    <!-- hover 文案：常态收起，移入后在右侧展开 -->
    <span
      class="max-w-0 overflow-hidden whitespace-nowrap pl-0 text-[0.75rem] leading-none opacity-0 transition-all duration-200 group-hover:max-w-24 group-hover:pl-2 group-hover:opacity-100"
      aria-hidden="true"
    >
      <slot></slot>
    </span>
  </div>
</template>

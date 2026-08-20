<!-- 
  src/views/admin/components/settings/layout/SettingsPageLayout.vue 
  通用的配置页面布局组件。
  提供左侧预览、右侧滚动的标准结构，并内置 Viewport 扩展逻辑以防止阴影截断。
-->
<script setup lang="ts">
import { useIsMobile } from "@/composables/breakpoint.hook";

// 移动端显示区域过小，实时预览无参考意义，统一不渲染预览列，让配置表单占满整宽。
const isMobile = useIsMobile();
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-8 onload-animation min-h-0 flex-1">
    <!--
      左侧：展示/预览区域（移动端不渲染）
      min-w-0 必需：预览组件（如 BrowserMockup）内部有 ResizeObserver 写入的 px
      宽度，会经 intrinsic sizing 一路传递上来变成本列的 flex 自动最小宽度，
      导致侧边栏 hover 展开压缩主内容时本列拒绝收缩、整行内容被平移推出行外。
      不能用 overflow-hidden 替代：它同时会裁掉预览卡片溢出列外的阴影。
    -->
    <div v-if="!isMobile" class="flex-1 flex flex-col min-h-0 min-w-0">
      <slot name="preview" />
    </div>

    <!-- 
      右侧：配置表单区域 
      内置 Viewport 扩展方案：通过负 Margin 和 Padding 扩展裁剪区域，保护卡片阴影。
      出血量必须与 main 的 padding 联动（移动端 p-3 / 桌面 md:p-6）：
      写死 24px 会在移动端超出 main 的 12px padding，把 main 撑出水平滚动条。
    -->
    <div class="flex-1 lg:flex-none lg:w-120 flex flex-col min-h-0 relative">
      <div
        class="absolute inset-0 overflow-y-auto overflow-x-hidden -mx-3 px-3 -mb-3 pb-3 md:-mx-6 md:px-6 md:-mb-6 md:pb-6 scroll-smooth"
      >
        <div class="flex flex-col gap-8">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<!-- 
  src/views/admin/components/settings/layout/SettingsPageLayout.vue 
  通用的配置页面布局组件。
  提供左侧预览、右侧滚动的标准结构，并内置 Viewport 扩展逻辑以防止阴影截断。
-->
<template>
  <div class="flex flex-col lg:flex-row gap-8 onload-animation min-h-0 flex-1">
    <!-- 左侧：展示/预览区域 (通常不滚动) -->
    <div class="flex-1 flex flex-col min-h-0">
      <slot name="preview" />
    </div>

    <!-- 
      右侧：配置表单区域 
      内置 Viewport 扩展方案：通过负 Margin 和 Padding 扩展裁剪区域，保护卡片阴影。
    -->
    <div class="flex-1 lg:flex-none lg:w-120 flex flex-col min-h-0 relative">
      <div
        class="absolute inset-0 overflow-y-auto overflow-x-hidden -mx-6 px-6 -mb-6 pb-6 scroll-smooth"
      >
        <div class="flex flex-col gap-8">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

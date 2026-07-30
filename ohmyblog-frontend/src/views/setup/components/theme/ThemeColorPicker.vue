<!-- src/views/setup/components/theme/ThemeColorPicker.vue -->
<script setup lang="ts">
import ColorSlider from "@/components/base/slider/ColorSlider.vue";
import { useTheme } from "@/composables/theme.hook";

const { currentHue, previewHue } = useTheme();
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <slot name="label"></slot>
      <!-- 当前颜色预览小块 -->
      <div class="flex items-center gap-2 bg-bg-muted px-2 py-1 rounded-md">
        <div
          class="w-3 h-3 rounded-full"
          style="background-color: oklch(0.6 0.18 var(--app-hue))"
        ></div>
        <span class="text-xs text-fg">{{ currentHue }}</span>
      </div>
    </div>

    <div class="h-12 bg-bg-muted rounded-xl flex items-center px-4">
      <!-- 拖拽走 previewHue：跟手写入 + 100ms 轻微追随 -->
      <ColorSlider :model-value="currentHue" @update:model-value="previewHue" />
    </div>
  </div>
</template>

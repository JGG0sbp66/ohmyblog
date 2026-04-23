<!-- src/views/setup/components/theme/ThemeColorPicker.vue -->
<script setup lang="ts">
import ColorSlider from "@/components/base/slider/ColorSlider.vue";
import { useTheme } from "@/composables/theme.hook";

const { currentHue } = useTheme();
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <slot name="label"></slot>
      <!-- 当前颜色预览小块 -->
      <div class="flex items-center gap-2 bg-bg-muted px-2 py-1 rounded-md">
        <div
          class="w-3 h-3 rounded-full"
          :style="{ backgroundColor: `oklch(0.60 0.18 ${currentHue})` }"
        ></div>
        <span class="text-xs text-fg">{{ currentHue }}</span>
      </div>
    </div>

    <div class="h-12 bg-bg-muted rounded-xl flex items-center px-4">
      <ColorSlider v-model="currentHue" />
    </div>
  </div>
</template>

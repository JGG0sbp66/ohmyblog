<!-- src/components/theme/ThemeColorPicker.vue -->
<script setup lang="ts">
import ColorSlider from "@/components/base/slider/ColorSlider.vue";
import { useTheme } from "@/composables/theme.hook";

const { currentHue } = useTheme();
</script>

<template>
  <div class="h-12 bg-bg-muted rounded-xl flex items-center px-4">
    <ColorSlider v-model="currentHue" />
  </div>
</template>

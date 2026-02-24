<!-- src/components/icon/ui/PanelTop.vue -->
<script setup lang="ts">
import { RiGalleryFill } from "@remixicon/vue";
const props = withDefaults(
  defineProps<{
    sizeClass?: string;
  }>(),
  {
    sizeClass: "w-4 h-4",
  },
);
</script>

<template>
  <RiGalleryFill :class="props.sizeClass" />
</template>

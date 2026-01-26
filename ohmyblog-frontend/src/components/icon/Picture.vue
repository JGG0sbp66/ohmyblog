<!-- src/components/icon/Picture.vue -->
<script setup lang="ts">
import { Image } from "lucide-vue-next";
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
  <Image :class="props.sizeClass" />
</template>

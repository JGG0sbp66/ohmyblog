<!-- src/components/icon/Picture.vue -->
<script setup lang="ts">
import { RiImageAddFill } from "@remixicon/vue";
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
  <RiImageAddFill :class="props.sizeClass" />
</template>

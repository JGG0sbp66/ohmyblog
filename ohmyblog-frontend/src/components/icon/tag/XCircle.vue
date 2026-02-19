<!-- src/components/icon/tag/XCircle.vue -->
<script setup lang="ts">
import { XCircle } from "lucide-vue-next";
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
  <XCircle :class="props.sizeClass" />
</template>

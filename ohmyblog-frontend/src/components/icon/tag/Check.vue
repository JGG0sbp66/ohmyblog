<!-- src/components/icon/tag/Check.vue -->
<script setup lang="ts">
import { Check } from "lucide-vue-next";
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
  <Check :class="props.sizeClass" />
</template>

<!-- src/components/icon/common/Edit.vue -->
<script setup lang="ts">
import { FilePenLine } from "lucide-vue-next";
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
  <FilePenLine :class="props.sizeClass" />
</template>

<!-- src/components/icon/common/Trash.vue -->
<script setup lang="ts">
import { Trash2 } from "lucide-vue-next";

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
  <Trash2 :class="props.sizeClass" />
</template>

<!-- src/components/icon/common/Add.vue -->
<script setup lang="ts">
import { Plus } from "lucide-vue-next";

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
  <Plus :class="props.sizeClass" />
</template>

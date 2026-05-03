<!-- src/components/icon/common/Minus.vue -->
<script setup lang="ts">
import { Minus } from "lucide-vue-next";

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
  <Minus :class="props.sizeClass" />
</template>

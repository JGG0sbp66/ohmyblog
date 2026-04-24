<!-- src/components/icon/common/ChevronLeft.vue -->
<script setup lang="ts">
import { RiArrowLeftSLine } from "@remixicon/vue";

const props = withDefaults(
  defineProps<{
    sizeClass?: string;
  }>(),
  {
    sizeClass: "w-5 h-5",
  },
);
</script>

<template>
  <RiArrowLeftSLine :class="props.sizeClass" />
</template>

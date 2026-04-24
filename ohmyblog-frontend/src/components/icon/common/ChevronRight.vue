<!-- src/components/icon/common/ChevronRight.vue -->
<script setup lang="ts">
import { RiArrowRightSLine } from "@remixicon/vue";

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
  <RiArrowRightSLine :class="props.sizeClass" />
</template>

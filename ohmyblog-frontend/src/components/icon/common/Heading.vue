<!-- src/components/icon/common/Heading.vue -->
<script setup lang="ts">
import { RiHeading } from "@remixicon/vue";
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
  <RiHeading :class="props.sizeClass" />
</template>

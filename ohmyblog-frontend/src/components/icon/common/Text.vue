<!-- src/components/icon/common/Text.vue -->
<script setup lang="ts">
import { RiText } from "@remixicon/vue";
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
  <RiText :class="props.sizeClass" />
</template>

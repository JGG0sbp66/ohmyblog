<!-- src/components/icon/common/User.vue -->
<script setup lang="ts">
import { RiIdCardLine } from "@remixicon/vue";
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
  <RiIdCardLine :class="props.sizeClass" />
</template>

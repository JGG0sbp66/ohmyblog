<!-- src/components/icon/common/User.vue -->
<script setup lang="ts">
import { RiUserLine } from "@remixicon/vue";
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
  <RiUserLine :class="props.sizeClass" />
</template>

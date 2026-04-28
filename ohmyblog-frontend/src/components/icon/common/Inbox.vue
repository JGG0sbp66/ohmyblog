<!-- src/components/icon/common/Inbox.vue -->
<script setup lang="ts">
import { Inbox } from "lucide-vue-next";

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
  <Inbox :class="props.sizeClass" />
</template>

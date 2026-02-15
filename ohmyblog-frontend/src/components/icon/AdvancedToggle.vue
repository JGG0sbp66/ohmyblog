<!-- src/components/icon/AdvancedToggle.vue -->
<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    expanded?: boolean;
    sizeClass?: string;
  }>(),
  {
    expanded: false,
    sizeClass: "w-4 h-4",
  },
);
</script>

<template>
  <ChevronDown
    :class="[
      props.sizeClass,
      'transition-transform duration-200',
      props.expanded ? 'rotate-180' : 'rotate-0',
    ]"
  />
</template>

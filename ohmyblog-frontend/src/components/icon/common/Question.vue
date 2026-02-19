<!-- src/components/icon/common/Question.vue -->
<script setup lang="ts">
import { CircleQuestionMark } from "lucide-vue-next";
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
  <CircleQuestionMark :class="props.sizeClass" />
</template>

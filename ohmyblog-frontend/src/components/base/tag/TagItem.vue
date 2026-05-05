<!-- src/components/base/tag/TagItem.vue -->
<script setup lang="ts">
import { X } from "lucide-vue-next";

defineProps<{
  label: string;
}>();

const emit = defineEmits<{
  remove: [];
}>();
</script>

<template>
  <div
    class="inline-flex items-center gap-1 bg-accent/15 text-accent text-xs font-medium px-2.5 py-1 rounded-full"
  >
    <span>{{ label }}</span>
    <button
      type="button"
      class="flex items-center justify-center cursor-pointer hover:opacity-70 active:scale-90 transition-opacity"
      @click="emit('remove')"
    >
      <X class="w-3 h-3" />
    </button>
  </div>
</template>

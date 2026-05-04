<!-- src/components/base/control/SegmentedControl.vue -->
<script setup lang="ts" generic="T extends string | number | null">
/**
 * 极简分段选择器 (Apple / Linear 风格)
 */
import { computed } from "vue";

const props = defineProps<{
  /** 当前选中的值 */
  modelValue: T;
  /** 选项列表 */
  options: Array<{
    value: T;
    label: string;
  }>;
}>();

defineEmits<{
  "update:modelValue": [value: T];
}>();

const selectedIndex = computed(() =>
  props.options.findIndex((opt) => opt.value === props.modelValue),
);
</script>

<template>
  <div
    class="relative flex p-1 bg-bg-muted/60 rounded-xl border border-border/20"
  >
    <!-- 滑动指示块 -->
    <div
      class="absolute top-1 bottom-1 left-1 rounded-lg bg-bg-card shadow-sm ring-1 ring-border/50 transition-transform duration-200 ease-in-out"
      :style="{
        width: `calc((100% - 8px) / ${options.length})`,
        transform: `translateX(${selectedIndex * 100}%)`,
      }"
    />
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      class="relative z-10 flex-1 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors duration-200"
      :class="
        modelValue === opt.value ? 'text-fg' : 'text-fg-soft hover:text-fg'
      "
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

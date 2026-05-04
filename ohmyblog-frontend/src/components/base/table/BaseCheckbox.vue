<!-- src/components/base/table/BaseCheckbox.vue -->
<script setup lang="ts">
import { Check, Minus } from "lucide-vue-next";

withDefaults(
  defineProps<{
    /** 是否选中 */
    modelValue?: boolean;
    /** 是否为半选状态（用于全选按钮，表示部分项被选中） */
    indeterminate?: boolean;
  }>(),
  { modelValue: false, indeterminate: false },
);

defineEmits<{ "update:modelValue": [value: boolean] }>();
</script>

<template>
  <button
    type="button"
    class="group w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent active:scale-90 cursor-pointer select-none shrink-0"
    :class="
      modelValue || indeterminate
        ? 'bg-accent shadow-md'
        : 'bg-bg-muted border border-border shadow-inner hover:bg-bg-muted/80'
    "
    @click.stop="$emit('update:modelValue', !modelValue)"
  >
    <!-- 选中状态 -->
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 scale-50"
      enter-to-class="opacity-100 scale-100"
    >
      <Check
        v-if="modelValue && !indeterminate"
        class="w-3 h-3 text-white"
        :stroke-width="4"
      />
      <!-- 半选状态 -->
      <Minus
        v-else-if="indeterminate"
        class="w-3 h-3 text-white"
        :stroke-width="4"
      />
    </Transition>
  </button>
</template>

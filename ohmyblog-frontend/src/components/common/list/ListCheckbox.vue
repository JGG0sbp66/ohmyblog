<!-- src/components/common/list/ListCheckbox.vue -->
<script setup lang="ts">
import CheckIcon from "@/components/icon/common/Check.vue";
import MinusIcon from "@/components/icon/common/Minus.vue";

withDefaults(
  defineProps<{
    modelValue?: boolean;
    indeterminate?: boolean;
  }>(),
  { modelValue: false, indeterminate: false },
);

defineEmits<{ "update:modelValue": [value: boolean] }>();
</script>

<template>
  <button
    type="button"
    class="w-4 h-4 rounded shrink-0 flex items-center justify-center border-[1.5px] cursor-pointer select-none focus:outline-none transition-colors duration-150"
    :class="
      modelValue || indeterminate
        ? 'bg-accent border-accent'
        : 'border-border/80 hover:border-accent/60 bg-transparent'
    "
    @click.stop="$emit('update:modelValue', !modelValue)"
  >
    <CheckIcon
      v-if="modelValue && !indeterminate"
      sizeClass="w-2.5 h-2.5 text-white"
      :stroke-width="4"
    />
    <MinusIcon
      v-else-if="indeterminate"
      sizeClass="w-2.5 h-2.5 text-white"
      :stroke-width="4"
    />
  </button>
</template>

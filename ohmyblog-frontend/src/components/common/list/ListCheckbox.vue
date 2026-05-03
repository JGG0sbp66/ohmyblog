<!-- src/components/common/list/ListCheckbox.vue -->
<!--
  列表复选框组件
  用于列表项的多选场景，支持三种状态：
  1. 未选中（空框）
  2. 选中（勾选图标）
  3. 半选状态（减号图标，用于"全选"按钮表示部分选中）
-->
<script setup lang="ts">
import CheckIcon from "@/components/icon/common/Check.vue";
import MinusIcon from "@/components/icon/common/Minus.vue";

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
    class="w-4 h-4 rounded shrink-0 flex items-center justify-center border-[1.5px] cursor-pointer select-none focus:outline-none transition-colors duration-150"
    :class="
      modelValue || indeterminate
        ? 'bg-accent border-accent'
        : 'border-border/80 hover:border-accent/60 bg-transparent'
    "
    @click.stop="$emit('update:modelValue', !modelValue)"
  >
    <!-- 完全选中：显示勾选图标 -->
    <CheckIcon
      v-if="modelValue && !indeterminate"
      sizeClass="w-2.5 h-2.5 text-white"
      :stroke-width="4"
    />
    <!-- 半选状态：显示减号图标（用于全选按钮） -->
    <MinusIcon
      v-else-if="indeterminate"
      sizeClass="w-2.5 h-2.5 text-white"
      :stroke-width="4"
    />
    <!-- 未选中：空框（无图标） -->
  </button>
</template>

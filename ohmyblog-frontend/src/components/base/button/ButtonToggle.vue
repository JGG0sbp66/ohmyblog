<!-- src/components/base/button/ButtonToggle.vue -->
<script setup lang="ts">
/**
 * 开关切换组件
 */
interface Props {
  modelValue: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const handleToggle = (event: Event) => {
  if (props.disabled) return;
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.checked);
};
</script>

<template>
  <label
    class="relative inline-flex items-center"
    :class="[disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer']"
  >
    <input
      type="checkbox"
      class="peer sr-only"
      :checked="modelValue"
      :disabled="disabled"
      @change="handleToggle"
    />
    <!-- 背景槽 -->
    <div
      class="h-7 w-12 rounded-full bg-fg-subtle/20 peer-checked:bg-accent transition-colors duration-300"
    ></div>
    <!-- 滑块小球 -->
    <div
      class="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-md peer-checked:translate-x-5 transition-transform duration-300"
    ></div>
  </label>
</template>

<!-- src/components/base/button/ButtonPrimary.vue -->
<script lang="ts" setup>
import { computed } from "vue";
import Loading from "@/components/icon/Loading.vue";

/**
 * ButtonPrimary - 主要按钮组件
 *
 * Props:
 * - loading: 是否处于加载状态（默认 false）
 * - disabled: 是否禁用（默认 false）
 * - text: 按钮文本（默认 ""）
 *
 * 插槽:
 * - default: 加载状态时的图标，默认使用 Loading 组件
 */
const props = withDefaults(
  defineProps<{
    loading?: boolean;
    disabled?: boolean;
    text?: string;
  }>(),
  {
    loading: false,
    disabled: false,
    text: "",
  },
);

// 静态基础样式 - 所有状态下都应用的公共样式
const baseClass = `
  flex items-center justify-center flex-nowrap whitespace-nowrap
  w-fit px-4 py-2
  font-bold text-white
  leading-tight
  rounded-lg
  cursor-pointer
`;

// 动态样式 - 根据 props 计算
const dynamicClass = computed(() => {
  const classes = [];

  // 状态样式
  if (props.disabled || props.loading) {
    // 加载或禁用状态
    classes.push("bg-accent-active", "cursor-not-allowed", "opacity-80");
  } else {
    // 正常交互状态
    classes.push("bg-accent", "hover:bg-accent-hover", "active:scale-95");
  }

  return classes.join(" ");
});
</script>

<template>
  <button
    :disabled="props.disabled || props.loading"
    :class="[baseClass, dynamicClass]"
  >
    <!-- Loading 图标插槽 -->
    <span
      v-if="props.loading"
      class="mr-2 shrink-0 flex items-center justify-center"
    >
      <slot>
        <Loading />
      </slot>
    </span>

    <span class="truncate">{{ props.text }}</span>
  </button>
</template>

<!-- src/components/base/button/ButtonPrimary.vue -->
<script lang="ts" setup>
import { computed } from "vue";
import Loading from "@/components/icon/common/Loading.vue";

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
`;

// 动态样式 - 根据 props 计算
const dynamicClass = computed(() => {
  const classes = [];

  // 状态样式
  if (props.disabled || props.loading) {
    // 加载或禁用状态：大幅降低透明度，增加视觉区分度
    classes.push(
      "bg-accent",
      "cursor-not-allowed",
      "opacity-50",
      "grayscale-[0.3]",
    );
  } else {
    // 正常交互状态
    classes.push(
      "bg-accent",
      "hover:bg-accent-hover",
      "active:scale-85",
      "cursor-pointer",
    );
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
    <Transition name="fade-width">
      <span
        v-if="props.loading"
        class="shrink-0 flex items-center justify-center overflow-hidden whitespace-nowrap"
      >
        <span class="mr-2 flex items-center justify-center">
          <slot>
            <Loading />
          </slot>
        </span>
      </span>
    </Transition>

    <span class="truncate">{{ props.text }}</span>
  </button>
</template>

<style scoped>
/* 加载状态宽度与透明度过渡 */
.fade-width-enter-active,
.fade-width-leave-active {
  transition: all 0.3s ease;
}

.fade-width-enter-from,
.fade-width-leave-to {
  max-width: 0;
  opacity: 0;
}

.fade-width-enter-to,
.fade-width-leave-from {
  max-width: 100px; /* 设置一个足够大的值以容纳图标和间距 */
  opacity: 1;
}
</style>

<!-- src/components/base/input/BaseInputWrapper.vue -->
<script setup lang="ts">
import { useAutoAnimate } from "@formkit/auto-animate/vue";

/**
 * BaseInputWrapper — 通用输入框容器
 *
 * 提供标准输入框的背景、圆角、边框、聚焦环及错误提示动画，
 * 通过 slot 支持左侧前缀、主内容、右侧后缀的灵活组合。
 *
 * Props:
 * - error:    错误提示文字（非空时显示红色错误区域并替换聚焦环）
 * - disabled: 禁用状态（降低透明度 + 禁用指针样式）
 *
 * Slots:
 * - #prefix:  左侧区域（如 URL 前缀标签）
 * - default:  主内容（输入框本体）
 * - #suffix:  右侧区域（如图标、操作按钮）
 */
defineProps<{
  error?: string;
  disabled?: boolean;
}>();

const [errorContainerRef] = useAutoAnimate();
</script>

<template>
  <div class="flex flex-col w-full">
    <!-- 输入框主体：背景 + 圆角 + 聚焦 / 错误环 -->
    <div
      class="w-full bg-bg-muted rounded-xl border border-transparent flex items-center overflow-hidden text-fg"
      :class="[
        disabled ? 'opacity-60 cursor-not-allowed' : '',
        error
          ? 'ring-2 ring-red-500'
          : 'focus-within:ring-2 focus-within:ring-accent/30',
      ]"
    >
      <slot name="prefix" />
      <slot />
      <slot name="suffix" />
    </div>

    <!-- 错误提示区域：auto-animate 控制进出动画，紧凑展示避免撑开列表行距 -->
    <div ref="errorContainerRef" class="overflow-hidden">
      <p v-if="error" class="mt-1 px-1 text-[10px] text-red-500 leading-tight">
        {{ error }}
      </p>
    </div>
  </div>
</template>

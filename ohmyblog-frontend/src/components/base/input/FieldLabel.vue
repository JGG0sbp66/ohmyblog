<!-- src/components/base/input/FieldLabel.vue -->
<script setup lang="ts">
import BaseTooltip from "@/components/base/pop/BaseTooltip.vue";

/**
 * FieldLabel — 通用字段标签行
 *
 * 布局：[#icon slot（可选）] [label 文字] [BaseTooltip（可选）]
 * 样式固定为 uppercase 加粗风格，供输入组件和设置面板统一复用。
 *
 * Props:
 * - label:    标签文字（必填）
 * - tooltip:  Tooltip 提示文字（可选）
 * - required: 是否显示必填红色星号（可选）
 *
 * Slots:
 * - #icon: 标签左侧图标（推荐 w-4 h-4 text-fg-subtle）
 */
defineProps<{
  label: string;
  tooltip?: string;
  required?: boolean;
}>();
</script>

<template>
  <div class="flex items-center gap-1.5">
    <slot name="icon" />
    <span
      class="text-sm font-bold text-fg-subtle uppercase tracking-wider select-none"
    >
      {{ label }}<span v-if="required" class="text-red-500 ml-0.5">*</span>
    </span>
    <BaseTooltip v-if="tooltip" :content="tooltip" />
  </div>
</template>

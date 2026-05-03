<!-- src/components/base/button/ButtonThird.vue -->
<script lang="ts" setup>
/**
 * ButtonThird - 第三级按钮（纯文本样式）
 *
 * 与 ButtonPrimary（主操作）/ ButtonSecondary（次操作）相区别，
 * 用于轻量、辅助性的文字操作（如「忘记密码」「重新发送」「返回上一步」）。
 *
 * 视觉上仅有文本 + 悬浮变色，无背景、无边框。
 *
 * Props:
 * - text: 按钮文本
 * - disabled: 是否禁用
 *
 * 插槽：
 * - default: 文本前的可选图标
 */
withDefaults(
  defineProps<{
    text?: string;
    disabled?: boolean;
  }>(),
  {
    text: "",
    disabled: false,
  },
);
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="inline-flex items-center gap-1 bg-transparent border-none p-0 text-fg-subtle hover:text-accent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-fg-subtle"
  >
    <slot />
    <span v-if="text">{{ text }}</span>
  </button>
</template>

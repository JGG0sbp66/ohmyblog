<!-- src/components/base/button/ButtonThird.vue -->
<script lang="ts" setup>
/**
 * ButtonThird - 第三级按钮（纯文本样式）
 *
 * 与 ButtonPrimary（主操作）/ ButtonSecondary（次操作）相区别，
 * 用于轻量、辅助性的文字操作（如页脚链接、「忘记密码」「重新发送」等）。
 *
 * 视觉上仅有文本 + 悬浮变亮，hover 和选中态附加底部下划线动画（从左向右展开）。
 *
 * Props:
 * - text: 按钮文本
 * - disabled: 是否禁用
 * - isActive: 是否处于选中/激活状态（显示底部下划线 + 高亮文色）
 *
 * 插槽：
 * - default: 文本前的可选图标
 */
withDefaults(
  defineProps<{
    text?: string;
    disabled?: boolean;
    isActive?: boolean;
  }>(),
  {
    text: "",
    disabled: false,
    isActive: false,
  },
);
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="btn-third group/third inline-flex items-center gap-1 bg-transparent border-none px-1 py-0.5 cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative"
    :class="[isActive ? 'text-fg' : 'text-fg-muted hover:text-fg']"
  >
    <slot />
    <span v-if="text">{{ text }}</span>

    <!-- 底部下划线：从左向右展开动画 -->
    <span
      class="absolute bottom-0 left-1 h-px bg-current opacity-30 transition-[width] duration-300 ease-out"
      :class="[
        isActive ? 'w-[calc(100%-0.5rem)]' : 'w-0 group-hover/third:w-[calc(100%-0.5rem)]',
      ]"
    />
  </button>
</template>

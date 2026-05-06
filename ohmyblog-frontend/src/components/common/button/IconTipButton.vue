<!-- src/components/common/button/IconTipButton.vue -->
<script setup lang="ts">
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import BaseTooltip from "@/components/base/pop/BaseTooltip.vue";

/**
 * IconTipButton — 带 Tooltip 提示的图标按钮（通用）
 *
 * 在 ButtonSecondary 基础上叠加 BaseTooltip，trigger slot 由本组件填充。
 * 点击时触发 click 事件；使用 @mousedown.prevent 防止编辑器等场景下的失焦。
 *
 * Props:
 * - tooltip  : hover 时显示的文字提示（走 i18n 后传入）
 * - isActive : 是否处于激活（已应用）状态
 * - size     : 按钮尺寸 class（默认 "w-8 h-8"）
 *
 * Slots:
 * - default : 按钮内容（通常是图标）
 */
withDefaults(
  defineProps<{
    tooltip: string;
    isActive?: boolean;
    size?: string;
  }>(),
  { size: "w-8 h-8" },
);

const emit = defineEmits<{ click: [] }>();
</script>

<template>
  <BaseTooltip :content="tooltip">
    <template #trigger>
      <ButtonSecondary
        :isActive="isActive"
        :class="size"
        @mousedown.prevent="emit('click')"
      >
        <slot />
      </ButtonSecondary>
    </template>
  </BaseTooltip>
</template>

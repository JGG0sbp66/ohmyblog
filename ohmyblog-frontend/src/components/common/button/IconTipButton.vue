<!-- src/components/common/button/IconTipButton.vue -->
<script setup lang="ts">
import { computed } from "vue";
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
 * - danger   : 危险操作（默认 text-fg，hover 变红，与 DeleteButton 一致）
 *
 * Slots:
 * - default : 按钮内容（通常是图标）
 */
const props = withDefaults(
  defineProps<{
    tooltip: string;
    isActive?: boolean;
    size?: string;
    danger?: boolean;
  }>(),
  { size: "w-8 h-8", danger: false },
);

const emit = defineEmits<{ click: [] }>();

const buttonClass = computed(() => {
  if (!props.danger) return props.size;
  return [props.size, "hover:!text-red-500 hover:before:!bg-red-500/10"].join(
    " ",
  );
});
</script>

<template>
  <BaseTooltip :content="tooltip">
    <template #trigger>
      <ButtonSecondary
        :isActive="isActive"
        :class="buttonClass"
        @mousedown.prevent="emit('click')"
      >
        <slot />
      </ButtonSecondary>
    </template>
  </BaseTooltip>
</template>

<!-- src/components/common/button/FooterDrop.vue -->
<script lang="ts" setup>
import { ref, computed, useSlots } from "vue";
import { useMediaQuery } from "@vueuse/core";
import { RiArrowDownSLine } from "@remixicon/vue";
import ButtonThird from "@/components/base/button/ButtonThird.vue";
import BasePop from "@/components/base/pop/BasePop.vue";

/**
 * FooterDrop - 通用底部下拉菜单触发器
 *
 * 结构：左侧图标(slot) + 文本 + 右侧箭头（带旋转动画）
 * 弹出菜单在按钮正上方展开，hover/click 切换。
 *
 * Props:
 * - text: 按钮显示文本
 * - contentClass: 弹出面板的额外样式
 *
 * 插槽：
 * - icon: 左侧图标
 * - default: 弹出菜单内容
 */
const props = withDefaults(
  defineProps<{
    text?: string;
    contentClass?: string;
  }>(),
  {
    text: "",
    contentClass: "",
  },
);

const slots = useSlots();
const hasIcon = computed(() => !!slots.icon);

const isOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);

/**
 * 设备是否支持精细悬停（鼠标）。
 * - true（桌面）→ 仅响应 mouseenter / mouseleave
 * - false（触屏）→ 仅响应 click 切换
 */
const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

const close = () => (isOpen.value = false);
defineExpose({ close });
</script>

<template>
  <div
    ref="triggerRef"
    class="relative inline-flex"
    @mouseenter="canHover && (isOpen = true)"
    @mouseleave="canHover && (isOpen = false)"
    @click="!canHover && (isOpen = !isOpen)"
  >
    <!-- 触发按钮：icon + text + 箭头 -->
    <ButtonThird :text="props.text">
      <template v-if="hasIcon" #default>
        <slot name="icon" />
      </template>
      <template #suffix>
        <RiArrowDownSLine
          class="w-3.5 h-3.5 transition-transform duration-200"
          :class="isOpen ? 'rotate-180' : 'rotate-0'"
        />
      </template>
    </ButtonThird>

    <!-- 桥接层：防止鼠标从按钮移到弹层途中断开 hover -->
    <div
      v-if="isOpen && canHover"
      class="absolute w-full left-0 bottom-full h-2 z-50"
    />

    <!-- 弹出面板：固定在按钮正上方 -->
    <BasePop
      v-model="isOpen"
      :trigger-ref="triggerRef"
      :class="['bottom-full mb-2 left-1/2 -translate-x-1/2', props.contentClass]"
    >
      <slot />
    </BasePop>
  </div>
</template>

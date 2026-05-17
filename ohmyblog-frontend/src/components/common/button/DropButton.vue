<!-- src/components/common/button/DropButton.vue -->
<script lang="ts" setup>
import BasePop from "@/components/base/pop/BasePop.vue";
import { ref } from "vue";
import { useMediaQuery } from "@vueuse/core";

interface Props {
  triggerClass?: string;
  contentClass?: string;
  placement?: string;
  /** 弹窗距触发器的间距（Tailwind margin class），默认 "mt-6" */
  popOffset?: string;
  /** 桥接层高度（需与 popOffset 匹配，Tailwind height class），默认 "h-6" */
  bridgeHeight?: string;
}

const {
  triggerClass = "w-11 h-11",
  contentClass = "min-w-36 p-2",
  placement = "left-0",
  popOffset = "mt-6",
  bridgeHeight = "h-6",
} = defineProps<Props>();

const isShow = ref(false);
const btnRef = ref(null);

/**
 * 设备是否支持精细悬停（鼠标）。
 * - true（桌面）→ 仅响应 mouseenter / mouseleave
 * - false（触屏）→ 仅响应 click 切换；外部点击关闭由 BasePop 内的
 *   onClickOutside 兜底
 */
const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

const close = () => (isShow.value = false);
defineExpose({ close });
</script>

<template>
  <div
    ref="btnRef"
    class="relative"
    @mouseenter="canHover && (isShow = true)"
    @mouseleave="canHover && (isShow = false)"
    @click="!canHover && (isShow = !isShow)"
  >
    <div :class="triggerClass">
      <slot name="trigger" :active="isShow"></slot>
    </div>

    <!-- 桥接层：仅 hover 模式下需要，触屏设备无需防"鼠标移出消失"  -->
    <div
      v-if="isShow && canHover"
      :class="['absolute w-[500%] top-full left-[-200%] z-50', bridgeHeight]"
    ></div>

    <BasePop
      v-model="isShow"
      :trigger-ref="btnRef"
      :class="[contentClass, placement, popOffset]"
    >
      <slot name="content"></slot>
    </BasePop>
  </div>
</template>

<!-- src/components/common/button/DropButton.vue -->
<!--
  TODO(dropbutton-smart-flip): 菜单智能翻转（底部空间不足时向上展开）
  - 现状：弹层固定在触发器下方（popOffset 默认 mt-6 + placement），靠近视口底部时
    会被裁剪或溢出，handle 块菜单在页面底部尤其明显。
  - 目标：仿飞书/常见下拉——挂载/打开时测量触发器在视口中的位置与弹层高度，
    若下方剩余空间不足而上方足够，则向上翻转（改用 bottom 锚 + 向上的 offset/桥接层）。
  - 实现建议：在 BasePop 内或本组件用 useElementBounding/useWindowSize（VueUse）算可用空间，
    输出 direction = 'down' | 'up'，据此切换 placement/offset 与桥接层方向；保持 hover 模式下
    桥接层仍连续（避免鼠标移动到弹层途中触发关闭）。
  - 影响面：本组件被 handle 空行/块菜单、表格块手柄菜单等复用，翻转逻辑下沉到 DropButton/BasePop
    即可统一受益。
-->
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

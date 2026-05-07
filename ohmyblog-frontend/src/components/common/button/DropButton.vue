<!-- src/components/common/button/DropButton.vue -->
<script lang="ts" setup>
import BasePop from "@/components/base/pop/BasePop.vue";
import { ref } from "vue";

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

const showPop = () => {
  isShow.value = true;
};
const hidePop = () => {
  isShow.value = false;
};

defineExpose({ close: hidePop });
</script>

<template>
  <div
    class="relative"
    ref="btnRef"
    @mouseenter="showPop"
    @mouseleave="hidePop"
  >
    <div :class="triggerClass">
      <slot name="trigger" :active="isShow"></slot>
    </div>

    <!-- 桥接层：填充按钮和浮窗之间的间隙，防止鼠标移动时浮窗消失 -->
    <div
      v-if="isShow"
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

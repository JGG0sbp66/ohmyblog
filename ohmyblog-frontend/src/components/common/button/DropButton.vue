<!-- src/components/common/button/DropButton.vue -->
<script lang="ts" setup>
import BasePop from "@/components/base/pop/BasePop.vue";
import { ref, computed, watch, nextTick } from "vue";
import { useMediaQuery, useWindowSize } from "@vueuse/core";

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
const btnRef = ref<HTMLElement | null>(null);

/**
 * 设备是否支持精细悬停（鼠标）。
 * - true（桌面）→ 仅响应 mouseenter / mouseleave
 * - false（触屏）→ 仅响应 click 切换；外部点击关闭由 BasePop 内的
 *   onClickOutside 兜底
 */
const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

const { height: winHeight } = useWindowSize();

/**
 * 智能翻转方向：
 * - "down"（默认）→ 弹层在触发器下方展开。
 * - "up"          → 底部空间不足且上方更充足时，向上展开（仿飞书）。
 */
const direction = ref<"down" | "up">("down");

/** 向上展开时，把下偏移 mt-* 镜像为上偏移 mb-*（保持调用方只传一个 popOffset） */
const upOffset = computed(() => popOffset.replace(/(^|\s)mt-/g, "$1mb-"));

/**
 * 是否允许翻转：仅对「竖向向下展开」的菜单（popOffset 含 mt-*）启用。
 * 横向展开的菜单（如表格尺寸选择器用 placement="left-full" + ml-0）不能翻转，
 * 否则会被加上 bottom-full 破坏定位，这里直接排除。
 */
const canFlip = computed(() => /(^|\s)mt-/.test(popOffset));

/**
 * 传给 BasePop 的定位类：
 * - down：沿用静态位置 + popOffset（不显式设 top，靠 DOM 顺序落在触发器下方）。
 * - up：bottom-full 把弹层底边贴到触发器顶边，再用 mb-* 留间距向上顶。
 */
const popClass = computed(() =>
  direction.value === "up"
    ? `${placement} bottom-full ${upOffset.value}`
    : `${placement} ${popOffset}`,
);

/** 桥接层锚点随方向翻转：向上时贴触发器上沿，向下时贴下沿 */
const bridgeAnchor = computed(() =>
  direction.value === "up" ? "bottom-full" : "top-full",
);

/**
 * 打开时测量：触发器视口位置 + 弹层实际高度，决定向上 / 向下。
 * 仅当「下方放不下且上方比下方更宽裕」时翻转，否则保持向下。
 */
const decideDirection = () => {
  if (!canFlip.value) return; // 横向菜单不翻转
  const el = btnRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const panel = el.querySelector<HTMLElement>("[data-pop-panel]");
  const panelHeight = panel?.offsetHeight ?? 0;
  const gap = 12; // 间距 + 余量
  const need = panelHeight + gap;
  const spaceBelow = winHeight.value - rect.bottom;
  const spaceAbove = rect.top;
  direction.value =
    spaceBelow < need && spaceAbove > spaceBelow ? "up" : "down";
};

watch(isShow, (open) => {
  if (!open) return;
  // 先复位为 down，待弹层渲染出来后（nextTick）按真实高度重新判断，
  // 避免沿用上一次打开时的方向。nextTick 在浏览器绘制前 flush，基本无闪烁。
  direction.value = "down";
  nextTick(decideDirection);
});

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

    <!-- 桥接层：仅 hover 模式下需要，触屏设备无需防"鼠标移出消失"。
         锚点随展开方向翻转，保证鼠标从触发器移到弹层途中不断开。 -->
    <div
      v-if="isShow && canHover"
      :class="[
        'absolute w-[500%] left-[-200%] z-50',
        bridgeAnchor,
        bridgeHeight,
      ]"
    ></div>

    <BasePop
      v-model="isShow"
      :trigger-ref="btnRef"
      :class="[contentClass, popClass]"
    >
      <slot name="content"></slot>
    </BasePop>
  </div>
</template>

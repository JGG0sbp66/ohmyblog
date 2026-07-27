<!-- src/views/main/components/post/toc/TocRail.vue -->
<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useResizeObserver } from "@vueuse/core";
import { CURVE, RAIL_X, useTocCurve } from "./use-toc-curve";
import type { TocHeading } from "./extract-headings";

/**
 * TocRail — 目录的收起态。
 *
 * 一条竖直导轨 + 每个标题一个圆点，阅读位置附近有个常驻凸包（见 use-toc-curve）。
 * 只有凸包中间一小截染主题色，其余保持中性灰 —— 目录是余光里的东西，
 * 大面积上主题色会喧宾夺主。
 */

const props = defineProps<{
  headings: TocHeading[];
  /** 每个标题在导轨上的位置 0~1 */
  anchors: number[];
  /** 阅读进度 0~1 */
  progress: number;
  /** 当前所在章节下标，-1 表示还没进入任何章节 */
  activeIndex: number;
}>();

const rootRef = ref<HTMLElement | null>(null);
const size = ref({ width: 0, height: 0 });

useResizeObserver(rootRef, ([entry]) => {
  if (!entry) return;
  const { width, height } = entry.contentRect;
  size.value = { width, height };
});

const { railD, accentD, dots, headY } = useTocCurve(
  toRef(props, "progress"),
  computed(() => size.value.height),
  toRef(props, "anchors"),
);

const activeTitle = computed(
  () => props.headings[props.activeIndex]?.text ?? "",
);
const percent = computed(() => Math.round(props.progress * 100));

/** 标签横坐标固定：跟着凸包左右摆会让文字很难看清 */
const flagLeft = RAIL_X + CURVE.flagGap;

/** 子标题的点小一圈，收起态也能读出层级 */
const dotRadius = (index: number) =>
  (props.headings[index]?.depth ?? 2) >= 3 ? 1.8 : 2.6;
</script>

<template>
  <div ref="rootRef" class="absolute inset-0">
    <svg
      class="absolute inset-0 overflow-visible"
      :width="size.width"
      :height="size.height"
      aria-hidden="true"
    >
      <path class="fill-none stroke-border" stroke-width="1" :d="railD" />
      <path
        class="fill-none stroke-accent"
        stroke-width="1.25"
        stroke-linecap="round"
        :d="accentD"
      />
      <!-- fill 在全局 * 过渡列表里，圆点变色自带 200ms 过渡 -->
      <circle
        v-for="(dot, i) in dots"
        :key="headings[i]?.id ?? i"
        :class="i === activeIndex ? 'fill-accent' : 'fill-fg/30'"
        :cx="dot.x"
        :cy="dot.y"
        :r="dotRadius(i)"
      />
    </svg>

    <div
      class="pointer-events-none absolute -translate-y-1/2 leading-[1.55] whitespace-nowrap"
      :style="{ left: `${flagLeft}px`, top: `${headY}px` }"
    >
      <!-- 两层标题叠放，外壳需要固定单行高度 -->
      <b
        class="relative block h-[1.55em] text-[0.8rem] font-normal text-fg-muted"
      >
        <!-- 换标题时交叉过渡：旧的向上淡出、新的从下方淡入 -->
        <Transition name="toc-flag">
          <span :key="activeTitle" class="absolute top-0 left-0">
            {{ activeTitle }}
          </span>
        </Transition>
      </b>
      <i class="block text-[0.8rem] not-italic text-accent">{{ percent }}%</i>
    </div>
  </div>
</template>

<style scoped>
/* Vue <Transition> 生成的类名，无法用 Tailwind 表达 */
.toc-flag-enter-active,
.toc-flag-leave-active {
  transition:
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    translate 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toc-flag-enter-from {
  opacity: 0;
  translate: 0 6px;
}

.toc-flag-leave-to {
  opacity: 0;
  translate: 0 -6px;
}
</style>

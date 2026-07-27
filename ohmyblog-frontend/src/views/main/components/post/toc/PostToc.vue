<!-- src/views/main/components/post/toc/PostToc.vue -->
<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue";
import { useEventListener } from "@vueuse/core";
import { useLang } from "@/composables/lang.hook";
import TocRail from "./TocRail.vue";
import TocList from "./TocList.vue";
import { useReadingPosition } from "./use-reading-position";
import type { TocHeading } from "./extract-headings";

/**
 * PostToc — 前台文章侧边目录。
 *
 * 两种形态共存于同一个容器：
 *   收起态（默认）= 一条带凸包的导轨 + 当前标题 + 百分比；
 *   展开态        = 完整目录列表 + 阅读进度 + 回到顶部。
 *
 * 切换的两个触发源收敛到 expanded 一个 computed，避免各写各的、互相打架。
 */

const props = defineProps<{
  headings: TocHeading[];
}>();

/** 到底之后再往下拨多少 px 自动展开列表 */
const BOTTOM_PULL = 160;

const headings = toRef(props, "headings");
const { t } = useLang();
const {
  progress,
  activeIndex,
  visibleRange,
  anchors,
  atBottom,
  scrollToHeading,
} = useReadingPosition(headings);

const hovering = ref(false);
/** 已经到底、且用户还在继续往下拨 —— 这时正好是要点「回到顶部」 */
const bottomHeld = ref(false);
let bottomPull = 0;

const expanded = computed(() => hovering.value || bottomHeld.value);

/**
 * 到底之后页面不再滚动，scroll 事件也就不再触发，
 * 所以「还想往下」这个意图只能从 wheel 的 deltaY 里读。
 */
useEventListener(
  window,
  "wheel",
  (event: WheelEvent) => {
    if (atBottom.value && event.deltaY > 0) {
      bottomPull += event.deltaY;
      if (bottomPull >= BOTTOM_PULL) bottomHeld.value = true;
    } else if (event.deltaY < 0) {
      bottomPull = 0;
      bottomHeld.value = false;
    }
  },
  { passive: true },
);

// 离开底部就复位，避免下次滚到底时残留上一轮的累计
watch(atBottom, (value) => {
  if (!value) {
    bottomPull = 0;
    bottomHeld.value = false;
  }
});

const backToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};
</script>

<template>
  <!-- 收起态整块不接管事件，避免挡住正文的点击；展开后才需要它接 pointerleave -->
  <nav
    v-if="headings.length > 0"
    class="relative h-[calc(100vh-16rem)] min-h-80"
    :class="expanded ? 'pointer-events-auto' : 'pointer-events-none'"
    :aria-label="t('views.main.post.toc.label')"
    @pointerleave="hovering = false"
  >
    <!-- 收起态只有导轨附近一条窄带接收 hover -->
    <div
      class="pointer-events-auto absolute inset-y-0 -left-6 w-36"
      @pointerenter="hovering = true"
    />

    <!-- 导轨只在收起态出现 -->
    <div
      class="absolute inset-0 transition-opacity duration-[350ms] ease-in-out"
      :class="expanded ? 'opacity-0' : 'opacity-100'"
    >
      <TocRail
        :headings="headings"
        :anchors="anchors"
        :progress="progress"
        :active-index="activeIndex"
      />
    </div>

    <TocList
      :headings="headings"
      :active-index="activeIndex"
      :visible-range="visibleRange"
      :progress="progress"
      :expanded="expanded"
      @select="scrollToHeading"
      @top="backToTop"
    />
  </nav>
</template>

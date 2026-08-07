<!-- src/views/main/components/post/toc/PostToc.vue -->
<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue";
import { useEventListener } from "@vueuse/core";
import { useLang } from "@/composables/lang.hook";
import TocList from "./TocList.vue";
import { useReadingPosition } from "./use-reading-position";
import type { TocHeading } from "./extract-headings";

/**
 * PostToc — 前台文章侧边目录。
 *
 * 只有一种渲染形态（见 TocList）：收起时是「章节刻度尺」，
 * 悬停后原地展开为完整列表。两个触发源收敛到 expanded 一个
 * computed，避免各写各的、互相打架。
 */

const props = defineProps<{
  headings: TocHeading[];
}>();

/** 到底之后再往下拨多少 px 自动展开列表 */
const BOTTOM_PULL = 160;

const headings = toRef(props, "headings");
const { t } = useLang();
const { progress, activeIndex, visibleRange, atBottom, scrollToHeading } =
  useReadingPosition(headings);

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
  <!--
    收起态整块不接管事件，避免挡住正文的点击；展开后才需要它接 pointerleave。

    高度策略（TocList 把内容在本元素内垂直居中，所以这里的高度就决定了目录停在哪）：
    - self-stretch：作为行 flex 的一项拉伸到文章那一列的高度。TocList 是 absolute，
      本元素的自动高度为 0，不参与行高计算，所以「拉伸到文章高」不会循环依赖。
    - max-h：封顶在视口尺度。长文时高度被截到这个值，配合外部的 sticky top-24
      就回到视口居中；短文时够不着上限，高度等于文章高 → 居中即文章正中。
    - min-h：文章极短时的可用性兜底（标题 + 进度 + 回到顶部约占 75px，
      再加上下各 24px 的遮罩淡出），此时允许略微超出文章底边。
  -->
  <nav
    v-if="headings.length > 0"
    class="relative self-stretch max-h-[calc(100vh-16rem)] min-h-60"
    :class="expanded ? 'pointer-events-auto' : 'pointer-events-none'"
    :aria-label="t('views.main.post.toc.label')"
    @pointerleave="hovering = false"
  >
    <!-- 收起态只有刻度列附近一条窄带接收 hover -->
    <div
      class="pointer-events-auto absolute inset-y-0 -left-6 w-20"
      @pointerenter="hovering = true"
    />

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

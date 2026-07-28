// src/views/main/components/post/toc/use-reading-position.ts
import { type Ref, computed, ref, shallowRef, watch } from "vue";
import { useEventListener, useResizeObserver } from "@vueuse/core";
import type { TocHeading } from "./extract-headings";

/**
 * 阅读位置：把「页面滚到哪了」翻译成目录需要的三个读数。
 *
 * - progress     整篇文章的阅读进度，底部的百分比与进度环用它
 * - activeIndex  当前所在章节，刻度尺上的发光刻度就是它
 * - visibleRange 视口里能看见的标题区间 —— 列表态文本的中间档亮度
 */

/** 阅读线：视口高度的 1/4 处。标题越过这条线才算「进入」该章节。 */
const READING_LINE_RATIO = 0.25;

/**
 * 跳转时预留的顶部空间。Header 是 fixed h-18（72px），
 * 不留偏移的话目标标题会正好被压在它下面。
 *
 * 这里用编程式偏移而不是给标题加 scroll-margin-top：
 * css/tiptap/headings.css 是前后台共享的，不该为阅读页的 Header 高度买单。
 */
const SCROLL_OFFSET = 88;

export interface VisibleRange {
  /** 区间内第一个标题的下标，无可见标题时为 -1 */
  from: number;
  /** 区间内最后一个标题的下标，无可见标题时为 -1 */
  to: number;
}

export function useReadingPosition(headings: Ref<TocHeading[]>) {
  /** 0 ~ 1 */
  const progress = ref(0);
  const activeIndex = ref(-1);
  const visibleRange = shallowRef<VisibleRange>({ from: -1, to: -1 });

  /**
   * 每个标题在文档中的绝对 y。
   * 缓存下来是因为 getBoundingClientRect 会触发同步布局，
   * 而滚动过程中每帧都要用它算 activeIndex。
   */
  let headingTops: number[] = [];

  const measure = () => {
    headingTops = headings.value.map(
      (h) => h.el.getBoundingClientRect().top + window.scrollY,
    );
    update();
  };

  const update = () => {
    const doc = document.documentElement;
    const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
    const y = window.scrollY;

    progress.value = Math.min(1, Math.max(0, y / scrollable));

    // 当前章节 = 阅读线上方最后一个标题
    const line = y + window.innerHeight * READING_LINE_RATIO;
    let active = -1;
    for (let i = 0; i < headingTops.length; i++) {
      if ((headingTops[i] ?? Infinity) <= line) active = i;
    }
    activeIndex.value = active;

    // 可见区间 = 章节范围与视口相交的那些标题
    // （不是「标题本身在视口里」—— 长章节的标题早滚出去了，但正文还在读）
    const top = y;
    const bottom = y + window.innerHeight;
    let from = -1;
    let to = -1;
    for (let i = 0; i < headingTops.length; i++) {
      const start = headingTops[i] ?? 0;
      const end = headingTops[i + 1] ?? Infinity;
      if (end > top && start < bottom) {
        if (from < 0) from = i;
        to = i;
      }
    }
    const prev = visibleRange.value;
    if (prev.from !== from || prev.to !== to) visibleRange.value = { from, to };
  };

  /** 滚到第 i 个标题，避开 fixed Header */
  const scrollToHeading = (index: number) => {
    const target = headings.value[index];
    if (!target) return;
    const top =
      target.el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  // 标题集合变了（切换文章、内容重渲染）就重新量一遍
  watch(headings, measure, { immediate: true, flush: "post" });

  useEventListener(window, "scroll", update, { passive: true });
  useEventListener(window, "resize", measure, { passive: true });
  // 图片/代码块异步撑开会改变标题位置，body 尺寸变化时重量
  useResizeObserver(document.body, measure);

  /** 是否已经滚到底（触底继续下拨要用它判断） */
  const atBottom = computed(() => progress.value >= 0.999);

  return {
    progress,
    activeIndex,
    visibleRange,
    atBottom,
    scrollToHeading,
    /** 外部改变了布局时手动重量 */
    measure,
  };
}

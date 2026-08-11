// src/views/main/components/post/toc/use-reading-position.ts
import { type Ref, ref, watch } from "vue";
import { useEventListener, useResizeObserver } from "@vueuse/core";
import type { TocHeading } from "./extract-headings";

/**
 * 阅读位置：把「页面滚到哪了」翻译成目录需要的读数。
 *
 * - progress     正文的阅读进度（不含 hero/footer），标题行右侧的百分比用它
 * - activeIndex  当前所在标题
 * - fillBetween  任意标题区间的读取完成度 —— 目录左侧那条导轨的填充量
 *
 * 进度以正文元素的区间为基准，而不是 document.scrollHeight：
 * 后者把 hero 与 footer 也算进分母，读到正文最后一行时百分比还差一截，
 * 而导轨的填充又必须和「读到哪一行」严格对齐，两者不能各算一套。
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

export function useReadingPosition(
  headings: Ref<TocHeading[]>,
  smooth: Ref<boolean>,
) {
  /** 0 ~ 1 */
  const progress = ref(0);
  const activeIndex = ref(-1);
  /** 阅读线在文档中的绝对 y */
  const readingY = ref(0);

  /**
   * 每个标题在文档中的绝对 y，以及正文的起止 y。
   * 缓存下来是因为 getBoundingClientRect 会触发同步布局，
   * 而滚动过程中每帧都要用它算 activeIndex 与导轨填充。
   */
  let headingTops: number[] = [];
  let proseStart = 0;
  let proseEnd = 1;

  /**
   * 量测版本号。headingTops 是普通数组，改它不会触发依赖 fillBetween 的计算；
   * 图片撑开、窗口变化后位置全变但 readingY 可能一模一样，只靠 readingY
   * 当依赖会漏更新。fillBetween 里读一下这个 ref 就把重量也接进响应式。
   */
  const revision = ref(0);

  const measure = () => {
    const list = headings.value;
    headingTops = list.map(
      (h) => h.el.getBoundingClientRect().top + window.scrollY,
    );

    // 正文根节点：标题一定在 .tiptap 里，不必额外传引用进来
    const root = list[0]?.el.closest<HTMLElement>(".tiptap") ?? null;
    if (root) {
      const rect = root.getBoundingClientRect();
      proseStart = rect.top + window.scrollY;
      proseEnd = proseStart + rect.height;
    } else {
      proseStart = 0;
      proseEnd = 1;
    }

    revision.value++;
    update();
  };

  const update = () => {
    const doc = document.documentElement;
    const y = window.scrollY;
    const vh = window.innerHeight;

    /**
     * 阅读线在最后一屏内从 1/4 处线性下移到视口底部。
     *
     * 不做这个补偿的话，阅读线最远只能到 maxScroll + vh/4，而文末那些
     * 标题（尤其是最后一节很短时）位置比这更靠下 —— 于是无论怎么滚都
     * 点不亮最后一项，进度也永远差一截。补偿后滚到底时阅读线正好落在
     * 文档末尾，末章必然被激活、进度必然满格，而且是线性推进、不跳。
     */
    const maxScroll = Math.max(1, doc.scrollHeight - vh);
    const tail = Math.min(1, Math.max(0, (y - (maxScroll - vh)) / vh));
    const ratio = READING_LINE_RATIO + (1 - READING_LINE_RATIO) * tail;

    const line = y + vh * ratio;
    readingY.value = line;

    const span = Math.max(1, proseEnd - proseStart);
    progress.value = Math.min(1, Math.max(0, (line - proseStart) / span));

    // 当前标题 = 阅读线上方最后一个标题
    let active = -1;
    for (let i = 0; i < headingTops.length; i++) {
      if ((headingTops[i] ?? Number.POSITIVE_INFINITY) <= line) active = i;
    }
    activeIndex.value = active;
  };

  /**
   * 区间 [from, to) 的读取完成度 0~1。
   * to 越界（末章）时用正文末尾兜底，这样最后一节也能填满。
   */
  const fillBetween = (from: number, to: number) => {
    // 建立对重量的依赖，见 revision 的注释
    void revision.value;

    const start = headingTops[from];
    if (start === undefined) return 0;
    const end = headingTops[to] ?? proseEnd;
    const span = Math.max(1, end - start);
    return Math.min(1, Math.max(0, (readingY.value - start) / span));
  };

  /** 滚到第 i 个标题，避开 fixed Header */
  const scrollToHeading = (index: number) => {
    const target = headings.value[index];
    if (!target) return;
    const top =
      target.el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: smooth.value ? "smooth" : "auto",
    });
  };

  const backToTop = () => {
    window.scrollTo({ top: 0, behavior: smooth.value ? "smooth" : "auto" });
  };

  // 标题集合变了（切换文章、内容重渲染）就重新量一遍
  watch(headings, measure, { immediate: true, flush: "post" });

  useEventListener(window, "scroll", update, { passive: true });
  useEventListener(window, "resize", measure, { passive: true });
  // 图片/代码块异步撑开会改变标题位置，body 尺寸变化时重量
  useResizeObserver(document.body, measure);

  return {
    progress,
    activeIndex,
    readingY,
    fillBetween,
    scrollToHeading,
    backToTop,
    /** 外部改变了布局时手动重量 */
    measure,
  };
}

<!-- src/views/main/components/post/toc/PostToc.vue -->
<script setup lang="ts">
import { computed, onUnmounted, ref, toRef } from "vue";
import { usePreferredReducedMotion } from "@vueuse/core";
import { useLang } from "@/composables/lang.hook";
import TocList from "./TocList.vue";
import { useReadingPosition } from "./use-reading-position";
import { buildSections } from "./toc-model";
import type { TocHeading } from "./extract-headings";

/**
 * PostToc — 前台文章的页边目录（壳层）。
 *
 * 位置由 Post.page.vue 给：它活在正文左侧的空白里，不占文档流宽度，
 * 所以这里不需要再做「收起态整块 pointer-events-none 免得挡住正文」
 * 那类闪避 —— 它压根不覆盖正文，整块都可以接事件。
 *
 * 展开只有一个状态位，三个触发源都收敛到它，避免各写各的互相打架：
 * 指针悬停、键盘聚焦（focus-within，纯键盘用户否则永远拿不到子标题）、
 * 以及阅读进度处在两端（见 atEdge）。
 */

const props = defineProps<{
  headings: TocHeading[];
}>();

/** 悬停意图：进入后延迟这么久才展开，避免鼠标扫过页边就炸开 */
const OPEN_DELAY = 100;
/**
 * 离开后延迟这么久才收起。比开启延迟长得多是刻意的：
 * 指针在行与行之间移动、或短暂划出边界再回来都不该把目录关掉。
 */
const CLOSE_DELAY = 260;

/**
 * 判定「读完了」的进度阈值。
 * 不用 1.0 是为了留一点余量：滚动回弹、亚像素误差都会让进度在末尾附近
 * 反复擦过 1，卡在阈值上会让目录一开一合。
 */
const END_PROGRESS = 0.995;

const headings = toRef(props, "headings");
const { t } = useLang();

const motion = usePreferredReducedMotion();
const smooth = computed(() => motion.value !== "reduce");

const { progress, activeIndex, fillBetween, scrollToHeading, backToTop } =
  useReadingPosition(headings, smooth);

const sections = computed(() => buildSections(props.headings));

const hovering = ref(false);
const focused = ref(false);

/**
 * 阅读进度处在两端：还没进入任何章节（activeIndex < 0），或者已经读完。
 *
 * 收起态存在的理由是「你正在读某一节时别挡路」。而这两个端点上读者并不在
 * 任何一节里 —— 开头是在建立预期，结尾是已经读完要回顾或返回 —— 这时候
 * 整份结构比一个游标有用得多，所以直接摊开。
 *
 * 这条规则同时替掉了原来的「触底后继续下拨才展开」：那套要监听 wheel、
 * 累加 deltaY、再在离开底部时复位，三处状态只为表达一个「读完了」的意思，
 * 而进度本身就已经把它算出来了。
 */
const atEdge = computed(
  () => activeIndex.value < 0 || progress.value >= END_PROGRESS,
);

const expanded = computed(
  () => hovering.value || focused.value || atEdge.value,
);

// ---------------------------------------------------------------- 悬停意图
let hoverTimer: ReturnType<typeof setTimeout> | undefined;

const clearHoverTimer = () => {
  if (hoverTimer !== undefined) {
    clearTimeout(hoverTimer);
    hoverTimer = undefined;
  }
};

const scheduleHover = (value: boolean) => {
  clearHoverTimer();
  hoverTimer = setTimeout(
    () => {
      hovering.value = value;
      hoverTimer = undefined;
    },
    value ? OPEN_DELAY : CLOSE_DELAY,
  );
};

onUnmounted(clearHoverTimer);
</script>

<template>
  <!--
    高度策略：max-h 封顶到视口（sticky top-24 已经占掉 6rem，底部再留 3rem
    呼吸），超出后由 TocList 内部滚动。不设固定高度 —— 目录要从顶部往下按
    内容自然生长，短文的目录就该只有几行高，而不是撑成一整列空白。

    与 hero 的关系：目录列用了 top-48（跳过 PostHeader），所以目录的自然起始
    位置在正文旁边（hero 图的下方）。滚动后 sticky top-24 把目录钉在 header 下方。
    不需要淡出：初始位置就在 hero 以下，不会重叠。
    光有 max-h 只会裁掉 nav 自己的盒子，height:auto 的子元素照旧按内容高度
    往外溢出，内部那个 overflow-y-auto 永远不会被激活（矮视口 + 长目录时
    目录会直接漫过视口底部）。flex 项的 flex-grow 是按容器「用过的」高度
    解析的，也就是被 max-h 夹过之后的值，正好把约束传下去。
  -->
  <nav
    v-if="headings.length > 0"
    class="flex max-h-[calc(100vh-9rem)] flex-col"
    :aria-label="t('views.main.post.toc.label')"
    @pointerenter="scheduleHover(true)"
    @pointerleave="scheduleHover(false)"
    @focusin="focused = true"
    @focusout="focused = false"
  >
    <TocList
      :headings="headings"
      :sections="sections"
      :active-index="activeIndex"
      :progress="progress"
      :expanded="expanded"
      :fill="fillBetween"
      @select="scrollToHeading"
      @top="backToTop"
    />
  </nav>
</template>

<!-- src/views/main/components/post/toc/TocList.vue -->
<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { CircleArrowUp } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import ButtonThird from "@/components/base/button/ButtonThird.vue";
import type { TocHeading } from "./extract-headings";
import type { TocSection } from "./toc-model";

/**
 * TocList — 页边目录主体。
 *
 * 形态：一条从上往下生长的导轨，没有卡片、没有边框、没有背景。
 * 层级只用缩进表达，不画连线也不放箭头 —— 目录一旦有了盒子，
 * 就从「页边注记」降级成「另一个组件」，会开始和正文抢注意力。
 *
 * 三种展开来源，优先级从大到小：
 *   1. 指针悬停 / 键盘聚焦（expanded）—— 全部章节展开
 *   2. 读到哪一章，那一章自己展开 —— 手风琴跟着阅读位置走
 *   3. 其余章节只留标题
 * 顶层行的高度在任何状态下都不变，展开只是把子标题容器从 0fr 拉到 1fr，
 * 已读章节的填充量不会因为展开而跳动，过渡也只有一个属性在动。
 *
 * 导轨即进度条，由三层构成，各自只干一件事：
 *   .toc-track  轨槽，贯穿全长
 *   .toc-fill   已读底色，从顶端画到当前阅读位置
 *   .toc-comet  流星，固定 3rem 的渐变拖尾（始终是一根线，前端最亮）
 *
 * 三者都是整条导轨上唯一的一个，挂在滚动内容上、位置由 JS 算成 px，
 * 而不是逐行渲染。逐行的做法有两个绕不过去的毛病：
 *   1. 子标题分组为了折叠动画带了 opacity 0↔1，一淡出就把那几截轨道
 *      一起淡掉，线上出现豁口 —— 标题该淡，导轨不该断；
 *   2. 分组还带 overflow:hidden，逐行的拖尾一到分组边缘就被削掉。
 *
 * 三者都必须显式声明 transition-property：tailwind.css 里全局 `*` 那条
 * 过渡列表包含 scale / transform / box-shadow（200ms），不覆盖的话滚动时
 * 每帧都在重启一次 200ms 过渡，填充与流星就永远追在滚动后面 —— 表现为
 * 「发滞、不跟手」。它们是滚动位置的直接映射，必须零延迟。
 */

const props = defineProps<{
  headings: TocHeading[];
  sections: TocSection[];
  /** 当前标题下标 */
  activeIndex: number;
  /** 正文阅读进度 0~1 */
  progress: number;
  /** 是否展开全部子标题 */
  expanded: boolean;
  /** 区间 [from, to) 的读取完成度 0~1 */
  fill: (from: number, to: number) => number;
}>();

const emit = defineEmits<{
  select: [index: number];
  top: [];
}>();

const { t } = useLang();

/** 子标题折叠动画的跟量帧数，覆盖最长的一档过渡（340ms） */
const REVEAL_FRAMES = 26;

const RING_R = 6;
const RING_C = 2 * Math.PI * RING_R;

const percent = computed(() => Math.round(props.progress * 100));

/** 当前标题所属章节的序号 */
const activeOrder = computed(() => {
  const i = props.activeIndex;
  if (i < 0) return -1;
  let order = -1;
  props.sections.forEach((section, index) => {
    if (section.index <= i) order = index;
  });
  return order;
});

/**
 * 子标题是否展开。悬停时全开，否则只开当前所在的那一章 ——
 * 读到哪儿就把那一节摊开，比「全靠悬停」少一次交互，
 * 也让收起态始终能看清自己在本章的哪个位置。
 */
const isOpen = (order: number) => props.expanded || activeOrder.value === order;

/** 顶层行是否为当前行：本章折叠时看章节，展开后看具体标题 */
const isSectionCurrent = (order: number, index: number) =>
  isOpen(order) ? props.activeIndex === index : activeOrder.value === order;

const isSectionRead = (order: number, index: number) =>
  isOpen(order) ? props.activeIndex > index : activeOrder.value > order;

/**
 * 文字三档。只有当前行用强调色，其余靠不透明度分已读/未读 ——
 * 未读压得很低是为了让整列在余光里只剩一个亮点，扫读时不抢正文。
 */
const toneClass = (current: boolean, read: boolean) => {
  if (current) return "text-accent";
  if (read) return "text-fg/60 hover:text-fg/85 dark:text-fg/55";
  // 未读在浅色底上要比深色底上厚一点：同样的 alpha，深色文字压在近白背景上
  // 感知对比度掉得更快，深色模式那档 30% 搬到浅色下就快看不见了
  return "text-fg/40 hover:text-fg/70 dark:text-fg/30 dark:hover:text-fg/65";
};

/**
 * 折叠过渡：展开慢一点、用 easeOutCubic（有「铺开」的从容感），
 * 收起快一点、用 easeInQuad —— 离场比入场快是刻意的，
 * 用户已经不想看它了，别让人等一个正在消失的东西。
 */
const foldClass = (open: boolean) =>
  open
    ? "grid-rows-[1fr] opacity-100 duration-[340ms] ease-[cubic-bezier(0.33,1,0.68,1)]"
    : "grid-rows-[0fr] opacity-0 duration-[200ms] ease-[cubic-bezier(0.4,0,1,1)]";

// ---------------------------------------------------------------- 自动跟随
const scrollRef = ref<HTMLElement | null>(null);
/** 滚动内容的定位父级；流星的坐标以它为基准 */
const contentRef = ref<HTMLElement | null>(null);
const itemRefs = new Map<number, HTMLElement>();

const setItemRef = (index: number, el: unknown) => {
  if (el instanceof HTMLElement) itemRefs.set(index, el);
  else itemRefs.delete(index);
};

let revealFrames = 0;
let revealRaf = 0;

/** 逐层累加 offsetTop：子标题容器展开/收起会改变 offsetParent 链，直接读 offsetTop 会跳 */
const offsetTopIn = (el: HTMLElement, root: HTMLElement) => {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
};

// ---------------------------------------------------------------- 流星头部位置
/**
 * 当前行在滚动内容里的 offsetTop 与行高。
 *
 * 只在「当前行变了 / 折叠状态变了 / 标题集合变了」时重量（跟着下面那个 rAF
 * 窗口一起跑），滚动过程中不测量 —— 行的位置在滚动时并不会变，每帧去读
 * offsetTop 只会制造无意义的强制布局。
 */
const rowTop = ref(0);
const rowHeight = ref(32);

const measureActiveRow = () => {
  const root = contentRef.value;
  const el = itemRefs.get(props.activeIndex);
  if (!root || !el || !el.offsetHeight) return;
  rowTop.value = offsetTopIn(el, root);
  rowHeight.value = el.offsetHeight;
};

/**
 * 流星头部在滚动内容里的 y（px）。
 *
 * 当前行的填充比例乘上行高，加上行的起始位置。当前标题所在的章节一定是展开的
 * （见 isOpen），所以这里统一用「标题自己那一段」算比例，不必区分折叠态。
 */
const headPx = computed(() => {
  if (props.activeIndex < 0) return 0;
  const f = props.fill(props.activeIndex, props.activeIndex + 1);
  return rowTop.value + rowHeight.value * f;
});

/** 长目录时把当前项带回视野中央 */
const revealActive = () => {
  const root = scrollRef.value;
  const el = itemRefs.get(props.activeIndex);
  if (!root || !el || !el.offsetHeight) return;

  const top = offsetTopIn(el, root) - root.scrollTop;
  if (top < 0 || top + el.offsetHeight > root.clientHeight) {
    root.scrollTop =
      offsetTopIn(el, root) - root.clientHeight / 2 + el.offsetHeight / 2;
  }
};

/**
 * 折叠是动画的，落定之前量到的 offsetTop 都是中间值，
 * 所以布局变化后要连续跟量若干帧，而不是只在一个 nextTick 里量一次。
 */
const scheduleReveal = () => {
  revealFrames = REVEAL_FRAMES;
  if (revealRaf) return;
  const loop = () => {
    measureActiveRow();
    revealActive();
    if (--revealFrames > 0) {
      revealRaf = requestAnimationFrame(loop);
    } else {
      revealRaf = 0;
    }
  };
  revealRaf = requestAnimationFrame(loop);
};

watch(
  () => [props.activeIndex, props.expanded, props.headings],
  scheduleReveal,
  { immediate: true, flush: "post" },
);

onUnmounted(() => {
  if (revealRaf) cancelAnimationFrame(revealRaf);
});
</script>

<template>
  <!-- flex-1 + min-h-0：把 PostToc 上的 max-h 约束接下来，否则内部滚动区不生效 -->
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- 标题行：只有「文章目录」 -->
    <div
      class="shrink-0 pb-2.5 pl-3.5 text-[0.7rem] tracking-[0.16em] text-fg/35 uppercase"
    >
      {{ t("views.main.post.toc.label") }}
    </div>

    <div ref="scrollRef" class="toc-scroll relative min-h-0 overflow-y-auto">
      <!-- 流星的定位基准：行的 offsetTop 都相对它算。
           流星必须和行处在同一个滚动内容里，长目录内部滚动时才会跟着一起动。 -->
      <div ref="contentRef" class="relative">
        <!--
          导轨三层都挂在这里，不再逐行渲染。

          之前每行各画一截轨道，于是子标题分组为了折叠动画带的
          opacity 0↔1 会把那几截一起淡掉 —— 线上就出现豁口。
          标题淡进淡出是对的，导轨不该跟着断。挂在滚动内容上之后，
          分组怎么折叠都只改变内容高度，这条线永远是完整的一根。
        -->
        <span class="toc-track" aria-hidden="true" />
        <span
          class="toc-fill"
          :style="{ '--head': `${headPx}px` }"
          aria-hidden="true"
        />

        <div
          v-for="(section, order) in sections"
          :key="headings[section.index]?.id ?? section.index"
        >
          <!-- 顶层章节行 -->
          <div
            :ref="(el) => setItemRef(section.index, el)"
            class="flex h-8 items-center"
          >
            <a
              class="block min-w-0 flex-1 cursor-pointer truncate pl-3.5 text-[0.82rem] leading-snug no-underline"
              :class="
                toneClass(
                  isSectionCurrent(order, section.index),
                  isSectionRead(order, section.index),
                )
              "
              :href="`#${headings[section.index]?.id ?? ''}`"
              :title="headings[section.index]?.text"
              @click.prevent="emit('select', section.index)"
            >
              {{ headings[section.index]?.text }}
            </a>
          </div>

          <!-- 子标题：grid-template-rows 0fr↔1fr，无需测高的平滑折叠 -->
          <div
            v-if="section.children.length > 0"
            class="grid transition-[grid-template-rows,opacity] motion-reduce:transition-none"
            :class="foldClass(isOpen(order))"
          >
            <div class="min-h-0 overflow-hidden">
              <div
                v-for="index in section.children"
                :key="headings[index]?.id ?? index"
                :ref="(el) => setItemRef(index, el)"
                class="flex h-7 items-center"
              >
                <a
                  class="block min-w-0 flex-1 cursor-pointer truncate pl-7 text-[0.76rem] leading-snug no-underline"
                  :class="toneClass(activeIndex === index, activeIndex > index)"
                  :href="`#${headings[index]?.id ?? ''}`"
                  :title="headings[index]?.text"
                  @click.prevent="emit('select', index)"
                >
                  {{ headings[index]?.text }}
                </a>
              </div>
            </div>
          </div>
        </div>

        <!--
          流星：一整条导轨上只有这一个。

          之前是每行各挂一个 8px 的实色小方块当游标，两个毛病：
          1. 拖尾（已读填充）是均匀色，游标是满色，中间没有任何过渡 —— 硬接缝；
          2. 它的辉光被滚动容器横向裁掉了左半边（overflow-y:auto 会让另一轴的
             visible 计算成 auto），剩下右半边就成了「长方形高亮」。
          现在是一整条固定长度的渐变线，跨行连续，位置由 JS 给 px。
        -->
        <span
          v-if="activeIndex >= 0"
          class="toc-comet"
          :style="{ '--head': `${headPx}px` }"
          aria-hidden="true"
        />
      </div>
    </div>

    <!-- 底部：进度环 + 百分比（常驻）；回到顶部（随悬停淡入） -->
    <div class="shrink-0 pt-3 pl-2.5">
      <!-- 进度环 + 百分比 -->
      <div class="flex items-center text-[0.8rem] text-fg/50">
        <svg class="mr-1.5 block" width="14" height="14" aria-hidden="true">
          <circle
            class="fill-none stroke-border"
            cx="7"
            cy="7"
            :r="RING_R"
            stroke-width="2"
          />
          <circle
            class="toc-ring fill-none stroke-accent"
            cx="7"
            cy="7"
            :r="RING_R"
            stroke-width="2"
            stroke-linecap="round"
            transform="rotate(-90 7 7)"
            :stroke-dasharray="RING_C"
            :stroke-dashoffset="RING_C * (1 - progress)"
          />
        </svg>
        <!-- w-8 固定宽度：避免 2%→12% 时数字从 1 位变 2 位导致光圈横向跳动 -->
        <span class="inline-block w-8 tabular-nums">{{ percent }}%</span>
      </div>

      <!-- 回到顶部：随悬停展开淡入 -->
      <ButtonThird
        :text="t('views.main.post.toc.backToTop')"
        class="mt-1 -ml-1 text-[0.76rem] transition-opacity duration-300 motion-reduce:transition-none"
        :class="
          expanded
            ? 'opacity-50 hover:opacity-100'
            : 'pointer-events-none opacity-0'
        "
        @click="emit('top')"
      >
        <CircleArrowUp class="mr-0.5 h-3.5 w-3.5" />
      </ButtonThird>
    </div>
  </div>
</template>

<style scoped>
/* 这里放的都是 Tailwind 表达不了的：mask 渐变、color-mix、
   以及必须显式覆盖全局过渡列表的那几条。其余样式一律走 Tailwind class。 */

.toc-scroll {
  scrollbar-width: none;

  /*
    padding-left + 等量负 margin：给流星前端的辉光留出不会被裁掉的横向空间，
    同时让内容视觉位置保持原样（盒子往左长一截，内边距再把内容推回来）。

    为什么必须这么做：overflow-y:auto 会让另一根轴上的 visible 计算成 auto
    （CSS Overflow 规范），也就是说这个容器其实**横向也在裁切**。辉光会被
    裁在内容盒左边缘，只剩右半边 —— 之前那个「长方形高亮」就是这么来的。
  */
  padding-left: 0.75rem;
  margin-left: -0.75rem;

  /* 上下溢出淡出，避免长目录被硬切 */
  mask: linear-gradient(
    to bottom,
    transparent 0,
    black 18px,
    black calc(100% - 18px),
    transparent 100%
  );
}

.toc-scroll::-webkit-scrollbar {
  display: none;
}

/* 进度环：dashoffset 不在全局过渡列表里，单独给它一段 */
.toc-ring {
  transition: stroke-dashoffset 0.3s var(--default-transition-timing-function);
}

/* --- 导轨 --- */

.toc-track,
.toc-fill,
.toc-comet {
  position: absolute;
  left: 0;
  width: 2px;
  border-radius: 9999px;
}

/* 轨槽：从内容顶端贯到底端，永远是完整的一根 */
.toc-track {
  top: 0;
  bottom: 0;
  background-color: color-mix(in srgb, var(--theme-fg) 12%, transparent);
}

/* 已读段：从顶端一直画到当前阅读位置 */
.toc-fill {
  top: 0;
  height: var(--head);
  /*
    底色比流星末端淡不少：流星那 3rem 的渐变要能从这个底色平滑地爬到满色，
    底色越接近满色，可用的过渡区间就越短、接缝越明显。
  */
  background-color: color-mix(in srgb, var(--theme-accent) 32%, transparent);
  /* height 不在全局过渡列表里，这里显式声明只是为了把意图钉住：
     它是滚动位置的直接映射，任何过渡都会让它拖在后面 */
  transition-property: background-color;
}

/*
  流星：整条导轨上唯一的一个，头部（下端）就是当前阅读位置。

  拖尾长度固定 3rem，不随读取比例伸缩 —— 如果让它跟着 scaleY 拉伸，
  读到章节开头时会是一小截、读到结尾时会被抻成一条长条，形状不稳定。
  固定长度 + translate 定位，形状永远一致，只是在轨道上滑行。
*/
.toc-comet {
  top: 0;
  height: 3rem;
  /* --head 是头部在滚动内容里的 y；减去自身高度让「下端」对齐它 */
  translate: 0 calc(var(--head) - 3rem);
  /*
    从完全透明爬到满色。中间多给几个锚点，让亮度是加速上升的，
    不是线性 —— 线性渐变在视觉上反而会显出一条边。
    末端（下端）就是当前阅读位置，也是整条线最亮的地方。
  */
  background: linear-gradient(
    to bottom,
    transparent 0%,
    color-mix(in srgb, var(--theme-accent) 18%, transparent) 45%,
    color-mix(in srgb, var(--theme-accent) 55%, transparent) 78%,
    color-mix(in srgb, var(--theme-accent) 85%, transparent) 94%,
    var(--theme-accent) 100%
  );
  /*
    辉光用 drop-shadow 而不是 box-shadow：drop-shadow 跟随元素自身的 alpha
    通道，所以拖尾透明的那一段不会发光，只有前端亮起来的地方才有光晕 ——
    等于免费得到「越靠前越亮」的衰减，不需要再叠一个元素。
    box-shadow 则是按盒子边框画的，整条 3rem 都会均匀发光，看着像根灯管。
  */
  filter: drop-shadow(
    0 0 3px color-mix(in srgb, var(--theme-accent) 75%, transparent)
  );
  /* 位置必须零延迟：它是滚动的直接映射，加过渡就会拖在后面 */
  transition-property: background;
  pointer-events: none;
}

/* 游标：填充末端那颗亮点，尺寸恒定，只做平移。
   宽度与轨道同宽（2px），不横向溢出，因此不会被子标题容器的
   overflow:hidden 削掉半边。 */
.toc-cap {
  top: 0;
  height: 0.5rem;
  margin-top: -0.25rem;
  translate: 0 calc(var(--rowh) * var(--f));
  background-color: var(--theme-accent);
  box-shadow: 0 0 7px color-mix(in srgb, var(--theme-accent) 55%, transparent);
  /* 同上：translate 要零延迟，否则游标会拖在滚动后面 */
  transition-property: background-color, box-shadow;
}

@media (prefers-reduced-motion: reduce) {
  .toc-ring {
    transition: none;
  }
}
</style>

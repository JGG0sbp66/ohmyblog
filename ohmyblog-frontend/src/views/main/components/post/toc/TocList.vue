<!-- src/views/main/components/post/toc/TocList.vue -->
<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { CircleArrowUp } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import ButtonThird from "@/components/base/button/ButtonThird.vue";
import type { TocHeading } from "./extract-headings";
import type { VisibleRange } from "./use-reading-position";

/**
 * TocList — 目录主体，收起/展开共用同一套行结构。
 *
 * 每个标题 = 一枚刻度（tick）+ 一段文本：
 * - 收起态：行被压扁，文本隐藏（只留当前小节的标题），刻度是一截
 *   小横线 —— 整列像一把「章节刻度尺」：已读亮灰、当前主题色发光
 *   加长、未读暗淡，文章结构与阅读进度一眼可读；
 * - 展开态：行高松开，文本从刻度右侧淡入，刻度原地「立起」变成
 *   行首的竖向指示条，当前行染主题色。
 *
 * 两态共享 DOM，过渡只是每行自己的 width / height / opacity，
 * 不需要测量，也不需要 JS 动画。收起时所有文本同时淡出 —— 曾经按
 * 与当前项的距离做涟漪延迟，视觉上变成按标题顺序乱着消失，反而廉价。
 * 连续的三级标题依旧收成可折叠分组，只有相关的那组展开。
 */

const props = defineProps<{
  headings: TocHeading[];
  activeIndex: number;
  visibleRange: VisibleRange;
  /** 阅读进度 0~1 */
  progress: number;
  /** 列表态是否可见；收起时文本涟漪退场、刻度回倒成横线 */
  expanded: boolean;
}>();

const emit = defineEmits<{
  select: [index: number];
  top: [];
}>();

const { t } = useLang();

/** 分组折叠动画的跟量帧数，覆盖 400ms 过渡 */
const REVEAL_FRAMES = 30;

const RING_R = 6;
const RING_C = 2 * Math.PI * RING_R;

// ---------------------------------------------------------------- 渲染模型
interface TocGroup {
  /** 分组内标题下标 */
  items: number[];
  /** 分组归属的上级标题下标 */
  parent: number;
}

type TocNode =
  | { kind: "item"; index: number }
  | { kind: "group"; group: TocGroup };

/** 把扁平标题表折成「顶层条目 + 三级标题分组」 */
const nodes = computed<TocNode[]>(() => {
  const out: TocNode[] = [];
  let current: TocGroup | null = null;

  props.headings.forEach((heading, index) => {
    if (heading.depth >= 3) {
      let group = current;
      if (!group) {
        group = { items: [], parent: index - 1 };
        out.push({ kind: "group", group });
        current = group;
      }
      group.items.push(index);
    } else {
      current = null;
      out.push({ kind: "item", index });
    }
  });

  return out;
});

const isGroupOpen = (group: TocGroup) => {
  const first = group.items[0] ?? -1;
  const last = group.items[group.items.length - 1] ?? -1;
  const { from, to } = props.visibleRange;
  return (
    (props.activeIndex >= first && props.activeIndex <= last) ||
    props.activeIndex === group.parent ||
    (from >= 0 && to >= first && from <= last)
  );
};

// ---------------------------------------------------------------- 行样式
/** 文本三档：当前 → 主题色加粗；视口内可见 → 中间档；其余 → 最淡 */
const entryClass = (index: number) => {
  if (index === props.activeIndex) return "text-accent font-medium opacity-100";
  const { from, to } = props.visibleRange;
  const near = from >= 0 && index >= from && index <= to;
  return near ? "opacity-70" : "opacity-35 hover:opacity-80";
};

/** 文本缩进：二级 1rem，每深一级 +0.75rem */
const indentOf = (index: number) =>
  `${1 + ((props.headings[index]?.depth ?? 2) - 2) * 0.75}rem`;

/** 收起态当前行的标题要完整露出，padding 让开加长的当前刻度 */
const labelPadding = (index: number) => {
  if (!props.expanded && index === props.activeIndex) {
    return (props.headings[index]?.depth ?? 2) >= 3 ? "1.5rem" : "2.25rem";
  }
  return indentOf(index);
};

/** 收起态只留当前小节的标题，其余隐藏；展开后恢复三档亮度 */
const labelClass = (index: number) => {
  if (props.expanded) return `translate-x-0 ${entryClass(index)}`;
  if (index === props.activeIndex)
    return "translate-x-0 text-accent font-medium opacity-90";
  return "pointer-events-none -translate-x-2 opacity-0";
};

const percent = computed(() => Math.round(props.progress * 100));

// ---------------------------------------------------------------- 刻度
/** 阅读状态：当前 / 已读 / 未读 —— 刻度尺的三种明暗 */
const tickState = (index: number) => {
  if (index === props.activeIndex) return "current";
  if (index < props.activeIndex) return "read";
  return "todo";
};

/** 刻度尺寸：展开态立起为竖条；收起态按层级分长短横线 */
const tickSizeClass = (index: number) => {
  if (props.expanded) return "h-3.5 w-[2px]";
  return (props.headings[index]?.depth ?? 2) >= 3
    ? "h-[2px] w-3"
    : "h-[2px] w-5";
};

/** 当前刻度加长（仅收起态），让「读到哪」在刻度尺上更醒目 */
const tickCurrentClass = (index: number) =>
  props.expanded
    ? ""
    : (props.headings[index]?.depth ?? 2) >= 3
      ? "w-4"
      : "w-7";

// ---------------------------------------------------------------- 自动跟随
const scrollRef = ref<HTMLElement | null>(null);
const itemRefs = new Map<number, HTMLElement>();

const setItemRef = (index: number, el: unknown) => {
  if (el instanceof HTMLElement) itemRefs.set(index, el);
  else itemRefs.delete(index);
};

let revealFrames = 0;
let revealRaf = 0;

/** 逐层累加 offsetTop：分组展开/收起会改变 offsetParent 链，直接读 offsetTop 会跳 */
const offsetTopIn = (el: HTMLElement, root: HTMLElement) => {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
};

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
 * 分组折叠是动画的，落定之前量到的 offsetTop 都是中间值，
 * 所以布局变化后要连续跟量若干帧，而不是只在一个 nextTick 里量一次。
 */
const scheduleReveal = () => {
  revealFrames = REVEAL_FRAMES;
  if (revealRaf) return;
  const loop = () => {
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
  () => [props.activeIndex, props.visibleRange, props.expanded, props.headings],
  scheduleReveal,
  { immediate: true, flush: "post" },
);

onUnmounted(() => {
  if (revealRaf) cancelAnimationFrame(revealRaf);
});
</script>

<template>
  <div
    class="absolute inset-0 flex flex-col justify-center"
    :class="expanded ? 'pointer-events-auto' : 'pointer-events-none'"
  >
    <!-- 小标题：只在展开态出现 -->
    <div
      class="shrink-0 pb-2.5 pl-0.5 text-[0.72rem] tracking-[0.18em] text-fg/35 uppercase transition-opacity duration-300"
      :class="expanded ? 'opacity-100' : 'opacity-0'"
    >
      {{ t("views.main.post.toc.label") }}
    </div>

    <div ref="scrollRef" class="toc-scroll relative min-h-0 overflow-y-auto">
      <div class="flex flex-col">
        <template v-for="(node, i) in nodes" :key="i">
          <!-- 顶层条目 -->
          <div
            v-if="node.kind === 'item'"
            :ref="(el) => setItemRef(node.index, el)"
            class="group relative flex items-center transition-[height] duration-[350ms] ease-in-out"
            :class="expanded ? 'h-[22px]' : 'h-3'"
          >
            <span
              class="toc-tick absolute top-1/2 left-0 block shrink-0 -translate-y-1/2 rounded-full"
              :class="[
                tickSizeClass(node.index),
                tickState(node.index),
                tickState(node.index) === 'current'
                  ? tickCurrentClass(node.index)
                  : expanded
                    ? 'opacity-0 group-hover:opacity-50'
                    : '',
              ]"
              aria-hidden="true"
            />
            <a
              class="block min-w-0 flex-1 cursor-pointer truncate text-[0.8rem] leading-none text-fg no-underline transition-[opacity,translate,color,padding] duration-300 ease-in-out"
              :class="labelClass(node.index)"
              :style="{ paddingLeft: labelPadding(node.index) }"
              :href="`#${headings[node.index]?.id ?? ''}`"
              :title="headings[node.index]?.text"
              @click.prevent="emit('select', node.index)"
            >
              {{ headings[node.index]?.text }}
            </a>
          </div>

          <!-- 三级标题分组：grid-template-rows 0fr↔1fr，无需测高的平滑折叠 -->
          <div
            v-else
            class="grid transition-[grid-template-rows,opacity] duration-[400ms] ease-in-out"
            :class="
              isGroupOpen(node.group)
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
            "
          >
            <div class="min-h-0 overflow-hidden">
              <div
                v-for="index in node.group.items"
                :key="headings[index]?.id ?? index"
                :ref="(el) => setItemRef(index, el)"
                class="group relative flex items-center transition-[height] duration-[350ms] ease-in-out"
                :class="expanded ? 'h-[22px]' : 'h-3'"
              >
                <span
                  class="toc-tick absolute top-1/2 left-0 block shrink-0 -translate-y-1/2 rounded-full"
                  :class="[
                    tickSizeClass(index),
                    tickState(index),
                    tickState(index) === 'current'
                      ? tickCurrentClass(index)
                      : expanded
                        ? 'opacity-0 group-hover:opacity-50'
                        : '',
                  ]"
                  aria-hidden="true"
                />
                <a
                  class="block min-w-0 flex-1 cursor-pointer truncate text-[0.8rem] leading-none text-fg no-underline transition-[opacity,translate,color,padding] duration-300 ease-in-out"
                  :class="labelClass(index)"
                  :style="{ paddingLeft: labelPadding(index) }"
                  :href="`#${headings[index]?.id ?? ''}`"
                  :title="headings[index]?.text"
                  @click.prevent="emit('select', index)"
                >
                  {{ headings[index]?.text }}
                </a>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 底部：进度环与百分比常驻，回到顶部随展开淡入 -->
    <div class="shrink-0 pt-3 pl-0.5">
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
            class="fill-none stroke-accent transition-[stroke-dashoffset] duration-300"
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
        <span class="tabular-nums">{{ percent }}%</span>
      </div>

      <!-- -ml-1 抵消 ButtonThird 自带的 px-1，mr-0.5 把 gap 凑成 6px，
           让图标与文字和上面进度环那行（svg + mr-1.5）左对齐 -->
      <ButtonThird
        :text="t('views.main.post.toc.backToTop')"
        class="mt-1 -ml-1 text-[0.8rem] transition-opacity duration-300"
        :class="
          expanded
            ? 'opacity-60 hover:opacity-100'
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
/* 以下都是 Tailwind 表达不了的：多段 mask 渐变、color-mix 辉光。
   其余样式一律走 Tailwind class。 */

.toc-scroll {
  scrollbar-width: none;
  /* 上下溢出淡出，避免长目录被硬切 */
  mask: linear-gradient(
    to bottom,
    transparent 0,
    black 24px,
    black calc(100% - 24px),
    transparent 100%
  );
}

.toc-scroll::-webkit-scrollbar {
  display: none;
}

/* 刻度 morph：横线 ↔ 竖条全靠 width / height 过渡 */
.toc-tick {
  transition:
    width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toc-tick.read {
  background-color: color-mix(in srgb, var(--theme-fg) 40%, transparent);
}

.toc-tick.todo {
  background-color: color-mix(in srgb, var(--theme-fg) 15%, transparent);
}

.toc-tick.current {
  background-color: var(--theme-accent);
  box-shadow: 0 0 6px color-mix(in srgb, var(--theme-accent) 45%, transparent);
}
</style>

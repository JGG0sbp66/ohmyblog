<!-- src/views/main/components/post/toc/TocList.vue -->
<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { useLang } from "@/composables/lang.hook";
import type { TocHeading } from "./extract-headings";
import type { VisibleRange } from "./use-reading-position";

/**
 * TocList — 目录的展开态。
 *
 * 几个刻意的做法：
 * - 高亮条只有一个元素，靠 top / height 过渡在标题之间「滑 + 伸」过去，
 *   而不是每项各一条、切换时硬跳；
 * - 它的高度覆盖「当前标题 → 最后一个可见标题」，底部渐隐，
 *   读数是「视口里正在读的这一段」而不是「光标停在哪一行」；
 * - 连续的三级标题收进可折叠分组，只有相关的那组展开，长文目录才不会糊成一片。
 */

const props = defineProps<{
  headings: TocHeading[];
  activeIndex: number;
  visibleRange: VisibleRange;
  /** 阅读进度 0~1 */
  progress: number;
  /** 列表态是否可见；收起时条目做涟漪退场、高亮条隐藏 */
  expanded: boolean;
}>();

const emit = defineEmits<{
  select: [index: number];
  top: [];
}>();

const { t } = useLang();

/** 涟漪延迟步进：延迟 = |index − activeIndex| × 本值，从当前项向两端荡开 */
const RIPPLE_STEP = 50;
/** 高亮条跟量的帧数，要覆盖分组折叠的 400ms 过渡 */
const MARKER_FRAMES = 40;

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

/** 三档：当前 → 主题色加粗；视口内可见 → 中间档；其余 → 最淡 */
const entryClass = (index: number) => {
  if (index === props.activeIndex) return "text-accent font-medium opacity-100";
  const { from, to } = props.visibleRange;
  const near = from >= 0 && index >= from && index <= to;
  return near ? "opacity-70" : "opacity-35 hover:opacity-80";
};

/** 二级 1rem，每深一级 +0.6rem（与参考实现实测值一致） */
const indentOf = (index: number) =>
  `${1 + ((props.headings[index]?.depth ?? 2) - 2) * 0.6}rem`;

const rippleOf = (index: number) =>
  `${Math.abs(index - props.activeIndex) * RIPPLE_STEP}ms`;

const percent = computed(() => Math.round(props.progress * 100));

// ---------------------------------------------------------------- 高亮条
const scrollRef = ref<HTMLElement | null>(null);
const itemRefs = new Map<number, HTMLElement>();

const setItemRef = (index: number, el: unknown) => {
  if (el instanceof HTMLElement) itemRefs.set(index, el);
  else itemRefs.delete(index);
};

const markerVisible = ref(false);
const markerTop = ref(0);
const markerHeight = ref(0);

let markerFrames = 0;
let markerRaf = 0;

/**
 * 分组折叠是动画的，落定之前量到的 offsetTop 都是中间值，
 * 所以布局变化后要连续跟量若干帧，而不是只在一个 nextTick 里量一次。
 */
const scheduleMarkerSync = () => {
  markerFrames = MARKER_FRAMES;
  if (markerRaf) return;
  const loop = () => {
    syncMarker();
    if (--markerFrames > 0) {
      markerRaf = requestAnimationFrame(loop);
    } else {
      markerRaf = 0;
    }
  };
  markerRaf = requestAnimationFrame(loop);
};

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

const syncMarker = () => {
  const root = scrollRef.value;
  const head = itemRefs.get(props.activeIndex);
  if (!root || props.activeIndex < 0 || !head || !head.offsetHeight) {
    markerVisible.value = false;
    return;
  }

  // 盖到最后一个可见标题为止；它可能在折叠分组里，取不到就退回当前项
  const tailIndex = Math.max(props.activeIndex, props.visibleRange.to);
  const tail = itemRefs.get(tailIndex) ?? head;

  const top = offsetTopIn(head, root);
  const bottom = offsetTopIn(tail, root) + tail.offsetHeight;

  markerVisible.value = true;
  markerTop.value = top;
  markerHeight.value = Math.max(head.offsetHeight, bottom - top);
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

watch(
  () => [props.activeIndex, props.visibleRange, props.expanded, props.headings],
  () => {
    scheduleMarkerSync();
    revealActive();
  },
  { immediate: true, flush: "post" },
);

onUnmounted(() => {
  if (markerRaf) cancelAnimationFrame(markerRaf);
});
</script>

<template>
  <div
    class="absolute inset-0 flex flex-col justify-center"
    :class="expanded ? 'pointer-events-auto' : 'pointer-events-none'"
  >
    <div
      ref="scrollRef"
      class="toc-scroll relative min-h-0 overflow-y-auto pl-0.5"
    >
      <!-- 单条共享高亮条；底部渐隐 + 辉光见样式块 -->
      <span
        class="toc-marker absolute left-0 w-0.5 rounded-sm"
        :class="expanded && markerVisible ? 'opacity-100' : 'opacity-0'"
        :style="{ top: `${markerTop}px`, height: `${markerHeight}px` }"
      />

      <template v-for="(node, i) in nodes" :key="i">
        <!-- 顶层条目 -->
        <div
          v-if="node.kind === 'item'"
          :ref="(el) => setItemRef(node.index, el)"
          class="relative leading-none transition-[opacity,translate] duration-[350ms] ease-in-out"
          :class="
            expanded ? '' : 'opacity-0 -translate-x-2.5 delay-[var(--ripple)]'
          "
          :style="{ '--ripple': rippleOf(node.index) }"
        >
          <a
            class="relative mb-[1.5px] inline-block max-w-full min-w-0 truncate py-[0.22rem] text-[0.8rem] leading-[1.45] text-fg no-underline transition-[opacity,color] duration-300 ease-in-out"
            :class="entryClass(node.index)"
            :style="{ paddingLeft: indentOf(node.index) }"
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
              class="relative leading-none transition-[opacity,translate] duration-[350ms] ease-in-out"
              :class="
                expanded
                  ? ''
                  : 'opacity-0 -translate-x-2.5 delay-[var(--ripple)]'
              "
              :style="{ '--ripple': rippleOf(index) }"
            >
              <a
                class="relative mb-[1.5px] inline-block max-w-full min-w-0 truncate py-[0.22rem] text-[0.8rem] leading-[1.45] text-fg no-underline transition-[opacity,color] duration-300 ease-in-out"
                :class="entryClass(index)"
                :style="{ paddingLeft: indentOf(index) }"
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

    <!-- 手绘波浪分隔线 -->
    <div
      class="relative h-8 shrink-0 text-fg/12 transition-opacity duration-300"
      :class="expanded ? 'opacity-100' : 'opacity-0'"
    >
      <svg
        class="absolute top-1/2 block h-2.5 w-[150px] max-w-full -translate-y-1/2"
        viewBox="0 0 28 10"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M2 7 C4 2, 7 2, 9 5.5 C11 9, 14 9, 16 5 C18 1, 21 2, 24 6"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linecap="round"
          vector-effect="non-scaling-stroke"
        />
      </svg>
    </div>

    <div
      class="w-fit shrink-0 pl-0.5 text-[0.8rem] text-fg transition-opacity duration-300"
      :class="expanded ? 'opacity-100' : 'opacity-0'"
    >
      <div class="relative pl-4">
        <svg
          class="absolute top-1/2 left-0 block -translate-x-2 -translate-y-1/2"
          width="14"
          height="14"
          aria-hidden="true"
        >
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
        <span>{{ percent }}%</span>
      </div>

      <button
        type="button"
        class="relative mt-1 flex cursor-pointer items-center border-0 bg-transparent pl-4 whitespace-nowrap opacity-50 transition-opacity duration-500 hover:opacity-100"
        @click="emit('top')"
      >
        <svg
          class="absolute top-1/2 left-0 -translate-x-2 -translate-y-1/2"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path
            d="M12 16.5V8M8.2 11.8 12 8l3.8 3.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        {{ t("views.main.post.toc.backToTop") }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 以下两条都是 Tailwind 表达不了的：多段 mask 渐变、伪元素、双层 color-mix 阴影。
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

/* 底部渐隐 + 双层辉光，是「虚化」的来源。
   top / height 不在全局 * 过渡列表里（那里只有 width），必须显式声明。 */
.toc-marker {
  background: linear-gradient(
    to bottom,
    var(--theme-accent) 0%,
    var(--theme-accent) 80%,
    transparent 100%
  );
  box-shadow:
    0 0 6px color-mix(in srgb, var(--theme-accent) 35%, transparent),
    1px 0 12px color-mix(in srgb, var(--theme-accent) 12%, transparent);
  transition:
    top 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>

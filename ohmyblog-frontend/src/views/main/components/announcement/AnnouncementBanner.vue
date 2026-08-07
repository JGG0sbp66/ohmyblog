<!-- src/views/main/components/announcement/AnnouncementBanner.vue -->
<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import { useMediaQuery, useResizeObserver } from "@vueuse/core";
import { RiMegaphoneLine, RiCloseLine } from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";
import { useAnnouncement } from "./use-announcement";
import AnnouncementModal from "./AnnouncementModal.vue";

/**
 * AnnouncementBanner — 移动端公告横幅
 *
 * 侧边栏在 md 以下是隐藏的，公告卡片跟着一起看不见，所以移动端换一种形态：
 * 一条贴边的横幅，从下方内容板背后探出一截（下方三个前台页面在移动端都是
 * -mx-4 的不透明圆角板，正好能压住横幅的下半截）。
 *
 * 正文单行展示，溢出时横向滚动；点击展开全文弹窗，右侧 X 关闭。
 */

const { t } = useLang();
const { available, title, content, dismissed, dismiss } = useAnnouncement();

const modalOpen = ref(false);

// 横幅比侧边栏卡片多一层「本条已被关掉」的判断
const visible = computed(() => available.value && !dismissed.value);

/*
  跑马灯

  两个前提，缺一不可：
  1. 只在内容真的放不下时才滚 —— 短公告滚起来纯属添乱
  2. 系统开了「减少动态效果」就不滚 —— 与站内其他动画的处理保持一致
     （见 css/animations.css 里 .typing-caret 的兜底）
  滚动时轨道里放两份内容，位移一份的宽度 + 间距即可无缝衔接。
*/
const MARQUEE_GAP = 48; // 两份内容之间的间距，与模板里的 pr-12 对应
const MARQUEE_SPEED = 45; // px/s，再快就看不清了

const viewportRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const overflowing = ref(false);
const shift = ref(0);

const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
const marquee = computed(() => overflowing.value && !reduceMotion.value);

const measure = () => {
  const viewport = viewportRef.value;
  const first = contentRef.value;
  if (!viewport || !first) return;
  // 容差 1px：不同缩放比例下 scrollWidth 会有亚像素误差，否则会误判成溢出
  overflowing.value = first.scrollWidth - viewport.clientWidth > 1;
  shift.value = first.scrollWidth + MARQUEE_GAP;
};

useResizeObserver(viewportRef, measure);
useResizeObserver(contentRef, measure);
// 公告内容变了要重新量（后台预览里是边打字边变）
watch([title, content], () => nextTick(measure));

/*
  进出场动画：从文章板背后「长出来」/「缩回去」

  只动一件事 —— 横幅自身的高度。不要再叠 transform：横幅位移与下方内容让位
  是方向相反的两段位移，数值又接近，叠在一起的观感是横幅原地不动、整篇文章在滑，
  与意图正好相反。

  高度得用 JS 量：CSS 无法在 0 与 auto 之间插值。
  收起态不是 0 而是 peek（即 -mb-7 的绝对值）—— 外层带着这个负外边距，
  高度等于 peek 时净占位才是 0，取 0 反而会把下方内容多吸上去一截。
*/
const setHeight = (el: Element, value: string) => {
  (el as HTMLElement).style.height = value;
};

// 读一次布局强制刷新，让浏览器认下起始高度，否则两次赋值会被合并成一帧
const reflow = (el: Element) => void (el as HTMLElement).offsetHeight;

// 从 -mb-7 反推，避免和模板里的类名各写一份数字（也顺带跟随 rem 缩放）
const peekOf = (el: Element) =>
  -Number.parseFloat(getComputedStyle(el).marginBottom) || 0;

const onEnter = (el: Element) => {
  setHeight(el, "auto");
  const target = (el as HTMLElement).offsetHeight;
  setHeight(el, `${peekOf(el)}px`);
  reflow(el);
  setHeight(el, `${target}px`);
};

const onLeave = (el: Element) => {
  setHeight(el, `${(el as HTMLElement).offsetHeight}px`);
  reflow(el);
  setHeight(el, `${peekOf(el)}px`);
};

const clearHeight = (el: Element) => setHeight(el, "");

const trackStyle = computed(() => ({
  "--marquee-shift": `${shift.value}px`,
  "--marquee-duration": `${Math.min(40, Math.max(8, shift.value / MARQUEE_SPEED))}s`,
}));
</script>

<template>
  <!--
    -mb-7 把下方内容板拉上来压住横幅的下半截，配合 pb-10 只露出顶部一条；
    它挂在外层，过渡时的高度基准（peek）就是从这个值反推的。
    z-0 / 内容侧 z-10 定压盖方向。

    md:hidden 写在这里而不是由父组件传：本组件是多根（横幅 + 弹窗），
    父级的 class 无处落脚会被 Vue 丢弃。弹窗不能挪进这个 div —— relative z-0
    会造出层叠上下文，把它压到内容层下面。
  -->
  <Transition
    name="banner"
    @enter="onEnter"
    @after-enter="clearHeight"
    @enter-cancelled="clearHeight"
    @leave="onLeave"
    @after-leave="clearHeight"
    @leave-cancelled="clearHeight"
  >
    <div v-if="visible" class="md:hidden -mx-4 -mb-7 relative z-0">
      <div
        class="bg-bg-muted border-b border-border/50 rounded-t-2xl pt-3 pb-10 pl-4 pr-2 flex items-center gap-2"
      >
        <RiMegaphoneLine class="w-4 h-4 shrink-0 text-accent" />

        <!-- 点击展开全文 -->
        <button
          type="button"
          ref="viewportRef"
          class="flex-1 min-w-0 overflow-hidden text-left cursor-pointer"
          :class="overflowing ? 'announcement-marquee-mask' : ''"
          :aria-label="t('views.main.announcement.expand')"
          @click="modalOpen = true"
        >
          <div
            class="flex w-max items-center"
            :class="marquee ? 'marquee-track' : ''"
            :style="trackStyle"
          >
            <span ref="contentRef" class="whitespace-nowrap pr-12 text-xs">
              <span class="font-bold text-fg">{{ title }}</span>
              <span class="text-fg-subtle/60 px-1.5">·</span>
              <span class="text-fg-muted">{{ content }}</span>
            </span>
            <!-- 第二份内容只在滚动时需要，用于首尾无缝衔接 -->
            <span
              v-if="marquee"
              aria-hidden="true"
              class="whitespace-nowrap pr-12 text-xs"
            >
              <span class="font-bold text-fg">{{ title }}</span>
              <span class="text-fg-subtle/60 px-1.5">·</span>
              <span class="text-fg-muted">{{ content }}</span>
            </span>
          </div>
        </button>

        <button
          type="button"
          class="shrink-0 p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-bg-card transition-colors cursor-pointer"
          :aria-label="t('views.main.announcement.close')"
          @click="dismiss"
        >
          <RiCloseLine class="w-4 h-4" />
        </button>
      </div>
    </div>
  </Transition>

  <AnnouncementModal v-model="modalOpen" />
</template>

<style scoped>
/*
  溢出时右侧淡出，替代 truncate 的省略号 —— 滚动状态下省略号没有意义，
  而静态截断时一条渐隐边比硬切干净。
*/
.announcement-marquee-mask {
  mask-image: linear-gradient(
    to right,
    black calc(100% - 2rem),
    transparent 100%
  );
}

/*
  过渡期间才裁剪：横幅露出多少完全由 height 决定，起止值由 JS 写在行内。

  裁剪区要向下多留 1.75rem（= -mb-7），否则被裁掉的正是「本该藏在文章板背后」
  的那一截 —— 文章板顶部两个圆角的缺口后面就空了，过渡全程透出页面底色，
  等动画结束撤掉裁剪才补上。overflow 只能一刀切四边，所以用 clip-path 的负 inset。

  曲线不带回弹（控制点 y > 1 会冲过终点再回落）—— 那会让横幅先露多再缩一下。
*/
.banner-enter-active,
.banner-leave-active {
  clip-path: inset(0 0 -1.75rem 0);
  transition: height 350ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* 与站内其他动画一致：系统开了「减少动态效果」就直接切换 */
@media (prefers-reduced-motion: reduce) {
  .banner-enter-active,
  .banner-leave-active {
    transition: none;
  }
}
</style>

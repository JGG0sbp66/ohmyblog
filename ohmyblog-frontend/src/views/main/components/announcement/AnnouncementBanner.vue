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
  进出场动画

  横幅本身带 -mb-7（下方内容板压住它的下半截），所以「收起」不能只做位移 ——
  否则位置腾空了、占位还在，等 v-if 摘掉节点时下方内容会突然跳一下。
  这里在过渡开始前量一次实际高度写进 CSS 变量，让 margin-bottom 一路补到
  -高度（即彻底不占位），位移和塌陷同时进行。
  位移方向朝下：横幅在 z-0，下方内容板不透明且在 z-10，看起来就是缩回板子背后。
*/
const rememberHeight = (el: Element) => {
  const node = el as HTMLElement;
  node.style.setProperty("--banner-collapsed-mb", `-${node.offsetHeight}px`);
};

const trackStyle = computed(() => ({
  "--marquee-shift": `${shift.value}px`,
  "--marquee-duration": `${Math.min(40, Math.max(8, shift.value / MARQUEE_SPEED))}s`,
}));
</script>

<template>
  <!--
    -mb-7 把下方内容板拉上来压住横幅的下半截，配合 pb-10 使横幅只露出顶部一条。
    z-0 / 内容侧 z-10 保证压盖方向正确。

    md:hidden 写在这里而不是由父组件传：本组件是多根（横幅 + 弹窗），
    父级的 class 无处落脚会被 Vue 丢弃。弹窗不能挪进这个 div —— relative z-0
    会造出层叠上下文，把它压到内容层下面。
  -->
  <Transition
    name="banner"
    @before-enter="rememberHeight"
    @before-leave="rememberHeight"
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
  进出场：位移 + 淡出 + 塌陷同步进行。
  --banner-collapsed-mb 由 JS 在过渡前按实测高度写入（见 rememberHeight），
  兜底值取 -mb-7 本身，拿不到高度时退化为纯淡出、不跳动。
  作用域样式带 [data-v] 属性，特异性高于 Tailwind 的 -mb-7，不用 !important。
*/
.banner-enter-active,
.banner-leave-active {
  transition:
    opacity 250ms ease,
    transform 350ms cubic-bezier(0.34, 1.2, 0.64, 1),
    margin-bottom 350ms ease;
}

.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(60%);
  margin-bottom: var(--banner-collapsed-mb, -1.75rem);
}

/* 与站内其他动画一致：系统开了「减少动态效果」就直接切换 */
@media (prefers-reduced-motion: reduce) {
  .banner-enter-active,
  .banner-leave-active {
    transition: none;
  }
}
</style>

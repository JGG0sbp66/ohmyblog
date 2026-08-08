// src/composables/editor-header.hook.ts
import { onBeforeUnmount, ref, watch, type Ref } from "vue";
import { useIsMobile } from "./breakpoint.hook";

/**
 * 移动端编辑页的顶部栏收起状态（模块级单例）
 *
 * 为什么需要一个单例而不是 props / provide：
 * 收起动作发生在 AdminLayout（它持有顶部栏和内容区的位移），但触发信号在
 * PostEditorContent 里 —— 编辑页真正滚动的是编辑器自己的 overflow-y-auto 容器，
 * 不是 AdminLayout 的 <main>（PostEditor.page 的 BaseCard 是 flex-1 overflow-hidden，
 * 把滚动吃在了内部）。两者隔着路由出口，跨三层传 props 不如共享一份状态。
 *
 * 写入方：useEditorHeaderCollapse（编辑器侧，绑定滚动容器）
 * 读取方：useEditorHeaderState（AdminLayout）
 *
 * 桌面端不走这套 —— 那边是 hover 驱动的（AdminLayout 里的 isHeaderHovered），
 * 本 hook 在非移动端完全不挂监听。
 */

/** 收起后仍然露在屏幕上的高度，也是进度条那条的高度 */
export const HEADER_SLIVER_PX = 12;

/** 同方向累积位移阈值：低于它不动，避免手指微抖就抽动 */
const SCROLL_THRESHOLD_PX = 24;
/** 接近顶部时无条件展开（滚到头了就该看见顶部栏） */
const TOP_ALWAYS_SHOW_PX = 16;
/** 失焦后延迟展开，避开标题↔正文之间切换焦点时的瞬时 focusout */
const BLUR_EXPAND_DELAY_MS = 200;

const collapsed = ref(false);
/** 文档滚动进度 0~1，收起后由那条细线呈现 */
const progress = ref(0);

/** 读取侧：AdminLayout 用 */
export function useEditorHeaderState() {
  return {
    collapsed,
    progress,
    /** 点收起后露出的那条 → 手动展开（对应桌面端的 hover 展开） */
    expand: () => {
      collapsed.value = false;
    },
  };
}

/**
 * 写入侧：由持有滚动容器的组件调用。
 *
 * 三个触发源，写在一处避免互相打架：
 * - 向下滚动累积超阈值 → 收起
 * - 向上滚动累积超阈值 / 滚到接近顶部 → 展开
 * - 编辑器（标题或正文）获得焦点 → 收起；失焦 → 展开
 *   打字时才是最缺垂直空间的时刻，这条比滚动更贴合意图。
 */
export function useEditorHeaderCollapse(scrollRef: Ref<HTMLElement | null>) {
  const isMobile = useIsMobile();

  let lastY = 0;
  /** 同方向累积位移，换向时清零 */
  let accum = 0;
  let frame = 0;
  let blurTimer: ReturnType<typeof setTimeout> | undefined;
  let detach: (() => void) | null = null;
  /**
   * 收起是否由「编辑器持有焦点」保持着。
   * 必须记这一笔：在文档开头打字时，ProseMirror 会把光标滚进视图从而产生
   * scrollTop ≈ 0 的滚动事件，若不区分，下面「接近顶部无条件展开」会立刻
   * 把顶部栏又推回来——而文档开头正是开始写作的地方。
   */
  let focusHeld = false;

  const measure = (el: HTMLElement) => {
    // iOS 橡皮筋会给出负的 scrollTop，钳掉避免进度条反向
    const y = Math.max(0, el.scrollTop);
    const max = el.scrollHeight - el.clientHeight;
    progress.value = max > 0 ? Math.min(1, y / max) : 0;

    const delta = y - lastY;
    lastY = y;

    // 被动规则：滚到头了就该看见顶部栏。但正在打字时不适用（见 focusHeld）
    if (y <= TOP_ALWAYS_SHOW_PX && !focusHeld) {
      collapsed.value = false;
      accum = 0;
      return;
    }

    // 换向即清零，否则要先抵消掉反方向攒下的量才能触发
    if (delta > 0 !== accum > 0) accum = 0;
    accum += delta;

    if (accum > SCROLL_THRESHOLD_PX) {
      collapsed.value = true;
      accum = 0;
    } else if (accum < -SCROLL_THRESHOLD_PX) {
      collapsed.value = false;
      accum = 0;
    }
  };

  const onScroll = (event: Event) => {
    const el = event.currentTarget as HTMLElement;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      measure(el);
    });
  };

  const onFocusIn = () => {
    clearTimeout(blurTimer);
    focusHeld = true;
    collapsed.value = true;
  };

  const onFocusOut = () => {
    blurTimer = setTimeout(() => {
      focusHeld = false;
      collapsed.value = false;
    }, BLUR_EXPAND_DELAY_MS);
  };

  const reset = () => {
    collapsed.value = false;
    progress.value = 0;
    lastY = 0;
    accum = 0;
    focusHeld = false;
    clearTimeout(blurTimer);
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  watch(
    [scrollRef, isMobile] as const,
    ([el, mobile]) => {
      detach?.();
      detach = null;
      reset();

      if (!el || !mobile) return;

      el.addEventListener("scroll", onScroll, { passive: true });
      // focusin / focusout 会从后代冒泡上来，绑在滚动容器上即可覆盖标题与正文
      el.addEventListener("focusin", onFocusIn);
      el.addEventListener("focusout", onFocusOut);
      lastY = Math.max(0, el.scrollTop);

      detach = () => {
        el.removeEventListener("scroll", onScroll);
        el.removeEventListener("focusin", onFocusIn);
        el.removeEventListener("focusout", onFocusOut);
      };
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    detach?.();
    detach = null;
    // 离开编辑页必须复位：状态是模块级的，留着会让别的页面顶部栏也是收起的
    reset();
  });
}

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
/**
 * 两次切换之间的最小间隔，略大于 AdminLayout 的 300ms 过渡。
 * 过渡期间容器高度在渐变，本来就不该在这段时间内反向切换。
 */
const TOGGLE_COOLDOWN_MS = 350;

const collapsed = ref(false);
/** 文档滚动进度 0~1，收起后由那条细线呈现 */
const progress = ref(0);

/**
 * 「仍在编辑」保持位：置真期间 focusout 不再展开顶部栏。
 *
 * 目前唯一的使用者是移动端的插入面板（MobileEditorToolbar）：打开它必须主动 blur
 * 编辑器才能收起键盘，但那只是把键盘换成了面板，用户依然在编辑 —— 顶部栏没有
 * 理由弹回来。不加这道闸门的话，点一下「+」，「文章管理 / 写文章」那排就会跟着
 * 冒出来半截，把本来腾出来的垂直空间又占回去。
 */
const collapseHold = ref(false);

/** 由「虽然编辑器失焦、但用户仍在编辑」的场景调用（成对置真 / 置假） */
export function setEditorHeaderHold(on: boolean) {
  collapseHold.value = on;
}

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
  /**
   * 上一次采样时滚动容器的可视高度。
   *
   * 这是防自激振荡的关键。收起顶部栏会让内容区变高（AdminLayout 给内容区加负
   * marginTop），滚动容器的 clientHeight 随之增大，maxScroll = scrollHeight -
   * clientHeight 因此缩小；**在文档最底部** scrollTop 正好等于 maxScroll，浏览器
   * 必须把它夹回新上限，于是冒出一个方向朝上的滚动事件。那不是用户滑的，是我们
   * 自己的布局变化，喂给方向判定就成了闭环：
   *   下滑 → 收起 → 容器变高 → scrollTop 被夹 → 判为上滑 → 展开 → 下滑 → …
   * 顶部栏于是在最底部反复弹动（且因为 marginTop 有 300ms 过渡，这段位移是几十
   * 个小事件累加出来的，看起来就是持续抖）。
   *
   * 所以：容器高度一变，本次采样只重设基线、不参与方向判定。
   */
  let lastHeight = 0;
  /** 上次切换的时刻，用于冷却（见下方 TOGGLE_COOLDOWN_MS） */
  let toggledAt = 0;

  /**
   * @param force 跳过冷却。焦点变化是明确的用户意图、且不参与上面那个闭环，
   *   不能被冷却吞掉——focusin 只会来一次，丢了就再也不会补。
   */
  const setCollapsed = (value: boolean, force = false) => {
    if (collapsed.value === value) return;
    // 二道保险：即使某帧的高度变化恰好被四舍五入抹平、漏进了方向判定，
    // 冷却也能把振荡频率压到肉眼无感，不至于回到"持续弹动"。
    if (!force && performance.now() - toggledAt < TOGGLE_COOLDOWN_MS) return;
    toggledAt = performance.now();
    collapsed.value = value;
  };

  const measure = (el: HTMLElement) => {
    // iOS 橡皮筋会给出负的 scrollTop，钳掉避免进度条反向
    const y = Math.max(0, el.scrollTop);
    const height = el.clientHeight;
    const max = el.scrollHeight - height;
    progress.value = max > 0 ? Math.min(1, y / max) : 0;

    // 容器高度变了 → 这次位移是收起/展开自己造成的，不是用户输入
    if (height !== lastHeight) {
      lastHeight = height;
      lastY = y;
      accum = 0;
      return;
    }

    const delta = y - lastY;
    lastY = y;

    // 被动规则：滚到头了就该看见顶部栏。但正在打字时不适用（见 focusHeld）
    if (y <= TOP_ALWAYS_SHOW_PX && !focusHeld) {
      setCollapsed(false);
      accum = 0;
      return;
    }

    // 换向即清零，否则要先抵消掉反方向攒下的量才能触发
    if (delta > 0 !== accum > 0) accum = 0;
    accum += delta;

    if (accum > SCROLL_THRESHOLD_PX) {
      setCollapsed(true);
      accum = 0;
    } else if (accum < -SCROLL_THRESHOLD_PX) {
      setCollapsed(false);
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
    setCollapsed(true, true);
  };

  const onFocusOut = () => {
    blurTimer = setTimeout(() => {
      // 保持位置真：这次失焦是「换成插入面板」而不是「停止编辑」，维持收起
      if (collapseHold.value) return;
      focusHeld = false;
      setCollapsed(false, true);
    }, BLUR_EXPAND_DELAY_MS);
  };

  /**
   * 保持位翻转时补一次判定。
   * 置真：撤掉已经排上队的展开。
   * 置假：如果焦点没回到编辑区（例如用户是点了别处关掉面板的），按正常失焦流程展开。
   */
  watch(collapseHold, (held) => {
    if (held) {
      clearTimeout(blurTimer);
      return;
    }
    const el = scrollRef.value;
    if (el && el.contains(document.activeElement)) return;
    onFocusOut();
  });

  const reset = () => {
    collapsed.value = false;
    progress.value = 0;
    // 保持位是模块级的，离开编辑页必须一并清掉，否则会漏到别的页面
    collapseHold.value = false;
    lastY = 0;
    accum = 0;
    lastHeight = 0;
    toggledAt = 0;
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
      lastHeight = el.clientHeight;

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

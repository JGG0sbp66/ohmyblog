// src/composables/list-drag.hook.ts
import { computed, onBeforeUnmount, ref, type CSSProperties } from "vue";

interface ListDragOptions {
  /** 当前列表长度，用于夹取落点索引 */
  count: () => number;
  /** 提交换序：把 from 位置的项移动到 to 位置 */
  move: (from: number, to: number) => void;
  /**
   * 取第 index 项的根元素，用来量它的位置与高度。
   * 由宿主提供而不是本 hook 自己查 DOM —— 列表项长什么样、挂在哪，只有宿主知道。
   */
  getItemEl: (index: number) => HTMLElement | null;
}

/** 手指/鼠标要走过这么多像素才认定是拖拽，避免和点击、页面滚动抢手势 */
const DRAG_THRESHOLD = 6;

/**
 * 读取元素当前**已渲染生效**的纵向位移。
 *
 * 用途见 onPointerMove：Vue 的响应式赋值不会同步落到样式上，
 * 要把实测矩形还原成静止位置，只能问浏览器「你现在实际画的是多少」。
 */
function appliedTranslateY(el: HTMLElement): number {
  const transform = getComputedStyle(el).transform;
  if (!transform || transform === "none") return 0;
  try {
    return new DOMMatrixReadOnly(transform).m42;
  } catch {
    return 0;
  }
}

/**
 * 列表拖拽排序（纵向）。
 *
 * 为什么不用 HTML5 拖放：draggable + dragstart 那套在触摸屏上根本不触发，
 * 移动端要另写一套 touch 事件。改用 Pointer Events 一套代码同时覆盖鼠标、触摸、笔，
 * 与 sheet-drag.hook 的手势处理保持同一套约定（isPrimary 判断、鼠标只认左键、
 * setPointerCapture 锁定指针）。
 *
 * 交互模型是「占位换序」而不是「落点插入」：拖动中一旦越过邻项的中线就立刻交换，
 * 松手即结束，不需要额外的落点指示器。好处是所见即所得 —— 拖动过程中列表就是
 * 松手后的样子；代价是数据在拖动途中被连续改写，所以宿主的换序必须是廉价操作
 * （数组 splice 级别）。
 *
 * 越过中线才换序（而不是一进入就换）是为了消除抖动：若以「碰到就换」为判据，
 * 交换后指针立刻又落在新邻项的边缘，会在两个位置之间反复横跳。
 */
export function useListDrag({ count, move, getItemEl }: ListDragOptions) {
  /** 正在拖动的项索引；null 表示没有进行中的拖拽 */
  const draggingIndex = ref<number | null>(null);
  /** 跟手位移，仅作用于被拖动的那一项 */
  const dragOffset = ref(0);

  let activePointerId: number | null = null;
  let startY = 0;
  let started = false;
  let capturedEl: HTMLElement | null = null;

  /** 拖动中的项：跟手位移 + 抬起层级，禁用过渡以免和位移打架 */
  const dragStyle = computed<CSSProperties>(() => ({
    transform: `translate3d(0, ${dragOffset.value}px, 0)`,
    transition: "none",
    position: "relative",
    zIndex: 30,
    willChange: "transform",
  }));

  const isDragging = (index: number) => draggingIndex.value === index;

  const reset = () => {
    if (capturedEl && activePointerId !== null) {
      // 释放指针捕获；元素可能已被卸载，失败无所谓
      try {
        capturedEl.releasePointerCapture(activePointerId);
      } catch {
        /* 元素已卸载或捕获已自动释放 */
      }
    }
    draggingIndex.value = null;
    dragOffset.value = 0;
    activePointerId = null;
    startY = 0;
    started = false;
    capturedEl = null;
  };

  /**
   * 按住手柄开始候选拖拽。
   *
   * 此刻还不算拖拽，只记起点：真正进入拖拽要等位移超过阈值（见 onPointerMove）。
   * 这样手柄上的点击不会被误判成拖拽，触屏上的轻扫也还能滚页面。
   */
  const onPointerDown = (event: PointerEvent, index: number) => {
    if (
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    activePointerId = event.pointerId;
    startY = event.clientY;
    started = false;
    capturedEl = event.currentTarget as HTMLElement;
    capturedEl.setPointerCapture(event.pointerId);
    draggingIndex.value = index;
    dragOffset.value = 0;
  };

  const onPointerMove = (event: PointerEvent) => {
    if (draggingIndex.value === null || event.pointerId !== activePointerId) {
      return;
    }

    const delta = event.clientY - startY;
    if (!started) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      started = true;
    }

    dragOffset.value = delta;

    const current = draggingIndex.value;
    const direction = delta > 0 ? 1 : -1;
    const neighbor = current + direction;
    if (neighbor < 0 || neighbor >= count()) return;

    const currentEl = getItemEl(current);
    const neighborEl = getItemEl(neighbor);
    if (!currentEl || !neighborEl) return;

    // 被拖项的静止位置 = 实测矩形 - DOM 上已经生效的位移。
    //
    // 必须这样倒推，不能直接用实测矩形：dragOffset 是响应式的，赋值不会同步落到
    // 样式上，本次事件里读到的 transform 其实是上一帧的值。直接拿实测矩形判定，
    // 换序会稳定地滞后一个移动事件（实测：下拖到 120px 才换位，而那一刻 DOM 里
    // 只应用了 80px 的位移）。倒推出静止位置、再叠加本次的 delta，判据就与手指同步。
    const currentRect = currentEl.getBoundingClientRect();
    const staticTop = currentRect.top - appliedTranslateY(currentEl);
    const neighborRect = neighborEl.getBoundingClientRect();
    const neighborCenter = neighborRect.top + neighborRect.height / 2;

    // 判据是「被拖项的前缘越过邻项中线」，而不是「两者中心交错」。
    //
    // 分组是手风琴，展开的那组可能比收起的邻组高好几倍。若比中心，
    // 把高组往下挪一位需要拖过「自身半高 + 邻组半高」，展开态下就是几百像素，
    // 手感像拖不动。比前缘只需要压过邻组一半，和肉眼判断「我已经盖过去了」一致。
    const leadingEdge =
      direction > 0
        ? staticTop + currentRect.height + delta
        : staticTop + delta;
    const crossed =
      direction > 0
        ? leadingEdge > neighborCenter
        : leadingEdge < neighborCenter;
    if (!crossed) return;

    move(current, neighbor);
    draggingIndex.value = neighbor;
    // 以新槽位为新锚点：被拖项刚落进邻项的位置，位移归零后继续跟手。
    // 这样就不用拿高度去做补偿运算 —— 高度不等时那种算法必然攒出偏差。
    startY = event.clientY;
    dragOffset.value = 0;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (draggingIndex.value === null || event.pointerId !== activePointerId) {
      return;
    }
    reset();
  };

  /**
   * 本次手势是否已经真的在拖动。
   *
   * 宿主用它抑制拖拽结束时那一下多余的点击 —— 手柄若同时是可点区域
   * （比如手风琴头部），松手后浏览器还会补发 click。
   */
  const hasMoved = () => started;

  onBeforeUnmount(reset);

  return {
    draggingIndex,
    dragStyle,
    isDragging,
    hasMoved,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}

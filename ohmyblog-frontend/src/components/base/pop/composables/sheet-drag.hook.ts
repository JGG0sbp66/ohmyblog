import { computed, onBeforeUnmount, ref, watch, type CSSProperties } from "vue";

interface SheetDragOptions {
  /** 弹层是否打开；关闭时用来清空上一次手势残留。 */
  isOpen: () => boolean;
  /** 手势完成关闭动画后通知宿主更新 v-model。 */
  close: () => void;
}

const COLLAPSED_MAX_HEIGHT = "72dvh";
const EXPANDED_HEIGHT = "92dvh";
const EXPANDED_HEIGHT_RATIO = 0.92;
const SETTLE_DURATION = 180;
const SNAP_DISTANCE = 64;
const FLICK_DISTANCE = 20;
const FLICK_VELOCITY = 0.5;

/**
 * Bottom Sheet 的双向拖拽状态机。
 *
 * 状态转换分为三段：
 * 1. 收起状态上拉 -> 展开；
 * 2. 展开状态下拉 -> 收起；
 * 3. 收起状态下拉 -> 关闭。
 *
 * DOM 结构和业务内容由 BaseSheet 负责，这里只暴露手势事件、动态样式与展开状态。
 */
export function useSheetDrag({ isOpen, close }: SheetDragOptions) {
  const sheetRef = ref<HTMLElement | null>(null);
  const dragOffset = ref(0);
  const dragHeight = ref<number | null>(null);
  const dragDelta = ref(0);
  const isDragging = ref(false);
  const gestureActive = ref(false);
  const isClosingFromDrag = ref(false);
  const isExpanded = ref(false);

  let startY = 0;
  let startHeight = 0;
  let collapsedHeight = 0;
  let lastMoveTime = 0;
  let dragVelocity = 0;
  let previousDelta = 0;
  let startedExpanded = false;
  let activePointerId: number | null = null;
  let settleTimer: number | undefined;

  /** 拖动时改用内联样式，避免 Tailwind 的 transform 与跟手位移互相覆盖。 */
  const sheetStyle = computed<CSSProperties>(() => {
    const style: CSSProperties = {
      paddingBottom: "env(safe-area-inset-bottom, 1rem)",
      maxHeight:
        isExpanded.value || dragHeight.value !== null
          ? EXPANDED_HEIGHT
          : COLLAPSED_MAX_HEIGHT,
    };

    if (isExpanded.value) style.height = EXPANDED_HEIGHT;
    if (dragHeight.value !== null) style.height = `${dragHeight.value}px`;

    if (gestureActive.value) {
      style.transform = `translate3d(0, ${dragOffset.value}px, 0)`;
      style.transition = isDragging.value
        ? "none"
        : `height ${SETTLE_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${SETTLE_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      style.willChange = "height, transform";
    }

    return style;
  });

  const clearSettleTimer = () => {
    if (settleTimer === undefined) return;
    window.clearTimeout(settleTimer);
    settleTimer = undefined;
  };

  const reset = () => {
    clearSettleTimer();
    dragOffset.value = 0;
    dragHeight.value = null;
    dragDelta.value = 0;
    isDragging.value = false;
    gestureActive.value = false;
    isClosingFromDrag.value = false;
    isExpanded.value = false;
    collapsedHeight = 0;
    activePointerId = null;
  };

  /** 保留动态样式到回弹结束，防止提前移除 transform 造成闪跳。 */
  const finishSettle = (callback?: () => void) => {
    clearSettleTimer();
    settleTimer = window.setTimeout(() => {
      callback?.();
      gestureActive.value = false;
      settleTimer = undefined;
    }, SETTLE_DURATION);
  };

  const settleCollapsed = () => {
    isDragging.value = false;
    dragOffset.value = 0;
    dragHeight.value = collapsedHeight || null;
    finishSettle(() => (dragHeight.value = null));
  };

  const settleExpanded = () => {
    isDragging.value = false;
    dragOffset.value = 0;
    dragHeight.value = null;
    isExpanded.value = true;
    finishSettle();
  };

  const collapse = () => {
    isDragging.value = false;
    dragOffset.value = 0;
    isExpanded.value = false;
    dragHeight.value = collapsedHeight || null;
    finishSettle(() => (dragHeight.value = null));
  };

  /**
   * 先用跟手位移把面板送出屏幕，再更新 v-model。
   * 额外等待一次离场动画，是为了让 Transition 接管 DOM 时不跳回原位。
   */
  const closeFromDrag = () => {
    isDragging.value = false;
    isClosingFromDrag.value = true;
    dragOffset.value = sheetRef.value?.offsetHeight ?? window.innerHeight;
    clearSettleTimer();
    settleTimer = window.setTimeout(() => {
      settleTimer = undefined;
      close();
      settleTimer = window.setTimeout(reset, SETTLE_DURATION);
    }, SETTLE_DURATION);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    clearSettleTimer();
    activePointerId = event.pointerId;
    startY = event.clientY;
    startHeight = sheetRef.value?.offsetHeight ?? 0;
    startedExpanded = isExpanded.value;
    if (!startedExpanded) collapsedHeight = startHeight;

    lastMoveTime = performance.now();
    dragVelocity = 0;
    previousDelta = 0;
    dragOffset.value = 0;
    dragHeight.value = null;
    dragDelta.value = 0;
    gestureActive.value = true;
    isDragging.value = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!isDragging.value || event.pointerId !== activePointerId) return;

    const now = performance.now();
    const nextDelta = event.clientY - startY;
    const elapsed = Math.max(now - lastMoveTime, 1);
    const instantaneousVelocity = (nextDelta - previousDelta) / elapsed;

    // 低通滤波削弱触摸采样抖动，避免松手瞬间因单帧尖峰误判为甩动。
    dragVelocity = dragVelocity * 0.6 + instantaneousVelocity * 0.4;
    dragDelta.value = nextDelta;
    previousDelta = nextDelta;
    lastMoveTime = now;

    if (startedExpanded) {
      dragOffset.value = 0;
      dragHeight.value = Math.max(
        collapsedHeight,
        Math.min(
          window.innerHeight * EXPANDED_HEIGHT_RATIO,
          startHeight - nextDelta,
        ),
      );
    } else if (nextDelta < 0) {
      dragOffset.value = 0;
      dragHeight.value = Math.min(
        window.innerHeight * EXPANDED_HEIGHT_RATIO,
        startHeight - nextDelta,
      );
    } else {
      dragHeight.value = null;
      dragOffset.value = nextDelta;
    }
  };

  const onPointerEnd = (event: PointerEvent, cancelled = false) => {
    if (!isDragging.value || event.pointerId !== activePointerId) return;

    // 松手前超过 80ms 没有位移时不再视为甩动，只按实际距离判断。
    const velocity = performance.now() - lastMoveTime <= 80 ? dragVelocity : 0;
    const sheetHeight = sheetRef.value?.offsetHeight ?? window.innerHeight;
    const closeDistance = Math.min(120, sheetHeight * 0.25);

    activePointerId = null;
    if (cancelled) {
      if (startedExpanded) settleExpanded();
      else settleCollapsed();
      return;
    }

    if (startedExpanded) {
      const shouldCollapse =
        dragDelta.value >= SNAP_DISTANCE ||
        (dragDelta.value >= FLICK_DISTANCE && velocity >= FLICK_VELOCITY);
      if (shouldCollapse) collapse();
      else settleExpanded();
      return;
    }

    if (dragDelta.value < 0) {
      const upwardDistance = Math.abs(dragDelta.value);
      const shouldExpand =
        upwardDistance >= SNAP_DISTANCE ||
        (upwardDistance >= FLICK_DISTANCE && velocity <= -FLICK_VELOCITY);
      if (shouldExpand) settleExpanded();
      else settleCollapsed();
      return;
    }

    const shouldClose =
      dragOffset.value >= closeDistance ||
      (dragOffset.value >= 24 && velocity >= FLICK_VELOCITY);
    if (shouldClose) closeFromDrag();
    else settleCollapsed();
  };

  watch(isOpen, (open) => {
    if (!open && !isClosingFromDrag.value) reset();
  });

  onBeforeUnmount(clearSettleTimer);

  return {
    sheetRef,
    sheetStyle,
    isDragging,
    isExpanded,
    onPointerDown,
    onPointerMove,
    onPointerEnd,
  };
}

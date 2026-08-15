// src/composables/list-drag.hook.ts
import { nextTick, onBeforeUnmount, ref, type CSSProperties } from "vue";

interface ListDragOptions {
  /**
   * 提交换序：把 from 位置的项移动到 to 位置。
   *
   * 拖动途中会被连续调用（每越过一次邻项中线就调一次），
   * 所以它必须是廉价操作 —— 数组 splice 级别，别在里面发请求。
   */
  move: (from: number, to: number) => void;
  /** 抬起时的放大倍数，默认 1.02（再大就有廉价感） */
  liftScale?: number;
}

/** 拖拽项的标记属性：容器的直接子元素带上它才会被当成一项 */
const ITEM_ATTR = "data-sortable-item";
/** 带这个属性的子树内按下永不触发拖拽（按钮之类点一下就该有反应的地方） */
const NO_DRAG_ATTR = "data-no-drag";
/**
 * 带这个属性的子树内**按住不动**才起拖（输入框）。
 *
 * 输入框往往铺满整行，若把它整个排除，能拖的就只剩四周几像素，等于拖不动；
 * 若让它立刻起拖，又会抢掉「拖选文字」这个更常用的手势。折中办法是加一道延迟：
 * 直接拖 = 选文字，按住一下再拖 = 拖卡片。
 */
const HOLD_ATTR = "data-drag-hold";

/** 鼠标/笔：走过这么多像素才认定是拖拽，免得和点击抢手势 */
const POINTER_THRESHOLD = 5;
/** 需要「按住」的场合（触摸，或输入框这类 hold 区）按住这么久才激活 */
const HOLD_MS = 240;
/** 按住判定期间允许的抖动，超了就认定用户想滚页面 / 想选文字 */
const HOLD_SLOP = 10;

/** 让位动画（没被拖的那些项换到新槽位） */
const SHIFT_MS = 260;
/** 落位动画（松手后回到槽位、缩回原尺寸） */
const DROP_MS = 220;
/** 抬起动画（放大 + 起阴影） */
const LIFT_MS = 180;
/** 统一缓动：起步快、收尾慢，接近 iOS 那条曲线 */
const EASE = "cubic-bezier(0.22, 0.85, 0.24, 1)";

const LIFT_SHADOW = "0 20px 40px -16px rgb(0 0 0 / 0.45)";
/**
 * 落位时的目标阴影。
 *
 * 刻意不写 `none`：box-shadow 与关键字之间没法插值，写 none 会让阴影在松手那一刻
 * 硬切消失。给一个结构相同、完全透明的阴影，浏览器就能平滑地把它淡掉。
 */
const FLAT_SHADOW = "0 0 0 0 rgb(0 0 0 / 0)";

/** 读取元素**当前已渲染生效**的纵向位移，含 translate 与 transform 两条来源 */
function appliedTranslateY(el: HTMLElement): number {
  const style = getComputedStyle(el);
  let y = 0;

  // 让位动画用的是 translate 独立属性，过渡途中这里读到的是插值后的实时值
  const translate = style.translate;
  if (translate && translate !== "none") {
    const parts = translate.split(" ");
    if (parts.length > 1) y += Number.parseFloat(parts[1] ?? "0") || 0;
  }

  // 兜底：万一宿主的样式里还用了 transform
  const transform = style.transform;
  if (transform && transform !== "none") {
    try {
      y += new DOMMatrixReadOnly(transform).m42;
    } catch {
      /* 解析不了就当没有 */
    }
  }

  return y;
}

/**
 * 列表拖拽排序（纵向）。
 *
 * ## 交互模型
 *
 * 「整项可拖 + 占位换序」：按住项内任意空白处就能拖（不需要手柄），拖动中一旦越过
 * 邻项中线就立刻交换数据，松手即结束。所见即所得 —— 拖动过程中列表就是松手后的样子，
 * 不需要额外的落点指示器。
 *
 * 越过中线才换序（而不是一碰到就换）是为了消除抖动：若以「碰到就换」为判据，
 * 交换后指针立刻又落在新邻项的边缘，会在两个位置之间反复横跳。
 *
 * ## 三段动画
 *
 * - 抬起：`scale` 放大 + 阴影浮起，像把卡片从纸面拿起来（`LIFT_MS`）
 * - 跟手：`translate` 每帧跟指针，**不加过渡**，否则会拖出橡皮筋般的延迟
 * - 让位/落位：被挤走的项用 FLIP 平滑滑到新槽位（`SHIFT_MS`），松手的项滑回槽位并缩回（`DROP_MS`）
 *
 * 跟手与放大能同时各自过渡，靠的是 `translate` / `scale` **独立属性**而不是复合的
 * `transform`：复合属性只能整条一起过渡，那样跟手就必然被拖慢。
 *
 * 换序时被拖项不会「吸」到新槽位：`baseOffset` 会把槽位变化补偿掉（见 onPointerMove），
 * 视觉上它始终黏在指针下，动的只有让位的那一项。
 *
 * ## 为什么不用 HTML5 拖放 / 不用 auto-animate
 *
 * `draggable` + `dragstart` 在触摸屏上根本不触发，移动端要另写一套 touch 事件；
 * 改用 Pointer Events 一套代码覆盖鼠标、触摸、笔（与 sheet-drag.hook 同一套约定）。
 * auto-animate 会把**被拖的那一项**也一起动画，和跟手位移打架，所以让位动画自己写。
 *
 * ## 宿主需要做三件事
 *
 * 1. 容器绑 `ref="listRef"`，列表项是它的**直接子元素**且带 `data-sortable-item`
 * 2. 项上绑 `@pointerdown="onItemPointerDown"`、`:style="itemStyle(index)"`
 * 3. 项内按钮套 `data-no-drag`（永不起拖），输入框套 `data-drag-hold`（按住才起拖）
 *
 * 注意：项必须用**稳定的 key**（见 stable-key.hook），不能用数组下标。
 * 下标做 key 时 Vue 会原地改内容而不搬 DOM，让位动画无从计算，
 * 被拖的那一项还会在换序瞬间把内容甩给隔壁。
 */
export function useListDrag({ move, liftScale = 1.02 }: ListDragOptions) {
  /** 列表容器，由宿主绑定 */
  const listRef = ref<HTMLElement | null>(null);
  /** 正在拖动的项索引；null 表示没有进行中的拖拽 */
  const draggingIndex = ref<number | null>(null);
  /** 是否已真正抬起（过阈值 / 长按完成）。之前只是「候选」，还能退回成点击 */
  const lifted = ref(false);
  /** 松手后的落位阶段：样式仍在，但目标已归位，等过渡跑完再清 */
  const dropping = ref(false);
  /** 被拖项相对**当前槽位**的视觉位移 */
  const dragOffset = ref(0);

  let pointerId: number | null = null;
  /** 抬起瞬间的指针位置，作为跟手位移的锚点 */
  let anchorY = 0;
  let anchorX = 0;
  /** 换序造成的槽位变化补偿，累加进 dragOffset 以保持视觉连续 */
  let baseOffset = 0;
  /** 最近一次指针位置，用于长按激活时对齐锚点 */
  let lastY = 0;
  let dragEl: HTMLElement | null = null;
  let holdTimer: number | null = null;
  let dropTimer: number | null = null;
  /** 让位动画的收尾定时器，按元素记录，避免上一轮的清理打断下一轮 */
  const shiftTimers = new Map<HTMLElement, number>();

  /** 容器里的列表项（顺序与数据顺序一致） */
  const items = (): HTMLElement[] => {
    const root = listRef.value;
    if (!root) return [];
    return Array.from(root.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && el.hasAttribute(ITEM_ATTR),
    );
  };

  const clearShiftStyle = (el: HTMLElement) => {
    el.style.transition = "";
    el.style.translate = "";
  };

  const cancelShift = (el: HTMLElement) => {
    const timer = shiftTimers.get(el);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      shiftTimers.delete(el);
    }
  };

  /**
   * FLIP：把「看得见的旧位置」平滑地滑到「已经生效的新位置」。
   *
   * 数据换序后 DOM 已经搬完，元素是瞬间到位的。这里先把它按位移拉回肉眼刚才
   * 看到的地方（此时禁用过渡），强制回流让浏览器把这个起点记下来，再开过渡归零 ——
   * 于是观众看到的是一段滑动，而不是一次闪现。
   *
   * 快速连拖时可能上一段还没跑完就要开下一段：快照里存的是**视觉位置**
   * （槽位 + 已生效的位移），所以从半路接手也不会跳。
   */
  const playShift = (
    snapshot: Array<{ el: HTMLElement; visualTop: number }>,
  ) => {
    for (const { el, visualTop } of snapshot) {
      // 被拖的那一项由 itemStyle 独立驱动，绝不能让 FLIP 插手
      if (el === dragEl) continue;
      if (!el.isConnected) continue;

      cancelShift(el);
      // 用 offsetTop 而不是 getBoundingClientRect：布局坐标不受 transform 影响，
      // 拿到的天然是「静止槽位」，也不会被拖动途中的页面滚动干扰。
      const delta = visualTop - el.offsetTop;
      if (Math.abs(delta) < 0.5) {
        clearShiftStyle(el);
        continue;
      }

      el.style.transition = "none";
      el.style.translate = `0 ${delta}px`;
      void el.offsetHeight; // 强制回流，让上面这个起点被真正采纳
      el.style.transition = `translate ${SHIFT_MS}ms ${EASE}`;
      el.style.translate = "0 0";

      shiftTimers.set(
        el,
        window.setTimeout(() => {
          shiftTimers.delete(el);
          clearShiftStyle(el);
        }, SHIFT_MS + 60),
      );
    }
  };

  const snapshotVisualTops = () =>
    items().map((el) => ({
      el,
      visualTop: el.offsetTop + appliedTranslateY(el),
    }));

  const isDragging = (index: number) =>
    draggingIndex.value === index && lifted.value;

  /**
   * 被拖项的行内样式。其余项返回 undefined —— 让位动画走的是直接改 DOM 样式那条路，
   * 这里返回 undefined 时 Vue 不会去碰 style，两者不打架。
   */
  const itemStyle = (index: number): CSSProperties | undefined => {
    if (draggingIndex.value !== index) return undefined;

    // 候选阶段：把 translate/scale 显式落成初始值。
    // 目的是给抬起动画一个明确起点 —— 从关键字 none 插值到 1.02 并非所有引擎都肯过渡。
    if (!lifted.value) {
      return { translate: "0 0", scale: "1", transition: "none" };
    }

    const base: CSSProperties = {
      position: "relative",
      zIndex: 30,
      willChange: "translate, scale",
    };

    if (dropping.value) {
      return {
        ...base,
        translate: "0 0",
        scale: "1",
        boxShadow: FLAT_SHADOW,
        transition: `translate ${DROP_MS}ms ${EASE}, scale ${DROP_MS}ms ${EASE}, box-shadow ${DROP_MS}ms ${EASE}`,
      };
    }

    return {
      ...base,
      translate: `0 ${dragOffset.value}px`,
      scale: String(liftScale),
      boxShadow: LIFT_SHADOW,
      cursor: "grabbing",
      // 只给 scale / box-shadow 过渡：translate 必须逐帧跟手，加过渡就会拖泥带水
      transition: `scale ${LIFT_MS}ms ${EASE}, box-shadow ${LIFT_MS}ms ${EASE}`,
    };
  };

  /** 触摸激活后吃掉滚动：监听器是非 passive 的，preventDefault 才拦得住 */
  const onTouchMove = (event: TouchEvent) => {
    if (lifted.value && event.cancelable) event.preventDefault();
  };

  const addGlobalListeners = () => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    // 触摸也会走 pointer 事件，但滚动只能靠 touchmove 拦，所以两套都挂
    document.addEventListener("touchmove", onTouchMove, { passive: false });
  };

  const removeGlobalListeners = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    document.removeEventListener("touchmove", onTouchMove);
  };

  const restoreBodyStyle = () => {
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };

  const reset = () => {
    if (holdTimer !== null) {
      window.clearTimeout(holdTimer);
      holdTimer = null;
    }
    if (dropTimer !== null) {
      window.clearTimeout(dropTimer);
      dropTimer = null;
    }
    for (const [el, timer] of shiftTimers) {
      window.clearTimeout(timer);
      clearShiftStyle(el);
    }
    shiftTimers.clear();

    removeGlobalListeners();
    restoreBodyStyle();

    draggingIndex.value = null;
    lifted.value = false;
    dropping.value = false;
    dragOffset.value = 0;
    pointerId = null;
    anchorY = 0;
    anchorX = 0;
    baseOffset = 0;
    lastY = 0;
    dragEl = null;
  };

  /** 真正进入拖拽：从这一刻起才有放大、阴影和跟手 */
  const lift = () => {
    lifted.value = true;
    // 以「此刻」的指针位置为锚点：阈值内那几像素不计入位移，抬起时才不会跳一下
    anchorY = lastY;
    baseOffset = 0;
    dragOffset.value = 0;
    document.body.style.cursor = "grabbing";
    // 从输入框里按住起拖的情况：这时才锁选区，免得把已经存在的光标/选区拖成一片蓝
    document.body.style.userSelect = "none";
    // 输入框里按住起拖时它可能已经聚焦，收掉选区，视觉上干净些
    window.getSelection()?.removeAllRanges();
  };

  /**
   * 在项上按下，进入**候选**状态。
   *
   * 此刻还不算拖拽：鼠标在普通区域要等位移过阈值；触摸、或按在输入框这类 hold 区上，
   * 要等按住满 HOLD_MS。这样卡片上的点击（展开/收起）不会被误判成拖拽，
   * 触屏上的轻扫还能滚页面，输入框里的拖选文字也不会被抢走。
   */
  const onItemPointerDown = (event: PointerEvent) => {
    if (
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) return;
    // 删除按钮、添加按钮这类「点一下就该有反应」的控件永不起拖
    if (target.closest(`[${NO_DRAG_ATTR}]`)) return;

    const list = items();
    const itemEl = target.closest(`[${ITEM_ATTR}]`);
    const index = itemEl instanceof HTMLElement ? list.indexOf(itemEl) : -1;
    // 找不到属于自己的项就放手，交给别的层级处理（嵌套列表就靠这条各管一段）
    if (index < 0) return;

    // 上一次的落位动画还没跑完又要开拖：直接收尾，不让两段状态叠在一起
    if (draggingIndex.value !== null) reset();

    // 嵌套列表：内层认领了这次手势，外层就别跟着一起拖
    event.stopPropagation();

    const inHoldZone = target.closest(`[${HOLD_ATTR}]`) !== null;
    const needHold = event.pointerType === "touch" || inHoldZone;

    dragEl = list[index] ?? null;
    pointerId = event.pointerId;
    anchorY = event.clientY;
    anchorX = event.clientX;
    lastY = event.clientY;
    baseOffset = 0;
    dragOffset.value = 0;
    draggingIndex.value = index;
    lifted.value = false;
    dropping.value = false;

    addGlobalListeners();

    if (needHold) {
      holdTimer = window.setTimeout(() => {
        holdTimer = null;
        lift();
      }, HOLD_MS);
      // hold 区（输入框）此刻不能锁选区、也不能 preventDefault：
      // 那会连带掐掉聚焦、光标定位和拖选文字。真激活了再锁（见 lift）。
      if (!inHoldZone) document.body.style.userSelect = "none";
    } else {
      // 鼠标在普通区域：拦掉默认的拖选文字，顺手锁住选区
      document.body.style.userSelect = "none";
      event.preventDefault();
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (draggingIndex.value === null || event.pointerId !== pointerId) return;
    lastY = event.clientY;

    if (!lifted.value) {
      if (holdTimer !== null) {
        // 按住还没满，指针却动了 —— 判定为想滚页面 / 想选文字，让出这次手势
        const moved =
          Math.abs(event.clientY - anchorY) > HOLD_SLOP ||
          Math.abs(event.clientX - anchorX) > HOLD_SLOP;
        if (moved) reset();
        return;
      }
      if (Math.abs(event.clientY - anchorY) < POINTER_THRESHOLD) return;
      lift();
      return;
    }

    if (dropping.value) return;

    dragOffset.value = baseOffset + (event.clientY - anchorY);

    const current = draggingIndex.value;
    const direction = dragOffset.value > 0 ? 1 : -1;
    const neighbor = current + direction;
    const list = items();
    if (neighbor < 0 || neighbor >= list.length) return;

    const currentEl = list[current];
    const neighborEl = list[neighbor];
    if (!currentEl || !neighborEl) return;

    // 判据是「被拖项的前缘越过邻项中线」，而不是「两者中心交错」。
    //
    // 分组是手风琴，展开的那组可能比收起的邻组高好几倍。若比中心，把高组往下挪一位
    // 需要拖过「自身半高 + 邻组半高」，展开态下就是几百像素，手感像拖不动。
    // 比前缘只需压过邻组一半，和肉眼判断「我已经盖过去了」一致。
    //
    // 全部用 offsetTop/offsetHeight（布局坐标）：不含 transform，量到的是静止槽位，
    // 因此既不受自身放大影响，也不受邻项让位动画影响。
    const leadingEdge =
      direction > 0
        ? currentEl.offsetTop + currentEl.offsetHeight + dragOffset.value
        : currentEl.offsetTop + dragOffset.value;
    const neighborCenter = neighborEl.offsetTop + neighborEl.offsetHeight / 2;
    const crossed =
      direction > 0
        ? leadingEdge > neighborCenter
        : leadingEdge < neighborCenter;
    if (!crossed) return;

    const snapshot = snapshotVisualTops();
    const beforeTop = currentEl.offsetTop;

    move(current, neighbor);
    draggingIndex.value = neighbor;

    nextTick(() => {
      // 换序后被拖项的槽位变了。把槽位差额补进 baseOffset，它的**视觉位置**就不变 ——
      // 于是看不到「吸附」，动的只有让位的那一项。
      if (dragEl && dragEl.isConnected) {
        baseOffset += beforeTop - dragEl.offsetTop;
        dragOffset.value = baseOffset + (lastY - anchorY);
      }
      playShift(snapshot);
    });
  };

  const onPointerUp = (event: PointerEvent) => {
    if (draggingIndex.value === null || event.pointerId !== pointerId) return;

    // 没抬起过：这只是一次点击，交回给宿主的 click 处理
    if (!lifted.value) {
      reset();
      return;
    }

    // 进入落位阶段：位移归零、缩回原尺寸、阴影淡掉，等过渡跑完再清状态。
    // 先落位再清，元素才不会在样式被摘掉的那一帧闪回原位。
    dropping.value = true;
    pointerId = null;
    removeGlobalListeners();
    restoreBodyStyle();
    dropTimer = window.setTimeout(() => {
      dropTimer = null;
      reset();
    }, DROP_MS + 40);
  };

  /**
   * 本次手势是否已经真的在拖动。
   *
   * 宿主用它抑制拖拽结束时那一下多余的点击 —— 卡片整体既是拖拽区又是「点击展开」区，
   * 松手后浏览器还会补发 click，不拦住的话每次拖完都会顺手把分组折叠掉。
   */
  const hasMoved = () => lifted.value;

  onBeforeUnmount(reset);

  return {
    listRef,
    draggingIndex,
    isDragging,
    itemStyle,
    hasMoved,
    onItemPointerDown,
  };
}

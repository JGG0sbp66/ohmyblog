// src/views/admin/components/posts/editor/content/menus/bubble/composables/use-bubble-anchor.ts
import { ref, nextTick, onMounted, onBeforeUnmount, type Ref } from "vue";
import type { Editor } from "@tiptap/core";

/**
 * useBubbleAnchor —— BubbleMenu 通用定位 / 显隐 hook
 *
 * 收敛 PostEditorBubbleMenu 与 PostEditorImageBubbleMenu 公共逻辑：
 * - 监听 selectionUpdate 重算菜单位置
 * - 监听 blur，焦点跳出菜单时隐藏
 * - 监听 window scroll / resize 跟随定位
 * - 菜单内部聚焦（链接输入框等）不隐藏
 *
 * 调用方只需提供两件事：
 * 1. computeAnchorRect: 当前 selection 是否需要显示菜单 + 锚点 viewport 矩形
 *    返回 null → 隐藏；返回 DOMRect → 在该矩形顶部居中放菜单
 * 2. containerRef: 用于把 viewport 坐标换算成相对容器的 absolute 坐标
 *    （父容器 position:relative 时菜单跟随滚动正确）
 *
 * 菜单 DOM 由调用方渲染，但要把返回的 menuRef 挂在菜单根元素上，
 * 这样 hook 才能：
 * - 检测焦点是否在菜单内（不误关）
 * - blur 时检测 relatedTarget 是否是菜单子元素
 */

const MENU_VERTICAL_GAP = 10;
/** 浮层距视口边缘的最小留白，窄屏下靠它兜住溢出 */
const VIEWPORT_PADDING = 8;

export interface BubbleAnchorOptions {
  /**
   * 决定菜单是否显示 + 锚点矩形（viewport 坐标，跟 getBoundingClientRect 一致）。
   * 返回 null 表示当前 selection 不应展示该 BubbleMenu。
   */
  computeAnchorRect: (editor: Editor) => DOMRect | null;
  /**
   * 父定位容器；菜单 absolute 时坐标会减去其 offset。
   * 不传则按 viewport 定位（菜单需要 fixed 而不是 absolute）。
   */
  containerRef?: Ref<HTMLElement | null | undefined>;
}

export interface BubbleAnchorState {
  /** 挂在菜单根元素上 */
  menuRef: Ref<HTMLElement | null>;
  isVisible: Ref<boolean>;
  /** 直接绑到菜单元素 :style 上 */
  menuStyle: Ref<Record<string, string>>;
  /** 菜单实际落在选区的哪一侧，调用方据此切换 transform-origin */
  placement: Ref<"top" | "bottom">;
}

export function useBubbleAnchor(
  editor: Editor,
  options: BubbleAnchorOptions,
): BubbleAnchorState {
  const menuRef = ref<HTMLElement | null>(null);
  const isVisible = ref(false);
  const menuStyle = ref<Record<string, string>>({});
  const placement = ref<"top" | "bottom">("top");
  // 鼠标按住拖拽中：此时不显示菜单，避免浮层盖住单元格、干扰
  // prosemirror-tables 基于 posAtCoords 的跨格拖选（导致某些方向选不中）。
  let isPointerDown = false;

  /**
   * 按锚点矩形算出菜单样式。
   *
   * 菜单宽高来自 menuRef 的实测值；菜单尚未渲染（v-if 首帧）时按 0 计算，
   * 得到的就是「贴选区上方居中」的粗定位，随后 nextTick 里再用真实尺寸精修。
   *
   * 两处窄屏兜底（视口越窄越容易触发，桌面端几乎不改变行为）：
   * - 水平：菜单以 translateX(-50%) 居中于选区，这里 clamp 中心点，
   *   保证左右两沿都留在视口内；菜单比视口还宽时退化为「左沿贴边」，
   *   剩下的由调用方的 max-width + flex-wrap 换行消化。
   * - 垂直：上方塞不下就翻到选区下方（首行选中最常见，原先会被顶出容器裁掉）。
   */
  const place = (rect: DOMRect) => {
    const menuRect = menuRef.value?.getBoundingClientRect();
    const menuW = menuRect?.width ?? 0;
    const menuH = menuRect?.height ?? 0;

    const placeAbove = rect.top - MENU_VERTICAL_GAP - menuH >= VIEWPORT_PADDING;
    const top = placeAbove
      ? rect.top - MENU_VERTICAL_GAP
      : rect.bottom + MENU_VERTICAL_GAP;

    const half = menuW / 2;
    const minCenter = VIEWPORT_PADDING + half;
    const maxCenter = window.innerWidth - VIEWPORT_PADDING - half;
    const rawCenter = rect.left + rect.width / 2;
    // maxCenter < minCenter 说明菜单比可用宽度还宽，此时以 minCenter 为准（左沿贴边）
    const center = Math.max(
      minCenter,
      Math.min(rawCenter, Math.max(minCenter, maxCenter)),
    );

    let finalTop = top;
    let finalLeft = center;
    const containerEl = options.containerRef?.value;
    if (containerEl) {
      const containerRect = containerEl.getBoundingClientRect();
      finalTop -= containerRect.top;
      finalLeft -= containerRect.left;
    }

    placement.value = placeAbove ? "top" : "bottom";
    menuStyle.value = {
      top: `${finalTop}px`,
      left: `${finalLeft}px`,
      transform: placeAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)",
    };
  };

  const updateMenu = () => {
    // 拖拽过程中不弹菜单，松开鼠标后再定位
    if (isPointerDown) {
      isVisible.value = false;
      return;
    }

    // 焦点在菜单内（如链接输入框）时保持显示，不让光标失焦把它收掉
    if (menuRef.value?.contains(document.activeElement)) return;

    const rect = options.computeAnchorRect(editor);
    if (!rect) {
      isVisible.value = false;
      return;
    }

    place(rect);
    isVisible.value = true;
    // 菜单是 v-if 渲染的，首次可见时上面量到的宽高还是 0（或是上一次的旧尺寸，
    // 比如表格区块出现/消失让工具栏变宽），等 DOM 落地后按真实尺寸再修一次
    nextTick(() => {
      if (isVisible.value) place(rect);
    });
  };

  const hideOnBlur = ({ event }: { editor: Editor; event: FocusEvent }) => {
    // 焦点从编辑器移到菜单内（点击按钮 / 输入链接）→ 不隐藏
    if (
      menuRef.value &&
      event.relatedTarget instanceof Node &&
      menuRef.value.contains(event.relatedTarget)
    ) {
      return;
    }
    isVisible.value = false;
  };

  const onScrollOrResize = () => {
    if (isVisible.value) updateMenu();
  };

  // 鼠标按下即进入拖拽态并隐藏菜单；松开后下一帧按最终选区重新定位。
  // 用 capture 阶段确保早于 prosemirror-tables 的处理拿到状态。
  const onPointerDown = (event: PointerEvent) => {
    // 按下发生在菜单内部（点击合并/拆分等按钮）时不隐藏，
    // 否则 pointerdown 早于按钮的 mousedown，会在按钮触发前把菜单卸载掉。
    if (
      menuRef.value &&
      event.target instanceof Node &&
      menuRef.value.contains(event.target)
    ) {
      return;
    }
    isPointerDown = true;
    isVisible.value = false;
  };
  const onPointerUp = () => {
    if (!isPointerDown) return;
    isPointerDown = false;
    // 等 selection 落定后再定位（CellSelection 在 mouseup 后才最终确定）
    requestAnimationFrame(updateMenu);
  };

  onMounted(() => {
    editor.on("selectionUpdate", updateMenu);
    editor.on("blur", hideOnBlur);
    // capture 阶段：嵌套滚动容器（编辑器内容区可能在 overflow 容器里）也能触发
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointerup", onPointerUp, true);
  });

  onBeforeUnmount(() => {
    editor.off("selectionUpdate", updateMenu);
    editor.off("blur", hideOnBlur);
    window.removeEventListener("scroll", onScrollOrResize, true);
    window.removeEventListener("resize", onScrollOrResize);
    window.removeEventListener("pointerdown", onPointerDown, true);
    window.removeEventListener("pointerup", onPointerUp, true);
  });

  return { menuRef, isVisible, menuStyle, placement };
}

// src/views/admin/components/posts/editor/content/menus/bubble/composables/use-bubble-anchor.ts
import { ref, onMounted, onBeforeUnmount, type Ref } from "vue";
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
}

export function useBubbleAnchor(
  editor: Editor,
  options: BubbleAnchorOptions,
): BubbleAnchorState {
  const menuRef = ref<HTMLElement | null>(null);
  const isVisible = ref(false);
  const menuStyle = ref<Record<string, string>>({});
  // 鼠标按住拖拽中：此时不显示菜单，避免浮层盖住单元格、干扰
  // prosemirror-tables 基于 posAtCoords 的跨格拖选（导致某些方向选不中）。
  let isPointerDown = false;

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

    let top = rect.top;
    let left = rect.left + rect.width / 2;

    const containerEl = options.containerRef?.value;
    if (containerEl) {
      const containerRect = containerEl.getBoundingClientRect();
      top = top - containerRect.top;
      left = left - containerRect.left;
    }

    menuStyle.value = {
      top: `${top - MENU_VERTICAL_GAP}px`,
      left: `${left}px`,
      transform: "translate(-50%, -100%)",
    };
    isVisible.value = true;
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
  const onPointerDown = () => {
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

  return { menuRef, isVisible, menuStyle };
}

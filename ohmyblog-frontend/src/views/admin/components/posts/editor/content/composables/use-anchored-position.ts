// src/views/admin/components/posts/editor/content/composables/use-anchored-position.ts
import { ref } from "vue";

/**
 * useAnchoredPosition — 浮层「智能定位」组合式函数
 *
 * 编辑器里多个浮层（/ 命令面板、有序列表编号菜单、代码块语言下拉）都需要
 * 同一套「相对锚点元素、按视口空间智能落位」的 fixed 定位逻辑，这里统一抽出：
 *
 * 1. 垂直：默认贴锚点下方；当下方空间装不下完整面板、且上方更宽裕时翻到上方（仿飞书）。
 * 2. 水平：按 align 对齐锚点（start=左对齐锚点左沿，end=右对齐锚点右沿），
 *    再 clamp 进视口，保证不超出左右边界。
 *
 * 坐标为 viewport 绝对坐标，配合 `position: fixed` + Teleport 到 body 使用。
 *
 * 调用方提供两个 getter：
 * - getAnchorRect: 锚点矩形（viewport 坐标，同 getBoundingClientRect），返回 null 时不更新
 * - getPanel: 浮层面板元素，用于量真实宽高决定翻转 / 对齐
 *
 * 定位时机由调用方掌握：在打开、内容变化、挂载后等节点（通常 nextTick 内）调用 update()，
 * 确保面板已渲染、能量到真实尺寸。
 */
export interface AnchoredPositionOptions {
  /** 锚点矩形 getter（viewport 坐标）。返回 null → 跳过本次更新 */
  getAnchorRect: () => DOMRect | null;
  /** 面板元素 getter，用于测量真实宽高。返回 null → 跳过本次更新 */
  getPanel: () => HTMLElement | null;
  /** 面板与锚点的间距，默认 8px */
  gap?: number;
  /** 距视口边缘的最小留白，默认 8px */
  padding?: number;
  /** 水平对齐：start=左对齐锚点左沿（默认），end=右对齐锚点右沿 */
  align?: "start" | "end";
  /** 是否允许垂直翻转，默认 true。设为 false 则始终贴下方 */
  flip?: boolean;
}

export function useAnchoredPosition(options: AnchoredPositionOptions) {
  const {
    getAnchorRect,
    getPanel,
    gap = 8,
    padding = 8,
    align = "start",
    flip = true,
  } = options;

  /** 浮层位置（viewport 绝对坐标，按需翻转 / clamp） */
  const position = ref({ top: 0, left: 0 });
  /** 当前实际落位方向，调用方可据此切换箭头等样式 */
  const placement = ref<"top" | "bottom">("bottom");

  /**
   * 按当前锚点与面板尺寸重算位置。
   * 锚点或面板任一不可用时静默跳过（不改动已有 position）。
   */
  const update = () => {
    const rect = getAnchorRect();
    const panel = getPanel();
    if (!rect || !panel) return;

    const panelRect = panel.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 垂直：默认下方；空间不足且上方更宽裕则翻上（都装不下时选空间多的一侧）
    const spaceBelow = vh - rect.bottom - padding;
    const spaceAbove = rect.top - padding;
    const placeBelow =
      !flip || spaceBelow >= panelRect.height + gap || spaceBelow >= spaceAbove;
    const top = placeBelow
      ? rect.bottom + gap
      : rect.top - panelRect.height - gap;

    // 水平：按 align 对齐锚点，再 clamp 进视口
    const rawLeft = align === "end" ? rect.right - panelRect.width : rect.left;
    const maxLeft = vw - panelRect.width - padding;
    const left = Math.max(padding, Math.min(rawLeft, maxLeft));

    placement.value = placeBelow ? "bottom" : "top";
    position.value = { top, left };
  };

  return { position, placement, update };
}

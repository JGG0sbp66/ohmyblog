// src/views/admin/components/posts/editor/content/menus/handle/use-editor-hover-block.ts
import { ref, nextTick, onMounted, onBeforeUnmount, type Ref } from "vue";
import type { Component } from "vue";
import type { Editor } from "@tiptap/core";
import { Type } from "lucide-vue-next";
import { decideBlockIcon } from "./block-icon";

/**
 * useEditorHoverBlock — 跟随鼠标的"块 hover 状态"
 *
 * 监听编辑器 DOM 的 mousemove，解析当前悬停的块，输出位置 / icon / 空行 /
 * 拖拽锚点等响应式状态供 FloatingHandle 渲染。
 *
 * 隐藏策略：120ms 防抖，避免抖动；handleEl 区域内的 mouseenter 取消隐藏。
 *
 * 边界处理：
 * - x 坐标钳制到内容区（防止 ol 计数器区域 posAtCoords 解析到容器节点）
 * - 取嵌套深度最里层的 block；列表项内段落另取 listItem 作为 dragPos
 * - 用 coordsAtPos 取实际行高，多行段落不会偏移到中点
 * - 首次出现禁用 top 过渡，避免从默认位置滑入
 */

const HANDLE_HEIGHT = 32;
const HANDLE_OFFSET = 6;
// 表格内容：手柄锚到表格外左缘时，额外让出行把手条（~8px）+ 间隙
const TABLE_HANDLE_CLEARANCE = 14;
const HIDE_DELAY_MS = 120;
const X_SAFE_MARGIN = 56;
// 把手"够取"区：把手挂在当前块左外侧（表格里更是落在左邻列上），从块内移向
// 把手必经一段空隙。鼠标已显示把手、且落在「把手所在的左侧带」内时，冻结当前
// 状态、不按新坐标重算，避免 posAtCoords 命中左邻块/列把把手"带走"导致点不到。
// - RIGHT_PAD：右边界从把手锚点再往右推一点，盖住锚点与单元格之间的间隙/边框，
//   否则刚迈出单元格、还没进把手区就被重算带走（上一版的 bug）。
// - LEFT_WIDTH：左边界要足够宽，完整覆盖把手卡片宽度 + 余量。
const HANDLE_CATCH_RIGHT_PAD = 16;
const HANDLE_CATCH_LEFT_WIDTH = 96;
const HANDLE_CATCH_Y_MARGIN = 8;

export interface EditorHoverBlock {
  visible: Ref<boolean>;
  top: Ref<number>;
  left: Ref<number>;
  isEmpty: Ref<boolean>;
  icon: Ref<Component>;
  /** 当前块图标的语义色（Tailwind text-* 类，与菜单配色一致） */
  iconColor: Ref<string>;
  transitionTop: Ref<boolean>;
  /** 用于拖拽 NodeSelection 的位置（list 项内取 listItem，其他取顶层块） */
  dragPos: Ref<number>;
  /** 鼠标进入手柄时取消隐藏 */
  cancelHide: () => void;
  /** 鼠标离开手柄时排队隐藏 */
  scheduleHide: () => void;
}

export const useEditorHoverBlock = (
  editor: Editor,
  handleRef: Ref<HTMLElement | null>,
): EditorHoverBlock => {
  const visible = ref(false);
  const top = ref(0);
  const left = ref(0);
  const isEmpty = ref(false);
  const icon = ref<Component>(Type);
  const iconColor = ref<string>("");
  const transitionTop = ref(false);
  const dragPos = ref(-1);

  let editorEl: HTMLElement | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  const scheduleHide = () => {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      visible.value = false;
      transitionTop.value = false;
    }, HIDE_DELAY_MS);
  };

  const cancelHide = () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  const onMouseMove = (event: MouseEvent) => {
    cancelHide();

    if (handleRef.value?.contains(event.target as Element)) return;

    // 够取区：把手已显示、鼠标正落在「把手所在的左侧带」内（x 从锚点右侧一点
    // 一直到把手左缘外、y 仍在当前行高度带内）时，冻结当前状态、不重算位置 ——
    // 否则从单元格往左移去够把手时，posAtCoords 会命中左邻列把把手"带走"，永远点不到。
    if (
      visible.value &&
      event.clientX <= left.value + HANDLE_CATCH_RIGHT_PAD &&
      event.clientX >= left.value - HANDLE_CATCH_LEFT_WIDTH &&
      event.clientY >= top.value - HANDLE_CATCH_Y_MARGIN &&
      event.clientY <= top.value + HANDLE_HEIGHT + HANDLE_CATCH_Y_MARGIN
    ) {
      return;
    }

    const view = editor.view;
    // x 钳制：避免 ol 左侧计数器区 posAtCoords 解析到容器节点引发跳动
    const editorRect = (editorEl as HTMLElement).getBoundingClientRect();
    const safeX = Math.max(event.clientX, editorRect.left + X_SAFE_MARGIN);
    const result = view.posAtCoords({ left: safeX, top: event.clientY });
    if (!result) {
      scheduleHide();
      return;
    }

    try {
      const { doc } = editor.state;
      const $pos = doc.resolve(result.pos);
      if ($pos.depth === 0) {
        scheduleHide();
        return;
      }

      // 从最深层往上找第一个有 DOM 节点的 block（正确处理嵌套列表）
      let blockPos = $pos.before(1);
      let blockNode = $pos.node(1);
      let domNode: HTMLElement | null = null;
      let blockDepth = 1;
      for (let d = $pos.depth; d >= 1; d--) {
        const n = $pos.node(d);
        if (!n.isBlock) continue;
        const p = $pos.before(d);
        const dom = view.nodeDOM(p);
        if (dom instanceof HTMLElement) {
          blockPos = p;
          blockNode = n;
          domNode = dom;
          blockDepth = d;
          break;
        }
      }

      if (!domNode) {
        scheduleHide();
        return;
      }

      // 垂直对齐：用块元素自身的 padding/border + line-height 算「首行中心」。
      // 不再用 coordsAtPos —— 空行与有文字行的 coords 不一致：有文字时顶边量到行盒顶、
      // 高度却只量到字形盒，(lineHeight - HANDLE_HEIGHT)/2 偏小，把手相对空行整体上飘。
      // computed style 对空行 / 有文字完全一致，且仍只取首行（多行段落不会偏到块中点）。
      const rect = domNode.getBoundingClientRect();
      const cs = window.getComputedStyle(domNode);
      const padTop = parseFloat(cs.paddingTop) || 0;
      const borderTop = parseFloat(cs.borderTopWidth) || 0;
      let lineHeight = parseFloat(cs.lineHeight);
      if (!Number.isFinite(lineHeight)) {
        // line-height: normal —— 回退到 coordsAtPos 实测行高
        try {
          const coords = view.coordsAtPos(blockPos + 1);
          lineHeight = coords.bottom - coords.top;
        } catch {
          lineHeight = (parseFloat(cs.fontSize) || 16) * 1.5;
        }
      }
      const firstLineCenter = rect.top + borderTop + padTop + lineHeight / 2;

      // 列表项内取 listItem / taskItem 作为拖拽锚点，其他取顶层块
      // 同时记录最近的 list-item DOM rect，用作 handle 的 left 锚点
      // —— taskItem 内段落的 rect.left 在 checkbox 右侧，handle 直接放在
      // 段落左外侧会盖住 checkbox；改用 listItem 整体 rect 对齐到列表项左边
      let resolvedDragPos = $pos.before(1);
      let listItemLeft: number | null = null;
      for (let d = $pos.depth; d >= 1; d--) {
        const name = $pos.node(d).type.name;
        if (name === "listItem" || name === "taskItem") {
          resolvedDragPos = $pos.before(d);
          const itemDom = view.nodeDOM($pos.before(d));
          if (itemDom instanceof HTMLElement) {
            listItemLeft = itemDom.getBoundingClientRect().left;
          }
          break;
        }
      }

      const wasVisible = visible.value;

      // 表格内容：把手锚到「当前单元格」左缘，随列跟随移动（仿飞书）。
      // posAtCoords 命中的是单元格内段落，改用单元格 DOM 左缘 —— 切到后面的列时
      // 把手跟着列走，而不是一直贴在整表最左侧。
      // 首列特殊：其左缘即整表左缘，需额外让出行把手条宽度（TABLE_HANDLE_CLEARANCE），
      // 其余列只让一个小间隙（HANDLE_OFFSET）。
      let cellLeft: number | null = null;
      let tableOuterLeft: number | null = null;
      for (let d = $pos.depth; d >= 1; d--) {
        const name = $pos.node(d).type.name;
        if (
          (name === "tableCell" || name === "tableHeader") &&
          cellLeft === null
        ) {
          const cellDom = view.nodeDOM($pos.before(d));
          if (cellDom instanceof HTMLElement) {
            cellLeft = cellDom.getBoundingClientRect().left;
          }
        }
        if (name === "table") {
          const tableDom = view.nodeDOM($pos.before(d));
          if (tableDom instanceof HTMLElement) {
            tableOuterLeft = tableDom.getBoundingClientRect().left;
          }
          break;
        }
      }

      let tableLeftAnchor: number | null = null;
      if (cellLeft !== null) {
        const isFirstCol =
          tableOuterLeft !== null && Math.abs(cellLeft - tableOuterLeft) < 2;
        tableLeftAnchor = isFirstCol
          ? cellLeft - TABLE_HANDLE_CLEARANCE
          : cellLeft - HANDLE_OFFSET;
      }

      top.value = firstLineCenter - HANDLE_HEIGHT / 2;
      left.value =
        tableLeftAnchor !== null
          ? tableLeftAnchor
          : (listItemLeft ?? rect.left) - HANDLE_OFFSET;
      // 空行判定：考虑 leaf inline node（image / hardBreak 等），
      // 一个段落只含图片时不应被当作空行
      isEmpty.value = blockNode.content.size === 0;
      const blockIcon = decideBlockIcon(blockNode, $pos, blockDepth);
      icon.value = blockIcon.icon;
      iconColor.value = blockIcon.color;
      dragPos.value = resolvedDragPos;
      visible.value = true;

      // 首次出现不做 top 过渡，避免从默认位置滑入
      if (!wasVisible) {
        nextTick(() => {
          transitionTop.value = true;
        });
      }
    } catch {
      scheduleHide();
    }
  };

  onMounted(() => {
    editorEl = editor.view.dom as HTMLElement;
    editorEl.addEventListener("mousemove", onMouseMove);
    editorEl.addEventListener("mouseleave", scheduleHide);
    window.addEventListener("scroll", scheduleHide, true);
  });

  onBeforeUnmount(() => {
    editorEl?.removeEventListener("mousemove", onMouseMove);
    editorEl?.removeEventListener("mouseleave", scheduleHide);
    window.removeEventListener("scroll", scheduleHide, true);
    if (hideTimer) clearTimeout(hideTimer);
    editorEl = null;
  });

  return {
    visible,
    top,
    left,
    isEmpty,
    icon,
    iconColor,
    transitionTop,
    dragPos,
    cancelHide,
    scheduleHide,
  };
};

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
const HIDE_DELAY_MS = 120;
const X_SAFE_MARGIN = 56;

export interface EditorHoverBlock {
  visible: Ref<boolean>;
  top: Ref<number>;
  left: Ref<number>;
  isEmpty: Ref<boolean>;
  icon: Ref<Component>;
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

      // 用 coordsAtPos 取块内首字符行高，避免多行段落的居中偏移
      const rect = domNode.getBoundingClientRect();
      let lineTop = rect.top;
      let lineHeight = 24;
      try {
        const innerPos = blockPos + 1;
        if (innerPos <= doc.content.size) {
          const coords = view.coordsAtPos(innerPos);
          lineTop = coords.top;
          lineHeight = coords.bottom - coords.top;
        }
      } catch {
        /* fallback to rect */
      }

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

      top.value = lineTop + (lineHeight - HANDLE_HEIGHT) / 2;
      left.value = (listItemLeft ?? rect.left) - HANDLE_OFFSET;
      // 空行判定：考虑 leaf inline node（image / hardBreak 等），
      // 一个段落只含图片时不应被当作空行
      isEmpty.value = blockNode.content.size === 0;
      icon.value = decideBlockIcon(blockNode, $pos, blockDepth);
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
    transitionTop,
    dragPos,
    cancelHide,
    scheduleHide,
  };
};

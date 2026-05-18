// src/views/admin/components/posts/editor/content/menus/handle/use-block-drag.ts
import type { Editor } from "@tiptap/core";
import { Fragment, Slice } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";

/**
 * useBlockDrag — 块拖拽 slice 打包逻辑
 *
 * 复用 ProseMirror 内置的 drop 处理；本 hook 只负责 dragstart 时把要拖的
 * 内容塞进 view.dragging，让 PM 知道"拖的是这个东西"。
 *
 * listItem 特殊处理：用父列表类型包装并设置 openStart/openEnd=1
 * - 落入列表内：作为条目合并
 * - 落入列表外：独立成新列表（编号从 1 开始）
 */
export const useBlockDrag = (editor: Editor, getDragPos: () => number) => {
  const onDragStart = (event: DragEvent) => {
    const dragPos = getDragPos();
    if (dragPos < 0) return;

    const view = editor.view;
    const { state } = view;
    try {
      const node = state.doc.nodeAt(dragPos);
      if (!node) return;

      const sel = NodeSelection.create(state.doc, dragPos);
      view.dispatch(state.tr.setSelection(sel));

      let slice: Slice;
      if (node.type.name === "listItem") {
        const $nodePos = state.doc.resolve(dragPos);
        const parentListType = $nodePos.parent.type;
        const wrappedList = parentListType.create(null, node);
        slice = new Slice(Fragment.from(wrappedList), 1, 1);
      } else {
        slice = sel.content();
      }

      view.dragging = { slice, move: true };
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/html", "");
      }
    } catch {
      /* ignore invalid positions */
    }
  };

  /** 若未落入编辑器则清理 dragging 状态，防止残留 */
  const onDragEnd = () => {
    if (editor.view.dragging) {
      editor.view.dragging = null;
    }
  };

  return { onDragStart, onDragEnd };
};

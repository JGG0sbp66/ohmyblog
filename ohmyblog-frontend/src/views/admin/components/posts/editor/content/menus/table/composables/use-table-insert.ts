// src/views/admin/components/posts/editor/content/menus/table/composables/use-table-insert.ts
import type { Editor } from "@tiptap/core";

/**
 * useTableInsert — 在指定行 / 列边界插入行 / 列（行列间「+」插入点用）
 *
 * 做法：先把光标 setTextSelection 放进「代表单元格」，再调 TableKit 的
 * addColumn{Before,After} / addRow{Before,After}。边界在某列/行之前用 before，
 * 末尾边界（最后一列/行之后）用 after。
 */

/** 把光标移进代表单元格，返回是否成功 */
const focusCell = (editor: Editor, cellEl: HTMLElement): boolean => {
  const pos = editor.view.posAtDOM(cellEl, 0);
  if (pos < 0) return false;
  editor.chain().focus().setTextSelection(pos).run();
  return true;
};

export const useTableInsert = (editor: Editor) => {
  const insertColumn = (cellEl: HTMLElement, before: boolean) => {
    if (!focusCell(editor, cellEl)) return;
    const chain = editor.chain().focus();
    (before ? chain.addColumnBefore() : chain.addColumnAfter()).run();
  };

  const insertRow = (cellEl: HTMLElement, before: boolean) => {
    if (!focusCell(editor, cellEl)) return;
    const chain = editor.chain().focus();
    (before ? chain.addRowBefore() : chain.addRowAfter()).run();
  };

  return { insertColumn, insertRow };
};

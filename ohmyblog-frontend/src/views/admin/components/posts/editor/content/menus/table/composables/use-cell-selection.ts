// src/views/admin/components/posts/editor/content/menus/table/composables/use-cell-selection.ts
import type { Editor } from "@tiptap/core";
import { CellSelection } from "@tiptap/pm/tables";

/**
 * useCellSelection — 整行 / 整列选中封装（行列把手点击时调用）
 *
 * 思路：不做 TableMap 位置运算，而是从「代表单元格的 DOM」反解出指向该格
 * 前面的 ResolvedPos，再交给 prosemirror-tables 的
 * CellSelection.colSelection / rowSelection 选中整列 / 整行。
 *
 * - selectColumn(cellEl)：选中该单元格所在的整列
 * - selectRow(cellEl)   ：选中该单元格所在的整行
 */

/** 由单元格 DOM 反解出「指向该格前面」的 ResolvedPos（colSelection/rowSelection 所需的 $anchorCell） */
export const resolveCellBefore = (editor: Editor, cellEl: HTMLElement) => {
  const pos = editor.view.posAtDOM(cellEl, 0);
  if (pos < 0) return null;
  const $pos = editor.state.doc.resolve(pos);
  for (let d = $pos.depth; d > 0; d--) {
    const name = $pos.node(d).type.name;
    if (name === "tableCell" || name === "tableHeader") {
      return editor.state.doc.resolve($pos.before(d));
    }
  }
  return null;
};

export const useCellSelection = (editor: Editor) => {
  const apply = (sel: CellSelection) => {
    editor.view.dispatch(editor.state.tr.setSelection(sel));
    editor.view.focus();
  };

  const selectColumn = (cellEl: HTMLElement) => {
    const $cell = resolveCellBefore(editor, cellEl);
    if ($cell) apply(CellSelection.colSelection($cell));
  };

  const selectRow = (cellEl: HTMLElement) => {
    const $cell = resolveCellBefore(editor, cellEl);
    if ($cell) apply(CellSelection.rowSelection($cell));
  };

  return { selectColumn, selectRow };
};

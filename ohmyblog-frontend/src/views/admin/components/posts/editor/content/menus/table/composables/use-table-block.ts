// src/views/admin/components/posts/editor/content/menus/table/composables/use-table-block.ts
import type { Editor } from "@tiptap/core";
import { CellSelection } from "@tiptap/pm/tables";
import { resolveCellBefore } from "./use-cell-selection";

/**
 * useTableBlock — 整张表格为单位的操作（左上角块手柄用）
 *
 * - selectWholeTable：CellSelection 覆盖「首格 → 末格」的矩形 = 选中整表。
 * - copyTable：选中整表后 execCommand("copy")，复用 ProseMirror 的 copy 事件
 *   处理（CellSelection 会被序列化为表格 HTML/纯文本写入剪贴板）。
 * - cutTable：复制整表 + deleteTable（execCommand("cut") 对 CellSelection 只会
 *   清空单元格内容而非删表，故剪切 = 复制 + 删表）。
 * - deleteTable：选中整表后走 TableKit 的 deleteTable。
 *
 * 入参 cellEl 为表格内任一「代表单元格」（一般取左上角首格）。
 */
export function useTableBlock(editor: Editor) {
  const selectWholeTable = (cellEl: HTMLElement): boolean => {
    const table = cellEl.closest("table");
    if (!table) return false;
    const firstCell = table.rows[0]?.cells[0];
    const lastRow = table.rows[table.rows.length - 1];
    const lastCell = lastRow?.cells[lastRow.cells.length - 1];
    if (!firstCell || !lastCell) return false;

    const $first = resolveCellBefore(editor, firstCell);
    const $last = resolveCellBefore(editor, lastCell);
    if (!$first || !$last) return false;

    editor.view.dispatch(
      editor.state.tr.setSelection(new CellSelection($first, $last)),
    );
    editor.view.focus();
    return true;
  };

  const copyTable = (cellEl: HTMLElement): void => {
    if (!selectWholeTable(cellEl)) return;
    document.execCommand("copy");
  };

  const cutTable = (cellEl: HTMLElement): void => {
    if (!selectWholeTable(cellEl)) return;
    document.execCommand("copy");
    editor.chain().focus().deleteTable().run();
  };

  const deleteTable = (cellEl: HTMLElement): void => {
    if (!selectWholeTable(cellEl)) return;
    editor.chain().focus().deleteTable().run();
  };

  return { selectWholeTable, copyTable, cutTable, deleteTable };
}

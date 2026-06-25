// src/views/admin/components/posts/editor/content/menus/bubble/composables/use-table-commands.ts
import type { Editor } from "@tiptap/core";
import type { Component } from "vue";
import { CellSelection } from "@tiptap/pm/tables";
import {
  RiMergeCellsHorizontal,
  RiSplitCellsHorizontal,
  RiLayoutTopLine,
  RiLayoutLeftLine,
  RiDeleteRow,
  RiDeleteColumn,
} from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";

/**
 * 表格命令封装（PostEditorBubbleMenu 的「表格」区域用）
 *
 * - 合并 / 拆分单元格开关（mergeOrSplit）：跨格选区可用。
 * - 选中整行 / 整列（点行列把手 → CellSelection）时额外提供：
 *     · 设为表头：行选区 toggleHeaderRow / 列选区 toggleHeaderColumn
 *     · 删除行 / 列：deleteRow / deleteColumn（调用方以红色呈现）
 *
 * 命令走 TableKit 链式 API，可用性/选区类型用 editor.can() 与 CellSelection 判断。
 */
export const useTableCommands = () => {
  const { t } = useLang();

  const cellSelection = (e: Editor): CellSelection | null => {
    const sel = e.state.selection;
    return sel instanceof CellSelection ? sel : null;
  };

  // ── 合并 / 拆分 ──
  const canMergeOrSplit = (e: Editor): boolean => e.can().mergeOrSplit();
  const isMergeMode = (e: Editor): boolean => e.can().mergeCells();
  const isMergedCell = (e: Editor): boolean => e.can().splitCell();
  const mergeIconOf = (e: Editor): Component =>
    isMergeMode(e) ? RiMergeCellsHorizontal : RiSplitCellsHorizontal;
  const mergeLabelOf = (e: Editor): string =>
    isMergeMode(e)
      ? t("views.admin.PostEditor.content.tableMenu.mergeCells")
      : t("views.admin.PostEditor.content.tableMenu.splitCell");
  const mergeOrSplit = (e: Editor): void => {
    e.chain().focus().mergeOrSplit().run();
  };

  // ── 整行 / 整列选区 ──
  const isRowSelection = (e: Editor): boolean =>
    cellSelection(e)?.isRowSelection() ?? false;
  const isColSelection = (e: Editor): boolean =>
    cellSelection(e)?.isColSelection() ?? false;
  /** 是否选中了整行或整列（决定「设为表头 / 删除」是否出现） */
  const hasLineSelection = (e: Editor): boolean =>
    isRowSelection(e) || isColSelection(e);

  /** 区域整体是否显示 */
  const showTableSection = (e: Editor): boolean =>
    canMergeOrSplit(e) || hasLineSelection(e);

  // ── 设为表头（行选区 → 表头行；列选区 → 表头列） ──
  const headerIconOf = (e: Editor): Component =>
    isColSelection(e) ? RiLayoutLeftLine : RiLayoutTopLine;
  const headerLabel = (): string =>
    t("views.admin.PostEditor.content.tableMenu.setHeader");
  /** 当前选中行/列是否已是表头（按锚点单元格类型判断） */
  const isHeaderActive = (e: Editor): boolean =>
    cellSelection(e)?.$anchorCell.nodeAfter?.type.name === "tableHeader";
  const toggleHeader = (e: Editor): void => {
    const chain = e.chain().focus();
    (isColSelection(e)
      ? chain.toggleHeaderColumn()
      : chain.toggleHeaderRow()
    ).run();
  };

  // ── 删除整行 / 整列 ──
  const deleteIconOf = (e: Editor): Component =>
    isColSelection(e) ? RiDeleteColumn : RiDeleteRow;
  const deleteLabel = (e: Editor): string =>
    isColSelection(e)
      ? t("views.admin.PostEditor.content.tableMenu.deleteColumn")
      : t("views.admin.PostEditor.content.tableMenu.deleteRow");
  const deleteLine = (e: Editor): void => {
    const chain = e.chain().focus();
    (isColSelection(e) ? chain.deleteColumn() : chain.deleteRow()).run();
  };

  return {
    // merge / split
    canMergeOrSplit,
    isMergedCell,
    mergeIconOf,
    mergeLabelOf,
    mergeOrSplit,
    // section visibility & line selection
    showTableSection,
    hasLineSelection,
    // set header
    headerIconOf,
    headerLabel,
    isHeaderActive,
    toggleHeader,
    // delete row / column
    deleteIconOf,
    deleteLabel,
    deleteLine,
  };
};

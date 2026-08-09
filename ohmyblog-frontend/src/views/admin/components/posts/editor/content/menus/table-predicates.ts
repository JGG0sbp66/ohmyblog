// src/views/admin/components/posts/editor/content/menus/table-predicates.ts
import type { Editor } from "@tiptap/core";
import { CellSelection } from "@tiptap/pm/tables";

/**
 * 表格相关的纯谓词（单一真源）
 *
 * 为什么单独一个文件：这些判定同时被 composable（use-table-commands，气泡菜单用）
 * 和纯模块（mobile-toolbar-items，移动端工具条的段落显隐用）需要。前者调了
 * useLang() 只能在 setup 里用，纯模块 import 不进去，于是曾各写一份 —— 移动端那份
 * 还漏了 CellSelection 的快速判断。谓词本身不依赖任何 Vue 上下文，提出来两边共用。
 */

/** 当前选区是否为跨格选区（点行列把手会产生它） */
export const asCellSelection = (e: Editor): CellSelection | null => {
  const sel = e.state.selection;
  return sel instanceof CellSelection ? sel : null;
};

/** 选区是否落在表格单元格内（含光标在单格、跨格 CellSelection） */
export const isInTable = (e: Editor): boolean => {
  if (asCellSelection(e)) return true;
  const { $anchor } = e.state.selection;
  for (let d = $anchor.depth; d > 0; d--) {
    const name = $anchor.node(d).type.name;
    if (name === "tableCell" || name === "tableHeader") return true;
  }
  return false;
};

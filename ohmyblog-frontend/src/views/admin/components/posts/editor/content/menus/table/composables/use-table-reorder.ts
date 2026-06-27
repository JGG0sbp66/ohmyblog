// src/views/admin/components/posts/editor/content/menus/table/composables/use-table-reorder.ts
import { ref } from "vue";
import type { Editor } from "@tiptap/core";
import { moveTableColumn, moveTableRow } from "@tiptap/pm/tables";

/**
 * useTableReorder — 行/列把手「拖拽重排」交互
 *
 * 行为（同一把手上按下）：
 * - 按下不动直接松开 → 视为点击，回退 onClick（一般是选中整行 / 整列）。
 * - 按下并拖动超过阈值 → 进入拖拽态，落点吸附到最近的行/列边界；松开时
 *   调用 prosemirror-tables 的 moveTableRow / moveTableColumn 完成重排。
 *
 * 边界坐标在按下瞬间直接读 DOM（table.rows / 首行 cells 的 rect），自包含、
 * 不依赖几何 composable 的坐标系；reorder.boundary 暴露给组件画落点线。
 *
 * to 语义：moveTableRow/Column 的 to = 移动后最终 0-based 索引（内部已处理源
 * 行/列移除后的偏移），故「插入到边界 b 之前」换算 to = b > from ? b-1 : b。
 */

export type ReorderAxis = "row" | "col";

export interface ReorderState {
  axis: ReorderAxis;
  /** 源行 / 列索引 */
  from: number;
  /** 落点边界索引 0..N（插入到该索引原始行/列之前），用于画落点线 */
  boundary: number;
}

/** 进入拖拽的位移阈值（px）：小于此值视为点击 */
const DRAG_THRESHOLD = 4;

export function useTableReorder(editor: Editor) {
  const reorder = ref<ReorderState | null>(null);

  const begin = (
    axis: ReorderAxis,
    index: number,
    cellEl: HTMLElement,
    e: MouseEvent,
    onClick: () => void,
  ) => {
    const isRow = axis === "row";
    const table = cellEl.closest("table");
    if (!table) return;

    // 边界坐标（viewport，N+1 条）：行用各行 top + 末行 bottom；列用首行各格 left + 末格 right
    const edges: number[] = [];
    if (isRow) {
      const rows = Array.from(table.rows);
      for (const r of rows) edges.push(r.getBoundingClientRect().top);
      const last = rows[rows.length - 1];
      if (last) edges.push(last.getBoundingClientRect().bottom);
    } else {
      const cells = Array.from(table.rows[0]?.cells ?? []);
      for (const c of cells) edges.push(c.getBoundingClientRect().left);
      const last = cells[cells.length - 1];
      if (last) edges.push(last.getBoundingClientRect().right);
    }

    const start = isRow ? e.clientY : e.clientX;
    let dragging = false;

    const nearestBoundary = (p: number): number => {
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      edges.forEach((edge, i) => {
        const d = Math.abs(p - edge);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    };

    const onMove = (ev: MouseEvent) => {
      const p = isRow ? ev.clientY : ev.clientX;
      if (!dragging && Math.abs(p - start) < DRAG_THRESHOLD) return;
      if (!dragging) {
        dragging = true;
        // 拖拽期间禁用文本选择 + 抓取光标
        document.body.style.userSelect = "none";
        document.body.style.cursor = "grabbing";
      }
      reorder.value = { axis, from: index, boundary: nearestBoundary(p) };
    };

    const finish = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", finish);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      const state = reorder.value;
      reorder.value = null;

      // 没拖动 → 点击行为（选中整行/列）
      if (!dragging || !state) {
        onClick();
        return;
      }

      const to = state.boundary > index ? state.boundary - 1 : state.boundary;
      if (to === index) return; // 落回原位，no-op

      const pos = editor.view.posAtDOM(cellEl, 0);
      if (pos < 0) return;

      const command = isRow
        ? moveTableRow({ from: index, to, pos })
        : moveTableColumn({ from: index, to, pos });
      command(editor.state, editor.view.dispatch);
      editor.view.focus();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", finish);
  };

  return { reorder, begin };
}

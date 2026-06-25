// src/views/admin/components/posts/editor/content/menus/table/composables/use-table-geometry.ts
import { ref, onMounted, onBeforeUnmount, type Ref } from "vue";
import type { Editor } from "@tiptap/core";

/**
 * useTableGeometry — 计算当前表格的行 / 列把手几何
 *
 * 触发：鼠标移入表格区域（含把手条区域）或选区落在表格内。读 DOM 矩形，
 * 行用 <tr> 高度、列用首行单元格宽度。监听 mousemove(hover) / selectionUpdate /
 * 内容变更 / 滚动 / resize 重算。
 *
 * 合并单元格（首行 colspan / 跨行 rowspan）在 v1 下几何可能略错位，属已知限制。
 * 每段附带代表单元格 DOM（点击反解选区）与 active（该行/列当前是否被选中）。
 */

/** 鼠标命中表格的外扩边距：顶部/左侧多扩一些以覆盖把手条 */
const HIT_MARGIN_NEAR = 18;
const HIT_MARGIN_FAR = 4;

export interface HandleSegment {
  /** 段长度：列为 width，行为 height（按 flex 顺序排布，无需绝对坐标） */
  size: number;
  /** 代表单元格 DOM，用于反解整列 / 整行选区 */
  cellEl: HTMLElement;
  /** 该行 / 列当前是否处于选中态（代表单元格带 .selectedCell） */
  active: boolean;
}

export interface TableGeometry {
  left: number;
  top: number;
  width: number;
  height: number;
  cols: HandleSegment[];
  rows: HandleSegment[];
}

export function useTableGeometry(
  editor: Editor,
  containerRef: Ref<HTMLElement | null | undefined>,
) {
  const geometry = ref<TableGeometry | null>(null);
  const hoveredTable = ref<HTMLElement | null>(null);

  /** 选区所在表格 */
  const selectionTable = (): HTMLElement | null => {
    if (!editor.isActive("table")) return null;
    const dom = editor.view.domAtPos(editor.state.selection.from).node;
    const el = dom instanceof HTMLElement ? dom : dom.parentElement;
    return el?.closest("table") ?? null;
  };

  const segment = (
    cell: HTMLTableCellElement,
    size: number,
  ): HandleSegment => ({
    size,
    cellEl: cell,
    active: cell.classList.contains("selectedCell"),
  });

  const compute = () => {
    const container = containerRef.value;
    // hover 优先，否则跟随选区所在表格
    const table = hoveredTable.value ?? selectionTable();
    const firstRow = table?.rows[0];
    if (!container || !table || !firstRow) {
      geometry.value = null;
      return;
    }

    const cRect = container.getBoundingClientRect();
    const tRect = table.getBoundingClientRect();

    const cols = Array.from(firstRow.cells).map((cell) =>
      segment(cell, cell.getBoundingClientRect().width),
    );
    const rows = Array.from(table.rows).flatMap((row) => {
      const cell = row.cells[0];
      return cell ? [segment(cell, row.getBoundingClientRect().height)] : [];
    });

    geometry.value = {
      left: tRect.left - cRect.left,
      top: tRect.top - cRect.top,
      width: tRect.width,
      height: tRect.height,
      cols,
      rows,
    };
  };

  // 选区/内容变更：延后到下一帧，等 .selectedCell 装饰应用后再读取 active
  const scheduleCompute = () => requestAnimationFrame(compute);

  /** 鼠标在某表格的外扩矩形内 → 该表格为 hover 目标（外扩覆盖把手条区域） */
  const onMouseMove = (e: MouseEvent) => {
    const tables = Array.from(
      editor.view.dom.querySelectorAll("table"),
    ) as HTMLElement[];
    const { clientX: x, clientY: y } = e;
    const hit =
      tables.find((t) => {
        const r = t.getBoundingClientRect();
        return (
          x >= r.left - HIT_MARGIN_NEAR &&
          x <= r.right + HIT_MARGIN_FAR &&
          y >= r.top - HIT_MARGIN_NEAR &&
          y <= r.bottom + HIT_MARGIN_FAR
        );
      }) ?? null;
    if (hit !== hoveredTable.value) {
      hoveredTable.value = hit;
      compute();
    }
  };

  const onScrollOrResize = () => compute();

  onMounted(() => {
    editor.on("selectionUpdate", scheduleCompute);
    editor.on("update", scheduleCompute);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
  });

  onBeforeUnmount(() => {
    editor.off("selectionUpdate", scheduleCompute);
    editor.off("update", scheduleCompute);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("scroll", onScrollOrResize, true);
    window.removeEventListener("resize", onScrollOrResize);
  });

  return { geometry };
}

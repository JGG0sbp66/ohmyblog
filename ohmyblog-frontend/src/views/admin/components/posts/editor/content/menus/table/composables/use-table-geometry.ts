// src/views/admin/components/posts/editor/content/menus/table/composables/use-table-geometry.ts
import { ref, onMounted, onBeforeUnmount, type Ref } from "vue";
import type { Editor } from "@tiptap/core";

/**
 * useTableGeometry — 计算当前表格的行/列把手几何（滑动窗口模型）
 *
 * 设计：覆盖层是「固定外壳 + 内层滑动」。
 * - clip：.tableWrapper 可视框（相对 container），外壳据此固定定位/裁剪，
 *   不随横向滚动变化（wrapper 在布局中固定，仅其内容滚动）。
 * - cols/rows + tableWidth/Height：列宽 / 行高等尺寸，只随内容/尺寸变化。
 * - scrollLeft：wrapper 的横向滚动量；横向滚动时只更新它（顶部内层轨道平移），
 *   不必重算整套几何。
 *
 * 因为坐标都相对 container，且 wrapper 在布局中固定，纵向页面滚动时
 * 外壳随 container 一起移动、相对位置不变，故无需在滚动时重算几何。
 */

const HIT_MARGIN_NEAR = 18;
const HIT_MARGIN_FAR = 4;

export interface HandleSegment {
  size: number;
  cellEl: HTMLElement;
  active: boolean;
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface TableGeometry {
  /** .tableWrapper 可视框（相对 container），外壳定位/裁剪依据 */
  clip: Box;
  /** 表格完整宽 / 高（内层轨道尺寸 / 插入线长度） */
  tableWidth: number;
  tableHeight: number;
  cols: HandleSegment[];
  rows: HandleSegment[];
}

export function useTableGeometry(
  editor: Editor,
  containerRef: Ref<HTMLElement | null | undefined>,
) {
  const geometry = ref<TableGeometry | null>(null);
  /** wrapper 横向滚动量：仅用于顶部内层轨道 translateX */
  const scrollLeft = ref(0);
  const hoveredTable = ref<HTMLTableElement | null>(null);
  let activeWrapper: HTMLElement | null = null;

  const selectionTable = (): HTMLTableElement | null => {
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
    const table = hoveredTable.value ?? selectionTable();
    const firstRow = table?.rows[0];
    if (!container || !table || !firstRow) {
      geometry.value = null;
      activeWrapper = null;
      return;
    }

    const wrapper =
      (table.closest(".tableWrapper") as HTMLElement | null) ?? table;
    activeWrapper = wrapper;
    scrollLeft.value = wrapper.scrollLeft;

    const cRect = container.getBoundingClientRect();
    const tRect = table.getBoundingClientRect();
    const wRect = wrapper.getBoundingClientRect();

    const cols = Array.from(firstRow.cells).map((cell) =>
      segment(cell, cell.getBoundingClientRect().width),
    );
    const rows = Array.from(table.rows).flatMap((row) => {
      const cell = row.cells[0];
      return cell ? [segment(cell, row.getBoundingClientRect().height)] : [];
    });

    geometry.value = {
      clip: {
        left: wRect.left - cRect.left,
        top: wRect.top - cRect.top,
        width: wRect.width,
        height: wRect.height,
      },
      tableWidth: tRect.width,
      tableHeight: tRect.height,
      cols,
      rows,
    };
  };

  // 选区/内容变更：延后到下一帧，等 .selectedCell 装饰应用后再读取 active
  const scheduleCompute = () => requestAnimationFrame(compute);

  const onMouseMove = (e: MouseEvent) => {
    const tables = Array.from(editor.view.dom.querySelectorAll("table"));
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

  // 横向滚动只平移顶部内层轨道，无需整体重算
  const onScroll = () => {
    if (activeWrapper) scrollLeft.value = activeWrapper.scrollLeft;
  };
  const onResize = () => compute();

  onMounted(() => {
    editor.on("selectionUpdate", scheduleCompute);
    editor.on("update", scheduleCompute);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
  });

  onBeforeUnmount(() => {
    editor.off("selectionUpdate", scheduleCompute);
    editor.off("update", scheduleCompute);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("scroll", onScroll, true);
    window.removeEventListener("resize", onResize);
  });

  return { geometry, scrollLeft };
}

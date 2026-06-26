<!-- src/views/admin/components/posts/editor/content/menus/table/PostEditorTableControls.vue -->
<script setup lang="ts">
import { computed, toRef } from "vue";
import type { Editor } from "@tiptap/core";
import { Plus } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import { useTableGeometry } from "./composables/use-table-geometry";
import { useCellSelection } from "./composables/use-cell-selection";
import { useTableInsert } from "./composables/use-table-insert";
import { useTableReorder } from "./composables/use-table-reorder";
import TableBlockHandle from "./TableBlockHandle.vue";

/**
 * PostEditorTableControls — 表格行/列把手 + 行列间「+」插入点（滑动窗口模型）
 *
 * 固定外壳(overflow:hidden) 负责定位/裁剪/圆角；内层轨道随 scrollLeft 平移：
 * - 列把手条：固定圆角窗 + 内层段轨道滑动（圆角固定在两端，不随滚动）。
 * - 列插入点/竖线：滑动层（随表格列平移、超出裁剪）。
 * - 行把手条 / 行插入点：完全固定（行不横向移动）。
 *
 * 整组 z-40 置于编辑区之上；外壳 pointer-events-none，仅把手/插入点可点。
 *
 * 左上角块手柄（TableBlockHandle）：行/列把手条拐角处，hover 弹出剪切/复制/删除整表菜单。
 */
const props = defineProps<{
  editor: Editor;
  containerRef?: HTMLElement | null;
}>();

const { t } = useLang();
const { geometry, scrollLeft } = useTableGeometry(
  props.editor,
  toRef(props, "containerRef"),
);
const { selectColumn, selectRow } = useCellSelection(props.editor);
const { insertColumn, insertRow } = useTableInsert(props.editor);
const { reorder, begin } = useTableReorder(props.editor);

const THICKNESS = 8;
const GUTTER = 28;

/** 内层轨道（列方向）：宽=表格宽，随 scrollLeft 平移 */
const trackStyle = computed(() => {
  const g = geometry.value;
  if (!g) return {};
  return {
    width: `${g.tableWidth}px`,
    transform: `translateX(${-scrollLeft.value}px)`,
  };
});

interface Bound {
  offset: number;
  cellEl: HTMLElement;
  before: boolean;
}

const colBounds = computed<Bound[]>(() => {
  const g = geometry.value;
  if (!g || g.cols.length === 0) return [];
  const out: Bound[] = [];
  let acc = 0;
  for (const c of g.cols) {
    out.push({ offset: acc, cellEl: c.cellEl, before: true });
    acc += c.size;
  }
  const last = g.cols[g.cols.length - 1]!;
  out.push({ offset: acc, cellEl: last.cellEl, before: false });
  return out;
});

const rowBounds = computed<Bound[]>(() => {
  const g = geometry.value;
  if (!g || g.rows.length === 0) return [];
  const out: Bound[] = [];
  let acc = 0;
  for (const r of g.rows) {
    out.push({ offset: acc, cellEl: r.cellEl, before: true });
    acc += r.size;
  }
  const last = g.rows[g.rows.length - 1]!;
  out.push({ offset: acc, cellEl: last.cellEl, before: false });
  return out;
});
</script>

<template>
  <template v-if="geometry">
    <!-- 左上角块手柄：卡片浮在表格左上角外侧（右下角对齐表格左上角） -->
    <div
      v-if="geometry.rows.length"
      class="th-corner"
      :style="{
        left: `${geometry.clip.left}px`,
        top: `${geometry.clip.top}px`,
      }"
    >
      <TableBlockHandle :editor="editor" :cell-el="geometry.rows[0]!.cellEl" />
    </div>

    <!-- 列把手条：固定圆角窗 + 内层段轨道滑动 -->
    <div
      class="th-shell rounded-t-md"
      :style="{
        left: `${geometry.clip.left}px`,
        top: `${geometry.clip.top - THICKNESS}px`,
        width: `${geometry.clip.width}px`,
        height: `${THICKNESS}px`,
      }"
    >
      <div class="absolute left-0 top-0 flex h-full" :style="trackStyle">
        <button
          v-for="(col, i) in geometry.cols"
          :key="`col-${i}`"
          type="button"
          class="th-seg h-full transition-colors"
          :class="{
            'is-active': col.active,
            'is-dragging': reorder?.axis === 'col' && reorder.from === i,
          }"
          :style="{ width: `${col.size}px` }"
          :aria-label="
            t('views.admin.PostEditor.content.tableControls.selectColumn')
          "
          @mousedown.prevent="
            begin('col', i, col.cellEl, $event, () => selectColumn(col.cellEl))
          "
        />
      </div>
    </div>

    <!-- 列插入点 + 竖线：滑动层 -->
    <div
      class="th-shell"
      :style="{
        left: `${geometry.clip.left}px`,
        top: `${geometry.clip.top - GUTTER}px`,
        width: `${geometry.clip.width}px`,
        height: `${GUTTER + geometry.tableHeight}px`,
      }"
    >
      <div class="absolute left-0 top-0 h-full" :style="trackStyle">
        <button
          v-for="(b, i) in colBounds"
          :key="`cins-${i}`"
          type="button"
          class="th-ins th-ins-col pointer-events-auto absolute"
          :style="{ left: `${b.offset}px`, top: `${GUTTER}px` }"
          :aria-label="
            t('views.admin.PostEditor.content.tableControls.insertColumn')
          "
          @mousedown.prevent="insertColumn(b.cellEl, b.before)"
        >
          <span class="th-ins-dot"><Plus class="h-3 w-3" /></span>
          <span
            class="th-ins-line-v"
            :style="{ height: `${geometry.tableHeight}px` }"
          />
        </button>

        <!-- 列拖拽落点线 -->
        <span
          v-if="reorder?.axis === 'col' && colBounds[reorder.boundary]"
          class="th-drop th-drop-v"
          :style="{
            left: `${colBounds[reorder.boundary]!.offset}px`,
            top: `${GUTTER}px`,
            height: `${geometry.tableHeight}px`,
          }"
        />
      </div>
    </div>
    <div
      class="th-shell rounded-l-md"
      :style="{
        left: `${geometry.clip.left - THICKNESS}px`,
        top: `${geometry.clip.top}px`,
        width: `${THICKNESS}px`,
        height: `${geometry.tableHeight}px`,
      }"
    >
      <div class="flex h-full flex-col">
        <button
          v-for="(row, i) in geometry.rows"
          :key="`row-${i}`"
          type="button"
          class="th-seg w-full transition-colors"
          :class="{
            'is-active': row.active,
            'is-dragging': reorder?.axis === 'row' && reorder.from === i,
          }"
          :style="{ height: `${row.size}px` }"
          :aria-label="
            t('views.admin.PostEditor.content.tableControls.selectRow')
          "
          @mousedown.prevent="
            begin('row', i, row.cellEl, $event, () => selectRow(row.cellEl))
          "
        />
      </div>
    </div>

    <!-- 行插入点 + 横线：完全固定 -->
    <div
      class="th-shell"
      :style="{
        left: `${geometry.clip.left - GUTTER}px`,
        top: `${geometry.clip.top}px`,
        width: `${GUTTER + geometry.clip.width}px`,
        height: `${geometry.tableHeight}px`,
      }"
    >
      <button
        v-for="(b, i) in rowBounds"
        :key="`rins-${i}`"
        type="button"
        class="th-ins th-ins-row pointer-events-auto absolute"
        :style="{ left: `${GUTTER}px`, top: `${b.offset}px` }"
        :aria-label="
          t('views.admin.PostEditor.content.tableControls.insertRow')
        "
        @mousedown.prevent="insertRow(b.cellEl, b.before)"
      >
        <span class="th-ins-dot"><Plus class="h-3 w-3" /></span>
        <span
          class="th-ins-line-h"
          :style="{ width: `${geometry.clip.width}px` }"
        />
      </button>

      <!-- 行拖拽落点线 -->
      <span
        v-if="reorder?.axis === 'row' && rowBounds[reorder.boundary]"
        class="th-drop th-drop-h"
        :style="{
          top: `${rowBounds[reorder.boundary]!.offset}px`,
          left: `${GUTTER}px`,
          width: `${geometry.clip.width}px`,
        }"
      />
    </div>
  </template>
</template>

<style scoped>
/* 固定外壳：定位 + 裁剪，置于编辑区之上，仅子元素可点 */
.th-shell {
  position: absolute;
  z-index: 40;
  overflow: hidden;
  pointer-events: none;
}

/* 左上角块手柄容器：卡片右下角对齐表格左上角，浮在左上方外侧；在外壳之上可点 */
.th-corner {
  position: absolute;
  z-index: 50;
  transform: translate(-100%, -100%);
  pointer-events: auto;
}

/* ── 行/列把手段（无分隔线，连续一条） ── */
.th-seg {
  pointer-events: auto;
  cursor: grab;
  background: color-mix(in srgb, var(--theme-fg-muted) 14%, transparent);
}
.th-seg:hover {
  background: color-mix(in srgb, var(--theme-fg-muted) 30%, transparent);
}
.th-seg.is-active,
.th-seg.is-active:hover {
  background: var(--theme-accent);
}
/* 拖拽中的源行/列把手：半透明强调色，提示「正在移动」 */
.th-seg.is-dragging {
  background: color-mix(in srgb, var(--theme-accent) 55%, transparent);
  cursor: grabbing;
}

/* ── 行列间「+」插入点 ── */
.th-ins {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  background: transparent;
}
.th-ins-col {
  transform: translate(-50%, -100%);
}
.th-ins-row {
  transform: translate(-100%, -50%);
}
.th-ins-dot {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background: var(--theme-accent);
  color: #fff;
  opacity: 0;
  transition: opacity 0.1s;
}
.th-ins:hover .th-ins-dot {
  opacity: 1;
}
.th-ins-line-v {
  position: absolute;
  top: 100%;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: var(--theme-accent);
  opacity: 0;
  pointer-events: none;
}
.th-ins-line-h {
  position: absolute;
  left: 100%;
  top: 50%;
  height: 2px;
  transform: translateY(-50%);
  background: var(--theme-accent);
  opacity: 0;
  pointer-events: none;
}
.th-ins:hover .th-ins-line-v,
.th-ins:hover .th-ins-line-h {
  opacity: 1;
}

/* ── 拖拽落点线（重排时显示，比插入线略粗以区分） ── */
.th-drop {
  position: absolute;
  z-index: 1;
  background: var(--theme-accent);
  border-radius: 9999px;
  pointer-events: none;
}
.th-drop-v {
  width: 3px;
  transform: translateX(-50%);
}
.th-drop-h {
  height: 3px;
  transform: translateY(-50%);
}
</style>

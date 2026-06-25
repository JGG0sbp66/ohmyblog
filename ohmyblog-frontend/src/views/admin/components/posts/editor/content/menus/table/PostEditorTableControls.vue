<!-- src/views/admin/components/posts/editor/content/menus/table/PostEditorTableControls.vue -->
<script setup lang="ts">
import { computed, toRef } from "vue";
import type { Editor } from "@tiptap/core";
import { Plus } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import { useTableGeometry } from "./composables/use-table-geometry";
import { useCellSelection } from "./composables/use-cell-selection";
import { useTableInsert } from "./composables/use-table-insert";

/**
 * PostEditorTableControls — 表格行 / 列把手 + 行列间「+」插入点（仿飞书）
 *
 * 鼠标移入表格区域（或选区在表内）时：
 * - 顶部「列把手条」、左侧「行把手条」：点击选中整列 / 整行（CellSelection）。
 * - 列 / 行边界（含首尾）上 hover 出 "+" 与主题色插入线，点击在该处插入列 / 行。
 *
 * 覆盖层 pointer-events-none，仅把手 / 插入点可点，不挡正文。
 */
const props = defineProps<{
  editor: Editor;
  containerRef?: HTMLElement | null;
}>();

const { t } = useLang();
const { geometry } = useTableGeometry(
  props.editor,
  toRef(props, "containerRef"),
);
const { selectColumn, selectRow } = useCellSelection(props.editor);
const { insertColumn, insertRow } = useTableInsert(props.editor);

/** 把手条厚度（px） */
const THICKNESS = 8;

interface Bound {
  pos: number; // 相对 container：列为 x，行为 y
  cellEl: HTMLElement; // 代表单元格
  before: boolean; // 在该格之前插入；末尾边界为 false（之后插入）
}

/** 列边界（cols + 1 个：每列左缘 + 最后一列右缘） */
const colBounds = computed<Bound[]>(() => {
  const g = geometry.value;
  if (!g || g.cols.length === 0) return [];
  const out: Bound[] = [];
  let acc = 0;
  for (const c of g.cols) {
    out.push({ pos: g.left + acc, cellEl: c.cellEl, before: true });
    acc += c.size;
  }
  const last = g.cols[g.cols.length - 1]!;
  out.push({ pos: g.left + acc, cellEl: last.cellEl, before: false });
  return out;
});

/** 行边界（rows + 1 个） */
const rowBounds = computed<Bound[]>(() => {
  const g = geometry.value;
  if (!g || g.rows.length === 0) return [];
  const out: Bound[] = [];
  let acc = 0;
  for (const r of g.rows) {
    out.push({ pos: g.top + acc, cellEl: r.cellEl, before: true });
    acc += r.size;
  }
  const last = g.rows[g.rows.length - 1]!;
  out.push({ pos: g.top + acc, cellEl: last.cellEl, before: false });
  return out;
});
</script>

<template>
  <div v-if="geometry" class="pointer-events-none absolute inset-0 z-40">
    <!-- 顶部列把手条 -->
    <div
      class="th-bar pointer-events-auto absolute flex -translate-y-full overflow-hidden rounded-t-md"
      :style="{
        left: `${geometry.left}px`,
        top: `${geometry.top}px`,
        width: `${geometry.width}px`,
        height: `${THICKNESS}px`,
      }"
    >
      <button
        v-for="(col, i) in geometry.cols"
        :key="`col-${i}`"
        type="button"
        class="th-seg h-full transition-colors"
        :class="{ 'is-active': col.active, 'th-divide-l': i > 0 }"
        :style="{ width: `${col.size}px` }"
        :aria-label="
          t('views.admin.PostEditor.content.tableControls.selectColumn')
        "
        @mousedown.prevent="selectColumn(col.cellEl)"
      />
    </div>

    <!-- 左侧行把手条 -->
    <div
      class="th-bar pointer-events-auto absolute flex -translate-x-full flex-col overflow-hidden rounded-l-md"
      :style="{
        left: `${geometry.left}px`,
        top: `${geometry.top}px`,
        width: `${THICKNESS}px`,
        height: `${geometry.height}px`,
      }"
    >
      <button
        v-for="(row, i) in geometry.rows"
        :key="`row-${i}`"
        type="button"
        class="th-seg w-full transition-colors"
        :class="{ 'is-active': row.active, 'th-divide-t': i > 0 }"
        :style="{ height: `${row.size}px` }"
        :aria-label="
          t('views.admin.PostEditor.content.tableControls.selectRow')
        "
        @mousedown.prevent="selectRow(row.cellEl)"
      />
    </div>

    <!-- 列边界插入点：顶部 hover 出 "+" 与竖插入线 -->
    <button
      v-for="(b, i) in colBounds"
      :key="`cins-${i}`"
      type="button"
      class="th-ins th-ins-col pointer-events-auto absolute"
      :style="{ left: `${b.pos}px`, top: `${geometry.top}px` }"
      :aria-label="
        t('views.admin.PostEditor.content.tableControls.insertColumn')
      "
      @mousedown.prevent="insertColumn(b.cellEl, b.before)"
    >
      <span class="th-ins-dot"><Plus class="h-3 w-3" /></span>
      <span class="th-ins-line-v" :style="{ height: `${geometry.height}px` }" />
    </button>

    <!-- 行边界插入点：左侧 hover 出 "+" 与横插入线 -->
    <button
      v-for="(b, i) in rowBounds"
      :key="`rins-${i}`"
      type="button"
      class="th-ins th-ins-row pointer-events-auto absolute"
      :style="{ top: `${b.pos}px`, left: `${geometry.left}px` }"
      :aria-label="t('views.admin.PostEditor.content.tableControls.insertRow')"
      @mousedown.prevent="insertRow(b.cellEl, b.before)"
    >
      <span class="th-ins-dot"><Plus class="h-3 w-3" /></span>
      <span class="th-ins-line-h" :style="{ width: `${geometry.width}px` }" />
    </button>
  </div>
</template>

<style scoped>
/* ── 行/列把手条 ── */
.th-seg {
  background: color-mix(in srgb, var(--theme-fg-muted) 14%, transparent);
}
.th-seg:hover {
  background: color-mix(in srgb, var(--theme-fg-muted) 30%, transparent);
}
.th-divide-l {
  box-shadow: inset 1px 0 0 var(--theme-border);
}
.th-divide-t {
  box-shadow: inset 0 1px 0 var(--theme-border);
}
.th-seg.is-active,
.th-seg.is-active:hover {
  background: var(--theme-accent);
  box-shadow: none;
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
  /* 居中于列边界、贴在表格顶缘上方 */
  transform: translate(-50%, -100%);
}
.th-ins-row {
  /* 居中于行边界、贴在表格左缘外侧 */
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
/* 竖插入线：从表格顶缘向下贯穿 */
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
/* 横插入线：从表格左缘向右贯穿 */
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
</style>

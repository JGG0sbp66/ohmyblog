<!-- src/views/admin/components/posts/editor/content/menus/table/PostEditorTableControls.vue -->
<script setup lang="ts">
import { toRef } from "vue";
import type { Editor } from "@tiptap/core";
import { useLang } from "@/composables/lang.hook";
import { useTableGeometry } from "./composables/use-table-geometry";
import { useCellSelection } from "./composables/use-cell-selection";

/**
 * PostEditorTableControls — 表格行 / 列把手（仿飞书）
 *
 * 鼠标移入表格区域（或选区在表内）时，于顶部出「列把手条」、左侧出「行把手条」。
 * 每条是一个整体（仅外角圆角），内部按行 / 列分段，段间细分隔线。
 * 点击某段选中整列 / 整行（CellSelection），随后气泡菜单自动浮出。
 *
 * 配色：默认与表头同色（中性灰）；hover 更深的灰；该行/列被选中时变主题色。
 * 覆盖层 pointer-events-none，仅把手条可点，不挡正文。
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

/** 把手条厚度（px） */
const THICKNESS = 8;
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
  </div>
</template>

<style scoped>
/* 默认与表头同色（--theme-fg-muted 低透明度，纯中性灰） */
.th-seg {
  background: color-mix(in srgb, var(--theme-fg-muted) 14%, transparent);
}
/* hover：更深的中性灰（不用主题色） */
.th-seg:hover {
  background: color-mix(in srgb, var(--theme-fg-muted) 30%, transparent);
}
/* 段间细分隔线：用 inset 阴影，不占布局宽度，与表格列/行边线对齐 */
.th-divide-l {
  box-shadow: inset 1px 0 0 var(--theme-border);
}
.th-divide-t {
  box-shadow: inset 0 1px 0 var(--theme-border);
}
/* 选中：变主题色（同 primary 按钮）。置于 hover 之后以覆盖其样式 */
.th-seg.is-active,
.th-seg.is-active:hover {
  background: var(--theme-accent);
  box-shadow: none;
}
</style>

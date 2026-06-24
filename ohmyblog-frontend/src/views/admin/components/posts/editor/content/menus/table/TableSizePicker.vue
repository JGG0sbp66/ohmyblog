<!-- src/views/admin/components/posts/editor/content/menus/table/TableSizePicker.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";

/**
 * TableSizePicker — 网格尺寸选择器（仿飞书插表）
 *
 * 纯 UI 组件，不耦合编辑器：
 * - hover 方格网，左上角 r×c 区域高亮，并显示 "{rows} × {cols}"
 * - 点击当前 hover 的格子 → emit select({ rows, cols })
 * - 鼠标移到边缘行/列时网格自动扩展（上限 maxRows/maxCols）
 *
 * 由调用方（slash 命令 / floating handle 二级菜单）决定如何插入。
 */
const props = withDefaults(
  defineProps<{
    /** 初始可见格子数 */
    initialSize?: number;
    /** 行/列上限 */
    maxRows?: number;
    maxCols?: number;
  }>(),
  { initialSize: 6, maxRows: 10, maxCols: 10 },
);

const emit = defineEmits<{
  select: [size: { rows: number; cols: number }];
}>();

/** 当前 hover 的行列数（1-based，0 表示未 hover） */
const hoverRows = ref(0);
const hoverCols = ref(0);

/** 可见网格尺寸：随 hover 接近边缘动态 +1，夹在 [initialSize, max] 之间 */
const visibleRows = computed(() =>
  Math.min(Math.max(props.initialSize, hoverRows.value + 1), props.maxRows),
);
const visibleCols = computed(() =>
  Math.min(Math.max(props.initialSize, hoverCols.value + 1), props.maxCols),
);

const onHover = (rows: number, cols: number) => {
  hoverRows.value = rows;
  hoverCols.value = cols;
};

const onLeave = () => {
  hoverRows.value = 0;
  hoverCols.value = 0;
};

const onPick = () => {
  if (hoverRows.value > 0 && hoverCols.value > 0) {
    emit("select", { rows: hoverRows.value, cols: hoverCols.value });
  }
};

const isFilled = (row: number, col: number) =>
  row <= hoverRows.value && col <= hoverCols.value;
</script>

<template>
  <div class="flex flex-col gap-2 p-3 select-none">
    <div class="text-center text-xs text-fg-muted">
      <template v-if="hoverRows > 0">
        {{
          $t("views.admin.PostEditor.content.tablePicker.dimensions", {
            rows: hoverRows,
            cols: hoverCols,
          })
        }}
      </template>
      <template v-else>
        {{ $t("views.admin.PostEditor.content.tablePicker.hint") }}
      </template>
    </div>

    <div
      class="grid gap-1"
      :style="{ gridTemplateColumns: `repeat(${visibleCols}, 1.25rem)` }"
      @mouseleave="onLeave"
    >
      <template v-for="row in visibleRows" :key="row">
        <button
          v-for="col in visibleCols"
          :key="`${row}-${col}`"
          type="button"
          class="h-5 w-5 rounded-sm border transition-colors"
          :class="
            isFilled(row, col)
              ? 'border-accent bg-accent/30'
              : 'border-border bg-bg-muted/40'
          "
          @mouseenter="onHover(row, col)"
          @mousedown.prevent="onPick"
        />
      </template>
    </div>
  </div>
</template>

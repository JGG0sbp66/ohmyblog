<!-- src/views/admin/components/posts/editor/content/menus/table/TableSizePicker.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { useLang } from "@/composables/lang.hook";

/**
 * TableSizePicker — 网格尺寸选择器（仿飞书插表）
 *
 * 纯 UI 组件，不耦合编辑器：
 * - 固定 size×size 方格网（默认 8×8），hover 时左上角 r×c 区域高亮并显示 "{rows} × {cols}"
 * - 点击格子 → emit select({ rows, cols })（直接用格子坐标，不依赖 hover 状态）
 *
 * 由调用方（slash 命令 / floating handle 二级菜单）决定如何插入。
 */
const props = withDefaults(
  defineProps<{
    /** 网格边长（行列上限），锁定方阵 */
    size?: number;
  }>(),
  { size: 8 },
);

const emit = defineEmits<{
  select: [size: { rows: number; cols: number }];
}>();

const { t } = useLang();

/** 当前 hover 的行列数（1-based，0 表示未 hover） */
const hoverRows = ref(0);
const hoverCols = ref(0);

const onHover = (rows: number, cols: number) => {
  hoverRows.value = rows;
  hoverCols.value = cols;
};

const onLeave = () => {
  hoverRows.value = 0;
  hoverCols.value = 0;
};

const onPick = (rows: number, cols: number) => {
  emit("select", { rows, cols });
};

const isFilled = (row: number, col: number) =>
  row <= hoverRows.value && col <= hoverCols.value;
</script>

<template>
  <div class="flex flex-col gap-2 p-3 select-none">
    <div class="text-center text-xs text-fg-muted">
      <template v-if="hoverRows > 0">
        {{
          t("views.admin.PostEditor.content.tablePicker.dimensions", {
            rows: hoverRows,
            cols: hoverCols,
          })
        }}
      </template>
      <template v-else>
        {{ t("views.admin.PostEditor.content.tablePicker.hint") }}
      </template>
    </div>

    <div
      class="grid gap-1"
      :style="{ gridTemplateColumns: `repeat(${size}, 1.25rem)` }"
      @mouseleave="onLeave"
      @mousedown.prevent
    >
      <template v-for="row in size" :key="row">
        <button
          v-for="col in size"
          :key="`${row}-${col}`"
          type="button"
          class="h-5 w-5 rounded-sm border transition-colors"
          :class="
            isFilled(row, col)
              ? 'border-accent bg-accent/30'
              : 'border-border bg-bg-muted/40'
          "
          @mouseenter="onHover(row, col)"
          @mousedown.prevent="onPick(row, col)"
      /></template>
    </div>
  </div>
</template>

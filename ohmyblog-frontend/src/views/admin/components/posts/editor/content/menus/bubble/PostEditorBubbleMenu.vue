<!-- src/views/admin/components/posts/editor/content/menus/bubble/PostEditorBubbleMenu.vue -->
<script setup lang="ts">
import { toRef } from "vue";
import type { Editor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { CellSelection } from "@tiptap/pm/tables";
import BubbleBlockSection from "./sections/BubbleBlockSection.vue";
import BubbleAlignSection from "./sections/BubbleAlignSection.vue";
import BubbleFormatSection from "./sections/BubbleFormatSection.vue";
import BubbleTableSection from "./sections/BubbleTableSection.vue";
import { useBubbleAnchor } from "./composables/use-bubble-anchor";
import { useTableCommands } from "./composables/use-table-commands";
/**
 * PostEditorBubbleMenu — 文本气泡菜单
 *
 * 触发条件：选区非空 且 不是 NodeSelection。
 * 锚点：基于 window.getSelection() 的实际矩形（多行选区取首尾合并矩形）。
 *
 * Tiptap v3 不再导出 BubbleMenu Vue 组件，定位与显隐由 useBubbleAnchor 管理。
 */
const props = defineProps<{
  editor: Editor;
  containerRef?: HTMLElement | null;
}>();

const { menuRef, isVisible, menuStyle } = useBubbleAnchor(props.editor, {
  containerRef: toRef(props, "containerRef"),
  computeAnchorRect: (editor) => {
    const { selection } = editor.state;

    // 跨格 / 合并格选区（CellSelection）：window.getSelection() 在 CellSelection
    // 下取不到稳定矩形，合并/拆分后会让菜单乱跳。改用所选单元格 DOM 的并集矩形，
    // 菜单稳定锚定在选区上方。
    if (selection instanceof CellSelection) {
      let rect: DOMRect | null = null;
      selection.forEachCell((_node, pos) => {
        const dom = editor.view.nodeDOM(pos);
        if (!(dom instanceof HTMLElement)) return;
        const r = dom.getBoundingClientRect();
        if (!rect) {
          rect = r;
          return;
        }
        const left = Math.min(rect.left, r.left);
        const top = Math.min(rect.top, r.top);
        const right = Math.max(rect.right, r.right);
        const bottom = Math.max(rect.bottom, r.bottom);
        rect = new DOMRect(left, top, right - left, bottom - top);
      });
      return rect;
    }

    if (selection.empty || selection instanceof NodeSelection) return null;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect.width) return null;

    return rect;
  },
});

const { showTableSection } = useTableCommands();
</script>

<template>
  <Transition
    enter-from-class="opacity-0 scale-95 translate-y-1"
    leave-to-class="opacity-0 scale-95 translate-y-1"
  >
    <div
      v-if="isVisible"
      ref="menuRef"
      class="absolute z-50 pointer-events-auto flex items-center gap-1 px-2 py-1.5 bg-bg-card border border-border/40 rounded-xl shadow-lg origin-bottom"
      :style="menuStyle"
    >
      <!-- 区域零：表格操作（最左，仿飞书）：合并/拆分、设为表头、删除行列 -->
      <template v-if="showTableSection(editor)">
        <BubbleTableSection :editor="editor" />
        <div class="w-px h-5 bg-border/50 mx-0.5" />
      </template>

      <!-- 区域一：文本块类型 -->
      <BubbleBlockSection :editor="editor" />

      <!-- 段间分隔线 -->
      <div class="w-px h-5 bg-border/50 mx-0.5" />

      <!-- 区域二：对齐与缩进 -->
      <BubbleAlignSection :editor="editor" />

      <!-- 段间分隔线 -->
      <div class="w-px h-5 bg-border/50 mx-0.5" />

      <!-- 区域三：行内格式 -->
      <BubbleFormatSection :editor="editor" />
    </div>
  </Transition>
</template>

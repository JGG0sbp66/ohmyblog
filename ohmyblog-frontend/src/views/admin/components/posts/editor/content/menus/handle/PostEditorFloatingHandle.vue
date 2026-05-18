<!-- src/views/admin/components/posts/editor/content/menus/handle/PostEditorFloatingHandle.vue -->
<script setup lang="ts">
import { ref } from "vue";
import type { Editor } from "@tiptap/core";
import HandleEmptyState from "./states/HandleEmptyState.vue";
import HandleBlockState from "./states/HandleBlockState.vue";
import { useEditorHoverBlock } from "./composables/use-editor-hover-block";
import { useBlockDrag } from "./composables/use-block-drag";

/**
 * PostEditorFloatingHandle — 行左侧悬浮操作手柄
 *
 * 鼠标悬停到编辑器某一行时，在其左侧以卡片形式显示：
 * - 空行：HandleEmptyState（[+]）
 * - 有内容行：HandleBlockState（[拖拽点] [块类型图标]）
 *
 * 本组件只做"渲染 + 串接"，状态与行为分别由两个 composable 持有：
 * - useEditorHoverBlock —— hover 跟随、位置计算、显隐节流
 * - useBlockDrag        —— 拖拽 slice 打包
 *
 * 使用 Teleport + position:fixed 避免父容器 overflow 裁剪。
 */
const props = defineProps<{
  editor: Editor;
}>();

const handleRef = ref<HTMLElement | null>(null);

const hover = useEditorHoverBlock(props.editor, handleRef);
const drag = useBlockDrag(props.editor, () => hover.dragPos.value);
</script>

<template>
  <Teleport to="body">
    <div
      ref="handleRef"
      class="fixed z-40 select-none flex items-center bg-bg-card border border-border/30 rounded-lg shadow-sm px-1 py-0.5"
      :class="hover.visible.value ? 'pointer-events-auto' : 'pointer-events-none'"
      :style="{
        top: `${hover.top.value}px`,
        left: `${hover.left.value}px`,
        transform: 'translateX(-100%)',
        opacity: hover.visible.value ? 1 : 0,
        transition: `opacity 100ms ease${hover.transitionTop.value ? ', top 80ms ease-out' : ''}`,
      }"
      @mouseenter="hover.cancelHide"
      @mouseleave="hover.scheduleHide"
    >
      <HandleEmptyState v-if="hover.isEmpty.value" :editor="editor" />
      <HandleBlockState
        v-else
        :icon="hover.icon.value"
        :editor="editor"
        @grip-drag-start="drag.onDragStart"
        @grip-drag-end="drag.onDragEnd"
      />
    </div>
  </Teleport>
</template>

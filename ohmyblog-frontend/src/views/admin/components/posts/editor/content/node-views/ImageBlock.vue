<!-- src/views/admin/components/posts/editor/content/node-views/ImageBlock.vue -->
<!--
  NodeView: 可调整宽度的图片节点
  - 拖拽右侧 handle 改变图片宽度，高度自动按比例缩放
  - 选中时显示蓝色边框
  - 宽度存入节点 attrs.width，序列化为内联 style

  History 友好：
  - 拖拽期间只更新本地 liveWidth ref，不 dispatch ProseMirror transaction
  - 鼠标松开时一次性把最终宽度写入 node attrs，整段拖动只占 1 步 undo
-->
<script setup lang="ts">
import { nodeViewProps, NodeViewWrapper } from "@tiptap/vue-3";
import { computed, ref } from "vue";
import { useEventListener } from "@vueuse/core";

const props = defineProps(nodeViewProps);

const containerRef = ref<HTMLDivElement | null>(null);

/**
 * 拖拽期间的视觉宽度（CSS 层），不写入 ProseMirror。
 * null 表示未在拖拽，渲染回退到 node.attrs.width
 */
const liveWidth = ref<number | null>(null);

let isResizing = false;
let startX = 0;
let startWidth = 0;

const onResizeStart = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  isResizing = true;
  startX = e.clientX;
  startWidth =
    containerRef.value?.getBoundingClientRect().width ??
    props.node.attrs.width ??
    500;
  liveWidth.value = startWidth;
};

useEventListener(document, "mousemove", (e: MouseEvent) => {
  if (!isResizing) return;
  liveWidth.value = Math.max(80, Math.round(startWidth + (e.clientX - startX)));
});

useEventListener(document, "mouseup", () => {
  if (!isResizing) return;
  isResizing = false;
  // 提交最终宽度到 node attrs（单个 transaction，可一次 undo）
  if (liveWidth.value != null && liveWidth.value !== props.node.attrs.width) {
    props.updateAttributes({ width: liveWidth.value });
  }
  liveWidth.value = null;
});

/** 渲染时优先用拖拽中的本地宽度，回退到节点 attrs */
const widthStyle = computed(() => {
  const w = liveWidth.value ?? props.node.attrs.width;
  return w ? { width: `${w}px` } : {};
});
</script>

<template>
  <NodeViewWrapper as="span" class="image-block-wrapper">
    <span
      ref="containerRef"
      class="image-block"
      :class="{ 'image-block--selected': selected }"
      :style="widthStyle"
      contenteditable="false"
    >
      <img
        :src="node.attrs.src"
        :alt="node.attrs.alt ?? ''"
        class="image-block-img"
        draggable="false"
      />
      <!-- 右侧拖拽 handle -->
      <div class="image-resize-handle" @mousedown.stop="onResizeStart" />
    </span>
  </NodeViewWrapper>
</template>

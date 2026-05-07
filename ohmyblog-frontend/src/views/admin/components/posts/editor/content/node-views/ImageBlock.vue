<!-- src/views/admin/components/posts/editor/content/node-views/ImageBlock.vue -->
<!--
  NodeView: 可调整宽度的图片节点
  - 拖拽右侧 handle 改变图片宽度，高度自动按比例缩放
  - 选中时显示蓝色边框
  - 宽度存入节点 attrs.width，序列化为内联 style
-->
<script setup lang="ts">
import { nodeViewProps, NodeViewWrapper } from "@tiptap/vue-3";
import { ref } from "vue";
import { useEventListener } from "@vueuse/core";

const props = defineProps(nodeViewProps);

const containerRef = ref<HTMLDivElement | null>(null);

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
    (props.node.attrs.width ?? 500);
};

useEventListener(document, "mousemove", (e: MouseEvent) => {
  if (!isResizing) return;
  const newWidth = Math.max(80, Math.round(startWidth + (e.clientX - startX)));
  props.updateAttributes({ width: newWidth });
});

useEventListener(document, "mouseup", () => {
  isResizing = false;
});
</script>

<template>
  <NodeViewWrapper as="span" class="image-block-wrapper">
    <span
      ref="containerRef"
      class="image-block"
      :class="{ 'image-block--selected': selected }"
      :style="node.attrs.width ? { width: `${node.attrs.width}px` } : {}"
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

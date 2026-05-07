<!-- src/views/admin/components/posts/editor/content/menus/PostEditorBubbleMenu.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import type { Editor } from "@tiptap/core";
import BubbleBlockSection from "./bubble/BubbleBlockSection.vue";
import BubbleAlignSection from "./bubble/BubbleAlignSection.vue";
import BubbleFormatSection from "./bubble/BubbleFormatSection.vue";

/**
 * PostEditorBubbleMenu — 气泡菜单主板
 *
 * 职责：监听编辑器选区变化，计算菜单坐标，组装三个区域子组件。
 * 业务逻辑（块类型、对齐、行内格式）均委托给各 Section 子组件。
 *
 * Tiptap v3 不再导出 BubbleMenu Vue 组件，改用 selectionUpdate 事件手动定位。
 */
const props = defineProps<{
  editor: Editor;
  containerRef?: HTMLElement | null;
}>();

// 菜单定位与显隐
const isVisible = ref(false);
const menuStyle = ref<Record<string, string>>({});
const menuRef = ref<HTMLElement | null>(null);

const updateMenu = () => {
  // 焦点在菜单内部时（如链接输入框），不做任何隐藏处理
  if (menuRef.value?.contains(document.activeElement)) return;

  const { selection } = props.editor.state;
  if (selection.empty) {
    isVisible.value = false;
    return;
  }
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    isVisible.value = false;
    return;
  }
  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (!rect.width) {
    isVisible.value = false;
    return;
  }

  let top = rect.top;
  let left = rect.left + rect.width / 2;

  // 如果提供了容器 ref，则计算相对于容器的绝对位置
  if (props.containerRef) {
    const containerRect = props.containerRef.getBoundingClientRect();
    top = top - containerRect.top;
    left = left - containerRect.left;
  }

  menuStyle.value = {
    top: `${top - 10}px`,
    left: `${left}px`,
    transform: "translate(-50%, -100%)",
  };
  isVisible.value = true;
};

const hideMenu = ({ event }: { editor: Editor; event: FocusEvent }) => {
  if (
    menuRef.value &&
    event.relatedTarget instanceof Node &&
    menuRef.value.contains(event.relatedTarget)
  ) {
    return;
  }
  isVisible.value = false;
};

/** 页面滚动或 resize 时同步更新菜单坐标 */
const onScrollOrResize = () => {
  if (isVisible.value) updateMenu();
};

onMounted(() => {
  props.editor.on("selectionUpdate", updateMenu);
  props.editor.on("blur", hideMenu);
  window.addEventListener("scroll", onScrollOrResize, true);
  window.addEventListener("resize", onScrollOrResize);
});
onBeforeUnmount(() => {
  props.editor.off("selectionUpdate", updateMenu);
  props.editor.off("blur", hideMenu);
  window.removeEventListener("scroll", onScrollOrResize, true);
  window.removeEventListener("resize", onScrollOrResize);
});
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

<!-- src/views/admin/components/posts/editor/content/menus/handle/PostEditorFloatingHandle.vue -->
<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from "vue";
import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import {
  Type,
  Image,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  Code2,
  Quote,
} from "lucide-vue-next";
import HandleEmptyState from "./states/HandleEmptyState.vue";
import HandleBlockState from "./states/HandleBlockState.vue";

/**
 * PostEditorFloatingHandle — 行左侧悬浮操作手柄
 *
 * 鼠标悬停到编辑器某一行时，在其左侧以卡片形式显示：
 * - 空行：HandleEmptyState（[+]）
 * - 有内容行：HandleBlockState（[拖拽点] [块类型图标]）
 *
 * 使用 Teleport + position:fixed 避免父容器 overflow 裁剪。
 */
const props = defineProps<{
  editor: Editor;
}>();

const isVisible = ref(false);
const fixedTop = ref(0);
const fixedLeft = ref(0);
const isEmpty = ref(false);
const blockIcon = ref<object>(Type);
const handleRef = ref<HTMLElement | null>(null);
const transitionTop = ref(false);
let editorEl: HTMLElement | null = null;

const HANDLE_HEIGHT = 32;
const HANDLE_OFFSET = 6;

/** 根据节点类型返回对应图标 */
const getNodeIcon = (node: Node): object => {
  const name = node.type.name;
  if (name === "heading") {
    const icons = [Heading1, Heading2, Heading3, Heading4, Heading5, Heading6];
    return icons[(node.attrs.level as number) - 1] ?? Type;
  }
  if (name === "bulletList") return List;
  if (name === "orderedList") return ListOrdered;
  if (name === "codeBlock") return Code2;
  if (name === "blockquote") return Quote;
  if (name === "image" || name === "resizableImage") return Image;
  return Type;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleHide = () => {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    isVisible.value = false;
    transitionTop.value = false;
  }, 120);
};

const cancelHide = () => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
};

const onMouseMove = (event: MouseEvent) => {
  cancelHide();

  if (handleRef.value?.contains(event.target as Element)) return;

  const view = props.editor.view;
  // 钳制 x 坐标到编辑器内容区域内，防止在有序列表计数器等左侧区域
  // posAtCoords 解析到容器节点（如 orderedList 首行），引发句柄向上跳动
  const editorRect = (editorEl as HTMLElement).getBoundingClientRect();
  const safeX = Math.max(event.clientX, editorRect.left + 56);
  const result = view.posAtCoords({ left: safeX, top: event.clientY });
  if (!result) {
    scheduleHide();
    return;
  }

  try {
    const { doc } = props.editor.state;
    const $pos = doc.resolve(result.pos);
    if ($pos.depth === 0) {
      scheduleHide();
      return;
    }

    // 从最深层往上找第一个有 DOM 节点的 block（正确处理嵌套列表）
    let blockPos = $pos.before(1);
    let blockNode = $pos.node(1);
    let domNode: HTMLElement | null = null;
    let blockDepth = 1;

    for (let d = $pos.depth; d >= 1; d--) {
      const n = $pos.node(d);
      if (!n.isBlock) continue;
      const p = $pos.before(d);
      const dom = view.nodeDOM(p);
      if (dom instanceof HTMLElement) {
        blockPos = p;
        blockNode = n;
        domNode = dom;
        blockDepth = d;
        break;
      }
    }

    if (!domNode) {
      scheduleHide();
      return;
    }

    // 用 coordsAtPos 取块内第一个字符的行高，避免多行段落的居中偏移
    const rect = domNode.getBoundingClientRect();
    let lineTop = rect.top;
    let lineHeight = 24;
    try {
      const innerPos = blockPos + 1;
      if (innerPos <= doc.content.size) {
        const coords = view.coordsAtPos(innerPos);
        lineTop = coords.top;
        lineHeight = coords.bottom - coords.top;
      }
    } catch { /* fallback to rect */ }

    // 段落位于列表项内时，图标应显示列表类型而非 Type
    let icon = getNodeIcon(blockNode);
    if (blockNode.type.name === "paragraph") {
      for (let d = blockDepth - 1; d >= 1; d--) {
        const ancestor = $pos.node(d);
        if (ancestor.type.name === "listItem") {
          const parent = $pos.node(d - 1);
          if (parent.type.name === "bulletList") { icon = List; break; }
          if (parent.type.name === "orderedList") { icon = ListOrdered; break; }
        }
      }
    }

    const newTop = lineTop + (lineHeight - HANDLE_HEIGHT) / 2;
    const wasVisible = isVisible.value;

    fixedTop.value = newTop;
    fixedLeft.value = rect.left - HANDLE_OFFSET;
    isEmpty.value = blockNode.textContent === "";
    blockIcon.value = icon;
    isVisible.value = true;

    // 首次出现时不做 top 过渡（避免从初始位置滑入），出现后再启用
    if (!wasVisible) {
      nextTick(() => { transitionTop.value = true; });
    }
  } catch {
    scheduleHide();
  }
};

onMounted(() => {
  editorEl = props.editor.view.dom as HTMLElement;
  editorEl.addEventListener("mousemove", onMouseMove);
  editorEl.addEventListener("mouseleave", scheduleHide);
  window.addEventListener("scroll", scheduleHide, true);
});

onBeforeUnmount(() => {
  editorEl?.removeEventListener("mousemove", onMouseMove);
  editorEl?.removeEventListener("mouseleave", scheduleHide);
  window.removeEventListener("scroll", scheduleHide, true);
  if (hideTimer) clearTimeout(hideTimer);
  editorEl = null;
});
</script>

<template>
  <Teleport to="body">
    <div
      ref="handleRef"
      class="fixed z-40 select-none flex items-center
             bg-bg-card border border-border/30 rounded-lg shadow-sm px-1 py-0.5"
      :class="isVisible ? 'pointer-events-auto' : 'pointer-events-none'"
      :style="{
        top: `${fixedTop}px`,
        left: `${fixedLeft}px`,
        transform: 'translateX(-100%)',
        opacity: isVisible ? 1 : 0,
        transition: `opacity 100ms ease${transitionTop ? ', top 80ms ease-out' : ''}`,
      }"
      @mouseenter="cancelHide"
      @mouseleave="scheduleHide"
    >
      <HandleEmptyState v-if="isEmpty" :editor="editor" />
      <HandleBlockState v-else :icon="blockIcon" :editor="editor" />
    </div>
  </Teleport>
</template>

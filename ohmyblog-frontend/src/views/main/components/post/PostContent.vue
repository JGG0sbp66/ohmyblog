<!-- src/views/main/components/post/PostContent.vue -->
<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import DOMPurify from "dompurify";
import { enhanceCodeBlocks } from "./enhance-code-blocks";
import { extractHeadings, type TocHeading } from "./toc/extract-headings";

/**
 * PostContent — 前台文章渲染组件（纯 HTML 渲染，不加载 Tiptap）
 *
 * 渲染源：contentHtml（后台 editor.getHTML() 导出、存库的 HTML）。
 * 相比旧的「只读 Tiptap 实例」，阅读端不再打包 ProseMirror / 编辑器扩展。
 *
 * 一致性保障：
 * - 包裹类 .tiptap（与编辑器同名）复用全局 css/tiptap/*.css，正文样式与后台逐像素一致。
 * - 代码块的语法高亮 / MacOS 外壳 / 行号 / 复制按钮是运行时产物，getHTML 不含，
 *   由 enhanceCodeBlocks 在挂载后就地重建（见该模块注释）。
 * - 标题锚点同理由 extractHeadings 就地注入，不烘焙进 contentHtml（RSS 全文要保持
 *   干净语义），提取结果通过 headings 事件上抛给侧边目录。
 * - v-html 前先经 DOMPurify 过滤，防御性去除潜在恶意标记。
 */

const props = defineProps<{
  contentHtml?: string | null;
}>();

const emit = defineEmits<{
  headings: [TocHeading[]];
}>();

const rootRef = ref<HTMLElement | null>(null);
const safeHtml = ref("");

watch(
  () => props.contentHtml,
  async (raw) => {
    safeHtml.value = raw ? DOMPurify.sanitize(raw) : "";
    // 等 v-html 落地后再增强代码块：v-html 变化会整体重置内部 DOM，需重新增强
    await nextTick();
    if (rootRef.value) {
      enhanceCodeBlocks(rootRef.value);
      emit("headings", extractHeadings(rootRef.value));
    } else {
      emit("headings", []);
    }
  },
  { immediate: true },
);
</script>

<template>
  <div ref="rootRef" class="tiptap ProseMirror" v-html="safeHtml"></div>
</template>

<!-- src/views/admin/components/posts/editor/PostEditorContent.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { useEditorHeaderCollapse } from "@/composables/editor-header.hook";
import PostEditorTitle from "./content/PostEditorTitle.vue";
import PostEditorBody from "./content/PostEditorBody.vue";

/**
 * PostEditorContent — 编辑器内容区域主入口
 *
 * 组合 Title 和 Body 两个子组件。
 * v-model:title              → 文章标题
 * v-model:content            → ProseMirror JSON
 * v-model:contentText        → 纯文本（搜索/预览）
 * v-model:contentHtml        → HTML（前台展示/RSS）
 * v-model:totalCharCount     → 全文字符数（来自 CharacterCount）
 * v-model:selectedCharCount  → 当前选区字符数
 */
const title = defineModel<string>("title", { default: "" });
const content = defineModel<object | undefined>("content");
const contentText = defineModel<string>("contentText", { default: "" });
const contentHtml = defineModel<string>("contentHtml", { default: "" });
const totalCharCount = defineModel<number>("totalCharCount", { default: 0 });
const selectedCharCount = defineModel<number>("selectedCharCount", {
  default: 0,
});

/**
 * 编辑页真正滚动的是本组件这层容器（PostEditor.page 的 BaseCard 是
 * flex-1 overflow-hidden，滚动被吃在内部），AdminLayout 的 <main> 在这个路由下
 * 并不滚动。移动端顶部栏的收起信号因此只能从这里发出。
 */
const scrollRef = ref<HTMLElement | null>(null);
useEditorHeaderCollapse(scrollRef);
</script>

<template>
  <div ref="scrollRef" class="flex-1 overflow-y-auto bg-bg-muted/10">
    <!-- 内容宽度限制：适宜阅读的最大宽，居中对齐 -->
    <div
      class="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-8 sm:py-10"
    >
      <!-- 标题 -->
      <PostEditorTitle v-model="title" />

      <!-- 分隔线 -->
      <div class="border-b border-border/30" />

      <!-- 正文 -->
      <PostEditorBody
        v-model:json="content"
        v-model:text="contentText"
        v-model:html="contentHtml"
        v-model:total-char-count="totalCharCount"
        v-model:selected-char-count="selectedCharCount"
      />
    </div>
  </div>
</template>

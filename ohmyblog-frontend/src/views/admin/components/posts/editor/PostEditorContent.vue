<!-- src/views/admin/components/posts/editor/PostEditorContent.vue -->
<script setup lang="ts">
import PostEditorTitle from "./content/PostEditorTitle.vue";
import PostEditorBody from "./content/PostEditorBody.vue";

/**
 * PostEditorContent — 编辑器内容区域主入口
 *
 * 组合 Title 和 Body 两个子组件。
 * v-model:title           → 文章标题
 * v-model:content         → ProseMirror JSON
 * v-model:contentMarkdown → 纯 Markdown
 * v-model:contentText     → 纯文本（搜索/预览）
 */
const title = defineModel<string>("title", { default: "" });
const content = defineModel<object | undefined>("content");
const contentMarkdown = defineModel<string>("contentMarkdown", { default: "" });
const contentText = defineModel<string>("contentText", { default: "" });
</script>

<template>
  <div class="flex-1 overflow-y-auto bg-bg-muted/10">
    <!-- 内容宽度限制：适宜阅读的最大宽，居中对齐 -->
    <div class="max-w-3xl mx-auto px-8 py-10 flex flex-col gap-4">
      <!-- 标题 -->
      <PostEditorTitle v-model="title" />

      <!-- 分隔线 -->
      <div class="border-b border-border/30" />

      <!-- 正文 -->
      <PostEditorBody
        v-model:json="content"
        v-model:markdown="contentMarkdown"
        v-model:text="contentText"
      />
    </div>
  </div>
</template>

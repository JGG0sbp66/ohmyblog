<!-- src/views/admin/components/posts/editor/content/PostEditorSubtitle.vue -->
<script setup lang="ts">
import { useLang } from "@/composables/lang.hook";

/**
 * PostEditorSubtitle — 文章副标题输入框
 *
 * 与 PostEditorTitle 同为纯展示输入组件，无校验逻辑，由父级决定是否必填。
 * v-model: 副标题字符串。文章级属性，一篇文章至多一条，不属于正文富文本
 */
const { t } = useLang();
const subtitle = defineModel<string>({ default: "" });
</script>

<template>
  <input
    v-model="subtitle"
    type="text"
    :placeholder="t('views.admin.PostEditor.content.subtitle.placeholder')"
    class="w-full bg-transparent outline-none resize-none text-xl font-medium text-fg-muted leading-snug placeholder:text-fg-soft border-none"
  />
</template>

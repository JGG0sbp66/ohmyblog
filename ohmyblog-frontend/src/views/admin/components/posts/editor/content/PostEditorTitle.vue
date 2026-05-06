<!-- src/views/admin/components/posts/editor/content/PostEditorTitle.vue -->
<script setup lang="ts">
import { useLang } from "@/composables/lang.hook";

/**
 * PostEditorTitle — 文章标题输入框
 *
 * 纯展示输入组件，无额外校验逻辑，由父级决定是否 required。
 * v-model: 标题字符串
 */
const { t } = useLang();
const title = defineModel<string>({ default: "" });
</script>

<template>
  <input
    v-model="title"
    type="text"
    :placeholder="t('views.admin.PostEditor.content.title.placeholder')"
    class="w-full bg-transparent outline-none resize-none
           text-3xl font-bold text-fg leading-tight
           placeholder:text-fg-soft
           border-none"
  />
</template>

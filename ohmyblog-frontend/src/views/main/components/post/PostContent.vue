<!-- src/views/main/components/post/PostContent.vue -->
<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import { getContentExtensions } from "@/composables/editor-extensions/content-extensions";

/**
 * PostContent — 前台文章渲染组件（只读 Tiptap 实例）
 *
 * 渲染源：ProseMirror JSON
 *
 * 扩展集合通过 getContentExtensions({ readonly: true }) 与编辑器共用同一份，
 * 避免节点 / 标记 schema 不一致导致 JSON 中的内容被丢弃。
 */

const props = defineProps<{
  contentJson?: object | null;
}>();

const editor = useEditor({
  extensions: getContentExtensions({ readonly: true }),
  content: null,
  editable: false,
});

watch(
  [() => props.contentJson, editor],
  ([json, ed]) => {
    if (!ed) return;
    if (json && Object.keys(json).length > 0) {
      ed.commands.setContent(json as object);
    } else {
      ed.commands.clearContent();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => editor.value?.destroy());
</script>

<template>
  <EditorContent :editor="editor" />
</template>

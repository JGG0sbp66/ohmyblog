<!-- src/views/admin/components/posts/editor/content/PostEditorBody.vue -->
<script setup lang="ts">
import { watch, onBeforeUnmount, ref } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import { useEditorExtensions } from "@/composables/editor-extensions";
import PostEditorBubbleMenu from "./menus/PostEditorBubbleMenu.vue";

/**
 * PostEditorBody — Tiptap 富文本编辑区
 *
 * v-model:json         → ProseMirror JSON（存入 content 字段）
 * v-model:markdown     → 纯 Markdown（存入 contentMarkdown 字段）
 * v-model:text         → 纯文本（存入 contentText 字段，用于搜索/预览）
 *
 * TODO: 后续在此组件内挂载 FloatingMenu（块操作手柄）/ SlashMenu（/ 命令）
 */
const json = defineModel<object | undefined>("json");
const markdown = defineModel<string>("markdown", { default: "" });
const text = defineModel<string>("text", { default: "" });
const containerRef = ref<HTMLElement | null>(null);

const editor = useEditor({
  extensions: useEditorExtensions(),
  content: json.value ?? "",
  editorProps: {
    attributes: {
      // spellcheck 会向下继承，统一在根元素关闭，正文 / 代码块全部生效
      spellcheck: "false",
    },
  },
  onUpdate({ editor }) {
    json.value = editor.getJSON();
    markdown.value = (editor.storage as any).markdown.getMarkdown();
    text.value = editor.getText();
  },
});

/** 外部（如加载文章）更新 json 时同步到编辑器，避免光标跳动 */
watch(
  () => json.value,
  (newVal) => {
    if (!editor.value || !newVal) return;
    const isSame =
      JSON.stringify(editor.value.getJSON()) === JSON.stringify(newVal);
    if (!isSame) {
      editor.value.commands.setContent(newVal, { emitUpdate: false });
    }
  },
);

onBeforeUnmount(() => editor.value?.destroy());
</script>

<template>
  <div class="relative" ref="containerRef">
    <PostEditorBubbleMenu
      v-if="editor"
      :editor="editor"
      :container-ref="containerRef"
    />
    <EditorContent
      :editor="editor"
      class="w-full min-h-[60vh] focus-within:outline-none"
    />
  </div>
</template>

<!-- src/views/admin/components/posts/editor/content/PostEditorBody.vue -->
<script setup lang="ts">
import { watch, onBeforeUnmount } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { useLang } from "@/composables/lang.hook";

/**
 * PostEditorBody — Tiptap 富文本编辑区
 *
 * v-model:json         → ProseMirror JSON（存入 content 字段）
 * v-model:markdown     → 纯 Markdown（存入 contentMarkdown 字段）
 * v-model:text         → 纯文本（存入 contentText 字段，用于搜索/预览）
 *
 * TODO: 后续在此组件内挂载 BubbleMenu / FloatingMenu / SlashMenu
 */
const { t } = useLang();

const json = defineModel<object | undefined>("json");
const markdown = defineModel<string>("markdown", { default: "" });
const text = defineModel<string>("text", { default: "" });

const editor = useEditor({
  extensions: [
    StarterKit,
    Image,
    Placeholder.configure({
      placeholder: t("views.admin.PostEditor.content.body.placeholder"),
    }),
    Markdown.configure({
      html: false,
      transformPastedText: true,
    }),
  ],
  content: json.value ?? "",
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
  <EditorContent
    :editor="editor"
    class="w-full min-h-[60vh] focus-within:outline-none"
  />
</template>

<!-- src/views/admin/components/posts/editor/content/PostEditorBody.vue -->
<script setup lang="ts">
import { watch, onBeforeUnmount, ref } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import type { Editor } from "@tiptap/core";
import { useRoute } from "vue-router";
import { useEditorExtensions } from "@/composables/editor-extensions";
import PostEditorBubbleMenu from "./menus/bubble/PostEditorBubbleMenu.vue";
import PostEditorImageBubbleMenu from "./menus/bubble/PostEditorImageBubbleMenu.vue";
import PostEditorFloatingHandle from "./menus/handle/PostEditorFloatingHandle.vue";
import { uploadPostImage } from "@/api/upload.api";
import { useToast } from "@/composables/toast.hook";
import { useLang } from "@/composables/lang.hook";

/**
 * PostEditorBody — Tiptap 富文本编辑区
 *
 * v-model:json         → ProseMirror JSON（存入 content 字段，唯一真源）
 * v-model:text         → 纯文本（存入 contentText 字段，用于搜索/预览）
 */
const json = defineModel<object | undefined>("json");
const text = defineModel<string>("text", { default: "" });
const containerRef = ref<HTMLElement | null>(null);

const { t } = useLang();
const uuid = useRoute().params.uuid as string;

/**
 * 标记最近一次 model 写入是由编辑器内部 onUpdate 触发的。
 * 编辑器自己 onUpdate → json.value = ... 会让 watch(json) 收到自己刚写出去的值，
 * 若不识别这层"自回声"，watch 会再次 setContent → 重建 NodeView → 光标丢失，
 * 在 codeBlock 内表现为"输入第一个字符后，后续字符跑到代码块外"。
 *
 * watch 触发后立刻把标记复位，下一次外部（父组件加载文章）的 model 写入仍能正常 setContent。
 */
let internalUpdate = false;

/**
 * 把图片文件上传到后端，成功后插入到当前光标位置
 */
const uploadAndInsertImage = (editor: Editor, file: File) => {
  uploadPostImage(uuid, { image: file })
    .then((result) => {
      if (!result?.url) return;
      editor.chain().focus().setImage({ src: result.url }).run();
    })
    .catch((e: unknown) => {
      const msg = typeof e === "string" ? e : (e as any)?.message || "Error";
      useToast.error(t(`api.errors.${msg}`));
    });
};

const editor = useEditor({
  extensions: useEditorExtensions(),
  content: json.value ?? "",
  editorProps: {
    attributes: {
      // spellcheck 会向下继承，统一在根元素关闭，正文 / 代码块全部生效
      spellcheck: "false",
    },
    handlePaste(_view, event) {
      const items = Array.from(event.clipboardData?.items ?? []);
      const imageItems = items.filter((item) => item.type.startsWith("image/"));
      if (imageItems.length === 0) return false;

      event.preventDefault();
      const ed = editor.value;
      if (!ed) return true;
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) uploadAndInsertImage(ed, file);
      }
      return true;
    },
    handleDrop(_view, event) {
      // 从资源管理器 / Finder 拖文件进编辑器：拦截 dataTransfer.files 中的图片，
      // 走和粘贴一致的上传流程。其他类型文件让 ProseMirror 默认行为接管。
      const dt = (event as DragEvent).dataTransfer;
      const files = Array.from(dt?.files ?? []).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (files.length === 0) return false;

      event.preventDefault();
      const ed = editor.value;
      if (!ed) return true;
      for (const file of files) uploadAndInsertImage(ed, file);
      return true;
    },
  },
  onUpdate({ editor }) {
    internalUpdate = true;
    json.value = editor.getJSON();
    text.value = editor.getText();
  },
});

/**
 * 外部（如加载文章）更新 json 时同步到编辑器。
 * 若 internalUpdate 为 true，说明这次是编辑器自己 onUpdate 回写的，跳过 setContent
 * 避免"输入字符 → setContent → NodeView 重建 → 光标 / 后续字符丢失"的回环。
 */
watch(
  () => json.value,
  (newVal) => {
    if (internalUpdate) {
      internalUpdate = false;
      return;
    }
    const ed = editor.value;
    if (!ed || !newVal) return;
    ed.commands.setContent(newVal, { emitUpdate: false });
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
    <PostEditorImageBubbleMenu
      v-if="editor"
      :editor="editor"
      :container-ref="containerRef"
    />
    <PostEditorFloatingHandle v-if="editor" :editor="editor" />
    <EditorContent
      :editor="editor"
      class="w-full min-h-[60vh] focus-within:outline-none"
    />
  </div>
</template>

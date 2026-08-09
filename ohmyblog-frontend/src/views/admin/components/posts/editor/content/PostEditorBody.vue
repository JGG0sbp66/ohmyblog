<!-- src/views/admin/components/posts/editor/content/PostEditorBody.vue -->
<script setup lang="ts">
import { watch, onBeforeUnmount, ref } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import type { Editor } from "@tiptap/core";
import { useRoute } from "vue-router";
import { useEditorExtensions } from "@/composables/editor-extensions";
import { useIsTouchOnly } from "@/composables/pointer.hook";
import PostEditorBubbleMenu from "./menus/bubble/PostEditorBubbleMenu.vue";
import PostEditorImageBubbleMenu from "./menus/bubble/PostEditorImageBubbleMenu.vue";
import PostEditorFloatingHandle from "./menus/handle/PostEditorFloatingHandle.vue";
import PostEditorTableControls from "./menus/table/PostEditorTableControls.vue";
import PostEditorOrderedListMenu from "./menus/ordered-list/PostEditorOrderedListMenu.vue";
import MobileEditorToolbar from "./menus/mobile/MobileEditorToolbar.vue";
import { useImageInsert } from "./composables/use-image-insert";

/**
 * PostEditorBody — Tiptap 富文本编辑区
 *
 * v-model:json              → ProseMirror JSON（存入 content 字段，唯一真源）
 * v-model:text              → 纯文本（存入 contentText 字段，用于搜索/预览）
 * v-model:html              → HTML（存入 contentHtml 字段，用于前台展示/RSS）
 * v-model:totalCharCount    → 全文字符数
 * v-model:selectedCharCount → 当前选区字符数（无选区时为 0）
 */
const json = defineModel<object | undefined>("json");
const text = defineModel<string>("text", { default: "" });
const html = defineModel<string>("html", { default: "" });
const totalCharCount = defineModel<number>("totalCharCount", { default: 0 });
const selectedCharCount = defineModel<number>("selectedCharCount", {
  default: 0,
});
const containerRef = ref<HTMLElement | null>(null);
/**
 * 用「有没有悬停能力」而不是「屏幕多宽」来切换两套菜单：这里要换掉的正是 hover
 * 驱动的浮层，宽度和它没有因果关系（详见 pointer.hook 的注释）。
 */
const isTouchOnly = useIsTouchOnly();

const { uploadAndInsert: uploadAndInsertImage } = useImageInsert();

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
 * 同步字数：总数 + 当前选区。
 * - 总字符数：CharacterCount.characters()
 * - 选区字符数：CharacterCount 不直接提供，用 ProseMirror 的 textBetween 算。
 *   多块选区用 \n 拼接，跟编辑器 getText() 的行为一致。
 */
const syncCharCount = (ed: Editor) => {
  const storage = ed.storage.characterCount;
  totalCharCount.value = storage ? storage.characters() : 0;

  const { from, to, empty } = ed.state.selection;
  selectedCharCount.value = empty
    ? 0
    : ed.state.doc.textBetween(from, to, "\n", "\n").length;
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
    // getHTML 只输出文档结构，列表标记符 / 代码块外壳这类运行时产物不在其中，
    // 由阅读端的 enhance-lists.ts / enhance-code-blocks.ts 重建
    html.value = editor.getHTML();
    syncCharCount(editor);
  },
  onSelectionUpdate({ editor }) {
    syncCharCount(editor);
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
    if (!ed) return;
    // 「外部尚未加载」和「外部主动清空」必须区分，否则后者会被当成前者忽略掉，
    // 编辑器里留着上一篇的正文，而父组件以为已经空了：
    // - undefined / null → 文章还没加载回来（loadPost 前的初始值），保持现状
    // - 空对象 {}        → 调用方明确要求清空，走 clearContent
    if (newVal == null) return;
    if (Object.keys(newVal).length === 0) {
      // emitUpdate = false：与下面的 setContent 一致，避免回写 json 触发自回声。
      // 代价是 onUpdate 不跑，text / html 需要在这里手动跟上——否则正文清空了，
      // 存进库的 contentText / contentHtml 还是上一篇的内容
      ed.commands.clearContent(false);
      text.value = ed.getText();
      html.value = ed.getHTML();
      syncCharCount(ed);
      return;
    }
    ed.commands.setContent(newVal, { emitUpdate: false });
    // 外部 setContent 不会触发 onUpdate，需要主动同步一次字数统计
    syncCharCount(ed);
  },
);

onBeforeUnmount(() => editor.value?.destroy());
</script>

<template>
  <div class="relative" ref="containerRef">
    <!--
      悬停驱动的浮层：三者在纯触屏设备上都是死的，那边整组不挂载（连同它们的
      mousemove / resize 监听和表格几何计算一起省掉），能力平移到
      MobileEditorToolbar。
      - BubbleMenu    : 能弹，但会和系统自带的选择气泡（拷贝/查询）叠在一起抢位置
      - FloatingHandle: 纯 mousemove 驱动，触屏永不触发
      - TableControls : hover 显形 + 8px 宽的把手条，指头够不着
    -->
    <template v-if="editor && !isTouchOnly">
      <PostEditorBubbleMenu :editor="editor" :container-ref="containerRef" />
      <PostEditorFloatingHandle :editor="editor" />
      <PostEditorTableControls :editor="editor" :container-ref="containerRef" />
    </template>

    <!-- 图片气泡菜单是 NodeSelection 驱动的：点一下图片就选中了，触屏同样成立，
         因此两端共用，不做移动端分支 -->
    <PostEditorImageBubbleMenu
      v-if="editor"
      :editor="editor"
      :container-ref="containerRef"
    />
    <PostEditorOrderedListMenu v-if="editor" :editor="editor" />

    <MobileEditorToolbar v-if="editor && isTouchOnly" :editor="editor" />

    <EditorContent
      :editor="editor"
      class="w-full min-h-[60dvh] focus-within:outline-none"
    />
  </div>
</template>

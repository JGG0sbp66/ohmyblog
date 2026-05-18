<!-- src/views/main/components/post/PostContent.vue -->
<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import {
  TextStyle,
  Color,
  CustomHighlight,
} from "@/composables/editor-extensions/color.extension";
import { CustomListItem } from "@/composables/editor-extensions/list-item.extension";
import { CustomOrderedList } from "@/composables/editor-extensions/ordered-list.extension";
import {
  CustomBold,
  CustomItalic,
  CustomStrike,
  CustomUnderline,
  CustomCode,
} from "@/composables/editor-extensions/marks.extension";
import { CustomCodeBlock } from "@/composables/editor-extensions/code-block.extension";
import { Indent } from "@/composables/editor-extensions/indent.extension";
import Image from "@tiptap/extension-image";

/**
 * PostContent — 前台文章渲染组件（只读 Tiptap 实例）
 *
 * 渲染源：ProseMirror JSON
 *
 * 扩展集合需与 PostEditorBody 严格保持一致（除了交互类的 NodeView resize），
 * 否则 JSON 中的节点/标记会被 Tiptap 视为未知而丢弃。
 */

// 纯展示版图片扩展：保留 width 属性渲染，移除 NodeView 与 resize handle
const ReadonlyImage = Image.extend({
  inline: true,
  group: "inline",
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML(attrs) {
          if (!attrs.width) return {};
          return { style: `width: ${attrs.width}px; max-width: 100%;` };
        },
        parseHTML(element) {
          const style = element.style.width;
          if (style?.endsWith("px")) return parseInt(style);
          return null;
        },
      },
    };
  },
});

const props = defineProps<{
  contentJson?: object | null;
}>();

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      listItem: false,
      orderedList: false,
      bold: false,
      italic: false,
      strike: false,
      code: false,
      codeBlock: false,
      link: false,
      underline: false,
    }),
    CustomListItem,
    CustomOrderedList,
    CustomBold,
    CustomItalic,
    CustomStrike,
    CustomUnderline,
    CustomCode,
    CustomCodeBlock,
    TextStyle,
    Color,
    CustomHighlight,
    ReadonlyImage,
    Indent,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Link.configure({
      openOnClick: true,
      HTMLAttributes: {
        rel: "noopener noreferrer",
        target: "_blank",
      },
    }),
  ],
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

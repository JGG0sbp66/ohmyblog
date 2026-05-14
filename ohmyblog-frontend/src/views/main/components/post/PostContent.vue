<!-- src/views/main/components/post/PostContent.vue -->
<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import {
  TextStyle,
  Color,
  CustomHighlight,
} from "@/composables/editor-extensions/color.extension";
import { CustomListItem } from "@/composables/editor-extensions/list-item.extension";
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
  contentMarkdown: string;
}>();

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      listItem: false,
      bold: false,
      italic: false,
      strike: false,
      code: false,
      codeBlock: false,
      link: false,
      underline: false,
    }),
    CustomListItem,
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
    Link.configure({ openOnClick: true }),
    Markdown.configure({ html: false }),
  ],
  content: null,
  editable: false,
});

watch(
  [() => props.contentMarkdown, editor],
  ([markdown, ed]) => {
    if (markdown && ed) {
      ed.commands.setContent(markdown as string);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => editor.value?.destroy());
</script>

<template>
  <EditorContent :editor="editor" />
</template>

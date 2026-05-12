<!-- src/views/admin/components/posts/editor/content/menus/bubble/sections/BubbleFormatSection.vue -->
<script setup lang="ts">
import type { Editor } from "@tiptap/core";
import { Bold, Italic, Strikethrough, Underline, Code } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import IconTipButton from "@/components/common/button/IconTipButton.vue";
import BubbleLinkButton from "./BubbleLinkButton.vue";
import BubbleColorButton from "./BubbleColorButton.vue";

/**
 * BubbleFormatSection — 气泡菜单区域三：行内格式按钮组
 *
 * 包含：粗体 / 斜体 / 删除线 / 下划线 / 行内代码 / 链接
 */
const props = defineProps<{ editor: Editor }>();
const { t } = useLang();
</script>

<template>
  <div class="flex items-center gap-0.5">
    <IconTipButton
      :tooltip="t('views.admin.PostEditor.content.bubbleMenu.bold')"
      :isActive="editor.isActive('bold')"
      @click="editor.chain().focus().toggleBold().run()"
    >
      <Bold class="w-4 h-4" />
    </IconTipButton>

    <IconTipButton
      :tooltip="t('views.admin.PostEditor.content.bubbleMenu.italic')"
      :isActive="editor.isActive('italic')"
      @click="editor.chain().focus().toggleItalic().run()"
    >
      <Italic class="w-4 h-4" />
    </IconTipButton>

    <IconTipButton
      :tooltip="t('views.admin.PostEditor.content.bubbleMenu.strike')"
      :isActive="editor.isActive('strike')"
      @click="editor.chain().focus().toggleStrike().run()"
    >
      <Strikethrough class="w-4 h-4" />
    </IconTipButton>

    <IconTipButton
      :tooltip="t('views.admin.PostEditor.content.bubbleMenu.underline')"
      :isActive="editor.isActive('underline')"
      @click="editor.chain().focus().toggleUnderline().run()"
    >
      <Underline class="w-4 h-4" />
    </IconTipButton>

    <IconTipButton
      :tooltip="t('views.admin.PostEditor.content.bubbleMenu.code')"
      :isActive="editor.isActive('code')"
      @click="editor.chain().focus().toggleCode().run()"
    >
      <Code class="w-4 h-4" />
    </IconTipButton>

    <BubbleLinkButton :editor="editor" />
    <BubbleColorButton :editor="editor" />
  </div>
</template>

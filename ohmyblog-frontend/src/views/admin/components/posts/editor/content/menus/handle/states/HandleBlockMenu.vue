<!-- src/views/admin/components/posts/editor/content/menus/handle/states/HandleBlockMenu.vue -->
<script setup lang="ts">
import type { Editor } from "@tiptap/core";
import IconTipButton from "@/components/common/button/IconTipButton.vue";
import { useBlockCommands } from "../../block-commands";
import HandleTableMenuItem from "./HandleTableMenuItem.vue";

/**
 * HandleBlockMenu — 浮动手柄的块类型选择菜单（横排图标，飞书风格）
 *
 * 从 useBlockCommands 注册表中挑出常用的 8 项；H4-H6 不在 handle 菜单中
 * 露出（手柄场景空间小，少即是多）。
 *
 * tooltip 用 tooltipOf（长文本，含 markdown 快捷键提示）。
 * IconTipButton 内部使用 @mousedown.prevent，不会触发编辑器失焦。
 */
const props = defineProps<{ editor: Editor }>();

const { commands, tooltipOf } = useBlockCommands([
  "paragraph",
  "heading1",
  "heading2",
  "heading3",
  "bulletList",
  "orderedList",
  "taskList",
  "codeBlock",
  "quote",
  "horizontalRule",
]);
</script>

<template>
  <div class="grid grid-cols-4 gap-0.5">
    <IconTipButton
      v-for="cmd in commands"
      :key="cmd.id"
      :tooltip="tooltipOf(cmd)"
      :isActive="cmd.isActive(editor)"
      size="w-8 h-8"
      @click="cmd.run(editor)"
    >
      <component :is="cmd.icon" class="w-4 h-4" />
    </IconTipButton>
    <HandleTableMenuItem :editor="editor" />
  </div>
</template>

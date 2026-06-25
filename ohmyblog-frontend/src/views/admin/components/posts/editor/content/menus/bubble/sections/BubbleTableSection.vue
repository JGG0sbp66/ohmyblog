<!-- src/views/admin/components/posts/editor/content/menus/bubble/sections/BubbleTableSection.vue -->
<script setup lang="ts">
import type { Editor } from "@tiptap/core";
import IconTipButton from "@/components/common/button/IconTipButton.vue";
import { useTableCommands } from "../composables/use-table-commands";

/**
 * BubbleTableSection — 气泡菜单「表格」区域（最左侧，仿飞书精简版）
 *
 * 目前只有「合并 / 拆分单元格」一个开关：跨格选区显示合并，合并格显示拆分。
 * 是否显示由 PostEditorBubbleMenu 用 canMergeOrSplit 把关，故此处直接渲染按钮。
 */
defineProps<{ editor: Editor }>();
const { iconOf, labelOf, run, isMergedCell } = useTableCommands();
</script>

<template>
  <IconTipButton
    :tooltip="labelOf(editor)"
    :is-active="isMergedCell(editor)"
    @click="run(editor)"
  >
    <component :is="iconOf(editor)" class="h-4 w-4" />
  </IconTipButton>
</template>

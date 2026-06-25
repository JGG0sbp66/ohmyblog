<!-- src/views/admin/components/posts/editor/content/menus/bubble/sections/BubbleTableSection.vue -->
<script setup lang="ts">
import type { Editor } from "@tiptap/core";
import IconTipButton from "@/components/common/button/IconTipButton.vue";
import { useTableCommands } from "../composables/use-table-commands";

/**
 * BubbleTableSection — 气泡菜单「表格」区域（最左侧）
 *
 * - 合并 / 拆分单元格：跨格选区可用时显示。
 * - 选中整行 / 整列（点行列把手）时：设为表头 + 删除行/列（删除为红色系）。
 *
 * 区域整体是否出现由 PostEditorBubbleMenu 用 showTableSection 把关。
 */
const props = defineProps<{ editor: Editor }>();
const {
  canMergeOrSplit,
  isMergedCell,
  mergeIconOf,
  mergeLabelOf,
  mergeOrSplit,
  hasLineSelection,
  headerIconOf,
  headerLabel,
  isHeaderActive,
  toggleHeader,
  deleteIconOf,
  deleteLabel,
  deleteLine,
} = useTableCommands();
</script>

<template>
  <!-- 合并 / 拆分单元格 -->
  <IconTipButton
    v-if="canMergeOrSplit(props.editor)"
    :tooltip="mergeLabelOf(props.editor)"
    :is-active="isMergedCell(props.editor)"
    @click="mergeOrSplit(props.editor)"
  >
    <component :is="mergeIconOf(props.editor)" class="h-4 w-4" />
  </IconTipButton>

  <!-- 选中整行/整列：设为表头 + 删除（红） -->
  <template v-if="hasLineSelection(props.editor)">
    <IconTipButton
      :tooltip="headerLabel()"
      :is-active="isHeaderActive(props.editor)"
      @click="toggleHeader(props.editor)"
    >
      <component :is="headerIconOf(props.editor)" class="h-4 w-4" />
    </IconTipButton>

    <IconTipButton
      :tooltip="deleteLabel(props.editor)"
      @click="deleteLine(props.editor)"
    >
      <component
        :is="deleteIconOf(props.editor)"
        class="h-4 w-4 text-red-500"
      />
    </IconTipButton>
  </template>
</template>

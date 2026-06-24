<!-- src/views/admin/components/posts/editor/content/menus/handle/states/HandleTableMenuItem.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { Table } from "lucide-vue-next";
import type { Editor } from "@tiptap/core";
import IconTipButton from "@/components/common/button/IconTipButton.vue";
import DropButton from "@/components/common/button/DropButton.vue";
import { useLang } from "@/composables/lang.hook";
import TableSizePicker from "../../table/TableSizePicker.vue";

/**
 * HandleTableMenuItem — 浮动手柄块菜单中的「表格」项（飞书式）
 *
 * hover Table 图标 → 右侧展开 TableSizePicker 网格，选尺寸后插入。
 * 嵌套在外层块菜单 DropButton 内；因 BasePop 为内联 absolute（非 teleport），
 * 子弹层是外层 DropButton 的 DOM 后代，鼠标移入不会触发外层 mouseleave。
 * 右侧 flush 布局（ml-0）避免穿越空隙导致 hover 中断。
 */
const props = defineProps<{ editor: Editor }>();

const { t } = useLang();
const dropRef = ref<InstanceType<typeof DropButton> | null>(null);

const onSelect = ({ rows, cols }: { rows: number; cols: number }) => {
  props.editor
    .chain()
    .focus()
    .insertTable({ rows, cols, withHeaderRow: true })
    .run();
  dropRef.value?.close();
};
</script>

<template>
  <DropButton
    ref="dropRef"
    trigger-class="w-8 h-8"
    content-class=""
    placement="left-full top-0"
    pop-offset="ml-0"
    bridge-height="h-0"
  >
    <template #trigger="{ active }">
      <IconTipButton
        :tooltip="t('views.admin.PostEditor.content.tablePicker.label')"
        :isActive="active"
        size="w-8 h-8"
      >
        <Table class="w-5 h-5" />
      </IconTipButton>
    </template>
    <template #content>
      <TableSizePicker @select="onSelect" />
    </template>
  </DropButton>
</template>

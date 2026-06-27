<!-- src/views/admin/components/posts/editor/content/menus/handle/states/HandleTableMenuItem.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { ChevronRight } from "lucide-vue-next";
import { RiTableView } from "@remixicon/vue";
import type { Editor } from "@tiptap/core";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import DropButton from "@/components/common/button/DropButton.vue";
import { useLang } from "@/composables/lang.hook";
import { TABLE_ICON_COLOR } from "../../block-commands";
import TableSizePicker from "../../table/TableSizePicker.vue";

/**
 * HandleTableMenuItem — 浮动手柄块菜单中的「表格」项（飞书式 list 行）
 *
 * 作为 CategoryMenu list 行渲染（icon + 文字 + 右侧箭头），hover 行 → 右侧展开
 * TableSizePicker 网格，选尺寸后插入。
 *
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
    .insertTable({ rows, cols, withHeaderRow: false })
    .run();
  dropRef.value?.close();
};
</script>

<template>
  <DropButton
    ref="dropRef"
    trigger-class="w-full"
    content-class=""
    placement="left-full top-0"
    pop-offset="ml-0"
    bridge-height="h-0"
  >
    <template #trigger="{ active }">
      <div class="relative">
        <ButtonSecondary
          :is-active="active"
          class="w-full! justify-start! gap-2.5! px-2.5! py-2!"
          :text="t('views.admin.PostEditor.content.tablePicker.label')"
        >
          <RiTableView :class="['h-4 w-4', TABLE_ICON_COLOR]" />
        </ButtonSecondary>
        <ChevronRight
          class="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-fg"
        />
      </div>
    </template>
    <template #content>
      <TableSizePicker @select="onSelect" />
    </template>
  </DropButton>
</template>

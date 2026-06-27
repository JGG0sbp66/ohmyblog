<!-- src/views/admin/components/posts/editor/content/menus/table/TableBlockHandle.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";
import type { Editor } from "@tiptap/core";
import { GripVertical, Scissors, Copy, Trash2 } from "lucide-vue-next";
import { RiTableView } from "@remixicon/vue";
import DropButton from "@/components/common/button/DropButton.vue";
import ButtonSecondary from "@/components/base/button/ButtonSecondary.vue";
import CategoryMenu from "../category-menu/CategoryMenu.vue";
import type { MenuGroup } from "../category-menu/category-menu.types";
import { TABLE_ICON_COLOR } from "../block-commands";
import { useLang } from "@/composables/lang.hook";
import { useTableBlock } from "./composables/use-table-block";
import { useBlockDrag } from "../handle/composables/use-block-drag";

/**
 * TableBlockHandle — 表格左上角块手柄（仿飞书，结构同 HandleBlockState）
 *
 * 白底圆角卡片内：
 * - [table icon]：DropButton 触发区，hover / 点击展开「剪切 / 复制 / 删除整表」菜单，
 *   仅此图标随菜单 active 高亮。
 * - [六点 grip]：DropButton 之外的独立按钮，draggable 拖拽移动整张表（复用 handle
 *   的 useBlockDrag，把 table 节点打包成 slice 交给 ProseMirror drop 处理）。
 *
 * cellEl 由 PostEditorTableControls 传入（表格左上角首格），作整表操作 / 定位锚点。
 */
const props = defineProps<{ editor: Editor; cellEl: HTMLElement }>();

const { t } = useLang();
const { copyTable, cutTable, deleteTable } = useTableBlock(props.editor);
const dropRef = ref<InstanceType<typeof DropButton> | null>(null);

const run = (fn: (el: HTMLElement) => void) => {
  fn(props.cellEl);
  dropRef.value?.close();
};

/** 菜单分组（数据驱动 CategoryMenu）：剪切/复制 一组，删除整表 单独成组（自动分隔线） */
const menuGroups = computed<MenuGroup[]>(() => [
  {
    key: "clipboard",
    layout: "list",
    items: [
      {
        key: "cut",
        icon: Scissors,
        label: t("views.admin.PostEditor.content.tableMenu.cut"),
        onSelect: () => run(cutTable),
      },
      {
        key: "copy",
        icon: Copy,
        label: t("views.admin.PostEditor.content.tableMenu.copy"),
        onSelect: () => run(copyTable),
      },
    ],
  },
  {
    key: "danger",
    layout: "list",
    items: [
      {
        key: "deleteTable",
        icon: Trash2,
        label: t("views.admin.PostEditor.content.tableMenu.deleteTable"),
        danger: true,
        onSelect: () => run(deleteTable),
      },
    ],
  },
]);

/** 由代表单元格反解出 table 节点的前置位置（NodeSelection 拖拽锚点） */
const resolveTablePos = (): number => {
  const view = props.editor.view;
  const pos = view.posAtDOM(props.cellEl, 0);
  if (pos < 0) return -1;
  const $pos = view.state.doc.resolve(pos);
  for (let d = $pos.depth; d > 0; d--) {
    if ($pos.node(d).type.name === "table") return $pos.before(d);
  }
  return -1;
};

// 复用行 handle 的拖拽打包：table 是顶层 block，NodeSelection + sel.content() 即整表
const drag = useBlockDrag(props.editor, resolveTablePos);
</script>

<template>
  <div
    class="flex items-center gap-0.5 rounded-lg border border-border/30 bg-bg-card px-1 py-0.5 shadow-sm select-none"
  >
    <!-- table icon：仅此处触发菜单 + 高亮 -->
    <DropButton
      ref="dropRef"
      trigger-class=""
      content-class="w-48 p-1.5"
      placement="left-0"
      pop-offset="mt-2"
      bridge-height="h-2"
    >
      <template #trigger="{ active }">
        <ButtonSecondary :is-active="active" class="h-7 w-7 p-0 shrink-0">
          <RiTableView :class="['h-4 w-4', TABLE_ICON_COLOR]" />
        </ButtonSecondary>
      </template>

      <template #content>
        <CategoryMenu :groups="menuGroups" />
      </template>
    </DropButton>

    <!-- 六点 grip：拖拽移动整表（不触发菜单，hover 仅自身高亮） -->
    <ButtonSecondary
      class="h-7 w-5 p-0 shrink-0 cursor-grab"
      draggable="true"
      @dragstart="drag.onDragStart"
      @dragend="drag.onDragEnd"
    >
      <GripVertical class="h-3.5 w-3.5" />
    </ButtonSecondary>
  </div>
</template>

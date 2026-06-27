<!-- src/views/admin/components/posts/editor/content/menus/handle/states/HandleBlockMenu.vue -->
<script setup lang="ts">
import { computed } from "vue";
import type { Editor } from "@tiptap/core";
import { useLang } from "@/composables/lang.hook";
import { HANDLE_MENU_GROUPS } from "../handle-menu-groups";
import { useBlockCommands } from "../../block-commands";
import CategoryMenu from "../../category-menu/CategoryMenu.vue";
import type {
  MenuGroup,
  MenuItem,
} from "../../category-menu/category-menu.types";
import HandleTableMenuItem from "./HandleTableMenuItem.vue";

/**
 * HandleBlockMenu — 浮动手柄的块插入菜单（分组，飞书风格）
 *
 * 分类真源在 handle-menu-groups.ts（基础 / 常用 / 列表），命令文案/图标走 block-commands。
 * 本组件把分组配置映射成 CategoryMenu 的数据：
 * - 「基础」grid（纯 icon，tooltip 提示）；「常用 / 列表」list（icon + 文字）。
 * - 表格项 hasSubmenu + slot="table"，由下方 #table 插槽渲染带尺寸选择器的 HandleTableMenuItem。
 *
 * active 取自 cmd.isActive(editor)：菜单内容由 BasePop 的 v-if 在展开时挂载，
 * 每次展开都是全新求值，故 computed 不存在过期问题。
 */
const props = defineProps<{ editor: Editor }>();

const { t } = useLang();
const { commands, labelOf, tooltipOf } = useBlockCommands();
const byId = new Map(commands.map((c) => [c.id, c] as const));

const menuGroups = computed<MenuGroup[]>(() =>
  HANDLE_MENU_GROUPS.map((group) => ({
    key: group.labelKey,
    title: t(
      `views.admin.PostEditor.content.handleMenu.groups.${group.labelKey}`,
    ),
    layout: group.layout,
    cols: group.cols,
    items: group.entries.flatMap<MenuItem>((entry) => {
      if (entry.type === "table") {
        return [
          {
            key: "table",
            slot: "table",
            label: t("views.admin.PostEditor.content.tablePicker.label"),
          },
        ];
      }
      const cmd = byId.get(entry.id);
      if (!cmd) return [];
      return [
        {
          key: entry.id,
          icon: cmd.icon,
          label: labelOf(cmd),
          tooltip: tooltipOf(cmd),
          active: cmd.isActive(props.editor),
          onSelect: () => cmd.run(props.editor),
        },
      ];
    }),
  })),
);
</script>

<template>
  <CategoryMenu :groups="menuGroups">
    <template #table>
      <HandleTableMenuItem :editor="editor" />
    </template>
  </CategoryMenu>
</template>

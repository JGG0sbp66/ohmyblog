<!-- src/views/admin/components/posts/editor/content/menus/bubble/BubbleBlockSection.vue -->
<script setup lang="ts">
import { computed } from "vue";
import type { Editor } from "@tiptap/core";
import {
  Type, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  List, ListOrdered, Quote, Code2,
} from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import GroupedDropButton from "@/components/common/button/GroupedDropButton.vue";
import type { DropdownItem } from "@/components/common/button/GroupedDropButton.vue";

/**
 * BubbleBlockSection — 气泡菜单区域一：文本块类型切换
 *
 * 显示当前块类型图标，hover 后展开下拉菜单，
 * 支持切换：正文 / H1-H6 / 有序列表 / 无序列表 / 代码块 / 引用
 */
const props = defineProps<{ editor: Editor }>();
const { t } = useLang();

/**
 * 仅切换光标所在列表项的类型，不影响其他项。
 * 原理：先把当前列表项 lift 出列表（变为独立段落），再用 toggle 包回新类型。
 * 若已是目标类型则不操作；若不在列表中则直接 toggle。
 */
const doSwitchListType = (targetType: "bulletList" | "orderedList") => {
  const e = props.editor;
  const { $from } = e.state.selection;
  let currentListType: string | null = null;
  let inListItem = false;

  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === "listItem") inListItem = true;
    if (node.type.name === "bulletList" || node.type.name === "orderedList") {
      currentListType = node.type.name;
      break;
    }
  }

  if (currentListType === targetType) return;

  if (inListItem && currentListType !== null) {
    const chain = e.chain().focus().liftListItem("listItem");
    if (targetType === "bulletList") chain.toggleBulletList().run();
    else chain.toggleOrderedList().run();
    return;
  }

  if (targetType === "bulletList") e.chain().focus().toggleBulletList().run();
  else e.chain().focus().toggleOrderedList().run();
};

const currentIcon = computed(() => {
  const e = props.editor;
  if (e.isActive("heading", { level: 1 })) return Heading1;
  if (e.isActive("heading", { level: 2 })) return Heading2;
  if (e.isActive("heading", { level: 3 })) return Heading3;
  if (e.isActive("heading", { level: 4 })) return Heading4;
  if (e.isActive("heading", { level: 5 })) return Heading5;
  if (e.isActive("heading", { level: 6 })) return Heading6;
  if (e.isActive("bulletList"))  return List;
  if (e.isActive("orderedList")) return ListOrdered;
  if (e.isActive("codeBlock"))   return Code2;
  if (e.isActive("blockquote"))  return Quote;
  return Type;
});

const groups = computed<DropdownItem[][]>(() => {
  const e = props.editor;
  return [
    [
      { label: t("views.admin.PostEditor.content.bubbleMenu.paragraph"), icon: Type,     active: e.isActive("paragraph"),             action: () => e.chain().focus().setParagraph().run() },
      { label: "H1", icon: Heading1, active: e.isActive("heading", { level: 1 }), action: () => e.chain().focus().toggleHeading({ level: 1 }).run() },
      { label: "H2", icon: Heading2, active: e.isActive("heading", { level: 2 }), action: () => e.chain().focus().toggleHeading({ level: 2 }).run() },
      { label: "H3", icon: Heading3, active: e.isActive("heading", { level: 3 }), action: () => e.chain().focus().toggleHeading({ level: 3 }).run() },
      { label: "H4", icon: Heading4, active: e.isActive("heading", { level: 4 }), action: () => e.chain().focus().toggleHeading({ level: 4 }).run() },
      { label: "H5", icon: Heading5, active: e.isActive("heading", { level: 5 }), action: () => e.chain().focus().toggleHeading({ level: 5 }).run() },
      { label: "H6", icon: Heading6, active: e.isActive("heading", { level: 6 }), action: () => e.chain().focus().toggleHeading({ level: 6 }).run() },
    ],
    [
      { label: t("views.admin.PostEditor.content.bubbleMenu.orderedList"), icon: ListOrdered, active: e.isActive("orderedList"), action: () => doSwitchListType("orderedList") },
      { label: t("views.admin.PostEditor.content.bubbleMenu.bulletList"),  icon: List,        active: e.isActive("bulletList"),  action: () => doSwitchListType("bulletList") },
      { label: t("views.admin.PostEditor.content.bubbleMenu.codeBlock"),   icon: Code2,       active: e.isActive("codeBlock"),   action: () => e.chain().focus().toggleCodeBlock().run() },
      { label: t("views.admin.PostEditor.content.bubbleMenu.quote"),       icon: Quote,       active: e.isActive("blockquote"),  action: () => e.chain().focus().toggleBlockquote().run() },
    ],
  ];
});
</script>

<template>
  <GroupedDropButton :icon="currentIcon" :groups="groups" />
</template>

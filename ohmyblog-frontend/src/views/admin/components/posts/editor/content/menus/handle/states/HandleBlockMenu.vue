<!-- src/views/admin/components/posts/editor/content/menus/handle/states/HandleBlockMenu.vue -->
<script setup lang="ts">
import type { Editor } from "@tiptap/core";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code2,
  Quote,
} from "lucide-vue-next";
import IconTipButton from "@/components/common/button/IconTipButton.vue";
import { useLang } from "@/composables/lang.hook";

/**
 * HandleBlockMenu — 浮动手柄的块类型选择菜单（横排图标，飞书风格）
 *
 * 供 HandleEmptyState 和 HandleBlockState 共用。
 * IconTipButton 内部使用 @mousedown.prevent，不会触发编辑器失焦。
 */
const props = defineProps<{ editor: Editor }>();
const { t } = useLang();

/**
 * 仅切换光标所在列表项的类型，不影响其他项。
 * 复用 BubbleBlockSection 的相同逻辑。
 */
const doSwitchListType = (targetType: "bulletList" | "orderedList") => {
  const { $from } = props.editor.state.selection;
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
    const chain = props.editor.chain().focus().liftListItem("listItem");
    if (targetType === "bulletList") chain.toggleBulletList().run();
    else chain.toggleOrderedList().run();
    return;
  }
  if (targetType === "bulletList")
    props.editor.chain().focus().toggleBulletList().run();
  else props.editor.chain().focus().toggleOrderedList().run();
};

const items = [
  {
    label: t("views.admin.PostEditor.content.handleMenu.paragraph"),
    icon: Type,
    isActive: () => props.editor.isActive("paragraph"),
    action: () => props.editor.chain().focus().setParagraph().run(),
  },
  {
    label: t("views.admin.PostEditor.content.handleMenu.heading1"),
    icon: Heading1,
    isActive: () => props.editor.isActive("heading", { level: 1 }),
    action: () =>
      props.editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: t("views.admin.PostEditor.content.handleMenu.heading2"),
    icon: Heading2,
    isActive: () => props.editor.isActive("heading", { level: 2 }),
    action: () =>
      props.editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: t("views.admin.PostEditor.content.handleMenu.heading3"),
    icon: Heading3,
    isActive: () => props.editor.isActive("heading", { level: 3 }),
    action: () =>
      props.editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: t("views.admin.PostEditor.content.handleMenu.bulletList"),
    icon: List,
    isActive: () => props.editor.isActive("bulletList"),
    action: () => doSwitchListType("bulletList"),
  },
  {
    label: t("views.admin.PostEditor.content.handleMenu.orderedList"),
    icon: ListOrdered,
    isActive: () => props.editor.isActive("orderedList"),
    action: () => doSwitchListType("orderedList"),
  },
  {
    label: t("views.admin.PostEditor.content.handleMenu.codeBlock"),
    icon: Code2,
    isActive: () => props.editor.isActive("codeBlock"),
    action: () => props.editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: t("views.admin.PostEditor.content.handleMenu.quote"),
    icon: Quote,
    isActive: () => props.editor.isActive("blockquote"),
    action: () => props.editor.chain().focus().toggleBlockquote().run(),
  },
];
</script>

<template>
  <div class="grid grid-cols-4 gap-0.5">
    <IconTipButton
      v-for="item in items"
      :key="item.label"
      :tooltip="item.label"
      :isActive="item.isActive()"
      size="w-8 h-8"
      @click="item.action()"
    >
      <component :is="item.icon" class="w-4 h-4" />
    </IconTipButton>
  </div>
</template>

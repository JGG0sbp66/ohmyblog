// src/views/admin/components/posts/editor/content/menus/handle/block-icon.ts
import type { Component } from "vue";
import type { Node, ResolvedPos } from "@tiptap/pm/model";
import {
  Type,
  Image,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  ListChecks,
  Code2,
  Quote,
} from "lucide-vue-next";
import { BLOCK_COMMANDS, IMAGE_ICON_COLOR } from "../../block-commands";

const HEADING_ICONS = [
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
];

/**
 * 块图标信息：图标组件 + 语义色（Tailwind text-* 类，含 dark: 变体）
 * 颜色与菜单（block-commands）保持同一真源，hover 手柄与菜单配色一致。
 */
export interface BlockIconInfo {
  icon: Component;
  color: string;
}

/**
 * 语义色查表 —— 以 block-commands 注册表为单一真源，按命令 id 取色。
 * handle 的图标集合与菜单不完全相同（这里用 lucide 的 List/Quote 等），
 * 但配色须一致，故颜色统一从 block-commands 派生，避免散落硬编码。
 */
const COLOR_BY_ID = new Map(
  BLOCK_COMMANDS.map((c) => [c.id, c.color] as const),
);

const PARAGRAPH_COLOR = COLOR_BY_ID.get("paragraph") ?? "";
const HEADING_COLOR = COLOR_BY_ID.get("heading1") ?? "";
const BULLET_LIST_COLOR = COLOR_BY_ID.get("bulletList") ?? "";
const ORDERED_LIST_COLOR = COLOR_BY_ID.get("orderedList") ?? "";
const TASK_LIST_COLOR = COLOR_BY_ID.get("taskList") ?? "";
const CODE_BLOCK_COLOR = COLOR_BY_ID.get("codeBlock") ?? "";
const QUOTE_COLOR = COLOR_BY_ID.get("quote") ?? "";

/** 节点类型 → 默认图标 + 颜色（不考虑列表父级 / 内容 leaf） */
const baseIconOf = (node: Node): BlockIconInfo => {
  const name = node.type.name;
  if (name === "heading") {
    const level = node.attrs.level as number;
    return {
      icon: HEADING_ICONS[level - 1] ?? Type,
      // 标题各级共用同一档蓝色（与菜单一致）
      color: HEADING_COLOR,
    };
  }
  if (name === "bulletList") return { icon: List, color: BULLET_LIST_COLOR };
  if (name === "orderedList")
    return { icon: ListOrdered, color: ORDERED_LIST_COLOR };
  if (name === "taskList") return { icon: ListChecks, color: TASK_LIST_COLOR };
  if (name === "codeBlock") return { icon: Code2, color: CODE_BLOCK_COLOR };
  if (name === "blockquote") return { icon: Quote, color: QUOTE_COLOR };
  if (name === "image") return { icon: Image, color: IMAGE_ICON_COLOR };
  return { icon: Type, color: PARAGRAPH_COLOR };
};

/** 段落内是否含图片 leaf 节点 */
const paragraphContainsImage = (paragraph: Node): boolean => {
  let found = false;
  paragraph.descendants((n) => {
    if (n.type.name === "image") {
      found = true;
      return false;
    }
    return undefined;
  });
  return found;
};

/** 段落所在的最近列表父类型，无则 null */
const enclosingListType = (
  $pos: ResolvedPos,
  paragraphDepth: number,
): "bulletList" | "orderedList" | "taskList" | null => {
  for (let d = paragraphDepth - 1; d >= 1; d--) {
    const ancestor = $pos.node(d);
    // listItem -> 父级 bulletList / orderedList
    if (ancestor.type.name === "listItem") {
      const parent = $pos.node(d - 1);
      if (parent.type.name === "bulletList") return "bulletList";
      if (parent.type.name === "orderedList") return "orderedList";
    }
    // taskItem -> 父级 taskList
    if (ancestor.type.name === "taskItem") {
      return "taskList";
    }
  }
  return null;
};

/**
 * 决策块图标 + 颜色 —— 在基础类型映射之上叠加上下文：
 * - 段落内含图片 → Image
 * - 段落位于列表项内 → 显示列表类型而非 Type
 *
 * 优先级：列表父级 > 含图片 > 节点自身类型
 * 列表优先因为"列表里的图片段落"概念上还是列表项；图片只是其内容
 *
 * 颜色与图标一一对应，统一从 block-commands 派生（单一真源）。
 */
export const decideBlockIcon = (
  blockNode: Node,
  $pos: ResolvedPos,
  blockDepth: number,
): BlockIconInfo => {
  if (blockNode.type.name !== "paragraph") return baseIconOf(blockNode);

  const listType = enclosingListType($pos, blockDepth);
  if (listType === "bulletList")
    return { icon: List, color: BULLET_LIST_COLOR };
  if (listType === "orderedList")
    return { icon: ListOrdered, color: ORDERED_LIST_COLOR };
  if (listType === "taskList")
    return { icon: ListChecks, color: TASK_LIST_COLOR };

  if (paragraphContainsImage(blockNode))
    return { icon: Image, color: IMAGE_ICON_COLOR };

  return { icon: Type, color: PARAGRAPH_COLOR };
};

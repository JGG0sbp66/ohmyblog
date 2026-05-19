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
  Code2,
  Quote,
} from "lucide-vue-next";

const HEADING_ICONS = [
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
];

/** 节点类型 → 默认图标（不考虑列表父级 / 内容 leaf） */
const baseIconOf = (node: Node): Component => {
  const name = node.type.name;
  if (name === "heading") {
    return HEADING_ICONS[(node.attrs.level as number) - 1] ?? Type;
  }
  if (name === "bulletList") return List;
  if (name === "orderedList") return ListOrdered;
  if (name === "codeBlock") return Code2;
  if (name === "blockquote") return Quote;
  if (name === "image") return Image;
  return Type;
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
): "bulletList" | "orderedList" | null => {
  for (let d = paragraphDepth - 1; d >= 1; d--) {
    const ancestor = $pos.node(d);
    if (ancestor.type.name === "listItem") {
      const parent = $pos.node(d - 1);
      if (parent.type.name === "bulletList") return "bulletList";
      if (parent.type.name === "orderedList") return "orderedList";
    }
  }
  return null;
};

/**
 * 决策块图标 —— 在基础类型映射之上叠加上下文：
 * - 段落内含图片 → Image
 * - 段落位于列表项内 → 显示列表类型而非 Type
 *
 * 优先级：列表父级 > 含图片 > 节点自身类型
 * 列表优先因为"列表里的图片段落"概念上还是列表项；图片只是其内容
 */
export const decideBlockIcon = (
  blockNode: Node,
  $pos: ResolvedPos,
  blockDepth: number,
): Component => {
  if (blockNode.type.name !== "paragraph") return baseIconOf(blockNode);

  const listType = enclosingListType($pos, blockDepth);
  if (listType === "bulletList") return List;
  if (listType === "orderedList") return ListOrdered;

  if (paragraphContainsImage(blockNode)) return Image;

  return Type;
};

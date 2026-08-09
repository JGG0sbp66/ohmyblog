// src/views/admin/components/posts/editor/content/menus/editor-capabilities.ts
import type { Editor } from "@tiptap/core";

/**
 * 「当前选区能不能用某类命令」的判定（单一真源）
 *
 * 解决的是「摆出去却没用」的按钮：codeBlock 之类的节点在 schema 里不接受任何 mark，
 * 光标落进去时粗体 / 斜体 / 链接点了毫无反应。与其让用户去试，不如整段藏掉。
 *
 * 同时被气泡菜单（桌面）和键盘工具条（移动端）消费，所以放在 menus/ 根下、
 * 保持纯函数、不依赖任何 Vue 上下文 —— 后者是纯模块，import 不了 composable。
 */

const TEXT_FORMAT_MARKS = [
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
] as const;

const INLINE_MARKS = [
  ...TEXT_FORMAT_MARKS,
  "link",
  "textStyle",
  "highlight",
] as const;

/** 当前选区是否至少包含一个允许指定 mark 的文本块。 */
export function selectionAllowsMark(editor: Editor, markName: string) {
  const markType = editor.schema.marks[markName];
  if (!markType) return false;

  const { selection, doc } = editor.state;
  if (selection.empty || selection.$from.sameParent(selection.$to)) {
    return selection.$from.parent.type.allowsMarkType(markType);
  }

  let allowed = false;
  doc.nodesBetween(selection.from, selection.to, (node) => {
    if (!node.isTextblock || !node.type.allowsMarkType(markType)) return;
    allowed = true;
    return false;
  });
  return allowed;
}

/** 粗体、斜体等文本格式在当前选区是否有实际作用。 */
export function canUseTextFormatting(editor: Editor) {
  return TEXT_FORMAT_MARKS.some((mark) => selectionAllowsMark(editor, mark));
}

/** 粗体、链接、颜色等行内格式在当前选区是否有实际作用。 */
export function canUseInlineFormatting(editor: Editor) {
  return INLINE_MARKS.some((mark) => selectionAllowsMark(editor, mark));
}

/** 对齐和缩进区域在当前选区是否至少有一个可执行命令。 */
export function canUseAlignment(editor: Editor) {
  return (
    editor.can().setTextAlign("left") ||
    editor.can().indent() ||
    editor.can().outdent()
  );
}

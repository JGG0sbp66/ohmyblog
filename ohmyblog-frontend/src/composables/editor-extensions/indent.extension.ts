// src/composables/editor-extensions/indent.extension.ts
import { Extension } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";

const INDENT_STEP = 2; // 步长 2em，符合中文首行缩进 2 字符的习惯
const INDENT_MAX = 8;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

/**
 * Indent Extension — 段落 / 标题的中文首行缩进
 * 行为
 * - Tab        : 加一级首行缩进（永远 return true，避免 Tab 跳出编辑器）
 * - Shift-Tab  : 减一级
 * - Backspace  : 行首且本块有缩进 → 先减缩进；没缩进让默认行为继续
 * - Enter      : 段落/标题缩进态下回车，新块 indent 自动清零（不继承）
 */

/** 判断 ResolvedPos 是否处于 listItem 内 */
const isInsideListItemPos = (
  $pos: import("@tiptap/pm/model").ResolvedPos,
): boolean => {
  for (let d = $pos.depth; d > 0; d--) {
    if ($pos.node(d).type.name === "listItem") return true;
  }
  return false;
};

/** 给定文档某位置，判断是否处于 listItem 内 */
const isInsideListItem = (doc: Node, pos: number): boolean => {
  return isInsideListItemPos(doc.resolve(pos));
};

export const Indent = Extension.create({
  name: "indent",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => {
              const ti = el.style.textIndent;
              if (!ti?.endsWith("em")) return 0;
              return Math.max(0, Math.round(parseFloat(ti) / INDENT_STEP));
            },
            renderHTML: (attrs) => {
              if (!attrs.indent) return {};
              return {
                style: `text-indent: ${attrs.indent * INDENT_STEP}em`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (
              node.type.name !== "paragraph" &&
              node.type.name !== "heading"
            ) {
              return;
            }
            // 列表项内的段落不允许首行缩进（视觉与列表标记符冲突）
            if (isInsideListItem(state.doc, pos)) return;
            const cur = node.attrs.indent ?? 0;
            if (cur < INDENT_MAX) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: cur + 1,
              });
              changed = true;
            }
          });
          if (dispatch && changed) dispatch(tr);
          return changed;
        },

      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (
              node.type.name !== "paragraph" &&
              node.type.name !== "heading"
            ) {
              return;
            }
            const cur = node.attrs.indent ?? 0;
            if (cur > 0) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: cur - 1,
              });
              changed = true;
            }
          });
          if (dispatch && changed) dispatch(tr);
          return changed;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Tab / Shift-Tab：段落 / 标题里消费按键避免 Tab 跳焦；
      // 列表项内 return false 让 CustomListItem 的 sinkListItem / liftListItem 接管
      Tab: () => {
        const { $from } = this.editor.state.selection;
        if (isInsideListItemPos($from)) return false;
        this.editor.commands.indent();
        return true;
      },
      "Shift-Tab": () => {
        const { $from } = this.editor.state.selection;
        if (isInsideListItemPos($from)) return false;
        this.editor.commands.outdent();
        return true;
      },

      // 行首退格：当前段落/标题有缩进 → 减一级缩进（不删字符）。
      // Word 风格 —— 用户视觉感知"先取消缩进，再取消段落"两步动作。
      Backspace: () => {
        const { $from, empty } = this.editor.state.selection;
        if (!empty) return false;
        if ($from.parentOffset !== 0) return false;
        const node = $from.parent;
        if (node.type.name !== "paragraph" && node.type.name !== "heading") {
          return false;
        }
        if (!node.attrs.indent) return false;
        return this.editor.commands.outdent();
      },

      // 段落 / 标题缩进态下回车：默认 splitBlock 后清掉新块的 indent
      // 让新段落从无缩进开始，符合"上一段是引用 / 总起，下一段是新内容"的直觉
      Enter: () => {
        const { $from, empty } = this.editor.state.selection;
        if (!empty) return false;
        const node = $from.parent;
        if (node.type.name !== "paragraph" && node.type.name !== "heading") {
          return false;
        }
        if (!node.attrs.indent) return false; // 没缩进让默认 Enter 行为继续

        return this.editor
          .chain()
          .splitBlock()
          .command(({ tr, state }) => {
            const { $from: $newFrom } = state.selection;
            const newNode = $newFrom.parent;
            if (newNode.attrs.indent) {
              tr.setNodeMarkup($newFrom.before(), undefined, {
                ...newNode.attrs,
                indent: 0,
              });
            }
            return true;
          })
          .run();
      },
    };
  },
});

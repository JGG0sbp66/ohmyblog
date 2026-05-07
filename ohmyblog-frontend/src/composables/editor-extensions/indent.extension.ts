// src/composables/editor-extensions/indent.extension.ts
import { Extension } from "@tiptap/core";

const INDENT_STEP = 2; // 每次缩进的步长 (rem)
const INDENT_MAX = 8; // 最大缩进层级

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

/**
 * Indent Extension — 自定义缩进扩展
 * 支持对段落和标题进行左边距缩进
 */
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
              const ml = el.style.marginLeft;
              return ml
                ? Math.max(0, Math.round(parseFloat(ml) / INDENT_STEP))
                : 0;
            },
            renderHTML: (attrs) => {
              if (!attrs.indent) return {};
              return { style: `margin-left: ${attrs.indent * INDENT_STEP}rem` };
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
              node.type.name === "paragraph" ||
              node.type.name === "heading"
            ) {
              const cur = node.attrs.indent ?? 0;
              if (cur < INDENT_MAX) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: cur + 1,
                });
                changed = true;
              }
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
              node.type.name === "paragraph" ||
              node.type.name === "heading"
            ) {
              const cur = node.attrs.indent ?? 0;
              if (cur > 0) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: cur - 1,
                });
                changed = true;
              }
            }
          });
          if (dispatch && changed) dispatch(tr);
          return changed;
        },
    };
  },
});

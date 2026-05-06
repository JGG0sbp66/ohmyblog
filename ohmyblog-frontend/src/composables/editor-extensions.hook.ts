// src/composables/editor-extensions.hook.ts
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import ListItem from "@tiptap/extension-list-item";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { useLang } from "@/composables/lang.hook";

const INDENT_STEP = 2;   // rem per level
const INDENT_MAX  = 8;   // max level

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent:  () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

const Indent = Extension.create({
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
              return ml ? Math.max(0, Math.round(parseFloat(ml) / INDENT_STEP)) : 0;
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
            if (node.type.name === "paragraph" || node.type.name === "heading") {
              const cur = node.attrs.indent ?? 0;
              if (cur < INDENT_MAX) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: cur + 1 });
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
            if (node.type.name === "paragraph" || node.type.name === "heading") {
              const cur = node.attrs.indent ?? 0;
              if (cur > 0) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: cur - 1 });
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

/**
 * CustomListItem — 扩展 ListItem，支持列表项内包含标题节点
 *
 * - content 扩展为 "(paragraph | heading) block*"
 * - Enter：若在标题列表项内换行，延续相同标题级别；否则走默认 splitListItem
 * - Tab / Shift-Tab：保留原缩进/取消缩进快捷键
 */
const CustomListItem = ListItem.extend({
  content: "(paragraph | heading) block*",

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { $from } = this.editor.state.selection;
        let headingLevel: number | null = null;
        let headingIsEmpty = false;
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === "heading") {
            headingLevel = node.attrs.level as number;
            headingIsEmpty = node.textContent === "";
          }
          if (node.type.name === this.name) break;
        }
        // 空标题列表项：直接 lift 出列表并转为正文，不产生多余空行
        if (headingLevel !== null && headingIsEmpty) {
          return this.editor.chain().liftListItem(this.name).setParagraph().run();
        }
        // 非空标题列表项：换行后延续相同标题级别
        if (headingLevel !== null) {
          return this.editor
            .chain()
            .splitListItem(this.name)
            .setHeading({ level: headingLevel as 1 | 2 | 3 | 4 | 5 | 6 })
            .run();
        }
        // 普通段落列表项：走默认 splitListItem（含空行退出逻辑）
        return this.editor.commands.splitListItem(this.name);
      },
      Backspace: () => {
        const { $from, empty } = this.editor.state.selection;
        if (!empty) return false;
        let headingIsEmpty = false;
        let insideListItem = false;
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === "heading") {
            headingIsEmpty = node.textContent === "" && $from.parentOffset === 0;
          }
          if (node.type.name === this.name) {
            insideListItem = true;
            break;
          }
        }
        // 空标题列表项行首退格：退出列表并转为正文，一步到位
        if (insideListItem && headingIsEmpty) {
          return this.editor.chain().liftListItem(this.name).setParagraph().run();
        }
        return false;
      },
      Tab: () => this.editor.commands.sinkListItem(this.name),
      "Shift-Tab": () => this.editor.commands.liftListItem(this.name),
    };
  },
});

/**
 * useEditorExtensions — 返回 Tiptap 编辑器扩展数组
 *
 * 集中管理所有扩展配置，PostEditorBody 直接调用即可。
 */
export function useEditorExtensions() {
  const { t } = useLang();

  return [
    StarterKit.configure({ listItem: false }),
    CustomListItem,
    Image,
    Indent,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Underline,
    Link.configure({ openOnClick: false }),
    Placeholder.configure({
      placeholder: t("views.admin.PostEditor.content.body.placeholder"),
    }),
    Markdown.configure({
      html: false,
      transformPastedText: true,
    }),
  ];
}

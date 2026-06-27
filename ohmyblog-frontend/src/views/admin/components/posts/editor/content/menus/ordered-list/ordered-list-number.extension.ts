// src/views/admin/components/posts/editor/content/menus/ordered-list/ordered-list-number.extension.ts
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { useLang } from "@/composables/lang.hook";

/**
 * OrderedListNumber — 把有序列表序号渲染成「真实可交互元素」（仅编辑态，仿飞书）
 *
 * 现状：序号由 lists.css 的 `::before` + CSS 计数器自绘，是伪元素、无法 hover/点击。
 * 本扩展用 widget decoration 在每个有序列表项行首插入真实 <span.ol-number>，并：
 * - onCreate 给编辑器根加 `.ol-interactive` 类 → CSS 据此隐藏 ol 的 ::before 计数器，
 *   只读前台（PostContent）不加载本扩展、无此类，仍用计数器，前后台互不影响。
 * - 数字按 start + 项序计算；嵌套层级决定样式（decimal / lower-alpha / lower-roman），
 *   与 lists.css 的 data-ol-mod 循环一致。decorations 每次状态变化重算，编号自洽。
 * - span 携带 data-ol-list-pos（所属 orderedList 文档位置），点击交互由 Vue 浮层
 *   PostEditorOrderedListMenu 通过事件委托接管（弹「编号」菜单）。
 */

const toAlpha = (num: number): string => {
  let s = "";
  let n = num;
  while (n > 0) {
    n--;
    s = String.fromCharCode(97 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s || "a";
};

const ROMAN: [number, string][] = [
  [1000, "m"],
  [900, "cm"],
  [500, "d"],
  [400, "cd"],
  [100, "c"],
  [90, "xc"],
  [50, "l"],
  [40, "xl"],
  [10, "x"],
  [9, "ix"],
  [5, "v"],
  [4, "iv"],
  [1, "i"],
];
const toRoman = (num: number): string => {
  if (num <= 0) return String(num);
  let n = num;
  let s = "";
  for (const [v, sym] of ROMAN) while (n >= v) ((s += sym), (n -= v));
  return s;
};

/** 按嵌套层级样式（0 decimal / 1 lower-alpha / 2 lower-roman）格式化序号 + "." */
const formatNumber = (n: number, styleIndex: number): string => {
  if (styleIndex === 1) return `${toAlpha(n)}.`;
  if (styleIndex === 2) return `${toRoman(n)}.`;
  return `${n}.`;
};

const pluginKey = new PluginKey("orderedListNumber");

export const OrderedListNumber = Extension.create({
  name: "orderedListNumber",

  onCreate() {
    // 标记编辑器根：CSS 据此隐藏 ol 的 ::before 计数器（只读前台无此类）
    this.editor.view.dom.classList.add("ol-interactive");
  },

  onDestroy() {
    this.editor.view.dom.classList.remove("ol-interactive");
  },

  addProseMirrorPlugins() {
    const { t } = useLang();
    const tooltip = t("views.admin.PostEditor.content.orderedListMenu.tooltip");

    return [
      new Plugin({
        key: pluginKey,
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (node.type.name !== "orderedList") return;

              // 嵌套层级：统计祖先里的 orderedList 数量 → 决定样式循环
              const $pos = state.doc.resolve(pos);
              let olAncestors = 0;
              for (let d = 1; d <= $pos.depth; d++) {
                if ($pos.node(d).type.name === "orderedList") olAncestors++;
              }
              const styleIndex = olAncestors % 3;
              const start = (node.attrs.start as number) ?? 1;

              node.forEach((li, offset, index) => {
                // widget 要落在 li 首个子块（段落/标题）的「内联内容起点」：
                // pos+1=ol 内容起点；+offset=li 前位；+1=li 内容起点(子块前位)；+1=子块内联内容起点。
                // 少一层会落到块级边界 → widget 自成一行、把文字挤到下一行。
                const widgetPos = pos + 1 + offset + 2;
                const text = formatNumber(start + index, styleIndex);
                decorations.push(
                  Decoration.widget(
                    widgetPos,
                    () => {
                      const span = document.createElement("span");
                      span.className = "ol-number";
                      span.textContent = text;
                      span.contentEditable = "false";
                      span.setAttribute("data-ol-list-pos", String(pos));
                      span.setAttribute("data-ol-index", String(index));
                      span.setAttribute("data-tooltip", tooltip);
                      return span;
                    },
                    { side: -1, marks: [] },
                  ),
                );
              });
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

// src/composables/editor-extensions/select-all.extension.ts
import { Extension } from "@tiptap/core";
import {
  AllSelection,
  TextSelection,
  Plugin,
  PluginKey,
  type Selection,
} from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * 是否为「整块选区」：整篇全选（AllSelection）或跨块的文本选区。
 * 此状态下用整块背景装饰替代原生 ::selection，得到飞书式整块高亮。
 */
const isFullBlockSelect = (selection: Selection): boolean => {
  if (selection instanceof AllSelection) return true;
  if (selection instanceof TextSelection) {
    return !selection.$from.sameParent(selection.$to);
  }
  return false;
};

/**
 * SmartSelectAll — Ctrl/Cmd+A 渐进式选择
 *
 * 行为
 * - 代码块内：
 *     第一次 → 选中整个代码块文本
 *     已全选代码块再按 → 扩到整篇文档
 * - 普通文本（段落 / 标题 / 列表项内段落 等）：
 *     第一次 → 选中当前文本块（"一段" / "一行"）
 *     已全选当前块再按 → 扩到整篇
 * - 选区跨越多个块（包括空块）→ 直接整篇
 *
 * 直觉来自 Notion / VS Code / Word —— 避免一次 Ctrl+A 直接覆盖整篇内容。
 */
export const SmartSelectAll = Extension.create({
  name: "smartSelectAll",

  addKeyboardShortcuts() {
    return {
      "Mod-a": () => {
        const { state, view } = this.editor;
        const { selection, doc } = state;
        const { $from, $to } = selection;

        // 已经是 AllSelection（整篇）→ 不再扩张，吃掉按键避免默认行为再插一脚
        if (selection instanceof AllSelection) return true;

        // ── 1. 是否处于 codeBlock 内部？ ──
        let codeBlockDepth = -1;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === "codeBlock") {
            codeBlockDepth = d;
            break;
          }
        }

        if (codeBlockDepth >= 0) {
          const start = $from.start(codeBlockDepth);
          const end = $from.end(codeBlockDepth);

          // 已全选该代码块 → 扩到整篇
          if (selection.from === start && selection.to === end) {
            view.dispatch(state.tr.setSelection(new AllSelection(doc)));
            return true;
          }
          view.dispatch(
            state.tr.setSelection(TextSelection.create(doc, start, end)),
          );
          return true;
        }

        // ── 2. 选区跨越多个块 → 整篇 ──
        if (!$from.sameParent($to)) {
          view.dispatch(state.tr.setSelection(new AllSelection(doc)));
          return true;
        }

        // ── 3. 当前文本块（段落 / 标题 / 列表项内段落 等） ──
        const blockStart = $from.start($from.depth);
        const blockEnd = $from.end($from.depth);

        // 当前块为空（空段落 / 空标题）：单按一次没视觉反馈，直接整篇
        if (blockStart === blockEnd) {
          view.dispatch(state.tr.setSelection(new AllSelection(doc)));
          return true;
        }

        // 已全选当前块 → 扩到整篇
        if (selection.from === blockStart && selection.to === blockEnd) {
          view.dispatch(state.tr.setSelection(new AllSelection(doc)));
          return true;
        }

        // 默认：选中当前块
        view.dispatch(
          state.tr.setSelection(
            TextSelection.create(doc, blockStart, blockEnd),
          ),
        );
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("smartSelectAllDeco"),
        props: {
          // 整块选区激活时给 .tiptap 加 class，让原生 ::selection 让位
          attributes(state): Record<string, string> {
            return isFullBlockSelect(state.selection)
              ? { class: "pm-select-all" }
              : {};
          },
          // 给完整被选中的块 / 单元格铺满背景（含空段落、表格空格）
          decorations(state) {
            const sel = state.selection;
            if (!isFullBlockSelect(sel)) return null;

            const { from, to } = sel;
            const decos: Decoration[] = [];
            state.doc.nodesBetween(from, to, (node, pos) => {
              const inside = pos >= from && pos + node.nodeSize <= to;
              if (!inside) return undefined; // 部分覆盖：继续下钻找完整子块
              const name = node.type.name;
              // 表格单元格：整格填充，且不再下钻到内部段落（避免双层叠色变深）
              if (name === "tableCell" || name === "tableHeader") {
                decos.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: "pm-block-selected",
                  }),
                );
                return false;
              }
              // 文本块（段落 / 标题 / 代码块）：整行铺满
              if (node.isTextblock) {
                decos.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: "pm-block-selected",
                  }),
                );
                return false;
              }
              return undefined; // 容器（list / table / blockquote 等）继续下钻
            });
            return DecorationSet.create(state.doc, decos);
          },
        },
      }),
    ];
  },
});

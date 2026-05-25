// src/composables/editor-extensions/select-all.extension.ts
import { Extension } from "@tiptap/core";
import { AllSelection, TextSelection } from "@tiptap/pm/state";

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
});

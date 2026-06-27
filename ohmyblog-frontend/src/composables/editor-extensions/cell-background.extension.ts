// src/composables/editor-extensions/cell-background.extension.ts
import { Extension } from "@tiptap/core";

/**
 * CellBackground — 给表格单元格（tableCell / tableHeader）加 backgroundColor 属性
 *
 * 走 addGlobalAttributes 注入（与 TextAlign 给单元格加 textAlign 同理），而非
 * 重写 TableKit 的 cell 节点，保持四件套仍由 TableKit 统一管理：
 * - 属性进入共享 schema → JSON 往返保存 + 前台只读渲染均自动识别。
 * - renderHTML 输出 style + data-bg-color；parseHTML 优先读内联 style，
 *   兜底读 data-bg-color（粘贴 / 历史内容兼容）。
 *
 * 设值命令复用 TableKit 内置的 setCellAttribute("backgroundColor", value)，
 * 跨格 CellSelection 时作用于所有选中格，单格时作用当前格（见 use-table-commands）。
 */
export const CellBackground = Extension.create({
  name: "cellBackground",

  addGlobalAttributes() {
    return [
      {
        types: ["tableCell", "tableHeader"],
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: (element) =>
              element.style.backgroundColor ||
              element.getAttribute("data-bg-color") ||
              null,
            renderHTML: (attributes) => {
              if (!attributes.backgroundColor) return {};
              return {
                "data-bg-color": attributes.backgroundColor,
                style: `background-color: ${attributes.backgroundColor}`,
              };
            },
          },
        },
      },
    ];
  },
});

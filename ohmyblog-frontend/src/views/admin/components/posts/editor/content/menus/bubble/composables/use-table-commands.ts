// src/views/admin/components/posts/editor/content/menus/bubble/composables/use-table-commands.ts
import type { Editor } from "@tiptap/core";
import type { Component } from "vue";
import { RiMergeCellsHorizontal, RiSplitCellsHorizontal } from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";

/**
 * 表格命令封装（PostEditorBubbleMenu 的「表格」区域用）
 *
 * 仿飞书精简版：当前只暴露「合并 / 拆分单元格」这一个开关（mergeOrSplit）：
 * - 跨格选区 → 合并（显示合并图标 / 文案）
 * - 合并过的单元格 → 拆分（显示拆分图标 / 文案）
 * - 普通单格：既不能合并也不能拆 → canMergeOrSplit 为 false，调用方隐藏按钮
 *
 * 设为表头 / 增删行列 / 删除整表等待后续按需再加（见 index.ts P2.2）。
 *
 * 命令走 Tiptap TableKit 链式 API（底层即 prosemirror-tables），
 * 可用性用 editor.can() 判断。Vue 组件只「读 + 渲染」，不写命令逻辑。
 */
export const useTableCommands = () => {
  const { t } = useLang();

  /** 当前是否可合并或拆分（决定按钮是否显示） */
  const canMergeOrSplit = (e: Editor): boolean => e.can().mergeOrSplit();

  /** true = 合并态（跨格选区，可合并）；false = 拆分态（合并过的单元格） */
  const isMergeMode = (e: Editor): boolean => e.can().mergeCells();

  /**
   * 当前单元格是否已合并（rowspan/colspan > 1）。
   * 用作按钮 isActive：合并完后停在合并格里，按钮高亮（类似粗体的已应用态）。
   */
  const isMergedCell = (e: Editor): boolean => e.can().splitCell();

  /** 按当前态返回图标 */
  const iconOf = (e: Editor): Component =>
    isMergeMode(e) ? RiMergeCellsHorizontal : RiSplitCellsHorizontal;

  /** 按当前态返回 tooltip 文案 */
  const labelOf = (e: Editor): string =>
    isMergeMode(e)
      ? t("views.admin.PostEditor.content.tableMenu.mergeCells")
      : t("views.admin.PostEditor.content.tableMenu.splitCell");

  /** 执行合并 / 拆分（同一命令，按当前态自动判定方向） */
  const run = (e: Editor): void => {
    e.chain().focus().mergeOrSplit().run();
  };

  return { canMergeOrSplit, isMergeMode, isMergedCell, iconOf, labelOf, run };
};

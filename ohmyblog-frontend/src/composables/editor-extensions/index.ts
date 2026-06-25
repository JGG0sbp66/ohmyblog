// src/composables/editor-extensions/index.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// TODO: Tiptap 表格支持
// ─────────────────────────────────────────────────────────────────────────────
// Phase 1（已完成）：装 TableKit + 注册 resizable + 编辑器内表格样式
//   见本文件下方 TableKit 注册、src/css/tiptap/table.css。
//   粘贴 GFM 表格 / 斜杠命令 /table 均可插入并保存往返。
//
// ── 组件拆分约定（贯穿 Phase 2，务必遵守）─────────────────────────────────
//   - 单文件 ~100 行，能拆就拆，仿 PostEditorBubbleMenu 的 sections/ 分区写法
//   - 几何计算 / selection / 命令封装一律抽进 composable，Vue 文件只「读 + 渲染」
//   - 走 Vue 浮层 + useBubbleAnchor 路线（与 image/text bubble 一致），不用
//     ProseMirror DecorationSet，保持风格统一
//   - 表格命令统一来自 @tiptap/pm/tables（prosemirror-tables）：
//     CellSelection.colSelection/rowSelection、TableMap、findTable、
//     addRow*/addColumn*/deleteRow/deleteColumn/mergeCells/splitCell/deleteTable
//
// Phase 2：编辑体验
//   [x] P2.1 网格选择器插表（仿飞书：hover 方格网选 N×M 插表）
//            - TableSizePicker.vue（纯 UI，emit select({rows,cols})）
//            - 接入 slash /table 命令 + 左侧 "+" floating handle 二级菜单
//   [ ] P2.2 表格 BubbleMenu（最左侧区域，仿飞书精简版）
//            - [x] 合并 / 拆分单元格开关（mergeOrSplit，可用时才显示）
//            - [ ] 设为表头 / 增删行列 / 删除整表（按需再加）
//            - 复用 PostEditorBubbleMenu，table 区域置于最左
//            - composables/use-table-commands.ts（命令封装）
//   [x] P2.3 单元格对齐：把现有 TextAlign 的 types 加上 tableCell / tableHeader
//   [ ] P2.4 行列把手（仿飞书）：hover 表格在顶部/左侧出把手，点击选中整行/整列
//            - composables/use-table-geometry.ts（读 DOM 行列矩形，监听滚动/变更重算）
//            - composables/use-cell-selection.ts（colSelection/rowSelection 封装）
//            - PostEditorTableControls.vue（容器）+ controls/TableColHandle /
//              TableRowHandle
//   [ ] P2.5 行列间「+」插入点（仿飞书）：边界 hover 出 "+" 与蓝色插入线，
//            点击在该处加行/列。复用 use-table-geometry，新增 controls/TableInsertButton
//   [ ] P2.6 帮助文档补快捷键：Tab / Shift+Tab / Mod+Enter
//
// Phase 3：阅读页 + 移动端
//   [ ] P3.1 前台文章渲染区表格样式（去掉编辑态，适配暗色主题）
//   [ ] P3.2 移动端横向滚动：用 div 包裹，不能直接 table { overflow-x: auto }
//   [ ] P3.3 单元格内代码块 / 图片 / 长文本换行策略
//
// Phase 4：可选优化（看上线后反馈再决定）
//   [ ] P4.1 拖拽整行 / 整列重排（prosemirror-tables 有 moveTableRow/moveTableColumn）
//   [ ] P4.2 单元格背景色
//   [ ] P4.3 复制为 markdown / Excel 时的格式保持
// ─────────────────────────────────────────────────────────────────────────────

import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { TableKit } from "@tiptap/extension-table";
import { Markdown } from "tiptap-markdown";
import { useLang } from "@/composables/lang.hook";
import { getContentExtensions } from "./content-extensions";
import { SmartSelectAll } from "./select-all.extension";
import { TrailingNode } from "./trailing-node.extension";
import { SlashExtension } from "@/views/admin/components/posts/editor/content/menus/slash/slash.extension";

/**
 * useEditorExtensions — 后台编辑器扩展数组
 *
 * 在 getContentExtensions（共享 schema）之上叠加编辑专属能力：
 * - Placeholder         空文档占位提示
 * - Markdown            粘贴 markdown 文本即时转富文本
 * - SmartSelectAll      Ctrl+A 渐进式选择
 * - SlashExtension      "/" 命令面板
 *
 * 前台只读渲染（PostContent）使用 getContentExtensions({ readonly: true }），
 * 不需要这些交互扩展，避免引入 placeholder / slash menu 等无意义副作用。
 */
export function useEditorExtensions() {
  const { t } = useLang();

  return [
    ...getContentExtensions({ readonly: false }),
    SmartSelectAll,
    TrailingNode,
    CharacterCount,
    TableKit.configure({
      table: { resizable: true },
    }),
    Placeholder.configure({
      placeholder: t("views.admin.PostEditor.content.body.placeholder"),
    }),
    Markdown.configure({
      html: false,
      transformPastedText: true,
    }),
    SlashExtension,
  ];
}

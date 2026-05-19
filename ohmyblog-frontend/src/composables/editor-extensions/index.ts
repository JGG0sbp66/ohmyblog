// src/composables/editor-extensions/index.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// TODO: Tiptap 表格支持
// ─────────────────────────────────────────────────────────────────────────────
// 现状：tiptap-markdown 能识别 GFM 表格语法，但项目未装 @tiptap/extension-table，
// 粘贴 markdown 表格会 fallback 成纯文本。
//
// Phase 1：基础可用（约 30 分钟，先验证可行性）
//   [ ] P1.1 安装 4 个扩展：
//            @tiptap/extension-table
//            @tiptap/extension-table-row
//            @tiptap/extension-table-header
//            @tiptap/extension-table-cell
//   [ ] P1.2 在本文件 useEditorExtensions 数组里注册，开启 resizable: true
//   [ ] P1.3 编辑器内表格 CSS：
//            - 边框 / 斑马纹 / 表头底色
//            - 选中态 .selectedCell
//            - 列宽拖拽手柄 .column-resize-handle
//   [ ] P1.4 验证粘贴 markdown 表格能直接渲染（测试用："完整数据汇总"那种 8 行表）
//   [ ] P1.5 验证保存后再次打开能还原（Markdown 序列化往返无损）
//
// Phase 2：编辑体验（约 1.5 小时）
//   [ ] P2.1 工具栏"插入表格"按钮（默认 3×3 + 表头）
//   [ ] P2.2 表格 BubbleMenu：增删行列 / 合并拆分单元格 / 删除整表
//   [ ] P2.3 单元格对齐：把现有 TextAlign 的 types 加上 tableCell / tableHeader
//   [ ] P2.4 帮助文档补快捷键：Tab / Shift+Tab / Mod+Enter
//
// Phase 3：阅读页 + 移动端（约 45 分钟）
//   [ ] P3.1 前台文章渲染区表格样式（去掉编辑态，适配暗色主题）
//   [ ] P3.2 移动端横向滚动：用 div 包裹，不能直接 table { overflow-x: auto }
//   [ ] P3.3 单元格内代码块 / 图片 / 长文本换行策略
//
// Phase 4：可选优化（看上线后反馈再决定）
//   [ ] P4.1 拖拽整行 / 整列重排
//   [ ] P4.2 单元格背景色
//   [ ] P4.3 复制为 markdown / Excel 时的格式保持
//
// 验收：粘贴 GFM 表格能直接编辑、工具栏插表、拖列宽、保存还原、移动端横滚
// ─────────────────────────────────────────────────────────────────────────────

import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
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

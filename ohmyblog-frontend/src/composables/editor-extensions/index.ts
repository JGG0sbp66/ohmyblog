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

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { useLang } from "@/composables/lang.hook";
import { Indent } from "./indent.extension";
import { CustomListItem } from "./list-item.extension";
import { CustomOrderedList } from "./ordered-list.extension";
import {
  CustomBold,
  CustomItalic,
  CustomStrike,
  CustomUnderline,
  CustomCode,
} from "./marks.extension";
import { CustomCodeBlock } from "./code-block.extension";
import { TextStyle, Color, CustomHighlight } from "./color.extension";
import { ResizableImage } from "./image.extension";

/**
 * useEditorExtensions — 返回 Tiptap 编辑器扩展数组
 *
 * 集中管理所有扩展配置，PostEditorBody 直接调用即可。
 */
export function useEditorExtensions() {
  const { t } = useLang();

  return [
    StarterKit.configure({
      listItem: false, // 由 CustomListItem 替代，支持列表项内含标题节点
      orderedList: false, // 由 CustomOrderedList 替代，修复 InputRule start 归一问题
      bold: false, // 由 CustomBold 替代，支持飞书风格空格触发 InputRule
      italic: false, // 由 CustomItalic 替代，同上
      strike: false, // 由 CustomStrike 替代，同上
      code: false, // 由 CustomCode 替代，允许行内代码与其他 Mark 共存
      codeBlock: false, // 由 CustomCodeBlock 替代，挂载 Vue NodeView + lowlight 语法高亮
      link: false, // 由下方 Link.configure 替代（v3 StarterKit 已内置，需显式禁用）
      underline: false, // 由 CustomUnderline 替代（v3 StarterKit 已内置，需显式禁用）
    }),
    CustomListItem,
    CustomOrderedList,
    CustomBold,
    CustomItalic,
    CustomStrike,
    CustomUnderline,
    CustomCode,
    CustomCodeBlock,
    TextStyle, // Color 的依赖 mark，必须在 Color 之前注册
    Color, // 文字颜色，依赖 TextStyle mark
    CustomHighlight, // 背景高亮（多色）
    ResizableImage,
    Indent,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Link.configure({ openOnClick: true }),
    Placeholder.configure({
      placeholder: t("views.admin.PostEditor.content.body.placeholder"),
    }),
    Markdown.configure({
      html: false,
      transformPastedText: true,
    }),
  ];
}

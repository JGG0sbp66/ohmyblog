// src/composables/editor-extensions/index.ts
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { useLang } from "@/composables/lang.hook";
import { Indent } from "./indent.extension";
import { CustomListItem } from "./list-item.extension";
import { CustomBold, CustomItalic, CustomStrike, CustomUnderline, CustomCode } from "./marks.extension";
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
      listItem: false,   // 由 CustomListItem 替代，支持列表项内含标题节点
      bold: false,       // 由 CustomBold 替代，支持飞书风格空格触发 InputRule
      italic: false,     // 由 CustomItalic 替代，同上
      strike: false,     // 由 CustomStrike 替代，同上
      code: false,       // 由 CustomCode 替代，允许行内代码与其他 Mark 共存
      codeBlock: false,  // 由 CustomCodeBlock 替代，挂载 Vue NodeView + lowlight 语法高亮
    }),
    CustomListItem,
    CustomBold,
    CustomItalic,
    CustomStrike,
    CustomUnderline,
    CustomCode,
    CustomCodeBlock,
    TextStyle,      // Color 的依赖 mark，必须在 Color 之前注册
    Color,          // 文字颜色，依赖 TextStyle mark
    CustomHighlight, // 背景高亮（多色）
    ResizableImage,
    Indent,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
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

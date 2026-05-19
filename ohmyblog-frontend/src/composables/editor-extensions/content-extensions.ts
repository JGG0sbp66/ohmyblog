// src/composables/editor-extensions/content-extensions.ts
//
// Tiptap 扩展集合的"内容相关"部分 —— 决定什么节点 / 标记会被序列化、解析。
// 后台编辑器（PostEditorBody）和前台只读渲染（PostContent）必须共用同一份，
// 否则一边支持的节点会被另一边当作未知节点丢弃。
//
// 不在这里的：交互态扩展（Placeholder / SlashExtension / SmartSelectAll /
// Markdown.transformPastedText 等），由各自调用方按需追加。

import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
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
import { Indent } from "./indent.extension";

/**
 * 只读图片扩展：保留 width 属性渲染，不挂 NodeView / resize handle。
 *
 * 跟 ResizableImage 在 attribute schema 上完全一致，确保 JSON 互通：
 * 后台保存的 `{ type: 'image', attrs: { width: 320 } }` 在前台也能渲染出宽度。
 */
const ReadonlyImage = Image.extend({
  inline: true,
  group: "inline",
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML(attrs) {
          if (!attrs.width) return {};
          return { style: `width: ${attrs.width}px; max-width: 100%;` };
        },
        parseHTML(element) {
          const style = element.style.width;
          if (style?.endsWith("px")) return parseInt(style);
          return null;
        },
      },
    };
  },
});

export interface ContentExtensionsOptions {
  /**
   * 只读模式（前台展示文章用）：
   * - 用 ReadonlyImage 替代 ResizableImage
   * - Link 默认点击跳转
   */
  readonly?: boolean;
}

/**
 * 返回所有"决定节点 / 标记 schema"的扩展。
 * 后台与前台共用此函数，保证 schema 一致。
 */
export function getContentExtensions(opts: ContentExtensionsOptions = {}) {
  const { readonly = false } = opts;

  return [
    StarterKit.configure({
      listItem: false, // 由 CustomListItem 替代，支持列表项内含标题节点
      orderedList: false, // 由 CustomOrderedList 替代，修复 InputRule start 归一问题
      bold: false, // 由 CustomBold 替代，支持飞书风格空格触发 InputRule
      italic: false, // 同上
      strike: false, // 同上
      code: false, // 由 CustomCode 替代，允许行内代码与其他 Mark 共存
      codeBlock: false, // 由 CustomCodeBlock 替代，挂载 Vue NodeView + lowlight
      link: false, // 由下方 Link.configure 替代（v3 StarterKit 已内置）
      underline: false, // 由 CustomUnderline 替代（v3 StarterKit 已内置）
      // 拖拽 drop 时的指示器：默认 1px 浅色几乎看不见，加粗 + 主题色让落点清晰
      dropcursor: {
        color: "var(--theme-accent)",
        width: 2,
      },
    }),
    CustomListItem,
    CustomOrderedList,
    CustomBold,
    CustomItalic,
    CustomStrike,
    CustomUnderline,
    CustomCode,
    CustomCodeBlock,
    TextStyle, // Color 的依赖 mark
    Color,
    CustomHighlight,
    readonly ? ReadonlyImage : ResizableImage,
    Indent,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Link.configure({
      // 编辑模式下点击链接只定位光标，不跳转（否则用户改链接文字时会被带走）
      openOnClick: readonly,
      // autolink 关闭：边打边链会被 mark 边界吸入，Notion / 飞书都不做
      autolink: false,
      // 选中文字粘贴 URL 自动套链接；纯粘贴 URL 也自动转链接
      linkOnPaste: true,
      HTMLAttributes: {
        rel: "noopener noreferrer",
        target: "_blank",
      },
    }),
  ];
}

// src/composables/editor-extensions/index.ts

import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Markdown } from "tiptap-markdown";
import { useLang } from "@/composables/lang.hook";
import { getContentExtensions } from "./content-extensions";
import { SmartSelectAll } from "./select-all.extension";
import { TrailingNode } from "./trailing-node.extension";
import { HtmlSourcePaste } from "./html-paste.extension";
import { SlashExtension } from "@/views/admin/components/posts/editor/content/menus/slash/slash.extension";
import { OrderedListNumber } from "@/views/admin/components/posts/editor/content/menus/ordered-list/ordered-list-number.extension";

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
      // html: true —— 允许粘贴的 markdown / 纯文本中内嵌的 HTML（如 <details>）
      // 参与解析。安全边界仍是双重的：schema 外标签被 ProseMirror 丢弃，
      // 前台渲染前还有 DOMPurify 过滤。
      html: true,
      transformPastedText: true,
    }),
    // 粘贴 HTML 源码（剪贴板带语法高亮 text/html 壳时）也按富文本解析，
    // 必须与 Markdown(html:true) 配套（insertContent 字符串走 markdown 管线）
    HtmlSourcePaste,
    SlashExtension,
    OrderedListNumber,
  ];
}

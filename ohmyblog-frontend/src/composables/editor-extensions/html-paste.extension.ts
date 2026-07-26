// src/composables/editor-extensions/html-paste.extension.ts
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/**
 * HtmlSourcePaste — 让「粘贴 HTML 源码」按富文本解析
 *
 * 背景：从 VS Code / 聊天窗口 / 网页代码块复制 HTML 源码时，剪贴板往往同时带
 * text/html 风味（语法高亮的 <span> 包裹、标签本体是转义后的字面文本）。
 * ProseMirror 粘贴时只要有 text/html 就优先用它 —— 结果粘出来是一段纯文字；
 * tiptap-markdown 的 clipboardTextParser 只在纯文本粘贴时介入，完全没机会。
 *
 * 策略：paste 时检查 text/plain 是否"长得像 HTML 源码"（< 开头、闭合标签收尾）。
 * 命中且 text/html 里并没有对应的真实标签（说明 html 风味只是高亮壳），
 * 改用纯文本内容走 insertContent 解析（经 tiptap-markdown patch，html 直通）。
 *
 * 保守边界：
 * - 代码块内不接管 —— 源码粘进代码块就该保持字面
 * - 从渲染后页面复制（text/html 含真实同名标签）不接管，走默认解析
 */
const looksLikeHtmlSource = (text: string): boolean => {
  const t = text.trim();
  if (!t.startsWith("<")) return false;
  // 以闭合标签或自闭合收尾，避免误伤 "<哈哈>" 这类尖括号纯文本
  return /<\/[a-z][\w-]*>$/i.test(t) || /\/>$/.test(t);
};

export const HtmlSourcePaste = Extension.create({
  name: "htmlSourcePaste",

  addProseMirrorPlugins() {
    const { editor } = this;
    return [
      new Plugin({
        key: new PluginKey("htmlSourcePaste"),
        props: {
          handlePaste(view, event) {
            const clipboard = event.clipboardData;
            if (!clipboard) return false;
            const text = clipboard.getData("text/plain");
            if (!text || !looksLikeHtmlSource(text)) return false;

            // 代码块内保持字面粘贴
            if (view.state.selection.$from.parent.type.spec.code) return false;

            // text/html 已含真实同名标签 → 复制自渲染后的内容，默认解析即可
            const firstTag = text.trim().match(/^<([a-z][\w-]*)/i)?.[1];
            const html = clipboard.getData("text/html");
            if (
              firstTag &&
              html &&
              new RegExp(`<${firstTag}(\\s|>|/)`, "i").test(html)
            ) {
              return false;
            }

            return editor.commands.insertContent(text);
          },
        },
      }),
    ];
  },
});

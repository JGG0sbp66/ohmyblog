// src/composables/editor-extensions/ordered-list.extension.ts
import OrderedList from "@tiptap/extension-ordered-list";
import { mergeAttributes } from "@tiptap/core";

/**
 * CustomOrderedList — 扩展 OrderedList，修复自定义 CSS 计数器忽略 start 属性的问题。
 *
 * lists.css 使用 `counter-reset: tiptap-counter` 自绘序号，完全无视 <ol start="N"> 的
 * HTML 属性。此处在 renderHTML 中注入内联 style，强制将计数器初始值设为 start - 1，
 * 使第一项 counter-increment 后恰好等于用户输入的起始数字。
 */
export const CustomOrderedList = OrderedList.extend({
  renderHTML({ HTMLAttributes }) {
    const start = (HTMLAttributes.start as number) ?? 1;
    return [
      "ol",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: `counter-reset: tiptap-counter ${start - 1}`,
      }),
      0,
    ];
  },
});

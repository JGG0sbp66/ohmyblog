// src/composables/editor-extensions/marks.extension.ts
import { markInputRule } from "@tiptap/core";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Code from "@tiptap/extension-code";
import Underline from "@tiptap/extension-underline";

/**
 * 自定义 Mark 扩展，支持飞书风格的 Markdown 快捷键 (文本后跟空格触发)
 * 且解决了某些情况下只能在行首触发的问题
 */
export const CustomBold = Bold.extend({
  addInputRules() {
    return [
      // 匹配 **文本** 或 __文本__ 后跟一个空格
      markInputRule({
        find: /(?:\*\*|__)([^*_]+)(?:\*\*|__)\s$/,
        type: this.type,
      }),
    ];
  },
});

export const CustomItalic = Italic.extend({
  addInputRules() {
    return [
      // 匹配 *文本* 或 _文本_ 后跟一个空格，且前面不是 * 或 _
      markInputRule({
        find: /(?:^|[^*_])(?:\*|_)([^*_]+)(?:\*|_)\s$/,
        type: this.type,
      }),
    ];
  },
});

export const CustomStrike = Strike.extend({
  addInputRules() {
    return [
      // 匹配 ~~文本~~ 后跟一个空格
      markInputRule({
        find: /(?:~~)([^~]+)(?:~~)\s$/,
        type: this.type,
      }),
    ];
  },
});

export const CustomUnderline = Underline.extend({
  addInputRules() {
    return [
      // 匹配 ~文本~ 后跟一个空格 (飞书风格下划线)
      markInputRule({
        find: /(?:~)([^~]+)(?:~)\s$/,
        type: this.type,
      }),
    ];
  },
});

export const CustomCode = Code.extend({
  // 飞书风格：允许行内代码与其他 Mark 共存
  excludes: "",

  addInputRules() {
    return [
      // 匹配 `文本` 后跟一个空格
      markInputRule({
        find: /(?:^|[^`])(?:`)([^`]+)(?:`)\s$/,
        type: this.type,
      }),
    ];
  },
});

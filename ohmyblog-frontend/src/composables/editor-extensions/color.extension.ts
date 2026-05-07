// src/composables/editor-extensions/color.extension.ts
// 文字颜色（Color）与背景高亮（Highlight）扩展
// TextStyle 是 Color 的依赖 mark；v3 StarterKit 通常已包含，但显式注册更安全
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";

export { TextStyle, Color };

/**
 * CustomHighlight — 多色背景高亮扩展
 *
 * multicolor: true 允许每处高亮使用不同颜色（存入 data-color 属性）。
 * 关闭 multicolor 则只有默认黄色高亮。
 */
export const CustomHighlight = Highlight.configure({ multicolor: true });

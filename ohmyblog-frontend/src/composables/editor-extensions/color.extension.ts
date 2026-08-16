// src/composables/editor-extensions/color.extension.ts
// 文字颜色（Color）与背景高亮（Highlight）扩展
// TextStyle 是 Color 的依赖 mark；v3 StarterKit 通常已包含，但显式注册更安全
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { sanitizeColorValue } from "./sanitize-color";

/**
 * 上游 TextStyle 的颜色解析不经消毒：backgroundColor 直接按字符串切分
 * 原始 style 属性、color 读 CSSOM 后只滤引号，而 renderHTML 是字符串拼接。
 * 这里包一层白名单 —— 粘贴内容里的非法值（如 url(...) 载荷）在进 JSON
 * 之前就被换成 null，等价于「没有这个属性」（见 sanitize-color.ts）
 */
const SanitizedTextStyle = TextStyle.extend({
  addGlobalAttributes() {
    // parent() 每次调用都返回新建的对象，就地包装是安全的
    const groups = this.parent?.() ?? [];
    for (const group of groups) {
      for (const def of Object.values(group.attributes ?? {})) {
        const origParse = def.parseHTML;
        if (origParse) {
          def.parseHTML = (element: HTMLElement) =>
            sanitizeColorValue(origParse(element) as string | null);
        }
      }
    }
    return groups;
  },
});

export { SanitizedTextStyle as TextStyle, Color };

/**
 * CustomHighlight — 多色背景高亮扩展
 *
 * multicolor: true 允许每处高亮使用不同颜色（存入 data-color 属性）。
 * 关闭 multicolor 则只有默认黄色高亮。
 *
 * 覆写上游的 color 属性定义，parse / render 双端过 sanitizeColorValue
 * 白名单：上游 parseHTML 原样读 data-color 属性、renderHTML 字符串拼接
 * style，粘贴载荷（red;background-image:url(//evil.com)）会直通
 * contentHtml 与 RSS。render 端兜住修复之前已入库的旧载荷。
 */
const SanitizedHighlight = Highlight.extend({
  addAttributes() {
    if (!this.options.multicolor) {
      return {};
    }
    return {
      color: {
        default: null,
        parseHTML: (element) =>
          sanitizeColorValue(
            element.getAttribute("data-color") || element.style.backgroundColor,
          ),
        renderHTML: (attributes) => {
          const color = sanitizeColorValue(attributes.color);
          if (!color) {
            return {};
          }
          return {
            "data-color": color,
            // color: inherit 与上游一致：防止 mark 内深色文字被单元格
            // 背景衬托得不可读
            style: `background-color: ${color}; color: inherit`,
          };
        },
      },
    };
  },
});

export const CustomHighlight = SanitizedHighlight.configure({
  multicolor: true,
});

// src/composables/editor-extensions/color.extension.ts
// 文字颜色（Color）与背景高亮（Highlight）扩展
// TextStyle 是 Color 的依赖 mark；v3 StarterKit 通常已包含，但显式注册更安全
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { sanitizeColorValue } from "./sanitize-color";

// TextStyle 原样放行：这版它只是个无属性的 span mark，样式不经过它往返，
// 没有可投毒的面。文字颜色真正的进出通道是下面 Color 注入到 textStyle
// mark 上的 color 全局属性 —— @tiptap/extension-color 只是
// @tiptap/extension-text-style 里 Color 的 re-export，源码在后者 dist 里。
// （同包还有个带 backgroundColor 属性的 BackgroundColor 扩展，本应用
// 未注册，不存在那条路。）
export { TextStyle };

/**
 * 上游 Color 的 color 属性两端都不经消毒：parseHTML 按字符串切分原始
 * style 属性找 color 声明（只滤引号）、renderHTML 无消毒模板拼接。粘贴
 * <span style="color:red;background-image:url(//evil.com)"> 即可让载荷
 * 进 JSON、再原样拼进 style。这里整个覆写属性定义，parse / render 双端
 * 过 sanitizeColorValue 白名单：
 * - parse 端：非法值在进 JSON 之前就被换成 null，等价于「没有这个属性」；
 * - render 端：修复之前已入库的旧载荷重新编辑保存时，getHTML 走这里的
 *   render 而不是上游的裸拼接 —— 这是清洗存量文档的唯一路径。
 * 解析语义与上游一致（优先从 style 属性按声明切分、倒序取最后一条
 * color 声明，兜底读 CSSOM），差异只在出口过白名单；上游对值滤引号，
 * 白名单更严 —— 带引号的值直接 null，合法颜色本来就不会带引号。
 */
const SanitizedColor = Color.extend({
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          color: {
            default: null,
            parseHTML: (element) => {
              const styleAttr = element.getAttribute("style");
              if (styleAttr) {
                const decls = styleAttr
                  .split(";")
                  .map((s) => s.trim())
                  .filter(Boolean);
                for (let i = decls.length - 1; i >= 0; i -= 1) {
                  const decl = decls[i];
                  if (!decl) continue;
                  const parts = decl.split(":");
                  if (parts.length < 2) continue;
                  const [rawProp, ...rest] = parts;
                  if (rawProp?.trim().toLowerCase() === "color") {
                    return sanitizeColorValue(rest.join(":").trim());
                  }
                }
              }
              return sanitizeColorValue(element.style.color);
            },
            renderHTML: (attributes) => {
              const color = sanitizeColorValue(attributes.color);
              if (!color) return {};
              return {
                style: `color: ${color}`,
              };
            },
          },
        },
      },
    ];
  },
});

export { SanitizedColor as Color };

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

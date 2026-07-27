// src/composables/code-block/icons.ts
//
// 语言图标解析 —— 后台 NodeView 与前台增强脚本共用。
// 图标表由 scripts/gen-code-block-icons.mjs 生成（见 icons.generated.ts）。

import { LANGUAGE_ICONS, ICON_UID_TOKEN } from "./icons.generated";

/**
 * 未收录语言的兜底图标（lucide code-xml，即 `</>`）。
 * 单色、走 currentColor，因此会跟随 header 的主题色，
 * 与彩色品牌图标混排时不会显得突兀。
 */
const FALLBACK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>`;

// SVG 内部 id 的实例计数器。
// 见 icons.generated.ts 顶部说明：渐变图标（python/rust/swift/kotlin/r 等）
// 内含 <linearGradient id="X"> + url(#X)，同 id 在文档里重复出现时浏览器只认第一个，
// 一旦首个实例被移除（编辑器增删代码块、前台 v-html 重渲染），其余实例的渐变就会失效。
// 每次解析都分配唯一后缀，彻底规避。
let instanceCounter = 0;

/**
 * 取语言对应的图标 SVG 串。未收录的语言返回兜底图标，因此永远不为空 ——
 * header 的图标位不会出现空洞导致布局跳动。
 *
 * @param language 语言名（大小写不敏感，会做 trim）
 */
export function resolveLanguageIcon(language: string): string {
  const key = language.trim().toLowerCase();
  const svg = key ? LANGUAGE_ICONS[key] : undefined;
  if (!svg) return FALLBACK_ICON;
  // 占位符 → 实例唯一后缀
  return svg.split(ICON_UID_TOKEN).join(`-omb${instanceCounter++}`);
}

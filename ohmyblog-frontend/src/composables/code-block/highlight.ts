// src/composables/code-block/highlight.ts
//
// 代码块语法高亮的单一事实来源 —— 后台编辑器与前台阅读端共用。
//
// 为什么必须共用：两端之前各自取「common 语言集」，
//   后台走 lowlight 的 common（37 种），前台走 highlight.js/lib/common（36 种）。
//   这是两个包各自手工维护的清单，实际存在差异（arduino 只在 lowlight 里有），
//   导致后台下拉能选、编辑器里高亮正常的语言，到了前台却退化成纯文本。
//   现在语言集统一收敛到 ./languages.ts（common + 精选扩充 + 别名），
//   两端都从同一张 GRAMMARS 表派生，一致性由构造保证。
//
// 注意：本文件只依赖 GRAMMARS 这份 grammar 记录，不碰 createLowlight ——
//   lowlight 实例在 ./lowlight.ts，仅编辑器引用，避免拖进阅读端依赖图。

import hljsCore from "highlight.js/lib/core";
import {
  GRAMMARS,
  LANGUAGE_ALIASES,
  POPULAR_ALIASES,
} from "./languages";

// 独立 hljs 实例（而非全局单例），避免与其他可能引入 highlight.js 的代码互相污染注册表。
const hljs = hljsCore.newInstance();
for (const [name, grammar] of Object.entries(GRAMMARS)) {
  hljs.registerLanguage(name, grammar);
}

/**
 * 所有可选语言名，供后台语言下拉枚举。
 * 额外加入 "text" 作为「无高亮」占位项（语言集里没有它，但符合用户直觉）。
 * hljs.listLanguages() 只含正式注册名，常用别名（toml/yml/md 等）另行
 * 从 POPULAR_ALIASES 补回 —— 否则用户打这些惯用写法永远搜不到候选
 * （详见 languages.ts 的 POPULAR_ALIASES 注释）。getLanguage 校验确保
 * 只放进真实可解析的别名，语言集变动时自动失效而非报错。
 */
export const listAvailableLanguages = (): string[] =>
  [
    "text",
    ...hljs.listLanguages().filter((lang) => !(lang in LANGUAGE_ALIASES)),
    ...POPULAR_ALIASES.filter((alias) => hljs.getLanguage(alias)),
  ].sort();

/**
 * 语法高亮：返回带 hljs-* token 的 HTML 串；
 * 语言为空或不在语言集内（如 "text"）时返回 null，由调用方保持纯文本。
 */
export function highlightToHtml(code: string, language: string): string | null {
  if (!language || !hljs.getLanguage(language)) return null;
  return hljs.highlight(code, { language, ignoreIllegals: true }).value;
}

/**
 * 自动检测语言：对全部已注册语法评分，取最高分者。
 *
 * 只作展示层兜底（编辑器 header 提示、阅读端无语言代码块的高亮），
 * 结果绝不回写进 attrs/contentHtml —— 启发式会猜错（实测 HTML 片段会被
 * 认成 php-template、太短的代码近乎乱猜），猜的语言一旦落库就会变成
 * 错误的持久语义。
 *
 * 带两道置信度门槛，宁缺毋滥：hljs 默认阈值只滤掉零分，太低的结果
 * （如 const a = 1 被判成 cpp、相关度 1）不如不显示。
 */
export function detectLanguage(code: string): string | null {
  if (!code.trim()) return null;
  const result = hljs.highlightAuto(code);
  if (!result.language || result.relevance < 6) return null;
  return result.language;
}

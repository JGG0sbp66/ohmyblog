// src/composables/code-block/highlight.ts
//
// 代码块语法高亮的单一事实来源 —— 后台编辑器与前台阅读端共用。
//
// 为什么必须共用：两端之前各自取「common 语言集」，
//   后台走 lowlight 的 common（37 种），前台走 highlight.js/lib/common（36 种）。
//   这是两个包各自手工维护的清单，实际存在差异（arduino 只在 lowlight 里有），
//   导致后台下拉能选、编辑器里高亮正常的语言，到了前台却退化成纯文本。
//   这里改为两端都从 lowlight 的 `common` 派生，语言集由构造保证一致。
//
// 注意：本文件只依赖 `common` 这份 grammar 记录，不碰 createLowlight ——
//   lowlight 实例在 ./lowlight.ts，仅编辑器引用，避免拖进阅读端依赖图。

import { common } from "lowlight";
import hljsCore from "highlight.js/lib/core";

// 独立 hljs 实例（而非全局单例），避免与其他可能引入 highlight.js 的代码互相污染注册表。
const hljs = hljsCore.newInstance();
for (const [name, grammar] of Object.entries(common)) {
  hljs.registerLanguage(name, grammar);
}

/**
 * 所有可选语言名，供后台语言下拉枚举。
 * 额外加入 "text" 作为「无高亮」占位项（语言集里没有它，但符合用户直觉）。
 */
export const listAvailableLanguages = (): string[] =>
  ["text", ...hljs.listLanguages()].sort();

/**
 * 语法高亮：返回带 hljs-* token 的 HTML 串；
 * 语言为空或不在语言集内（如 "text"）时返回 null，由调用方保持纯文本。
 */
export function highlightToHtml(code: string, language: string): string | null {
  if (!language || !hljs.getLanguage(language)) return null;
  return hljs.highlight(code, { language, ignoreIllegals: true }).value;
}

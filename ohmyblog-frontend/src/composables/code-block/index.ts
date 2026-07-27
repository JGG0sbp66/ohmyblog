// src/composables/code-block/index.ts
//
// 代码块共享层的统一出口。
//
// 背景：代码块在两端各有一份 DOM 实现且无法合并 ——
//   后台必须是 Tiptap NodeView（要 NodeViewContent 承载可编辑区），
//   前台明确不加载 ProseMirror（contentHtml 要保持干净供 RSS 用，且阅读端不该背编辑器体积）。
// 因此合并的粒度是「逻辑层」而非「组件」：语法高亮、语言图标、行数计算、交互常量
//   全部收敛到这里，两端只各自负责把它们摆进 DOM。

export { listAvailableLanguages, highlightToHtml } from "./highlight";
export { resolveLanguageIcon, preloadLanguageIcons } from "./icons";
export { formatLanguageLabel } from "./labels";
// 刻意不导出 ./lowlight —— 它只服务后台编辑器，由 code-block.extension.ts 直接引入，
// 以免阅读端 import 本 barrel 时被连带打包（详见 lowlight.ts 注释）。

/** 复制成功后图标停留在「对勾」状态的时长（ms），两端一致 */
export const COPY_FEEDBACK_MS = 1500;

/**
 * 计算代码块行数。
 *
 * ProseMirror 序列化出的代码块正文末尾始终带一个隐式换行，
 * 不去掉会让行号比实际多一行（且在某些编辑操作后表现为行号忽多忽少）。
 */
export function countCodeLines(text: string): number {
  const normalized = text.endsWith("\n") ? text.slice(0, -1) : text;
  return Math.max(1, normalized.split("\n").length);
}

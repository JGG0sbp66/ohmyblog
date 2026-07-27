// src/composables/editor-extensions/code-block.extension.ts
// 将 Tiptap 原生代码块替换为带语法高亮 + Vue NodeView 的自定义实现
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import { lowlight } from "@/composables/code-block/lowlight";
import CodeBlock from "@/views/admin/components/posts/editor/content/node-views/CodeBlock.vue";

// 语言集与高亮实例来自 composables/code-block —— 与前台阅读端同源，
// 避免两端「common 语言集」不一致（详见该模块注释）。
// listAvailableLanguages 也已迁到那里，供 NodeView 的语言下拉直接引用。

/**
 * CustomCodeBlock — 代码块 NodeView 扩展（含 lowlight 语法高亮）
 *
 * - lowlight(common)：highlight.js 语法解析，生成 hljs-* token spans
 * - VueNodeViewRenderer：将原生 <pre> 替换为 CodeBlock.vue
 *   实现语言图标 header、行号列、常驻复制按钮等自定义 UI
 */
export const CustomCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return VueNodeViewRenderer(CodeBlock);
  },
}).configure({ lowlight, enableTabIndentation: true, tabSize: 2 });

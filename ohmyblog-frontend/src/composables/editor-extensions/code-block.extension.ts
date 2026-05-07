// src/composables/editor-extensions/code-block.extension.ts
// 将 Tiptap 原生代码块替换为带语法高亮 + Vue NodeView 的自定义实现
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import { createLowlight, common } from "lowlight";
import CodeBlock from "@/views/admin/components/posts/editor/content/node-views/CodeBlock.vue";

// 注册 lowlight 内置的常用语言包（30+ 种，含 JS/TS/HTML/CSS/Python/C++/Java/Go/Rust 等）
const lowlight = createLowlight(common);

/**
 * CustomCodeBlock — 代码块 NodeView 扩展（含 lowlight 语法高亮）
 *
 * - lowlight(common)：highlight.js 语法解析，生成 hljs-* token spans
 * - VueNodeViewRenderer：将原生 <pre> 替换为 CodeBlock.vue
 *   实现 MacOS 风格 header、行号列、语言标签输入等自定义 UI
 */
export const CustomCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return VueNodeViewRenderer(CodeBlock);
  },
}).configure({ lowlight });

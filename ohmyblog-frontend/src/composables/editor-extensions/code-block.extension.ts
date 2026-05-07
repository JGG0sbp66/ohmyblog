// src/composables/editor-extensions/code-block.extension.ts
// 将 Tiptap 原生代码块节点替换为 Vue NodeView 组件（node-views/CodeBlock.vue）
import TiptapCodeBlock from "@tiptap/extension-code-block";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import CodeBlock from "@/views/admin/components/posts/editor/content/node-views/CodeBlock.vue";

/**
 * CustomCodeBlock — 代码块 NodeView 扩展
 *
 * 通过 VueNodeViewRenderer 将原生 <pre> 渲染替换为 CodeBlock.vue，
 * 实现 MacOS 风格 header、行号列、语言标签输入等自定义 UI。
 */
export const CustomCodeBlock = TiptapCodeBlock.extend({
  addNodeView() {
    return VueNodeViewRenderer(CodeBlock);
  },
});

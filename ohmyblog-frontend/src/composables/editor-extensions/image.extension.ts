// src/composables/editor-extensions/image.extension.ts
import Image from "@tiptap/extension-image";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import ImageBlock from "@/views/admin/components/posts/editor/content/node-views/ImageBlock.vue";

/**
 * ResizableImage — 可调整宽度的图片扩展
 *
 * 在原生 Image 基础上扩展：
 * - 增加 `width` attr，序列化为内联 style（`width: Xpx`）
 * - 挂载 Vue NodeView（ImageBlock.vue），提供拖拽 resize handle
 */
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML(attrs) {
          if (!attrs.width) return {};
          return { style: `width: ${attrs.width}px; max-width: 100%;` };
        },
        parseHTML(element) {
          const style = element.style.width;
          if (style?.endsWith("px")) return parseInt(style);
          return null;
        },
      },
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(ImageBlock);
  },
});

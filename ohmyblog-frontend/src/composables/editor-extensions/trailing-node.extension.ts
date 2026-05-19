// src/composables/editor-extensions/trailing-node.extension.ts
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/**
 * TrailingNode — 文档末尾自动维持一个空段落
 *
 * 痛点：Tiptap 默认情况下，文档末尾若是 codeBlock / image / blockquote 等
 * 节点，光标会被困住，用户无法点空白处继续输入。
 *
 * 实现：每次 transaction 后检查 doc 的最后一个子节点，
 * 如果不是 paragraph，则追加一个空 paragraph。
 *
 * 仅追加一次 / appendTransaction 不会被自身触发循环（PM 文档保证幂等）。
 */
export const TrailingNode = Extension.create({
  name: "trailingNode",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("trailingNode"),
        appendTransaction: (_transactions, _oldState, newState) => {
          const { doc, schema, tr } = newState;
          const lastChild = doc.lastChild;
          const paragraph = schema.nodes.paragraph;
          if (!paragraph) return null;
          // 文档为空 / 最后一个节点已是空段落 → 不动
          if (lastChild && lastChild.type === paragraph) return null;
          return tr.insert(doc.content.size, paragraph.create());
        },
      }),
    ];
  },
});

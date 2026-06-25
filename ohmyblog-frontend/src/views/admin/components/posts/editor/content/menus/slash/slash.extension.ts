// src/views/admin/components/posts/editor/content/menus/slash/slash.extension.ts
import { Extension } from "@tiptap/core";
import Suggestion, {
  type SuggestionOptions,
  type SuggestionProps,
} from "@tiptap/suggestion";
import { PluginKey, type EditorState } from "@tiptap/pm/state";
import {
  type App,
  type ComponentPublicInstance,
  createApp,
  h,
  nextTick,
} from "vue";
import SlashMenu from "./SlashMenu.vue";

/**
 * SlashExtension — 在编辑器里输入 "/" 触发 Notion 风格命令面板
 *
 * 走 @tiptap/suggestion 标准模式：
 * - char "/" 触发，followed by query 字符串
 * - render 函数管理 SlashMenu 组件的生命周期（onStart / onUpdate / onKeyDown / onExit）
 * - SlashMenu 通过 expose 提供 imperative API（updateQuery / onKeyDown）
 *
 * 挂载模型：createApp 的 mount 容器只是个空 div（没有 DOM 表现），
 * 真正的弹层位置由 SlashMenu 内部的 <Teleport to="body"> 控制。
 */

/** 上下文边界检查：避免在中文 "他/她"、URL "https://" 等场景误触发 */
const isValidSlashContext = (state: EditorState, from: number): boolean => {
  // 1. codeBlock 内部不触发：代码里 "/" 是合法字符（注释、路径、正则、JSX 闭标签等）
  const $pos = state.doc.resolve(from);
  for (let d = $pos.depth; d > 0; d--) {
    if ($pos.node(d).type.name === "codeBlock") return false;
  }

  // 2. from 是 "/" 字符自身的位置，前一个字符必须是空白或行首
  if (from <= 0) return true; // 文档起点
  const prevChar = state.doc.textBetween(from - 1, from, "\n", "\n");
  return prevChar === "" || /\s/.test(prevChar);
};

export const SlashExtension = Extension.create({
  name: "slashCommand",

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        startOfLine: false,
        allowSpaces: false,
        // 行内场景：char 后空格立即结束 suggestion
        pluginKey: new PluginKey("slashSuggestion"),

        // 仅当 "/" 前面是空白或行首时触发（避免 URL / 中文里误触）
        allow: ({ state, range }) => isValidSlashContext(state, range.from),

        // suggestion 触发时 / query 变化时 / 键盘事件时调用的渲染管线
        render: () => {
          let mountEl: HTMLDivElement | null = null;
          let app: App | null = null;
          let menuRef: ComponentPublicInstance<typeof SlashMenu> | null = null;

          return {
            onStart: (props) => {
              if (!props.clientRect) return;

              mountEl = document.createElement("div");
              document.body.appendChild(mountEl);

              app = createApp({
                setup: () => () =>
                  h(SlashMenu, {
                    ref: (r) => {
                      menuRef = r as ComponentPublicInstance<typeof SlashMenu>;
                    },
                    editor: props.editor,
                    range: props.range,
                    clientRect: () => props.clientRect?.() ?? null,
                  }),
              });
              app.mount(mountEl);

              // mount 后下一帧把当前 query 推进去（确保 ref 已绑定）
              nextTick(() => {
                (menuRef as any)?.updateQuery(props.query);
              });
            },

            onUpdate: (props: SuggestionProps) => {
              (menuRef as any)?.updateQuery(props.query);
              // 同步最新区间：range 随 query 增长，否则 deleteRange 删不掉 "/table"
              (menuRef as any)?.updateRange(props.range);
            },

            onKeyDown: ({ event }) => {
              if (event.key === "Escape") {
                // 关闭由 suggestion 自己处理（return false 让默认行为继续）
                return false;
              }
              return Boolean((menuRef as any)?.onKeyDown(event));
            },

            onExit: () => {
              app?.unmount();
              mountEl?.remove();
              app = null;
              mountEl = null;
              menuRef = null;
            },
          };
        },
      } satisfies Partial<SuggestionOptions>),
    ];
  },
});

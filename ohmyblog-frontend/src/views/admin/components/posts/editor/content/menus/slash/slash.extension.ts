// src/views/admin/components/posts/editor/content/menus/slash/slash.extension.ts
import { Extension } from "@tiptap/core";
import Suggestion, {
  type SuggestionOptions,
  type SuggestionProps,
} from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { type App, type ComponentPublicInstance, createApp, h } from "vue";
import SlashMenu from "./SlashMenu.vue";

/**
 * SlashExtension — 在编辑器里输入 "/" 触发 Notion 风格命令面板
 *
 * 走 @tiptap/suggestion 标准模式：
 * - char "/" 触发，followed by query 字符串
 * - render 函数管理 SlashMenu 组件的生命周期（onStart / onUpdate / onKeyDown / onExit）
 * - SlashMenu 通过 expose 提供 imperative API（updateQuery / onKeyDown）
 *
 * 与 BlockCommandsExtension 不同，这里不是注册命令而是**注册一个 Suggestion plugin**。
 */

export const SlashExtension = Extension.create({
  name: "slashCommand",

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        // 仅在行首或空白后触发，避免敲网址时误触
        startOfLine: false,
        allowSpaces: false,
        // 行内场景：char 后空格立即结束 suggestion
        pluginKey: new PluginKey("slashSuggestion"),

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

              // mount 后立即把当前 query 推进去
              setTimeout(() => {
                (menuRef as any)?.updateQuery(props.query);
              }, 0);
            },

            onUpdate: (props: SuggestionProps) => {
              (menuRef as any)?.updateQuery(props.query);
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

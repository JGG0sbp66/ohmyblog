// src/views/admin/components/posts/editor/content/menus/handle/handle-menu-groups.ts
import type { BlockCommandId } from "../block-commands";

/**
 * handle 弹窗菜单的分类配置（单一真源）
 *
 * 与 block-commands 的 `group`（text/list/embed，气泡菜单专用）刻意解耦：
 * handle 有自己的分类语义（基础 / 常用 / 列表），两者各管各的。
 *
 * 菜单项有两种：
 * - command —— 普通块命令，走 block-commands 注册表（按 id 取）
 * - table   —— 表格，特殊项，走带网格弹层的 HandleTableMenuItem
 *
 * 显示顺序 = 数组顺序；新增项 / 新增组只改本文件。
 */
export type HandleMenuEntry =
  | { type: "command"; id: BlockCommandId }
  | { type: "table" };

export interface HandleMenuGroup {
  /** i18n key，相对 views.admin.PostEditor.content.handleMenu.groups */
  labelKey: string;
  /** 组内布局：基础块用 grid（紧凑纯 icon），其余组用 list（icon + 文字，仿飞书） */
  layout: "grid" | "list";
  /** grid 模式列数（仅 layout="grid" 生效），缺省由 CategoryMenu 默认 4 */
  cols?: number;
  entries: HandleMenuEntry[];
}

export const HANDLE_MENU_GROUPS: readonly HandleMenuGroup[] = [
  {
    labelKey: "basic",
    layout: "grid",
    cols: 5,
    entries: [
      { type: "command", id: "paragraph" },
      { type: "command", id: "heading1" },
      { type: "command", id: "heading2" },
      { type: "command", id: "heading3" },
      { type: "command", id: "codeBlock" },
      { type: "command", id: "quote" },
      { type: "command", id: "horizontalRule" },
    ],
  },
  {
    labelKey: "common",
    layout: "list",
    entries: [{ type: "table" }],
  },
  {
    labelKey: "list",
    layout: "list",
    entries: [
      { type: "command", id: "bulletList" },
      { type: "command", id: "orderedList" },
      { type: "command", id: "taskList" },
    ],
  },
];

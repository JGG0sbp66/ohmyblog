// src/views/admin/components/posts/editor/content/menus/slash/slash-commands.ts
import type { Editor, Range } from "@tiptap/core";
import type { Component } from "vue";
import { Eraser } from "lucide-vue-next";
import { RiTableView } from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";
import {
  BLOCK_COMMANDS,
  TABLE_ICON_COLOR,
  type BlockCommand,
  type BlockCommandId,
} from "../block-commands";

/**
 * Slash 菜单命令模型
 *
 * 比 BlockCommand 多两件事：
 * - run 接收 range：先 deleteRange 删掉 "/foo"，再执行命令
 * - searchTerms：除文案外额外可被搜索的关键词（"h1" / "标题" / "list"）
 */
export interface SlashCommand {
  id: string;
  /** i18n key fragment（块命令复用 blockCommands；slash 专属用 slashCommands） */
  labelKey: string;
  /** true 表示走 slashCommands.{labelKey}.label，false 走 blockCommands.{labelKey}.tooltip 第一行 */
  isSlashOnly: boolean;
  icon: Component;
  /** 图标语义色（Tailwind text-* 类）；缺省则继承文字色（如清除格式走 danger 红） */
  color?: string;
  searchTerms: string[];
  run: (editor: Editor, range: Range) => void;
}

/** 把现有 BlockCommand 包装成 SlashCommand：先删 slash 文本再执行 */
const fromBlockCommand = (
  block: BlockCommand,
  searchTerms: string[],
): SlashCommand => ({
  id: block.id,
  labelKey: block.labelKey,
  isSlashOnly: false,
  icon: block.icon,
  color: block.color,
  searchTerms,
  run: (editor, range) => {
    editor.chain().focus().deleteRange(range).run();
    block.run(editor);
  },
});

const blockById = (id: BlockCommandId): BlockCommand => {
  const cmd = BLOCK_COMMANDS.find((c) => c.id === id);
  if (!cmd) throw new Error(`block command "${id}" not found`);
  return cmd;
};

/**
 * SlashMenu 命令分组（顺序即菜单显示顺序，与 handle 块菜单一致：基础 / 常用 / 列表）
 *
 * - 基础：正文 / H1-H3 / 代码块 / 引用 / 分割线
 * - 常用：表格（slash 直插 2×3）
 * - 列表：无序 / 有序 / 待办
 * - 清除格式：slash 专属的破坏性操作，单独成「无标题 + 红色」组
 *   （CategoryMenu 对无标题组自动加分隔线，danger 走红色样式，仿「删除表格」）
 */
export interface SlashGroup {
  /**
   * i18n key fragment，相对 views.admin.PostEditor.content.slashMenu.groups。
   * 省略表示无标题组（如末尾的清除格式组）。
   */
  labelKey?: string;
  /** 整组标记为破坏性（红色），用于清除格式这类项 */
  danger?: boolean;
  commands: SlashCommand[];
}

const TABLE_COMMAND: SlashCommand = {
  id: "table",
  labelKey: "table",
  isSlashOnly: true,
  icon: RiTableView,
  color: TABLE_ICON_COLOR,
  searchTerms: ["table", "表格", "biaoge", "grid"],
  run: (editor, range) => {
    // slash 是键盘流：直接插默认 2 行 3 列（首行表头）。
    // 自定义尺寸走左侧 "+" floating handle 的网格选择器。
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertTable({ rows: 2, cols: 3, withHeaderRow: false })
      .run();
  },
};

const CLEAR_FORMATTING_COMMAND: SlashCommand = {
  id: "clearFormatting",
  labelKey: "clearFormatting",
  isSlashOnly: true,
  icon: Eraser,
  searchTerms: ["clearFormatting", "clear", "清除", "remove"],
  run: (editor, range) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .clearNodes()
      .unsetAllMarks()
      .run();
  },
};

export const SLASH_GROUPS: readonly SlashGroup[] = [
  {
    labelKey: "basic",
    commands: [
      fromBlockCommand(blockById("paragraph"), ["paragraph", "正文", "p"]),
      fromBlockCommand(blockById("heading1"), ["heading1", "h1", "一级标题"]),
      fromBlockCommand(blockById("heading2"), ["heading2", "h2", "二级标题"]),
      fromBlockCommand(blockById("heading3"), ["heading3", "h3", "三级标题"]),
      fromBlockCommand(blockById("codeBlock"), ["codeBlock", "code", "代码块"]),
      fromBlockCommand(blockById("quote"), ["quote", "blockquote", "引用"]),
      fromBlockCommand(blockById("horizontalRule"), [
        "horizontalRule",
        "hr",
        "divider",
        "分割线",
      ]),
    ],
  },
  {
    labelKey: "common",
    commands: [TABLE_COMMAND],
  },
  {
    labelKey: "list",
    commands: [
      fromBlockCommand(blockById("bulletList"), [
        "bulletList",
        "ul",
        "无序列表",
        "list",
      ]),
      fromBlockCommand(blockById("orderedList"), [
        "orderedList",
        "ol",
        "有序列表",
        "1.",
      ]),
      fromBlockCommand(blockById("taskList"), [
        "taskList",
        "todo",
        "task",
        "待办",
        "任务",
        "checklist",
        "[]",
      ]),
    ],
  },
  {
    // 无标题 + 红色：破坏性操作单独成组，仿「删除表格」
    danger: true,
    commands: [CLEAR_FORMATTING_COMMAND],
  },
];

/** 过滤后的分组（结构同 SlashGroup，commands 为命中项） */
export interface FilteredSlashGroup {
  labelKey?: string;
  danger?: boolean;
  commands: SlashCommand[];
}

/**
 * 按 query 过滤分组：每组保留 label / searchTerms 命中的命令，丢弃空组。
 * 组内/组间顺序即键盘导航的扁平顺序（见 SlashMenu.flatItems）。
 */
export const filterSlashGroups = (
  query: string,
  labelOf: (cmd: SlashCommand) => string,
): FilteredSlashGroup[] => {
  const q = query.trim().toLowerCase();
  return SLASH_GROUPS.map((group) => ({
    labelKey: group.labelKey,
    danger: group.danger,
    commands: q
      ? group.commands.filter((cmd) => {
          const haystack = [labelOf(cmd), ...cmd.searchTerms]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
      : [...group.commands],
  })).filter((group) => group.commands.length > 0);
};

/**
 * useSlashI18n — 取 SlashMenu 文案
 *
 * 文案策略（不引入新 i18n key）：
 * - 块命令（h1 / list / codeBlock / hr 等）：复用 blockCommands.{labelKey}.tooltip
 *   并取换行前的第一行（"一级标题\nmarkdown:# 空格" → "一级标题"）
 * - slash 专属（clearFormatting）：走 slashCommands.{labelKey}.label
 */
export const useSlashI18n = () => {
  const { t } = useLang();
  const labelOf = (cmd: SlashCommand): string => {
    if (cmd.isSlashOnly) {
      return t(
        `views.admin.PostEditor.content.slashCommands.${cmd.labelKey}.label`,
      );
    }
    const tooltip = t(
      `views.admin.PostEditor.content.blockCommands.${cmd.labelKey}.tooltip`,
    );
    return tooltip.split("\n")[0] ?? tooltip;
  };
  return { labelOf };
};

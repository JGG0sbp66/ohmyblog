// src/views/admin/components/posts/editor/content/menus/slash/slash-commands.ts
import type { Editor, Range } from "@tiptap/core";
import type { Component } from "vue";
import { Eraser, Table } from "lucide-vue-next";
import { useLang } from "@/composables/lang.hook";
import {
  BLOCK_COMMANDS,
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
 * SlashMenu 命令列表（顺序即菜单显示顺序）
 *
 * 来源：
 * - 全部块命令（paragraph / h1-3 / lists / codeBlock / quote / hr）
 *   → 直接从 BLOCK_COMMANDS 复用，统一文案与图标
 * - slash 专属：clearFormatting（"清除格式"在块命令注册表里没意义，仅 slash 用）
 */
export const SLASH_COMMANDS: readonly SlashCommand[] = [
  fromBlockCommand(blockById("paragraph"), ["paragraph", "正文", "p"]),
  fromBlockCommand(blockById("heading1"), ["heading1", "h1", "一级标题"]),
  fromBlockCommand(blockById("heading2"), ["heading2", "h2", "二级标题"]),
  fromBlockCommand(blockById("heading3"), ["heading3", "h3", "三级标题"]),
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
  fromBlockCommand(blockById("codeBlock"), ["codeBlock", "code", "代码块"]),
  fromBlockCommand(blockById("quote"), ["quote", "blockquote", "引用"]),
  fromBlockCommand(blockById("horizontalRule"), [
    "horizontalRule",
    "hr",
    "divider",
    "分割线",
  ]),
  {
    id: "table",
    labelKey: "table",
    isSlashOnly: true,
    icon: Table,
    searchTerms: ["table", "表格", "biaoge", "grid"],
    run: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
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
  },
];

/**
 * 过滤命令：query 匹配 label / searchTerms 任一即保留
 */
export const filterSlashCommands = (
  query: string,
  labelOf: (cmd: SlashCommand) => string,
): SlashCommand[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [...SLASH_COMMANDS];

  return SLASH_COMMANDS.filter((cmd) => {
    const haystack = [labelOf(cmd), ...cmd.searchTerms].join(" ").toLowerCase();
    return haystack.includes(q);
  });
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

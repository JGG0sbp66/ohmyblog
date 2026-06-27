// src/views/admin/components/posts/editor/content/menus/block-commands.ts
import type { Editor } from "@tiptap/core";
import type { Component } from "vue";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Code2,
  Minus,
} from "lucide-vue-next";
import {
  RiDoubleQuotesL,
  RiListCheck3,
  RiListOrdered,
  RiListUnordered,
} from "@remixicon/vue";
import { useLang } from "@/composables/lang.hook";

/**
 * 编辑器块命令注册表（菜单单一真源）
 *
 * 服务对象：BubbleBlockSection / HandleBlockMenu / SlashMenu。
 * 不放在全局 composables/，是因为它**只服务于本目录下的菜单组件**，
 * 不属于跨模块复用的能力，与消费方共住更便于维护。
 *
 * 文案策略：
 * - label   : 短文本（"H1"/"正文"），用于横排按钮（不能含 \n，否则撑开高度）
 * - tooltip : 长文本（"一级标题\nmarkdown:# 空格"），用于悬浮提示（多行 OK）
 * 两者不能合并：见 i18n blockCommands.* 的 { label, tooltip } 结构。
 *
 * 标题级别决策：仅暴露 H1-H3。博客场景三层结构足以表达大多数文章；
 * H4-H6 在 Tiptap 内核仍然支持（粘贴 markdown / Ctrl+Alt+4-6 仍生效），
 * 只是不在菜单露出，避免选项过多。
 */

export type BlockCommandGroup = "text" | "list" | "embed";

export interface BlockCommand {
  /** 唯一标识，菜单按 id 挑选子集 */
  id: BlockCommandId;
  /** i18n 文案 key，相对 views.admin.PostEditor.content.blockCommands */
  labelKey: string;
  icon: Component;
  /** 图标语义色（Tailwind text-* 类，含 dark: 变体）；菜单按类别上色用 */
  color: string;
  group: BlockCommandGroup;
  /** 当前光标是否处于该块内 */
  isActive: (e: Editor) => boolean;
  /** 执行命令 */
  run: (e: Editor) => void;
}

export type BlockCommandId =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "codeBlock"
  | "quote"
  | "horizontalRule";

/**
 * 切换光标所在列表项的列表类型。
 * 原理：把当前 listItem lift 出列表 → toggle 包回新类型。
 * 已是目标类型则不操作；不在列表中则直接 toggle。
 */
const switchListType = (e: Editor, target: "bulletList" | "orderedList") => {
  const { $from } = e.state.selection;
  let currentListType: string | null = null;
  let inListItem = false;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === "listItem") inListItem = true;
    if (node.type.name === "bulletList" || node.type.name === "orderedList") {
      currentListType = node.type.name;
      break;
    }
  }
  if (currentListType === target) return;
  if (inListItem && currentListType !== null) {
    const chain = e.chain().focus().liftListItem("listItem");
    if (target === "bulletList") chain.toggleBulletList().run();
    else chain.toggleOrderedList().run();
    return;
  }
  if (target === "bulletList") e.chain().focus().toggleBulletList().run();
  else e.chain().focus().toggleOrderedList().run();
};

/** 标题命令工厂：减少重复 */
const headingCommand = (level: 1 | 2 | 3, icon: Component): BlockCommand => ({
  id: `heading${level}` as BlockCommandId,
  labelKey: `heading${level}`,
  icon,
  color: "text-blue-500 dark:text-blue-400",
  group: "text",
  isActive: (e) => e.isActive("heading", { level }),
  run: (e) => e.chain().focus().toggleHeading({ level }).run(),
});

/** 全部块命令（声明式，单一真源） */
export const BLOCK_COMMANDS: readonly BlockCommand[] = [
  {
    id: "paragraph",
    labelKey: "paragraph",
    icon: Type,
    color: "text-slate-500 dark:text-slate-400",
    group: "text",
    isActive: (e) => e.isActive("paragraph"),
    run: (e) => e.chain().focus().setParagraph().run(),
  },
  headingCommand(1, Heading1),
  headingCommand(2, Heading2),
  headingCommand(3, Heading3),
  {
    id: "bulletList",
    labelKey: "bulletList",
    icon: RiListUnordered,
    color: "text-violet-500 dark:text-violet-400",
    group: "list",
    isActive: (e) => e.isActive("bulletList"),
    run: (e) => switchListType(e, "bulletList"),
  },
  {
    id: "orderedList",
    labelKey: "orderedList",
    icon: RiListOrdered,
    color: "text-violet-500 dark:text-violet-400",
    group: "list",
    isActive: (e) => e.isActive("orderedList"),
    run: (e) => switchListType(e, "orderedList"),
  },
  {
    // 任务列表：和 bullet/ordered 是平级 toggle，命令底层会自动处理 lift 嵌套
    id: "taskList",
    labelKey: "taskList",
    icon: RiListCheck3,
    color: "text-violet-500 dark:text-violet-400",
    group: "list",
    isActive: (e) => e.isActive("taskList"),
    run: (e) => e.chain().focus().toggleTaskList().run(),
  },
  {
    id: "codeBlock",
    labelKey: "codeBlock",
    icon: Code2,
    color: "text-emerald-500 dark:text-emerald-400",
    group: "embed",
    isActive: (e) => e.isActive("codeBlock"),
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "quote",
    labelKey: "quote",
    icon: RiDoubleQuotesL,
    color: "text-amber-500 dark:text-amber-400",
    group: "embed",
    isActive: (e) => e.isActive("blockquote"),
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    // 分割线没有"激活态"概念（不是包裹光标的容器节点），isActive 永远 false
    id: "horizontalRule",
    labelKey: "horizontalRule",
    icon: Minus,
    color: "text-orange-500 dark:text-orange-400",
    group: "embed",
    isActive: () => false,
    run: (e) => e.chain().focus().setHorizontalRule().run(),
  },
];

const COMMAND_BY_ID = new Map(BLOCK_COMMANDS.map((c) => [c.id, c]));

/**
 * useBlockCommands — 在组件中消费块命令注册表
 *
 * @param ids 可选；指定则只返回这些 id 的命令（按指定顺序），不传返回全部
 *
 * 返回：
 * - commands  : 命令数组
 * - labelOf   : 短文本（行按钮用，单行）
 * - tooltipOf : 长文本（悬浮提示用，可含换行 / 快捷键说明）
 * - findActive: 当前编辑器中处于激活态的第一个命令（用于显示当前块类型 icon）
 */
export const useBlockCommands = (ids?: readonly BlockCommandId[]) => {
  const { t } = useLang();

  const commands: BlockCommand[] = ids
    ? ids
        .map((id) => COMMAND_BY_ID.get(id))
        .filter((c): c is BlockCommand => Boolean(c))
    : [...BLOCK_COMMANDS];

  const labelOf = (cmd: BlockCommand) =>
    t(`views.admin.PostEditor.content.blockCommands.${cmd.labelKey}.label`);

  const tooltipOf = (cmd: BlockCommand) =>
    t(`views.admin.PostEditor.content.blockCommands.${cmd.labelKey}.tooltip`);

  const findActive = (e: Editor): BlockCommand | undefined =>
    commands.find((c) => c.isActive(e));

  return { commands, labelOf, tooltipOf, findActive };
};

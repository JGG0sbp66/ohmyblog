// src/views/admin/components/posts/editor/content/menus/mobile/mobile-toolbar-items.ts
import type { Editor } from "@tiptap/core";
import type { Component } from "vue";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Redo2,
  Strikethrough,
  Trash2,
  Underline,
  Undo2,
} from "lucide-vue-next";
import {
  RiDeleteColumn,
  RiDeleteRow,
  RiInsertColumnRight,
  RiInsertRowBottom,
  RiLayoutTopLine,
  RiMergeCellsHorizontal,
  RiSplitCellsHorizontal,
} from "@remixicon/vue";
import { BLOCK_COMMANDS, type BlockCommandId } from "../block-commands";

/**
 * 移动端键盘工具条的条目注册表（单一真源）
 *
 * 桌面端的三件套里，气泡菜单和左侧悬浮手柄都是 hover 驱动的，触屏上根本不触发；
 * `/` 命令则要求先切到符号键盘。这条常驻工具条是它们在移动端的替代品，因此
 * 覆盖面要对齐三者的并集，而不是只搬气泡菜单那一份。
 *
 * 声明式的原因和 block-commands.ts 一致：条目多、分段多，写成模板会让 .vue 里
 * 二十几个结构雷同的按钮盖住真正的布局逻辑。这里只描述「有哪些按钮、按什么分段、
 * 每个按钮怎么执行」，渲染与滚动交给 MobileEditorToolbar.vue。
 *
 * 块类型段直接引用 BLOCK_COMMANDS，不重复定义命令体——H1/列表/引用/代码块
 * 在气泡菜单、handle 菜单、slash 菜单里已经是同一份实现，工具条只是第四个消费方。
 */

export interface ToolbarItem {
  id: string;
  icon: Component;
  /** i18n 完整 key（不同段落的文案分散在 bubbleMenu / blockCommands / tableMenu 下） */
  labelKey: string;
  /** 高亮态；缺省表示该操作没有「已应用」的概念（如撤销、插入行） */
  isActive?: (e: Editor) => boolean;
  /** 置灰；缺省视为始终可用 */
  isDisabled?: (e: Editor) => boolean;
  /** 破坏性操作，渲染为红色 */
  danger?: boolean;
  run: (e: Editor) => void;
}

export interface ToolbarSegment {
  id: string;
  /**
   * 该段是否出现。缺省为常驻。
   * 表格段只在光标落进单元格时出现——这是「上下文工具条」的核心：
   * 屏幕宽度有限，与当前位置无关的按钮不该占用横向滚动距离。
   */
  show?: (e: Editor) => boolean;
  items: ToolbarItem[];
}

/**
 * 把 BLOCK_COMMANDS 里的块命令包成工具条条目。
 *
 * 文案取 tooltip 而不是 label：这里是纯图标按钮，文案只会进 aria-label，
 * label 那份是给横排按钮用的极短文本（"H1"）——念出来没有信息量，
 * tooltip 的首行才是完整名称（"一级标题"）。
 */
const fromBlockCommand = (id: BlockCommandId): ToolbarItem => {
  const cmd = BLOCK_COMMANDS.find((c) => c.id === id);
  if (!cmd) throw new Error(`block command "${id}" not found`);
  return {
    id: cmd.id,
    icon: cmd.icon,
    labelKey: `views.admin.PostEditor.content.blockCommands.${cmd.labelKey}.tooltip`,
    isActive: (e) => cmd.isActive(e),
    run: (e) => cmd.run(e),
  };
};

/** 行内格式条目工厂：这一段的五个按钮结构完全一致，只差 mark 名与图标 */
const markItem = (
  name: "bold" | "italic" | "underline" | "strike" | "code",
  icon: Component,
  run: (e: Editor) => void,
): ToolbarItem => ({
  id: name,
  icon,
  labelKey: `views.admin.PostEditor.content.bubbleMenu.${name}`,
  isActive: (e) => e.isActive(name),
  run,
});

/** 对齐条目工厂 */
const alignItem = (
  align: "left" | "center" | "right",
  icon: Component,
  labelKey: string,
): ToolbarItem => ({
  id: `align-${align}`,
  icon,
  labelKey,
  isActive: (e) => e.isActive({ textAlign: align }),
  run: (e) => e.chain().focus().setTextAlign(align).run(),
});

/** 光标是否落在表格单元格内（含跨格选区，后者 $anchor 同样在 cell 里） */
const isInTable = (e: Editor): boolean => {
  const { $anchor } = e.state.selection;
  for (let d = $anchor.depth; d > 0; d--) {
    const name = $anchor.node(d).type.name;
    if (name === "tableCell" || name === "tableHeader") return true;
  }
  return false;
};

export const TOOLBAR_SEGMENTS: readonly ToolbarSegment[] = [
  {
    // 移动端没有 Ctrl+Z，撤销/重做必须给按钮——排在最前是因为它是打字时
    // 最高频的纠错动作，不该让用户先横向滚动才够得着
    id: "history",
    items: [
      {
        id: "undo",
        icon: Undo2,
        labelKey: "views.admin.PostEditor.content.mobileToolbar.undo",
        isDisabled: (e) => !e.can().undo(),
        run: (e) => e.chain().focus().undo().run(),
      },
      {
        id: "redo",
        icon: Redo2,
        labelKey: "views.admin.PostEditor.content.mobileToolbar.redo",
        isDisabled: (e) => !e.can().redo(),
        run: (e) => e.chain().focus().redo().run(),
      },
    ],
  },
  {
    id: "format",
    items: [
      markItem("bold", Bold, (e) => e.chain().focus().toggleBold().run()),
      markItem("italic", Italic, (e) => e.chain().focus().toggleItalic().run()),
      markItem("underline", Underline, (e) =>
        e.chain().focus().toggleUnderline().run(),
      ),
      markItem("strike", Strikethrough, (e) =>
        e.chain().focus().toggleStrike().run(),
      ),
      markItem("code", Code, (e) => e.chain().focus().toggleCode().run()),
    ],
  },
  {
    id: "block",
    items: [
      fromBlockCommand("heading1"),
      fromBlockCommand("heading2"),
      fromBlockCommand("heading3"),
      fromBlockCommand("bulletList"),
      fromBlockCommand("orderedList"),
      fromBlockCommand("taskList"),
      fromBlockCommand("quote"),
      fromBlockCommand("codeBlock"),
    ],
  },
  {
    id: "align",
    items: [
      {
        id: "outdent",
        icon: IndentDecrease,
        labelKey: "views.admin.PostEditor.content.bubbleMenu.outdent",
        isDisabled: (e) => !e.can().outdent(),
        run: (e) => e.chain().focus().outdent().run(),
      },
      {
        id: "indent",
        icon: IndentIncrease,
        labelKey: "views.admin.PostEditor.content.bubbleMenu.indent",
        isDisabled: (e) => !e.can().indent(),
        run: (e) => e.chain().focus().indent().run(),
      },
      alignItem(
        "left",
        AlignLeft,
        "views.admin.PostEditor.content.bubbleMenu.alignLeft",
      ),
      alignItem(
        "center",
        AlignCenter,
        "views.admin.PostEditor.content.bubbleMenu.alignCenter",
      ),
      alignItem(
        "right",
        AlignRight,
        "views.admin.PostEditor.content.bubbleMenu.alignRight",
      ),
    ],
  },
  {
    /**
     * 表格段——桌面端这些操作全在 PostEditorTableControls 的行列把手上，
     * 而那套控件是 hover + mousedown 驱动的，触屏上完全够不着（把手条只有 8px 宽，
     * 「+」插入点默认 opacity:0）。移动端整组不渲染，能力平移到这里。
     *
     * 只提供「相对当前单元格」的增删：没有行列把手就没有「选中整行」的入口，
     * addRowAfter / deleteRow 这类以光标为参照的命令才是触屏上说得通的语义。
     */
    id: "table",
    show: isInTable,
    items: [
      {
        id: "table-add-row",
        icon: RiInsertRowBottom,
        labelKey: "views.admin.PostEditor.content.mobileToolbar.addRowAfter",
        run: (e) => e.chain().focus().addRowAfter().run(),
      },
      {
        id: "table-add-col",
        icon: RiInsertColumnRight,
        labelKey: "views.admin.PostEditor.content.mobileToolbar.addColumnAfter",
        run: (e) => e.chain().focus().addColumnAfter().run(),
      },
      {
        // 合并 / 拆分共用一个位置：两者互斥，同时摆出来只会有一个可点
        id: "table-merge",
        icon: RiMergeCellsHorizontal,
        labelKey: "views.admin.PostEditor.content.tableMenu.mergeCells",
        isDisabled: (e) => !e.can().mergeOrSplit(),
        run: (e) => e.chain().focus().mergeOrSplit().run(),
      },
      {
        id: "table-split",
        icon: RiSplitCellsHorizontal,
        labelKey: "views.admin.PostEditor.content.tableMenu.splitCell",
        isDisabled: (e) => !e.can().splitCell(),
        run: (e) => e.chain().focus().splitCell().run(),
      },
      {
        id: "table-header-row",
        icon: RiLayoutTopLine,
        labelKey: "views.admin.PostEditor.content.tableMenu.setHeader",
        run: (e) => e.chain().focus().toggleHeaderRow().run(),
      },
      {
        id: "table-del-row",
        icon: RiDeleteRow,
        labelKey: "views.admin.PostEditor.content.tableMenu.deleteRow",
        danger: true,
        run: (e) => e.chain().focus().deleteRow().run(),
      },
      {
        id: "table-del-col",
        icon: RiDeleteColumn,
        labelKey: "views.admin.PostEditor.content.tableMenu.deleteColumn",
        danger: true,
        run: (e) => e.chain().focus().deleteColumn().run(),
      },
      {
        id: "table-delete",
        icon: Trash2,
        labelKey: "views.admin.PostEditor.content.tableMenu.deleteTable",
        danger: true,
        run: (e) => e.chain().focus().deleteTable().run(),
      },
    ],
  },
];

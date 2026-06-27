// src/views/admin/components/posts/editor/content/menus/category-menu/category-menu.types.ts
import type { Component } from "vue";

/**
 * CategoryMenu 数据契约（菜单内容的单一真源）
 *
 * 以表格 icon 下拉菜单为蓝图抽象：白底圆角卡片内，按「分组」组织条目，
 * 每组可带标题，组内可选两种布局：
 * - "list"：icon + 文字逐行（默认），仿飞书下拉项，复用 ButtonSecondary。
 * - "grid"：纯 icon 横向网格（紧凑），复用带 Tooltip 的 IconTipButton。
 *
 * 组件只负责布局与样式；具体动作（cut/copy/delete…）由调用方塞进 item.onSelect。
 */

export type MenuGroupLayout = "grid" | "list";

export interface MenuItem {
  /** 列表内唯一 key */
  key: string;
  /** 图标组件（lucide / remixicon 等） */
  icon?: Component;
  /** 图标语义色（Tailwind text-* 类）；缺省则继承按钮文字色 */
  iconClass?: string;
  /** 文字：list 模式显示在图标右侧；grid 模式作为 tooltip 兜底 */
  label?: string;
  /** grid 模式 hover 提示（缺省时回退到 label） */
  tooltip?: string;
  /** 激活态高亮 */
  active?: boolean;
  /** 危险操作（红色，如「删除整表」） */
  danger?: boolean;
  /** 禁用态 */
  disabled?: boolean;
  /**
   * 具名插槽渲染：设置后，本项不走默认按钮，而是渲染 CategoryMenu 上同名的
   * 作用域插槽（用于带子弹层/子菜单的特殊项，由插槽自行渲染整行触发器与箭头，
   * 如表格尺寸选择器）。插槽接收 { item }。
   */
  slot?: string;
  /** 点击回调；组件同时会 emit("select", item) */
  onSelect?: () => void;
}

export interface MenuGroup {
  /** 分组唯一 key */
  key: string;
  /** 组标题，省略则不渲染标题行（如表格菜单的无标题分组） */
  title?: string;
  /** 组内布局，默认 "list" */
  layout?: MenuGroupLayout;
  /** grid 模式列数，默认 4 */
  cols?: number;
  items: MenuItem[];
}

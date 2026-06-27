// src/views/admin/components/posts/editor/content/menus/ordered-list/composables/use-ordered-list-menu.ts
import type { Editor } from "@tiptap/core";
import { Fragment } from "@tiptap/pm/model";

/**
 * useOrderedListMenu — 有序列表「起始编号」相关命令
 *
 * 全部按「目标 orderedList 的文档位置 listPos」+「被点项序号 index」操作，
 * 而非当前选区——菜单作用于鼠标点击的那一项，可能并不含光标。
 *
 * - listStart(listPos)            : 该列表的 start
 * - itemNumber(listPos, index)    : 第 index 项当前显示的编号（= start + index）
 * - prevEndNumber(listPos)        : 前一张同级 orderedList 的末尾编号；无则 null
 * - canContinue(listPos)          : 是否存在可接续的前一张 orderedList
 * - setStart(listPos, n)          : 设整张列表 start（继续编号用）
 * - continueFromPrev(listPos)     : 接续前一张 orderedList 末尾编号
 * - restartAt(listPos, index, n)  : 从第 index 项「重开编号」——在该项处拆表，
 *   前半保持原 start，后半（含该项）成为新列表 start=n。index=0 即整表重设 start。
 */
export const useOrderedListMenu = (editor: Editor) => {
  const olAt = (listPos: number) => {
    const node = editor.state.doc.nodeAt(listPos);
    return node && node.type.name === "orderedList" ? node : null;
  };

  const listStart = (listPos: number): number => {
    const n = olAt(listPos);
    return n ? ((n.attrs.start as number) ?? 1) : 1;
  };

  const itemNumber = (listPos: number, index: number): number =>
    listStart(listPos) + index;

  const prevEndNumber = (listPos: number): number | null => {
    const { doc } = editor.state;
    if (!olAt(listPos)) return null;
    const $pos = doc.resolve(listPos);
    const parent = $pos.parent;
    const index = $pos.index();
    for (let i = index - 1; i >= 0; i--) {
      const sib = parent.child(i);
      if (sib.type.name === "orderedList") {
        const start = (sib.attrs.start as number) ?? 1;
        return start + sib.childCount - 1;
      }
    }
    return null;
  };

  const canContinue = (listPos: number): boolean =>
    prevEndNumber(listPos) !== null;

  /** 设置整张列表的起始编号 */
  const setStart = (listPos: number, start: number) => {
    const node = olAt(listPos);
    if (!node) return;
    const next = Math.max(1, Math.floor(start) || 1);
    const { state, view } = editor;
    view.dispatch(
      state.tr.setNodeMarkup(listPos, undefined, {
        ...node.attrs,
        start: next,
      }),
    );
  };

  /**
   * 从第 index 项重开编号：在该项处把列表拆成两张。
   * - 前半 [0, index)：保持原 attrs（start 不变）
   * - 后半 [index, n)：新列表，start = newStart
   * index=0 时前半为空 → 等价于把整表 start 设为 newStart。
   */
  const restartAt = (listPos: number, index: number, newStart: number) => {
    const ol = olAt(listPos);
    if (!ol) return;
    const next = Math.max(1, Math.floor(newStart) || 1);

    const before: (typeof ol)[] = [];
    const after: (typeof ol)[] = [];
    ol.forEach((child, _offset, i) => (i < index ? before : after).push(child));
    if (after.length === 0) return;

    const nodes = [];
    if (before.length > 0) {
      nodes.push(ol.type.create({ ...ol.attrs }, Fragment.fromArray(before)));
    }
    nodes.push(
      ol.type.create({ ...ol.attrs, start: next }, Fragment.fromArray(after)),
    );

    const { state, view } = editor;
    view.dispatch(state.tr.replaceWith(listPos, listPos + ol.nodeSize, nodes));
  };

  /** 接续前一张 orderedList 的末尾编号（仅对列表首项有意义） */
  const continueFromPrev = (listPos: number) => {
    const prevEnd = prevEndNumber(listPos);
    if (prevEnd === null) return;
    setStart(listPos, prevEnd + 1);
  };

  return {
    listStart,
    itemNumber,
    prevEndNumber,
    canContinue,
    setStart,
    restartAt,
    continueFromPrev,
  };
};

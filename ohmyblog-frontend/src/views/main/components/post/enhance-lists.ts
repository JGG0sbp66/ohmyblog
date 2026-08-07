// src/views/main/components/post/enhance-lists.ts
//
// 阅读端列表增强：给 contentHtml 里朴素的 <ul> / <ol> 补上 data-ul-mod /
// data-ol-mod，并让 <ol start> 真正生效。
//
// 为什么读端需要这一步：
//   lists.css 把 .tiptap ul / ol 设成 list-style: none，标记符改由
//   `[data-ul-mod="0|1|2"] > li > :first-child::before` 这组规则自绘
//   （• ◦ ▪ / 1. a. i. 三层循环）。而这两个属性在后台是 ProseMirror 的
//   node decoration（list-item.extension.ts）——decoration 属于视图层，
//   editor.getHTML() 不会把它序列化进 contentHtml。
//   于是前台的 <ol> / <ul> 身上没有这个属性，::before 一条都匹配不上，
//   列表既没有项目符号也没有序号。这里按同样的规则在读端补回来。
//
// 与后台的一致性：层级取「同类型祖先列表的个数 % 3」，和
//   list-item.extension.ts 里 decorations 的算法逐字对应。
//
// 幂等：重复调用只是重新写一遍同样的属性值，可在 contentHtml 变化后再次执行。

/**
 * 统计某个列表元素往上有多少个同类型（同 tagName）的祖先列表。
 * 对应后台 `$pos.node(d).type.name === node.type.name` 的祖先计数。
 */
function sameTypeAncestorCount(list: Element, root: Element): number {
  let count = 0;
  let parent = list.parentElement;
  while (parent && parent !== root) {
    if (parent.tagName === list.tagName) count++;
    parent = parent.parentElement;
  }
  return count;
}

/**
 * 给容器内所有 ul / ol 补上层级标记属性，并按 start 修正有序列表起始值。
 *
 * @param root 已渲染 contentHtml 的容器元素
 */
export function enhanceLists(root: Element): void {
  for (const list of root.querySelectorAll("ul, ol")) {
    const isOrdered = list.tagName === "OL";
    const mod = sameTypeAncestorCount(list, root) % 3;
    list.setAttribute(isOrdered ? "data-ol-mod" : "data-ul-mod", String(mod));

    if (!isOrdered) continue;

    // <ol start="5"> 在后台由扩展按 start + index 算出真实序号，前台走的是
    // CSS 计数器，默认永远从 1 起。counter-reset 的初值是「第一个 li 之前的值」，
    // 所以要减 1。start 缺省或非法时交回 lists.css 里的 counter-reset
    const start = Number(list.getAttribute("start"));
    if (Number.isFinite(start) && start !== 1) {
      (list as HTMLElement).style.counterReset = `tiptap-counter ${start - 1}`;
    } else {
      (list as HTMLElement).style.removeProperty("counter-reset");
    }
  }
}

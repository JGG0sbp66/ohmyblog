// src/views/main/components/post/toc/extract-headings.ts
import limax from "limax";

/**
 * 从已渲染的正文 DOM 里提取标题，并就地注入锚点 id。
 *
 * 为什么在读端做而不是烘焙进 contentHtml：
 *   contentHtml 同时供 RSS 全文使用，锚点 id 属于「阅读页导航」的运行时产物，
 *   烘焙进去会污染 RSS 的语义。同理见 enhance-code-blocks.ts 的头部注释。
 *
 * 幂等性：v-html 变化会整体重建内部 DOM，每次拿到的都是全新节点，
 * 因此不需要清理上一轮的 id，直接覆盖即可。
 */

export interface TocHeading {
  /** 锚点 id，已写回元素 */
  id: string;
  /** 标题纯文本 */
  text: string;
  /** 1 | 2 | 3 —— css/tiptap/headings.css 只定义了三级 */
  depth: number;
  /** 对应的 DOM 节点，目录靠它取实时位置 */
  el: HTMLHeadingElement;
}

const HEADING_SELECTOR = "h1, h2, h3";

export function extractHeadings(root: HTMLElement): TocHeading[] {
  const nodes = root.querySelectorAll<HTMLHeadingElement>(HEADING_SELECTOR);
  if (nodes.length === 0) return [];

  // slug 出现次数，用于给重名标题加后缀
  const seen = new Map<string, number>();
  const headings: TocHeading[] = [];

  nodes.forEach((el, index) => {
    const text = (el.textContent ?? "").trim();
    if (!text) return;

    // limax 对中文友好（项目里文章 slug 也用它，见 post-editor.hook.ts）；
    // 纯符号/表情标题会得到空串，兜底用序号。
    const base = limax(text) || `heading-${index}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    const id = count === 1 ? base : `${base}-${count}`;

    el.id = id;

    headings.push({
      id,
      text,
      depth: Number(el.tagName.slice(1)),
      el,
    });
  });

  return headings;
}

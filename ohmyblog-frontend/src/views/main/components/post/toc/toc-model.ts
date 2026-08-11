// src/views/main/components/post/toc/toc-model.ts
import type { TocHeading } from "./extract-headings";

/**
 * 把扁平标题表折成「顶层章节 + 子标题」两层。
 *
 * 顶层不是写死的 h1：文章从哪一级起写由作者决定（本站多数文章直接从 h2 开头，
 * 一篇里根本没有 h1），所以顶层 = 全篇出现过的最小 depth。写死 depth===1 会让
 * 这类文章的目录整层塌空。
 *
 * 只折两层，不做任意深度的递归树：正文只允许 h1~h3（见 css/tiptap/headings.css），
 * 而目录默认态只显示顶层、展开后显示其余全部 —— 两层就够表达，多一层递归只是
 * 给渲染和缩进增加分支。
 */
export interface TocSection {
  /** 章节标题在 headings 中的下标 */
  index: number;
  /** 该章节下所有更深层标题的下标（按文档顺序） */
  children: number[];
}

export function buildSections(headings: TocHeading[]): TocSection[] {
  if (headings.length === 0) return [];

  const topDepth = headings.reduce(
    (min, h) => Math.min(min, h.depth),
    Number.POSITIVE_INFINITY,
  );

  const sections: TocSection[] = [];
  headings.forEach((heading, index) => {
    // 首个标题即使不是顶层也要自成一节，否则它会没有归属而被丢弃
    if (heading.depth === topDepth || sections.length === 0) {
      sections.push({ index, children: [] });
    } else {
      sections[sections.length - 1]?.children.push(index);
    }
  });

  return sections;
}

/**
 * 章节的结束边界（下一章节的起始下标）。
 * 末章返回 headings.length，交给调用方用正文末尾兜底。
 */
export function sectionEnd(
  sections: TocSection[],
  order: number,
  total: number,
): number {
  return sections[order + 1]?.index ?? total;
}

// src/composables/code-block/line-numbers.ts
//
// 换行模式下的行号对齐。
//
// 不换行时行号列不需要任何 JS：一个逻辑行恒等于一个视觉行，
// 靠 code-block.css 里 .line-numbers span 的定高 1.5rem 就能对齐（超长行走 pre 的横向滚动）。
//
// 打开换行后这个前提消失：一个逻辑行会软换行成多个视觉行，
// 而行号格子仍只前进一格，于是行号与代码整体错位、长行越长错得越远。
// 修正办法只能是实测——把每个逻辑行「实际渲染了多高」量出来，写回对应行号格子的高度。
//
// 为什么必须实测而不能算：视觉行数取决于容器宽度、字体度量、断词规则、
// 高亮产生的 token 边界，纯计算无法可靠还原，量一次 Range 的高度反而最准。
//
// 两端共用：编辑器 NodeView（CodeBlock.vue）与阅读端（enhance-code-blocks.ts）
// DOM 各写一份，但这套测量逻辑只有一份。

/** 量不到行高时的兜底值（px），对应 code-block.css 的 line-height: 1.5rem */
const FALLBACK_LINE_HEIGHT = 24;

/** 读取代码区的单行行高，供空行与测量失败时兜底 */
function resolveLineHeight(codeEl: HTMLElement): number {
  const raw = getComputedStyle(codeEl).lineHeight;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : FALLBACK_LINE_HEIGHT;
}

/**
 * 把「整个代码文本里的字符下标」映射到具体文本节点内的偏移。
 *
 * 高亮后的 <code> 内部是 span 与文本节点交错的树（hljs-* token），
 * 不能按单一文本节点取偏移，只能遍历累加。
 */
function locateOffset(
  codeEl: HTMLElement,
  offset: number,
): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(codeEl, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  let last: Text | null = null;
  let node = walker.nextNode() as Text | null;

  while (node) {
    const len = node.textContent?.length ?? 0;
    // 用 > 而非 >=：命中边界时优先留在当前节点内，避免落到下一节点的 0 偏移
    if (consumed + len > offset) {
      return { node, offset: offset - consumed };
    }
    consumed += len;
    last = node;
    node = walker.nextNode() as Text | null;
  }

  // offset 落在文本末尾（如最后一行的行尾）：收敛到最后一个文本节点的末端
  if (last) {
    return { node: last, offset: last.textContent?.length ?? 0 };
  }
  return null;
}

/**
 * 数出一个 Range 跨越了几个视觉行。
 *
 * 不能直接拿 boundingRect 的高度当行高倍数：boundingRect 量的是字形盒，
 * 0.875rem 字号下每行只有 18px 而行盒是 24px，6 个视觉行会量成 138 而不是 144 ——
 * 逐行累积这 6px 误差，行号照样会漂。
 *
 * 改为数 getClientRects()：软换行会让每个视觉行各出一个 rect。
 * 高亮把一行切成多个 token（多个 rect）时它们 top 相同，因此按 top 聚类即可，
 * 容差取半个行高，避免不同字体度量的 token 被误判成两行。
 */
function countVisualRows(range: Range, lineHeight: number): number {
  const tops = [...range.getClientRects()]
    .map((rect) => rect.top)
    .sort((a, b) => a - b);
  if (tops.length === 0) return 1; // 空行没有 rect

  let rows = 1;
  let previous = tops[0] as number;
  for (const top of tops.slice(1)) {
    if (top - previous > lineHeight / 2) {
      rows += 1;
      previous = top;
    }
  }
  return rows;
}

/**
 * 逐个逻辑行量出实际渲染高度（px）。
 *
 * 做法：为每一行建一个覆盖该行全部字符的 Range，数出它跨了几个视觉行，
 * 再乘以行高 —— 该行若软换行成 n 个视觉行，高度就是 n 倍行高。
 * 空行没有字符，按单行行高处理。
 *
 * 之所以落到「行数 × 行高」而不是直接用测量到的像素高度：前者与代码区的
 * 行盒推进量严格同源（都是 line-height），逐行累加不会攒出误差。
 *
 * @returns 长度等于逻辑行数的高度数组
 */
export function measureLogicalLineHeights(codeEl: HTMLElement): number[] {
  const lineHeight = resolveLineHeight(codeEl);
  // 与 countCodeLines 保持同一套「末尾隐式换行不计入」的口径
  const raw = codeEl.textContent ?? "";
  const normalized = raw.endsWith("\n") ? raw.slice(0, -1) : raw;
  const lines = normalized.split("\n");

  const heights: number[] = [];
  let cursor = 0;

  for (const line of lines) {
    const start = locateOffset(codeEl, cursor);
    const end = locateOffset(codeEl, cursor + line.length);
    let rows = 1;

    if (start && end) {
      const range = document.createRange();
      try {
        range.setStart(start.node, start.offset);
        range.setEnd(end.node, end.offset);
        rows = countVisualRows(range, lineHeight);
      } catch {
        rows = 1;
      }
    }

    heights.push(rows * lineHeight);
    cursor += line.length + 1; // +1 跳过换行符
  }

  return heights;
}

/**
 * 把实测高度写回行号格子；关闭换行时清掉内联高度、交还给 CSS 定高。
 *
 * @param codeEl        代码文本所在的 <code>
 * @param lineNumbersEl 行号列容器（.line-numbers）
 * @param wrap          当前是否为换行模式
 */
export function syncLineNumberHeights(
  codeEl: HTMLElement | null,
  lineNumbersEl: HTMLElement | null,
  wrap: boolean,
): void {
  if (!codeEl || !lineNumbersEl) return;
  const spans = [...lineNumbersEl.children] as HTMLElement[];

  if (!wrap) {
    for (const span of spans) span.style.removeProperty("height");
    return;
  }

  const heights = measureLogicalLineHeights(codeEl);
  spans.forEach((span, i) => {
    const height = heights[i];
    if (height === undefined) {
      span.style.removeProperty("height");
      return;
    }
    span.style.height = `${height}px`;
  });
}

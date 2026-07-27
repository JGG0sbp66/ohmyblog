// src/views/main/components/post/enhance-code-blocks.ts
//
// 阅读端代码块增强：把 contentHtml 里朴素的
//   <pre><code class="language-xxx">…纯文本…</code></pre>
// 就地重建成与后台编辑器 CodeBlock.vue 一致的 DOM——
// 语法高亮 + 语言图标 header + 行号 + 常驻复制按钮。
//
// 为什么放在读端、而不是烘焙进 contentHtml：
//   contentHtml 同时是 RSS 源（见后端 feed.service），必须保持干净语义（就 <pre><code>）；
//   外壳与高亮纯属「展示层」，只在网页阅读时重建，避免污染订阅源。
//
// 与后台的一致性：高亮语言集、语言图标、行数计算、复制反馈时长全部取自
//   @/composables/code-block —— DOM 各写一份（这边是原生节点、那边是 Vue 模板，
//   无法合并），但逻辑只有一份，不再需要人工对齐。
//
// 幂等：已包裹过的 <pre> 会被跳过，可在 contentHtml 变化后重复调用。

import {
  highlightToHtml,
  resolveLanguageIcon,
  preloadLanguageIcons,
  formatLanguageLabel,
  countCodeLines,
  COPY_FEEDBACK_MS,
} from "@/composables/code-block";

// lucide-vue-next 的 <Copy :size="13" /> / <Check :size="13" /> 等价 SVG 串，
// 保证与编辑器复制按钮的图标逐像素一致。
const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>`;

/** 从 <code class="language-xxx"> 提取语言名；无匹配则返回空串 */
function extractLanguage(code: Element): string {
  const match = code.className.match(/language-([\w-]+)/);
  return match?.[1] ?? "";
}

/** 复制按钮交互：复制正文 → 切到 Check + .copied → 复原（时长与编辑器共用常量） */
function bindCopy(btn: HTMLButtonElement, text: string): void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  btn.addEventListener("click", () => {
    void navigator.clipboard.writeText(text);
    btn.innerHTML = CHECK_ICON;
    btn.classList.add("copied");
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      btn.innerHTML = COPY_ICON;
      btn.classList.remove("copied");
      timer = null;
    }, COPY_FEEDBACK_MS);
  });
}

/**
 * 就地增强单个 <pre>：语法高亮 + 包裹外壳（header 含语言图标与复制按钮、行号列）。
 * 结构与顺序严格对齐 CodeBlock.vue 的模板，配合共用的 code-block.css / syntax.css 呈现一致。
 */
function enhanceOne(pre: HTMLPreElement): void {
  // 幂等：已在容器内的跳过
  if (pre.closest(".code-block-container")) return;
  const code = pre.querySelector("code");
  const parent = pre.parentNode;
  if (!code || !parent) return;

  const language = extractLanguage(code);
  const rawText = code.textContent ?? "";

  // 语法高亮：语言集与编辑器同源（见 composables/code-block/highlight.ts），
  // 产出相同的 hljs-* token 类，由 syntax.css 上色。
  // 语言为空或不在语言集内（含 "text"）时返回 null，保持纯文本，与编辑器行为一致。
  const highlighted = highlightToHtml(rawText, language);
  if (highlighted !== null) {
    code.innerHTML = highlighted;
    code.classList.add("hljs");
  }

  // ── 外壳 ──
  const container = document.createElement("div");
  container.className = "code-block-container";

  // header：左侧语言图标 + 语言名，右侧复制按钮
  const header = document.createElement("div");
  header.className = "code-block-header";

  const langBox = document.createElement("div");
  langBox.className = "code-block-lang";

  const icon = document.createElement("span");
  icon.className = "code-block-lang-icon";
  // 记下语言：图标表异步就绪后要按它回填（见 enhanceCodeBlocks）
  icon.dataset.lang = language;
  icon.innerHTML = resolveLanguageIcon(language);

  // 阅读端语言名是纯展示，直接用 <span>；
  // 后台那侧同位置是可编辑 input + 语言下拉，样式由 code-block.css 统一。
  const langLabel = document.createElement("span");
  langLabel.className = "code-block-lang-input";
  langLabel.textContent = formatLanguageLabel(language || "text");

  langBox.appendChild(icon);
  langBox.appendChild(langLabel);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "code-block-copy-btn";
  copyBtn.setAttribute("aria-label", "Copy code");
  copyBtn.innerHTML = COPY_ICON;
  bindCopy(copyBtn, rawText);

  header.appendChild(langBox);
  header.appendChild(copyBtn);

  // content：行号列 + 原 <pre>
  const content = document.createElement("div");
  content.className = "code-block-content";
  const lineNumbers = document.createElement("div");
  lineNumbers.className = "line-numbers";
  const lines = countCodeLines(rawText);
  for (let i = 1; i <= lines; i++) {
    const span = document.createElement("span");
    span.textContent = String(i);
    lineNumbers.appendChild(span);
  }

  // 就地替换：container 顶替 pre 的位置，再把 pre 移进 content
  parent.replaceChild(container, pre);
  content.appendChild(lineNumbers);
  content.appendChild(pre);
  container.appendChild(header);
  container.appendChild(content);
}

/**
 * 增强 root 内所有代码块。幂等，可重复调用。
 *
 * 图标表是按需加载的（约 23 KB，见 composables/code-block/icons.ts）：
 * 页面没有代码块时一个字节都不拉；有代码块时也不等它 ——
 * 先用兜底图标把外壳和高亮立刻渲染出来，表就绪后再回填真实图标，
 * 避免为了几十 KB 的装饰性资源推迟正文呈现。
 *
 * @param root 承载 v-html 内容的容器元素
 */
export function enhanceCodeBlocks(root: HTMLElement): void {
  const blocks = root.querySelectorAll<HTMLPreElement>("pre");
  if (blocks.length === 0) return;
  blocks.forEach(enhanceOne);

  void preloadLanguageIcons().then(() => {
    root
      .querySelectorAll<HTMLElement>(".code-block-lang-icon[data-lang]")
      .forEach((el) => {
        el.innerHTML = resolveLanguageIcon(el.dataset.lang ?? "");
      });
  });
}

// scripts/gen-code-block-icons.mjs
//
// 生成 src/composables/code-block/icons.generated.ts —— 代码块 header 的语言图标表。
//
// 为什么是「构建期生成 + 产物入库」而不是运行时依赖 Iconify：
//   代码块语言是动态的（lowlight common 37 种，且用户可在下拉里输入任意字符串），
//   unplugin-icons 这类编译期方案要求静态路径、接不了动态语言名；
//   而整包 @iconify-json/vscode-icons 有 1500+ 图标，全量进 bundle 不可接受。
//   这里只抽用得到的那几十个，产出一张纯字符串表，运行时零依赖。
//
// 脚本做了三件手工做不了的事：
//   1. 暗色校正 —— 代码块 header 背景锁死为 oklch(0.17 0.015 250)，
//      部分品牌色（VB/C/Markdown/diff/C++）在其上对比度低于 3.0，几乎看不清。
//      这里在 HSL 空间保持色相与饱和度、只抬明度，直到对比度达标 —— 保住品牌识别度。
//   2. gradient id 占位符化 —— 见下方 UID_TOKEN 注释。
//   3. 语言别名归一 —— php-template→php、python-repl→python 等。
//
// 用法：bun run gen:icons   （产物需一并提交，构建时不联网）

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/composables/code-block/icons.generated.ts",
);

// SVG 内部 id 的占位符。
// vscode-icons 里 python/rust/swift/kotlin/r 用 <linearGradient id="X"> + fill="url(#X)"
// 实现渐变。同一 id 在文档里出现多次时浏览器只认第一个 —— 初次渲染看不出问题
// （多份 def 内容相同），但一旦第一个代码块被移除（编辑器里增删代码块、前台 v-html 重渲染），
// 其余实例的渐变引用就会断掉，图标变成黑块。
// 故这里把 id 替换成占位符，由运行时 resolveLanguageIcon() 换成实例唯一后缀。
const UID_TOKEN = "__UID__";

// 代码块 header 背景：与 css/tiptap/code-block.css 的 .code-block-container 保持一致
const BG_OKLCH = { l: 0.17, c: 0.015, h: 250 };
// 对比度门槛：低于 MIN 触发校正，校正到 TARGET 为止
const MIN_CONTRAST = 3.0;
const TARGET_CONTRAST = 3.6;

/**
 * 语言 → 图标源（`collection:iconName`）。
 * 键取自 lowlight `common` 的语法名（见 composables/code-block/highlight.ts），
 * 未列出的语言在运行时回落到通用图标。
 */
const ICON_SOURCES = {
  arduino: "vscode-icons:file-type-arduino",
  // vscode-icons 没有 shell/bash 图标，借 devicon 的
  bash: "devicon:bash",
  shell: "devicon:bash",
  c: "vscode-icons:file-type-c",
  cpp: "vscode-icons:file-type-cpp",
  csharp: "vscode-icons:file-type-csharp",
  css: "vscode-icons:file-type-css",
  diff: "vscode-icons:file-type-diff",
  go: "vscode-icons:file-type-go",
  graphql: "vscode-icons:file-type-graphql",
  ini: "vscode-icons:file-type-ini",
  java: "vscode-icons:file-type-java",
  javascript: "vscode-icons:file-type-js",
  json: "vscode-icons:file-type-json",
  kotlin: "vscode-icons:file-type-kotlin",
  less: "vscode-icons:file-type-less",
  // GNU Make 无专属图标，用 GNU 标志代替
  makefile: "vscode-icons:file-type-gnu",
  markdown: "vscode-icons:file-type-markdown",
  objectivec: "vscode-icons:file-type-objectivec",
  perl: "vscode-icons:file-type-perl",
  php: "vscode-icons:file-type-php",
  "php-template": "vscode-icons:file-type-php",
  plaintext: "vscode-icons:file-type-text",
  text: "vscode-icons:file-type-text",
  python: "vscode-icons:file-type-python",
  "python-repl": "vscode-icons:file-type-python",
  r: "vscode-icons:file-type-r",
  ruby: "vscode-icons:file-type-ruby",
  rust: "vscode-icons:file-type-rust",
  scss: "vscode-icons:file-type-scss",
  sql: "vscode-icons:file-type-sql",
  swift: "vscode-icons:file-type-swift",
  typescript: "vscode-icons:file-type-typescript",
  vbnet: "vscode-icons:file-type-vb",
  wasm: "vscode-icons:file-type-wasm",
  xml: "vscode-icons:file-type-xml",
  yaml: "vscode-icons:file-type-yaml",
};

// ─── 色彩工具 ────────────────────────────────────────────────────────────────

/** OKLCH → 线性 sRGB（用于精确求出深色背景的相对亮度，而非目测估计） */
function oklchToLinearRgb({ l, c, h }) {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.089484178 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

/** WCAG 相对亮度（输入为线性 RGB 分量） */
const relLuminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** sRGB 分量（0–1，gamma 编码）→ 线性 */
const toLinear = (v) =>
  v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

function hexToRgb(hex) {
  let s = hex.slice(1);
  if (s.length === 3)
    s = s
      .split("")
      .map((ch) => ch + ch)
      .join("");
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
}

const rgbToHex = (rgb) =>
  "#" +
  rgb
    .map((v) =>
      Math.round(Math.max(0, Math.min(1, v)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

function rgbToHsl([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb([h, s, l]) {
  if (s === 0) return [l, l, l];
  const hue = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)];
}

const BG_LUM = relLuminance(oklchToLinearRgb(BG_OKLCH));
const contrastVsBg = (rgb) =>
  (relLuminance(rgb.map(toLinear)) + 0.05) / (BG_LUM + 0.05);

/**
 * 深色背景上过暗的品牌色 → 抬明度到达标为止。
 * 只动 HSL 的 L，保留 H/S，因此提亮后仍认得出是原品牌色（如 Rust 的纯黑 → 中性浅灰）。
 */
function brighten(hex) {
  const rgb = hexToRgb(hex);
  if (contrastVsBg(rgb) >= MIN_CONTRAST) return null; // 无需校正
  const [h, s] = rgbToHsl(rgb);
  for (let l = 0.05; l <= 0.97; l += 0.01) {
    const candidate = hslToRgb([h, s, l]);
    if (contrastVsBg(candidate) >= TARGET_CONTRAST) return rgbToHex(candidate);
  }
  return "#f0f0f0";
}

// ─── 抓取与处理 ──────────────────────────────────────────────────────────────

async function fetchCollection(prefix, names) {
  const url = `https://api.iconify.design/${prefix}.json?icons=${names.join(",")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`拉取 ${prefix} 失败：HTTP ${res.status}`);
  const json = await res.json();
  if (!json.icons) throw new Error(`${prefix} 返回内容里没有 icons 字段`);
  return json;
}

/** 校正 body 内所有硬编码颜色，返回 [新 body, 被校正的颜色数] */
function correctColors(body) {
  let fixed = 0;
  const out = body.replace(
    /(fill|stroke|stop-color)="(#[0-9a-fA-F]{3,8})"/g,
    (whole, attr, hex) => {
      // 8 位带 alpha 的不处理，避免误伤透明度
      if (hex.length === 9) return whole;
      const next = brighten(hex);
      if (!next) return whole;
      fixed++;
      return `${attr}="${next}"`;
    },
  );
  return [out, fixed];
}

/** 把 id="X" / url(#X) 里的 X 换成 X+占位符，供运行时做实例级去重 */
function tokenizeIds(body) {
  const ids = [...body.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  if (ids.length === 0) return [body, false];
  let out = body;
  for (const id of ids) {
    // 用全局替换覆盖 id="X" 与 url(#X) 两种出现形式
    out = out
      .split(`id="${id}"`)
      .join(`id="${id}${UID_TOKEN}"`)
      .split(`url(#${id})`)
      .join(`url(#${id}${UID_TOKEN})`);
  }
  return [out, true];
}

async function main() {
  // 按 collection 归组，减少请求数
  const byCollection = new Map();
  for (const source of new Set(Object.values(ICON_SOURCES))) {
    const [prefix, name] = source.split(":");
    if (!byCollection.has(prefix)) byCollection.set(prefix, new Set());
    byCollection.get(prefix).add(name);
  }

  console.log(`背景相对亮度 ${BG_LUM.toFixed(5)}（oklch 精确换算）`);

  /** `collection:name` → { body, viewBox } */
  const resolved = new Map();
  let totalFixed = 0;
  let gradientCount = 0;

  for (const [prefix, names] of byCollection) {
    const data = await fetchCollection(prefix, [...names]);
    const setW = data.width ?? 24;
    const setH = data.height ?? 24;
    for (const name of names) {
      const icon = data.icons[name];
      if (!icon) {
        console.warn(`  ⚠ ${prefix}:${name} 不存在，跳过`);
        continue;
      }
      const [corrected, fixed] = correctColors(icon.body);
      const [body, hasIds] = tokenizeIds(corrected);
      totalFixed += fixed;
      if (hasIds) gradientCount++;
      if (fixed > 0)
        console.log(`  · ${prefix}:${name} 校正了 ${fixed} 个暗色`);
      resolved.set(`${prefix}:${name}`, {
        body,
        viewBox: `0 0 ${icon.width ?? setW} ${icon.height ?? setH}`,
      });
    }
  }

  // 生成 TS
  const entries = Object.entries(ICON_SOURCES)
    .filter(([, source]) => resolved.has(source))
    .map(([lang, source]) => {
      const { body, viewBox } = resolved.get(source);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" aria-hidden="true">${body}</svg>`;
      return `  ${JSON.stringify(lang)}: ${JSON.stringify(svg)},`;
    });

  const file = `// src/composables/code-block/icons.generated.ts
//
// ⚠ 本文件由 scripts/gen-code-block-icons.mjs 自动生成，请勿手工编辑。
// 重新生成：bun run gen:icons
//
// 图标来源：Iconify 的 vscode-icons（MIT）与 devicon（MIT）。
// 已做处理：深色 header 上对比度不足的品牌色已在 HSL 空间抬亮（保留色相/饱和度）；
// 渐变 id 已替换为 ${UID_TOKEN} 占位符，由 resolveLanguageIcon() 在注入时实例化。

/** SVG 内部 id 的占位符，运行时替换为实例唯一后缀 */
export const ICON_UID_TOKEN = "${UID_TOKEN}";

/** 语言名（lowlight 语法名）→ 完整 SVG 字符串 */
export const LANGUAGE_ICONS: Readonly<Record<string, string>> = {
${entries.join("\n")}
};
`;

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, file, "utf8");

  console.log(
    `\n✓ 生成 ${entries.length} 个语言图标 → ${OUT}` +
      `\n  暗色校正 ${totalFixed} 处，含渐变 id 的图标 ${gradientCount} 个`,
  );
}

main().catch((err) => {
  console.error("生成失败：", err.message);
  process.exit(1);
});

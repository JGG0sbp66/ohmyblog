// src/composables/code-block/labels.ts
//
// 语言展示名 —— 后台 header 输入框 / 语言下拉、前台语言标签共用。
//
// 语法名（lowlight 的 key）是小写 slug：typescript / cpp / objectivec。
// 直接显示或全大写（TYPESCRIPT）都不好读，这里给一张规范大小写的展示名表：
// TypeScript / C++ / Objective-C。表里没有的（用户自行输入的语言）回落为首字母大写。
//
// 存储的始终是 slug —— 展示名只在渲染层出现，不进 attrs、不进 contentHtml，
// 因此不影响 <code class="language-xxx"> 的语义与 RSS 输出。

const LABELS: Readonly<Record<string, string>> = {
  arduino: "Arduino",
  bash: "Bash",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  css: "CSS",
  diff: "Diff",
  go: "Go",
  graphql: "GraphQL",
  ini: "INI",
  java: "Java",
  javascript: "JavaScript",
  json: "JSON",
  kotlin: "Kotlin",
  less: "Less",
  lua: "Lua",
  makefile: "Makefile",
  markdown: "Markdown",
  objectivec: "Objective-C",
  perl: "Perl",
  php: "PHP",
  "php-template": "PHP Template",
  plaintext: "Plain Text",
  python: "Python",
  "python-repl": "Python REPL",
  r: "R",
  ruby: "Ruby",
  rust: "Rust",
  scss: "SCSS",
  shell: "Shell",
  sql: "SQL",
  swift: "Swift",
  text: "Text",
  typescript: "TypeScript",
  vbnet: "VB.NET",
  wasm: "WebAssembly",
  xml: "XML",
  yaml: "YAML",
};

/**
 * 语法名 → 展示名。未收录的语言回落为首字母大写（如 "zig" → "Zig"）。
 * 空串原样返回，交由调用方决定用 placeholder 还是默认值。
 */
export function formatLanguageLabel(language: string): string {
  const key = language.trim().toLowerCase();
  if (!key) return "";
  return LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

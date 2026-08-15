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
//
// 别名也收录：POPULAR_ALIASES（见 languages.ts）允许用户在下拉里直接选
// toml/yml/md 等惯用写法，选中后 attrs 存的就是别名，需要展示名。

const LABELS: Readonly<Record<string, string>> = {
  ada: "Ada",
  apache: "Apache",
  applescript: "AppleScript",
  arduino: "Arduino",
  bash: "Bash",
  bat: "Batch",
  batch: "Batch",
  c: "C",
  clojure: "Clojure",
  cmake: "CMake",
  coffeescript: "CoffeeScript",
  console: "Console",
  cpp: "C++",
  cs: "C#",
  csharp: "C#",
  css: "CSS",
  dart: "Dart",
  diff: "Diff",
  docker: "Dockerfile",
  dockerfile: "Dockerfile",
  dos: "Batch",
  ebnf: "EBNF",
  elixir: "Elixir",
  elm: "Elm",
  erlang: "Erlang",
  fortran: "Fortran",
  fsharp: "F#",
  gherkin: "Gherkin",
  glsl: "GLSL",
  go: "Go",
  golang: "Go",
  gradle: "Gradle",
  graphql: "GraphQL",
  groovy: "Groovy",
  handlebars: "Handlebars",
  haskell: "Haskell",
  html: "HTML",
  http: "HTTP",
  ini: "INI",
  isbl: "ISBL",
  java: "Java",
  javascript: "JavaScript",
  js: "JavaScript",
  json: "JSON",
  jsonc: "JSONC",
  jsx: "JSX",
  julia: "Julia",
  kotlin: "Kotlin",
  latex: "LaTeX",
  less: "Less",
  lisp: "Lisp",
  livecodeserver: "LiveCode",
  lua: "Lua",
  makefile: "Makefile",
  markdown: "Markdown",
  matlab: "MATLAB",
  md: "Markdown",
  nginx: "Nginx",
  nix: "Nix",
  objectivec: "Objective-C",
  ocaml: "OCaml",
  perl: "Perl",
  php: "PHP",
  "php-template": "PHP Template",
  plaintext: "Plain Text",
  powershell: "PowerShell",
  prolog: "Prolog",
  properties: "Properties",
  protobuf: "Protocol Buffers",
  ps1: "PowerShell",
  py: "Python",
  python: "Python",
  "python-repl": "Python REPL",
  r: "R",
  reasonml: "ReasonML",
  rs: "Rust",
  ruby: "Ruby",
  rust: "Rust",
  scala: "Scala",
  scheme: "Scheme",
  scss: "SCSS",
  sh: "Shell",
  shell: "Shell",
  sql: "SQL",
  stylus: "Stylus",
  svg: "SVG",
  swift: "Swift",
  tcl: "Tcl",
  tex: "LaTeX",
  text: "Text",
  thrift: "Thrift",
  // toml 是 ini 语法的内置别名（hljs 里 ini 的正式名就叫 "TOML, also INI"），
  // 用户输入 toml 时 attrs 存的就是 "toml"，需要专属展示名
  toml: "TOML",
  ts: "TypeScript",
  tsx: "TSX",
  twig: "Twig",
  typescript: "TypeScript",
  vbnet: "VB.NET",
  verilog: "Verilog",
  vhdl: "VHDL",
  vim: "Vim Script",
  wasm: "WebAssembly",
  xml: "XML",
  yaml: "YAML",
  yml: "YAML",
  zsh: "Zsh",
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

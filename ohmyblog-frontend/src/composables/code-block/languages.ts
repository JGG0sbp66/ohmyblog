// src/composables/code-block/languages.ts
//
// 代码块语言集的单一事实来源 —— common 常用集 + 精选扩充集，两端共用：
//   后台编辑器在 lowlight.ts 用它建 lowlight 实例（打字时实时高亮），
//   前台阅读端在 highlight.ts 用它注册 hljs 实例（渲染 contentHtml 时高亮）。
//
// 为什么不用 lowlight 自带的 `all`（155 种全量）：
//   实测 all 打包后约 1023KB min / 289KB gzip，比 common 净增 247KB gzip，
//   且 highlight.ts 被阅读端静态引用、无法懒加载 —— 博客读者不该为此买单。
//   这里只挑技术博客真正会出现的语言（约 45 种），体积代价小一个量级。
//
// 语法文件直接取自 highlight.js（lowlight 的 common 也源自同一批文件），
//   单个语言模块无 TS 声明，类型 shim 见根目录 env.d.ts。
//
// 关于别名：hljs 语法文件内置的别名（如 toml→ini、docker→dockerfile）
//   在注册时自动生效，两端高亮都能识别，不需要在这里重复登记。

import { common, type LanguageFn } from "lowlight";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import nginx from "highlight.js/lib/languages/nginx";
import apache from "highlight.js/lib/languages/apache";
import http from "highlight.js/lib/languages/http";
import properties from "highlight.js/lib/languages/properties";
import powershell from "highlight.js/lib/languages/powershell";
import dos from "highlight.js/lib/languages/dos";
import dart from "highlight.js/lib/languages/dart";
import elixir from "highlight.js/lib/languages/elixir";
import erlang from "highlight.js/lib/languages/erlang";
import haskell from "highlight.js/lib/languages/haskell";
import julia from "highlight.js/lib/languages/julia";
import scala from "highlight.js/lib/languages/scala";
import groovy from "highlight.js/lib/languages/groovy";
import latex from "highlight.js/lib/languages/latex";
import protobuf from "highlight.js/lib/languages/protobuf";
import ocaml from "highlight.js/lib/languages/ocaml";
import fsharp from "highlight.js/lib/languages/fsharp";
import nix from "highlight.js/lib/languages/nix";
import glsl from "highlight.js/lib/languages/glsl";
import vim from "highlight.js/lib/languages/vim";
import coffeescript from "highlight.js/lib/languages/coffeescript";
import elm from "highlight.js/lib/languages/elm";
import handlebars from "highlight.js/lib/languages/handlebars";
import twig from "highlight.js/lib/languages/twig";
import applescript from "highlight.js/lib/languages/applescript";
import reasonml from "highlight.js/lib/languages/reasonml";
import scheme from "highlight.js/lib/languages/scheme";
import lisp from "highlight.js/lib/languages/lisp";
import matlab from "highlight.js/lib/languages/matlab";
import gradle from "highlight.js/lib/languages/gradle";
import gherkin from "highlight.js/lib/languages/gherkin";
import stylus from "highlight.js/lib/languages/stylus";
import tcl from "highlight.js/lib/languages/tcl";
import thrift from "highlight.js/lib/languages/thrift";
import verilog from "highlight.js/lib/languages/verilog";
import vhdl from "highlight.js/lib/languages/vhdl";
import ada from "highlight.js/lib/languages/ada";
import clojure from "highlight.js/lib/languages/clojure";
import fortran from "highlight.js/lib/languages/fortran";
import prolog from "highlight.js/lib/languages/prolog";
import cmake from "highlight.js/lib/languages/cmake";
import ebnf from "highlight.js/lib/languages/ebnf";
import isbl from "highlight.js/lib/languages/isbl";
import livecodeserver from "highlight.js/lib/languages/livecodeserver";

/** common 之外的精选语法集。键 = 语法名（存进 attrs / language-xxx 的那份） */
const EXTRA_GRAMMARS: Readonly<Record<string, LanguageFn>> = {
  dockerfile,
  nginx,
  apache,
  http,
  properties,
  powershell,
  dos,
  dart,
  elixir,
  erlang,
  haskell,
  julia,
  scala,
  groovy,
  latex,
  protobuf,
  ocaml,
  fsharp,
  nix,
  glsl,
  vim,
  coffeescript,
  elm,
  handlebars,
  twig,
  applescript,
  reasonml,
  scheme,
  lisp,
  matlab,
  gradle,
  gherkin,
  stylus,
  tcl,
  thrift,
  verilog,
  vhdl,
  ada,
  clojure,
  fortran,
  prolog,
  cmake,
  ebnf,
  isbl,
  livecodeserver,
};

/**
 * 额外别名 → 语法名。绝大多数常见别名 hljs 语法文件自带（toml→ini、
 * docker→dockerfile、bat/cmd→dos、tex→latex、yml→yaml、jsonc→json 等），
 * 内置别名注册语法时自动生效（getLanguage 可解析别名），无需重复登记；
 * 这里只补用户直觉会写、但语法文件没收录的写法（如 hljs 里
 * ts/tsx 并不是 typescript 的别名）。
 */
export const LANGUAGE_ALIASES: Readonly<Record<string, string>> = {
  batch: "dos",
  ts: "typescript",
  tsx: "typescript",
};

/**
 * 允许在下拉里直接选中的常用别名白名单。
 *
 * 背景：hljs.listLanguages() 只返回正式注册名、不含别名，导致用户打
 * toml/yml/md 等惯用写法时下拉永远搜不到（高亮其实能识别）。
 * 这里把高频别名重新放回候选；选中后 attrs 存别名本身 ——
 * 两端高亮都能解析（内置别名 getLanguage 可命中，LANGUAGE_ALIASES
 * 里的已展开注册），labels 与图标表也为它们配了条目。
 * 只收录高频写法，xml 语法的 rss/atom/xsd 等长尾别名不进下拉。
 */
export const POPULAR_ALIASES: readonly string[] = [
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "sh",
  "zsh",
  "console",
  "html",
  "svg",
  "jsonc",
  "yml",
  "md",
  "golang",
  "rs",
  "cs",
  "toml",
  "docker",
  "tex",
  "ps1",
  "bat",
  "batch",
];

/**
 * 完整语法表（common + 精选 + 别名展开）。
 * 别名展开成同名条目而不是走各引擎的 alias API：
 *   hljs 与 lowlight 的别名注册接口签名不同，展开后两端用同一份表、
 *   同一种注册方式，一致性由构造保证（延续 highlight.ts 注释里的教训）。
 */
export const GRAMMARS: Readonly<Record<string, LanguageFn>> = {
  ...common,
  ...EXTRA_GRAMMARS,
  ...Object.fromEntries(
    Object.entries(LANGUAGE_ALIASES).map(([alias, target]) => {
      const grammar =
        (common as Readonly<Record<string, LanguageFn>>)[target] ??
        EXTRA_GRAMMARS[target];
      if (!grammar) throw new Error(`别名 ${alias} 指向未收录的语言 ${target}`);
      return [alias, grammar];
    }),
  ),
};

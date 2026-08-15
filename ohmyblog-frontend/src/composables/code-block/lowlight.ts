// src/composables/code-block/lowlight.ts
//
// Tiptap CodeBlockLowlight 用的 lowlight 实例 —— 仅后台编辑器路径。
//
// 单独成文件、且不从 index.ts barrel 导出，是为了不把 lowlight 拖进阅读端依赖图：
//   createLowlight(common) 是模块级函数调用，打包器无法当作无副作用代码摇掉，
//   一旦被 barrel 再导出，前台只要 import 任意一个共享工具就会被连带打进来。
// 语言集与 highlight.ts 同源（都取自 ./languages.ts 的 GRAMMARS），一致性由构造保证。

import { createLowlight } from "lowlight";
import { GRAMMARS } from "./languages";

export const lowlight = createLowlight(GRAMMARS);

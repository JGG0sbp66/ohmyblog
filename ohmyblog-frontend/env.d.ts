/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// highlight.js 的 common 语言子集入口只带运行时、未附类型声明，
// 这里补一个类型 shim（复用主包的 HLJSApi），保证阅读端按需只引入常用语言集。
declare module "highlight.js/lib/common" {
  import type { HLJSApi } from "highlight.js";
  const hljs: HLJSApi;
  export default hljs;
}

// src/composables/code-block/icons.ts
//
// 语言图标解析 —— 后台 NodeView 与前台增强脚本共用。
// 图标表由 scripts/gen-code-block-icons.mjs 生成（见 icons.generated.ts）。
//
// 为什么是「动态导入 + 同步取值」这套两段式：
//   图标表约 23 KB（gzip），但阅读端多数文章根本没有代码块。
//   若在模块顶层静态 import，Post.page 的依赖图就会把它拉成首屏必载，
//   等于让所有读者为代码块买单。这里改为按需 import()：
//     - 阅读端在确认页面存在 <pre> 后才 preload；
//     - 编辑器在 NodeView 挂载时 preload（此时代码块必然存在）。
//   表未就绪时 resolveLanguageIcon 先返回兜底图标，加载完再重算，
//   因此调用方保持同步、不必处理 Promise。

/**
 * 未收录语言（以及图标表尚未加载完成时）的兜底图标（lucide code-xml，即 `</>`）。
 * 单色、走 currentColor，因此会跟随 header 的主题色，
 * 与彩色品牌图标混排时不会显得突兀。
 */
const FALLBACK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>`;

type IconTable = Readonly<Record<string, string>>;

let table: IconTable | null = null;
let uidToken = "";
let loading: Promise<void> | null = null;

/**
 * 加载图标表。幂等且并发安全：重复调用共享同一个 Promise，模块本身也由打包器缓存。
 * 加载失败（如离线）时静默降级为兜底图标，不阻断代码块渲染。
 */
export function preloadLanguageIcons(): Promise<void> {
  if (table) return Promise.resolve();
  loading ??= import("./icons.generated")
    .then((mod) => {
      table = mod.LANGUAGE_ICONS;
      uidToken = mod.ICON_UID_TOKEN;
    })
    .catch(() => {
      // 保持 table 为 null —— resolveLanguageIcon 会一直返回兜底图标
    });
  return loading;
}

// SVG 内部 id 的实例计数器。
// 见 icons.generated.ts 顶部说明：渐变图标（python/rust/swift/kotlin/r 等）
// 内含 <linearGradient id="X"> + url(#X)，同 id 在文档里重复出现时浏览器只认第一个，
// 一旦首个实例被移除（编辑器增删代码块、前台 v-html 重渲染），其余实例的渐变就会失效。
// 每次解析都分配唯一后缀，彻底规避。
let instanceCounter = 0;

/**
 * 取语言对应的图标 SVG 串。同步返回，永远不为空 ——
 * 未收录的语言、以及图标表尚在加载中时，都给兜底图标，
 * 因此 header 的图标位不会出现空洞导致布局跳动。
 *
 * @param language 语言名（大小写不敏感，会做 trim）
 */
export function resolveLanguageIcon(language: string): string {
  const key = language.trim().toLowerCase();
  const svg = table && key ? table[key] : undefined;
  if (!svg) return FALLBACK_ICON;
  // 占位符 → 实例唯一后缀
  return svg.split(uidToken).join(`-omb${instanceCounter++}`);
}

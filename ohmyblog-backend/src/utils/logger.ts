import { consola } from "consola";

/**
 * 全局日志实例（consola 单例）。
 *
 * 单独成模块、且只依赖 consola：这是刻意切断的一条循环依赖。
 * env.ts 在模块顶层（自动建目录、生成 .env）就要写日志，而日志落盘的
 * Reporter 又要读 config（env.ts 导出）判断是否生产环境。若把 logger 实例
 * 放在 plugins/logger.plugin.ts 里，就会形成
 *   env.ts → logger.plugin.ts → utils/runtime.ts → env.ts
 * 的环。源码直跑时 ESM live binding 能兜住，但 `bun build --compile` 会把
 * 各模块摊平成惰性 init 函数，环 + env.ts 的顶层 await 会让 env.ts 的顶层代码
 * 早于 `logger = consola` 执行，得到 undefined，启动即崩
 * （TypeError: undefined is not an object (evaluating 'logger.info')）。
 *
 * 因此日志实例必须待在这个无依赖的叶子模块里，保证任何引用它的模块初始化时
 * 它都已就绪。落盘 Reporter 与 Elysia 请求日志插件仍留在 logger.plugin.ts。
 */
export const logger = consola;

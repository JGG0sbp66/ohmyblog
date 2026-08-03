import { config } from "../env";

/**
 * 是否运行在生产环境。
 */

export const isProduction = (): boolean => config.NODE_ENV === "production";

/**
 * 是否开启演示模式。
 *
 * 与 NODE_ENV 正交：演示站本身也是 production 部署，只是额外禁止写操作。
 * 注意这里只反映开关本身，「限制是否真正生效」见 utils/demo.ts 的 isDemoActive。
 */
export const isDemo = (): boolean => config.DEMO_MODE;

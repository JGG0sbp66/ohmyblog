import { config } from "../env";

/**
 * 是否运行在生产环境。
 */

export const isProduction = (): boolean => config.NODE_ENV === "production";

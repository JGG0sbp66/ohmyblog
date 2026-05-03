/**
 * db/constants/config.constants.ts
 *
 * 系统配置相关的常量定义 (SSOT)
 */

/** 支持的主题模式 */
export const themeModes = ["light", "dark", "auto"] as const;
export type TThemeMode = (typeof themeModes)[number];

/** 支持的界面语言 */
export const supportedLanguages = ["zh-CN", "en-US"] as const;
export type TLanguage = (typeof supportedLanguages)[number];

/** 系统配置键名 */
export const configKeys = [
	"appearance",
	"site_info",
	"personal_info",
	"smtp",
] as const;
export type TConfigKey = (typeof configKeys)[number];

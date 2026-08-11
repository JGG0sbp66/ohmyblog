/**
 * db/constants/config.constants.ts
 *
 * 系统配置相关的常量定义 (SSOT)
 */

/**
 * 支持的主题模式
 *
 * 数组顺序即前台 UI 的展示顺序，也是 cycleTheme 的轮转顺序。
 * eyecare（护眼）是一档独立的浅色配色：低蓝光暖底 + 降对比文字，
 * 强调色仍跟随用户自选色相，配色定义见前端 css/tailwind.css 的 .eyecare
 */
export const themeModes = ["light", "dark", "auto", "eyecare"] as const;
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
	"announcement",
] as const;
export type TConfigKey = (typeof configKeys)[number];

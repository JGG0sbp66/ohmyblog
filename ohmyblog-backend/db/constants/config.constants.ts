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
	"captcha",
] as const;
export type TConfigKey = (typeof configKeys)[number];

/**
 * 每个 configKey 对应的默认描述。
 *
 * 后端创建配置时若前端没传 description，自动从这里取，
 * 前端不再需要关心 description 字段。
 * Record<TConfigKey, string> 保证新增 key 时 TS 会逼你补描述。
 */
export const configDescriptions: Record<TConfigKey, string> = {
	appearance: "外观设置（主题颜色、色相、语言）",
	site_info: "站点基本信息（标题、图标、备案号）",
	personal_info: "个性化配置（头像、首页横幅、首页标题等）",
	smtp: "SMTP 配置（基础连接与可选发件人信息）",
	announcement: "公告配置（前台侧边栏公告卡片）",
	captcha: "人机验证配置（服务商、密钥、启用场景）",
};

/**
 * db/constants/upload.constants.ts
 *
 * 图片上传大小限制 (SSOT)
 *
 * 前后端共享：后端 dtos/upload.dto.ts 用它生成 TypeBox 的 maxSize 与错误文案，
 * 前端在选中文件时用它做预校验，避免把超限文件整个传完才被拒绝。
 * 改限制只改这里一处，两边不会跑偏。
 *
 * 注意：本文件必须保持零依赖（纯常量 + 纯函数），前端才能安全 import。
 */

/** 各类图片上传的大小上限（字节） */
export const uploadLimits = {
	/** 网站图标 */
	favicon: 1 * 1024 * 1024,
	/** 社交平台图标 */
	socialIcon: 512 * 1024,
	/** 管理员头像 */
	avatar: 2 * 1024 * 1024,
	/** 首页横幅 */
	hero: 5 * 1024 * 1024,
	/** 文章封面图 */
	postCover: 5 * 1024 * 1024,
	/** 文章正文行内图 */
	postImage: 10 * 1024 * 1024,
} as const;

export type TUploadKind = keyof typeof uploadLimits;

/**
 * 把字节数格式化成展示用的单位，如 1048576 → "1MB"、524288 → "512KB"
 *
 * 输出直接参与拼装错误文案，而该文案又是前端 i18n 的 key，
 * 所以这里的格式一旦变动，两份 locale 的 api.errors 下都要跟着改。
 */
export const formatUploadLimit = (bytes: number): string =>
	bytes >= 1024 * 1024 ? `${bytes / (1024 * 1024)}MB` : `${bytes / 1024}KB`;

/** 超限时的提示文案；同时是前端 api.errors 下的 i18n key */
export const uploadLimitMessage = (bytes: number): string =>
	`请上传 ${formatUploadLimit(bytes)} 以内的有效图片`;

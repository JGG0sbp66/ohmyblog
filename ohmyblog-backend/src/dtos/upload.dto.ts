// src/dtos/upload.dto.ts
import { type Static, t } from "elysia";
import {
	uploadLimitMessage,
	uploadLimits,
} from "../../db/constants/upload.constants";
import { tStringEnum } from "../utils/typebox";

/**
 * 生成图片文件字段的 TypeBox 定义
 *
 * 大小上限统一取自 db/constants/upload.constants.ts，错误文案也由同一处派生，
 * 避免限制值和提示文字各改各的（前端把这句文案当 i18n key 用）。
 */
const imageFile = (maxSize: number, description: string) =>
	t.File({
		type: "image",
		maxSize,
		description,
		error: uploadLimitMessage(maxSize),
	});

// 网站icon图标 DTO
export const UploadIconDTO = t.Object({
	icon: imageFile(uploadLimits.favicon, "网站图标文件"),
});

// 管理员头像 DTO
export const UploadAvatarDTO = t.Object({
	avatar: imageFile(uploadLimits.avatar, "管理员头像图片"),
});

// 首页 Hero 横幅 DTO
export const UploadHeroDTO = t.Object({
	hero: imageFile(uploadLimits.hero, "首页横幅图片"),
});

// 社交链接图标 DTO
export const UploadSocialIconDTO = t.Object({
	key: t.String({
		minLength: 1,
		description: "社交平台的唯一标识符 (用于作为图标文件名)",
	}),
	mode: tStringEnum(["light", "dark"] as const, {
		description: "图标模式：浅色或深色",
	}),
	icon: imageFile(uploadLimits.socialIcon, "社交图标文件"),
});

// 文章封面图 DTO
export const UploadPostCoverDTO = t.Object({
	cover: imageFile(uploadLimits.postCover, "文章封面图，上传后自动转为 WebP"),
});

// 文章行内图 DTO（编辑器粘贴/插入图片时使用）
export const UploadPostImageDTO = t.Object({
	image: imageFile(uploadLimits.postImage, "文章内图片，上传后自动转为 WebP"),
});

export type TUploadIconDTO = Static<typeof UploadIconDTO>;
export type TUploadHeroDTO = Static<typeof UploadHeroDTO>;
export type TUploadAvatarDTO = Static<typeof UploadAvatarDTO>;
export type TUploadSocialIconDTO = Static<typeof UploadSocialIconDTO>;
export type TUploadPostCoverDTO = Static<typeof UploadPostCoverDTO>;
export type TUploadPostImageDTO = Static<typeof UploadPostImageDTO>;

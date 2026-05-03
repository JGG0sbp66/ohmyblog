// src/dtos/upload.dto.ts
import { type Static, t } from "elysia";
import { tStringEnum } from "../utils/typebox";

// 网站icon图标 DTO
export const UploadIconDTO = t.Object({
	icon: t.File({
		type: "image",
		maxSize: "1m",
		description: "网站图标文件，最大1MB",
		error: "请上传 1MB 以内的有效图片",
	}),
});

// 管理员头像 DTO
export const UploadAvatarDTO = t.Object({
	avatar: t.File({
		type: "image",
		maxSize: "2m",
		description: "管理员头像图片，最大2MB",
		error: "请上传 2MB 以内的有效图片",
	}),
});

// 首页 Hero 横幅 DTO
export const UploadHeroDTO = t.Object({
	hero: t.File({
		type: "image",
		maxSize: "5m",
		description: "首页横幅图片，最大5MB",
		error: "请上传 5MB 以内的有效图片",
	}),
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
	icon: t.File({
		type: "image",
		maxSize: "512k",
		description: "社交图标文件，最大512KB",
		error: "请上传 512KB 以内的有效图片",
	}),
});

// 文章封面图 DTO
export const UploadPostCoverDTO = t.Object({
	cover: t.File({
		type: "image",
		maxSize: "5m",
		description: "文章封面图，最大 5MB，上传后自动转为 WebP",
		error: "请上传 5MB 以内的有效图片",
	}),
});

// 文章行内图 DTO（编辑器粘贴/插入图片时使用）
export const UploadPostImageDTO = t.Object({
	image: t.File({
		type: "image",
		maxSize: "10m",
		description: "文章内图片，最大 10MB，上传后自动转为 WebP",
		error: "请上传 10MB 以内的有效图片",
	}),
});

export type TUploadIconDTO = Static<typeof UploadIconDTO>;
export type TUploadHeroDTO = Static<typeof UploadHeroDTO>;
export type TUploadAvatarDTO = Static<typeof UploadAvatarDTO>;
export type TUploadSocialIconDTO = Static<typeof UploadSocialIconDTO>;
export type TUploadPostCoverDTO = Static<typeof UploadPostCoverDTO>;
export type TUploadPostImageDTO = Static<typeof UploadPostImageDTO>;

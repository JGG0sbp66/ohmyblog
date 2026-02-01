// src/dtos/upload.dto.ts
import { type Static, t } from "elysia";

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

export type TUploadIconDTO = Static<typeof UploadIconDTO>;
export type TUploadHeroDTO = Static<typeof UploadHeroDTO>;
export type TUploadAvatarDTO = Static<typeof UploadAvatarDTO>;

// src/routes/upload.route.ts
import { Elysia } from "elysia";
import {
	UploadAvatarDTO,
	UploadHeroDTO,
	UploadIconDTO,
} from "../dtos/upload.dto";
import { ensureAdminIfExists } from "../plugins/adminGuard";
import { authPlugin } from "../plugins/auth.plugin";
import { uploadService } from "../services/upload.service";

export const uploadRoute = new Elysia({ name: "uploadRoute" })
	.use(authPlugin)
	.group("/upload", { detail: { tags: ["Upload (资源上传)"] } }, (app) =>
		app
			/**
			 * POST /upload/favicon
			 * - 上传网站图标 (Favicon)
			 */
			.post(
				"/favicon",
				async ({ body: { icon } }) => {
					const result = await uploadService.uploadFavicon(icon);

					return {
						message: "图标上传成功",
						...result,
					};
				},
				{
					beforeHandle: ensureAdminIfExists,
					body: UploadIconDTO,
					detail: {
						summary: "上传网站图标 (POST)",
						description: "仅限管理员操作，上传后自动处理为 128x128 的 PNG 格式",
					},
				},
			)
			/**
			 * POST /upload/hero
			 * - 上传首页 Hero 横幅
			 */
			.post(
				"/hero",
				async ({ body: { hero } }) => {
					const result = await uploadService.uploadHero(hero);

					return {
						message: "横幅上传成功",
						...result,
					};
				},
				{
					beforeHandle: ensureAdminIfExists,
					body: UploadHeroDTO,
					detail: {
						summary: "上传首页横幅 (POST)",
						description: "仅限管理员操作，上传后自动处理为 WebP 格式",
					},
				},
			)
			/**
			 * POST /upload/avatar
			 * - 上传管理员头像
			 */
			.post(
				"/avatar",
				async ({ body: { avatar }, user }) => {
					const result = await uploadService.uploadAvatar(avatar, user!.uuid);

					return {
						message: "头像上传成功",
						...result,
					};
				},
				{
					beforeHandle: ensureAdminIfExists,
					body: UploadAvatarDTO,
					detail: {
						summary: "上传管理员头像 (POST)",
						description: "仅限管理员操作，上传后自动处理为 WebP 格式",
					},
				},
			),
	);

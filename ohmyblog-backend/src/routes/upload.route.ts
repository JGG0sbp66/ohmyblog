// src/routes/upload.route.ts
import { Elysia } from "elysia";
import {
	UploadAvatarDTO,
	UploadHeroDTO,
	UploadIconDTO,
	UploadPostCoverDTO,
	UploadPostImageDTO,
	UploadSocialIconDTO,
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
				async ({ body: { avatar } }) => {
					const result = await uploadService.uploadAvatar(avatar);

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
			)
			/**
			 * POST /upload/social-icon
			 * - 上传社交链接图标
			 */
			.post(
				"/social-icon",
				async ({ body: { icon, key, mode } }) => {
					const result = await uploadService.uploadSocialIcon(icon, key, mode);

					return {
						message: "社交图标上传成功",
						...result,
					};
				},
				{
					beforeHandle: ensureAdminIfExists,
					body: UploadSocialIconDTO,
					detail: {
						summary: "上传社交链接图标 (POST)",
						description: "仅限管理员操作，上传后自动处理为 PNG 格式",
					},
				},
			)
			/**
			 * POST /upload/post-cover/:uuid
			 * - 上传文章封面图，固定存为 cover.webp，重复上传直接覆盖
			 */
			.post(
				"/post-cover/:uuid",
				async ({ params: { uuid }, body: { cover } }) => {
					const result = await uploadService.uploadPostCover(cover, uuid);
					return {
						message: "封面图上传成功",
						...result,
					};
				},
				{
					beforeHandle: ensureAdminIfExists,
					body: UploadPostCoverDTO,
					detail: {
						summary: "上传文章封面图 (POST)",
						description:
							"仅限管理员操作，上传后自动处理为 WebP 格式，同一文章重复上传会覆盖原封面",
					},
				},
			)
			/**
			 * POST /upload/post-image/:uuid
			 * - 编辑器粘贴/插入图片时调用，每次生成独立 cuid 文件名，返回 URL 供编辑器插入
			 */
			.post(
				"/post-image/:uuid",
				async ({ params: { uuid }, body: { image } }) => {
					const result = await uploadService.uploadPostImage(image, uuid);
					return {
						message: "图片上传成功",
						...result,
					};
				},
				{
					beforeHandle: ensureAdminIfExists,
					body: UploadPostImageDTO,
					detail: {
						summary: "上传文章行内图 (POST)",
						description:
							"仅限管理员操作，编辑器粘贴图片时调用，返回 URL 直接插入编辑器",
					},
				},
			),
	);

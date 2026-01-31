// src/routes/config.route.ts
import { Elysia } from "elysia";
import {
	ConfigUpsertDTO,
	UploadAvatarDTO,
	UploadHeroDTO,
	UploadIconDTO,
} from "../dtos/config.dto";
import { ensureAdminIfExists } from "../plugins/adminGuard";
import { authPlugin } from "../plugins/auth.plugin";
import { configService } from "../services/config.service";

export const configRoute = new Elysia({ name: "configRoute" })
	.use(authPlugin)
	.group("/config", { detail: { tags: ["Config (配置)"] } }, (app) =>
		app
			/**
			 * POST /config
			 * - 用于创建或更新配置
			 */
			.post(
				"/",
				async ({ body }) => {
					const config = await configService.upsert(body);

					return {
						message: "保存成功",
						config,
					};
				},
				{
					beforeHandle: ensureAdminIfExists,
					detail: { summary: "创建或更新配置（POST）" },
					body: ConfigUpsertDTO,
				},
			)
			/**
			 * GET /config/:configKey
			 * - 获取单个配置
			 */
			.get(
				"/:configKey",
				async ({ params: { configKey }, user }) => {
					const isAdmin = user?.role === "admin";

					const config = await configService.getByKey(configKey, isAdmin);
					return {
						message: "获取成功",
						config,
					};
				},
				{
					detail: { summary: "获取单个配置（GET）" },
				},
			)
			/**
			 * POST /config/upload-icon
			 * - 上传网站图标 (Favicon)
			 */
			.post(
				"/upload-icon",
				async ({ body: { icon } }) => {
					const result = await configService.uploadFavicon(icon);

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
			 * POST /config/upload-hero
			 * - 上传首页 Hero 横幅
			 */
			.post(
				"/upload-hero",
				async ({ body: { hero } }) => {
					const result = await configService.uploadHero(hero);

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
			 * POST /config/upload-avatar
			 * - 上传管理员头像
			 */
			.post(
				"/upload-avatar",
				async ({ body: { avatar } }) => {
					const result = await configService.uploadAvatar(avatar);

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

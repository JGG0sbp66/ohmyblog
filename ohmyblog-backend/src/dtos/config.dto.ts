// src/dtos/config.dto.ts
import { type Static, t } from "elysia";

const ConfigMetaDTO = {
	description: t.Optional(
		t.String({
			maxLength: 255,
			description: "配置描述",
			error: "配置描述长度不能超过255个字符",
		}),
	),
	isPublic: t.Optional(
		t.Boolean({
			description: "是否公开给前端",
		}),
	),
};

// Step1：appearance 配置 DTO
export const AppearanceConfigUpsertDTO = t.Object({
	configKey: t.Literal("appearance"),
	configValue: t.Object({
		theme: t.Union([t.Literal("light"), t.Literal("dark"), t.Literal("auto")], {
			description: "主题模式",
			error: "主题模式仅支持 light/dark/auto",
		}),
		hue: t.Number({
			minimum: 0,
			maximum: 360,
			description: "主题色相",
			error: "主题色相必须为 0-360 之间的数字",
		}),
		language: t.Union([t.Literal("zh-CN"), t.Literal("en-US")], {
			description: "界面语言",
			error: "界面语言仅支持 zh-CN/en-US",
		}),
	}),
	...ConfigMetaDTO,
});

// Step2：site_info 配置 DTO
export const SiteInfoConfigUpsertDTO = t.Object({
	configKey: t.Literal("site_info"),
	configValue: t.Object({
		title: t.String({
			minLength: 1,
			maxLength: 100,
			description: "站点标题",
			error: "站点标题不能为空且不能超过100个字符",
		}),
		favicon: t.Optional(
			t.String({
				maxLength: 500,
				description: "站点图标 URL",
				error: "站点图标 URL 长度不能超过500个字符",
			}),
		),
		footer: t.Optional(
			t.String({
				maxLength: 255,
				description: "页脚信息",
				error: "页脚信息长度不能超过255个字符",
			}),
		),
		icp: t.Optional(
			t.String({
				maxLength: 100,
				description: "备案号",
				error: "备案号长度不能超过100个字符",
			}),
		),
	}),
	...ConfigMetaDTO,
});

// Step4：personal_info 配置 DTO
export const PersonalInfoConfigUpsertDTO = t.Object({
	configKey: t.Literal("personal_info"),
	configValue: t.Object({
		avatar: t.Optional(
			t.String({
				maxLength: 500,
				description: "头像 URL",
				error: "头像 URL 长度不能超过500个字符",
			}),
		),
		hero: t.Optional(
			t.String({
				maxLength: 500,
				description: "首页横幅 URL",
				error: "首页横幅 URL 长度不能超过500个字符",
			}),
		),
	}),
	...ConfigMetaDTO,
});

// 创建或更新配置 DTO
export const ConfigUpsertDTO = t.Union([
	AppearanceConfigUpsertDTO,
	SiteInfoConfigUpsertDTO,
	PersonalInfoConfigUpsertDTO,
]);

export type TAppearanceConfigUpsertDTO = Static<
	typeof AppearanceConfigUpsertDTO
>;
export type TSiteInfoConfigUpsertDTO = Static<typeof SiteInfoConfigUpsertDTO>;
export type TPersonalInfoConfigUpsertDTO = Static<
	typeof PersonalInfoConfigUpsertDTO
>;
export type TConfigUpsertDTO = Static<typeof ConfigUpsertDTO>;

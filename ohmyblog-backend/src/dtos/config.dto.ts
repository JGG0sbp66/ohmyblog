// src/dtos/config.dto.ts
import { type Static, t } from "elysia";

const ConfigMetaDTO = {
	description: t.Optional(
		t.String({
			maxLength: 255,
			description: "配置描述",
			error: "config.description_range",
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
			error: "appearance.theme_invalid",
		}),
		hue: t.Number({
			minimum: 0,
			maximum: 360,
			description: "主题色相",
			error: "appearance.hue_range",
		}),
		language: t.Union([t.Literal("zh-CN"), t.Literal("en-US")], {
			description: "界面语言",
			error: "appearance.language_invalid",
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
			error: "site_info.title_range",
		}),
		favicon: t.Optional(
			t.String({
				maxLength: 500,
				description: "站点图标 URL",
				error: "site_info.favicon_range",
			}),
		),
		footer: t.Optional(
			t.String({
				maxLength: 255,
				description: "页脚信息",
				error: "site_info.footer_range",
			}),
		),
		icp: t.Optional(
			t.String({
				maxLength: 100,
				description: "备案号",
				error: "site_info.icp_range",
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
				error: "personal_info.avatar_range",
			}),
		),
		hero: t.Optional(
			t.String({
				maxLength: 500,
				description: "首页横幅 URL",
				error: "personal_info.hero_range",
			}),
		),
	}),
	...ConfigMetaDTO,
});

// Step5：smtp 配置 DTO
export const SMTPConfigUpsertDTO = t.Object({
	configKey: t.Literal("smtp"),
	configValue: t.Object({
		enabled: t.Boolean({
			description: "是否启用 SMTP",
		}),
		host: t.String({
			minLength: 1,
			maxLength: 255,
			description: "SMTP 服务器地址",
			error: "smtp.host_range",
		}),
		port: t.Number({
			minimum: 1,
			maximum: 65535,
			description: "SMTP 端口",
			error: "smtp.port_range",
		}),
		username: t.String({
			minLength: 1,
			maxLength: 255,
			description: "SMTP 用户名",
			error: "smtp.username_range",
		}),
		password: t.String({
			minLength: 1,
			maxLength: 255,
			description: "SMTP 密码",
			error: "smtp.password_range",
		}),
		senderEmail: t.Optional(
			t.String({
				format: "email",
				maxLength: 255,
				description: "发件人邮箱",
				error: "smtp.sender_email_invalid",
			}),
		),
		senderName: t.Optional(
			t.String({
				maxLength: 100,
				description: "发件人名称",
				error: "smtp.sender_name_range",
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
	SMTPConfigUpsertDTO,
]);

export type TAppearanceConfigUpsertDTO = Static<
	typeof AppearanceConfigUpsertDTO
>;
export type TSiteInfoConfigUpsertDTO = Static<typeof SiteInfoConfigUpsertDTO>;
export type TPersonalInfoConfigUpsertDTO = Static<
	typeof PersonalInfoConfigUpsertDTO
>;
export type TSMTPConfigUpsertDTO = Static<typeof SMTPConfigUpsertDTO>;
export type TConfigUpsertDTO = Static<typeof ConfigUpsertDTO>;

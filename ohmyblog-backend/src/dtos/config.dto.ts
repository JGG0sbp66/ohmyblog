// src/dtos/config.dto.ts
import { type Static, t } from "elysia";
import { tStringEnum } from "../utils/typebox";
import { themeModes, supportedLanguages } from "../../db/constants/config.constants";

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
		theme: tStringEnum(themeModes, {
			description: "主题模式",
			error: "appearance.theme_invalid",
		}),
		hue: t.Number({
			minimum: 0,
			maximum: 360,
			description: "主题色相",
			error: "appearance.hue_range",
		}),
		language: tStringEnum(supportedLanguages, {
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
		footerLinks: t.Optional(
			t.Array(
				t.Object({
					name: t.String({
						minLength: 1,
						maxLength: 50,
						description: "链接名称",
						error: "site_info.footer_link_name_range",
					}),
					url: t.String({
						minLength: 1,
						maxLength: 500,
						description: "链接地址",
						error: "site_info.footer_link_url_range",
					}),
				}),
				{
					description: "页脚链接列表",
				},
			),
		),
	}),
	...ConfigMetaDTO,
});

// Step4：personal_info 配置 DTO
export const PersonalInfoConfigUpsertDTO = t.Object({
	configKey: t.Literal("personal_info"),
	configValue: t.Object({
		username: t.Optional(
			t.String({
				maxLength: 100,
				description: "显示名称",
				error: "personal_info.username_range",
			}),
		),
		avatar: t.Optional(
			t.String({
				maxLength: 500,
				description: "头像 URL",
				error: "personal_info.avatar_range",
			}),
		),
		bio: t.Optional(
			t.String({
				maxLength: 500,
				description: "个人简介",
				error: "personal_info.bio_range",
			}),
		),
		socialLinks: t.Optional(
			t.Array(
				t.Object({
					name: t.String({
						minLength: 1,
						maxLength: 50,
						description: "平台名称",
						error: "personal_info.social_name_range",
					}),
					url: t.String({
						minLength: 1,
						maxLength: 500,
						description: "社交链接地址",
						error: "personal_info.social_url_range",
					}),
					iconLight: t.Optional(
						t.String({
							maxLength: 500,
							description: "图标标识或 URL (浅色)",
						}),
					),
					iconDark: t.Optional(
						t.String({
							maxLength: 500,
							description: "图标标识或 URL (深色)",
						}),
					),
				}),
				{
					description: "社交链接列表",
				},
			),
		),
		hero: t.Optional(
			t.String({
				maxLength: 500,
				description: "首页横幅 URL",
				error: "personal_info.hero_range",
			}),
		),
		heroTitle: t.Optional(
			t.String({
				maxLength: 200,
				description: "Hero 图主标题",
				error: "personal_info.hero_title_range",
			}),
		),
		heroSubtitles: t.Optional(
			t.Array(
				t.String({
					maxLength: 300,
					description: "Hero 图副标题内容",
					error: "personal_info.hero_subtitle_range",
				}),
				{
					description: "Hero 图副标题列表",
				},
			),
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

// src/dtos/config.dto.ts
import { type Static, t } from "elysia";
import { captchaProviders } from "../../db/constants/captcha.constants";
import {
	supportedLanguages,
	themeModes,
} from "../../db/constants/config.constants";
import { tStringEnum } from "../utils/typebox";

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
				description: "站点图标 URL",
				error: "site_info.favicon_invalid",
			}),
		),
		footer: t.Optional(
			t.String({
				maxLength: 255,
				description: "页脚版权信息",
				error: "site_info.footer_range",
			}),
		),
		footerTitle: t.Optional(
			t.String({
				maxLength: 100,
				description: "页脚标题",
				error: "site_info.footer_title_range",
			}),
		),
		footerSlogan: t.Optional(
			t.String({
				maxLength: 255,
				description: "页脚标语",
				error: "site_info.footer_slogan_range",
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
					title: t.String({
						minLength: 1,
						maxLength: 50,
						description: "分组标题",
						error: "site_info.footer_link_group_title_range",
					}),
					links: t.Array(
						t.Object({
							name: t.String({
								minLength: 1,
								maxLength: 50,
								description: "链接名称",
								error: "site_info.footer_link_name_range",
							}),
							url: t.String({
								minLength: 1,
								description: "链接地址",
								error: "site_info.footer_link_url_invalid",
							}),
						}),
						{
							description: "分组内的链接列表",
						},
					),
				}),
				{
					description: "页脚分组链接列表",
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
				description: "头像 URL",
				error: "personal_info.avatar_invalid",
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
						description: "社交链接地址",
						error: "personal_info.social_url_invalid",
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
				description: "首页横幅 URL",
				error: "personal_info.hero_invalid",
			}),
		),
		// 与 hero 分开存：关掉横幅不该顺带丢掉已上传的图和标题，
		// 否则重新打开又要从头配一遍。缺省视为开启，兼容此开关之前的存量配置。
		heroEnabled: t.Optional(
			t.Boolean({
				description: "是否启用首页横幅",
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
			t.Union([
				t.Literal(""),
				t.String({
					format: "email",
					maxLength: 255,
					description: "发件人邮箱",
					error: "smtp.sender_email_invalid",
				}),
			]),
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

// announcement 配置 DTO（前台侧边栏公告卡片，非 setup 向导步骤）
export const AnnouncementConfigUpsertDTO = t.Object({
	configKey: t.Literal("announcement"),
	configValue: t.Object({
		enabled: t.Boolean({
			description: "是否展示公告",
		}),
		title: t.Optional(
			t.String({
				maxLength: 50,
				description: "公告标题，留空则前台使用默认文案",
				error: "announcement.title_range",
			}),
		),
		content: t.String({
			maxLength: 500,
			description: "公告正文（纯文本，支持换行）",
			error: "announcement.content_range",
		}),
	}),
	...ConfigMetaDTO,
});

// captcha 配置 DTO（人机验证，非 setup 向导步骤）
//
// 与 smtp 同属敏感配置：isPublic 存 false，只有管理员读得到，secretKey 会
// 照常回显给管理端（与 smtp 密码一致）。前台登录页等处是未登录状态，读不到
// 这条配置，改走 GET /api/captcha —— 那个接口只吐渲染验证框需要的字段。

/**
 * 单个服务商的一对密钥。
 *
 * 写成工厂函数而不是共用同一个 schema 实例：Elysia 在编译校验器时会往
 * schema 上挂东西，同一个对象出现在树里多个位置容易出意外，三次调用各得
 * 一份互不相干的结构最稳妥。
 *
 * 两个字段刻意不设 minLength —— 关掉总开关时前端会跳过表单校验，此时
 * key 很可能是空串，设了非空约束会让「先清空再关掉」这种操作存不进去。
 * 填一半的后果由读接口兜住：缺 key 时一律当作未启用，见 captcha.service.ts
 */
const captchaCredentialDTO = () =>
	t.Object({
		siteKey: t.String({
			maxLength: 255,
			description: "站点密钥（公开，前端加载验证框时要用）",
			error: "captcha.site_key_range",
		}),
		secretKey: t.String({
			maxLength: 255,
			description: "服务端密钥（私密，仅后端向服务商求证时使用）",
			error: "captcha.secret_key_range",
		}),
	});

export const CaptchaConfigUpsertDTO = t.Object({
	configKey: t.Literal("captcha"),
	configValue: t.Object({
		enabled: t.Boolean({
			description: "总开关，关闭时所有入口都不校验",
		}),
		provider: tStringEnum(captchaProviders, {
			description: "当前启用的验证码服务商",
			error: "captcha.provider_invalid",
		}),
		// 每家各存一份密钥，只有 provider 指向的那家真正生效。
		//
		// 同时启用多家是没有意义的（一个表单只放得下一个验证框），这么存是
		// 为了换服务商时不把上一家的 key 冲掉 —— 国内 Turnstile 时好时坏，
		// 站长很可能同时申请两三家轮着试，每切一次都要重新粘密钥太折腾。
		//
		// 整体和每一家都可选：初次保存、以及以后 captchaProviders 里加了新
		// 服务商时，存量配置不会因为少字段而校验失败。
		// 字段名必须与 db/constants/captcha.constants.ts 的 captchaProviders 一致
		credentials: t.Optional(
			t.Object({
				turnstile: t.Optional(captchaCredentialDTO()),
				hcaptcha: t.Optional(captchaCredentialDTO()),
				recaptcha: t.Optional(captchaCredentialDTO()),
			}),
		),
		// 仅 reCAPTCHA v3 用得上：它不回答「是 / 否」，只给一个 0.0~1.0 的
		// 可信度分，越接近 1 越像真人 —— 所以阈值调高是更严格，不是更宽松。
		// Turnstile 和 hCaptcha 没有这个概念，前端应当只在选中 recaptcha 时
		// 显示这一项。缺省时后端按 RECAPTCHA_DEFAULT_MIN_SCORE(0.5) 处理
		recaptchaMinScore: t.Optional(
			t.Number({
				minimum: 0,
				maximum: 1,
				description: "reCAPTCHA v3 的通过分数线（0~1，越高越严格）",
				error: "captcha.recaptcha_score_range",
			}),
		),
		// 各入口的分开关。字段全部可选、缺省视为关闭：以后 captchaScenes 里
		// 加了新入口，存量配置不会因为少一个字段而校验失败。
		// 字段名必须与 db/constants/captcha.constants.ts 的 captchaScenes 一致
		scenes: t.Optional(
			t.Object({
				login: t.Optional(t.Boolean({ description: "登录" })),
				forgotPassword: t.Optional(t.Boolean({ description: "忘记密码" })),
				friendApply: t.Optional(t.Boolean({ description: "友链申请" })),
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
	AnnouncementConfigUpsertDTO,
	CaptchaConfigUpsertDTO,
]);

export type TAppearanceConfigUpsertDTO = Static<
	typeof AppearanceConfigUpsertDTO
>;
export type TSiteInfoConfigUpsertDTO = Static<typeof SiteInfoConfigUpsertDTO>;
export type TPersonalInfoConfigUpsertDTO = Static<
	typeof PersonalInfoConfigUpsertDTO
>;
export type TSMTPConfigUpsertDTO = Static<typeof SMTPConfigUpsertDTO>;
export type TAnnouncementConfigUpsertDTO = Static<
	typeof AnnouncementConfigUpsertDTO
>;
export type TCaptchaConfigUpsertDTO = Static<typeof CaptchaConfigUpsertDTO>;
export type TConfigUpsertDTO = Static<typeof ConfigUpsertDTO>;

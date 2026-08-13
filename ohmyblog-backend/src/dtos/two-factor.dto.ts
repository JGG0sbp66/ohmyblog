// src/dtos/two-factor.dto.ts
import { type Static, t } from "elysia";
import {
	RECOVERY_CODE_LENGTH,
	TOTP_DIGITS,
} from "../../db/constants/two-factor.constants";

// 1. 启用两步验证 - 提交验证器 App 上的首个验证码
//    刻意要求先验一次再落库：用户手抄密钥抄错的情况不罕见，
//    先启用后验证等于允许他把自己锁在门外。
export const TwoFactorTokenDTO = t.Object({
	token: t.String({
		minLength: TOTP_DIGITS,
		maxLength: TOTP_DIGITS,
		description: `验证器 App 上显示的 ${TOTP_DIGITS} 位验证码`,
		examples: ["123456"],
		error: "two_factor.token_invalid",
	}),
});

// 2. 关闭两步验证 - 用密码二次确认
//    关闭是降低安全等级的操作，不能只靠「已登录」这一个条件，
//    否则会话被劫持后可以静默摘掉第二因子。
export const TwoFactorDisableDTO = t.Object({
	password: t.String({
		minLength: 1,
		description: "当前账号密码",
		error: "two_factor.password_required",
	}),
});

// 3. 登录第二步 - 提交验证码或恢复码
//    两者共用一个字段，由 service 按格式分派（纯数字 = TOTP，其余 = 恢复码）。
//    上限放宽到恢复码带分隔符的长度，避免用户照抄时被 DTO 拦掉。
export const TwoFactorVerifyDTO = t.Object({
	code: t.String({
		minLength: TOTP_DIGITS,
		maxLength: RECOVERY_CODE_LENGTH + 4,
		description: "验证器验证码，或任一未使用的恢复码",
		examples: ["123456", "ABCDE-FGHJK"],
		error: "two_factor.code_invalid",
	}),
});

export type TTwoFactorTokenDTO = Static<typeof TwoFactorTokenDTO>;
export type TTwoFactorDisableDTO = Static<typeof TwoFactorDisableDTO>;
export type TTwoFactorVerifyDTO = Static<typeof TwoFactorVerifyDTO>;

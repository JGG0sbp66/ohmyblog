// src/dtos/auth.dto.ts
import { type Static, t } from "elysia";

// 1. 注册 DTO
export const RegisterDTO = t.Object({
	username: t.String({
		minLength: 3,
		maxLength: 50,
		description: "用户名",
		examples: ["zhangsan"],
		error: "auth.username_range",
	}),
	email: t.String({
		format: "email",
		description: "邮箱",
		examples: ["test@example.com"],
		error: "auth.email_invalid",
	}),
	password: t.String({
		minLength: 6,
		maxLength: 50,
		description: "密码",
		error: "auth.password_range",
	}),
});

// 2. 登录 DTO
export const LoginDTO = t.Object({
	identifier: t.String({
		description: "用户名或邮箱",
		examples: ["admin"],
	}),
	password: t.String({
		description: "密码",
	}),
});

// 3. 更新账号信息 DTO
export const UpdateAccountDTO = t.Object({
	username: t.Optional(
		t.String({
			minLength: 3,
			maxLength: 50,
			description: "用户名",
			error: "auth.username_range",
		}),
	),
	email: t.Optional(
		t.String({
			format: "email",
			description: "邮箱",
			error: "auth.email_invalid",
		}),
	),
	password: t.Optional(
		t.String({
			minLength: 6,
			maxLength: 50,
			description: "新密码",
			error: "auth.password_range",
		}),
	),
});

// 4. 忘记密码 - 请求验证码
export const ForgotPasswordDTO = t.Object({
	email: t.String({
		format: "email",
		description: "用于接收验证码的邮箱",
		examples: ["test@example.com"],
		error: "auth.email_invalid",
	}),
});

// 5. 重置密码 - 提交验证码 + 新密码
export const ResetPasswordDTO = t.Object({
	email: t.String({
		format: "email",
		description: "邮箱（与请求验证码时保持一致）",
		examples: ["test@example.com"],
		error: "auth.email_invalid",
	}),
	code: t.String({
		minLength: 6,
		maxLength: 6,
		description: "6 位邮箱验证码",
		examples: ["123456"],
		error: "auth.code_invalid",
	}),
	newPassword: t.String({
		minLength: 6,
		maxLength: 50,
		description: "新密码",
		error: "auth.password_range",
	}),
});

export type TRegisterDTO = Static<typeof RegisterDTO>;
export type TLoginDTO = Static<typeof LoginDTO>;
export type TUpdateAccountDTO = Static<typeof UpdateAccountDTO>;
export type TForgotPasswordDTO = Static<typeof ForgotPasswordDTO>;
export type TResetPasswordDTO = Static<typeof ResetPasswordDTO>;

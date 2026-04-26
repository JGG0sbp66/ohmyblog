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

export type TRegisterDTO = Static<typeof RegisterDTO>;
export type TLoginDTO = Static<typeof LoginDTO>;
export type TUpdateAccountDTO = Static<typeof UpdateAccountDTO>;

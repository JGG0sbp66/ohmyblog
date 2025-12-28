// src/dtos/auth.dto.ts
import { t, type Static } from "elysia";

// 1. 注册 DTO
export const RegisterDTO = t.Object({
    username: t.String({
        minLength: 3,
        maxLength: 50,
        description: "用户名",
        examples: ["zhangsan"]
    }),
    email: t.String({
        format: 'email',
        description: "邮箱",
        examples: ["test@example.com"]
    }),
    password: t.String({
        minLength: 6,
        maxLength: 50,
        description: "密码"
    })
});

// 2. 登录 DTO
export const LoginDTO = t.Object({
    identifier: t.String({
        description: "用户名或邮箱",
        examples: ["admin"]
    }),
    password: t.String({
        description: "密码"
    })
});

export type TRegisterDTO = Static<typeof RegisterDTO>;
export type TLoginDTO = Static<typeof LoginDTO>;
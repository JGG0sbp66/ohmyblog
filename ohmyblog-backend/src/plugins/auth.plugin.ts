// src/plugins/auth.plugin.ts
import { Roles } from "../../db/schema";
import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { config } from "../env";
import { BusinessError } from "./errors";

export const createRoleGuard = (expectedRole: Roles) => async (ctx: any) => {
    const { jwt, set, cookie: { auth_token } } = ctx;
    const token = auth_token.value;

    // 1. 如果没有 token，说明未登录
    if (!token || typeof token !== "string") {
        set.status = 401;
        throw new BusinessError("未登录或会话已过期", {
            status: 401,
        });
    }

    // 2. 验证 JWT
    const payload = await jwt.verify(token);
    if (!payload) {
        set.status = 401;
        // Token 过期或非法时，建议清除无效 Cookie
        auth_token.remove();
        throw new BusinessError("未登录或会话已过期", {
            status: 401,
        });
    }

    // 3. 权限校验
    // 如果角色不匹配且不是管理员 (admin)，则拦截
    if (payload.role !== expectedRole && payload.role !== "admin") {
        set.status = 403;
        throw new BusinessError("权限不足", { status: 403 });
    }

    // 4. 将用户信息存入 context，方便后续路由使用
    ctx.user = payload;
};

export const jwtConfig = {
    name: "jwt",
    secret: config.JWT_SECRET as string,
    schema: t.Object({
        uuid: t.String(),
        role: t.String(),
        username: t.String(),
    }),
};

export type JwtUserPayload = {
    uuid: string;
    role: string;
    username: string;
};

export const authPlugin = new Elysia({ name: "authPlugin" })
    .use(jwt(jwtConfig))
    // 将 JWT 中的用户信息注入到 context，便于后续路由直接使用 ctx.user
    .derive(async ({ cookie: { auth_token }, jwt }) => {
        const token = auth_token?.value;
        if (!token || typeof token !== "string") {
            return { user: undefined as JwtUserPayload | undefined };
        }

        const payload = await jwt.verify(token).catch(() => undefined) as
            | JwtUserPayload
            | undefined;
        if (!payload) {
            // Token 失效时清理 Cookie，避免后续重复校验
            auth_token.remove?.();
            return { user: undefined as JwtUserPayload | undefined };
        }

        return { user: payload };
    })
    .macro({
        role: (expectedRole: Roles) => ({
            beforeHandle: createRoleGuard(expectedRole),
        }),
    });

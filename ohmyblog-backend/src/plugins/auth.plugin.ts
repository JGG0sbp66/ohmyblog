import { Roles } from "../../db/schema";
import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { config } from "../env";
import { BusinessError } from "./errors";

export type JwtUserPayload = {
    uuid: string;
    role: string;
    username: string;
};

// JWT 配置
export const jwtConfig = {
    name: "jwt",
    secret: config.JWT_SECRET as string,
    schema: t.Object({
        uuid: t.String(),
        role: t.String(),
        username: t.String(),
    }),
};

/**
 * 权限校验逻辑 (仅负责检查 user 对象，不负责解析 Token)
 * 此时 derive 已经运行过了，ctx 中已经有 user 了
 * @param expectedRole 需要满足的角色（管理员也默认放行）
 * @returns Elysia beforeHandle 兼容的守卫函数
 */
export const createRoleGuard =
    (expectedRole: Roles) => ({ user, set, cookie: { auth_token } }: any) => {
        // 如果 derive 没找到 user，说明 Token 无效或缺失
        if (!user) {
            // 清理可能存在的无效 Cookie
            auth_token.remove();
            throw new BusinessError("未登录或会话已过期", { status: 401 });
        }

        // 角色校验 (管理员放行)
        if (user.role !== expectedRole && user.role !== "admin") {
            throw new BusinessError("权限不足", { status: 403 });
        }
    };

export const authPlugin = new Elysia({ name: "authPlugin" })
    .use(jwt(jwtConfig))
    .derive({ as: "global" }, async ({ jwt, cookie: { auth_token } }) => {
        const token = auth_token.value;

        // 如果没有 token，直接返回空 user，让后面的 Guard 去拦截
        if (!token) return { user: null };

        if (!token || typeof token !== "string") {
            return { user: null };
        }

        // 验证 JWT
        const payload = await jwt.verify(token);
        if (!payload) return { user: null };

        // 返回 user 对象，后续所有路由都能通过 ctx.user 拿到
        return {
            user: payload as JwtUserPayload,
        };
    })
    .macro({
        // 定义宏：在路由上直接写 role: "admin"
        role: (expectedRole: Roles) => ({
            beforeHandle: createRoleGuard(expectedRole),
        }),
    });

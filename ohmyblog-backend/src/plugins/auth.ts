import { Roles } from "../../db/schema";
import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { config } from "../env";

export const jwtConfig = {
    name: 'jwt',
    secret: config.JWT_SECRET as string,
    schema: t.Object({
        uuid: t.String(),
        role: t.String(), 
        username: t.String()
    })
};

export const authPlugin = (app: Elysia) => app
    .use(jwt(jwtConfig))
    .macro({
        role: (expectedRole: Roles) => ({
            async beforeHandle( { jwt, set, cookie: { auth_token } }) {
                const token = auth_token.value;

                // 1. 如果没有 token，说明未登录
                if (!token || typeof token !== 'string') {
                    set.status = 401;
                    throw new Error("未登录或会话已过期");
                }

                // 2. 验证 JWT
                const payload = await jwt.verify(token);
                if (!payload) {
                    set.status = 401;
                    // Token 过期或非法时，建议清除无效 Cookie
                    auth_token.remove(); 
                    throw new Error("未登录或会话已过期");
                }

                // 3. 权限校验
                // 如果角色不匹配且不是超级管理员 (admin)，则拦截
                if (payload.role !== expectedRole && payload.role !== 'admin') {
                    set.status = 403;
                    throw new Error("权限不足");
                }

                // 4. 将用户信息存入 context，方便后续路由使用
                return {
                    user: payload
                };
            }
        })
    })
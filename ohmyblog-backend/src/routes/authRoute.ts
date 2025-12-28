import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { authService } from "../services/authService";
import { RegisterDTO, LoginDTO } from "../dtos/auth.dto";

// TODO: 后续新增鉴权plugin插件功能

// TODO: 后续新增读取环境变量功能，这里先暂时写死
const jwtConfig = {
    name: 'jwt',
    secret: 'ohmyblog_secret_key_change_me',
    exp: '7d',
    schema: t.Object({
        id: t.String(),
        role: t.String(),
        username: t.String()
    })
};

export const authRoute = (app: Elysia) =>
    app.group('/auth',
        {
            detail: { tags: ['Auth (认证)'] }
        },
        (app) => app
            .use(jwt(jwtConfig))

            // === 注册接口 ===
            .post('/register', async ({ body, set }) => {
                const user = await authService.register(body);

                set.status = 201;

                return {
                    user: {
                        id: user.uuid,
                        username: user.username,
                        role: user.role
                    }
                };
            }, {
                detail: { summary: "用户注册" },
                body: RegisterDTO
            })

            // === 登录接口 ===
            .post('/login', async ({ body, jwt, cookie }) => {
                const user = await authService.login(body.identifier, body.password);

                const token = await jwt.sign({
                    id: user.uuid,
                    role: user.role!, 
                    username: user.username
                });

                cookie.auth_token.set({
                    value: token,
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 7 * 86400,
                    path: '/',
                    sameSite: 'lax',
                });

                return {
                    user: {
                        id: user.uuid,
                        username: user.username,
                        role: user.role,
                        avatar: user.avatarUrl
                    }
                };
            }, {
                detail: { summary: "用户登录" },
                body: LoginDTO
            })

            // === 登出接口 ===
            .post('/logout', ({ cookie }) => {
                cookie.auth_token.remove();
                return { success: true, message: "已退出登录" };
            }, {
                detail: { summary: "退出登录" }
            })
    );
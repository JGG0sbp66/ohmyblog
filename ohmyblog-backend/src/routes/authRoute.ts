import { Elysia } from "elysia";
import { authService } from "../services/authService";
import { RegisterDTO, LoginDTO } from "../dtos/auth.dto";
import { authPlugin } from "../plugins/auth";

export const authRoute = (app: Elysia) =>
    app.group('/auth',
        {
            detail: { tags: ['Auth (认证)'] }
        },
        (app) => app
            .use(authPlugin)

            // === 注册接口 ===
            .post('/register', async ({ body, set }) => {
                const user = await authService.register(body);

                set.status = 201;

                return {
                    user: {
                        uuid: user.uuid,
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
                    uuid: user.uuid,
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
                        uuid: user.uuid,
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
                return { message: "已退出登录" };
            }, {
                detail: { summary: "退出登录" }
            })
    );
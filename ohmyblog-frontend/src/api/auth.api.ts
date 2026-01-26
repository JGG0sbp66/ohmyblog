import { api, unwrap } from "./client";
import type { TLoginDTO, TRegisterDTO } from "@server/dtos/auth.dto";

/**
 * POST /api/auth/register
 * 注册新用户
 */
export const register = (data: TRegisterDTO) =>
  unwrap(api.api.auth.register.post(data));

/**
 * POST /api/auth/login
 * 登陆
 */
export const login = (data: TLoginDTO) => {
  return unwrap(api.api.auth.login.post(data));
};

/**
 * POST /api/auth/logout
 * 登出
 */
export const logout = () => {
  return unwrap(api.api.auth.logout.post());
};

import { api, unwrap } from "./client";
import type {
  TForgotPasswordDTO,
  TLoginDTO,
  TRegisterDTO,
  TResetPasswordDTO,
  TUpdateAccountDTO,
} from "@server/dtos/auth.dto";

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
 * PATCH /api/auth/me
 * 更新账号信息
 */
export const updateAccount = (data: TUpdateAccountDTO) => {
  return unwrap(api.api.auth.me.patch(data));
};

/**
 * POST /api/auth/logout
 * 登出
 */
export const logout = () => {
  return unwrap(api.api.auth.logout.post());
};

/**
 * GET /api/auth/me
 * 获取当前登录用户
 */
export const getMe = () => {
  return unwrap(api.api.auth.me.get());
};

/**
 * POST /api/auth/forgot-password
 * 忘记密码 - 请求验证码
 *
 * 后端无论邮箱是否存在都返回成功，前端不需要做特殊处理
 */
export const forgotPassword = (data: TForgotPasswordDTO) => {
  return unwrap(api.api.auth["forgot-password"].post(data));
};

/**
 * POST /api/auth/reset-password
 * 忘记密码 - 提交验证码并设置新密码
 */
export const resetPassword = (data: TResetPasswordDTO) => {
  return unwrap(api.api.auth["reset-password"].post(data));
};

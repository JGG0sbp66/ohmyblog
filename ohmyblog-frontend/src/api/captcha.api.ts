// src/api/captcha.api.ts
import { api, unwrap } from "./client";
import type { TCaptchaTestDTO } from "@server/dtos/captcha.dto";

/**
 * GET /api/captcha
 * 读取验证码公开配置
 *
 * 未登录也能读 —— 登录页、忘记密码页、友链申请表单都要靠它决定
 * 显不显示验证框、用哪家、用哪个 siteKey。返回值里没有 secret。
 */
export const getCaptchaConfig = () => unwrap(api.api.captcha.get());

/**
 * POST /api/captcha/test
 * 拿表单里当前填的密钥试一次（管理员）
 *
 * 与 /email/test-smtp 同一个思路：先试通再保存，不读也不改已存的配置。
 */
export const testCaptcha = (data: TCaptchaTestDTO) =>
  unwrap(api.api.captcha.test.post(data));

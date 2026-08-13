import { api, unwrap } from "./client";
import type {
  TTwoFactorDisableDTO,
  TTwoFactorTokenDTO,
  TTwoFactorVerifyDTO,
} from "@server/dtos/two-factor.dto";

/**
 * GET /api/two-factor/status
 * 查询当前账号的两步验证状态（是否启用、启用时间、剩余恢复码数量）
 */
export const getTwoFactorStatus = () =>
  unwrap(api.api["two-factor"].status.get());

/**
 * POST /api/two-factor/setup
 * 绑定第一步：生成新密钥，返回 base32 密钥与 otpauth URI
 *
 * 此时还没启用，必须再调 enableTwoFactor 提交一次验证码确认
 */
export const startTwoFactorSetup = () =>
  unwrap(api.api["two-factor"].setup.post());

/**
 * POST /api/two-factor/enable
 * 绑定第二步：提交验证器上的验证码，通过后启用并返回恢复码明文
 *
 * 恢复码只在这一次响应里出现，之后任何接口都读不到
 */
export const enableTwoFactor = (data: TTwoFactorTokenDTO) =>
  unwrap(api.api["two-factor"].enable.post(data));

/**
 * POST /api/two-factor/disable
 * 关闭两步验证，需要密码二次确认
 */
export const disableTwoFactor = (data: TTwoFactorDisableDTO) =>
  unwrap(api.api["two-factor"].disable.post(data));

/**
 * POST /api/two-factor/recovery-codes
 * 重新生成恢复码（旧的整批作废），需要提交一次当前验证码
 */
export const regenerateRecoveryCodes = (data: TTwoFactorTokenDTO) =>
  unwrap(api.api["two-factor"]["recovery-codes"].post(data));

/**
 * POST /api/two-factor/verify
 * 登录第二步：提交验证码或恢复码，通过后才会下发 auth_token
 *
 * 身份由登录第一步下发的 challenge cookie 承载，前端不需要传用户信息
 */
export const verifyTwoFactor = (data: TTwoFactorVerifyDTO) =>
  unwrap(api.api["two-factor"].verify.post(data));

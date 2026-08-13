// db/constants/email-verification.constants.ts
//
// 邮件验证码（目前只有「忘记密码」的 6 位 OTP）的共享参数。
// 与同目录其他 constants 一样保持零依赖，前端可安全 import
// （例如在页面上提示"验证码 5 分钟内有效"、"最多可重试 5 次"）。

export const emailVerificationTypes = ["reset_password"] as const;

export type TEmailVerificationType = (typeof emailVerificationTypes)[number];

/**
 * 重置密码验证码有效期（分钟）。
 *
 * 这个值同时是攻击者的爆破窗口：6 位数字只有 90 万种可能，而校验一次只是
 * 一次索引查询（不像登录要跑 Argon2），所以窗口越短越好。5 分钟对正常用户
 * 「收邮件 → 复制 → 粘贴」是够的。
 */
export const RESET_PASSWORD_CODE_TTL_MIN = 5;

/**
 * 单个验证码允许的失败次数，超过即作废，必须重新申请。
 *
 * 这是防爆破的核心：有效期只限制「一个码能活多久」，限制不了「每秒能猜多少
 * 次」。90 万种可能配上不限次数的重试，几小时内就能撞开。加上这个上限后，
 * 每猜 5 次就必须重新走一遍发信流程，而发信本身受下面两个限制约束。
 */
export const RESET_PASSWORD_MAX_ATTEMPTS = 5;

/**
 * 同一账号两封重置邮件之间的最小间隔（秒）。
 *
 * 冷却期内重复请求直接静默返回，既不发信也不换码 —— 换码会把上面的失败
 * 次数一起清零，等于给攻击者一个免费的重置计数器。
 */
export const RESET_PASSWORD_RESEND_COOLDOWN_SEC = 60;

/** 同一账号每小时最多能触发的重置邮件数，防止 SMTP 配额被刷爆、收件箱被轰炸 */
export const RESET_PASSWORD_HOURLY_QUOTA = 5;

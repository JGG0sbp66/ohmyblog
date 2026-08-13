// db/constants/two-factor.constants.ts
//
// 两步验证（TOTP）的共享参数。前后端都要用：
//   - 后端生成 / 校验 TOTP，签发恢复码
//   - 前端限制验证码输入框长度、展示恢复码数量
// 与同目录其他 constants 一样保持零依赖，前端可安全 import。

/** TOTP 验证码位数。6 位是各家验证器 App 的通用值，改了会导致已绑定的用户失效 */
export const TOTP_DIGITS = 6;

/** TOTP 时间步长（秒） */
export const TOTP_PERIOD = 30;

/**
 * 校验时容忍的时间窗口数。
 * 1 表示除当前窗口外，前后各多试一个 30s 窗口，用来兜住客户端与服务端的时钟偏移。
 */
export const TOTP_WINDOW = 1;

/** 每次生成的恢复码数量 */
export const RECOVERY_CODE_COUNT = 10;

/** 单个恢复码的字符数（不含中间的分隔符） */
export const RECOVERY_CODE_LENGTH = 10;

/** 恢复码字符表：去掉了 0/O、1/I/L 这些手抄容易混淆的字符 */
export const RECOVERY_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * 验证失败次数用尽时后端抛出的固定文案。
 *
 * 放在共享常量里是因为前端要拿它和 catch 到的 message 做等值比较，
 * 从而把界面退回密码那一步（此时 challenge 已作废，留在第二步只会一直失败）。
 * unwrap() 抛出的就是后端的中文 message 本身，项目里
 * `if (error === "配置不存在")` 这类比较是既有约定 —— 但那种写法两侧
 * 各自硬编码字面量，改一处就会静默失效，所以这里让它同源。
 */
export const TWO_FACTOR_EXHAUSTED_MESSAGE = "验证失败次数过多，请重新登录";

/**
 * challenge 已过期 / 不存在时后端抛出的固定文案。
 *
 * 与 TWO_FACTOR_EXHAUSTED_MESSAGE 同理：route 层要靠它决定是否清除 challenge
 * cookie，前端也要靠它把界面退回密码那一步，所以必须同源，不能各处写字面量。
 */
export const TWO_FACTOR_CHALLENGE_EXPIRED_MESSAGE =
	"验证会话已过期，请重新登录";

/**
 * src/api/shared.ts
 *
 * 前后端共享类型与常量入口 (SSOT)
 * 统一从后端常量和 DTO 中导出，避免前端硬编码。
 */

// 1. 邮件相关
export {
  emailLogStatuses,
  emailLogTypes,
} from "@server/db/constants/email-log.constants";

export type {
  TEmailLogStatus,
  TEmailLogType,
} from "@server/db/constants/email-log.constants";

export { emailVerificationTypes } from "@server/db/constants/email-verification.constants";

export type { TEmailVerificationType } from "@server/db/constants/email-verification.constants";

// 2. 用户相关
export {
  roles as userRoles,
  statuses as userStatuses,
} from "@server/db/constants/user.constants";

export type {
  Roles as TUserRole,
  Statuses as TUserStatus,
} from "@server/db/constants/user.constants";

// 3. 配置相关
export {
  themeModes as THEME_MODES,
  supportedLanguages as SUPPORTED_LANGUAGES,
  configKeys as CONFIG_KEYS,
} from "@server/db/constants/config.constants";

export type {
  TThemeMode,
  TLanguage,
  TConfigKey,
} from "@server/db/constants/config.constants";

export type { TResetPasswordDTO as ForgotPasswordForm } from "@server/dtos/auth.dto";

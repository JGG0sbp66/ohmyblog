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

import type { TSiteInfoConfigUpsertDTO } from "@server/dtos/config.dto";

/**
 * 页脚链接分组（站点配置里的一项）。
 *
 * 从 site_info 的 DTO 里推导而不是另写一份接口，避免前端结构和后端校验各自漂移。
 */
export type TFooterLinkGroup = NonNullable<
  TSiteInfoConfigUpsertDTO["configValue"]["footerLinks"]
>[number];

// 4. 上传相关
export {
  uploadLimits as UPLOAD_LIMITS,
  formatUploadLimit,
  uploadLimitMessage,
} from "@server/db/constants/upload.constants";

export type { TUploadKind } from "@server/db/constants/upload.constants";

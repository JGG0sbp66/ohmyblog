// src/api/email.api.ts
import { api, unwrap } from "./client";
import type { TSMTPConfigUpsertDTO } from "@server/dtos/config.dto";

/**
 * POST /api/email/test-smtp
 * 测试 SMTP 服务器连接
 */
export const testSMTPConnection = (
  data: TSMTPConfigUpsertDTO["configValue"],
) => {
  return unwrap(api.api.email["test-smtp"].post(data));
};

// src/api/email.api.ts
import { api, unwrap } from "./client";
import type { TSMTPConfigUpsertDTO } from "@server/dtos/config.dto";
import type { TEmailSendDTO } from "@server/dtos/email.dto";

/**
 * POST /api/email/test-smtp
 * 测试 SMTP 服务器连接
 */
export const testSMTPConnection = (
  data: TSMTPConfigUpsertDTO["configValue"],
) => {
  return unwrap(api.api.email["test-smtp"].post(data));
};

/**
 * POST /api/email/send
 * 发送通知邮件
 */
export const sendEmail = (data: TEmailSendDTO) => {
  return unwrap(api.api.email.send.post(data));
};

// src/api/email.api.ts
import { api, unwrap } from "./client";
import type { TSMTPConfigUpsertDTO } from "@server/dtos/config.dto";
import type {
  TEmailLogQueryDTO,
  TEmailTestDTO,
} from "@server/dtos/email.dto";

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
 * POST /api/email/send-test-email
 * 发送 SMTP 测试邮件
 */
export const sendTestEmail = (data: TEmailTestDTO) => {
  return unwrap(api.api.email["send-test-email"].post(data));
};

/**
 * GET /api/email/logs
 * 分页查询邮件发送记录（管理员专用）
 */
export const getEmailLogs = (query: TEmailLogQueryDTO) => {
  return unwrap(api.api.email.logs.get({ query }));
};

/**
 * 构造邮件预览的 iframe URL（不直接发请求，由 iframe 自己 GET）
 *
 * 后端会以 text/html 返回，浏览器自动渲染。
 * 这里返回相对路径即可，前端在同源下访问。
 */
export const getEmailLogPreviewUrl = (uuid: string): string => {
  return `/api/email/logs/${encodeURIComponent(uuid)}/preview`;
};

/**
 * GET /api/email/unread-count
 * 获取未读邮件记录总数
 */
export const getEmailUnreadCount = () => {
  return unwrap(api.api.email["unread-count"].get());
};

/**
 * POST /api/email/mark-all-read
 * 将所有未读邮件标记为已读
 */
export const markAllEmailsAsRead = () => {
  return unwrap(api.api.email["mark-all-read"].post());
};

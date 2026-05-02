// src/utils/email.ts
import type { EmailLogItem } from "@/views/admin/components/emails/types";

type TFunc = (key: string, params?: Record<string, unknown>) => string;

/**
 * 根据邮件类型和 params 快照，生成列表卡片的正文预览文本
 * @param item 邮件日志条目
 * @param t i18n 翻译函数（由调用方从 useLang() 传入）
 */
export function getEmailBodyPreview(item: EmailLogItem, t: TFunc): string {
  const p = (item.params ?? {}) as Record<string, unknown>;

  switch (item.type) {
    case "smtp_test":
      return t("views.emails.body_preview.smtp_test", {
        senderEmail: p.senderEmail ?? item.fromEmail,
      });
    case "login_alert":
      return t("views.emails.body_preview.login_alert", {
        location: p.currentLocation ?? p.currentIp ?? "-",
        ip: p.currentIp ?? "-",
      });
    case "reset_password":
      return t("views.emails.body_preview.reset_password", {
        location: p.location ?? "-",
        ip: p.ip ?? "-",
        minutes: p.expiresInMinutes ?? "-",
      });
    default:
      return item.to;
  }
}

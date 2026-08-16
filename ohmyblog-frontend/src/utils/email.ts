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
    // 友链四类：后端 templateProps 字段与词条插值不同名（siteName/applicantSiteName → {name}）
    case "friend_link_apply":
      return t("views.emails.body_preview.friend_link_apply", {
        name: p.siteName ?? "-",
        url: p.siteUrl ?? "-",
      });
    case "friend_link_apply_confirmed":
      return t("views.emails.body_preview.friend_link_apply_confirmed", {
        name: p.applicantSiteName ?? "-",
      });
    case "friend_link_approved":
      return t("views.emails.body_preview.friend_link_approved", {
        name: p.applicantSiteName ?? "-",
      });
    case "friend_link_rejected":
      return t("views.emails.body_preview.friend_link_rejected", {
        name: p.applicantSiteName ?? "-",
      });
    default:
      return item.to;
  }
}

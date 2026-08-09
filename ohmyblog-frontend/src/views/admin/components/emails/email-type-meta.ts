import {
  BadgeCheck,
  FlaskConical,
  KeyRound,
  Link2,
  Link2Off,
  MailCheck,
  ShieldAlert,
} from "lucide-vue-next";
import type { Component } from "vue";
import type { TEmailLogType } from "@/api/shared";

export type EmailTypeGroup = "system" | "friendLinks";

interface EmailTypeMeta {
  group: EmailTypeGroup;
  icon: Component;
  iconClass: string;
  badgeClass: string;
}

/**
 * 邮件类型的唯一视觉配置，筛选菜单和邮件列表共同使用。
 * Record 会在后端增加邮件类型但前端忘记配置时直接触发类型错误。
 */
export const emailTypeMeta = {
  smtp_test: {
    group: "system",
    icon: FlaskConical,
    iconClass: "text-blue-500 dark:text-blue-400",
    badgeClass: "bg-blue-500/10 ring-blue-500/15",
  },
  login_alert: {
    group: "system",
    icon: ShieldAlert,
    iconClass: "text-amber-500 dark:text-amber-400",
    badgeClass: "bg-amber-500/10 ring-amber-500/15",
  },
  reset_password: {
    group: "system",
    icon: KeyRound,
    iconClass: "text-violet-500 dark:text-violet-400",
    badgeClass: "bg-violet-500/10 ring-violet-500/15",
  },
  friend_link_apply: {
    group: "friendLinks",
    icon: Link2,
    iconClass: "text-cyan-500 dark:text-cyan-400",
    badgeClass: "bg-cyan-500/10 ring-cyan-500/15",
  },
  friend_link_apply_confirmed: {
    group: "friendLinks",
    icon: MailCheck,
    iconClass: "text-sky-500 dark:text-sky-400",
    badgeClass: "bg-sky-500/10 ring-sky-500/15",
  },
  friend_link_approved: {
    group: "friendLinks",
    icon: BadgeCheck,
    iconClass: "text-emerald-500 dark:text-emerald-400",
    badgeClass: "bg-emerald-500/10 ring-emerald-500/15",
  },
  friend_link_rejected: {
    group: "friendLinks",
    icon: Link2Off,
    iconClass: "text-rose-500 dark:text-rose-400",
    badgeClass: "bg-rose-500/10 ring-rose-500/15",
  },
} satisfies Record<TEmailLogType, EmailTypeMeta>;

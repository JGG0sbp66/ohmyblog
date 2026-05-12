// db/table/email-log.constants.ts

export const emailLogTypes = [
	"smtp_test",
	"login_alert",
	"reset_password",
	"friend_link_apply",
	"friend_link_apply_confirmed",
	"friend_link_approved",
	"friend_link_rejected",
] as const;

export const emailLogStatuses = ["success", "failed"] as const;

export type TEmailLogType = (typeof emailLogTypes)[number];
export type TEmailLogStatus = (typeof emailLogStatuses)[number];

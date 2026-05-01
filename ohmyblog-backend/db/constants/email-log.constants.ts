// db/table/email-log.constants.ts

export const emailLogTypes = [
	"smtp_test",
	"login_alert",
	"reset_password",
] as const;

export const emailLogStatuses = ["success", "failed"] as const;

export type TEmailLogType = (typeof emailLogTypes)[number];
export type TEmailLogStatus = (typeof emailLogStatuses)[number];

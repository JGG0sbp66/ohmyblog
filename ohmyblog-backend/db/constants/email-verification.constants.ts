// db/constants/email-verification.constants.ts

export const emailVerificationTypes = ["reset_password"] as const;

export type TEmailVerificationType = (typeof emailVerificationTypes)[number];

// db/constants/user.constants.ts

export const roles = ["admin", "user"] as const;
export const statuses = ["active", "inactive", "banned"] as const;

export type Roles = (typeof roles)[number];
export type Statuses = (typeof statuses)[number];

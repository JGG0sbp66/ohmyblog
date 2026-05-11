// db/constants/friend-link.constants.ts

/** 友链状态：pending 待审批 / approved 已通过 / rejected 已拒绝 */
export const friendLinkStatuses = ["pending", "approved", "rejected"] as const;

export type TFriendLinkStatus = (typeof friendLinkStatuses)[number];

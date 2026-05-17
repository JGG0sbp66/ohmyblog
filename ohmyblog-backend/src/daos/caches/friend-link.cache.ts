// src/daos/caches/friend-link.cache.ts
//
// 前台只展示 approved 列表，且条目数极少（< 100），变化频率低（管理员手动审批）。
// 用单 key TTL 缓存即可，任何写操作都全量失效。

import type { friendLink } from "../../../db/schema";
import { TTLCache } from "../../utils/cache";

export type FriendLinkRow = typeof friendLink.$inferSelect;

/** 缓存里只放一条 entry，固定 key */
export const APPROVED_FRIEND_LINK_KEY = "approved";

export const friendLinkCache = new TTLCache<string, FriendLinkRow[]>({
	ttlMs: 60_000,
	maxSize: 4,
});

export function invalidateFriendLinks() {
	friendLinkCache.clear();
}

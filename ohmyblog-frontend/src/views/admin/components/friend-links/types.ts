// src/views/admin/components/friend-links/types.ts
import type { TFriendLink } from "@server/db/table/friend-link";
import type { TFriendLinkQueryDTO } from "@server/dtos/friend-link.dto";

/**
 * 列表/详情用的友链条目类型
 * 直接继承自后端 DB 推断类型，后端改字段时前端自动同步。
 */
export type FriendLinkItem = TFriendLink;

/** 列表筛选条件：复用后端 query DTO 的 status 字段 */
export type FriendLinkFilters = Pick<TFriendLinkQueryDTO, "status">;

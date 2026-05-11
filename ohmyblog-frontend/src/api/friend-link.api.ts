// src/api/friend-link.api.ts
import { api, unwrap } from "./client";
import type { TFriendLink } from "@server/db/table/friend-link";
import type {
  TApplyFriendLinkDTO,
  TFriendLinkQueryDTO,
  TRejectFriendLinkDTO,
  TUpdateFriendLinkDTO,
} from "@server/dtos/friend-link.dto";

/** 公开展示用的友链条目 */
export type FriendLinkItem = TFriendLink;

// ─── 前台公开接口 ─────────────────────────────────────────────────────────────

/**
 * GET /api/public/friends
 * 获取所有已通过的友链列表
 */
export const getApprovedFriendLinks = () => {
  return unwrap(api.api.public.friends.get());
};

/**
 * POST /api/public/friends/apply
 * 提交友链申请
 */
export const applyFriendLink = (body: TApplyFriendLinkDTO) => {
  return unwrap(api.api.public.friends.apply.post(body));
};

// ─── 管理员接口 ───────────────────────────────────────────────────────────────

/**
 * GET /api/friends
 * 分页获取友链列表（含状态筛选）
 */
export const getFriendLinks = (query: TFriendLinkQueryDTO) => {
  return unwrap(api.api.friends.get({ query }));
};

/**
 * GET /api/friends/pending-count
 * 获取待审批友链数量（仪表盘用）
 */
export const getFriendLinkPendingCount = () => {
  return unwrap(api.api.friends["pending-count"].get());
};

/**
 * GET /api/friends/:uuid
 * 获取单条友链详情
 */
export const getFriendLinkById = (uuid: string) => {
  return unwrap(api.api.friends({ uuid }).get());
};

/**
 * PATCH /api/friends/:uuid/approve
 * 审批通过
 */
export const approveFriendLink = (uuid: string) => {
  return unwrap(api.api.friends({ uuid }).approve.patch());
};

/**
 * PATCH /api/friends/:uuid/reject
 * 拒绝申请
 */
export const rejectFriendLink = (uuid: string, body: TRejectFriendLinkDTO) => {
  return unwrap(api.api.friends({ uuid }).reject.patch(body));
};

/**
 * PUT /api/friends/:uuid
 * 更新友链信息
 */
export const updateFriendLink = (uuid: string, body: TUpdateFriendLinkDTO) => {
  return unwrap(api.api.friends({ uuid }).put(body));
};

/**
 * DELETE /api/friends/:uuid
 * 删除友链
 */
export const deleteFriendLink = (uuid: string) => {
  return unwrap(api.api.friends({ uuid }).delete());
};

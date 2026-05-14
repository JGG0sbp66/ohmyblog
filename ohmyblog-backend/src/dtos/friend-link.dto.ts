// src/dtos/friend-link.dto.ts
import { type Static, t } from "elysia";
import { friendLinkStatuses } from "../../db/constants/friend-link.constants";
import { tStringEnum } from "../utils/typebox";

export const FriendLinkStatusFilter = tStringEnum(friendLinkStatuses);

/** 管理员分页查询 */
export const FriendLinkQueryDTO = t.Object({
	page: t.Optional(
		t.Numeric({ minimum: 1, default: 1, description: "页码，从 1 开始" }),
	),
	pageSize: t.Optional(
		t.Numeric({
			minimum: 1,
			maximum: 100,
			default: 20,
			description: "每页条数",
		}),
	),
	status: t.Optional(FriendLinkStatusFilter),
});

export type TFriendLinkQueryDTO = Static<typeof FriendLinkQueryDTO>;

/** 公开申请表单 */
export const ApplyFriendLinkDTO = t.Object({
	name: t.String({ minLength: 1, maxLength: 64, description: "站点名称" }),
	url: t.String({ format: "uri", description: "站点 URL" }),
	avatarUrl: t.Optional(
		t.String({ format: "uri", description: "站点图标 URL" }),
	),
	description: t.Optional(
		t.String({ maxLength: 200, description: "站点简介" }),
	),
	tags: t.Optional(
		t.Array(t.String({ maxLength: 20 }), { maxItems: 3, description: "标签" }),
	),
	applicantEmail: t.Optional(
		t.String({
			format: "email",
			description: "联系邮箱（审批结果将发送到此邮箱）",
		}),
	),
});

export type TApplyFriendLinkDTO = Static<typeof ApplyFriendLinkDTO>;

/** 管理员更新友链 */
export const UpdateFriendLinkDTO = t.Object({
	name: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
	url: t.Optional(t.String({ format: "uri" })),
	avatarUrl: t.Optional(t.Nullable(t.String({ format: "uri" }))),
	description: t.Optional(t.Nullable(t.String({ maxLength: 200 }))),
	tags: t.Optional(
		t.Nullable(t.Array(t.String({ maxLength: 20 }), { maxItems: 3 })),
	),
	joinedAt: t.Optional(
		t.Nullable(t.Number({ description: "入驻时间戳（秒）" })),
	),
});

export type TUpdateFriendLinkDTO = Static<typeof UpdateFriendLinkDTO>;

/** 管理员拒绝友链 */
export const RejectFriendLinkDTO = t.Object({
	rejectReason: t.Optional(
		t.String({ maxLength: 200, description: "拒绝原因" }),
	),
});

export type TRejectFriendLinkDTO = Static<typeof RejectFriendLinkDTO>;

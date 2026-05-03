// src/views/admin/components/posts/postStatusColors.ts
import type { TPostStatus } from "@server/db/constants/post.constants";

/** 各状态对应的 Tailwind 颜色类，PostListFilter 和 PostStatusBadge 共用 */
export const POST_STATUS_COLORS: Record<TPostStatus | "all", string> = {
  all:       "bg-accent/15 text-accent",
  published: "bg-green-500/15 text-green-600",
  draft:     "bg-amber-400/20 text-amber-500",
  archived:  "bg-purple-500/15 text-purple-500",
  deleted:   "bg-red-500/15 text-red-500",
};

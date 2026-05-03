// db/constants/post.constants.ts

export const postStatuses = [
	"draft",
	"published",
	"archived",
	"deleted",
] as const;

export type TPostStatus = (typeof postStatuses)[number];

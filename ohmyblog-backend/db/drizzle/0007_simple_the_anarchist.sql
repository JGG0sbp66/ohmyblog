CREATE TABLE `friend_link` (
	`uuid` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`avatar_url` text,
	`description` text,
	`tags` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reject_reason` text,
	`joined_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

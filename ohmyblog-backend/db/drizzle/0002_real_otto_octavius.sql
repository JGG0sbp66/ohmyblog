CREATE TABLE `email_log` (
	`uuid` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`to` text NOT NULL,
	`subject` text NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`params` text,
	`ip` text,
	`triggered_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `email_verification` (
	`uuid` text PRIMARY KEY NOT NULL,
	`user_uuid` text NOT NULL,
	`type` text NOT NULL,
	`code` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`ip` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `user` ADD `last_login_ip` text;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `avatar_url`;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `bio`;
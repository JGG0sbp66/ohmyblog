CREATE TABLE `two_factor_recovery_code` (
	`uuid` text PRIMARY KEY NOT NULL,
	`user_uuid` text NOT NULL,
	`code_hash` text NOT NULL,
	`used_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `user` ADD `two_factor_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `two_factor_secret` text;--> statement-breakpoint
ALTER TABLE `user` ADD `two_factor_enabled_at` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `two_factor_last_used_counter` integer;
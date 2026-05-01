CREATE TABLE `config` (
	`uuid` text PRIMARY KEY NOT NULL,
	`config_key` text NOT NULL,
	`config_value` text NOT NULL,
	`description` text,
	`is_public` integer DEFAULT true,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `config_config_key_unique` ON `config` (`config_key`);--> statement-breakpoint
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
CREATE TABLE `user` (
	`uuid` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`status` text DEFAULT 'inactive' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_login_at` integer,
	`last_login_ip` text,
	`email_verified` integer DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
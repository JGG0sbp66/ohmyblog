ALTER TABLE `email_log` ADD `from_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `email_log` ADD `from_email` text DEFAULT '' NOT NULL;
CREATE TABLE `factory_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`master_template_repo` text NOT NULL,
	`github_token_secret` text NOT NULL,
	`version` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text,
	`phone` text,
	`message` text,
	`status` text DEFAULT 'new' NOT NULL,
	`doi_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`niche` text NOT NULL,
	`location` text NOT NULL,
	`domain` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`renter_id` text,
	`config_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`renter_id`) REFERENCES `renters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE TABLE `renters` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `renters_email_unique` ON `renters` (`email`);
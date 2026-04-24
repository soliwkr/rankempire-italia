PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_factory_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`master_template_repo` text NOT NULL,
	`github_token_secret` text NOT NULL,
	`version` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_factory_settings`("id", "master_template_repo", "github_token_secret", "version") SELECT "id", "master_template_repo", "github_token_secret", "version" FROM `factory_settings`;--> statement-breakpoint
DROP TABLE `factory_settings`;--> statement-breakpoint
ALTER TABLE `__new_factory_settings` RENAME TO `factory_settings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`niche` text NOT NULL,
	`location` text NOT NULL,
	`domain` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`renter_id` text,
	`config_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`renter_id`) REFERENCES `renters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_projects`("id", "slug", "name", "niche", "location", "domain", "status", "renter_id", "config_json", "created_at") SELECT "id", "slug", "name", "niche", "location", "domain", "status", "renter_id", "config_json", "created_at" FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);
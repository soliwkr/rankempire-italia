-- Migration: add bot pipeline metadata to projects
ALTER TABLE `projects` ADD `created_via` text DEFAULT 'dashboard';
--> statement-breakpoint
ALTER TABLE `projects` ADD `build_mode` text DEFAULT 'speculative';
--> statement-breakpoint
ALTER TABLE `projects` ADD `source_photo_r2_key` text;

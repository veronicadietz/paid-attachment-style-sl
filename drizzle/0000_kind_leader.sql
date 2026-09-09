CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`email` text NOT NULL,
	`ivorey_contact_id` text,
	`answers_json` text NOT NULL,
	`scores_json` text NOT NULL,
	`primary_style` text NOT NULL,
	`secondary_style` text NOT NULL,
	`is_blend` integer NOT NULL,
	`report_key` text NOT NULL,
	`download_token_hash` text NOT NULL,
	`download_expires_at` integer NOT NULL,
	`email_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_assessments_email_created_at` ON `assessments` (`email`,`created_at`);
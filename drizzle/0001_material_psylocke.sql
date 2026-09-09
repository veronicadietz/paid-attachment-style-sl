CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`first_name` text NOT NULL,
	`email` text NOT NULL,
	`ivorey_contact_id` text,
	`product_name` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text DEFAULT 'paid' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_order_id_unique` ON `purchases` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_purchases_email_status` ON `purchases` (`email`,`status`);
CREATE TABLE `rejected_import_url` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`normalizedUrl` text NOT NULL,
	`eventName` text,
	`rejectedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rejected_import_url_normalizedUrl_unique` ON `rejected_import_url` (`normalizedUrl`);
ALTER TABLE `event` ADD `normalizedWebsite` text;--> statement-breakpoint
CREATE UNIQUE INDEX `event_normalizedWebsite_unique` ON `event` (`normalizedWebsite`);
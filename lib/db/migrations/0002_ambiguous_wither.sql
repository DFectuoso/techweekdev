CREATE TABLE `event_click` (
	`id` text PRIMARY KEY NOT NULL,
	`eventId` text NOT NULL,
	`source` text NOT NULL,
	`clickedAt` integer NOT NULL,
	FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `page_view` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`userId` text,
	`viewedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE TABLE `event_suggestion` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`website` text,
	`price` text,
	`startDate` integer NOT NULL,
	`endDate` integer,
	`eventType` text,
	`region` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`submittedBy` text NOT NULL,
	`reviewedBy` text,
	`reviewedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`submittedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);

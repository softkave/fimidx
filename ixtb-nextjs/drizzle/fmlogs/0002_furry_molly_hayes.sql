CREATE TABLE `monitor` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`createdBy` text NOT NULL,
	`updatedBy` text NOT NULL,
	`orgId` text NOT NULL,
	`appId` text NOT NULL,
	`filters` text NOT NULL,
	`lastRun` integer,
	`nextRun` integer,
	`status` text NOT NULL,
	`statusUpdatedAt` integer NOT NULL,
	`reportsTo` text NOT NULL,
	`duration` text NOT NULL,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`appId`) REFERENCES `app`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `member` ADD `status` text NOT NULL;--> statement-breakpoint
ALTER TABLE `member` ADD `statusUpdatedAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `member` ADD `sentEmailCount` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `member` ADD `emailLastSentAt` integer;--> statement-breakpoint
ALTER TABLE `member` ADD `emailLastSentStatus` text;--> statement-breakpoint
ALTER TABLE `member` ADD `permissions` text NOT NULL;
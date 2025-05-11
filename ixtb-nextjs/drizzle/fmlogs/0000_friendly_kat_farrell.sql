CREATE TABLE `app` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`createdBy` text NOT NULL,
	`updatedBy` text NOT NULL,
	`orgId` text NOT NULL,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `clientToken` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`createdBy` text NOT NULL,
	`updatedBy` text NOT NULL,
	`appId` text NOT NULL,
	`orgId` text NOT NULL,
	FOREIGN KEY (`appId`) REFERENCES `app`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `emailBlockList` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`email` text NOT NULL,
	`justifyingEmailRecordId` text,
	`reason` text,
	FOREIGN KEY (`justifyingEmailRecordId`) REFERENCES `emailRecord`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `emailRecord` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`from` text NOT NULL,
	`to` text NOT NULL,
	`subject` text NOT NULL,
	`status` text NOT NULL,
	`reason` text NOT NULL,
	`params` text,
	`provider` text NOT NULL,
	`response` text,
	`senderError` text,
	`serverError` text,
	`callerId` text
);
--> statement-breakpoint
CREATE TABLE `logField` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`appId` text NOT NULL,
	`name` text NOT NULL,
	`nameType` text NOT NULL,
	`valueType` text NOT NULL,
	`orgId` text NOT NULL,
	FOREIGN KEY (`appId`) REFERENCES `app`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `logPart` (
	`id` text PRIMARY KEY NOT NULL,
	`logId` text NOT NULL,
	`name` text NOT NULL,
	`value` text NOT NULL,
	`type` text NOT NULL,
	`appId` text NOT NULL,
	`orgId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`logId`) REFERENCES `log`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`appId`) REFERENCES `app`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `log` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`appId` text NOT NULL,
	`timestamp` integer NOT NULL,
	`createdBy` text NOT NULL,
	`createdByType` text NOT NULL,
	`orgId` text NOT NULL,
	FOREIGN KEY (`appId`) REFERENCES `app`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `member` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`email` text NOT NULL,
	`userId` text,
	`orgId` text NOT NULL,
	`createdBy` text NOT NULL,
	`updatedBy` text NOT NULL,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `org` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`createdBy` text NOT NULL,
	`updatedBy` text NOT NULL
);

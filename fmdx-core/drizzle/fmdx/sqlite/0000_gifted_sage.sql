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
CREATE TABLE `objField` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`appId` text NOT NULL,
	`groupId` text NOT NULL,
	`field` text NOT NULL,
	`fieldKeys` text NOT NULL,
	`fieldKeyTypes` text NOT NULL,
	`valueTypes` text NOT NULL,
	`tag` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `objPart` (
	`id` text PRIMARY KEY NOT NULL,
	`objId` text NOT NULL,
	`field` text NOT NULL,
	`value` text NOT NULL,
	`valueNumber` integer,
	`valueBoolean` integer,
	`type` text NOT NULL,
	`appId` text NOT NULL,
	`groupId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`tag` text NOT NULL
);

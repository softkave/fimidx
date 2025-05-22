CREATE TABLE `appWebSocketConfiguration` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`createdBy` text NOT NULL,
	`updatedAt` integer NOT NULL,
	`updatedBy` text NOT NULL,
	`orgId` text NOT NULL,
	`appId` text NOT NULL,
	`allowWebSocketsWithoutAuthIds` integer NOT NULL,
	`sendMessageToServerUrl` text,
	`sendMessageToServerHeaders` text,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`appId`) REFERENCES `app`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `app` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`name` text NOT NULL,
	`nameLower` text NOT NULL,
	`description` text,
	`createdBy` text NOT NULL,
	`updatedBy` text NOT NULL,
	`orgId` text NOT NULL,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `authId` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`authId` text NOT NULL,
	`appId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`clientTokenId` text NOT NULL,
	`orgId` text NOT NULL,
	FOREIGN KEY (`appId`) REFERENCES `app`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`clientTokenId`) REFERENCES `clientToken`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `callback` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`orgId` text NOT NULL,
	`appId` text NOT NULL,
	`clientTokenId` text NOT NULL,
	`url` text NOT NULL,
	`method` text NOT NULL,
	`requestHeaders` text,
	`requestBody` text,
	`responseHeaders` text,
	`responseBody` text,
	`responseStatusCode` integer,
	`executedAt` integer,
	`error` text,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`appId`) REFERENCES `app`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`clientTokenId`) REFERENCES `clientToken`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `clientToken` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`name` text NOT NULL,
	`nameLower` text NOT NULL,
	`description` text,
	`createdBy` text NOT NULL,
	`updatedBy` text NOT NULL,
	`appId` text NOT NULL,
	`orgId` text NOT NULL,
	FOREIGN KEY (`appId`) REFERENCES `app`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `connectedAuthItem` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`orgId` text NOT NULL,
	`appId` text NOT NULL,
	`clientTokenId` text NOT NULL,
	`authId` text NOT NULL,
	`messageRoomId` text,
	`messageSocketId` text,
	`messageServer` integer,
	`messageRoomSocket` text,
	`messageAuthId` text,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`appId`) REFERENCES `app`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`clientTokenId`) REFERENCES `clientToken`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`authId`) REFERENCES `authId`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `connectedWebSocket` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`orgId` text NOT NULL,
	`appId` text NOT NULL,
	`authId` text,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`appId`) REFERENCES `app`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`authId`) REFERENCES `authId`(`id`) ON UPDATE no action ON DELETE no action
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
	`valueNumber` integer,
	`valueBoolean` integer,
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
	`status` text NOT NULL,
	`statusUpdatedAt` integer NOT NULL,
	`sentEmailCount` integer NOT NULL,
	`emailLastSentAt` integer,
	`emailLastSentStatus` text,
	`permissions` text NOT NULL,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `message` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`orgId` text NOT NULL,
	`appId` text NOT NULL,
	`toRoomId` text,
	`fromSocketId` text,
	`fromAuthId` text,
	`fromServer` integer,
	`toSocketId` text,
	`toAuthId` text,
	`toServer` integer,
	`message` text NOT NULL,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`appId`) REFERENCES `app`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`toRoomId`) REFERENCES `room`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`fromSocketId`) REFERENCES `connectedWebSocket`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fromAuthId`) REFERENCES `authId`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`toSocketId`) REFERENCES `connectedWebSocket`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`toAuthId`) REFERENCES `authId`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `monitor` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`name` text NOT NULL,
	`nameLower` text NOT NULL,
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
CREATE TABLE `org` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`name` text NOT NULL,
	`nameLower` text NOT NULL,
	`description` text,
	`createdBy` text NOT NULL,
	`updatedBy` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `roomSubscription` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`roomId` text NOT NULL,
	`socketId` text,
	`authId` text,
	`orgId` text NOT NULL,
	`appId` text NOT NULL,
	`clientTokenId` text,
	FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`socketId`) REFERENCES `connectedWebSocket`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`authId`) REFERENCES `authId`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`appId`) REFERENCES `app`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`clientTokenId`) REFERENCES `clientToken`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `room` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`orgId` text NOT NULL,
	`appId` text NOT NULL,
	`name` text NOT NULL,
	`nameLower` text NOT NULL,
	`description` text,
	`clientTokenId` text NOT NULL,
	FOREIGN KEY (`orgId`) REFERENCES `org`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`appId`) REFERENCES `app`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`clientTokenId`) REFERENCES `clientToken`(`id`) ON UPDATE no action ON DELETE no action
);

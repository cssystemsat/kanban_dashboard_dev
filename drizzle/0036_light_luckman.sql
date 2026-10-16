CREATE TABLE `admin_notice_acknowledgments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`noticeId` int NOT NULL,
	`userEmail` varchar(320) NOT NULL,
	`acknowledgedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_notice_acknowledgments_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_notice_user_unique` UNIQUE(`noticeId`,`userEmail`)
);
--> statement-breakpoint
CREATE TABLE `admin_notices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`scheduleType` enum('unique','periodic') NOT NULL,
	`startDate` varchar(10),
	`startTime` varchar(5),
	`immediate` boolean NOT NULL DEFAULT false,
	`daysOfWeek` text,
	`timesOfDay` text,
	`recipientMode` enum('all','selected') NOT NULL,
	`recipientEmails` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_notices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `admin_notice_ack_notice_idx` ON `admin_notice_acknowledgments` (`noticeId`);
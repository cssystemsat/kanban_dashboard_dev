CREATE TABLE `client_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`comment` text NOT NULL,
	`monthYear` varchar(7) NOT NULL,
	`authorEmail` varchar(320),
	`authorName` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `allowed_emails` ADD `canLaunch` int DEFAULT 1 NOT NULL;